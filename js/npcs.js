/* ==========================================================================
   HARVEST MOON: MINERAL MEADOW - NPCS & FRIENDSHIP ENGINE
   ========================================================================== */

const NPCS = {
  mayor: {
    id: 'mayor',
    name: '촌장 토마스 (Mayor Thomas)',
    portrait: '👨‍🌾',
    hearts: 3,
    zone: 'farm',
    x: 220,
    y: 80,
    likedGift: 'turnip_crop',
    dialogues: [
      "자네가 목장을 잘 가꾸어주어 마을에 활기가 도는군!",
      "온천은 피로를 푸는 데 최고라네. 꼭 들러보게나.",
      "오후 5시가 되면 잭이 출하물을 수거해가니 상자에 미리 넣어두게!"
    ]
  },
  popuri: {
    id: 'popuri',
    name: '포푸리 (Popuri)',
    portrait: '🌸',
    hearts: 2,
    zone: 'town',
    x: 160,
    y: 180,
    likedGift: 'straw_crop',
    dialogues: [
      "안녕! 우리 집 꼬꼬들도 매일 신선한 달걀을 낳고 있어~",
      "달콤한 딸기는 내가 제일 좋아하는 과일이야! 헤헤.",
      "목장 일은 힘들지 않아? 언제든 놀러와!"
    ]
  },
  saibara: {
    id: 'saibara',
    name: '대장장이 사이바라 (Saibara)',
    portrait: '⚒️',
    hearts: 2,
    zone: 'town',
    x: 320,
    y: 140,
    likedGift: 'gold_ore',
    dialogues: [
      "도구를 강화하고 싶다면 광산에서 캔 광석을 가져오게.",
      "좋은 도구는 일손을 3배로 덜어주는 법이지!",
      "구리, 은, 금광석을 캐오면 3x3 범위 작업이 가능한 도구로 개조해주마."
    ]
  },
  zack: {
    id: 'zack',
    name: '출하업자 잭 (Zack)',
    portrait: '🤠',
    hearts: 3,
    zone: 'farm',
    x: 270,
    y: 180,
    likedGift: 'milk',
    dialogues: [
      "매일 오후 5시에 출하 상자를 확인하러 오네. 열심히 농사짓게나!",
      "자네가 생산한 우유와 농산물은 도시에서도 인기가 아주 좋아.",
      "오늘도 가득 채워두면 두둑한 골드로 보답하지!"
    ]
  }
};

window.NPCS = NPCS;
