exports.source = `
precision highp float;

uniform sampler2D tDiffuse; // = 源纹理
uniform float progress; // = 0.5, 动画进度
uniform float ratio; // = 1.0, 宽高比

// 波浪效果参数
uniform float wavelength; // = 0.1, 波长
uniform float amplitude; // = 0.05, 振幅
uniform float phase; // = 0.0, 相位偏移
uniform vec2 direction; // = vec2(1.0, 0.0), 波浪方向
uniform int waveType; // = 0, 波形类型 (0=正弦, 1=方波, 2=三角波)
uniform int edgeMode; // = 0, 边缘模式 (0=无, 1=全边缘, 2=中心)
uniform float intensity; // = 1.0, 效果强度

varying vec2 vUv;

// 边界安全采样
vec4 textureSafe(sampler2D tex, vec2 uv) {
    float maskX = step(0.0, uv.x) * step(uv.x, 1.0);
    float maskY = step(0.0, uv.y) * step(uv.y, 1.0);
    float mask = maskX * maskY;
    return texture2D(tex, uv) * mask;
}

// 线性步进函数
float linearStep(float edge0, float edge1, float value) {
    float t = (value - edge0) / (edge1 - edge0);
    return clamp(t, 0.0, 1.0);
}

// 波形函数
// 波形函数
float getWaveAmplitude(float phase) {
    if (waveType == 0) {
        // 正弦波
        return sin(6.28318 * phase);
    } else if (waveType == 1) {
        // 方波
        return step(0.5, fract(phase)) * 2.0 - 1.0;
    } else if (waveType == 2) {
        // 三角波
        float f = fract(phase);
        return (f < 0.5) ? (f * 4.0 - 1.0) : (3.0 - f * 4.0);
    }
    return 0.0;
}

// 边缘固定
vec2 applyEdgeConstraints(vec2 originalPos, vec2 wavePos) {
    if (edgeMode == 0) {
        return wavePos;
    } else if (edgeMode == 1) {
        // 全边缘固定
        float edgeSize = amplitude * 1.2;
        vec2 t0 = vec2(linearStep(0.0, edgeSize, originalPos.x),
                      linearStep(0.0, edgeSize, originalPos.y));
        vec2 t1 = vec2(linearStep(1.0, 1.0 - edgeSize, originalPos.x),
                      linearStep(1.0, 1.0 - edgeSize, originalPos.y));
        float mask = min(min(t0.x, t0.y), min(t1.x, t1.y));
        return mix(originalPos, wavePos, mask);
    } else if (edgeMode == 2) {
        // 中心固定
        vec2 center = vec2(0.5);
        float dist = length(originalPos - center);
        float maxDist = 0.4;
        float mask = linearStep(0.0, maxDist, dist);
        return mix(originalPos, wavePos, mask * mask);
    }
    return wavePos;
}

void main() {
    vec2 uv = vUv;
    
    // 保存原始UV坐标
    vec2 originalUV = uv;
    
    // 计算波浪相位
    float animatedPhase = phase + progress * 2.0;
    float wavePhase = fract(dot(uv, direction) / wavelength + animatedPhase);
    
    // 计算波浪振幅
    float waveAmp = getWaveAmplitude(wavePhase) * amplitude;
    
    // 计算垂直于波浪方向的向量
    vec2 perpDir = vec2(-direction.y, direction.x);
    
    // 应用波浪位移
    vec2 wavePos = uv + perpDir * waveAmp;
    
    // 应用边缘约束
    vec2 finalPos = applyEdgeConstraints(uv, wavePos);
    
    // 根据intensity在原始UV和变形UV之间插值
    vec2 intensityPos = mix(originalUV, finalPos, intensity);
    
    // 采样纹理
    vec4 color = textureSafe(tDiffuse, intensityPos);
    
    gl_FragColor = color;
}
`