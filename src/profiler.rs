//! Dynamic Hardware Profiler System & Adaptive Performance Scaling Engine

use serde::{Deserialize, Serialize};

/// Hardware Performance Tier determined by live frame-time profiling
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum HardwareTier {
    /// High-End Desktop GPU/CPU: Native 4K/1080p, 2000+ volumetric particles, full shadow maps, detailed debris
    HighPerformance,
    /// Balanced Mid-Range Hardware: 1080p rendering, 1000 particles, optimized shadow cascades
    Balanced,
    /// Mobile / Budget Hardware: Scaled rendering, 400 particles, simplified non-essential mesh physics, strict 60 FPS
    PowerSaver,
}

/// Dynamic Hardware Profiler tracking frame deltas, rolling average frame rates, and budget allocations
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DynamicHardwareProfiler {
    pub current_tier: HardwareTier,
    pub frame_time_history: Vec<f32>,
    pub max_history_samples: usize,
    pub average_fps: f32,
    pub average_frame_time_ms: f32,
    pub target_frame_time_ms: f32,
    pub particle_pool_capacity: usize,
    pub max_active_debris: usize,
    pub shadow_resolution: u32,
    pub render_scale: f32,
    pub consecutive_slow_frames: u32,
    pub consecutive_fast_frames: u32,
}

impl DynamicHardwareProfiler {
    pub fn new() -> Self {
        Self {
            current_tier: HardwareTier::HighPerformance,
            frame_time_history: Vec::with_capacity(60),
            max_history_samples: 60,
            average_fps: 60.0,
            average_frame_time_ms: 16.67,
            target_frame_time_ms: 16.67,
            particle_pool_capacity: 2000,
            max_active_debris: 120,
            shadow_resolution: 2048,
            render_scale: 1.0,
            consecutive_slow_frames: 0,
            consecutive_fast_frames: 0,
        }
    }

    /// Records frame delta time and dynamically adapts hardware performance scaling
    pub fn record_frame_delta(&mut self, dt: f32) {
        let frame_ms = dt * 1000.0;
        if self.frame_time_history.len() >= self.max_history_samples {
            self.frame_time_history.remove(0);
        }
        self.frame_time_history.push(frame_ms);

        // Compute rolling average
        let sum: f32 = self.frame_time_history.iter().sum();
        self.average_frame_time_ms = sum / (self.frame_time_history.len() as f32);
        self.average_fps = if self.average_frame_time_ms > 0.001 {
            1000.0 / self.average_frame_time_ms
        } else {
            60.0
        };

        // Adaptive Tier Scaling logic (Ensures rock-solid 60 FPS without skipping simulation ticks)
        if self.average_frame_time_ms > 19.5 {
            // Frame took longer than ~51 FPS budget
            self.consecutive_slow_frames += 1;
            self.consecutive_fast_frames = 0;

            if self.consecutive_slow_frames >= 20 {
                self.consecutive_slow_frames = 0;
                match self.current_tier {
                    HardwareTier::HighPerformance => {
                        self.set_tier(HardwareTier::Balanced);
                    }
                    HardwareTier::Balanced => {
                        self.set_tier(HardwareTier::PowerSaver);
                    }
                    HardwareTier::PowerSaver => {
                        // Already at lowest tier: scale down render resolution
                        self.render_scale = (self.render_scale - 0.05).max(0.75);
                    }
                }
            }
        } else if self.average_frame_time_ms < 15.0 {
            // Running fast (> 66 FPS budget)
            self.consecutive_fast_frames += 1;
            self.consecutive_slow_frames = 0;

            if self.consecutive_fast_frames >= 60 {
                self.consecutive_fast_frames = 0;
                match self.current_tier {
                    HardwareTier::PowerSaver => {
                        self.set_tier(HardwareTier::Balanced);
                    }
                    HardwareTier::Balanced => {
                        self.set_tier(HardwareTier::HighPerformance);
                    }
                    HardwareTier::HighPerformance => {
                        self.render_scale = 1.0;
                    }
                }
            }
        }
    }

    /// Sets performance configuration parameters according to hardware tier
    pub fn set_tier(&mut self, tier: HardwareTier) {
        self.current_tier = tier;
        match tier {
            HardwareTier::HighPerformance => {
                self.particle_pool_capacity = 2000;
                self.max_active_debris = 120;
                self.shadow_resolution = 2048;
                self.render_scale = 1.0;
            }
            HardwareTier::Balanced => {
                self.particle_pool_capacity = 1000;
                self.max_active_debris = 60;
                self.shadow_resolution = 1024;
                self.render_scale = 1.0;
            }
            HardwareTier::PowerSaver => {
                self.particle_pool_capacity = 400;
                self.max_active_debris = 25;
                self.shadow_resolution = 512;
                self.render_scale = 0.85;
            }
        }
    }
}
