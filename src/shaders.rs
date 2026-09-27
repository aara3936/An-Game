//! Custom WebGPU (WGSL) & WebGL Shader Pipeline Definitions

/// WebGPU (WGSL) Vertex and Fragment Shader for 3-Stage Skyscraper Mesh Chemistry
pub const SKYSCRAPER_WGSL_SHADER: &str = r#"
struct Uniforms {
    view_proj: mat4x4<f32>,
    camera_pos: vec3<f32>,
    time: f32,
    ambient_intensity: f32,
};

@group(0) @binding(0)
var<uniform> uniforms: Uniforms;

struct VertexInput {
    @location(0) position: vec3<f32>,
    @location(1) normal: vec3<f32>,
    @location(2) uv: vec2<f32>,
    @location(3) instance_pos: vec3<f32>,
    @location(4) instance_scale: vec3<f32>,
    @location(5) instance_health: f32, // 0.0 (Rubble) .. 1.0 (Pristine)
    @location(6) is_enemy: f32,
};

struct VertexOutput {
    @builtin(position) clip_position: vec4<f32>,
    @location(0) world_pos: vec3<f32>,
    @location(1) normal: vec3<f32>,
    @location(2) uv: vec2<f32>,
    @location(3) health: f32,
    @location(4) is_enemy: f32,
};

@vertex
fn vs_main(model: VertexInput) -> VertexOutput {
    var out: VertexOutput;
    
    // Scale structural height if collapsed to rubble (< 0.01 health => collapsed)
    var scaled_pos = model.position * model.instance_scale;
    if (model.instance_health <= 0.0) {
        scaled_pos.y *= 0.18; // Collapse to rubble height
    }
    
    let world_position = scaled_pos + model.instance_pos;
    out.world_pos = world_position;
    out.normal = model.normal;
    out.uv = model.uv;
    out.health = model.instance_health;
    out.is_enemy = model.is_enemy;
    out.clip_position = uniforms.view_proj * vec4<f32>(world_position, 1.0);
    return out;
}

@fragment
fn fs_main(in: VertexOutput) -> @location(0) vec4<f32> {
    let light_dir = normalize(vec3<f32>(-0.4, 0.8, -0.5));
    let diff = max(dot(normalize(in.normal), light_dir), 0.15);
    
    // 3-Stage Structural Chemistry Color Evaluation
    var base_color: vec3<f32>;
    if (in.is_enemy > 0.5) {
        base_color = vec3<f32>(0.07, 0.02, 0.04); // Hostile obsidian
    } else {
        base_color = vec3<f32>(0.06, 0.17, 0.28); // Friendly steel-blue
    }
    
    // State 1 (Pristine > 0.75): Illuminated windows
    // State 2 (Charred 0.01 .. 0.75): Dark soot and carbonized surfaces
    // State 3 (Rubble <= 0.0): Dark ash
    if (in.health > 0.75) {
        let grid = fract(in.uv * vec2<f32>(8.0, 16.0));
        if (grid.x > 0.2 && grid.y > 0.2) {
            if (in.is_enemy > 0.5) {
                base_color += vec3<f32>(0.9, 0.1, 0.3) * 0.85; // Crimson windows
            } else {
                base_color += vec3<f32>(0.2, 0.75, 1.0) * 0.85; // Cyan windows
            }
        }
    } else if (in.health > 0.0) {
        let char_factor = in.health / 0.75;
        base_color = mix(vec3<f32>(0.05, 0.05, 0.06), base_color, char_factor);
    } else {
        base_color = vec3<f32>(0.04, 0.04, 0.05); // Carbonized ash rubble
    }
    
    let final_color = base_color * (diff + uniforms.ambient_intensity);
    return vec4<f32>(final_color, 1.0);
}
"#;

/// WebGPU (WGSL) Volumetric Atmospheric Sky and Day/Night Shader
pub const ATMOSPHERE_WGSL_SHADER: &str = r#"
struct SkyUniforms {
    view_proj: mat4x4<f32>,
    sun_direction: vec3<f32>,
    time: f32,
};

@group(0) @binding(0)
var<uniform> sky: SkyUniforms;

struct SkyVertexOutput {
    @builtin(position) clip_position: vec4<f32>,
    @location(0) view_dir: vec3<f32>,
};

@vertex
fn vs_sky(
    @location(0) position: vec3<f32>,
) -> SkyVertexOutput {
    var out: SkyVertexOutput;
    out.view_dir = position;
    var pos = sky.view_proj * vec4<f32>(position, 0.0);
    out.clip_position = pos.xyww;
    return out;
}

@fragment
fn fs_sky(in: SkyVertexOutput) -> @location(0) vec4<f32> {
    let dir = normalize(in.view_dir);
    let height = clamp(dir.y, 0.0, 1.0);
    
    let zenith_color = vec3<f32>(0.08, 0.39, 0.75); // Deep azure blue
    let horizon_color = vec3<f32>(0.89, 0.95, 1.0); // Atmospheric white glow
    
    let sky_color = mix(horizon_color, zenith_color, pow(height, 0.6));
    return vec4<f32>(sky_color, 1.0);
}
"#;

/// WebGPU (WGSL) Particle Smoke Trails, Debris, and Laser CIWS Tracers Shader
pub const PARTICLE_WGSL_SHADER: &str = r#"
struct ParticleUniforms {
    view_proj: mat4x4<f32>,
    camera_right: vec3<f32>,
    camera_up: vec3<f32>,
};

@group(0) @binding(0)
var<uniform> uniforms: ParticleUniforms;

struct ParticleVertexInput {
    @location(0) corner: vec2<f32>, // Quad vertex (-0.5 .. 0.5)
    @location(1) position: vec3<f32>,
    @location(2) color: vec4<f32>,
    @location(3) scale: f32,
    @location(4) age_ratio: f32, // 0.0 .. 1.0
};

struct ParticleVertexOutput {
    @builtin(position) clip_pos: vec4<f32>,
    @location(0) uv: vec2<f32>,
    @location(1) color: vec4<f32>,
    @location(2) age_ratio: f32,
};

@vertex
fn vs_particle(input: ParticleVertexInput) -> ParticleVertexOutput {
    var out: ParticleVertexOutput;
    out.uv = input.corner + vec2<f32>(0.5, 0.5);
    out.color = input.color;
    out.age_ratio = input.age_ratio;
    
    let world_pos = input.position 
        + uniforms.camera_right * (input.corner.x * input.scale) 
        + uniforms.camera_up * (input.corner.y * input.scale);
        
    out.clip_pos = uniforms.view_proj * vec4<f32>(world_pos, 1.0);
    return out;
}

@fragment
fn fs_particle(in: ParticleVertexOutput) -> @location(0) vec4<f32> {
    let d = length(in.uv - vec2<f32>(0.5, 0.5)) * 2.0;
    if (d > 1.0) {
        discard;
    }
    let alpha = (1.0 - d) * in.color.a * (1.0 - in.age_ratio);
    return vec4<f32>(in.color.rgb, alpha);
}
"#;
