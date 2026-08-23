/* ==========================================================================
   HARVEST MOON: MINERAL MEADOW - COMPLETE PIXEL ART & ANIMATION ENGINE
   ========================================================================== */

class SpriteRenderer {
  static drawPlayer(ctx, x, y, dir, isMoving, walkFrame, heldItem, isRidingHorse) {
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));

    const bob = isMoving ? Math.sin(walkFrame * 8) * 2 : 0;
    const yOffset = isRidingHorse ? -12 : 0;

    // Ground Shadow
    if (!isRidingHorse) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.beginPath();
      ctx.ellipse(0, 14, 10, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 1. Legs
    if (!isRidingHorse) {
      const legOffset = isMoving ? Math.sin(walkFrame * 8) * 3 : 0;
      ctx.fillStyle = '#1e3a8a'; // Blue overalls pants
      ctx.fillRect(-6 + (dir === 'left' ? -legOffset : 0), 6, 4, 8);
      ctx.fillRect(2 + (dir === 'right' ? legOffset : 0), 6, 4, 8);

      // Brown Boots
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-6, 12, 4, 3);
      ctx.fillRect(2, 12, 4, 3);
    }

    // 2. Body / Overalls
    ctx.fillStyle = '#dc2626'; // Red shirt
    ctx.fillRect(-7, -2 + bob + yOffset, 14, 8);
    ctx.fillStyle = '#0284c7'; // Blue Overalls
    ctx.fillRect(-5, 0 + bob + yOffset, 10, 8);

    // 3. Head & Face
    ctx.fillStyle = '#fed7aa'; // Skin
    ctx.fillRect(-6, -12 + bob + yOffset, 12, 10);

    // Eyes
    ctx.fillStyle = '#1e293b';
    if (dir === 'down') {
      ctx.fillRect(-4, -8 + bob + yOffset, 2, 3);
      ctx.fillRect(2, -8 + bob + yOffset, 2, 3);
    } else if (dir === 'left') {
      ctx.fillRect(-5, -8 + bob + yOffset, 2, 3);
    } else if (dir === 'right') {
      ctx.fillRect(3, -8 + bob + yOffset, 2, 3);
    }

    // 4. Blue Farmer Cap
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(-7, -16 + bob + yOffset, 14, 5);
    if (dir === 'down' || dir === 'left' || dir === 'right') {
      ctx.fillStyle = '#0369a1';
      ctx.fillRect(-8, -12 + bob + yOffset, 16, 2);
    }

    // 5. Held Item Above Head (Iconic Harvest Moon mechanic)
    if (heldItem) {
      ctx.font = '18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(heldItem.icon, 0, -22 + bob + yOffset);
    }

    ctx.restore();
  }

  static drawCrop(ctx, x, y, crop) {
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));

    if (crop.stage === 0) {
      // Seed sprout
      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      ctx.arc(0, 4, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (crop.stage === 1) {
      // 2-Leaves stem
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(-2, 0, 4, 8);
      ctx.fillRect(-6, 2, 4, 3);
      ctx.fillRect(2, 2, 4, 3);
    } else if (crop.stage === 2) {
      // Flowering Bush
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(0, -4, 3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Mature Ripe Harvestable Crop!
      ctx.font = '22px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(crop.icon, 0, 0);

      // Gold shimmer sparkle
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(6, -8, 2, 2);
    }

    ctx.restore();
  }

  static drawAnimal(ctx, x, y, animal, time) {
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));

    const bob = Math.sin(time * 4 + x) * 2;

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(0, 10, 14, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Animal Body
    ctx.font = animal.type === 'horse' ? '28px sans-serif' : '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(animal.icon, 0, bob);

    // Heart Badge if loved
    if (animal.hearts > 0) {
      ctx.font = '11px sans-serif';
      ctx.fillText('❤️', 10, -12 + bob);
    }

    ctx.restore();
  }
}

window.SpriteRenderer = SpriteRenderer;
