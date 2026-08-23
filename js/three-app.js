/* ==========================================================================
   SUNNYVALE 3D - THREE.JS WEBGL LUXURY DIORAMA & INTERACTIVE FARM
   Cinematic Bloom, Dynamic PBR Materials, 3D Crop Growth & Procedural Animals
   ========================================================================== */

class Sunnyvale3D {
  constructor() {
    this.container = document.getElementById('webgl-container');
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.composer = null;
    this.controls = null;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // 3D Objects Pools
    this.plots = []; // 3D Soil Plot Meshes
    this.cropMeshes = {}; // "x,y": 3D Group
    this.animals = [];
    this.windmillBlades = null;
    this.waterMesh = null;
    this.fireflies = null;

    // Game Stats
    this.gold = 1200;
    this.energy = 100;
    this.maxEnergy = 100;
    this.day = 1;
    this.timeState = 0; // 0: Day, 1: Sunset, 2: Night

    // Inventory & Tools
    this.hotbar = [
      { id: 'hoe', name: '3D 호미 (Hoe)', icon: '🚜', desc: '토양을 개간합니다.' },
      { id: 'can', name: '크리스탈 물뿌리개 (Can)', icon: '💧', desc: '토양에 수분을 공급합니다.' },
      { id: 'seed_strawberry', name: '루비 딸기 씨앗', icon: '🍓', isSeed: true, cropId: 'strawberry', count: 8 },
      { id: 'seed_pumpkin', name: '골든 호박 씨앗', icon: '🎃', isSeed: true, cropId: 'pumpkin', count: 5 },
      { id: 'seed_sunflower', name: '태양 꽃 씨앗', icon: '🌻', isSeed: true, cropId: 'sunflower', count: 5 },
      { id: 'basket', name: '황금 수확 바구니', icon: '🧺', desc: '완숙 작물을 수확합니다.' }
    ];
    this.activeToolIdx = 0;

    this.backpack = [
      { id: 'ruby_strawberry', name: '특상품 루비 딸기', icon: '🍓', price: 180, count: 3 },
      { id: 'golden_milk', name: '신선한 목장 골든 밀크', icon: '🥛', price: 240, count: 2 }
    ];

    this.cropData = {}; // "x,y": { cropId, stage, daysGrown, watered, maxDays }

    this.initThree();
    this.build3DWorld();
    this.setupUI();
    this.animate();
  }

  initThree() {
    // 1. Scene & Camera
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#0c121e');
    this.scene.fog = new THREE.FogExp2('#0c121e', 0.015);

    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    this.camera.position.set(22, 26, 26);

    // 2. WebGL Renderer with Shadow Maps
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.container.appendChild(this.renderer.domElement);

    // 3. OrbitControls
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2.15;
    this.controls.minDistance = 12;
    this.controls.maxDistance = 55;
    this.controls.target.set(0, 0, 0);

    // 4. UnrealBloom PostProcessing
    const renderPass = new THREE.RenderPass(this.scene, this.camera);
    const bloomPass = new THREE.UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.45, // strength
      0.3,  // radius
      0.85  // threshold
    );
    this.composer = new THREE.EffectComposer(this.renderer);
    this.composer.addPass(renderPass);
    this.composer.addPass(bloomPass);

    // 5. Lighting Setup
    this.ambientLight = new THREE.AmbientLight(0xfff7ed, 0.85);
    this.scene.add(this.ambientLight);

    this.sunLight = new THREE.DirectionalLight(0xfef08a, 1.6);
    this.sunLight.position.set(25, 40, 20);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 100;
    const d = 25;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0005;
    this.scene.add(this.sunLight);

    // Warm Lantern Point Lights
    this.lanternLight = new THREE.PointLight(0xfbbf24, 2.0, 18);
    this.lanternLight.position.set(-6, 4, -4);
    this.scene.add(this.lanternLight);

