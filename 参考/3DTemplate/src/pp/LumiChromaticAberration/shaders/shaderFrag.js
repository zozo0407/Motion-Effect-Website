exports.source = `
precision highp float;

// Pre-defined uniforms
uniform sampler2D texture1;
uniform float progress; // = 1.0
uniform float ratio;

// Custom uniforms with default values
uniform float offsetX; // = 0.02
uniform float offsetY; // = 0.02

// Varying from vertex shader
varying vec2 vUv;

void main() {
    // Calculate the offset vector, scaled by progress
    // The offset is also modulated by the distance from the center (0.5, 0.5)
    // to create a lens-like distortion effect (stronger at the edges).
    vec2 offset = vec2(offsetX, offsetY) * progress;
    offset *= length(vUv - 0.5);

    // Sample the color channels from different texture coordinates
    float r = texture2D(texture1, vUv + offset).r;
    // float r = texture2D(texture1, vUv).r;
    float g = texture2D(texture1, vUv).g;
    float b = texture2D(texture1, vUv - offset).b;
    // float b = texture2D(texture1, vUv).b;
    float a = texture2D(texture1, vUv).a;

    // Combine the channels to produce the final color
    gl_FragColor = vec4(r, g, b, a);
}`