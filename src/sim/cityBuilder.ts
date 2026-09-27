import * as THREE from 'three';
import { createSkyscraperGlassTexture, createHelipadTexture, createOceanTexture } from './textures';
import type { EnemyAsset, FriendlyBase } from '../types';

export interface CityBuildResult {
  cityGroup: THREE.Group;
  buildings: THREE.Mesh[];
  oceanMesh: THREE.Mesh;
  groundMesh: THREE.Mesh;
  enemyTargetGroup: THREE.Group;
  enemyAssets: EnemyAsset[];
  initialBases: FriendlyBase[];
  citadelMesh: THREE.Mesh;
  radarDishes: THREE.Mesh[];
}

export function buildSuperpowerBattlefield(scene: THREE.Scene): CityBuildResult {
  // 1. GROUND & WATER
  const groundGeo = new THREE.PlaneGeometry(420, 420);
  groundGeo.rotateX(-Math.PI / 2);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x111827,
    roughness: 0.85,
    metalness: 0.2,
  });
  const groundMesh = new THREE.Mesh(groundGeo, groundMat);
  groundMesh.receiveShadow = true;
  scene.add(groundMesh);

  // Coastal Ocean
  const oceanGeo = new THREE.PlaneGeometry(2200, 2200);
  oceanGeo.rotateX(-Math.PI / 2);
  const oceanMat = new THREE.MeshStandardMaterial({
    map: createOceanTexture(),
    color: 0x0284c7,
    roughness: 0.15,
    metalness: 0.7,
    transparent: true,
    opacity: 0.94,
  });
  const oceanMesh = new THREE.Mesh(oceanGeo, oceanMat);
  oceanMesh.position.set(0, -1.2, 0);
  oceanMesh.receiveShadow = true;
  scene.add(oceanMesh);

  // Mountain defensive perimeter (North & West) - Optimized with InstancedMesh (1 draw call)
  const mountainCount = 42;
  const mountainMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.95, flatShading: true });
  const mountainGeo = new THREE.ConeGeometry(1, 1, 6);
  const instancedMountains = new THREE.InstancedMesh(mountainGeo, mountainMat, mountainCount);
  instancedMountains.castShadow = true;
  instancedMountains.receiveShadow = true;

  const dummy = new THREE.Object3D();
  for (let i = 0; i < mountainCount; i++) {
    const angle = (i / mountainCount) * Math.PI * 1.5 - 0.45;
    const dist = 280 + Math.random() * 90;
    const height = 90 + Math.random() * 110;
    const radius = 60 + Math.random() * 45;
    dummy.position.set(Math.cos(angle) * dist, height / 2 - 10, Math.sin(angle) * dist);
    dummy.rotation.set(0, Math.random() * Math.PI, 0);
    dummy.scale.set(radius, height, radius);
    dummy.updateMatrix();
    instancedMountains.setMatrixAt(i, dummy.matrix);
  }
  instancedMountains.instanceMatrix.needsUpdate = true;
  scene.add(instancedMountains);

  // 2. 80+ HIGH-RISE SKYSCRAPERS OPTIMIZED WITH INSTANCED MESHES (3 draw calls for towers + 1 for helipads)
  const cityGroup = new THREE.Group();
  const buildings: THREE.Mesh[] = [];
  const glassCyan = createSkyscraperGlassTexture('#0b1329', '#00f0ff');
  const glassAmber = createSkyscraperGlassTexture('#1c1917', '#f59e0b');
  const glassEmerald = createSkyscraperGlassTexture('#06201b', '#10b981');
  const helipadTex = createHelipadTexture();

  const cyanMat = new THREE.MeshStandardMaterial({ map: glassCyan, roughness: 0.25, metalness: 0.85 });
  const amberMat = new THREE.MeshStandardMaterial({ map: glassAmber, roughness: 0.25, metalness: 0.85 });
  const emeraldMat = new THREE.MeshStandardMaterial({ map: glassEmerald, roughness: 0.25, metalness: 0.85 });
  const helipadMat = new THREE.MeshStandardMaterial({ map: helipadTex, roughness: 0.5 });
  const antMat = new THREE.MeshBasicMaterial({ color: 0xff3366 });
  const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff0044 });

  interface BuildingDef {
    x: number;
    z: number;
    w: number;
    h: number;
    d: number;
    type: 0 | 1 | 2; // cyan, amber, emerald
    hasHelipad: boolean;
  }

  const buildingDefs: BuildingDef[] = [];
  for (let x = -140; x <= 140; x += 28) {
    for (let z = -140; z <= 140; z += 28) {
      if (Math.abs(x) < 45 && Math.abs(z) < 45) continue; // Keep central sector open for Citadel HQ

      const h = 40 + Math.random() * 95;
      const w = 12 + Math.random() * 8;
      const d = 12 + Math.random() * 8;
      const bx = x + (Math.random() - 0.5) * 6;
      const bz = z + (Math.random() - 0.5) * 6;
      const pick = Math.random();
      const type = pick > 0.65 ? 0 : pick > 0.3 ? 1 : 2;
      const hasHelipad = Math.random() > 0.5;

      buildingDefs.push({ x: bx, z: bz, w, h, d, type, hasHelipad });
    }
  }

  const cyanList = buildingDefs.filter((b) => b.type === 0);
  const amberList = buildingDefs.filter((b) => b.type === 1);
  const emeraldList = buildingDefs.filter((b) => b.type === 2);
  const helipadList = buildingDefs.filter((b) => b.hasHelipad);
  const antList = buildingDefs.filter((b) => !b.hasHelipad);

  const unitBox = new THREE.BoxGeometry(1, 1, 1);
  const unitPlane = new THREE.PlaneGeometry(1, 1);
  unitPlane.rotateX(-Math.PI / 2);
  const unitAnt = new THREE.CylinderGeometry(0.2, 0.45, 18, 6);
  const unitBeacon = new THREE.SphereGeometry(0.8, 6, 6);

  // Instanced Cyan Towers
  if (cyanList.length > 0) {
    const instCyan = new THREE.InstancedMesh(unitBox, cyanMat, cyanList.length);
    instCyan.castShadow = true;
    instCyan.receiveShadow = true;
    cyanList.forEach((b, idx) => {
      dummy.position.set(b.x, b.h / 2, b.z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(b.w, b.h, b.d);
      dummy.updateMatrix();
      instCyan.setMatrixAt(idx, dummy.matrix);
    });
    instCyan.instanceMatrix.needsUpdate = true;
    cityGroup.add(instCyan);
  }

  // Instanced Amber Towers
  if (amberList.length > 0) {
    const instAmber = new THREE.InstancedMesh(unitBox, amberMat, amberList.length);
    instAmber.castShadow = true;
    instAmber.receiveShadow = true;
    amberList.forEach((b, idx) => {
      dummy.position.set(b.x, b.h / 2, b.z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(b.w, b.h, b.d);
      dummy.updateMatrix();
      instAmber.setMatrixAt(idx, dummy.matrix);
    });
    instAmber.instanceMatrix.needsUpdate = true;
    cityGroup.add(instAmber);
  }

  // Instanced Emerald Towers
  if (emeraldList.length > 0) {
    const instEmerald = new THREE.InstancedMesh(unitBox, emeraldMat, emeraldList.length);
    instEmerald.castShadow = true;
    instEmerald.receiveShadow = true;
    emeraldList.forEach((b, idx) => {
      dummy.position.set(b.x, b.h / 2, b.z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(b.w, b.h, b.d);
      dummy.updateMatrix();
      instEmerald.setMatrixAt(idx, dummy.matrix);
    });
    instEmerald.instanceMatrix.needsUpdate = true;
    cityGroup.add(instEmerald);
  }

  // Instanced Rooftop Helipads
  if (helipadList.length > 0) {
    const instHelipads = new THREE.InstancedMesh(unitPlane, helipadMat, helipadList.length);
    helipadList.forEach((b, idx) => {
      dummy.position.set(b.x, b.h + 0.1, b.z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(b.w * 0.85, 1, b.d * 0.85);
      dummy.updateMatrix();
      instHelipads.setMatrixAt(idx, dummy.matrix);
    });
    instHelipads.instanceMatrix.needsUpdate = true;
    cityGroup.add(instHelipads);
  }

  // Instanced Rooftop Antennas
  if (antList.length > 0) {
    const instAntennas = new THREE.InstancedMesh(unitAnt, antMat, antList.length);
    const instBeacons = new THREE.InstancedMesh(unitBeacon, beaconMat, antList.length);
    antList.forEach((b, idx) => {
      dummy.position.set(b.x, b.h + 9, b.z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      instAntennas.setMatrixAt(idx, dummy.matrix);

      dummy.position.set(b.x, b.h + 18, b.z);
      dummy.updateMatrix();
      instBeacons.setMatrixAt(idx, dummy.matrix);
    });
    instAntennas.instanceMatrix.needsUpdate = true;
    instBeacons.instanceMatrix.needsUpdate = true;
    cityGroup.add(instAntennas);
    cityGroup.add(instBeacons);
  }

  scene.add(cityGroup);

  // 3. CENTRAL COMMAND CITADEL HQ
  const citadelGroup = new THREE.Group();
  const basePlinth = new THREE.Mesh(
    new THREE.CylinderGeometry(28, 34, 6, 8),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7, metalness: 0.6 })
  );
  basePlinth.position.y = 3;
  citadelGroup.add(basePlinth);

  const citadelDome = new THREE.Mesh(
    new THREE.SphereGeometry(22, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.5),
    new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: 0.85,
      emissive: 0x004466,
      emissiveIntensity: 0.6,
    })
  );
  citadelDome.position.y = 5.5;
  citadelGroup.add(citadelDome);

  // Subterranean exhaust vents
  for (let i = 0; i < 4; i++) {
    const vent = new THREE.Mesh(
      new THREE.BoxGeometry(4, 3, 7),
      new THREE.MeshStandardMaterial({ color: 0x1e293b })
    );
    const angle = (i * Math.PI) / 2;
    vent.position.set(Math.cos(angle) * 32, 1.5, Math.sin(angle) * 32);
    vent.rotation.y = -angle;
    citadelGroup.add(vent);
  }

  scene.add(citadelGroup);

  // 4. EIGHT ENEMY STRATEGIC ASSETS (FACTION BETA - EURASIAN DRAGON COALITION)
  const enemyAssets: EnemyAsset[] = [
    {
      id: 0,
      name: 'TITAN HYPERSONIC GLIDE LAUNCH COMPLEX',
      code: 'TARGET-01 [HGV-STAGING]',
      category: 'HYPERSONIC SILO COMPLEX',
      type: 'silo',
      coords: "51°18'N, 34°22'E",
      health: 100,
      threatLevel: 'CRITICAL',
      readiness: 'ARMED DF-17 HGV',
      radarSpecs: 'Phased Array 640km S-Band',
      interceptorStock: 16,
      payloadType: 'Hypersonic Mach 8.5 Munition',
      briefing: 'Primary subterranean launch facility with hypersonic glide booster stages. Heavy anti-ballistic envelope.',
      height: 48,
      color: '#ff3366',
      destroyed: false,
      absPos: new THREE.Vector3(750, 0, -750),
      topPos: new THREE.Vector3(750, 48, -750),
      interceptionProb: 88,
      stealthLevel: 'STANDARD',
      radarCoverage: 640,
    },
    {
      id: 1,
      name: 'YALONG BAY NUCLEAR SUBMARINE PEN',
      code: 'TARGET-02 [SSBN-BASTION]',
      category: 'NAVAL SSBN BASTION',
      type: 'naval',
      coords: "18°13'N, 109°38'E",
      health: 100,
      threatLevel: 'SEVERE',
      readiness: 'PATROLLING SHELF',
      radarSpecs: 'Sonar Hydrophone & VHF Radar',
      interceptorStock: 12,
      payloadType: 'Sub-Launched Ballistic JL-3',
      briefing: 'Hardened submarine cavern shelter holding strategic ballistic missile cruisers beneath granite cliffs.',
      height: 52,
      color: '#06d6a0',
      destroyed: false,
      absPos: new THREE.Vector3(720, 0, 780),
      topPos: new THREE.Vector3(720, 52, 780),
      interceptionProb: 75,
      stealthLevel: 'HIGH',
      radarCoverage: 420,
    },
    {
      id: 2,
      name: 'ORYX PHASED-ARRAY EARLY WARNING RADAR',
      code: 'TARGET-03 [RADAR-GRID]',
      category: 'HEAVY RADAR ARRAY',
      type: 'radar',
      coords: "49°55'N, 31°40'E",
      health: 100,
      threatLevel: 'HIGH',
      readiness: 'ACTIVE 360° SWEEP',
      radarSpecs: 'UHF Over-The-Horizon 2400km',
      interceptorStock: 8,
      payloadType: 'Radar Sensor / Uplink Spire',
      briefing: 'Heavy early warning radar network guiding incoming hypersonic & cruise strikes. Blind with EW Jamming!',
      height: 65,
      color: '#00f0ff',
      destroyed: false,
      absPos: new THREE.Vector3(715, 0, -780),
      topPos: new THREE.Vector3(715, 65, -780),
      interceptionProb: 92,
      stealthLevel: 'STANDARD',
      radarCoverage: 2400,
    },
    {
      id: 3,
      name: 'DRAGON-41 HEAVY ICBM DEPOT',
      code: 'TARGET-04 [MIRV-DEPOT]',
      category: 'HYPERSONIC SILO COMPLEX',
      type: 'silo',
      coords: "53°40'N, 38°15'E",
      health: 100,
      threatLevel: 'CRITICAL',
      readiness: 'FUELING 10-WARHEAD MIRV',
      radarSpecs: 'Silo Telemetry & Hardened Link',
      interceptorStock: 20,
      payloadType: '10x Multiple Re-entry Warheads',
      briefing: 'Fortified subterranean silo complex preparing heavy multi-warhead saturation attack.',
      height: 38,
      color: '#f59e0b',
      destroyed: false,
      absPos: new THREE.Vector3(780, 0, -720),
      topPos: new THREE.Vector3(780, 38, -720),
      interceptionProb: 90,
      stealthLevel: 'STANDARD',
      radarCoverage: 580,
    },
    {
      id: 4,
      name: 'XIAN STEALTH STRATEGIC BOMBER AIRBASE',
      code: 'TARGET-05 [H-20 AIRBASE]',
      category: 'STEALTH BOMBER HANGAR',
      type: 'stealth_hangar',
      coords: "34°38'N, 109°14'E",
      health: 100,
      threatLevel: 'HIGH',
      readiness: 'SCRAMBLE ARMED',
      radarSpecs: 'X-Band Target Acquisition 480km',
      interceptorStock: 14,
      payloadType: 'Air-Launched Stealth Cruise Missiles',
      briefing: 'Tier-1 Superpower airbase housing H-20 stealth delta-wing bombers capable of evading radar domes.',
      height: 44,
      color: '#e11d48',
      destroyed: false,
      absPos: new THREE.Vector3(-750, 0, -750),
      topPos: new THREE.Vector3(-750, 44, -750),
      interceptionProb: 84,
      stealthLevel: 'EXTREME',
      radarCoverage: 480,
    },
    {
      id: 5,
      name: 'S-500 BASTION ANTI-BALLISTIC BATTERY ALPHA',
      code: 'TARGET-06 [S-500 ALPHA]',
      category: 'ANTI-BALLISTIC SAM BATTERY',
      type: 'sam',
      coords: "48°22'N, 33°10'E",
      health: 100,
      threatLevel: 'SEVERE',
      readiness: 'TRACKING SECTOR 1',
      radarSpecs: '91N6A Multi-Target Track',
      interceptorStock: 24,
      payloadType: '77N6-N Kinetic Interceptors',
      briefing: 'Hypersonic surface-to-air defense battery shielding command bunkers. Fires dynamic 3D interceptors.',
      height: 42,
      color: '#ec4899',
      destroyed: false,
      absPos: new THREE.Vector3(-710, 0, -780),
      topPos: new THREE.Vector3(-710, 42, -780),
      interceptionProb: 95,
      stealthLevel: 'STANDARD',
      radarCoverage: 800,
    },
    {
      id: 6,
      name: 'CHENGDU TIER-1 SUPERPOWER AIRBASE',
      code: 'TARGET-07 [J-20 FLEET]',
      category: 'TIER-1 SUPERPOWER AIRBASE',
      type: 'airbase',
      coords: "30°34'N, 104°05'E",
      health: 100,
      threatLevel: 'HIGH',
      readiness: 'COMBAT AIR PATROL',
      radarSpecs: 'KLJ-7A AESA Active Radar',
      interceptorStock: 18,
      payloadType: 'Hypersonic Anti-Radiation Munitions',
      briefing: 'Superpower fighter-interceptor staging base with reinforced subterranean taxiways.',
      height: 42,
      color: '#a855f7',
      destroyed: false,
      absPos: new THREE.Vector3(-780, 0, -710),
      topPos: new THREE.Vector3(-780, 42, -710),
      interceptionProb: 86,
      stealthLevel: 'HIGH',
      radarCoverage: 520,
    },
    {
      id: 7,
      name: 'RED STAR DEEP COMMAND BUNKER',
      code: 'TARGET-08 [COMMAND-HQ]',
      category: 'COMMAND BUNKERS',
      type: 'bunker',
      coords: "40°12'N, 116°18'E",
      health: 100,
      threatLevel: 'CRITICAL',
      readiness: 'WAR-CABINET DIRECTIVE',
      radarSpecs: 'ELF Deep-Earth Satellite Transceiver',
      interceptorStock: 30,
      payloadType: 'Supreme Command & Control Uplink',
      briefing: 'Deep granite cavern command war room directing hostile strategic offensive.',
      height: 55,
      color: '#dc2626',
      destroyed: false,
      absPos: new THREE.Vector3(750, 0, 750),
      topPos: new THREE.Vector3(750, 55, 750),
      interceptionProb: 96,
      stealthLevel: 'STANDARD',
      radarCoverage: 1200,
    },
  ];

  const enemyTargetGroup = new THREE.Group();
  enemyAssets.forEach((asset) => {
    const assetGroup = new THREE.Group();
    assetGroup.position.set(asset.absPos.x, 0, asset.absPos.z);

    const m = new THREE.Mesh(
      new THREE.BoxGeometry(22, asset.height, 22),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(asset.color),
        emissive: new THREE.Color(asset.color),
        emissiveIntensity: 0.35,
        roughness: 0.3,
        metalness: 0.8,
      })
    );
    m.position.set(0, asset.height / 2, 0);
    m.castShadow = true;
    m.receiveShadow = true;
    m.userData = asset;
    asset.mesh = m;
    assetGroup.add(m);

    // Decorative military architecture per category
    if (asset.category === 'HEAVY RADAR ARRAY') {
      const dishMast = new THREE.Mesh(
        new THREE.CylinderGeometry(1.2, 1.8, 18, 8),
        new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8 })
      );
      dishMast.position.set(0, asset.height + 9, 0);
      assetGroup.add(dishMast);

      const dish = new THREE.Mesh(
        new THREE.SphereGeometry(9, 12, 6, 0, Math.PI * 2, 0, Math.PI * 0.45),
        new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 0.4, side: THREE.DoubleSide })
      );
      dish.position.set(0, asset.height + 18, 0);
      dish.rotation.x = Math.PI / 4;
      assetGroup.add(dish);
      radarDishes.push(dish);
    } else if (asset.category === 'STEALTH BOMBER HANGAR') {
      // Delta-wing stealth bomber silhouette
      const wingGeo = new THREE.BufferGeometry();
      const vertices = new Float32Array([
        0, 1.5, -9,   -16, 0.5, 7,    16, 0.5, 7,
        0, 1.5, -9,   -5, 0.5, 9,     5, 0.5, 9,
      ]);
      wingGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
      wingGeo.computeVertexNormals();
      const wingMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.9, metalness: 0.2 });
      const bomber = new THREE.Mesh(wingGeo, wingMat);
      bomber.position.set(0, asset.height + 2, 0);
      assetGroup.add(bomber);
    } else if (asset.category === 'ANTI-BALLISTIC SAM BATTERY') {
      // Quadruple missile canisters
      for (let ci = 0; ci < 4; ci++) {
        const can = new THREE.Mesh(
          new THREE.CylinderGeometry(0.9, 0.9, 14, 8),
          new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7 })
        );
        const ca = (ci / 4) * Math.PI * 2;
        can.position.set(Math.cos(ca) * 6, asset.height + 6, Math.sin(ca) * 6);
        can.rotation.x = Math.PI / 5;
        can.rotation.y = ca;
        assetGroup.add(can);
      }
    }

    enemyTargetGroup.add(assetGroup);
  });
  scene.add(enemyTargetGroup);

  // 5. FRIENDLY INITIAL BASES (SILOS, SAMs, LASER CIWS, RADAR)
  const radarDishes: THREE.Mesh[] = [];
  const initialBases: FriendlyBase[] = [
    { id: 0, type: 'silo', name: 'ICBM SILO ALPHA-1', pos: new THREE.Vector3(-22, 0, -22), ready: true, builtByUser: false },
    { id: 1, type: 'silo', name: 'ICBM SILO ALPHA-2', pos: new THREE.Vector3(22, 0, -22), ready: true, builtByUser: false },
    { id: 2, type: 'silo', name: 'ICBM SILO ALPHA-3', pos: new THREE.Vector3(-22, 0, 22), ready: true, builtByUser: false },
    { id: 3, type: 'silo', name: 'ICBM SILO ALPHA-4', pos: new THREE.Vector3(22, 0, 22), ready: true, builtByUser: false },
    { id: 4, type: 'sam', name: 'IRON DOME SAM-1', pos: new THREE.Vector3(0, 0, -56), ready: true, builtByUser: false },
    { id: 5, type: 'sam', name: 'IRON DOME SAM-2', pos: new THREE.Vector3(-56, 0, 40), ready: true, builtByUser: false },
    { id: 6, type: 'sam', name: 'IRON DOME SAM-3', pos: new THREE.Vector3(56, 0, 40), ready: true, builtByUser: false },
    { id: 7, type: 'laser', name: 'AEGIS LASER CIWS-1', pos: new THREE.Vector3(-35, 0, -50), ready: true, builtByUser: false },
    { id: 8, type: 'laser', name: 'AEGIS LASER CIWS-2', pos: new THREE.Vector3(35, 0, -50), ready: true, builtByUser: false },
    { id: 9, type: 'radar', name: 'PHASED-ARRAY RADAR DOME', pos: new THREE.Vector3(0, 0, 60), ready: true, builtByUser: false },
  ];

  return {
    cityGroup,
    buildings,
    oceanMesh,
    groundMesh,
    enemyTargetGroup,
    enemyAssets,
    initialBases,
    citadelMesh: basePlinth,
    radarDishes,
  };
}
