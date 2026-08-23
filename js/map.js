/* ==========================================================================
   HARVEST MOON: MINERAL MEADOW - MULTI-ZONE MAP & INTERIORS ENGINE
   Farm, House Interior, Barn, Coop, Mineral Mine & Town Market
   ========================================================================== */

const TILE_GRASS = 0;
const TILE_DIRT_PATH = 1;
const TILE_SOIL_DRY = 2;
const TILE_SOIL_WATERED = 3;
const TILE_WATER = 4;
const TILE_HOUSE_ROOF = 5;
const TILE_HOUSE_WALL = 6;
const TILE_HOUSE_DOOR = 7;
const TILE_SHIPPING_BIN = 8;
const TILE_WELL = 9;
const TILE_COOP_DOOR = 10;
const TILE_BARN_DOOR = 11;
const TILE_HOTSPRING = 12;
const TILE_MINE_ENTRANCE = 13;
const TILE_TOWN_ROAD = 14;
const TILE_ROCK = 15;
const TILE_BRANCH = 16;
const TILE_WEED = 17;
const TILE_WOOD_FLOOR = 18;
const TILE_BED = 19;
const TILE_TV = 20;
const TILE_KITCHEN = 21;
const TILE_CALENDAR = 22;
const TILE_MINE_ROCK = 23;
const TILE_MINE_LADDER = 24;
const TILE_SHOP_COUNTER = 25;
const TILE_BLACKSMITH_ANVIL = 26;
const TILE_EXIT_DOOR = 27;

class WorldMap {
  constructor() {
    this.currentZone = 'farm'; // 'farm', 'house', 'coop', 'barn', 'mine', 'town'
    this.zones = {};
    this.crops = {}; // "x,y": { id, name, icon, stage, maxDays, daysGrown, watered, sellPrice }
    this.animals = [];
    this.mineFloor = 1;

    this.initAllZones();
  }

  initAllZones() {
    // ================= 1. FARM MAP (32x24) =================
    const farmGrid = Array(24).fill(null).map(() => Array(32).fill(TILE_GRASS));

    // River on right
    for (let y = 0; y < 24; y++) {
      for (let x = 26; x < 30; x++) farmGrid[y][x] = TILE_WATER;
    }

    // Paths
    for (let x = 4; x < 26; x++) farmGrid[10][x] = TILE_DIRT_PATH;
    for (let y = 3; y < 22; y++) farmGrid[y][10] = TILE_DIRT_PATH;

    // Farmhouse
    farmGrid[2][4] = TILE_HOUSE_ROOF; farmGrid[2][5] = TILE_HOUSE_ROOF; farmGrid[2][6] = TILE_HOUSE_ROOF;
    farmGrid[3][4] = TILE_HOUSE_WALL; farmGrid[3][5] = TILE_HOUSE_DOOR; farmGrid[3][6] = TILE_HOUSE_WALL;

    // Shipping Bin & Well
    farmGrid[5][8] = TILE_SHIPPING_BIN;
    farmGrid[7][8] = TILE_WELL;

    // Coop
    farmGrid[13][3] = TILE_HOUSE_ROOF; farmGrid[13][4] = TILE_HOUSE_ROOF;
    farmGrid[14][3] = TILE_HOUSE_WALL; farmGrid[14][4] = TILE_COOP_DOOR;

    // Barn
    farmGrid[18][3] = TILE_HOUSE_ROOF; farmGrid[18][4] = TILE_HOUSE_ROOF; farmGrid[18][5] = TILE_HOUSE_ROOF;
    farmGrid[19][3] = TILE_HOUSE_WALL; farmGrid[19][4] = TILE_BARN_DOOR; farmGrid[19][5] = TILE_HOUSE_WALL;

    // Hot Spring
    for (let y = 2; y < 6; y++) {
      for (let x = 20; x < 24; x++) farmGrid[y][x] = TILE_HOTSPRING;
    }

    // Mine & Town Exits
    farmGrid[1][14] = TILE_MINE_ENTRANCE;
    farmGrid[10][31] = TILE_TOWN_ROAD;

    // Tillable Fields
    for (let y = 12; y < 20; y++) {
      for (let x = 13; x < 23; x++) farmGrid[y][x] = TILE_SOIL_DRY;
    }

    farmGrid[12][13] = TILE_WEED;
    farmGrid[13][19] = TILE_ROCK;
    farmGrid[17][21] = TILE_BRANCH;

    this.zones.farm = { cols: 32, rows: 24, tileSize: 32, grid: farmGrid, name: '🏡 내 목장 (My Farm)' };

    // ================= 2. HOUSE INTERIOR (12x10) =================
    const houseGrid = Array(10).fill(null).map(() => Array(12).fill(TILE_WOOD_FLOOR));
    for (let x = 0; x < 12; x++) houseGrid[0][x] = TILE_HOUSE_WALL;
    for (let y = 0; y < 10; y++) { houseGrid[y][0] = TILE_HOUSE_WALL; houseGrid[y][11] = TILE_HOUSE_WALL; }

    houseGrid[1][2] = TILE_BED;
    houseGrid[1][5] = TILE_TV;
    houseGrid[1][8] = TILE_KITCHEN;
    houseGrid[1][9] = TILE_CALENDAR;
    houseGrid[9][5] = TILE_EXIT_DOOR;

    this.zones.house = { cols: 12, rows: 10, tileSize: 32, grid: houseGrid, name: '🛏️ 내 집 (Farmhouse)' };

    // ================= 3. CHICKEN COOP INTERIOR (12x10) =================
    const coopGrid = Array(10).fill(null).map(() => Array(12).fill(TILE_WOOD_FLOOR));
    for (let x = 0; x < 12; x++) coopGrid[0][x] = TILE_HOUSE_WALL;
    for (let y = 0; y < 10; y++) { coopGrid[y][0] = TILE_HOUSE_WALL; coopGrid[y][11] = TILE_HOUSE_WALL; }
    coopGrid[9][5] = TILE_EXIT_DOOR;

    this.zones.coop = { cols: 12, rows: 10, tileSize: 32, grid: coopGrid, name: '🐔 닭장 (Chicken Coop)' };

    // ================= 4. ANIMAL BARN INTERIOR (14x12) =================
    const barnGrid = Array(12).fill(null).map(() => Array(14).fill(TILE_WOOD_FLOOR));
    for (let x = 0; x < 14; x++) barnGrid[0][x] = TILE_HOUSE_WALL;
    for (let y = 0; y < 12; y++) { barnGrid[y][0] = TILE_HOUSE_WALL; barnGrid[y][13] = TILE_HOUSE_WALL; }
    barnGrid[11][6] = TILE_EXIT_DOOR;

    this.zones.barn = { cols: 14, rows: 12, tileSize: 32, grid: barnGrid, name: '🐮 외양간 (Animal Barn)' };

    // ================= 5. MINERAL MINE (16x14) =================
    const mineGrid = Array(14).fill(null).map(() => Array(16).fill(TILE_DIRT_PATH));
    for (let y = 2; y < 12; y++) {
      for (let x = 2; x < 14; x++) {
        if (Math.random() < 0.45) mineGrid[y][x] = TILE_MINE_ROCK;
      }
    }
    mineGrid[1][1] = TILE_EXIT_DOOR;
    mineGrid[12][13] = TILE_MINE_LADDER;

    this.zones.mine = { cols: 16, rows: 14, tileSize: 32, grid: mineGrid, name: `⛏️ 미네랄 광산 (${this.mineFloor}층)` };

    // ================= 6. TOWN MARKET (20x16) =================
    const townGrid = Array(16).fill(null).map(() => Array(20).fill(TILE_DIRT_PATH));
    townGrid[2][4] = TILE_SHOP_COUNTER; // Pierre Store
    townGrid[2][14] = TILE_BLACKSMITH_ANVIL; // Saibara Blacksmith
    townGrid[8][0] = TILE_EXIT_DOOR; // Back to farm road

    this.zones.town = { cols: 20, rows: 16, tileSize: 32, grid: townGrid, name: '🏘️ 미네랄 마을 (Mineral Town)' };

    // Initial Crops
    this.crops['14,14'] = { id: 'turnip', name: '순무', icon: '🥬', stage: 2, maxDays: 4, daysGrown: 3, watered: true, sellPrice: 60 };
    this.crops['15,14'] = { id: 'turnip', name: '순무', icon: '🥬', stage: 3, maxDays: 4, daysGrown: 4, watered: true, sellPrice: 60 };
    this.crops['16,14'] = { id: 'strawberry', name: '딸기', icon: '🍓', stage: 3, maxDays: 6, daysGrown: 6, watered: true, sellPrice: 120 };
  }

