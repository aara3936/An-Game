//! ECS Components for the 3D Warfare Simulator Engine

use glam::{Vec3, Vec4};
use serde::{Deserialize, Serialize};

/// 3-Stage Structural Chemistry State for Skyscraper Meshes
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum DamageState {
    /// State 1: Pristine architectural mesh with illuminated windows
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
        }
    }

    pub fn apply_damage(&mut self, dmg: f32) -> DamageState {
        self.health = (self.health - dmg).max(0.0);
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

/// Platform type for launch silos and mobile pads
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum LaunchPlatformType {
    Silo,
    Submarine,
    Airbase,
    SAMOutpost,
    CIWSTurret,
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
            }
        }
    }
}

/// Projectile Trajectory Types
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum TrajectoryType {
    ParabolicBezier,
    DirectHypersonic,
    LowAltitudeCruise,
    AtomicICBM,
    SAMInterceptor,
    DirectedLaserBeam,
    DecoyDrone,
}

/// Projectile Component modeling in-flight munitions
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Projectile {
    pub id: u32,
    pub origin: Vec3,
    pub target: Vec3,
    pub current_position: Vec3,
    pub velocity: Vec3,
    pub progress: f32,
    pub duration: f32,
    pub peak_altitude: f32,
    pub damage: f32,
    pub blast_radius: f32,
    pub is_nuclear: bool,
    pub is_player: bool,
    pub is_active: bool,
    pub is_intercepted: bool,
    pub trajectory_type: TrajectoryType,
}

impl Projectile {
    pub fn new_icbm(id: u32, origin: Vec3, target: Vec3, is_nuclear: bool, is_player: bool) -> Self {
        let dist = origin.distance(target);
        Self {
            id,
            origin,
            target,
            current_position: origin,
            velocity: Vec3::ZERO,
            progress: 0.0,
            duration: if is_nuclear { 18.0 } else { 5.2 },
            peak_altitude: if is_nuclear { 360.0 } else { 260.0 },
            damage: if is_nuclear { 9999.0 } else { 130.0 },
            blast_radius: if is_nuclear { 350.0 } else { 55.0 },
            is_nuclear,
            is_player,
            is_active: true,
            is_intercepted: false,
            trajectory_type: if is_nuclear { TrajectoryType::AtomicICBM } else { TrajectoryType::ParabolicBezier },
        }
    }

    pub fn compute_position(&self, t: f32) -> Vec3 {
        let t_clamped = t.clamp(0.0, 1.0);
        let linear = self.origin.lerp(self.target, t_clamped);
        let arc_height = (t_clamped * std::f32::consts::PI).sin() * self.peak_altitude;
        Vec3::new(linear.x, linear.y + arc_height, linear.z)
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
}

/// Particle Component for zero-allocation particle simulation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Particle {
    pub position: Vec3,
    pub velocity: Vec3,
    pub color: Vec4,
    pub scale: f32,
    pub age: f32,
    pub max_lifespan: f32,
    pub is_active: bool,
    pub particle_type: ParticleType,
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
            range: 180.0,
            fire_rate: 0.14,
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
}
