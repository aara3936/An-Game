//! Procedural Environmental Weather System (Clear, Rain Showers, Heavy Thunderstorm)
//! Simulates atmospheric changes, dynamic wind drift, rain precipitation, lightning strike generators, and radar attenuation

use glam::Vec3;
use serde::{Deserialize, Serialize};

/// Weather State Machine
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum WeatherCondition {
    /// Optimal visibility, calm atmospheric winds (< 10 km/h)
    ClearSkies,
    /// Low-to-moderate rain, cloud density 0.55, wind drift ~35 km/h, slight radar attenuation
    RainShower,
    /// Severe convective storm, cloud density 0.95, heavy crosswinds (~75-110 km/h), stochastic lightning strikes, heavy radar noise clutter
    HeavyThunderstorm,
}

/// Atmospheric Weather Parameters
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WeatherState {
    pub current_condition: WeatherCondition,
    pub previous_condition: WeatherCondition,
    /// Interpolation factor between previous and current condition (0.0 -> 1.0)
    pub transition_progress: f32,
    /// Total duration in seconds for current weather condition
    pub state_timer: f32,
    pub state_duration: f32,
    /// Wind vector affecting projectile drift, rain angles, and radioactive fallout
    pub wind_vector: Vec3,
    pub wind_speed_kmh: f32,
    /// Precipitation intensity (0.0 for clear, 0.45 for rain, 1.0 for storm)
    pub precipitation_intensity: f32,
    /// Cloud cover darkness and fog density multiplier
    pub cloud_density: f32,
    pub fog_density: f32,
    /// Environmental challenge: Radar signal attenuation (0.0 = clean, up to 0.45 = false echoes / tracking noise)
    pub radar_attenuation: f32,
    /// Lightning strike active flag and illumination intensity (0.0 to 1.0)
    pub lightning_flash_intensity: f32,
    pub lightning_timer: f32,
    pub lightning_strike_count: u32,
    /// Ambient illumination tint (RGB multiplier)
    pub ambient_light_multiplier: Vec3,
}

impl Default for WeatherState {
    fn default() -> Self {
        Self::new()
    }
}

impl WeatherState {
    pub fn new() -> Self {
        Self {
            current_condition: WeatherCondition::ClearSkies,
            previous_condition: WeatherCondition::ClearSkies,
            transition_progress: 1.0,
            state_timer: 0.0,
            state_duration: 38.0, // Clear skies for ~38s initially
            wind_vector: Vec3::new(4.0, 0.0, 3.0),
            wind_speed_kmh: 8.5,
            precipitation_intensity: 0.0,
            cloud_density: 0.15,
            fog_density: 0.0018,
            radar_attenuation: 0.0,
            lightning_flash_intensity: 0.0,
            lightning_timer: 4.0,
            lightning_strike_count: 0,
            ambient_light_multiplier: Vec3::new(1.0, 1.0, 1.0),
        }
    }

