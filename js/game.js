/* ==========================================================================
   HARVEST MOON: MINERAL MEADOW - DEFINITIVE MASTER GAME ENGINE
   Multi-Zones, Tool Charging, Kitchen Cooking, Mineral Mining, NPCs, Animals & Touch Pad
   ========================================================================== */

class HarvestMoonGame {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.map = new WorldMap();

    // Player State
    this.player = {
      x: 180,
      y: 130,
      dir: 'down',
      speed: 2.3,
      isMoving: false,
      walkFrame: 0,
      stamina: 100,
      maxStamina: 100,
      heldItem: null,
      isRidingHorse: false,
      chargeTimer: 0,
      isCharging: false
    };

    this.camera = { x: 0, y: 0 };

    // Calendar & Clock
    this.gold = 600;
    this.day = 1;
    this.dayNames = ['월', '화', '수', '목', '금', '토', '일'];
    this.seasons = ['봄 (Spring)', '여름 (Summer)', '가을 (Autumn)', '겨울 (Winter)'];
    this.seasonIdx = 0;
    this.timeMinutes = 360; // 6:00 AM
    this.weather = '☀️ 맑음';
    this.zackShippedToday = false;

    // Upgradable Tools
    this.tools = [
      { id: 'hoe', name: '호미 (Hoe)', level: 1, icon: '🚜', sub: '밭을 일굽니다 [B] (차지 시 1x3)' },
      { id: 'can', name: '물뿌리개 (Can)', level: 1, icon: '💧', sub: '작물에 물주기 [B] (차지 시 1x3)', water: 30, maxWater: 30 },
      { id: 'sickle', name: '낫 (Sickle)', level: 1, icon: '🌾', sub: '잡초를 베어냅니다 [B]' },
      { id: 'axe', name: '도끼 (Axe)', level: 1, icon: '🪓', sub: '나뭇가지를 벱니다 [B]' },
      { id: 'hammer', name: '망치 (Hammer)', level: 1, icon: '🔨', sub: '바위/광석을 부숩니다 [B]' },
      { id: 'seed_turnip', name: '순무 씨앗', icon: '🌱', sub: '밭에 파종합니다 [B]', isSeed: true, cropId: 'turnip', count: 8 },
      { id: 'seed_straw', name: '딸기 씨앗', icon: '🌱', sub: '밭에 파종합니다 [B]', isSeed: true, cropId: 'strawberry', count: 6 },
      { id: 'seed_corn', name: '옥수수 씨앗', icon: '🌱', sub: '밭에 파종합니다 [B]', isSeed: true, cropId: 'corn', count: 4 },
      { id: 'seed_pumpkin', name: '호박 씨앗', icon: '🌱', sub: '밭에 파종합니다 [B]', isSeed: true, cropId: 'pumpkin', count: 4 },
      { id: 'brush', name: '브러시 (Brush)', icon: '🪮', sub: '가축을 빗겨줍니다 [B]' },
      { id: 'milker', name: '착유기 (Milker)', icon: '🥛', sub: '소에게서 우유를 짭니다 [B]' },
      { id: 'clippers', name: '가위 (Clippers)', icon: '✂️', sub: '양에게서 양모를 깎습니다 [B]' },
      { id: 'rod', name: '낚싯대 (Rod)', icon: '🎣', sub: '강에서 낚시를 합니다 [B]' }
    ];
    this.equippedToolIdx = 0;

    // Rucksack
    this.rucksack = [
      { id: 'turnip_crop', name: '신선한 순무', icon: '🥬', count: 4, sellPrice: 60 },
      { id: 'straw_crop', name: '달콤한 딸기', icon: '🍓', count: 2, sellPrice: 120 }
    ];

    this.shippingBinItems = [];
    this.keys = {};
    this.dialogActive = false;
    this.selectedRucksackIdx = 0;

    // Animals Pool
    this.map.animals = [
      { id: 'horse', type: 'horse', name: '달님이 (Horse)', icon: '🐴', x: 260, y: 580, hearts: 4 },
      { id: 'dog', type: 'dog', name: '바둑이 (Dog)', icon: '🐕', x: 280, y: 160, hearts: 3 },
      { id: 'chick1', type: 'chicken', name: '꼬꼬 1호', icon: '🐔', x: 140, y: 480, hearts: 2, hasEgg: true },
      { id: 'chick2', type: 'chicken', name: '꼬꼬 2호', icon: '🐔', x: 180, y: 500, hearts: 1, hasEgg: true },
      { id: 'cow1', type: 'cow', name: '얼룩소 한우', icon: '🐮', x: 160, y: 640, hearts: 4, hasMilk: true },
      { id: 'sheep1', type: 'sheep', name: '폭신이', icon: '🐑', x: 200, y: 660, hearts: 3, hasWool: true }
    ];

    this.loadGame();
    this.initCanvas();
    this.setupInputs();
    this.setupUI();
    this.startLoop();

    setInterval(() => this.saveGame(), 30000);

