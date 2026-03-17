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
    spvUnsafeArray<float, 10> uFireworkTime;
    spvUnsafeArray<float, 10> uFireworkCenterX;
    spvUnsafeArray<float, 10> uFireworkCenterY;
    spvUnsafeArray<float, 10> uFireworkScale;
    spvUnsafeArray<float, 10> uFireworkColorInnerR;
    spvUnsafeArray<float, 10> uFireworkColorInnerG;
    spvUnsafeArray<float, 10> uFireworkColorInnerB;
    spvUnsafeArray<float, 10> uFireworkColorOuterR;
    spvUnsafeArray<float, 10> uFireworkColorOuterG;
    spvUnsafeArray<float, 10> uFireworkColorOuterB;
    float uUseParticleTex;
    float uLaunchDuration;
    float uExplosionDuration;
    float uGlobalTintR;
    float uGlobalTintG;
    float uGlobalTintB;
    spvUnsafeArray<float, 10> uFireworkTextureGroup;
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
    float4 _65 = _p1;
    float3 _67 = _65.xyz + (_p0.xyz * _p0.w);
    _p1.x = _67.x;
    _p1.y = _67.y;
    _p1.z = _67.z;
    _p1.w = fast::max(_p1.w, _p0.w);
    return _p1;
}

static inline __attribute__((always_inline))
float _f0(thread const float& _p0)
{
    return fract(sin(_p0) * 43758.546875);
}

