/* ==========================================================================
   SLAY THE ABYSS - MASTER GAME STATE ORCHESTRATOR
   ========================================================================== */

class SlayTheAbyssGame {
  constructor() {
    this.state = 'TITLE'; // 'TITLE', 'MAP', 'COMBAT', 'REWARD', 'REST', 'SHOP', 'GAME_OVER', 'VICTORY'
    this.map = new SpireMap(15);
    this.player = null;
    this.combat = null;

    this.setupUIBindings();
  }

  setupUIBindings() {
    // Title Buttons
    document.getElementById('btn-new-game').addEventListener('click', () => {
      window.soundEngine.init();
      window.soundEngine.startAmbient();
      this.startNewRun();
    });

    document.getElementById('btn-card-library').addEventListener('click', () => {
      const allCards = CARD_DATABASE.map(def => new Card(def));
      window.uiManager.openDeckModal(allCards, '카드 도감 (ALL CARDS LIBRARY)');
    });

    // Reward Screen Claim Button
    document.getElementById('btn-claim-rewards-continue').addEventListener('click', () => {
      this.showScreen('MAP');
      this.renderMap();
    });

    // Rest Site Buttons
    document.getElementById('btn-rest-heal').addEventListener('click', () => {
      const healAmt = Math.floor(this.player.maxHp * 0.3);
      this.player.heal(healAmt);
      window.soundEngine.playSFX('gold');
      window.uiManager.showNotice(`체력을 ${healAmt} 회복했습니다!`);
      this.showScreen('MAP');
      this.renderMap();
    });

    document.getElementById('btn-rest-smith').addEventListener('click', () => {
      const upgradable = this.player.deck.filter(c => !c.upgraded);
      if (upgradable.length === 0) {
        window.uiManager.showNotice('강화할 수 있는 카드가 없습니다!');
        return;
      }
      window.uiManager.openDeckModal(upgradable, '강화할 카드를 선택하십시오', (card) => {
        card.applyUpgrade();
        window.soundEngine.playSFX('block');
        window.uiManager.showNotice(`${card.name} 카드가 강화되었습니다!`);
        this.showScreen('MAP');
        this.renderMap();
      });
    });

    document.getElementById('btn-rest-toke').addEventListener('click', () => {
      window.uiManager.openDeckModal(this.player.deck, '제거할 카드를 선택하십시오', (card, idx) => {
        this.player.deck.splice(idx, 1);
        window.soundEngine.playSFX('debuff');
        window.uiManager.showNotice(`${card.name} 카드가 제거되었습니다!`);
        this.showScreen('MAP');
        this.renderMap();
      });
    });

    // Leave Shop Button
    document.getElementById('btn-leave-shop').addEventListener('click', () => {
      this.showScreen('MAP');
      this.renderMap();
    });

    // Shop Card Removal Service
    document.getElementById('btn-shop-remove-card').addEventListener('click', () => {
      const cost = 75;
      if (this.player.gold >= cost) {
        window.uiManager.openDeckModal(this.player.deck, '제거할 카드를 선택하십시오', (card, idx) => {
          this.player.gold -= cost;
          this.player.deck.splice(idx, 1);
          window.soundEngine.playSFX('debuff');
          document.getElementById('shop-player-gold').innerText = this.player.gold;
          window.uiManager.updateTopBar(this.player);
          window.uiManager.showNotice(`${card.name} 카드가 제거되었습니다!`);
        });
      } else {
        window.uiManager.showNotice('골드가 부족합니다!');
      }
    });

    // Restart Run Buttons
    document.getElementById('btn-restart-run').addEventListener('click', () => this.startNewRun());
    document.getElementById('btn-vic-restart').addEventListener('click', () => this.startNewRun());
  }

  showScreen(screenName) {
    this.state = screenName;
    const screens = ['title', 'map', 'combat', 'reward', 'rest', 'shop', 'gameover', 'victory'];
    screens.forEach(s => {
      const el = document.getElementById(`screen-${s}`);
      if (el) {
        if (s.toUpperCase() === screenName) {
          el.classList.remove('hidden');
          setTimeout(() => el.classList.add('active'), 10);
        } else {
          el.classList.remove('active');
          setTimeout(() => el.classList.add('hidden'), 350);
        }
      }
    });

    const topBar = document.getElementById('top-bar');
    if (screenName === 'TITLE') {
      topBar.classList.add('hidden');
    } else {
      topBar.classList.remove('hidden');
      window.uiManager.updateTopBar(this.player);
    }
  }

  startNewRun() {
    this.player = new Unit('아이언클래드 (Ironclad)', 80, '🛡️');
    this.player.gold = 99;
    this.player.deck = CardManager.getStarterDeck();
    this.player.relics = [RELIC_DATA.burning_blood];
    this.player.statsRecord = {
      kills: 0,
      cardsPlayed: 0,
      floorsCleared: 0
    };

    this.map.generate();
    this.showScreen('MAP');
    this.renderMap();
  }

  renderMap() {
    const container = document.getElementById('map-nodes-layer');
    const svg = document.getElementById('map-svg-lines');
    this.map.render(container, svg, (node) => this.handleNodeSelect(node));

    // Scroll to active node
    const viewport = document.getElementById('map-scroll-viewport');
    viewport.scrollTop = viewport.scrollHeight;
  }

  toggleMap() {
    if (this.state === 'MAP') {
      if (this.combat) this.showScreen('COMBAT');
    } else {
      this.showScreen('MAP');
      this.renderMap();
    }
  }

