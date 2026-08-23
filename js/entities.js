/* ==========================================================================
   ABYSSAL SLAYER: COMBAT ENTITIES & BOSS ARCHON ENGINE
   Player Controller, Enemy AI, Boss Patterns, Projectiles & AOE Spells
   ========================================================================== */

class Player {
  constructor(classData, talents = {}) {
    this.classId = classData.id;
    this.name = classData.name;
    this.icon = classData.icon;
    this.color = classData.color;

    // Talent Multipliers
    const hpBonus = (talents['max_hp'] || 0) * 30;
    const atkMult = 1 + (talents['atk_power'] || 0) * 0.08;
    const critBonus = (talents['crit_mastery'] || 0) * 0.04;
    const extraDash = (talents['dash_mastery'] || 0) >= 1 ? 1 : 0;

    this.maxHp = classData.maxHp + hpBonus;
    this.hp = this.maxHp;
    this.shield = 0;
    this.maxMp = classData.maxMp;
    this.mp = this.maxMp;
    this.speed = classData.speed * (1 + (talents['dash_mastery'] || 0) * 0.05);
    this.baseAtk = classData.attackPower * atkMult;
    this.critRate = classData.critRate + critBonus;
    this.critMult = classData.critMult;

    // Coordinates & Motion
    this.x = 600;
    this.y = 400;
    this.vx = 0;
    this.vy = 0;
    this.radius = 20;
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
    this.comboStep = 0;
    this.skills = JSON.parse(JSON.stringify(classData.skills));
    this.cdSkill1 = 0;
    this.cdSkill2 = 0;
    this.cdUlt = 0;

    // Buffs / Boons
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

    // Asura Berserk Buff
    this.berserkTimer = 0;
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
    window.abyssParticles.addBlood(this.x, this.y, 8);
    window.abyssParticles.shake(7);
    window.abyssParticles.addFloatingText(this.x, this.y - 20, amt, 'normal');
    window.abyssAudio.playSFX('hit_impact');

    const flash = document.getElementById('fx-flash');
    if (flash) {
      flash.style.background = 'rgba(225, 29, 72, 0.35)';
      setTimeout(() => flash.style.background = 'rgba(225, 29, 72, 0)', 120);
    }
  }

  dash(moveX, moveY) {
    if (this.dashes <= 0 || this.isDashing) return;
    this.dashes--;
    this.isDashing = true;
    this.dashTimer = this.dashDuration;
    this.iFrameTimer = this.dashDuration + 0.1;

    let dirX = moveX, dirY = moveY;
    if (dirX === 0 && dirY === 0) {
      dirX = Math.cos(this.aimAngle);
      dirY = Math.sin(this.aimAngle);
    } else {
      const len = Math.hypot(dirX, dirY);
      dirX /= len;
      dirY /= len;
    }

    this.vx = dirX * (this.speed * 3.8);
    this.vy = dirY * (this.speed * 3.8);

    window.abyssAudio.playSFX('dash');
    window.abyssParticles.addShockwave(this.x, this.y, 40, '#38bdf8');

    // Godly Boon: Thunder Dash
    if (this.boonThunderDash) {
      window.abyssAudio.playSFX('thunder');
      window.abyssParticles.addLightning(this.x, this.y, this.x + (Math.random() - 0.5) * 60, this.y + (Math.random() - 0.5) * 60);
      if (window.gameInstance) {
        window.gameInstance.dealAreaDamage(this.x, this.y, 110, 45, 'thunder');
      }
    }
  }

