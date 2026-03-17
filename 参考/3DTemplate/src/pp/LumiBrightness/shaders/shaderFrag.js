exports.source = `
// Brightness Effect Fragment Shader
// 亮度调节效果 - 通过非线性变换调整图像亮度
precision highp float;

uniform sampler2D texture1; // 源纹理
uniform float progress; // = 0.5 时间进度
uniform float ratio; // = 1.0 宽高比

// Brightness参数
uniform float intensity; // = 0.1 亮度强度 (-1.0 到 1.0)

varying vec2 vUv;

void main() {
    vec4 color = texture2D(texture1, vUv);
    
    vec3 result = color.rgb;
    
    if (intensity > 0.0) {
        // 正向亮度调节：使用幂函数增强亮度
        float factor = 1.0 + (intensity * 5.0);
        result = vec3(1.0) - pow(vec3(1.0) - result, vec3(factor));
    } else {
        // 负向亮度调节：降低亮度并调整偏移
        float factor = 1.0 / (1.0 - (intensity * 2.5));
        result = result - vec3((-intensity) * 0.01);
        result = vec3(1.0) - pow(vec3(1.0) - result, vec3(factor));
    }
    
    gl_FragColor = vec4(clamp(result, 0.0, 1.0), color.a);
}`