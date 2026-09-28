//! Dynamic Hardware Profiler System & Adaptive Performance Scaling Engine (120 FPS Target)

use serde::{Deserialize, Serialize};

/// Hardware Performance Tier determined by live frame-time profiling
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum HardwareTier {
    /// High-End Desktop GPU/CPU: Native 4K/1440p, 5,000+ volumetric particles, HDR bloom, dynamic shadows, full debris physics
    HighPerformance,
    /// Balanced Mid-Range Hardware: 1080p rendering, 2,500 particles, optimized shadow cascades, 120 FPS target
    Balanced,
    /// Mobile / Budget Hardware: Scaled rendering, 1,000 particles, simplified non-essential mesh physics, strict 60-120 FPS
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
    pub target_fps: f32,
    pub target_frame_time_ms: f32,
    pub particle_pool_capacity: usize,
    pub max_active_debris: usize,
    pub shadow_resolution: u32,
    pub render_scale: f32,
    pub consecutive_slow_frames: u32,
    pub consecutive_fast_frames: u32,
    pub total_draw_calls: u32,
    pub active_particle_count: usize,
    pub sub_frame_alpha: f32,
}

impl DynamicHardwareProfiler {
    pub fn new() -> Self {
        Self {
            current_tier: HardwareTier::HighPerformance,
            frame_time_history: Vec::with_capacity(120),
            max_history_samples: 120,
            average_fps: 120.0,
            average_frame_time_ms: 8.333,
            target_fps: 120.0,
            target_frame_time_ms: 8.333,
            particle_pool_capacity: 5000,
            max_active_debris: 250,
            shadow_resolution: 2048,
            render_scale: 1.0,
            consecutive_slow_frames: 0,
            consecutive_fast_frames: 0,
            total_draw_calls: 84,
            active_particle_count: 0,
            sub_frame_alpha: 1.0,
        }
    }

    /// Records frame delta time and dynamically adapts hardware performance scaling
    pub fn record_frame_delta(&mut self, dt: f32) {
        // Delta Time Clamping: Clamp maximum dt to 0.05s (20 FPS floor) to prevent physics explosions
        let clamped_dt = dt.clamp(0.001, 0.05);
        let frame_ms = clamped_dt * 1000.0;

        if self.frame_time_history.len() >= self.max_history_samples {
            self.frame_time_history.remove(0);
        }
        self.frame_time_history.push(frame_ms);

        // Compute rolling average over up to 120 samples
        let sum: f32 = self.frame_time_history.iter().sum();
        self.average_frame_time_ms = sum / (self.frame_time_history.len() as f32);
        self.average_fps = if self.average_frame_time_ms > 0.001 {
            1000.0 / self.average_frame_time_ms
        } else {
            120.0
        };

        // Adaptive Tier Scaling logic targeting smooth 120 FPS
        if self.average_frame_time_ms > 14.5 {
            // Frame took longer than ~68 FPS budget (budget dropped)
            self.consecutive_slow_frames += 1;
            self.consecutive_fast_frames = 0;

            if self.consecutive_slow_frames >= 24 {
                self.consecutive_slow_frames = 0;
                match self.current_tier {
                    HardwareTier::HighPerformance => {
                        self.set_tier(HardwareTier::Balanced);
                    }
                    HardwareTier::Balanced => {
                        self.set_tier(HardwareTier::PowerSaver);
                    }
                    HardwareTier::PowerSaver => {
                        // Already at lowest tier: scale down render resolution slightly
                        self.render_scale = (self.render_scale - 0.05).max(0.70);
                    }
                }
            }
        } else if self.average_frame_time_ms < 9.5 {
            // Running comfortably above ~105 FPS
            self.consecutive_fast_frames += 1;
            self.consecutive_slow_frames = 0;

            if self.consecutive_fast_frames >= 90 {
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
                self.particle_pool_capacity = 5000;
                self.max_active_debris = 250;
                self.shadow_resolution = 2048;
                self.render_scale = 1.0;
                self.total_draw_calls = 96;
            }
            HardwareTier::Balanced => {
                self.particle_pool_capacity = 2500;
                self.max_active_debris = 120;
                self.shadow_resolution = 1024;
                self.render_scale = 1.0;
                self.total_draw_calls = 68;
            }
            HardwareTier::PowerSaver => {
                self.particle_pool_capacity = 1000;
                self.max_active_debris = 50;
                self.shadow_resolution = 512;
                self.render_scale = 0.85;
                self.total_draw_calls = 42;
            }
        }
    }
}
