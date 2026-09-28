//! Tactical Radar, Precision 3D Raycasting, and Throne Thriller 1 Early Warning Bridge

use crate::components::{EarlyWarningTargetInfo, TargetPin, ThreatClassification};
use glam::Vec3;
use serde::{Deserialize, Serialize};

/// Radar Minimap Bounds Transform for 2D/3D Tactical Radar HUD
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RadarTransform {
    pub min_world: Vec3,
    pub max_world: Vec3,
    pub canvas_size: f32,
}

impl RadarTransform {
    pub fn default() -> Self {
        Self {
            min_world: Vec3::new(-350.0, 0.0, -980.0),
            max_world: Vec3::new(980.0, 0.0, 350.0),
            canvas_size: 140.0,
        }
    }

    /// Convert 3D world space coordinate into 2D Radar Canvas pixels
    pub fn world_to_radar(&self, world_pos: Vec3) -> (f32, f32) {
        let span_x = self.max_world.x - self.min_world.x;
        let span_z = self.max_world.z - self.min_world.z;

        let mx = ((world_pos.x - self.min_world.x) / span_x) * self.canvas_size;
        let my = ((world_pos.z - self.min_world.z) / span_z) * self.canvas_size;

        (
            mx.clamp(2.0, self.canvas_size - 2.0),
            my.clamp(2.0, self.canvas_size - 2.0),
        )
    }

    /// Convert 2D Radar Canvas pixels into 3D world space coordinate
    pub fn radar_to_world(&self, mx: f32, my: f32) -> Vec3 {
        let span_x = self.max_world.x - self.min_world.x;
        let span_z = self.max_world.z - self.min_world.z;

        let wx = (mx / self.canvas_size) * span_x + self.min_world.x;
        let wz = (my / self.canvas_size) * span_z + self.min_world.z;

        Vec3::new(wx, 0.0, wz)
    }
}

/// Precision 3D Raycasting System (`mouse_pin_system`)
/// Computes intersection between camera ray and the Y=0 tactical battlefield plane
pub struct TerrainRaycaster;

impl TerrainRaycaster {
    /// Ray-plane intersection: ray_origin + t * ray_direction where y = 0
    pub fn intersect_ground_plane(ray_origin: Vec3, ray_dir: Vec3) -> Option<Vec3> {
        if ray_dir.y.abs() < 1e-6 {
            return None; // Ray is parallel to ground
        }
        let t = -ray_origin.y / ray_dir.y;
        if t < 0.0 {
            return None; // Intersection is behind camera
        }
        Some(ray_origin + ray_dir * t)
    }
}

/// Multi-Pin Target Lock Manager (Strict 10-12 Pin Limit)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MultiPinTargetManager {
    pub pins: Vec<TargetPin>,
    pub max_pins: usize,
    pub is_multi_pin_mode: bool,
}

impl MultiPinTargetManager {
    pub fn new() -> Self {
        Self {
            pins: Vec::with_capacity(12),
            max_pins: 12,
            is_multi_pin_mode: false,
        }
    }

    /// Add a tactical target pin at world coordinates (up to 12 maximum)
    pub fn add_pin(&mut self, coords: Vec3) -> Option<u32> {
        if self.pins.len() >= self.max_pins {
            return None;
        }
        let pin_id = (self.pins.len() + 1) as u32;
        self.pins.push(TargetPin {
            pin_id,
            coords,
            is_active: true,
            pulse_timer: 0.0,
        });
        Some(pin_id)
    }

    /// Remove a specific pin by ID
    pub fn remove_pin(&mut self, pin_id: u32) {
        self.pins.retain(|p| p.pin_id != pin_id);
    }

    /// Clear all target pins
    pub fn clear_pins(&mut self) {
        self.pins.clear();
    }

    /// Update pulse animation timer for target reticles
    pub fn update(&mut self, dt: f32) {
        for pin in self.pins.iter_mut() {
            pin.pulse_timer += dt * 4.0;
        }
    }

    /// Get all active target coordinates for synchronized multi-missile salvo
    pub fn get_salvo_targets(&self) -> Vec<Vec3> {
        self.pins
            .iter()
            .filter(|p| p.is_active)
            .map(|p| p.coords)
            .collect()
    }
}

/// Throne Thriller 1 Early Warning Spatial Trajectory Marker
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SpatialTrajectoryMarker {
    pub target_id: u32,
    pub classification: ThreatClassification,
    pub current_world_pos: Vec3,
    pub predicted_impact: Vec3,
    pub tti_seconds: f32,
    pub trajectory_waypoints: Vec<Vec3>,
    pub is_critical_nuclear: bool,
}

/// Computes 3D trajectory markers and waypoints for Throne Thriller 1 HUD Overlay
pub fn generate_spatial_trajectory_markers(
    warnings: &[EarlyWarningTargetInfo],
) -> Vec<SpatialTrajectoryMarker> {
    warnings
        .iter()
        .map(|w| {
            let mut waypoints = Vec::with_capacity(6);
            for step in 0..=5 {
                let factor = step as f32 / 5.0;
                let wp = w.current_pos.lerp(w.predicted_impact, factor);
                waypoints.push(Vec3::new(wp.x, (wp.y * (1.0 - factor)).max(0.0), wp.z));
            }

            SpatialTrajectoryMarker {
                target_id: w.projectile_id,
                classification: w.threat_class,
                current_world_pos: w.current_pos,
                predicted_impact: w.predicted_impact,
                tti_seconds: w.tti_seconds,
                trajectory_waypoints: waypoints,
                is_critical_nuclear: w.is_nuclear_hypersonic,
            }
        })
        .collect()
}
