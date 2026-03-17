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
float4 _f1(thread const float4& _p0, thread float4& _p1)
{
    float4 _84 = _p1;
    float3 _86 = _84.xyz + (_p0.xyz * _p0.w);
    _p1.x = _86.x;
    _p1.y = _86.y;
    _p1.z = _86.z;
    _p1.w = fast::max(_p1.w, _p0.w);
    return _p1;
}

static inline __attribute__((always_inline))
void _f2(thread const int& _p0, thread const float& _p1, thread const float& _p2, thread const float3& _p3, thread const float& _p4, thread const float& _p5, thread const float& _p6, thread const float& _p7, thread const float& _p8, thread const float2& _p9, thread const float2& _p10, thread const float& _p11, thread const float& _p12, thread float4& _p13, texture2d<float> u_particleTexture_4_1, sampler u_particleTexture_4_1Smplr, texture2d<float> u_particleTexture_4_2, sampler u_particleTexture_4_2Smplr, texture2d<float> u_particleTexture_2_1, sampler u_particleTexture_2_1Smplr, texture2d<float> u_particleTexture_2_2, sampler u_particleTexture_2_2Smplr, texture2d<float> u_particleTexture_3_1, sampler u_particleTexture_3_1Smplr, texture2d<float> u_particleTexture_3_2, sampler u_particleTexture_3_2Smplr)
{
    float _109 = cos(_p6);
    float _112 = sin(_p6);
    float4 _t15;
    float4 _281;
    float4 _301;
    float4 _316;
    for (int _t3 = 0; _t3 < _p0; _t3++)
    {
        float _131 = (float(_t3) / float(_p0)) * 6.283185482025146484375;
        float2 _137 = float2(cos(_131), sin(_131));
        float2 _t6 = (_137 * _p1) * _p5;
        _t6 = float2((_109 * _t6.x) - (_112 * _t6.y), (_112 * _t6.x) + (_109 * _t6.y)) + (((_137 * _p7) * 0.02999999932944774627685546875) * _p8);
        _t6.y -= (((_p7 * _p7) * 0.0500000007450580596923828125) * _p8);
        float2 _184 = _t6;
        float2 _185 = _184 + _p9;
        _t6 = _185;
        float2 _t7 = _p10 - _185;
        float _195 = (_131 + _p6) - 1.57079601287841796875;
        float _198 = cos(_195);
        float _201 = sin(_195);
        float2 _222 = float2((_198 * _t7.x) + (_201 * _t7.y), ((-_201) * _t7.x) + (_198 * _t7.y));
        if (_p11 > 0.5)
        {
            float2 _t12 = (_222 / float2(_p2)) + float2(0.5);
            bool _238 = _t12.x >= 0.0;
            bool _245;
            if (_238)
            {
                _245 = _t12.x <= 1.0;
            }
            else
            {
                _245 = _238;
            }
            bool _251;
            if (_245)
            {
                _251 = _t12.y >= 0.0;
            }
            else
            {
                _251 = _245;
            }
            bool _257;
            if (_251)
            {
                _257 = _t12.y <= 1.0;
            }
            else
            {
                _257 = _251;
            }
            if (_257)
            {
                float2 _266 = float2(_t12.x, 1.0 - _t12.y);
                bool _273 = mod(float(_t3), 2.0) == 0.0;
                if (_p12 < 1.5)
                {
                    if (_273)
                    {
                        _281 = u_particleTexture_4_1.sample(u_particleTexture_4_1Smplr, _266);
                    }
                    else
                    {
                        _281 = u_particleTexture_4_2.sample(u_particleTexture_4_2Smplr, _266);
                    }
                    _t15 = _281;
                }
                else
                {
                    if (_p12 < 2.5)
                    {
                        if (_273)
                        {
                            _301 = u_particleTexture_2_1.sample(u_particleTexture_2_1Smplr, _266);
                        }
                        else
                        {
                            _301 = u_particleTexture_2_2.sample(u_particleTexture_2_2Smplr, _266);
                        }
                        _t15 = _301;
                    }
                    else
                    {
                        if (_273)
                        {
                            _316 = u_particleTexture_3_1.sample(u_particleTexture_3_1Smplr, _266);
                        }
                        else
                        {
                            _316 = u_particleTexture_3_2.sample(u_particleTexture_3_2Smplr, _266);
                        }
                        _t15 = _316;
                    }
                }
                float4 param = float4(_p3 * _t15.xyz, _t15.w * _p4);
                float4 param_1 = _p13;
                float4 _346 = _f1(param, param_1);
                _p13 = _346;
            }
        }
        else
        {
            float4 param_2 = float4(_p3, smoothstep(_p2 * 0.5, 0.0, length(_222)) * _p4);
            float4 param_3 = _p13;
            float4 _369 = _f1(param_2, param_3);
            _p13 = _369;
        }
    }
}

