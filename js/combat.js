/* ==========================================================================
   SLAY THE ABYSS - COMBAT TURN ENGINE & RESOLUTION
   ========================================================================== */

class CombatEngine {
  constructor(player, encounterDef, onVictory, onDefeat) {
    this.player = player;
    this.encounterDef = encounterDef;
    this.onVictory = onVictory;
    this.onDefeat = onDefeat;

    this.enemies = [];
    this.drawPile = [];
    this.hand = [];
    this.discardPile = [];
    this.exhaustPile = [];

    this.turn = 1;
    this.energy = 3;
    this.maxEnergy = 3;
    this.isPlayerTurn = true;
    this.cardsPlayedThisTurn = 0;

    this.initEncounter();
  }

  initEncounter() {
    // 1. Instantiate Enemies
    this.encounterDef.enemies.forEach(key => {
      const def = ENEMY_DATABASE[key] || ENEMY_DATABASE.cultist;
      this.enemies.push(new EnemyUnit(def));
    });

    // 2. Prepare Deck (Shuffle)
    this.drawPile = [...this.player.deck];
    this.shuffle(this.drawPile);
    this.hand = [];
    this.discardPile = [];
    this.exhaustPile = [];

    // 3. Relic Combat Start Triggers
    this.player.relics.forEach(r => {
      if (r.onBattleStart) r.onBattleStart(this.player, this, this.encounterDef.isBoss);
    });

    // 4. Start Turn 1
    this.startPlayerTurn();
  }

  shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  gainEnergy(amount) {
    this.energy = Math.min(9, this.energy + amount);
    window.soundEngine.playSFX('buff');
  }

  startPlayerTurn() {
    this.isPlayerTurn = true;
    this.cardsPlayedThisTurn = 0;

    // 1. Clear Block (unless Barricade)
    if (!this.player.hasBarricade) {
      this.player.block = 0;
    }

    // 2. Reset Energy
    const retainsEnergy = this.player.relics.some(r => r.id === 'ice_cream');
    if (!retainsEnergy) {
      this.energy = this.maxEnergy;
    } else {
      this.energy += this.maxEnergy;
    }

    // 3. Process Player Turn Start Powers / Statuses
    if (this.player.status.demon_form > 0) {
      this.player.addStatus('strength', this.player.status.demon_form);
    }
    if (this.player.status.metallicize > 0) {
      this.player.addBlock(this.player.status.metallicize);
    }

    // Clear 1-turn debuffs/buffs
    if (this.player.status.no_draw > 0) this.player.status.no_draw = 0;
    if (this.player.status.flame_barrier > 0) this.player.status.flame_barrier = 0;

    // 4. Draw Hand (5 Cards)
    this.drawCards(5);

    // 5. Enemies plan their moves
    this.enemies.forEach(e => {
      if (!e.dead) e.planNextMove(this.turn);
    });

    window.uiManager.updateCombatUI();
  }

  drawCards(count) {
    if (this.player.status.no_draw > 0) return;

    for (let i = 0; i < count; i++) {
      if (this.hand.length >= 10) break; // Hand limit 10

      if (this.drawPile.length === 0) {
        if (this.discardPile.length === 0) break;
        // Shuffle discard into draw
        this.drawPile = [...this.discardPile];
        this.discardPile = [];
        this.shuffle(this.drawPile);

        // Relic onShuffle
        this.player.relics.forEach(r => {
          if (r.onShuffle) r.onShuffle(this.player, this);
        });
      }

      const card = this.drawPile.pop();
      this.hand.push(card);
      window.soundEngine.playSFX('card_draw');
    }
  }

