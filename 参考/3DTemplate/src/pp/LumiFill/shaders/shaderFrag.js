exports.source = `
precision highp float;

uniform float progress; // = 0.5
uniform float ratio; // = 1.0
uniform sampler2D texture1;
varying vec2 vUv;

uniform vec3 fillColor; // = vec3(1.0, 0.0, 0.0)
uniform float fillOpacity; // = 1.0
uniform int fillMode; // = 0

void main() {
    vec2 uv = vUv;
    vec4 originalColor = texture2D(texture1, uv);
    
    vec3 color = fillColor;
    
    if (fillMode == 1) { // 渐变模式
        color = mix(fillColor, vec3(1.0), uv.y);
    }
    
    vec4 fillResult = vec4(color, fillOpacity);
    
    gl_FragColor = mix(originalColor, fillResult, fillOpacity);
}`