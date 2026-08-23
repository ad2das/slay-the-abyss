/* ==========================================================================
   SLAY THE ABYSS - UI & INTERACTIVE CARD DRAGGING / TARGETING ENGINE
   ========================================================================== */

class UIManager {
  constructor() {
    this.fxCanvas = document.getElementById('fxCanvas');
    this.fxCtx = this.fxCanvas.getContext('2d');
    this.handContainer = document.getElementById('hand-container');
    this.enemiesContainer = document.getElementById('enemies-container');

    this.draggedCard = null;
    this.draggedCardIndex = -1;
    this.isTargeting = false;
    this.cardOrigin = { x: 0, y: 0 };
    this.mousePos = { x: 0, y: 0 };

    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
    this.setupGlobalEvents();
  }

  resizeCanvas() {
    this.fxCanvas.width = window.innerWidth;
    this.fxCanvas.height = window.innerHeight;
  }

  setupGlobalEvents() {
    window.addEventListener('mousemove', (e) => {
      this.mousePos.x = e.clientX;
      this.mousePos.y = e.clientY;

      if (this.draggedCard) {
        this.renderTargetingArrow();
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (this.draggedCard) {
        this.handleCardDrop(e);
      }
    });

    // End Turn Button
    document.getElementById('btn-end-turn').addEventListener('click', () => {
      if (window.game && window.game.combat) {
        window.game.combat.endTurn();
      }
    });

    // Deck View Button
    document.getElementById('btn-view-deck').addEventListener('click', () => {
      if (window.game && window.game.player) {
        this.openDeckModal(window.game.player.deck, '내 덱 목록 (DECK VIEW)');
      }
    });

    // Draw / Discard / Exhaust Piles
    document.getElementById('btn-draw-pile').addEventListener('click', () => {
      if (window.game && window.game.combat) {
        this.openDeckModal(window.game.combat.drawPile, '뽑을 카드 더미 (DRAW PILE)');
      }
    });
    document.getElementById('btn-discard-pile').addEventListener('click', () => {
      if (window.game && window.game.combat) {
        this.openDeckModal(window.game.combat.discardPile, '버린 카드 더미 (DISCARD PILE)');
      }
    });
    document.getElementById('btn-exhaust-pile').addEventListener('click', () => {
      if (window.game && window.game.combat) {
        this.openDeckModal(window.game.combat.exhaustPile, '소멸된 카드 (EXHAUST PILE)');
      }
    });

    // Close Deck Modal
    document.getElementById('btn-close-deck-modal').addEventListener('click', () => {
      document.getElementById('deck-modal').classList.add('hidden');
    });

    // Toggle Map Button
    document.getElementById('btn-toggle-map').addEventListener('click', () => {
      if (window.game) {
        window.game.toggleMap();
      }
    });
  }

  showNotice(msg) {
    const el = document.createElement('div');
    el.style.position = 'absolute';
    el.style.top = '35%';
    el.style.left = '50%';
    el.style.transform = 'translate(-50%, -50%)';
    el.style.background = 'rgba(220, 38, 38, 0.9)';
    el.style.border = '2px solid #fca5a5';
    el.style.color = '#fff';
    el.style.fontFamily = 'var(--font-title)';
    el.style.fontSize = '18px';
    el.style.fontWeight = '900';
    el.style.padding = '10px 24px';
    el.style.borderRadius = '10px';
    el.style.boxShadow = '0 0 25px rgba(220, 38, 38, 0.8)';
    el.style.zIndex = '500';
    el.style.pointerEvents = 'none';
    el.innerText = msg;

    document.body.appendChild(el);
    setTimeout(() => {
      el.style.transition = 'opacity 0.4s, transform 0.4s';
      el.style.opacity = '0';
      el.style.transform = 'translate(-50%, -70%)';
      setTimeout(() => el.remove(), 400);
    }, 900);
  }

  updateTopBar(player, floorText) {
    if (!player) return;
    document.getElementById('header-hero-name').innerText = player.name;
    document.getElementById('header-hp-text').innerText = `${player.hp} / ${player.maxHp}`;
    document.getElementById('header-hp-mini-fill').style.width = `${Math.max(0, (player.hp / player.maxHp) * 100)}%`;
    document.getElementById('header-gold-text').innerText = player.gold;
    document.getElementById('header-deck-count').innerText = player.deck.length;
    if (floorText) document.getElementById('header-floor-text').innerText = floorText;

    // Relics Dock
    const relicsDock = document.getElementById('header-relics-dock');
    relicsDock.innerHTML = '';
    player.relics.forEach(r => {
      const el = document.createElement('div');
      el.className = 'relic-item';
      el.innerHTML = r.icon;
      el.title = `${r.name}: ${r.desc}`;
      relicsDock.appendChild(el);
    });
  }

  updateCombatUI() {
    const combat = window.game.combat;
    if (!combat) return;

    this.updateTopBar(combat.player);

    // 1. Energy Orb
    document.getElementById('energy-curr').innerText = combat.energy;
    document.getElementById('energy-max').innerText = combat.maxEnergy;

    // 2. Piles counters
    document.getElementById('draw-pile-count').innerText = combat.drawPile.length;
    document.getElementById('discard-pile-count').innerText = combat.discardPile.length;
    document.getElementById('exhaust-pile-count').innerText = combat.exhaustPile.length;

    // 3. Player Unit Display
    const player = combat.player;
    document.getElementById('player-hp-curr').innerText = player.hp;
    document.getElementById('player-hp-max').innerText = player.maxHp;
    const phpPct = Math.max(0, (player.hp / player.maxHp) * 100);
    document.getElementById('player-hp-fill').style.width = `${phpPct}%`;
    document.getElementById('player-hp-ghost').style.width = `${phpPct}%`;

    const pBlockBadge = document.getElementById('player-block-badge');
    if (player.block > 0) {
      pBlockBadge.classList.remove('hidden');
      document.getElementById('player-block-text').innerText = player.block;
    } else {
      pBlockBadge.classList.add('hidden');
    }

    this.renderStatuses(document.getElementById('player-status-bar'), player.status);

    // 4. Render Enemies
    this.renderEnemies(combat.enemies);

    // 5. Render Hand (Fanning Layout)
    this.renderHand(combat.hand, player);
  }

  renderStatuses(containerEl, statusObj) {
    containerEl.innerHTML = '';
    const icons = {
      strength: '⚔️',
      dexterity: '🛡️',
      vulnerable: '💔',
      weak: '📉',
      frail: '🪨',
      ritual: '🔥',
      thorns: '🌵',
      metallicize: '🔩',
      flame_barrier: '🔥',
      demon_form: '👿'
    };

    for (const [key, val] of Object.entries(statusObj)) {
      if (val > 0 && icons[key]) {
        const el = document.createElement('div');
        el.className = 'status-badge';
        el.innerHTML = `${icons[key]}<span class="status-val">${val}</span>`;
        el.title = `${key.toUpperCase()}: ${val}`;
        containerEl.appendChild(el);
      }
    }
  }

  renderEnemies(enemies) {
    this.enemiesContainer.innerHTML = '';

    enemies.forEach((e, idx) => {
      if (e.dead) return;

      const unitEl = document.createElement('div');
      unitEl.className = 'enemy-stage-unit';
      unitEl.dataset.enemyIndex = idx;

      // 1. Intent Badge
      const intentEl = document.createElement('div');
      intentEl.className = 'enemy-intent-badge';
      if (e.currentIntent) {
        intentEl.innerHTML = `<span>${e.currentIntent.icon}</span> <span>${e.currentIntent.damage !== undefined ? e.currentIntent.damage * (e.currentIntent.hits || 1) : e.currentIntent.name}</span>`;
        intentEl.title = e.currentIntent.desc;
      }

      // 2. Status Bar
      const statusEl = document.createElement('div');
      statusEl.className = 'unit-status-bar';
      this.renderStatuses(statusEl, e.status);

      // 3. Visual & Block
      const spriteBox = document.createElement('div');
      spriteBox.className = 'unit-sprite-box';
      spriteBox.innerHTML = `
        <div class="character-visual enemy-visual" style="border-color: ${e.type === 'boss' ? '#ef4444' : '#c69b4c'}">
          ${e.visual}
        </div>
        <div class="unit-block-badge ${e.block > 0 ? '' : 'hidden'}">
          <span class="shield-icon">🛡️</span>
          <span>${e.block}</span>
        </div>
      `;

      // 4. HP Bar
      const hpBox = document.createElement('div');
      hpBox.className = 'unit-hp-box';
      const ehpPct = Math.max(0, (e.hp / e.maxHp) * 100);
      hpBox.innerHTML = `
        <div class="hp-bar-outer">
          <div class="hp-ghost-fill" style="width: ${ehpPct}%"></div>
          <div class="hp-main-fill" style="width: ${ehpPct}%"></div>
          <div class="hp-bar-label">${e.hp} / ${e.maxHp}</div>
        </div>
      `;

      unitEl.appendChild(intentEl);
      unitEl.appendChild(statusEl);
      unitEl.appendChild(spriteBox);
      unitEl.appendChild(hpBox);

      // Click to target enemy
      unitEl.addEventListener('mouseup', () => {
        if (this.draggedCard) {
          this.executeCardOnEnemy(e);
        }
      });

      this.enemiesContainer.appendChild(unitEl);
    });
  }

  renderHand(hand, player) {
    this.handContainer.innerHTML = '';
    const total = hand.length;

    hand.forEach((card, idx) => {
      const cardEl = document.createElement('div');
      cardEl.className = `game-card card-${card.type} ${card.upgraded ? 'upgraded' : ''}`;
      cardEl.dataset.index = idx;

      // Fanning Math
      const mid = (total - 1) / 2;
      const angle = (idx - mid) * 4.5; // Rotate degrees
      const yOffset = Math.abs(idx - mid) * 7; // Arc curve

      cardEl.style.transform = `rotate(${angle}deg) translateY(${yOffset}px)`;
      cardEl.style.left = `${(idx / Math.max(1, total - 1)) * 75}%`;
      cardEl.style.zIndex = idx + 1;

      cardEl.innerHTML = `
        <div class="card-top-row">
          <div class="card-energy-badge">${card.cost === -1 ? 'X' : card.cost}</div>
          <div class="card-title">${card.name}</div>
        </div>
        <div class="card-art-box">${card.icon}</div>
        <div class="card-desc-box">${card.getFormattedDesc(player)}</div>
      `;

      // Dragging start
      cardEl.addEventListener('mousedown', (e) => {
        if (e.button === 0) {
          this.startCardDrag(card, idx, cardEl, e);
        }
      });

      this.handContainer.appendChild(cardEl);
    });
  }

  startCardDrag(card, index, cardEl, e) {
    this.draggedCard = card;
    this.draggedCardIndex = index;
    cardEl.classList.add('dragging');

    const rect = cardEl.getBoundingClientRect();
    this.cardOrigin = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };

    this.isTargeting = card.target === 'enemy';
  }

