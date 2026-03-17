exports.source = `
// RadialWipe.frag - 径向擦除效果
// 从中心点开始的扇形径向擦除，简化的单Pass实现

precision highp float;

// 内置uniform参数
uniform float progress;    // 时间进度，从 0.0 到 1.0 变化
uniform float ratio;       // 宽高比，用于处理不同屏幕比例
uniform sampler2D texture1; // 源纹理1，输入纹理

// 可配置参数（使用注释指定默认值）
uniform vec2 wipeCenter; // = vec2(0.5, 0.5) - 擦除中心点（归一化坐标）
uniform float startAngle; // = 0.0 - 起始角度（弧度）
uniform float wipeMode; // = 0.0 - 擦除模式（0=顺时针，1=逆时针，2=双向）
uniform float feather; // = 0.1 - 羽化强度，控制边缘柔和度

// ThreeJS规范的varying
varying vec2 vUv;

#define PI 3.14159265359

// 旋转矩阵
mat2 rotationMatrix(float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return mat2(c, -s, s, c);
}

// 角度归一化到[-PI, PI]范围
float normalizeAngle(float angle) {
    angle = mod(angle + PI, 2.0 * PI) - PI;
    return angle;
}

// 简化的羽化函数（替代高斯模糊）
float softStep(float edge0, float edge1, float x, float featherAmount) {
    float range = abs(edge1 - edge0);
    float softRange = range * featherAmount;
    return smoothstep(edge0 - softRange, edge0 + softRange, x);
}

void main() {
    // 调整UV坐标以适应宽高比
    vec2 adjustedUv = vUv;
    adjustedUv.x *= ratio;
    
    vec2 adjustedCenter = wipeCenter;
    adjustedCenter.x *= ratio;
    
    // 计算相对于中心的坐标
    vec2 offset = adjustedUv - adjustedCenter;
    
    // 应用起始角度的旋转
    vec2 rotated = rotationMatrix(-PI * 0.5 + startAngle) * offset;
    
    // 计算角度
    float angleNeg = atan(-rotated.y, rotated.x);  // 负Y轴角度（顺时针）
    float anglePos = atan(rotated.y, rotated.x);   // 正Y轴角度（逆时针）
    
    // 归一化角度
    angleNeg = normalizeAngle(angleNeg);
    anglePos = normalizeAngle(anglePos);
    
    float finalAngle;
    float targetAngle;
    
    int mode = int(wipeMode + 0.5);
    
    if (mode == 0) {
        // 顺时针模式
        finalAngle = angleNeg;
        targetAngle = (progress * 2.0 * PI) - PI;
    } else if (mode == 1) {
        // 逆时针模式
        finalAngle = anglePos;
        targetAngle = (progress * 2.0 * PI) - PI;
    } else {
        // 双向模式
        finalAngle = min(abs(angleNeg), abs(anglePos));
        targetAngle = (progress * PI);
    }
    
    // 计算遮罩值
    float mask;
    if (mode == 2) {
        // 双向模式：比较绝对值
        mask = step(0.0, targetAngle - finalAngle);
    } else {
        // 单向模式：考虑角度方向
        if (mode == 0) {
            // 顺时针：角度从-PI增长到PI
            mask = step(0.0, finalAngle - targetAngle);
        } else {
            // 逆时针：角度从PI减少到-PI
            mask = step(0.0, targetAngle - finalAngle);
        }
    }
    
    // 应用简化的羽化效果
    if (feather > 0.0) {
        float distance = abs(finalAngle - targetAngle);
        float featherRange = feather * PI * 0.1; // 将羽化强度转换为角度范围
        mask = softStep(0.0, featherRange, distance, 1.0);
        if (mode == 0 && finalAngle < targetAngle) mask = 1.0 - mask;
        if (mode == 1 && finalAngle > targetAngle) mask = 1.0 - mask;
        if (mode == 2 && finalAngle < targetAngle) mask = 1.0 - mask;
    }
    
    // 采样原始纹理并应用遮罩
    vec4 color = texture2D(texture1, vUv);
    gl_FragColor = color * mask;
}`