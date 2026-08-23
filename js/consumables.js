/* ==========================================================================
   BALATRO WEB - CONSUMABLES (TAROT, PLANETS, PACKS, VOUCHERS)
   ========================================================================== */

const TAROT_CARDS = [
  {
    id: 'the_magician',
    name: 'The Magician',
    type: 'tarot',
    icon: '🪄',
    cost: 3,
    desc: '선택한 카드 최대 2장을 럭키 카드(Lucky Card)로 강화합니다.',
    use: (selectedCards) => {
      selectedCards.forEach(c => c.enhancement = 'lucky');
    }
  },
  {
    id: 'the_empress',
    name: 'The Empress',
    type: 'tarot',
    icon: '👑',
    cost: 3,
    desc: '선택한 카드 최대 2장을 배수 카드(Mult Card, +4 Mult)로 강화합니다.',
    use: (selectedCards) => {
      selectedCards.forEach(c => c.enhancement = 'mult');
    }
  },
  {
    id: 'the_hierophant',
    name: 'The Hierophant',
    type: 'tarot',
    icon: '📜',
    cost: 3,
    desc: '선택한 카드 최대 2장을 보너스 카드(Bonus Card, +30 Chips)로 강화합니다.',
    use: (selectedCards) => {
      selectedCards.forEach(c => c.enhancement = 'bonus');
    }
  },
  {
    id: 'the_chariot',
    name: 'The Chariot',
    type: 'tarot',
    icon: '🏎️',
    cost: 3,
    desc: '선택한 카드 1장을 강철 카드(Steel Card, 손에 들고 있을 때 X1.5 Mult)로 강화합니다.',
    use: (selectedCards) => {
      if (selectedCards.length > 0) selectedCards[0].enhancement = 'steel';
    }
  },
  {
    id: 'the_devil',
    name: 'The Devil',
    type: 'tarot',
    icon: '😈',
    cost: 3,
    desc: '선택한 카드 1장을 골드 카드(Gold Card, 라운드 종료 시 손에 들고 있으면 +$3)로 강화합니다.',
    use: (selectedCards) => {
      if (selectedCards.length > 0) selectedCards[0].enhancement = 'gold';
    }
  },
  {
    id: 'the_hermit',
    name: 'The Hermit',
    type: 'tarot',
    icon: '🧙',
    cost: 3,
    desc: '현재 보유한 골드를 2배로 만듭니다 (최대 +$20).',
    use: (selectedCards, game) => {
      const bonus = Math.min(20, game.money);
      game.money += bonus;
    }
  },
  {
    id: 'the_wheel_of_fortune',
    name: 'The Wheel of Fortune',
    type: 'tarot',
    icon: '🎡',
    cost: 3,
    desc: '1/4 확률로 보유한 무작위 조커 1개에 포일, 홀로 또는 폴리크롬 에디션을 부여합니다.',
    use: (selectedCards, game) => {
      if (game.jokers.length > 0 && Math.random() < 0.35) {
        const j = game.jokers[Math.floor(Math.random() * game.jokers.length)];
        const roll = Math.random();
        j.edition = roll < 0.5 ? 'foil' : (roll < 0.85 ? 'holo' : 'polychrome');
        window.balatroAudio.playSFX('mult_x');
      }
    }
  }
];

const PLANET_CARDS = [
  { id: 'mercury', name: 'Mercury', type: 'planet', icon: '🪐', cost: 3, handTarget: 'Pair', desc: 'Pair 레벨업 (+15 칩, +1 배수)' },
  { id: 'venus', name: 'Venus', type: 'planet', icon: '🪐', cost: 3, handTarget: 'Three of a Kind', desc: 'Three of a Kind 레벨업 (+20 칩, +2 배수)' },
  { id: 'earth', name: 'Earth', type: 'planet', icon: '🪐', cost: 3, handTarget: 'Full House', desc: 'Full House 레벨업 (+25 칩, +2 배수)' },
  { id: 'mars', name: 'Mars', type: 'planet', icon: '🪐', cost: 3, handTarget: 'Four of a Kind', desc: 'Four of a Kind 레벨업 (+30 칩, +3 배수)' },
  { id: 'jupiter', name: 'Jupiter', type: 'planet', icon: '🪐', cost: 3, handTarget: 'Flush', desc: 'Flush 레벨업 (+15 칩, +2 배수)' },
  { id: 'saturn', name: 'Saturn', type: 'planet', icon: '🪐', cost: 3, handTarget: 'Straight', desc: 'Straight 레벨업 (+30 칩, +3 배수)' },
  { id: 'uranus', name: 'Uranus', type: 'planet', icon: '🪐', cost: 3, handTarget: 'Two Pair', desc: 'Two Pair 레벨업 (+20 칩, +1 배수)' },
  { id: 'pluto', name: 'Pluto', type: 'planet', icon: '🪐', cost: 3, handTarget: 'High Card', desc: 'High Card 레벨업 (+10 칩, +1 배수)' }
];

window.TAROT_CARDS = TAROT_CARDS;
window.PLANET_CARDS = PLANET_CARDS;
