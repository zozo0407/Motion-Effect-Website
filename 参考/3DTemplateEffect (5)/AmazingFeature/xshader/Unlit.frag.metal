#include <metal_stdlib>
#include <simd/simd.h>

using namespace metal;

struct buffer_t
{
    float2 u_Repeat;
    float2 u_Offset;
    float4 u_AlbedoColor;
    float u_Translucency;
    float u_Opacity;
};

struct main0_out
{
    float4 gl_FragColor [[color(0)]];
};

struct main0_in
{
    float2 g_vary_uv0 [[user(g_vary_uv0)]];
};

fragment main0_out main0(main0_in in [[stage_in]], constant buffer_t& buffer, texture2d<float> u_AlbedoTexture [[texture(0)]], sampler u_AlbedoTextureSmplr [[sampler(0)]])
{
    main0_out out = {};
    float2 uv_1;
    uv_1.x = in.g_vary_uv0.x;
    uv_1.y = in.g_vary_uv0.y;
    float4 tmpvar_2 = u_AlbedoTexture.sample(u_AlbedoTextureSmplr, ((uv_1 * buffer.u_Repeat) + buffer.u_Offset));
    float3 tmpvar_3 = tmpvar_2.xyz * buffer.u_AlbedoColor.xyz;
    float tmpvar_4 = tmpvar_2.w * buffer.u_Translucency;
    float4 tmpvar_5;
    tmpvar_5.x = tmpvar_3.x;
    tmpvar_5.y = tmpvar_3.y;
    tmpvar_5.z = tmpvar_3.z;
    tmpvar_5.w = tmpvar_4;
    out.gl_FragColor = float4(tmpvar_5.xyz * buffer.u_Opacity, tmpvar_5.w * buffer.u_Opacity);
    return out;
}

