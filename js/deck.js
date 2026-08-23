/* ==========================================================================
   BALATRO WEB - DECK ENGINE, ENHANCEMENTS, AND POKER HAND EVALUATOR
   ========================================================================== */

const SUITS = ['spades', 'hearts', 'clubs', 'diamonds'];
const SUIT_SYMBOLS = { spades: '♠', hearts: '♥', clubs: '♣', diamonds: '♦' };
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const RANK_VALUES = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
  'J': 10, 'Q': 10, 'K': 10, 'A': 11
};
const RANK_ORDERS = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
  'J': 11, 'Q': 12, 'K': 13, 'A': 14
};

class Card {
  constructor(rank, suit, enhancement = 'none', edition = 'base', seal = 'none') {
    this.id = `${rank}_${suit}_${Math.random().toString(36).substr(2, 6)}`;
    this.rank = rank;
    this.suit = suit;
    this.enhancement = enhancement; // 'none', 'bonus', 'mult', 'wild', 'glass', 'steel', 'stone', 'gold', 'lucky'
    this.edition = edition; // 'base', 'foil', 'holo', 'polychrome'
    this.seal = seal; // 'none', 'red', 'blue', 'gold', 'purple'
    this.debuffed = false;
  }

  getBaseChips() {
    if (this.debuffed) return 0;
    if (this.enhancement === 'stone') return 50;
    let chips = RANK_VALUES[this.rank] || 0;
    if (this.enhancement === 'bonus') chips += 30;
    if (this.edition === 'foil') chips += 50;
    return chips;
  }

  isFaceCard() {
    return ['J', 'Q', 'K'].includes(this.rank);
  }
}

class PokerHandEvaluator {
  static HAND_BASE_STATS = {
    'High Card': { chips: 5, mult: 1, chipLvl: 10, multLvl: 1 },
    'Pair': { chips: 10, mult: 2, chipLvl: 15, multLvl: 1 },
    'Two Pair': { chips: 20, mult: 2, chipLvl: 20, multLvl: 1 },
    'Three of a Kind': { chips: 30, mult: 3, chipLvl: 20, multLvl: 2 },
    'Straight': { chips: 30, mult: 4, chipLvl: 30, multLvl: 3 },
    'Flush': { chips: 35, mult: 4, chipLvl: 15, multLvl: 2 },
    'Full House': { chips: 40, mult: 4, chipLvl: 25, multLvl: 2 },
    'Four of a Kind': { chips: 60, mult: 7, chipLvl: 30, multLvl: 3 },
    'Straight Flush': { chips: 100, mult: 8, chipLvl: 40, multLvl: 4 },
    'Five of a Kind': { chips: 120, mult: 12, chipLvl: 35, multLvl: 3 },
    'Flush Five': { chips: 160, mult: 16, chipLvl: 50, multLvl: 3 }
  };

  static evaluate(cards) {
    if (!cards || cards.length === 0) return { handName: 'High Card', scoringCards: [] };

    // Group by rank
    const rankCounts = {};
    cards.forEach(c => {
      if (c.enhancement !== 'stone') {
        rankCounts[c.rank] = (rankCounts[c.rank] || 0) + 1;
      }
    });

    // Group by suit
    const suitCounts = {};
    cards.forEach(c => {
      if (c.enhancement !== 'stone') {
        const suits = c.enhancement === 'wild' ? SUITS : [c.suit];
        suits.forEach(s => suitCounts[s] = (suitCounts[s] || 0) + 1);
      }
    });

    const isFlush = Object.values(suitCounts).some(cnt => cnt >= 5);
    const sortedRanks = [...new Set(cards.map(c => RANK_ORDERS[c.rank]))].sort((a, b) => a - b);
    
    // Check Straight
    let isStraight = false;
    let straightRanks = [];
    if (sortedRanks.length >= 5) {
      for (let i = 0; i <= sortedRanks.length - 5; i++) {
        if (sortedRanks[i + 4] - sortedRanks[i] === 4) {
          isStraight = true;
          straightRanks = sortedRanks.slice(i, i + 5);
          break;
        }
      }
      // Ace-low straight check (A, 2, 3, 4, 5)
      if (!isStraight && sortedRanks.includes(14) && sortedRanks.includes(2) && sortedRanks.includes(3) && sortedRanks.includes(4) && sortedRanks.includes(5)) {
        isStraight = true;
      }
    }

    const counts = Object.entries(rankCounts).sort((a, b) => b[1] - a[1]);

    // 1. Flush Five
    if (counts.length > 0 && counts[0][1] >= 5 && isFlush) {
      return { handName: 'Flush Five', scoringCards: cards };
    }

    // 2. Five of a Kind
    if (counts.length > 0 && counts[0][1] >= 5) {
      const targetRank = counts[0][0];
      return { handName: 'Five of a Kind', scoringCards: cards.filter(c => c.rank === targetRank) };
    }

    // 3. Straight Flush
    if (isStraight && isFlush) {
      return { handName: 'Straight Flush', scoringCards: cards };
    }

    // 4. Four of a Kind
    if (counts.length > 0 && counts[0][1] >= 4) {
      const targetRank = counts[0][0];
      return { handName: 'Four of a Kind', scoringCards: cards.filter(c => c.rank === targetRank) };
    }

    // 5. Full House
    if (counts.length >= 2 && counts[0][1] >= 3 && counts[1][1] >= 2) {
      const r1 = counts[0][0], r2 = counts[1][0];
      return { handName: 'Full House', scoringCards: cards.filter(c => c.rank === r1 || c.rank === r2) };
    }

    // 6. Flush
    if (isFlush) {
      return { handName: 'Flush', scoringCards: cards };
    }

    // 7. Straight
    if (isStraight) {
      return { handName: 'Straight', scoringCards: cards };
    }

    // 8. Three of a Kind
    if (counts.length > 0 && counts[0][1] >= 3) {
      const targetRank = counts[0][0];
      return { handName: 'Three of a Kind', scoringCards: cards.filter(c => c.rank === targetRank) };
    }

    // 9. Two Pair
    if (counts.length >= 2 && counts[0][1] >= 2 && counts[1][1] >= 2) {
      const r1 = counts[0][0], r2 = counts[1][0];
      return { handName: 'Two Pair', scoringCards: cards.filter(c => c.rank === r1 || c.rank === r2) };
    }

    // 10. Pair
    if (counts.length > 0 && counts[0][1] >= 2) {
      const targetRank = counts[0][0];
      return { handName: 'Pair', scoringCards: cards.filter(c => c.rank === targetRank) };
    }

    // 11. High Card (Highest card only scores)
    const highest = [...cards].sort((a, b) => (RANK_ORDERS[b.rank] || 0) - (RANK_ORDERS[a.rank] || 0))[0];
    return { handName: 'High Card', scoringCards: highest ? [highest] : [] };
  }
}

class DeckManager {
  static createStandardDeck() {
    const deck = [];
    SUITS.forEach(suit => {
      RANKS.forEach(rank => {
        deck.push(new Card(rank, suit));
      });
    });
    return deck;
  }
}

window.Card = Card;
window.SUITS = SUITS;
window.SUIT_SYMBOLS = SUIT_SYMBOLS;
window.RANKS = RANKS;
window.RANK_VALUES = RANK_VALUES;
window.RANK_ORDERS = RANK_ORDERS;
window.PokerHandEvaluator = PokerHandEvaluator;
window.DeckManager = DeckManager;
