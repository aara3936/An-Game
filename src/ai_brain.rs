//! Autonomous 7-State Tactical AI Brain & Commander Engine
//! Features Threat Vector Mapping, Multi-Salvo Attacks (4-8 Heavy Warheads), Decoys & Flares Spoofing, and Interactive Ceasefire Protocols

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
    /// Counter-battery fire prioritized at player's highest-threat launch sites and radar towers
    TacticalCounter,
    /// Low-threat decoy salvos and thermal flares deployed to drain player CIWS and S-5 cooldowns
    DeceitSalvo,
    /// Coordinated Multi-Salvo offensive (4 to 8 heavy warheads simultaneously)
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
    pub is_priority_target: bool,
}

/// Coordinated Multi-Salvo Task definition
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MultiSalvoOrder {
    pub target_positions: Vec<Vec3>,
    pub warhead_count: usize,
    pub include_hypersonic: bool,
    pub include_decoys: bool,
    pub include_flares: bool,
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
    pub multi_salvo_timer: f32,
    pub interceptor_cooldown: f32,
    pub airspace_violation_timer: f32,
    pub desperation_grace_timer: f32,
    pub decoy_counter: u32,
    pub player_threat_map: HashMap<String, ThreatProfile>,
    pub notifications: Vec<String>,
    pub pending_multi_salvo: Option<MultiSalvoOrder>,
    pub player_defense_capacity_score: f32,
}

