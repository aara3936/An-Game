//! ECS Components for the Anti-Ballistic & Retaliatory Engine (120 FPS Deterministic Simulation Loop)
//! Features Throne Thriller 1 Early Warning Radar, VS-90 Retaliation Protocol, Intercept S-5 Mach 15 Defense, and 3-Stage Structural Destruction

use glam::{Vec3, Vec4};
use serde::{Deserialize, Serialize};

/// 3-Stage Structural Chemistry State for Skyscraper Meshes
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum DamageState {
    /// State 1: Pristine architectural mesh with illuminated windows (> 75% health)
    Pristine,
    /// State 2: Carbonized scorched facade with rising smoke plumes (25% - 75% health)
    Charred,
    /// State 3: Collapsed structural rubble and persistent inferno plumes (0% health)
    Rubble,
}

/// Building Component representing city infrastructure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Building {
    pub id: u32,
    pub position: Vec3,
    pub size: Vec3,
    pub health: f32,
    pub max_health: f32,
    pub state: DamageState,
    pub is_enemy: bool,
    pub has_smoke_emitter: bool,
    pub smoke_timer: f32,
    pub scorch_level: f32,
}

impl Building {
    pub fn new(id: u32, x: f32, z: f32, width: f32, height: f32, is_enemy: bool) -> Self {
        Self {
            id,
            position: Vec3::new(x, height / 2.0, z),
            size: Vec3::new(width, height, width),
            health: 100.0,
            max_health: 100.0,
            state: DamageState::Pristine,
            is_enemy,
            has_smoke_emitter: false,
            smoke_timer: 0.0,
            scorch_level: 0.0,
        }
    }

    /// Apply damage and transition structural chemistry states
    pub fn apply_damage(&mut self, dmg: f32) -> DamageState {
        self.health = (self.health - dmg).max(0.0);
        self.scorch_level = (1.0 - (self.health / self.max_health)).clamp(0.0, 1.0);
        if self.health <= 0.0 {
            self.state = DamageState::Rubble;
            self.has_smoke_emitter = true;
        } else if self.health <= 75.0 {
            self.state = DamageState::Charred;
            self.has_smoke_emitter = true;
        }
        self.state
    }
}

/// Platform type for launch silos, radar arrays, and mobile pads
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum LaunchPlatformType {
    Silo,
    Submarine,
    Airbase,
    SAMOutpost,
    CIWSTurret,
    ThroneThrillerRadar,
    VS90HeavySilo,
    InterceptS5Battery,
}

/// Silo Launcher Component managing missile readiness and cooldown cycles
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SiloLauncher {
    pub id: u32,
    pub position: Vec3,
    pub platform_type: LaunchPlatformType,
    pub reload_timer: f32,
    pub reload_duration: f32,
    pub is_ready: bool,
    pub is_player: bool,
    pub is_destroyed: bool,
    pub hatch_opening: f32,
}

impl SiloLauncher {
    pub fn new(id: u32, position: Vec3, platform_type: LaunchPlatformType, is_player: bool) -> Self {
        Self {
            id,
            position,
            platform_type,
            reload_timer: 0.0,
            reload_duration: match platform_type {
                LaunchPlatformType::Silo => 8.0,
                LaunchPlatformType::Submarine => 6.0,
                LaunchPlatformType::Airbase => 5.0,
                LaunchPlatformType::SAMOutpost => 2.5,
                LaunchPlatformType::CIWSTurret => 0.15,
                LaunchPlatformType::ThroneThrillerRadar => 1.0,
                LaunchPlatformType::VS90HeavySilo => 12.0,
                LaunchPlatformType::InterceptS5Battery => 3.0,
            },
            is_ready: true,
            is_player,
            is_destroyed: false,
            hatch_opening: 0.0,
        }
    }

    pub fn trigger_launch(&mut self) -> bool {
        if self.is_ready && !self.is_destroyed {
            self.is_ready = false;
            self.reload_timer = self.reload_duration;
            self.hatch_opening = 1.0;
            true
        } else {
            false
        }
    }