    /// Advance procedural weather state machine and calculate environmental challenge factors
    pub fn update(&mut self, dt: f32) -> Option<WeatherCondition> {
        self.state_timer += dt;

        // Transition progress interpolation
        if self.transition_progress < 1.0 {
            self.transition_progress = (self.transition_progress + dt * 0.25).min(1.0); // 4s smooth transition
        }

        // Periodic procedural cycle: ClearSkies (35s) -> RainShower (30s) -> HeavyThunderstorm (26s) -> repeat
        let mut condition_changed = None;
        if self.state_timer >= self.state_duration {
            self.state_timer = 0.0;
            self.previous_condition = self.current_condition;
            self.transition_progress = 0.0;

            let next_condition = match self.current_condition {
                WeatherCondition::ClearSkies => {
                    self.state_duration = 32.0;
                    WeatherCondition::RainShower
                }
                WeatherCondition::RainShower => {
                    self.state_duration = 28.0;
                    WeatherCondition::HeavyThunderstorm
                }
                WeatherCondition::HeavyThunderstorm => {
                    self.state_duration = 40.0;
                    WeatherCondition::ClearSkies
                }
            };
            self.current_condition = next_condition;
            condition_changed = Some(next_condition);
        }

        // Target environmental properties based on active weather condition
        let (target_precip, target_clouds, target_fog, target_wind, target_attenuation, target_light) =
            match self.current_condition {
                WeatherCondition::ClearSkies => (
                    0.0,
                    0.12,
                    0.0016,
                    Vec3::new(5.0, 0.0, 4.0),
                    0.0,
                    Vec3::new(1.0, 1.0, 1.0),
                ),
                WeatherCondition::RainShower => (
                    0.55,
                    0.65,
                    0.0032,
                    Vec3::new(-22.0, 0.0, 16.0),
                    0.18,
                    Vec3::new(0.68, 0.74, 0.82),
                ),
                WeatherCondition::HeavyThunderstorm => (
                    1.0,
                    0.98,
                    0.0055,
                    Vec3::new(-48.0, 0.0, 36.0),
                    0.42,
                    Vec3::new(0.35, 0.38, 0.48),
                ),
            };

        // Smooth lerp to target atmospheric attributes
        let blend_speed = dt * 1.5;
        self.precipitation_intensity += (target_precip - self.precipitation_intensity) * blend_speed;
        self.cloud_density += (target_clouds - self.cloud_density) * blend_speed;
        self.fog_density += (target_fog - self.fog_density) * blend_speed;
        self.wind_vector = self.wind_vector.lerp(target_wind, blend_speed);
        self.wind_speed_kmh = self.wind_vector.length() * 1.8;
        self.radar_attenuation += (target_attenuation - self.radar_attenuation) * blend_speed;
        self.ambient_light_multiplier = self.ambient_light_multiplier.lerp(target_light, blend_speed);

        // Lightning strike generator for HeavyThunderstorm
        if self.current_condition == WeatherCondition::HeavyThunderstorm {
            self.lightning_timer -= dt;
            if self.lightning_timer <= 0.0 {
                // Strike! Reset timer with pseudo-random cadence (between 2.5s and 6.5s)
                let rand_seed = (self.lightning_strike_count * 17 + 7) % 100;
                self.lightning_timer = 2.4 + (rand_seed as f32 * 0.04);
                self.lightning_flash_intensity = 1.0;
                self.lightning_strike_count += 1;
            }
        }

        // Decay lightning illumination flash quickly
        if self.lightning_flash_intensity > 0.0 {
            self.lightning_flash_intensity = (self.lightning_flash_intensity - dt * 4.5).max(0.0);
        }

        condition_changed
    }

    /// Force switch to specific weather state (for manual tactical overrides)
    pub fn force_set_condition(&mut self, condition: WeatherCondition) {
        self.previous_condition = self.current_condition;
        self.current_condition = condition;
        self.transition_progress = 0.0;
        self.state_timer = 0.0;
        self.state_duration = match condition {
            WeatherCondition::ClearSkies => 40.0,
            WeatherCondition::RainShower => 32.0,
            WeatherCondition::HeavyThunderstorm => 28.0,
        };
    }

    /// Calculate wind deflection force on a moving projectile or particle
    pub fn calculate_wind_deflection(&self, mass_factor: f32, dt: f32) -> Vec3 {
        // High winds displace light warheads, flares, and falling fallout
        self.wind_vector * (dt * mass_factor * 0.12)
    }

    /// Apply radar clutter noise to tracking coordinates in severe weather
    pub fn perturb_radar_coordinate(&self, clean_pos: Vec3, seed: u32) -> Vec3 {
        if self.radar_attenuation <= 0.05 {
            return clean_pos;
        }
        let noise_phase = (seed as f32 * 0.73 + self.state_timer * 3.5).sin();
        let noise_mag = self.radar_attenuation * 18.0;
        clean_pos + Vec3::new(noise_phase * noise_mag, 0.0, (noise_phase * 1.5).cos() * noise_mag)
    }
}