  basicAttack(enemies) {
    if (this.attackCd > 0) return;
    this.attackCd = 0.22;
    this.comboStep = (this.comboStep + 1) % 3;

    window.abyssAudio.playSFX('slash');
    const slashRange = 85;
    const slashArc = 1.4;

    window.abyssParticles.addSlashArc(this.x, this.y, this.aimAngle, slashRange, this.color);

    let hits = 0;
    enemies.forEach(e => {
      const dist = Math.hypot(e.x - this.x, e.y - this.y);
      if (dist < slashRange + e.radius) {
        const angleToEnemy = Math.atan2(e.y - this.y, e.x - this.x);
        let diff = Math.abs(angleToEnemy - this.aimAngle);
        while (diff > Math.PI) diff = Math.abs(diff - Math.PI * 2);

        if (diff < slashArc / 2) {
          hits++;
          const isCrit = Math.random() < this.critRate;
          const dmg = Math.round(this.baseAtk * (isCrit ? this.critMult : 1.0) * (this.berserkTimer > 0 ? 1.8 : 1.0));
          e.takeDamage(dmg, isCrit, this);

          // Knockback
          e.x += Math.cos(this.aimAngle) * 14;
          e.y += Math.sin(this.aimAngle) * 14;

          // Boon: Chain Lightning
          if (this.boonChainLightning && Math.random() < 0.35) {
            window.abyssAudio.playSFX('thunder');
            window.gameInstance.triggerChainLightning(e, enemies, 3, 30);
          }
        }
      }
    });

    if (hits > 0) window.abyssParticles.shake(4);
  }

  castSkill1(projectiles) {
    if (this.cdSkill1 > 0 || this.mp < this.skills.skill1.mp) return;
    this.mp -= this.skills.skill1.mp;
    this.cdSkill1 = this.skills.skill1.cd;

    if (this.classId === 'shadow_blade') {
      // 3-way Shurikens
      [-0.25, 0, 0.25].forEach(offset => {
        projectiles.push(new Projectile({
          x: this.x,
          y: this.y,
          vx: Math.cos(this.aimAngle + offset) * 11,
          vy: Math.sin(this.aimAngle + offset) * 11,
          damage: Math.round(this.baseAtk * 1.3),
          radius: 8,
          color: '#38bdf8',
          owner: 'player',
          penetrates: true
        }));
      });
      window.abyssAudio.playSFX('slash');
    } else if (this.classId === 'pyromancer') {
      // Big Fireball
      projectiles.push(new Projectile({
        x: this.x,
        y: this.y,
        vx: Math.cos(this.aimAngle) * 8.5,
        vy: Math.sin(this.aimAngle) * 8.5,
        damage: Math.round(this.baseAtk * 2.2),
        radius: 16,
        color: '#f97316',
        owner: 'player',
        explodes: true
      }));
      window.abyssAudio.playSFX('fireball');
    } else if (this.classId === 'berserker') {
      // Whirlwind Suction
      window.gameInstance.dealAreaDamage(this.x, this.y, 140, Math.round(this.baseAtk * 1.8), 'whirlwind');
      window.abyssParticles.addShockwave(this.x, this.y, 140, '#ef4444');
      window.abyssAudio.playSFX('slash');
    }
  }

  castSkill2(projectiles) {
    if (this.cdSkill2 > 0 || this.mp < this.skills.skill2.mp) return;
    this.mp -= this.skills.skill2.mp;
    this.cdSkill2 = this.skills.skill2.cd;

    if (this.classId === 'shadow_blade') {
      // Shadow Clone Strike
      const cloneX = this.x + Math.cos(this.aimAngle) * 120;
      const cloneY = this.y + Math.sin(this.aimAngle) * 120;
      window.gameInstance.dealAreaDamage(cloneX, cloneY, 100, Math.round(this.baseAtk * 2.0), 'clone');
      window.abyssParticles.addShockwave(cloneX, cloneY, 100, '#a855f7');
    } else if (this.classId === 'pyromancer') {
      // Frost Nova
      window.gameInstance.dealAreaDamage(this.x, this.y, 160, Math.round(this.baseAtk * 1.5), 'frost');
      window.abyssParticles.addShockwave(this.x, this.y, 160, '#06b6d4');
      window.abyssAudio.playSFX('thunder');
    } else if (this.classId === 'berserker') {
      // Ground Slam Wave
      for (let i = 1; i <= 4; i++) {
        const sx = this.x + Math.cos(this.aimAngle) * (i * 60);
        const sy = this.y + Math.sin(this.aimAngle) * (i * 60);
        setTimeout(() => {
          window.gameInstance.dealAreaDamage(sx, sy, 70, Math.round(this.baseAtk * 1.6), 'earth');
          window.abyssParticles.addShockwave(sx, sy, 70, '#d97706');
          window.abyssParticles.shake(5);
        }, i * 70);
      }
      window.abyssAudio.playSFX('hit_impact');
    }
  }

