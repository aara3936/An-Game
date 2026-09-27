//! 3D Physics Systems, Atmospheric Airburst, Fallout Chemistry & CIWS Gatling

use crate::components::{Building, CIWSTurret, DamageState, Particle, ParticleType, Projectile, TrajectoryType};
use glam::{Vec3, Vec4};

/// 3D Parabolic Quadratic Bezier Interpolation
pub fn compute_bezier_arc(p0: Vec3, p1: Vec3, p2: Vec3, t: f32) -> Vec3 {
    let u = 1.0 - t;
    u * u * p0 + 2.0 * u * t * p1 + t * t * p2
}

/// Computes projectile flight progression and Bezier trajectory updates
pub fn update_projectiles(projectiles: &mut Vec<Projectile>, dt: f32) -> Vec<(u32, Vec3, bool)> {
    let mut ground_impacts = Vec::new();

    for proj in projectiles.iter_mut() {
        if !proj.is_active {
            continue;
        }

        proj.progress += dt / proj.duration;
        let t = proj.progress.clamp(0.0, 1.0);

        // Control point calculation for Bezier arc
        let mid_point = (proj.origin + proj.target) * 0.5;
        let control_point = Vec3::new(mid_point.x, mid_point.y + proj.peak_altitude * 1.5, mid_point.z);

        proj.current_position = compute_bezier_arc(proj.origin, control_point, proj.target, t);

        if proj.progress >= 1.0 {
            proj.is_active = false;
            ground_impacts.push((proj.id, proj.target, proj.is_nuclear));
        }
    }

    ground_impacts
}

/// Mid-Air Nuclear Airburst Physics: Plasma flash, shockwave, and downward radioactive fallout shower
pub fn execute_nuclear_airburst(
    burst_position: Vec3,
    buildings: &mut [Building],
    particles: &mut Vec<Particle>,
    fallout_count: usize,
) {
    // 1. High-Altitude Atmospheric Plasma Shockwave
    particles.push(Particle {
        position: burst_position,
        velocity: Vec3::ZERO,
        color: Vec4::new(0.0, 0.94, 1.0, 0.95), // Stratospheric cyan-white plasma
        scale: 1.0,
        age: 0.0,
        max_lifespan: 2.5,
        is_active: true,
        particle_type: ParticleType::ShockwaveRing,
    });

    // 2. Spawn Downward Burning Radioactive Fallout Debris
    let wind_vector = Vec3::new(-6.0, -32.0, 8.0);
    for i in 0..fallout_count {
        let spread_x = (i as f32 % 9.0 - 4.5) * 12.0;
        let spread_z = ((i / 9) as f32 - 4.5) * 12.0;
        let spawn_pos = burst_position + Vec3::new(spread_x, (i as f32 * 1.5), spread_z);

        particles.push(Particle {
            position: spawn_pos,
            velocity: wind_vector + Vec3::new(spread_x * 0.1, -(20.0 + (i % 5) as f32 * 4.0), spread_z * 0.1),
            color: Vec4::new(1.0, 0.45, 0.0, 0.9), // Burning radioactive orange
            scale: 1.2,
            age: 0.0,
            max_lifespan: 6.5,
            is_active: true,
            particle_type: ParticleType::FalloutDebris,
        });
    }

    // 3. Partial Fallout Structural Damage (25% - 40% damage + charring to underlying grid)
    for b in buildings.iter_mut() {
        if b.state == DamageState::Rubble {
            continue;
        }
        let horizontal_dist = Vec3::new(b.position.x, 0.0, b.position.z).distance(Vec3::new(burst_position.x, 0.0, burst_position.z));
        if horizontal_dist < 180.0 {
            let dmg = 25.0 + (1.0 - (horizontal_dist / 180.0)) * 15.0; // 25% to 40% damage
            b.apply_damage(dmg);
        }
    }
}

/// Direct Land Impact Annihilation: Full mesh shatter, flying concrete debris, and rubble ruins
pub fn execute_direct_impact(
    impact_position: Vec3,
    blast_radius: f32,
    is_nuclear: bool,
    buildings: &mut [Building],
    particles: &mut Vec<Particle>,
) {
    // 1. Direct structural obliteration within blast radius
    for b in buildings.iter_mut() {
        if b.state == DamageState::Rubble {
            continue;
        }
        let dist = b.position.distance(impact_position);
        if dist <= blast_radius {
            b.apply_damage(if is_nuclear { 9999.0 } else { 120.0 });
        }
    }

    // 2. Concrete shattering flying debris
    let debris_count = if is_nuclear { 60 } else { 24 };
    for d in 0..debris_count {
        let angle = (d as f32 / debris_count as f32) * std::f32::consts::PI * 2.0;
        let speed = 25.0 + (d % 7) as f32 * 8.0;
        let vel = Vec3::new(angle.cos() * speed, 18.0 + (d % 5) as f32 * 6.0, angle.sin() * speed);

        particles.push(Particle {
            position: impact_position + Vec3::new(0.0, 2.0, 0.0),
            velocity: vel,
            color: Vec4::new(0.18, 0.18, 0.2, 1.0),
            scale: 1.5,
            age: 0.0,
            max_lifespan: 3.5,
            is_active: true,
            particle_type: ParticleType::ConcreteShatter,
        });
    }
}

/// CIWS Automated Gatling Defense System: Target tracking, 6-barrel cluster spin, and rapid tracer fire
pub fn update_ciws_turrets(
    turrets: &mut [CIWSTurret],
    projectiles: &mut [Projectile],
    particles: &mut Vec<Particle>,
    dt: f32,
) -> u32 {
    let mut interceptions = 0;

    for turret in turrets.iter_mut() {
        if turret.cooldown > 0.0 {
            turret.cooldown = (turret.cooldown - dt).max(0.0);
        }

        // Search for nearest in-range incoming enemy projectile
        let mut nearest_target = None;
        let mut min_dist = turret.range;

        for proj in projectiles.iter_mut() {
            if !proj.is_active || proj.is_player == (!turret.is_enemy) {
                continue; // Ignore friendly projectiles
            }
            let dist = turret.position.distance(proj.current_position);
            if dist < min_dist && proj.current_position.y < 220.0 {
                min_dist = dist;
                nearest_target = Some(proj);
            }
        }

        if let Some(target) = nearest_target {
            turret.current_target = Some(target.current_position);
            turret.barrel_spin += dt * 35.0; // High speed barrel rotation

            if turret.cooldown <= 0.0 {
                turret.cooldown = turret.fire_rate;

                // Spawn laser tracer line particle
                particles.push(Particle {
                    position: turret.position + Vec3::new(0.0, 3.2, 0.0),
                    velocity: (target.current_position - turret.position).normalize() * 320.0,
                    color: if turret.is_enemy {
                        Vec4::new(1.0, 0.0, 0.33, 0.95) // Hostile red tracer
                    } else {
                        Vec4::new(0.0, 0.94, 1.0, 0.95) // Friendly cyan tracer
                    },
                    scale: 1.0,
                    age: 0.0,
                    max_lifespan: 0.3,
                    is_active: true,
                    particle_type: ParticleType::CIWSTracer,
                });

                // Hit probability check
                if min_dist < 65.0 {
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
