/* ==========================================================================
   SUNNYVALE MEADOW - CROPS & AGRICULTURE SYSTEM
   Growth stages, soil hydration, harvest yields, and crop quality RNG
   ========================================================================== */

const CROP_DEFINITIONS = {
  strawberry: {
    id: 'strawberry',
    name: '달콤 딸기 (Strawberry)',
    seedName: '딸기 씨앗',
    icon: '🍓',
    seedIcon: '🌱',
    growDays: 3,
    sellPrice: 120,
    seedPrice: 30,
    regrows: true,
    regrowDays: 2,
    color: '#ef4444'
  },
  corn: {
    id: 'corn',
    name: '황금 옥수수 (Corn)',
    seedName: '옥수수 씨앗',
    icon: '🌽',
    seedIcon: '🌱',
    growDays: 4,
    sellPrice: 160,
    seedPrice: 40,
    regrows: true,
    regrowDays: 2,
    color: '#eab308'
  },
  carrot: {
    id: 'carrot',
    name: '싱싱 당근 (Carrot)',
    seedName: '당근 씨앗',
    icon: '🥕',
    seedIcon: '🌱',
    growDays: 2,
    sellPrice: 70,
    seedPrice: 20,
    regrows: false,
    color: '#f97316'
  },
  pumpkin: {
    id: 'pumpkin',
    name: '대왕 호박 (Pumpkin)',
    seedName: '호박 씨앗',
    icon: '🎃',
    seedIcon: '🌱',
    growDays: 5,
    sellPrice: 320,
    seedPrice: 80,
    regrows: false,
    color: '#ea580c'
  },
  sunflower: {
    id: 'sunflower',
    name: '태양 해바라기 (Sunflower)',
    seedName: '해바라기 씨앗',
    icon: '🌻',
    seedIcon: '🌱',
    growDays: 3,
    sellPrice: 150,
    seedPrice: 45,
    regrows: false,
    color: '#facc15'
  },
  blueberry: {
    id: 'blueberry',
    name: '블루베리 (Blueberry)',
    seedName: '블루베리 씨앗',
    icon: '🫐',
    seedIcon: '🌱',
    growDays: 4,
    sellPrice: 190,
    seedPrice: 50,
    regrows: true,
    regrowDays: 2,
    color: '#3b82f6'
  },
  watermelon: {
    id: 'watermelon',
    name: '달콤 수박 (Watermelon)',
    seedName: '수박 씨앗',
    icon: '🍉',
    seedIcon: '🌱',
    growDays: 5,
    sellPrice: 380,
    seedPrice: 90,
    regrows: false,
    color: '#22c55e'
  },
  tomato: {
    id: 'tomato',
    name: '완숙 토마토 (Tomato)',
    seedName: '토마토 씨앗',
    icon: '🍅',
    seedIcon: '🌱',
    growDays: 3,
    sellPrice: 110,
    seedPrice: 30,
    regrows: true,
    regrowDays: 2,
    color: '#dc2626'
  }
};

class CropInstance {
  constructor(cropId) {
    this.cropId = cropId;
    this.def = CROP_DEFINITIONS[cropId];
    this.daysGrown = 0;
    this.stage = 0; // 0: Seed, 1: Sprout, 2: Flowering, 3: Mature
    this.readyToHarvest = false;
  }

  advanceDay(isWatered) {
    if (!isWatered) return; // Must be watered to grow!

    this.daysGrown++;
    const totalDays = this.def.growDays;

    if (this.daysGrown >= totalDays) {
      this.stage = 3;
      this.readyToHarvest = true;
    } else if (this.daysGrown >= totalDays * 0.6) {
      this.stage = 2;
    } else if (this.daysGrown >= totalDays * 0.3) {
      this.stage = 1;
    }
  }

  harvest() {
    if (!this.readyToHarvest) return null;

    // Quality RNG
    const roll = Math.random();
    let quality = 'normal';
    let qualityMult = 1.0;
    if (roll < 0.15) { quality = 'gold'; qualityMult = 1.5; }
    else if (roll < 0.40) { quality = 'silver'; qualityMult = 1.25; }

    const harvestItem = {
      id: this.def.id,
      name: `${this.def.name}${quality === 'gold' ? ' (골드 ⭐⭐⭐)' : (quality === 'silver' ? ' (실버 ⭐)' : '')}`,
      icon: this.def.icon,
      type: 'crop',
      quality: quality,
      sellPrice: Math.round(this.def.sellPrice * qualityMult),
      count: 1
    };

    if (this.def.regrows) {
      this.daysGrown = this.def.growDays - this.def.regrowDays;
      this.stage = 2;
      this.readyToHarvest = false;
    }

    return harvestItem;
  }
}

window.CROP_DEFINITIONS = CROP_DEFINITIONS;
window.CropInstance = CropInstance;
