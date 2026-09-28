//! 3D Physics Systems, Predictive Proportional Navigation, Throne Thriller 1 Radar, and Atmospheric Airburst (120 FPS Target)

use crate::components::{
    Building, CIWSTurret, DamageState, EarlyWarningTargetInfo, InterceptS5Battery, Particle,
    ParticleType, Projectile, ThreatClassification, ThroneThrillerRadar, TrajectoryType, VS90Protocol,
};
use glam::{Vec3, Vec4};

/// Fixed physics simulation timestep (120 Hz)
pub const FIXED_PHYSICS_TIMESTEP: f32 = 1.0 / 120.0;

/// Fast analytical 3D noise function for fluid vector flow and smoke curl turbulence
pub fn fluid_noise_3d(p: Vec3) -> Vec3 {
    let s1 = (p.x * 0.12 + p.y * 0.18).sin() * (p.z * 0.15).cos();
    let s2 = (p.y * 0.14 - p.z * 0.22).sin() * (p.x * 0.16).cos();
    let s3 = (p.z * 0.11 + p.x * 0.25).sin() * (p.y * 0.13).cos();
    Vec3::new(s1 * 3.5, (s2 * 2.8).abs() + 1.2, s3 * 3.5)
}

/// 3D Parabolic Quadratic Bezier Interpolation
pub fn compute_bezier_arc(p0: Vec3, p1: Vec3, p2: Vec3, t: f32) -> Vec3 {
    let u = 1.0 - t;
    u * u * p0 + 2.0 * u * t * p1 + t * t * p2
}

// ============================================================================
// PREDICTIVE PROPORTIONAL NAVIGATION GUIDANCE LAW (MACH 15 INTERCEPT S-5)
// ============================================================================

/// Predictive Proportional Navigation guidance algorithm for Intercept S-5
/// Calculates lateral acceleration command: A_cmd = N * V_closing * (d_lambda / dt)
pub fn predictive_proportional_navigation(
    interceptor_pos: Vec3,
    interceptor_vel: Vec3,
    target_pos: Vec3,
    target_vel: Vec3,
    nav_gain: f32, // Typical value N = 4.0
    dt: f32,
) -> Vec3 {
    let r_vec = target_pos - interceptor_pos;
    let range = r_vec.length();
    if range < 1.0 {
        return interceptor_vel; // Near collision
    }

    let los_unit = r_vec / range;
    let v_rel = target_vel - interceptor_vel;

    // Closing velocity along the line-of-sight (LOS)
    let v_closing = -v_rel.dot(los_unit);

    // LOS rate of rotation vector: omega = (R x V_rel) / |R|^2
    let los_rate = (r_vec.cross(v_rel)) / (range * range);

    // Lateral acceleration command perpendicular to LOS
    let a_cmd = los_rate.cross(interceptor_vel) * (nav_gain * v_closing.max(50.0));

    // Desired new velocity steered by acceleration command
    let new_vel = interceptor_vel + a_cmd * dt;
    let speed = interceptor_vel.length();

    // Maintain Mach 15 hyper-velocity vector magnitude (~520 units/s)
    new_vel.normalize() * speed
}

// ============================================================================
// PROJECTILE FLIGHT & HIGH-ALTITUDE EXO-ATMOSPHERIC INTERCEPTION
// ============================================================================

/// Result of projectile physics step
pub struct PhysicsStepResult {
    pub ground_impacts: Vec<(u32, Vec3, bool)>,
    pub exo_intercepts: Vec<(u32, Vec3)>,
}

