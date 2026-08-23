/* ==========================================================================
   SUNNYVALE MEADOW - COZY PROCEDURAL AUDIO SYNTHESIZER
   Peaceful Studio Ghibli-style piano chords, bird ambient & farming foley
   ========================================================================== */

class CozyAudio {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.bgmGain = null;
    this.enabled = true;
    this.bgmInterval = null;
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.65, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.setValueAtTime(0.24, this.ctx.currentTime);
      this.bgmGain.connect(this.masterGain);
    } catch (e) {
      console.warn("Web Audio not supported:", e);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playSFX(type) {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;

    switch (type) {
      case 'till_soil': {
        // Soft earthy dig thud
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140, t);
        osc.frequency.exponentialRampToValueAtTime(45, t + 0.12);
        gain.gain.setValueAtTime(0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.12);
        break;
      }

      case 'water_splash': {
        // Gentle water droplet sprinkle
        [520, 680, 840].forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          const noteTime = t + idx * 0.04;
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, noteTime);
          gain.gain.setValueAtTime(0.2, noteTime);
          gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.08);
          osc.connect(gain);
          gain.connect(this.sfxGain);
          osc.start(noteTime);
          osc.stop(noteTime + 0.08);
        });
        break;
      }

      case 'plant_seed': {
        // Soft rustle
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(350, t);
        osc.frequency.exponentialRampToValueAtTime(600, t + 0.07);
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.07);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.07);
        break;
      }

      case 'harvest_pop': {
        // Satisfying harvest pop chime!
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, t); // D5
        osc.frequency.exponentialRampToValueAtTime(1046.50, t + 0.14); // C6
        gain.gain.setValueAtTime(0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.16);
        break;
      }

      case 'coin': {
        // Golden chime
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(987.77, t);
        osc.frequency.setValueAtTime(1318.51, t + 0.06);
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.15);
        break;
      }

      case 'pet_heart': {
        // High harmonic love chime
        [659.25, 783.99, 1046.50].forEach((freq, i) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          const noteTime = t + i * 0.06;
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, noteTime);
          gain.gain.setValueAtTime(0.25, noteTime);
          gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.14);
          osc.connect(gain);
          gain.connect(this.sfxGain);
          osc.start(noteTime);
          osc.stop(noteTime + 0.14);
        });
        break;
      }
    }
  }

  startPeacefulBGM() {
    if (this.bgmInterval) return;
    this.init();
    let step = 0;
    
    // Relaxing C major - F major - G major - A minor Studio Ghibli piano loop
    const chords = [
      [261.63, 329.63, 392.00, 523.25], // Cmaj
      [349.23, 440.00, 523.25, 698.46], // Fmaj
      [392.00, 493.88, 587.33, 783.99], // Gmaj
      [220.00, 261.63, 329.63, 440.00]  // Amin
    ];

    this.bgmInterval = setInterval(() => {
      if (!this.enabled || !this.ctx) return;
      const t = this.ctx.currentTime;
      const chord = chords[step % chords.length];

      // Arpeggiated soft piano notes
      chord.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const noteTime = t + idx * 0.28;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.04, noteTime);
        gain.gain.linearRampToValueAtTime(0.08, noteTime + 0.4);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 2.4);

        osc.connect(gain);
        gain.connect(this.bgmGain);
        osc.start(noteTime);
        osc.stop(noteTime + 2.4);
      });

      step++;
    }, 4000);
  }
}

window.cozyAudio = new CozyAudio();

// 2. crops.js
