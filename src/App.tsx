import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { generateStandaloneHTML } from './sim/exportHtml';
import { sound } from './sim/audio';
import { MobileTouchOrbitControls } from './sim/orbitControls';
import { buildSuperpowerBattlefield } from './sim/cityBuilder';
import { createSatelliteWarMapTexture } from './sim/textures';
import { neutralMediators, waveConfigs } from './sim/diplomacyData';
import {
  Volume2,
  VolumeX,
  Download,
  Shield,
  Crosshair,
  AlertTriangle,
  Globe,
  Rocket,
  Target,
  Radio,
  Building2,
  MapPin,
  Hammer,
  Play,
  X,
  CheckCircle2,
  Zap,
  RotateCcw,
  Handshake,
  Compass,
  Layers,
} from 'lucide-react';
import type {
  EnemyAsset,
  FriendlyBase,
  ActiveWarhead,
  ActiveSAM,
  ActiveLaserBeam,
  ActiveICBM,
  DebrisFragment,
  ImpactCrater,
  Particle,
  Shockwave,
  CombatPhase,
  BaseType,
  NeutralMediator,
  WarheadMunitionType,
} from './types';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const orbitControlsRef = useRef<MobileTouchOrbitControls | null>(null);

  // Tactical Modes & Drawers
  const [isSatelliteMapMode, setIsSatelliteMapMode] = useState<boolean>(false);
  const [autoDefenseActive, setAutoDefenseActive] = useState<boolean>(true);
  const [selectedAssetIdx, setSelectedAssetIdx] = useState<number>(0);
  const [showIntelCard, setShowIntelCard] = useState<boolean>(false);
  const [showDiplomacyDrawer, setShowDiplomacyDrawer] = useState<boolean>(false);
  const [showDeployDrawer, setShowDeployDrawer] = useState<boolean>(false);
  const [selectedMediator, setSelectedMediator] = useState<NeutralMediator>(neutralMediators[0]);

  // Base Deployment
  const [deployType, setDeployType] = useState<BaseType | null>(null);
  const [deployQuota, setDeployQuota] = useState<number>(12);

  // Waves & Timing
  const [currentWaveIdx, setCurrentWaveIdx] = useState<number>(0);
  const [combatPhase, setCombatPhase] = useState<CombatPhase>('PREPARATION');
  const [waveCountdown, setWaveCountdown] = useState<number>(35);
  const [defconLevel, setDefconLevel] = useState<1 | 2 | 3 | 4 | 5>(4);

  // Health & Stats
  const [cityIntegrity, setCityIntegrity] = useState<number>(100);
  const [samStock, setSamStock] = useState<number>(28);
  const maxSamStock = 36;
  const [icbmStock, setIcbmStock] = useState<number>(4);
  const [decoyStock, setDecoyStock] = useState<number>(4);
  const [jammingActive, setJammingActive] = useState<boolean>(false);
  const [jammingTimeLeft, setJammingTimeLeft] = useState<number>(0);
  const [jammingCooldown, setJammingCooldown] = useState<number>(0);

  const [score, setScore] = useState<number>(0);
  const [interceptedCount, setInterceptedCount] = useState<number>(0);
  const [flashDamage, setFlashDamage] = useState<boolean>(false);

  // Cinematic Banner
  const [cinematicBannerText, setCinematicBannerText] = useState<string | null>(null);

  // Modals & Audio
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);

  // Action Dispatch Refs
  const fireSAMRef = useRef<(pos?: THREE.Vector3) => void>(() => {});
  const launchICBMRef = useRef<() => void>(() => {});
  const launchDecoyRef = useRef<() => void>(() => {});
  const activateJammingRef = useRef<() => void>(() => {});
  const deployBaseRef = useRef<(type: BaseType, pos: THREE.Vector3) => void>(() => {});
  const skipPrepRef = useRef<() => void>(() => {});
  const ratifyTreatyRef = useRef<() => void>(() => {});
  const cameraFocusRef = useRef<(type: 'hq' | 'silo' | 'target' | 'reset') => void>(() => {});

  // Assets state for UI
  const [enemyAssetsList, setEnemyAssetsList] = useState<EnemyAsset[]>([]);

  // Simulation Mount
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    sound.init();

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060f1e);
    scene.fog = new THREE.FogExp2(0x0a192f, 0.0028);

    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.5, 3500);
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Mobile Touch Orbit Controls
    const orbitControls = new MobileTouchOrbitControls(camera, renderer.domElement);
    orbitControlsRef.current = orbitControls;
    orbitControls.setFocus(new THREE.Vector3(0, 15, 0), 240, Math.PI / 4, 0.0);

    // Crisp Daytime Military Environment & Lighting
    scene.fog = new THREE.FogExp2(0x182438, 0.0016);

    const hemiLight = new THREE.HemisphereLight(0xcde3fe, 0x1f2937, 0.85);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfff8ee, 1.85);
    sunLight.position.set(160, 320, 140);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 950;
    sunLight.shadow.camera.left = -320;
    sunLight.shadow.camera.right = 320;
    sunLight.shadow.camera.top = 320;
    sunLight.shadow.camera.bottom = -320;
    scene.add(sunLight);

    // BUILD BATTLEFIELD & CITIES
    const battlefield = buildSuperpowerBattlefield(scene);
    setEnemyAssetsList(battlefield.enemyAssets);

    // SATELLITE WAR MAP
    const mapGroup = new THREE.Group();
    const mapMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(130, 65),
      new THREE.MeshBasicMaterial({ map: createSatelliteWarMapTexture(), side: THREE.DoubleSide })
    );
    mapMesh.rotateX(-Math.PI / 2);
    mapGroup.add(mapMesh);
    mapGroup.position.set(0, 1650, 0);
    scene.add(mapGroup);

    // Holographic Target Marker
    const targetRingGeo = new THREE.RingGeometry(4, 6, 32);
    targetRingGeo.rotateX(-Math.PI / 2);
    const holographicTargetMarker = new THREE.Mesh(
      targetRingGeo,
      new THREE.MeshBasicMaterial({ color: 0xff3366, side: THREE.DoubleSide })
    );
    holographicTargetMarker.position.copy(battlefield.enemyAssets[0].absPos);
    scene.add(holographicTargetMarker);

    const beamGeo = new THREE.CylinderGeometry(0.2, 0.2, 140, 8);
    beamGeo.translate(0, 70, 0);
    const targetBeam = new THREE.Mesh(beamGeo, new THREE.MeshBasicMaterial({ color: 0xff3366, transparent: true, opacity: 0.45 }));
    holographicTargetMarker.add(targetBeam);

    // Bases list
    const bases: FriendlyBase[] = [...battlefield.initialBases];

    const buildBase3D = (base: FriendlyBase) => {
      if (base.type === 'silo') {
        const pad = new THREE.Mesh(
          new THREE.CylinderGeometry(5.5, 6.2, 1.4, 16),
          new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85 })
        );
        pad.position.copy(base.pos).add(new THREE.Vector3(0, 0.7, 0));
        scene.add(pad);

        const doorL = new THREE.Mesh(
          new THREE.BoxGeometry(4.8, 0.4, 2.3),
          new THREE.MeshStandardMaterial({ color: 0xff3366, metalness: 0.9 })
        );
        doorL.position.copy(base.pos).add(new THREE.Vector3(0, 1.4, -1.2));
        scene.add(doorL);
        base.doorLeft = doorL;

        const doorR = new THREE.Mesh(
          new THREE.BoxGeometry(4.8, 0.4, 2.3),
          new THREE.MeshStandardMaterial({ color: 0xff3366, metalness: 0.9 })
        );
        doorR.position.copy(base.pos).add(new THREE.Vector3(0, 1.4, 1.2));
        scene.add(doorR);
        base.doorRight = doorR;

        const strobe = new THREE.PointLight(0xff0044, 0, 25);
        strobe.position.copy(base.pos).add(new THREE.Vector3(0, 2.5, 0));
        scene.add(strobe);
        base.strobeLight = strobe;
      } else if (base.type === 'sam') {
        const tGroup = new THREE.Group();
        const bMesh = new THREE.Mesh(
          new THREE.CylinderGeometry(3.5, 4.2, 2, 8),
          new THREE.MeshStandardMaterial({ color: 0x0f172a })
        );
        bMesh.position.y = 1;
        tGroup.add(bMesh);

        const launcher = new THREE.Mesh(
          new THREE.BoxGeometry(3.2, 2.2, 4.8),
          new THREE.MeshStandardMaterial({ color: 0x00f0ff, metalness: 0.85 })
        );
        launcher.position.set(0, 3.0, 0);
        launcher.rotation.x = -Math.PI * 0.25;
        tGroup.add(launcher);
        base.launcherMesh = launcher;

        tGroup.position.copy(base.pos);
        scene.add(tGroup);
      } else if (base.type === 'laser') {
        const lGroup = new THREE.Group();
        const turretBase = new THREE.Mesh(
          new THREE.CylinderGeometry(2.8, 3.4, 2, 12),
          new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.9 })
        );
        turretBase.position.y = 1;
        lGroup.add(turretBase);

        const head = new THREE.Mesh(
          new THREE.SphereGeometry(1.8, 12, 12),
          new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 0.5 })
        );
        head.position.y = 2.8;
        lGroup.add(head);
        base.turretHead = head;

        lGroup.position.copy(base.pos);
        scene.add(lGroup);
      } else if (base.type === 'radar') {
        const rGroup = new THREE.Group();
        const tower = new THREE.Mesh(
          new THREE.CylinderGeometry(2, 3, 8, 8),
          new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 })
        );
        tower.position.y = 4;
        rGroup.add(tower);

        const dish = new THREE.Mesh(
          new THREE.CylinderGeometry(5, 5, 0.8, 16),
          new THREE.MeshStandardMaterial({ color: 0x00f0ff, metalness: 0.9 })
        );
        dish.position.y = 8.5;
        dish.rotation.x = Math.PI / 3;
        rGroup.add(dish);
        base.radarDish = dish;

        rGroup.position.copy(base.pos);
        scene.add(rGroup);
      }
    };

    bases.forEach(buildBase3D);

    // Camera Focus Action
    cameraFocusRef.current = (type: 'hq' | 'silo' | 'target' | 'reset') => {
      if (type === 'hq') {
        orbitControls.setFocus(new THREE.Vector3(0, 8, 0), 120, Math.PI / 4, orbitControls.theta);
      } else if (type === 'silo') {
        const firstSilo = bases.find((b) => b.type === 'silo');
        if (firstSilo) {
          orbitControls.setFocus(firstSilo.pos.clone().add(new THREE.Vector3(0, 4, 0)), 85, Math.PI / 3.5);
        }
      } else if (type === 'target') {
        const targetAsset = battlefield.enemyAssets[selectedAssetIdx];
        if (targetAsset) {
          orbitControls.setFocus(targetAsset.absPos.clone().add(new THREE.Vector3(0, 15, 0)), 160, Math.PI / 3.8);
        }
      } else {
        orbitControls.setFocus(new THREE.Vector3(0, 15, 0), 240, Math.PI / 4, 0.0);
      }
    };

    // Base Deployment Action Hook
    deployBaseRef.current = (type: BaseType, pos: THREE.Vector3) => {
      sound.playDeploy();
      const newBase: FriendlyBase = {
        id: bases.length,
        type,
        name: `CUSTOM ${type.toUpperCase()} ${bases.length + 1}`,
        pos: pos.clone(),
        ready: true,
        builtByUser: true,
      };
      bases.push(newBase);
      buildBase3D(newBase);
      setDeployQuota((q) => Math.max(0, q - 1));
      setDeployType(null);
      setShowDeployDrawer(false);
      setCinematicBannerText(`DEPLOYED ${type.toUpperCase()} DEFENSE INSTALLATION`);
      setTimeout(() => setCinematicBannerText(null), 2500);
    };

    // ==========================================
    // ZERO-ALLOCATION OBJECT POOLS (CRITICAL 60 FPS MOBILE)
    // Pre-allocated once at boot, never re-allocated during combat
    // ==========================================
    interface PooledDebris {
      mesh: THREE.Mesh;
      vel: THREE.Vector3;
      rotVel: THREE.Vector3;
      life: number;
      maxLife: number;
      bounces: number;
      active: boolean;
    }
    const DEBRIS_POOL_SIZE = 140;
    const debrisGeo = new THREE.BoxGeometry(1, 1, 1);
    const debrisMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85, metalness: 0.3 });
    const debrisPool: PooledDebris[] = [];
    for (let i = 0; i < DEBRIS_POOL_SIZE; i++) {
      const mesh = new THREE.Mesh(debrisGeo, debrisMat);
      mesh.visible = false;
      scene.add(mesh);
      debrisPool.push({
        mesh,
        vel: new THREE.Vector3(),
        rotVel: new THREE.Vector3(),
        life: 0,
        maxLife: 1,
        bounces: 0,
        active: false,
      });
    }

    interface PooledShockwave {
      mesh: THREE.Mesh;
      scale: number;
      opacity: number;
      maxScale: number;
      active: boolean;
    }
    const SHOCKWAVE_POOL_SIZE = 14;
    const swGeo = new THREE.RingGeometry(0.8, 3.2, 24);
    swGeo.rotateX(-Math.PI / 2);
    const shockwavePool: PooledShockwave[] = [];
    for (let i = 0; i < SHOCKWAVE_POOL_SIZE; i++) {
      const swMat = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.95, side: THREE.DoubleSide });
      const mesh = new THREE.Mesh(swGeo, swMat);
      mesh.visible = false;
      scene.add(mesh);
      shockwavePool.push({ mesh, scale: 1, opacity: 1, maxScale: 85, active: false });
    }

    // Persistent Scorched Crater Pool (Circular ring buffer on ground)
    const CRATER_POOL_SIZE = 24;
    const craterGeo = new THREE.CircleGeometry(14, 20);
    craterGeo.rotateX(-Math.PI / 2);
    const craterMat = new THREE.MeshBasicMaterial({ color: 0x05050a, transparent: true, opacity: 0.92 });
    const craterPool: THREE.Mesh[] = [];
    let nextCraterIdx = 0;
    for (let i = 0; i < CRATER_POOL_SIZE; i++) {
      const mesh = new THREE.Mesh(craterGeo, craterMat);
      mesh.position.set(0, 0.05, 0);
      mesh.visible = false;
      scene.add(mesh);
      craterPool.push(mesh);
    }

    interface PooledParticle {
      mesh: THREE.Mesh;
      vel: THREE.Vector3;
      life: number;
      maxLife: number;
      active: boolean;
      scaleSpeed: number;
    }
    const PARTICLE_POOL_SIZE = 160;
    const partGeo = new THREE.SphereGeometry(1, 6, 6);
    const fireMat = new THREE.MeshBasicMaterial({ color: 0xff4500, transparent: true, opacity: 0.95 });
    const smokeMat = new THREE.MeshBasicMaterial({ color: 0x0f172a, transparent: true, opacity: 0.85 });
    const sparkMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.95 });
    const particlePool: PooledParticle[] = [];
    for (let i = 0; i < PARTICLE_POOL_SIZE; i++) {
      const mesh = new THREE.Mesh(partGeo, i % 2 === 0 ? smokeMat : fireMat);
      mesh.visible = false;
      scene.add(mesh);
      particlePool.push({
        mesh,
        vel: new THREE.Vector3(),
        life: 0,
        maxLife: 1,
        active: false,
        scaleSpeed: 1,
      });
    }

    interface PooledTrail {
      mesh: THREE.Mesh;
      life: number;
      maxLife: number;
      active: boolean;
    }
    const TRAIL_POOL_SIZE = 75;
    const trailGeo = new THREE.SphereGeometry(0.7, 4, 4);
    const trailMat = new THREE.MeshBasicMaterial({ color: 0xe2e8f0, transparent: true, opacity: 0.65 });
    const trailPool: PooledTrail[] = [];
    let nextTrailIdx = 0;
    for (let i = 0; i < TRAIL_POOL_SIZE; i++) {
      const mesh = new THREE.Mesh(trailGeo, trailMat);
      mesh.visible = false;
      scene.add(mesh);
      trailPool.push({ mesh, life: 0, maxLife: 0.6, active: false });
    }

    interface PooledLaser {
      line: THREE.Line;
      positions: Float32Array;
      posAttr: THREE.BufferAttribute;
      life: number;
      maxLife: number;
      active: boolean;
    }
    const LASER_POOL_SIZE = 8;
    const laserPool: PooledLaser[] = [];
    for (let i = 0; i < LASER_POOL_SIZE; i++) {
      const positions = new Float32Array(6);
      const bGeo = new THREE.BufferGeometry();
      const posAttr = new THREE.BufferAttribute(positions, 3);
      bGeo.setAttribute('position', posAttr);
      const lineMat = new THREE.LineBasicMaterial({ color: 0x00f0ff, linewidth: 2 });
      const line = new THREE.Line(bGeo, lineMat);
      line.visible = false;
      scene.add(line);
      laserPool.push({ line, positions, posAttr, life: 0, maxLife: 0.15, active: false });
    }

    interface PooledWarhead {
      id: number;
      group: THREE.Group;
      coneMesh: THREE.Mesh;
      coneMat: THREE.MeshStandardMaterial;
      glowMesh: THREE.Mesh;
      glowMat: THREE.MeshBasicMaterial;
      vel: THREE.Vector3;
      targetPos: THREE.Vector3;
      life: number;
      speed: number;
      type: WarheadMunitionType;
      hasSplit: boolean;
      active: boolean;
      smokeTimer: number;
    }
    const WARHEAD_POOL_SIZE = 28;
    const warheadPool: PooledWarhead[] = [];
    for (let i = 0; i < WARHEAD_POOL_SIZE; i++) {
      const group = new THREE.Group();
      const coneMat = new THREE.MeshStandardMaterial({ color: 0xff0033, emissive: 0xff0033, emissiveIntensity: 0.85 });
      const coneMesh = new THREE.Mesh(new THREE.ConeGeometry(0.85, 3.8, 8), coneMat);
      coneMesh.rotation.x = Math.PI;
      group.add(coneMesh);

      const glowMat = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.8 });
      const glowMesh = new THREE.Mesh(new THREE.SphereGeometry(2.2, 8, 8), glowMat);
      group.add(glowMesh);

      group.visible = false;
      scene.add(group);
      warheadPool.push({
        id: i,
        group,
        coneMesh,
        coneMat,
        glowMesh,
        glowMat,
        vel: new THREE.Vector3(),
        targetPos: new THREE.Vector3(),
        life: 0,
        speed: 120,
        type: 'icbm',
        hasSplit: false,
        active: false,
        smokeTimer: 0,
      });
    }

    interface PooledSAM {
      id: number;
      group: THREE.Group;
      dest: THREE.Vector3;
      speed: number;
      life: number;
      active: boolean;
      smokeTimer: number;
    }
    const SAM_POOL_SIZE = 16;
    const samPool: PooledSAM[] = [];
    for (let i = 0; i < SAM_POOL_SIZE; i++) {
      const group = new THREE.Group();
      const samMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.35, 3.0, 6),
        new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 0.85 })
      );
      samMesh.rotation.x = Math.PI / 2;
      group.add(samMesh);
      group.visible = false;
      scene.add(group);
      samPool.push({
        id: i,
        group,
        dest: new THREE.Vector3(),
        speed: 190,
        life: 0,
        active: false,
        smokeTimer: 0,
      });
    }

    interface PooledICBM {
      id: number;
      group: THREE.Group;
      silo: FriendlyBase | null;
      targetAsset: EnemyAsset | null;
      state: 'IGNITING' | 'TRANSIT' | 'IMPACTING';
      progress: number;
      startPos: THREE.Vector3;
      active: boolean;
      isDecoy?: boolean;
      interceptChecked?: boolean;
      coneMesh: THREE.Mesh;
      coneMat: THREE.MeshStandardMaterial;
    }
    const ICBM_POOL_SIZE = 6;
    const icbmPool: PooledICBM[] = [];
    for (let i = 0; i < ICBM_POOL_SIZE; i++) {
      const group = new THREE.Group();
      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.9, 1.15, 8.0, 10),
        new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.9, roughness: 0.2 })
      );
      body.position.y = 4.0;
      group.add(body);

      const coneMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 0.7 });
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.9, 2.8, 10), coneMat);
      cone.position.y = 9.4;
      group.add(cone);

      const glow = new THREE.PointLight(0xff5500, 4.0, 35);
      glow.position.y = -0.5;
      group.add(glow);

      group.visible = false;
      scene.add(group);
      icbmPool.push({
        id: i,
        group,
        silo: null,
        targetAsset: null,
        state: 'IGNITING',
        progress: 0,
        startPos: new THREE.Vector3(),
        active: false,
        coneMesh: cone,
        coneMat,
      });
    }

    // TIER-1 ENEMY SUPERPOWER HYPERSONIC SAM INTERCEPTOR POOL (Zero-Allocation)
    interface PooledEnemySAM {
      id: number;
      group: THREE.Group;
      targetICBM: PooledICBM | null;
      startPos: THREE.Vector3;
      destPos: THREE.Vector3;
      progress: number;
      duration: number;
      active: boolean;
      smokeTimer: number;
    }
    const ENEMY_SAM_POOL_SIZE = 8;
    const enemySamPool: PooledEnemySAM[] = [];
    for (let i = 0; i < ENEMY_SAM_POOL_SIZE; i++) {
      const g = new THREE.Group();
      const samBody = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.45, 4.2, 8),
        new THREE.MeshStandardMaterial({ color: 0xff0055, emissive: 0xff0044, emissiveIntensity: 0.9 })
      );
      samBody.rotation.x = Math.PI / 2;
      g.add(samBody);

      const samGlow = new THREE.PointLight(0xff0055, 3.5, 30);
      g.add(samGlow);

      g.visible = false;
      scene.add(g);
      enemySamPool.push({
        id: i,
        group: g,
        targetICBM: null,
        startPos: new THREE.Vector3(),
        destPos: new THREE.Vector3(),
        progress: 0,
        duration: 1.4,
        active: false,
        smokeTimer: 0,
      });
    }

    // ADVANCED ENEMY STEALTH STRATEGIC BOMBER ENTITY
    const stealthWingGeo = new THREE.BufferGeometry();
    const stealthVerts = new Float32Array([
      // Main delta wing
      0, 1.2, -14,   -22, 0.4, 10,    22, 0.4, 10,
      0, 1.2, -14,   -8, 0.4, 12,     8, 0.4, 12,
      // Twin canted vertical stabilizers
      -5, 0.4, 9,    -6, 4.5, 11,    -3, 0.4, 11,
      5, 0.4, 9,     6, 4.5, 11,     3, 0.4, 11,
    ]);
    stealthWingGeo.setAttribute('position', new THREE.BufferAttribute(stealthVerts, 3));
    stealthWingGeo.computeVertexNormals();
    const stealthMat = new THREE.MeshStandardMaterial({
      color: 0x05070c,
      roughness: 0.95,
      metalness: 0.1,
      emissive: 0x111827,
      emissiveIntensity: 0.2,
    });
    const stealthMesh = new THREE.Mesh(stealthWingGeo, stealthMat);
    const stealthGroup = new THREE.Group();
    stealthGroup.add(stealthMesh);

    // Afterburner engine glow
    const jetGlowLeft = new THREE.PointLight(0x00f0ff, 2.5, 18);
    jetGlowLeft.position.set(-4, 0.5, 11);
    stealthGroup.add(jetGlowLeft);
    const jetGlowRight = new THREE.PointLight(0x00f0ff, 2.5, 18);
    jetGlowRight.position.set(4, 0.5, 11);
    stealthGroup.add(jetGlowRight);

    stealthGroup.visible = false;
    scene.add(stealthGroup);

    const stealthBomber = {
      group: stealthGroup,
      mesh: stealthMesh,
      active: false,
      health: 100,
      startPos: new THREE.Vector3(),
      endPos: new THREE.Vector3(),
      progress: 0,
      speed: 38,
      hasDroppedCruise: false,
    };

    let currentWaveNumber = 0;
    let currentPhase: CombatPhase = 'PREPARATION';
    let currentWaveTimer = 35.0;
    let warheadsSpawnedInWave = 0;
    let spawnIntervalTimer = 1.0;

    let currentCityHealth = 100;
    let currentSamStock = 28;
    let currentDecoyStock = 4;
    let isJammingActive = false;
    let jammingTimer = 0;
    let jammingCooldownTimer = 0;
    let currentScore = 0;
    let currentIntercepts = 0;
    let screenShake = 0;

    // Cinematic tracking
    let isCinematicTracking = false;
    let activeCinematicICBM: PooledICBM | null = null;

    // ZERO-ALLOCATION BRUTAL STRUCTURAL DESTRUCTION PHYSICS
    const triggerBrutalDestruction = (pos: THREE.Vector3, height: number, colorHex?: number) => {
      sound.playExplosion(true);
      screenShake = 38;

      // 1. Shockwave from pool
      const sw = shockwavePool.find((s) => !s.active);
      if (sw) {
        sw.active = true;
        sw.scale = 1.0;
        sw.opacity = 0.95;
        sw.mesh.position.copy(pos);
        sw.mesh.scale.set(1, 1, 1);
        (sw.mesh.material as THREE.MeshBasicMaterial).color.setHex(colorHex || 0xffaa00);
        (sw.mesh.material as THREE.MeshBasicMaterial).opacity = 0.95;
        sw.mesh.visible = true;
      }

      // 2. Persistent Scorched Crater (Round-robin buffer)
      const crater = craterPool[nextCraterIdx % CRATER_POOL_SIZE];
      nextCraterIdx++;
      crater.position.set(pos.x, 0.05, pos.z);
      crater.visible = true;

      // 3. Multi-Stage Structural Fracture: Activate up to 50 Debris from Pool
      let activatedDebris = 0;
      for (let i = 0; i < debrisPool.length && activatedDebris < 50; i++) {
        const df = debrisPool[i];
        if (!df.active) {
          df.active = true;
          const sx = 1.0 + Math.random() * 2.2;
          const sy = 1.0 + Math.random() * 2.2;
          const sz = 1.0 + Math.random() * 2.2;
          df.mesh.scale.set(sx, sy, sz);

          const spawnY = Math.min(height, Math.random() * height * 0.85 + 2);
          df.mesh.position.set(
            pos.x + (Math.random() - 0.5) * 16,
            spawnY,
            pos.z + (Math.random() - 0.5) * 16
          );
          const speed = 28 + Math.random() * 55;
          const angle = Math.random() * Math.PI * 2;
          df.vel.set(
            Math.cos(angle) * speed,
            20 + Math.random() * 42,
            Math.sin(angle) * speed
          );
          df.rotVel.set(
            (Math.random() - 0.5) * 14,
            (Math.random() - 0.5) * 14,
            (Math.random() - 0.5) * 14
          );
          df.life = 4.5 + Math.random() * 2.5;
          df.maxLife = df.life;
          df.bounces = 0;
          df.mesh.visible = true;
          activatedDebris++;
        }
      }

      // 4. Firestorm & Dark Smoke Plume Particles from Pool
      let activatedParticles = 0;
      for (let i = 0; i < particlePool.length && activatedParticles < 38; i++) {
        const p = particlePool[i];
        if (!p.active) {
          p.active = true;
          const isSmoke = activatedParticles % 2 === 0;
          p.mesh.material = isSmoke ? smokeMat : (colorHex ? sparkMat : fireMat);
          const scale = isSmoke ? (2.2 + Math.random() * 1.5) : (1.2 + Math.random() * 1.0);
          p.mesh.scale.set(scale, scale, scale);
          p.mesh.position.copy(pos);
          p.vel.set(
            (Math.random() - 0.5) * 48,
            (Math.random() - 0.5) * 45 + 16,
            (Math.random() - 0.5) * 48
          );
          p.life = isSmoke ? 2.5 : 1.1;
          p.maxLife = p.life;
          p.scaleSpeed = isSmoke ? 1.5 : 0.8;
          p.mesh.visible = true;
          activatedParticles++;
        }
      }
    };

    // SAM Launch Action (Reuses from SAMPool)
    fireSAMRef.current = (targetPos?: THREE.Vector3) => {
      if (currentSamStock <= 0 || currentPhase === 'DEFEAT') return;

      const sam = samPool.find((s) => !s.active);
      if (!sam) return;

      sound.playLaunch(false);
      currentSamStock--;
      setSamStock(currentSamStock);

      const samBases = bases.filter((b) => b.type === 'sam');
      let closestBase = samBases[0] || bases[0];
      let minDist = 9999;
      samBases.forEach((b) => {
        const d = b.pos.distanceTo(targetPos || new THREE.Vector3(0, 100, 0));
        if (d < minDist) {
          minDist = d;
          closestBase = b;
        }
      });

      sam.active = true;
      sam.dest.copy(targetPos ? targetPos : new THREE.Vector3((Math.random() - 0.5) * 80, 130, (Math.random() - 0.5) * 80));
      sam.speed = 190;
      sam.life = 5.0;
      sam.smokeTimer = 0;

      const launchPos = closestBase.pos.clone().add(new THREE.Vector3(0, 3.5, 0));
      sam.group.position.copy(launchPos);
      sam.group.visible = true;
    };

    // Heavy ICBM Launch Action (Reuses from ICBMPool)
    launchICBMRef.current = () => {
      const targetAsset = battlefield.enemyAssets[selectedAssetIdx];
      if (targetAsset.destroyed) return;

      const readySilos = bases.filter((b) => b.type === 'silo' && b.ready);
      if (readySilos.length === 0) return;

      const icbm = icbmPool.find((m) => !m.active);
      if (!icbm) return;

      const silo = readySilos[0];
      silo.ready = false;
      setIcbmStock((prev) => Math.max(0, prev - 1));

      icbm.active = true;
      icbm.isDecoy = false;
      icbm.interceptChecked = false;
      icbm.silo = silo;
      icbm.targetAsset = targetAsset;
      icbm.state = 'IGNITING';
      icbm.progress = 0;
      icbm.startPos.copy(silo.pos).add(new THREE.Vector3(0, 18, 0));
      icbm.group.position.copy(silo.pos);
      icbm.coneMat.color.setHex(0x00f0ff);
      icbm.coneMat.emissive.setHex(0x00f0ff);
      icbm.group.visible = true;

      activeCinematicICBM = icbm;
      isCinematicTracking = true;
      setCinematicBannerText('SILO HYDRAULICS UNLOCKED - ICBM IGNITION');
      sound.playLaunch(true);
    };

    // Radar Decoy Launch Action
    launchDecoyRef.current = () => {
      if (currentDecoyStock <= 0) {
        setCinematicBannerText('RADAR DECOY DEPLETED - RESTOCK VIA CEASEFIRE TREATY');
        setTimeout(() => setCinematicBannerText(null), 2500);
        return;
      }
      const targetAsset = battlefield.enemyAssets[selectedAssetIdx];
      if (targetAsset.destroyed) return;

      const readySilos = bases.filter((b) => b.type === 'silo' && b.ready);
      if (readySilos.length === 0) {
        setCinematicBannerText('ALL MISSILE SILOS OCCUPIED OR RELOADING');
        setTimeout(() => setCinematicBannerText(null), 2500);
        return;
      }

      const icbm = icbmPool.find((m) => !m.active);
      if (!icbm) return;

      const silo = readySilos[0];
      silo.ready = false;
      currentDecoyStock--;
      setDecoyStock(currentDecoyStock);

      icbm.active = true;
      icbm.isDecoy = true;
      icbm.interceptChecked = false;
      icbm.silo = silo;
      icbm.targetAsset = targetAsset;
      icbm.state = 'IGNITING';
      icbm.progress = 0;
      icbm.startPos.copy(silo.pos).add(new THREE.Vector3(0, 18, 0));
      icbm.group.position.copy(silo.pos);
      icbm.coneMat.color.setHex(0xf59e0b);
      icbm.coneMat.emissive.setHex(0xf59e0b);
      icbm.group.visible = true;

      activeCinematicICBM = icbm;
      isCinematicTracking = true;
      setCinematicBannerText('RADAR DECOY WARHEAD LAUNCHED - DRAWING ENEMY S-500 SAM FIRE');
      sound.playDecoyLaunch();
    };

    // Electronic Warfare (EW) Radar Jamming Action
    activateJammingRef.current = () => {
      if (jammingCooldownTimer > 0 || isJammingActive) return;
      isJammingActive = true;
      jammingTimer = 10.0;
      jammingCooldownTimer = 25.0;
      setJammingActive(true);
      setJammingTimeLeft(10);
      setJammingCooldown(25);
      sound.playJammingActivated();
      setCinematicBannerText('ELECTRONIC JAMMING ACTIVE: ENEMY RADAR DOMES BLINDED (10 SECONDS)');
      setTimeout(() => setCinematicBannerText(null), 3500);
    };

    // Ratify Ceasefire Treaty Action
    ratifyTreatyRef.current = () => {
      sound.playDiplomacyChime(true);
      currentCityHealth = Math.min(100, currentCityHealth + selectedMediator.reparationAid);
      setCityIntegrity(Math.round(currentCityHealth));
      currentSamStock = Math.min(maxSamStock, currentSamStock + selectedMediator.restockSAMs);
      setSamStock(currentSamStock);
      setIcbmStock((prev) => prev + selectedMediator.restockICBMs);

      setDefconLevel((d) => (d < 5 ? ((d + 1) as 1 | 2 | 3 | 4 | 5) : 5));
      currentPhase = 'CEASEFIRE_RATIFIED';
      setCombatPhase('CEASEFIRE_RATIFIED');
      currentWaveTimer = 45.0;
      setWaveCountdown(45);
      setShowDiplomacyDrawer(false);
      setCinematicBannerText(`TREATY RATIFIED WITH ${selectedMediator.name}`);
      setTimeout(() => setCinematicBannerText(null), 3500);
    };

    // Skip Prep
    skipPrepRef.current = () => {
      if (currentPhase === 'PREPARATION' || currentPhase === 'CEASEFIRE_RATIFIED') {
        currentWaveTimer = 0;
        setWaveCountdown(0);
      }
    };

    // Raycaster for user touch/click
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      sound.init();
      const targetEl = e.target as HTMLElement;
      if (
        targetEl.closest('.hud-panel') ||
        targetEl.closest('.intel-card') ||
        targetEl.closest('.diplomacy-drawer') ||
        targetEl.closest('.deploy-drawer') ||
        targetEl.closest('button')
      ) {
        return;
      }

      let clientX = 0;
      let clientY = 0;
      if ('touches' in e && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if ('clientX' in e) {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      const rect = container.getBoundingClientRect();
      mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      // 1. If in Deploy Mode
      if (deployType) {
        const intersects = raycaster.intersectObject(battlefield.groundMesh);
        if (intersects.length > 0) {
          const pt = intersects[0].point;
          if (Math.abs(pt.x) < 140 && Math.abs(pt.z) < 140 && deployQuota > 0) {
            deployBaseRef.current(deployType, pt);
          }
        }
        return;
      }

      // 2. Select Enemy Target
      const targetIntersects = raycaster.intersectObjects(battlefield.enemyTargetGroup.children);
      if (targetIntersects.length > 0) {
        const hit = targetIntersects[0].object as THREE.Mesh;
        const asset = hit.userData as EnemyAsset;
        const idx = battlefield.enemyAssets.findIndex((a) => a.id === asset.id);
        if (idx !== -1) {
          setSelectedAssetIdx(idx);
          holographicTargetMarker.position.copy(asset.absPos);
          setShowIntelCard(true);
        }
        return;
      }

      // 3. Manual SAM Fire targeting coordinate in sky
      const skyPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -90);
      const intersectPoint = new THREE.Vector3();
      raycaster.ray.intersectPlane(skyPlane, intersectPoint);
      if (intersectPoint) {
        fireSAMRef.current(intersectPoint);
      }
    };

    container.addEventListener('pointerdown', handlePointerDown);

    // Resize Handler
    const handleResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Animation & Physics Loop
    let animId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.1);

      // Rotate radar dishes & beacons
      bases.forEach((b) => {
        if (b.radarDish) b.radarDish.rotation.y += dt * 1.5;
        if (b.strobeLight && b.type === 'silo') {
          b.strobeLight.intensity = Math.sin(clock.getElapsedTime() * 15) > 0 ? 8 : 0;
        }
      });

      // 1. WAVE STATE MACHINE
      if (currentPhase === 'PREPARATION' || currentPhase === 'CEASEFIRE_RATIFIED') {
        currentWaveTimer -= dt;
        setWaveCountdown(Math.ceil(currentWaveTimer));

        if (currentWaveTimer <= 0) {
          currentPhase = 'WAVE_ACTIVE';
          setCombatPhase('WAVE_ACTIVE');
          warheadsSpawnedInWave = 0;
          spawnIntervalTimer = 0.4;
          const curW = waveConfigs[currentWaveNumber];
          setDefconLevel(curW.defcon);
          sound.playAlarm();
          setCinematicBannerText(`DEFCON ${curW.defcon}: INCOMING ${curW.munitionType.toUpperCase()} BARRAGE`);
          setTimeout(() => setCinematicBannerText(null), 3500);
        }
      } else if (currentPhase === 'WAVE_ACTIVE') {
        const curWave = waveConfigs[currentWaveNumber];
        spawnIntervalTimer -= dt;
        if (spawnIntervalTimer <= 0 && warheadsSpawnedInWave < curWave.warheadCount) {
          const w = warheadPool.find((item) => !item.active);
          if (w) {
            const startX = (Math.random() - 0.5) * 260;
            const startZ = (Math.random() - 0.5) * 260;
            const startY = 320 + Math.random() * 70;
            const targetX = (Math.random() - 0.5) * 140;
            const targetZ = (Math.random() - 0.5) * 140;

            w.active = true;
            w.type = curWave.munitionType;
            w.speed = curWave.speed;
            w.life = 18;
            w.hasSplit = false;
            w.smokeTimer = 0;
            w.coneMat.color.setHex(curWave.munitionType === 'hypersonic' ? 0xffaa00 : 0xff0033);
            w.coneMat.emissive.setHex(curWave.munitionType === 'hypersonic' ? 0xff6600 : 0xff0033);
            w.glowMat.color.setHex(curWave.munitionType === 'hypersonic' ? 0xff5500 : 0xffaa00);

            w.group.position.set(startX, startY, startZ);
            w.targetPos.set(targetX, 0, targetZ);
            const dir = new THREE.Vector3(targetX - startX, -startY, targetZ - startZ).normalize();
            w.vel.copy(dir).multiplyScalar(curWave.speed);
            w.group.visible = true;

            warheadsSpawnedInWave++;
            spawnIntervalTimer = 2.0 + Math.random() * 1.4;
          }
        }

        // Check if wave completed
        const activeWarheadsCount = warheadPool.filter((w) => w.active).length;
        if (warheadsSpawnedInWave >= curWave.warheadCount && activeWarheadsCount === 0) {
          if (currentWaveNumber < waveConfigs.length - 1) {
            currentWaveNumber++;
            setCurrentWaveIdx(currentWaveNumber);
            currentPhase = 'PREPARATION';
            setCombatPhase('PREPARATION');
            currentWaveTimer = 35.0;
            setWaveCountdown(35);

            // Replenish Ammo & Silos
            currentSamStock = Math.min(maxSamStock, currentSamStock + 10);
            setSamStock(currentSamStock);
            bases.forEach((b) => {
              if (b.type === 'silo') b.ready = true;
            });

            // Trigger Mediator Proposal
            setSelectedMediator(neutralMediators[currentWaveNumber % neutralMediators.length]);
            setShowDiplomacyDrawer(true);

            setCinematicBannerText('WAVE REPELLED - MEDIATOR CEASEFIRE PROPOSAL RECEIVED');
            setTimeout(() => setCinematicBannerText(null), 3000);
          } else {
            currentPhase = 'VICTORY';
            setCombatPhase('VICTORY');
            setIsVictory(true);
          }
        }
      }

      // 2. MULTI-LAYERED AIR DEFENSE: LASER CIWS POINT DEFENSE (Zero Allocation)
      const laserBases = bases.filter((b) => b.type === 'laser');
      laserBases.forEach((lb) => {
        const targetW = warheadPool.find((w) => w.active && w.group.position.y < 160 && lb.pos.distanceTo(w.group.position) < 120);
        if (targetW) {
          const activeLaser = laserPool.find((l) => !l.active);
          if (activeLaser) {
            sound.playLaserZap();
            activeLaser.active = true;
            activeLaser.life = 0.15;
            activeLaser.maxLife = 0.15;
            const start = lb.pos.clone().add(new THREE.Vector3(0, 3, 0));
            const end = targetW.group.position;
            activeLaser.positions[0] = start.x;
            activeLaser.positions[1] = start.y;
            activeLaser.positions[2] = start.z;
            activeLaser.positions[3] = end.x;
            activeLaser.positions[4] = end.y;
            activeLaser.positions[5] = end.z;
            activeLaser.posAttr.needsUpdate = true;
            activeLaser.line.visible = true;
          }

          if (lb.turretHead) {
            lb.turretHead.lookAt(targetW.group.position);
          }

          // Damage/destroy warhead
          targetW.life -= dt * 15;
          if (targetW.life <= 0) {
            triggerBrutalDestruction(targetW.group.position, 15, 0x00f0ff);
            targetW.active = false;
            targetW.group.visible = false;
            currentScore += 300;
            currentIntercepts++;
            setScore(currentScore);
            setInterceptedCount(currentIntercepts);
          }
        }
      });

      // Update Laser Beams
      laserPool.forEach((l) => {
        if (!l.active) return;
        l.life -= dt;
        if (l.life <= 0) {
          l.active = false;
          l.line.visible = false;
        }
      });

      // 3. AUTO-DEFENSE SAM BATTERIES
      if (autoDefenseActive && currentSamStock > 0 && Math.random() < 0.045) {
        const targetW = warheadPool.find((w) => w.active && w.group.position.y < 230);
        if (targetW) {
          fireSAMRef.current(targetW.group.position);
        }
      }

      // 4. WARHEADS MOVEMENT & MIRV STAGING (Zero Allocation)
      warheadPool.forEach((w) => {
        if (!w.active) return;
        w.group.position.addScaledVector(w.vel, dt);
        w.life -= dt;

        // Smoke trail
        w.smokeTimer += dt;
        if (w.smokeTimer > 0.06) {
          w.smokeTimer = 0;
          const tr = trailPool[nextTrailIdx % TRAIL_POOL_SIZE];
          nextTrailIdx++;
          tr.active = true;
          tr.life = 0.45;
          tr.maxLife = 0.45;
          tr.mesh.position.copy(w.group.position);
          tr.mesh.visible = true;
        }

        // MIRV splitting stage
        if (w.type === 'mirv' && !w.hasSplit && w.group.position.y < 180) {
          w.hasSplit = true;
          for (let s = 0; s < 2; s++) {
            const subW = warheadPool.find((item) => !item.active);
            if (subW) {
              subW.active = true;
              subW.type = 'icbm';
              subW.hasSplit = true;
              subW.speed = w.speed * 1.1;
              subW.life = 12;
              subW.smokeTimer = 0;
              subW.coneMat.color.setHex(0xff3300);
              subW.coneMat.emissive.setHex(0xff3300);
              subW.glowMat.color.setHex(0xffaa00);

              subW.group.position.copy(w.group.position);
              subW.targetPos.copy(w.targetPos).add(new THREE.Vector3(s === 0 ? 25 : -25, 0, 0));
              const spreadDir = w.vel.clone().add(new THREE.Vector3(s === 0 ? 15 : -15, -5, (Math.random() - 0.5) * 10)).normalize();
              subW.vel.copy(spreadDir).multiplyScalar(subW.speed);
              subW.group.visible = true;
            }
          }
        }

        // Warhead ground/building impact
        if (w.group.position.y <= 1.0 || w.life <= 0) {
          triggerBrutalDestruction(w.group.position, 42, 0xff3366);
          w.active = false;
          w.group.visible = false;

          currentCityHealth = Math.max(0, currentCityHealth - (12 + Math.random() * 8));
          setCityIntegrity(Math.round(currentCityHealth));
          setFlashDamage(true);
          setTimeout(() => setFlashDamage(false), 200);

          if (currentCityHealth <= 0 && currentPhase !== 'DEFEAT') {
            currentPhase = 'DEFEAT';
            setCombatPhase('DEFEAT');
            setIsGameOver(true);
          }
        }
      });

      // 5. SAM INTERCEPTORS MOVEMENT & MID-AIR KINETIC EXPLOSIONS (Zero Allocation)
      samPool.forEach((sam) => {
        if (!sam.active) return;
        const toDest = sam.dest.clone().sub(sam.group.position);
        const dist = toDest.length();

        sam.smokeTimer += dt;
        if (sam.smokeTimer > 0.05) {
          sam.smokeTimer = 0;
          const tr = trailPool[nextTrailIdx % TRAIL_POOL_SIZE];
          nextTrailIdx++;
          tr.active = true;
          tr.life = 0.5;
          tr.maxLife = 0.5;
          tr.mesh.position.copy(sam.group.position);
          tr.mesh.visible = true;
        }

        if (dist < 4.5 || sam.life <= 0) {
          triggerBrutalDestruction(sam.group.position, 12, 0x00f0ff);

          // Kinetic proximity kill on incoming warheads
          warheadPool.forEach((w) => {
            if (w.active && w.group.position.distanceTo(sam.group.position) < 26.0) {
              triggerBrutalDestruction(w.group.position, 22, 0x00f0ff);
              w.active = false;
              w.group.visible = false;
              currentScore += 250;
              currentIntercepts++;
              setScore(currentScore);
              setInterceptedCount(currentIntercepts);
            }
          });

          // Kinetic kill on Stealth Bomber if in proximity
          if (stealthBomber.active && sam.group.position.distanceTo(stealthBomber.group.position) < 32.0) {
            triggerBrutalDestruction(stealthBomber.group.position, 28, 0x00f0ff);
            stealthBomber.active = false;
            stealthBomber.group.visible = false;
            currentScore += 1000;
            currentIntercepts++;
            setScore(currentScore);
            setInterceptedCount(currentIntercepts);
            setCinematicBannerText('ENEMY H-20 STEALTH STRATEGIC BOMBER SHOT DOWN! +1000 PTS');
          }

          sam.active = false;
          sam.group.visible = false;
        } else {
          toDest.normalize();
          sam.group.position.addScaledVector(toDest, sam.speed * dt);
          sam.group.lookAt(sam.dest);
          sam.life -= dt;
        }
      });

      // 5B. ADVANCED ENEMY STEALTH STRATEGIC BOMBER SORTIE
      const curWaveCfg = waveConfigs[currentWaveNumber];
      if (
        curWaveCfg?.hasStealthBomber &&
        currentPhase === 'WAVE_ACTIVE' &&
        !stealthBomber.active &&
        !stealthBomber.hasDroppedCruise &&
        warheadsSpawnedInWave >= 1
      ) {
        stealthBomber.active = true;
        stealthBomber.health = 100;
        stealthBomber.progress = 0;
        stealthBomber.speed = 42;
        stealthBomber.hasDroppedCruise = false;
        stealthBomber.startPos.set(-280, 42, -240);
        stealthBomber.endPos.set(280, 42, 240);
        stealthBomber.group.position.copy(stealthBomber.startPos);
        stealthBomber.group.visible = true;
        sound.playStealthFlyby();
        setCinematicBannerText('RADAR ANOMALY: HOSTILE H-20 STEALTH BOMBER INTRUSION DETECTED BENEATH DOME');
      }

      if (stealthBomber.active) {
        stealthBomber.progress += dt * (stealthBomber.speed / 540);
        const t = Math.min(1.0, stealthBomber.progress);
        stealthBomber.group.position.lerpVectors(stealthBomber.startPos, stealthBomber.endPos, t);
        stealthBomber.group.lookAt(stealthBomber.endPos);

        // Low-Altitude Hypersonic Cruise Missile drop beneath standard radar
        if (t >= 0.42 && !stealthBomber.hasDroppedCruise) {
          stealthBomber.hasDroppedCruise = true;
          for (let k = 0; k < 2; k++) {
            const w = warheadPool.find((item) => !item.active);
            if (w) {
              w.active = true;
              w.type = 'cruise';
              w.speed = 62;
              w.life = 22;
              w.smokeTimer = 0;
              w.coneMat.color.setHex(0xff0044);
              w.group.position.copy(stealthBomber.group.position).add(new THREE.Vector3((k - 0.5) * 16, -3, 0));
              const targetX = (Math.random() - 0.5) * 60;
              const targetZ = (Math.random() - 0.5) * 60;
              w.targetPos.set(targetX, 0, targetZ);
              const dir = new THREE.Vector3(targetX, 0, targetZ).sub(w.group.position).normalize();
              w.vel.copy(dir).multiplyScalar(w.speed);
              w.group.visible = true;
            }
          }
          setCinematicBannerText('STEALTH BOMBER RELEASED DUAL LOW-ALTITUDE CRUISE MISSILES');
        }

        if (t >= 1.0) {
          stealthBomber.active = false;
          stealthBomber.group.visible = false;
        }
      }

      // 6. HEAVY ICBM / DECOY FLIGHT & ENEMY ANTI-BALLISTIC INTERCEPTIONS
      icbmPool.forEach((m) => {
        if (!m.active || !m.silo || !m.targetAsset) return;
        m.progress += dt;

        if (m.state === 'IGNITING') {
          if (m.silo.doorLeft && m.silo.doorRight) {
            m.silo.doorLeft.position.z = -1.2 - Math.min(2.4, m.progress * 1.8);
            m.silo.doorRight.position.z = 1.2 + Math.min(2.4, m.progress * 1.8);
          }
          if (m.silo.strobeLight) {
            m.silo.strobeLight.intensity = Math.sin(m.progress * 30) > 0 ? 8 : 0;
          }

          if (m.progress >= 0.8) {
            m.group.position.y += dt * 38;
          }

          if (m.progress >= 2.4) {
            m.state = 'TRANSIT';
            if (activeCinematicICBM === m) {
              setCinematicBannerText(
                m.isDecoy
                  ? 'RADAR DECOY IN TRANSIT: DRAWING HOSTILE DEFENSE MISSILES'
                  : 'STRATOSPHERE TRANSIT: HIGH-ALTITUDE BALLISTIC TRAJECTORY'
              );
            }
          }
        } else if (m.state === 'TRANSIT' || m.state === 'IMPACTING') {
          const start = m.startPos;
          const end = m.targetAsset.topPos;
          const t = Math.min(1.0, (m.progress - 2.4) / 3.0);

          const curPos = new THREE.Vector3().lerpVectors(start, end, t);
          curPos.y += Math.sin(t * Math.PI) * 260;
          m.group.position.copy(curPos);

          const nextPos = new THREE.Vector3().lerpVectors(start, end, Math.min(1.0, t + 0.05));
          nextPos.y += Math.sin((t + 0.05) * Math.PI) * 260;
          m.group.lookAt(nextPos);

          // TIER-1 ENEMY AIR DEFENSE RADAR CHECK & S-500 INTERCEPTOR LAUNCH
          if (t >= 0.28 && !m.interceptChecked) {
            m.interceptChecked = true;
            if (isJammingActive) {
              setCinematicBannerText('RADAR BLINDED: ICBM PENETRATING ENEMY DEFENSE GRID UNHINDERED');
            } else {
              const samAsset = battlefield.enemyAssets.find(
                (a) => a.category === 'ANTI-BALLISTIC SAM BATTERY' && !a.destroyed && a.interceptorStock > 0
              );
              if (samAsset) {
                samAsset.interceptorStock = Math.max(0, samAsset.interceptorStock - 1);
                const eSam = enemySamPool.find((s) => !s.active);
                if (eSam) {
                  eSam.active = true;
                  eSam.targetICBM = m;
                  eSam.startPos.copy(samAsset.absPos).add(new THREE.Vector3(0, samAsset.height + 4, 0));
                  eSam.destPos.copy(m.group.position);
                  eSam.group.position.copy(eSam.startPos);
                  eSam.progress = 0;
                  eSam.duration = 1.1;
                  eSam.group.visible = true;
                  sound.playEnemySAMLaunch();
                  setCinematicBannerText(
                    m.isDecoy
                      ? 'ALERT: ENEMY S-500 TARGETING INCOMING RADAR DECOY'
                      : 'WARNING: ENEMY S-500 HYPERSONIC INTERCEPTOR VECTORING INBOUND'
                  );
                }
              }
            }
          }

          if (t >= 0.75 && m.state !== 'IMPACTING') {
            m.state = 'IMPACTING';
            if (activeCinematicICBM === m) {
              setCinematicBannerText('TERMINAL RE-ENTRY: STRIKING STRATEGIC TARGET');
            }
          }

          if (t >= 1.0) {
            if (m.isDecoy) {
              // Decoy hits target with small kinetic burst (no strategic damage)
              triggerBrutalDestruction(m.targetAsset.absPos, 10, 0xf59e0b);
              setCinematicBannerText('RADAR DECOY PENETRATED (ZERO DESTRUCTION PAYLOAD)');
            } else {
              m.targetAsset.destroyed = true;
              m.targetAsset.health = 0;
              if (m.targetAsset.mesh) m.targetAsset.mesh.visible = false;
              triggerBrutalDestruction(m.targetAsset.absPos, m.targetAsset.height, 0xffaa00);

              currentScore += 1800;
              setScore(currentScore);
              setEnemyAssetsList((prev) =>
                prev.map((a) => (a.id === m.targetAsset?.id ? { ...a, destroyed: true, health: 0 } : a))
              );
              setCinematicBannerText(`ENEMY STRATEGIC TARGET ELIMINATED: ${m.targetAsset.name}`);
            }

            m.active = false;
            m.group.visible = false;

            if (activeCinematicICBM === m) {
              setTimeout(() => {
                isCinematicTracking = false;
                activeCinematicICBM = null;
                setCinematicBannerText(null);
              }, 2200);
            }
          }
        }
      });

      // 6B. ENEMY S-500 INTERCEPTOR SAM VECTORING & MID-AIR INTERCEPTION
      enemySamPool.forEach((eSam) => {
        if (!eSam.active || !eSam.targetICBM) return;
        eSam.progress += dt;
        const targetPos = eSam.targetICBM.group.position;
        const t = Math.min(1.0, eSam.progress / eSam.duration);
        eSam.group.position.lerpVectors(eSam.startPos, targetPos, t);
        eSam.group.lookAt(targetPos);

        eSam.smokeTimer += dt;
        if (eSam.smokeTimer > 0.05) {
          eSam.smokeTimer = 0;
          const tr = trailPool[nextTrailIdx % TRAIL_POOL_SIZE];
          nextTrailIdx++;
          tr.active = true;
          tr.life = 0.4;
          tr.maxLife = 0.4;
          tr.mesh.position.copy(eSam.group.position);
          tr.mesh.visible = true;
        }

        if (t >= 1.0) {
          eSam.active = false;
          eSam.group.visible = false;
          const targetICBM = eSam.targetICBM;

          if (targetICBM.isDecoy) {
            // Decoy absorbed the hit successfully!
            triggerBrutalDestruction(targetICBM.group.position, 20, 0xf59e0b);
            targetICBM.active = false;
            targetICBM.group.visible = false;
            setCinematicBannerText('TACTICAL SUCCESS: ENEMY S-500 EXHAUSTED ON RADAR DECOY!');
            sound.playExplosion(false);
            if (activeCinematicICBM === targetICBM) {
              setTimeout(() => {
                isCinematicTracking = false;
                activeCinematicICBM = null;
                setCinematicBannerText(null);
              }, 1800);
            }
          } else {
            // Real ICBM interception check
            const roll = Math.random() * 100;
            const prob = targetICBM.targetAsset?.interceptionProb || 88;
            if (roll < prob) {
              triggerBrutalDestruction(targetICBM.group.position, 28, 0xff0044);
              targetICBM.active = false;
              targetICBM.group.visible = false;
              setCinematicBannerText('ALERT: FRIENDLY ICBM SHOT DOWN BY ENEMY S-500! USE DECOYS OR EW JAMMING!');
              sound.playExplosion(true);
              if (activeCinematicICBM === targetICBM) {
                setTimeout(() => {
                  isCinematicTracking = false;
                  activeCinematicICBM = null;
                  setCinematicBannerText(null);
                }, 2200);
              }
            } else {
              setCinematicBannerText('PENETRATION SUCCESS: ICBM EVADED ENEMY HYPERSONIC INTERCEPTOR!');
            }
          }
        }
      });

      // 6C. ELECTRONIC JAMMING TIMERS
      if (isJammingActive) {
        jammingTimer -= dt;
        setJammingTimeLeft(Math.ceil(jammingTimer));
        if (jammingTimer <= 0) {
          isJammingActive = false;
          setJammingActive(false);
          setJammingTimeLeft(0);
          setCinematicBannerText('EW JAMMING EXPIRED: ENEMY AIR DEFENSE RADAR RESTORED');
          setTimeout(() => setCinematicBannerText(null), 2500);
        }
      }
      if (jammingCooldownTimer > 0) {
        jammingCooldownTimer -= dt;
        setJammingCooldown(Math.ceil(jammingCooldownTimer));
      }

      // 7. DEBRIS PHYSICAL FRAGMENTS (Zero Allocation - Updated from DebrisPool)
      debrisPool.forEach((df) => {
        if (!df.active) return;
        df.vel.y -= 75 * dt; // Gravity
        df.mesh.position.addScaledVector(df.vel, dt);
        df.mesh.rotation.x += df.rotVel.x * dt;
        df.mesh.rotation.y += df.rotVel.y * dt;
        df.mesh.rotation.z += df.rotVel.z * dt;

        if (df.mesh.position.y <= 0.8) {
          df.mesh.position.y = 0.8;
          df.vel.y = -df.vel.y * 0.35; // Inelastic ground bounce
          df.vel.x *= 0.72;
          df.vel.z *= 0.72;
          df.rotVel.multiplyScalar(0.75);
          df.bounces++;
        }

        df.life -= dt;
        if (df.life <= 0) {
          df.active = false;
          df.mesh.visible = false;
        }
      });

      // 8. PARTICLES & SHOCKWAVES & TRAILS (Zero Allocation)
      shockwavePool.forEach((s) => {
        if (!s.active) return;
        s.scale += dt * 48;
        s.opacity -= dt * 1.1;
        s.mesh.scale.set(s.scale, s.scale, s.scale);
        (s.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, s.opacity);
        if (s.scale >= s.maxScale || s.opacity <= 0) {
          s.active = false;
          s.mesh.visible = false;
        }
      });

      particlePool.forEach((p) => {
        if (!p.active) return;
        p.mesh.position.addScaledVector(p.vel, dt);
        p.life -= dt;
        (p.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, p.life / p.maxLife);
        p.mesh.scale.multiplyScalar(1 + dt * p.scaleSpeed);
        if (p.life <= 0) {
          p.active = false;
          p.mesh.visible = false;
        }
      });

      trailPool.forEach((t) => {
        if (!t.active) return;
        t.life -= dt;
        (t.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, (t.life / t.maxLife) * 0.65);
        if (t.life <= 0) {
          t.active = false;
          t.mesh.visible = false;
        }
      });

      // 9. UPDATE ORBIT CONTROLS & CAMERA
      if (isSatelliteMapMode) {
        camera.position.lerp(new THREE.Vector3(0, 1740, 0.1), 0.08);
        camera.lookAt(0, 1650, 0);
      } else if (isCinematicTracking && activeCinematicICBM) {
        if (activeCinematicICBM.state === 'IGNITING' && activeCinematicICBM.silo) {
          const siloPos = activeCinematicICBM.silo.pos;
          camera.position.lerp(siloPos.clone().add(new THREE.Vector3(16, 9, 16)), 0.1);
          camera.lookAt(siloPos.clone().add(new THREE.Vector3(0, 5, 0)));
        } else if (activeCinematicICBM.state === 'TRANSIT') {
          const mPos = activeCinematicICBM.group.position;
          camera.position.lerp(mPos.clone().add(new THREE.Vector3(30, 22, 30)), 0.1);
          camera.lookAt(mPos);
        } else if (activeCinematicICBM.state === 'IMPACTING' && activeCinematicICBM.targetAsset) {
          const facPos = activeCinematicICBM.targetAsset.absPos;
          camera.position.lerp(facPos.clone().add(new THREE.Vector3(42, 34, 42)), 0.08);
          camera.lookAt(facPos);
        }
      } else {
        orbitControls.update(dt);
      }

      // Screen Shake
      if (screenShake > 0) {
        camera.position.x += (Math.random() - 0.5) * screenShake * 0.28;
        camera.position.y += (Math.random() - 0.5) * screenShake * 0.28;
        screenShake = Math.max(0, screenShake - dt * 30);
      }

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      orbitControls.dispose();
      container.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('resize', handleResize);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [isMuted, autoDefenseActive, deployQuota, deployType, isSatelliteMapMode, selectedAssetIdx, selectedMediator]);

  const handleDownloadStandalone = () => {
    const htmlContent = generateStandaloneHTML();
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '3D-Strategic-Warfare-Simulator.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const currentTarget = enemyAssetsList[selectedAssetIdx] || enemyAssetsList[0];
  const curWave = waveConfigs[currentWaveIdx] || waveConfigs[0];

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-950 font-sans select-none text-white">
      {/* 3D WebGL Canvas */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full cursor-crosshair" />

      {/* Screen Damage Flash */}
      <div
        className={`absolute inset-0 pointer-events-none transition-opacity duration-150 z-15 ${
          flashDamage ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ boxShadow: 'inset 0 0 90px 35px rgba(255, 0, 50, 0.65)' }}
      />

      {/* Cinematic Phase Banner */}
      {cinematicBannerText && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-slate-900/95 border border-cyan-400 text-cyan-400 font-mono font-bold text-xs py-1.5 px-4 rounded-full shadow-[0_0_25px_rgba(0,240,255,0.65)] z-25 uppercase tracking-wider whitespace-nowrap animate-banner-drop">
          {cinematicBannerText}
        </div>
      )}

      {/* DIPLOMACY PANEL / PEACE BROKER ENGINE */}
      {showDiplomacyDrawer && (
        <div className="diplomacy-drawer absolute left-1/2 top-20 -translate-x-1/2 w-[92%] max-w-md bg-slate-900/98 border border-emerald-500/80 rounded-2xl p-4 shadow-2xl z-35 backdrop-blur-xl animate-drawer-down-center">
          <div className="flex justify-between items-start border-b border-emerald-500/30 pb-2 mb-3">
            <div className="flex items-center gap-2">
              <Handshake className="w-5 h-5 text-emerald-400" />
              <div>
                <div className="text-[10px] text-emerald-400 font-mono font-bold tracking-wider">NEUTRAL MEDIATOR CEASEFIRE ENGINE</div>
                <div className="text-sm font-bold text-white">{selectedMediator.name}</div>
              </div>
            </div>
            <button onClick={() => setShowDiplomacyDrawer(false)} className="text-slate-400 hover:text-white p-1">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="text-xs font-mono text-slate-300 space-y-2 mb-3">
            <div className="flex justify-between">
              <span className="text-slate-400">BUFFER CORRIDOR:</span>
              <span className="text-emerald-400">{selectedMediator.zone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">AMBASSADOR:</span>
              <span className="text-white">{selectedMediator.ambassador}</span>
            </div>
            <div className="bg-black/50 p-2.5 rounded-lg border-l-2 border-emerald-400 text-[11px] text-emerald-200">
              "{selectedMediator.proposalText}"
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] pt-1">
              <div className="bg-slate-800/80 p-1.5 rounded">
                <div className="text-emerald-400 font-bold">+{selectedMediator.reparationAid}%</div>
                <div className="text-slate-400">Grid Repair</div>
              </div>
              <div className="bg-slate-800/80 p-1.5 rounded">
                <div className="text-cyan-400 font-bold">+{selectedMediator.restockSAMs}</div>
                <div className="text-slate-400">SAM Munitions</div>
              </div>
              <div className="bg-slate-800/80 p-1.5 rounded">
                <div className="text-amber-400 font-bold">+{selectedMediator.restockICBMs}</div>
                <div className="text-slate-400">ICBM Payloads</div>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => ratifyTreatyRef.current()}
              className="flex-1 py-2 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 rounded-xl font-mono text-xs font-bold text-white shadow-lg flex items-center justify-center gap-1.5 active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              RATIFY CEASEFIRE TREATY
            </button>
            <button
              onClick={() => {
                setShowDiplomacyDrawer(false);
                skipPrepRef.current();
              }}
              className="py-2 px-3 bg-rose-600/80 hover:bg-rose-600 rounded-xl font-mono text-xs font-bold text-white flex items-center justify-center gap-1 active:scale-95"
            >
              <AlertTriangle className="w-4 h-4" />
              REJECT & PREEMPT
            </button>
          </div>
        </div>
      )}

      {/* INTEL CARD DRAWER */}
      {showIntelCard && currentTarget && (
        <div className="intel-card absolute right-3 bottom-20 w-84 bg-slate-900/98 border border-rose-500 rounded-xl p-3.5 shadow-2xl z-30 pointer-events-auto backdrop-blur-md animate-slide-up-fade">
          <div className="flex justify-between items-start border-b border-rose-500/30 pb-2 mb-2">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] bg-rose-600/30 text-rose-300 font-mono font-bold px-1.5 py-0.5 rounded border border-rose-500/40">
                  {currentTarget.category || 'STRATEGIC ASSET'}
                </span>
                <span className="text-[9px] text-slate-400 font-mono">{currentTarget.code}</span>
              </div>
              <div className="text-xs font-bold text-white leading-tight mt-1">{currentTarget.name}</div>
            </div>
            <button onClick={() => setShowIntelCard(false)} className="text-slate-400 hover:text-white p-1">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="text-[11px] font-mono text-slate-300 space-y-1.5">
            <div className="bg-black/40 p-2 rounded border border-slate-800">
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-400">INTERCEPTION PROBABILITY:</span>
                <span className={`font-bold ${jammingActive ? 'text-emerald-400 animate-pulse' : 'text-rose-400'}`}>
                  {jammingActive ? '0% [EW JAMMED]' : `${currentTarget.interceptionProb || 88}% [RADAR ACTIVE]`}
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-950 rounded mt-1 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${jammingActive ? 'bg-emerald-400' : 'bg-rose-500'}`}
                  style={{ width: jammingActive ? '0%' : `${currentTarget.interceptionProb || 88}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1 text-[10px]">
              <div>COORDINATES: <span className="text-cyan-400">{currentTarget.coords}</span></div>
              <div>THREAT: <span className="text-rose-400 font-bold">{currentTarget.threatLevel}</span></div>
              <div>RADAR: <span className="text-amber-400">{currentTarget.radarCoverage ? `${currentTarget.radarCoverage}km` : '640km'}</span></div>
              <div>STEALTH: <span className="text-purple-400">{currentTarget.stealthLevel || 'STANDARD'}</span></div>
              <div>INTERCEPTORS: <span className="text-slate-200">{currentTarget.interceptorStock} SAMs</span></div>
              <div>STATUS: <span className={currentTarget.destroyed ? 'text-rose-500 font-bold' : 'text-emerald-400'}>{currentTarget.destroyed ? 'DESTROYED' : `${currentTarget.health}%`}</span></div>
            </div>

            <div className="text-[10px] text-slate-300 bg-black/40 p-2 rounded border-l-2 border-amber-500">
              {jammingActive
                ? 'RADAR STATUS: Early Warning radar dome suppressed by friendly EW Jammer. Direct ballistic strike will penetrate!'
                : 'RADAR STATUS: Tier-1 S-500 hypersonic SAM array online. Deploy Radar Decoys to draw interceptors or activate EW Jammer.'}
            </div>
          </div>

          <div className="flex gap-1.5 mt-2.5">
            <button
              onClick={() => {
                launchDecoyRef.current();
              }}
              disabled={currentTarget.destroyed || decoyStock <= 0}
              className={`flex-1 py-1.5 px-2 rounded text-[11px] font-bold font-mono tracking-wider flex items-center justify-center gap-1 ${
                currentTarget.destroyed || decoyStock <= 0
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-amber-600/90 hover:bg-amber-500 text-black shadow-lg active:scale-95'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              LAUNCH DECOY ({decoyStock})
            </button>

            <button
              onClick={() => {
                launchICBMRef.current();
                setShowIntelCard(false);
              }}
              disabled={currentTarget.destroyed || icbmStock <= 0}
              className={`flex-1 py-1.5 px-2 rounded text-[11px] font-bold font-mono tracking-wider flex items-center justify-center gap-1 ${
                currentTarget.destroyed || icbmStock <= 0
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-lg hover:brightness-110 active:scale-95'
              }`}
            >
              <Rocket className="w-3.5 h-3.5" />
              STRIKE ({icbmStock})
            </button>
          </div>
        </div>
      )}

      {/* BASE DEPLOYMENT DRAWER */}
      {showDeployDrawer && (
        <div className="deploy-drawer absolute left-1/2 bottom-20 -translate-x-1/2 w-[92%] max-w-sm bg-slate-900/98 border border-cyan-400 rounded-xl p-3 shadow-2xl z-30 pointer-events-auto backdrop-blur-md animate-drawer-up-center">
          <div className="flex justify-between items-center border-b border-cyan-400/30 pb-1.5 mb-2">
            <div className="text-xs font-mono font-bold text-cyan-400 flex items-center gap-1.5">
              <Hammer className="w-4 h-4" />
              DEPLOY DEFENSE INSTALLATION ({deployQuota} AVAILABLE)
            </div>
            <button onClick={() => setShowDeployDrawer(false)} className="text-slate-400 hover:text-white p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <button
              onClick={() => {
                setDeployType('silo');
                setCinematicBannerText('TAP TERRAIN TO BUILD ICBM SILO');
              }}
              className={`p-2 rounded border flex flex-col items-center gap-1 ${
                deployType === 'silo' ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' : 'bg-slate-800/80 border-slate-700 hover:border-slate-500'
              }`}
            >
              <Rocket className="w-4 h-4 text-rose-400" />
              <span>HEAVY ICBM SILO</span>
            </button>
            <button
              onClick={() => {
                setDeployType('sam');
                setCinematicBannerText('TAP TERRAIN TO BUILD SAM BATTERY');
              }}
              className={`p-2 rounded border flex flex-col items-center gap-1 ${
                deployType === 'sam' ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' : 'bg-slate-800/80 border-slate-700 hover:border-slate-500'
              }`}
            >
              <Shield className="w-4 h-4 text-cyan-400" />
              <span>IRON DOME SAM</span>
            </button>
            <button
              onClick={() => {
                setDeployType('laser');
                setCinematicBannerText('TAP TERRAIN TO BUILD LASER CIWS');
              }}
              className={`p-2 rounded border flex flex-col items-center gap-1 ${
                deployType === 'laser' ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' : 'bg-slate-800/80 border-slate-700 hover:border-slate-500'
              }`}
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>LASER POINT CIWS</span>
            </button>
            <button
              onClick={() => {
                setDeployType('radar');
                setCinematicBannerText('TAP TERRAIN TO BUILD RADAR ARRAY');
              }}
              className={`p-2 rounded border flex flex-col items-center gap-1 ${
                deployType === 'radar' ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' : 'bg-slate-800/80 border-slate-700 hover:border-slate-500'
              }`}
            >
              <Radio className="w-4 h-4 text-emerald-400" />
              <span>PHASED RADAR</span>
            </button>
          </div>
          <div className="text-[10px] text-slate-400 mt-2 text-center">
            {deployType ? 'Tap any open ground area on the metropolis perimeter to place' : 'Select an installation type above to place'}
          </div>
        </div>
      )}

      {/* TOP BAR: GLASSMORPHISM STATUS */}
      <div className="absolute top-2 left-2 right-2 flex justify-between items-center pointer-events-none z-20 gap-2">
        {/* Left: Wave & DEFCON */}
        <div className="hud-panel flex items-center gap-2 pointer-events-auto bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-1.5 backdrop-blur-md shadow-lg animate-slide-down-fade">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded transition-all duration-300 inline-flex items-center justify-center ${
                  defconLevel === 1
                    ? 'bg-red-600 text-white defcon-badge-breathe-red'
                    : defconLevel <= 3
                    ? 'bg-amber-500 text-black font-extrabold defcon-badge-breathe-amber'
                    : 'bg-cyan-600 text-white defcon-badge-breathe-cyan'
                }`}
              >
                DEFCON {defconLevel}
              </span>
              <span className="text-xs font-mono font-bold text-white">WAVE {curWave.waveNumber}/5</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">{curWave.name}</div>
          </div>

          {(combatPhase === 'PREPARATION' || combatPhase === 'CEASEFIRE_RATIFIED') && (
            <button
              onClick={() => skipPrepRef.current()}
              className="bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-mono font-bold px-2 py-1 rounded flex items-center gap-1 active:scale-95"
            >
              <Play className="w-3 h-3" />
              {waveCountdown}s [START]
            </button>
          )}
        </div>

        {/* Center: City Health & Interceptor Ammo */}
        <div className="hud-panel flex items-center gap-3 pointer-events-auto bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-1.5 backdrop-blur-md shadow-lg animate-slide-down-fade">
          <div>
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>CITY INTEGRITY</span>
              <span className={cityIntegrity < 35 ? 'text-rose-400 font-bold' : 'text-cyan-400'}>{cityIntegrity}%</span>
            </div>
            <div className="w-24 h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-700">
              <div
                className={`h-full transition-all duration-300 ${cityIntegrity < 35 ? 'bg-rose-500' : 'bg-cyan-400'}`}
                style={{ width: `${cityIntegrity}%` }}
              />
            </div>
          </div>

          <div className="border-l border-slate-700 pl-3">
            <div className="text-[10px] font-mono text-slate-400">SAM AMMO</div>
            <div className="text-xs font-mono font-bold text-cyan-400">{samStock}/{maxSamStock}</div>
          </div>

          <div className="border-l border-slate-700 pl-3">
            <div className="text-[10px] font-mono text-slate-400">SCORE</div>
            <div className="text-xs font-mono font-bold text-emerald-400">{score}</div>
          </div>
        </div>

        {/* Right: Sound & Download */}
        <div className="hud-panel flex items-center gap-1.5 pointer-events-auto bg-slate-900/90 border border-slate-800 rounded-xl p-1.5 backdrop-blur-md shadow-lg animate-slide-down-fade">
          <button
            onClick={() => {
              const nm = !isMuted;
              setIsMuted(nm);
              sound.setMuted(nm);
            }}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
            title="Toggle Audio"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>

          <button
            onClick={handleDownloadStandalone}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300"
            title="Download Standalone HTML"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* QUICK CAMERA FOCUS CONTROL BAR (LEFT SIDE) */}
      <div className="absolute left-2 top-24 flex flex-col gap-1.5 z-20 animate-slide-up-fade">
        <button
          onClick={() => cameraFocusRef.current('hq')}
          className="hud-panel p-2 bg-slate-900/90 border border-slate-800 rounded-xl text-slate-300 hover:text-cyan-400 backdrop-blur-md shadow-lg flex items-center gap-1 text-[10px] font-mono active:scale-95"
          title="Focus Command HQ"
        >
          <Building2 className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">HQ CITADEL</span>
        </button>
        <button
          onClick={() => cameraFocusRef.current('silo')}
          className="hud-panel p-2 bg-slate-900/90 border border-slate-800 rounded-xl text-slate-300 hover:text-rose-400 backdrop-blur-md shadow-lg flex items-center gap-1 text-[10px] font-mono active:scale-95"
          title="Focus Missile Silo"
        >
          <Rocket className="w-3.5 h-3.5 text-rose-400" />
          <span className="hidden sm:inline">LAUNCH SILO</span>
        </button>
        <button
          onClick={() => cameraFocusRef.current('target')}
          className="hud-panel p-2 bg-slate-900/90 border border-slate-800 rounded-xl text-slate-300 hover:text-amber-400 backdrop-blur-md shadow-lg flex items-center gap-1 text-[10px] font-mono active:scale-95"
          title="Focus Enemy Target"
        >
          <Target className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">TARGET ZONE</span>
        </button>
        <button
          onClick={() => cameraFocusRef.current('reset')}
          className="hud-panel p-2 bg-slate-900/90 border border-slate-800 rounded-xl text-slate-300 hover:text-white backdrop-blur-md shadow-lg flex items-center gap-1 text-[10px] font-mono active:scale-95"
          title="Reset Camera Angle"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden sm:inline">RESET CAM</span>
        </button>
      </div>

      {/* BOTTOM CONTROLS BAR: GLASSMORPHISM INTERFACE WITH TACTICAL COUNTERMEASURES */}
      <div className="absolute bottom-3 left-2 right-2 flex justify-center items-center pointer-events-none z-20">
        <div className="hud-panel flex flex-wrap justify-center items-center gap-1.5 sm:gap-2 pointer-events-auto bg-slate-900/94 border border-slate-800 rounded-2xl px-2.5 py-2 backdrop-blur-xl shadow-2xl animate-slide-up-fade max-w-full overflow-x-auto">
          {/* 1. Camera Reset */}
          <button
            onClick={() => cameraFocusRef.current('reset')}
            className="py-1.5 px-2.5 rounded-xl font-mono text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1 active:scale-95"
            title="Reset Camera View"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">CAMERA</span> RESET
          </button>

          {/* 2. Satellite Intel */}
          <button
            onClick={() => setIsSatelliteMapMode(!isSatelliteMapMode)}
            className={`py-1.5 px-2.5 rounded-xl font-mono text-[11px] font-bold flex items-center gap-1 transition-all ${
              isSatelliteMapMode
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(0,240,255,0.5)]'
                : 'bg-slate-800 hover:bg-slate-700 text-cyan-400'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{isSatelliteMapMode ? 'METROPOLIS' : 'SATELLITE INTEL'}</span>
          </button>

          {/* 3. Launch Decoy */}
          <button
            onClick={() => launchDecoyRef.current()}
            disabled={decoyStock <= 0}
            className={`py-1.5 px-2.5 rounded-xl font-mono text-[11px] font-bold flex items-center gap-1 transition-all ${
              decoyStock <= 0
                ? 'bg-slate-800/60 text-slate-500 cursor-not-allowed'
                : 'bg-amber-600/30 border border-amber-500/60 hover:bg-amber-500/40 text-amber-300 active:scale-95'
            }`}
            title="Launch Radar Decoy to draw hostile SAM fire"
          >
            <Radio className="w-3.5 h-3.5 text-amber-400" />
            <span>LAUNCH DECOY ({decoyStock})</span>
          </button>

          {/* 4. Electronic Jamming (EW Pod) */}
          <button
            onClick={() => activateJammingRef.current()}
            disabled={jammingActive || jammingCooldown > 0}
            className={`py-1.5 px-2.5 rounded-xl font-mono text-[11px] font-bold flex items-center gap-1 transition-all ${
              jammingActive
                ? 'bg-emerald-500 text-slate-950 shadow-[0_0_18px_rgba(16,185,129,0.7)] animate-pulse'
                : jammingCooldown > 0
                ? 'bg-slate-800/60 text-slate-500 cursor-not-allowed'
                : 'bg-purple-900/50 border border-purple-500/60 hover:bg-purple-800/50 text-purple-300 active:scale-95'
            }`}
            title="Deploy Electronic Jamming pod to blind enemy early warning radar domes"
          >
            <Radio className="w-3.5 h-3.5 text-purple-400" />
            <span>
              {jammingActive
                ? `JAMMING (${jammingTimeLeft}s)`
                : jammingCooldown > 0
                ? `EW COOLDOWN (${jammingCooldown}s)`
                : 'JAM RADAR (EW)'}
            </span>
          </button>

          {/* 5. Auto-Defense Toggle */}
          <button
            onClick={() => setAutoDefenseActive(!autoDefenseActive)}
            className={`py-1.5 px-2.5 rounded-xl font-mono text-[11px] font-bold flex items-center gap-1 transition-all ${
              autoDefenseActive
                ? 'bg-cyan-600/90 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>AUTO-DEFENSE [{autoDefenseActive ? 'ON' : 'OFF'}]</span>
          </button>

          {/* 6. Deploy Base Toggle */}
          <button
            onClick={() => setShowDeployDrawer(!showDeployDrawer)}
            className="py-1.5 px-2.5 rounded-xl font-mono text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-amber-400 flex items-center gap-1 active:scale-95"
          >
            <Hammer className="w-3.5 h-3.5" />
            <span>DEPLOY ({deployQuota})</span>
          </button>

          {/* 7. Execute Strike */}
          <button
            onClick={() => {
              if (currentTarget && !currentTarget.destroyed && icbmStock > 0) {
                launchICBMRef.current();
              } else {
                setShowIntelCard(true);
              }
            }}
            className="py-1.5 px-3 bg-gradient-to-r from-rose-600 to-red-600 hover:brightness-110 active:scale-95 rounded-xl font-mono text-[11px] font-bold text-white shadow-lg flex items-center gap-1"
          >
            <Rocket className="w-3.5 h-3.5" />
            <span>EXECUTE BALLISTIC STRIKE</span>
          </button>
        </div>
      </div>

      {/* GAME OVER MODAL */}
      {isGameOver && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-rose-600 rounded-2xl p-6 max-w-md w-full text-center space-y-4 shadow-2xl animate-modal-pop">
            <div className="w-12 h-12 bg-rose-600/20 text-rose-500 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-rose-500 font-mono">METROPOLIS DESTROYED - DEFCON 1</h2>
            <p className="text-xs text-slate-300 font-mono">
              Urban core integrity collapsed under strategic missile bombardment. Friendly command authority disrupted.
            </p>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-mono text-slate-300">
              <div>WARHEADS INTERCEPTED: <span className="text-cyan-400 font-bold">{interceptedCount}</span></div>
              <div>FINAL STRATEGIC SCORE: <span className="text-emerald-400 font-bold">{score}</span></div>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 rounded-xl font-mono font-bold text-sm text-white shadow-lg active:scale-95"
            >
              RESTART WARFARE SIMULATION
            </button>
          </div>
        </div>
      )}

      {/* VICTORY MODAL */}
      {isVictory && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-emerald-500 rounded-2xl p-6 max-w-md w-full text-center space-y-4 shadow-2xl animate-modal-pop">
            <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-emerald-400 font-mono">SOVEREIGN AIRSPACE DEFENDED</h2>
            <p className="text-xs text-slate-300 font-mono">
              All five strategic waves neutralized. Neutral Mediator nations establish permanent peacekeeping treaty.
            </p>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-mono text-slate-300">
              <div>CITY INTEGRITY PRESERVED: <span className="text-cyan-400 font-bold">{cityIntegrity}%</span></div>
              <div>WARHEADS INTERCEPTED: <span className="text-cyan-400 font-bold">{interceptedCount}</span></div>
              <div>FINAL DEFENSE SCORE: <span className="text-emerald-400 font-bold">{score}</span></div>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-mono font-bold text-sm text-white shadow-lg active:scale-95"
            >
              PLAY AGAIN
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
