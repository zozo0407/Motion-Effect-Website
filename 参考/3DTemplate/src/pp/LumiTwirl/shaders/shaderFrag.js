exports.source = `
precision highp float;

uniform sampler2D texture1; // = 源纹理
uniform float progress; // = 0.5, 动画进度
uniform float ratio; // = 1.0, 宽高比

// 旋涡效果参数
uniform vec2 center; // = vec2(0.5, 0.5), 旋涡中心
uniform float radius; // = 0.3, 影响半径
uniform float angle; // = 180.0, 最大旋转角度
uniform float strength; // = 1.0, 效果强度

varying vec2 vUv;

vec2 twirl(vec2 uv, vec2 center, float radius, float angle) {
    vec2 tc = uv - center;
    
    // 处理宽高比
    if (ratio < 1.0) {
        tc.x *= ratio;
    } else {
        tc.y /= ratio;
    }
    
    float dist = length(tc);
    
    // 动态调整半径
    float adjustedRadius = radius * mix(1.0, 1.25, smoothstep(0.0, 0.45, abs(ratio - 1.0)));
    
    if (dist < adjustedRadius) {
        // 计算旋转强度（中心最强，边缘渐弱）
        float percent = dist / adjustedRadius;
        percent = smoothstep(0.0, 1.0, percent);
        percent = 1.0 - percent;
        
        // 应用动画进度
        float animatedAngle = angle * progress * strength;
        float theta = percent * radians(animatedAngle);
        
        // 旋转变换
        float s = sin(theta);
        float c = cos(theta);
        tc = vec2(dot(tc, vec2(c, -s)), dot(tc, vec2(s, c)));
    }
    
    // 恢复宽高比
    if (ratio < 1.0) {
        tc.x /= ratio;
    } else {
        tc.y *= ratio;
    }
    
    tc += center;
    
    return tc;
}

void main() {
    vec2 uv = vUv;
    
    // 应用旋涡变换
    vec2 twirlUv = twirl(uv, center, radius, angle);
    
    // 采样纹理
    vec4 color = texture2D(texture1, twirlUv);
    
    // 边界遮罩
    float mask = step(0.0, twirlUv.x) * step(twirlUv.x, 1.0) * 
                 step(0.0, twirlUv.y) * step(twirlUv.y, 1.0);
    
    gl_FragColor = color * mask;
}`