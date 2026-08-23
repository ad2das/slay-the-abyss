/* ==========================================================================
   BALATRO WEB - HYPNOTIC PSYCHEDELIC SWIRLING BACKGROUND SHADER
   60 FPS dynamic plasma vortex with color wave cycling
   ========================================================================== */

class BalatroShader {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.time = 0;
    this.theme = 'red'; // 'red', 'blue', 'purple', 'green'
    
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.animate();
  }

  resize() {
    this.width = Math.floor(window.innerWidth / 4); // Render low-res for retro pixel vibe & speed
    this.height = Math.floor(window.innerHeight / 4);
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  setTheme(theme) {
    this.theme = theme;
  }

  animate() {
    this.time += 0.025;
    const { ctx, width, height } = this;
    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;

    const cx = width / 2;
    const cy = height / 2;
    const scale = 0.035;

    let rBase = 220, gBase = 40, bBase = 60; // Default Red/Flame
    if (this.theme === 'blue') { rBase = 0; gBase = 150; bBase = 220; }
    else if (this.theme === 'purple') { rBase = 160; gBase = 30; bBase = 240; }

    let idx = 0;
    for (let y = 0; y < height; y++) {
      const dy = y - cy;
      for (let x = 0; x < width; x++) {
        const dx = x - cx;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);

        // Swirling vortex equation
        const v = Math.sin(dist * scale - this.time + Math.sin(angle * 4 + this.time * 0.8) * 1.5);
        const v2 = Math.cos(dx * scale * 0.8 + this.time * 0.5) * Math.sin(dy * scale * 0.8 - this.time * 0.5);
        const intensity = Math.max(0, (v + v2 + 1.2) / 2.4);

        data[idx] = Math.min(255, Math.floor(rBase * intensity * 0.8 + 12));
        data[idx + 1] = Math.min(255, Math.floor(gBase * intensity * 0.5 + 8));
        data[idx + 2] = Math.min(255, Math.floor(bBase * intensity * 0.6 + 14));
        data[idx + 3] = 255;
        idx += 4;
      }
    }

    ctx.putImageData(imgData, 0, 0);
    requestAnimationFrame(() => this.animate());
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('bgCanvas');
  if (canvas) {
    window.balatroShader = new BalatroShader(canvas);
  }
});
