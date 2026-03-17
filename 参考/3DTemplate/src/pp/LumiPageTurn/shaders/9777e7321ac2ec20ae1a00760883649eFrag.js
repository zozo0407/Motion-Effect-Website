exports.source = `
precision highp float;
precision highp int;

uniform mediump sampler2D u_backTex;
uniform mediump sampler2D u_frontTex;
uniform mediump int u_renderFace;
uniform vec2 u_inCornerPosition;
uniform vec2 u_inFoldPosition;
uniform float u_foldRadius;
uniform float u_classicUi;
uniform float u_intensity; // 添加intensity uniform

varying vec2 v_uv0;

vec3 _f4(vec2 _p0, vec2 _p1)
{
    return vec3(_p0.y - _p1.y, _p1.x - _p0.x, (_p0.x * _p1.y) - (_p0.y * _p1.x));
}

vec4 _f5(vec3 _p0, float _p1)
{
    float _238 = sqrt((_p0.x * _p0.x) + (_p0.y * _p0.y));
    return vec4(_p0.x, _p0.y, (_p1 * _238) + _p0.z, _p0.z - (_p1 * _238));
}

float _f1(vec2 _p0, vec2 _p1)
{
    return (_p0.x * _p1.y) - (_p0.y * _p1.x);
}

float _f2(vec2 _p0, vec3 _p1)
{
    return abs(((_p1.x * _p0.x) + (_p1.y * _p0.y)) + _p1.z) / sqrt((_p1.x * _p1.x) + (_p1.y * _p1.y));
}

float _f0(vec2 _p0)
{
    return ((step(0.0, _p0.x) * step(_p0.x, 1.0)) * step(0.0, _p0.y)) * step(_p0.y, 1.0);
}

vec2 _f3(vec2 _p0, vec3 _p1)
{
    float _130 = _p1.y * _p1.y;
    float _133 = _p1.x * _p1.x;
    float _155 = _133 + _130;
    return vec2((((_130 - _133) * _p0.x) - ((2.0 * _p1.x) * ((_p1.y * _p0.y) + _p1.z))) / _155, (((_133 - _130) * _p0.y) - ((2.0 * _p1.y) * ((_p1.x * _p0.x) + _p1.z))) / _155);
}

void _f6(vec2 _p0, vec2 _p1, vec2 _p2, float _p3, float _p4, inout vec4 _p5)
{
    vec2 _t15 = _p1;
    vec2 _270 = vec2(_p2.x + 9.9999999392252902907785028219223e-09, _p2.y + 9.9999999392252902907785028219223e-09);
    vec2 _t16 = _270;
    if (_t15.y >= 1.0)
    {
        _t15.y = max(_t16.y + 0.001000000047497451305389404296875, _t15.y);
    }
    if (_t15.y <= 0.0)
    {
        _t15.y = min(_t16.y - 0.001000000047497451305389404296875, _t15.y);
    }
    if (_t15.x >= 1.0)
    {
        _t15.x = max(_t16.x + 0.001000000047497451305389404296875, _t15.x);
    }
    if (_t15.x <= 0.0)
    {
        _t15.x = min(_t16.x - 0.001000000047497451305389404296875, _t15.x);
    }
    float _323 = max(_p3, 9.9999999392252902907785028219223e-09);
    vec2 _t19 = (_t15 + _270) * 0.5;
    float _339 = (3.1415927410125732421875 * _323) * 0.5;
    vec2 param = _t15;
    vec2 param_1 = _270;
    vec3 _t21 = _f4(param, param_1);
    vec3 _t22 = vec3(_t21.y, -_t21.x, (_t21.x * _t16.y) - (_t21.y * _t16.x));
    float _366 = _t22.x;
    float _368 = _t22.y;
    float _371 = sign(_366 / (_368 + 9.9999999392252902907785028219223e-09));
    vec3 _389 = vec3(_t21.y, -_t21.x, (_t21.x * _t19.y) - (_t21.y * _t19.x));
    if (_p4 > 0.5)
    {
        vec3 param_2 = _389;
        float param_3 = 0.0;
        _t22 = _f5(param_2, param_3).xyw;
    }
    vec3 param_4 = _389;
    float param_5 = _339;
    vec3 _405 = _f5(param_4, param_5).xyw;
    vec3 _t25 = _405;
    vec3 param_6 = _405;
    float param_7 = _323;
    float _t27 = 0.0;
    if (_371 < 0.0)
    {
        if ((_t22.z - _t25.z) > 0.0)
        {
            _t25.z = _t22.z;
            vec3 param_8 = _t25;
            float param_9 = _323;
            _t27 = 1.0;
        }
    }
    else
    {
        if ((_t25.z - _t22.z) < 0.0)
        {
            _t25.z = _t22.z;
            vec3 param_10 = _t25;
            float param_11 = _323;
            _t27 = 1.0;
        }
    }
    vec2 _t28 = vec2(((-_t25.z) - (_t25.y * _t15.y)) / (_t25.x + 9.9999999392252902907785028219223e-09), _t15.y);
    vec2 _t29 = vec2(_t15.x, ((-_t25.z) - (_t25.x * _t15.x)) / (_t25.y + 9.9999999392252902907785028219223e-09));
    if (_371 > 0.0)
    {
        vec2 _492 = _t28;
        _t28 = _t29;
        _t29 = _492;
    }
    vec2 param_12 = _t28 - _t29;
    vec2 param_13 = _t28 - _p0;
    float _506 = float(_f1(param_12, param_13) > 0.0);
    vec2 param_14 = _p0;
    vec3 param_15 = _t25;
    float _512 = _f2(param_14, param_15);
    float _521 = step(_512, _323 + 0.001000000047497451305389404296875);
    vec2 _542 = clamp(_p0 + (normalize(-normalize(_270 - _t15)) * (((asin(_512 / _323) * _521) * _323) - _512)), vec2(-10.0), vec2(10.0));
    vec2 param_16 = _542;
    vec4 _t37 = texture2D(u_backTex, mix(_542 * _f0(param_16), _p0, vec2(_506)));
    vec2 param_17 = _542;
    vec4 _568 = _t37 * clamp(_506 + _f0(param_17), 0.0, 1.0);
    vec4 _578 = _568 * step(_512, _323 + 9.9999997473787516355514526367188e-05);
    _t37 = mix(_568 * _506, _578, vec4(_578.w));
    vec3 _t38 = _389;
    if (_t27 > 0.5)
    {
        vec3 param_18 = _t25;
        float param_19 = _339;
        _t38 = _f5(param_18, param_19).xyz;
    }
    vec2 param_20 = _p0;
    vec3 param_21 = _t38;
    vec2 _606 = _f3(param_20, param_21);
    vec2 param_22 = _606;
    vec2 param_23 = _542;
    vec3 param_24 = _t38;
    vec2 _618 = _f3(param_23, param_24);
    vec2 param_25 = _618;
    float _631 = (_f0(param_25) * (1.0 - _506)) * _521;
    mediump vec4 _642 = texture2D(u_frontTex, mix(_606, _618, vec2(_631)));
    vec4 _648 = _642 * clamp(_631 + (_506 * _f0(param_22)), 0.0, 1.0);
    if (u_renderFace == 0)
    {
        _p5 = mix(_648, _p5, vec4(_p5.w));
        _p5 = mix(_t37, _p5, vec4(_p5.w));
    }
    else
    {
        if (u_renderFace == 1)
        {
            _p5 = mix(_648, _p5, vec4(_p5.w));
        }
        else
        {
            if (u_renderFace == 2)
            {
                _p5 = mix(_t37, _p5, vec4(_p5.w));
            }
        }
    }
}

void main()
{
    // 保存原始纹理颜色
    vec4 originalColor = texture2D(u_backTex, v_uv0);
    
    vec4 _t46 = vec4(0.0);
    vec2 param = v_uv0;
    vec2 param_1 = u_inCornerPosition;
    vec2 param_2 = u_inFoldPosition;
    float param_3 = u_foldRadius;
    float param_4 = u_classicUi;
    vec4 param_5 = vec4(0.0);
    _f6(param, param_1, param_2, param_3, param_4, param_5);
    _t46 = param_5;
    vec2 param_6 = v_uv0;
    vec4 _722 = _t46;
    vec4 _723 = _722 * _f0(param_6);
    _t46 = _723;
    
    // 使用intensity在原始颜色和处理后颜色之间插值
    gl_FragData[0] = mix(originalColor, _723, u_intensity);
}

`