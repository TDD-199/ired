/**
 * iREd Neural Audio Synthesizer (Web Audio API)
 * Zero external assets required, pure generative acoustic design.
 */

class IRedAudioEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = true;
    this.ambientGain = null;
    this.masterGain = null;
    this.ambientOsc1 = null;
    this.ambientOsc2 = null;
    this.isInitialized = false;
  }

  init() {
    if (this.isInitialized) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
      
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.isInitialized = true;
    } catch (e) {
      console.warn('Web Audio not supported or blocked:', e);
    }
  }

  toggleSound(enable = null) {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    if (enable !== null) {
      this.isMuted = !enable;
    } else {
      this.isMuted = !this.isMuted;
    }

    if (!this.isMuted) {
      this.startAmbientDrone();
      this.playShimmerChord();
    } else {
      this.stopAmbientDrone();
    }

    return !this.isMuted;
  }

  playHover() {
    if (this.isMuted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(820, now);
      osc.frequency.exponentialRampToValueAtTime(1240, now + 0.04);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch (e) {}
  }

  playClick() {
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      // High click
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(450, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch (e) {}
  }

  playPortalOpen() {
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      
      // Deep sub-bass swell
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(60, now);
      subOsc.frequency.exponentialRampToValueAtTime(140, now + 0.6);
      subOsc.frequency.exponentialRampToValueAtTime(40, now + 1.4);

      subGain.gain.setValueAtTime(0.01, now);
      subGain.gain.linearRampToValueAtTime(0.35, now + 0.3);
      subGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);

      subOsc.connect(subGain);
      subGain.connect(this.masterGain);
      subOsc.start(now);
      subOsc.stop(now + 1.5);

      // Sci-fi Shimmer harmonic
      const highOsc = this.ctx.createOscillator();
      const highGain = this.ctx.createGain();
      highOsc.type = 'sawtooth';
      highOsc.frequency.setValueAtTime(440, now);
      highOsc.frequency.exponentialRampToValueAtTime(1760, now + 0.8);

      // Filter
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, now);
      filter.frequency.exponentialRampToValueAtTime(3200, now + 0.7);

      highGain.gain.setValueAtTime(0.01, now);
      highGain.gain.linearRampToValueAtTime(0.08, now + 0.4);
      highGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

      highOsc.connect(filter);
      filter.connect(highGain);
      highGain.connect(this.masterGain);

      highOsc.start(now);
      highOsc.stop(now + 1.2);
    } catch (e) {}
  }

  playShockwave() {
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.5);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.5);
    } catch (e) {}
  }

  playShimmerChord() {
    if (this.isMuted || !this.ctx) return;
    const notes = [440, 554.37, 659.25, 880]; // A major 7th chord
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);

      gain.gain.setValueAtTime(0.001, now + idx * 0.05);
      gain.gain.linearRampToValueAtTime(0.04, now + idx * 0.05 + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.05 + 0.9);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.9);
    });
  }

  startAmbientDrone() {
    if (this.ambientOsc1) return;
    try {
      const now = this.ctx.currentTime;
      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.001, now);
      this.ambientGain.gain.linearRampToValueAtTime(0.035, now + 2);
      this.ambientGain.connect(this.masterGain);

      this.ambientOsc1 = this.ctx.createOscillator();
      this.ambientOsc1.type = 'sine';
      this.ambientOsc1.frequency.setValueAtTime(55, now); // A1 note deep drone

      this.ambientOsc2 = this.ctx.createOscillator();
      this.ambientOsc2.type = 'triangle';
      this.ambientOsc2.frequency.setValueAtTime(110, now); // A2 harmonic

      this.ambientOsc1.connect(this.ambientGain);
      this.ambientOsc2.connect(this.ambientGain);

      this.ambientOsc1.start();
      this.ambientOsc2.start();
    } catch (e) {}
  }

  stopAmbientDrone() {
    if (!this.ambientGain || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      this.ambientGain.gain.linearRampToValueAtTime(0.0001, now + 0.5);
      setTimeout(() => {
        if (this.ambientOsc1) {
          try { this.ambientOsc1.stop(); this.ambientOsc2.stop(); } catch (e) {}
          this.ambientOsc1 = null;
          this.ambientOsc2 = null;
          this.ambientGain = null;
        }
      }, 550);
    } catch (e) {}
  }
}

window.iRedAudio = new IRedAudioEngine();
