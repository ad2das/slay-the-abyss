/* ==========================================================================
   ABYSSAL SLAYER 3D: THREE.JS 3D COMBAT ENTITIES & BOSS ARCHON (ANIMATED)
   Dynamic Cape Physics, Flapping Demon Wings, Orbiting Runes & 3D Projectiles
   ========================================================================== */

class Player3D {
  constructor(scene, classData, talents = {}) {
    this.scene = scene;
    this.classId = classData.id;
    this.name = classData.name;
    this.icon = classData.icon;
    this.color = classData.color;

    // Talent Stats Multipliers
    const hpBonus = (talents['max_hp'] || 0) * 30;
    const atkMult = 1 + (talents['atk_power'] || 0) * 0.08;
    const critBonus = (talents['crit_mastery'] || 0) * 0.04;
    const extraDash = (talents['dash_mastery'] || 0) >= 1 ? 1 : 0;

    this.maxHp = classData.maxHp + hpBonus;
    this.hp = this.maxHp;
    this.shield = 0;
    this.maxMp = classData.maxMp;
    this.mp = this.maxMp;
    this.speed = (classData.speed * 1.5) * (1 + (talents['dash_mastery'] || 0) * 0.05);
    this.baseAtk = classData.attackPower * atkMult;
    this.critRate = classData.critRate + critBonus;
    this.critMult = classData.critMult;

    // 3D Mesh
    this.mesh = ModelFactory3D.createHeroMesh(this.classId);
    this.scene.add(this.mesh);

    this.x = 0;
    this.z = 0;
    this.vx = 0;
    this.vz = 0;
    this.radius = 0.85;
    this.aimAngle = 0;

    // Dash
    this.maxDashes = classData.maxDashes + extraDash;
    this.dashes = this.maxDashes;
    this.dashCd = classData.dashCd;
    this.dashCdTimer = 0;
    this.isDashing = false;
    this.dashTimer = 0;
    this.dashDuration = 0.18;
    this.iFrameTimer = 0;

    // Combat & Skills Cooldowns
    this.attackCd = 0;
    this.swingTimer = 0;
    this.comboStep = 0;
    this.skills = JSON.parse(JSON.stringify(classData.skills));
    this.cdSkill1 = 0;
    this.cdSkill2 = 0;
    this.cdUlt = 0;

    // Boons & Buffs
    this.boons = [];
    this.boonThunderDash = false;
    this.boonChainLightning = false;
    this.boonBloodthirst = false;
    this.boonInfernalCut = false;
    this.boonSoulArrows = false;
    this.boonAbyssCurse = false;
    this.boonReaperExecute = false;

    // Progression
    this.level = 1;
    this.exp = 0;
    this.expNext = 100;
    this.gold = 0;
    this.souls = 0;
    this.kills = 0;
    this.totalDamageDealt = 0;
    this.berserkTimer = 0;
  }

  destroy() {
    this.scene.remove(this.mesh);
  }

  takeDamage(amt, source = '') {
    if (this.iFrameTimer > 0) return;

    if (this.shield > 0) {
      if (this.shield >= amt) {
        this.shield -= amt;
        amt = 0;
      } else {
        amt -= this.shield;
        this.shield = 0;
      }
    }

    this.hp -= amt;
    this.iFrameTimer = 0.3;
    window.vfx3d.addBlood(this.x, 1.0, this.z, 8);
    window.vfx3d.shake(0.35);
    window.vfx3d.addFloatingText(this.x, 1.0, this.z, amt, 'normal');
    window.abyssAudio.playSFX('hit_impact');

    const flash = document.getElementById('fx-flash');
    if (flash) {
      flash.style.background = 'rgba(225, 29, 72, 0.35)';
      setTimeout(() => flash.style.background = 'rgba(225, 29, 72, 0)', 120);
    }
  }