    pub fn update(&mut self, dt: f32) {
        if !self.is_ready && !self.is_destroyed {
            self.reload_timer = (self.reload_timer - dt).max(0.0);
            if self.reload_timer <= 0.0 {
                self.is_ready = true;
                self.hatch_opening = 0.0;
            } else {
                self.hatch_opening = (self.reload_timer / 1.5).clamp(0.0, 1.0);
            }
        }
    }
}

/// Threat Munition Classification for Early Warning Radar
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ThreatClassification {
    CruiseMissile,
    LowAltitudeDrone,
    SaturationRocket,
    AtomicICBM,
    HypersonicGlideVehicle,
    DecoyDrone,
    ThermalFlare,
    InterceptS5Mach15,
}

/// Projectile Trajectory Types
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum TrajectoryType {
    ParabolicBezier,
    DirectHypersonic,
    LowAltitudeCruise,
    AtomicICBM,
    SAMInterceptor,
    InterceptS5Mach15,
    DirectedLaserBeam,
    DecoyDrone,
    ThermalFlare,
}

/// Projectile Component modeling in-flight munitions with sub-frame lerp interpolation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Projectile {
    pub id: u32,
    pub origin: Vec3,
    pub target: Vec3,
    /// Position at previous physics tick (for sub-frame interpolation)
    pub previous_position: Vec3,
    /// Current physics position
    pub current_position: Vec3,
    pub velocity: Vec3,
    pub progress: f32,
    pub duration: f32,
    pub peak_altitude: f32,
    pub damage: f32,
    pub blast_radius: f32,
    pub is_nuclear: bool,
    pub is_hypersonic: bool,
    pub is_player: bool,
    pub is_active: bool,
    pub is_intercepted: bool,
    pub is_decoy: bool,
    pub is_flare: bool,
    pub trajectory_type: TrajectoryType,
    pub threat_class: ThreatClassification,
    pub light_color: Vec3,
    pub light_intensity: f32,
    /// Intercept target ID (for S-5 Mach-15 interceptors)
    pub locked_target_id: Option<u32>,
}

impl Projectile {
    pub fn new_icbm(id: u32, origin: Vec3, target: Vec3, is_nuclear: bool, is_player: bool) -> Self {
        Self {
            id,
            origin,
            target,
            previous_position: origin,
            current_position: origin,
            velocity: Vec3::ZERO,
            progress: 0.0,
            duration: if is_nuclear { 16.5 } else { 5.2 },
            peak_altitude: if is_nuclear { 380.0 } else { 260.0 },
            damage: if is_nuclear { 9999.0 } else { 130.0 },
            blast_radius: if is_nuclear { 360.0 } else { 55.0 },
            is_nuclear,
            is_hypersonic: is_nuclear,
            is_player,
            is_active: true,
            is_intercepted: false,
            is_decoy: false,
            is_flare: false,
            trajectory_type: if is_nuclear {
                TrajectoryType::AtomicICBM
            } else {
                TrajectoryType::ParabolicBezier
            },
            threat_class: if is_nuclear {
                ThreatClassification::AtomicICBM
            } else {
                ThreatClassification::SaturationRocket
            },
            light_color: if is_nuclear {
                Vec3::new(1.0, 0.2, 0.1) // Blinding nuclear crimson glow
            } else if is_player {
                Vec3::new(0.0, 0.9, 1.0) // Friendly cyan rocket glow
            } else {
                Vec3::new(1.0, 0.35, 0.0) // Hostile fiery rocket glow
            },
            light_intensity: if is_nuclear { 4.5 } else { 1.8 },
            locked_target_id: None,
        }
    }

    pub fn new_hypersonic(id: u32, origin: Vec3, target: Vec3, is_player: bool) -> Self {
        Self {
            id,
            origin,
            target,
            previous_position: origin,
            current_position: origin,
            velocity: Vec3::ZERO,
            progress: 0.0,
            duration: 8.5,
            peak_altitude: 420.0,
            damage: 8500.0,
            blast_radius: 280.0,
            is_nuclear: true,
            is_hypersonic: true,
            is_player,
            is_active: true,
            is_intercepted: false,
            is_decoy: false,
            is_flare: false,
            trajectory_type: TrajectoryType::DirectHypersonic,
            threat_class: ThreatClassification::HypersonicGlideVehicle,
            light_color: Vec3::new(1.0, 0.05, 0.35),
            light_intensity: 5.0,
            locked_target_id: None,
        }
    }

