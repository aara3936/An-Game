//! Custom WebGPU (WGSL) & WebGL Shader Pipeline Definitions
//! Includes High-Intensity Airburst HDR Bloom, Chromatic Aberration, Dynamic Light Buffers, 3-Stage Mesh Chemistry, and Ground Scorching

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
    
    // Scale structural height if collapsed to rubble (< 0.01 health => collapsed rubble)
    var scaled_pos = model.position * model.instance_scale;
    if (model.instance_health <= 0.0) {
        scaled_pos.y *= 0.16; // Collapse to rubble height
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
    let diff = max(dot(normalize(in.normal), light_dir), 0.18);
    
    // 3-Stage Structural Chemistry Color Evaluation
    var base_color: vec3<f32>;
    if (in.is_enemy > 0.5) {
        base_color = vec3<f32>(0.08, 0.02, 0.05); // Hostile obsidian
    } else {
        base_color = vec3<f32>(0.07, 0.18, 0.30); // Friendly steel-blue
    }
    
    // State 1 (Pristine > 0.75): Illuminated windows
    // State 2 (Charred 0.01 .. 0.75): Dark soot and carbonized surfaces
    // State 3 (Rubble <= 0.0): Dark ash & glowing embers
    if (in.health > 0.75) {
        let grid = fract(in.uv * vec2<f32>(8.0, 16.0));
        if (grid.x > 0.22 && grid.y > 0.22) {
            if (in.is_enemy > 0.5) {
                base_color += vec3<f32>(1.0, 0.12, 0.35) * 0.95; // Crimson windows
            } else {
                base_color += vec3<f32>(0.2, 0.85, 1.0) * 0.95;  // Cyan windows
            }
        }
    } else if (in.health > 0.0) {
        let char_factor = in.health / 0.75;
        // Blend in carbonized scorched black soot
        base_color = mix(vec3<f32>(0.03, 0.03, 0.04), base_color, char_factor);
    } else {
        // Collapsed rubble ruins with intermittent ember flashes
        let ember = fract(sin(dot(in.world_pos.xz, vec2<f32>(12.9898, 78.233))) * 43758.5453);
        if (ember > 0.92) {
            base_color = vec3<f32>(0.85, 0.25, 0.05); // Glowing ember
        } else {
            base_color = vec3<f32>(0.03, 0.03, 0.04); // Ash rubble
        }
    }
    
    let final_color = base_color * (diff + uniforms.ambient_intensity);
    return vec4<f32>(final_color, 1.0);
}
"#;

/// WebGPU (WGSL) Screen-Space HDR Bloom, Chromatic Aberration & Nuclear Flash Post-Processing Shader
pub const HDR_POST_PROCESS_WGSL_SHADER: &str = r#"
struct PostUniforms {
    nuclear_flash: f32,
    chromatic_aberration: f32,
    bloom_intensity: f32,
    time: f32,
};

@group(0) @binding(0) var<uniform> post: PostUniforms;
@group(0) @binding(1) var scene_texture: texture_2d<f32>;
@group(0) @binding(2) var scene_sampler: sampler;

struct FullscreenVertexOutput {
    @builtin(position) clip_position: vec4<f32>,
    @location(0) uv: vec2<f32>,
};

@vertex
fn vs_fullscreen(@builtin(vertex_index) in_vertex_index: u32) -> FullscreenVertexOutput {
    var out: FullscreenVertexOutput;
    let x = f32((in_vertex_index << 1u) & 2u);
    let y = f32(in_vertex_index & 2u);
    out.uv = vec2<f32>(x, y);
    out.clip_position = vec4<f32>(x * 2.0 - 1.0, 1.0 - y * 2.0, 0.0, 1.0);
    return out;
}

