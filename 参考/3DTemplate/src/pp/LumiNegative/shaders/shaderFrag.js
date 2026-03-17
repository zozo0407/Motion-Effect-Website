exports.source = `
// Negative Effect Fragment Shader
// 负片效果 - 反转图像颜色
precision highp float;

uniform sampler2D texture1; // 源纹理
uniform float progress; // = 0.5 时间进度
uniform float ratio; // = 1.0 宽高比

// Negative参数
uniform float intensity; // = 1.0 反转强度

varying vec2 vUv;

void main() {
    vec4 color = texture2D(texture1, vUv);
    
    // 颜色反转
    vec3 negative = vec3(1.0) - color.rgb;
    vec3 result = mix(color.rgb, negative, intensity);
    
    gl_FragColor = vec4(result, color.a);
}`