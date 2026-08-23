/* ==========================================================================
   SUNNYVALE MEADOW - PIERRE'S COUNTRY SHOP
   Seeds, livestock, animal feed, and automated sprinklers
   ========================================================================== */

const SHOP_CATALOG = {
  seeds: [
    { id: 'seed_strawberry', name: '딸기 씨앗', icon: '🍓', price: 30, desc: '3일 후 수확 (다회 수확 가능)', cropId: 'strawberry' },
    { id: 'seed_corn', name: '옥수수 씨앗', icon: '🌽', price: 40, desc: '4일 후 수확 (다회 수확 가능)', cropId: 'corn' },
    { id: 'seed_carrot', name: '당근 씨앗', icon: '🥕', price: 20, desc: '2일 후 수확 (빠른 성장)', cropId: 'carrot' },
    { id: 'seed_pumpkin', name: '호박 씨앗', icon: '🎃', price: 80, desc: '5일 후 대왕 호박 수확 (고가)', cropId: 'pumpkin' },
    { id: 'seed_sunflower', name: '해바라기 씨앗', icon: '🌻', price: 45, desc: '3일 후 화사한 꽃 수확', cropId: 'sunflower' },
    { id: 'seed_blueberry', name: '블루베리 씨앗', icon: '🫐', price: 50, desc: '4일 후 수확 (다회 수확)', cropId: 'blueberry' },
    { id: 'seed_watermelon', name: '수박 씨앗', icon: '🍉', price: 90, desc: '5일 후 달콤한 수박 수확', cropId: 'watermelon' },
    { id: 'seed_tomato', name: '토마토 씨앗', icon: '🍅', price: 30, desc: '3일 후 수확 (다회 수확)', cropId: 'tomato' }
  ],
  animals: [
    { id: 'baby_chicken', name: '새끼 병아리', icon: '🐥', price: 250, desc: '달걀을 낳는 귀여운 병아리', animalType: 'chicken' },
    { id: 'baby_cow', name: '송아지', icon: '🐮', price: 800, desc: '신선한 우유를 생산하는 젖소', animalType: 'cow' },
    { id: 'baby_sheep', name: '새끼 양', icon: '🐑', price: 650, desc: '고급 양모를 생산하는 양', animalType: 'sheep' },
    { id: 'animal_feed', name: '유기농 건초 사료', icon: '🌾', price: 15, desc: '가축의 하트와 생산량을 증가', feed: true }
  ],
  upgrades: [
    { id: 'copper_can', name: '황동 물뿌리개', icon: '🫗', price: 500, desc: '한 번에 3칸의 작물에 물을 줍니다.', upgradeId: 'water_can_1' },
    { id: 'sprinkler', name: '자동 스프링클러', icon: '⚙️', price: 1200, desc: '매일 아침 주변 4칸을 자동으로 관수', upgradeId: 'sprinkler' }
  ]
};

class ShopManager {
  static populateGoods(tab, containerEl, game) {
    containerEl.innerHTML = '';
    const items = SHOP_CATALOG[tab] || [];

    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'goods-card';
      card.innerHTML = `
        <div class="goods-icon">${item.icon}</div>
        <div class="goods-title">${item.name}</div>
        <div class="goods-desc">${item.desc}</div>
        <div class="goods-price">🪙 ${item.price} G</div>
      `;

      card.addEventListener('click', () => {
        if (game.gold >= item.price) {
          game.gold -= item.price;
          window.cozyAudio.playSFX('coin');
          
          if (item.cropId) {
            // Add Seed to inventory
            game.addItemToInventory({
              id: item.id,
              name: item.name,
              icon: item.icon,
              type: 'seed',
              cropId: item.cropId,
              count: 1
            });
          } else if (item.animalType) {
            // Add Animal to farm
            game.farm.animals.push(new FarmAnimal(item.animalType, 200 + Math.random() * 200, 250 + Math.random() * 150));
            window.cozyAudio.playSFX('pet_heart');
            game.showToast(`🐮 새로운 ${item.name}이(가) 목장에 도착했습니다!`);
          } else if (item.feed) {
            game.addItemToInventory({
              id: item.id,
              name: item.name,
              icon: item.icon,
              type: 'feed',
              count: 5
            });
          }

          game.updateHUD();
          game.showToast(`${item.name} 구매 완료!`);
        } else {
          game.showToast('골드가 부족합니다!');
        }
      });

      containerEl.appendChild(card);
    });
  }
}

window.ShopManager = ShopManager;