  dash(moveX, moveZ) {
    if (this.dashes <= 0 || this.isDashing) return;
    this.dashes--;
    this.isDashing = true;
    this.dashTimer = this.dashDuration;
    this.iFrameTimer = this.dashDuration + 0.1;

    let dirX = moveX, dirZ = moveZ;
    if (dirX === 0 && dirZ === 0) {
      dirX = Math.cos(this.aimAngle);
      dirZ = Math.sin(this.aimAngle);
    } else {
      const len = Math.hypot(dirX, dirZ);
      dirX /= len;
      dirZ /= len;
    }

    this.vx = dirX * (this.speed * 3.4);
    this.vz = dirZ * (this.speed * 3.4);

    window.abyssAudio.playSFX('dash');
    window.vfx3d.addShockwave(this.x, this.z, 3.5, 0x38bdf8);

    if (this.boonThunderDash) {
      window.abyssAudio.playSFX('thunder');
      window.vfx3d.addLightning(this.x, this.z, this.x + (Math.random() - 0.5) * 4, this.z + (Math.random() - 0.5) * 4);
      if (window.gameInstance) {
        window.gameInstance.dealAreaDamage3D(this.x, this.z, 4.5, 45, 'thunder');
      }
    }
  }

  basicAttack(enemies) {
    if (this.attackCd > 0) return;
    this.attackCd = 0.22;
    this.swingTimer = 0.2;
    this.comboStep = (this.comboStep + 1) % 3;

    window.abyssAudio.playSFX('slash');
    const slashRange = 3.6;
    const slashArc = 1.4;

    window.vfx3d.addSlashArc(this.x, this.z, this.aimAngle, slashRange, this.classId === 'berserker' ? 0xef4444 : 0x38bdf8);

    let hits = 0;
    enemies.forEach(e => {
      const dist = Math.hypot(e.x - this.x, e.z - this.z);
      if (dist < slashRange + e.radius) {
        const angleToEnemy = Math.atan2(e.z - this.z, e.x - this.x);
        let diff = Math.abs(angleToEnemy - this.aimAngle);
        while (diff > Math.PI) diff = Math.abs(diff - Math.PI * 2);

        if (diff < slashArc / 2) {
          hits++;
          const isCrit = Math.random() < this.critRate;
          const dmg = Math.round(this.baseAtk * (isCrit ? this.critMult : 1.0) * (this.berserkTimer > 0 ? 1.8 : 1.0));
          e.takeDamage(dmg, isCrit, this);

          e.x += Math.cos(this.aimAngle) * 0.6;
          e.z += Math.sin(this.aimAngle) * 0.6;

          if (this.boonChainLightning && Math.random() < 0.35) {
            window.abyssAudio.playSFX('thunder');
            window.gameInstance.triggerChainLightning3D(e, enemies, 3, 30);
          }
        }
      }
    });

    if (hits > 0) window.vfx3d.shake(0.2);
  }

  castSkill1(projectiles) {
    if (this.cdSkill1 > 0 || this.mp < this.skills.skill1.mp) return;
    this.mp -= this.skills.skill1.mp;
    this.cdSkill1 = this.skills.skill1.cd;

    if (this.classId === 'shadow_blade') {
      [-0.25, 0, 0.25].forEach(offset => {
        projectiles.push(new Projectile3D(this.scene, {
          x: this.x,
          z: this.z,
          vx: Math.cos(this.aimAngle + offset) * 16,
          vz: Math.sin(this.aimAngle + offset) * 16,
          damage: Math.round(this.baseAtk * 1.3),
          radius: 0.35,
          colorHex: 0x38bdf8,
          owner: 'player',
          penetrates: true
        }));
      });
      window.abyssAudio.playSFX('slash');
    } else if (this.classId === 'pyromancer') {
      projectiles.push(new Projectile3D(this.scene, {
        x: this.x,
        z: this.z,
        vx: Math.cos(this.aimAngle) * 12,
        vz: Math.sin(this.aimAngle) * 12,
        damage: Math.round(this.baseAtk * 2.2),
        radius: 0.6,
        colorHex: 0xf97316,
        owner: 'player',
        explodes: true
      }));
      window.abyssAudio.playSFX('fireball');
    } else if (this.classId === 'berserker') {
      window.gameInstance.dealAreaDamage3D(this.x, this.z, 5.0, Math.round(this.baseAtk * 1.8), 'whirlwind');
      window.vfx3d.addShockwave(this.x, this.z, 5.0, 0xef4444);
      window.abyssAudio.playSFX('slash');
    }
  }

