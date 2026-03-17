exports.source = `
// CircleWipe.frag - 圆形擦除效果
// 基于距离场的圆形扩散效果，使用smoothstep实现羽化

precision highp float;

// 内置uniform参数
uniform float progress;    // 时间进度，从 0.0 到 1.0 变化
uniform float ratio;       // 宽高比，用于处理不同屏幕比例
uniform sampler2D texture1; // 源纹理1，输入纹理

// 可配置参数（使用注释指定默认值）
uniform vec2 center; // = vec2(0.5, 0.5) - 圆心位置（归一化坐标）
uniform float feather; // = 0.05 - 羽化程度，控制边缘柔和度
uniform float reverse; // = 0.0 - 反转效果（0.0=正常，1.0=反转）

// ThreeJS规范的varying
varying vec2 vUv;

void main() {
    // 调整UV坐标以适应宽高比
    vec2 adjustedUv = vUv;
    adjustedUv.x *= ratio;
    
    vec2 adjustedCenter = center;
    adjustedCenter.x *= ratio;
    
    // 计算当前像素到圆心的距离
    float dist = distance(adjustedUv, adjustedCenter);
    
    // 计算最大半径（从中心到最远角的距离）
    vec2 corners[4];
    corners[0] = vec2(0.0, 0.0);
    corners[1] = vec2(ratio, 0.0);
    corners[2] = vec2(0.0, 1.0);
    corners[3] = vec2(ratio, 1.0);
    
    float maxRadius = 0.0;
    for (int i = 0; i < 4; i++) {
        maxRadius = max(maxRadius, distance(adjustedCenter, corners[i]));
    }
    
    // 根据进度计算当前半径
    float currentRadius = progress * maxRadius;
    
    // 限制羽化范围，避免过度羽化
    float featherRange = min(dist, feather * maxRadius);
    
    // 使用smoothstep创建平滑的圆形遮罩
    float mask = smoothstep(currentRadius + featherRange, currentRadius - featherRange, dist);
    
    // 应用反转效果
    mask = mix(mask, 1.0 - mask, reverse);
    
    // 采样原始纹理并应用遮罩
    vec4 color = texture2D(texture1, vUv);
    gl_FragColor = color * mask;
}`