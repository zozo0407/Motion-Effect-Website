exports.source = `
// Saturation Effect Fragment Shader
// 饱和度调节效果 - 调整图像色彩饱和度
precision highp float;

uniform sampler2D texture1; // 源纹理
uniform float progress; // = 0.5 时间进度
uniform float ratio; // = 1.0 宽高比

// Saturation参数
uniform float intensity; // = 0.0 饱和度强度 (-1.0 到 1.0)

varying vec2 vUv;

void main() {
    vec4 color = texture2D(texture1, vUv);
    
    // 计算灰度值
    float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
    
    // 饱和度调节：在灰度和原色之间插值
    float saturation = intensity + 1.0;
    vec3 result = mix(vec3(gray), color.rgb, saturation);
    
    gl_FragColor = vec4(clamp(result, 0.0, 1.0), color.a);
}`