    pub fn new_decoy(id: u32, origin: Vec3, target: Vec3) -> Self {
        Self {
            id,
            origin,
            target,
            previous_position: origin,
            current_position: origin,
            velocity: Vec3::ZERO,
            progress: 0.0,
            duration: 4.5,
            peak_altitude: 170.0,
            damage: 20.0,
            blast_radius: 15.0,
            is_nuclear: false,
            is_hypersonic: false,
            is_player: false,
            is_active: true,
            is_intercepted: false,
            is_decoy: true,
            is_flare: false,
            trajectory_type: TrajectoryType::DecoyDrone,
            threat_class: ThreatClassification::DecoyDrone,
            light_color: Vec3::new(0.9, 0.4, 0.1),
            light_intensity: 1.0,
            locked_target_id: None,
        }
    }

    pub fn new_flare(id: u32, origin: Vec3, velocity: Vec3) -> Self {
        Self {
            id,
            origin,
            target: origin + velocity * 2.0,
            previous_position: origin,
            current_position: origin,
            velocity,
            progress: 0.0,
            duration: 2.2,
            peak_altitude: origin.y + 10.0,
            damage: 0.0,
            blast_radius: 5.0,
            is_nuclear: false,
            is_hypersonic: false,
            is_player: false,
            is_active: true,
            is_intercepted: false,
            is_decoy: true,
            is_flare: true,
            trajectory_type: TrajectoryType::ThermalFlare,
            threat_class: ThreatClassification::ThermalFlare,
            light_color: Vec3::new(1.0, 0.8, 0.2),
            light_intensity: 3.5,
            locked_target_id: None,
        }
    }

    /// Mach 15 Hyper-Velocity Anti-Nuke Interceptor (Intercept S-5)
    pub fn new_intercept_s5(id: u32, origin: Vec3, target_id: u32, target_pos: Vec3) -> Self {
        let initial_dir = (target_pos - origin).normalize();
        let mach_15_speed = 520.0; // In-simulation unit speed representing Mach 15 (~5,100 m/s scaled)
        let estimated_time = (target_pos.distance(origin) / mach_15_speed).clamp(0.8, 3.5);

        Self {
            id,
            origin,
            target: target_pos,
            previous_position: origin,
            current_position: origin,
            velocity: initial_dir * mach_15_speed,
            progress: 0.0,
            duration: estimated_time,
            peak_altitude: target_pos.y.max(180.0) + 40.0,
            damage: 500.0,
            blast_radius: 65.0,
            is_nuclear: false,
            is_hypersonic: true,
            is_player: true,
            is_active: true,
            is_intercepted: false,
            is_decoy: false,
            is_flare: false,
            trajectory_type: TrajectoryType::InterceptS5Mach15,
            threat_class: ThreatClassification::InterceptS5Mach15,
            light_color: Vec3::new(0.0, 0.95, 1.0), // Hyper-velocity electric cyan glow
            light_intensity: 4.8,
            locked_target_id: Some(target_id),
        }
    }

    /// Sub-frame lerp interpolation for zero micro-stuttering rendering at 120 FPS
    pub fn interpolated_position(&self, alpha: f32) -> Vec3 {
        self.previous_position.lerp(self.current_position, alpha.clamp(0.0, 1.0))
    }
}

/// Particle Types for VFX Engine
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ParticleType {
    Smoke,
    Fire,
    FalloutDebris,
    ShockwaveRing,
    ConcreteShatter,
    CIWSTracer,
    PlasmaHalo,
    Mach15ExhaustTrail,
    RadarPulseWave,
    DecoySparkle,
}

/// Particle Component for high-density zero-allocation particle simulation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Particle {
    pub position: Vec3,
    pub previous_position: Vec3,
    pub velocity: Vec3,
    pub color: Vec4,
    pub scale: f32,
    pub initial_scale: f32,
    pub age: f32,
    pub max_lifespan: f32,
    pub is_active: bool,
    pub particle_type: ParticleType,
}

