exports.source = `
precision highp float;

uniform sampler2D texture1; // = 源纹理
uniform float progress; // = 0.5, 动画进度
uniform float ratio; // = 1.0, 宽高比

// 膨胀效果参数
uniform vec2 bulgeCenter; // = vec2(0.0, 0.0), 膨胀中心偏移
uniform vec2 bulgeRadius; // = vec2(0.3, 0.3), 椭圆半径
uniform float bulgeHeight; // = 0.2, 膨胀高度
uniform float coneRadius; // = 0.8, 锥形半径
uniform float pinEdges; // = 0.0, 边缘固定

varying vec2 vUv;

void main() {
    vec2 uv = vUv;
    
    // 计算相对于中心的位置
    vec2 center = vec2(0.5) + bulgeCenter;
    vec2 relativePos = uv - center;
    
    // 计算椭圆遮罩
    vec2 normalizedPos = relativePos / bulgeRadius;
    float dist = length(normalizedPos);
    float ellipseMask = 1.0 - smoothstep(0.0, 1.0, dist);
    
    // 应用锥形渐变
    float coneEffect = smoothstep(coneRadius * coneRadius, pow(coneRadius, 0.5), ellipseMask) * ellipseMask;
    
    // 边缘固定遮罩
    float edgeMask = 1.0;
    if (pinEdges > 0.5) {
        float edgeSize = 0.05;
        edgeMask = min(edgeMask, smoothstep(0.0, edgeSize, uv.x));
        edgeMask = min(edgeMask, smoothstep(1.0, 1.0 - edgeSize, uv.x));
        edgeMask = min(edgeMask, smoothstep(0.0, edgeSize, uv.y));
        edgeMask = min(edgeMask, smoothstep(1.0, 1.0 - edgeSize, uv.y));
    }
    
    // 计算膨胀位移
    float bulgeStrength = bulgeHeight * progress;
    vec2 displacement = relativePos * (2.0 - length(relativePos)) * 
                       mix(0.0, -bulgeStrength, pow(edgeMask * coneEffect, 0.5));
    
    // 应用位移
    vec2 bulgedUv = uv + displacement;
    
    // 边界检查
    bulgedUv = clamp(bulgedUv, 0.0, 1.0);
    
    // 采样纹理
    vec4 color = texture2D(texture1, bulgedUv);
    
    gl_FragColor = color;
}`