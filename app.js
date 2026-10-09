/**
 * iREd Complete Prototype Controller
 * Implements end-to-end interactive journey across all Figma frames
 */

class IRedApp {
  constructor() {
    this.currentScreen = 1;
    this.totalScreens = 7;
    this.currentPayStep = 1;

    // Elements
    this.cursorGlow = document.getElementById('custom-cursor');
    this.cursorDot = document.getElementById('cursor-dot');
    this.stepperBtns = document.querySelectorAll('.step-pill');
    this.creditCard = document.getElementById('credit-card');

    this.mouse = { x: -100, y: -100, targetX: -100, targetY: -100 };
    this.isTouch = false;

    this.init();
  }

  init() {
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      this.isTouch = true;
      document.body.classList.add('is-touch');
    }

    this.setupCursor();
    this.setupNavigation();
    this.setup3DTilt();
    this.setupAudio();
    this.setupScreenEvents();
    this.setupPaymentFlow();
    this.setupKeyboard();
  }

  /* -------------------------------------------------------------
     CUSTOM REACTIVE CURSOR
  -------------------------------------------------------------- */
  setupCursor() {
    if (this.isTouch) return;

    window.addEventListener('mousemove', (e) => {
      this.mouse.targetX = e.clientX;
      this.mouse.targetY = e.clientY;
    }, { passive: true });

    const render = () => {
      this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.25;
      this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.25;

      if (this.cursorDot) {
        this.cursorDot.style.transform = `translate3d(${this.mouse.targetX}px, ${this.mouse.targetY}px, 0)`;
      }
      if (this.cursorGlow) {
        this.cursorGlow.style.transform = `translate3d(${this.mouse.x}px, ${this.mouse.y}px, 0)`;
      }

      requestAnimationFrame(render);
    };
    requestAnimationFrame(render);

    const interactive = 'button, a, input, [data-tilt], .hud-brand, .step-pill, .view-pill, .pay-tab, .red-dot-core';
    document.addEventListener('mouseover', (e) => {
      if (e.target.closest(interactive)) {
        document.body.classList.add('cursor-hover');
        if (window.iRedAudio) window.iRedAudio.playHover();
      }
    });

    document.addEventListener('mouseout', (e) => {
      if (e.target.closest(interactive)) {
        document.body.classList.remove('cursor-hover');
      }
    });

    document.addEventListener('mousedown', () => {
      if (window.iRedAudio) window.iRedAudio.playClick();
    });
  }

  /* -------------------------------------------------------------
     SCREEN SWITCHER & STORY FLOW
  -------------------------------------------------------------- */
  goToScreen(index) {
    if (index < 1 || index > this.totalScreens) return;
    this.currentScreen = index;

    // Transition audio & particle blast
    if (window.iRedAudio) window.iRedAudio.playPortalOpen();
    if (window.iRedVisualizer) {
      window.iRedVisualizer.triggerShockwave(window.innerWidth / 2, window.innerHeight / 2);
    }

    // Toggle screen DOM
    document.querySelectorAll('.screen-view').forEach(view => {
      view.classList.remove('active');
    });

    const targetView = document.getElementById(`screen-${index}`);
    if (targetView) {
      targetView.classList.add('active');
    }

    // Update top Stepper HUD
    this.stepperBtns.forEach(btn => {
      const stepNum = parseInt(btn.getAttribute('data-step'), 10);
      if (stepNum === index || (index >= 6 && stepNum === 6)) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* -------------------------------------------------------------
     TOP HUD NAVIGATION
  -------------------------------------------------------------- */
  setupNavigation() {
    // Brand home button
    const homeBtn = document.getElementById('hud-home-btn');
    if (homeBtn) {
      homeBtn.addEventListener('click', () => this.goToScreen(1));
    }

    // Stepper buttons
    this.stepperBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const step = parseInt(btn.getAttribute('data-step'), 10);
        this.goToScreen(step);
      });
    });

    // All Back Arrow buttons
    document.querySelectorAll('.nav-back-arrow').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = parseInt(btn.getAttribute('data-target-screen'), 10);
        this.goToScreen(target);
      });
    });
  }

  /* -------------------------------------------------------------
     3D TILT EFFECT FOR CARDS
  -------------------------------------------------------------- */
  setup3DTilt() {
    const tiltElements = document.querySelectorAll('[data-tilt]');

    tiltElements.forEach(el => {
      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const cx = rect.width / 2;
        const cy = rect.height / 2;

        const rotateX = ((y - cy) / cy) * -8;
        const rotateY = ((x - cx) / cx) * 8;

        if (el.id === 'credit-card' && el.classList.contains('flipped')) {
          el.style.transform = `perspective(1000px) rotateY(${180 + rotateY}deg) rotateX(${rotateX}deg) translateY(-3px)`;
        } else {
          el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-3px)`;
        }
      });

      el.addEventListener('mouseleave', () => {
        if (el.id === 'credit-card' && el.classList.contains('flipped')) {
          el.style.transform = 'perspective(1000px) rotateY(180deg) rotateX(0deg) translateY(0px)';
        } else {
          el.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
        }
      });
    });
  }

  /* -------------------------------------------------------------
     AUDIO TOGGLE
  -------------------------------------------------------------- */
  setupAudio() {
    const audioBtn = document.getElementById('audio-toggle');
    if (audioBtn) {
      audioBtn.addEventListener('click', () => {
        const isSoundOn = window.iRedAudio.toggleSound();
        const statusText = audioBtn.querySelector('.audio-status');
        if (isSoundOn) {
          audioBtn.classList.add('audio-active');
          if (statusText) statusText.textContent = 'SOUND: ON';
        } else {
          audioBtn.classList.remove('audio-active');
          if (statusText) statusText.textContent = 'SOUND: OFF';
        }
      });
    }
  }

  /* -------------------------------------------------------------
     SCREEN-SPECIFIC EVENTS & TRIGGERS
  -------------------------------------------------------------- */
  setupScreenEvents() {
    // Screen 1: iREd Logo triggers
    const pulseDot = document.getElementById('pulse-dot');
    if (pulseDot) {
      pulseDot.addEventListener('click', (e) => {
        e.stopPropagation();
        this.goToScreen(2);
      });
    }

    const btnScreen1Open = document.getElementById('btn-screen1-open');
    if (btnScreen1Open) {
      btnScreen1Open.addEventListener('click', () => this.goToScreen(2));
    }

    // Parallax on Screen 1 Logo
    const screen1Logo = document.getElementById('screen1-logo');
    if (screen1Logo) {
      window.addEventListener('mousemove', (e) => {
        if (this.currentScreen !== 1) return;
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;
        const dx = (e.clientX - cx) / cx;
        const dy = (e.clientY - cy) / cy;
        screen1Logo.style.transform = `perspective(1000px) rotateY(${dx * 12}deg) rotateX(${-dy * 12}deg) translateZ(10px)`;
      }, { passive: true });
    }

    // Screen 2: Ring Open Button
    const btnScreen2Open = document.getElementById('btn-screen2-open');
    if (btnScreen2Open) {
      btnScreen2Open.addEventListener('click', () => this.goToScreen(3));
    }

    // Screen 3: Athlete Name sync to Card
    const profFname = document.getElementById('prof-fname');
    const profLname = document.getElementById('prof-lname');
    const syncName = () => {
      const fn = profFname?.value || 'ALEXANDER';
      const ln = profLname?.value || 'V';
      const full = `${fn} ${ln}`.toUpperCase();
      const miniHolder = document.getElementById('mini-cardholder');
      const inputCardName = document.getElementById('input-card-name');
      const clientName = document.getElementById('success-client-name');
      if (miniHolder) miniHolder.textContent = full;
      if (inputCardName) inputCardName.value = full;
      if (clientName) clientName.textContent = full;
    };
    profFname?.addEventListener('input', syncName);
    profLname?.addEventListener('input', syncName);

    // Screen 5: Product View Switcher (Front/Back)
    const prodPhoto = document.getElementById('product-main-photo');
    const viewPills = document.querySelectorAll('.view-pill');
    viewPills.forEach(pill => {
      pill.addEventListener('click', () => {
        viewPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        const newSrc = pill.getAttribute('data-img');
        if (prodPhoto && newSrc) {
          prodPhoto.style.opacity = '0.3';
          setTimeout(() => {
            prodPhoto.src = newSrc;
            prodPhoto.style.opacity = '1';
          }, 200);
        }
      });
    });

    // Screen 5: Buy Now Button
    const btnBuyNow = document.getElementById('btn-buy-now');
    if (btnBuyNow) {
      btnBuyNow.addEventListener('click', () => {
        this.goToScreen(6);
        this.setPaymentStep(1);
      });
    }
  }

  /* -------------------------------------------------------------
     3D CREDIT CARD & MULTI-STEP CHECKOUT
  -------------------------------------------------------------- */
  setupPaymentFlow() {
    const cardStepLabel = document.getElementById('card-step-label');
    const cardStepValue = document.getElementById('card-step-value');
    const inputCardNum = document.getElementById('input-card-number');
    const inputCardName = document.getElementById('input-card-name');
    const inputCardExpiry = document.getElementById('input-card-expiry');
    const inputCardCvv = document.getElementById('input-card-cvv');
    const miniCardholder = document.getElementById('mini-cardholder');
    const miniExpiry = document.getElementById('mini-expiry');
    const cardCvvValue = document.getElementById('card-cvv-value');

    // Live Card Number sync & auto-spacing
    if (inputCardNum) {
      inputCardNum.addEventListener('input', (e) => {
        let val = e.target.value.replace(/\D/g, '').substring(0, 16);
        let formatted = val.match(/.{1,4}/g)?.join(' ') || val;
        e.target.value = formatted;
        if (this.currentPayStep === 1 && cardStepValue) {
          cardStepValue.textContent = formatted || '4532 •••• •••• ••••';
        }
      });
    }

    // Cardholder sync
    if (inputCardName) {
      inputCardName.addEventListener('input', (e) => {
        const val = e.target.value.toUpperCase();
        if (miniCardholder) miniCardholder.textContent = val || 'NAME';
        if (this.currentPayStep === 2 && cardStepValue) {
          cardStepValue.textContent = val || 'CARDHOLDER NAME';
        }
      });
    }

    // Expiry sync & format (MM/YY)
    if (inputCardExpiry) {
      inputCardExpiry.addEventListener('input', (e) => {
        let val = e.target.value.replace(/\D/g, '').substring(0, 4);
        if (val.length >= 3) {
          val = val.substring(0, 2) + '/' + val.substring(2, 4);
        }
        e.target.value = val;
        if (miniExpiry) miniExpiry.textContent = val || 'MM/YY';
        if (this.currentPayStep === 3 && cardStepValue) {
          cardStepValue.textContent = val || 'MM/YY';
        }
      });
    }

    // CVV sync
    if (inputCardCvv) {
      inputCardCvv.addEventListener('input', (e) => {
        const val = e.target.value.replace(/\D/g, '').substring(0, 3);
        e.target.value = val;
        if (cardCvvValue) cardCvvValue.textContent = val || '•••';
      });
    }

    // Pay tabs click
    document.querySelectorAll('.pay-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const step = parseInt(tab.getAttribute('data-pay-step'), 10);
        this.setPaymentStep(step);
      });
    });
  }

  setPaymentStep(stepIndex) {
    this.currentPayStep = stepIndex;

    // Update step title HUD
    const stepTitles = {
      1: '// MACBOOK AIR - 15 : CARD NUMBER ENTRY',
      2: '// MACBOOK AIR - 16 : CARDHOLDER NAME ENTRY',
      3: '// MACBOOK AIR - 17 : EXPIRY DATE ENTRY',
      4: '// MACBOOK AIR - 18 : CVV SECURITY CODE (CARD REVERSE)'
    };
    const titleEl = document.getElementById('checkout-step-title');
    if (titleEl && stepTitles[stepIndex]) {
      titleEl.textContent = stepTitles[stepIndex];
    }

    // Update payment tabs
    document.querySelectorAll('.pay-tab').forEach(tab => {
      const s = parseInt(tab.getAttribute('data-pay-step'), 10);
      if (s === stepIndex) tab.classList.add('active');
      else tab.classList.remove('active');
    });

    // Update input panes
    document.querySelectorAll('.pay-input-step').forEach((pane, idx) => {
      if (idx + 1 === stepIndex) pane.classList.add('active');
      else pane.classList.remove('active');
    });

    const cardStepLabel = document.getElementById('card-step-label');
    const cardStepValue = document.getElementById('card-step-value');
    const inputCardNum = document.getElementById('input-card-number');
    const inputCardName = document.getElementById('input-card-name');
    const inputCardExpiry = document.getElementById('input-card-expiry');

    // 3D Card flip control
    if (stepIndex === 4) {
      // Flip to back
      if (this.creditCard) this.creditCard.classList.add('flipped');
    } else {
      // Show front
      if (this.creditCard) this.creditCard.classList.remove('flipped');

      if (stepIndex === 1) {
        if (cardStepLabel) cardStepLabel.textContent = 'Card Number';
        if (cardStepValue) cardStepValue.textContent = inputCardNum?.value || '4532 8920 1142 9842';
      } else if (stepIndex === 2) {
        if (cardStepLabel) cardStepLabel.textContent = 'Cardholder Name';
        if (cardStepValue) cardStepValue.textContent = inputCardName?.value || 'ALEXANDER V';
      } else if (stepIndex === 3) {
        if (cardStepLabel) cardStepLabel.textContent = 'Expiry Date';
        if (cardStepValue) cardStepValue.textContent = inputCardExpiry?.value || '08/29';
      }
    }

    if (window.iRedAudio) window.iRedAudio.playHover();
  }

  processPayment() {
    const payBtn = document.getElementById('btn-pay-submit');
    if (payBtn) {
      payBtn.disabled = true;
      payBtn.textContent = 'АВТОРИЗАЦИЯ VISA DEBIT...';
    }

    if (window.iRedAudio) {
      window.iRedAudio.playPortalOpen();
    }

    setTimeout(() => {
      if (payBtn) {
        payBtn.textContent = 'ШИФРОВАНИЕ ТРАНЗАКЦИИ...';
      }
      setTimeout(() => {
        if (payBtn) {
          payBtn.disabled = false;
          payBtn.textContent = 'ОПЛАТИТЬ $100';
        }
        // Success celebration
        if (window.iRedAudio) {
          window.iRedAudio.playShimmerChord();
          window.iRedAudio.playShockwave();
        }
        if (window.iRedVisualizer) {
          window.iRedVisualizer.triggerShockwave();
          window.iRedVisualizer.toggleWarpSpeed();
        }
        this.goToScreen(7);
      }, 900);
    }, 900);
  }

  /* -------------------------------------------------------------
     KEYBOARD SHORTCUTS
  -------------------------------------------------------------- */
  setupKeyboard() {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'm' || e.key === 'M' || e.key === 'ь' || e.key === 'Ь') {
        const audioBtn = document.getElementById('audio-toggle');
        audioBtn?.click();
      } else if (e.code === 'Space' && this.currentScreen === 1) {
        e.preventDefault();
        this.goToScreen(2);
      }
    });
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.iRedApp = new IRedApp();
});
