exports.source = `
// Tone Effect Fragment Shader
// 色调效果 - 高级色调映射和颜色调整
precision highp float;

uniform sampler2D texture1; // 源纹理
uniform float progress; // = 0.5 时间进度
uniform float ratio; // = 1.0 宽高比

// Tone参数
uniform float exposure; // = 0.0 曝光调节
uniform float contrast; // = 0.0 对比度
uniform float highlights; // = 0.0 高光调节
uniform float shadows; // = 0.0 阴影调节
uniform float whites; // = 0.0 白色调节
uniform float blacks; // = 0.0 黑色调节
uniform float saturation; // = 0.0 饱和度
uniform float vibrance; // = 0.0 自然饱和度
uniform float intensity; // = 1.0 效果强度

varying vec2 vUv;

// RGB转HSV
vec3 rgb2hsv(vec3 c) {
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
    
    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

// HSV转RGB
vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

// S曲线对比度调节
vec3 applySCurve(vec3 color, float contrast) {
    float factor = (1.016 * (contrast + 1.0)) / (1.016 - contrast);
    return clamp((color - 0.5) * factor + 0.5, 0.0, 1.0);
}

// 高光阴影调节
vec3 adjustHighlightsShadows(vec3 color, float highlights, float shadows) {
    float luminance = dot(color, vec3(0.299, 0.587, 0.114));
    
    // 计算高光和阴影权重
    float shadowWeight = 1.0 - smoothstep(0.0, 0.5, luminance);
    float highlightWeight = smoothstep(0.5, 1.0, luminance);
    
    // 应用调节
    vec3 result = color;
    result *= 1.0 + shadows * shadowWeight * 0.5;
    result *= 1.0 + highlights * highlightWeight * 0.5;
    
    return result;
}

void main() {
    vec4 originalColor = texture2D(texture1, vUv);
    vec3 result = originalColor.rgb;
    
    // 1. 曝光调节
    result *= pow(2.0, exposure);
    
    // 2. 高光阴影调节
    result = adjustHighlightsShadows(result, highlights, shadows);
    
    // 3. 白色和黑色调节
    result = mix(result, vec3(1.0), whites * 0.2);
    result = mix(result, vec3(0.0), blacks * 0.2);
    
    // 4. 对比度调节
    if (abs(contrast) > 0.001) {
        result = applySCurve(result, contrast);
    }
    
    // 5. 饱和度和自然饱和度调节
    if (abs(saturation) > 0.001 || abs(vibrance) > 0.001) {
        vec3 hsv = rgb2hsv(result);
        
        // 饱和度调节
        hsv.y *= (1.0 + saturation);
        
        // 自然饱和度调节（对低饱和度区域影响更大）
        float vibranceWeight = 1.0 - hsv.y;
        hsv.y += vibrance * vibranceWeight * 0.5;
        
        hsv.y = clamp(hsv.y, 0.0, 1.0);
        result = hsv2rgb(hsv);
    }
    
    // 根据intensity混合原始颜色和处理后的颜色
    result = mix(originalColor.rgb, result, intensity);
    
    gl_FragColor = vec4(clamp(result, 0.0, 1.0), originalColor.a);
}`