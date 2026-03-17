exports.source = `
precision highp float;

uniform sampler2D texture1; // = 源纹理
uniform float progress; // = 0.5, 动画进度
uniform float ratio; // = 1.0, 宽高比

// Glow效果参数
uniform float glowThreshold; // = 0.5, 发光阈值
uniform float glowRadius; // = 10.0, 发光半径
uniform float glowIntensity; // = 1.0, 发光强度
uniform vec3 glowColor; // = vec3(1.0, 1.0, 1.0), 发光颜色

varying vec2 vUv;

// 高斯权重
float gaussian(float x, float sigma) {
    return exp(-(x * x) / (2.0 * sigma * sigma));
}

// 高亮提取
vec4 extractHighlight(vec4 color, float threshold) {
    float luminance = dot(color.rgb, vec3(0.299, 0.587, 0.114));
    float highlight = max(0.0, luminance - threshold) / (1.0 - threshold);
    return vec4(color.rgb * highlight, color.a);
}

// 高斯模糊
vec4 gaussianBlur(sampler2D tex, vec2 uv, vec2 direction, float radius) {
    vec4 color = vec4(0.0);
    float totalWeight = 0.0;
    
    float sigma = radius / 3.0;
    int samples = int(min(radius, 20.0));
    
    for (int i = -samples; i <= samples; i++) {
        float weight = gaussian(float(i), sigma);
        vec2 offset = direction * float(i) / 512.0 * radius;
        color += texture2D(tex, uv + offset) * weight;
        totalWeight += weight;
    }
    
    return color / totalWeight;
}

void main() {
    vec2 uv = vUv;
    vec4 baseColor = texture2D(texture1, uv);
    
    // 第一阶段：高亮提取
    vec4 highlight = extractHighlight(baseColor, glowThreshold);
    
    // 第二阶段：双轴模糊
    float animatedRadius = glowRadius * progress;
    
    // 水平模糊
    vec4 blurH = gaussianBlur(texture1, uv, vec2(1.0, 0.0), animatedRadius);
    blurH = extractHighlight(blurH, glowThreshold);
    
    // 垂直模糊
    vec4 blurV = gaussianBlur(texture1, uv, vec2(0.0, 1.0), animatedRadius);
    blurV = extractHighlight(blurV, glowThreshold);
    
    // 组合模糊结果
    vec4 glow = mix(blurH, blurV, 0.5);
    
    // 第三阶段：输出合成
    glow.rgb *= glowColor * glowIntensity;
    
    vec3 finalColor = baseColor.rgb + glow.rgb;
    finalColor = clamp(finalColor, 0.0, 1.0);
    
    gl_FragColor = vec4(finalColor, baseColor.a);
}`