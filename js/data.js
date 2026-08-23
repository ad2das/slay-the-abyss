/* ==========================================================================
   ABYSSAL SLAYER: DATA DEFINITIONS & REGISTRY
   Classes, Godly Boons, Relics, Sanctuary Talents, Enemies & Bosses
   ========================================================================== */

const HERO_CLASSES = {
  shadow_blade: {
    id: 'shadow_blade',
    name: '섀도우 블레이드',
    role: '민첩형 쾌속 암살자',
    icon: '🗡️',
    color: '#38bdf8',
    maxHp: 280,
    maxMp: 100,
    speed: 4.8,
    attackPower: 32,
    critRate: 0.25,
    critMult: 2.2,
    dashCd: 0.8,
    maxDashes: 2,
    skills: {
      skill1: { name: '그림자 수리검', icon: '🌀', cd: 3.5, mp: 20, desc: '관통하는 표창 3발을 부채꼴로 투척합니다.' },
      skill2: { name: '그림자 분신', icon: '👥', cd: 7.0, mp: 35, desc: '전방에 분신을 생성해 주변 적을 연속 난무합니다.' },
      ult: { name: '어비스 익스큐션', icon: '⚔️', cd: 14.0, mp: 60, desc: '화면 내 모든 적에게 시공을 가르는 즉결 참격을 퍼붓습니다.' }
    }
  },
  pyromancer: {
    id: 'pyromancer',
    name: '아케인 파이로',
    role: '광역 화염 마도사',
    icon: '🔮',
    color: '#f97316',
    maxHp: 240,
    maxMp: 140,
    speed: 4.3,
    attackPower: 38,
    critRate: 0.15,
    critMult: 1.9,
    dashCd: 1.0,
    maxDashes: 2,
    skills: {
      skill1: { name: '화염 작열탄', icon: '🔥', cd: 3.0, mp: 25, desc: '착탄 시 대폭발을 일으키는 거대 화염구를 발사합니다.' },
      skill2: { name: '서리 노바', icon: '❄️', cd: 6.0, mp: 30, desc: '자신 주위 모든 적을 빙결시키고 이동속도를 둔화시킵니다.' },
      ult: { name: '메테오 스트라이크', icon: '☄️', cd: 16.0, mp: 70, desc: '하늘에서 4개의 파멸 운석을 낙하시켜 지옥불을 생성합니다.' }
    }
  },
  berserker: {
    id: 'berserker',
    name: '블러드 버서커',
    role: '파괴형 흡혈 전사',
    icon: '🪓',
    color: '#ef4444',
    maxHp: 380,
    maxMp: 80,
    speed: 4.1,
    attackPower: 45,
    critRate: 0.18,
    critMult: 2.0,
    dashCd: 1.2,
    maxDashes: 2,
    skills: {
      skill1: { name: '대검 휠윈드', icon: '🌪️', cd: 4.0, mp: 20, desc: '대검을 회전하며 주위 적을 끌어당겨 베어냅니다.' },
      skill2: { name: '지진 강타', icon: '💥', cd: 6.5, mp: 25, desc: '지면을 강타하여 전방 일직선에 지진 충격파를 분출합니다.' },
      ult: { name: '아수라 광폭화', icon: '🩸', cd: 15.0, mp: 50, desc: '6초간 흡혈율 50% & 공격속도 100% 상승 불멸 모드에 돌입합니다.' }
    }
  }
};

const GOD_DOMAINS = [
  { id: 'zeus', name: '천둥의 군주 - 제피로스', icon: '⚡', quote: '심연의 악귀들에게 벼락의 심판을 내리거라.' },
  { id: 'ares', name: '전쟁의 화신 - 바알', icon: '🩸', quote: '피에는 피로, 파괴에는 더 큰 파괴로 답하라.' },
  { id: 'artemis', name: '사냥의 여신 - 셀레네', icon: '🏹', quote: '약점을 포착하면 일격에 숨통을 끊어라.' },
  { id: 'hades', name: '심연의 망령 - 타나토스', icon: '💀', quote: '어둠의 장막이 너의 칼날을 축복하리라.' }
];

