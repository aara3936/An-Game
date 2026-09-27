//! High-Fidelity 3D Warfare Simulation Engine (Rust + WebAssembly / wasm-bindgen)

pub mod ai_brain;
pub mod audio_system;
pub mod components;
pub mod physics_systems;
pub mod profiler;
pub mod radar_systems;
pub mod shaders;

use ai_brain::{AIState, EnemyAIBrain};
use audio_system::{SoundEffect, WasmAudioEngine};
use components::{Building, CIWSTurret, LaunchPlatformType, Particle, Projectile, SiloLauncher};
use glam::Vec3;
use physics_systems::{execute_direct_impact, execute_nuclear_airburst, update_ciws_turrets, update_projectiles};
use profiler::{DynamicHardwareProfiler, HardwareTier};
use radar_systems::{MultiPinTargetManager, RadarTransform};
use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

/// Serialized Telemetry Snapshot exported each frame to WebGL / HUD viewport
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EngineTelemetrySnapshot {
    pub player_city_integrity: f32,
    pub enemy_city_integrity: f32,
    pub ai_state: String,
    pub diplomatic_stance: String,
    pub defcon_level: u32,
    pub active_threats: usize,
    pub active_player_missiles: usize,
    pub total_intercepts: u32,
    pub score: u64,
    pub pinned_targets_count: usize,
    pub hardware_tier: String,
    pub average_fps: f32,
    pub frame_time_ms: f32,
    pub notifications: Vec<String>,
}

/// Core Production-Grade Game Engine Simulation State
#[wasm_bindgen]
pub struct WasmWarfareSimulation {
    buildings: Vec<Building>,
    enemy_buildings: Vec<Building>,
    silos: Vec<SiloLauncher>,
    projectiles: Vec<Projectile>,
    particles: Vec<Particle>,
    ciws_turrets: Vec<CIWSTurret>,
    ai_brain: EnemyAIBrain,
    pin_manager: MultiPinTargetManager,
    radar: RadarTransform,
    profiler: DynamicHardwareProfiler,
    audio: WasmAudioEngine,
    score: u64,
    intercepts: u32,
    next_projectile_id: u32,
}

#[wasm_bindgen]
impl WasmWarfareSimulation {
    /// Initialize a new Rust simulation instance with 100+ cityscape buildings, 12-layer defense grid, and hardware profiler
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        let mut buildings = Vec::with_capacity(140);
        let mut enemy_buildings = Vec::with_capacity(120);
        let mut silos = Vec::with_capacity(16);
        let mut ciws_turrets = Vec::with_capacity(4);

        // Populate Player City Grid Buildings (120+ Skyscrapers)
        let mut b_id = 0;
        for x in (-170..=170).step_by(24) {
            for z in (-170..=170).step_by(24) {
                if x.abs() < 30 && z.abs() < 30 {
                    continue; // Central Citadel Plaza
                }
                let height = 28.0 + ((b_id * 19) % 85) as f32;
                buildings.push(Building::new(b_id, x as f32, z as f32, 14.0, height, false));
                b_id += 1;
            }
        }

        // Populate Enemy Metropolis Grid Buildings (100+ Hostile Skyscrapers)
        let mut eb_id = 1000;
        for ex in (590..=850).step_by(24) {
            for ez in (-850..=-590).step_by(24) {
                if (ex - 720).abs() < 28 && (ez - (-720)).abs() < 28 {
                    continue; // Enemy Command Citadel
                }
                let height = 32.0 + ((eb_id * 17) % 95) as f32;
                enemy_buildings.push(Building::new(eb_id, ex as f32, ez as f32, 14.0, height, true));
                eb_id += 1;
            }
        }

        // Populate Player Armored Silos & Submarines
        silos.push(SiloLauncher::new(0, Vec3::new(-20.0, 0.0, -20.0), LaunchPlatformType::Silo, true));
        silos.push(SiloLauncher::new(1, Vec3::new(20.0, 0.0, -20.0), LaunchPlatformType::Silo, true));
        silos.push(SiloLauncher::new(2, Vec3::new(-20.0, 0.0, 20.0), LaunchPlatformType::Silo, true));
        silos.push(SiloLauncher::new(3, Vec3::new(20.0, 0.0, 20.0), LaunchPlatformType::Silo, true));
        silos.push(SiloLauncher::new(4, Vec3::new(225.0, 0.0, -165.0), LaunchPlatformType::Submarine, true));
        silos.push(SiloLauncher::new(5, Vec3::new(-225.0, 0.0, 165.0), LaunchPlatformType::Submarine, true));

