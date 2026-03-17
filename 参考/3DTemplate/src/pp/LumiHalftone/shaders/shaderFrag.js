exports.source = `
precision mediump float;

uniform sampler2D texture1;
uniform float progress; // = 0.5
uniform float ratio; // = 1.0

// Halftone参数
uniform float colorMode; // = 0.0
uniform float blackDots; // = 1.0
uniform float dotFreq; // = 60.0
uniform float rotationAngle; // = -30.0
uniform float dotsRelativeWidth; // = 1.0
uniform float dotsSharpen; // = 1.0
uniform float dotsLighten; // = 0.0
uniform vec3 color1; // = vec3(1.0, 1.0, 1.0)
uniform vec3 color2; // = vec3(0.0, 0.0, 0.0)
uniform vec2 dotsShift; // = vec2(0.0, 0.0)
uniform vec2 alternateShift; // = vec2(0.0, 0.0)
uniform float redOffsetX; // = 0.0
uniform float redOffsetY; // = 0.25
uniform float greenOffsetX; // = 0.0
uniform float greenOffsetY; // = 0.0
uniform float blueOffsetX; // = 0.0
uniform float blueOffsetY; // = -0.25
uniform float useRings; // = 0.0
uniform float ringThickness; // = 0.5
uniform float ringCount; // = 6.0
uniform float ringPhase; // = 1.0
uniform float intensity; // 添加intensity uniform声明

varying vec2 vUv;

// 坐标变换函数
vec2 transformCoords(vec2 uv, float angle, vec2 shift, vec2 scale) {
    uv -= shift;
    uv -= 0.5;
    uv.x *= ratio;  // 宽高比校正
    
    // 旋转矩阵
    float s = sin(angle);
    float c = cos(angle);
    uv = mat2(c, -s, s, c) * uv;
    
    uv *= scale;
    uv += 0.5;
    return uv;
}

// 圆点半调函数
float halftoneDots(vec2 cellUV, float intensity, bool isBlackDots, 
                  float sharpen, float lighten) {
    float dist = length(cellUV - 0.5);
    if (isBlackDots) {
        dist = 1.0 - dist;
    }
    return smoothstep(-sharpen, sharpen, (intensity - dist) + lighten);
}

// 环形半调函数
float halftoneRings(vec2 cellUV, float intensity, bool isBlackDots, 
                   float sharpen, float lighten, float thickness, 
                   float count, float phase) {
    float dist = length(cellUV - 0.5);
    if (isBlackDots) {
        dist = 1.0 - dist;
    }
    
    // 创建环形图案
    float rings = fract((dist * count + phase) * 0.5);
    float ringMask = smoothstep(0.5 - thickness, 0.5, rings) - 
                     smoothstep(0.5, 0.5 + thickness, rings);
    
    return smoothstep(-sharpen, sharpen, (intensity - ringMask) + lighten);
}

void main() {
    vec4 inputColor = texture2D(texture1, vUv);
    
    // 预乘Alpha处理
    vec3 color = inputColor.rgb / max(inputColor.a, 0.001);
    float luminance = dot(color, vec3(0.299, 0.587, 0.114));
    
    // 坐标变换
    vec2 transformedUV = transformCoords(vUv, radians(rotationAngle), 
                                        dotsShift, 
                                        vec2(dotsRelativeWidth, 1.0));
    
    // 网格划分
    vec2 cellSize = vec2(1.0 / dotFreq);
    vec2 cellIndex = floor(transformedUV / cellSize);
    vec2 cellUV = fract((transformedUV + vec2(mod(cellIndex.y, 2.0) * alternateShift.x,
                                             mod(cellIndex.x, 2.0) * alternateShift.y)) / cellSize);
    
    vec3 result;
    bool isBlackDots = blackDots > 0.5;
    bool isRings = useRings > 0.5;
    
    if (colorMode < 0.5) {  // 灰度模式
        if (isRings) {
            result = vec3(halftoneRings(cellUV, luminance, isBlackDots, 
                                       dotsSharpen, dotsLighten, 
                                       ringThickness, ringCount, ringPhase));
        } else {
            result = vec3(halftoneDots(cellUV, luminance, isBlackDots, 
                                      dotsSharpen, dotsLighten));
        }
    } else {  // CMY或RGB模式
        vec2 colorOffsets[3];
        colorOffsets[0] = vec2(redOffsetX, redOffsetY) * 0.5;
        colorOffsets[1] = vec2(greenOffsetX, greenOffsetY) * 0.5;
        colorOffsets[2] = vec2(blueOffsetX, blueOffsetY) * 0.5;
        
        bool invertDots = (colorMode > 1.5) ? false : true;  // CMY模式反转点
        
        for (int i = 0; i < 3; i++) {
            vec2 offsetCellUV = cellUV + colorOffsets[i];
            
            if (isRings) {
                result[i] = halftoneRings(offsetCellUV, color[i], invertDots,
                                         dotsSharpen, dotsLighten,
                                         ringThickness, ringCount, ringPhase);
            } else {
                result[i] = halftoneDots(offsetCellUV, color[i], invertDots,
                                        dotsSharpen, dotsLighten);
            }
        }
    }
    
    // 颜色混合
    vec3 finalColor = mix(color2, color1, result);
    
    // 应用强度控制
    vec3 originalColor = inputColor.rgb;
    vec3 halftoneColor = finalColor * inputColor.a;
    gl_FragColor = vec4(mix(originalColor, halftoneColor, intensity), inputColor.a);
}`