/// Computes projectile flight progression, updates previous/current positions for sub-frame interpolation
/// Handles Predictive Proportional Navigation for Mach 15 Intercept S-5 missiles
pub fn update_projectiles_advanced(
    projectiles: &mut Vec<Projectile>,
    particles: &mut Vec<Particle>,
    max_particles: usize,
    dt: f32,
) -> PhysicsStepResult {
    let mut ground_impacts = Vec::new();
    let mut exo_intercepts = Vec::new();

    // 1. First pass: update positions for non-interceptor projectiles
    for proj in projectiles.iter_mut() {
        if !proj.is_active {
            continue;
        }

        // Cache previous position for sub-frame lerp interpolation at 120 FPS
        proj.previous_position = proj.current_position;

        if proj.trajectory_type == TrajectoryType::InterceptS5Mach15 {
            continue; // Will process in pass 2 with target locks
        }

        proj.progress += dt / proj.duration;
        let t = proj.progress.clamp(0.0, 1.0);

        if proj.trajectory_type == TrajectoryType::ThermalFlare {
            // Thermal flare drops slowly with random drift
            proj.current_position += proj.velocity * dt;
            proj.velocity.y -= 9.8 * dt * 0.4;
            proj.velocity.x += ((proj.id as f32 * 17.0).sin()) * 4.0 * dt;
        } else if proj.trajectory_type == TrajectoryType::DirectHypersonic {
            // Hypersonic glide: fast undulating flat trajectory
            let mid_point = (proj.origin + proj.target) * 0.5;
            let control_point = Vec3::new(
                mid_point.x,
                proj.peak_altitude + (t * 6.28).sin() * 25.0,
                mid_point.z,
            );
            proj.current_position = compute_bezier_arc(proj.origin, control_point, proj.target, t);
            proj.velocity = (proj.current_position - proj.previous_position) / dt.max(0.0001);
        } else {
            // Parabolic Bezier arc
            let mid_point = (proj.origin + proj.target) * 0.5;
            let control_point = Vec3::new(
                mid_point.x,
                mid_point.y + proj.peak_altitude * 1.5,
                mid_point.z,
            );
            proj.current_position = compute_bezier_arc(proj.origin, control_point, proj.target, t);
            proj.velocity = (proj.current_position - proj.previous_position) / dt.max(0.0001);
        }

        if proj.progress >= 1.0 || proj.current_position.y <= 0.0 {
            proj.is_active = false;
            ground_impacts.push((proj.id, proj.target, proj.is_nuclear));
        }
    }

    // 2. Second pass: update Mach 15 Intercept S-5 interceptors with Predictive Proportional Navigation
    let mut interceptor_hits = Vec::new();

    for i in 0..projectiles.len() {
        if !projectiles[i].is_active
            || projectiles[i].trajectory_type != TrajectoryType::InterceptS5Mach15
        {
            continue;
        }

        let target_id = projectiles[i].locked_target_id;
        let mut target_state = None;

        if let Some(tid) = target_id {
            for other in projectiles.iter() {
                if other.id == tid && other.is_active && !other.is_intercepted {
                    target_state = Some((other.current_position, other.velocity));
                    break;
                }
            }
        }

        if let Some((t_pos, t_vel)) = target_state {
            let interceptor_pos = projectiles[i].current_position;
            let interceptor_vel = projectiles[i].velocity;

            // Apply Mach 15 Predictive Proportional Navigation
            let guided_vel = predictive_proportional_navigation(
                interceptor_pos,
                interceptor_vel,
                t_pos,
                t_vel,
                4.2, // Proportional Navigation Gain
                dt,
            );

            projectiles[i].velocity = guided_vel;
            projectiles[i].current_position += guided_vel * dt;

            // Spawn Mach 15 electric cyan exhaust trail
            spawn_pooled_particle(
                particles,
                max_particles,
                projectiles[i].current_position,
                -guided_vel.normalize() * 35.0,
                Vec4::new(0.0, 0.95, 1.0, 0.9),
                1.4,
                0.45,
                ParticleType::Mach15ExhaustTrail,
            );

            // High-Altitude / Exo-Atmosphere Hitbox Collision Check (Mach 15 proximity fuse)
            let dist = projectiles[i].current_position.distance(t_pos);
            if dist < 22.0 {
                projectiles[i].is_active = false;
                if let Some(tid) = target_id {
                    interceptor_hits.push((tid, projectiles[i].current_position));
                }
            }
        } else {
            // Target destroyed or lost, interceptor self-destructs safely in high atmosphere
            projectiles[i].current_position += projectiles[i].velocity * dt;
            projectiles[i].progress += dt;
            if projectiles[i].progress > 4.0 || projectiles[i].current_position.y > 600.0 {
                projectiles[i].is_active = false;
            }
        }
    }

    // 3. Neutralize targets hit by Mach 15 S-5 interceptors in high altitude
    for (tid, hit_pos) in interceptor_hits {
        for proj in projectiles.iter_mut() {
            if proj.id == tid && proj.is_active {
                proj.is_active = false;
                proj.is_intercepted = true;
                exo_intercepts.push((tid, hit_pos));

                // Spawn high-altitude exo-atmospheric plasma flash
                spawn_pooled_particle(
                    particles,
                    max_particles,
                    hit_pos,
                    Vec3::ZERO,
                    Vec4::new(0.0, 0.98, 1.0, 1.0),
                    8.0,
                    1.6,
                    ParticleType::PlasmaHalo,
                );
                spawn_pooled_particle(
                    particles,
                    max_particles,
                    hit_pos,
                    Vec3::ZERO,
                    Vec4::new(0.4, 0.9, 1.0, 0.8),
                    2.5,
                    2.2,
                    ParticleType::ShockwaveRing,
                );
            }
        }
    }

    PhysicsStepResult {
        ground_impacts,
        exo_intercepts,
    }
}

