exports.source=`
precision highp float;
precision highp int;

uniform vec4 u_ScreenParams;
uniform vec2 u_center;
uniform float u_globalTransform;
uniform float u_scaleEnd;
uniform float u_scaleStart;
uniform float u_angleEnd;
uniform float u_angleStart;
uniform float u_smoothness;
uniform vec2 u_offsetStart;
uniform vec2 u_offsetEnd;
uniform vec3 u_colorStart;
uniform vec3 u_colorMid;
uniform vec3 u_colorEnd;
uniform float u_weight;
uniform float u_fallOff;
uniform mediump sampler2D u_inputTexture;

varying vec2 v_uv;

mat2 _f0(float _p0)
{
    float _50 = sin(_p0);
    float _53 = cos(_p0);
    return mat2(vec2(_53, -_50), vec2(_50, _53));
}

vec2 _f1(vec2 _p0, vec2 _p1, float _p2)
{
    vec2 _t2 = _p0 - _p1;
    float _81 = u_ScreenParams.x / u_ScreenParams.y;
    _t2.x *= _81;
    float param = _p2;
    _t2 *= _f0(param);
    _t2.x /= _81;
    return _t2 + _p1;
}

vec2 _f2(vec2 _p0, vec2 _p1, mat2 _p2)
{
    vec2 _t3 = _p0 - _p1;
    float _113 = u_ScreenParams.x / u_ScreenParams.y;
    _t3.x *= _113;
    _t3 *= _p2;
    _t3.x /= _113;
    return _t3 + _p1;
}

float _f4(float _p0, float _p1, float _p2, float _p3)
{
    return clamp((1.0 - (abs(_p3 - _p0) / _p2)) * _p1, 0.0, 1.0);
}

vec3 _f5(vec3 _p0, vec3 _p1, vec3 _p2, float _p3)
{
    float param = 0.0;
    float param_1 = 1.0;
    float param_2 = 0.5;
    float param_3 = _p3;
    float param_4 = 0.5;
    float param_5 = 1.0;
    float param_6 = 0.5;
    float param_7 = _p3;
    float param_8 = 1.0;
    float param_9 = 1.0;
    float param_10 = 0.5;
    float param_11 = _p3;
    return ((_p0 * _f4(param, param_1, param_2, param_3)) + (_p1 * _f4(param_4, param_5, param_6, param_7))) + (_p2 * _f4(param_8, param_9, param_10, param_11));
}

vec2 _f3(vec2 _p0)
{
    return abs(mod(_p0 + vec2(1.0), vec2(2.0)) - vec2(1.0));
}

void main()
{
    vec4 _t7 = vec4(0.0);
    vec4 _t8 = vec4(0.0);
    vec4 _t9 = vec4(0.0);
    vec4 _t10 = vec4(0.0);
    vec2 _210 = mix(vec2(0.5), vec2(u_center), vec2(u_globalTransform));
    float _227 = u_scaleEnd - u_scaleStart;
    float _t13 = max(80.0 * abs(_227), mix(0.0, 79.0, abs(u_angleEnd - u_angleStart) / 0.5));
    float _243 = u_smoothness * u_smoothness;
    if (_243 > 0.300000011920928955078125)
    {
        _t13 = max((_t13 * sqrt(length(v_uv - _210))) * 4.0, 6.0);
    }
    float _272 = _t13;
    float _284 = floor(mix(2.0, max(2.0, max(length((u_offsetStart - u_offsetEnd) * (u_ScreenParams.xy / vec2(min(u_ScreenParams.y, u_ScreenParams.x)))) * 450.0, _272) * u_globalTransform), clamp(_243, 0.0, 1.0)));
    _t13 = _284;
    float _291 = u_angleStart * u_globalTransform;
    float param = ((u_angleEnd * u_globalTransform) - _291) / _284;
    mat2 _296 = _f0(param);
    vec2 param_1 = v_uv;
    vec2 param_2 = _210;
    float param_3 = _291;
    vec2 _t15 = _f1(param_1, param_2, param_3);
    vec2 _311 = (u_offsetStart - vec2(0.5)) * u_globalTransform;
    vec2 _316 = (u_offsetEnd - vec2(0.5)) * u_globalTransform;
    for (mediump int _t18 = 0; _t18 <= 1024; _t18++)
    {
        mediump float _331 = float(_t18);
        if (_331 > _t13)
        {
            break;
        }
        float _341 = _331 / _t13;
        vec2 _343 = _t15;
        vec2 _345 = _343 - _210;
        vec2 _368 = vec2(_341);
        vec2 param_4 = _343;
        vec2 param_5 = _210;
        mat2 param_6 = _296;
        _t15 = _f2(param_4, param_5, param_6);
        float _390 = 1.0 - _341;
        vec3 param_7 = u_colorStart;
        vec3 param_8 = u_colorMid;
        vec3 param_9 = u_colorEnd;
        float param_10 = _390;
        vec3 _t24 = mix(vec3(0.00999999977648258209228515625), _f5(param_7, param_8, param_9, param_10), vec3(clamp(u_weight, 0.0, 1.0)));
        float _t25 = 0.00999999977648258209228515625;
        if (u_scaleStart > u_scaleEnd)
        {
            _t25 = pow(clamp(_390, 0.001000000047497451305389404296875, 1.0), 1.0 + ((u_scaleStart - u_scaleEnd) * 2.0));
        }
        else
        {
            _t25 = pow(clamp(_341, 0.001000000047497451305389404296875, 1.0), 1.0 + (_227 * 2.0));
        }
        _t24 *= _t25;
        vec2 param_11 = mix((_345 / vec2(mix(1.0, u_scaleStart, u_globalTransform))) + _210, (_345 / vec2(mix(1.0, u_scaleEnd, u_globalTransform))) + _210, _368) - mix(_311, _316, _368);
        mediump vec4 _453 = texture2D(u_inputTexture, _f3(param_11));
        vec4 _459 = vec4(_t24, 1.0);
        _t7 += ((_453 * _459) * vec4(vec3(mix(1.0 - u_fallOff, 1.0 + u_fallOff, _341)), 1.0));
        _t8 += _459;
        _t9 += (_453 * _t25);
        _t10 += vec4(_t25);
    }
    vec4 _489 = _t7;
    vec4 _490 = _489 / _t8;
    _t7 = _490;
    vec4 _492 = _t9;
    vec4 _493 = _492 / _t10;
    _t9 = _493;
    gl_FragData[0] = vec4(mix(_493, _490, vec4(u_weight)));
}
`;