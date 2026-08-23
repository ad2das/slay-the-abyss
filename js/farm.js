/* ==========================================================================
   SUNNYVALE MEADOW - FARM GRID, TILEMAP & NATURE OBJECTS
   ========================================================================== */

const TILE_GRASS = 0;
const TILE_SOIL_DRY = 1;
const TILE_SOIL_WATERED = 2;
const TILE_PATH = 3;
const TILE_WATER = 4;
const TILE_FENCE = 5;
const TILE_SHIPPING_BIN = 7;
const TILE_HOUSE = 8;
const TILE_COOP = 9;
const TILE_BARN = 10;

class FarmMap {
  constructor(cols = 24, rows = 24, tileSize = 48) {
    this.cols = cols;
    this.rows = rows;
    this.tileSize = tileSize;
    this.grid = [];
    this.crops = {}; // "x,y": CropInstance
    this.trees = []; // {x, y, hp}
    this.rocks = []; // {x, y, hp}
    this.animals = [];

    this.initMap();
  }

  initMap() {
    this.grid = Array(this.rows).fill(null).map(() => Array(this.cols).fill(TILE_GRASS));

    // 1. Natural Pond on right side
    for (let y = 14; y < 20; y++) {
      for (let x = 16; x < 22; x++) {
        this.grid[y][x] = TILE_WATER;
      }
    }

    // 2. Cozy House at top-left
    this.grid[2][3] = TILE_HOUSE;

    // 3. Shipping Bin next to house
    this.grid[3][5] = TILE_SHIPPING_BIN;

    // 4. Initial Tilled Plots
    for (let y = 6; y < 10; y++) {
      for (let x = 4; x < 12; x++) {
        this.grid[y][x] = TILE_SOIL_DRY;
      }
    }

    // 5. Initial Planted Crops (Strawberries & Carrots)
    this.crops['4,6'] = new CropInstance('strawberry');
    this.crops['5,6'] = new CropInstance('strawberry');
    this.crops['6,6'] = new CropInstance('carrot');
    this.crops['7,6'] = new CropInstance('carrot');

    // 6. Pre-existing Animals
    this.animals.push(new FarmAnimal('chicken', 180, 420));
    this.animals.push(new FarmAnimal('chicken', 220, 440));
    this.animals.push(new FarmAnimal('cow', 400, 320));
    this.animals.push(new FarmAnimal('sheep', 460, 360));
  }

  getTile(tx, ty) {
    if (tx < 0 || tx >= this.cols || ty < 0 || ty >= this.rows) return null;
    return this.grid[ty][tx];
  }

  setTile(tx, ty, type) {
    if (tx >= 0 && tx < this.cols && ty >= 0 && ty < this.rows) {
      this.grid[ty][tx] = type;
    }
  }

  advanceDay(game) {
    // 1. Grow crops
    for (const [key, crop] of Object.entries(this.crops)) {
      const [tx, ty] = key.split(',').map(Number);
      const isWatered = this.grid[ty][tx] === TILE_SOIL_WATERED;
      crop.advanceDay(isWatered);

      // Reset soil moisture to dry
      if (this.grid[ty][tx] === TILE_SOIL_WATERED) {
        this.grid[ty][tx] = TILE_SOIL_DRY;
      }
    }

    // 2. Animals advance day
    this.animals.forEach(a => a.advanceDay(game));
  }
}

window.FarmMap = FarmMap;
window.TILE_GRASS = TILE_GRASS;
window.TILE_SOIL_DRY = TILE_SOIL_DRY;
window.TILE_SOIL_WATERED = TILE_SOIL_WATERED;
window.TILE_PATH = TILE_PATH;
window.TILE_WATER = TILE_WATER;
window.TILE_SHIPPING_BIN = TILE_SHIPPING_BIN;
window.TILE_HOUSE = TILE_HOUSE;