impl Particle {
    pub fn default_inactive() -> Self {
        Self {
            position: Vec3::ZERO,
            previous_position: Vec3::ZERO,
            velocity: Vec3::ZERO,
            color: Vec4::ZERO,
            scale: 1.0,
            initial_scale: 1.0,
            age: 0.0,
            max_lifespan: 1.0,
            is_active: false,
            particle_type: ParticleType::Smoke,
        }
    }

    /// Interpolated position for sub-frame smoothing
    pub fn interpolated_position(&self, alpha: f32) -> Vec3 {
        self.previous_position.lerp(self.position, alpha.clamp(0.0, 1.0))
    }
}

/// Close-In Weapon System (CIWS) Gatling Turret Component
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CIWSTurret {
    pub id: u32,
    pub position: Vec3,
    pub range: f32,
    pub fire_rate: f32,
    pub cooldown: f32,
    pub is_enemy: bool,
    pub rotation_yaw: f32,
    pub rotation_pitch: f32,
    pub barrel_spin: f32,
    pub current_target: Option<Vec3>,
}

impl CIWSTurret {
    pub fn new(id: u32, position: Vec3, is_enemy: bool) -> Self {
        Self {
            id,
            position,
            range: 220.0,
            fire_rate: 0.12,
            cooldown: 0.0,
            is_enemy,
            rotation_yaw: 0.0,
            rotation_pitch: 0.0,
            barrel_spin: 0.0,
            current_target: None,
        }
    }
}

/// Multi-Pin Target Lock Component
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TargetPin {
    pub pin_id: u32,
    pub coords: Vec3,
    pub is_active: bool,
    pub pulse_timer: f32,
}

/// Dynamic Point Light Source attached to moving munitions, CIWS bursts, or fires
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DynamicPointLight {
    pub position: Vec3,
    pub color: Vec3,
    pub intensity: f32,
    pub radius: f32,
    pub decay: f32,
}

// ============================================================================
// 1. THRONE THRILLER 1: GLOBAL RADAR & EARLY WARNING NETWORK
// ============================================================================

/// Throne Thriller 1 Component
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThroneThrillerRadar {
    pub position: Vec3,
    pub max_range: f32,
    pub rotation_angle: f32,
    pub scan_rate: f32,
    pub is_online: bool,
    pub nuclear_threat_count: usize,
    pub conventional_threat_count: usize,
    pub total_tracked: usize,
}

impl ThroneThrillerRadar {
    pub fn new(position: Vec3) -> Self {
        Self {
            position,
            max_range: 1200.0, // Global battlefield coverage
            rotation_angle: 0.0,
            scan_rate: 3.14159 * 2.0, // 360 degrees per second
            is_online: true,
            nuclear_threat_count: 0,
            conventional_threat_count: 0,
            total_tracked: 0,
        }
    }

    pub fn update(&mut self, dt: f32) {
        if self.is_online {
            self.rotation_angle = (self.rotation_angle + self.scan_rate * dt) % (std::f32::consts::PI * 2.0);
        }
    }
}

/// Early Warning Target Information with Dynamic Time-To-Impact (TTI)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EarlyWarningTargetInfo {
    pub projectile_id: u32,
    pub threat_class: ThreatClassification,
    pub current_pos: Vec3,
    pub velocity: Vec3,
    pub predicted_impact: Vec3,
    pub tti_seconds: f32,
    pub altitude: f32,
    pub is_nuclear_hypersonic: bool,
    pub is_spoofed: bool,
    pub interceptor_assigned: bool,
}

// ============================================================================
// 2. VS-90 PROTOCOL: PRE-EMPTIVE FULL SALVO RETALIATION
// ============================================================================

/// VS-90 Heavy Salvo Launcher Silo & Protocol Manager
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VS90Protocol {
    pub position: Vec3,
    pub is_primed: bool,
    pub countdown_active: bool,
    pub countdown_timer: f32, // 5.0 seconds countdown upon detection
    pub total_stock: u32,
    pub max_stock: u32,
    pub salvo_dump_count: u32,
    pub has_retaliated: bool,
    pub silo_doors_open: f32,
    pub status_text: String,
}

