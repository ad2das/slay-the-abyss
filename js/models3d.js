/* ==========================================================================
   ABYSSAL SLAYER 3D: PS3-GRADE CONSOLE DARK FANTASY CHARACTER & BOSS MODELS
   Articulated Limbs, Flowing Cloaks, Engraved Damascus Weapons & Demonic Titans
   ========================================================================== */

const ModelFactory3D = {
  createHeroMesh(classId) {
    const root = new THREE.Group();
    const metalMat = new THREE.MeshStandardMaterial({
      map: TextureFactory.createMetalTexture('#1e293b'),
      roughness: 0.25,
      metalness: 0.85
    });
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xc5a059,
      roughness: 0.2,
      metalness: 0.95
    });

    if (classId === 'shadow_blade') {
      // 1. Torso & Armor Plates
      const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.26, 1.1, 8), metalMat);
      torso.position.y = 0.95;
      torso.castShadow = true;
      root.add(torso);

      // Gold Trim Belt
      const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.12, 8), goldMat);
      belt.position.y = 0.48;
      root.add(belt);

      // 2. Head & Armored Mask
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 12), metalMat);
      head.position.y = 1.68;
      root.add(head);

      const visor = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.08, 0.22), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
      visor.position.set(0, 1.7, 0.2);
      root.add(visor);

      // Horns on Mask
      const hornL = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.35, 4), goldMat);
      hornL.position.set(-0.2, 1.9, 0);
      hornL.rotation.z = Math.PI / 6;
      root.add(hornL);
      const hornR = hornL.clone();
      hornR.position.x = 0.2;
      hornR.rotation.z = -Math.PI / 6;
      root.add(hornR);

      // 3. Segmented Pauldrons (Shoulders)
      const pauldronGeo = new THREE.SphereGeometry(0.2, 8, 8, 0, Math.PI);
      const pauldronL = new THREE.Mesh(pauldronGeo, goldMat);
      pauldronL.position.set(-0.48, 1.45, 0);
      pauldronL.rotation.z = Math.PI / 4;
      root.add(pauldronL);
      const pauldronR = pauldronL.clone();
      pauldronR.position.x = 0.48;
      pauldronR.rotation.z = -Math.PI / 4;
      root.add(pauldronR);

      // 4. Flowing Cape (2-Bone Segment)
      const capeMat = new THREE.MeshStandardMaterial({ color: 0x0369a1, roughness: 0.7, side: THREE.DoubleSide });
      const cape1 = new THREE.Mesh(new THREE.PlaneGeometry(0.65, 0.6), capeMat);
      cape1.position.set(0, 1.25, -0.22);
      cape1.rotation.x = 0.2;
      root.add(cape1);

      const cape2 = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 0.7), capeMat);
      cape2.position.set(0, 0.65, -0.35);
      cape2.rotation.x = 0.35;
      root.add(cape2);
      root.userData.cape = cape2;

      // 5. Dual Damascus Runic Katanas
      const swordMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.95, roughness: 0.1 });
      const runeMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

      const swordL = new THREE.Group();
      const bladeL = new THREE.Mesh(new THREE.BoxGeometry(0.07, 1.1, 0.02), swordMat);
      bladeL.position.y = 0.55;
      const runeL = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.9, 0.03), runeMat);
      runeL.position.y = 0.55;
      const guardL = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.04, 8), goldMat);
      swordL.add(bladeL);
      swordL.add(runeL);
      swordL.add(guardL);
      swordL.position.set(-0.52, 0.85, 0.35);
      swordL.rotation.x = Math.PI / 3;
      root.add(swordL);

      const swordR = swordL.clone();
      swordR.position.x = 0.52;
      root.add(swordR);

      root.userData.weaponL = swordL;
      root.userData.weaponR = swordR;

    } else if (classId === 'pyromancer') {
      // Robe & Arcane Mantle
      const robeMat = new THREE.MeshStandardMaterial({
        map: TextureFactory.createMetalTexture('#431407'),
        roughness: 0.6
      });
      const robe = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.6, 10), robeMat);
      robe.position.y = 0.85;
      robe.castShadow = true;
      root.add(robe);

      // Wizard Brim & Crown
      const hatMat = new THREE.MeshStandardMaterial({ color: 0x7c2d12, roughness: 0.5 });
      const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.04, 12), goldMat);
      hatBrim.position.y = 1.68;
      root.add(hatBrim);

      const hatCone = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.9, 8), hatMat);
      hatCone.position.set(0, 2.1, -0.1);
      hatCone.rotation.x = -0.25;
      root.add(hatCone);

      // Orbiting Quad Fire Runes
      const orbGroup = new THREE.Group();
      const orbMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });
      const core = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 12), orbMat);
      orbGroup.add(core);

      for (let i = 0; i < 4; i++) {
        const a = (Math.PI * 2 / 4) * i;
        const spark = new THREE.Mesh(new THREE.DodecahedronGeometry(0.08), new THREE.MeshBasicMaterial({ color: 0xfbbf24 }));
        spark.position.set(Math.cos(a) * 0.45, 0, Math.sin(a) * 0.45);
        orbGroup.add(spark);
      }
      orbGroup.position.set(0.6, 1.3, 0.4);
      root.add(orbGroup);
      root.userData.orb = orbGroup;

    } else if (classId === 'berserker') {
      // Giant Blood Knight Armor
      const armorMat = new THREE.MeshStandardMaterial({
        map: TextureFactory.createMetalTexture('#334155'),
        metalness: 0.9,
        roughness: 0.2
      });
      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.0, 0.55), armorMat);
      torso.position.y = 1.05;
      torso.castShadow = true;
      root.add(torso);

      // Horned Crusader Helm
      const helm = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.5, 0.48), armorMat);
      helm.position.y = 1.75;
      root.add(helm);

      const slit = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.06, 0.1), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
      slit.position.set(0, 1.78, 0.24);
      root.add(slit);

      // Giant Two-Handed Dragon Slayer Greatsword
      const bladeMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.2 });
      const edgeMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });

      const swordGroup = new THREE.Group();
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.28, 1.8, 0.06), bladeMat);
      blade.position.y = 0.9;
      const bloodRune = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.6, 0.08), edgeMat);
      bloodRune.position.y = 0.9;
      const guard = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.12, 0.15), goldMat);
      guard.position.y = 0.06;

      swordGroup.add(blade);
      swordGroup.add(bloodRune);
      swordGroup.add(guard);
      swordGroup.position.set(0.55, 0.9, 0.35);
      swordGroup.rotation.x = Math.PI / 4;
      root.add(swordGroup);
      root.userData.weapon = swordGroup;
    }

    return root;
  },

  createEnemyMesh(type) {
    const root = new THREE.Group();

    if (type === 'void_skulker') {
      const skinMat = new THREE.MeshStandardMaterial({
        map: TextureFactory.createMetalTexture('#3b0764'),
        roughness: 0.3,
        metalness: 0.7
      });
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0xc084fc });

      const body = new THREE.Mesh(new THREE.SphereGeometry(0.48, 10, 10), skinMat);
      body.position.y = 0.55;
      body.scale.set(1.2, 0.8, 1.6);
      body.castShadow = true;
      root.add(body);

      // 6 Articulated Spider Legs
      for (let i = 0; i < 6; i++) {
        const side = i % 2 === 0 ? 1 : -1;
        const row = Math.floor(i / 2) - 1;
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.02, 0.9, 4), skinMat);
        leg.position.set(side * 0.55, 0.45, row * 0.4);
        leg.rotation.z = side * (Math.PI / 3);
        leg.rotation.x = row * 0.2;
        root.add(leg);
      }

      // Glowing Eyes Cluster
      for (let j = 0; j < 4; j++) {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), eyeMat);
        eye.position.set((j - 1.5) * 0.1, 0.65, 0.75);
        root.add(eye);
      }

    } else if (type === 'skeleton_archer') {
      const boneMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.6 });
      const skull = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), boneMat);
      skull.position.y = 1.35;
      skull.castShadow = true;
      root.add(skull);

      const eye = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.06, 0.08), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
      eye.position.set(0, 1.38, 0.22);
      root.add(eye);

      // Rib Cage
      const rib = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.16, 0.8, 8), boneMat);
      rib.position.y = 0.8;
      root.add(rib);

      // Ancient Arcane Bow
      const bowMat = new THREE.MeshStandardMaterial({ color: 0x78350f, metalness: 0.8 });
      const bow = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.04, 6, 12, Math.PI), bowMat);
      bow.position.set(0.4, 0.9, 0.35);
      bow.rotation.y = Math.PI / 2;
      root.add(bow);

    } else if (type === 'minotaur_elite') {
      const fleshMat = new THREE.MeshStandardMaterial({
        map: TextureFactory.createMetalTexture('#450a0a'),
        roughness: 0.4,
        metalness: 0.5
      });
      const goldMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9, roughness: 0.2 });

      const torso = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.6, 0.9), fleshMat);
      torso.position.y = 1.5;
      torso.castShadow = true;
      root.add(torso);

      const head = new THREE.Mesh(new THREE.SphereGeometry(0.55, 10, 10), fleshMat);
      head.position.set(0, 2.4, 0.3);
      root.add(head);

      // Colossal Horns
      const hornL = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.9, 8), goldMat);
      hornL.position.set(-0.7, 2.8, 0.2);
      hornL.rotation.z = Math.PI / 3;
      root.add(hornL);
      const hornR = hornL.clone();
      hornR.position.x = 0.7;
      hornR.rotation.z = -Math.PI / 3;
      root.add(hornR);

      // Titanic Spiked War Maul
      const maulGroup = new THREE.Group();
      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.4, 6), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
      handle.position.y = 1.2;
      const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 1.0), goldMat);
      headMesh.position.y = 2.0;
      maulGroup.add(handle);
      maulGroup.add(headMesh);
      maulGroup.position.set(0.9, 0.4, 0.5);
      root.add(maulGroup);
    }

    return root;
  },

  createBossMesh() {
    const root = new THREE.Group();

    // 1. Colossal Demon Armor Body
    const voidMat = new THREE.MeshStandardMaterial({
      map: TextureFactory.createMetalTexture('#09090b'),
      metalness: 0.95,
      roughness: 0.15
    });
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xe11d48 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9 });

    const core = new THREE.Mesh(new THREE.OctahedronGeometry(1.2, 2), voidMat);
    core.position.y = 2.6;
    core.castShadow = true;
    root.add(core);

    const eyeRune = new THREE.Mesh(new THREE.DodecahedronGeometry(0.45), coreMat);
    eyeRune.position.set(0, 2.6, 0.95);
    root.add(eyeRune);

    // 2. Six Massive Flapping Shadow Wings
    const wingsGroup = new THREE.Group();
    const wingMat = new THREE.MeshStandardMaterial({ color: 0x881337, roughness: 0.3, metalness: 0.8, side: THREE.DoubleSide });

    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 / 6) * i;
      const wing = new THREE.Mesh(new THREE.ConeGeometry(0.4, 2.4, 4), wingMat);
      wing.position.set(Math.cos(angle) * 2.2, 2.6 + Math.sin(angle) * 1.5, -0.4);
      wing.rotation.z = angle + Math.PI / 2;
      wingsGroup.add(wing);
    }
    root.add(wingsGroup);
    root.userData.wings = wingsGroup;

    // 3. Orbiting Ring of 6 Ancient Runic Greatswords
    const swordRing = new THREE.Group();
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI * 2 / 6) * i;
      const sw = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.6, 0.04), goldMat);
      sw.position.set(Math.cos(a) * 3.2, 2.4, Math.sin(a) * 3.2);
      sw.rotation.x = Math.PI / 2;
      sw.rotation.z = -a;
      swordRing.add(sw);
    }
    root.add(swordRing);
    root.userData.swordRing = swordRing;

    return root;
  },

  createPillarMesh() {
    const root = new THREE.Group();
    const stoneMat = new THREE.MeshStandardMaterial({
      map: TextureFactory.createGothicFloorTexture(),
      roughness: 0.7,
      metalness: 0.3
    });
    const goldTrim = new THREE.MeshStandardMaterial({ color: 0xc5a059, metalness: 0.8 });

    const base = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 1.6), stoneMat);
    base.position.y = 0.25;
    root.add(base);

    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, 4.5, 12), stoneMat);
    shaft.position.y = 2.5;
    shaft.castShadow = true;
    root.add(shaft);

    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.68, 0.08, 6, 12), goldTrim);
    ring.position.y = 3.6;
    ring.rotation.x = Math.PI / 2;
    root.add(ring);

    const cap = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.5, 1.4), stoneMat);
    cap.position.y = 4.8;
    root.add(cap);

    return root;
  },

  createTorchBrazier() {
    const root = new THREE.Group();
    const metal = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.2 });
    const gold = new THREE.MeshStandardMaterial({ color: 0xc5a059, metalness: 0.9 });

    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.45, 1.6, 8), metal);
    stand.position.y = 0.8;
    root.add(stand);

    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.2, 0.4, 8), gold);
    bowl.position.y = 1.7;
    root.add(bowl);

    const fireMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });
    const fire = new THREE.Mesh(new THREE.DodecahedronGeometry(0.3), fireMat);
    fire.position.y = 1.95;
    root.add(fire);

    const light = new THREE.PointLight(0xf97316, 2.5, 16);
    light.position.set(0, 2.1, 0);
    root.add(light);

    root.userData.fire = fire;
    root.userData.light = light;
    return root;
  }
};