static inline __attribute__((always_inline))
void _f2(thread const float2& _p0, thread const float2& _p1, thread const float2& _p2, thread const float2& _p3, thread const float& _p4, thread const float& _p5, thread const float& _p6, thread const float& _p7, thread const float& _p8, thread const float& _p9, thread const float& _p10, thread const float& _p11, texture2d<float> _p12, sampler _p12Smplr, texture2d<float> _p13, sampler _p13Smplr, texture2d<float> _p14, sampler _p14Smplr, texture2d<float> _p15, sampler _p15Smplr, texture2d<float> _p16, sampler _p16Smplr, texture2d<float> _p17, sampler _p17Smplr, thread const float& _p18, thread const float3& _p19, thread const float3& _p20, thread float4& _p21)
{
    if (_p5 >= (_p6 + _p7))
    {
        _p21 = float4(0.0);
        return;
    }
    _p21 = float4(0.0);
    float _106 = fast::max(0.001000000047497451305389404296875, _p8);
    if (_p5 < _p6)
    {
        float _116 = _p5 / fast::max(0.001000000047497451305389404296875, _p6);
        float _128 = mix(0.100000001490116119384765625, _p2.y, _116);
        float _t9 = 1.0;
        if (_116 < 0.800000011920928955078125)
        {
            _t9 = 1.0 - ((_116 / 0.800000011920928955078125) * 0.60000002384185791015625);
        }
        else
        {
            _t9 = 0.4000000059604644775390625;
        }
        float _149 = (0.100000001490116119384765625 * _106) * _t9;
        float _185;
        for (int _t14 = 0; _t14 < 2; _t14++)
        {
            float _180 = ((0.0500000007450580596923828125 * _106) * _t9) * (1.0 + ((1.0 - _116) * 3.0));
            if (_t14 == 1)
            {
                _185 = _180;
            }
            else
            {
                _185 = -_180;
            }
            float2 _t20 = _p1 - float2(_p3.x, _128 + _185);
            float2 _230 = float2((1.0 * _t20.x) - (0.0 * _t20.y), (0.0 * _t20.x) + (1.0 * _t20.y));
            if (_p4 > 0.5)
            {
                float2 _t25 = (_230 / float2(_149)) + float2(0.5);
                float2 _249 = float2(_t25.x, 1.0 - _t25.y);
                bool _252 = _t25.x >= 0.0;
                bool _258;
                if (_252)
                {
                    _258 = _t25.x <= 1.0;
                }
                else
                {
                    _258 = _252;
                }
                bool _264;
                if (_258)
                {
                    _264 = _t25.y >= 0.0;
                }
                else
                {
                    _264 = _258;
                }
                bool _270;
                if (_264)
                {
                    _270 = _t25.y <= 1.0;
                }
                else
                {
                    _270 = _264;
                }
                if (_270)
                {
                    float4 _t27 = _p12.sample(_p12Smplr, _249);
                    if (mod(float(_t14), 2.0) == 0.0)
                    {
                        _t27 = _p13.sample(_p13Smplr, _249);
                    }
                    float4 param = float4(_p19 * _t27.xyz, _t27.w * 1.0);
                    float4 param_1 = _p21;
                    float4 _304 = _f1(param, param_1);
                    _p21 = _304;
                }
            }
            else
            {
                float4 param_2 = float4(_p19, smoothstep(_149, 0.0, length(_230)) * 1.0);
                float4 param_3 = _p21;
                float4 _324 = _f1(param_2, param_3);
                _p21 = _324;
            }
        }
    }
    else
    {
        float _331 = _p5 - _p6;
        float _337 = fast::clamp(_331 / fast::max(0.001000000047497451305389404296875, _p7), 0.0, 1.0);
        float _359 = smoothstep(0.0, _p7 * 0.14285714924335479736328125, _331);
        float _364 = smoothstep(_p7 * 0.085714288055896759033203125, _p7 * 0.2857142984867095947265625, _331);
        float _369 = _331 * 0.0500000007450580596923828125;
        float _375 = (0.10999999940395355224609375 * _106) * 0.699999988079071044921875;
        float _380 = (0.17499999701976776123046875 * _106) * 0.699999988079071044921875;
        float _385 = (0.25 * _106) * 0.699999988079071044921875;
        float _390 = (0.3300000131130218505859375 * _106) * 0.699999988079071044921875;
        float _395 = (0.430000007152557373046875 * _106) * 0.699999988079071044921875;
        float _399 = 0.039999999105930328369140625 * _106;
        float _403 = 0.0280000008642673492431640625 * _106;
        float _407 = 0.0599999986588954925537109375 * _106;
        float _414 = 0.087999999523162841796875 * _106;
        float3 _423 = mix(_p19, _p20, float3(0.4000000059604644775390625));
        float3 _428 = mix(_p19, _p20, float3(0.699999988079071044921875));
        float4 _434 = float4(_p20, 1.0);
        float _443 = smoothstep(0.0, _p7 * 0.02857142873108386993408203125, _331);
        float _522 = _443 * pow(1.0 - smoothstep(_p7 * 0.14285714924335479736328125, _p7 * 0.20000000298023223876953125, _331), 1.25);
        float _526 = _443 * pow(1.0 - smoothstep(_p7 * 0.15714286267757415771484375, _p7 * 0.21428571641445159912109375, _331), 1.25);
        float _530 = _443 * pow(1.0 - smoothstep(_p7 * 0.17142857611179351806640625, _p7 * 0.22857142984867095947265625, _331), 1.25);
        float _534 = _443 * pow(1.0 - smoothstep(_p7 * 0.1857142746448516845703125, _p7 * 0.24285714328289031982421875, _331), 1.25);
        float _538 = _443 * pow(1.0 - smoothstep(_p7 * 0.20000000298023223876953125, _p7 * 0.2857142984867095947265625, _331), 1.25);
        float4 _t85;
        for (int _t73 = 0; _t73 < 12; _t73++)
        {
            float _565 = (float(_t73) / 12.0) * 6.283185482025146484375;
            float2 _571 = float2(cos(_565), sin(_565));
            float2 _t76 = (_571 * _375) * _359;
            float _580 = cos(_369);
            float _583 = sin(_369);
            _t76 = float2((_580 * _t76.x) - (_583 * _t76.y), (_583 * _t76.x) + (_580 * _t76.y)) + (((fast::normalize(_571) * _364) * 0.02999999932944774627685546875) * _106);
            _t76.y -= (((_364 * _364) * 0.0500000007450580596923828125) * _106);
            float2 _624 = _t76;
            float2 _625 = _624 + _p3;
            _t76 = _625;
            float2 _t79 = _p1 - _625;
            float _635 = _565 - 1.57079637050628662109375;
            float _636 = cos(_635);
            float _642 = sin(_635);
            float2 _663 = float2((_636 * _t79.x) + (_642 * _t79.y), ((-_642) * _t79.x) + (_636 * _t79.y));
            if (_p4 > 0.5)
            {
                float2 _t83 = (_663 / float2(_399)) + float2(0.5);
                float2 _681 = float2(_t83.x, 1.0 - _t83.y);
                bool _684 = _t83.x >= 0.0;
                bool _690;
                if (_684)
                {
                    _690 = _t83.x <= 1.0;
                }
                else
                {
                    _690 = _684;
                }
                bool _696;
                if (_690)
                {
                    _696 = _t83.y >= 0.0;
                }
                else
                {
                    _696 = _690;
                }
                bool _702;
                if (_696)
                {
                    _702 = _t83.y <= 1.0;
                }
                else
                {
                    _702 = _696;
                }
                if (_702)
                {
                    if (_p18 < 1.5)
                    {
                        _t85 = _p13.sample(_p13Smplr, _681);
                        if (mod(float(_t73), 2.0) == 0.0)
                        {
                            _t85 = _p12.sample(_p12Smplr, _681);
                        }
                    }
                    else
                    {
                        if (_p18 < 2.5)
                        {
                            _t85 = _p15.sample(_p15Smplr, _681);
                            if (mod(float(_t73), 2.0) == 0.0)
                            {
                                _t85 = _p14.sample(_p14Smplr, _681);
                            }
                        }
                        else
                        {
                            _t85 = _p17.sample(_p17Smplr, _681);
                            if (mod(float(_t73), 2.0) == 0.0)
                            {
                                _t85 = _p16.sample(_p16Smplr, _681);
                            }
                        }
                    }
                    float4 param_4 = float4(_p19 * _t85.xyz, _t85.w * _522);
                    float4 param_5 = _p21;
                    float4 _771 = _f1(param_4, param_5);
                    _p21 = _771;
                }
            }
            else
            {
                float4 param_6 = float4(_p19, smoothstep(_399, 0.0, length(_663)) * _522);
                float4 param_7 = _p21;
                float4 _791 = _f1(param_6, param_7);
                _p21 = _791;
            }
        }
        float4 _t101;
        for (int _t89 = 0; _t89 < 36; _t89++)
        {
            float _810 = (float(_t89) / 36.0) * 6.283185482025146484375;
            float2 _816 = float2(cos(_810), sin(_810));
            float2 _t92 = (_816 * _380) * _359;
            float _825 = cos(_369);
            float _828 = sin(_369);
            _t92 = float2((_825 * _t92.x) - (_828 * _t92.y), (_828 * _t92.x) + (_825 * _t92.y)) + (((fast::normalize(_816) * _364) * 0.02999999932944774627685546875) * _106);
            _t92.y -= (((_364 * _364) * 0.0500000007450580596923828125) * _106);
            float2 _868 = _t92;
            float2 _869 = _868 + _p3;
            _t92 = _869;
            float2 _t95 = _p1 - _869;
            float _878 = _810 - 1.57079637050628662109375;
            float _879 = cos(_878);
            float _885 = sin(_878);
            float2 _906 = float2((_879 * _t95.x) + (_885 * _t95.y), ((-_885) * _t95.x) + (_879 * _t95.y));
            if (_p4 > 0.5)
            {
                float2 _t99 = (_906 / float2(_403)) + float2(0.5);
                float2 _924 = float2(_t99.x, 1.0 - _t99.y);
                bool _927 = _t99.x >= 0.0;
                bool _933;
                if (_927)
                {
                    _933 = _t99.x <= 1.0;
                }
                else
                {
                    _933 = _927;
                }
                bool _939;
                if (_933)
                {
                    _939 = _t99.y >= 0.0;
                }
                else
                {
                    _939 = _933;
                }
                bool _945;
                if (_939)
                {
                    _945 = _t99.y <= 1.0;
                }
                else
                {
                    _945 = _939;
                }
                if (_945)
                {
                    if (_p18 < 1.5)
                    {
                        _t101 = _p13.sample(_p13Smplr, _924);
                        if (mod(float(_t89), 2.0) == 0.0)
                        {
                            _t101 = _p12.sample(_p12Smplr, _924);
                        }
                    }
                    else
                    {
                        if (_p18 < 2.5)
                        {
                            _t101 = _p15.sample(_p15Smplr, _924);
                            if (mod(float(_t89), 2.0) == 0.0)
                            {
                                _t101 = _p14.sample(_p14Smplr, _924);
                            }
                        }
                        else
                        {
                            _t101 = _p17.sample(_p17Smplr, _924);
                            if (mod(float(_t89), 2.0) == 0.0)
                            {
                                _t101 = _p16.sample(_p16Smplr, _924);
                            }
                        }
                    }
                    float4 param_8 = float4(_p19 * _t101.xyz, _t101.w * _526);
                    float4 param_9 = _p21;
                    float4 _1012 = _f1(param_8, param_9);
                    _p21 = _1012;
                }
            }
            else
            {
                float4 param_10 = float4(_p19, smoothstep(_403, 0.0, length(_906)) * _526);
                float4 param_11 = _p21;
                float4 _1032 = _f1(param_10, param_11);
                _p21 = _1032;
            }
        }
        float4 _t117;
        for (int _t105 = 0; _t105 < 18; _t105++)
        {
            float _1051 = (float(_t105) / 18.0) * 6.283185482025146484375;
            float2 _1057 = float2(cos(_1051), sin(_1051));
            float2 _t108 = (_1057 * _385) * _359;
            float _1066 = cos(_369);
            float _1069 = sin(_369);
            _t108 = float2((_1066 * _t108.x) - (_1069 * _t108.y), (_1069 * _t108.x) + (_1066 * _t108.y)) + (((fast::normalize(_1057) * _364) * 0.02999999932944774627685546875) * _106);
            _t108.y -= (((_364 * _364) * 0.0500000007450580596923828125) * _106);
            float2 _1109 = _t108;
            float2 _1110 = _1109 + _p3;
            _t108 = _1110;
            float2 _t111 = _p1 - _1110;
            float _1119 = _1051 - 1.57079637050628662109375;
            float _1120 = cos(_1119);
            float _1126 = sin(_1119);
            float2 _1147 = float2((_1120 * _t111.x) + (_1126 * _t111.y), ((-_1126) * _t111.x) + (_1120 * _t111.y));
            if (_p4 > 0.5)
            {
                float2 _t115 = (_1147 / float2(_407)) + float2(0.5);
                float2 _1165 = float2(_t115.x, 1.0 - _t115.y);
                bool _1168 = _t115.x >= 0.0;
                bool _1174;
                if (_1168)
                {
                    _1174 = _t115.x <= 1.0;
                }
                else
                {
                    _1174 = _1168;
                }
                bool _1180;
                if (_1174)
                {
                    _1180 = _t115.y >= 0.0;
                }
                else
                {
                    _1180 = _1174;
                }
                bool _1186;
                if (_1180)
                {
                    _1186 = _t115.y <= 1.0;
                }
                else
                {
                    _1186 = _1180;
                }
                if (_1186)
                {
                    if (_p18 < 1.5)
                    {
                        _t117 = _p13.sample(_p13Smplr, _1165);
                        if (mod(float(_t105), 2.0) == 0.0)
                        {
                            _t117 = _p12.sample(_p12Smplr, _1165);
                        }
                    }
                    else
                    {
                        if (_p18 < 2.5)
                        {
                            _t117 = _p15.sample(_p15Smplr, _1165);
                            if (mod(float(_t105), 2.0) == 0.0)
                            {
                                _t117 = _p14.sample(_p14Smplr, _1165);
                            }
                        }
                        else
                        {
                            _t117 = _p17.sample(_p17Smplr, _1165);
                            if (mod(float(_t105), 2.0) == 0.0)
                            {
                                _t117 = _p16.sample(_p16Smplr, _1165);
                            }
                        }
                    }
                    float4 param_12 = float4(_423 * _t117.xyz, _t117.w * _530);
                    float4 param_13 = _p21;
                    float4 _1253 = _f1(param_12, param_13);
                    _p21 = _1253;
                }
            }
            else
            {
                float4 param_14 = float4(_423, smoothstep(_407, 0.0, length(_1147)) * _530);
                float4 param_15 = _p21;
                float4 _1273 = _f1(param_14, param_15);
                _p21 = _1273;
            }
        }
        float4 _t133;
        for (int _t121 = 0; _t121 < 45; _t121++)
        {
            float _1292 = (float(_t121) / 45.0) * 6.283185482025146484375;
            float2 _1298 = float2(cos(_1292), sin(_1292));
            float2 _t124 = (_1298 * _390) * _359;
            float _1307 = cos(_369);
            float _1310 = sin(_369);
            _t124 = float2((_1307 * _t124.x) - (_1310 * _t124.y), (_1310 * _t124.x) + (_1307 * _t124.y)) + (((fast::normalize(_1298) * _364) * 0.02999999932944774627685546875) * _106);
            _t124.y -= (((_364 * _364) * 0.0500000007450580596923828125) * _106);
            float2 _1350 = _t124;
            float2 _1351 = _1350 + _p3;
            _t124 = _1351;
            float2 _t127 = _p1 - _1351;
            float _1360 = _1292 - 1.57079637050628662109375;
            float _1361 = cos(_1360);
            float _1367 = sin(_1360);
            float2 _1388 = float2((_1361 * _t127.x) + (_1367 * _t127.y), ((-_1367) * _t127.x) + (_1361 * _t127.y));
            if (_p4 > 0.5)
            {
                float2 _t131 = (_1388 / float2(_399)) + float2(0.5);
                float2 _1406 = float2(_t131.x, 1.0 - _t131.y);
                bool _1409 = _t131.x >= 0.0;
                bool _1415;
                if (_1409)
                {
                    _1415 = _t131.x <= 1.0;
                }
                else
                {
                    _1415 = _1409;
                }
                bool _1421;
                if (_1415)
                {
                    _1421 = _t131.y >= 0.0;
                }
                else
                {
                    _1421 = _1415;
                }
                bool _1427;
                if (_1421)
                {
                    _1427 = _t131.y <= 1.0;
                }
                else
                {
                    _1427 = _1421;
                }
                if (_1427)
                {
                    if (_p18 < 1.5)
                    {
                        _t133 = _p13.sample(_p13Smplr, _1406);
                        if (mod(float(_t121), 2.0) == 0.0)
                        {
                            _t133 = _p12.sample(_p12Smplr, _1406);
                        }
                    }
                    else
                    {
                        if (_p18 < 2.5)
                        {
                            _t133 = _p15.sample(_p15Smplr, _1406);
                            if (mod(float(_t121), 2.0) == 0.0)
                            {
                                _t133 = _p14.sample(_p14Smplr, _1406);
                            }
                        }
                        else
                        {
                            _t133 = _p17.sample(_p17Smplr, _1406);
                            if (mod(float(_t121), 2.0) == 0.0)
                            {
                                _t133 = _p16.sample(_p16Smplr, _1406);
                            }
                        }
                    }
                    float4 param_16 = float4(_428 * _t133.xyz, _t133.w * _534);
                    float4 param_17 = _p21;
                    float4 _1494 = _f1(param_16, param_17);
                    _p21 = _1494;
                }
            }
            else
            {
                float4 param_18 = float4(_428, smoothstep(_399, 0.0, length(_1388)) * _534);
                float4 param_19 = _p21;
                float4 _1514 = _f1(param_18, param_19);
                _p21 = _1514;
            }
        }
        float4 _t149;
        for (int _t137 = 0; _t137 < 16; _t137++)
        {
            float _1533 = (float(_t137) / 16.0) * 6.283185482025146484375;
            float2 _1539 = float2(cos(_1533), sin(_1533));
            float2 _t140 = (_1539 * _395) * _359;
            float _1548 = cos(_369);
            float _1551 = sin(_369);
            _t140 = float2((_1548 * _t140.x) - (_1551 * _t140.y), (_1551 * _t140.x) + (_1548 * _t140.y)) + (((fast::normalize(_1539) * _364) * 0.02999999932944774627685546875) * _106);
            _t140.y -= (((_364 * _364) * 0.0500000007450580596923828125) * _106);
            float2 _1591 = _t140;
            float2 _1592 = _1591 + _p3;
            _t140 = _1592;
            float2 _t143 = _p1 - _1592;
            float _1601 = _1533 - 1.57079637050628662109375;
            float _1602 = cos(_1601);
            float _1608 = sin(_1601);
            float2 _1629 = float2((_1602 * _t143.x) + (_1608 * _t143.y), ((-_1608) * _t143.x) + (_1602 * _t143.y));
            if (_p4 > 0.5)
            {
                float2 _t147 = (_1629 / float2(_414)) + float2(0.5);
                float2 _1647 = float2(_t147.x, 1.0 - _t147.y);
                bool _1650 = _t147.x >= 0.0;
                bool _1656;
                if (_1650)
                {
                    _1656 = _t147.x <= 1.0;
                }
                else
                {
                    _1656 = _1650;
                }
                bool _1662;
                if (_1656)
                {
                    _1662 = _t147.y >= 0.0;
                }
                else
                {
                    _1662 = _1656;
                }
                bool _1668;
                if (_1662)
                {
                    _1668 = _t147.y <= 1.0;
                }
                else
                {
                    _1668 = _1662;
                }
                if (_1668)
                {
                    if (_p18 < 1.5)
                    {
                        _t149 = _p13.sample(_p13Smplr, _1647);
                        if (mod(float(_t137), 2.0) == 0.0)
                        {
                            _t149 = _p12.sample(_p12Smplr, _1647);
                        }
                    }
                    else
                    {
                        if (_p18 < 2.5)
                        {
                            _t149 = _p15.sample(_p15Smplr, _1647);
                            if (mod(float(_t137), 2.0) == 0.0)
                            {
                                _t149 = _p14.sample(_p14Smplr, _1647);
                            }
                        }
                        else
                        {
                            _t149 = _p17.sample(_p17Smplr, _1647);
                            if (mod(float(_t137), 2.0) == 0.0)
                            {
                                _t149 = _p16.sample(_p16Smplr, _1647);
                            }
                        }
                    }
                    float4 param_20 = float4(_434.xyz * _t149.xyz, _t149.w * _538);
                    float4 param_21 = _p21;
                    float4 _1736 = _f1(param_20, param_21);
                    _p21 = _1736;
                }
            }
            else
            {
                float4 param_22 = float4(_434.xyz, smoothstep(_414, 0.0, length(_1629)) * _538);
                float4 param_23 = _p21;
                float4 _1757 = _f1(param_22, param_23);
                _p21 = _1757;
            }
        }
        float _1775 = _443 * (1.0 - smoothstep(_p7 * 0.20000000298023223876953125, _p7 * 0.2857142984867095947265625, _331));
        for (int _t155 = 0; _t155 < 25; _t155++)
        {
            float _1806 = ((((float(_t155) * 13.13000011444091796875) + (_p2.x * 17.0)) + (_p2.y * 31.0)) + (_p8 * 7.0)) + (_p18 * 3.0);
            float param_24 = _1806 + 1.0;
            float param_25 = _1806 + 2.0;
            float param_26 = _1806 + 3.0;
            float param_27 = _1806 + 4.0;
            float _1830 = _f0(param_25) * 6.283185482025146484375;
            float _1834 = (_f0(param_26) * 2.0) - 1.0;
            float _1841 = sqrt(fast::max(0.0, 1.0 - (_1834 * _1834)));
            float2 _1851 = float2(cos(_1830) * _1841, sin(_1830) * _1841);
            float2 _t166 = ((_1851 * (_395 * pow(_f0(param_24), 0.333333313465118408203125))) * _359) + (((fast::normalize(_1851 + float2(0.001000000047497451305389404296875, 0.0)) * _364) * 0.100000001490116119384765625) * _106);
            _t166.y -= (((_364 * _364) * 0.1599999964237213134765625) * _106);
            float2 _1887 = _t166;
            float2 _1888 = _1887 + _p3;
            _t166 = _1888;
            float _1922 = length(_p1 - _1888) / fast::max((0.0199999995529651641845703125 * _106) * ((0.5 + (0.5 + (0.5 * sin(((_337 * 8.3999996185302734375) * 6.283185482025146484375) + (_f0(param_27) * 6.283185482025146484375))))) * 0.699999988079071044921875), 9.9999997473787516355514526367188e-05);
            if (_1922 > 0.5)
            {
                continue;
            }
            float4 param_28 = float4(_p19, ((1.0 - smoothstep(0.300000011920928955078125, 0.5, _1922)) * _1775) * 0.800000011920928955078125);
            float4 param_29 = _p21;
            float4 _1948 = _f1(param_28, param_29);
            _p21 = _1948;
        }
    }
    float4 _1957 = _p21;
    float3 _1959 = _1957.xyz * float3(_p9, _p10, _p11);
    _p21.x = _1959.x;
    _p21.y = _1959.y;
    _p21.z = _1959.z;
}

