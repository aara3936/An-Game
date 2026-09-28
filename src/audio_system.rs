//! Procedural Web Audio Synthesis Engine & WebAssembly Audio Bridge
//! Synthesizes Sonic Booms, Nuclear Detonation Seismic Rumbles, 1.5s EMP Silence, CIWS Gatling Bursts, and Emergency Sirens

use wasm_bindgen::prelude::*;
use web_sys::{AudioContext, OscillatorType};

/// Sound Effect Types synthesizeable by the Rust Procedural Audio Engine
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SoundEffect {
    SonicBoom,
    MissileLaunch,
    DirectImpactHeavy,
    DirectImpactLight,
    StratosphericAirburst,
    AirburstEMPMute,
    CIWSGatlingBurst,
    AirRaidSiren,
    NuclearEmergencySiren,
    LaserBeamCIWS,
    RadarPing,
    TargetLockBeep,
}

/// Web Audio Bridge for WebAssembly execution
#[wasm_bindgen]
pub struct WasmAudioEngine {
    #[wasm_bindgen(skip)]
    pub is_muted: bool,
    #[wasm_bindgen(skip)]
    pub emp_mute_timer: f32,
}

impl WasmAudioEngine {
    pub fn new() -> Self {
        Self {
            is_muted: false,
            emp_mute_timer: 0.0,
        }
    }

    pub fn update(&mut self, dt: f32) {
        if self.emp_mute_timer > 0.0 {
            self.emp_mute_timer = (self.emp_mute_timer - dt).max(0.0);
        }
    }