/// Backward compatibility wrapper for update_projectiles
pub fn update_projectiles(projectiles: &mut Vec<Projectile>, dt: f32) -> Vec<(u32, Vec3, bool)> {
    let mut dummy_particles = Vec::new();
    let res = update_projectiles_advanced(projectiles, &mut dummy_particles, 0, dt);
    res.ground_impacts
}

// ============================================================================
// THRONE THRILLER 1: EARLY WARNING & TIME-TO-IMPACT DYNAMIC COMPUTATION
// ============================================================================

/// Scans all active projectiles and produces pinpoint spatial early warning telemetry
pub fn update_throne_thriller_radar(
    radar: &mut ThroneThrillerRadar,
    projectiles: &[Projectile],
    dt: f32,
) -> (Vec<EarlyWarningTargetInfo>, bool) {
    radar.update(dt);
    let mut early_warnings = Vec::new();
    let mut has_nuclear_hypersonic_threat = false;
    let mut nuc_count = 0;
    let mut conv_count = 0;

    for proj in projectiles.iter() {
        if !proj.is_active || proj.is_player {
            continue; // Only track incoming hostile threats
        }

        let dist_to_radar = radar.position.distance(proj.current_position);
        if dist_to_radar > radar.max_range {
            continue;
        }

        // Dynamic Time-To-Impact (TTI) analytical estimation
        let speed = proj.velocity.length();
        let tti = if speed > 1.0 {
            let dist_to_target = proj.current_position.distance(proj.target);
            (dist_to_target / speed).clamp(0.1, 40.0)
        } else {
            ((1.0 - proj.progress) * proj.duration).clamp(0.1, 40.0)
        };

        let is_nuclear_hypo = proj.is_nuclear || proj.is_hypersonic;
        if is_nuclear_hypo {
            has_nuclear_hypersonic_threat = true;
            nuc_count += 1;
        } else {
            conv_count += 1;
        }

        early_warnings.push(EarlyWarningTargetInfo {
            projectile_id: proj.id,
            threat_class: proj.threat_class,
            current_pos: proj.current_position,
            velocity: proj.velocity,
            predicted_impact: proj.target,
            tti_seconds: tti,
            altitude: proj.current_position.y,
            is_nuclear_hypersonic: is_nuclear_hypo,
            is_spoofed: proj.is_decoy || proj.is_flare,
            interceptor_assigned: false,
        });
    }

    radar.nuclear_threat_count = nuc_count;
    radar.conventional_threat_count = conv_count;
    radar.total_tracked = early_warnings.len();

    (early_warnings, has_nuclear_hypersonic_threat)
}

