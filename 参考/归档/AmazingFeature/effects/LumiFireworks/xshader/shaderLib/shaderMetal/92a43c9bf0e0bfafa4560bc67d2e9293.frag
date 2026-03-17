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
    float4 _66 = _p1;
    float3 _73 = (_p0.xyz * _p0.w) + (_66.xyz * (1.0 - _p0.w));
    _p1.x = _73.x;
    _p1.y = _73.y;
    _p1.z = _73.z;
    _p1.w = fast::max(_p1.w, _p0.w);
    return _p1;
}

static inline __attribute__((always_inline))
float _f2(thread const float& _p0)
{
    return 1.0 - ((1.0 - _p0) * (1.0 - _p0));
}

static inline __attribute__((always_inline))
float4 _f3(thread const int& _p0, thread const int& _p1, thread const float2& _p2, texture2d<float> u_picture_1, sampler u_picture_1Smplr, texture2d<float> u_picture_2, sampler u_picture_2Smplr, texture2d<float> u_picture_3, sampler u_picture_3Smplr, texture2d<float> u_picture_4, sampler u_picture_4Smplr, texture2d<float> u_picture_5, sampler u_picture_5Smplr, texture2d<float> u_picture_6, sampler u_picture_6Smplr, texture2d<float> u_picture_7, sampler u_picture_7Smplr, texture2d<float> u_picture_8, sampler u_picture_8Smplr, texture2d<float> u_picture_9, sampler u_picture_9Smplr, texture2d<float> u_picture_10, sampler u_picture_10Smplr, texture2d<float> u_picture_11, sampler u_picture_11Smplr, texture2d<float> u_picture_12, sampler u_picture_12Smplr, texture2d<float> u_picture_13, sampler u_picture_13Smplr, texture2d<float> u_picture_14, sampler u_picture_14Smplr, texture2d<float> u_picture_15, sampler u_picture_15Smplr)
{
    int _111 = (int(mod(float(_p0), 3.0)) * 5) + _p1;
    if (_111 == 0)
    {
        return u_picture_1.sample(u_picture_1Smplr, _p2);
    }
    if (_111 == 1)
    {
        return u_picture_2.sample(u_picture_2Smplr, _p2);
    }
    if (_111 == 2)
    {
        return u_picture_3.sample(u_picture_3Smplr, _p2);
    }
    if (_111 == 3)
    {
        return u_picture_4.sample(u_picture_4Smplr, _p2);
    }
    if (_111 == 4)
    {
        return u_picture_5.sample(u_picture_5Smplr, _p2);
    }
    if (_111 == 5)
    {
        return u_picture_6.sample(u_picture_6Smplr, _p2);
    }
    if (_111 == 6)
    {
        return u_picture_7.sample(u_picture_7Smplr, _p2);
    }
    if (_111 == 7)
    {
        return u_picture_8.sample(u_picture_8Smplr, _p2);
    }
    if (_111 == 8)
    {
        return u_picture_9.sample(u_picture_9Smplr, _p2);
    }
    if (_111 == 9)
    {
        return u_picture_10.sample(u_picture_10Smplr, _p2);
    }
    if (_111 == 10)
    {
        return u_picture_11.sample(u_picture_11Smplr, _p2);
    }
    if (_111 == 11)
    {
        return u_picture_12.sample(u_picture_12Smplr, _p2);
    }
    if (_111 == 12)
    {
        return u_picture_13.sample(u_picture_13Smplr, _p2);
    }
    if (_111 == 13)
    {
        return u_picture_14.sample(u_picture_14Smplr, _p2);
    }
    if (_111 == 14)
    {
        return u_picture_15.sample(u_picture_15Smplr, _p2);
    }
    return u_picture_1.sample(u_picture_1Smplr, _p2);
}

static inline __attribute__((always_inline))
float _f0(thread const float& _p0)
{
    return fract(sin(_p0) * 43758.546875);
}

