/* ==========================================================================
   BALATRO WEB - SCORING SEQUENCE ENGINE (CHIPS × MULT)
   The iconic authentic step-by-step scoring animation & sound sequence
   ========================================================================== */

class ScoringEngine {
  constructor(game) {
    this.game = game;
    this.isScoring = false;
  }

  async runScoring(playedCards, targetScore, onComplete) {
    this.isScoring = true;
    const { game } = this;

    // 1. Evaluate Poker Hand
    const evalResult = PokerHandEvaluator.evaluate(playedCards);
    const handName = evalResult.handName;
    const scoringCards = evalResult.scoringCards;
    const handLvl = game.handLevels[handName] || 1;
    const baseStats = PokerHandEvaluator.HAND_BASE_STATS[handName] || { chips: 5, mult: 1, chipLvl: 10, multLvl: 1 };

    let chips = baseStats.chips + (handLvl - 1) * baseStats.chipLvl;
    let mult = baseStats.mult + (handLvl - 1) * baseStats.multLvl;

    // Show Scoring Banner
    const calcEl = document.getElementById('scoring-calculator');
    calcEl.classList.remove('hidden');
    document.getElementById('calc-hand-name').innerText = `${handName.toUpperCase()} (Lv.${handLvl})`;
    document.getElementById('calc-chips-val').innerText = chips;
    document.getElementById('calc-mult-val').innerText = mult;
    document.getElementById('calc-total-val').innerText = chips * mult;

    window.balatroAudio.playSFX('card_play');
    await this.sleep(400);

    // 2. Score Individual Played Cards
    let pitchTick = 0;
    for (const card of scoringCards) {
      const cardChips = card.getBaseChips();
      if (cardChips > 0) {
        chips += cardChips;
        document.getElementById('calc-chips-val').innerText = chips;
        document.getElementById('calc-total-val').innerText = chips * mult;
        window.balatroAudio.playSFX('chip_tick', pitchTick++);
        await this.sleep(180);
      }

      // Card Mult Enhancement
      if (card.enhancement === 'mult') {
        mult += 4;
        document.getElementById('calc-mult-val').innerText = mult;
        document.getElementById('calc-total-val').innerText = chips * mult;
        window.balatroAudio.playSFX('mult_add', pitchTick);
        await this.sleep(180);
      }

      // Glass Card
      if (card.enhancement === 'glass') {
        mult *= 2;
        document.getElementById('calc-mult-val').innerText = mult;
        document.getElementById('calc-total-val').innerText = chips * mult;
        window.balatroAudio.playSFX('mult_x');
        await this.sleep(220);
      }

      // Joker OnCardScored Triggers
      const ctx = {
        chips,
        mult,
        handName,
        triggerJokerAnim: (jokerId, text) => {
          window.balatroAudio.playSFX('mult_add', pitchTick++);
        }
      };

      for (const j of game.jokers) {
        if (j.onCardScored) {
          j.onCardScored(card, ctx);
          chips = ctx.chips;
          mult = ctx.mult;
          document.getElementById('calc-chips-val').innerText = chips;
          document.getElementById('calc-mult-val').innerText = mult;
          document.getElementById('calc-total-val').innerText = chips * mult;
          await this.sleep(150);
        }
      }
    }

    // 3. Held in Hand Cards (Steel Cards)
    for (const card of game.hand) {
      if (card.enhancement === 'steel') {
        mult = Math.floor(mult * 1.5);
        document.getElementById('calc-mult-val').innerText = mult;
        document.getElementById('calc-total-val').innerText = chips * mult;
        window.balatroAudio.playSFX('mult_x');
        await this.sleep(200);
      }
    }

    // 4. Trigger Jokers Left-to-Right
    const jokerCtx = {
      chips,
      mult,
      handName,
      playedCardsCount: playedCards.length,
      remainingDiscards: game.discardsRemaining,
      money: game.money,
      handsPlayedThisRoundHistory: game.handsPlayedThisRoundHistory,
      destroyJoker: (id) => game.destroyJoker(id),
      enableCavendish: () => game.cavendishUnlocked = true,
      jokers: game.jokers,
      triggerJokerAnim: (jokerId, text) => {
        window.balatroAudio.playSFX('mult_add', pitchTick++);
      }
    };

    for (let i = 0; i < game.jokers.length; i++) {
      const j = game.jokers[i];
      if (j.onHandScored) {
        j.onHandScored(jokerCtx, i);
        chips = jokerCtx.chips;
        mult = jokerCtx.mult;
        document.getElementById('calc-chips-val').innerText = chips;
        document.getElementById('calc-mult-val').innerText = mult;
        document.getElementById('calc-total-val').innerText = chips * mult;
        await this.sleep(220);
      }

      // Joker Editions (Foil, Holo, Poly)
      if (j.edition === 'foil') {
        chips += 50;
        document.getElementById('calc-chips-val').innerText = chips;
        document.getElementById('calc-total-val').innerText = chips * mult;
        window.balatroAudio.playSFX('chip_tick', pitchTick++);
        await this.sleep(150);
      } else if (j.edition === 'holo') {
        mult += 10;
        document.getElementById('calc-mult-val').innerText = mult;
        document.getElementById('calc-total-val').innerText = chips * mult;
        window.balatroAudio.playSFX('mult_add', pitchTick++);
        await this.sleep(150);
      } else if (j.edition === 'polychrome') {
        mult = Math.floor(mult * 1.5);
        document.getElementById('calc-mult-val').innerText = mult;
        document.getElementById('calc-total-val').innerText = chips * mult;
        window.balatroAudio.playSFX('mult_x');
        await this.sleep(200);
      }
    }

    // 5. Final Hand Total
    const finalHandScore = Math.floor(chips * mult);
    game.roundScore += finalHandScore;
    game.handsPlayedThisRoundHistory.push(handName);

    // Update Round Score UI
    document.getElementById('sb-current-score').innerText = game.roundScore;
    const progPct = Math.min(100, (game.roundScore / targetScore) * 100);
    document.getElementById('sb-score-fill').style.width = `${progPct}%`;

    await this.sleep(600);
    calcEl.classList.add('hidden');
    this.isScoring = false;

    onComplete(game.roundScore >= targetScore);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

window.ScoringEngine = ScoringEngine;
