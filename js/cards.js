/* ==========================================================================
   SLAY THE ABYSS - CARD DATABASE & ACTION ENGINE
   ========================================================================== */

class Card {
  constructor(def, upgraded = false) {
    this.id = def.id;
    this.name = def.name;
    this.type = def.type; // 'attack', 'skill', 'power'
    this.rarity = def.rarity; // 'starter', 'common', 'uncommon', 'rare'
    this.cost = def.cost;
    this.target = def.target; // 'enemy', 'all_enemies', 'self', 'none'
    this.icon = def.icon;
    this.baseDesc = def.desc;
    this.upgraded = upgraded;
    this.exhaust = def.exhaust || false;
    this.ethereal = def.ethereal || false;

    // Upgraded adjustments
    this.upgradeDef = def.upgrade || {};
    if (this.upgraded) {
      this.applyUpgrade();
    }
  }

  applyUpgrade() {
    this.upgraded = true;
    this.name = this.name + '+';
    if (this.upgradeDef.cost !== undefined) this.cost = this.upgradeDef.cost;
    if (this.upgradeDef.exhaust !== undefined) this.exhaust = this.upgradeDef.exhaust;
  }

  getFormattedDesc(player, targetEnemy) {
    let raw = this.upgraded && this.upgradeDef.desc ? this.upgradeDef.desc : this.baseDesc;
    const str = player ? (player.status.strength || 0) : 0;
    const dex = player ? (player.status.dexterity || 0) : 0;

    // Replace damage placeholders {dmg:base}
    raw = raw.replace(/{dmg:(\d+)}/g, (match, base) => {
      let dmg = parseInt(base) + str;
      if (this.id === 'heavy_blade') {
        const mult = this.upgraded ? 5 : 3;
        dmg = parseInt(base) + str * mult;
      }
      if (targetEnemy && targetEnemy.status && targetEnemy.status.vulnerable > 0) {
        dmg = Math.floor(dmg * 1.5);
      }
      if (player && player.status.weak > 0) {
        dmg = Math.floor(dmg * 0.75);
      }
      return `<strong>${Math.max(0, dmg)}</strong>`;
    });

    // Replace block placeholders {blk:base}
    raw = raw.replace(/{blk:(\d+)}/g, (match, base) => {
      let blk = parseInt(base) + dex;
      if (player && player.status.frail > 0) {
        blk = Math.floor(blk * 0.75);
      }
      return `<strong>${Math.max(0, blk)}</strong>`;
    });

    return raw;
  }

  calculateDamage(baseDmg, player, targetEnemy) {
    let dmg = baseDmg + (player.status.strength || 0);
    if (this.id === 'heavy_blade') {
      const mult = this.upgraded ? 5 : 3;
      dmg = baseDmg + (player.status.strength || 0) * mult;
    }
    if (player.status.weak > 0) {
      dmg = Math.floor(dmg * 0.75);
    }
    if (targetEnemy && targetEnemy.status.vulnerable > 0) {
      dmg = Math.floor(dmg * 1.5);
    }
    return Math.max(0, dmg);
  }

  calculateBlock(baseBlock, player) {
    let blk = baseBlock + (player.status.dexterity || 0);
    if (player.status.frail > 0) {
      blk = Math.floor(blk * 0.75);
    }
    return Math.max(0, blk);
  }
}

