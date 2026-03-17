#pragma clang diagnostic ignored "-Wmissing-prototypes"
#pragma clang diagnostic ignored "-Wmissing-braces"

#include <metal_stdlib>
#include <simd/simd.h>

using namespace metal;

template<typename T, size_t Num>
struct spvUnsafeArray
{
    T elements[Num ? Num : 1];
    
    thread T& operator [] (size_t pos) thread
    {
        return elements[pos];
    }
    constexpr const thread T& operator [] (size_t pos) const thread
    {
        return elements[pos];
    }
    
    device T& operator [] (size_t pos) device
    {
        return elements[pos];
    }
    constexpr const device T& operator [] (size_t pos) const device
    {
        return elements[pos];
    }
    
    constexpr const constant T& operator [] (size_t pos) const constant
    {
        return elements[pos];
    }
    
    threadgroup T& operator [] (size_t pos) threadgroup
    {
        return elements[pos];
    }
    constexpr const threadgroup T& operator [] (size_t pos) const threadgroup
    {
        return elements[pos];
    }
};

// Implementation of the GLSL mod() function, which is slightly different than Metal fmod()
template<typename Tx, typename Ty>
inline Tx mod(Tx x, Ty y)
{
    return x - y * floor(x / y);
}

struct buffer_t
{
    float4 u_ScreenParams;
    int uFireworksCount;
    spvUnsafeArray<float, 3> uFireworkTime;
    spvUnsafeArray<float, 3> uFireworkCenterX;
    spvUnsafeArray<float, 3> uFireworkCenterY;
    float uUseParticleTex;
    float uLaunchDuration;
    float uExplosionDuration;
    spvUnsafeArray<float, 3> uFireworkScale;
    float uGlobalTintR;
    float uGlobalTintG;
    float uGlobalTintB;
    spvUnsafeArray<float, 3> uFireworkTextureGroup;
    spvUnsafeArray<float, 3> uFireworkColorInnerR;
    spvUnsafeArray<float, 3> uFireworkColorInnerG;
    spvUnsafeArray<float, 3> uFireworkColorInnerB;
    spvUnsafeArray<float, 3> uFireworkColorOuterR;
    spvUnsafeArray<float, 3> uFireworkColorOuterG;
    spvUnsafeArray<float, 3> uFireworkColorOuterB;
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
    float4 _73 = _p1;
    float3 _75 = _73.xyz + (_p0.xyz * _p0.w);
    _p1.x = _75.x;
    _p1.y = _75.y;
    _p1.z = _75.z;
    _p1.w = fast::max(_p1.w, _p0.w);
    return _p1;
}