fragment main0_out main0(main0_in in [[stage_in]], constant buffer_t& buffer, texture2d<float> u_particleTexture_1_1 [[texture(0)]], texture2d<float> u_particleTexture_1_2 [[texture(1)]], texture2d<float> u_particleTexture_2_1 [[texture(2)]], texture2d<float> u_particleTexture_2_2 [[texture(3)]], texture2d<float> u_particleTexture_3_1 [[texture(4)]], texture2d<float> u_particleTexture_3_2 [[texture(5)]], sampler u_particleTexture_1_1Smplr [[sampler(0)]], sampler u_particleTexture_1_2Smplr [[sampler(1)]], sampler u_particleTexture_2_1Smplr [[sampler(2)]], sampler u_particleTexture_2_2Smplr [[sampler(3)]], sampler u_particleTexture_3_1Smplr [[sampler(4)]], sampler u_particleTexture_3_2Smplr [[sampler(5)]])
{
    main0_out out = {};
    float2 _t177 = in.v_uv;
    float _1978 = buffer.u_ScreenParams.x / buffer.u_ScreenParams.y;
    float2 _1986 = float2(_t177.x * _1978, _t177.y);
    float4 _t180 = float4(0.0);
    float4 param_15;
    for (int _t181 = 0; _t181 < 10; _t181++)
    {
        if (_t181 >= buffer.uFireworksCount)
        {
            break;
        }
        if (buffer.uFireworkTime[_t181] < 0.0)
        {
            continue;
        }
        float2 _2027 = float2(buffer.uFireworkCenterX[_t181], buffer.uFireworkCenterY[_t181]);
        float2 _t183 = _2027;
        float2 param = in.v_uv;
        float2 param_1 = _1986;
        float2 param_2 = _2027;
        float2 param_3 = float2(_t183.x * _1978, _t183.y);
        float param_4 = buffer.uUseParticleTex;
        float param_5 = buffer.uFireworkTime[_t181];
        float param_6 = buffer.uLaunchDuration;
        float param_7 = buffer.uExplosionDuration;
        float param_8 = buffer.uFireworkScale[_t181];
        float param_9 = buffer.uGlobalTintR;
        float param_10 = buffer.uGlobalTintG;
        float param_11 = buffer.uGlobalTintB;
        float param_12 = buffer.uFireworkTextureGroup[_t181];
        float3 param_13 = float3(buffer.uFireworkColorInnerR[_t181], buffer.uFireworkColorInnerG[_t181], buffer.uFireworkColorInnerB[_t181]);
        float3 param_14 = float3(buffer.uFireworkColorOuterR[_t181], buffer.uFireworkColorOuterG[_t181], buffer.uFireworkColorOuterB[_t181]);
        _f2(param, param_1, param_2, param_3, param_4, param_5, param_6, param_7, param_8, param_9, param_10, param_11, u_particleTexture_1_1, u_particleTexture_1_1Smplr, u_particleTexture_1_2, u_particleTexture_1_2Smplr, u_particleTexture_2_1, u_particleTexture_2_1Smplr, u_particleTexture_2_2, u_particleTexture_2_2Smplr, u_particleTexture_3_1, u_particleTexture_3_1Smplr, u_particleTexture_3_2, u_particleTexture_3_2Smplr, param_12, param_13, param_14, param_15);
        float4 param_16 = param_15;
        float4 param_17 = _t180;
        float4 _2122 = _f1(param_16, param_17);
        _t180 = _2122;
    }
    out.o_fragColor = _t180;
    return out;
}

