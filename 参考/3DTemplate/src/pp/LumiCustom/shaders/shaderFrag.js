exports.source = `
//===begin_frag_code===
precision highp float;

uniform sampler2D tDiffuse; // 源纹理
uniform float intensity; // = 1.0 [0, 1]
uniform float ratio; // = 1.0 [0.1, 2]
uniform float blurSize; // = 10.0 [0, 100]
uniform float quality; // = 0.5 [0, 1]
uniform float lightIntensity; // = 1.0 [0, 1] // 高光散景强度
uniform vec2 test; // = vec2(0.0, 1.0) [0, 1]
uniform mat3 testMat; // = mat3(1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0) [0, 1]

varying vec2 vUv;

void main() {
    vec2 uv = vUv;
    vec4 original = texture2D(tDiffuse, uv);
    
    vec4 blurredColor = vec4(0.0);
    vec4 maxColor = vec4(0.0);
    float totalWeight = 0.0;
    
    float step = blurSize / 512.0;
    int samples = int(20.0 * quality);
    
    // 圆形散景采样
    for (int i = 0; i < 70; i++) {
        if (i >= samples) break;
        
        float angle = float(i) * 6.28318 / float(samples);
        float radius = sqrt(float(i) / float(samples));
        
        vec2 offset = vec2(cos(angle), sin(angle)) * radius * step;
        vec4 sampleColor = texture2D(tDiffuse, uv + offset);
        
        // 计算基于亮度的权重
        float luminance = dot(sampleColor.rgb, vec3(0.299, 0.587, 0.114));
        float weight = pow(luminance, 9.0) * 539.45 + 0.4;
        
        blurredColor += sampleColor * weight;
        totalWeight += weight;
        maxColor = max(maxColor, sampleColor);
    }
    
    vec4 result = clamp(blurredColor / totalWeight, vec4(0.0), vec4(1.0));
    
    // 混合高光散景效果
    vec4 bokehMix = mix(result, maxColor, clamp(result * lightIntensity, vec4(0.0), vec4(1.0)));
    
    gl_FragColor = mix(original, bokehMix, intensity);
}
//===end_frag_code===
`