//! High-Fidelity Anti-Ballistic & Retaliatory Simulation Engine (Rust + WebAssembly / wasm-bindgen)
//! 120 FPS Deterministic Simulation Loop • Throne Thriller 1 Early Warning Radar • VS-90 Retaliation • Intercept S-5 Mach 15

pub mod ai_brain;
pub mod android;
pub mod audio_system;
pub mod components;
pub mod physics_systems;
pub mod profiler;
pub mod radar_systems;
pub mod shaders;
pub mod weather;

use ai_brain::{AIState, EnemyAIBrain};
use audio_system::{SoundEffect, WasmAudioEngine};
use components::{
    Building, CIWSTurret, DefensiveGridMetrics, EarlyWarningTargetInfo, InterceptS5Battery,
    LaunchPlatformType, Particle, Projectile, SiloLauncher, ThroneThrillerRadar, VS90Protocol,
};
use glam::Vec3;
use physics_systems::{
    execute_direct_impact, execute_nuclear_airburst, update_ciws_turrets, update_particles_fluid,
    update_projectiles_advanced, update_throne_thriller_radar, FIXED_PHYSICS_TIMESTEP,
};
use profiler::{DynamicHardwareProfiler, HardwareTier};
use radar_systems::{
    generate_spatial_trajectory_markers, MultiPinTargetManager, RadarTransform,
    SpatialTrajectoryMarker,
};
use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;
use weather::{WeatherCondition, WeatherState};

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
    pub target_fps: f32,
    pub active_particle_count: usize,
    pub total_draw_calls: u32,
    pub sub_frame_alpha: f32,
    pub defensive_grid: DefensiveGridMetrics,
    pub early_warnings: Vec<EarlyWarningTargetInfo>,
    pub trajectory_markers: Vec<SpatialTrajectoryMarker>,
    pub vs90_countdown_active: bool,
    pub vs90_countdown_seconds: f32,
    pub s5_ready_interceptors: u32,
    pub notifications: Vec<String>,
    pub weather: WeatherState,
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
    throne_thriller_radar: ThroneThrillerRadar,
    vs90_protocol: VS90Protocol,
    intercept_s5_battery: InterceptS5Battery,
    ai_brain: EnemyAIBrain,
    pin_manager: MultiPinTargetManager,
    radar: RadarTransform,
    profiler: DynamicHardwareProfiler,
    audio: WasmAudioEngine,
    weather: WeatherState,
    score: u64,
    intercepts: u32,
    next_projectile_id: u32,
    physics_accumulator: f32,
    latest_early_warnings: Vec<EarlyWarningTargetInfo>,
}

#[wasm_bindgen]
impl WasmWarfareSimulation {
    /// Initialize a new Rust simulation instance with 120+ cityscape buildings, Throne Thriller 1, VS-90, and Intercept S-5
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        let mut buildings = Vec::with_capacity(160);
        let mut enemy_buildings = Vec::with_capacity(140);
        let mut silos = Vec::with_capacity(16);
        let mut ciws_turrets = Vec::with_capacity(4);

