/**
 * iREd Visualizer & Particle Physics Engine
 * High-performance 2D/3D Canvas with gravitational attractors, shockwaves, and warp-speed
 */

class IRedVisualizer {
  constructor() {
    this.canvas = document.getElementById('bg-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d', { alpha: false });
    
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    // Config defaults
    this.particleCount = 220;
    this.speedMultiplier = 1.0;
    this.glowMultiplier = 0.85;
    this.currentColor = '#ff1e42';
    this.colorRgb = [255, 30, 66];

    // State
    this.particles = [];
    this.shockwaves = [];
    this.mouse = { x: this.width / 2, y: this.height / 2, isDown: false, active: false };
    this.gravityCenter = false;
    this.isWarpSpeed = false;
    this.warpTimer = null;

    // Performance
    this.lastTime = performance.now();
    this.frameCount = 0;
    this.fps = 60;
    this.fpsElem = document.getElementById('live-fps');

    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize(), { passive: true });

    // Track mouse
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
      this.mouse.active = true;
    }, { passive: true });

    window.addEventListener('mousedown', () => {
      this.mouse.isDown = true;
    });

    window.addEventListener('mouseup', () => {
      this.mouse.isDown = false;
    });

    window.addEventListener('dblclick', (e) => {
      this.triggerShockwave(e.clientX, e.clientY);
    });

    this.spawnParticles();
    this.animate();
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.scale(dpr, dpr);
  }

  setColor(colorName) {
    const palettes = {
      crimson: { hex: '#ff1e42', rgb: [255, 30, 66] },
      ruby: { hex: '#b90e2b', rgb: [185, 14, 43] },
      ember: { hex: '#ff6a00', rgb: [255, 106, 0] },
      neon: { hex: '#ff007f', rgb: [255, 0, 127] },
      silver: { hex: '#e2e8f0', rgb: [226, 232, 240] }
    };

    if (palettes[colorName]) {
      this.currentColor = palettes[colorName].hex;
      this.colorRgb = palettes[colorName].rgb;
      document.documentElement.style.setProperty('--accent-red', this.currentColor);
      document.documentElement.style.setProperty('--accent-red-glow', this.currentColor);
    }
  }

  spawnParticles() {
    this.particles = [];
    for (let i = 0; i < this.particleCount; i++) {
      this.particles.push(this.createParticle());
    }
  }

  createParticle() {
    return {
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      vx: (Math.random() - 0.5) * 0.8,
      vy: (Math.random() - 0.5) * 0.8,
      radius: Math.random() * 2 + 0.8,
      baseRadius: Math.random() * 2 + 0.8,
      alpha: Math.random() * 0.7 + 0.2,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.02 + Math.random() * 0.03
    };
  }

  updateDensity(newCount) {
    this.particleCount = newCount;
    if (this.particles.length < this.particleCount) {
      const diff = this.particleCount - this.particles.length;
      for (let i = 0; i < diff; i++) {
        this.particles.push(this.createParticle());
      }
    } else {
      this.particles.length = this.particleCount;
    }
  }

  triggerShockwave(x = this.width / 2, y = this.height / 2) {
    this.shockwaves.push({
      x,
      y,
      radius: 5,
      maxRadius: Math.max(this.width, this.height) * 0.6,
      speed: 16,
      strength: 25,
      alpha: 1.0
    });

    if (window.iRedAudio) {
      window.iRedAudio.playShockwave();
    }
  }

  toggleWarpSpeed() {
    this.isWarpSpeed = !this.isWarpSpeed;
    if (this.isWarpSpeed) {
      if (this.warpTimer) clearTimeout(this.warpTimer);
      this.warpTimer = setTimeout(() => {
        this.isWarpSpeed = false;
      }, 3500);
    }
    return this.isWarpSpeed;
  }

  toggleGravity() {
    this.gravityCenter = !this.gravityCenter;
    return this.gravityCenter;
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const now = performance.now();
    this.frameCount++;
    if (now - this.lastTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastTime = now;
      if (this.fpsElem) {
        this.fpsElem.textContent = `${this.fps} FPS`;
      }
    }

    // Render frame
    if (this.isWarpSpeed) {
      this.ctx.fillStyle = 'rgba(8, 9, 11, 0.2)';
    } else {
      this.ctx.fillStyle = '#08090b';
    }
    this.ctx.fillRect(0, 0, this.width, this.height);

    const [r, g, b] = this.colorRgb;
    const centerX = this.width / 2;
    const centerY = this.height / 2;

    // Update & draw shockwaves
    for (let s = this.shockwaves.length - 1; s >= 0; s--) {
      const sw = this.shockwaves[s];
      sw.radius += sw.speed;
      sw.alpha = 1 - (sw.radius / sw.maxRadius);

      if (sw.alpha <= 0 || sw.radius >= sw.maxRadius) {
        this.shockwaves.splice(s, 1);
        continue;
      }

      this.ctx.beginPath();
      this.ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      this.ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${sw.alpha * 0.7})`;
      this.ctx.lineWidth = 2.5;
      this.ctx.stroke();

      // Push particles away
      for (let p of this.particles) {
        const dx = p.x - sw.x;
        const dy = p.y - sw.y;
        const dist = Math.hypot(dx, dy);
        if (Math.abs(dist - sw.radius) < 40) {
          const angle = Math.atan2(dy, dx);
          p.vx += Math.cos(angle) * (sw.strength * 0.15);
          p.vy += Math.sin(angle) * (sw.strength * 0.15);
        }
      }
    }

    // Connect close particles with subtle energy lines
    const connectDistance = 90;
    this.ctx.lineWidth = 0.6;
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const dx = this.particles[i].x - this.particles[j].x;
        const dy = this.particles[i].y - this.particles[j].y;
        const distSq = dx * dx + dy * dy;

        if (distSq < connectDistance * connectDistance) {
          const dist = Math.sqrt(distSq);
          const lineAlpha = (1 - dist / connectDistance) * 0.22 * this.glowMultiplier;
          this.ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${lineAlpha})`;
          this.ctx.beginPath();
          this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
          this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
          this.ctx.stroke();
        }
      }
    }

    // Draw and update particles
    for (let p of this.particles) {
      p.pulse += p.pulseSpeed;
      const currentRadius = p.baseRadius + Math.sin(p.pulse) * 0.5;

      // Mouse attraction or gravity
      let targetX = p.x;
      let targetY = p.y;
      let influenceForce = 0;

      if (this.gravityCenter) {
        const dx = centerX - p.x;
        const dy = centerY - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 20) {
          p.vx += (dx / dist) * 0.2;
          p.vy += (dy / dist) * 0.2;
        }
      } else if (this.mouse.active) {
        const mdx = this.mouse.x - p.x;
        const mdy = this.mouse.y - p.y;
        const mdist = Math.hypot(mdx, mdy);
        const radiusOfInfluence = this.mouse.isDown ? 260 : 130;

        if (mdist < radiusOfInfluence && mdist > 10) {
          const power = (1 - mdist / radiusOfInfluence);
          const factor = this.mouse.isDown ? 0.35 : -0.08;
          p.vx += (mdx / mdist) * power * factor;
          p.vy += (mdy / mdist) * power * factor;
        }
      }

      // Warp speed acceleration toward edges or from center
      if (this.isWarpSpeed) {
        const dx = p.x - centerX;
        const dy = p.y - centerY;
        const dist = Math.hypot(dx, dy) || 1;
        p.vx += (dx / dist) * 1.8;
        p.vy += (dy / dist) * 1.8;
      }

      // Apply velocity & damping
      p.x += p.vx * this.speedMultiplier;
      p.y += p.vy * this.speedMultiplier;
      p.vx *= 0.96;
      p.vy *= 0.96;

      // Screen wrap
      if (p.x < 0) p.x = this.width;
      if (p.x > this.width) p.x = 0;
      if (p.y < 0) p.y = this.height;
      if (p.y > this.height) p.y = 0;

      // Draw particle glow
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, currentRadius, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.alpha * this.glowMultiplier})`;
      this.ctx.fill();

      // Extra highlight for prominent particles
      if (p.baseRadius > 1.8) {
        this.ctx.shadowBlur = 10 * this.glowMultiplier;
        this.ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 0.8)`;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, currentRadius * 0.7, 0, Math.PI * 2);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
      }
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.iRedVisualizer = new IRedVisualizer();
});