// ============================================================================
// PARTICLE ENGINE: ALLOCATION-FREE OBJECT POOLING & FLUID VECTORS
// ============================================================================

/// Allocates or recycles an inactive particle from the pre-allocated pool (up to 5,000+ particles)
pub fn spawn_pooled_particle(
    particles: &mut Vec<Particle>,
    max_capacity: usize,
    position: Vec3,
    velocity: Vec3,
    color: Vec4,
    scale: f32,
    lifespan: f32,
    p_type: ParticleType,
) {
    if let Some(p) = particles.iter_mut().find(|p| !p.is_active) {
        p.position = position;
        p.previous_position = position;
        p.velocity = velocity;
        p.color = color;
        p.scale = scale;
        p.initial_scale = scale;
        p.age = 0.0;
        p.max_lifespan = lifespan;
        p.is_active = true;
        p.particle_type = p_type;
        return;
    }

    if particles.len() < max_capacity {
        particles.push(Particle {
            position,
            previous_position: position,
            velocity,
            color,
            scale,
            initial_scale: scale,
            age: 0.0,
            max_lifespan: lifespan,
            is_active: true,
            particle_type: p_type,
        });
    }
}

/// Updates all active particles with fluid vector dynamics, noise fields, and smooth fade curves
pub fn update_particles_fluid(particles: &mut [Particle], dt: f32) {
    for p in particles.iter_mut() {
        if !p.is_active {
            continue;
        }

        p.previous_position = p.position;
        p.age += dt;

        let age_ratio = (p.age / p.max_lifespan).clamp(0.0, 1.0);
        if age_ratio >= 1.0 {
            p.is_active = false;
            continue;
        }

        match p.particle_type {
            ParticleType::Smoke => {
                let curl = fluid_noise_3d(p.position * 0.05);
                p.velocity = p.velocity.lerp(curl, dt * 1.5);
                p.position += p.velocity * dt;
                p.scale = p.initial_scale * (1.0 + age_ratio * 3.2);
                let fade = (1.0 - age_ratio).powf(1.6);
                p.color.w = fade * 0.75;
            }
            ParticleType::Fire => {
                p.velocity.y += 9.8 * dt;
                p.position += p.velocity * dt;
                p.scale = p.initial_scale * (1.0 - age_ratio * 0.5);
                p.color.y = (1.0 - age_ratio).powf(1.8);
                p.color.w = (1.0 - age_ratio).powf(1.2);
            }
            ParticleType::FalloutDebris => {
                p.velocity.y -= 12.0 * dt;
                p.position += p.velocity * dt;
                if p.position.y <= 0.0 {
                    p.position.y = 0.0;
                    p.velocity = Vec3::ZERO;
                }
                p.color.w = (1.0 - age_ratio).powf(1.4) * 0.9;
            }
            ParticleType::ShockwaveRing => {
                p.scale = p.initial_scale + age_ratio * 340.0;
                let fade = (1.0 - age_ratio).powf(2.0);
                p.color.w = fade * 0.85;
            }
            ParticleType::ConcreteShatter => {
                p.velocity.y -= 28.0 * dt;
                p.position += p.velocity * dt;
                if p.position.y <= 0.0 {
                    p.position.y = 0.0;
                    p.velocity.x *= 0.6;
                    p.velocity.z *= 0.6;
                    p.velocity.y = 0.0;
                }
                p.color.w = (1.0 - age_ratio).powf(1.2);
            }
            ParticleType::CIWSTracer => {
                p.position += p.velocity * dt;
                p.color.w = (1.0 - age_ratio * 2.0).max(0.0);
            }
            ParticleType::PlasmaHalo => {
                p.scale = p.initial_scale * (1.0 + age_ratio * 8.0);
                p.color.w = (1.0 - age_ratio).powf(2.5);
            }
            ParticleType::Mach15ExhaustTrail => {
                p.position += p.velocity * dt;
                p.scale = p.initial_scale * (1.0 + age_ratio * 2.5);
                p.color.w = (1.0 - age_ratio).powf(1.8) * 0.95;
            }
            ParticleType::RadarPulseWave => {
                p.scale = p.initial_scale + age_ratio * 400.0;
                p.color.w = (1.0 - age_ratio).powf(2.0) * 0.45;
            }
            ParticleType::DecoySparkle => {
                p.velocity.y -= 5.0 * dt;
                p.position += p.velocity * dt;
                p.color.w = (1.0 - age_ratio) * 0.85;
            }
        }
    }
}

