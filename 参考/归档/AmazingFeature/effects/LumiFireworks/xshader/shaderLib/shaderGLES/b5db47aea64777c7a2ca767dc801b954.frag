precision highp float;
precision highp int;

uniform vec4 u_ScreenParams;
uniform mediump sampler2D u_inputTexture;
uniform float u_bloomThreshold;
uniform float u_bloomSoftKnee;
uniform float u_bloomRadius;
uniform float u_bloomGlow;
uniform float u_bloomBase;

varying vec2 v_uv;

float _f1(vec3 _p0)
{
    return dot(_p0, vec3(0.2125999927520751953125, 0.715200006961822509765625, 0.072200000286102294921875));
}

float _f0(float _p0, float _p1)
{
    return (0.3989399969577789306640625 * exp((((-0.5) * _p0) * _p0) / (_p1 * _p1))) / _p1;
}

vec3 _f3(mediump sampler2D _p0, vec2 _p1, vec2 _p2, float _p3, vec2 _p4)
{
    vec2 _72 = vec2(1.0) / _p2;
    float param = 0.0;
    float param_1 = _p3;
    float _80 = _f0(param, param_1);
    float _t3 = _80;
    vec3 _t4 = texture2D(_p0, _p1).xyz * _80;
    for (mediump int _t6 = 1; _t6 < 12; _t6++)
    {
        mediump float _106 = float(_t6);
        float param_2 = _106;
        float param_3 = _p3;
        float _112 = _f0(param_2, param_3);
        vec2 _118 = (_p4 * _72) * _106;
        _t4 += ((texture2D(_p0, _p1 + _118).xyz + texture2D(_p0, _p1 - _118).xyz) * _112);
        _t3 += (2.0 * _112);
    }
    return _t4 / vec3(_t3);
}

float _f2(float _p0, float _p1)
{
    return mix(_p0, 1.2000000476837158203125 - _p0, _p1);
}

void main()
{
    vec3 _171 = texture2D(u_inputTexture, v_uv).xyz;
    vec3 param = _171;
    float _172 = _f1(param);
    float _183 = _172 - u_bloomThreshold;
    float _187 = u_bloomSoftKnee * 2.0;
    float _200 = (clamp(_183 + u_bloomSoftKnee, 0.0, _187) / _187) * u_bloomThreshold;
    vec2 _222 = vec2(1.0) / u_ScreenParams.xy;
    float param_1 = 0.0;
    float param_2 = u_bloomRadius;
    float _227 = _f0(param_1, param_2);
    float _t24 = _227;
    vec3 _t25 = vec4(_171 * (max(_183 + _200, 0.0) / max(_172, 9.9999997473787516355514526367188e-05)), 1.0).xyz * _227;
    for (mediump int _t27 = 1; _t27 < 12; _t27++)
    {
        mediump float _245 = float(_t27);
        float param_3 = _245;
        float param_4 = u_bloomRadius;
        float _251 = _f0(param_3, param_4);
        vec2 _256 = vec2(_245, 0.0) * _222;
        vec3 _272 = texture2D(u_inputTexture, v_uv + _256).xyz;
        vec3 param_5 = _272;
        float _273 = _f1(param_5);
        vec3 _289 = texture2D(u_inputTexture, v_uv - _256).xyz;
        vec3 param_6 = _289;
        float _290 = _f1(param_6);
        _t25 += (((_272 * (max((_273 - u_bloomThreshold) + _200, 0.0) / max(_273, 9.9999997473787516355514526367188e-05))) + (_289 * (max((_290 - u_bloomThreshold) + _200, 0.0) / max(_290, 9.9999997473787516355514526367188e-05)))) * _251);
        _t24 += (2.0 * _251);
    }
    float _324 = _t24;
    float param_7 = 0.0;
    float param_8 = u_bloomRadius;
    float _330 = _f0(param_7, param_8);
    _t24 = _330;
    vec3 _t38 = (_t25 / vec3(_324)) * _330;
    for (mediump int _t39 = 1; _t39 < 12; _t39++)
    {
        mediump float _346 = float(_t39);
        float param_9 = _346;
        float param_10 = u_bloomRadius;
        float _352 = _f0(param_9, param_10);
        vec2 _357 = vec2(0.0, _346) * _222;
        vec2 param_11 = v_uv + _357;
        vec2 param_12 = u_ScreenParams.xy;
        float param_13 = u_bloomRadius;
        vec2 param_14 = vec2(1.0, 0.0);
        vec2 param_15 = v_uv - _357;
        vec2 param_16 = u_ScreenParams.xy;
        float param_17 = u_bloomRadius;
        vec2 param_18 = vec2(1.0, 0.0);
        _t38 += ((_f3(u_inputTexture, param_11, param_12, param_13, param_14) + _f3(u_inputTexture, param_15, param_16, param_17, param_18)) * _352);
        _t24 += (2.0 * _352);
    }
    vec3 _398 = _t38 / vec3(_t24);
    gl_FragData[0] = vec4(((((((vec3(0.0) + ((vec3(1.0) * _f2(1.0, u_bloomRadius)) * _398)) + (((vec3(1.0) * _f2(0.800000011920928955078125, u_bloomRadius)) * _398) * 0.800000011920928955078125)) + (((vec3(1.0) * _f2(0.60000002384185791015625, u_bloomRadius)) * _398) * 0.60000002384185791015625)) + (((vec3(1.0) * _f2(0.4000000059604644775390625, u_bloomRadius)) * _398) * 0.4000000059604644775390625)) + (((vec3(1.0) * _f2(0.20000000298023223876953125, u_bloomRadius)) * _398) * 0.20000000298023223876953125)) * u_bloomGlow) + (_171 * u_bloomBase), 1.0);
}

