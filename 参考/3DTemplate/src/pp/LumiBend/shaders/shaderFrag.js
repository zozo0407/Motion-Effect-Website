exports.source = `
precision highp float;

uniform sampler2D texture1; // = 源纹理
uniform float progress; // = 0.5, 动画进度
uniform float ratio; // = 1.0, 宽高比

// 弯曲效果参数
uniform vec2 startPoint; // = vec2(0.2, 0.5), 起始点
uniform vec2 endPoint; // = vec2(0.8, 0.5), 结束点
uniform float bendAmount; // = 30.0, 弯曲程度
uniform int renderMode; // = 0, 渲染模式
uniform int distortMode; // = 0, 扭曲模式

varying vec2 vUv;

// 旋转函数
vec2 rotate(vec2 uv, float theta) {
    float s = sin(theta);
    float c = cos(theta);
    return vec2(uv.x * c - uv.y * s, uv.x * s + uv.y * c);
}

// 弯曲变换
vec2 bend(vec2 uv, float angle) {
    if (abs(angle) < 0.0001) {
        return uv + 0.5;
    }
    
    const float BLOCK_HEIGHT = 1.0;
    float bendSign = angle < 0.0 ? -1.0 : 1.0;
    float bendRadius = BLOCK_HEIGHT / abs(angle);
    
    vec2 p = uv * vec2(bendSign, 1.0) + vec2(bendRadius, 0.0);
    
    float r = length(p) - bendRadius;
    float theta = atan(p.y, p.x) / abs(angle);
    
    return vec2(r * bendSign + 0.5, theta + 0.5);
}

// 镜像函数
vec2 mirror(vec2 uv, vec2 point, vec2 normal) {
    vec2 n = normalize(normal);
    vec2 d = uv - point;
    float projection = dot(d, n);
    if (projection > 0.0) {
        return uv - projection * n * 2.0;
    }
    return uv;
}

vec2 getBoundaryMask(vec2 uv) {
    float maskX = step(0.0, uv.x) * step(uv.x, 1.0);
    float maskY = step(0.0, uv.y) * step(uv.y, 1.0);
    return vec2(maskX, maskY);
}

void main() {
    vec2 uv = vUv;
    
    // 计算弯曲参数
    float dist = length(endPoint - startPoint);
    float theta = atan(endPoint.x - startPoint.x, endPoint.y - startPoint.y);
    
    // 处理宽高比
    vec2 aspectRatio = vec2(1.0, ratio);
    vec2 adjustedUv = (uv - 0.5) * aspectRatio + 0.5;
    vec2 adjustedStart = (startPoint - 0.5) * aspectRatio + 0.5;
    
    // 旋转到弯曲坐标系
    vec2 rotatedUv = rotate(adjustedUv - startPoint, theta) + startPoint;
    rotatedUv -= adjustedStart;
    
    // 应用弯曲变换
    float animatedBend = bendAmount * progress * 0.0312 * min(1.0 / ratio, 1.0);
    vec2 bentUv = bend(rotatedUv, animatedBend / dist) + (adjustedStart - 0.5);
    
    // 旋转回原坐标系
    bentUv = rotate(bentUv - startPoint, -theta) + startPoint;
    
    // 恢复宽高比
    bentUv = (bentUv - 0.5) / aspectRatio + 0.5;
    
    // 处理渲染模式
    if (renderMode == 1) {
        // 预渲染模式：起始点之前不变形
        vec2 toStart = bentUv - startPoint;
        vec2 direction = startPoint - endPoint;
        float projection = dot(toStart, direction);
        if (projection > 0.0) {
            bentUv = uv;
        }
    } else if (renderMode == 3) {
        // 镜像模式
        bentUv = mirror(bentUv, startPoint, startPoint - endPoint);
    }
    
    // 边界检查
    vec2 mask = getBoundaryMask(bentUv);
    
    // 采样纹理
    vec4 color = texture2D(texture1, bentUv) * mask.x * mask.y;
    
    gl_FragColor = color;
}
`