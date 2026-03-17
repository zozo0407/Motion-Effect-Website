exports.source = `
precision highp float;

uniform float progress; // = 0.5
uniform float ratio; // = 1.0
uniform sampler2D texture1;
varying vec2 vUv;

uniform int cloneCount; // = 4
uniform float cloneSpacing; // = 0.3
uniform float cloneScale; // = 0.8
uniform float cloneRotation; // = 0.0

vec2 rotate(vec2 uv, float angle) {
    float c = cos(angle);
    float s = sin(angle);
    uv -= 0.5;
    uv = mat2(c, -s, s, c) * uv;
    uv += 0.5;
    return uv;
}

void main() {
    vec2 uv = vUv;
    vec4 finalColor = vec4(0.0);
    
    for (int i = 0; i < 8; i++) {
        if (i >= cloneCount) break;
        
        float angle = float(i) * 6.28318 / float(cloneCount);
        vec2 offset = vec2(cos(angle), sin(angle)) * cloneSpacing;
        
        vec2 cloneUv = (uv - 0.5 - offset) / cloneScale + 0.5;
        cloneUv = rotate(cloneUv, cloneRotation * float(i));
        
        if (cloneUv.x >= 0.0 && cloneUv.x <= 1.0 && cloneUv.y >= 0.0 && cloneUv.y <= 1.0) {
            vec4 cloneColor = texture2D(texture1, cloneUv);
            finalColor = mix(finalColor, cloneColor, cloneColor.a);
        }
    }
    
    gl_FragColor = finalColor;
}`