/* ==========================================================================
   SUNNYVALE MEADOW - MASTER GAME ENGINE & MOBILE TOUCH CONTROLLER
   ========================================================================== */

class SunnyvaleGame {
  constructor() {
    this.canvas = document.getElementById('farmCanvas');
    this.renderer = new FarmRenderer(this.canvas);
    this.farm = new FarmMap(24, 24, 48);
    this.fishing = new FishingManager(this);

    // Player
    this.player = {
      x: 200,
      y: 200,
      speed: 2.8,
      isMoving: false,
      vx: 0,
      vy: 0
    };

    this.camera = { x: 0, y: 0 };

    // Stats & Time
    this.gold = 500;
    this.energy = 100;
    this.maxEnergy = 100;
    this.day = 1;
    this.season = '봄 (Spring)';
    this.timeMinutes = 360; // 6:00 AM (360 mins)
    this.timeSpeed = 0.5; // In-game minute per tick

    // Tools & Inventory
    this.hotbarTools = [
      { id: 'tool_hoe', name: '호미 (Hoe)', icon: '🚜', desc: '풀밭을 갈아 밭을 일굽니다.' },
      { id: 'tool_can', name: '물뿌리개 (Can)', icon: '💧', desc: '말라 있는 밭에 물을 줍니다.' },
      { id: 'tool_basket', name: '수확 바구니 (Basket)', icon: '🧺', desc: '다 자란 작물을 수확합니다.' },
      { id: 'tool_feed', name: '가축 사료 (Feed)', icon: '🌾', desc: '동물에게 먹이를 주고 쓰다듬습니다.' },
      { id: 'tool_rod', name: '낚싯대 (Rod)', icon: '🎣', desc: '연못에서 물고기를 낚습니다.' }
    ];
    this.activeToolIndex = 0;

    this.inventory = [
      { id: 'seed_strawberry', name: '딸기 씨앗', icon: '🍓', type: 'seed', cropId: 'strawberry', count: 5 },
      { id: 'seed_carrot', name: '당근 씨앗', icon: '🥕', type: 'seed', cropId: 'carrot', count: 5 }
    ];

    this.shippingBin = [];
    this.keys = {};
    this.joystick = { active: false, dx: 0, dy: 0 };

    this.setupInputs();
    this.setupUI();
    this.startLoop();
  }