  castSkill2(projectiles) {
    if (this.cdSkill2 > 0 || this.mp < this.skills.skill2.mp) return;
    this.mp -= this.skills.skill2.mp;
    this.cdSkill2 = this.skills.skill2.cd;

    if (this.classId === 'shadow_blade') {
      const cloneX = this.x + Math.cos(this.aimAngle) * 4.5;
      const cloneZ = this.z + Math.sin(this.aimAngle) * 4.5;
      window.gameInstance.dealAreaDamage3D(cloneX, cloneZ, 4.0, Math.round(this.baseAtk * 2.0), 'clone');
      window.vfx3d.addShockwave(cloneX, cloneZ, 4.0, 0xa855f7);
    } else if (this.classId === 'pyromancer') {
      window.gameInstance.dealAreaDamage3D(this.x, this.z, 6.0, Math.round(this.baseAtk * 1.5), 'frost');
      window.vfx3d.addShockwave(this.x, this.z, 6.0, 0x06b6d4);
      window.abyssAudio.playSFX('thunder');
    } else if (this.classId === 'berserker') {
      for (let i = 1; i <= 4; i++) {
        const sx = this.x + Math.cos(this.aimAngle) * (i * 2.2);
        const sz = this.z + Math.sin(this.aimAngle) * (i * 2.2);
        setTimeout(() => {
          window.gameInstance.dealAreaDamage3D(sx, sz, 2.5, Math.round(this.baseAtk * 1.6), 'earth');
          window.vfx3d.addShockwave(sx, sz, 2.5, 0xd97706);
          window.vfx3d.shake(0.25);
        }, i * 70);
      }
      window.abyssAudio.playSFX('hit_impact');
    }
  }

  castUlt(projectiles) {
    if (this.cdUlt > 0 || this.mp < this.skills.ult.mp) return;
    this.mp -= this.skills.ult.mp;
    this.cdUlt = this.skills.ult.cd;

    window.vfx3d.shake(0.6);
    window.abyssAudio.playSFX('fireball');

    if (this.classId === 'shadow_blade') {
      window.gameInstance.enemies.forEach(e => {
        window.vfx3d.addSlashArc(e.x, e.z, Math.random() * Math.PI * 2, 3.0, 0x38bdf8);
        e.takeDamage(Math.round(this.baseAtk * 3.5), true, this);
      });
      window.vfx3d.addShockwave(this.x, this.z, 10.0, 0x38bdf8);
    } else if (this.classId === 'pyromancer') {
      for (let i = 0; i < 4; i++) {
        setTimeout(() => {
          const mx = this.x + (Math.random() - 0.5) * 12;
          const mz = this.z + (Math.random() - 0.5) * 12;
          window.vfx3d.addShockwave(mx, mz, 4.5, 0xf97316);
          window.vfx3d.addSparks(mx, 1.0, mz, 25, 0xfbbf24);
          window.gameInstance.dealAreaDamage3D(mx, mz, 4.5, Math.round(this.baseAtk * 2.8), 'meteor');
          window.abyssAudio.playSFX('fireball');
          window.vfx3d.shake(0.35);
        }, i * 200);
      }
    } else if (this.classId === 'berserker') {
      this.berserkTimer = 6.0;
      this.hp = Math.min(this.maxHp, this.hp + 60);
      window.vfx3d.addFloatingText(this.x, 1.0, this.z, '+60 HP 광폭화!', 'heal');
      window.vfx3d.addShockwave(this.x, this.z, 8.0, 0xef4444);
    }
  }

