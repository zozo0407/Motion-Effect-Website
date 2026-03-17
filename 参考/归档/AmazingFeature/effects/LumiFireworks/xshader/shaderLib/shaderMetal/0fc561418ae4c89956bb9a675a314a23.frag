#pragma clang diagnostic ignored "-Wmissing-prototypes"

#include <metal_stdlib>
#include <simd/simd.h>

using namespace metal;

struct buffer_t
{
    float uGradientSpread;
    float uGradientContrast;
    float uGradientHeight;
    float uEndTime;
    float uStartTime;
    float uTime;
    float uDarkIns;
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
float4 _f0(thread const float4& _p0, thread float4& _p1)
{
    float4 _23 = _p1;
    float3 _25 = _23.xyz + (_p0.xyz * _p0.w);
    _p1.x = _25.x;
    _p1.y = _25.y;
    _p1.z = _25.z;
    _p1.w = fast::max(_p1.w, _p0.w);
    return _p1;
}

fragment main0_out main0(main0_in in [[stage_in]], constant buffer_t& buffer, texture2d<float> u_inputTexture [[texture(0)]], texture2d<float> u_originalTex [[texture(1)]], sampler u_inputTextureSmplr [[sampler(0)]], sampler u_originalTexSmplr [[sampler(1)]])
{
    main0_out out = {};
    float4 _54 = u_inputTexture.sample(u_inputTextureSmplr, in.v_uv);
    float4 _59 = u_originalTex.sample(u_originalTexSmplr, in.v_uv);
    float4 _t1 = _59;
    float _93 = fast::clamp((((1.0 - in.v_uv.y) - fast::clamp(buffer.uGradientHeight, 0.0, 1.0)) * ((buffer.uGradientSpread <= 0.0) ? 1.0 : buffer.uGradientSpread)) + 0.5, 0.0, 1.0);
    float _109 = fast::clamp(((((_93 * _93) * (3.0 - (2.0 * _93))) - 0.5) * ((buffer.uGradientContrast <= 0.0) ? 1.0 : buffer.uGradientContrast)) + 0.5, 0.0, 1.0);
    float _t7 = 1.0;
    float _124 = buffer.uEndTime - buffer.uStartTime;
    float _129 = buffer.uTime - buffer.uStartTime;
    float _135 = _124 - 0.5;
    if (_129 > _135)
    {
        _t7 = smoothstep(_124, _135, _129);
    }
    float4 param = (_54 * _t7) * smoothstep(0.0, 0.300000011920928955078125, _129);
    float4 param_1 = float4(_59.xyz * mix(float3(1.0), float4(float3((_109 * _109) * (3.0 - (2.0 * _109))), 1.0).xyz, float3(buffer.uDarkIns * _t7)), _t1.w);
    float4 _179 = _f0(param, param_1);
    out.o_fragColor = _179;
    return out;
}

