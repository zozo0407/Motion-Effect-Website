exports.source = `
precision highp float;
precision highp int;

uniform float u_rotation;
uniform float u_rotationAxis;
uniform float u_intensity;
uniform mediump sampler2D u_inputTex;

varying vec2 v_uv;

mat2 _f1(float _p0)
{
    return mat2(vec2(cos(_p0), -sin(_p0)), vec2(sin(_p0), cos(_p0)));
}

vec2 _f2(vec2 _p0, float _p1, float _p2)
{
    vec2 _58 = _p0 - vec2(0.5);
    vec2 _t1 = _58;
    float _63 = tan(_p2 + 1.5707962512969970703125);
    float _66 = tan(_p2);
    vec2 _t5 = vec2(0.0);
    _t5.x = (_t1.y - (_66 * _t1.x)) / (_63 - _66);
    _t5.y = _t5.x * _63;
    float param = -_p1;
    return ((_f1(param) * (_58 - _t5)) + _t5) + vec2(0.5);
}

vec2 _f0(vec2 _p0)
{
    return abs(mod(_p0 + vec2(1.0), vec2(2.0)) - vec2(1.0));
}

void main()
{
    // 原始纹理坐标
    vec2 originalUV = v_uv;
    
    // 计算变换后的纹理坐标
    vec2 param = v_uv;
    float param_1 = u_rotation;
    float param_2 = u_rotationAxis;
    vec2 transformedUV = _f2(param, param_1, param_2);
    transformedUV = _f0(transformedUV);
    
    // 使用强度控制混合原始坐标和变换坐标
    // 0.0 = 完全原始图像, 1.0 = 完全几何变换效果
    vec2 finalUV = mix(originalUV, transformedUV, u_intensity);
    
    gl_FragData[0] = texture2D(u_inputTex, finalUV);
}

`