        // Populate CIWS Gatling Turrets
        ciws_turrets.push(CIWSTurret::new(0, Vec3::new(-25.0, 0.0, 25.0), false));
        ciws_turrets.push(CIWSTurret::new(1, Vec3::new(25.0, 0.0, -25.0), false));
        ciws_turrets.push(CIWSTurret::new(2, Vec3::new(700.0, 0.0, -700.0), true));
        ciws_turrets.push(CIWSTurret::new(3, Vec3::new(740.0, 0.0, -740.0), true));

        Self {
            buildings,
            enemy_buildings,
            silos,
            projectiles: Vec::with_capacity(128),
            particles: Vec::with_capacity(2000),
            ciws_turrets,
            ai_brain: EnemyAIBrain::new(),
            pin_manager: MultiPinTargetManager::new(),
            radar: RadarTransform::default(),
            profiler: DynamicHardwareProfiler::new(),
            audio: WasmAudioEngine::new(),
            score: 0,
            intercepts: 0,
            next_projectile_id: 1,
        }
    }

    /// Advance the simulation by delta time (dt in seconds) and return JSON telemetry snapshot
    pub fn tick(&mut self, dt: f32) -> String {
        // 1. Dynamic Hardware Profiling & Adaptive Scaling
        self.profiler.record_frame_delta(dt);
        self.audio.update(dt);

        // 2. Update Silos Reload Progress
        for s in self.silos.iter_mut() {
            s.update(dt);
        }

        // 3. Update Projectile Bezier Flight Physics
        let impacts = update_projectiles(&mut self.projectiles, dt);
        for (_id, pos, is_nuclear) in impacts {
            if is_nuclear {
                execute_direct_impact(pos, 340.0, true, &mut self.buildings, &mut self.particles);
                self.audio.play_sound(SoundEffect::DirectImpactHeavy);
            } else {
                execute_direct_impact(pos, 45.0, false, &mut self.buildings, &mut self.particles);
                execute_direct_impact(pos, 45.0, false, &mut self.enemy_buildings, &mut self.particles);
                self.audio.play_sound(SoundEffect::DirectImpactLight);
            }
        }

        // 4. Update CIWS Automated Gatling Defense Interceptions
        let ciws_hits = update_ciws_turrets(&mut self.ciws_turrets, &mut self.projectiles, &mut self.particles, dt);
        if ciws_hits > 0 {
            self.intercepts += ciws_hits;
            self.score += (ciws_hits as u64) * 200;
            self.audio.play_sound(SoundEffect::CIWSGatlingBurst);
        }

        // 5. Update Particle Physics with adaptive pool limits
        let pool_limit = self.profiler.particle_pool_capacity;
        if self.particles.len() > pool_limit {
            self.particles.truncate(pool_limit);
        }

        for p in self.particles.iter_mut() {
            if p.is_active {
                p.age += dt;
                p.position += p.velocity * dt;
                if p.age >= p.max_lifespan {
                    p.is_active = false;
                }
            }
        }

        // 6. Compute Enemy & Player City Health Ratios
        let player_health = self.get_city_integrity();
        let enemy_health = self.get_enemy_integrity();
        let enemy_ratio = enemy_health / 100.0;

        // 7. Update Tactical 7-State AI Brain
        self.ai_brain.update(enemy_ratio, dt);

        // 8. Generate Telemetry Snapshot
        let defcon = match self.ai_brain.state {
            AIState::DesperateNuclear => 1,
            AIState::AllOutOffensive => 1,
            AIState::TacticalCounter | AIState::DeceitSalvo => 2,
            AIState::Reconnaissance | AIState::DiplomaticSurrender => 4,
            AIState::Idle => 5,
        };

        let snapshot = EngineTelemetrySnapshot {
            player_city_integrity: player_health,
            enemy_city_integrity: enemy_health,
            ai_state: format!("{:?}", self.ai_brain.state).to_uppercase(),
            diplomatic_stance: format!("{:?}", self.ai_brain.diplomatic_stance).to_uppercase(),
            defcon_level: defcon,
            active_threats: self.projectiles.iter().filter(|p| p.is_active && !p.is_player).count(),
            active_player_missiles: self.projectiles.iter().filter(|p| p.is_active && p.is_player).count(),
            total_intercepts: self.intercepts,
            score: self.score,
            pinned_targets_count: self.pin_manager.pins.len(),
            hardware_tier: format!("{:?}", self.profiler.current_tier),
            average_fps: self.profiler.average_fps,
            frame_time_ms: self.profiler.average_frame_time_ms,
            notifications: self.ai_brain.notifications.drain(..).collect(),
        };

        serde_json::to_string(&snapshot).unwrap_or_else(|_| "{}".to_string())
    }

    /// Launch Pinpoint Strike from ready Silo or Submarine
    pub fn fire_silo(&mut self, is_submarine: bool, target_x: f32, target_z: f32) -> bool {
        let target = Vec3::new(target_x, 0.0, target_z);
        let ready_silo = self.silos.iter_mut().find(|s| {
            s.is_ready
                && !s.is_destroyed
                && (if is_submarine {
                    s.platform_type == LaunchPlatformType::Submarine
                } else {
                    s.platform_type == LaunchPlatformType::Silo
                })
        });

        if let Some(silo) = ready_silo {
            let origin = silo.position;
            silo.trigger_launch();
            let pid = self.next_projectile_id;
            self.next_projectile_id += 1;

            self.projectiles.push(Projectile::new_icbm(pid, origin, target, false, true));
            self.audio.play_sound(SoundEffect::SonicBoom);
            self.ai_brain.record_player_attack(if is_submarine { "sub_0" } else { "silo_0" }, 30.0);
            true
        } else {
            false
        }
    }

    /// Add target pin (up to 12 max)
    pub fn add_target_pin(&mut self, x: f32, z: f32) -> u32 {
        self.pin_manager.add_pin(Vec3::new(x, 0.0, z)).unwrap_or(0)
    }

    /// Clear all target pins
    pub fn clear_target_pins(&mut self) {
        self.pin_manager.clear_pins();
    }

    /// Execute Synchronized Salvo across all pinned target coordinates
    pub fn fire_multi_salvo(&mut self) -> u32 {
        let targets = self.pin_manager.get_salvo_targets();
        let mut fired = 0;

        for (idx, tgt) in targets.iter().enumerate() {
            let use_sub = idx % 2 == 1;
            if self.fire_silo(use_sub, tgt.x, tgt.z) {
                fired += 1;
            }
        }
        self.pin_manager.clear_pins();
        fired
    }

    /// High-Altitude Stratospheric Nuclear Airburst trigger
    pub fn trigger_airburst(&mut self, x: f32, y: f32, z: f32) {
        let burst_pos = Vec3::new(x, y.max(120.0), z);
        let fallout_count = match self.profiler.current_tier {
            HardwareTier::HighPerformance => 80,
            HardwareTier::Balanced => 45,
            HardwareTier::PowerSaver => 20,
        };
        execute_nuclear_airburst(burst_pos, &mut self.buildings, &mut self.particles, fallout_count);
        self.audio.play_sound(SoundEffect::StratosphericAirburst);
        self.audio.play_sound(SoundEffect::AirburstEMPMute);
        self.intercepts += 1;
        self.score += 5000;
    }

    /// Accept Ceasefire proposal from Enemy AI
    pub fn accept_ceasefire(&mut self) {
        self.ai_brain.accept_ceasefire();
        self.score += 10000;
    }

    /// Reject Ceasefire proposal (Triggers Omega Silo Atomic retaliation)
    pub fn reject_ceasefire(&mut self) {
        self.ai_brain.reject_ceasefire();
        let pid = self.next_projectile_id;
        self.next_projectile_id += 1;
        self.projectiles.push(Projectile::new_icbm(
            pid,
            Vec3::new(760.0, 0.0, -710.0),
            Vec3::ZERO,
            true,
            false,
        ));
        self.audio.play_sound(SoundEffect::NuclearEmergencySiren);
    }

    /// Returns average integrity % of Player City skyscrapers
    pub fn get_city_integrity(&self) -> f32 {
        if self.buildings.is_empty() {
            return 100.0;
        }
        let total_health: f32 = self.buildings.iter().map(|b| b.health).sum();
        total_health / (self.buildings.len() as f32)
    }

    /// Returns average integrity % of Enemy Metropolis skyscrapers
    pub fn get_enemy_integrity(&self) -> f32 {
        if self.enemy_buildings.is_empty() {
            return 100.0;
        }
        let total_health: f32 = self.enemy_buildings.iter().map(|b| b.health).sum();
        total_health / (self.enemy_buildings.len() as f32)
    }

    /// Returns current tactical AI Brain state as uppercase string
    pub fn get_ai_state(&self) -> String {
        format!("{:?}", self.ai_brain.state).to_uppercase()
    }
}
