/* ==========================================================================
   ABYSSAL SLAYER: MASTER GAME ENGINE (MOBILE-ENHANCED & AUTO-AIM)
   ========================================================================== */

class AbyssalGameEngine {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.minimapCanvas = document.getElementById('minimapCanvas');

    this.state = 'TITLE'; // TITLE, SANCTUARY, PLAYING, BOON_PICK, SHOP, END
    this.selectedClass = 'shadow_blade';
    this.talents = {};
    this.bankedSouls = 0;

    this.dungeon = null;
    this.player = null;
    this.enemies = [];
    this.projectiles = [];
    this.camera = { x: 0, y: 0 };
    this.mouse = { x: 0, y: 0, isDown: false };
    this.keys = {};

    this.rerollCount = 1;
    this.runStartTime = 0;

    // Mobile Dynamic Floating Joystick State
    this.touchJoystick = {
      active: false,
      identifier: null,
      startX: 0,
      startY: 0,
      dx: 0,
      dy: 0
    };

    this.loadSave();
    this.initCanvas();
    this.setupInputs();
    this.setupUI();

    window.gameInstance = this;
    this.startLoop();
  }

  initCanvas() {
    this.resize();
    window.addEventListener('resize', () => this.resize());
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', () => this.resize());
    }
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.ctx.scale(dpr, dpr);
    this.viewportWidth = w;
    this.viewportHeight = h;
  }

  loadSave() {
    try {
      const raw = localStorage.getItem('abyssal_slayer_save');
      if (raw) {
        const data = JSON.parse(raw);
        this.bankedSouls = data.bankedSouls || 0;
        this.talents = data.talents || {};
      }
    } catch(e) {}
  }

  saveGame() {
    try {
      const data = {
        bankedSouls: this.bankedSouls,
        talents: this.talents
      };
      localStorage.setItem('abyssal_slayer_save', JSON.stringify(data));
    } catch(e) {}
  }

  autoAimNearestEnemy() {
    if (!this.player || this.enemies.length === 0) return;
    let closest = null;
    let minDist = 600;
    this.enemies.forEach(e => {
      if (e.hp > 0) {
        const dist = Math.hypot(e.x - this.player.x, e.y - this.player.y);
        if (dist < minDist) {
          minDist = dist;
          closest = e;
        }
      }
    });

    if (closest) {
      this.player.aimAngle = Math.atan2(closest.y - this.player.y, closest.x - this.player.x);
    }
  }

  setupInputs() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (this.state === 'PLAYING') {
        if (e.code === 'Space' || e.code === 'KeyX') {
          let mx = 0, my = 0;
          if (this.keys['KeyW'] || this.keys['ArrowUp']) my -= 1;
          if (this.keys['KeyS'] || this.keys['ArrowDown']) my += 1;
          if (this.keys['KeyA'] || this.keys['ArrowLeft']) mx -= 1;
          if (this.keys['KeyD'] || this.keys['ArrowRight']) mx += 1;
          this.player.dash(mx, my);
        }
        if (e.code === 'KeyQ' || e.code === 'KeyC') this.player.castSkill1(this.projectiles);
        if (e.code === 'KeyE' || e.code === 'KeyV') this.player.castSkill2(this.projectiles);
        if (e.code === 'KeyR' || e.code === 'KeyF') this.player.castUlt(this.projectiles);
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
      if (this.player && !this.touchJoystick.active) {
        const screenPx = this.player.x - this.camera.x;
        const screenPy = this.player.y - this.camera.y;
        this.player.aimAngle = Math.atan2(this.mouse.y - screenPy, this.mouse.x - screenPx);
      }
    });

    window.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.mouse.isDown = true;
        if (this.state === 'PLAYING' && this.player) {
          this.player.basicAttack(this.enemies);
        }
      }
    });

    window.addEventListener('mouseup', () => {
      this.mouse.isDown = false;
    });

    // Mobile Dynamic Floating Joystick
    const touchArea = document.getElementById('touch-joystick-toucharea');
    const floatJoy = document.getElementById('floating-joystick');
    const joyThumb = document.getElementById('joystick-thumb');

    if (touchArea && floatJoy && joyThumb) {
      touchArea.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.changedTouches[0];
        this.touchJoystick.active = true;
        this.touchJoystick.identifier = touch.identifier;
        this.touchJoystick.startX = touch.clientX;
        this.touchJoystick.startY = touch.clientY;

        floatJoy.style.left = `${touch.clientX}px`;
        floatJoy.style.top = `${touch.clientY}px`;
        floatJoy.classList.remove('hidden');

        this.updateFloatingJoystick(touch.clientX, touch.clientY, joyThumb);
      }, { passive: false });

      touchArea.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (this.touchJoystick.active) {
          for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            if (touch.identifier === this.touchJoystick.identifier) {
              this.updateFloatingJoystick(touch.clientX, touch.clientY, joyThumb);
              break;
            }
          }
        }
      }, { passive: false });

      const endJoy = (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === this.touchJoystick.identifier) {
            this.touchJoystick.active = false;
            this.touchJoystick.identifier = null;
            this.touchJoystick.dx = 0;
            this.touchJoystick.dy = 0;
            floatJoy.classList.add('hidden');
            joyThumb.style.transform = 'translate(-50%, -50%)';
            break;
          }
        }
      };

      touchArea.addEventListener('touchend', endJoy);
      touchArea.addEventListener('touchcancel', endJoy);
    }

    // Touch Action Buttons with Auto-Aim
    const bindTouchAction = (id, action) => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.addEventListener('touchstart', (e) => {
          e.preventDefault();
          this.autoAimNearestEnemy();
          action();
        }, { passive: false });
      }
    };

    bindTouchAction('tbtn-atk', () => { if (this.player) this.player.basicAttack(this.enemies); });
    bindTouchAction('tbtn-dash', () => { if (this.player) this.player.dash(this.touchJoystick.dx, this.touchJoystick.dy); });
    bindTouchAction('tbtn-sk1', () => { if (this.player) this.player.castSkill1(this.projectiles); });
    bindTouchAction('tbtn-sk2', () => { if (this.player) this.player.castSkill2(this.projectiles); });
    bindTouchAction('tbtn-ult', () => { if (this.player) this.player.castUlt(this.projectiles); });
  }

  updateFloatingJoystick(cx, cy, thumb) {
    const rawDx = cx - this.touchJoystick.startX;
    const rawDy = cy - this.touchJoystick.startY;
    const dist = Math.hypot(rawDx, rawDy);
    const maxR = 40;
    const clampedDist = Math.min(maxR, dist);
    const angle = Math.atan2(rawDy, rawDx);

    const fx = Math.cos(angle) * clampedDist;
    const fy = Math.sin(angle) * clampedDist;

    thumb.style.transform = `translate(calc(-50% + ${fx}px), calc(-50% + ${fy}px))`;

    this.touchJoystick.dx = fx / maxR;
    this.touchJoystick.dy = fy / maxR;

    if (this.player && dist > 8) {
      this.player.aimAngle = angle;
    }
  }

  setupUI() {
    // Class Card Selection
    document.querySelectorAll('.class-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.class-card').forEach(c => {
          c.classList.remove('selected');
          c.querySelector('.btn-select-hero').innerText = '선택하기';
        });
        card.classList.add('selected');
        card.querySelector('.btn-select-hero').innerText = '선택 완료';
        this.selectedClass = card.dataset.class;
        window.abyssAudio.playSFX('slash');
      });
    });

    // Start Run Button
    document.getElementById('btn-start-run').addEventListener('click', () => {
      this.startRun();
    });

    // Sanctuary Open/Close
    document.getElementById('btn-open-sanctuary').addEventListener('click', () => {
      this.openSanctuary();
    });
    document.getElementById('btn-close-sanctuary').addEventListener('click', () => {
      document.getElementById('modal-sanctuary').classList.add('hidden');
    });
    document.getElementById('btn-sanctuary-done').addEventListener('click', () => {
      document.getElementById('modal-sanctuary').classList.add('hidden');
    });

    // Reroll Boon
    document.getElementById('btn-reroll-boon').addEventListener('click', () => {
      if (this.rerollCount > 0) {
        this.rerollCount--;
        document.getElementById('reroll-count').innerText = this.rerollCount;
        this.presentBoons();
      }
    });

    // Return to Hub from End Screen
    document.getElementById('btn-return-hub').addEventListener('click', () => {
      document.getElementById('modal-end').classList.add('hidden');
      document.getElementById('modal-title').classList.remove('hidden');
      document.getElementById('modal-title').classList.add('active');
      this.state = 'TITLE';
      window.abyssAudio.stopBGM();
    });

    // Close Shop
    document.getElementById('btn-close-shop').addEventListener('click', () => {
      document.getElementById('modal-shop').classList.add('hidden');
      this.state = 'PLAYING';
    });
  }

  startRun() {
    const classData = HERO_CLASSES[this.selectedClass];
    this.player = new Player(classData, this.talents);
    this.dungeon = new DungeonFloor(1);
    this.enemies = [];
    this.projectiles = [];
    this.runStartTime = Date.now();
    this.rerollCount = 1;

    document.getElementById('modal-title').classList.remove('active');
    document.getElementById('modal-title').classList.add('hidden');
    document.getElementById('hud-class-icon').innerText = this.player.icon;

    this.state = 'PLAYING';
    window.abyssAudio.startDungeonBGM();
    this.showToast(`🔥 ${this.player.name}의 심연 토벌이 시작되었습니다!`);
    this.updateHUD();
  }

  openSanctuary() {
    document.getElementById('modal-sanctuary').classList.remove('hidden');
    document.getElementById('sanctuary-soul-val').innerText = this.bankedSouls;

    const container = document.getElementById('sanctuary-talents-container');
    container.innerHTML = '';

    SANCTUARY_TALENTS.forEach(t => {
      const curLvl = this.talents[t.id] || 0;
      const cost = t.costPerLvl * (curLvl + 1);
      const isMax = curLvl >= t.maxLevel;

      const card = document.createElement('div');
      card.className = 'talent-card';
      card.style.background = '#1e293b';
      card.style.border = '1px solid var(--border-gold)';
      card.style.borderRadius = '10px';
      card.style.padding = '10px 12px';
      card.style.display = 'flex';
      card.style.justifyContent = 'space-between';
      card.style.alignItems = 'center';
      card.style.margin = '6px 0';

      card.innerHTML = `
        <div>
          <div style="font-weight:900; font-size:14px; color:#fff;">${t.icon} ${t.name} (Lv.${curLvl}/${t.maxLevel})</div>
          <div style="font-size:11px; color:#94a3b8;">${t.desc}</div>
        </div>
        <button class="btn-upgrade-talent" style="padding:6px 12px; background:${isMax ? '#475569' : '#e11d48'}; border:none; border-radius:6px; color:#fff; font-weight:800; font-size:12px; cursor:${isMax ? 'default' : 'pointer'};">
          ${isMax ? 'MAX' : `${cost} 💜 강화`}
        </button>
      `;

      if (!isMax) {
        card.querySelector('button').onclick = () => {
          if (this.bankedSouls >= cost) {
            this.bankedSouls -= cost;
            this.talents[t.id] = curLvl + 1;
            this.saveGame();
            window.abyssAudio.playSFX('boon_pickup');
            this.openSanctuary();
          } else {
            this.showToast('영혼 정수가 부족합니다!');
          }
        };
      }

      container.appendChild(card);
    });
  }

  presentBoons() {
    this.state = 'BOON_PICK';
    const modal = document.getElementById('modal-boon');
    modal.classList.remove('hidden');

    const randomGod = GOD_DOMAINS[Math.floor(Math.random() * GOD_DOMAINS.length)];
    document.getElementById('boon-god-icon').innerText = randomGod.icon;
    document.getElementById('boon-god-name').innerText = randomGod.name;
    document.getElementById('boon-god-quote').innerText = `"${randomGod.quote}"`;

    const container = document.getElementById('boon-cards-container');
    container.innerHTML = '';

    const available = GODLY_BOONS.filter(b => !this.player.boons.some(pb => pb.id === b.id));
    const shuffled = available.sort(() => 0.5 - Math.random()).slice(0, 3);

    shuffled.forEach(b => {
      const card = document.createElement('div');
      card.className = 'boon-card';
      card.innerHTML = `
        <span class="boon-card-rarity rarity-${b.rarity}">${b.rarity.toUpperCase()}</span>
        <div class="boon-card-title">${b.name}</div>
        <div class="boon-card-desc">${b.desc}</div>
      `;

      card.onclick = () => {
        b.apply(this.player);
        this.player.boons.push(b);
        modal.classList.add('hidden');
        this.state = 'PLAYING';
        window.abyssAudio.playSFX('boon_pickup');
        this.addBoonBadge(b);
        this.showToast(`✨ ${b.name} 축복 획득!`);
      };

      container.appendChild(card);
    });
  }

  addBoonBadge(b) {
    const dock = document.getElementById('boon-dock');
    const badge = document.createElement('div');
    badge.className = 'boon-badge';
    badge.innerHTML = `<span>⚡</span><strong>${b.name}</strong>`;
    dock.appendChild(badge);
  }

  openShop() {
    this.state = 'SHOP';
    const modal = document.getElementById('modal-shop');
    modal.classList.remove('hidden');
    document.getElementById('shop-gold-val').innerText = this.player.gold;

    const container = document.getElementById('shop-items-container');
    container.innerHTML = '';

    MERCHANT_ITEMS.forEach(item => {
      const card = document.createElement('div');
      card.style.background = '#1e293b';
      card.style.border = '1px solid var(--border-gold)';
      card.style.borderRadius = '10px';
      card.style.padding = '10px 12px';
      card.style.display = 'flex';
      card.style.justifyContent = 'space-between';
      card.style.alignItems = 'center';
      card.style.margin = '6px 0';

      card.innerHTML = `
        <div>
          <div style="font-weight:900; font-size:14px; color:#fff;">${item.icon} ${item.name}</div>
          <div style="font-size:11px; color:#94a3b8;">${item.desc}</div>
        </div>
        <button style="padding:6px 12px; background:#eab308; border:none; border-radius:6px; color:#000; font-weight:900; font-size:12px; cursor:pointer;">
          ${item.cost} 💰 구매
        </button>
      `;

      card.querySelector('button').onclick = () => {
        if (this.player.gold >= item.cost) {
          this.player.gold -= item.cost;
          if (item.type === 'heal') this.player.hp = Math.min(this.player.maxHp, this.player.hp + item.val);
          if (item.type === 'max_hp') { this.player.maxHp += item.val; this.player.hp = this.player.maxHp; }
          if (item.type === 'atk') this.player.baseAtk += item.val;
          if (item.type === 'speed') this.player.speed *= (1 + item.val);

          window.abyssAudio.playSFX('coin');
          this.showToast(`${item.name} 구매 완료!`);
          this.openShop();
          this.updateHUD();
        } else {
          this.showToast('골드가 부족합니다!');
        }
      };

      container.appendChild(card);
    });
  }

  spawnEnemiesForRoom(room) {
    if (room.enemiesSpawned || room.cleared) return;
    room.enemiesSpawned = true;
    this.enemies = [];

    if (room.type === 'combat') {
      for (let i = 0; i < 5; i++) {
        this.enemies.push(new Enemy('void_skulker', Math.random() * 800 + 200, Math.random() * 500 + 150));
      }
      for (let i = 0; i < 2; i++) {
        this.enemies.push(new Enemy('skeleton_archer', Math.random() * 800 + 200, Math.random() * 500 + 150));
      }
    } else if (room.type === 'elite') {
      this.enemies.push(new Enemy('minotaur_elite', room.width / 2, room.height / 2));
      for (let i = 0; i < 3; i++) {
        this.enemies.push(new Enemy('void_skulker', Math.random() * 800 + 200, Math.random() * 500 + 150));
      }
    } else if (room.type === 'boss') {
      const boss = new AbaddonBoss(room.width / 2, room.height / 2);
      this.enemies.push(boss);
      document.getElementById('boss-hud').classList.remove('hidden');
      window.abyssAudio.startBossBGM();
    }
  }

  dealAreaDamage(x, y, radius, damage, type) {
    this.enemies.forEach(e => {
      const dist = Math.hypot(e.x - x, e.y - y);
      if (dist < radius + e.radius) {
        const isCrit = Math.random() < this.player.critRate;
        e.takeDamage(damage * (isCrit ? this.player.critMult : 1.0), isCrit, this.player);
      }
    });
  }

  triggerChainLightning(source, enemies, chainsLeft, damage) {
    if (chainsLeft <= 0) return;
    const candidates = enemies.filter(e => e !== source && e.hp > 0);
    if (candidates.length === 0) return;

    candidates.sort((a, b) => Math.hypot(a.x - source.x, a.y - source.y) - Math.hypot(b.x - source.x, b.y - source.y));
    const target = candidates[0];

    window.abyssParticles.addLightning(source.x, source.y, target.x, target.y);
    target.takeDamage(damage, false, this.player);

    setTimeout(() => {
      this.triggerChainLightning(target, enemies, chainsLeft - 1, damage);
    }, 80);
  }

  showToast(msg) {
    const toast = document.getElementById('game-toast');
    toast.innerText = msg;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 2200);
  }

  updateHUD() {
    if (!this.player) return;
    document.getElementById('hud-player-level').innerText = `Lv.${this.player.level}`;
    document.getElementById('hud-hp-fill').style.width = `${Math.max(0, (this.player.hp / this.player.maxHp) * 100)}%`;
    document.getElementById('hud-hp-text').innerText = `${Math.round(this.player.hp)} / ${this.player.maxHp}`;
    document.getElementById('hud-mp-fill').style.width = `${Math.max(0, (this.player.mp / this.player.maxMp) * 100)}%`;
    document.getElementById('hud-mp-text').innerText = `${Math.round(this.player.mp)} / ${this.player.maxMp}`;
    document.getElementById('hud-exp-fill').style.width = `${(this.player.exp / this.player.expNext) * 100}%`;
    document.getElementById('hud-gold').innerText = this.player.gold;
    document.getElementById('hud-souls').innerText = this.player.souls;
    document.getElementById('hud-floor').innerText = `1F - ${this.dungeon.currentRoom.name}`;

    const cdDash = document.getElementById('cd-dash');
    if (cdDash) cdDash.style.height = `${(this.player.dashCdTimer / this.player.dashCd) * 100}%`;
    const dashChg = document.getElementById('dash-charges');
    if (dashChg) dashChg.innerText = '⚡'.repeat(this.player.dashes);

    const cdSk1 = document.getElementById('cd-skill1');
    if (cdSk1) cdSk1.style.height = `${(this.player.cdSkill1 / this.player.skills.skill1.cd) * 100}%`;
    const cdSk2 = document.getElementById('cd-skill2');
    if (cdSk2) cdSk2.style.height = `${(this.player.cdSkill2 / this.player.skills.skill2.cd) * 100}%`;
    const cdUlt = document.getElementById('cd-ult');
    if (cdUlt) cdUlt.style.height = `${(this.player.cdUlt / this.player.skills.ult.cd) * 100}%`;

    const boss = this.enemies.find(e => e.isBoss);
    if (boss) {
      document.getElementById('boss-hp-fill').style.width = `${Math.max(0, (boss.hp / boss.maxHp) * 100)}%`;
    }
  }

  checkDoorWarps() {
    if (!this.dungeon.currentRoom.cleared) return;
    const p = this.player;
    const room = this.dungeon.currentRoom;

    if (p.y < 35 && room.doors.includes('north')) this.enterNextRoom('north');
    else if (p.y > room.height - 35 && room.doors.includes('south')) this.enterNextRoom('south');
    else if (p.x < 35 && room.doors.includes('west')) this.enterNextRoom('west');
    else if (p.x > room.width - 35 && room.doors.includes('east')) this.enterNextRoom('east');
  }

  enterNextRoom(dir) {
    const next = this.dungeon.changeRoom(dir, this.player);
    if (next) {
      this.projectiles = [];
      this.spawnEnemiesForRoom(next);
      this.showToast(`📍 ${next.name} 진입`);
      if (next.type === 'shop') this.openShop();
    }
  }

  endRun(isVictory) {
    this.state = 'END';
    this.bankedSouls += this.player.souls;
    this.saveGame();

    document.getElementById('modal-end').classList.remove('hidden');
    document.getElementById('end-title').innerText = isVictory ? 'VICTORY' : 'DEFEAT';
    document.getElementById('end-title').style.color = isVictory ? '#fbbf24' : '#e11d48';
    document.getElementById('end-subtitle').innerText = isVictory
      ? '심연의 대군주를 토벌하고 몰락자의 승천을 이루어냈습니다!'
      : '심연의 어둠이 영혼을 집어삼켰습니다.';

    document.getElementById('end-floor').innerText = `1F - ${this.dungeon.currentRoom.name}`;
    document.getElementById('end-kills').innerText = `${this.player.kills} 마리`;
    document.getElementById('end-damage').innerText = `${this.player.totalDamageDealt.toLocaleString()}`;
    document.getElementById('end-souls').innerText = `+${this.player.souls} 💜`;

    const sec = Math.floor((Date.now() - this.runStartTime) / 1000);
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    document.getElementById('end-time').innerText = `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;

    document.getElementById('boss-hud').classList.add('hidden');
  }

  startLoop() {
    let lastTime = performance.now();
    const loop = (now) => {
      const dt = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;

      this.update(dt);
      this.render();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  update(dt) {
    if (this.state !== 'PLAYING') return;

    let moveX = this.touchJoystick.dx;
    let moveY = this.touchJoystick.dy;

    if (this.keys['KeyW'] || this.keys['ArrowUp']) moveY -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) moveY += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveX -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) moveX += 1;

    this.player.update(dt, moveX, moveY, this.dungeon.currentRoom);
    this.checkDoorWarps();

    this.spawnEnemiesForRoom(this.dungeon.currentRoom);

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.update(dt, this.player, this.projectiles);
      if (e.hp <= 0) {
        if (e.isBoss) this.endRun(true);
        this.enemies.splice(i, 1);
      }
    }

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.update(dt);

      if (p.life <= 0) {
        this.projectiles.splice(i, 1);
        continue;
      }

      if (p.owner === 'player') {
        this.enemies.forEach(e => {
          if (Math.hypot(e.x - p.x, e.y - p.y) < e.radius + p.radius) {
            e.takeDamage(p.damage, false, this.player);
            if (p.explodes) {
              window.abyssParticles.addShockwave(p.x, p.y, 80, '#f97316');
              this.dealAreaDamage(p.x, p.y, 80, p.damage, 'fire');
            }
            if (!p.penetrates) p.life = 0;
          }
        });
      } else if (p.owner === 'enemy') {
        if (Math.hypot(this.player.x - p.x, this.player.y - p.y) < this.player.radius + p.radius) {
          this.player.takeDamage(p.damage, 'projectile');
          p.life = 0;
        }
      }
    }

    const res = this.dungeon.update(dt, this.player, this.enemies);
    if (res === 'ROOM_CLEARED') {
      this.presentBoons();
    }

    window.abyssParticles.update(dt);

    if (this.player.hp <= 0) {
      this.endRun(false);
    }

    this.updateHUD();

    const targetCamX = this.player.x - (this.viewportWidth || this.canvas.width) / 2;
    const targetCamY = this.player.y - (this.viewportHeight || this.canvas.height) / 2;
    this.camera.x += (targetCamX - this.camera.x) * 0.12;
    this.camera.y += (targetCamY - this.camera.y) * 0.12;

    if (window.abyssParticles.screenShake > 0) {
      this.camera.x += (Math.random() - 0.5) * window.abyssParticles.screenShake;
      this.camera.y += (Math.random() - 0.5) * window.abyssParticles.screenShake;
    }
  }

  render() {
    const { ctx, canvas, camera, dungeon, player, enemies, projectiles } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (this.state === 'PLAYING' || this.state === 'BOON_PICK' || this.state === 'SHOP') {
      dungeon.render(ctx, camera);
      window.abyssParticles.render(ctx, camera);

      enemies.forEach(e => e.render(ctx, camera));
      projectiles.forEach(p => p.render(ctx, camera));
      player.render(ctx, camera);

      if (this.minimapCanvas && window.innerWidth > 640) {
        dungeon.renderMinimap(this.minimapCanvas);
      }
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new AbyssalGameEngine();
});