static inline __attribute__((always_inline))
void _f1(thread const int& _p0, thread const float& _p1, thread const float& _p2, thread const float3& _p3, thread const float& _p4, thread const float& _p5, thread const float& _p6, thread const float& _p7, thread const float& _p8, thread const float2& _p9, thread const float2& _p10, thread const float& _p11, thread const float& _p12, thread float4& _p13, texture2d<float> u_particleTexture_4_1, sampler u_particleTexture_4_1Smplr, texture2d<float> u_particleTexture_4_2, sampler u_particleTexture_4_2Smplr, texture2d<float> u_particleTexture_2_1, sampler u_particleTexture_2_1Smplr, texture2d<float> u_particleTexture_2_2, sampler u_particleTexture_2_2Smplr, texture2d<float> u_particleTexture_3_1, sampler u_particleTexture_3_1Smplr, texture2d<float> u_particleTexture_3_2, sampler u_particleTexture_3_2Smplr)
{
    float _98 = cos(_p6);
    float _101 = sin(_p6);
    float4 _t15;
    float4 _270;
    float4 _290;
    float4 _305;
    for (int _t3 = 0; _t3 < _p0; _t3++)
    {
        float _120 = (float(_t3) / float(_p0)) * 6.283185482025146484375;
        float2 _126 = float2(cos(_120), sin(_120));
        float2 _t6 = (_126 * _p1) * _p5;
        _t6 = float2((_98 * _t6.x) - (_101 * _t6.y), (_101 * _t6.x) + (_98 * _t6.y)) + (((_126 * _p7) * 0.02999999932944774627685546875) * _p8);
        _t6.y -= (((_p7 * _p7) * 0.0500000007450580596923828125) * _p8);
        float2 _173 = _t6;
        float2 _174 = _173 + _p9;
        _t6 = _174;
        float2 _t7 = _p10 - _174;
        float _184 = (_120 + _p6) - 1.57079601287841796875;
        float _187 = cos(_184);
        float _190 = sin(_184);
        float2 _211 = float2((_187 * _t7.x) + (_190 * _t7.y), ((-_190) * _t7.x) + (_187 * _t7.y));
        if (_p11 > 0.5)
        {
            float2 _t12 = (_211 / float2(_p2)) + float2(0.5);
            bool _227 = _t12.x >= 0.0;
            bool _234;
            if (_227)
            {
                _234 = _t12.x <= 1.0;
            }
            else
            {
                _234 = _227;
            }
            bool _240;
            if (_234)
            {
                _240 = _t12.y >= 0.0;
            }
            else
            {
                _240 = _234;
            }
            bool _246;
            if (_240)
            {
                _246 = _t12.y <= 1.0;
            }
            else
            {
                _246 = _240;
            }
            if (_246)
            {
                float2 _255 = float2(_t12.x, 1.0 - _t12.y);
                bool _262 = mod(float(_t3), 2.0) == 0.0;
                if (_p12 < 1.5)
                {
                    if (_262)
                    {
                        _270 = u_particleTexture_4_1.sample(u_particleTexture_4_1Smplr, _255);
                    }
                    else
                    {
                        _270 = u_particleTexture_4_2.sample(u_particleTexture_4_2Smplr, _255);
                    }
                    _t15 = _270;
                }
                else
                {
                    if (_p12 < 2.5)
                    {
                        if (_262)
                        {
                            _290 = u_particleTexture_2_1.sample(u_particleTexture_2_1Smplr, _255);
                        }
                        else
                        {
                            _290 = u_particleTexture_2_2.sample(u_particleTexture_2_2Smplr, _255);
                        }
                        _t15 = _290;
                    }
                    else
                    {
                        if (_262)
                        {
                            _305 = u_particleTexture_3_1.sample(u_particleTexture_3_1Smplr, _255);
                        }
                        else
                        {
                            _305 = u_particleTexture_3_2.sample(u_particleTexture_3_2Smplr, _255);
                        }
                        _t15 = _305;
                    }
                }
                float4 param = float4(_p3 * _t15.xyz, _t15.w * _p4);
                float4 param_1 = _p13;
                float4 _335 = _f0(param, param_1);
                _p13 = _335;
            }
        }
        else
        {
            float4 param_2 = float4(_p3, smoothstep(_p2 * 0.5, 0.0, length(_211)) * _p4);
            float4 param_3 = _p13;
            float4 _358 = _f0(param_2, param_3);
            _p13 = _358;
        }
    }
}