  renderTargetingArrow() {
    this.fxCtx.clearRect(0, 0, this.fxCanvas.width, this.fxCanvas.height);
    if (!this.draggedCard || !this.isTargeting) return;

    const startX = this.cardOrigin.x;
    const startY = this.cardOrigin.y;
    const endX = this.mousePos.x;
    const endY = this.mousePos.y;

    // Bezier Control Point (Curving upwards)
    const ctrlX = (startX + endX) / 2;
    const ctrlY = Math.min(startY, endY) - 150;

    // Draw Glowing Bezier Line
    this.fxCtx.save();
    this.fxCtx.strokeStyle = '#ef4444';
    this.fxCtx.lineWidth = 4;
    this.fxCtx.shadowColor = '#f87171';
    this.fxCtx.shadowBlur = 15;

    this.fxCtx.beginPath();
    this.fxCtx.moveTo(startX, startY);
    this.fxCtx.quadraticCurveTo(ctrlX, ctrlY, endX, endY);
    this.fxCtx.stroke();

    // Arrowhead Tip
    const angle = Math.atan2(endY - ctrlY, endX - ctrlX);
    this.fxCtx.fillStyle = '#f87171';
    this.fxCtx.beginPath();
    this.fxCtx.arc(endX, endY, 10, 0, Math.PI * 2);
    this.fxCtx.fill();

    this.fxCtx.restore();
  }