  handleNodeSelect(node) {
    this.player.statsRecord.floorsCleared++;
    const floorText = `ACT 1 - FLOOR ${node.floor + 1}`;
    window.uiManager.updateTopBar(this.player, floorText);

    if (node.type === 'monster') {
      const mobKeys = ['cultist', 'jaw_worm'];
      const chosen = mobKeys[Math.floor(Math.random() * mobKeys.length)];
      this.startCombat({ enemies: [chosen], isBoss: false });
    } else if (node.type === 'elite') {
      this.startCombat({ enemies: ['gremlin_nob'], isBoss: false });
    } else if (node.type === 'boss') {
      this.startCombat({ enemies: ['the_guardian'], isBoss: true });
    } else if (node.type === 'rest') {
      this.showRestSite();
    } else if (node.type === 'shop') {
      this.showShop();
    } else {
      // Unknown room (Mystery)
      const roll = Math.random();
      if (roll < 0.5) this.startCombat({ enemies: ['jaw_worm'], isBoss: false });
      else if (roll < 0.8) this.showShop();
      else this.showRestSite();
    }
  }

  startCombat(encounterDef) {
    this.showScreen('COMBAT');
    this.combat = new CombatEngine(
      this.player,
      encounterDef,
      (goldEarned) => this.handleCombatVictory(goldEarned, encounterDef.isBoss),
      () => this.handleCombatDefeat()
    );
  }

  handleCombatVictory(goldEarned, isBoss) {
    if (isBoss) {
      this.showVictoryScreen();
      return;
    }

    this.player.gold += goldEarned;
    window.uiManager.updateTopBar(this.player);

    this.showScreen('REWARD');
    const list = document.getElementById('reward-items-list');
    list.innerHTML = `
      <div class="reward-row-item">
        <span>🪙</span>
        <span>${goldEarned} Gold 획득</span>
      </div>
      <div class="reward-row-item" id="reward-pick-card-btn">
        <span>🃏</span>
        <span>새로운 카드 1장 선택 (CHOOSE CARD)</span>
      </div>
    `;

    document.getElementById('reward-pick-card-btn').addEventListener('click', () => {
      this.openCardRewardChoice();
    });
  }

  openCardRewardChoice() {
    const overlay = document.getElementById('card-choice-overlay');
    overlay.classList.remove('hidden');
    const grid = document.getElementById('card-choices-grid');
    grid.innerHTML = '';

    const options = CardManager.getRandomRewardCards(3);
    options.forEach(card => {
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

      el.addEventListener('click', () => {
        this.player.deck.push(card);
        window.soundEngine.playSFX('card_play');
        window.uiManager.showNotice(`${card.name} 카드를 덱에 추가했습니다!`);
        overlay.classList.add('hidden');
        document.getElementById('reward-pick-card-btn').style.opacity = '0.4';
        document.getElementById('reward-pick-card-btn').style.pointerEvents = 'none';
      });

      grid.appendChild(el);
    });

    document.getElementById('btn-skip-card-reward').onclick = () => {
      overlay.classList.add('hidden');
    };
  }

  showRestSite() {
    this.showScreen('REST');
    document.getElementById('rest-heal-amount').innerText = Math.floor(this.player.maxHp * 0.3);
  }

  showShop() {
    this.showScreen('SHOP');
    document.getElementById('shop-player-gold').innerText = this.player.gold;

    const cardsRow = document.getElementById('shop-cards-row');
    cardsRow.innerHTML = '';
    const shopCards = CardManager.getRandomRewardCards(4);

    shopCards.forEach(card => {
      const price = card.rarity === 'rare' ? 140 : (card.rarity === 'uncommon' ? 80 : 50);
      const wrap = document.createElement('div');
      wrap.className = 'shop-card-wrapper';
      wrap.innerHTML = `
        <div class="game-card card-${card.type}" style="position:relative; transform:none;">
          <div class="card-top-row">
            <div class="card-energy-badge">${card.cost === -1 ? 'X' : card.cost}</div>
            <div class="card-title">${card.name}</div>
          </div>
          <div class="card-art-box">${card.icon}</div>
          <div class="card-desc-box">${card.getFormattedDesc(null)}</div>
        </div>
        <div class="shop-price">🪙 ${price} Gold</div>
      `;

      wrap.addEventListener('click', () => {
        if (this.player.gold >= price) {
          this.player.gold -= price;
          this.player.deck.push(card);
          document.getElementById('shop-player-gold').innerText = this.player.gold;
          window.uiManager.updateTopBar(this.player);
          window.soundEngine.playSFX('gold');
          wrap.style.opacity = '0.3';
          wrap.style.pointerEvents = 'none';
          window.uiManager.showNotice(`${card.name} 카드를 구매했습니다!`);
        } else {
          window.uiManager.showNotice('골드가 부족합니다!');
        }
      });

      cardsRow.appendChild(wrap);
    });
  }

  handleCombatDefeat() {
    this.showScreen('GAMEOVER');
    document.getElementById('eg-floor').innerText = `Act 1 - Floor ${this.player.statsRecord.floorsCleared}`;
    document.getElementById('eg-kills').innerText = this.player.statsRecord.kills;
    document.getElementById('eg-cards-played').innerText = this.player.statsRecord.cardsPlayed;
    document.getElementById('eg-relics').innerText = this.player.relics.length;
    const score = this.player.statsRecord.kills * 80 + this.player.statsRecord.floorsCleared * 120 + this.player.gold * 2;
    document.getElementById('eg-score').innerText = `${score} PTS`;
  }

  showVictoryScreen() {
    this.showScreen('VICTORY');
    document.getElementById('vic-kills').innerText = this.player.statsRecord.kills;
    document.getElementById('vic-turns').innerText = this.player.statsRecord.cardsPlayed;
    const score = this.player.statsRecord.kills * 120 + 2000 + this.player.gold * 5;
    document.getElementById('vic-score').innerText = `${score} PTS`;
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.game = new SlayTheAbyssGame();
});