  addExp(amt) {
    this.exp += amt;
    if (this.exp >= this.expNext) {
      this.exp -= this.expNext;
      this.level++;
      this.expNext = Math.round(this.expNext * 1.4);
      this.maxHp += 20;
      this.hp = this.maxHp;
      this.baseAtk += 4;
      window.abyssAudio.playSFX('boon_pickup');
      window.vfx3d.addFloatingText(this.x, 1.0, this.z, 'LEVEL UP!', 'crit');
    }
  }

  update(dt, moveX, moveZ, room) {
    if (this.iFrameTimer > 0) this.iFrameTimer -= dt;
    if (this.attackCd > 0) this.attackCd -= dt;
    if (this.swingTimer > 0) this.swingTimer -= dt;
    if (this.cdSkill1 > 0) this.cdSkill1 -= dt;
    if (this.cdSkill2 > 0) this.cdSkill2 -= dt;
    if (this.cdUlt > 0) this.cdUlt -= dt;
    if (this.berserkTimer > 0) this.berserkTimer -= dt;

    if (this.dashes < this.maxDashes) {
      this.dashCdTimer += dt;
      if (this.dashCdTimer >= this.dashCd) {
        this.dashCdTimer = 0;
        this.dashes++;
      }
    }

    this.mp = Math.min(this.maxMp, this.mp + dt * 6.5);

    if (this.isDashing) {
      this.dashTimer -= dt;
      if (this.dashTimer <= 0) this.isDashing = false;
    } else {
      const len = Math.hypot(moveX, moveZ);
      if (len > 0) {
        this.vx = (moveX / len) * this.speed;
        this.vz = (moveZ / len) * this.speed;
      } else {
        this.vx *= 0.7;
        this.vz *= 0.7;
      }
    }

    this.x += this.vx * dt;
    this.z += this.vz * dt;

    const halfW = room.width / 2 - 1.5;
    const halfH = room.height / 2 - 1.5;
    this.x = Math.max(-halfW, Math.min(halfW, this.x));
    this.z = Math.max(-halfH, Math.min(halfH, this.z));

    // Update 3D Mesh
    this.mesh.position.set(this.x, 0, this.z);
    this.mesh.rotation.y = -this.aimAngle + Math.PI / 2;

    // Cape Cloth Animation
    if (this.mesh.userData.cape) {
      const speedMag = Math.hypot(this.vx, this.vz);
      this.mesh.userData.cape.rotation.x = 0.35 + (speedMag > 0.1 ? 0.3 : 0.05) + Math.sin(Date.now() * 0.015) * 0.08;
    }

    // Orb Rotation
    if (this.mesh.userData.orb) {
      this.mesh.userData.orb.rotation.y += dt * 3.0;
    }

    // Weapon Swing animation
    if (this.mesh.userData.weapon) {
      this.mesh.userData.weapon.rotation.x = this.swingTimer > 0 ? Math.PI / 1.5 : Math.PI / 4;
    }
    if (this.mesh.userData.weaponL && this.mesh.userData.weaponR) {
      const ang = this.swingTimer > 0 ? Math.PI / 1.6 : Math.PI / 3;
      this.mesh.userData.weaponL.rotation.x = ang;
      this.mesh.userData.weaponR.rotation.x = ang;
    }
  }
}