  handleCardDrop(e) {
    this.fxCtx.clearRect(0, 0, this.fxCanvas.width, this.fxCanvas.height);
    if (!this.draggedCard) return;

    const card = this.draggedCard;
    const idx = this.draggedCardIndex;

    // Non-targeted cards (Self / All Enemies / Power): play if dragged past upper half
    if (card.target !== 'enemy') {
      if (this.mousePos.y < window.innerHeight * 0.65) {
        window.game.combat.playCard(idx);
      }
    }

    this.draggedCard = null;
    this.draggedCardIndex = -1;
    this.isTargeting = false;
    this.updateCombatUI();
  }

  executeCardOnEnemy(enemy) {
    if (this.draggedCard && this.draggedCard.target === 'enemy') {
      window.game.combat.playCard(this.draggedCardIndex, enemy);
      this.draggedCard = null;
      this.draggedCardIndex = -1;
      this.isTargeting = false;
    }
  }

  openDeckModal(cards, title, onCardClick = null) {
    const modal = document.getElementById('deck-modal');
    document.getElementById('deck-modal-title').innerText = title;
    const grid = document.getElementById('deck-modal-grid');
    grid.innerHTML = '';

    cards.forEach((card, idx) => {
      const el = document.createElement('div');
      el.className = `game-card card-${card.type} ${card.upgraded ? 'upgraded' : ''}`;
      el.style.position = 'relative';
      el.style.transform = 'none';
      el.innerHTML = `
        <div class="card-top-row">
          <div class="card-energy-badge">${card.cost === -1 ? 'X' : card.cost}</div>
          <div class="card-title">${card.name}</div>
        </div>
        <div class="card-art-box">${card.icon}</div>
        <div class="card-desc-box">${card.getFormattedDesc(null)}</div>
      `;

      if (onCardClick) {
        el.style.cursor = 'pointer';
        el.addEventListener('click', () => {
          modal.classList.add('hidden');
          onCardClick(card, idx);
        });
      }

      grid.appendChild(el);
    });

    modal.classList.remove('hidden');
  }
}

window.uiManager = new UIManager();