@fragment
fn fs_postprocess(in: FullscreenVertexOutput) -> @location(0) vec4<f32> {
    let uv = in.uv;
    
    // Chromatic aberration radial split (strengthened upon nuclear airburst)
    let center = vec2<f32>(0.5, 0.5);
    let dir = uv - center;
    let dist = length(dir);
    let split = dir * (dist * post.chromatic_aberration * 0.035);
    
    let r = textureSample(scene_texture, scene_sampler, uv + split).r;
    let g = textureSample(scene_texture, scene_sampler, uv).g;
    let b = textureSample(scene_texture, scene_sampler, uv - split).b;
    var color = vec3<f32>(r, g, b);
    
    // HDR Bloom approximation
    let luminance = dot(color, vec3<f32>(0.2126, 0.7152, 0.0722));
    if (luminance > 0.7) {
        color += color * ((luminance - 0.7) * post.bloom_intensity * 1.8);
    }
    
    // Nuclear airburst blinding whiteout exposure
    if (post.nuclear_flash > 0.001) {
        color = mix(color, vec3<f32>(1.0, 0.98, 0.95), post.nuclear_flash);
    }
    
    // Subtle cybernetic edge vignette
    let vignette = 1.0 - smoothstep(0.4, 0.85, dist);
    color *= (0.75 + vignette * 0.25);
    
    return vec4<f32>(color, 1.0);
}
"#;

/// WebGPU (WGSL) Persistent Ground Scorching Decal & Impact Crater Shader
pub const GROUND_SCORCH_WGSL_SHADER: &str = r#"
struct ScorchUniforms {
    view_proj: mat4x4<f32>,
    impact_centers: array<vec4<f32>, 16>, // xyz = pos, w = blast radius
    active_impacts_count: u32,
};

@group(0) @binding(0) var<uniform> scorch: ScorchUniforms;

struct GroundVertexOutput {
    @builtin(position) clip_pos: vec4<f32>,
    @location(0) world_pos: vec3<f32>,
    @location(1) uv: vec2<f32>,
};

@vertex
fn vs_ground(@location(0) position: vec3<f32>, @location(1) uv: vec2<f32>) -> GroundVertexOutput {
    var out: GroundVertexOutput;
    out.world_pos = position;
    out.uv = uv;
    out.clip_pos = scorch.view_proj * vec4<f32>(position, 1.0);
    return out;
}

@fragment
fn fs_ground(in: GroundVertexOutput) -> @location(0) vec4<f32> {
    var base_color = vec3<f32>(0.04, 0.08, 0.15); // Tactical grid terrain
    
    // Check distance to active explosion impact sites
    for (var i = 0u; i < scorch.active_impacts_count; i = i + 1u) {
        let center = scorch.impact_centers[i].xyz;
        let radius = scorch.impact_centers[i].w;
        let d = distance(in.world_pos.xz, center.xz);
        
        if (d < radius) {
            let scorch_intensity = 1.0 - smoothstep(radius * 0.2, radius, d);
            // Blend in carbonized soot with inner crater thermal glow
            let soot = vec3<f32>(0.015, 0.015, 0.02);
            let heat_ring = vec3<f32>(0.8, 0.2, 0.05) * (1.0 - smoothstep(0.0, radius * 0.35, d));
            base_color = mix(base_color, soot + heat_ring, scorch_intensity * 0.95);
        }
    }
    
    return vec4<f32>(base_color, 1.0);
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
fn vs_sky(@location(0) position: vec3<f32>) -> SkyVertexOutput {
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
    
    let zenith_color = vec3<f32>(0.04, 0.12, 0.28);  // Deep space-blue zenith
    let horizon_color = vec3<f32>(0.08, 0.24, 0.42); // Atmospheric horizon glow
    
    let sky_color = mix(horizon_color, zenith_color, pow(height, 0.65));
    return vec4<f32>(sky_color, 1.0);
}
"#;

/// WebGPU (WGSL) Particle Smoke Trails, Debris, and Laser CIWS Tracers Shader (5,000+ Particles)
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
    // Smooth quadratic edge falloff for fluid smoke expansion
    let smooth_edge = (1.0 - d * d);
    let alpha = smooth_edge * in.color.a;
    return vec4<f32>(in.color.rgb, alpha);
}
"#;
