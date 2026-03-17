exports.source = `
precision mediump float;

varying vec2 vUv;

uniform sampler2D texture1; // Built-in input texture

// Custom uniforms for gradient definition
uniform vec3 color1; // = vec3(1.0, 0.0, 0.0)
uniform vec3 color2; // = vec3(0.0, 1.0, 0.0)
uniform vec3 color3; // = vec3(0.0, 0.0, 1.0)
uniform float point1; // = 0.0
uniform float point2; // = 0.5
uniform float point3; // = 1.0
uniform float intensity; // 强度控制uniform

// Function to get color from a 3-point gradient
vec3 getColorFromGradient(float t) {
    if (t < point2) {
        float p = t / point2;
        return mix(color1, color2, p);
    } else {
        float p = (t - point2) / (point3 - point2);
        return mix(color2, color3, p);
    }
}

void main() {
    vec4 originalColor = texture2D(texture1, vUv);

    // Calculate intensity (luminosity)
    float luminosity = dot(originalColor.rgb, vec3(0.299, 0.587, 0.114));

    // Get the new color from the gradient
    vec3 newColor = getColorFromGradient(luminosity);

    // 使用intensity控制从原始颜色到新颜色的插值
    vec3 finalColor = mix(originalColor.rgb, newColor, intensity);

    gl_FragColor = vec4(finalColor, originalColor.a);
}`