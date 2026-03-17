exports.source = `
precision highp float;

uniform sampler2D texture1; // = 源纹理
uniform float blurType; // = 0.0
uniform float amount; // = 60.0
uniform float quality; // = 0.2
uniform vec2 center; // = vec2(0.5, 0.5)
uniform float weightDecay; // = 0.965
uniform float progress; // = 内置进度参数
uniform float ratio; // = 内置宽高比

varying vec2 vUv;

void main() {
    vec2 uv = vUv;
    vec4 original = texture2D(texture1, uv);
    
    vec2 direction = uv - center;
    float distance = length(direction);
    vec2 normalizedDir = normalize(direction);
    
    vec4 blurredColor = vec4(0.0);
    float totalWeight = 0.0;
    
    int samples = int(20.0 + 60.0 * quality);
    float step = amount / 1000.0;
    
    for (int i = 0; i < 80; i++) {
        if (i >= samples) break;
        
        float t = float(i) / float(samples - 1);
        vec2 sampleUv = uv;
        
        if (blurType < 0.5) { // 直线缩放
            sampleUv = center + direction * (1.0 - t * step);
        } else if (blurType < 1.5) { // 渐变缩放
            float fade = 1.0 - distance;
            sampleUv = center + direction * (1.0 - t * step * fade);
        } else if (blurType < 2.5) { // 居中缩放
            sampleUv = center + direction * (1.0 + t * step);
        } else if (blurType < 3.5) { // 旋转
            float angle = t * step * 10.0;
            float c = cos(angle);
            float s = sin(angle);
            mat2 rotMat = mat2(c, -s, s, c);
            sampleUv = center + rotMat * direction;
        } else { // 其他模式的简化实现
            sampleUv = center + direction * (1.0 - t * step * 0.5);
        }
        
        if (sampleUv.x >= 0.0 && sampleUv.x <= 1.0 && sampleUv.y >= 0.0 && sampleUv.y <= 1.0) {
            float weight = pow(weightDecay, float(i));
            blurredColor += texture2D(texture1, sampleUv) * weight;
            totalWeight += weight;
        }
    }
    
    if (totalWeight > 0.0) {
        blurredColor /= totalWeight;
    } else {
        blurredColor = original;
    }
    
    gl_FragColor = blurredColor;
}`