/* ==========================================================================
   HARVEST MOON: MINERAL MEADOW - MAP & WORLD TILES ENGINE
   Farm, House Interior, Barn, Coop, Hot Springs, Mine & Town Transitions
   ========================================================================== */

const TILE_GRASS = 0;
const TILE_DIRT_PATH = 1;
const TILE_SOIL_DRY = 2;
const TILE_SOIL_WATERED = 3;
const TILE_WATER = 4;
const TILE_FENCE = 5;
const TILE_HOUSE_WALL = 6;
const TILE_HOUSE_ROOF = 7;
const TILE_HOUSE_DOOR = 8;
const TILE_SHIPPING_BIN = 9;
const TILE_WELL = 10;
const TILE_COOP_DOOR = 11;
const TILE_BARN_DOOR = 12;
const TILE_HOTSPRING = 13;
const TILE_MINE_ENTRANCE = 14;
const TILE_TOWN_ROAD = 15;
const TILE_ROCK = 16;
const TILE_BRANCH = 17;
const TILE_WEED = 18;

class WorldMap {
  constructor(cols = 32, rows = 24, tileSize = 32) {
    this.cols = cols;
    this.rows = rows;
    this.tileSize = tileSize;
    this.grid = [];
    this.crops = {}; // "x,y": { id, name, icon, stage, maxDays, daysGrown, watered, regrows, sellPrice }
    this.animals = [];
    this.currentZone = 'farm'; // 'farm', 'house', 'coop', 'barn', 'mine'

    this.initFarmMap();
  }

  initFarmMap() {
    this.grid = Array(this.rows).fill(null).map(() => Array(this.cols).fill(TILE_GRASS));

    // 1. Natural River & Lake (Right side)
    for (let y = 0; y < this.rows; y++) {
      for (let x = 26; x < 30; x++) {
        this.grid[y][x] = TILE_WATER;
      }
    }

    // 2. Dirt Paths
    for (let x = 4; x < 26; x++) this.grid[10][x] = TILE_DIRT_PATH;
    for (let y = 3; y < 22; y++) this.grid[y][10] = TILE_DIRT_PATH;

    // 3. Farmer House (Top-Left)
    this.grid[2][4] = TILE_HOUSE_ROOF;
    this.grid[2][5] = TILE_HOUSE_ROOF;
    this.grid[2][6] = TILE_HOUSE_ROOF;
    this.grid[3][4] = TILE_HOUSE_WALL;
    this.grid[3][5] = TILE_HOUSE_DOOR;
    this.grid[3][6] = TILE_HOUSE_WALL;

    // 4. Shipping Bin (Next to house path)
    this.grid[5][8] = TILE_SHIPPING_BIN;

    // 5. Water Well
    this.grid[7][8] = TILE_WELL;

    // 6. Chicken Coop (Mid-Left)
    this.grid[13][3] = TILE_HOUSE_ROOF;
    this.grid[13][4] = TILE_HOUSE_ROOF;
    this.grid[14][3] = TILE_HOUSE_WALL;
    this.grid[14][4] = TILE_COOP_DOOR;

    // 7. Animal Barn (Bottom-Left)
    this.grid[18][3] = TILE_HOUSE_ROOF;
    this.grid[18][4] = TILE_HOUSE_ROOF;
    this.grid[18][5] = TILE_HOUSE_ROOF;
    this.grid[19][3] = TILE_HOUSE_WALL;
    this.grid[19][4] = TILE_BARN_DOOR;
    this.grid[19][5] = TILE_HOUSE_WALL;

    // 8. Hot Spring (Top-Right)
    for (let y = 2; y < 6; y++) {
      for (let x = 20; x < 24; x++) {
        this.grid[y][x] = TILE_HOTSPRING;
      }
    }

    // 9. Mine Cave Entrance (Top-Mid)
    this.grid[1][14] = TILE_MINE_ENTRANCE;

    // 10. Town Road Exit (Far-Right)
    this.grid[10][31] = TILE_TOWN_ROAD;

    // 11. Tillable 3x3 Crop Fields
    for (let y = 12; y < 20; y++) {
      for (let x = 13; x < 23; x++) {
        this.grid[y][x] = TILE_SOIL_DRY;
      }
    }

    // 12. Pre-planted Turnips & Strawberries
    this.crops['14,14'] = { id: 'turnip', name: '순무 (Turnip)', icon: '🥬', stage: 2, maxDays: 4, daysGrown: 3, watered: true, sellPrice: 60 };
    this.crops['15,14'] = { id: 'turnip', name: '순무 (Turnip)', icon: '🥬', stage: 3, maxDays: 4, daysGrown: 4, watered: true, sellPrice: 60 };
    this.crops['16,14'] = { id: 'strawberry', name: '딸기 (Strawberry)', icon: '🍓', stage: 3, maxDays: 6, daysGrown: 6, watered: true, sellPrice: 120 };

    // 13. Obstacles (Weeds, Rocks, Branches)
    this.grid[12][13] = TILE_WEED;
    this.grid[13][19] = TILE_ROCK;
    this.grid[17][21] = TILE_BRANCH;

    // 14. Animals
    this.animals = [
      { id: 'dog', type: 'dog', name: '바둑이', icon: '🐕', x: 280, y: 160, hearts: 3 },
      { id: 'chick1', type: 'chicken', name: '꼬꼬 1호', icon: '🐔', x: 140, y: 480, hearts: 2 },
      { id: 'chick2', type: 'chicken', name: '꼬꼬 2호', icon: '🐔', x: 180, y: 500, hearts: 1 },
      { id: 'cow1', type: 'cow', name: '얼룩소 한우', icon: '🐮', x: 160, y: 640, hearts: 4 },
      { id: 'sheep1', type: 'sheep', name: '폭신이', icon: '🐑', x: 200, y: 660, hearts: 3 }
    ];
  }

