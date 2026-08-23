/* ==========================================================================
   SLAY THE ABYSS - ENEMY BEHAVIOR & INTENT ENGINE
   ========================================================================== */

class Unit {
  constructor(name, maxHp, visual = '👹') {
    this.name = name;
    this.maxHp = maxHp;
    this.hp = maxHp;
    this.block = 0;
    this.visual = visual;
    this.status = {
      strength: 0,
      dexterity: 0,
      vulnerable: 0,
      weak: 0,
      frail: 0,
      ritual: 0,
      thorns: 0,
      metallicize: 0,
      flame_barrier: 0,
      demon_form: 0
    };
    this.dead = false;
  }

  addBlock(amount) {
    if (amount <= 0) return;
    this.block += amount;
    window.soundEngine.playSFX('block');
  }

  addStatus(name, amount) {
    this.status[name] = (this.status[name] || 0) + amount;
    if (['vulnerable', 'weak', 'frail'].includes(name)) {
      window.soundEngine.playSFX('debuff');
    } else {
      window.soundEngine.playSFX('buff');
    }
  }

  takeDamage(amount, source, combat) {
    if (this.dead) return;

    let unblocked = amount;
    if (this.block > 0) {
      if (this.block >= unblocked) {
        this.block -= unblocked;
        unblocked = 0;
        window.soundEngine.playSFX('block');
      } else {
        unblocked -= this.block;
        this.block = 0;
      }
    }

    if (unblocked > 0) {
      this.hp -= unblocked;
      window.soundEngine.playSFX(unblocked >= 20 ? 'heavy_slash' : 'attack_slash');

      // Flame barrier & Thorns trigger
      if (this.status.flame_barrier > 0 && source) {
        source.takeDamage(this.status.flame_barrier, null, combat);
      }
      if (this.status.thorns > 0 && source) {
        source.takeDamage(this.status.thorns, null, combat);
      }

      if (this.hp <= 0) {
        this.hp = 0;
        this.dead = true;
      }
    }
  }

  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }
}

class EnemyUnit extends Unit {
  constructor(def) {
    super(def.name, def.hp, def.visual);
    this.type = def.type; // 'normal', 'elite', 'boss'
    this.moves = def.moves;
    this.aiPattern = def.aiPattern;
    this.moveHistory = [];
    this.currentIntent = null;
    this.goldReward = def.goldReward || 15;

    this.planNextMove();
  }

  planNextMove(turnCount = 1) {
    this.currentIntent = this.aiPattern(this, turnCount);
  }

  executeMove(player, combat) {
    if (this.dead || !this.currentIntent) return;

    const intent = this.currentIntent;
    if (intent.type === 'attack' || intent.type === 'attack_debuff') {
      let dmg = intent.damage + (this.status.strength || 0);
      if (this.status.weak > 0) dmg = Math.floor(dmg * 0.75);
      if (player.status.vulnerable > 0) dmg = Math.floor(dmg * 1.5);
      dmg = Math.max(0, dmg);

      for (let i = 0; i < (intent.hits || 1); i++) {
        player.takeDamage(dmg, this, combat);
      }
    }

    if (intent.block) {
      this.addBlock(intent.block);
    }

    if (intent.buff) {
      intent.buff(this, player, combat);
    }

    if (intent.debuff) {
      intent.debuff(this, player, combat);
    }
  }
}

const ENEMY_DATABASE = {
  cultist: {
    name: '사교도 (Cultist)',
    hp: 50,
    visual: '🧙',
    type: 'normal',
    goldReward: 18,
    aiPattern: (self, turn) => {
      if (turn === 1) {
        return {
          type: 'buff',
          icon: '🔥',
          name: '의식 (Ritual)',
          desc: '매 턴 힘을 3 얻습니다.',
          buff: (e) => e.addStatus('ritual', 3)
        };
      }
      return {
        type: 'attack',
        icon: '⚔️',
        damage: 6,
        hits: 1,
        name: '어둠의 일격 (Dark Strike)',
        desc: '6 피해를 줍니다.'
      };
    }
  },

  jaw_worm: {
    name: '턱벌레 (Jaw Worm)',
    hp: 44,
    visual: '🐛',
    type: 'normal',
    goldReward: 16,
    aiPattern: (self, turn) => {
      const roll = Math.random();
      if (turn === 1 || roll < 0.45) {
        return {
          type: 'attack',
          icon: '⚔️',
          damage: 11,
          hits: 1,
          name: '물어뜯기 (Chomp)',
          desc: '11 피해를 줍니다.'
        };
      } else if (roll < 0.75) {
        return {
          type: 'buff',
          icon: '🛡️',
          name: '포효 (Bellow)',
          block: 6,
          desc: '6 방어도를 얻고 힘을 3 얻습니다.',
          buff: (e) => e.addStatus('strength', 3)
        };
      } else {
        return {
          type: 'attack',
          icon: '⚔️',
          damage: 7,
          hits: 1,
          block: 5,
          name: '몸통 박치기 (Thrash)',
          desc: '7 피해를 주고 5 방어도를 얻습니다.'
        };
      }
    }
  },

  gremlin_nob: {
    name: '그렘린 노브 (Gremlin Nob)',
    hp: 85,
    visual: '👹',
    type: 'elite',
    goldReward: 35,
    aiPattern: (self, turn) => {
      if (turn === 1) {
        return {
          type: 'buff',
          icon: '💢',
          name: '광란의 외침 (Bellow)',
          desc: '플레이어가 스킬 카드를 쓸 때마다 힘을 2 얻습니다.',
          buff: (e) => { e.enrageOnSkill = true; }
        };
      }
      if (turn % 3 === 0) {
        return {
          type: 'attack_debuff',
          icon: '💥',
          damage: 8,
          hits: 1,
          name: '두개골 부수기 (Skull Bash)',
          desc: '8 피해를 주고 취약을 2 부여합니다.',
          debuff: (e, p) => p.addStatus('vulnerable', 2)
        };
      }
      return {
        type: 'attack',
        icon: '⚔️',
        damage: 14,
        hits: 1,
        name: '돌진 (Rush)',
        desc: '14 피해를 줍니다.'
      };
    }
  },

  the_guardian: {
    name: '수호자 (The Guardian)',
    hp: 240,
    visual: '🗿',
    type: 'boss',
    goldReward: 100,
    aiPattern: (self, turn) => {
      const cycle = turn % 4;
      if (cycle === 1) {
        return {
          type: 'attack',
          icon: '⚔️',
          damage: 32,
          hits: 1,
          name: '격렬한 강타 (Fierce Slam)',
          desc: '32의 괴멸적인 일격을 가합니다.'
        };
      } else if (cycle === 2) {
        return {
          type: 'attack',
          icon: '🌪️',
          damage: 5,
          hits: 4,
          name: '선풍 회전 (Whirlwind)',
          desc: '5 피해를 4회 줍니다.'
        };
      } else {
        return {
          type: 'buff',
          icon: '🛡️',
          block: 15,
          name: '방어 형태 (Defensive Shell)',
          desc: '15 방어도를 얻고 가시를 3 얻습니다.',
          buff: (e) => e.addStatus('thorns', 3)
        };
      }
    }
  }
};

window.Unit = Unit;
window.EnemyUnit = EnemyUnit;
window.ENEMY_DATABASE = ENEMY_DATABASE;
