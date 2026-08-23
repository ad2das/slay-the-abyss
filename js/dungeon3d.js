/* ==========================================================================
   ABYSSAL SLAYER 3D: PROCEDURAL GOTHIC DUNGEON (PS3 DARK FANTASY)
   PBR Textures, Vaulted Stone Arches, Dynamic Torches & Minimap
   ========================================================================== */

class DungeonFloor3D {
  constructor(scene, floorNumber = 1) {
    this.scene = scene;
    this.floorNumber = floorNumber;
    this.rooms = [];
    this.currentRoom = null;
    this.room3DGroup = new THREE.Group();
    this.scene.add(this.room3DGroup);

    this.gateMeshes = [];
    this.torches = [];
    this.generateFloor();
  }

  generateFloor() {
    this.rooms = [];
    const layout = [
      { x: 2, y: 2, type: 'start', name: '심연의 입구', icon: '🚪', cleared: true, visited: true },
      { x: 2, y: 1, type: 'combat', name: '망령의 회랑', icon: '⚔️', cleared: false, visited: false },
      { x: 3, y: 2, type: 'combat', name: '핏빛 무덤', icon: '⚔️', cleared: false, visited: false },
      { x: 1, y: 2, type: 'treasure', name: '숨겨진 보물고', icon: '🎁', cleared: true, visited: false },
      { x: 2, y: 0, type: 'elite', name: '미노타우로스 미궁', icon: '💀', cleared: false, visited: false },
      { x: 3, y: 1, type: 'shop', name: '방랑 상인의 은신처', icon: '⚖️', cleared: true, visited: false },
      { x: 4, y: 1, type: 'shrine', name: '고대 피의 제단', icon: '🔮', cleared: true, visited: false },
      { x: 2, y: -1, type: 'boss', name: '공허 대군주의 알현실', icon: '👑', cleared: false, visited: false }
    ];

    layout.forEach(r => {
      this.rooms.push({
        ...r,
        width: 40,
        height: 30,
        doors: this.calculateDoors(r, layout),
        enemiesSpawned: false
      });
    });

    this.currentRoom = this.rooms.find(r => r.type === 'start');
    this.buildCurrentRoom3D();
  }

  calculateDoors(room, layout) {
    const doors = [];
    const neighbors = [
      { dir: 'north', dx: 0, dy: -1 },
      { dir: 'south', dx: 0, dy: 1 },
      { dir: 'east', dx: 1, dy: 0 },
      { dir: 'west', dx: -1, dy: 0 }
    ];
    neighbors.forEach(n => {
      if (layout.some(l => l.x === room.x + n.dx && l.y === room.y + n.dy)) {
        doors.push(n.dir);
      }
    });
    return doors;
  }