  getCurZone() {
    return this.zones[this.currentZone] || this.zones.farm;
  }

  getTile(tx, ty) {
    const zone = this.getCurZone();
    if (tx < 0 || tx >= zone.cols || ty < 0 || ty >= zone.rows) return null;
    return zone.grid[ty][tx];
  }

  setTile(tx, ty, tile) {
    const zone = this.getCurZone();
    if (tx >= 0 && tx < zone.cols && ty >= 0 && ty < zone.rows) {
      zone.grid[ty][tx] = tile;
    }
  }

  advanceDay(game) {
    for (const [key, crop] of Object.entries(this.crops)) {
      const [tx, ty] = key.split(',').map(Number);
      const isWatered = this.zones.farm.grid[ty][tx] === TILE_SOIL_WATERED;

      if (isWatered) {
        crop.daysGrown++;
        if (crop.daysGrown >= crop.maxDays) crop.stage = 3;
        else if (crop.daysGrown >= crop.maxDays * 0.6) crop.stage = 2;
        else if (crop.daysGrown >= crop.maxDays * 0.3) crop.stage = 1;
      }

      if (this.zones.farm.grid[ty][tx] === TILE_SOIL_WATERED) {
        this.zones.farm.grid[ty][tx] = TILE_SOIL_DRY;
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
window.TILE_WOOD_FLOOR = TILE_WOOD_FLOOR;
window.TILE_BED = TILE_BED;
window.TILE_TV = TILE_TV;
window.TILE_KITCHEN = TILE_KITCHEN;
window.TILE_CALENDAR = TILE_CALENDAR;
window.TILE_MINE_ROCK = TILE_MINE_ROCK;
window.TILE_MINE_LADDER = TILE_MINE_LADDER;
window.TILE_SHOP_COUNTER = TILE_SHOP_COUNTER;
window.TILE_BLACKSMITH_ANVIL = TILE_BLACKSMITH_ANVIL;
window.TILE_EXIT_DOOR = TILE_EXIT_DOOR;