        // Populate Player City Grid Buildings (120+ Skyscrapers)
        let mut b_id = 0;
        for x in (-170..=170).step_by(24) {
            for z in (-170..=170).step_by(24) {
                if x.abs() < 30 && z.abs() < 30 {
                    continue; // Central Citadel Plaza for Throne Thriller 1 Radar
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

        // Tactical 3D Installations
        // 1. Throne Thriller 1: Central early warning radar hub at origin
        let throne_thriller_radar = ThroneThrillerRadar::new(Vec3::new(0.0, 0.0, 0.0));

        // 2. VS-90 Heavy Salvo Launcher Silo: Armored retaliatory complex
        let vs90_protocol = VS90Protocol::new(Vec3::new(45.0, 0.0, 15.0));

        // 3. Intercept S-5 High-Velocity Battery: Mach 15 anti-nuke defense platform
        let intercept_s5_battery = InterceptS5Battery::new(0, Vec3::new(-45.0, 0.0, -15.0));

        // Armored Silos & Submarines
        silos.push(SiloLauncher::new(0, Vec3::new(-20.0, 0.0, -20.0), LaunchPlatformType::Silo, true));
        silos.push(SiloLauncher::new(1, Vec3::new(20.0, 0.0, -20.0), LaunchPlatformType::Silo, true));
        silos.push(SiloLauncher::new(2, Vec3::new(-20.0, 0.0, 20.0), LaunchPlatformType::Silo, true));
        silos.push(SiloLauncher::new(3, Vec3::new(20.0, 0.0, 20.0), LaunchPlatformType::Silo, true));
        silos.push(SiloLauncher::new(4, Vec3::new(225.0, 0.0, -165.0), LaunchPlatformType::Submarine, true));
        silos.push(SiloLauncher::new(5, Vec3::new(-225.0, 0.0, 165.0), LaunchPlatformType::Submarine, true));

        // CIWS Gatling Turrets
        ciws_turrets.push(CIWSTurret::new(0, Vec3::new(-25.0, 0.0, 25.0), false));
        ciws_turrets.push(CIWSTurret::new(1, Vec3::new(25.0, 0.0, -25.0), false));
        ciws_turrets.push(CIWSTurret::new(2, Vec3::new(700.0, 0.0, -700.0), true));
        ciws_turrets.push(CIWSTurret::new(3, Vec3::new(740.0, 0.0, -740.0), true));

        // Pre-allocate static particle buffer (5,000 particles)
        let mut particles = Vec::with_capacity(5000);
        for _ in 0..5000 {
            particles.push(Particle::default_inactive());
        }

        Self {
            buildings,
            enemy_buildings,
            silos,
            projectiles: Vec::with_capacity(256),
            particles,
            ciws_turrets,
            throne_thriller_radar,
            vs90_protocol,
            intercept_s5_battery,
            ai_brain: EnemyAIBrain::new(),
            pin_manager: MultiPinTargetManager::new(),
            radar: RadarTransform::default(),
            profiler: DynamicHardwareProfiler::new(),
            audio: WasmAudioEngine::new(),
            weather: WeatherState::new(),
            score: 0,
            intercepts: 0,
            next_projectile_id: 1,
            physics_accumulator: 0.0,
            latest_early_warnings: Vec::new(),
        }
    }

    /// Advance the simulation by delta time (dt in seconds) using Fixed Timestep (120Hz)
    pub fn tick(&mut self, dt: f32) -> String {
        let clamped_dt = dt.clamp(0.001, 0.05);

        self.profiler.record_frame_delta(clamped_dt);
        self.audio.update(clamped_dt);
        self.pin_manager.update(clamped_dt);

        // Procedural Weather Progression
        let prev_lightning = self.weather.lightning_flash_intensity;
        if let Some(new_cond) = self.weather.update(clamped_dt) {
            let notif = match new_cond {
                WeatherCondition::ClearSkies => "☀️ METEOROLOGICAL ADVISORY: ATMOSPHERE CLEARING. RADAR VISIBILITY OPTIMAL.".to_string(),
                WeatherCondition::RainShower => "🌧️ METEOROLOGICAL ALERT: RAIN SHOWER SQUALL INBOUND. WIND SPEED 35 KM/H.".to_string(),
                WeatherCondition::HeavyThunderstorm => "⛈️ SEVERE WEATHER WARNING: HEAVY THUNDERSTORM & LIGHTNING ACTIVE. RADAR ATTENUATION SEVERE!".to_string(),
            };
            self.ai_brain.notifications.push(notif);
        }

        // Trigger procedural thunder audio when lightning flashes
        if self.weather.lightning_flash_intensity >= 0.85 && prev_lightning < 0.85 {
            self.audio.play_sound(SoundEffect::ThunderClap);
        }

        self.physics_accumulator += clamped_dt;
        let pool_capacity = self.profiler.particle_pool_capacity;

        while self.physics_accumulator >= FIXED_PHYSICS_TIMESTEP {
            self.physics_accumulator -= FIXED_PHYSICS_TIMESTEP;

            // Step 1: Update Silos & S-5 Battery
            for s in self.silos.iter_mut() {
                s.update(FIXED_PHYSICS_TIMESTEP);
            }
            self.intercept_s5_battery.update(FIXED_PHYSICS_TIMESTEP);

            // Step 2: Update Projectiles with Mach 15 Proportional Navigation & Airburst
            let step_result = update_projectiles_advanced(
                &mut self.projectiles,
                &mut self.particles,
                pool_capacity,
                FIXED_PHYSICS_TIMESTEP,
            );

            // Process Ground Impacts
            for (_id, pos, is_nuclear) in step_result.ground_impacts {
                if is_nuclear {
                    execute_direct_impact(
                        pos,
                        360.0,
                        true,
                        &mut self.buildings,
                        &mut self.particles,
                        pool_capacity,
                    );
                    self.audio.play_sound(SoundEffect::DirectImpactHeavy);
                } else {
                    execute_direct_impact(
                        pos,
                        55.0,
                        false,
                        &mut self.buildings,
                        &mut self.particles,
                        pool_capacity,
                    );
                    execute_direct_impact(
                        pos,
                        55.0,
                        false,
                        &mut self.enemy_buildings,
                        &mut self.particles,
                        pool_capacity,
                    );
                    self.audio.play_sound(SoundEffect::DirectImpactLight);
                }
            }

            // Process Exo-Atmospheric Neutralizations by Intercept S-5
            for (_id, pos) in step_result.exo_intercepts {
                self.intercepts += 1;
                self.score += 3500;
                self.audio.play_sound(SoundEffect::StratosphericAirburst);
                // Also trigger airburst shockwave visual at high altitude
                execute_nuclear_airburst(
                    pos,
                    &mut self.buildings,
                    &mut self.particles,
                    pool_capacity,
                    45,
                );
            }

            // Step 3: THRONE THRILLER 1 - Global Early Warning & TTI Calculation
            let (warnings, has_nuclear_threat) = update_throne_thriller_radar(
                &mut self.throne_thriller_radar,
                &self.projectiles,
                FIXED_PHYSICS_TIMESTEP,
            );
            self.latest_early_warnings = warnings;

            // Auto-trigger VS-90 Protocol upon confirmation of Nuclear / Hypersonic payload
            if has_nuclear_threat && !self.vs90_protocol.is_primed && !self.vs90_protocol.has_retaliated {
                self.vs90_protocol.prime();
                self.audio.play_sound(SoundEffect::NuclearEmergencySiren);
                self.ai_brain
                    .notifications
                    .push("⚠️ THRONE THRILLER 1: NUCLEAR LAUNCH CONFIRMED! VS-90 PROTOCOL TRIGGERED (5s COUNTDOWN)".to_string());
            }

            // Update VS-90 Protocol Countdown
            let should_fire_vs90 = self.vs90_protocol.update(FIXED_PHYSICS_TIMESTEP);
            if should_fire_vs90 {
                self.trigger_total_retaliation_salvo();
            }

            // Step 4: Automated S-5 Interceptor Allocation against incoming nuclear warheads
            if self.intercept_s5_battery.can_fire() {
                let s5_pos = self.intercept_s5_battery.position;
                let mut best_target = None;
                let mut lowest_tti = 999.0;

                for warn in self.latest_early_warnings.iter() {
                    if warn.is_nuclear_hypersonic && !warn.is_spoofed && warn.tti_seconds < lowest_tti && warn.altitude > 100.0 {
                        lowest_tti = warn.tti_seconds;
                        best_target = Some((warn.projectile_id, warn.current_pos));
                    }
                }

                if let Some((target_id, target_pos)) = best_target {
                    if self.intercept_s5_battery.consume_ammo() {
                        let pid = self.next_projectile_id;
                        self.next_projectile_id += 1;
                        self.projectiles.push(Projectile::new_intercept_s5(
                            pid,
                            s5_pos + Vec3::new(0.0, 5.0, 0.0),
                            target_id,
                            target_pos,
                        ));
                        self.audio.play_sound(SoundEffect::SonicBoom);
                        self.ai_brain.notifications.push(format!(
                            "🚀 INTERCEPT S-5: MACH 15 HYPER-VELOCITY VECTOR ENGAGED ON TARGET #{}",
                            target_id
                        ));
                    }
                }
            }

            // Step 5: Update CIWS Gatling Point Defense
            let ciws_hits = update_ciws_turrets(
                &mut self.ciws_turrets,
                &mut self.projectiles,
                &mut self.particles,
                pool_capacity,
                FIXED_PHYSICS_TIMESTEP,
            );
            if ciws_hits > 0 {
                self.intercepts += ciws_hits;
                self.score += (ciws_hits as u64) * 300;
                self.audio.play_sound(SoundEffect::CIWSGatlingBurst);
            }

            // Step 6: Update Particle Physics
            update_particles_fluid(&mut self.particles, FIXED_PHYSICS_TIMESTEP);

            // Step 7: Update AI Brain with defense capacity evaluation
            let player_health = self.get_city_integrity();
            let enemy_health = self.get_enemy_integrity();
            let enemy_ratio = enemy_health / 100.0;

            self.ai_brain.evaluate_player_defense_capacity(
                self.intercept_s5_battery.ammo_count,
                self.throne_thriller_radar.is_online,
                player_health,
            );
            self.ai_brain.update(enemy_ratio, FIXED_PHYSICS_TIMESTEP);

            // Handle Coordinated Multi-Salvo Attacks (4 to 8 Heavy Warheads + Decoys + Flares)
            if let Some(order) = self.ai_brain.pending_multi_salvo.take() {
                self.execute_enemy_coordinated_salvo(order);
            }

            // Decoy Salvo Strategy
            if self.ai_brain.should_fire_decoy() && self.projectiles.len() < 120 {
                let pid = self.next_projectile_id;
                self.next_projectile_id += 1;
                let origin = Vec3::new(760.0, 0.0, -710.0);
                let target = Vec3::new(-20.0, 0.0, -20.0);
                self.projectiles.push(Projectile::new_decoy(pid, origin, target));
            }
        }

        // Sub-Frame Interpolation Alpha
        let sub_frame_alpha = (self.physics_accumulator / FIXED_PHYSICS_TIMESTEP).clamp(0.0, 1.0);
        self.profiler.sub_frame_alpha = sub_frame_alpha;

        let active_particles = self.particles.iter().filter(|p| p.is_active).count();
        self.profiler.active_particle_count = active_particles;

        // DEFCON status
        let defcon = match self.ai_brain.state {
            AIState::DesperateNuclear => 1,
            AIState::AllOutOffensive => 1,
            AIState::TacticalCounter | AIState::DeceitSalvo => 2,
            AIState::Reconnaissance | AIState::DiplomaticSurrender => 4,
            AIState::Idle => 5,
        };

        // Defensive Grid Metric Data
        let defensive_grid = DefensiveGridMetrics {
            s5_remaining_ammo: self.intercept_s5_battery.ammo_count,
            s5_max_ammo: self.intercept_s5_battery.max_ammo,
            vs90_stock: self.vs90_protocol.total_stock,
            vs90_countdown: self.vs90_protocol.countdown_timer,
            vs90_active: self.vs90_protocol.countdown_active,
            battery_charge_pct: (self.intercept_s5_battery.ammo_count as f32 / self.intercept_s5_battery.max_ammo as f32) * 100.0,
            radar_coverage_pct: if self.throne_thriller_radar.is_online { 100.0 } else { 0.0 },
            defcon_threat_state: defcon,
            active_exo_intercepts: self.intercepts,
            ciws_readiness_pct: 100.0,
        };

        let trajectory_markers = generate_spatial_trajectory_markers(&self.latest_early_warnings);

        let snapshot = EngineTelemetrySnapshot {
            player_city_integrity: self.get_city_integrity(),
            enemy_city_integrity: self.get_enemy_integrity(),
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
            target_fps: self.profiler.target_fps,
            active_particle_count: active_particles,
            total_draw_calls: self.profiler.total_draw_calls,
            sub_frame_alpha,
            defensive_grid,
            early_warnings: self.latest_early_warnings.clone(),
            trajectory_markers,
            vs90_countdown_active: self.vs90_protocol.countdown_active,
            vs90_countdown_seconds: self.vs90_protocol.countdown_timer,
            s5_ready_interceptors: self.intercept_s5_battery.ammo_count,
            notifications: self.ai_brain.notifications.drain(..).collect(),
            weather: self.weather.clone(),
        };

        serde_json::to_string(&snapshot).unwrap_or_else(|_| "{}".to_string())
    }

    /// Execute Enemy Coordinated Multi-Salvo (4 to 8 Heavy Warheads + Decoys + Thermal Flares)
    fn execute_enemy_coordinated_salvo(&mut self, order: ai_brain::MultiSalvoOrder) {
        let origin = Vec3::new(760.0, 0.0, -710.0);

        for (idx, target) in order.target_positions.iter().enumerate() {
            let pid = self.next_projectile_id;
            self.next_projectile_id += 1;

            if order.include_hypersonic && idx == 0 {
                // First warhead is Hypersonic Glide Vehicle
                self.projectiles.push(Projectile::new_hypersonic(pid, origin, *target, false));
            } else {
                // Nuclear / Heavy warhead
                self.projectiles.push(Projectile::new_icbm(pid, origin, *target, true, false));
            }
        }

        // Deploy active Decoys to spoof interceptor target acquisition
        if order.include_decoys {
            for d in 0..3 {
                let pid = self.next_projectile_id;
                self.next_projectile_id += 1;
                let decoy_target = Vec3::new(-30.0 + (d as f32 * 25.0), 0.0, -10.0);
                self.projectiles.push(Projectile::new_decoy(pid, origin, decoy_target));
            }
        }

        // Deploy active Flares
        if order.include_flares {
            for f in 0..4 {
                let pid = self.next_projectile_id;
                self.next_projectile_id += 1;
                let flare_vel = Vec3::new(-30.0 + (f as f32 * 15.0), 80.0, 20.0);
                self.projectiles.push(Projectile::new_flare(pid, origin + Vec3::new(0.0, 150.0, 0.0), flare_vel));
            }
        }

        self.audio.play_sound(SoundEffect::SonicBoom);
    }

    // ========================================================================
    // VS-90 PROTOCOL: TOTAL RETALIATION SALVO EXECUTION
    // ========================================================================

    /// VS-90 Protocol: Pre-emptive Full Salvo Retaliation
    /// Instantly dumps all available battery stocks and launches massive counter-offensive strategic warheads
    pub fn trigger_total_retaliation_salvo(&mut self) -> u32 {
        let salvo_origin = self.vs90_protocol.position;
        let mut launched = 0;

        // Target coordinates across entire enemy metropolis grid
        let enemy_target_grid = [
            Vec3::new(760.0, 0.0, -710.0), // Hostile Primary Silo
            Vec3::new(700.0, 0.0, -700.0), // Hostile CIWS Battery
            Vec3::new(740.0, 0.0, -740.0), // Hostile Radar Dome
            Vec3::new(650.0, 0.0, -650.0), // Western Sub-Silo
            Vec3::new(820.0, 0.0, -820.0), // Eastern Command Citadel
            Vec3::new(610.0, 0.0, -610.0), // Northwest Airbase
            Vec3::new(850.0, 0.0, -670.0), // Strategic Assembly Plant
            Vec3::new(670.0, 0.0, -850.0), // Deep Harbor Dock
        ];

        // Launch heavy barrage across targets
        for (idx, target) in enemy_target_grid.iter().enumerate() {
            let pid = self.next_projectile_id;
            self.next_projectile_id += 1;

            // Alternating Hypersonic and Heavy Nuclear ICBM warheads
            if idx % 2 == 0 {
                self.projectiles.push(Projectile::new_hypersonic(pid, salvo_origin, *target, true));
            } else {
                self.projectiles.push(Projectile::new_icbm(pid, salvo_origin, *target, true, true));
            }
            launched += 1;
        }

        self.vs90_protocol.has_retaliated = true;
        self.vs90_protocol.countdown_active = false;
        self.vs90_protocol.total_stock = 0;
        self.vs90_protocol.status_text = "VS-90 SALVO FULLY DISPATCHED".to_string();

        self.audio.play_sound(SoundEffect::SonicBoom);
        self.audio.play_sound(SoundEffect::DirectImpactHeavy);
        self.ai_brain
            .notifications
            .push("⚡ VS-90 PROTOCOL: TOTAL COUNTER-OFFENSIVE SALVO DISPATCHED!".to_string());

        launched
    }

    /// Manual trigger to arm and prime VS-90 Retaliation Protocol
    pub fn arm_vs90_protocol(&mut self) {
        self.vs90_protocol.prime();
        self.audio.play_sound(SoundEffect::NuclearEmergencySiren);
    }

    // ========================================================================
    // INTERCEPT S-5: MACH 15 MANUAL / DISPATCH TRIGGER
    // ========================================================================

    /// Launch Mach 15 Hyper-Velocity Anti-Nuke Interceptor at specific target ID
    pub fn launch_intercept_s5(&mut self, target_id: u32) -> bool {
        if !self.intercept_s5_battery.can_fire() {
            return false;
        }

        // Find target position
        let target_proj = self.projectiles.iter().find(|p| p.id == target_id && p.is_active);
        if let Some(target) = target_proj {
            let t_pos = target.current_position;
            if self.intercept_s5_battery.consume_ammo() {
                let pid = self.next_projectile_id;
                self.next_projectile_id += 1;
                self.projectiles.push(Projectile::new_intercept_s5(
                    pid,
                    self.intercept_s5_battery.position + Vec3::new(0.0, 5.0, 0.0),
                    target_id,
                    t_pos,
                ));
                self.audio.play_sound(SoundEffect::SonicBoom);
                return true;
            }
        }
        false
    }

    // ========================================================================
    // SILO & TARGET PIN CONTROLS
    // ========================================================================

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

    /// Precision 3D Raycasting ground pin drop (up to 12 maximum)
    pub fn add_target_pin(&mut self, x: f32, z: f32) -> u32 {
        let pin_id = self.pin_manager.add_pin(Vec3::new(x, 0.0, z)).unwrap_or(0);
        if pin_id > 0 {
            self.audio.play_sound(SoundEffect::TargetLockBeep);
        }
        pin_id
    }

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

    /// Stratospheric Nuclear Airburst trigger
    pub fn trigger_airburst(&mut self, x: f32, y: f32, z: f32) {
        let burst_pos = Vec3::new(x, y.max(140.0), z);
        let pool_capacity = self.profiler.particle_pool_capacity;
        let fallout_count = match self.profiler.current_tier {
            HardwareTier::HighPerformance => 120,
            HardwareTier::Balanced => 65,
            HardwareTier::PowerSaver => 30,
        };

        execute_nuclear_airburst(
            burst_pos,
            &mut self.buildings,
            &mut self.particles,
            pool_capacity,
            fallout_count,
        );
        self.audio.play_sound(SoundEffect::StratosphericAirburst);
        self.audio.play_sound(SoundEffect::AirburstEMPMute);
        self.intercepts += 1;
        self.score += 5000;
    }

    pub fn accept_ceasefire(&mut self) {
        self.ai_brain.accept_ceasefire();
        self.score += 15000;
    }

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

    pub fn get_city_integrity(&self) -> f32 {
        if self.buildings.is_empty() {
            return 100.0;
        }
        let total_health: f32 = self.buildings.iter().map(|b| b.health).sum();
        total_health / (self.buildings.len() as f32)
    }

    pub fn get_enemy_integrity(&self) -> f32 {
        if self.enemy_buildings.is_empty() {
            return 100.0;
        }
        let total_health: f32 = self.enemy_buildings.iter().map(|b| b.health).sum();
        total_health / (self.enemy_buildings.len() as f32)
    }

    pub fn get_ai_state(&self) -> String {
        format!("{:?}", self.ai_brain.state).to_uppercase()
    }

    /// Set procedural weather state manually (0 = ClearSkies, 1 = RainShower, 2 = HeavyThunderstorm)
    pub fn set_weather_condition(&mut self, condition_idx: u32) {
        let condition = match condition_idx {
            1 => WeatherCondition::RainShower,
            2 => WeatherCondition::HeavyThunderstorm,
            _ => WeatherCondition::ClearSkies,
        };
        self.weather.force_set_condition(condition);
        let msg = match condition {
            WeatherCondition::ClearSkies => "☀️ TACTICAL OVERRIDE: CLEAR SKIES ENGAGED",
            WeatherCondition::RainShower => "🌧️ TACTICAL OVERRIDE: RAIN SHOWER SQUALL ENGAGED",
            WeatherCondition::HeavyThunderstorm => "⛈️ TACTICAL OVERRIDE: HEAVY THUNDERSTORM & LIGHTNING ENGAGED",
        };
        self.ai_brain.notifications.push(msg.to_string());
    }

    /// Get current weather condition name
    pub fn get_weather_condition(&self) -> String {
        format!("{:?}", self.weather.current_condition).to_uppercase()
    }

    /// Get current precipitation intensity (0.0 to 1.0)
    pub fn get_precipitation_intensity(&self) -> f32 {
        self.weather.precipitation_intensity
    }

    /// Get current wind speed in km/h
    pub fn get_wind_speed_kmh(&self) -> f32 {
        self.weather.wind_speed_kmh
    }
}
