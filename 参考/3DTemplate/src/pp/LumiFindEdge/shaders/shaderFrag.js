exports.source = `
precision mediump float;

uniform sampler2D texture1;
uniform float progress; // = 0.5
uniform float ratio; // = 1.0

// FindEdge参数
uniform float brightness; // = 1.0
uniform float grayColor; // = 0.0
uniform float upperLimit; // = 1.0
uniform float lowerLimit; // = 0.0
uniform float u_Intensity; // = 1.0

varying vec2 vUv;

void main() {
    // 保存原始纹理颜色
    vec4 originalColor = texture2D(texture1, vUv);
    
    // 计算纹理像素大小，考虑宽高比
    vec2 texelSize = vec2(1.0) / vec2(720.0 * ratio, 720.0);
    
    // Sobel X 核 (水平边缘检测)
    vec4 sobelX = vec4(0.0);
    sobelX += texture2D(texture1, vUv + vec2(-texelSize.x, -texelSize.y)) * (-1.0);
    sobelX += texture2D(texture1, vUv + vec2(-texelSize.x, 0.0)) * (-2.0);
    sobelX += texture2D(texture1, vUv + vec2(-texelSize.x, texelSize.y)) * (-1.0);
    sobelX += texture2D(texture1, vUv + vec2(texelSize.x, -texelSize.y)) * 1.0;
    sobelX += texture2D(texture1, vUv + vec2(texelSize.x, 0.0)) * 2.0;
    sobelX += texture2D(texture1, vUv + vec2(texelSize.x, texelSize.y)) * 1.0;
    
    // Sobel Y 核 (垂直边缘检测)
    vec4 sobelY = vec4(0.0);
    sobelY += texture2D(texture1, vUv + vec2(-texelSize.x, -texelSize.y)) * (-1.0);
    sobelY += texture2D(texture1, vUv + vec2(0.0, -texelSize.y)) * (-2.0);
    sobelY += texture2D(texture1, vUv + vec2(texelSize.x, -texelSize.y)) * (-1.0);
    sobelY += texture2D(texture1, vUv + vec2(-texelSize.x, texelSize.y)) * 1.0;
    sobelY += texture2D(texture1, vUv + vec2(0.0, texelSize.y)) * 2.0;
    sobelY += texture2D(texture1, vUv + vec2(texelSize.x, texelSize.y)) * 1.0;
    
    vec4 edge;
    if (grayColor > 0.5) {
        // 灰度模式：转换为灰度后计算边缘强度
        float gx = dot(sobelX.rgb, vec3(0.299, 0.587, 0.114));
        float gy = dot(sobelY.rgb, vec3(0.299, 0.587, 0.114));
        float edgeStrength = sqrt(gx * gx + gy * gy);
        edge = vec4(vec3(edgeStrength), 1.0);
    } else {
        // 彩色模式：分别计算RGB通道的边缘
        edge = sqrt(sobelX * sobelX + sobelY * sobelY);
    }
    
    // 应用亮度调整
    edge *= brightness;
    
    // 应用阈值处理，使用smoothstep实现平滑过渡
    edge = smoothstep(vec4(lowerLimit), vec4(upperLimit), edge);
    
    // 保持原始Alpha通道
    edge.a = originalColor.a;
    
    // 使用强度控制混合原始图像和边缘检测结果
    // 0.0 = 完全原始图像, 1.0 = 完全边缘检测效果
    gl_FragColor = mix(originalColor, edge, u_Intensity);
}`