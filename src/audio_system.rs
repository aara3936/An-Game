//! Procedural Web Audio Synthesis Engine & WebAssembly Audio Bridge

use wasm_bindgen::prelude::*;
use web_sys::{AudioContext, AudioDestinationNode, BiquadFilterNode, BiquadFilterType, GainNode, OscillatorNode, OscillatorType};

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
            self.emp_mute_timer -= dt;
        }
    }

    /// Triggers synthesized sound effects through browser Web Audio API
    pub fn play_sound(&mut self, effect: SoundEffect) {
        if self.is_muted {
            return;
        }

        // If active EMP Mute is engaged and this isn't the airburst itself, suppress playback
        if self.emp_mute_timer > 0.0 && effect != SoundEffect::AirburstEMPMute && effect != SoundEffect::StratosphericAirburst {
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
                            let _ = osc.frequency().set_value_at_time(420.0, now);
                            let _ = osc.frequency().exponential_ramp_to_value_at_time(38.0, now + 0.75);
                            let _ = gain.gain().set_value_at_time(0.7, now);
                            let _ = gain.gain().exponential_ramp_to_value_at_time(0.001, now + 0.8);
                            let _ = osc.connect_with_audio_node(&gain);
                            let _ = gain.connect_with_audio_node(&ctx.destination());
                            let _ = osc.start();
                            let _ = osc.stop_with_when(now + 0.85);
                        }
                    }
                }
                SoundEffect::MissileLaunch => {
                    if let Ok(osc) = ctx.create_oscillator() {
                        if let Ok(gain) = ctx.create_gain() {
                            osc.set_type(OscillatorType::Triangle);
                            let _ = osc.frequency().set_value_at_time(150.0, now);
                            let _ = osc.frequency().exponential_ramp_to_value_at_time(600.0, now + 0.9);
                            let _ = gain.gain().set_value_at_time(0.4, now);
                            let _ = gain.gain().exponential_ramp_to_value_at_time(0.001, now + 1.0);
                            let _ = osc.connect_with_audio_node(&gain);
                            let _ = gain.connect_with_audio_node(&ctx.destination());
                            let _ = osc.start();
                            let _ = osc.stop_with_when(now + 1.0);
                        }
                    }
                }
                SoundEffect::DirectImpactHeavy => {
                    // Deep low-frequency seismic detonation rumble
                    if let Ok(osc) = ctx.create_oscillator() {
                        if let Ok(gain) = ctx.create_gain() {
                            osc.set_type(OscillatorType::Sine);
                            let _ = osc.frequency().set_value_at_time(180.0, now);
                            let _ = osc.frequency().exponential_ramp_to_value_at_time(22.0, now + 3.2);
                            let _ = gain.gain().set_value_at_time(0.95, now);
                            let _ = gain.gain().exponential_ramp_to_value_at_time(0.001, now + 3.5);
                            let _ = osc.connect_with_audio_node(&gain);
                            let _ = gain.connect_with_audio_node(&ctx.destination());
                            let _ = osc.start();
                            let _ = osc.stop_with_when(now + 3.5);
                        }
                    }
                }
                SoundEffect::DirectImpactLight => {
                    if let Ok(osc) = ctx.create_oscillator() {
                        if let Ok(gain) = ctx.create_gain() {
                            osc.set_type(OscillatorType::Triangle);
                            let _ = osc.frequency().set_value_at_time(280.0, now);
                            let _ = osc.frequency().exponential_ramp_to_value_at_time(40.0, now + 0.6);
                            let _ = gain.gain().set_value_at_time(0.5, now);
                            let _ = gain.gain().exponential_ramp_to_value_at_time(0.001, now + 0.65);
                            let _ = osc.connect_with_audio_node(&gain);
                            let _ = gain.connect_with_audio_node(&ctx.destination());
                            let _ = osc.start();
                            let _ = osc.stop_with_when(now + 0.65);
                        }
                    }
                }
                SoundEffect::StratosphericAirburst => {
                    if let Ok(osc) = ctx.create_oscillator() {
                        if let Ok(gain) = ctx.create_gain() {
                            osc.set_type(OscillatorType::Triangle);
                            let _ = osc.frequency().set_value_at_time(1400.0, now);
                            let _ = osc.frequency().exponential_ramp_to_value_at_time(48.0, now + 2.0);
                            let _ = gain.gain().set_value_at_time(0.85, now);
                            let _ = gain.gain().exponential_ramp_to_value_at_time(0.001, now + 2.0);
                            let _ = osc.connect_with_audio_node(&gain);
                            let _ = gain.connect_with_audio_node(&ctx.destination());
                            let _ = osc.start();
                            let _ = osc.stop_with_when(now + 2.0);
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
                            let _ = osc.frequency().set_value_at_time(780.0, now);
                            let _ = osc.frequency().exponential_ramp_to_value_at_time(110.0, now + 0.08);
                            let _ = gain.gain().set_value_at_time(0.22, now);
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
                            let _ = osc.frequency().set_value_at_time(460.0, now);
                            let _ = osc.frequency().linear_ramp_to_value_at_time(880.0, now + 0.5);
                            let _ = osc.frequency().linear_ramp_to_value_at_time(460.0, now + 1.0);
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
                            let _ = osc.frequency().set_value_at_time(520.0, now);
                            let _ = osc.frequency().linear_ramp_to_value_at_time(960.0, now + 0.4);
                            let _ = gain.gain().set_value_at_time(0.4, now);
                            let _ = gain.gain().exponential_ramp_to_value_at_time(0.001, now + 0.8);
                            let _ = osc.connect_with_audio_node(&gain);
                            let _ = gain.connect_with_audio_node(&ctx.destination());
                            let _ = osc.start();
                            let _ = osc.stop_with_when(now + 0.8);
                        }
                    }
                }
                SoundEffect::LaserBeamCIWS => {
                    if let Ok(osc) = ctx.create_oscillator() {
                        if let Ok(gain) = ctx.create_gain() {
                            osc.set_type(OscillatorType::Sawtooth);
                            let _ = osc.frequency().set_value_at_time(1700.0, now);
                            let _ = osc.frequency().exponential_ramp_to_value_at_time(220.0, now + 0.32);
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
                            let _ = osc.frequency().set_value_at_time(880.0, now);
                            let _ = gain.gain().set_value_at_time(0.15, now);
                            let _ = gain.gain().exponential_ramp_to_value_at_time(0.001, now + 0.12);
                            let _ = osc.connect_with_audio_node(&gain);
                            let _ = gain.connect_with_audio_node(&ctx.destination());
                            let _ = osc.start();
                            let _ = osc.stop_with_when(now + 0.12);
                        }
                    }
                }
            }
        }
    }
}