  castUlt(projectiles) {
    if (this.cdUlt > 0 || this.mp < this.skills.ult.mp) return;
    this.mp -= this.skills.ult.mp;
    this.cdUlt = this.skills.ult.cd;

    window.abyssParticles.shake(14);
    window.abyssAudio.playSFX('fireball');

    if (this.classId === 'shadow_blade') {
      // Abyssal Execution: hits all screen enemies
      window.gameInstance.enemies.forEach(e => {
        window.abyssParticles.addSlashArc(e.x, e.y, Math.random() * Math.PI * 2, 70, '#38bdf8');
        e.takeDamage(Math.round(this.baseAtk * 3.5), true, this);
      });
      window.abyssParticles.addShockwave(this.x, this.y, 300, '#38bdf8');
    } else if (this.classId === 'pyromancer') {
      // Quad Meteor Strike
      for (let i = 0; i < 4; i++) {
        setTimeout(() => {
          const mx = this.x + (Math.random() - 0.5) * 350;
          const my = this.y + (Math.random() - 0.5) * 350;
          window.abyssParticles.addShockwave(mx, my, 130, '#f97316');
          window.abyssParticles.addSparks(mx, my, 25, '#fbbf24', 8);
          window.gameInstance.dealAreaDamage(mx, my, 130, Math.round(this.baseAtk * 2.8), 'meteor');
          window.abyssAudio.playSFX('fireball');
          window.abyssParticles.shake(8);
        }, i * 200);
      }
    } else if (this.classId === 'berserker') {
      // Asura Bloodlust Berserk Mode
      this.berserkTimer = 6.0;
      this.hp = Math.min(this.maxHp, this.hp + 60);
      window.abyssParticles.addFloatingText(this.x, this.y - 30, '+60 HP 광폭화!', 'heal');
      window.abyssParticles.addShockwave(this.x, this.y, 200, '#ef4444');
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
      window.abyssParticles.addFloatingText(this.x, this.y - 40, 'LEVEL UP!', 'crit');
    }
  }

  update(dt, moveX, moveY, room) {
    if (this.iFrameTimer > 0) this.iFrameTimer -= dt;
    if (this.attackCd > 0) this.attackCd -= dt;
    if (this.cdSkill1 > 0) this.cdSkill1 -= dt;
    if (this.cdSkill2 > 0) this.cdSkill2 -= dt;
    if (this.cdUlt > 0) this.cdUlt -= dt;
    if (this.berserkTimer > 0) this.berserkTimer -= dt;

    // Dash recharge
    if (this.dashes < this.maxDashes) {
      this.dashCdTimer += dt;
      if (this.dashCdTimer >= this.dashCd) {
        this.dashCdTimer = 0;
        this.dashes++;
      }
    }

    // Mana natural regen
    this.mp = Math.min(this.maxMp, this.mp + dt * 6.5);

    if (this.isDashing) {
      this.dashTimer -= dt;
      if (this.dashTimer <= 0) {
        this.isDashing = false;
      }
    } else {
      const len = Math.hypot(moveX, moveY);
      if (len > 0) {
        this.vx = (moveX / len) * this.speed;
        this.vy = (moveY / len) * this.speed;
      } else {
        this.vx *= 0.7;
        this.vy *= 0.7;
      }
    }

    this.x += this.vx;
    this.y += this.vy;

    // Room boundaries
    this.x = Math.max(30, Math.min(room.width - 30, this.x));
    this.y = Math.max(30, Math.min(room.height - 30, this.y));
  }

