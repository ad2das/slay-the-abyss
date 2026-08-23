/* ==========================================================================
   ABYSSAL SLAYER: PROCEDURAL DUNGEON & ROOM ENGINE
   Room Generation, Gates, Destructibles, Shrines, Traps & Minimap
   ========================================================================== */

class DungeonFloor {
  constructor(floorNumber = 1) {
    this.floorNumber = floorNumber;
    this.rooms = [];
    this.currentRoom = null;
    this.gridWidth = 5;
    this.gridHeight = 5;
    this.destructibles = [];
    this.traps = [];
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
        width: 1200,
        height: 800,
        doors: this.calculateDoors(r, layout),
        enemiesSpawned: false
      });
    });

    this.currentRoom = this.rooms.find(r => r.type === 'start');
    this.spawnRoomProps(this.currentRoom);
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

  spawnRoomProps(room) {
    this.destructibles = [];
    this.traps = [];

    // Spawn pots & barrels
    const potCount = Math.floor(Math.random() * 5) + 4;
    for (let i = 0; i < potCount; i++) {
      this.destructibles.push({
        x: Math.random() * (room.width - 200) + 100,
        y: Math.random() * (room.height - 200) + 100,
        radius: 18,
        hp: 1,
        type: Math.random() > 0.3 ? 'pot' : 'barrel'
      });
    }

    // Traps
    if (room.type === 'combat' || room.type === 'elite') {
      for (let i = 0; i < 3; i++) {
        this.traps.push({
          x: Math.random() * (room.width - 300) + 150,
          y: Math.random() * (room.height - 300) + 150,
          size: 40,
          timer: Math.random() * 2,
          active: false
        });
      }
    }
  }

  changeRoom(targetDir, player) {
    const cur = this.currentRoom;
    let targetX = cur.x;
    let targetY = cur.y;

    if (targetDir === 'north') { targetY -= 1; player.y = cur.height - 90; }
    else if (targetDir === 'south') { targetY += 1; player.y = 90; }
    else if (targetDir === 'east') { targetX += 1; player.x = 90; }
    else if (targetDir === 'west') { targetX -= 1; player.x = cur.width - 90; }

    const nextRoom = this.rooms.find(r => r.x === targetX && r.y === targetY);
    if (nextRoom) {
      this.currentRoom = nextRoom;
      nextRoom.visited = true;
      this.spawnRoomProps(nextRoom);
      return nextRoom;
    }
    return null;
  }

  update(dt, player, enemies) {
    // Check Room Clear
    if (!this.currentRoom.cleared) {
      if (this.currentRoom.enemiesSpawned && enemies.length === 0) {
        this.currentRoom.cleared = true;
        window.abyssAudio.playSFX('boon_pickup');
        window.abyssParticles.shake(6);
        return 'ROOM_CLEARED';
      }
    }

    // Update Traps
    this.traps.forEach(trap => {
      trap.timer += dt;
      if (trap.timer > 2.5) {
        trap.timer = 0;
        trap.active = !trap.active;
      }
      if (trap.active && Math.hypot(trap.x - player.x, trap.y - player.y) < 32) {
        player.takeDamage(12, 'trap');
      }
    });

    return null;
  }

  render(ctx, camera) {
    const room = this.currentRoom;

    // Floor tiles pattern
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-camera.x, -camera.y, room.width, room.height);

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    for (let x = 0; x < room.width; x += 60) {
      for (let y = 0; y < room.height; y += 60) {
        ctx.strokeRect(x - camera.x, y - camera.y, 60, 60);
      }
    }

    // Outer Obsidian Walls
    ctx.fillStyle = '#020617';
    ctx.fillRect(-camera.x - 60, -camera.y - 60, room.width + 120, 60); // Top
    ctx.fillRect(-camera.x - 60, room.height - camera.y, room.width + 120, 60); // Bottom
    ctx.fillRect(-camera.x - 60, -camera.y, 60, room.height); // Left
    ctx.fillRect(room.width - camera.x, -camera.y, 60, room.height); // Right

    // Wall Glow Borders
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 4;
    ctx.strokeRect(-camera.x, -camera.y, room.width, room.height);

    // Render Doors
    const isLocked = !room.cleared;
    room.doors.forEach(dir => {
      let dx = 0, dy = 0, dw = 0, dh = 0;
      if (dir === 'north') { dx = room.width / 2 - 40; dy = 0; dw = 80; dh = 15; }
      else if (dir === 'south') { dx = room.width / 2 - 40; dy = room.height - 15; dw = 80; dh = 15; }
      else if (dir === 'west') { dx = 0; dy = room.height / 2 - 40; dw = 15; dh = 80; }
      else if (dir === 'east') { dx = room.width - 15; dy = room.height / 2 - 40; dw = 15; dh = 80; }

      ctx.fillStyle = isLocked ? '#e11d48' : '#38bdf8';
      ctx.shadowColor = isLocked ? '#e11d48' : '#38bdf8';
      ctx.shadowBlur = isLocked ? 15 : 20;
      ctx.fillRect(dx - camera.x, dy - camera.y, dw, dh);
      ctx.shadowBlur = 0;
    });

    // Render Traps
    this.traps.forEach(trap => {
      ctx.fillStyle = trap.active ? 'rgba(225, 29, 72, 0.7)' : 'rgba(71, 85, 105, 0.5)';
      ctx.fillRect(trap.x - trap.size / 2 - camera.x, trap.y - trap.size / 2 - camera.y, trap.size, trap.size);
      if (trap.active) {
        ctx.fillStyle = '#fff';
        ctx.font = '16px sans-serif';
        ctx.fillText('🔥', trap.x - 8 - camera.x, trap.y + 6 - camera.y);
      }
    });

    // Render Destructible Props
    this.destructibles.forEach(d => {
      ctx.fillStyle = d.type === 'barrel' ? '#854d0e' : '#64748b';
      ctx.beginPath();
      ctx.arc(d.x - camera.x, d.y - camera.y, d.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fde68a';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
  }

  renderMinimap(canvas) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const cellW = 18;
    const cellH = 18;
    const offsetX = canvas.width / 2 - 2 * (cellW + 4);
    const offsetY = canvas.height / 2 - 1 * (cellH + 4);

    this.rooms.forEach(r => {
      if (!r.visited) return;
      const rx = offsetX + (r.x) * (cellW + 4);
      const ry = offsetY + (r.y + 1) * (cellH + 4);

      const isCurrent = this.currentRoom === r;
      ctx.fillStyle = isCurrent ? '#38bdf8' : (r.cleared ? '#10b981' : '#e11d48');
      ctx.fillRect(rx, ry, cellW, cellH);

      ctx.strokeStyle = isCurrent ? '#fff' : '#64748b';
      ctx.lineWidth = isCurrent ? 2 : 1;
      ctx.strokeRect(rx, ry, cellW, cellH);

      ctx.fillStyle = '#fff';
      ctx.font = '10px sans-serif';
      ctx.fillText(r.icon, rx + 3, ry + 13);
    });
  }
}