    /// Triggers synthesized sound effects through browser Web Audio API
    pub fn play_sound(&mut self, effect: SoundEffect) {
        if self.is_muted {
            return;
        }

        // If active EMP Mute is engaged and this isn't the airburst itself, suppress playback
        if self.emp_mute_timer > 0.0
            && effect != SoundEffect::AirburstEMPMute
            && effect != SoundEffect::StratosphericAirburst
        {
            return;
        }

        if let Ok(ctx) = AudioContext::new() {
            let now = ctx.current_time();

            match effect {
                SoundEffect::SonicBoom => {
                    // Fast pitch-decayed noise boom
                    if let Ok(osc) = ctx.create_oscillator() {
                        if let Ok(gain) = ctx.create_gain() {
                            osc.set_type(OscillatorType::Sawtooth);
                            let _ = osc.frequency().set_value_at_time(440.0, now);
                            let _ = osc.frequency().exponential_ramp_to_value_at_time(36.0, now + 0.85);
                            let _ = gain.gain().set_value_at_time(0.75, now);
                            let _ = gain.gain().exponential_ramp_to_value_at_time(0.001, now + 0.9);
                            let _ = osc.connect_with_audio_node(&gain);
                            let _ = gain.connect_with_audio_node(&ctx.destination());
                            let _ = osc.start();
                            let _ = osc.stop_with_when(now + 0.95);
                        }
                    }
                }
                SoundEffect::MissileLaunch => {
                    if let Ok(osc) = ctx.create_oscillator() {
                        if let Ok(gain) = ctx.create_gain() {
                            osc.set_type(OscillatorType::Triangle);
                            let _ = osc.frequency().set_value_at_time(140.0, now);
                            let _ = osc.frequency().exponential_ramp_to_value_at_time(680.0, now + 0.95);
                            let _ = gain.gain().set_value_at_time(0.45, now);
                            let _ = gain.gain().exponential_ramp_to_value_at_time(0.001, now + 1.05);
                            let _ = osc.connect_with_audio_node(&gain);
                            let _ = gain.connect_with_audio_node(&ctx.destination());
                            let _ = osc.start();
                            let _ = osc.stop_with_when(now + 1.1);
                        }
                    }
                }
                SoundEffect::DirectImpactHeavy => {
                    // Deep low-frequency seismic detonation rumble (sub-bass 22Hz)
                    if let Ok(osc) = ctx.create_oscillator() {
                        if let Ok(gain) = ctx.create_gain() {
                            osc.set_type(OscillatorType::Sine);
                            let _ = osc.frequency().set_value_at_time(190.0, now);
                            let _ = osc.frequency().exponential_ramp_to_value_at_time(22.0, now + 3.4);
                            let _ = gain.gain().set_value_at_time(0.95, now);
                            let _ = gain.gain().exponential_ramp_to_value_at_time(0.001, now + 3.6);
                            let _ = osc.connect_with_audio_node(&gain);
                            let _ = gain.connect_with_audio_node(&ctx.destination());
                            let _ = osc.start();
                            let _ = osc.stop_with_when(now + 3.6);
                        }
                    }
                }
                SoundEffect::DirectImpactLight => {
                    if let Ok(osc) = ctx.create_oscillator() {
                        if let Ok(gain) = ctx.create_gain() {
                            osc.set_type(OscillatorType::Triangle);
                            let _ = osc.frequency().set_value_at_time(290.0, now);
                            let _ = osc.frequency().exponential_ramp_to_value_at_time(42.0, now + 0.65);
                            let _ = gain.gain().set_value_at_time(0.5, now);
                            let _ = gain.gain().exponential_ramp_to_value_at_time(0.001, now + 0.7);
                            let _ = osc.connect_with_audio_node(&gain);
                            let _ = gain.connect_with_audio_node(&ctx.destination());
                            let _ = osc.start();
                            let _ = osc.stop_with_when(now + 0.7);
                        }
                    }
                }
                SoundEffect::StratosphericAirburst => {
                    if let Ok(osc) = ctx.create_oscillator() {
                        if let Ok(gain) = ctx.create_gain() {
                            osc.set_type(OscillatorType::Triangle);
                            let _ = osc.frequency().set_value_at_time(1500.0, now);
                            let _ = osc.frequency().exponential_ramp_to_value_at_time(45.0, now + 2.2);
                            let _ = gain.gain().set_value_at_time(0.9, now);
                            let _ = gain.gain().exponential_ramp_to_value_at_time(0.001, now + 2.2);
                            let _ = osc.connect_with_audio_node(&gain);
                            let _ = gain.connect_with_audio_node(&ctx.destination());
                            let _ = osc.start();
                            let _ = osc.stop_with_when(now + 2.2);
                        }
                    }
                }
                SoundEffect::AirburstEMPMute => {
                    // Set 1.5 second global EMP silence period
                    self.emp_mute_timer = 1.5;
                }
                SoundEffect::CIWSGatlingBurst => {
                    // High-cadence metallic Gatling gunshot
                    if let Ok(osc) = ctx.create_oscillator() {
                        if let Ok(gain) = ctx.create_gain() {
                            osc.set_type(OscillatorType::Sawtooth);
                            let _ = osc.frequency().set_value_at_time(820.0, now);
                            let _ = osc.frequency().exponential_ramp_to_value_at_time(110.0, now + 0.08);
                            let _ = gain.gain().set_value_at_time(0.24, now);
                            let _ = gain.gain().exponential_ramp_to_value_at_time(0.001, now + 0.08);
                            let _ = osc.connect_with_audio_node(&gain);
                            let _ = gain.connect_with_audio_node(&ctx.destination());
                            let _ = osc.start();
                            let _ = osc.stop_with_when(now + 0.08);
                        }
                    }
                }
                SoundEffect::AirRaidSiren => {
                    if let Ok(osc) = ctx.create_oscillator() {
                        if let Ok(gain) = ctx.create_gain() {
                            osc.set_type(OscillatorType::Triangle);
                            let _ = osc.frequency().set_value_at_time(480.0, now);
                            let _ = osc.frequency().linear_ramp_to_value_at_time(900.0, now + 0.5);
                            let _ = osc.frequency().linear_ramp_to_value_at_time(480.0, now + 1.0);
                            let _ = gain.gain().set_value_at_time(0.35, now);
                            let _ = gain.gain().exponential_ramp_to_value_at_time(0.001, now + 1.2);
                            let _ = osc.connect_with_audio_node(&gain);
                            let _ = gain.connect_with_audio_node(&ctx.destination());
                            let _ = osc.start();
                            let _ = osc.stop_with_when(now + 1.2);
                        }
                    }
                }
                SoundEffect::NuclearEmergencySiren => {
                    if let Ok(osc) = ctx.create_oscillator() {
                        if let Ok(gain) = ctx.create_gain() {
                            osc.set_type(OscillatorType::Sawtooth);
                            let _ = osc.frequency().set_value_at_time(540.0, now);
                            let _ = osc.frequency().linear_ramp_to_value_at_time(980.0, now + 0.4);
                            let _ = gain.gain().set_value_at_time(0.42, now);
                            let _ = gain.gain().exponential_ramp_to_value_at_time(0.001, now + 0.85);
                            let _ = osc.connect_with_audio_node(&gain);
                            let _ = gain.connect_with_audio_node(&ctx.destination());
                            let _ = osc.start();
                            let _ = osc.stop_with_when(now + 0.85);
                        }
                    }
                }
                SoundEffect::LaserBeamCIWS => {
                    if let Ok(osc) = ctx.create_oscillator() {
                        if let Ok(gain) = ctx.create_gain() {
                            osc.set_type(OscillatorType::Sawtooth);
                            let _ = osc.frequency().set_value_at_time(1800.0, now);
                            let _ = osc.frequency().exponential_ramp_to_value_at_time(240.0, now + 0.32);
                            let _ = gain.gain().set_value_at_time(0.28, now);
                            let _ = gain.gain().exponential_ramp_to_value_at_time(0.001, now + 0.35);
                            let _ = osc.connect_with_audio_node(&gain);
                            let _ = gain.connect_with_audio_node(&ctx.destination());
                            let _ = osc.start();
                            let _ = osc.stop_with_when(now + 0.35);
                        }
                    }
                }
                SoundEffect::RadarPing => {
                    if let Ok(osc) = ctx.create_oscillator() {
                        if let Ok(gain) = ctx.create_gain() {
                            osc.set_type(OscillatorType::Sine);
                            let _ = osc.frequency().set_value_at_time(920.0, now);
                            let _ = gain.gain().set_value_at_time(0.18, now);
                            let _ = gain.gain().exponential_ramp_to_value_at_time(0.001, now + 0.12);
                            let _ = osc.connect_with_audio_node(&gain);
                            let _ = gain.connect_with_audio_node(&ctx.destination());
                            let _ = osc.start();
                            let _ = osc.stop_with_when(now + 0.12);
                        }
                    }
                }
                SoundEffect::TargetLockBeep => {
                    if let Ok(osc) = ctx.create_oscillator() {
                        if let Ok(gain) = ctx.create_gain() {
                            osc.set_type(OscillatorType::Sine);
                            let _ = osc.frequency().set_value_at_time(1250.0, now);
                            let _ = gain.gain().set_value_at_time(0.25, now);
                            let _ = gain.gain().exponential_ramp_to_value_at_time(0.001, now + 0.08);
                            let _ = osc.connect_with_audio_node(&gain);
                            let _ = gain.connect_with_audio_node(&ctx.destination());
                            let _ = osc.start();
                            let _ = osc.stop_with_when(now + 0.08);
                        }
                    }
                }
            }
        }
    }
}
