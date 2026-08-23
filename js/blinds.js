/* ==========================================================================
   BALATRO WEB - ANTE & BLINDS ENGINE
   Ante 1 to 8 scoring curves, Boss debuff modifiers & skip tags
   ========================================================================== */

const ANTE_BASE_SCORES = [
  300,      // Ante 1
  800,      // Ante 2
  2000,     // Ante 3
  5000,     // Ante 4
  11000,    // Ante 5
  20000,    // Ante 6
  35000,    // Ante 7
  50000     // Ante 8
];

const BOSS_BLINDS = [
  {
    id: 'the_hook',
    name: 'The Hook',
    icon: '🪝',
    desc: '매 핸드를 낼 때마다 손에서 무작위 카드 2장을 강제로 버립니다.',
    onHandPlayed: (game) => {
      if (game.hand.length >= 2) {
        for (let i = 0; i < 2; i++) {
          const randIdx = Math.floor(Math.random() * game.hand.length);
          game.hand.splice(randIdx, 1);
        }
      }
    }
  },
  {
    id: 'the_wall',
    name: 'The Wall',
    icon: '🧱',
    desc: '점수 목표치가 2배로 증가하는 거대한 블라인드입니다.',
    multFactor: 2.0
  },
  {
    id: 'the_club',
    name: 'The Club',
    icon: '♣️',
    desc: '모든 클로버(Club) 카드가 무효화(Debuffed)됩니다.',
    applyDebuff: (card) => { if (card.suit === 'clubs') card.debuffed = true; }
  },
  {
    id: 'the_goad',
    name: 'The Goad',
    icon: '♠️',
    desc: '모든 스페이드(Spade) 카드가 무효화(Debuffed)됩니다.',
    applyDebuff: (card) => { if (card.suit === 'spades') card.debuffed = true; }
  },
  {
    id: 'the_window',
    name: 'The Window',
    icon: '♦️',
    desc: '모든 다이아몬드(Diamond) 카드가 무효화(Debuffed)됩니다.',
    applyDebuff: (card) => { if (card.suit === 'diamonds') card.debuffed = true; }
  },
  {
    id: 'the_head',
    name: 'The Head',
    icon: '♥️',
    desc: '모든 하트(Heart) 카드가 무효화(Debuffed)됩니다.',
    applyDebuff: (card) => { if (card.suit === 'hearts') card.debuffed = true; }
  },
  {
    id: 'the_arm',
    name: 'The Arm',
    icon: '💪',
    desc: '핸드를 플레이할 때마다 해당 포커 핸드의 레벨을 1 낮춥니다.',
    onHandScored: (handName, game) => {
      if (game.handLevels[handName] && game.handLevels[handName] > 1) {
        game.handLevels[handName]--;
      }
    }
  },
  {
    id: 'the_psychic',
    name: 'The Psychic',
    icon: '👁️',
    desc: '정확히 5장의 카드를 낼 때만 점수가 집계됩니다.',
    validatePlay: (selectedCards) => selectedCards.length === 5
  }
];

class BlindManager {
  static getBlindData(ante, type) {
    const base = ANTE_BASE_SCORES[Math.min(ante - 1, ANTE_BASE_SCORES.length - 1)];
    
    if (type === 'small') {
      return {
        type: 'small',
        name: 'Small Blind',
        score: base,
        reward: 3,
        skipTag: '무료 타로 카드'
      };
    } else if (type === 'big') {
      return {
        type: 'big',
        name: 'Big Blind',
        score: Math.floor(base * 1.5),
        reward: 4,
        skipTag: '상점 무료 리롤'
      };
    } else {
      const boss = BOSS_BLINDS[Math.floor(Math.random() * BOSS_BLINDS.length)];
      const bossScore = Math.floor(base * 2.0 * (boss.multFactor || 1.0));
      return {
        type: 'boss',
        name: `Boss: ${boss.name}`,
        bossData: boss,
        score: bossScore,
        reward: 5
      };
    }
  }
}

window.BlindManager = BlindManager;
window.BOSS_BLINDS = BOSS_BLINDS;
