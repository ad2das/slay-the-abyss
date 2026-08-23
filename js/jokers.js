/* ==========================================================================
   BALATRO WEB - JOKER DATABASE & TRIGGER ENGINE
   25+ Iconic animated Jokers with full synergy capabilities
   ========================================================================== */

const JOKER_DATABASE = [
  // 1. Basic Jokers
  {
    id: 'joker',
    name: 'Joker',
    rarity: 'common',
    cost: 2,
    icon: '🃏',
    desc: '+4 Mult.',
    onHandScored: (ctx) => {
      ctx.mult += 4;
      ctx.triggerJokerAnim('joker', '+4 Mult');
    }
  },
  {
    id: 'greedy_joker',
    name: 'Greedy Joker',
    rarity: 'common',
    cost: 5,
    icon: '💎',
    desc: 'Played cards with Diamond suit give +3 Mult when scored.',
    onCardScored: (card, ctx) => {
      if (card.suit === 'diamonds' || card.enhancement === 'wild') {
        ctx.mult += 3;
        ctx.triggerJokerAnim('greedy_joker', '+3 Mult');
      }
    }
  },
  {
    id: 'lusty_joker',
    name: 'Lusty Joker',
    rarity: 'common',
    cost: 5,
    icon: '❤️',
    desc: 'Played cards with Heart suit give +3 Mult when scored.',
    onCardScored: (card, ctx) => {
      if (card.suit === 'hearts' || card.enhancement === 'wild') {
        ctx.mult += 3;
        ctx.triggerJokerAnim('lusty_joker', '+3 Mult');
      }
    }
  },
  {
    id: 'wrathful_joker',
    name: 'Wrathful Joker',
    rarity: 'common',
    cost: 5,
    icon: '🗡️',
    desc: 'Played cards with Spade suit give +3 Mult when scored.',
    onCardScored: (card, ctx) => {
      if (card.suit === 'spades' || card.enhancement === 'wild') {
        ctx.mult += 3;
        ctx.triggerJokerAnim('wrathful_joker', '+3 Mult');
      }
    }
  },
  {
    id: 'gluttonous_joker',
    name: 'Gluttonous Joker',
    rarity: 'common',
    cost: 5,
    icon: '♣️',
    desc: 'Played cards with Club suit give +3 Mult when scored.',
    onCardScored: (card, ctx) => {
      if (card.suit === 'clubs' || card.enhancement === 'wild') {
        ctx.mult += 3;
        ctx.triggerJokerAnim('gluttonous_joker', '+3 Mult');
      }
    }
  },

  // 2. Hand-specific Jokers (Chips & Mult)
  {
    id: 'jolly_joker',
    name: 'Jolly Joker',
    rarity: 'common',
    cost: 3,
    icon: '🤡',
    desc: '+8 Mult if played hand contains a Pair.',
    onHandScored: (ctx) => {
      if (ctx.handName.includes('Pair') || ctx.handName.includes('Full House')) {
        ctx.mult += 8;
        ctx.triggerJokerAnim('jolly_joker', '+8 Mult');
      }
    }
  },
  {
    id: 'zany_joker',
    name: 'Zany Joker',
    rarity: 'common',
    cost: 4,
    icon: '🤪',
    desc: '+12 Mult if played hand contains Three of a Kind.',
    onHandScored: (ctx) => {
      if (ctx.handName.includes('Three of a Kind') || ctx.handName.includes('Full House')) {
        ctx.mult += 12;
        ctx.triggerJokerAnim('zany_joker', '+12 Mult');
      }
    }
  },
  {
    id: 'mad_joker',
    name: 'Mad Joker',
    rarity: 'common',
    cost: 4,
    icon: '😡',
    desc: '+10 Mult if played hand contains Two Pair.',
    onHandScored: (ctx) => {
      if (ctx.handName === 'Two Pair') {
        ctx.mult += 10;
        ctx.triggerJokerAnim('mad_joker', '+10 Mult');
      }
    }
  },
  {
    id: 'crazy_joker',
    name: 'Crazy Joker',
    rarity: 'common',
    cost: 4,
    icon: '🤯',
    desc: '+12 Mult if played hand contains a Straight.',
    onHandScored: (ctx) => {
      if (ctx.handName.includes('Straight')) {
        ctx.mult += 12;
        ctx.triggerJokerAnim('crazy_joker', '+12 Mult');
      }
    }
  },
  {
    id: 'droll_joker',
    name: 'Droll Joker',
    rarity: 'common',
    cost: 4,
    icon: '🎭',
    desc: '+10 Mult if played hand contains a Flush.',
    onHandScored: (ctx) => {
      if (ctx.handName.includes('Flush')) {
        ctx.mult += 10;
        ctx.triggerJokerAnim('droll_joker', '+10 Mult');
      }
    }
  },

  // 3. Chip Jokers
  {
    id: 'sly_joker',
    name: 'Sly Joker',
    rarity: 'common',
    cost: 3,
    icon: '🦊',
    desc: '+50 Chips if played hand contains a Pair.',
    onHandScored: (ctx) => {
      if (ctx.handName.includes('Pair') || ctx.handName.includes('Full House')) {
        ctx.chips += 50;
        ctx.triggerJokerAnim('sly_joker', '+50 Chips');
      }
    }
  },
  {
    id: 'wily_joker',
    name: 'Wily Joker',
    rarity: 'common',
    cost: 4,
    icon: '🐺',
    desc: '+100 Chips if played hand contains Three of a Kind.',
    onHandScored: (ctx) => {
      if (ctx.handName.includes('Three of a Kind') || ctx.handName.includes('Full House')) {
        ctx.chips += 100;
        ctx.triggerJokerAnim('wily_joker', '+100 Chips');
      }
    }
  },
  {
    id: 'crafty_joker',
    name: 'Crafty Joker',
    rarity: 'common',
    cost: 4,
    icon: '🦉',
    desc: '+80 Chips if played hand contains a Flush.',
    onHandScored: (ctx) => {
      if (ctx.handName.includes('Flush')) {
        ctx.chips += 80;
        ctx.triggerJokerAnim('crafty_joker', '+80 Chips');
      }
    }
  },
  {
    id: 'half_joker',
    name: 'Half Joker',
    rarity: 'common',
    cost: 5,
    icon: '🌓',
    desc: '+20 Mult if played hand contains 3 or fewer cards.',
    onHandScored: (ctx) => {
      if (ctx.playedCardsCount <= 3) {
        ctx.mult += 20;
        ctx.triggerJokerAnim('half_joker', '+20 Mult');
      }
    }
  },
  {
    id: 'banner',
    name: 'Banner',
    rarity: 'common',
    cost: 5,
    icon: '🚩',
    desc: '+30 Chips for each remaining Discard.',
    onHandScored: (ctx) => {
      const bonus = ctx.remainingDiscards * 30;
      if (bonus > 0) {
        ctx.chips += bonus;
        ctx.triggerJokerAnim('banner', `+${bonus} Chips`);
      }
    }
  },
  {
    id: 'mystic_summit',
    name: 'Mystic Summit',
    rarity: 'common',
    cost: 5,
    icon: '🏔️',
    desc: '+15 Mult when 0 discards remaining.',
    onHandScored: (ctx) => {
      if (ctx.remainingDiscards === 0) {
        ctx.mult += 15;
        ctx.triggerJokerAnim('mystic_summit', '+15 Mult');
      }
    }
  },

  // 4. Uncommon & Rare Multiplier Jokers
  {
    id: 'bull',
    name: 'Bull',
    rarity: 'uncommon',
    cost: 6,
    icon: '🐂',
    desc: '+2 Chips for each $1 you have.',
    onHandScored: (ctx) => {
      const bonus = ctx.money * 2;
      if (bonus > 0) {
        ctx.chips += bonus;
        ctx.triggerJokerAnim('bull', `+${bonus} Chips`);
      }
    }
  },
  {
    id: 'popcorn',
    name: 'Popcorn',
    rarity: 'common',
    cost: 5,
    icon: '🍿',
    desc: '+20 Mult. -4 Mult per round played.',
    state: { multVal: 20 },
    onHandScored: function(ctx) {
      ctx.mult += this.state.multVal;
      ctx.triggerJokerAnim('popcorn', `+${this.state.multVal} Mult`);
    },
    onRoundEnd: function(ctx) {
      this.state.multVal -= 4;
      if (this.state.multVal <= 0) {
        ctx.destroyJoker(this.id);
      }
    }
  },
  {
    id: 'gros_michel',
    name: 'Gros Michel',
    rarity: 'common',
    cost: 5,
    icon: '🍌',
    desc: '+15 Mult. 1 in 4 chance to go extinct at round end.',
    onHandScored: (ctx) => {
      ctx.mult += 15;
      ctx.triggerJokerAnim('gros_michel', '+15 Mult');
    },
    onRoundEnd: (ctx) => {
      if (Math.random() < 0.25) {
        ctx.destroyJoker('gros_michel');
        ctx.enableCavendish();
        window.balatroAudio.playSFX('mult_x');
      }
    }
  },
  {
    id: 'cavendish',
    name: 'Cavendish',
    rarity: 'common',
    cost: 5,
    icon: '🍌',
    desc: 'X3 Mult. 1 in 1000 chance to go extinct.',
    onHandScored: (ctx) => {
      ctx.mult *= 3;
      ctx.triggerJokerAnim('cavendish', 'X3 Mult');
    }
  },
  {
    id: 'card_sharp',
    name: 'Card Sharp',
    rarity: 'uncommon',
    cost: 6,
    icon: '♠️',
    desc: 'X3 Mult if played poker hand has already been played this round.',
    onHandScored: (ctx) => {
      if (ctx.handsPlayedThisRoundHistory.includes(ctx.handName)) {
        ctx.mult *= 3;
        ctx.triggerJokerAnim('card_sharp', 'X3 Mult');
      }
    }
  },
  {
    id: 'blueprint',
    name: 'Blueprint',
    rarity: 'rare',
    cost: 10,
    icon: '📐',
    desc: 'Copies ability of Joker to the right.',
    onHandScored: (ctx, index) => {
      const nextJoker = ctx.jokers[index + 1];
      if (nextJoker && nextJoker.onHandScored) {
        nextJoker.onHandScored(ctx, index + 1);
        ctx.triggerJokerAnim('blueprint', 'COPIED!');
      }
    }
  }
];

class JokerInstance {
  constructor(def, edition = 'base') {
    this.id = def.id;
    this.name = def.name;
    this.rarity = def.rarity;
    this.cost = def.cost;
    this.icon = def.icon;
    this.desc = def.desc;
    this.edition = edition; // 'base', 'foil' (+50 chips), 'holo' (+10 mult), 'polychrome' (X1.5 mult)
    this.state = def.state ? { ...def.state } : {};
    this.onHandScored = def.onHandScored ? def.onHandScored.bind(this) : null;
    this.onCardScored = def.onCardScored ? def.onCardScored.bind(this) : null;
    this.onRoundEnd = def.onRoundEnd ? def.onRoundEnd.bind(this) : null;
  }
}

window.JOKER_DATABASE = JOKER_DATABASE;
window.JokerInstance = JokerInstance;