static inline __attribute__((always_inline))
void _f4(thread const float2& _p0, thread const float2& _p1, thread const float2& _p2, thread const float2& _p3, thread const float& _p4, thread const float& _p5, thread const float& _p6, thread const float& _p7, thread const float& _p8, thread const float& _p9, thread const float& _p10, thread const float& _p11, thread const float3& _p12, thread const float3& _p13, thread float4& _p14, texture2d<float> u_picture_1, sampler u_picture_1Smplr, texture2d<float> u_picture_2, sampler u_picture_2Smplr, texture2d<float> u_picture_3, sampler u_picture_3Smplr, texture2d<float> u_picture_4, sampler u_picture_4Smplr, texture2d<float> u_picture_5, sampler u_picture_5Smplr, texture2d<float> u_picture_6, sampler u_picture_6Smplr, texture2d<float> u_picture_7, sampler u_picture_7Smplr, texture2d<float> u_picture_8, sampler u_picture_8Smplr, texture2d<float> u_picture_9, sampler u_picture_9Smplr, texture2d<float> u_picture_10, sampler u_picture_10Smplr, texture2d<float> u_picture_11, sampler u_picture_11Smplr, texture2d<float> u_picture_12, sampler u_picture_12Smplr, texture2d<float> u_picture_13, sampler u_picture_13Smplr, texture2d<float> u_picture_14, sampler u_picture_14Smplr, texture2d<float> u_picture_15, sampler u_picture_15Smplr, texture2d<float> u_fireWork, sampler u_fireWorkSmplr)
{
    if ((_p4 >= (_p5 + _p6)) || (_p4 < 0.0))
    {
        return;
    }
    float _319 = fast::max(0.001000000047497451305389404296875, _p7);
    if (_p4 < _p5)
    {
        float _329 = _p4 / fast::max(0.001000000047497451305389404296875, _p5);
        float _t8 = 1.0;
        if (_329 < 0.800000011920928955078125)
        {
            _t8 = 1.0 - ((_329 / 0.800000011920928955078125) * 0.60000002384185791015625);
        }
        else
        {
            _t8 = 0.4000000059604644775390625;
        }
        float2 _t12 = _p1 - float2(_p3.x, (-0.5) + (_329 * (_p2.y - (-0.5))));
        float2 _t14 = (float2(_t12.x / 0.2115384638309478759765625, _t12.y) / float2((0.5 * _319) * _t8)) + float2(0.5);
        bool _390 = _t14.x >= 0.0;
        bool _396;
        if (_390)
        {
            _396 = _t14.x <= 1.0;
        }
        else
        {
            _396 = _390;
        }
        bool _402;
        if (_396)
        {
            _402 = _t14.y >= 0.0;
        }
        else
        {
            _402 = _396;
        }
        bool _408;
        if (_402)
        {
            _408 = _t14.y <= 1.0;
        }
        else
        {
            _408 = _402;
        }
        if (_408)
        {
            float4 _420 = u_fireWork.sample(u_fireWorkSmplr, float2(_t14.x, 1.0 - _t14.y));
            float4 _t15 = _420;
            if (_t15.w > 0.00999999977648258209228515625)
            {
                float4 param = float4((_420.xyz * float3(_p8, _p9, _p10)) * _p12, _t15.w);
                float4 param_1 = _p14;
                float4 _448 = _f1(param, param_1);
                _p14 = _448;
            }
        }
    }
    else
    {
        float _453 = _p4 - _p5;
        float _460 = fast::clamp(_453 / _p6, 0.0, 1.0);
        float _463 = smoothstep(0.0, 0.5, _460);
        float param_2 = _463;
        float _477 = _319 * (0.100000001490116119384765625 + (0.89999997615814208984375 * _f2(param_2)));
        float _480 = smoothstep(0.0, 0.100000001490116119384765625, _460);
        for (int _t25 = 0; _t25 < 5; _t25++)
        {
            float _t26 = 1.0;
            if (_t25 < 4)
            {
                float _499 = 0.5 + (float(_t25) * 0.0500000007450580596923828125);
                _t26 = 1.0 - smoothstep(_499, _499 + 0.20000000298023223876953125, _460);
            }
            else
            {
                _t26 = 1.0 - smoothstep(0.699999988079071044921875, 1.0, _460);
            }
            float _517 = _480 * _t26;
            if (_517 > 0.00999999977648258209228515625)
            {
                float3 _t30 = _p12;
                if (_t25 == 2)
                {
                    _t30 = mix(_p12, _p13, float3(0.4000000059604644775390625));
                }
                else
                {
                    if (_t25 == 3)
                    {
                        _t30 = mix(_p12, _p13, float3(0.699999988079071044921875));
                    }
                    else
                    {
                        if (_t25 == 4)
                        {
                            _t30 = _p13;
                        }
                    }
                }
                float2 _t31 = _p1 - _p3;
                float _555 = _453 * 0.0500000007450580596923828125;
                float _558 = cos(_555);
                float _561 = sin(_555);
                float2 _t37 = (float2((_t31.x * _558) + (_t31.y * _561), ((-_t31.x) * _561) + (_t31.y * _558)) / float2(_477)) + float2(0.5);
                bool _592 = _t37.x >= 0.0;
                bool _598;
                if (_592)
                {
                    _598 = _t37.x <= 1.0;
                }
                else
                {
                    _598 = _592;
                }
                bool _604;
                if (_598)
                {
                    _604 = _t37.y >= 0.0;
                }
                else
                {
                    _604 = _598;
                }
                bool _610;
                if (_604)
                {
                    _610 = _t37.y <= 1.0;
                }
                else
                {
                    _610 = _604;
                }
                if (_610)
                {
                    int param_3 = int(_p11);
                    int param_4 = _t25;
                    float2 param_5 = float2(_t37.x, 1.0 - _t37.y);
                    float4 _626 = _f3(param_3, param_4, param_5, u_picture_1, u_picture_1Smplr, u_picture_2, u_picture_2Smplr, u_picture_3, u_picture_3Smplr, u_picture_4, u_picture_4Smplr, u_picture_5, u_picture_5Smplr, u_picture_6, u_picture_6Smplr, u_picture_7, u_picture_7Smplr, u_picture_8, u_picture_8Smplr, u_picture_9, u_picture_9Smplr, u_picture_10, u_picture_10Smplr, u_picture_11, u_picture_11Smplr, u_picture_12, u_picture_12Smplr, u_picture_13, u_picture_13Smplr, u_picture_14, u_picture_14Smplr, u_picture_15, u_picture_15Smplr);
                    float4 _t38 = _626;
                    float _630 = smoothstep(0.20000000298023223876953125, 0.800000011920928955078125, _t38.w);
                    if (_630 > 0.00999999977648258209228515625)
                    {
                        float4 param_6 = float4((_626.xyz * _t30) * float3(_p8, _p9, _p10), _630 * _517);
                        float4 param_7 = _p14;
                        float4 _656 = _f1(param_6, param_7);
                        _p14 = _656;
                    }
                }
            }
        }
        float _661 = _p6 + 3.0;
        float _667 = fast::clamp(_453 / fast::max(0.001000000047497451305389404296875, _661), 0.0, 1.0);
        float _681 = smoothstep(_661 * 0.085714288055896759033203125, _661 * 0.2857142984867095947265625, _453);
        float _694 = _480 * (1.0 - smoothstep((_661 * 0.699999988079071044921875) / 3.5, _661 / 3.5, _453));
        for (int _t46 = 0; _t46 < 25; _t46++)
        {
            float _718 = ((float(_t46) * 13.13000011444091796875) + (_p2.x * 17.0)) + (_p2.y * 31.0);
            float param_8 = _718 + 1.0;
            float param_9 = _718 + 2.0;
            float param_10 = _718 + 3.0;
            float param_11 = _718 + 4.0;
            float _744 = _f0(param_9) * 6.283185482025146484375;
            float _748 = (_f0(param_10) * 2.0) - 1.0;
            float _755 = sqrt(fast::max(0.0, 1.0 - (_748 * _748)));
            float2 _765 = float2(cos(_744) * _755, sin(_744) * _755);
            float2 _t55 = ((_765 * ((0.30099999904632568359375 * _319) * pow(_f0(param_8), 0.333000004291534423828125))) * _463) + (((_765 * _681) * 0.100000001490116119384765625) * _319);
            _t55.y -= (((_681 * _681) * 0.1599999964237213134765625) * _319);
            float2 _798 = _t55;
            float2 _799 = _798 + _p3;
            _t55 = _799;
            float4 param_12 = float4(_p12, ((1.0 - smoothstep(0.300000011920928955078125, 0.5, length(_p1 - _799) / fast::max(((0.0199999995529651641845703125 * _319) * (0.5 + (0.5 + (0.5 * sin((_667 * 52.700000762939453125) + (_f0(param_11) * 6.280000209808349609375)))))) * 0.699999988079071044921875, 9.9999997473787516355514526367188e-05))) * _694) * 0.800000011920928955078125);
            float4 param_13 = _p14;
            float4 _842 = _f1(param_12, param_13);
            _p14 = _842;
        }
    }
    float4 _849 = _p14;
    float3 _851 = _849.xyz * float3(_p8, _p9, _p10);
    _p14.x = _851.x;
    _p14.y = _851.y;
    _p14.z = _851.z;
}