    setTimeout(() => {
      this.showDialog('촌장 토마스', '👨‍🌾', '자네가 새로 온 목장주인가? 미네랄 계곡에 온 것을 진심으로 환영하네! 집안의 주방(Kitchen)과 TV, 광산과 온천을 자유롭게 이용해보게나! (말에 타려면 A버튼)', 3);
      window.hmAudio.playSFX('rooster');
      window.hmAudio.startSpringBGM();
    }, 400);
  }

  initCanvas() {
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  setupInputs() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (e.code === 'Space' || e.code === 'KeyZ') this.handleActionA();
      if (e.code === 'KeyX') this.startChargingTool();
      if (e.code === 'KeyC') this.handleActionY();
      if (e.code === 'Tab' || e.code === 'KeyI') {
        e.preventDefault();
        this.openRucksack();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
      if (e.code === 'KeyX') this.releaseChargedTool();
    });

    const dpadMap = {
      'btn-dpad-up': 'up',
      'btn-dpad-down': 'down',
      'btn-dpad-left': 'left',
      'btn-dpad-right': 'right'
    };

    Object.entries(dpadMap).forEach(([btnId, dir]) => {
      const btn = document.getElementById(btnId);
      if (!btn) return;
      const start = (e) => { e.preventDefault(); this.keys['dpad_' + dir] = true; };
      const stop = (e) => { e.preventDefault(); this.keys['dpad_' + dir] = false; };
      btn.addEventListener('touchstart', start);
      btn.addEventListener('touchend', stop);
      btn.addEventListener('mousedown', start);
      btn.addEventListener('mouseup', stop);
    });

    const btnA = document.getElementById('btn-act-a');
    if (btnA) btnA.addEventListener('click', () => this.handleActionA());
    
    const btnB = document.getElementById('btn-act-b');
    if (btnB) {
      btnB.addEventListener('touchstart', (e) => { e.preventDefault(); this.startChargingTool(); });
      btnB.addEventListener('touchend', (e) => { e.preventDefault(); this.releaseChargedTool(); });
      btnB.addEventListener('mousedown', (e) => { e.preventDefault(); this.startChargingTool(); });
      btnB.addEventListener('mouseup', (e) => { e.preventDefault(); this.releaseChargedTool(); });
    }

    const btnX = document.getElementById('btn-act-x');
    if (btnX) btnX.addEventListener('click', () => this.openRucksack());

    const btnY = document.getElementById('btn-act-y');
    if (btnY) btnY.addEventListener('click', () => this.handleActionY());
  }

  setupUI() {
    document.querySelectorAll('.btn-close-hm').forEach(btn => {
      btn.addEventListener('click', () => {
        const modalId = btn.dataset.modal;
        if (modalId) {
          const m = document.getElementById(modalId);
          if (m) m.classList.add('hidden');
        }
      });
    });

    const diag = document.getElementById('dialog-box');
    if (diag) diag.addEventListener('click', () => this.closeDialog());

    const btnEat = document.getElementById('btn-eat-item');
    if (btnEat) {
      btnEat.addEventListener('click', () => {
        const item = this.rucksack[this.selectedRucksackIdx];
        if (item && item.isFood) {
          this.player.stamina = Math.min(this.player.maxStamina, this.player.stamina + item.staminaRestore);
          item.count--;
          if (item.count <= 0) this.rucksack.splice(this.selectedRucksackIdx, 1);
          window.hmAudio.playSFX('harvest_pop');
          this.showToast('😋 맛있게 먹었습니다! (체력 회복)');
          this.openRucksack();
          this.updateHUD();
        } else {
          this.showToast('요리된 음식만 먹을 수 있습니다!');
        }
      });
    }

    const btnEquip = document.getElementById('btn-equip-item');
    if (btnEquip) {
      btnEquip.addEventListener('click', () => {
        const item = this.rucksack[this.selectedRucksackIdx];
        if (item) {
          this.player.heldItem = { ...item, count: 1 };
          item.count--;
          if (item.count <= 0) this.rucksack.splice(this.selectedRucksackIdx, 1);
          document.getElementById('modal-rucksack').classList.add('hidden');
          this.showToast(this.player.heldItem.name + '을(를) 머리 위로 들었습니다!');
          this.updateHUD();
        }
      });
    }

    const btnShipClose = document.getElementById('btn-close-shipping');
    if (btnShipClose) {
      btnShipClose.addEventListener('click', () => {
        document.getElementById('modal-shipping').classList.add('hidden');
      });
    }

    this.updateHUD();
  }

  startChargingTool() {
    this.player.isCharging = true;
    this.player.chargeTimer = 0;
  }

  releaseChargedTool() {
    if (!this.player.isCharging) return;
    this.player.isCharging = false;
    const chargeLvl = this.player.chargeTimer > 1.2 ? 2 : (this.player.chargeTimer > 0.6 ? 1 : 0);
    this.executeToolAction(chargeLvl);
    this.player.chargeTimer = 0;
  }

  handleActionA() {
    if (this.dialogActive) {
      this.closeDialog();
      return;
    }

    const frontTilePos = this.getFrontTile();
    const tile = this.map.getTile(frontTilePos.tx, frontTilePos.ty);
    const cropKey = frontTilePos.tx + ',' + frontTilePos.ty;
    const crop = this.map.crops[cropKey];

    if (this.player.isRidingHorse) {
      this.player.isRidingHorse = false;
      this.player.speed = 2.3;
      const horse = this.map.animals.find(a => a.type === 'horse');
      if (horse) { horse.x = this.player.x + 20; horse.y = this.player.y; }
      this.showToast('🐴 말에서 내렸습니다.');
      return;
    }

    if (this.map.currentZone === 'farm') {
      const horse = this.map.animals.find(a => a.type === 'horse');
      if (horse && Math.hypot(horse.x - this.player.x, horse.y - this.player.y) < 40) {
        this.player.isRidingHorse = true;
        this.player.speed = 4.4;
        horse.x = -999;
        window.hmAudio.playSFX('rooster');
        this.showToast('🐴 말에 탑승했습니다! (고속 이동)');
        return;
      }
    }

    if (this.player.heldItem) {
      if (tile === TILE_SHIPPING_BIN) {
        this.shippingBinItems.push({ ...this.player.heldItem });
        window.hmAudio.playSFX('ship_item');
        this.showToast('📦 ' + this.player.heldItem.name + '을(를) 출하 상자에 넣었습니다!');
        this.player.heldItem = null;
        this.updateHUD();
        return;
      } else {
        this.addItemToRucksack(this.player.heldItem);
        this.player.heldItem = null;
        this.updateHUD();
        return;
      }
    }

    if (crop && crop.stage === 3) {
      window.hmAudio.playSFX('harvest_pop');
      this.player.heldItem = { id: crop.id, name: crop.name, icon: crop.icon, sellPrice: crop.sellPrice, count: 1 };
      delete this.map.crops[cropKey];
      this.showToast('✨ ' + this.player.heldItem.name + ' 수확! (출하 상자로 운반하세요)');
      this.updateHUD();
      return;
    }

    if (tile === TILE_HOUSE_DOOR) {
      this.warpToZone('house', 5 * 32, 7 * 32);
      return;
    } else if (tile === TILE_COOP_DOOR) {
      this.warpToZone('coop', 5 * 32, 7 * 32);
      return;
    } else if (tile === TILE_BARN_DOOR) {
      this.warpToZone('barn', 6 * 32, 8 * 32);
      return;
    } else if (tile === TILE_MINE_ENTRANCE) {
      this.warpToZone('mine', 2 * 32, 2 * 32);
      return;
    } else if (tile === TILE_TOWN_ROAD) {
      this.warpToZone('town', 2 * 32, 8 * 32);
      return;
    } else if (tile === TILE_EXIT_DOOR) {
      this.warpToZone('farm', 5 * 32, 5 * 32);
      return;
    }

    if (tile === TILE_BED) {
      this.showDialog('내 침실 (Farmhouse Bed)', '🛏️', '잠자리에 들고 하루를 마감하시겠습니까?', 5);
      setTimeout(() => this.advanceDay(), 1400);
      return;
    } else if (tile === TILE_TV) {
      document.getElementById('modal-tv').classList.remove('hidden');
      return;
    } else if (tile === TILE_KITCHEN) {
      document.getElementById('modal-kitchen').classList.remove('hidden');
      CookingManager.populateKitchenUI(document.getElementById('recipes-container'), this);
      return;
    }

    if (tile === TILE_SHOP_COUNTER) {
      this.openShop();
      return;
    } else if (tile === TILE_BLACKSMITH_ANVIL) {
      this.openBlacksmith();
      return;
    }

    if (tile === TILE_MINE_LADDER) {
      this.map.mineFloor++;
      this.map.initAllZones();
      this.warpToZone('mine', 2 * 32, 2 * 32);
      this.showToast('⛏️ 광산 지하 ' + this.map.mineFloor + '층에 진입했습니다!');
      return;
    }

    for (const a of this.map.animals) {
      if (Math.hypot(a.x - this.player.x, a.y - this.player.y) < 36) {
        if (a.type === 'chicken' && a.hasEgg) {
          a.hasEgg = false;
          a.hearts = Math.min(5, a.hearts + 1);
          window.hmAudio.playSFX('harvest_pop');
          this.player.heldItem = { id: 'fresh_egg', name: '신선한 달걀', icon: '🥚', sellPrice: 50, count: 1 };
          this.showToast('🥚 신선한 달걀을 수집했습니다!');
          this.updateHUD();
          return;
        } else {
          a.hearts = Math.min(5, a.hearts + 1);
          if (a.type === 'cow') window.hmAudio.playSFX('cow_moo');
          else window.hmAudio.playSFX('rooster');
          this.showToast('❤️ ' + a.name + '이(가) 행복해합니다!');
          return;
        }
      }
    }

    if (tile === TILE_WEED || tile === TILE_BRANCH || tile === TILE_ROCK) {
      const names = { [TILE_WEED]: '잡초', [TILE_BRANCH]: '나뭇가지', [TILE_ROCK]: '돌맹이' };
      const icons = { [TILE_WEED]: '🌿', [TILE_BRANCH]: '🪵', [TILE_ROCK]: '🪨' };
      this.player.heldItem = { id: 'forage', name: names[tile], icon: icons[tile], sellPrice: 15, count: 1 };
      this.map.setTile(frontTilePos.tx, frontTilePos.ty, TILE_GRASS);
      window.hmAudio.playSFX('harvest_pop');
      this.showToast(names[tile] + '을(를) 주웠습니다!');
      this.updateHUD();
      return;
    }
  }

  warpToZone(zoneName, targetX, targetY) {
    this.map.currentZone = zoneName;
    this.player.x = targetX;
    this.player.y = targetY;
    this.showToast('📍 ' + this.map.getCurZone().name + ' 진입');
    this.updateHUD();
  }

  executeToolAction(chargeLvl = 0) {
    if (this.player.stamina <= 0) {
      this.showToast('체력이 고갈되었습니다! 온천에서 피로를 풀어주세요 💦');
      return;
    }

    const tool = this.tools[this.equippedToolIdx];
    if (!tool) return;

    const frontTilePos = this.getFrontTile();
    const tile = this.map.getTile(frontTilePos.tx, frontTilePos.ty);
    const cropKey = frontTilePos.tx + ',' + frontTilePos.ty;

    const targetTiles = [frontTilePos];
    if (chargeLvl >= 1) {
      targetTiles.push({ tx: frontTilePos.tx - 1, ty: frontTilePos.ty });
      targetTiles.push({ tx: frontTilePos.tx + 1, ty: frontTilePos.ty });
    }
    if (chargeLvl >= 2) {
      targetTiles.push({ tx: frontTilePos.tx - 1, ty: frontTilePos.ty - 1 });
      targetTiles.push({ tx: frontTilePos.tx, ty: frontTilePos.ty - 1 });
      targetTiles.push({ tx: frontTilePos.tx + 1, ty: frontTilePos.ty - 1 });
      targetTiles.push({ tx: frontTilePos.tx - 1, ty: frontTilePos.ty + 1 });
      targetTiles.push({ tx: frontTilePos.tx, ty: frontTilePos.ty + 1 });
      targetTiles.push({ tx: frontTilePos.tx + 1, ty: frontTilePos.ty + 1 });
    }

    if (tool.id === 'hoe') {
      targetTiles.forEach(t => {
        const curT = this.map.getTile(t.tx, t.ty);
        if (curT === TILE_GRASS || curT === TILE_DIRT_PATH) {
          this.map.setTile(t.tx, t.ty, TILE_SOIL_DRY);
        }
      });
      this.player.stamina = Math.max(0, this.player.stamina - (2 + chargeLvl));
      window.hmAudio.playSFX('hoe_dig');
      this.updateHUD();
    }
    else if (tool.id === 'can') {
      if (tile === TILE_WATER || tile === TILE_WELL) {
        tool.water = tool.maxWater;
        window.hmAudio.playSFX('water_pour');
        this.showToast('💧 물뿌리개를 가득 채웠습니다!');
        this.updateHUD();
        return;
      }
      targetTiles.forEach(t => {
        const curT = this.map.getTile(t.tx, t.ty);
        if (tool.water > 0 && (curT === TILE_SOIL_DRY || curT === TILE_SOIL_WATERED)) {
          tool.water--;
          this.map.setTile(t.tx, t.ty, TILE_SOIL_WATERED);
        }
      });
      this.player.stamina = Math.max(0, this.player.stamina - (1 + chargeLvl));
      window.hmAudio.playSFX('water_pour');
      this.updateHUD();
    }
    else if (tool.isSeed && tool.count > 0) {
      if ((tile === TILE_SOIL_DRY || tile === TILE_SOIL_WATERED) && !this.map.crops[cropKey]) {
        tool.count--;
        const cropConfigs = {
          turnip: { name: '순무', icon: '🥬', maxDays: 4, price: 60 },
          strawberry: { name: '딸기', icon: '🍓', maxDays: 6, price: 120 },
          corn: { name: '옥수수', icon: '🌽', maxDays: 5, price: 160 },
          pumpkin: { name: '호박', icon: '🎃', maxDays: 6, price: 280 }
        };
        const cfg = cropConfigs[tool.cropId] || cropConfigs.turnip;
        this.map.crops[cropKey] = {
          id: tool.cropId,
          name: cfg.name,
          icon: cfg.icon,
          stage: 0,
          maxDays: cfg.maxDays,
          daysGrown: 0,
          watered: tile === TILE_SOIL_WATERED,
          sellPrice: cfg.price
        };
        window.hmAudio.playSFX('harvest_pop');
        this.showToast(tool.name + ' 파종 완료 🌱');
        this.updateHUD();
      }
    }
    else if (tool.id === 'milker') {
      for (const a of this.map.animals) {
        if (a.type === 'cow' && a.hasMilk && Math.hypot(a.x - this.player.x, a.y - this.player.y) < 40) {
          a.hasMilk = false;
          window.hmAudio.playSFX('cow_moo');
          this.player.heldItem = { id: 'milk', name: '신선한 목장 우유 (L)', icon: '🥛', sellPrice: 160, count: 1 };
          this.showToast('🥛 신선한 우유를 짰습니다!');
          this.updateHUD();
          return;
        }
      }
    }
    else if (tool.id === 'clippers') {
      for (const a of this.map.animals) {
        if (a.type === 'sheep' && a.hasWool && Math.hypot(a.x - this.player.x, a.y - this.player.y) < 40) {
          a.hasWool = false;
          window.hmAudio.playSFX('harvest_pop');
          this.player.heldItem = { id: 'wool', name: '최고급 양모', icon: '🧶', sellPrice: 240, count: 1 };
          this.showToast('🧶 부드러운 양모를 깎았습니다!');
          this.updateHUD();
          return;
        }
      }
    }
    else if (tool.id === 'hammer') {
      if (tile === TILE_ROCK || tile === TILE_MINE_ROCK) {
        const isMine = tile === TILE_MINE_ROCK;
        this.map.setTile(frontTilePos.tx, frontTilePos.ty, isMine ? TILE_DIRT_PATH : TILE_GRASS);
        const ores = [
          { id: 'copper_ore', name: '구리 광석', icon: '🪨', price: 60 },
          { id: 'silver_ore', name: '은 광석', icon: '🥈', price: 100 },
          { id: 'gold_ore', name: '금 광석', icon: '🥇', price: 180 },
          { id: 'diamond_gem', name: '천연 다이아몬드', icon: '💎', price: 400 }
        ];
        const roll = Math.random();
        const ore = roll < 0.15 ? ores[3] : (roll < 0.4 ? ores[2] : (roll < 0.7 ? ores[1] : ores[0]));
        this.player.heldItem = { id: ore.id, name: ore.name, icon: ore.icon, sellPrice: ore.price, count: 1 };
        window.hmAudio.playSFX('hoe_dig');
        this.showToast('⛏️ ' + ore.name + ' 채굴 완료!');
        this.updateHUD();
      }
    }
    else if (tool.id === 'rod' && tile === TILE_WATER) {
      this.showToast('🎣 낚싯줄을 드리웠습니다...');
      setTimeout(() => {
        window.hmAudio.playSFX('harvest_pop');
        this.player.heldItem = { id: 'fish_item', name: '은빛 산천어 (Fish)', icon: '🐟', sellPrice: 120, count: 1 };
        this.showToast('❗ 물고기를 낚아 올렸습니다! 🐟');
        this.updateHUD();
      }, 1500);
    }
  }

  handleActionY() {
    this.equippedToolIdx = (this.equippedToolIdx + 1) % this.tools.length;
    window.hmAudio.playSFX('harvest_pop');
    this.updateHUD();
  }

  getFrontTile() {
    const ts = this.map.getCurZone().tileSize;
    let tx = Math.floor((this.player.x + 8) / ts);
    let ty = Math.floor((this.player.y + 8) / ts);

    if (this.player.dir === 'up') ty -= 1;
    else if (this.player.dir === 'down') ty += 1;
    else if (this.player.dir === 'left') tx -= 1;
    else if (this.player.dir === 'right') tx += 1;

    return { tx, ty };
  }

  openShop() {
    const modal = document.getElementById('modal-shop');
    modal.classList.remove('hidden');

    const container = document.getElementById('shop-items-container');
    container.innerHTML = `
      <div class="shop-item-row">
        <div class="shop-item-info">
          <span class="item-icon">🌱</span>
          <div>
            <div class="item-title">순무 씨앗 x3</div>
            <div class="item-desc">4일 후 수확 (판매가: 60G)</div>
          </div>
        </div>
        <button class="btn-buy-item" id="buy-turnip">120 G</button>
      </div>
      <div class="shop-item-row">
        <div class="shop-item-info">
          <span class="item-icon">🍓</span>
          <div>
            <div class="item-title">딸기 씨앗 x3</div>
            <div class="item-desc">6일 후 수확 (판매가: 120G)</div>
          </div>
        </div>
        <button class="btn-buy-item" id="buy-straw">180 G</button>
      </div>
      <div class="shop-item-row">
        <div class="shop-item-info">
          <span class="item-icon">🌽</span>
          <div>
            <div class="item-title">옥수수 씨앗 x3</div>
            <div class="item-desc">5일 후 수확 (판매가: 160G)</div>
          </div>
        </div>
        <button class="btn-buy-item" id="buy-corn">200 G</button>
      </div>
    `;

    document.getElementById('buy-turnip').onclick = () => {
      if (this.gold >= 120) {
        this.gold -= 120;
        this.tools.find(t => t.id === 'seed_turnip').count += 3;
        window.hmAudio.playSFX('coin');
        this.updateHUD();
        this.showToast('순무 씨앗 3개 구매 완료!');
      }
    };
    document.getElementById('buy-straw').onclick = () => {
      if (this.gold >= 180) {
        this.gold -= 180;
        this.tools.find(t => t.id === 'seed_straw').count += 3;
        window.hmAudio.playSFX('coin');
        this.updateHUD();
        this.showToast('딸기 씨앗 3개 구매 완료!');
      }
    };
    document.getElementById('buy-corn').onclick = () => {
      if (this.gold >= 200) {
        this.gold -= 200;
        this.tools.find(t => t.id === 'seed_corn').count += 3;
        window.hmAudio.playSFX('coin');
        this.updateHUD();
        this.showToast('옥수수 씨앗 3개 구매 완료!');
      }
    };
  }

  openBlacksmith() {
    const modal = document.getElementById('modal-blacksmith');
    modal.classList.remove('hidden');

    const container = document.getElementById('blacksmith-upgrades-container');
    container.innerHTML = `
      <div class="upgrade-row">
        <div class="upgrade-info">
          <div class="upgrade-icon">🚜</div>
          <div>
            <div class="upgrade-title">황동 호미 (Copper Hoe) Lv.2</div>
            <div class="upgrade-desc">차지 시 전방 1x3칸 동시 개간 (필요: 300G)</div>
          </div>
        </div>
        <button class="btn-upgrade-tool" id="upgrade-hoe">강화하기</button>
      </div>
      <div class="upgrade-row">
        <div class="upgrade-info">
          <div class="upgrade-icon">💧</div>
          <div>
            <div class="upgrade-title">은빛 물뿌리개 (Silver Can) Lv.2</div>
            <div class="upgrade-desc">차지 시 전방 1x3칸 동시 관수 (필요: 400G)</div>
          </div>
        </div>
        <button class="btn-upgrade-tool" id="upgrade-can">강화하기</button>
      </div>
    `;

    document.getElementById('upgrade-hoe').onclick = () => {
      if (this.gold >= 300) {
        this.gold -= 300;
        this.tools.find(t => t.id === 'hoe').level = 2;
        window.hmAudio.playSFX('coin');
        this.showToast('⚒️ 호미가 Lv.2로 강화되었습니다!');
        this.updateHUD();
      }
    };
    document.getElementById('upgrade-can').onclick = () => {
      if (this.gold >= 400) {
        this.gold -= 400;
        this.tools.find(t => t.id === 'can').level = 2;
        window.hmAudio.playSFX('coin');
        this.showToast('⚒️ 물뿌리개가 Lv.2로 강화되었습니다!');
        this.updateHUD();
      }
    };
  }

  openRucksack() {
    const modal = document.getElementById('modal-rucksack');
    modal.classList.remove('hidden');

    const container = document.getElementById('rucksack-container');
    container.innerHTML = '';

    for (let i = 0; i < 8; i++) {
      const item = this.rucksack[i];
      const slot = document.createElement('div');
      slot.className = 'rucksack-slot ' + (this.selectedRucksackIdx === i ? 'selected' : '');
      if (item) {
        slot.innerHTML = `
          <div style="font-size:24px;">${item.icon}</div>
          <div style="font-size:10px; font-weight:900;">${item.name}</div>
          <div style="font-size:9px; color:#b45309;">x${item.count}</div>
        `;
        slot.onclick = () => {
          this.selectedRucksackIdx = i;
          document.querySelectorAll('.rucksack-slot').forEach(s => s.classList.remove('selected'));
          slot.classList.add('selected');
          document.getElementById('rucksack-item-desc').innerText = item.name + ' (선택됨)';
        };
      }
      container.appendChild(slot);
    }
  }

  addItemToRucksack(item) {
    const existing = this.rucksack.find(i => i.id === item.id);
    if (existing) existing.count += (item.count || 1);
    else this.rucksack.push({ ...item, count: item.count || 1 });
  }

  advanceDay() {
    let revenue = 0;
    const list = document.getElementById('shipping-list-container');
    list.innerHTML = '';

    if (this.shippingBinItems.length > 0) {
      this.shippingBinItems.forEach(i => {
        const itemRev = i.sellPrice * (i.count || 1);
        revenue += itemRev;
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.margin = '4px 0';
        row.innerHTML = '<span>' + i.icon + ' ' + i.name + '</span><strong>+' + itemRev + ' G</strong>';
        list.appendChild(row);
      });
      this.gold += revenue;
      this.shippingBinItems = [];
      document.getElementById('shipping-total-gold').innerText = '+' + revenue + ' G';
      document.getElementById('modal-shipping').classList.remove('hidden');
    }

    this.day++;
    if (this.day > 30) {
      this.day = 1;
      this.seasonIdx = (this.seasonIdx + 1) % this.seasons.length;
    }

    this.timeMinutes = 360;
    this.player.stamina = this.player.maxStamina;
    this.warpToZone('farm', 180, 130);
    this.player.isRidingHorse = false;
    this.player.speed = 2.3;

    const horse = this.map.animals.find(a => a.type === 'horse');
    if (horse) { horse.x = 260; horse.y = 580; }

    this.map.animals.forEach(a => {
      if (a.type === 'chicken') a.hasEgg = true;
      if (a.type === 'cow') a.hasMilk = true;
      if (a.type === 'sheep') a.hasWool = true;
    });

    this.map.advanceDay(this);
    this.saveGame();

    window.hmAudio.playSFX('rooster');
    this.updateHUD();
    this.showToast('🌅 제 ' + this.day + '일차의 아침이 밝았습니다!');
  }

  showDialog(speaker, portrait, text, hearts = 3) {
    this.dialogActive = true;
    const box = document.getElementById('dialog-box');
    document.getElementById('dialog-speaker').innerText = speaker;
    document.getElementById('dialog-portrait').innerText = portrait;
    document.getElementById('dialog-text').innerText = text;
    document.getElementById('dialog-hearts').innerText = '❤️'.repeat(hearts) + '🤍'.repeat(5 - hearts);
    box.classList.remove('dialog-hidden');
  }

  closeDialog() {
    this.dialogActive = false;
    document.getElementById('dialog-box').classList.add('dialog-hidden');
  }

  showToast(msg) {
    const toast = document.getElementById('hm-toast');
    toast.innerText = msg;
    toast.classList.remove('toast-hidden');
    setTimeout(() => toast.classList.add('toast-hidden'), 2200);
  }

  saveGame() {
    try {
      const data = {
        gold: this.gold,
        day: this.day,
        seasonIdx: this.seasonIdx,
        rucksack: this.rucksack,
        crops: this.map.crops
      };
      localStorage.setItem('hm_master_save', JSON.stringify(data));
    } catch(e) {}
  }

  loadGame() {
    try {
      const raw = localStorage.getItem('hm_master_save');
      if (raw) {
        const data = JSON.parse(raw);
        if (data.gold) this.gold = data.gold;
        if (data.day) this.day = data.day;
        if (data.seasonIdx) this.seasonIdx = data.seasonIdx;
        if (data.rucksack) this.rucksack = data.rucksack;
        if (data.crops) this.map.crops = data.crops;
      }
    } catch(e) {}
  }

  updateHUD() {
    document.getElementById('hud-gold').innerText = this.gold.toLocaleString() + ' G';
    document.getElementById('hud-season').innerText = this.seasons[this.seasonIdx];
    document.getElementById('hud-day').innerText = this.day + '일 (' + this.dayNames[(this.day - 1) % 7] + ')';
    document.getElementById('hud-stamina-fill').style.width = ((this.player.stamina / this.player.maxStamina) * 100) + '%';
    document.getElementById('hud-stamina-val').innerText = Math.round(this.player.stamina) + '/' + this.player.maxStamina;
    document.getElementById('hud-zone-name').innerText = this.map.getCurZone().name;

    const h = Math.floor(this.timeMinutes / 60);
    const m = Math.floor(this.timeMinutes % 60);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const dh = h % 12 === 0 ? 12 : h % 12;
    document.getElementById('hud-clock').innerText = ampm + ' ' + (dh < 10 ? '0' : '') + dh + ':' + (m < 10 ? '0' : '') + m;

    const curTool = this.tools[this.equippedToolIdx];
    if (this.player.heldItem) {
      document.getElementById('hud-tool-icon').innerText = this.player.heldItem.icon;
      document.getElementById('hud-tool-name').innerText = this.player.heldItem.name;
      document.getElementById('hud-tool-sub').innerText = '출하 상자에 던져 넣으세요 [A]';
    } else if (curTool) {
      document.getElementById('hud-tool-icon').innerText = curTool.icon;
      document.getElementById('hud-tool-name').innerText = curTool.name + (curTool.level ? ' Lv.' + curTool.level : '');
      document.getElementById('hud-tool-sub').innerText = curTool.sub;
    }

    const filter = document.getElementById('weather-filter');
    if (h >= 17 && h < 20) {
      filter.style.backgroundColor = 'rgba(234, 88, 12, 0.2)';
    } else if (h >= 20 || h < 6) {
      filter.style.backgroundColor = 'rgba(15, 23, 42, 0.55)';
    } else {
      filter.style.backgroundColor = 'rgba(0, 0, 0, 0)';
    }
  }

  startLoop() {
    const loop = () => {
      this.update();
      this.render();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  update() {
    this.timeMinutes += 0.05;
    if (this.timeMinutes >= 1020 && !this.zackShippedToday) {
      this.zackShippedToday = true;
      window.hmAudio.playSFX('coin');
      this.showToast('🤠 잭(Zack)이 출하 상자의 농산물을 회수해 갔습니다!');
    }
    if (this.timeMinutes >= 1440) {
      this.advanceDay();
    }
    this.updateHUD();

    if (this.map.currentZone === 'farm') {
      const curTx = Math.floor(this.player.x / this.map.getCurZone().tileSize);
      const curTy = Math.floor(this.player.y / this.map.getCurZone().tileSize);
      if (this.map.getTile(curTx, curTy) === TILE_HOTSPRING) {
        this.player.stamina = Math.min(this.player.maxStamina, this.player.stamina + 0.4);
      }
    }

    if (this.player.isCharging) {
      this.player.chargeTimer += 0.016;
    }

    if (this.dialogActive) return;

    let dx = 0, dy = 0;
    if (this.keys['KeyW'] || this.keys['ArrowUp'] || this.keys['dpad_up']) { dy -= 1; this.player.dir = 'up'; }
    if (this.keys['KeyS'] || this.keys['ArrowDown'] || this.keys['dpad_down']) { dy += 1; this.player.dir = 'down'; }
    if (this.keys['KeyA'] || this.keys['ArrowLeft'] || this.keys['dpad_left']) { dx -= 1; this.player.dir = 'left'; }
    if (this.keys['KeyD'] || this.keys['ArrowRight'] || this.keys['dpad_right']) { dx += 1; this.player.dir = 'right'; }

    const len = Math.hypot(dx, dy);
    if (len > 0) {
      this.player.isMoving = true;
      this.player.walkFrame += 0.04;
      this.player.x += (dx / len) * this.player.speed;
      this.player.y += (dy / len) * this.player.speed;

      const zone = this.map.getCurZone();
      this.player.x = Math.max(16, Math.min(zone.cols * zone.tileSize - 32, this.player.x));
      this.player.y = Math.max(16, Math.min(zone.rows * zone.tileSize - 32, this.player.y));
    } else {
      this.player.isMoving = false;
    }

    this.camera.x = Math.round(this.player.x - this.canvas.width / 2);
    this.camera.y = Math.round(this.player.y - this.canvas.height / 2);
  }

  render() {
    const { ctx, canvas, camera, map } = this;
    const zone = map.getCurZone();
    const ts = zone.tileSize;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < zone.rows; y++) {
      for (let x = 0; x < zone.cols; x++) {
        const tile = zone.grid[y][x];
        const sx = x * ts - camera.x;
        const sy = y * ts - camera.y;

        if (tile === TILE_GRASS) {
          ctx.fillStyle = (x + y) % 2 === 0 ? '#4ade80' : '#22c55e';
          ctx.fillRect(sx, sy, ts, ts);
        } else if (tile === TILE_DIRT_PATH) {
          ctx.fillStyle = '#fde68a';
          ctx.fillRect(sx, sy, ts, ts);
        } else if (tile === TILE_SOIL_DRY) {
          ctx.fillStyle = '#b45309';
          ctx.fillRect(sx + 1, sy + 1, ts - 2, ts - 2);
        } else if (tile === TILE_SOIL_WATERED) {
          ctx.fillStyle = '#78350f';
          ctx.fillRect(sx + 1, sy + 1, ts - 2, ts - 2);
        } else if (tile === TILE_WATER) {
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(sx, sy, ts, ts);
        } else if (tile === TILE_HOTSPRING) {
          ctx.fillStyle = '#67e8f9';
          ctx.fillRect(sx, sy, ts, ts);
          ctx.fillStyle = 'rgba(255,255,255,0.7)';
          ctx.fillText('♨️', sx + 6, sy + 22);
        } else if (tile === TILE_SHIPPING_BIN) {
          ctx.fillStyle = '#854d0e';
          ctx.fillRect(sx + 2, sy + 4, ts - 4, ts - 6);
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 9px sans-serif';
          ctx.fillText('출하', sx + 6, sy + 20);
        } else if (tile === TILE_WELL) {
          ctx.fillStyle = '#64748b';
          ctx.fillRect(sx + 4, sy + 4, ts - 8, ts - 8);
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(sx + ts/2, sy + ts/2, 6, 0, Math.PI * 2);
          ctx.fill();
        } else if (tile === TILE_HOUSE_ROOF) {
          ctx.fillStyle = '#dc2626';
          ctx.fillRect(sx, sy, ts, ts);
        } else if (tile === TILE_HOUSE_WALL) {
          ctx.fillStyle = '#fef3c7';
          ctx.fillRect(sx, sy, ts, ts);
        } else if (tile === TILE_HOUSE_DOOR || tile === TILE_COOP_DOOR || tile === TILE_BARN_DOOR || tile === TILE_EXIT_DOOR) {
          ctx.fillStyle = '#78350f';
          ctx.fillRect(sx + 6, sy + 4, ts - 12, ts - 4);
        } else if (tile === TILE_WOOD_FLOOR) {
          ctx.fillStyle = '#fcd34d';
          ctx.fillRect(sx, sy, ts, ts);
          ctx.strokeStyle = '#d97706';
          ctx.strokeRect(sx, sy, ts, ts);
        } else if (tile === TILE_BED) {
          ctx.fillStyle = '#f43f5e';
          ctx.fillRect(sx + 2, sy + 2, ts - 4, ts - 4);
          ctx.font = '16px sans-serif';
          ctx.fillText('🛏️', sx + 6, sy + 22);
        } else if (tile === TILE_TV) {
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(sx + 2, sy + 2, ts - 4, ts - 4);
          ctx.font = '16px sans-serif';
          ctx.fillText('📺', sx + 6, sy + 22);
        } else if (tile === TILE_KITCHEN) {
          ctx.fillStyle = '#cbd5e1';
          ctx.fillRect(sx + 2, sy + 2, ts - 4, ts - 4);
          ctx.font = '16px sans-serif';
          ctx.fillText('🍳', sx + 6, sy + 22);
        } else if (tile === TILE_MINE_ROCK) {
          ctx.fillStyle = '#64748b';
          ctx.fillRect(sx + 2, sy + 2, ts - 4, ts - 4);
          ctx.font = '16px sans-serif';
          ctx.fillText('🪨', sx + 6, sy + 22);
        } else if (tile === TILE_MINE_LADDER) {
          ctx.fillStyle = '#78350f';
          ctx.fillRect(sx + 4, sy + 2, ts - 8, ts - 4);
          ctx.font = '14px sans-serif';
          ctx.fillText('🪜', sx + 6, sy + 22);
        } else if (tile === TILE_SHOP_COUNTER) {
          ctx.fillStyle = '#92400e';
          ctx.fillRect(sx, sy, ts, ts);
          ctx.font = '16px sans-serif';
          ctx.fillText('🏪', sx + 6, sy + 22);
        } else if (tile === TILE_BLACKSMITH_ANVIL) {
          ctx.fillStyle = '#334155';
          ctx.fillRect(sx, sy, ts, ts);
          ctx.font = '16px sans-serif';
          ctx.fillText('⚒️', sx + 6, sy + 22);
        }
      }
    }

    if (map.currentZone === 'farm') {
      for (const [key, crop] of Object.entries(map.crops)) {
        const [tx, ty] = key.split(',').map(Number);
        const sx = tx * ts - camera.x + ts / 2;
        const sy = ty * ts - camera.y + ts / 2;
        SpriteRenderer.drawCrop(ctx, sx, sy, crop);
      }

      map.animals.forEach(a => {
        if (a.type === 'horse' && this.player.isRidingHorse) return;
        SpriteRenderer.drawAnimal(ctx, a.x - camera.x, a.y - camera.y, a, this.player.walkFrame);
      });
    }

    SpriteRenderer.drawPlayer(
      ctx,
      this.player.x - camera.x,
      this.player.y - camera.y,
      this.player.dir,
      this.player.isMoving,
      this.player.walkFrame,
      this.player.heldItem,
      this.player.isRidingHorse
    );
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.hmGame = new HarvestMoonGame();
});
