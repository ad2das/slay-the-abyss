/* ==========================================================================
   SLAY THE ABYSS - RELICS DATABASE & TRIGGERS
   ========================================================================== */

const RELIC_DATA = {
  burning_blood: {
    id: 'burning_blood',
    name: '불타는 혈액 (Burning Blood)',
    icon: '🩸',
    rarity: 'starter',
    desc: '전투 종료 시 체력을 6 회복합니다.',
    onBattleEnd: (player) => {
      player.heal(6);
    }
  },

  vajra: {
    id: 'vajra',
    name: '금강저 (Vajra)',
    icon: '⚡',
    rarity: 'common',
    desc: '전투 시작 시 힘을 1 얻습니다.',
    onBattleStart: (player) => {
      player.addStatus('strength', 1);
    }
  },

  anchor: {
    id: 'anchor',
    name: '닻 (Anchor)',
    icon: '⚓',
    rarity: 'common',
    desc: '전투의 첫 번째 턴 시작 시 방어도를 10 얻습니다.',
    onBattleStart: (player) => {
      player.addBlock(10);
    }
  },

  bronze_scales: {
    id: 'bronze_scales',
    name: '청동 비늘 (Bronze Scales)',
    icon: '🛡️',
    rarity: 'common',
    desc: '전투 시작 시 가시를 3 얻습니다. (피격 시 공격자에게 3 피해 반사)',
    onBattleStart: (player) => {
      player.addStatus('thorns', 3);
    }
  },

  sundial: {
    id: 'sundial',
    name: '해시계 (Sundial)',
    icon: '☀️',
    rarity: 'uncommon',
    desc: '덱을 3번 셔플할 때마다 에너지를 2 얻습니다.',
    onShuffle: (player, combat) => {
      player.shuffleCount = (player.shuffleCount || 0) + 1;
      if (player.shuffleCount % 3 === 0) {
        combat.gainEnergy(2);
      }
    }
  },

  meat_on_bone: {
    id: 'meat_on_bone',
    name: '뼈에 붙은 고기 (Meat on the Bone)',
    icon: '🍖',
    rarity: 'uncommon',
    desc: '체력이 50% 이하인 상태로 전투를 끝내면 체력을 12 회복합니다.',
    onBattleEnd: (player) => {
      if (player.hp <= player.maxHp * 0.5) {
        player.heal(12);
      }
    }
  },

  pantograph: {
    id: 'pantograph',
    name: '팬터그래프 (Pantograph)',
    icon: '📐',
    rarity: 'uncommon',
    desc: '보스 전투 시작 시 체력을 25 회복합니다.',
    onBattleStart: (player, combat, isBoss) => {
      if (isBoss) {
        player.heal(25);
      }
    }
  },

  ice_cream: {
    id: 'ice_cream',
    name: '아이스크림 (Ice Cream)',
    icon: '🍦',
    rarity: 'rare',
    desc: '턴이 끝날 때 사용하지 않고 남은 에너지가 보존됩니다.',
    onTurnEnd: (player, combat) => {
      // Handled in combat turn cleanup
    }
  },

  dead_branch: {
    id: 'dead_branch',
    name: '마른 가지 (Dead Branch)',
    icon: '🪵',
    rarity: 'rare',
    desc: '카드가 소멸(Exhaust)될 때마다 무작위 카드 1장을 손으로 가져옵니다.',
    onExhaustCard: (player, combat) => {
      combat.addRandomCardToHand();
    }
  }
};

window.RELIC_DATA = RELIC_DATA;
