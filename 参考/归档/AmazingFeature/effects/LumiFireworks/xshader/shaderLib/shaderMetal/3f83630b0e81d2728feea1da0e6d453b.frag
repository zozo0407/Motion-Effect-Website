#include <metal_stdlib>
#include <simd/simd.h>

using namespace metal;

struct buffer_t
{
    float4 u_ScreenParams;
    float u_bloomRadius;
    float u_bloomSamples;
    float u_bloomGlow;
    float u_bloomBase;
    float u_vignetteIntensity;
    float u_filterSize;
};

struct main0_out
{
    float4 o_fragColor [[color(0)]];
};

struct main0_in
{
    float2 v_uv [[user(locn0)]];
};

fragment main0_out main0(main0_in in [[stage_in]], constant buffer_t& buffer, texture2d<float> u_inputTexture [[texture(0)]], texture2d<float> u_originalTexture [[texture(1)]], sampler u_inputTextureSmplr [[sampler(0)]], sampler u_originalTextureSmplr [[sampler(1)]])
{
    main0_out out = {};
    float2 _23 = float2(1.0) / buffer.u_ScreenParams.xy;
    float4 _t3 = float4(0.0);
    float2 _t4 = float2(buffer.u_bloomRadius, 0.0) * rsqrt(buffer.u_bloomSamples);
    for (float _t5 = 0.0; _t5 < buffer.u_bloomSamples; _t5 += 1.0)
    {
        float2 _55 = _t4;
        float2 _56 = _55 * float2x2(float2(-0.737399995326995849609375, -0.675499975681304931640625), float2(0.675499975681304931640625, -0.737399995326995849609375));
        _t4 = _56;
        _t3 += (u_inputTexture.sample(u_inputTextureSmplr, (in.v_uv + ((_56 * sqrt(_t5)) * _23))) * (1.0 - (_t5 / buffer.u_bloomSamples)));
    }
    float4 _90 = _t3;
    float4 _99 = (_90 * (buffer.u_bloomGlow / buffer.u_bloomSamples)) + (u_inputTexture.sample(u_inputTextureSmplr, in.v_uv) * buffer.u_bloomBase);
    _t3 = _99;
    float2 _105 = (in.v_uv * 2.0) - float2(1.0);
    float2 _t10 = fast::max(float2(1.0) - (_105 * _105), float2(0.0));
    float3 _130 = _99.xyz * pow(_t10.x * _t10.y, buffer.u_vignetteIntensity);
    _t3.x = _130.x;
    _t3.y = _130.y;
    _t3.z = _130.z;
    float4 _144 = _t3;
    float4 _148 = mix(u_originalTexture.sample(u_originalTextureSmplr, in.v_uv), _144, float4(buffer.u_filterSize));
    _t3 = _148;
    out.o_fragColor = _148;
    return out;
}