const GODLY_BOONS = [
  // Zeus Boons
  {
    id: 'thunder_dash',
    domain: 'zeus',
    name: '뇌전의 질주 (Thunder Dash)',
    rarity: 'rare',
    desc: '대시 시 잔상 위치에 번개가 내리쳐 주변 적에게 40의 연쇄 감전 피해를 줍니다.',
    apply: (p) => { p.boonThunderDash = true; }
  },
  {
    id: 'chain_lightning',
    domain: 'zeus',
    name: '연쇄 방전 (Chain Spark)',
    rarity: 'epic',
    desc: '기본 공격 적중 시 30% 확률로 주위 3체의 적에게 번개가 튕깁니다.',
    apply: (p) => { p.boonChainLightning = true; }
  },
  {
    id: 'lightning_rod',
    domain: 'zeus',
    name: '천둥의 분노 (Storm Wrath)',
    rarity: 'legendary',
    desc: '스킬 시전 시마다 전장에 벼락 폭풍이 2초간 지속됩니다.',
    apply: (p) => { p.boonStormWrath = true; }
  },

  // Ares Boons
  {
    id: 'blood_blade',
    domain: 'ares',
    name: '피의 갈증 (Bloodthirst)',
    rarity: 'rare',
    desc: '적 처치 시 체력을 8 회복하고 3초간 공격력이 15% 증가합니다.',
    apply: (p) => { p.boonBloodthirst = true; }
  },
  {
    id: 'infernal_strike',
    domain: 'ares',
    name: '작열하는 일격 (Infernal Cut)',
    rarity: 'epic',
    desc: '모든 공격에 출혈 및 화염 디버프를 부여하여 3초간 초당 25의 지속 피해를 줍니다.',
    apply: (p) => { p.boonInfernalCut = true; }
  },
  {
    id: 'berserk_soul',
    domain: 'ares',
    name: '불굴의 투혼 (Indomitable Rage)',
    rarity: 'legendary',
    desc: '체력이 40% 이하일 때 받는 피해가 50% 감소하고 공격력이 2배 증가합니다.',
    apply: (p) => { p.boonIndomitable = true; }
  },

  // Artemis Boons
  {
    id: 'crit_eye',
    domain: 'artemis',
    name: '매의 눈 (Deadly Precision)',
    rarity: 'rare',
    desc: '치명타 확률이 18% 증가하고 치명타 피해량이 +50% 상승합니다.',
    apply: (p) => { p.critRate += 0.18; p.critMult += 0.5; }
  },
  {
    id: 'arrow_barrage',
    domain: 'artemis',
    name: '영혼 관통화살 (Soul Piercer)',
    rarity: 'epic',
    desc: '치명타 적중 시 적에게서 유도 영혼 화살 2발이 솟구쳐 추가 타격합니다.',
    apply: (p) => { p.boonSoulArrows = true; }
  },

  // Hades Boons
  {
    id: 'shadow_step',
    domain: 'hades',
    name: '그림자 은신 (Shadow Veil)',
    rarity: 'rare',
    desc: '대시 중 완전 무적(I-Frame) 시간이 0.25초 증가하고 대시 쿨타임이 25% 감소합니다.',
    apply: (p) => { p.dashIFrameExtra = 0.25; p.dashCd *= 0.75; }
  },
  {
    id: 'abyssal_curse',
    domain: 'hades',
    name: '심연의 낙인 (Abyssal Curse)',
    rarity: 'epic',
    desc: '공격당한 적은 방어력이 40% 감소하며 사망 시 폭발하여 주위에 80 피해를 줍니다.',
    apply: (p) => { p.boonAbyssCurse = true; }
  },
  {
    id: 'reaper_scythe',
    domain: 'hades',
    name: '사신의 심판 (Reaper Judgment)',
    rarity: 'legendary',
    desc: '체력이 20% 이하인 일반 몬스터를 즉사시킵니다.',
    apply: (p) => { p.boonReaperExecute = true; }
  }
];

const SANCTUARY_TALENTS = [
  { id: 'max_hp', name: '영혼의 강건함', icon: '❤️', maxLevel: 5, costPerLvl: 10, desc: '최대 체력 +30 증가' },
  { id: 'atk_power', name: '심연의 파괴력', icon: '⚔️', maxLevel: 5, costPerLvl: 15, desc: '기본 공격력 +8% 증가' },
  { id: 'crit_mastery', name: '치명적 직관', icon: '🎯', maxLevel: 5, costPerLvl: 20, desc: '치명타율 +4% 증가' },
  { id: 'dash_mastery', name: '신속의 축복', icon: '💨', maxLevel: 3, costPerLvl: 30, desc: '대시 충전수 +1회 및 이동속도 +5%' },
  { id: 'gold_find', name: '미다스의 탐욕', icon: '💰', maxLevel: 5, costPerLvl: 12, desc: '골드 획득량 +15% 증가' },
  { id: 'revive_grace', name: '불멸자의 은총', icon: '✨', maxLevel: 1, costPerLvl: 100, desc: '사망 시 1회 50% 체력으로 부활' }
];

const MERCHANT_ITEMS = [
  { id: 'potion_hp', name: '심연의 활력 영약', icon: '🧪', cost: 70, desc: '체력을 120 즉시 회복합니다.', type: 'heal', val: 120 },
  { id: 'potion_max_hp', name: '고대 거인의 정수', icon: '🏺', cost: 130, desc: '최대 체력을 +50 영구 증가시키고 모두 회복합니다.', type: 'max_hp', val: 50 },
  { id: 'relic_atk', name: '흑요석 칼날', icon: '🗡️', cost: 160, desc: '공격력이 +15 증가합니다.', type: 'atk', val: 15 },
  { id: 'relic_speed', name: '바람의 장화', icon: '👢', cost: 110, desc: '이동속도가 +15% 빨라집니다.', type: 'speed', val: 0.15 }
];
