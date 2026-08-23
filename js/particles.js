/* ==========================================================================
   ABYSSAL SLAYER: ADVANCED PARTICLE & COMBAT VFX ENGINE
   Slash Arcs, Blood Splatters, Shockwaves, Lightning Bolts & Floating Text
   ========================================================================== */

class ParticleSystem {
  constructor() {
    this.particles = [];
    this.floatingTexts = [];
    this.decals = []; // Permanent ground blood & scorch marks
    this.lightningArcs = [];
    this.screenShake = 0;
  }

  shake(amount = 8) {
    this.screenShake = Math.max(this.screenShake, amount);
  }

  addSlashArc(x, y, angle, radius, color = '#38bdf8') {
    this.particles.push({
      type: 'slash',
      x, y,
      angle,
      radius,
      color,
      life: 0.12,
      maxLife: 0.12,
      progress: 0
    });
  }

  addShockwave(x, y, maxRadius = 80, color = '#f97316') {
    this.particles.push({
      type: 'shockwave',
      x, y,
      radius: 5,
      maxRadius,
      color,
      life: 0.35,
      maxLife: 0.35
    });
  }

  addSparks(x, y, count = 10, color = '#fbbf24', speed = 5) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = (Math.random() * 0.7 + 0.3) * speed;
      this.particles.push({
        type: 'spark',
        x, y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        color,
        size: Math.random() * 3 + 2,
        life: Math.random() * 0.3 + 0.2,
        maxLife: 0.5
      });
    }
  }

  addBlood(x, y, count = 12, dirAngle = null) {
    for (let i = 0; i < count; i++) {
      const angle = dirAngle !== null ? dirAngle + (Math.random() - 0.5) * 1.2 : Math.random() * Math.PI * 2;
      const spd = Math.random() * 6 + 2;
      this.particles.push({
        type: 'blood',
        x, y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        color: Math.random() > 0.3 ? '#991b1b' : '#e11d48',
        size: Math.random() * 3.5 + 2,
        life: Math.random() * 0.25 + 0.2,
        maxLife: 0.45
      });
    }

    // Add ground decal
    if (this.decals.length > 80) this.decals.shift();
    this.decals.push({
      x: x + (Math.random() - 0.5) * 20,
      y: y + (Math.random() - 0.5) * 20,
      radius: Math.random() * 8 + 6,
      color: 'rgba(153, 27, 27, 0.45)'
    });
  }

  addLightning(x1, y1, x2, y2, color = '#67e8f9') {
    const points = [{ x: x1, y: y1 }];
    const dist = Math.hypot(x2 - x1, y2 - y1);
    const steps = Math.floor(dist / 20);
    for (let i = 1; i < steps; i++) {
      const progress = i / steps;
      const nx = x1 + (x2 - x1) * progress + (Math.random() - 0.5) * 25;
      const ny = y1 + (y2 - y1) * progress + (Math.random() - 0.5) * 25;
      points.push({ x: nx, y: ny });
    }
    points.push({ x: x2, y: y2 });
    this.lightningArcs.push({ points, color, life: 0.15, maxLife: 0.15 });
  }

  addFloatingText(x, y, text, type = 'normal') {
    let color = '#ffffff';
    let size = 14;
    let fontWeight = '700';

    if (type === 'crit') {
      color = '#fbbf24';
      size = 20;
      fontWeight = '900';
      text = '⚡ ' + text + '!';
    } else if (type === 'heal') {
      color = '#4ade80';
      size = 15;
      text = '+' + text;
    } else if (type === 'burn') {
      color = '#f97316';
      size = 13;
    } else if (type === 'mana') {
      color = '#38bdf8';
      size = 13;
    }

    this.floatingTexts.push({
      x, y,
      text,
      color,
      size,
      fontWeight,
      vx: (Math.random() - 0.5) * 1.5,
      vy: -2.2,
      life: 0.8,
      maxLife: 0.8
    });
  }

  update(dt) {
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 25);
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      if (p.type === 'spark' || p.type === 'blood') {
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.92;
        p.vy *= 0.92;
      } else if (p.type === 'shockwave') {
        p.radius += (p.maxRadius - p.radius) * (dt * 12);
      }
    }

    // Update Floating Text
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life -= dt;
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
        continue;
      }
      ft.x += ft.vx;
      ft.y += ft.vy;
      ft.vy += 0.05; // light gravity deceleration
    }

    // Update Lightning
    for (let i = this.lightningArcs.length - 1; i >= 0; i--) {
      const arc = this.lightningArcs[i];
      arc.life -= dt;
      if (arc.life <= 0) {
        this.lightningArcs.splice(i, 1);
      }
    }
  }

  render(ctx, camera) {
    // Render Ground Decals
    this.decals.forEach(d => {
      ctx.fillStyle = d.color;
      ctx.beginPath();
      ctx.arc(d.x - camera.x, d.y - camera.y, d.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Render Particles
    this.particles.forEach(p => {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;

      if (p.type === 'spark' || p.type === 'blood') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x - camera.x, p.y - camera.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'shockwave') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(p.x - camera.x, p.y - camera.y, p.radius, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.type === 'slash') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(p.x - camera.x, p.y - camera.y, p.radius, p.angle - 0.7, p.angle + 0.7);
        ctx.stroke();
      }
      ctx.restore();
    });

    // Render Lightning Arcs
    this.lightningArcs.forEach(arc => {
      ctx.save();
      ctx.globalAlpha = arc.life / arc.maxLife;
      ctx.strokeStyle = arc.color;
      ctx.lineWidth = 3;
      ctx.shadowColor = arc.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      arc.points.forEach((pt, idx) => {
        if (idx === 0) ctx.moveTo(pt.x - camera.x, pt.y - camera.y);
        else ctx.lineTo(pt.x - camera.x, pt.y - camera.y);
      });
      ctx.stroke();
      ctx.restore();
    });

    // Render Floating Text
    this.floatingTexts.forEach(ft => {
      const alpha = Math.max(0, ft.life / ft.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = ft.color;
      ctx.font = `${ft.fontWeight} ${ft.size}px 'Cinzel', sans-serif`;
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 4;
      ctx.fillText(ft.text, ft.x - camera.x, ft.y - camera.y);
      ctx.restore();
    });
  }
}

window.abyssParticles = new ParticleSystem();
