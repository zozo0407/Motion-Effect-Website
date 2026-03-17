#include <metal_stdlib>
#include <simd/simd.h>

using namespace metal;

struct buffer_t
{
    float2 uvScale;
    float2 uvOffset;
    float mixProgress;
};

struct main0_out
{
    float4 gl_FragColor [[color(0)]];
};

struct main0_in
{
    float2 vUv [[user(vUv)]];
};

fragment main0_out main0(main0_in in [[stage_in]], constant buffer_t& buffer, texture2d<float> mapA [[texture(0)]], texture2d<float> mapB [[texture(1)]], sampler mapASmplr [[sampler(0)]], sampler mapBSmplr [[sampler(1)]])
{
    main0_out out = {};
    float2 uvp = (in.vUv * buffer.uvScale) + buffer.uvOffset;
    float4 colorA = mapA.sample(mapASmplr, uvp);
    float4 colorB = mapB.sample(mapBSmplr, uvp);
    out.gl_FragColor = mix(colorA, colorB, float4(buffer.mixProgress));
    return out;
}

