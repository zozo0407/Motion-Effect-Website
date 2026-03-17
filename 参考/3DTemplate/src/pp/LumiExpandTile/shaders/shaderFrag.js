exports.source = `
precision mediump float;

varying vec2 vUv;

// Built-in uniforms
uniform sampler2D texture1;
uniform float progress; // Time, from 0.0 to 1.0
uniform float ratio;    // Screen aspect ratio

// Custom uniforms
uniform float tile_count; // = 4.0

void main() {
    // 1. Center the UV coordinates
    vec2 centered_uv = vUv - 0.5;

    // 2. Apply aspect ratio correction
    centered_uv.x *= ratio;

    // 3. Calculate the zoom factor based on progress
    // As progress goes from 0 to 1, zoom goes from tile_count to 1.0
    float zoom = mix(tile_count, 1.0, progress);

    // 4. Scale the UVs to create the zoom effect
    centered_uv *= zoom;
    
    // 5. Undo aspect ratio correction
    centered_uv.x /= ratio;

    // 6. Shift the UVs back to the original origin
    vec2 tiled_uv = centered_uv + 0.5;

    // 7. Use fract() to create the tiled pattern
    vec2 final_uv = fract(tiled_uv);

    // 8. Sample the texture with the final UVs
    gl_FragColor = texture2D(texture1, final_uv);
}`