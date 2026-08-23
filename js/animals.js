/* ==========================================================================
   SUNNYVALE MEADOW - ANIMAL HUSBANDRY (COWS, CHICKENS, SHEEP)
   ========================================================================== */

class FarmAnimal {
  constructor(type, x, y) {
    this.id = `${type}_${Math.random().toString(36).substr(2, 6)}`;
    this.type = type; // 'chicken', 'cow', 'sheep'
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.targetY = y;
    this.speed = type === 'chicken' ? 0.6 : 0.4;
    this.hearts = 0;
    this.pettedToday = false;
    this.fedToday = true;
    this.wanderTimer = Math.random() * 3;

    this.setupType();
  }

  setupType() {
    if (this.type === 'chicken') {
      this.name = '꼬꼬 닭';
      this.icon = '🐔';
      this.produceId = 'egg';
      this.produceName = '신선한 달걀';
      this.produceIcon = '🥚';
      this.producePrice = 50;
    } else if (this.type === 'cow') {
      this.name = '얼룩 송아지';
      this.icon = '🐮';
      this.produceId = 'milk';
      this.produceName = '고소한 우유';
      this.produceIcon = '🥛';
      this.producePrice = 140;
    } else if (this.type === 'sheep') {
      this.name = '폭신 양';
      this.icon = '🐑';
      this.produceId = 'wool';
      this.produceName = '부드러운 양모';
      this.produceIcon = '🧶';
      this.producePrice = 220;
    }
  }

  update(dt, farm) {
    this.wanderTimer -= dt;
    if (this.wanderTimer <= 0) {
      this.wanderTimer = 3 + Math.random() * 4;
      // Pick random nearby pasture point
      const range = 60;
      this.targetX = Math.max(100, Math.min(600, this.x + (Math.random() * 2 - 1) * range));
      this.targetY = Math.max(100, Math.min(500, this.y + (Math.random() * 2 - 1) * range));
    }

    // Move toward target
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 2) {
      this.x += (dx / dist) * this.speed;
      this.y += (dy / dist) * this.speed;
    }
  }

  pet(game) {
    if (this.pettedToday) return false;
    this.pettedToday = true;
    this.hearts = Math.min(5, this.hearts + 1);
    window.cozyAudio.playSFX('pet_heart');
    game.showFloatingText(this.x, this.y - 20, '❤️ +1 Heart!', '#f43f5e');
    return true;
  }

  advanceDay(game) {
    this.pettedToday = false;
    // Produce items if fed
    if (this.fedToday) {
      const bonus = 1 + (this.hearts >= 4 ? 0.5 : 0);
      const produceItem = {
        id: this.produceId,
        name: `${this.produceName}${this.hearts >= 4 ? ' (특상품 ⭐)' : ''}`,
        icon: this.produceIcon,
        type: 'produce',
        sellPrice: Math.round(this.producePrice * bonus),
        count: 1
      };
      game.addItemToInventory(produceItem);
    }
  }
}

window.FarmAnimal = FarmAnimal;