impl VS90Protocol {
    pub fn new(position: Vec3) -> Self {
        Self {
            position,
            is_primed: false,
            countdown_active: false,
            countdown_timer: 5.0,
            total_stock: 48,
            max_stock: 48,
            salvo_dump_count: 0,
            has_retaliated: false,
            silo_doors_open: 0.0,
            status_text: "STANDBY // ARMED".to_string(),
        }
    }

    /// Prime the protocol upon confirmation of Nuclear / Hypersonic launch
    pub fn prime(&mut self) {
        if !self.countdown_active && !self.has_retaliated {
            self.countdown_active = true;
            self.is_primed = true;
            self.countdown_timer = 5.0;
            self.status_text = "COUNTDOWN: 5.0s // NUCLEAR PRE-EMPTION".to_string();
        }
    }

    pub fn update(&mut self, dt: f32) -> bool {
        if self.countdown_active && !self.has_retaliated {
            self.silo_doors_open = (self.silo_doors_open + dt * 0.8).min(1.0);
            self.countdown_timer -= dt;
            if self.countdown_timer <= 0.0 {
                self.countdown_active = false;
                self.has_retaliated = true;
                self.status_text = "SALVO DISPATCHED // DUMPING STOCKS".to_string();
                return true; // Trigger full retaliation!
            } else {
                self.status_text = format!("PRE-EMPTIVE SALVO IN {:.1}s", self.countdown_timer);
            }
        }
        false
    }
}

// ============================================================================
// 3. INTERCEPT S-5: MACH 15 HYPER-VELOCITY ANTI-NUKE DEFENSE
// ============================================================================

/// Intercept S-5 Battery Platform
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InterceptS5Battery {
    pub id: u32,
    pub position: Vec3,
    pub ammo_count: u32,
    pub max_ammo: u32,
    pub mach_velocity: f32, // Mach 15 (~520 units/s)
    pub proportional_nav_gain: f32, // N = 4.0
    pub cooldown: f32,
    pub max_altitude_limit: f32, // Exo-atmosphere neutralization up to 500 units
    pub min_altitude_limit: f32, // High-altitude minimum 120 units
    pub active_interceptors: u32,
    pub azimuth: f32,
    pub elevation: f32,
}

impl InterceptS5Battery {
    pub fn new(id: u32, position: Vec3) -> Self {
        Self {
            id,
            position,
            ammo_count: 18,
            max_ammo: 18,
            mach_velocity: 520.0,
            proportional_nav_gain: 4.0,
            cooldown: 0.0,
            max_altitude_limit: 480.0,
            min_altitude_limit: 110.0,
            active_interceptors: 0,
            azimuth: 0.0,
            elevation: 0.785, // 45 degrees
        }
    }

    pub fn update(&mut self, dt: f32) {
        if self.cooldown > 0.0 {
            self.cooldown = (self.cooldown - dt).max(0.0);
        }
    }

    pub fn can_fire(&self) -> bool {
        self.ammo_count > 0 && self.cooldown <= 0.0
    }

    pub fn consume_ammo(&mut self) -> bool {
        if self.can_fire() {
            self.ammo_count -= 1;
            self.cooldown = 1.2;
            true
        } else {
            false
        }
    }
}

// ============================================================================
// 4. DEFENSIVE GRID METRICS & REAL-TIME STATUS BAR DATA
// ============================================================================

/// Real-time Defensive Grid Status Bar Metric Data
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DefensiveGridMetrics {
    pub s5_remaining_ammo: u32,
    pub s5_max_ammo: u32,
    pub vs90_stock: u32,
    pub vs90_countdown: f32,
    pub vs90_active: bool,
    pub battery_charge_pct: f32,
    pub radar_coverage_pct: f32,
    pub defcon_threat_state: u32,
    pub active_exo_intercepts: u32,
    pub ciws_readiness_pct: f32,
}