static inline __attribute__((always_inline))
float _f0(thread const float& _p0)
{
    return fract(sin(_p0) * 43758.546875);
}

static inline __attribute__((always_inline))
void _f3(thread const float2& _p0, thread const float2& _p1, thread const float2& _p2, thread const float2& _p3, thread const float& _p4, thread const float& _p5, thread const float& _p6, thread const float& _p7, thread const float& _p8, thread const float& _p9, thread const float& _p10, thread const float& _p11, texture2d<float> _p12, sampler _p12Smplr, texture2d<float> _p13, sampler _p13Smplr, texture2d<float> _p14, sampler _p14Smplr, texture2d<float> _p15, sampler _p15Smplr, texture2d<float> _p16, sampler _p16Smplr, texture2d<float> _p17, sampler _p17Smplr, thread const float& _p18, thread const float3& _p19, thread const float3& _p20, thread float4& _p21, texture2d<float> u_particleTexture_4_1, sampler u_particleTexture_4_1Smplr, texture2d<float> u_particleTexture_4_2, sampler u_particleTexture_4_2Smplr, texture2d<float> u_particleTexture_2_1, sampler u_particleTexture_2_1Smplr, texture2d<float> u_particleTexture_2_2, sampler u_particleTexture_2_2Smplr, texture2d<float> u_particleTexture_3_1, sampler u_particleTexture_3_1Smplr, texture2d<float> u_particleTexture_3_2, sampler u_particleTexture_3_2Smplr)
{
    if ((_p5 >= (_p6 + _p7)) || (_p5 < 0.0))
    {
        _p21 = float4(0.0);
        return;
    }
    float _390 = fast::max(0.001000000047497451305389404296875, _p8);
    _p21 = float4(0.0);
    if (_p5 < _p6)
    {
    }
    else
    {
        float _400 = _p5 - _p6;
        float _406 = fast::clamp(_400 / fast::max(0.001000000047497451305389404296875, _p7), 0.0, 1.0);
        float _415 = smoothstep(0.0, _p7 * 0.14285714924335479736328125, _400);
        float _427 = smoothstep(_p7 * 0.085714288055896759033203125, _p7 * 0.2857142984867095947265625, _400);
        float _430 = _400 * 0.0500000007450580596923828125;
        float _438 = smoothstep(0.0, _p7 * 0.02857142873108386993408203125, _400);
        int param = 45;
        float param_1 = 0.231000006198883056640625 * _390;
        float param_2 = 0.039999999105930328369140625 * _390;
        float3 param_3 = mix(_p19, _p20, float3(0.699999988079071044921875));
        float param_4 = _438 * pow(1.0 - smoothstep((_p7 * 0.64999997615814208984375) / 3.5, (_p7 * 0.85000002384185791015625) / 3.5, _400), 1.25);
        float param_5 = _415;
        float param_6 = _430;
        float param_7 = _427;
        float param_8 = _390;
        float2 param_9 = _p3;
        float2 param_10 = _p1;
        float param_11 = _p4;
        float param_12 = _p18;
        float4 param_13 = _p21;
        _f2(param, param_1, param_2, param_3, param_4, param_5, param_6, param_7, param_8, param_9, param_10, param_11, param_12, param_13, u_particleTexture_4_1, u_particleTexture_4_1Smplr, u_particleTexture_4_2, u_particleTexture_4_2Smplr, u_particleTexture_2_1, u_particleTexture_2_1Smplr, u_particleTexture_2_2, u_particleTexture_2_2Smplr, u_particleTexture_3_1, u_particleTexture_3_1Smplr, u_particleTexture_3_2, u_particleTexture_3_2Smplr);
        _p21 = param_13;
        float _496 = 0.30099999904632568359375 * _390;
        int param_14 = 16;
        float param_15 = _496;
        float param_16 = 0.087999999523162841796875 * _390;
        float3 param_17 = _p20;
        float param_18 = _438 * pow(1.0 - smoothstep((_p7 * 0.699999988079071044921875) / 3.5, (_p7 * 1.0) / 3.5, _400), 1.25);
        float param_19 = _415;
        float param_20 = _430;
        float param_21 = _427;
        float param_22 = _390;
        float2 param_23 = _p3;
        float2 param_24 = _p1;
        float param_25 = _p4;
        float param_26 = _p18;
        float4 param_27 = _p21;
        _f2(param_14, param_15, param_16, param_17, param_18, param_19, param_20, param_21, param_22, param_23, param_24, param_25, param_26, param_27, u_particleTexture_4_1, u_particleTexture_4_1Smplr, u_particleTexture_4_2, u_particleTexture_4_2Smplr, u_particleTexture_2_1, u_particleTexture_2_1Smplr, u_particleTexture_2_2, u_particleTexture_2_2Smplr, u_particleTexture_3_1, u_particleTexture_3_1Smplr, u_particleTexture_3_2, u_particleTexture_3_2Smplr);
        _p21 = param_27;
        float _552 = _438 * (1.0 - smoothstep((_p7 * 0.699999988079071044921875) / 3.5, _p7 / 3.5, _400));
        for (int _t30 = 0; _t30 < 25; _t30++)
        {
            float _576 = ((float(_t30) * 13.13000011444091796875) + (_p2.x * 17.0)) + (_p2.y * 31.0);
            float param_28 = _576 + 1.0;
            float param_29 = _576 + 2.0;
            float param_30 = _576 + 3.0;
            float param_31 = _576 + 4.0;
            float _601 = _f0(param_29) * 6.283185482025146484375;
            float _605 = (_f0(param_30) * 2.0) - 1.0;
            float _612 = sqrt(fast::max(0.0, 1.0 - (_605 * _605)));
            float2 _622 = float2(cos(_601) * _612, sin(_601) * _612);
            float2 _t39 = ((_622 * (_496 * pow(_f0(param_28), 0.333000004291534423828125))) * _415) + (((_622 * _427) * 0.100000001490116119384765625) * _390);
            _t39.y -= (((_427 * _427) * 0.1599999964237213134765625) * _390);
            float2 _654 = _t39;
            float2 _655 = _654 + _p3;
            _t39 = _655;
            float4 param_32 = float4(_p19, ((1.0 - smoothstep(0.300000011920928955078125, 0.5, length(_p1 - _655) / fast::max(((0.0199999995529651641845703125 * _390) * (0.5 + (0.5 + (0.5 * sin((_406 * 52.700000762939453125) + (_f0(param_31) * 6.280000209808349609375)))))) * 0.699999988079071044921875, 9.9999997473787516355514526367188e-05))) * _552) * 0.800000011920928955078125);
            float4 param_33 = _p21;
            float4 _699 = _f1(param_32, param_33);
            _p21 = _699;
        }
    }
    float4 _706 = _p21;
    float3 _708 = _706.xyz * float3(_p9, _p10, _p11);
    _p21.x = _708.x;
    _p21.y = _708.y;
    _p21.z = _708.z;
}

