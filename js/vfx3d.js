/* ==========================================================================
   ABYSSAL SLAYER 3D: THREE.JS PARTICLE & VISUAL EFFECTS (VFX) ENGINE
   3D Slash Ribbons, Shockwave Rings, Lightning Bolts, Blood & Floating Text
   ========================================================================== */

class VFX3DEngine {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
    this.shockwaves = [];
    this.lightningBolts = [];
    this.floatingTexts = [];
    this.screenShake = 0;
  }

  shake(amount = 0.5) {
    this.screenShake = Math.max(this.screenShake, amount);
  }

  addSlashArc(x, z, angle, radius = 2.4, colorHex = 0x38bdf8) {
    const geom = new THREE.RingGeometry(radius * 0.7, radius, 16, 1, angle - 0.9, 1.8);
    geom.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({ color: colorHex, side: THREE.DoubleSide, transparent: true, opacity: 0.85 });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.set(x, 0.8, z);
    this.scene.add(mesh);

    this.particles.push({
      mesh,
      life: 0.12,
      maxLife: 0.12,
      update(dt) {
        this.life -= dt;
        mesh.material.opacity = (this.life / this.maxLife) * 0.85;
      }
    });
  }

  addShockwave(x, z, maxRadius = 5.0, colorHex = 0xf97316) {
    const geom = new THREE.RingGeometry(0.2, 0.6, 24);
    geom.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({ color: colorHex, side: THREE.DoubleSide, transparent: true, opacity: 0.9 });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.set(x, 0.15, z);
    this.scene.add(mesh);

    this.shockwaves.push({
      mesh,
      radius: 0.5,
      maxRadius,
      life: 0.35,
      maxLife: 0.35
    });
  }

  addSparks(x, y, z, count = 12, colorHex = 0xfbbf24) {
    for (let i = 0; i < count; i++) {
      const geo = new THREE.BoxGeometry(0.1, 0.1, 0.1);
      const mat = new THREE.MeshBasicMaterial({ color: colorHex });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, z);
      this.scene.add(mesh);

      const angle = Math.random() * Math.PI * 2;
      const spd = Math.random() * 6 + 3;
      const vx = Math.cos(angle) * spd;
      const vz = Math.sin(angle) * spd;
      const vy = Math.random() * 5 + 2;

      this.particles.push({
        mesh,
        vx, vy, vz,
        life: 0.4,
        maxLife: 0.4,
        update(dt) {
          this.life -= dt;
          this.vy -= 18 * dt; // gravity
          mesh.position.x += this.vx * dt;
          mesh.position.y = Math.max(0.1, mesh.position.y + this.vy * dt);
          mesh.position.z += this.vz * dt;
          mesh.scale.setScalar(Math.max(0.01, this.life / this.maxLife));
        }
      });
    }
  }

  addBlood(x, y, z, count = 10) {
    for (let i = 0; i < count; i++) {
      const geo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
      const mat = new THREE.MeshBasicMaterial({ color: 0x991b1b });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, z);
      this.scene.add(mesh);

      const angle = Math.random() * Math.PI * 2;
      const spd = Math.random() * 4 + 2;
      const vx = Math.cos(angle) * spd;
      const vz = Math.sin(angle) * spd;
      const vy = Math.random() * 4 + 1;

      this.particles.push({
        mesh,
        vx, vy, vz,
        life: 0.35,
        maxLife: 0.35,
        update(dt) {
          this.life -= dt;
          this.vy -= 16 * dt;
          mesh.position.x += this.vx * dt;
          mesh.position.y = Math.max(0.08, mesh.position.y + this.vy * dt);
          mesh.position.z += this.vz * dt;
          mesh.scale.setScalar(Math.max(0.01, this.life / this.maxLife));
        }
      });
    }
  }

  addLightning(x1, z1, x2, z2, colorHex = 0x67e8f9) {
    const points = [];
    const dist = Math.hypot(x2 - x1, z2 - z1);
    const steps = Math.floor(dist / 1.0) || 1;

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const px = x1 + (x2 - x1) * t + (i === 0 || i === steps ? 0 : (Math.random() - 0.5) * 0.8);
      const py = 1.0 + (i === 0 || i === steps ? 0 : (Math.random() - 0.5) * 0.8);
      const pz = z1 + (z2 - z1) * t + (i === 0 || i === steps ? 0 : (Math.random() - 0.5) * 0.8);
      points.push(new THREE.Vector3(px, py, pz));
    }

    const geom = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({ color: colorHex, linewidth: 3 });
    const line = new THREE.Line(geom, mat);
    this.scene.add(line);

    this.particles.push({
      mesh: line,
      life: 0.15,
      maxLife: 0.15,
      update(dt) {
        this.life -= dt;
      }
    });
  }

  addFloatingText(worldX, worldY, worldZ, text, type = 'normal') {
    this.floatingTexts.push({
      x: worldX,
      y: worldY + 1.2,
      z: worldZ,
      text,
      type,
      life: 0.8,
      maxLife: 0.8
    });
  }

  update(dt) {
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 2.5);
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.update(dt);
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        if (p.mesh.geometry) p.mesh.geometry.dispose();
        if (p.mesh.material) p.mesh.material.dispose();
        this.particles.splice(i, 1);
      }
    }

    // Update Shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.life -= dt;
      if (sw.life <= 0) {
        this.scene.remove(sw.mesh);
        sw.mesh.geometry.dispose();
        sw.mesh.material.dispose();
        this.shockwaves.splice(i, 1);
        continue;
      }
      sw.radius += (sw.maxRadius - sw.radius) * (dt * 10);
      sw.mesh.scale.setScalar(sw.radius);
      sw.mesh.material.opacity = (sw.life / sw.maxLife) * 0.9;
    }

    // Update Floating Text
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life -= dt;
      ft.y += dt * 1.5;
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  render2DOverlay(ctx, camera3D, width, height) {
    // Project 3D floating text to 2D canvas overlay
    const tempV = new THREE.Vector3();
    this.floatingTexts.forEach(ft => {
      tempV.set(ft.x, ft.y, ft.z);
      tempV.project(camera3D);

      const sx = (tempV.x * 0.5 + 0.5) * width;
      const sy = (-(tempV.y * 0.5) + 0.5) * height;

      if (tempV.z < 1) {
        const alpha = Math.max(0, ft.life / ft.maxLife);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.font = ft.type === 'crit' ? "900 22px 'Cinzel'" : "700 16px 'Cinzel'";
        ctx.fillStyle = ft.type === 'crit' ? '#fbbf24' : (ft.type === 'heal' ? '#4ade80' : '#ffffff');
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 5;
        ctx.fillText(ft.type === 'crit' ? `⚡ ${ft.text}!` : ft.text, sx - 20, sy);
        ctx.restore();
      }
    });
  }
}
