/* ==========================================================================
   ABYSSAL SLAYER 3D: PROCEDURAL 3D MESH GENERATOR (PS3 DARK FANTASY)
   Heroes, Weapons, Enemies, Boss Archon & Dungeon Props
   ========================================================================== */

const ModelFactory3D = {
  createHeroMesh(classId) {
    const group = new THREE.Group();

    if (classId === 'shadow_blade') {
      // Body & Armor
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3, metalness: 0.7 });
      const bodyGeo = new THREE.CylinderGeometry(0.35, 0.25, 1.2, 8);
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = 0.9;
      body.castShadow = true;
      group.add(body);

      // Head & Glowing Visor
      const headMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2, metalness: 0.8 });
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 12), headMat);
      head.position.y = 1.7;
      group.add(head);

      const visorMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const visor = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.08, 0.2), visorMat);
      visor.position.set(0, 1.72, 0.22);
      group.add(visor);

      // Cloak
      const cloakMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.6, side: THREE.DoubleSide });
      const cloak = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.1, 4, 1, true), cloakMat);
      cloak.position.set(0, 0.9, -0.15);
      cloak.rotation.x = 0.2;
      group.add(cloak);

      // Dual Katana Weapons
      const swordMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.1 });
      const runeMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

      const swordL = new THREE.Group();
      const bladeL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.9, 0.02), swordMat);
      bladeL.position.y = 0.45;
      const runeL = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.7, 0.03), runeMat);
      runeL.position.y = 0.45;
      swordL.add(bladeL);
      swordL.add(runeL);
      swordL.position.set(-0.45, 0.8, 0.3);
      swordL.rotation.x = Math.PI / 3;
      group.add(swordL);

      const swordR = swordL.clone();
      swordR.position.x = 0.45;
      group.add(swordR);

      group.userData.weaponL = swordL;
      group.userData.weaponR = swordR;

    } else if (classId === 'pyromancer') {
      // Robe
      const robeMat = new THREE.MeshStandardMaterial({ color: 0x7c2d12, roughness: 0.5, metalness: 0.3 });
      const robe = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.5, 8), robeMat);
      robe.position.y = 0.85;
      robe.castShadow = true;
      group.add(robe);

      // Wizard Hat
      const hatMat = new THREE.MeshStandardMaterial({ color: 0x431407, roughness: 0.6 });
      const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.04, 12), hatMat);
      hatBrim.position.y = 1.65;
      group.add(hatBrim);
      const hatCone = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.8, 8), hatMat);
      hatCone.position.set(0, 2.05, -0.08);
      hatCone.rotation.x = -0.2;
      group.add(hatCone);

      // Floating Arcane Fire Orb
      const orbMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });
      const orb = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 12), orbMat);
      orb.position.set(0.5, 1.2, 0.4);
      group.add(orb);
      group.userData.orb = orb;

    } else if (classId === 'berserker') {
      // Spiked Plate Armor
      const armorMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.2, metalness: 0.85 });
      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.9, 0.5), armorMat);
      torso.position.y = 1.0;
      torso.castShadow = true;
      group.add(torso);

      // Spiked Pauldrons
      const spikeGeo = new THREE.ConeGeometry(0.12, 0.4, 4);
      const spikeMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, metalness: 0.9 });
      const spikeL = new THREE.Mesh(spikeGeo, spikeMat);
      spikeL.position.set(-0.55, 1.45, 0);
      spikeL.rotation.z = Math.PI / 4;
      group.add(spikeL);
      const spikeR = new THREE.Mesh(spikeGeo, spikeMat);
      spikeR.position.set(0.55, 1.45, 0);
      spikeR.rotation.z = -Math.PI / 4;
      group.add(spikeR);

      // Giant Blood Greatsword
      const swordMat = new THREE.MeshStandardMaterial({ color: 0x1e1b4b, metalness: 0.8, roughness: 0.3 });
      const edgeMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
      const swordGroup = new THREE.Group();
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.5, 0.05), swordMat);
      blade.position.y = 0.75;
      const edge = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.4, 0.07), edgeMat);
      edge.position.y = 0.75;
      swordGroup.add(blade);
      swordGroup.add(edge);
      swordGroup.position.set(0.5, 0.8, 0.3);
      swordGroup.rotation.x = Math.PI / 4;
      group.add(swordGroup);
      group.userData.weapon = swordGroup;
    }

    return group;
  },

  createEnemyMesh(type) {
    const group = new THREE.Group();

    if (type === 'void_skulker') {
      const mat = new THREE.MeshStandardMaterial({ color: 0x581c87, roughness: 0.3, metalness: 0.6 });
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0xc084fc });

      const body = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 8), mat);
      body.position.y = 0.45;
      body.scale.set(1.1, 0.7, 1.4);
      body.castShadow = true;
      group.add(body);

      // Fangs
      const fang1 = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.3, 4), eyeMat);
      fang1.position.set(-0.15, 0.35, 0.6);
      fang1.rotation.x = Math.PI / 3;
      group.add(fang1);
      const fang2 = fang1.clone();
      fang2.position.x = 0.15;
      group.add(fang2);

    } else if (type === 'skeleton_archer') {
      const boneMat = new THREE.MeshStandardMaterial({ color: 0xd6d3d1, roughness: 0.5 });
      const skull = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), boneMat);
      skull.position.y = 1.3;
      group.add(skull);

      const eyeGlow = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.05, 0.05), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
      eyeGlow.position.set(0, 1.32, 0.22);
      group.add(eyeGlow);

      const rib = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.12, 0.7, 6), boneMat);
      rib.position.y = 0.75;
      group.add(rib);

      // Bow
      const bow = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.03, 4, 8, Math.PI), new THREE.MeshStandardMaterial({ color: 0x78350f }));
      bow.position.set(0.35, 0.8, 0.3);
      bow.rotation.y = Math.PI / 2;
      group.add(bow);

    } else if (type === 'minotaur_elite') {
      const mat = new THREE.MeshStandardMaterial({ color: 0x450a0a, roughness: 0.4, metalness: 0.5 });
      const hornMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.2, metalness: 0.8 });

      const torso = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.4, 0.8), mat);
      torso.position.y = 1.4;
      torso.castShadow = true;
      group.add(torso);

      const head = new THREE.Mesh(new THREE.SphereGeometry(0.45, 8, 8), mat);
      head.position.set(0, 2.2, 0.2);
      group.add(head);

      // Giant Horns
      const hornL = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.7, 6), hornMat);
      hornL.position.set(-0.55, 2.5, 0.1);
      hornL.rotation.z = Math.PI / 3;
      group.add(hornL);
      const hornR = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.7, 6), hornMat);
      hornR.position.set(0.55, 2.5, 0.1);
      hornR.rotation.z = -Math.PI / 3;
      group.add(hornR);

      // War Hammer
      const hammer = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.8), new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9 }));
      hammer.position.set(0.8, 1.2, 0.4);
      group.add(hammer);
    }

    return group;
  },

  createBossMesh() {
    const group = new THREE.Group();

    // Central Void Demon Core
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.1, metalness: 0.95 });
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xe11d48 });

    const core = new THREE.Mesh(new THREE.SphereGeometry(0.9, 16, 16), bodyMat);
    core.position.y = 2.2;
    core.castShadow = true;
    group.add(core);

    const eyeRune = new THREE.Mesh(new THREE.OctahedronGeometry(0.35, 0), coreMat);
    eyeRune.position.set(0, 2.2, 0.8);
    group.add(eyeRune);

    // 6 Floating Void Crystal Wings
    const wingMat = new THREE.MeshStandardMaterial({ color: 0x881337, roughness: 0.2, metalness: 0.8 });
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 / 6) * i;
      const wing = new THREE.Mesh(new THREE.ConeGeometry(0.25, 1.6, 4), wingMat);
      wing.position.set(Math.cos(angle) * 1.5, 2.2 + Math.sin(angle) * 1.2, -0.3);
      wing.rotation.z = angle + Math.PI / 2;
      group.add(wing);
    }

    // Floating Orbiting Runestones
    const stonesGroup = new THREE.Group();
    for (let i = 0; i < 3; i++) {
      const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.25), coreMat);
      stone.position.set(Math.cos(i * 2.1) * 2.0, 1.8, Math.sin(i * 2.1) * 2.0);
      stonesGroup.add(stone);
    }
    group.add(stonesGroup);
    group.userData.stones = stonesGroup;

    return group;
  },

  createPillarMesh() {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7, metalness: 0.2 });
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.4, 1.4), mat);
    base.position.y = 0.2;
    group.add(base);

    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.5, 4.0, 10), mat);
    col.position.y = 2.4;
    col.castShadow = true;
    group.add(col);

    const cap = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 1.2), mat);
    cap.position.y = 4.4;
    group.add(cap);
    return group;
  },

  createTorchBrazier() {
    const group = new THREE.Group();
    const standMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 });
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 1.5, 8), standMat);
    stand.position.y = 0.75;
    group.add(stand);

    const fireMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });
    const fire = new THREE.Mesh(new THREE.DodecahedronGeometry(0.25), fireMat);
    fire.position.y = 1.6;
    group.add(fire);

    const light = new THREE.PointLight(0xf97316, 2.0, 12);
    light.position.set(0, 1.8, 0);
    light.castShadow = false;
    group.add(light);

    group.userData.fire = fire;
    group.userData.light = light;
    return group;
  }
};
