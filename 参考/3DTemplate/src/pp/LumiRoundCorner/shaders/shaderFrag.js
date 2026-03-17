exports.source = `
precision mediump float;

varying vec2 vUv;

uniform sampler2D texture1; // 内置输入纹理
uniform float progress;     // 内置时间进度 (0.0 to 1.0)
uniform float ratio;        // 内置宽高比

// 自定义参数
uniform float radius; // = 0.1

// Signed Distance Function for a rounded box
float sdRoundedBox(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + r;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

void main() {
    // 将UV坐标中心点移到(0,0)，并调整Y轴以适应宽高比
    vec2 p = vUv - 0.5;
    p.y /= ratio;

    // 定义矩形的半尺寸(考虑到宽高比调整)
    vec2 b = vec2(0.5, 0.5 / ratio);

    // 计算SDF距离
    float d = sdRoundedBox(p, b, radius);

    // 采样原始纹理颜色
    vec4 color = texture2D(texture1, vUv);

    // 如果距离大于0，说明在矩形外部，则将alpha设置为0
    // 使用 smoothstep 来创建平滑的边缘，模拟羽化效果
    // fwidth(d) 可以根据硬件自动调整平滑的宽度，使其在不同分辨率下表现一致
    // color.a *= 1.0 - smoothstep(0.0, fwidth(d), d);

    float w = 0.0015; // 可调范围大致 0.001 ~ 0.003
    color.a *= 1.0 - smoothstep(0.0, w, d);

    gl_FragColor = color;
}`