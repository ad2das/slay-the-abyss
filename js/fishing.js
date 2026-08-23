/* ==========================================================================
   SUNNYVALE MEADOW - MOBILE TOUCH FISHING SYSTEM & MINI-GAME
   ========================================================================== */

const FISH_SPECIES = [
  { id: 'carp', name: '은빛 붕어', icon: '🐟', price: 60, difficulty: 1.0 },
  { id: 'salmon', name: '신선한 연어', icon: '🍣', price: 120, difficulty: 1.3 },
  { id: 'trout', name: '무지개 송어', icon: '🐠', price: 180, difficulty: 1.6 },
  { id: 'golden_carp', name: '황금 잉어 (Rare)', icon: '🐡', price: 350, difficulty: 2.0 },
  { id: 'lobster', name: '대왕 랍스터', icon: '🦞', price: 500, difficulty: 2.4 },
  { id: 'legend_dragon', name: '전설의 용어 (Legendary)', icon: '🐉', price: 1000, difficulty: 3.0 }
];

class FishingManager {
  constructor(game) {
    this.game = game;
    this.modal = document.getElementById('modal-fishing');
    this.greenBar = document.getElementById('fish-green-bar');
    this.fishIcon = document.getElementById('fish-icon');
    this.progressFill = document.getElementById('fish-progress-fill');
    this.reelBtn = document.getElementById('btn-reel-fish');

    this.active = false;
    this.currentFish = null;
    this.barPos = 30; // %
    this.barVelocity = 0;
    this.fishPos = 50; // %
    this.fishTargetPos = 50;
    this.progress = 35; // %
    this.isReeling = false;
    this.timer = null;

    this.setupEvents();
  }

  setupEvents() {
    const startReel = (e) => {
      e.preventDefault();
      this.isReeling = true;
    };
    const stopReel = (e) => {
      e.preventDefault();
      this.isReeling = false;
    };

    this.reelBtn.addEventListener('mousedown', startReel);
    this.reelBtn.addEventListener('mouseup', stopReel);
    this.reelBtn.addEventListener('touchstart', startReel);
    this.reelBtn.addEventListener('touchend', stopReel);
  }

  startFishing() {
    this.active = true;
    this.modal.classList.remove('hidden');
    this.progress = 35;
    this.barPos = 25;
    this.barVelocity = 0;
    this.fishPos = 50;

    // Pick random fish
    const roll = Math.random();
    if (roll < 0.05) this.currentFish = FISH_SPECIES[5];
    else if (roll < 0.15) this.currentFish = FISH_SPECIES[4];
    else if (roll < 0.35) this.currentFish = FISH_SPECIES[3];
    else if (roll < 0.60) this.currentFish = FISH_SPECIES[2];
    else if (roll < 0.80) this.currentFish = FISH_SPECIES[1];
    else this.currentFish = FISH_SPECIES[0];

    this.fishIcon.innerText = this.currentFish.icon;
    window.cozyAudio.playSFX('water_splash');

    this.loop();
  }

  loop() {
    if (!this.active) return;

    // Physics
    if (this.isReeling) {
      this.barVelocity = Math.min(6, this.barVelocity + 0.6);
    } else {
      this.barVelocity = Math.max(-5, this.barVelocity - 0.5); // Gravity
    }
    this.barPos = Math.max(0, Math.min(100 - 28, this.barPos + this.barVelocity));

    // Fish AI Movement
    if (Math.random() < 0.08) {
      this.fishTargetPos = Math.random() * (100 - 15);
    }
    this.fishPos += (this.fishTargetPos - this.fishPos) * 0.06 * this.currentFish.difficulty;

    // Check if fish inside green bar
    const barHeight = 28;
    const isCatching = this.fishPos >= this.barPos && this.fishPos <= this.barPos + barHeight;

    if (isCatching) {
      this.progress = Math.min(100, this.progress + 0.6);
    } else {
      this.progress = Math.max(0, this.progress - 0.4);
    }

    // Update Visuals
    this.greenBar.style.bottom = `${this.barPos}%`;
    this.fishIcon.style.bottom = `${this.fishPos}%`;
    this.progressFill.style.height = `${this.progress}%`;

    // End conditions
    if (this.progress >= 100) {
      this.endFishing(true);
      return;
    } else if (this.progress <= 0) {
      this.endFishing(false);
      return;
    }

    requestAnimationFrame(() => this.loop());
  }

  endFishing(success) {
    this.active = false;
    this.modal.classList.add('hidden');

    if (success) {
      window.cozyAudio.playSFX('harvest_pop');
      const item = {
        id: this.currentFish.id,
        name: this.currentFish.name,
        icon: this.currentFish.icon,
        type: 'fish',
        sellPrice: this.currentFish.price,
        count: 1
      };
      this.game.addItemToInventory(item);
      this.game.showToast(`🎣 ${item.name}을(를) 낚았습니다!`);
    } else {
      this.game.showToast('물고기가 도망쳤습니다...');
    }
  }
}

window.FishingManager = FishingManager;
