exports.source = `
precision highp float;

uniform sampler2D texture1; // = 源纹理
uniform float progress; // = 0.5, 动画进度
uniform float ratio; // = 1.0, 宽高比

// S_Glow效果参数
uniform float glowThreshold; // = 0.5, 发光阈值
uniform float innerRadius; // = 8.0, 内层半径
uniform float outerRadius; // = 20.0, 外层半径
uniform float innerIntensity; // = 1.0, 内层强度
uniform float outerIntensity; // = 0.6, 外层强度
uniform vec3 glowColor; // = vec3(1.0, 1.0, 1.0), 发光颜色
uniform float intensity; // = 1.0, 效果强度

varying vec2 vUv;

// 高斯权重
float gaussian(float x, float sigma) {
    return exp(-(x * x) / (2.0 * sigma * sigma));
}

// 阈值遮罩
vec4 createMask(vec4 color, float threshold) {
    float luminance = dot(color.rgb, vec3(0.299, 0.587, 0.114));
    float mask = smoothstep(threshold - 0.1, threshold + 0.1, luminance);
    return vec4(vec3(mask), color.a);
}

// 高斯模糊
vec4 gaussianBlur(sampler2D tex, vec2 uv, vec2 direction, float radius) {
    vec4 color = vec4(0.0);
    float totalWeight = 0.0;
    
    float sigma = radius / 3.0;
    int samples = int(min(radius * 0.8, 24.0));
    
    for (int i = -samples; i <= samples; i++) {
        float weight = gaussian(float(i), sigma);
        vec2 offset = direction * float(i) / 512.0 * radius;
        
        vec4 texel = texture2D(tex, uv + offset);
        color += texel * weight;
        totalWeight += weight;
    }
    
    return color / totalWeight;
}

// 双轴模糊
vec4 biaxialBlur(sampler2D tex, vec2 uv, float radius) {
    // 水平模糊
    vec4 blurH = gaussianBlur(tex, uv, vec2(1.0, 0.0), radius);
    
    // 垂直模糊（基于水平模糊结果的近似）
    vec4 blurV = gaussianBlur(tex, uv, vec2(0.0, 1.0), radius);
    
    // 组合结果
    return mix(blurH, blurV, 0.5);
}

void main() {
    vec2 uv = vUv;
    vec4 baseColor = texture2D(texture1, uv);
    
    // 保存原始颜色用于混合
    vec4 originalColor = baseColor;
    
    // 创建发光遮罩
    vec4 glowMask = createMask(baseColor, glowThreshold);
    
    // 内层发光（小半径）
    float animatedInnerRadius = innerRadius * progress;
    vec4 innerGlow = biaxialBlur(texture1, uv, animatedInnerRadius);
    innerGlow = createMask(innerGlow, glowThreshold);
    innerGlow.rgb *= glowColor * innerIntensity;
    
    // 外层发光（大半径）
    float animatedOuterRadius = outerRadius * progress;
    vec4 outerGlow = biaxialBlur(texture1, uv, animatedOuterRadius);
    outerGlow = createMask(outerGlow, glowThreshold);
    outerGlow.rgb *= glowColor * outerIntensity;
    
    // 双层混合
    vec4 combinedGlow = innerGlow + outerGlow * 0.7;
    
    // 应用遮罩增强
    float maskStrength = glowMask.r;
    combinedGlow.rgb *= (1.0 + maskStrength * 0.5);
    
    // 最终合成
    vec3 finalColor = baseColor.rgb + combinedGlow.rgb;
    finalColor = clamp(finalColor, 0.0, 1.0);
    
    // 根据intensity混合原始颜色和发光效果
    vec3 mixedColor = mix(originalColor.rgb, finalColor, intensity);
    
    gl_FragColor = vec4(mixedColor, originalColor.a);
}`