fragment main0_out main0(main0_in in [[stage_in]], constant buffer_t& buffer, texture2d<float> u_particleTexture_4_1 [[texture(0)]], texture2d<float> u_particleTexture_4_2 [[texture(1)]], texture2d<float> u_particleTexture_2_1 [[texture(2)]], texture2d<float> u_particleTexture_2_2 [[texture(3)]], texture2d<float> u_particleTexture_3_1 [[texture(4)]], texture2d<float> u_particleTexture_3_2 [[texture(5)]], texture2d<float> u_particleTexture_1_1 [[texture(6)]], texture2d<float> u_particleTexture_1_2 [[texture(7)]], texture2d<float> preFirework [[texture(8)]], sampler u_particleTexture_4_1Smplr [[sampler(0)]], sampler u_particleTexture_4_2Smplr [[sampler(1)]], sampler u_particleTexture_2_1Smplr [[sampler(2)]], sampler u_particleTexture_2_2Smplr [[sampler(3)]], sampler u_particleTexture_3_1Smplr [[sampler(4)]], sampler u_particleTexture_3_2Smplr [[sampler(5)]], sampler u_particleTexture_1_1Smplr [[sampler(6)]], sampler u_particleTexture_1_2Smplr [[sampler(7)]], sampler preFireworkSmplr [[sampler(8)]])
{
    main0_out out = {};
    float _723 = buffer.u_ScreenParams.x / buffer.u_ScreenParams.y;
    float2 _734 = float2(in.v_uv.x * _723, in.v_uv.y);
    float4 _t45 = float4(0.0);
    bool _739 = buffer.uFireworksCount > 0;
    bool _748;
    if (_739)
    {
        _748 = buffer.uFireworkTime[0] >= 0.0;
    }
    else
    {
        _748 = _739;
    }
    if (_748)
    {
        float2 _758 = float2(buffer.uFireworkCenterX[0], buffer.uFireworkCenterY[0]);
        float2 _t46 = _758;
        float2 param = in.v_uv;
        float2 param_1 = _734;
        float2 param_2 = _758;
        float2 param_3 = float2(_t46.x * _723, _t46.y);
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
        _f3(param, param_1, param_2, param_3, param_4, param_5, param_6, param_7, param_8, param_9, param_10, param_11, u_particleTexture_1_1, u_particleTexture_1_1Smplr, u_particleTexture_1_2, u_particleTexture_1_2Smplr, u_particleTexture_2_1, u_particleTexture_2_1Smplr, u_particleTexture_2_2, u_particleTexture_2_2Smplr, u_particleTexture_3_1, u_particleTexture_3_1Smplr, u_particleTexture_3_2, u_particleTexture_3_2Smplr, param_12, param_13, param_14, param_15, u_particleTexture_4_1, u_particleTexture_4_1Smplr, u_particleTexture_4_2, u_particleTexture_4_2Smplr, u_particleTexture_2_1, u_particleTexture_2_1Smplr, u_particleTexture_2_2, u_particleTexture_2_2Smplr, u_particleTexture_3_1, u_particleTexture_3_1Smplr, u_particleTexture_3_2, u_particleTexture_3_2Smplr);
        float4 param_16 = param_15;
        float4 param_17 = _t45;
        float4 _834 = _f1(param_16, param_17);
        _t45 = _834;
    }
    bool _836 = buffer.uFireworksCount > 1;
    bool _842;
    if (_836)
    {
        _842 = buffer.uFireworkTime[1] >= 0.0;
    }
    else
    {
        _842 = _836;
    }
    if (_842)
    {
        float2 _850 = float2(buffer.uFireworkCenterX[1], buffer.uFireworkCenterY[1]);
        float2 _t48 = _850;
        float2 param_18 = in.v_uv;
        float2 param_19 = _734;
        float2 param_20 = _850;
        float2 param_21 = float2(_t48.x * _723, _t48.y);
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
        _f3(param_18, param_19, param_20, param_21, param_22, param_23, param_24, param_25, param_26, param_27, param_28, param_29, u_particleTexture_1_1, u_particleTexture_1_1Smplr, u_particleTexture_1_2, u_particleTexture_1_2Smplr, u_particleTexture_2_1, u_particleTexture_2_1Smplr, u_particleTexture_2_2, u_particleTexture_2_2Smplr, u_particleTexture_3_1, u_particleTexture_3_1Smplr, u_particleTexture_3_2, u_particleTexture_3_2Smplr, param_30, param_31, param_32, param_33, u_particleTexture_4_1, u_particleTexture_4_1Smplr, u_particleTexture_4_2, u_particleTexture_4_2Smplr, u_particleTexture_2_1, u_particleTexture_2_1Smplr, u_particleTexture_2_2, u_particleTexture_2_2Smplr, u_particleTexture_3_1, u_particleTexture_3_1Smplr, u_particleTexture_3_2, u_particleTexture_3_2Smplr);
        float4 param_34 = param_33;
        float4 param_35 = _t45;
        float4 _910 = _f1(param_34, param_35);
        _t45 = _910;
    }
    bool _913 = buffer.uFireworksCount > 2;
    bool _919;
    if (_913)
    {
        _919 = buffer.uFireworkTime[2] >= 0.0;
    }
    else
    {
        _919 = _913;
    }
    if (_919)
    {
        float2 _927 = float2(buffer.uFireworkCenterX[2], buffer.uFireworkCenterY[2]);
        float2 _t50 = _927;
        float2 param_36 = in.v_uv;
        float2 param_37 = _734;
        float2 param_38 = _927;
        float2 param_39 = float2(_t50.x * _723, _t50.y);
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
        _f3(param_36, param_37, param_38, param_39, param_40, param_41, param_42, param_43, param_44, param_45, param_46, param_47, u_particleTexture_1_1, u_particleTexture_1_1Smplr, u_particleTexture_1_2, u_particleTexture_1_2Smplr, u_particleTexture_2_1, u_particleTexture_2_1Smplr, u_particleTexture_2_2, u_particleTexture_2_2Smplr, u_particleTexture_3_1, u_particleTexture_3_1Smplr, u_particleTexture_3_2, u_particleTexture_3_2Smplr, param_48, param_49, param_50, param_51, u_particleTexture_4_1, u_particleTexture_4_1Smplr, u_particleTexture_4_2, u_particleTexture_4_2Smplr, u_particleTexture_2_1, u_particleTexture_2_1Smplr, u_particleTexture_2_2, u_particleTexture_2_2Smplr, u_particleTexture_3_1, u_particleTexture_3_1Smplr, u_particleTexture_3_2, u_particleTexture_3_2Smplr);
        float4 param_52 = param_51;
        float4 param_53 = _t45;
        float4 _987 = _f1(param_52, param_53);
        _t45 = _987;
    }
    float4 param_54 = preFirework.sample(preFireworkSmplr, in.v_uv);
    float4 param_55 = _t45;
    float4 _999 = _f1(param_54, param_55);
    out.o_fragColor = _999;
    return out;
}

