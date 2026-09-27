import type * as THREE from 'three';

export type AssetType = 'airbase' | 'radar' | 'silo' | 'bunker' | 'sam' | 'naval' | 'stealth_hangar';

export type FactionId = 'ALPHA' | 'BETA' | 'NEUTRAL';

export type AssetCategory =
  | 'TIER-1 SUPERPOWER AIRBASE'
  | 'HYPERSONIC SILO COMPLEX'
  | 'STEALTH BOMBER HANGAR'
  | 'HEAVY RADAR ARRAY'
  | 'ANTI-BALLISTIC SAM BATTERY'
  | 'COMMAND BUNKERS'
  | 'NAVAL SSBN BASTION';

export interface NeutralMediator {
  id: string;
  name: string;
  zone: string;
  bufferType: string;
  ambassador: string;
  status: 'STABLE' | 'MEDIATING' | 'BROKERING' | 'CEASEFIRE_PROPOSED' | 'TREATY_ACTIVE';
  proposalText: string;
  reparationAid: number;
  restockSAMs: number;
  restockICBMs: number;
}

export interface EnemyAsset {
  id: number;
  name: string;
  code: string;
  category: AssetCategory;
  type: AssetType;
  coords: string;
  health: number;
  threatLevel: 'MODERATE' | 'HIGH' | 'SEVERE' | 'CRITICAL';
  readiness: string;
  radarSpecs: string;
  interceptorStock: number;
  payloadType: string;
  briefing: string;
  height: number;
  color: string;
  destroyed: boolean;
  absPos: THREE.Vector3;
  topPos: THREE.Vector3;
  interceptionProb: number; // e.g. 88%
  stealthLevel: 'STANDARD' | 'HIGH' | 'EXTREME';
  radarCoverage: number;
  mesh?: THREE.Mesh;
}

export type BaseType = 'silo' | 'sam' | 'laser' | 'radar';

export interface FriendlyBase {
  id: number;
  type: BaseType;
  name: string;
  pos: THREE.Vector3;
  ready: boolean;
  builtByUser: boolean;
  doorLeft?: THREE.Mesh;
  doorRight?: THREE.Mesh;
  strobeLight?: THREE.PointLight;
  launcherMesh?: THREE.Mesh;
  turretHead?: THREE.Mesh;
  radarDish?: THREE.Mesh;
}

export type WarheadMunitionType = 'icbm' | 'mirv' | 'hypersonic' | 'cruise' | 'decoy';

export interface ActiveWarhead {
  id: number;
  type: WarheadMunitionType;
  group: THREE.Group;
  vel: THREE.Vector3;
  targetPos: THREE.Vector3;
  life: number;
  speed: number;
  isDecoy?: boolean;
  isLowAltitude?: boolean;
  hasSplit?: boolean;
  plasmaGlow?: THREE.Mesh;
  smokeTimer?: number;
}

export interface ActiveSAM {
  id: number;
  group: THREE.Group;
  dest: THREE.Vector3;
  speed: number;
  life: number;
  isEnemySAM?: boolean;
  targetMunition?: any;
  smokeTimer?: number;
}

export interface ActiveLaserBeam {
  line: THREE.Line;
  start: THREE.Vector3;
  end: THREE.Vector3;
  life: number;
  maxLife: number;
}

export interface ActiveICBM {
  id: number;
  group: THREE.Group;
  silo: FriendlyBase;
  targetAsset: EnemyAsset;
  state: 'IGNITING' | 'TRANSIT' | 'MIRV_SPLIT' | 'IMPACTING';
  progress: number;
  startPos: THREE.Vector3;
  isDecoy?: boolean;
  subWarheads?: THREE.Mesh[];
}

export interface StealthBomber {
  mesh: THREE.Group;
  startPos: THREE.Vector3;
  endPos: THREE.Vector3;
  progress: number;
  speed: number;
  active: boolean;
  hasDropped: boolean;
  health: number;
}

export interface DebrisFragment {
  mesh: THREE.Mesh;
  vel: THREE.Vector3;
  rotVel: THREE.Vector3;
  life: number;
  maxLife: number;
  bounces: number;
}

export interface ImpactCrater {
  mesh: THREE.Mesh;
  pos: THREE.Vector3;
  radius: number;
  heat: number;
}

export interface Particle {
  mesh: THREE.Mesh;
  vel: THREE.Vector3;
  life: number;
  maxLife: number;
  scaleSpeed?: number;
  colorType?: 'fire' | 'smoke' | 'spark' | 'plasma';
}

export interface Shockwave {
  mesh: THREE.Mesh;
  scale: number;
  opacity: number;
  maxScale: number;
}

export type CombatPhase = 'PREPARATION' | 'WAVE_ACTIVE' | 'CEASEFIRE_RATIFIED' | 'VICTORY' | 'DEFEAT';

export interface WaveInfo {
  waveNumber: number;
  name: string;
  defcon: 1 | 2 | 3 | 4 | 5;
  munitionType: WarheadMunitionType;
  warheadCount: number;
  speed: number;
  hasStealthBomber?: boolean;
  briefing: string;
}