    window.addEventListener('resize', () => this.onResize());
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.composer.setSize(window.innerWidth, window.innerHeight);
  }

  build3DWorld() {
    // 1. Floating Diorama Base Island
    const baseGeo = new THREE.CylinderGeometry(18, 16, 3, 32);
    const baseMat = new THREE.MeshStandardMaterial({
      color: '#475569',
      roughness: 0.8,
      metalness: 0.1
    });
    const baseIsland = new THREE.Mesh(baseGeo, baseMat);
    baseIsland.position.y = -1.5;
    baseIsland.receiveShadow = true;
    this.scene.add(baseIsland);

    // Top Lush Grass Layer
    const grassGeo = new THREE.CylinderGeometry(18.1, 18.1, 0.4, 32);
    const grassMat = new THREE.MeshStandardMaterial({
      color: '#34d399',
      roughness: 0.6,
      metalness: 0.05
    });
    const grassTop = new THREE.Mesh(grassGeo, grassMat);
    grassTop.position.y = 0.1;
    grassTop.receiveShadow = true;
    this.scene.add(grassTop);

    // 2. 3D Water Canal / Pond
    const waterGeo = new THREE.CircleGeometry(5.5, 32);
    const waterMat = new THREE.MeshStandardMaterial({
      color: '#38bdf8',
      roughness: 0.1,
      metalness: 0.8,
      transparent: true,
      opacity: 0.85
    });
    this.waterMesh = new THREE.Mesh(waterGeo, waterMat);
    this.waterMesh.rotation.x = -Math.PI / 2;
    this.waterMesh.position.set(8, 0.32, 6);
    this.scene.add(this.waterMesh);

    // 3. 3D Cozy Farmhouse
    this.buildHouse(-8, 0.3, -6);

    // 4. 3D Animated Windmill
    this.buildWindmill(9, 0.3, -8);

    // 5. 3D Soil Plots Grid (4x4)
    this.buildSoilGrid();

    // 6. 3D Stylized Trees & Fences
    this.buildDecorations();

    // 7. 3D Procedural Animals
    this.buildAnimals();

    // 8. Particle Fireflies
    this.buildFireflies();
  }

  buildSoilGrid() {
    const plotGeo = new THREE.BoxGeometry(1.8, 0.2, 1.8);

    for (let y = -2; y < 2; y++) {
      for (let x = -2; x < 2; x++) {
        const plotMat = new THREE.MeshStandardMaterial({
          color: '#854d0e', // Dry soil
          roughness: 0.9,
          metalness: 0.05
        });
        const plot = new THREE.Mesh(plotGeo, plotMat);
        plot.position.set(x * 2.2 - 2, 0.25, y * 2.2 + 3);
        plot.receiveShadow = true;
        plot.userData = { gridX: x + 2, gridY: y + 2, isPlot: true };
        this.scene.add(plot);
        this.plots.push(plot);

        // Pre-plant 2 initial crops
        if (x === -2 && y === -2) {
          this.plantCrop(x + 2, y + 2, 'strawberry', 2);
        } else if (x === -1 && y === -2) {
          this.plantCrop(x + 2, y + 2, 'pumpkin', 3);
        }
      }
    }
  }

  buildHouse(x, y, z) {
    const houseGroup = new THREE.Group();

    // Base Walls
    const wallGeo = new THREE.BoxGeometry(5, 3.5, 4);
    const wallMat = new THREE.MeshStandardMaterial({ color: '#fef3c7', roughness: 0.7 });
    const walls = new THREE.Mesh(wallGeo, wallMat);
    walls.position.y = 1.75;
    walls.castShadow = true;
    walls.receiveShadow = true;
    houseGroup.add(walls);

    // Terracotta Roof
    const roofGeo = new THREE.ConeGeometry(4.2, 2.4, 4);
    const roofMat = new THREE.MeshStandardMaterial({ color: '#dc2626', roughness: 0.4 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 4.4;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    houseGroup.add(roof);

    // Chimney with Smoke
    const chimGeo = new THREE.BoxGeometry(0.8, 2, 0.8);
    const chimMat = new THREE.MeshStandardMaterial({ color: '#78350f' });
    const chimney = new THREE.Mesh(chimGeo, chimMat);
    chimney.position.set(1.4, 4.2, -0.6);
    houseGroup.add(chimney);

    houseGroup.position.set(x, y, z);
    this.scene.add(houseGroup);
  }

  buildWindmill(x, y, z) {
    const wmGroup = new THREE.Group();

    const towerGeo = new THREE.CylinderGeometry(1.6, 2.4, 6, 8);
    const towerMat = new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.6 });
    const tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.y = 3;
    tower.castShadow = true;
    wmGroup.add(tower);

    // Blades
    this.windmillBlades = new THREE.Group();
    const bladeGeo = new THREE.BoxGeometry(0.5, 6, 0.1);
    const bladeMat = new THREE.MeshStandardMaterial({ color: '#b45309' });

    const b1 = new THREE.Mesh(bladeGeo, bladeMat);
    const b2 = new THREE.Mesh(bladeGeo, bladeMat);
    b2.rotation.z = Math.PI / 2;
    this.windmillBlades.add(b1);
    this.windmillBlades.add(b2);

    this.windmillBlades.position.set(0, 5.2, 1.7);
    wmGroup.add(this.windmillBlades);

    wmGroup.position.set(x, y, z);
    this.scene.add(wmGroup);
  }

  buildDecorations() {
    // Trees
    const treeCoords = [
      { x: -12, z: 6 },
      { x: -10, z: 11 },
      { x: 12, z: -2 },
      { x: 13, z: 4 }
    ];

    treeCoords.forEach(c => {
      const tree = new THREE.Group();
      // Trunk
      const trunkGeo = new THREE.CylinderGeometry(0.4, 0.6, 2, 8);
      const trunkMat = new THREE.MeshStandardMaterial({ color: '#78350f' });
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 1;
      trunk.castShadow = true;
      tree.add(trunk);

      // Foliage (Low-poly puff)
      const folGeo = new THREE.DodecahedronGeometry(1.8, 1);
      const folMat = new THREE.MeshStandardMaterial({ color: '#15803d', roughness: 0.6 });
      const foliage = new THREE.Mesh(folGeo, folMat);
      foliage.position.y = 2.8;
      foliage.castShadow = true;
      tree.add(foliage);

      tree.position.set(c.x, 0.3, c.z);
      this.scene.add(tree);
    });
  }

  buildAnimals() {
    // 3D Fluffy Sheep
    const sheep = new THREE.Group();
    const bodyGeo = new THREE.SphereGeometry(1.0, 16, 16);
    const bodyMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.9 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.0;
    body.castShadow = true;
    sheep.add(body);

    const headGeo = new THREE.SphereGeometry(0.5, 12, 12);
    const headMat = new THREE.MeshStandardMaterial({ color: '#1e293b' });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.set(0.9, 1.2, 0);
    sheep.add(head);

    sheep.position.set(4, 0.3, -3);
    this.scene.add(sheep);
    this.animals.push(sheep);
  }

  buildFireflies() {
    const count = 40;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);

    for (let i = 0; i < count * 3; i += 3) {
      pos[i] = (Math.random() - 0.5) * 30;
      pos[i + 1] = Math.random() * 8 + 1;
      pos[i + 2] = (Math.random() - 0.5) * 30;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: '#fef08a',
      size: 0.4,
      transparent: true,
      opacity: 0.8
    });

    this.fireflies = new THREE.Points(geo, mat);
    this.scene.add(this.fireflies);
  }

  plantCrop(gx, gy, cropId, stage = 0) {
    const key = `${gx},${gy}`;
    // Remove existing mesh
    if (this.cropMeshes[key]) {
      this.scene.remove(this.cropMeshes[key]);
      delete this.cropMeshes[key];
    }

    const cropGroup = new THREE.Group();
    const plotMesh = this.plots.find(p => p.userData.gridX === gx && p.userData.gridY === gy);
    if (!plotMesh) return;

    if (stage === 0) {
      // Tiny Sprout
      const sGeo = new THREE.ConeGeometry(0.2, 0.5, 6);
      const sMat = new THREE.MeshStandardMaterial({ color: '#22c55e' });
      const sprout = new THREE.Mesh(sGeo, sMat);
      sprout.position.y = 0.4;
      cropGroup.add(sprout);
    } else if (stage === 1) {
      // Growing Leaves
      const stemGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.8, 6);
      const stemMat = new THREE.MeshStandardMaterial({ color: '#15803d' });
      const stem = new THREE.Mesh(stemGeo, stemMat);
      stem.position.y = 0.5;
      cropGroup.add(stem);
    } else {
      // Mature 3D Crop! (Strawberry / Pumpkin / Sunflower)
      if (cropId === 'strawberry') {
        const fruitGeo = new THREE.DodecahedronGeometry(0.45, 1);
        const fruitMat = new THREE.MeshStandardMaterial({ color: '#ef4444', roughness: 0.3 });
        const fruit = new THREE.Mesh(fruitGeo, fruitMat);
        fruit.position.y = 0.6;
        fruit.castShadow = true;
        cropGroup.add(fruit);
      } else if (cropId === 'pumpkin') {
        const pGeo = new THREE.SphereGeometry(0.7, 12, 12);
        pGeo.scale(1.2, 0.9, 1.2);
        const pMat = new THREE.MeshStandardMaterial({ color: '#ea580c', roughness: 0.5 });
        const pumpkin = new THREE.Mesh(pGeo, pMat);
        pumpkin.position.y = 0.6;
        pumpkin.castShadow = true;
        cropGroup.add(pumpkin);
      } else {
        // Sunflower
        const flowerGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.1, 12);
        const flowerMat = new THREE.MeshStandardMaterial({ color: '#facc15' });
        const flower = new THREE.Mesh(flowerGeo, flowerMat);
        flower.position.y = 1.0;
        cropGroup.add(flower);
      }
    }

    cropGroup.position.copy(plotMesh.position);
    this.scene.add(cropGroup);
    this.cropMeshes[key] = cropGroup;
    this.cropData[key] = { cropId, stage, ready: stage >= 2, watered: false };
  }

  setupUI() {
    this.renderHotbar();
    this.updateHUD();

    // 3D Canvas Raycasting Pointer Click
    this.renderer.domElement.addEventListener('pointerdown', (e) => {
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      this.raycaster.setFromCamera(this.mouse, this.camera);

      const intersects = this.raycaster.intersectObjects(this.plots);
      if (intersects.length > 0) {
        const hitPlot = intersects[0].object;
        this.interactWithPlot(hitPlot);
      }
    });

    // Top Modals & Docks
    document.getElementById('btn-open-shop').addEventListener('click', () => {
      this.openShopModal();
    });
    document.getElementById('btn-open-bag').addEventListener('click', () => {
      this.openBagModal();
    });
    document.getElementById('btn-toggle-time').addEventListener('click', () => {
      this.cycleLightingTime();
    });
    document.getElementById('btn-sleep').addEventListener('click', () => {
      this.sleepAndAdvanceDay();
    });

    document.querySelectorAll('.btn-close-modal').forEach(btn => {
      btn.addEventListener('click', () => {
        const modalId = btn.dataset.modal;
        document.getElementById(modalId).classList.remove('active');
        setTimeout(() => document.getElementById(modalId).classList.add('hidden'), 250);
      });
    });
  }

  renderHotbar() {
    const dock = document.getElementById('hotbar-dock');
    dock.innerHTML = '';

    this.hotbar.forEach((slot, idx) => {
      const el = document.createElement('div');
      el.className = `hotbar-slot-3d ${this.activeToolIdx === idx ? 'active' : ''}`;
      el.innerHTML = `
        <div class="h-icon">${slot.icon}</div>
        ${slot.count !== undefined ? `<div class="h-count">${slot.count}</div>` : ''}
      `;

      el.addEventListener('click', () => {
        this.activeToolIdx = idx;
        document.querySelectorAll('.hotbar-slot-3d').forEach(s => s.classList.remove('active'));
        el.classList.add('active');
        window.cozyAudio.playSFX('plant_seed');
        this.showToast(`${slot.name} 장착`);
      });

      dock.appendChild(el);
    });
  }

  interactWithPlot(plotMesh) {
    const gx = plotMesh.userData.gridX;
    const gy = plotMesh.userData.gridY;
    const key = `${gx},${gy}`;
    const tool = this.hotbar[this.activeToolIdx];

    if (!tool) return;

    // 1. Hoe: Till
    if (tool.id === 'hoe') {
      plotMesh.material.color.set('#78350f');
      window.cozyAudio.playSFX('till_soil');
      this.showToast('밭 개간 완료');
    }
    // 2. Water Can
    else if (tool.id === 'can') {
      plotMesh.material.color.set('#451a03'); // Dark wet soil
      if (this.cropData[key]) this.cropData[key].watered = true;
      window.cozyAudio.playSFX('water_splash');
      this.showToast('수분 공급 완료 💧');
    }
    // 3. Planting Seeds
    else if (tool.isSeed && tool.count > 0) {
      if (!this.cropData[key]) {
        tool.count--;
        this.plantCrop(gx, gy, tool.cropId, 0);
        window.cozyAudio.playSFX('plant_seed');
        this.renderHotbar();
        this.showToast(`${tool.name} 파종 완료 🌱`);
      }
    }
    // 4. Harvest Basket
    else if (tool.id === 'basket' || !tool) {
      const c = this.cropData[key];
      if (c && c.ready) {
        window.cozyAudio.playSFX('harvest_pop');
        this.backpack.push({
          id: c.cropId,
          name: `황금 ${c.cropId.toUpperCase()}`,
          icon: c.cropId === 'strawberry' ? '🍓' : (c.cropId === 'pumpkin' ? '🎃' : '🌻'),
          price: 250,
          count: 1
        });
        delete this.cropData[key];
        if (this.cropMeshes[key]) {
          this.scene.remove(this.cropMeshes[key]);
          delete this.cropMeshes[key];
        }
        this.showToast('✨ 특상품 3D 작물 수확 완료!');
      }
    }
  }

  cycleLightingTime() {
    this.timeState = (this.timeState + 1) % 3;
    if (this.timeState === 0) {
      // Day
      this.scene.background.set('#38bdf8');
      this.sunLight.color.set('#fef08a');
      this.sunLight.intensity = 1.6;
      this.ambientLight.intensity = 0.85;
      document.getElementById('hud-time-orb').innerText = '☀️';
      document.getElementById('hud-clock').innerText = '11:00 AM';
      this.showToast('눈부신 한낮의 햇살 ☀️');
    } else if (this.timeState === 1) {
      // Sunset (Golden Hour)
      this.scene.background.set('#ea580c');
      this.sunLight.color.set('#f97316');
      this.sunLight.intensity = 2.0;
      this.ambientLight.intensity = 0.6;
      document.getElementById('hud-time-orb').innerText = '🌅';
      document.getElementById('hud-clock').innerText = '06:30 PM';
      this.showToast('낭만적인 골든아워 노을 🌅');
    } else {
      // Night
      this.scene.background.set('#0c121e');
      this.sunLight.color.set('#6366f1');
      this.sunLight.intensity = 0.3;
      this.ambientLight.intensity = 0.3;
      document.getElementById('hud-time-orb').innerText = '🌙';
      document.getElementById('hud-clock').innerText = '10:00 PM';
      this.showToast('반딧불이가 빛나는 밤 🌙');
    }
  }

  sleepAndAdvanceDay() {
    this.day++;
    window.cozyAudio.playSFX('coin');

    // Grow planted crops
    for (const [key, c] of Object.entries(this.cropData)) {
      const [gx, gy] = key.split(',').map(Number);
      if (c.stage < 2) {
        c.stage++;
        this.plantCrop(gx, gy, c.cropId, c.stage);
      }
    }

    this.timeState = 2;
    this.cycleLightingTime(); // Reset to Day
    this.updateHUD();
    this.showToast(`🌅 Day ${this.day} 아침이 밝았습니다!`);
  }

  openShopModal() {
    const modal = document.getElementById('modal-shop');
    modal.classList.remove('hidden');
    setTimeout(() => modal.classList.add('active'), 10);

    const container = document.getElementById('shop-items-container');
    container.innerHTML = `
      <div class="luxury-shop-item" id="buy-straw">
        <div class="item-icon-3d">🍓</div>
        <div class="item-title-3d">루비 딸기 종자</div>
        <div class="item-desc-3d">최고급 당도의 다회 수확 종자</div>
        <div class="item-price-pill">🪙 50 G</div>
      </div>
      <div class="luxury-shop-item" id="buy-pump">
        <div class="item-icon-3d">🎃</div>
        <div class="item-title-3d">골든 호박 종자</div>
        <div class="item-desc-3d">초대형 부유 호박 종자</div>
        <div class="item-price-pill">🪙 120 G</div>
      </div>
      <div class="luxury-shop-item" id="buy-cow">
        <div class="item-icon-3d">🐮</div>
        <div class="item-title-3d">3D 홀스타인 젖소</div>
        <div class="item-desc-3d">황금 밀크를 생산하는 가축</div>
        <div class="item-price-pill">🪙 600 G</div>
      </div>
    `;

    document.getElementById('buy-straw').onclick = () => {
      if (this.gold >= 50) {
        this.gold -= 50;
        this.hotbar.find(s => s.cropId === 'strawberry').count += 3;
        window.cozyAudio.playSFX('coin');
        this.renderHotbar();
        this.updateHUD();
        this.showToast('딸기 종자 3개 구매 완료!');
      }
    };
  }

  openBagModal() {
    const modal = document.getElementById('modal-bag');
    modal.classList.remove('hidden');
    setTimeout(() => modal.classList.add('active'), 10);

    const container = document.getElementById('bag-items-container');
    container.innerHTML = '';

    this.backpack.forEach((item, idx) => {
      const el = document.createElement('div');
      el.className = 'luxury-shop-item';
      el.innerHTML = `
        <div class="item-icon-3d">${item.icon}</div>
        <div class="item-title-3d">${item.name}</div>
        <div class="item-desc-3d">수량: ${item.count}개</div>
        <div class="item-price-pill">판매가 🪙 ${item.price * item.count} G</div>
      `;
      container.appendChild(el);
    });

    document.getElementById('btn-ship-selected').onclick = () => {
      let revenue = 0;
      this.backpack.forEach(i => revenue += i.price * i.count);
      this.gold += revenue;
      this.backpack = [];
      window.cozyAudio.playSFX('coin');
      this.updateHUD();
      this.openBagModal();
      this.showToast(`🪙 +${revenue} G 출하 수익 정산 완료!`);
    };
  }

  updateHUD() {
    document.getElementById('hud-gold-val').innerText = `${this.gold.toLocaleString()} G`;
    document.getElementById('hud-season').innerText = `SPRING · DAY ${this.day}`;
  }

  showToast(msg) {
    const pill = document.getElementById('toast-pill');
    pill.innerText = msg;
    pill.classList.remove('toast-hidden');
    setTimeout(() => pill.classList.add('toast-hidden'), 2000);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    // Rotate Windmill
    if (this.windmillBlades) {
      this.windmillBlades.rotation.z += 0.015;
    }

    // Animate Water ripples
    if (this.waterMesh) {
      this.waterMesh.rotation.z += 0.005;
    }

    // Controls update
    this.controls.update();

    // Render with Bloom PostProcessing
    this.composer.render();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.sunnyvale3D = new Sunnyvale3D();
});
