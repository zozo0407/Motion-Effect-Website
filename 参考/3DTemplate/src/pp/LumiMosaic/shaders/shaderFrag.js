exports.source = `
precision mediump float;

uniform sampler2D texture1;
uniform float progress; // = 0.5
uniform float ratio; // = 1.0

// Mosaic参数
uniform float horizontal; // = 10.0
uniform float vertical; // = 10.0
uniform float sharp; // = 0.0
uniform float intensity; // 添加intensity uniform

varying vec2 vUv;

// 多采样平均函数
vec4 sampleAverage(float offset, vec2 center, vec2 sampleStep) {
    return texture2D(texture1, center + sampleStep * vec2(offset, 0.0)) + 
           texture2D(texture1, center - sampleStep * vec2(offset, 0.0));
}

void main() {
    // 保存原始纹理颜色
    vec4 originalColor = texture2D(texture1, vUv);
    
    vec2 blockCount = vec2(horizontal, vertical);
    
    // 处理宽高比和零值情况
    if (horizontal < 1.0) {
        blockCount.x = max(1.0, (vertical * ratio));
    } else if (vertical < 1.0) {
        blockCount.y = max(1.0, (horizontal / ratio));
    }
    
    // 计算块中心位置
    vec2 blockCenter = (floor(blockCount * vUv) + 0.5) / blockCount;
    
    // 基础采样
    vec4 color = texture2D(texture1, blockCenter);
    
    if (sharp < 0.5) {
        // 多重采样平均（抗锯齿）
        vec2 sampleStep = ((1.0 / blockCount) / 8.0);
        float totalSamples = 1.0;
        
        // 在块内进行多点采样
        for (float i = 1.0; i <= 4.0; i += 1.0) {
            color += sampleAverage(i, blockCenter, sampleStep);
            totalSamples += 2.0;
        }
        
        // 垂直方向采样
        for (float i = 1.0; i <= 4.0; i += 1.0) {
            color += sampleAverage(i, blockCenter, vec2(0.0, sampleStep.y));
            totalSamples += 2.0;
        }
        
        // 平均化
        color /= totalSamples;
    }
    
    // 使用intensity在原始颜色和马赛克效果之间插值
    gl_FragColor = mix(originalColor, color, intensity);
}`