//! Autonomous 7-State Tactical AI Brain & Commander Engine

use glam::Vec3;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// The 7 Dynamic Tactical States of the Enemy Commander AI Brain
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum AIState {
    /// Baseline peace and passive airspace monitoring
    Idle,
    /// Airspace violation detected; scanning vectors and issuing warnings
    Reconnaissance,
    /// Counter-battery fire prioritized at player's highest-threat launch sites
    TacticalCounter,
    /// Low-threat decoy salvos deployed to drain player CIWS and SAM cooldowns
    DeceitSalvo,
    /// Synchronized multi-battery ballistic offensive across all sectors
    AllOutOffensive,
    /// Omega Silo Tactical Atomic Strike protocol executed upon rejection or critical collapse
    DesperateNuclear,
    /// Interactive Ceasefire & Surrender offered when integrity drops below 25%
    DiplomaticSurrender,
}

/// Diplomatic Alert Status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum DiplomaticStance {
    Peace,
    WarningAirspace,
    WarDeclared,
    SurrenderOffered,
    AtomicRetaliation,
}

/// Threat profile for individual player launch platforms
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThreatProfile {
    pub name: String,
    pub platform_type: String,
    pub position: Vec3,
    pub threat_score: f32,
    pub attacks_logged: u32,
}

/// Autonomous Tactical Enemy AI Brain System
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EnemyAIBrain {
    pub state: AIState,
    pub diplomatic_stance: DiplomaticStance,
    pub war_declared: bool,
    pub surrender_offered: bool,
    pub ceasefire_accepted: bool,
    pub atomic_fired: bool,
    pub eval_timer: f32,
    pub attack_timer: f32,
    pub interceptor_cooldown: f32,
    pub airspace_violation_timer: f32,
    pub desperation_grace_timer: f32,
    pub decoy_counter: u32,
    pub player_threat_map: HashMap<String, ThreatProfile>,
    pub notifications: Vec<String>,
}

impl EnemyAIBrain {
    pub fn new() -> Self {
        let mut threat_map = HashMap::new();
        threat_map.insert(
            "silo_0".to_string(),
            ThreatProfile {
                name: "ICBM SILO #1".to_string(),
                platform_type: "silo".to_string(),
                position: Vec3::new(-20.0, 0.0, -20.0),
                threat_score: 0.0,
                attacks_logged: 0,
            },
        );
        threat_map.insert(
            "silo_1".to_string(),
            ThreatProfile {
                name: "ICBM SILO #2".to_string(),
                platform_type: "silo".to_string(),
                position: Vec3::new(20.0, 0.0, -20.0),
                threat_score: 0.0,
                attacks_logged: 0,
            },
        );
        threat_map.insert(
            "sub_0".to_string(),
            ThreatProfile {
                name: "SSBN-01 TRIDENT".to_string(),
                platform_type: "sub".to_string(),
                position: Vec3::new(225.0, 0.0, -165.0),
                threat_score: 0.0,
                attacks_logged: 0,
            },
        );
        threat_map.insert(
            "radar_citadel".to_string(),
            ThreatProfile {
                name: "S-25 RADAR CITADEL".to_string(),
                platform_type: "radar".to_string(),
                position: Vec3::new(0.0, 0.0, 0.0),
                threat_score: 0.0,
                attacks_logged: 0,
            },
        );

        Self {
            state: AIState::Idle,
            diplomatic_stance: DiplomaticStance::Peace,
            war_declared: false,
            surrender_offered: false,
            ceasefire_accepted: false,
            atomic_fired: false,
            eval_timer: 0.0,
            attack_timer: 3.5,
            interceptor_cooldown: 0.0,
            airspace_violation_timer: 0.0,
            desperation_grace_timer: 9.0,
            decoy_counter: 0,
            player_threat_map: threat_map,
            notifications: Vec::new(),
        }
    }

    /// Record an incoming attack from a player installation and escalate threat mapping
    pub fn record_player_attack(&mut self, source_key: &str, threat_weight: f32) {
        if self.state == AIState::DiplomaticSurrender && !self.ceasefire_accepted {
            self.reject_ceasefire();
            return;
        }

        if let Some(profile) = self.player_threat_map.get_mut(source_key) {
            profile.threat_score += threat_weight;
            profile.attacks_logged += 1;
        }

        if !self.war_declared {
            self.declare_war();
        } else if self.state != AIState::DesperateNuclear && self.state != AIState::DiplomaticSurrender {
            self.state = AIState::TacticalCounter;
            self.notifications.push(format!(
                "ENEMY AI: PRIORITIZING COUNTER-BATTERY ON {}",
                source_key.to_uppercase()
            ));
        }
    }