class Projectile3D {
  constructor(scene, cfg) {
    this.scene = scene;
    this.x = cfg.x;
    this.z = cfg.z;
    this.vx = cfg.vx;
    this.vz = cfg.vz;
    this.damage = cfg.damage;
    this.radius = cfg.radius || 0.35;
    this.colorHex = cfg.colorHex || 0xffffff;
    this.owner = cfg.owner || 'player';
    this.penetrates = cfg.penetrates || false;
    this.explodes = cfg.explodes || false;
    this.life = cfg.life || 2.5;

    const geo = new THREE.SphereGeometry(this.radius, 8, 8);
    const mat = new THREE.MeshBasicMaterial({ color: this.colorHex });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.position.set(this.x, 0.9, this.z);
    this.scene.add(this.mesh);
  }

  destroy() {
    this.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }

  update(dt) {
    this.x += this.vx * dt;
    this.z += this.vz * dt;
    this.mesh.position.set(this.x, 0.9, this.z);
    this.life -= dt;
  }
}

class Enemy3D {
  constructor(scene, type, x, z) {
    this.scene = scene;
    this.type = type;
    this.x = x;
    this.z = z;
    this.vx = 0;
    this.vz = 0;
    this.attackCd = 0;

    this.mesh = ModelFactory3D.createEnemyMesh(type);
    this.mesh.position.set(x, 0, z);
    this.scene.add(this.mesh);

    if (type === 'void_skulker') {
      this.name = '공허 망령';
      this.hp = 80;
      this.maxHp = 80;
      this.speed = 3.6;
      this.radius = 0.7;
      this.damage = 16;
    } else if (type === 'skeleton_archer') {
      this.name = '심연 궁수';
      this.hp = 65;
      this.maxHp = 65;
      this.speed = 2.4;
      this.radius = 0.6;
      this.damage = 18;
    } else if (type === 'minotaur_elite') {
      this.name = '엘리트 미노타우로스';
      this.hp = 420;
      this.maxHp = 420;
      this.speed = 2.6;
      this.radius = 1.2;
      this.damage = 32;
      this.isElite = true;
    }
  }

  destroy() {
    this.scene.remove(this.mesh);
  }

  takeDamage(amt, isCrit, player) {
    this.hp -= amt;
    player.totalDamageDealt += amt;

    window.vfx3d.addFloatingText(this.x, 1.2, this.z, amt, isCrit ? 'crit' : 'normal');
    window.vfx3d.addBlood(this.x, 0.8, this.z, 6);

    if (player.boonReaperExecute && !this.isElite && this.hp / this.maxHp <= 0.2) {
      this.hp = 0;
      window.vfx3d.addFloatingText(this.x, 1.5, this.z, 'EXECUTE!', 'crit');
    }

    if (this.hp <= 0) {
      player.kills++;
      player.gold += Math.floor(Math.random() * 8) + 5;
      player.souls += this.isElite ? 10 : 2;
      player.addExp(this.isElite ? 60 : 20);

      if (player.boonBloodthirst) {
        player.hp = Math.min(player.maxHp, player.hp + 8);
        window.vfx3d.addFloatingText(player.x, 1.0, player.z, '+8 HP', 'heal');
      }
    }
  }

  update(dt, player3D, projectiles) {
    this.attackCd -= dt;
    const dist = Math.hypot(player3D.x - this.x, player3D.z - this.z);
    const angle = Math.atan2(player3D.z - this.z, player3D.x - this.x);

    this.mesh.rotation.y = -angle + Math.PI / 2;

    if (this.type === 'void_skulker' || this.type === 'minotaur_elite') {
      this.vx = Math.cos(angle) * this.speed;
      this.vz = Math.sin(angle) * this.speed;
      this.x += this.vx * dt;
      this.z += this.vz * dt;

      if (dist < this.radius + player3D.radius && this.attackCd <= 0) {
        this.attackCd = 1.0;
        player3D.takeDamage(this.damage, 'enemy');
      }
    } else if (this.type === 'skeleton_archer') {
      if (dist < 4.0) {
        this.x -= Math.cos(angle) * this.speed * dt;
        this.z -= Math.sin(angle) * this.speed * dt;
      } else if (dist > 8.0) {
        this.x += Math.cos(angle) * this.speed * dt;
        this.z += Math.sin(angle) * this.speed * dt;
      }

      if (this.attackCd <= 0 && dist < 12.0) {
        this.attackCd = 2.0;
        projectiles.push(new Projectile3D(this.scene, {
          x: this.x,
          z: this.z,
          vx: Math.cos(angle) * 10,
          vz: Math.sin(angle) * 10,
          damage: this.damage,
          radius: 0.25,
          colorHex: 0x38bdf8,
          owner: 'enemy'
        }));
      }
    }

    this.mesh.position.set(this.x, 0, this.z);
  }
}

