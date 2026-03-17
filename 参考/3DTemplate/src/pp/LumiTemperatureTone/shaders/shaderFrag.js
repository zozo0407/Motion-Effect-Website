exports.source = `
// Temperature Tone Effect Fragment Shader
// 色温色调调节效果 - 调整图像的冷暖色调
precision highp float;

uniform sampler2D texture1; // 源纹理
uniform float progress; // = 0.5 时间进度
uniform float ratio; // = 1.0 宽高比

// TemperatureTone参数
uniform float temperature; // = 0.0 色温 (-1.0 到 1.0)
uniform float tint; // = 0.0 色调 (-1.0 到 1.0)
uniform float intensity; // = 1.0 强度 (0.0 到 1.0)

varying vec2 vUv;

void main() {
    vec4 color = texture2D(texture1, vUv);
    
    // 保存原始颜色
    vec4 originalColor = color;
    
    vec3 result = color.rgb;
    
    // 色温调节：调整红蓝通道平衡
    if (temperature > 0.0) {
        // 暖色调：增强红色，减少蓝色
        result.r = result.r * (1.0 + temperature * 0.3 * intensity);
        result.b = result.b * (1.0 - temperature * 0.3 * intensity);
    } else {
        // 冷色调：减少红色，增强蓝色
        result.r = result.r * (1.0 + temperature * 0.3 * intensity);
        result.b = result.b * (1.0 - temperature * 0.3 * intensity);
    }
    
    // 色调调节：调整绿品平衡
    if (tint > 0.0) {
        // 绿色调：增强绿色，减少品红
        result.g = result.g * (1.0 + tint * 0.3 * intensity);
        result.rb = result.rb * (1.0 - tint * 0.15 * intensity);
    } else {
        // 品红色调：减少绿色，增强品红
        result.g = result.g * (1.0 + tint * 0.3 * intensity);
        result.rb = result.rb * (1.0 - tint * 0.15 * intensity);
    }
    
    // 使用mix函数根据intensity在原始颜色和处理后的颜色之间插值
    vec3 finalColor = mix(originalColor.rgb, clamp(result, 0.0, 1.0), intensity);
    
    gl_FragColor = vec4(finalColor, originalColor.a);
}`