  getTile(tx, ty) {
    if (tx < 0 || tx >= this.cols || ty < 0 || ty >= this.rows) return null;
    return this.grid[ty][tx];
  }

  setTile(tx, ty, tile) {
    if (tx >= 0 && tx < this.cols && ty >= 0 && ty < this.rows) {
      this.grid[ty][tx] = tile;
    }
  }

  advanceDay(game) {
    // Advance crops
    for (const [key, crop] of Object.entries(this.crops)) {
      const [tx, ty] = key.split(',').map(Number);
      const isWatered = this.grid[ty][tx] === TILE_SOIL_WATERED;

      if (isWatered) {
        crop.daysGrown++;
        if (crop.daysGrown >= crop.maxDays) {
          crop.stage = 3; // Ripe!
        } else if (crop.daysGrown >= crop.maxDays * 0.6) {
          crop.stage = 2;
        } else if (crop.daysGrown >= crop.maxDays * 0.3) {
          crop.stage = 1;
        }
      }

      // Reset soil moisture
      if (this.grid[ty][tx] === TILE_SOIL_WATERED) {
        this.grid[ty][tx] = TILE_SOIL_DRY;
      }
    }
  }
}

window.WorldMap = WorldMap;
window.TILE_GRASS = TILE_GRASS;
window.TILE_DIRT_PATH = TILE_DIRT_PATH;
window.TILE_SOIL_DRY = TILE_SOIL_DRY;
window.TILE_SOIL_WATERED = TILE_SOIL_WATERED;
window.TILE_WATER = TILE_WATER;
window.TILE_HOUSE_DOOR = TILE_HOUSE_DOOR;
window.TILE_SHIPPING_BIN = TILE_SHIPPING_BIN;
window.TILE_WELL = TILE_WELL;
window.TILE_COOP_DOOR = TILE_COOP_DOOR;
window.TILE_BARN_DOOR = TILE_BARN_DOOR;
window.TILE_HOTSPRING = TILE_HOTSPRING;
window.TILE_MINE_ENTRANCE = TILE_MINE_ENTRANCE;
window.TILE_TOWN_ROAD = TILE_TOWN_ROAD;
window.TILE_ROCK = TILE_ROCK;
window.TILE_BRANCH = TILE_BRANCH;
window.TILE_WEED = TILE_WEED;