  clearRoom3D() {
    while (this.room3DGroup.children.length > 0) {
      const obj = this.room3DGroup.children[0];
      this.room3DGroup.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
        else obj.material.dispose();
      }
    }
    this.gateMeshes = [];
    this.torches = [];
  }

  buildCurrentRoom3D() {
    this.clearRoom3D();
    const room = this.currentRoom;
    const w = room.width;
    const h = room.height;

    // 1. High-Res Gothic Floor Plane
    const floorGeo = new THREE.PlaneGeometry(w, h, 16, 12);
    floorGeo.rotateX(-Math.PI / 2);
    const floorMat = new THREE.MeshStandardMaterial({
      map: TextureFactory.createGothicFloorTexture(),
      roughness: 0.5,
      metalness: 0.35
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.receiveShadow = true;
    this.room3DGroup.add(floor);

    // 2. High Perimeter Gothic Walls
    const wallMat = new THREE.MeshStandardMaterial({
      map: TextureFactory.createMetalTexture('#0b0f19'),
      roughness: 0.8,
      metalness: 0.3
    });
    const wallH = 4.5;
    const wallThick = 1.5;

    // North Wall
    const wallN = new THREE.Mesh(new THREE.BoxGeometry(w + wallThick * 2, wallH, wallThick), wallMat);
    wallN.position.set(0, wallH / 2, -h / 2 - wallThick / 2);
    wallN.castShadow = true;
    wallN.receiveShadow = true;
    this.room3DGroup.add(wallN);

    // South Wall
    const wallS = new THREE.Mesh(new THREE.BoxGeometry(w + wallThick * 2, wallH, wallThick), wallMat);
    wallS.position.set(0, wallH / 2, h / 2 + wallThick / 2);
    wallS.castShadow = true;
    wallS.receiveShadow = true;
    this.room3DGroup.add(wallS);

    // West Wall
    const wallW = new THREE.Mesh(new THREE.BoxGeometry(wallThick, wallH, h), wallMat);
    wallW.position.set(-w / 2 - wallThick / 2, wallH / 2, 0);
    wallW.castShadow = true;
    wallW.receiveShadow = true;
    this.room3DGroup.add(wallW);

    // East Wall
    const wallE = new THREE.Mesh(new THREE.BoxGeometry(wallThick, wallH, h), wallMat);
    wallE.position.set(w / 2 + wallThick / 2, wallH / 2, 0);
    wallE.castShadow = true;
    wallE.receiveShadow = true;
    this.room3DGroup.add(wallE);

    // 3. Vaulted Gothic Pillars
    const cornerOffsets = [
      { x: -w / 2 + 2.5, z: -h / 2 + 2.5 },
      { x: w / 2 - 2.5, z: -h / 2 + 2.5 },
      { x: -w / 2 + 2.5, z: h / 2 - 2.5 },
      { x: w / 2 - 2.5, z: h / 2 - 2.5 }
    ];
    cornerOffsets.forEach(pos => {
      const pillar = ModelFactory3D.createPillarMesh();
      pillar.position.set(pos.x, 0, pos.z);
      this.room3DGroup.add(pillar);
    });

    // 4. Heavy Torch Braziers
    const torchPositions = [
      { x: -w / 2 + 1.4, z: 0 },
      { x: w / 2 - 1.4, z: 0 },
      { x: 0, z: -h / 2 + 1.4 },
      { x: 0, z: h / 2 - 1.4 }
    ];
    torchPositions.forEach(pos => {
      const torch = ModelFactory3D.createTorchBrazier();
      torch.position.set(pos.x, 0, pos.z);
      this.room3DGroup.add(torch);
      this.torches.push(torch);
    });

    // 5. Runic Archway Doors
    room.doors.forEach(dir => {
      const gateGroup = new THREE.Group();
      const archMat = new THREE.MeshStandardMaterial({
        map: TextureFactory.createMetalTexture('#1e293b'),
        metalness: 0.85,
        roughness: 0.2
      });
      const arch = new THREE.Mesh(new THREE.BoxGeometry(4.0, 3.6, 0.8), archMat);
      arch.position.y = 1.8;
      gateGroup.add(arch);

      const barrierMat = new THREE.MeshBasicMaterial({
        color: room.cleared ? 0x38bdf8 : 0xe11d48,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide
      });
      const barrier = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 3.2), barrierMat);
      barrier.position.y = 1.6;
      gateGroup.add(barrier);

      if (dir === 'north') {
        gateGroup.position.set(0, 0, -h / 2);
      } else if (dir === 'south') {
        gateGroup.position.set(0, 0, h / 2);
      } else if (dir === 'west') {
        gateGroup.position.set(-w / 2, 0, 0);
        gateGroup.rotation.y = Math.PI / 2;
      } else if (dir === 'east') {
        gateGroup.position.set(w / 2, 0, 0);
        gateGroup.rotation.y = Math.PI / 2;
      }

      this.room3DGroup.add(gateGroup);
      this.gateMeshes.push({ dir, barrier, barrierMat });
    });
  }

  changeRoom(targetDir, player3D) {
    const cur = this.currentRoom;
    let targetX = cur.x;
    let targetY = cur.y;

    if (targetDir === 'north') { targetY -= 1; player3D.z = cur.height / 2 - 2.5; }
    else if (targetDir === 'south') { targetY += 1; player3D.z = -cur.height / 2 + 2.5; }
    else if (targetDir === 'east') { targetX += 1; player3D.x = -cur.width / 2 + 2.5; }
    else if (targetDir === 'west') { targetX -= 1; player3D.x = cur.width / 2 - 2.5; }

    const nextRoom = this.rooms.find(r => r.x === targetX && r.y === targetY);
    if (nextRoom) {
      this.currentRoom = nextRoom;
      nextRoom.visited = true;
      this.buildCurrentRoom3D();
      return nextRoom;
    }
    return null;
  }

  update(dt, player3D, enemies) {
    this.torches.forEach(t => {
      if (t.userData.light) {
        t.userData.light.intensity = 2.2 + Math.sin(Date.now() * 0.012) * 0.45;
      }
    });

    if (!this.currentRoom.cleared) {
      if (this.currentRoom.enemiesSpawned && enemies.length === 0) {
        this.currentRoom.cleared = true;
        this.gateMeshes.forEach(g => {
          g.barrierMat.color.setHex(0x38bdf8);
        });
        window.abyssAudio.playSFX('boon_pickup');
        return 'ROOM_CLEARED';
      }
    }

    return null;
  }

  renderMinimap(canvas) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const cellW = 15;
    const cellH = 15;
    const offsetX = canvas.width / 2 - 2 * (cellW + 3);
    const offsetY = canvas.height / 2 - 1 * (cellH + 3);

    this.rooms.forEach(r => {
      if (!r.visited) return;
      const rx = offsetX + (r.x) * (cellW + 3);
      const ry = offsetY + (r.y + 1) * (cellH + 3);

      const isCurrent = this.currentRoom === r;
      ctx.fillStyle = isCurrent ? '#38bdf8' : (r.cleared ? '#10b981' : '#e11d48');
      ctx.fillRect(rx, ry, cellW, cellH);

      ctx.strokeStyle = isCurrent ? '#fff' : '#64748b';
      ctx.lineWidth = isCurrent ? 2 : 1;
      ctx.strokeRect(rx, ry, cellW, cellH);

      ctx.fillStyle = '#fff';
      ctx.font = '9px sans-serif';
      ctx.fillText(r.icon, rx + 2, ry + 11);
    });
  }
}