impl EnemyAIBrain {
    pub fn new() -> Self {
        let mut threat_map = HashMap::new();
        threat_map.insert(
            "throne_thriller_radar".to_string(),
            ThreatProfile {
                name: "THRONE THRILLER 1 RADAR NETWORK".to_string(),
                platform_type: "radar".to_string(),
                position: Vec3::new(0.0, 0.0, 0.0),
                threat_score: 50.0,
                attacks_logged: 0,
                is_priority_target: true,
            },
        );
        threat_map.insert(
            "intercept_s5_battery".to_string(),
            ThreatProfile {
                name: "INTERCEPT S-5 HYPER-VELOCITY BATTERY".to_string(),
                platform_type: "anti_nuke".to_string(),
                position: Vec3::new(-45.0, 0.0, -15.0),
                threat_score: 45.0,
                attacks_logged: 0,
                is_priority_target: true,
            },
        );
        threat_map.insert(
            "vs90_retaliation_silo".to_string(),
            ThreatProfile {
                name: "VS-90 HEAVY SALVO LAUNCHER".to_string(),
                platform_type: "salvo_silo".to_string(),
                position: Vec3::new(45.0, 0.0, 15.0),
                threat_score: 40.0,
                attacks_logged: 0,
                is_priority_target: true,
            },
        );
        threat_map.insert(
            "silo_0".to_string(),
            ThreatProfile {
                name: "ICBM SILO #1".to_string(),
                platform_type: "silo".to_string(),
                position: Vec3::new(-20.0, 0.0, -20.0),
                threat_score: 10.0,
                attacks_logged: 0,
                is_priority_target: false,
            },
        );
        threat_map.insert(
            "silo_1".to_string(),
            ThreatProfile {
                name: "ICBM SILO #2".to_string(),
                platform_type: "silo".to_string(),
                position: Vec3::new(20.0, 0.0, -20.0),
                threat_score: 10.0,
                attacks_logged: 0,
                is_priority_target: false,
            },
        );
        threat_map.insert(
            "sub_0".to_string(),
            ThreatProfile {
                name: "SSBN-01 TRIDENT".to_string(),
                platform_type: "sub".to_string(),
                position: Vec3::new(225.0, 0.0, -165.0),
                threat_score: 15.0,
                attacks_logged: 0,
                is_priority_target: false,
            },
        );
        threat_map.insert(
            "ciws_outpost".to_string(),
            ThreatProfile {
                name: "AEGIS CIWS OUTPOST".to_string(),
                platform_type: "ciws".to_string(),
                position: Vec3::new(-25.0, 0.0, 25.0),
                threat_score: 20.0,
                attacks_logged: 0,
                is_priority_target: false,
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
            attack_timer: 4.0,
            multi_salvo_timer: 10.0,
            interceptor_cooldown: 0.0,
            airspace_violation_timer: 0.0,
            desperation_grace_timer: 9.0,
            decoy_counter: 0,
            player_threat_map: threat_map,
            notifications: Vec::new(),
            pending_multi_salvo: None,
            player_defense_capacity_score: 100.0,
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

    /// Check for sovereign airspace violations by player targeting reticles or missiles
    pub fn check_airspace(&mut self, target_coords: Vec3, drone_pos: Vec3, dt: f32) {
        if self.war_declared || self.state == AIState::DiplomaticSurrender || self.state == AIState::DesperateNuclear {
            return;
        }

        let is_breaching = (target_coords.x >= 550.0 && target_coords.z <= -550.0)
            || (drone_pos.x >= 550.0 && drone_pos.z <= -550.0);

        if is_breaching {
            self.airspace_violation_timer += dt;
            if self.state == AIState::Idle {
                self.state = AIState::Reconnaissance;
                self.diplomatic_stance = DiplomaticStance::WarningAirspace;
                self.notifications
                    .push("⚠️ ENEMY AI: AIRSPACE VIOLATION DETECTED. CEASE TARGET LOCK IMMEDIATELY.".to_string());
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
            .push("⚔️ ENEMY AI HAS DECLARED WAR! HOSTILE MISSILE BATTERIES FULLY MOBILIZED".to_string());
    }

    /// Trigger surrender negotiation when enemy integrity drops below 25%
    pub fn offer_ceasefire(&mut self) {
        if self.surrender_offered || self.atomic_fired {
            return;
        }
        self.surrender_offered = true;
        self.state = AIState::DiplomaticSurrender;
        self.diplomatic_stance = DiplomaticStance::SurrenderOffered;
        self.notifications
            .push("🏳️ ENEMY AI BROADCAST SURRENDER & CEASEFIRE OFFER (INTEGRITY < 25%)".to_string());
    }

    /// Player accepts ceasefire
    pub fn accept_ceasefire(&mut self) {
        self.ceasefire_accepted = true;
        self.diplomatic_stance = DiplomaticStance::Peace;
        self.notifications
            .push("🕊️ DIPLOMATIC PEACE TREATY RATIFIED BY BOTH COMMANDS (VICTORY)".to_string());
    }

    /// Player rejects ceasefire: Immediate Atomic Nuclear Escalation
    pub fn reject_ceasefire(&mut self) {
        self.state = AIState::DesperateNuclear;
        self.diplomatic_stance = DiplomaticStance::AtomicRetaliation;
        self.atomic_fired = true;
        self.notifications
            .push("⚠️ SURRENDER REJECTED: ENEMY AI HAS ENGAGED OMEGA ATOMIC STRIKE!".to_string());
    }

    /// Compute highest-threat player target for surgical counter-battery fire
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

    /// Evaluates player defense capacity (radar health, CIWS density, S-5 stock)
    pub fn evaluate_player_defense_capacity(&mut self, s5_stock: u32, radar_online: bool, city_health: f32) {
        let mut score = 50.0;
        if radar_online {
            score += 25.0;
        }
        score += (s5_stock as f32) * 1.5;
        score += (city_health / 100.0) * 10.0;
        self.player_defense_capacity_score = score.clamp(10.0, 100.0);
    }

    /// Plan a coordinated multi-salvo attack (4 to 8 heavy warheads simultaneously)
    pub fn plan_coordinated_multi_salvo(&mut self) -> MultiSalvoOrder {
        // Higher player defense capacity triggers larger saturation salvo (6 to 8 warheads)
        let warhead_count = if self.player_defense_capacity_score > 60.0 {
            8
        } else if self.player_defense_capacity_score > 35.0 {
            6
        } else {
            4
        };

        // Determine targets based on priority (Radar, S-5 battery, then Silos)
        let mut targets = Vec::new();
        let target_candidates = [
            Vec3::new(0.0, 0.0, 0.0),    // Throne Thriller Radar Array
            Vec3::new(-45.0, 0.0, -15.0), // Intercept S-5 Battery
            Vec3::new(45.0, 0.0, 15.0),   // VS-90 Salvo Silo
            Vec3::new(-20.0, 0.0, -20.0), // Silo 0
            Vec3::new(20.0, 0.0, -20.0),  // Silo 1
            Vec3::new(-25.0, 0.0, 25.0),  // CIWS Aegis
            Vec3::new(-80.0, 0.0, -60.0), // City Center West
            Vec3::new(60.0, 0.0, 70.0),   // City Center East
        ];

        for i in 0..warhead_count {
            targets.push(target_candidates[i % target_candidates.len()]);
        }

        self.notifications.push(format!(
            "⚠️ ENEMY AI: LAUNCHING COORDINATED {}-WARHEAD MULTI-SALVO (WITH DECOYS & FLARES)",
            warhead_count
        ));

        MultiSalvoOrder {
            target_positions: targets,
            warhead_count,
            include_hypersonic: self.player_defense_capacity_score > 45.0,
            include_decoys: true,
            include_flares: true,
        }
    }

    /// Decoy salvo check: returns true if AI should fire a low-threat decoy salvo
    pub fn should_fire_decoy(&self) -> bool {
        self.state == AIState::DeceitSalvo
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

            // Offensive timers
            if (self.state == AIState::AllOutOffensive || self.state == AIState::TacticalCounter) && self.war_declared {
                self.attack_timer -= 0.5;
                self.multi_salvo_timer -= 0.5;

                // Coordinated Multi-Salvo trigger
                if self.multi_salvo_timer <= 0.0 {
                    self.multi_salvo_timer = 9.5; // Every ~10 seconds
                    let order = self.plan_coordinated_multi_salvo();
                    self.pending_multi_salvo = Some(order);
                } else if self.attack_timer <= 0.0 {
                    self.attack_timer = 3.2;
                    self.decoy_counter += 1;
                    if self.decoy_counter % 3 == 0 {
                        self.state = AIState::DeceitSalvo;
                        self.notifications
                            .push("ENEMY AI: DEPLOYED HIGH-SPEED DECOY SALVO TO SPOOF S-5 DEFENSES".to_string());
                    } else {
                        self.state = AIState::AllOutOffensive;
                    }
                }
            }
        }
    }
}