class AbaddonBoss3D {
  constructor(scene, x, z) {
    this.scene = scene;
    this.name = '공허의 대군주 - 아바돈 (Abaddon)';
    this.x = x;
    this.z = z;
    this.maxHp = 2200;
    this.hp = this.maxHp;
    this.radius = 2.0;
    this.phase = 1;
    this.attackTimer = 0;
    this.isBoss = true;

    this.mesh = ModelFactory3D.createBossMesh();
    this.mesh.position.set(x, 0, z);
    this.scene.add(this.mesh);
  }

  destroy() {
    this.scene.remove(this.mesh);
  }

  takeDamage(amt, isCrit, player) {
    this.hp -= amt;
    player.totalDamageDealt += amt;
    window.vfx3d.addFloatingText(this.x, 2.5, this.z, amt, isCrit ? 'crit' : 'normal');
    window.vfx3d.addBlood(this.x, 2.0, this.z, 8);

    if (this.hp <= this.maxHp * 0.35 && this.phase < 3) {
      this.phase = 3;
      window.vfx3d.shake(0.6);
      window.vfx3d.addShockwave(this.x, this.z, 8.0, 0xf43f5e);
      document.getElementById('boss-phase-badge').innerText = 'PHASE 3 (광란)';
    } else if (this.hp <= this.maxHp * 0.7 && this.phase < 2) {
      this.phase = 2;
      window.vfx3d.shake(0.4);
      document.getElementById('boss-phase-badge').innerText = 'PHASE 2';
    }
  }

  update(dt, player3D, projectiles) {
    this.attackTimer += dt;
    const dist = Math.hypot(player3D.x - this.x, player3D.z - this.z);
    const angle = Math.atan2(player3D.z - this.z, player3D.x - this.x);

    this.x += Math.cos(angle) * (this.phase === 3 ? 3.2 : 1.8) * dt;
    this.z += Math.sin(angle) * (this.phase === 3 ? 3.2 : 1.8) * dt;
    this.mesh.position.set(this.x, 0, this.z);

    // Flapping Wings Animation
    if (this.mesh.userData.wings) {
      const flap = Math.sin(Date.now() * 0.006) * 0.3;
      this.mesh.userData.wings.children.forEach((w, idx) => {
        w.rotation.y = (idx % 2 === 0 ? 1 : -1) * flap;
      });
    }

    // Orbiting Swords Animation
    if (this.mesh.userData.swordRing) {
      this.mesh.userData.swordRing.rotation.y += dt * 2.0;
    }

    if (this.attackTimer > (this.phase === 3 ? 1.4 : 2.4)) {
      this.attackTimer = 0;
      const bulletCount = this.phase === 3 ? 16 : 10;
      for (let i = 0; i < bulletCount; i++) {
        const bAngle = (Math.PI * 2 / bulletCount) * i;
        projectiles.push(new Projectile3D(this.scene, {
          x: this.x,
          z: this.z,
          vx: Math.cos(bAngle) * 8.0,
          vz: Math.sin(bAngle) * 8.0,
          damage: 22,
          radius: 0.35,
          colorHex: 0xe11d48,
          owner: 'enemy'
        }));
      }
      window.abyssAudio.playSFX('fireball');
    }
  }
}
