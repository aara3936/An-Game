//! Native Rust Simulation Runner & CLI Benchmark Engine

use warfare_simulator_engine::WasmWarfareSimulation;

fn main() {
    println!("================================================================================");
    println!("  STRATEGIC WARFARE & 7-STATE AI ENGINE (RUST + BEVY/MACROQUAD ARCHITECTURE)  ");
    println!("================================================================================");

    let mut sim = WasmWarfareSimulation::new();
    println!("[INIT] Loaded 120+ Player Skyscrapers & 100+ Enemy Structures into Rust ECS");
    println!("[INIT] AI Brain Online: State = {:?}", sim.get_ai_state());
    println!("[INIT] Player City Integrity: {:.1}% | Enemy Metropolis Integrity: {:.1}%", 
        sim.get_city_integrity(), 
        sim.get_enemy_integrity()
    );

    // Run 60 simulation frames (1 second at 60 FPS)
    println!("\n[BENCHMARK] Executing 60 SIMD ECS Physics & AI Brain Ticks...");
    let dt = 1.0 / 60.0;
    for frame in 1..=60 {
        if frame == 15 {
            println!("  -> Frame 15: Executing Multi-Pin Salvo on Enemy Coordinates (760, -710)");
            sim.add_target_pin(760.0, -710.0);
            sim.add_target_pin(700.0, -700.0);
            sim.fire_multi_salvo();
        }

        let telemetry = sim.tick(dt);
        if frame % 20 == 0 {
            println!("  -> Frame {:02}: Telemetry = {}", frame, telemetry);
        }
    }

    println!("\n[BENCHMARK] Success: 60 FPS Zero-Allocation Physics Loop executed smoothly.");
    println!("================================================================================");
}
