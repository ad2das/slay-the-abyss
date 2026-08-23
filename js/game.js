/* ==========================================================================
   BALATRO WEB - MASTER GAME LOOP & STATE ORCHESTRATOR
   ========================================================================== */

class BalatroGame {
  constructor() {
    this.deck = [];
    this.drawPile = [];
    this.hand = [];
    this.discardPile = [];
    this.selectedCards = new Set();
    
    this.jokers = [];
    this.consumables = [];
    
    this.ante = 1;
    this.round = 1;
    this.money = 4;
    
    this.handsRemaining = 4;
    this.discardsRemaining = 3;
    this.handSize = 8;
    this.roundScore = 0;
    this.targetScore = 300;
    this.currentBlindType = 'small';
    this.currentBlindData = null;

    this.handLevels = {};
    Object.keys(PokerHandEvaluator.HAND_BASE_STATS).forEach(h => this.handLevels[h] = 1);
    this.handsPlayedThisRoundHistory = [];
    
    this.scoringEngine = new ScoringEngine(this);
    this.shopRerollCost = 5;

    this.setupInputs();
    this.startNewGame();
  }

  startNewGame() {
    window.balatroAudio.init();
    window.balatroAudio.startLoFiBGM();

    this.deck = DeckManager.createStandardDeck();
    this.jokers = [
      new JokerInstance(JOKER_DATABASE.find(j => j.id === 'joker'))
    ];
    this.consumables = [];
    this.ante = 1;
    this.round = 1;
    this.money = 4;
    this.shopRerollCost = 5;

    this.showBlindSelect();
  }

  showBlindSelect() {
    const modal = document.getElementById('screen-blind-select');
    modal.classList.add('active');
    document.getElementById('bs-ante-num').innerText = this.ante;

    // Small Blind
    const smallData = BlindManager.getBlindData(this.ante, 'small');
    document.getElementById('bc-small-score').innerText = smallData.score;

    // Big Blind
    const bigData = BlindManager.getBlindData(this.ante, 'big');
    document.getElementById('bc-big-score').innerText = bigData.score;

    // Boss Blind
    const bossData = BlindManager.getBlindData(this.ante, 'boss');
    document.getElementById('bc-boss-score').innerText = bossData.score;
    document.getElementById('bc-boss-name').innerText = bossData.bossData.name;
    document.getElementById('bc-boss-desc').innerText = bossData.bossData.desc;
    document.getElementById('bc-boss-icon').innerText = bossData.bossData.icon;
  }

  startRound(blindType) {
    this.currentBlindType = blindType;
    this.currentBlindData = BlindManager.getBlindData(this.ante, blindType);
    this.targetScore = this.currentBlindData.score;
    this.roundScore = 0;
    this.handsRemaining = 4;
    this.discardsRemaining = 3;
    this.handsPlayedThisRoundHistory = [];
    this.selectedCards.clear();

    // Close Blind Select Modal
    document.getElementById('screen-blind-select').classList.remove('active');

    // Update Left Sidebar
    document.getElementById('sb-blind-name').innerText = this.currentBlindData.name.toUpperCase();
    document.getElementById('sb-target-score').innerText = this.targetScore;
    document.getElementById('sb-blind-reward').innerText = `$${this.currentBlindData.reward}`;
    document.getElementById('sb-current-score').innerText = '0';
    document.getElementById('sb-score-fill').style.width = '0%';
    document.getElementById('sb-ante-text').innerText = `${this.ante} / 8`;
    document.getElementById('sb-round-text').innerText = this.round;
    document.getElementById('sb-money-text').innerText = `$${this.money}`;

    // Boss debuff tag
    const debuffEl = document.getElementById('sb-boss-debuff');
    if (this.currentBlindData.bossData) {
      debuffEl.classList.remove('hidden');
      debuffEl.innerText = this.currentBlindData.bossData.desc;
    } else {
      debuffEl.classList.add('hidden');
    }

    // Reset deck cards & shuffle
    this.drawPile = [...this.deck];
    this.drawPile.forEach(c => {
      c.debuffed = false;
      if (this.currentBlindData.bossData && this.currentBlindData.bossData.applyDebuff) {
        this.currentBlindData.bossData.applyDebuff(c);
      }
    });
    this.shuffle(this.drawPile);
    this.hand = [];
    this.discardPile = [];

    // Draw Starting Hand (8 Cards)
    this.drawCards(this.handSize);
    this.updateHUD();
  }

  shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  drawCards(count) {
    for (let i = 0; i < count; i++) {
      if (this.hand.length >= this.handSize) break;
      if (this.drawPile.length === 0) break;

      const card = this.drawPile.pop();
      this.hand.push(card);
      window.balatroAudio.playSFX('card_draw');
    }
    this.renderHand();
  }

  setupInputs() {
    // Play Hand Button
    document.getElementById('btn-play-hand').addEventListener('click', () => {
      this.playSelectedHand();
    });

    // Discard Button
    document.getElementById('btn-discard-hand').addEventListener('click', () => {
      this.discardSelectedCards();
    });

    // Sort by Rank
    document.getElementById('btn-sort-rank').addEventListener('click', () => {
      this.hand.sort((a, b) => (RANK_ORDERS[b.rank] || 0) - (RANK_ORDERS[a.rank] || 0));
      this.renderHand();
      window.balatroAudio.playSFX('card_select');
    });

    // Sort by Suit
    document.getElementById('btn-sort-suit').addEventListener('click', () => {
      this.hand.sort((a, b) => a.suit.localeCompare(b.suit));
      this.renderHand();
      window.balatroAudio.playSFX('card_select');
    });

    // Select Blind Buttons
    document.querySelectorAll('.btn-select-blind').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.blind;
        this.startRound(type);
      });
    });

    // Skip Blind Buttons
    document.querySelectorAll('.btn-skip-blind').forEach(btn => {
      btn.addEventListener('click', () => {
        window.balatroAudio.playSFX('buy_item');
        this.money += 5;
        this.startRound('boss');
      });
    });

    // Shop Reroll
    document.getElementById('btn-reroll-shop').addEventListener('click', () => {
      if (this.money >= this.shopRerollCost) {
        this.money -= this.shopRerollCost;
        this.shopRerollCost += 1;
        window.balatroAudio.playSFX('buy_item');
        this.populateShop();
      }
    });

    // Shop Next Round
    document.getElementById('btn-next-round').addEventListener('click', () => {
      document.getElementById('screen-shop').classList.remove('active');
      if (this.currentBlindType === 'boss') {
        this.ante++;
        if (this.ante > 8) {
          this.triggerGameEnd(true);
          return;
        }
      }
      this.round++;
      this.showBlindSelect();
    });

    // Play Again Button
    document.getElementById('btn-play-again').addEventListener('click', () => {
      document.getElementById('screen-game-end').classList.remove('active');
      this.startNewGame();
    });

    // View Deck Button
    document.getElementById('btn-view-deck').addEventListener('click', () => {
      this.openDeckViewer();
    });
    document.getElementById('btn-close-deck-view').addEventListener('click', () => {
      document.getElementById('screen-deck-view').classList.remove('active');
    });
  }

  renderHand() {
    const container = document.getElementById('cards-hand-container');
    container.innerHTML = '';
    const total = this.hand.length;

    this.hand.forEach((card, idx) => {
      const el = document.createElement('div');
      el.className = `playing-card suit-${card.suit} enh-${card.enhancement} ${this.selectedCards.has(card) ? 'selected' : ''}`;
      
      // Dynamic fanning layout
      const mid = (total - 1) / 2;
      const angle = (idx - mid) * 3.5;
      const yOffset = Math.abs(idx - mid) * 6;
      el.style.left = `${(idx / Math.max(1, total - 1)) * 75}%`;
      el.style.transform = `rotate(${angle}deg) translateY(${yOffset}px)`;
      el.style.zIndex = idx + 1;

      el.innerHTML = `
        <div class="card-corner top-corner">
          <div class="card-rank">${card.rank}</div>
          <div class="card-suit-mini">${SUIT_SYMBOLS[card.suit]}</div>
        </div>
        <div class="card-center-art">${SUIT_SYMBOLS[card.suit]}</div>
        <div class="card-corner bottom-corner">
          <div class="card-rank">${card.rank}</div>
          <div class="card-suit-mini">${SUIT_SYMBOLS[card.suit]}</div>
        </div>
      `;

      el.addEventListener('click', () => {
        if (this.scoringEngine.isScoring) return;

        if (this.selectedCards.has(card)) {
          this.selectedCards.delete(card);
        } else {
          if (this.selectedCards.size < 5) {
            this.selectedCards.add(card);
          }
        }
        window.balatroAudio.playSFX('card_select');
        this.renderHand();
        this.updateSelectedPreview();
      });

      container.appendChild(el);
    });

    document.getElementById('deck-remain-count').innerText = this.drawPile.length;
    this.updateSelectedPreview();
  }

  updateSelectedPreview() {
    const selected = Array.from(this.selectedCards);
    const evalResult = PokerHandEvaluator.evaluate(selected);
    const handLvl = this.handLevels[evalResult.handName] || 1;
    document.getElementById('detected-hand-label').innerText = `${evalResult.handName.toUpperCase()} (Lv.${handLvl})`;

    document.getElementById('play-hand-sub').innerText = `(${selected.length}/5 CARDS)`;
    document.getElementById('discard-hand-sub').innerText = `(${selected.length}/5)`;
  }

  async playSelectedHand() {
    if (this.scoringEngine.isScoring || this.selectedCards.size === 0 || this.handsRemaining <= 0) return;

    const played = Array.from(this.selectedCards);
    this.handsRemaining--;
    this.selectedCards.clear();

    // Remove played cards from hand and display in scoring arena
    this.hand = this.hand.filter(c => !played.includes(c));
    this.renderPlayedCards(played);
    this.renderHand();
    this.updateHUD();

    // Boss blind OnHandPlayed hook (e.g. The Hook discards 2 cards)
    if (this.currentBlindData.bossData && this.currentBlindData.bossData.onHandPlayed) {
      this.currentBlindData.bossData.onHandPlayed(this);
      this.renderHand();
    }

    // Run Scoring Engine
    await this.scoringEngine.runScoring(played, this.targetScore, (won) => {
      document.getElementById('played-cards-holder').innerHTML = '';

      if (won) {
        window.balatroAudio.playSFX('blind_defeat');
        // Earn Money: Blind Reward + Remaining Hands as Interest
        const earned = this.currentBlindData.reward + this.handsRemaining;
        this.money += earned;
        this.openShop();
      } else {
        if (this.handsRemaining <= 0) {
          this.triggerGameEnd(false);
        } else {
          // Draw cards back up to hand size
          this.drawCards(this.handSize - this.hand.length);
        }
      }
    });
  }

  renderPlayedCards(cards) {
    const holder = document.getElementById('played-cards-holder');
    holder.innerHTML = '';
    cards.forEach(card => {
      const el = document.createElement('div');
      el.className = `playing-card suit-${card.suit} enh-${card.enhancement}`;
      el.style.position = 'relative';
      el.style.transform = 'none';
      el.innerHTML = `
        <div class="card-corner top-corner">
          <div class="card-rank">${card.rank}</div>
          <div class="card-suit-mini">${SUIT_SYMBOLS[card.suit]}</div>
        </div>
        <div class="card-center-art">${SUIT_SYMBOLS[card.suit]}</div>
        <div class="card-corner bottom-corner">
          <div class="card-rank">${card.rank}</div>
          <div class="card-suit-mini">${SUIT_SYMBOLS[card.suit]}</div>
        </div>
      `;
      holder.appendChild(el);
    });
  }

  discardSelectedCards() {
    if (this.scoringEngine.isScoring || this.selectedCards.size === 0 || this.discardsRemaining <= 0) return;

    const count = this.selectedCards.size;
    this.hand = this.hand.filter(c => !this.selectedCards.has(c));
    this.selectedCards.clear();
    this.discardsRemaining--;

    window.balatroAudio.playSFX('card_play');
    this.drawCards(count);
    this.updateHUD();
  }

  updateHUD() {
    document.getElementById('sb-hands-count').innerText = this.handsRemaining;
    document.getElementById('sb-discards-count').innerText = this.discardsRemaining;
    document.getElementById('sb-money-text').innerText = `$${this.money}`;
    document.getElementById('joker-count-text').innerText = `${this.jokers.length}/5`;
    document.getElementById('consumable-count-text').innerText = `${this.consumables.length}/2`;

    this.renderTopDocks();
  }

  renderTopDocks() {
    // 1. Jokers Dock
    const jRow = document.getElementById('jokers-row');
    jRow.innerHTML = '';
    this.jokers.forEach(j => {
      const el = document.createElement('div');
      el.className = `joker-card edition-${j.edition}`;
      el.innerHTML = `
        <div class="joker-sprite-icon">${j.icon}</div>
        <div class="joker-title-mini">${j.name}</div>
        <div class="joker-cost-badge">$${j.cost}</div>
      `;
      el.title = `${j.name}: ${j.desc}`;
      jRow.appendChild(el);
    });

    // 2. Consumables Dock
    const cRow = document.getElementById('consumables-row');
    cRow.innerHTML = '';
    this.consumables.forEach((c, idx) => {
      const el = document.createElement('div');
      el.className = `joker-card`;
      el.innerHTML = `
        <div class="joker-sprite-icon">${c.icon}</div>
        <div class="joker-title-mini">${c.name}</div>
        <div class="joker-cost-badge">USE</div>
      `;
      el.title = `${c.name}: ${c.desc}`;
      el.addEventListener('click', () => {
        this.useConsumable(idx);
      });
      cRow.appendChild(el);
    });
  }

  useConsumable(index) {
    const item = this.consumables[index];
    if (!item) return;

    const selected = Array.from(this.selectedCards);
    if (item.type === 'tarot') {
      item.use(selected, this);
      window.balatroAudio.playSFX('buy_item');
      this.consumables.splice(index, 1);
      this.renderHand();
      this.updateHUD();
    } else if (item.type === 'planet') {
      if (this.handLevels[item.handTarget] !== undefined) {
        this.handLevels[item.handTarget]++;
        window.balatroAudio.playSFX('mult_x');
        this.consumables.splice(index, 1);
        this.updateHUD();
      }
    }
  }

  openShop() {
    const modal = document.getElementById('screen-shop');
    modal.classList.add('active');
    document.getElementById('shop-money-val').innerText = `$${this.money}`;
    document.getElementById('shop-reroll-cost').innerText = `($${this.shopRerollCost})`;

    this.populateShop();
  }

  populateShop() {
    // 1. Cards Shelf (2 Jokers + 1 Tarot/Planet)
    const cardsRow = document.getElementById('shop-cards-row');
    cardsRow.innerHTML = '';

    for (let i = 0; i < 2; i++) {
      const randomJokerDef = JOKER_DATABASE[Math.floor(Math.random() * JOKER_DATABASE.length)];
      const jokerInst = new JokerInstance(randomJokerDef);
      
      const el = document.createElement('div');
      el.className = `joker-card`;
      el.style.width = '100px';
      el.style.height = '130px';
      el.innerHTML = `
        <div class="joker-sprite-icon" style="font-size:42px;">${jokerInst.icon}</div>
        <div class="joker-title-mini">${jokerInst.name}</div>
        <div class="joker-cost-badge" style="font-size:10px;">$${jokerInst.cost}</div>
      `;

      el.addEventListener('click', () => {
        if (this.money >= jokerInst.cost && this.jokers.length < 5) {
          this.money -= jokerInst.cost;
          this.jokers.push(jokerInst);
          window.balatroAudio.playSFX('buy_item');
          el.style.opacity = '0.3';
          el.style.pointerEvents = 'none';
          document.getElementById('shop-money-val').innerText = `$${this.money}`;
          this.updateHUD();
        }
      });

      cardsRow.appendChild(el);
    }

    // 2. Packs Shelf (Buffoon Pack & Arcana Pack)
    const packsRow = document.getElementById('shop-packs-row');
    packsRow.innerHTML = `
      <div class="joker-card" id="btn-buy-buffoon" style="width:130px; height:130px; border-color:#a855f7;">
        <div style="font-size:42px;">🃏</div>
        <div class="joker-title-mini">BUFFOON PACK</div>
        <div class="joker-cost-badge" style="font-size:10px;">$4</div>
      </div>
      <div class="joker-card" id="btn-buy-arcana" style="width:130px; height:130px; border-color:#38bdf8;">
        <div style="font-size:42px;">🔮</div>
        <div class="joker-title-mini">ARCANA PACK</div>
        <div class="joker-cost-badge" style="font-size:10px;">$4</div>
      </div>
    `;

    document.getElementById('btn-buy-buffoon').addEventListener('click', () => {
      if (this.money >= 4) {
        this.money -= 4;
        this.openBoosterPack('buffoon');
      }
    });

    document.getElementById('btn-buy-arcana').addEventListener('click', () => {
      if (this.money >= 4) {
        this.money -= 4;
        this.openBoosterPack('arcana');
      }
    });
  }

  openBoosterPack(type) {
    const modal = document.getElementById('screen-pack-open');
    modal.classList.add('active');
    const container = document.getElementById('pack-cards-container');
    container.innerHTML = '';

    if (type === 'buffoon') {
      document.getElementById('pack-open-title').innerText = 'BUFFOON PACK';
      for (let i = 0; i < 2; i++) {
        const jDef = JOKER_DATABASE[Math.floor(Math.random() * JOKER_DATABASE.length)];
        const jInst = new JokerInstance(jDef);
        const el = document.createElement('div');
        el.className = 'joker-card';
        el.style.width = '120px';
        el.style.height = '160px';
        el.innerHTML = `
          <div style="font-size:48px;">${jInst.icon}</div>
          <div class="joker-title-mini" style="font-size:16px;">${jInst.name}</div>
          <p style="font-size:10px; color:#cbd5e1; text-align:center;">${jInst.desc}</p>
        `;
        el.addEventListener('click', () => {
          if (this.jokers.length < 5) {
            this.jokers.push(jInst);
            window.balatroAudio.playSFX('buy_item');
            modal.classList.remove('active');
            this.updateHUD();
          }
        });
        container.appendChild(el);
      }
    } else {
      document.getElementById('pack-open-title').innerText = 'ARCANA PACK';
      for (let i = 0; i < 3; i++) {
        const tDef = TAROT_CARDS[Math.floor(Math.random() * TAROT_CARDS.length)];
        const el = document.createElement('div');
        el.className = 'joker-card';
        el.style.width = '120px';
        el.style.height = '160px';
        el.innerHTML = `
          <div style="font-size:48px;">${tDef.icon}</div>
          <div class="joker-title-mini" style="font-size:16px;">${tDef.name}</div>
          <p style="font-size:10px; color:#cbd5e1; text-align:center;">${tDef.desc}</p>
        `;
        el.addEventListener('click', () => {
          if (this.consumables.length < 2) {
            this.consumables.push(tDef);
            window.balatroAudio.playSFX('buy_item');
            modal.classList.remove('active');
            this.updateHUD();
          }
        });
        container.appendChild(el);
      }
    }

    document.getElementById('btn-skip-pack').onclick = () => {
      modal.classList.remove('active');
    };
  }

  openDeckViewer() {
    const modal = document.getElementById('screen-deck-view');
    modal.classList.add('active');
    document.getElementById('dv-card-count').innerText = this.deck.length;

    const grid = document.getElementById('deck-view-grid');
    grid.innerHTML = '';
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(90px, 1fr))';
    grid.style.gap = '10px';

    this.deck.forEach(card => {
      const el = document.createElement('div');
      el.className = `playing-card suit-${card.suit} enh-${card.enhancement}`;
      el.style.position = 'relative';
      el.style.transform = 'none';
      el.style.width = '90px';
      el.style.height = '130px';
      el.innerHTML = `
        <div class="card-corner top-corner">
          <div class="card-rank">${card.rank}</div>
          <div class="card-suit-mini">${SUIT_SYMBOLS[card.suit]}</div>
        </div>
        <div class="card-center-art">${SUIT_SYMBOLS[card.suit]}</div>
        <div class="card-corner bottom-corner">
          <div class="card-rank">${card.rank}</div>
          <div class="card-suit-mini">${SUIT_SYMBOLS[card.suit]}</div>
        </div>
      `;
      grid.appendChild(el);
    });
  }

  destroyJoker(jokerId) {
    this.jokers = this.jokers.filter(j => j.id !== jokerId);
    this.updateHUD();
  }

  triggerGameEnd(victory) {
    const modal = document.getElementById('screen-game-end');
    modal.classList.add('active');

    const titleEl = document.getElementById('end-title');
    if (victory) {
      titleEl.className = 'end-title-victory';
      titleEl.innerText = 'VICTORY! (ANTE 8 CONQUERED)';
      document.getElementById('end-subtitle').innerText = '발라트로 첨탑의 모든 블라인드를 완벽하게 지배했습니다!';
    } else {
      titleEl.className = 'end-title-defeat';
      titleEl.innerText = 'GAME OVER';
      document.getElementById('end-subtitle').innerText = '블라인드 목표 점수를 달성하지 못했습니다.';
    }

    document.getElementById('end-ante-text').innerText = `Ante ${this.ante}`;
    document.getElementById('end-rounds-text').innerText = this.round;
    document.getElementById('end-best-hand-text').innerText = this.roundScore;
    document.getElementById('end-jokers-text').innerText = this.jokers.length;
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.game = new BalatroGame();
});
