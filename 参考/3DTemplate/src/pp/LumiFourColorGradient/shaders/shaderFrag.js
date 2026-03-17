exports.source = `

precision mediump float;

varying vec2 vUv;

uniform sampler2D texture1;

uniform vec3 color1; // = vec3(1.0, 1.0, 0.0)
uniform vec3 color2; // = vec3(0.0, 1.0, 0.0)
uniform vec3 color3; // = vec3(1.0, 0.0, 1.0)
uniform vec3 color4; // = vec3(0.0, 0.0, 1.0)

uniform vec2 point1; // = vec2(0.1, 0.9)
uniform vec2 point2; // = vec2(0.9, 0.9)
uniform vec2 point3; // = vec2(0.1, 0.1)
uniform vec2 point4; // = vec2(0.9, 0.1)

uniform float blendWithOriginal; // = 0.0

void main() {
    float d1 = distance(vUv, point1);
    float d2 = distance(vUv, point2);
    float d3 = distance(vUv, point3);
    float d4 = distance(vUv, point4);

    // Use inverse square distance for weighting, add a small epsilon to avoid division by zero
    float w1 = 1.0 / (d1 * d1 + 0.001);
    float w2 = 1.0 / (d2 * d2 + 0.001);
    float w3 = 1.0 / (d3 * d3 + 0.001);
    float w4 = 1.0 / (d4 * d4 + 0.001);

    float totalWeight = w1 + w2 + w3 + w4;

    vec3 gradientColor = (color1 * w1 + color2 * w2 + color3 * w3 + color4 * w4) / totalWeight;

    vec4 originalColor = texture2D(texture1, vUv);
    vec3 finalColor = mix(gradientColor, originalColor.rgb, blendWithOriginal);

    gl_FragColor = vec4(finalColor, originalColor.a);
}`