fragment main0_out main0(main0_in in [[stage_in]], constant buffer_t& buffer, texture2d<float> u_picture_1 [[texture(0)]], texture2d<float> u_picture_2 [[texture(1)]], texture2d<float> u_picture_3 [[texture(2)]], texture2d<float> u_picture_4 [[texture(3)]], texture2d<float> u_picture_5 [[texture(4)]], texture2d<float> u_picture_6 [[texture(5)]], texture2d<float> u_picture_7 [[texture(6)]], texture2d<float> u_picture_8 [[texture(7)]], texture2d<float> u_picture_9 [[texture(8)]], texture2d<float> u_picture_10 [[texture(9)]], texture2d<float> u_picture_11 [[texture(10)]], texture2d<float> u_picture_12 [[texture(11)]], texture2d<float> u_picture_13 [[texture(12)]], texture2d<float> u_picture_14 [[texture(13)]], texture2d<float> u_picture_15 [[texture(14)]], texture2d<float> u_fireWork [[texture(15)]], sampler u_picture_1Smplr [[sampler(0)]], sampler u_picture_2Smplr [[sampler(1)]], sampler u_picture_3Smplr [[sampler(2)]], sampler u_picture_4Smplr [[sampler(3)]], sampler u_picture_5Smplr [[sampler(4)]], sampler u_picture_6Smplr [[sampler(5)]], sampler u_picture_7Smplr [[sampler(6)]], sampler u_picture_8Smplr [[sampler(7)]], sampler u_picture_9Smplr [[sampler(8)]], sampler u_picture_10Smplr [[sampler(9)]], sampler u_picture_11Smplr [[sampler(10)]], sampler u_picture_12Smplr [[sampler(11)]], sampler u_picture_13Smplr [[sampler(12)]], sampler u_picture_14Smplr [[sampler(13)]], sampler u_picture_15Smplr [[sampler(14)]], sampler u_fireWorkSmplr [[sampler(15)]])
{
    main0_out out = {};
    float _866 = buffer.u_ScreenParams.x / buffer.u_ScreenParams.y;
    float2 _877 = float2(in.v_uv.x * _866, in.v_uv.y);
    float4 _t61 = float4(0.0);
    bool _883 = buffer.uFireworksCount > 0;
    bool _892;
    if (_883)
    {
        _892 = buffer.uFireworkTime[0] >= 0.0;
    }
    else
    {
        _892 = _883;
    }
    if (_892)
    {
        float2 _902 = float2(buffer.uFireworkCenterX[0], buffer.uFireworkCenterY[0]);
        float2 _t62 = _902;
        float2 param = in.v_uv;
        float2 param_1 = _877;
        float2 param_2 = _902;
        float2 param_3 = float2(_t62.x * _866, _t62.y);
        float param_4 = buffer.uFireworkTime[0];
        float param_5 = buffer.uLaunchDuration;
        float param_6 = buffer.uExplosionDuration;
        float param_7 = buffer.uFireworkScale[0];
        float param_8 = buffer.uGlobalTintR;
        float param_9 = buffer.uGlobalTintG;
        float param_10 = buffer.uGlobalTintB;
        float param_11 = buffer.uFireworkTextureGroup[0];
        float3 param_12 = float3(buffer.uFireworkColorInnerR[0], buffer.uFireworkColorInnerG[0], buffer.uFireworkColorInnerB[0]);
        float3 param_13 = float3(buffer.uFireworkColorOuterR[0], buffer.uFireworkColorOuterG[0], buffer.uFireworkColorOuterB[0]);
        float4 param_14 = _t61;
        _f4(param, param_1, param_2, param_3, param_4, param_5, param_6, param_7, param_8, param_9, param_10, param_11, param_12, param_13, param_14, u_picture_1, u_picture_1Smplr, u_picture_2, u_picture_2Smplr, u_picture_3, u_picture_3Smplr, u_picture_4, u_picture_4Smplr, u_picture_5, u_picture_5Smplr, u_picture_6, u_picture_6Smplr, u_picture_7, u_picture_7Smplr, u_picture_8, u_picture_8Smplr, u_picture_9, u_picture_9Smplr, u_picture_10, u_picture_10Smplr, u_picture_11, u_picture_11Smplr, u_picture_12, u_picture_12Smplr, u_picture_13, u_picture_13Smplr, u_picture_14, u_picture_14Smplr, u_picture_15, u_picture_15Smplr, u_fireWork, u_fireWorkSmplr);
        _t61 = param_14;
    }
    bool _970 = buffer.uFireworksCount > 1;
    bool _976;
    if (_970)
    {
        _976 = buffer.uFireworkTime[1] >= 0.0;
    }
    else
    {
        _976 = _970;
    }
    if (_976)
    {
        float2 _984 = float2(buffer.uFireworkCenterX[1], buffer.uFireworkCenterY[1]);
        float2 _t63 = _984;
        float2 param_15 = in.v_uv;
        float2 param_16 = _877;
        float2 param_17 = _984;
        float2 param_18 = float2(_t63.x * _866, _t63.y);
        float param_19 = buffer.uFireworkTime[1];
        float param_20 = buffer.uLaunchDuration;
        float param_21 = buffer.uExplosionDuration;
        float param_22 = buffer.uFireworkScale[1];
        float param_23 = buffer.uGlobalTintR;
        float param_24 = buffer.uGlobalTintG;
        float param_25 = buffer.uGlobalTintB;
        float param_26 = buffer.uFireworkTextureGroup[1];
        float3 param_27 = float3(buffer.uFireworkColorInnerR[1], buffer.uFireworkColorInnerG[1], buffer.uFireworkColorInnerB[1]);
        float3 param_28 = float3(buffer.uFireworkColorOuterR[1], buffer.uFireworkColorOuterG[1], buffer.uFireworkColorOuterB[1]);
        float4 param_29 = _t61;
        _f4(param_15, param_16, param_17, param_18, param_19, param_20, param_21, param_22, param_23, param_24, param_25, param_26, param_27, param_28, param_29, u_picture_1, u_picture_1Smplr, u_picture_2, u_picture_2Smplr, u_picture_3, u_picture_3Smplr, u_picture_4, u_picture_4Smplr, u_picture_5, u_picture_5Smplr, u_picture_6, u_picture_6Smplr, u_picture_7, u_picture_7Smplr, u_picture_8, u_picture_8Smplr, u_picture_9, u_picture_9Smplr, u_picture_10, u_picture_10Smplr, u_picture_11, u_picture_11Smplr, u_picture_12, u_picture_12Smplr, u_picture_13, u_picture_13Smplr, u_picture_14, u_picture_14Smplr, u_picture_15, u_picture_15Smplr, u_fireWork, u_fireWorkSmplr);
        _t61 = param_29;
    }
    bool _1039 = buffer.uFireworksCount > 2;
    bool _1045;
    if (_1039)
    {
        _1045 = buffer.uFireworkTime[2] >= 0.0;
    }
    else
    {
        _1045 = _1039;
    }
    if (_1045)
    {
        float2 _1053 = float2(buffer.uFireworkCenterX[2], buffer.uFireworkCenterY[2]);
        float2 _t64 = _1053;
        float2 param_30 = in.v_uv;
        float2 param_31 = _877;
        float2 param_32 = _1053;
        float2 param_33 = float2(_t64.x * _866, _t64.y);
        float param_34 = buffer.uFireworkTime[2];
        float param_35 = buffer.uLaunchDuration;
        float param_36 = buffer.uExplosionDuration;
        float param_37 = buffer.uFireworkScale[2];
        float param_38 = buffer.uGlobalTintR;
        float param_39 = buffer.uGlobalTintG;
        float param_40 = buffer.uGlobalTintB;
        float param_41 = buffer.uFireworkTextureGroup[2];
        float3 param_42 = float3(buffer.uFireworkColorInnerR[2], buffer.uFireworkColorInnerG[2], buffer.uFireworkColorInnerB[2]);
        float3 param_43 = float3(buffer.uFireworkColorOuterR[2], buffer.uFireworkColorOuterG[2], buffer.uFireworkColorOuterB[2]);
        float4 param_44 = _t61;
        _f4(param_30, param_31, param_32, param_33, param_34, param_35, param_36, param_37, param_38, param_39, param_40, param_41, param_42, param_43, param_44, u_picture_1, u_picture_1Smplr, u_picture_2, u_picture_2Smplr, u_picture_3, u_picture_3Smplr, u_picture_4, u_picture_4Smplr, u_picture_5, u_picture_5Smplr, u_picture_6, u_picture_6Smplr, u_picture_7, u_picture_7Smplr, u_picture_8, u_picture_8Smplr, u_picture_9, u_picture_9Smplr, u_picture_10, u_picture_10Smplr, u_picture_11, u_picture_11Smplr, u_picture_12, u_picture_12Smplr, u_picture_13, u_picture_13Smplr, u_picture_14, u_picture_14Smplr, u_picture_15, u_picture_15Smplr, u_fireWork, u_fireWorkSmplr);
        _t61 = param_44;
    }
    out.o_fragColor = _t61;
    return out;
}

