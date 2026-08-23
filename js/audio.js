/* ==========================================================================
   HARVEST MOON: MINERAL MEADOW - RETRO AUDIO ENGINE
   6 AM Rooster Crow, Cow Moo, Tool Foley & Cheerful Spring BGM
   ========================================================================== */

class HarvestMoonAudio {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.bgmGain = null;
    this.bgmInterval = null;
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.75, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.setValueAtTime(0.22, this.ctx.currentTime);
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
    if (!this.ctx) this.init();
    this.resume();
    const t = this.ctx.currentTime;

    switch (type) {
      case 'rooster': {
        // 6:00 AM Rooster Morning Crow (Cock-a-doodle-doo!)
        [440, 554, 659, 880].forEach((freq, i) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          const nt = t + i * 0.12;
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, nt);
          gain.gain.setValueAtTime(0.3, nt);
          gain.gain.exponentialRampToValueAtTime(0.01, nt + 0.35);
          osc.connect(gain);
          gain.connect(this.sfxGain);
          osc.start(nt);
          osc.stop(nt + 0.35);
        });
        break;
      }

      case 'hoe_dig': {
        // Crisp earthy hoe thud
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(160, t);
        osc.frequency.exponentialRampToValueAtTime(50, t + 0.1);
        gain.gain.setValueAtTime(0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.1);
        break;
      }

      case 'water_pour': {
        // Water sprinkle
        [600, 750, 900].forEach((freq, i) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          const nt = t + i * 0.05;
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, nt);
          gain.gain.setValueAtTime(0.2, nt);
          gain.gain.exponentialRampToValueAtTime(0.001, nt + 0.09);
          osc.connect(gain);
          gain.connect(this.sfxGain);
          osc.start(nt);
          osc.stop(nt + 0.09);
        });
        break;
      }

      case 'harvest_pop': {
        // Iconic Harvest Moon high pop
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, t); // C5
        osc.frequency.exponentialRampToValueAtTime(1046.50, t + 0.14); // C6
        gain.gain.setValueAtTime(0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.15);
        break;
      }

      case 'ship_item': {
        // Drop in shipping box thud
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(220, t);
        osc.frequency.exponentialRampToValueAtTime(80, t + 0.12);
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.12);
        break;
      }

      case 'cow_moo': {
        // Cute cow moo
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.linearRampToValueAtTime(120, t + 0.4);
        gain.gain.setValueAtTime(0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.45);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.45);
        break;
      }

      case 'coin': {
        // Zack payment chime
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(987.77, t);
        osc.frequency.setValueAtTime(1318.51, t + 0.08);
        gain.gain.setValueAtTime(0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.18);
        break;
      }
    }
  }

  startSpringBGM() {
    if (this.bgmInterval) return;
    this.init();
    let step = 0;

    // Harvest Moon: Friends of Mineral Town inspired Spring melody
    const notes = [
      523.25, 659.25, 783.99, 1046.50, // C - E - G - C
      659.25, 783.99, 880.00, 1046.50, // E - G - A - C
      587.33, 698.46, 880.00, 1174.66, // D - F - A - D
      783.99, 987.77, 1174.66, 1567.98 // G - B - D - G
    ];

    this.bgmInterval = setInterval(() => {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const freq = notes[step % notes.length];

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.06, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      osc.connect(gain);
      gain.connect(this.bgmGain);
      osc.start(t);
      osc.stop(t + 0.4);

      step++;
    }, 450);
  }
}

window.hmAudio = new HarvestMoonAudio();