// ============================================================================
// 3-STAGE STRUCTURAL COLLAPSE HIERARCHY & AIRBURST FALLOUT
// ============================================================================

/// Mid-Air Nuclear Airburst Physics: High-altitude plasma flash, shockwave ring, downward radioactive fallout shower
pub fn execute_nuclear_airburst(
    burst_position: Vec3,
    buildings: &mut [Building],
    particles: &mut Vec<Particle>,
    max_particle_pool: usize,
    fallout_count: usize,
) {
    // 1. Stratospheric Shockwave Ring
    spawn_pooled_particle(
        particles,
        max_particle_pool,
        burst_position,
        Vec3::ZERO,
        Vec4::new(0.0, 0.95, 1.0, 0.95),
        4.0,
        2.8,
        ParticleType::ShockwaveRing,
    );

    // 2. High-Energy Blinding Plasma Halo
    spawn_pooled_particle(
        particles,
        max_particle_pool,
        burst_position,
        Vec3::ZERO,
        Vec4::new(1.0, 1.0, 1.0, 1.0),
        15.0,
        1.5,
        ParticleType::PlasmaHalo,
    );

    // 3. Radioactive fallout debris shower with wind drift
    let wind_vector = Vec3::new(-8.0, -28.0, 6.0);
    for i in 0..fallout_count {
        let spread_x = (i as f32 % 11.0 - 5.5) * 14.0;
        let spread_z = ((i / 11) as f32 - 5.5) * 14.0;
        let spawn_pos = burst_position + Vec3::new(spread_x, (i as f32 * 1.8), spread_z);
        let vel = wind_vector
            + Vec3::new(
                spread_x * 0.12,
                -(22.0 + (i % 7) as f32 * 5.0),
                spread_z * 0.12,
            );

        spawn_pooled_particle(
            particles,
            max_particle_pool,
            spawn_pos,
            vel,
            Vec4::new(1.0, 0.42, 0.05, 0.95),
            1.5,
            7.5,
            ParticleType::FalloutDebris,
        );
    }

    // 4. Partial Fallout Structural Damage (25% - 40% damage + carbonized charring to underlying city grid)
    for b in buildings.iter_mut() {
        if b.state == DamageState::Rubble {
            continue;
        }
        let horizontal_dist = Vec3::new(b.position.x, 0.0, b.position.z)
            .distance(Vec3::new(burst_position.x, 0.0, burst_position.z));
        if horizontal_dist < 220.0 {
            let dmg = 25.0 + (1.0 - (horizontal_dist / 220.0)) * 15.0; // 25% to 40% damage
            b.apply_damage(dmg);
        }
    }
}

