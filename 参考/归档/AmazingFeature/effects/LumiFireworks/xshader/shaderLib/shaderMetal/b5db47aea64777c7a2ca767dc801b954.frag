#pragma clang diagnostic ignored "-Wmissing-prototypes"

#include <metal_stdlib>
#include <simd/simd.h>

using namespace metal;

struct buffer_t
{
    float4 u_ScreenParams;
    float u_bloomThreshold;
    float u_bloomSoftKnee;
    float u_bloomRadius;
    float u_bloomGlow;
    float u_bloomBase;
};

struct main0_out
{
    float4 o_fragColor [[color(0)]];
};

struct main0_in
{
    float2 v_uv [[user(locn0)]];
};

static inline __attribute__((always_inline))
float _f1(thread const float3& _p0)
{
    return dot(_p0, float3(0.2125999927520751953125, 0.715200006961822509765625, 0.072200000286102294921875));
}

static inline __attribute__((always_inline))
float _f0(thread const float& _p0, thread const float& _p1)
{
    return (0.3989399969577789306640625 * exp((((-0.5) * _p0) * _p0) / (_p1 * _p1))) / _p1;
}

static inline __attribute__((always_inline))
float3 _f3(texture2d<float> _p0, sampler _p0Smplr, thread const float2& _p1, thread const float2& _p2, thread const float& _p3, thread const float2& _p4)
{
    float2 _72 = float2(1.0) / _p2;
    float param = 0.0;
    float param_1 = _p3;
    float _80 = _f0(param, param_1);
    float _t3 = _80;
    float3 _t4 = _p0.sample(_p0Smplr, _p1).xyz * _80;
    for (int _t6 = 1; _t6 < 12; _t6++)
    {
        float _106 = float(_t6);
        float param_2 = _106;
        float param_3 = _p3;
        float _112 = _f0(param_2, param_3);
        float2 _118 = (_p4 * _72) * _106;
        _t4 += ((_p0.sample(_p0Smplr, (_p1 + _118)).xyz + _p0.sample(_p0Smplr, (_p1 - _118)).xyz) * _112);
        _t3 += (2.0 * _112);
    }
    return _t4 / float3(_t3);
}

static inline __attribute__((always_inline))
float _f2(float _p0, float _p1)
{
    return mix(_p0, 1.2000000476837158203125 - _p0, _p1);
}

fragment main0_out main0(main0_in in [[stage_in]], constant buffer_t& buffer, texture2d<float> u_inputTexture [[texture(0)]], sampler u_inputTextureSmplr [[sampler(0)]])
{
    main0_out out = {};
    float3 _171 = u_inputTexture.sample(u_inputTextureSmplr, in.v_uv).xyz;
    float3 param = _171;
    float _172 = _f1(param);
    float _183 = _172 - buffer.u_bloomThreshold;
    float _187 = buffer.u_bloomSoftKnee * 2.0;
    float _200 = (fast::clamp(_183 + buffer.u_bloomSoftKnee, 0.0, _187) / _187) * buffer.u_bloomThreshold;
    float2 _222 = float2(1.0) / buffer.u_ScreenParams.xy;
    float param_1 = 0.0;
    float param_2 = buffer.u_bloomRadius;
    float _227 = _f0(param_1, param_2);
    float _t24 = _227;
    float3 _t25 = float4(_171 * (fast::max(_183 + _200, 0.0) / fast::max(_172, 9.9999997473787516355514526367188e-05)), 1.0).xyz * _227;
    for (int _t27 = 1; _t27 < 12; _t27++)
    {
        float _245 = float(_t27);
        float param_3 = _245;
        float param_4 = buffer.u_bloomRadius;
        float _251 = _f0(param_3, param_4);
        float2 _256 = float2(_245, 0.0) * _222;
        float3 _272 = u_inputTexture.sample(u_inputTextureSmplr, (in.v_uv + _256)).xyz;
        float3 param_5 = _272;
        float _273 = _f1(param_5);
        float3 _289 = u_inputTexture.sample(u_inputTextureSmplr, (in.v_uv - _256)).xyz;
        float3 param_6 = _289;
        float _290 = _f1(param_6);
        _t25 += (((_272 * (fast::max((_273 - buffer.u_bloomThreshold) + _200, 0.0) / fast::max(_273, 9.9999997473787516355514526367188e-05))) + (_289 * (fast::max((_290 - buffer.u_bloomThreshold) + _200, 0.0) / fast::max(_290, 9.9999997473787516355514526367188e-05)))) * _251);
        _t24 += (2.0 * _251);
    }
    float _324 = _t24;
    float param_7 = 0.0;
    float param_8 = buffer.u_bloomRadius;
    float _330 = _f0(param_7, param_8);
    _t24 = _330;
    float3 _t38 = (_t25 / float3(_324)) * _330;
    for (int _t39 = 1; _t39 < 12; _t39++)
    {
        float _346 = float(_t39);
        float param_9 = _346;
        float param_10 = buffer.u_bloomRadius;
        float _352 = _f0(param_9, param_10);
        float2 _357 = float2(0.0, _346) * _222;
        float2 param_11 = in.v_uv + _357;
        float2 param_12 = buffer.u_ScreenParams.xy;
        float param_13 = buffer.u_bloomRadius;
        float2 param_14 = float2(1.0, 0.0);
        float2 param_15 = in.v_uv - _357;
        float2 param_16 = buffer.u_ScreenParams.xy;
        float param_17 = buffer.u_bloomRadius;
        float2 param_18 = float2(1.0, 0.0);
        _t38 += ((_f3(u_inputTexture, u_inputTextureSmplr, param_11, param_12, param_13, param_14) + _f3(u_inputTexture, u_inputTextureSmplr, param_15, param_16, param_17, param_18)) * _352);
        _t24 += (2.0 * _352);
    }
    float3 _398 = _t38 / float3(_t24);
    out.o_fragColor = float4(((((((float3(0.0) + ((float3(1.0) * _f2(1.0, buffer.u_bloomRadius)) * _398)) + (((float3(1.0) * _f2(0.800000011920928955078125, buffer.u_bloomRadius)) * _398) * 0.800000011920928955078125)) + (((float3(1.0) * _f2(0.60000002384185791015625, buffer.u_bloomRadius)) * _398) * 0.60000002384185791015625)) + (((float3(1.0) * _f2(0.4000000059604644775390625, buffer.u_bloomRadius)) * _398) * 0.4000000059604644775390625)) + (((float3(1.0) * _f2(0.20000000298023223876953125, buffer.u_bloomRadius)) * _398) * 0.20000000298023223876953125)) * buffer.u_bloomGlow) + (_171 * buffer.u_bloomBase), 1.0);
    return out;
}

