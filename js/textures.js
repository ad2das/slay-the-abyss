/* ==========================================================================
   ABYSSAL SLAYER 3D: PROCEDURAL AAA PBR TEXTURE GENERATOR
   Creates High-Res Flagstones, Runic Sigils, Damascus Steel & Magma Textures
   ========================================================================== */

const TextureFactory = {
  cache: {},

  createGothicFloorTexture() {
    if (this.cache.floor) return this.cache.floor;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Dark Stone Base
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 512, 512);

    // Stone Tiles Pattern
    const tileSize = 64;
    for (let x = 0; x < 512; x += tileSize) {
      for (let y = 0; y < 512; y += tileSize) {
        const shade = Math.floor(Math.random() * 20 + 15);
        ctx.fillStyle = `rgb(${shade}, ${shade + 4}, ${shade + 12})`;
        ctx.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4);

        // Cracks & Noise
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, tileSize, tileSize);

        if (Math.random() < 0.3) {
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
          ctx.beginPath();
          ctx.moveTo(x + 10, y + 10);
          ctx.lineTo(x + tileSize - 15, y + tileSize - 10);
          ctx.stroke();
        }
      }
    }

    // Glowing Engraved Runes
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(256, 256, 180, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(256, 256, 120, 0, Math.PI * 2);
    ctx.stroke();

    for (let i = 0; i < 8; i++) {
      const a = (Math.PI * 2 / 8) * i;
      ctx.moveTo(256 + Math.cos(a) * 120, 256 + Math.sin(a) * 120);
      ctx.lineTo(256 + Math.cos(a) * 180, 256 + Math.sin(a) * 180);
    }
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 3);
    this.cache.floor = texture;
    return texture;
  },

  createMetalTexture(colorHex = '#334155') {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = colorHex;
    ctx.fillRect(0, 0, 256, 256);

    // Metal brush strokes
    for (let i = 0; i < 150; i++) {
      ctx.strokeStyle = Math.random() < 0.5 ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.15)';
      ctx.lineWidth = Math.random() * 2 + 1;
      const y = Math.random() * 256;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(256, y);
      ctx.stroke();
    }

    return new THREE.CanvasTexture(canvas);
  },

  createRunicGlowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 120);
    grad.addColorStop(0, 'rgba(225, 29, 72, 0.9)');
    grad.addColorStop(0.5, 'rgba(225, 29, 72, 0.4)');
    grad.addColorStop(1, 'rgba(225, 29, 72, 0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    return new THREE.CanvasTexture(canvas);
  }
};