static inline __attribute__((always_inline))
void _f2(thread const float2& _p0, thread const float2& _p1, thread const float2& _p2, thread const float2& _p3, thread const float& _p4, thread const float& _p5, thread const float& _p6, thread const float& _p7, thread const float& _p8, thread const float& _p9, thread const float& _p10, thread const float& _p11, texture2d<float> _p12, sampler _p12Smplr, texture2d<float> _p13, sampler _p13Smplr, texture2d<float> _p14, sampler _p14Smplr, texture2d<float> _p15, sampler _p15Smplr, texture2d<float> _p16, sampler _p16Smplr, texture2d<float> _p17, sampler _p17Smplr, thread const float& _p18, thread const float3& _p19, thread const float3& _p20, thread float4& _p21, texture2d<float> u_particleTexture_4_1, sampler u_particleTexture_4_1Smplr, texture2d<float> u_particleTexture_4_2, sampler u_particleTexture_4_2Smplr, texture2d<float> u_particleTexture_2_1, sampler u_particleTexture_2_1Smplr, texture2d<float> u_particleTexture_2_2, sampler u_particleTexture_2_2Smplr, texture2d<float> u_particleTexture_3_1, sampler u_particleTexture_3_1Smplr, texture2d<float> u_particleTexture_3_2, sampler u_particleTexture_3_2Smplr)
{
    if ((_p5 >= (_p6 + _p7)) || (_p5 < 0.0))
    {
        _p21 = float4(0.0);
        return;
    }
    float _379 = fast::max(0.001000000047497451305389404296875, _p8);
    _p21 = float4(0.0);
    if (_p5 < _p6)
    {
    }
    else
    {
        float _389 = _p5 - _p6;
        float _404 = smoothstep(0.0, _p7 * 0.14285714924335479736328125, _389);
        float _416 = smoothstep(_p7 * 0.085714288055896759033203125, _p7 * 0.2857142984867095947265625, _389);
        float _419 = _389 * 0.0500000007450580596923828125;
        float _427 = smoothstep(0.0, _p7 * 0.02857142873108386993408203125, _389);
        int param = 36;
        float param_1 = 0.122000001370906829833984375 * _379;
        float param_2 = 0.0280000008642673492431640625 * _379;
        float3 param_3 = _p19;
        float param_4 = _427 * pow(1.0 - smoothstep((_p7 * 0.550000011920928955078125) / 3.5, (_p7 * 0.75) / 3.5, _389), 1.25);
        float param_5 = _404;
        float param_6 = _419;
        float param_7 = _416;
        float param_8 = _379;
        float2 param_9 = _p3;
        float2 param_10 = _p1;
        float param_11 = _p4;
        float param_12 = _p18;
        float4 param_13 = _p21;
        _f1(param, param_1, param_2, param_3, param_4, param_5, param_6, param_7, param_8, param_9, param_10, param_11, param_12, param_13, u_particleTexture_4_1, u_particleTexture_4_1Smplr, u_particleTexture_4_2, u_particleTexture_4_2Smplr, u_particleTexture_2_1, u_particleTexture_2_1Smplr, u_particleTexture_2_2, u_particleTexture_2_2Smplr, u_particleTexture_3_1, u_particleTexture_3_1Smplr, u_particleTexture_3_2, u_particleTexture_3_2Smplr);
        _p21 = param_13;
        int param_14 = 18;
        float param_15 = 0.17499999701976776123046875 * _379;
        float param_16 = 0.0599999986588954925537109375 * _379;
        float3 param_17 = mix(_p19, _p20, float3(0.4000000059604644775390625));
        float param_18 = _427 * pow(1.0 - smoothstep((_p7 * 0.60000002384185791015625) / 3.5, (_p7 * 0.800000011920928955078125) / 3.5, _389), 1.25);
        float param_19 = _404;
        float param_20 = _419;
        float param_21 = _416;
        float param_22 = _379;
        float2 param_23 = _p3;
        float2 param_24 = _p1;
        float param_25 = _p4;
        float param_26 = _p18;
        float4 param_27 = _p21;
        _f1(param_14, param_15, param_16, param_17, param_18, param_19, param_20, param_21, param_22, param_23, param_24, param_25, param_26, param_27, u_particleTexture_4_1, u_particleTexture_4_1Smplr, u_particleTexture_4_2, u_particleTexture_4_2Smplr, u_particleTexture_2_1, u_particleTexture_2_1Smplr, u_particleTexture_2_2, u_particleTexture_2_2Smplr, u_particleTexture_3_1, u_particleTexture_3_1Smplr, u_particleTexture_3_2, u_particleTexture_3_2Smplr);
        _p21 = param_27;
    }
    float4 _535 = _p21;
    float3 _537 = _535.xyz * float3(_p9, _p10, _p11);
    _p21.x = _537.x;
    _p21.y = _537.y;
    _p21.z = _537.z;
}