/// Direct Land Impact Annihilation: Full 3-stage mesh breakdown (Pristine -> Charred -> Rubble)
pub fn execute_direct_impact(
    impact_position: Vec3,
    blast_radius: f32,
    is_nuclear: bool,
    buildings: &mut [Building],
    particles: &mut Vec<Particle>,
    max_particle_pool: usize,
) {
    for b in buildings.iter_mut() {
        if b.state == DamageState::Rubble {
            continue;
        }
        let dist = b.position.distance(impact_position);
        if dist <= blast_radius {
            b.apply_damage(if is_nuclear { 9999.0 } else { 135.0 });
        }
    }

    spawn_pooled_particle(
        particles,
        max_particle_pool,
        impact_position + Vec3::new(0.0, 1.0, 0.0),
        Vec3::ZERO,
        if is_nuclear {
            Vec4::new(1.0, 0.35, 0.0, 0.9)
        } else {
            Vec4::new(0.8, 0.8, 0.9, 0.6)
        },
        2.0,
        if is_nuclear { 3.0 } else { 1.2 },
        ParticleType::ShockwaveRing,
    );

    let debris_count = if is_nuclear { 120 } else { 36 };
    for d in 0..debris_count {
        let angle = (d as f32 / debris_count as f32) * std::f32::consts::PI * 2.0;
        let speed = 28.0 + (d % 9) as f32 * 9.0;
        let vel = Vec3::new(
            angle.cos() * speed,
            20.0 + (d % 7) as f32 * 7.0,
            angle.sin() * speed,
        );

        spawn_pooled_particle(
            particles,
            max_particle_pool,
            impact_position + Vec3::new(0.0, 2.0, 0.0),
            vel,
            Vec4::new(0.22, 0.22, 0.25, 1.0),
            1.8,
            4.2,
            ParticleType::ConcreteShatter,
        );
    }
}

// ============================================================================
// CIWS AUTOMATED GATLING TURRET SYSTEM
// ============================================================================

/// CIWS Automated Gatling Defense System: Target tracking, 6-barrel cluster spin, and rapid tracer fire
pub fn update_ciws_turrets(
    turrets: &mut [CIWSTurret],
    projectiles: &mut [Projectile],
    particles: &mut Vec<Particle>,
    max_particle_pool: usize,
    dt: f32,
) -> u32 {
    let mut interceptions = 0;

    for turret in turrets.iter_mut() {
        if turret.cooldown > 0.0 {
            turret.cooldown = (turret.cooldown - dt).max(0.0);
        }

        let mut nearest_target = None;
        let mut min_dist = turret.range;

        for proj in projectiles.iter_mut() {
            if !proj.is_active || proj.is_player == (!turret.is_enemy) {
                continue;
            }
            let dist = turret.position.distance(proj.current_position);
            if dist < min_dist && proj.current_position.y < 240.0 {
                min_dist = dist;
                nearest_target = Some(proj);
            }
        }

        if let Some(target) = nearest_target {
            turret.current_target = Some(target.current_position);
            turret.barrel_spin += dt * 42.0;

            let dir = target.current_position - turret.position;
            turret.rotation_yaw = dir.x.atan2(dir.z);
            let horiz_dist = (dir.x * dir.x + dir.z * dir.z).sqrt();
            turret.rotation_pitch = (-dir.y).atan2(horiz_dist);

            if turret.cooldown <= 0.0 {
                turret.cooldown = turret.fire_rate;

                let tracer_vel = dir.normalize() * 380.0;
                spawn_pooled_particle(
                    particles,
                    max_particle_pool,
                    turret.position + Vec3::new(0.0, 3.2, 0.0),
                    tracer_vel,
                    if turret.is_enemy {
                        Vec4::new(1.0, 0.0, 0.35, 0.95)
                    } else {
                        Vec4::new(0.0, 0.95, 1.0, 0.95)
                    },
                    1.2,
                    0.35,
                    ParticleType::CIWSTracer,
                );

                if min_dist < 75.0 {
                    target.is_active = false;
                    target.is_intercepted = true;
                    interceptions += 1;
                }
            }
        } else {
            turret.current_target = None;
        }
    }

    interceptions
}
