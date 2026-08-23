/* ==========================================================================
   HARVEST MOON: MINERAL MEADOW - COOKING & RECIPES ENGINE
   Craft delicious meals from harvested crops, milk, and eggs to restore stamina!
   ========================================================================== */

const RECIPES = [
  {
    id: 'turnip_salad',
    name: '아삭 순무 샐러드 (Turnip Salad)',
    icon: '🥗',
    staminaRestore: 35,
    desc: '신선한 순무로 만든 상큼한 샐러드 (체력 +35 회복)',
    ingredients: [{ id: 'turnip_crop', name: '순무', count: 1 }]
  },
  {
    id: 'strawberry_jam',
    name: '달콤 딸기 잼 (Strawberry Jam)',
    icon: '🍓',
    staminaRestore: 50,
    desc: '완숙 딸기를 뭉근하게 졸여 만든 수제 잼 (체력 +50 회복)',
    ingredients: [{ id: 'straw_crop', name: '딸기', count: 1 }]
  },
  {
    id: 'rolled_omelet',
    name: '신선한 계란말이 (Rolled Omelet)',
    icon: '🍳',
    staminaRestore: 55,
    desc: '목장 암탉이 낳은 달걀로 부친 폭신한 요리 (체력 +55 회복)',
    ingredients: [{ id: 'fresh_egg', name: '달걀', count: 1 }]
  },
  {
    id: 'farm_butter',
    name: '목장 수제 버터 (Farm Butter)',
    icon: '🧈',
    staminaRestore: 45,
    desc: '신선한 우유의 유지방을 분리해 만든 고소한 버터 (체력 +45 회복)',
    ingredients: [{ id: 'milk', name: '우유', count: 1 }]
  },
  {
    id: 'grilled_fish',
    name: '은빛 생선구이 (Grilled Fish)',
    icon: '🐟',
    staminaRestore: 65,
    desc: '미네랄 강에서 낚아 소금을 쳐 노릇하게 구운 생선 (체력 +65 회복)',
    ingredients: [{ id: 'fish_item', name: '물고기', count: 1 }]
  },
  {
    id: 'pumpkin_pie',
    name: '황금 호박 파이 (Pumpkin Pie)',
    icon: '🥧',
    staminaRestore: 85,
    desc: '가을 호박과 달걀로 구운 달콤하고 든든한 파이 (체력 +85 회복)',
    ingredients: [{ id: 'pumpkin_crop', name: '호박', count: 1 }, { id: 'fresh_egg', name: '달걀', count: 1 }]
  },
  {
    id: 'mineral_stew',
    name: '미네랄 특제 스튜 (Mineral Stew)',
    icon: '🍲',
    staminaRestore: 100,
    desc: '순무, 우유, 옥수수를 듬뿍 넣어 끓인 전설의 보양 스튜 (체력 100% 회복)',
    ingredients: [{ id: 'turnip_crop', name: '순무', count: 1 }, { id: 'milk', name: '우유', count: 1 }]
  }
];

class CookingManager {
  static populateKitchenUI(containerEl, game) {
    containerEl.innerHTML = '';

    RECIPES.forEach(recipe => {
      const canCook = recipe.ingredients.every(req => {
        const item = game.rucksack.find(i => i.id === req.id);
        return item && item.count >= req.count;
      });

      const row = document.createElement('div');
      row.className = 'recipe-row';
      row.innerHTML = `
        <div class="recipe-info">
          <div class="recipe-icon">${recipe.icon}</div>
          <div>
            <div class="recipe-title">${recipe.name}</div>
            <div class="recipe-desc">${recipe.desc}</div>
            <div style="font-size:10px; color:#b45309; margin-top:2px;">재료: ${recipe.ingredients.map(r => `${r.name} x${r.count}`).join(', ')}</div>
          </div>
        </div>
        <button class="btn-cook-recipe" ${canCook ? '' : 'disabled style="opacity:0.5; cursor:not-allowed;"'}>요리하기</button>
      `;

      row.querySelector('.btn-cook-recipe').addEventListener('click', () => {
        if (canCook) {
          // Deduct ingredients
          recipe.ingredients.forEach(req => {
            const item = game.rucksack.find(i => i.id === req.id);
            if (item) {
              item.count -= req.count;
              if (item.count <= 0) {
                game.rucksack = game.rucksack.filter(i => i.id !== req.id);
              }
            }
          });

          // Add Cooked Food to Rucksack
          game.addItemToRucksack({
            id: recipe.id,
            name: recipe.name,
            icon: recipe.icon,
            staminaRestore: recipe.staminaRestore,
            isFood: true,
            sellPrice: Math.round(recipe.staminaRestore * 2.5),
            count: 1
          });

          window.hmAudio.playSFX('harvest_pop');
          game.showToast(`🍳 ${recipe.name} 요리 완성!`);
          CookingManager.populateKitchenUI(containerEl, game);
          game.updateHUD();
        }
      });

      containerEl.appendChild(row);
    });
  }
}

window.RECIPES = RECIPES;
window.CookingManager = CookingManager;
