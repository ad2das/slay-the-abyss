/* ==========================================================================
   BALATRO WEB - PROCEDURAL AUDIO SYNTHESIZER
   Authentic clicky card foley, ascending chip tally ticks, mult explosion & lo-fi BGM
   ========================================================================== */

class BalatroAudio {
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
      this.masterGain.gain.setValueAtTime(0.75, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.setValueAtTime(0.28, this.ctx.currentTime);
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

  playSFX(type, pitchStep = 0) {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;

    switch (type) {
      case 'card_select': {
        // High clicky pop
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(750, t);
        osc.frequency.exponentialRampToValueAtTime(300, t + 0.05);
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.05);
        break;
      }

      case 'card_draw': {
        // Fast crisp paper flick
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(450, t);
        osc.frequency.exponentialRampToValueAtTime(120, t + 0.06);
        gain.gain.setValueAtTime(0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.06);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.06);
        break;
      }

      case 'card_play': {
        // Heavy whoosh into scoring slot
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, t);
        osc.frequency.exponentialRampToValueAtTime(60, t + 0.12);
        gain.gain.setValueAtTime(0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.12);
        break;
      }

      case 'chip_tick': {
        // Ascending harmonic chip counter tick (Balatro signature!)
        const baseFreq = 261.63; // C4
        const freq = baseFreq * Math.pow(1.059463, (pitchStep % 16));
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.08);
        break;
      }

      case 'mult_add': {
        // Red mult bell chime
        const baseFreq = 440; // A4
        const freq = baseFreq * Math.pow(1.059463, (pitchStep % 16));
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.12);
        break;
      }

      case 'mult_x': {
        // Heavy X-Mult explosion & boom
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(880, t);
        osc1.frequency.exponentialRampToValueAtTime(220, t + 0.2);
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(110, t);
        osc2.frequency.exponentialRampToValueAtTime(30, t + 0.2);
        gain.gain.setValueAtTime(0.6, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.22);
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.sfxGain);
        osc1.start(t);
        osc2.start(t);
        osc1.stop(t + 0.22);
        osc2.stop(t + 0.22);
        break;
      }

      case 'blind_defeat': {
        // Flame ignition & cash register fanfare
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          const noteTime = t + idx * 0.08;
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, noteTime);
          gain.gain.setValueAtTime(0.35, noteTime);
          gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.3);
          osc.connect(gain);
          gain.connect(this.sfxGain);
          osc.start(noteTime);
          osc.stop(noteTime + 0.3);
        });
        break;
      }

      case 'buy_item': {
        // Cash register chime
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
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

  startLoFiBGM() {
    if (this.bgmInterval) return;
    this.init();
    let step = 0;
    
    // Smooth Balatro-style jazz/synth chord progression
    const chords = [
      [130.81, 164.81, 196.00, 246.94], // Cmaj7
      [110.00, 130.81, 164.81, 196.00], // Amin7
      [146.83, 174.61, 220.00, 261.63], // Dmin7
      [98.00, 123.47, 146.83, 174.61]   // G7
    ];

    this.bgmInterval = setInterval(() => {
      if (!this.enabled || !this.ctx) return;
      const t = this.ctx.currentTime;
      const chord = chords[step % chords.length];

      // Pad chord
      chord.forEach(freq => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.03, t);
        gain.gain.linearRampToValueAtTime(0.06, t + 1.2);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 3.4);
        osc.connect(gain);
        gain.connect(this.bgmGain);
        osc.start(t);
        osc.stop(t + 3.4);
      });

      // Bass note pulse
      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      bassOsc.type = 'triangle';
      bassOsc.frequency.setValueAtTime(chord[0] / 2, t);
      bassGain.gain.setValueAtTime(0.12, t);
      bassGain.gain.exponentialRampToValueAtTime(0.01, t + 1.5);
      bassOsc.connect(bassGain);
      bassGain.connect(this.bgmGain);
      bassOsc.start(t);
      bassOsc.stop(t + 1.5);

      step++;
    }, 3400);
  }
}

window.balatroAudio = new BalatroAudio();

// 2. shader.js (Hypnotic Psychedelic Canvas Shader)
