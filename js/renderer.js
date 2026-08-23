/* ==========================================================================
   SUNNYVALE MEADOW - GRAPHICS & CANVAS RENDER ENGINE
   Stylized Studio Ghibli / Animal Crossing Aesthetic with Dynamic Day-Night
   ========================================================================== */

class FarmRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.floatingTexts = [];
    this.windTime = 0;

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  render(game) {
    const { ctx, width, height } = this;
    const camera = game.camera;
    this.windTime += 0.03;

    ctx.clearRect(0, 0, width, height);

    // 1. Draw Farm Tiles (Grass, Soil, Water Pond, Paths, Buildings)
    this.renderTiles(ctx, game.farm, camera);

    // 2. Draw Growing Crops with Wind Swaying
    this.renderCrops(ctx, game.farm, camera);

    // 3. Draw Farm Animals
    this.renderAnimals(ctx, game.farm.animals, camera);

    // 4. Draw Player Character
    this.renderPlayer(ctx, game.player, camera);

    // 5. Draw Floating Texts & Heart Particles
    this.renderFloatingTexts(ctx, camera);
  }

  renderTiles(ctx, farm, camera) {
    const ts = farm.tileSize;
    const startCol = Math.max(0, Math.floor(camera.x / ts) - 1);
    const endCol = Math.min(farm.cols, Math.ceil((camera.x + this.width) / ts) + 1);
    const startRow = Math.max(0, Math.floor(camera.y / ts) - 1);
    const endRow = Math.min(farm.rows, Math.ceil((camera.y + this.height) / ts) + 1);

    for (let y = startRow; y < endRow; y++) {
      for (let x = startCol; x < endCol; x++) {
        const tile = farm.grid[y][x];
        const screenX = Math.round(x * ts - camera.x);
        const screenY = Math.round(y * ts - camera.y);

        if (tile === TILE_GRASS) {
          // Lush Meadow Grass
          ctx.fillStyle = (x + y) % 2 === 0 ? '#86efac' : '#4ade80';
          ctx.fillRect(screenX, screenY, ts, ts);

          // Wildflowers & Clovers
          if ((x * 7 + y * 13) % 5 === 0) {
            ctx.fillStyle = '#fef08a'; // Yellow flower
            ctx.beginPath();
            ctx.arc(screenX + 16, screenY + 16, 3, 0, Math.PI * 2);
            ctx.fill();
          } else if ((x * 11 + y * 17) % 7 === 0) {
            ctx.fillStyle = '#f472b6'; // Pink flower
            ctx.beginPath();
            ctx.arc(screenX + 32, screenY + 30, 2.5, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (tile === TILE_SOIL_DRY) {
          // Dry Tilled Soil
          ctx.fillStyle = '#b45309';
          ctx.fillRect(screenX + 2, screenY + 2, ts - 4, ts - 4);
          ctx.fillStyle = '#92400e';
          ctx.fillRect(screenX + 4, screenY + 8, ts - 8, 4);
          ctx.fillRect(screenX + 4, screenY + 24, ts - 8, 4);
          ctx.fillRect(screenX + 4, screenY + 38, ts - 8, 4);
        } else if (tile === TILE_SOIL_WATERED) {
          // Moist Watered Soil (Darker with water sheen)
          ctx.fillStyle = '#78350f';
          ctx.fillRect(screenX + 2, screenY + 2, ts - 4, ts - 4);
          ctx.fillStyle = '#451a03';
          ctx.fillRect(screenX + 4, screenY + 8, ts - 8, 4);
          ctx.fillRect(screenX + 4, screenY + 24, ts - 8, 4);
          // Water highlight sparkles
          ctx.fillStyle = 'rgba(186, 230, 253, 0.4)';
          ctx.fillRect(screenX + 10, screenY + 14, 6, 3);
          ctx.fillRect(screenX + 28, screenY + 30, 5, 3);
        } else if (tile === TILE_WATER) {
          // Shimmering Blue Pond
          const wave = Math.sin(this.windTime + x + y) * 2;
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(screenX, screenY, ts, ts);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.fillRect(screenX + 8 + wave, screenY + 12, 14, 3);
          ctx.fillRect(screenX + 22 - wave, screenY + 30, 10, 3);
        } else if (tile === TILE_SHIPPING_BIN) {
          // Cozy Wooden Shipping Bin
          ctx.fillStyle = '#854d0e';
          ctx.fillRect(screenX + 4, screenY + 8, ts - 8, ts - 12);
          ctx.fillStyle = '#ca8a04';
          ctx.fillRect(screenX + 4, screenY + 4, ts - 8, 8); // Lid
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 10px sans-serif';
          ctx.fillText('출하', screenX + 14, screenY + 28);
        } else if (tile === TILE_HOUSE) {
          // Cozy Farmhouse
          ctx.fillStyle = '#dc2626'; // Red Roof
          ctx.beginPath();
          ctx.moveTo(screenX + ts / 2, screenY - 10);
          ctx.lineTo(screenX - 8, screenY + 18);
          ctx.lineTo(screenX + ts + 8, screenY + 18);
          ctx.fill();
          ctx.fillStyle = '#fef3c7'; // Wood wall
          ctx.fillRect(screenX, screenY + 18, ts, ts - 18);
          ctx.fillStyle = '#78350f'; // Door
          ctx.fillRect(screenX + 16, screenY + 26, 16, 22);
        }
      }
    }
  }

  renderCrops(ctx, farm, camera) {
    const ts = farm.tileSize;
    const sway = Math.sin(this.windTime * 2) * 2;

    for (const [key, crop] of Object.entries(farm.crops)) {
      const [tx, ty] = key.split(',').map(Number);
      const screenX = tx * ts - camera.x + ts / 2;
      const screenY = ty * ts - camera.y + ts / 2;

      ctx.save();
      ctx.translate(screenX + sway, screenY);

      if (crop.stage === 0) {
        // Tiny seed sprout
        ctx.fillStyle = '#16a34a';
        ctx.beginPath();
        ctx.arc(0, 4, 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (crop.stage === 1) {
        // Green stem with two leaves
        ctx.strokeStyle = '#15803d';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(0, 8);
        ctx.lineTo(0, -4);
        ctx.stroke();
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.ellipse(-5, -2, 4, 2, -Math.PI / 4, 0, Math.PI * 2);
        ctx.ellipse(5, -2, 4, 2, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (crop.stage === 2) {
        // Bush with flower buds
        ctx.fillStyle = '#16a34a';
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(0, -6, 3, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Mature Ripe Harvestable Crop!
        ctx.font = '28px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(crop.def.icon, 0, -2);

        // Golden sparkle if ready to harvest
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(8, -14, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  renderAnimals(ctx, animals, camera) {
    animals.forEach(a => {
      const screenX = a.x - camera.x;
      const screenY = a.y - camera.y;
      const bob = Math.sin(this.windTime * 3 + a.x) * 2;

      // Ground Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.beginPath();
      ctx.ellipse(screenX, screenY + 12, 14, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Animal Icon / Body
      ctx.font = '28px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(a.icon, screenX, screenY + bob);
    });
  }

  renderPlayer(ctx, player, camera) {
    const screenX = player.x - camera.x;
    const screenY = player.y - camera.y;
    const bob = player.isMoving ? Math.sin(this.windTime * 12) * 3 : 0;

    // Ground Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(screenX, screenY + 16, 16, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Player Body (Farmer with Overalls & Straw Hat)
    ctx.save();
    ctx.translate(screenX, screenY + bob);

    // Overalls (Blue)
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(0, 4, 12, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.arc(0, -8, 8, 0, Math.PI * 2);
    ctx.fill();

    // Straw Hat (Yellow/Gold)
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.ellipse(0, -13, 14, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.arc(0, -15, 6, Math.PI, 0);
    ctx.fill();

    ctx.restore();
  }

  renderFloatingTexts(ctx, camera) {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life -= 0.02;
      ft.y -= 0.8;

      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = Math.min(1, ft.life * 2);
      ctx.font = 'bold 16px "Quicksand", sans-serif';
      ctx.fillStyle = ft.color;
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x - camera.x, ft.y - camera.y);
      ctx.restore();
    }
  }

  addText(x, y, text, color = '#fff') {
    this.floatingTexts.push({ x, y, text, color, life: 1.0 });
  }
}

window.FarmRenderer = FarmRenderer;
