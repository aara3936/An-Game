//! Tactical Radar, Multi-Pin Targeting & Coordinate Bridge

use crate::components::TargetPin;
use glam::Vec3;
use serde::{Deserialize, Serialize};

/// Radar Minimap Bounds Transform
pub struct RadarTransform {
    pub min_world: Vec3,
    pub max_world: Vec3,
    pub canvas_size: f32,
}

impl RadarTransform {
    pub fn default() -> Self {
        Self {
            min_world: Vec3::new(-260.0, 0.0, -920.0),
            max_world: Vec3::new(920.0, 0.0, 260.0),
            canvas_size: 132.0,
        }
    }

    /// Convert 3D world space coordinate into 2D Radar Canvas pixels
    pub fn world_to_radar(&self, world_pos: Vec3) -> (f32, f32) {
        let span_x = self.max_world.x - self.min_world.x;
        let span_z = self.max_world.z - self.min_world.z;

        let mx = ((world_pos.x - self.min_world.x) / span_x) * self.canvas_size;
        let my = ((world_pos.z - self.min_world.z) / span_z) * self.canvas_size;

        (mx.clamp(2.0, self.canvas_size - 2.0), my.clamp(2.0, self.canvas_size - 2.0))
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

/// Multi-Pin Target Lock Manager (10-12 Pin Limit)
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

    /// Add a target pin at world coordinates (up to 12)
    pub fn add_pin(&mut self, coords: Vec3) -> Option<u32> {
        if self.pins.len() >= self.max_pins {
            return None;
        }
        let pin_id = (self.pins.len() + 1) as u32;
        self.pins.push(TargetPin {
            pin_id,
            coords,
            is_active: true,
        });
        Some(pin_id)
    }

    /// Clear all target pins
    pub fn clear_pins(&mut self) {
        self.pins.clear();
    }

    /// Get all active target coordinates for synchronized multi-missile salvo
    pub fn get_salvo_targets(&self) -> Vec<Vec3> {
        self.pins.iter().filter(|p| p.is_active).map(|p| p.coords).collect()
    }
}
