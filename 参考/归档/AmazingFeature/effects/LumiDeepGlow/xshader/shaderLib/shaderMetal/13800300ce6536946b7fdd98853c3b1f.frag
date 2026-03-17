#pragma clang diagnostic ignored "-Wmissing-prototypes"

#include <metal_stdlib>
#include <simd/simd.h>

using namespace metal;

struct buffer_t
{
    int u_ca;
    float u_redOffset;
    float u_greenOffset;
    float u_blueOffset;
    float u_threshold;
    float u_thresholdSmooth;
    int u_view;
    int u_gamma;
    float u_gammaValue;
    float u_greyScale;
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
float _f0(thread const float3& _p0)
{
    return dot(_p0, float3(0.2125999927520751953125, 0.715200006961822509765625, 0.072200000286102294921875));
}

fragment main0_out main0(main0_in in [[stage_in]], constant buffer_t& buffer, texture2d<float> u_inputTex [[texture(0)]], sampler u_inputTexSmplr [[sampler(0)]])
{
    main0_out out = {};
    float4 _t0 = u_inputTex.sample(u_inputTexSmplr, in.v_uv);
    if (buffer.u_ca == 1)
    {
        float4 _t1 = u_inputTex.sample(u_inputTexSmplr, (in.v_uv + float2(-buffer.u_redOffset, buffer.u_redOffset))).yzwx;
        float _60 = _t1.w;
        float _63 = _t1.x;
        float _64 = _63 * _60;
        _t1.x = _64;
        _t1 = u_inputTex.sample(u_inputTexSmplr, (in.v_uv + float2(-buffer.u_greenOffset, buffer.u_greenOffset))).yzwx;
        float _78 = _t1.w;
        float _81 = _t1.y;
        float _82 = _81 * _78;
        _t1.y = _82;
        _t1 = u_inputTex.sample(u_inputTexSmplr, (in.v_uv + float2(-buffer.u_blueOffset, buffer.u_blueOffset))).yzwx;
        float _96 = _t1.w;
        float _99 = _t1.z;
        float _100 = _99 * _96;
        _t1.z = _100;
        _t0 = float4(_64, _82, _100, 1.0);
    }
    if (_t0.x < buffer.u_threshold)
    {
        _t0.x = ((_t0.x / buffer.u_threshold) * _t0.x) * buffer.u_thresholdSmooth;
    }
    if (_t0.y < buffer.u_threshold)
    {
        _t0.y = ((_t0.y / buffer.u_threshold) * _t0.y) * buffer.u_thresholdSmooth;
    }
    if (_t0.z < buffer.u_threshold)
    {
        _t0.z = ((_t0.z / buffer.u_threshold) * _t0.z) * buffer.u_thresholdSmooth;
    }
    if (buffer.u_view == 1)
    {
        if (buffer.u_gamma == 1)
        {
            _t0 = pow(_t0, float4(buffer.u_gammaValue));
        }
    }
    float3 param = _t0.xyz;
    float4 _182 = _t0;
    float3 _189 = mix(_182.xyz, float3(_f0(param)), float3(buffer.u_greyScale));
    _t0.x = _189.x;
    _t0.y = _189.y;
    _t0.z = _189.z;
    out.o_fragColor = _t0;
    return out;
}

