exports.source = `
precision mediump float;

varying vec2 vUv;

uniform sampler2D texture1;

uniform vec3 shadowColor;    // = vec3(0.0, 0.0, 0.0)
uniform vec3 middleColor;    // = vec3(0.498, 0.392, 0.274)
uniform vec3 highlightColor; // = vec3(1.0, 1.0, 1.0)
uniform float blendWithOriginal; // = 0.0

const vec3 LUMINANCE_VECTOR = vec3(0.299, 0.587, 0.114);

void main() {
    vec4 originalColor = texture2D(texture1, vUv);
    float luminance = dot(originalColor.rgb, LUMINANCE_VECTOR);

    vec3 tritoneColor;
    if (luminance < 0.5) {
        tritoneColor = mix(shadowColor, middleColor, luminance / 0.5);
    } else {
        tritoneColor = mix(middleColor, highlightColor, (luminance - 0.5) / 0.5);
    }

    vec3 finalColor = mix(tritoneColor, originalColor.rgb, blendWithOriginal);

    gl_FragColor = vec4(finalColor, originalColor.a);
}`