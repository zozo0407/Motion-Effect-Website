exports.source = `
// Threshold Effect Fragment Shader
// 阈值效果 - 将图像转换为黑白二值图像
precision highp float;

uniform sampler2D texture1; // 源纹理
uniform float progress; // = 0.5 时间进度
uniform float ratio; // = 1.0 宽高比

// Threshold参数
uniform float threshold; // = 0.5 阈值
uniform float smoothness; // = 0.01 边缘平滑度
uniform float intensity; // = 1.0 效果强度

varying vec2 vUv;

void main() {
    vec4 originalColor = texture2D(texture1, vUv);
    
    // 计算亮度
    float luminance = dot(originalColor.rgb, vec3(0.299, 0.587, 0.114));
    
    // 应用阈值
    float result = smoothstep(threshold - smoothness, threshold + smoothness, luminance);
    
    // 创建阈值处理后的颜色
    vec3 thresholdColor = vec3(result);
    
    // 根据intensity混合原始颜色和阈值处理后的颜色
    vec3 finalColor = mix(originalColor.rgb, thresholdColor, intensity);
    
    gl_FragColor = vec4(finalColor, originalColor.a);
}`