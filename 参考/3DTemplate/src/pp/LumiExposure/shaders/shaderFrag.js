exports.source = `
// Exposure Effect Fragment Shader
// 曝光调节效果 - 模拟相机曝光调节
precision highp float;

uniform sampler2D texture1; // 源纹理
uniform float progress; // = 0.5 时间进度
uniform float ratio; // = 1.0 宽高比

// Exposure参数
uniform float intensity; // = 0.0 曝光强度 (-1.0 到 1.0)

varying vec2 vUv;

void main() {
    vec4 color = texture2D(texture1, vUv);
    
    // 曝光调节：使用2的幂次方模拟光圈调节
    float exposure = pow(2.0, intensity);
    vec3 result = color.rgb * exposure;
    
    gl_FragColor = vec4(clamp(result, 0.0, 1.0), color.a);
}`