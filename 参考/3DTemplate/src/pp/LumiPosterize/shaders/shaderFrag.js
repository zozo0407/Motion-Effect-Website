exports.source = `
// Posterize Effect Fragment Shader
// 色调分离效果 - 减少颜色层次，产生海报化效果
precision highp float;

uniform sampler2D texture1; // 源纹理
uniform float progress; // = 0.5 时间进度
uniform float ratio; // = 1.0 宽高比

// Posterize参数
uniform float levels; // = 8.0 色阶数量
uniform float intensity; // 添加intensity uniform

varying vec2 vUv;

void main() {
    vec4 originalColor = texture2D(texture1, vUv);
    
    // 量化颜色值
    vec3 posterizedColor = floor(originalColor.rgb * levels) / levels;
    
    // 使用intensity在原始颜色和posterize效果之间插值
    vec3 result = mix(originalColor.rgb, posterizedColor, intensity);
    
    gl_FragColor = vec4(result, originalColor.a);
}`