const CARD_DATABASE = [
  // --- STARTER ---
  {
    id: 'strike',
    name: '타격 (Strike)',
    type: 'attack',
    rarity: 'starter',
    cost: 1,
    target: 'enemy',
    icon: '🗡️',
    desc: '적에게 {dmg:6} 피해를 줍니다.',
    upgrade: { desc: '적에게 {dmg:9} 피해를 줍니다.' },
    play: (card, player, target, combat) => {
      const dmg = card.calculateDamage(card.upgraded ? 9 : 6, player, target);
      target.takeDamage(dmg, player, combat);
    }
  },
  {
    id: 'defend',
    name: '수비 (Defend)',
    type: 'skill',
    rarity: 'starter',
    cost: 1,
    target: 'self',
    icon: '🛡️',
    desc: '{blk:5} 방어도를 얻습니다.',
    upgrade: { desc: '{blk:8} 방어도를 얻습니다.' },
    play: (card, player, target, combat) => {
      const blk = card.calculateBlock(card.upgraded ? 8 : 5, player);
      player.addBlock(blk);
    }
  },
  {
    id: 'bash',
    name: '강타 (Bash)',
    type: 'attack',
    rarity: 'starter',
    cost: 2,
    target: 'enemy',
    icon: '🔨',
    desc: '적에게 {dmg:8} 피해를 주고 취약을 2 부여합니다.',
    upgrade: { desc: '적에게 {dmg:10} 피해를 주고 취약을 3 부여합니다.' },
    play: (card, player, target, combat) => {
      const dmg = card.calculateDamage(card.upgraded ? 10 : 8, player, target);
      target.takeDamage(dmg, player, combat);
      target.addStatus('vulnerable', card.upgraded ? 3 : 2);
    }
  },

  // --- COMMON ATTACKS ---
  {
    id: 'cleave',
    name: '절단 (Cleave)',
    type: 'attack',
    rarity: 'common',
    cost: 1,
    target: 'all_enemies',
    icon: '🪓',
    desc: '모든 적에게 {dmg:8} 피해를 줍니다.',
    upgrade: { desc: '모든 적에게 {dmg:11} 피해를 줍니다.' },
    play: (card, player, target, combat) => {
      combat.enemies.forEach(e => {
        if (!e.dead) {
          const dmg = card.calculateDamage(card.upgraded ? 11 : 8, player, e);
          e.takeDamage(dmg, player, combat);
        }
      });
    }
  },
  {
    id: 'clothesline',
    name: '빨래줄 걸기 (Clothesline)',
    type: 'attack',
    rarity: 'common',
    cost: 2,
    target: 'enemy',
    icon: '🥋',
    desc: '적에게 {dmg:12} 피해를 주고 약화를 2 부여합니다.',
    upgrade: { desc: '적에게 {dmg:14} 피해를 주고 약화를 3 부여합니다.' },
    play: (card, player, target, combat) => {
      const dmg = card.calculateDamage(card.upgraded ? 14 : 12, player, target);
      target.takeDamage(dmg, player, combat);
      target.addStatus('weak', card.upgraded ? 3 : 2);
    }
  },
  {
    id: 'iron_wave',
    name: '철벽 파도 (Iron Wave)',
    type: 'attack',
    rarity: 'common',
    cost: 1,
    target: 'enemy',
    icon: '🌊',
    desc: '{blk:5} 방어도를 얻고, 적에게 {dmg:5} 피해를 줍니다.',
    upgrade: { desc: '{blk:7} 방어도를 얻고, 적에게 {dmg:7} 피해를 줍니다.' },
    play: (card, player, target, combat) => {
      const blk = card.calculateBlock(card.upgraded ? 7 : 5, player);
      player.addBlock(blk);
      const dmg = card.calculateDamage(card.upgraded ? 7 : 5, player, target);
      target.takeDamage(dmg, player, combat);
    }
  },
  {
    id: 'pommel_strike',
    name: '폼멜 타격 (Pommel Strike)',
    type: 'attack',
    rarity: 'common',
    cost: 1,
    target: 'enemy',
    icon: '🗡️',
    desc: '적에게 {dmg:9} 피해를 줍니다. 카드를 1장 뽑습니다.',
    upgrade: { desc: '적에게 {dmg:10} 피해를 줍니다. 카드를 2장 뽑습니다.' },
    play: (card, player, target, combat) => {
      const dmg = card.calculateDamage(card.upgraded ? 10 : 9, player, target);
      target.takeDamage(dmg, player, combat);
      combat.drawCards(card.upgraded ? 2 : 1);
    }
  },
  {
    id: 'heavy_blade',
    name: '대검 (Heavy Blade)',
    type: 'attack',
    rarity: 'common',
    cost: 2,
    target: 'enemy',
    icon: '⚔️',
    desc: '적에게 {dmg:14} 피해를 줍니다. 힘의 효과가 3배 적용됩니다.',
    upgrade: { desc: '적에게 {dmg:14} 피해를 줍니다. 힘의 효과가 5배 적용됩니다.' },
    play: (card, player, target, combat) => {
      const dmg = card.calculateDamage(14, player, target);
      target.takeDamage(dmg, player, combat);
    }
  },

  // --- COMMON SKILLS ---
  {
    id: 'shrug_it_off',
    name: '흘려보내기 (Shrug It Off)',
    type: 'skill',
    rarity: 'common',
    cost: 1,
    target: 'self',
    icon: '🧘',
    desc: '{blk:8} 방어도를 얻습니다. 카드를 1장 뽑습니다.',
    upgrade: { desc: '{blk:11} 방어도를 얻습니다. 카드를 1장 뽑습니다.' },
    play: (card, player, target, combat) => {
      const blk = card.calculateBlock(card.upgraded ? 11 : 8, player);
      player.addBlock(blk);
      combat.drawCards(1);
    }
  },
  {
    id: 'armaments',
    name: '무장 (Armaments)',
    type: 'skill',
    rarity: 'common',
    cost: 1,
    target: 'self',
    icon: '⚒️',
    desc: '{blk:5} 방어도를 얻습니다. 손의 무작위 카드 1장을 이번 전투 동안 강화합니다.',
    upgrade: { desc: '{blk:5} 방어도를 얻습니다. 손의 모든 카드를 이번 전투 동안 강화합니다.' },
    play: (card, player, target, combat) => {
      const blk = card.calculateBlock(5, player);
      player.addBlock(blk);
      combat.upgradeHandCards(card.upgraded);
    }
  },

  // --- UNCOMMON ---
  {
    id: 'carnage',
    name: '대학살 (Carnage)',
    type: 'attack',
    rarity: 'uncommon',
    cost: 2,
    target: 'enemy',
    icon: '🩸',
    ethereal: true,
    desc: '휘발성. 적에게 {dmg:20} 피해를 줍니다.',
    upgrade: { desc: '휘발성. 적에게 {dmg:28} 피해를 줍니다.' },
    play: (card, player, target, combat) => {
      const dmg = card.calculateDamage(card.upgraded ? 28 : 20, player, target);
      target.takeDamage(dmg, player, combat);
    }
  },
  {
    id: 'whirlwind',
    name: '소용돌이 (Whirlwind)',
    type: 'attack',
    rarity: 'uncommon',
    cost: -1, // X Cost
    target: 'all_enemies',
    icon: '🌪️',
    desc: '모든 에너지를 소모합니다. 모든 적에게 {dmg:5} 피해를 X회 줍니다.',
    upgrade: { desc: '모든 에너지를 소모합니다. 모든 적에게 {dmg:8} 피해를 X회 줍니다.' },
    play: (card, player, target, combat) => {
      const xVal = combat.energy;
      combat.energy = 0;
      for (let i = 0; i < xVal; i++) {
        combat.enemies.forEach(e => {
          if (!e.dead) {
            const dmg = card.calculateDamage(card.upgraded ? 8 : 5, player, e);
            e.takeDamage(dmg, player, combat);
          }
        });
      }
    }
  },
  {
    id: 'flame_barrier',
    name: '화염 장벽 (Flame Barrier)',
    type: 'skill',
    rarity: 'uncommon',
    cost: 2,
    target: 'self',
    icon: '🔥',
    desc: '{blk:12} 방어도를 얻습니다. 이번 턴 동안 공격받을 때마다 공격자에게 4 피해를 줍니다.',
    upgrade: { desc: '{blk:16} 방어도를 얻습니다. 이번 턴 동안 공격받을 때마다 공격자에게 6 피해를 줍니다.' },
    play: (card, player, target, combat) => {
      const blk = card.calculateBlock(card.upgraded ? 16 : 12, player);
      player.addBlock(blk);
      player.addStatus('flame_barrier', card.upgraded ? 6 : 4);
    }
  },
  {
    id: 'battle_trance',
    name: '전투 최면 (Battle Trance)',
    type: 'skill',
    rarity: 'uncommon',
    cost: 0,
    target: 'self',
    icon: '🌀',
    desc: '카드를 3장 뽑습니다. 이번 턴 동안 카드를 더 뽑을 수 없습니다.',
    upgrade: { desc: '카드를 4장 뽑습니다. 이번 턴 동안 카드를 더 뽑을 수 없습니다.' },
    play: (card, player, target, combat) => {
      combat.drawCards(card.upgraded ? 4 : 3);
      player.addStatus('no_draw', 1);
    }
  },
  {
    id: 'inflame',
    name: '발화 (Inflame)',
    type: 'power',
    rarity: 'uncommon',
    cost: 1,
    target: 'self',
    icon: '💥',
    desc: '힘을 2 얻습니다.',
    upgrade: { desc: '힘을 3 얻습니다.' },
    play: (card, player, target, combat) => {
      player.addStatus('strength', card.upgraded ? 3 : 2);
    }
  },
  {
    id: 'metallicize',
    name: '금속화 (Metallicize)',
    type: 'power',
    rarity: 'uncommon',
    cost: 1,
    target: 'self',
    icon: '🔩',
    desc: '매 턴이 끝날 때 방어도를 3 얻습니다.',
    upgrade: { desc: '매 턴이 끝날 때 방어도를 4 얻습니다.' },
    play: (card, player, target, combat) => {
      player.addStatus('metallicize', card.upgraded ? 4 : 3);
    }
  },

  // --- RARE ---
  {
    id: 'bludgeon',
    name: '몽둥이질 (Bludgeon)',
    type: 'attack',
    rarity: 'rare',
    cost: 3,
    target: 'enemy',
    icon: '🏏',
    desc: '적에게 {dmg:32} 피해를 줍니다.',
    upgrade: { desc: '적에게 {dmg:42} 피해를 줍니다.' },
    play: (card, player, target, combat) => {
      const dmg = card.calculateDamage(card.upgraded ? 42 : 32, player, target);
      target.takeDamage(dmg, player, combat);
    }
  },
  {
    id: 'reaper',
    name: '사신 (Reaper)',
    type: 'attack',
    rarity: 'rare',
    cost: 2,
    target: 'all_enemies',
    icon: '💀',
    exhaust: true,
    desc: '소멸. 모든 적에게 {dmg:4} 피해를 주고 방어되지 않은 피해만큼 체력을 회복합니다.',
    upgrade: { desc: '소멸. 모든 적에게 {dmg:5} 피해를 주고 방어되지 않은 피해만큼 체력을 회복합니다.' },
    play: (card, player, target, combat) => {
      let totalHeal = 0;
      combat.enemies.forEach(e => {
        if (!e.dead) {
          const dmg = card.calculateDamage(card.upgraded ? 5 : 4, player, e);
          const unblocked = Math.max(0, dmg - e.block);
          e.takeDamage(dmg, player, combat);
          totalHeal += unblocked;
        }
      });
      if (totalHeal > 0) player.heal(totalHeal);
    }
  },
  {
    id: 'impervious',
    name: '난공불락 (Impervious)',
    type: 'skill',
    rarity: 'rare',
    cost: 2,
    target: 'self',
    icon: '🏰',
    exhaust: true,
    desc: '소멸. {blk:30} 방어도를 얻습니다.',
    upgrade: { desc: '소멸. {blk:40} 방어도를 얻습니다.' },
    play: (card, player, target, combat) => {
      const blk = card.calculateBlock(card.upgraded ? 40 : 30, player);
      player.addBlock(blk);
    }
  },
  {
    id: 'offering',
    name: '제물 (Offering)',
    type: 'skill',
    rarity: 'rare',
    cost: 0,
    target: 'self',
    icon: '🕯️',
    exhaust: true,
    desc: '소멸. 체력을 6 잃습니다. 에너지를 2 얻고 카드를 3장 뽑습니다.',
    upgrade: { desc: '소멸. 체력을 6 잃습니다. 에너지를 2 얻고 카드를 5장 뽑습니다.' },
    play: (card, player, target, combat) => {
      player.hp = Math.max(1, player.hp - 6);
      combat.gainEnergy(2);
      combat.drawCards(card.upgraded ? 5 : 3);
    }
  },
  {
    id: 'demon_form',
    name: '악마화 (Demon Form)',
    type: 'power',
    rarity: 'rare',
    cost: 3,
    target: 'self',
    icon: '👿',
    desc: '매 턴 시작 시 힘을 2 얻습니다.',
    upgrade: { desc: '매 턴 시작 시 힘을 3 얻습니다.' },
    play: (card, player, target, combat) => {
      player.addStatus('demon_form', card.upgraded ? 3 : 2);
    }
  },
  {
    id: 'barricade',
    name: '바리케이드 (Barricade)',
    type: 'power',
    rarity: 'rare',
    cost: 3,
    target: 'self',
    icon: '🚧',
    desc: '턴 시작 시 방어도가 사라지지 않습니다.',
    upgrade: { cost: 2, desc: '턴 시작 시 방어도가 사라지지 않습니다.' },
    play: (card, player, target, combat) => {
      player.hasBarricade = true;
    }
  }
];

class CardManager {
  static getStarterDeck() {
    const deck = [];
    // 5 Strikes, 4 Defends, 1 Bash
    for (let i = 0; i < 5; i++) deck.push(new Card(CARD_DATABASE.find(c => c.id === 'strike')));
    for (let i = 0; i < 4; i++) deck.push(new Card(CARD_DATABASE.find(c => c.id === 'defend')));
    deck.push(new Card(CARD_DATABASE.find(c => c.id === 'bash')));
    return deck;
  }

  static getRandomRewardCards(count = 3) {
    const nonStarters = CARD_DATABASE.filter(c => c.rarity !== 'starter');
    const chosen = [];
    for (let i = 0; i < count; i++) {
      const def = nonStarters[Math.floor(Math.random() * nonStarters.length)];
      chosen.push(new Card(def));
    }
    return chosen;
  }
}

window.Card = Card;
window.CARD_DATABASE = CARD_DATABASE;
window.CardManager = CardManager;
