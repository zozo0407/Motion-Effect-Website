exports.source = `
// Flicker Effect Fragment Shader
// 闪烁效果 - 通过随机噪声和波形调制实现画面闪烁
precision highp float;

uniform sampler2D texture1; // 源纹理
uniform float progress; // = 0.5 时间进度
uniform float ratio; // = 1.0 宽高比

// Flicker参数
uniform float globalAmp; // = 0.2 全局强度
uniform float randLumaAmp; // = 1.0 随机亮度强度
uniform float randColorAmp; // = 0.0 随机颜色强度
uniform float randFreq; // = 30.0 随机频率
uniform float waveAmp; // = 0.0 波强度
uniform float waveFreq; // = 5.0 波频率
uniform float phaseR; // = 0.0 红色相位
uniform float phaseG; // = 0.0 绿色相位
uniform float phaseB; // = 0.0 蓝色相位
uniform float ampR; // = 1.0 红色强度
uniform float ampG; // = 1.0 绿色强度
uniform float ampB; // = 1.0 蓝色强度
uniform float brightness; // = 1.0 亮度
uniform float seed; // = 0.123 随机种子
uniform float u_Intensity; // = 1.0 强度控制

varying vec2 vUv;

// 随机数生成函数
float random(float x) {
    return fract(sin(x * 12.9898) * 43758.5453);
}

// 生成复合随机噪声
vec3 generateRandomNoise(float time) {
    float t = time * randFreq;
    
    // 基于种子的多层噪声
    float seedOffset1 = mod(seed, 0.23);
    float seedOffset2 = mod(seed, 0.47);
    float seedOffset3 = mod(seed, 0.83);
    
    // 亮度噪声
    float lumaNoiseR = 0.0;
    lumaNoiseR += sin((t + seedOffset1) * 6.283) * 0.4;
    lumaNoiseR += sin((t * 2.03 + seedOffset2) * 6.283) * 0.3;
    lumaNoiseR += cos((t * 4.0 + seedOffset3) * 6.283) * 0.2;
    lumaNoiseR += sin((t * 4.91 + seedOffset1) * 6.283) * 0.1;
    
    // 颜色噪声
    vec3 colorNoise = vec3(0.0);
    colorNoise.r += cos((t + seedOffset1) * 6.283) * 0.4;
    colorNoise.r += cos((t * 1.53 + seedOffset2) * 6.283) * 0.3;
    colorNoise.r += cos((t * 3.57 + seedOffset3) * 6.283) * 0.2;
    colorNoise.r += sin((t * 5.11 + seedOffset1) * 6.283) * 0.1;
    
    colorNoise.g += cos((t + seedOffset2) * 6.283) * 0.4;
    colorNoise.g += cos((t * 1.53 + seedOffset3) * 6.283) * 0.3;
    colorNoise.g += cos((t * 2.17 + seedOffset1) * 6.283) * 0.2;
    colorNoise.g += cos((t * 3.91 + seedOffset2) * 6.283) * 0.1;
    
    colorNoise.b += cos((t + seedOffset3) * 6.283) * 0.4;
    colorNoise.b += cos((t * 0.97 + seedOffset1) * 6.283) * 0.3;
    colorNoise.b += sin((t * 2.17 + seedOffset2) * 6.283) * 0.2;
    colorNoise.b += cos((t * 3.91 + seedOffset3) * 6.283) * 0.1;
    
    return vec3(lumaNoiseR) * randLumaAmp + colorNoise * randColorAmp;
}

// 生成波形调制
vec3 generateWaveModulation(float time) {
    return vec3(
        cos((time * waveFreq + phaseR) * 6.283),
        cos((time * waveFreq + phaseG) * 6.283),
        cos((time * waveFreq + phaseB) * 6.283)
    ) * waveAmp;
}

void main() {
    vec4 originalColor = texture2D(texture1, vUv);
    
    // 生成随机噪声和波形调制
    vec3 randomNoise = generateRandomNoise(progress);
    vec3 waveModulation = generateWaveModulation(progress);
    
    // 应用闪烁效果
    vec3 flickerModulation = (waveModulation + randomNoise) * 
                            (originalColor.rgb * vec3(ampR, ampG, ampB)) * globalAmp;
    
    vec3 flickerColor = clamp(originalColor.rgb * brightness + flickerModulation, 0.0, 1.0);
    
    // 使用强度控制混合原始图像和闪烁效果
    // 0.0 = 完全原始图像, 1.0 = 完全闪烁效果
    vec3 finalColor = mix(originalColor.rgb, flickerColor, u_Intensity);
    
    gl_FragColor = vec4(finalColor, originalColor.a);
}`