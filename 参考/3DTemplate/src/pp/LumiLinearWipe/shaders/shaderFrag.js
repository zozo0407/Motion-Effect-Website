exports.source = `
// LinearWipe.frag - 线性擦除效果
// 通过旋转坐标系统，沿指定角度创建线性渐变遮罩

precision highp float;

// 内置uniform参数
uniform float progress;    // 时间进度，从 0.0 到 1.0 变化
uniform float ratio;       // 宽高比，用于处理不同屏幕比例
uniform sampler2D texture1; // 源纹理1，输入纹理

// 可配置参数（使用注释指定默认值）
uniform float rotation; // = 0.0 - 旋转角度（弧度）
uniform float feather; // = 0.05 - 羽化程度，控制边缘柔和度

// ThreeJS规范的varying
varying vec2 vUv;

// 旋转变换函数
vec2 rotateUV(vec2 uv, float angle) {
    float s = sin(angle);
    float c = cos(angle);
    mat2 rotationMatrix = mat2(c, -s, s, c);
    
    // 先平移到原点，应用旋转，再平移回中心
    return (uv - vec2(0.5)) * rotationMatrix + vec2(0.5);
}

void main() {
    // 调整UV坐标以适应宽高比
    vec2 adjustedUv = vUv;
    adjustedUv.x *= ratio;
    
    // 应用旋转变换
    vec2 rotatedUV = rotateUV(adjustedUv, rotation);
    
    // 将进度从[0,1]映射到[-0.5,1.5]，实现完整的擦除过程
    float mappedProgress = progress * 2.0 - 0.5;
    
    // 基于旋转后的Y坐标生成线性遮罩
    // 使用smoothstep创建平滑过渡
    float mask = smoothstep(mappedProgress - feather, mappedProgress + feather, rotatedUV.y);
    
    // 采样原始纹理并应用遮罩
    vec4 color = texture2D(texture1, vUv);
    gl_FragColor = color * mask;
}`