    /// Check for sovereign airspace violations by player recon drones or targeting reticles
    pub fn check_airspace(&mut self, target_coords: Vec3, drone_pos: Vec3, dt: f32) {
        if self.war_declared || self.state == AIState::DiplomaticSurrender || self.state == AIState::DesperateNuclear {
            return;
        }

        // Sovereign Enemy Sector boundaries: X [550, 890], Z [-890, -550]
        let is_breaching = (target_coords.x >= 550.0 && target_coords.z <= -550.0)
            || (drone_pos.x >= 550.0 && drone_pos.z <= -550.0);

        if is_breaching {
            self.airspace_violation_timer += dt;
            if self.state == AIState::Idle {
                self.state = AIState::Reconnaissance;
                self.diplomatic_stance = DiplomaticStance::WarningAirspace;
                self.notifications
                    .push("⚠️ ENEMY AI: AIRSPACE VIOLATION DETECTED. CEASE IMMEDIATELY.".to_string());
            }

            if self.airspace_violation_timer >= 3.5 && !self.war_declared {
                self.declare_war();
            }
        } else if self.state == AIState::Reconnaissance {
            self.airspace_violation_timer = (self.airspace_violation_timer - dt * 0.8).max(0.0);
            if self.airspace_violation_timer <= 0.0 {
                self.state = AIState::Idle;
                self.diplomatic_stance = DiplomaticStance::Peace;
                self.notifications
                    .push("AIRSPACE COMPLIANCE RESTORED: ENEMY AI RETURNING TO STANDBY".to_string());
            }
        }
    }

    /// Formal declaration of war
    pub fn declare_war(&mut self) {
        if self.war_declared {
            return;
        }
        self.war_declared = true;
        self.state = AIState::AllOutOffensive;
        self.diplomatic_stance = DiplomaticStance::WarDeclared;
        self.notifications
            .push("⚔️ ENEMY AI HAS DECLARED WAR! ALL HOSTILE BATTERIES MOBILIZED".to_string());
    }

    /// Trigger surrender negotiation when integrity drops below 25%
    pub fn offer_ceasefire(&mut self) {
        if self.surrender_offered || self.atomic_fired {
            return;
        }
        self.surrender_offered = true;
        self.state = AIState::DiplomaticSurrender;
        self.diplomatic_stance = DiplomaticStance::SurrenderOffered;
        self.notifications
            .push("🏳️ ENEMY AI BROADCAST SURRENDER & CEASEFIRE OFFER".to_string());
    }

    /// Player accepts ceasefire
    pub fn accept_ceasefire(&mut self) {
        self.ceasefire_accepted = true;
        self.diplomatic_stance = DiplomaticStance::Peace;
        self.notifications
            .push("🕊️ DIPLOMATIC PEACE TREATY RATIFIED BY BOTH COMMANDS".to_string());
    }

    /// Player rejects ceasefire: Immediate Atomic Nuclear Escalation
    pub fn reject_ceasefire(&mut self) {
        self.state = AIState::DesperateNuclear;
        self.diplomatic_stance = DiplomaticStance::AtomicRetaliation;
        self.atomic_fired = true;
        self.notifications
            .push("⚠️ SURRENDER REJECTED: ENEMY AI HAS ENGAGED OMEGA ATOMIC STRIKE!".to_string());
    }

    /// Compute highest-threat player launch site for surgical counter-battery fire
    pub fn get_highest_threat_target(&self) -> Option<Vec3> {
        let mut highest_score = -1.0;
        let mut chosen_pos = None;

        for profile in self.player_threat_map.values() {
            if profile.threat_score > highest_score {
                highest_score = profile.threat_score;
                chosen_pos = Some(profile.position);
            }
        }
        chosen_pos
    }

    /// Main frame update tick
    pub fn update(&mut self, enemy_integrity_ratio: f32, dt: f32) {
        if self.ceasefire_accepted {
            return;
        }

        if self.interceptor_cooldown > 0.0 {
            self.interceptor_cooldown -= dt;
        }

        self.eval_timer += dt;
        if self.eval_timer >= 0.5 {
            self.eval_timer = 0.0;

            // Surrender Check (< 25% integrity)
            if enemy_integrity_ratio < 0.25 && !self.surrender_offered && !self.atomic_fired {
                self.offer_ceasefire();
                return;
            }

            // Offensive salvo timer
            if (self.state == AIState::AllOutOffensive || self.state == AIState::TacticalCounter) && self.war_declared {
                self.attack_timer -= 0.5;
                if self.attack_timer <= 0.0 {
                    self.attack_timer = 3.0;
                    self.decoy_counter += 1;
                    if self.decoy_counter % 3 == 0 {
                        self.state = AIState::DeceitSalvo;
                        self.notifications
                            .push("ENEMY AI: DEPLOYED HIGH-SPEED DECOY SALVO TO DRAIN CIWS DEFENSES".to_string());
                    } else {
                        self.state = AIState::AllOutOffensive;
                    }
                }
            }
        }
    }
}