  setupInputs() {
    // Keyboard WASD / Arrows
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
    });
    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // Canvas Direct Tap / Click for Tile Interaction
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left + this.camera.x;
      const clickY = e.clientY - rect.top + this.camera.y;
      this.handleTileClick(clickX, clickY);
    });

    // Virtual Joystick Touch Setup (Mobile)
    const zone = document.getElementById('joystick-zone');
    const knob = document.getElementById('joystick-knob');
    let startX = 0, startY = 0;

    zone.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      this.joystick.active = true;
    });

    zone.addEventListener('touchmove', (e) => {
      if (!this.joystick.active) return;
      const touch = e.touches[0];
      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;
      const dist = Math.hypot(dx, dy);
      const maxDist = 35;

      const angle = Math.atan2(dy, dx);
      const clampedDist = Math.min(dist, maxDist);
      const knobX = Math.cos(angle) * clampedDist;
      const knobY = Math.sin(angle) * clampedDist;

      knob.style.transform = `translate(${knobX}px, ${knobY}px)`;
      this.joystick.dx = knobX / maxDist;
      this.joystick.dy = knobY / maxDist;
    });

    const resetJoystick = () => {
      this.joystick.active = false;
      this.joystick.dx = 0;
      this.joystick.dy = 0;
      knob.style.transform = 'translate(0px, 0px)';
    };

    zone.addEventListener('touchend', resetJoystick);
    zone.addEventListener('touchcancel', resetJoystick);
  }

  setupUI() {
    // Top Floating Actions
    document.getElementById('btn-open-shop').addEventListener('click', () => this.openShop());
    document.getElementById('btn-open-inventory').addEventListener('click', () => this.openInventory());
    document.getElementById('btn-sleep-bed').addEventListener('click', () => this.advanceDay());

    // Close Modal Buttons
    document.querySelectorAll('.btn-close-sheet').forEach(btn => {
      btn.addEventListener('click', () => {
        const modalId = btn.dataset.modal;
        document.getElementById(modalId).classList.remove('active');
        setTimeout(() => document.getElementById(modalId).classList.add('hidden'), 250);
      });
    });

    // Shop Tabs
    document.querySelectorAll('.shop-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.shop-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        ShopManager.populateGoods(tab.dataset.tab, document.getElementById('shop-goods-container'), this);
      });
    });

    // Daily Summary Next Day Button
    document.getElementById('btn-start-next-day').addEventListener('click', () => {
      document.getElementById('modal-shipping-summary').classList.add('hidden');
    });

    this.renderHotbar();
    this.updateHUD();
  }

  renderHotbar() {
    const container = document.getElementById('hotbar-slots');
    container.innerHTML = '';

    // Tools + Seeds in inventory
    const allSlots = [...this.hotbarTools];
    this.inventory.forEach(item => {
      if (item.type === 'seed') {
        allSlots.push({
          id: item.id,
          name: item.name,
          icon: item.icon,
          desc: `${item.name}을(를) 밭에 심습니다.`,
          isSeed: true,
          cropId: item.cropId,
          count: item.count
        });
      }
    });

    allSlots.forEach((slot, idx) => {
      const el = document.createElement('div');
      el.className = `hotbar-slot ${this.activeToolIndex === idx ? 'active' : ''}`;
      el.innerHTML = `
        <div class="tool-icon">${slot.icon}</div>
        ${slot.count !== undefined ? `<div class="item-count-badge">${slot.count}</div>` : ''}
      `;

      el.addEventListener('click', () => {
        this.activeToolIndex = idx;
        document.querySelectorAll('.hotbar-slot').forEach(s => s.classList.remove('active'));
        el.classList.add('active');
        document.getElementById('hotbar-tool-name').innerText = `${slot.name} : ${slot.desc}`;
        window.cozyAudio.playSFX('plant_seed');
      });

      container.appendChild(el);
    });

    if (allSlots[this.activeToolIndex]) {
      document.getElementById('hotbar-tool-name').innerText = `${allSlots[this.activeToolIndex].name} : ${allSlots[this.activeToolIndex].desc}`;
    }
  }

  handleTileClick(worldX, worldY) {
    const ts = this.farm.tileSize;
    const tx = Math.floor(worldX / ts);
    const ty = Math.floor(worldY / ts);

    const tile = this.farm.getTile(tx, ty);
    if (tile === null) return;

    // Check Petting Animals nearby
    for (const a of this.farm.animals) {
      if (Math.hypot(a.x - worldX, a.y - worldY) < 30) {
        a.pet(this);
        return;
      }
    }

    // Check Shipping Bin Tap
    if (tile === TILE_SHIPPING_BIN) {
      this.openInventory();
      this.showToast('출하할 작물을 선택해 주세요!');
      return;
    }

    // Check Fishing on Water Pond
    if (tile === TILE_WATER) {
      if (this.energy >= 5) {
        this.energy -= 5;
        this.updateHUD();
        this.fishing.startFishing();
      } else {
        this.showToast('체력이 부족합니다!');
      }
      return;
    }

    const currentTool = this.getActiveTool();
    if (!currentTool) return;

    // 1. Hoe: Till Grass into Soil
    if (currentTool.id === 'tool_hoe') {
      if (tile === TILE_GRASS) {
        if (this.energy >= 2) {
          this.energy -= 2;
          this.farm.setTile(tx, ty, TILE_SOIL_DRY);
          window.cozyAudio.playSFX('till_soil');
          this.showFloatingText(worldX, worldY - 10, '-2 Energy', '#64748b');
          this.updateHUD();
        }
      }
    }

    // 2. Watering Can: Water Soil
    else if (currentTool.id === 'tool_can') {
      if (tile === TILE_SOIL_DRY) {
        if (this.energy >= 1) {
          this.energy -= 1;
          this.farm.setTile(tx, ty, TILE_SOIL_WATERED);
          window.cozyAudio.playSFX('water_splash');
          this.updateHUD();
        }
      }
    }

    // 3. Planting Seeds
    else if (currentTool.isSeed) {
      if ((tile === TILE_SOIL_DRY || tile === TILE_SOIL_WATERED) && !this.farm.crops[`${tx},${ty}`]) {
        this.farm.crops[`${tx},${ty}`] = new CropInstance(currentTool.cropId);
        window.cozyAudio.playSFX('plant_seed');

        // Deduct seed from inventory
        this.deductItem(currentTool.id);
        this.renderHotbar();
      }
    }

    // 4. Harvesting with Basket or Tap
    else if (currentTool.id === 'tool_basket' || !currentTool) {
      const crop = this.farm.crops[`${tx},${ty}`];
      if (crop && crop.readyToHarvest) {
        const harvested = crop.harvest();
        if (harvested) {
          window.cozyAudio.playSFX('harvest_pop');
          this.addItemToInventory(harvested);
          this.showFloatingText(worldX, worldY - 15, `+1 ${harvested.name}`, '#f59e0b');
          if (!crop.def.regrows) {
            delete this.farm.crops[`${tx},${ty}`];
          }
        }
      }
    }
  }

  getActiveTool() {
    const allSlots = [...this.hotbarTools];
    this.inventory.forEach(item => {
      if (item.type === 'seed') {
        allSlots.push({
          id: item.id,
          name: item.name,
          icon: item.icon,
          isSeed: true,
          cropId: item.cropId,
          count: item.count
        });
      }
    });
    return allSlots[this.activeToolIndex];
  }

  openShop() {
    const modal = document.getElementById('modal-shop');
    modal.classList.remove('hidden');
    setTimeout(() => modal.classList.add('active'), 10);
    ShopManager.populateGoods('seeds', document.getElementById('shop-goods-container'), this);
  }

  openInventory() {
    const modal = document.getElementById('modal-inventory');
    modal.classList.remove('hidden');
    setTimeout(() => modal.classList.add('active'), 10);
    this.renderInventoryGrid();
  }

  renderInventoryGrid() {
    const container = document.getElementById('inventory-slots-container');
    container.innerHTML = '';

    for (let i = 0; i < 24; i++) {
      const item = this.inventory[i];
      const slot = document.createElement('div');
      slot.className = `inv-slot ${item ? 'has-item' : ''}`;

      if (item) {
        slot.innerHTML = `
          <div class="inv-icon">${item.icon}</div>
          <div class="item-count-badge">${item.count}</div>
        `;
        slot.addEventListener('click', () => {
          document.querySelectorAll('.inv-slot').forEach(s => s.classList.remove('selected'));
          slot.classList.add('selected');
          document.getElementById('inv-item-info').innerText = `${item.name} (판매가: 🪙 ${item.sellPrice || 0} G)`;
          this.selectedInvItem = item;
        });
      }

      container.appendChild(slot);
    }

    document.getElementById('btn-sell-to-shipping').onclick = () => {
      if (this.selectedInvItem) {
        this.shippingBin.push({ ...this.selectedInvItem });
        this.deductItem(this.selectedInvItem.id, this.selectedInvItem.count);
        this.selectedInvItem = null;
        document.getElementById('inv-item-info').innerText = '출하 상자에 넣었습니다!';
        window.cozyAudio.playSFX('coin');
        this.renderInventoryGrid();
        this.renderHotbar();
      }
    };
  }

  addItemToInventory(item) {
    const existing = this.inventory.find(i => i.id === item.id);
    if (existing) {
      existing.count += (item.count || 1);
    } else {
      this.inventory.push({ ...item, count: item.count || 1 });
    }
    this.renderHotbar();
  }

  deductItem(itemId, count = 1) {
    const idx = this.inventory.findIndex(i => i.id === itemId);
    if (idx !== -1) {
      this.inventory[idx].count -= count;
      if (this.inventory[idx].count <= 0) {
        this.inventory.splice(idx, 1);
      }
    }
  }

  advanceDay() {
    // 1. Calculate Shipping Bin Revenue
    let totalRev = 0;
    const summaryList = document.getElementById('summary-items-list');
    summaryList.innerHTML = '';

    if (this.shippingBin.length > 0) {
      this.shippingBin.forEach(item => {
        const itemTotal = (item.sellPrice || 10) * item.count;
        totalRev += itemTotal;
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.margin = '4px 0';
        row.innerHTML = `<span>${item.icon} ${item.name} x${item.count}</span><strong>+${itemTotal} G</strong>`;
        summaryList.appendChild(row);
      });
    } else {
      summaryList.innerHTML = '<p style="color:#94a3b8;">오늘 출하된 작물이 없습니다.</p>';
    }

    this.gold += totalRev;
    this.shippingBin = [];
    document.getElementById('summary-total-gold').innerText = `+${totalRev} G`;
    document.getElementById('modal-shipping-summary').classList.remove('hidden');

    // 2. Advance Farm Day & Recover Energy
    this.day++;
    this.timeMinutes = 360; // 6:00 AM
    this.energy = this.maxEnergy;
    this.farm.advanceDay(this);

    window.cozyAudio.playSFX('coin');
    this.updateHUD();
  }

  showToast(msg) {
    const toast = document.getElementById('game-toast');
    toast.innerText = msg;
    toast.classList.remove('toast-hidden');
    setTimeout(() => toast.classList.add('toast-hidden'), 2000);
  }

  showFloatingText(x, y, text, color) {
    this.renderer.addText(x, y, text, color);
  }

  updateHUD() {
    document.getElementById('hud-gold-text').innerText = `${this.gold} G`;
    document.getElementById('hud-energy-text').innerText = `${this.energy} / ${this.maxEnergy}`;
    document.getElementById('hud-energy-fill').style.width = `${(this.energy / this.maxEnergy) * 100}%`;
    document.getElementById('hud-season-text').innerText = `${this.season} - ${this.day}일차`;

    // Clock formatting
    const hours = Math.floor(this.timeMinutes / 60);
    const mins = Math.floor(this.timeMinutes % 60);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const dispHours = hours % 12 === 0 ? 12 : hours % 12;
    document.getElementById('hud-clock-text').innerText = `${dispHours < 10 ? '0' : ''}${dispHours}:${mins < 10 ? '0' : ''}${mins} ${ampm}`;
    document.getElementById('hud-time-fill').style.width = `${((this.timeMinutes - 360) / (1440 - 360)) * 100}%`;

    // Ambient Lighting Filter by Time of Day
    const ambient = document.getElementById('ambient-overlay');
    if (hours >= 18 && hours < 20) {
      // Golden Sunset
      ambient.style.backgroundColor = 'rgba(251, 146, 60, 0.18)';
    } else if (hours >= 20 || hours < 5) {
      // Cozy Night with Glowing Lanterns
      ambient.style.backgroundColor = 'rgba(15, 23, 42, 0.45)';
    } else {
      // Bright Sunshine
      ambient.style.backgroundColor = 'rgba(0, 0, 0, 0)';
    }
  }

  startLoop() {
    window.cozyAudio.init();
    window.cozyAudio.startPeacefulBGM();

    const loop = () => {
      this.update();
      this.renderer.render(this);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  update() {
    // 1. Advance Clock
    this.timeMinutes += 0.08;
    if (this.timeMinutes >= 1440) {
      this.advanceDay(); // Pass out and start next day!
    }
    this.updateHUD();

    // 2. Player Movement (Joystick + WASD)
    let mx = 0, my = 0;
    if (this.keys['KeyW'] || this.keys['ArrowUp']) my -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) my += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) mx -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) mx += 1;

    if (this.joystick.active) {
      mx = this.joystick.dx;
      my = this.joystick.dy;
    }

    const len = Math.hypot(mx, my);
    if (len > 0) {
      this.player.isMoving = true;
      this.player.x += (mx / len) * this.player.speed;
      this.player.y += (my / len) * this.player.speed;

      // Bound within farm
      this.player.x = Math.max(20, Math.min(this.farm.cols * this.farm.tileSize - 20, this.player.x));
      this.player.y = Math.max(20, Math.min(this.farm.rows * this.farm.tileSize - 20, this.player.y));
    } else {
      this.player.isMoving = false;
    }

    // 3. Camera Lerp Tracking
    const targetCamX = this.player.x - this.renderer.width / 2;
    const targetCamY = this.player.y - this.renderer.height / 2;
    this.camera.x += (targetCamX - this.camera.x) * 0.1;
    this.camera.y += (targetCamY - this.camera.y) * 0.1;

    // 4. Update Animals AI
    this.farm.animals.forEach(a => a.update(0.016, this.farm));
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.game = new SunnyvaleGame();
});