fragment main0_out main0(main0_in in [[stage_in]], constant buffer_t& buffer, texture2d<float> u_particleTexture_4_1 [[texture(0)]], texture2d<float> u_particleTexture_4_2 [[texture(1)]], texture2d<float> u_particleTexture_2_1 [[texture(2)]], texture2d<float> u_particleTexture_2_2 [[texture(3)]], texture2d<float> u_particleTexture_3_1 [[texture(4)]], texture2d<float> u_particleTexture_3_2 [[texture(5)]], texture2d<float> u_particleTexture_1_1 [[texture(6)]], texture2d<float> u_particleTexture_1_2 [[texture(7)]], texture2d<float> preFirework [[texture(8)]], sampler u_particleTexture_4_1Smplr [[sampler(0)]], sampler u_particleTexture_4_2Smplr [[sampler(1)]], sampler u_particleTexture_2_1Smplr [[sampler(2)]], sampler u_particleTexture_2_2Smplr [[sampler(3)]], sampler u_particleTexture_3_1Smplr [[sampler(4)]], sampler u_particleTexture_3_2Smplr [[sampler(5)]], sampler u_particleTexture_1_1Smplr [[sampler(6)]], sampler u_particleTexture_1_2Smplr [[sampler(7)]], sampler preFireworkSmplr [[sampler(8)]])
{
    main0_out out = {};
    float _552 = buffer.u_ScreenParams.x / buffer.u_ScreenParams.y;
    float2 _563 = float2(in.v_uv.x * _552, in.v_uv.y);
    float4 _t31 = float4(0.0);
    bool _568 = buffer.uFireworksCount > 0;
    bool _577;
    if (_568)
    {
        _577 = buffer.uFireworkTime[0] >= 0.0;
    }
    else
    {
        _577 = _568;
    }
    if (_577)
    {
        float2 _587 = float2(buffer.uFireworkCenterX[0], buffer.uFireworkCenterY[0]);
        float2 _t32 = _587;
        float2 param = in.v_uv;
        float2 param_1 = _563;
        float2 param_2 = _587;
        float2 param_3 = float2(_t32.x * _552, _t32.y);
        float param_4 = buffer.uUseParticleTex;
        float param_5 = buffer.uFireworkTime[0];
        float param_6 = buffer.uLaunchDuration;
        float param_7 = buffer.uExplosionDuration;
        float param_8 = buffer.uFireworkScale[0];
        float param_9 = buffer.uGlobalTintR;
        float param_10 = buffer.uGlobalTintG;
        float param_11 = buffer.uGlobalTintB;
        float param_12 = buffer.uFireworkTextureGroup[0];
        float3 param_13 = float3(buffer.uFireworkColorInnerR[0], buffer.uFireworkColorInnerG[0], buffer.uFireworkColorInnerB[0]);
        float3 param_14 = float3(buffer.uFireworkColorOuterR[0], buffer.uFireworkColorOuterG[0], buffer.uFireworkColorOuterB[0]);
        float4 param_15;
        _f2(param, param_1, param_2, param_3, param_4, param_5, param_6, param_7, param_8, param_9, param_10, param_11, u_particleTexture_1_1, u_particleTexture_1_1Smplr, u_particleTexture_1_2, u_particleTexture_1_2Smplr, u_particleTexture_2_1, u_particleTexture_2_1Smplr, u_particleTexture_2_2, u_particleTexture_2_2Smplr, u_particleTexture_3_1, u_particleTexture_3_1Smplr, u_particleTexture_3_2, u_particleTexture_3_2Smplr, param_12, param_13, param_14, param_15, u_particleTexture_4_1, u_particleTexture_4_1Smplr, u_particleTexture_4_2, u_particleTexture_4_2Smplr, u_particleTexture_2_1, u_particleTexture_2_1Smplr, u_particleTexture_2_2, u_particleTexture_2_2Smplr, u_particleTexture_3_1, u_particleTexture_3_1Smplr, u_particleTexture_3_2, u_particleTexture_3_2Smplr);
        float4 param_16 = param_15;
        float4 param_17 = _t31;
        float4 _663 = _f0(param_16, param_17);
        _t31 = _663;
    }
    bool _665 = buffer.uFireworksCount > 1;
    bool _671;
    if (_665)
    {
        _671 = buffer.uFireworkTime[1] >= 0.0;
    }
    else
    {
        _671 = _665;
    }
    if (_671)
    {
        float2 _679 = float2(buffer.uFireworkCenterX[1], buffer.uFireworkCenterY[1]);
        float2 _t34 = _679;
        float2 param_18 = in.v_uv;
        float2 param_19 = _563;
        float2 param_20 = _679;
        float2 param_21 = float2(_t34.x * _552, _t34.y);
        float param_22 = buffer.uUseParticleTex;
        float param_23 = buffer.uFireworkTime[1];
        float param_24 = buffer.uLaunchDuration;
        float param_25 = buffer.uExplosionDuration;
        float param_26 = buffer.uFireworkScale[1];
        float param_27 = buffer.uGlobalTintR;
        float param_28 = buffer.uGlobalTintG;
        float param_29 = buffer.uGlobalTintB;
        float param_30 = buffer.uFireworkTextureGroup[1];
        float3 param_31 = float3(buffer.uFireworkColorInnerR[1], buffer.uFireworkColorInnerG[1], buffer.uFireworkColorInnerB[1]);
        float3 param_32 = float3(buffer.uFireworkColorOuterR[1], buffer.uFireworkColorOuterG[1], buffer.uFireworkColorOuterB[1]);
        float4 param_33;
        _f2(param_18, param_19, param_20, param_21, param_22, param_23, param_24, param_25, param_26, param_27, param_28, param_29, u_particleTexture_1_1, u_particleTexture_1_1Smplr, u_particleTexture_1_2, u_particleTexture_1_2Smplr, u_particleTexture_2_1, u_particleTexture_2_1Smplr, u_particleTexture_2_2, u_particleTexture_2_2Smplr, u_particleTexture_3_1, u_particleTexture_3_1Smplr, u_particleTexture_3_2, u_particleTexture_3_2Smplr, param_30, param_31, param_32, param_33, u_particleTexture_4_1, u_particleTexture_4_1Smplr, u_particleTexture_4_2, u_particleTexture_4_2Smplr, u_particleTexture_2_1, u_particleTexture_2_1Smplr, u_particleTexture_2_2, u_particleTexture_2_2Smplr, u_particleTexture_3_1, u_particleTexture_3_1Smplr, u_particleTexture_3_2, u_particleTexture_3_2Smplr);
        float4 param_34 = param_33;
        float4 param_35 = _t31;
        float4 _739 = _f0(param_34, param_35);
        _t31 = _739;
    }
    bool _742 = buffer.uFireworksCount > 2;
    bool _748;
    if (_742)
    {
        _748 = buffer.uFireworkTime[2] >= 0.0;
    }
    else
    {
        _748 = _742;
    }
    if (_748)
    {
        float2 _756 = float2(buffer.uFireworkCenterX[2], buffer.uFireworkCenterY[2]);
        float2 _t36 = _756;
        float2 param_36 = in.v_uv;
        float2 param_37 = _563;
        float2 param_38 = _756;
        float2 param_39 = float2(_t36.x * _552, _t36.y);
        float param_40 = buffer.uUseParticleTex;
        float param_41 = buffer.uFireworkTime[2];
        float param_42 = buffer.uLaunchDuration;
        float param_43 = buffer.uExplosionDuration;
        float param_44 = buffer.uFireworkScale[2];
        float param_45 = buffer.uGlobalTintR;
        float param_46 = buffer.uGlobalTintG;
        float param_47 = buffer.uGlobalTintB;
        float param_48 = buffer.uFireworkTextureGroup[2];
        float3 param_49 = float3(buffer.uFireworkColorInnerR[2], buffer.uFireworkColorInnerG[2], buffer.uFireworkColorInnerB[2]);
        float3 param_50 = float3(buffer.uFireworkColorOuterR[2], buffer.uFireworkColorOuterG[2], buffer.uFireworkColorOuterB[2]);
        float4 param_51;
        _f2(param_36, param_37, param_38, param_39, param_40, param_41, param_42, param_43, param_44, param_45, param_46, param_47, u_particleTexture_1_1, u_particleTexture_1_1Smplr, u_particleTexture_1_2, u_particleTexture_1_2Smplr, u_particleTexture_2_1, u_particleTexture_2_1Smplr, u_particleTexture_2_2, u_particleTexture_2_2Smplr, u_particleTexture_3_1, u_particleTexture_3_1Smplr, u_particleTexture_3_2, u_particleTexture_3_2Smplr, param_48, param_49, param_50, param_51, u_particleTexture_4_1, u_particleTexture_4_1Smplr, u_particleTexture_4_2, u_particleTexture_4_2Smplr, u_particleTexture_2_1, u_particleTexture_2_1Smplr, u_particleTexture_2_2, u_particleTexture_2_2Smplr, u_particleTexture_3_1, u_particleTexture_3_1Smplr, u_particleTexture_3_2, u_particleTexture_3_2Smplr);
        float4 param_52 = param_51;
        float4 param_53 = _t31;
        float4 _816 = _f0(param_52, param_53);
        _t31 = _816;
    }
    float4 param_54 = preFirework.sample(preFireworkSmplr, in.v_uv);
    float4 param_55 = _t31;
    float4 _828 = _f0(param_54, param_55);
    out.o_fragColor = _828;
    return out;
}

