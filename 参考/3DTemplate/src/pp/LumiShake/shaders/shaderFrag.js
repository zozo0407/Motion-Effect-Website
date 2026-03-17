exports.source = `
precision highp float;

uniform sampler2D texture1; // = 源纹理
uniform float progress; // = 0.5, 动画进度
uniform float ratio; // = 1.0, 宽高比

// 抖动效果参数
uniform float shakeIntensity; // = 0.02, 抖动强度
uniform float shakeFrequency; // = 10.0, 抖动频率
uniform vec2 shakeDirection; // = vec2(1.0, 1.0), 抖动方向
uniform float shakeSpeed; // = 1.0, 抖动速度

varying vec2 vUv;

// 随机函数
float random(float x) {
    return fract(sin(x * 12.9898) * 43758.5453);
}

// 随机2D
vec2 random2(float x) {
    return vec2(
        fract(sin(x * 12.9898) * 43758.5453),
        fract(sin(x * 78.233) * 43758.5453)
    );
}

// 生成抖动偏移
vec2 getShakeOffset(float time) {
    // 主抖动
    float t1 = time * shakeFrequency * shakeSpeed;
    vec2 shake1 = (random2(floor(t1)) - 0.5) * 2.0;
    
    // 次抖动（更高频率，更小幅度）
    float t2 = time * shakeFrequency * shakeSpeed * 2.5;
    vec2 shake2 = (random2(floor(t2)) - 0.5) * 0.5;
    
    // 微抖动（最高频率，最小幅度）
    float t3 = time * shakeFrequency * shakeSpeed * 5.0;
    vec2 shake3 = (random2(floor(t3)) - 0.5) * 0.2;
    
    // 合并抖动
    vec2 totalShake = shake1 + shake2 + shake3;
    
    // 应用方向和强度
    return totalShake * shakeIntensity * shakeDirection * progress;
}

// 边界安全采样
vec4 textureSafe(sampler2D tex, vec2 uv) {
    // 如果超出边界，使用边缘像素
    uv = clamp(uv, 0.0, 1.0);
    return texture2D(tex, uv);
}

void main() {
    vec2 uv = vUv;
    
    // 计算抖动偏移
    float time = progress * 10.0; // 增加时间变化速度
    vec2 shakeOffset = getShakeOffset(time);
    
    // 应用抖动
    vec2 shakenUv = uv + shakeOffset;
    
    // 采样纹理
    vec4 color = textureSafe(texture1, shakenUv);
    
    gl_FragColor = color;
}`