  playCard(cardIndex, targetEnemy = null) {
    if (!this.isPlayerTurn) return false;
    const card = this.hand[cardIndex];
    if (!card) return false;

    // Energy check
    const cost = card.cost === -1 ? this.energy : card.cost;
    if (this.energy < cost) {
      window.uiManager.showNotice('에너지가 부족합니다!');
      return false;
    }

    // Target check
    if (card.target === 'enemy' && (!targetEnemy || targetEnemy.dead)) {
      window.uiManager.showNotice('대상을 선택하십시오!');
      return false;
    }

    // Deduct Energy
    if (card.cost === -1) {
      // X cost handled inside card play
    } else {
      this.energy -= card.cost;
    }

    // Remove from Hand
    this.hand.splice(cardIndex, 1);
    this.cardsPlayedThisTurn++;
    this.player.statsRecord.cardsPlayed++;

    window.soundEngine.playSFX('card_play');

    // Execute Card Effect
    card.play(card, this.player, targetEnemy, this);

    // Gremlin Nob Enrage on Skill
    if (card.type === 'skill') {
      this.enemies.forEach(e => {
        if (!e.dead && e.enrageOnSkill) {
          e.addStatus('strength', 2);
          window.uiManager.showNotice('그렘린 노브가 분노합니다! (+2 힘)');
        }
      });
    }

    // Handle Exhaust / Discard
    if (card.exhaust) {
      this.exhaustPile.push(card);
      this.player.relics.forEach(r => {
        if (r.onExhaustCard) r.onExhaustCard(this.player, this);
      });
    } else {
      this.discardPile.push(card);
    }

    // Check Victory
    if (this.checkEnemiesDead()) {
      this.endCombat(true);
      return true;
    }

    window.uiManager.updateCombatUI();
    return true;
  }

  upgradeHandCards(all = false) {
    if (all) {
      this.hand.forEach(c => { if (!c.upgraded) c.applyUpgrade(); });
    } else if (this.hand.length > 0) {
      const upgradable = this.hand.filter(c => !c.upgraded);
      if (upgradable.length > 0) {
        upgradable[Math.floor(Math.random() * upgradable.length)].applyUpgrade();
      }
    }
  }

  addRandomCardToHand() {
    if (this.hand.length >= 10) return;
    const randomCard = CardManager.getRandomRewardCards(1)[0];
    this.hand.push(randomCard);
    window.soundEngine.playSFX('card_draw');
  }

  endTurn() {
    if (!this.isPlayerTurn) return;
    this.isPlayerTurn = false;

    // 1. Discard Remaining Hand (Ethereal exhaust)
    for (let i = this.hand.length - 1; i >= 0; i--) {
      const c = this.hand[i];
      if (c.ethereal) {
        this.exhaustPile.push(c);
      } else {
        this.discardPile.push(c);
      }
    }
    this.hand = [];

    // 2. Player Turn End Relic/Power Triggers
    if (this.player.status.metallicize > 0) {
      this.player.addBlock(this.player.status.metallicize);
    }

    // Decrement player status durations
    if (this.player.status.vulnerable > 0) this.player.status.vulnerable--;
    if (this.player.status.weak > 0) this.player.status.weak--;
    if (this.player.status.frail > 0) this.player.status.frail--;

    window.uiManager.updateCombatUI();

    // 3. Enemy Turn Execution
    setTimeout(() => this.executeEnemyTurn(), 500);
  }

  executeEnemyTurn() {
    let delay = 0;
    const aliveEnemies = this.enemies.filter(e => !e.dead);

    aliveEnemies.forEach((e, idx) => {
      setTimeout(() => {
        if (!e.dead) {
          // Clear enemy block
          e.block = 0;

          // Ritual strength buff
          if (e.status.ritual > 0) {
            e.addStatus('strength', e.status.ritual);
          }

          // Execute Move
          e.executeMove(this.player, this);

          // Decrement enemy status durations
          if (e.status.vulnerable > 0) e.status.vulnerable--;
          if (e.status.weak > 0) e.status.weak--;

          window.uiManager.updateCombatUI();

          // Check Player Death
          if (this.player.hp <= 0) {
            this.endCombat(false);
            return;
          }
        }

        // When last enemy completes move, start next player turn
        if (idx === aliveEnemies.length - 1) {
          setTimeout(() => {
            this.turn++;
            this.startPlayerTurn();
          }, 600);
        }
      }, delay);

      delay += 800;
    });

    if (aliveEnemies.length === 0) {
      this.endCombat(true);
    }
  }

  checkEnemiesDead() {
    return this.enemies.every(e => e.dead);
  }

  endCombat(won) {
    if (won) {
      window.soundEngine.playSFX('victory');
      this.player.statsRecord.kills += this.enemies.length;

      // Relic Victory Triggers
      this.player.relics.forEach(r => {
        if (r.onBattleEnd) r.onBattleEnd(this.player);
      });

      // Calculate Gold Reward
      let totalGold = 0;
      this.enemies.forEach(e => totalGold += e.goldReward);

      this.onVictory(totalGold);
    } else {
      this.onDefeat();
    }
  }
}

window.CombatEngine = CombatEngine;