  render(ctx, camera) {
    const rx = this.x - camera.x;
    const ry = this.y - camera.y;

    // Aim Indicator Line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.lineTo(rx + Math.cos(this.aimAngle) * 50, ry + Math.sin(this.aimAngle) * 50);
    ctx.stroke();
    ctx.setLineDash([]);

    // Player Body
    ctx.save();
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 12;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(rx, ry, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Inner Core
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(rx, ry, this.radius * 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Hero Icon
    ctx.font = '16px sans-serif';
    ctx.fillText(this.icon, rx - 8, ry + 6);
  }
}

class Projectile {
  constructor(cfg) {
    this.x = cfg.x;
    this.y = cfg.y;
    this.vx = cfg.vx;
    this.vy = cfg.vy;
    this.damage = cfg.damage;
    this.radius = cfg.radius || 6;
    this.color = cfg.color || '#fff';
    this.owner = cfg.owner || 'player';
    this.penetrates = cfg.penetrates || false;
    this.explodes = cfg.explodes || false;
    this.life = cfg.life || 3.0;
  }

  update(dt) {
    this.x += this.vx;
    this.y += this.vy;
    this.life -= dt;
  }

  render(ctx, camera) {
    ctx.save();
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 8;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x - camera.x, this.y - camera.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

class Enemy {
  constructor(type, x, y) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.attackCd = 0;

    if (type === 'void_skulker') {
      this.name = '공허 망령';
      this.hp = 80;
      this.maxHp = 80;
      this.speed = 3.2;
      this.radius = 16;
      this.color = '#a855f7';
      this.damage = 16;
      this.icon = '👾';
    } else if (type === 'skeleton_archer') {
      this.name = '심연 궁수';
      this.hp = 65;
      this.maxHp = 65;
      this.speed = 2.2;
      this.radius = 16;
      this.color = '#38bdf8';
      this.damage = 18;
      this.icon = '🏹';
    } else if (type === 'minotaur_elite') {
      this.name = '엘리트 미노타우로스';
      this.hp = 420;
      this.maxHp = 420;
      this.speed = 2.4;
      this.radius = 28;
      this.color = '#ef4444';
      this.damage = 32;
      this.icon = '🐂';
      this.isElite = true;
    }
  }

  takeDamage(amt, isCrit, player) {
    this.hp -= amt;
    player.totalDamageDealt += amt;

    window.abyssParticles.addFloatingText(this.x, this.y - 15, amt, isCrit ? 'crit' : 'normal');
    window.abyssParticles.addBlood(this.x, this.y, 6);

    // Boon: Reaper execute
    if (player.boonReaperExecute && !this.isElite && this.hp / this.maxHp <= 0.2) {
      this.hp = 0;
      window.abyssParticles.addFloatingText(this.x, this.y - 30, 'EXECUTE!', 'crit');
    }

    if (this.hp <= 0) {
      player.kills++;
      player.gold += Math.floor(Math.random() * 8) + 5;
      player.souls += this.isElite ? 10 : 2;
      player.addExp(this.isElite ? 60 : 20);

      // Boon: Bloodthirst
      if (player.boonBloodthirst) {
        player.hp = Math.min(player.maxHp, player.hp + 8);
        window.abyssParticles.addFloatingText(player.x, player.y - 20, '+8 HP', 'heal');
      }
    }
  }

  update(dt, player, projectiles) {
    this.attackCd -= dt;
    const dist = Math.hypot(player.x - this.x, player.y - this.y);
    const angle = Math.atan2(player.y - this.y, player.x - this.x);

    if (this.type === 'void_skulker' || this.type === 'minotaur_elite') {
      // Melee chase
      this.vx = Math.cos(angle) * this.speed;
      this.vy = Math.sin(angle) * this.speed;
      this.x += this.vx;
      this.y += this.vy;

      if (dist < this.radius + player.radius && this.attackCd <= 0) {
        this.attackCd = 1.0;
        player.takeDamage(this.damage, 'enemy');
      }
    } else if (this.type === 'skeleton_archer') {
      // Keep distance and shoot
      if (dist < 180) {
        this.x -= Math.cos(angle) * this.speed;
        this.y -= Math.sin(angle) * this.speed;
      } else if (dist > 320) {
        this.x += Math.cos(angle) * this.speed;
        this.y += Math.sin(angle) * this.speed;
      }

      if (this.attackCd <= 0 && dist < 450) {
        this.attackCd = 2.0;
        projectiles.push(new Projectile({
          x: this.x,
          y: this.y,
          vx: Math.cos(angle) * 6,
          vy: Math.sin(angle) * 6,
          damage: this.damage,
          radius: 5,
          color: '#38bdf8',
          owner: 'enemy'
        }));
      }
    }
  }

  render(ctx, camera) {
    const rx = this.x - camera.x;
    const ry = this.y - camera.y;

    // Body
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(rx, ry, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Icon
    ctx.font = `${this.radius}px sans-serif`;
    ctx.fillText(this.icon, rx - this.radius / 2, ry + this.radius / 3);

    // HP Bar
    const barW = this.radius * 2;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(rx - this.radius, ry - this.radius - 8, barW, 4);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(rx - this.radius, ry - this.radius - 8, barW * Math.max(0, this.hp / this.maxHp), 4);
  }
}

class AbaddonBoss {
  constructor(x, y) {
    this.name = '공허의 대군주 - 아바돈 (Abaddon)';
    this.x = x;
    this.y = y;
    this.maxHp = 2200;
    this.hp = this.maxHp;
    this.radius = 45;
    this.color = '#e11d48';
    this.phase = 1;
    this.attackTimer = 0;
    this.isBoss = true;
  }

  takeDamage(amt, isCrit, player) {
    this.hp -= amt;
    player.totalDamageDealt += amt;
    window.abyssParticles.addFloatingText(this.x, this.y - 30, amt, isCrit ? 'crit' : 'normal');
    window.abyssParticles.addBlood(this.x, this.y, 8);

    if (this.hp <= this.maxHp * 0.35 && this.phase < 3) {
      this.phase = 3;
      window.abyssParticles.shake(16);
      window.abyssParticles.addShockwave(this.x, this.y, 250, '#f43f5e');
      document.getElementById('boss-phase-badge').innerText = 'PHASE 3 (광란)';
    } else if (this.hp <= this.maxHp * 0.7 && this.phase < 2) {
      this.phase = 2;
      window.abyssParticles.shake(10);
      document.getElementById('boss-phase-badge').innerText = 'PHASE 2';
    }
  }

  update(dt, player, projectiles) {
    this.attackTimer += dt;
    const dist = Math.hypot(player.x - this.x, player.y - this.y);
    const angle = Math.atan2(player.y - this.y, player.x - this.x);

    // Slow ominous floating
    this.x += Math.cos(angle) * (this.phase === 3 ? 2.5 : 1.4);
    this.y += Math.sin(angle) * (this.phase === 3 ? 2.5 : 1.4);

    // Pattern 1: Radial Bullet Hell Ring
    if (this.attackTimer > (this.phase === 3 ? 1.6 : 2.6)) {
      this.attackTimer = 0;
      const bulletCount = this.phase === 3 ? 16 : 10;
      for (let i = 0; i < bulletCount; i++) {
        const bAngle = (Math.PI * 2 / bulletCount) * i;
        projectiles.push(new Projectile({
          x: this.x,
          y: this.y,
          vx: Math.cos(bAngle) * 4.5,
          vy: Math.sin(bAngle) * 4.5,
          damage: 22,
          radius: 7,
          color: '#e11d48',
          owner: 'enemy'
        }));
      }
      window.abyssAudio.playSFX('fireball');
    }
  }

  render(ctx, camera) {
    const rx = this.x - camera.x;
    const ry = this.y - camera.y;

    // Pulsing Void Halo
    ctx.save();
    ctx.shadowColor = '#e11d48';
    ctx.shadowBlur = 25;
    ctx.fillStyle = '#4c0519';
    ctx.beginPath();
    ctx.arc(rx, ry, this.radius + 6, 0, Math.PI * 2);
    ctx.fill();

    // Boss Body
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(rx, ry, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.font = '36px sans-serif';
    ctx.fillText('👑', rx - 18, ry + 12);
  }
}
