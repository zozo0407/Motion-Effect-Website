precision highp float;
precision highp int;

uniform vec4 u_ScreenParams;
uniform mediump int uFireworksCount;
uniform float uFireworkTime[10];
uniform float uFireworkCenterX[10];
uniform float uFireworkCenterY[10];
uniform float uFireworkScale[10];
uniform float uFireworkColorInnerR[10];
uniform float uFireworkColorInnerG[10];
uniform float uFireworkColorInnerB[10];
uniform float uFireworkColorOuterR[10];
uniform float uFireworkColorOuterG[10];
uniform float uFireworkColorOuterB[10];
uniform float uUseParticleTex;
uniform float uLaunchDuration;
uniform float uExplosionDuration;
uniform float uGlobalTintR;
uniform float uGlobalTintG;
uniform float uGlobalTintB;
uniform mediump sampler2D u_particleTexture_1_1;
uniform mediump sampler2D u_particleTexture_1_2;
uniform mediump sampler2D u_particleTexture_2_1;
uniform mediump sampler2D u_particleTexture_2_2;
uniform mediump sampler2D u_particleTexture_3_1;
uniform mediump sampler2D u_particleTexture_3_2;
uniform float uFireworkTextureGroup[10];

varying vec2 v_uv;

vec4 _f1(vec4 _p0, inout vec4 _p1)
{
    vec4 _65 = _p1;
    vec3 _67 = _65.xyz + (_p0.xyz * _p0.w);
    _p1.x = _67.x;
    _p1.y = _67.y;
    _p1.z = _67.z;
    _p1.w = max(_p1.w, _p0.w);
    return _p1;
}

float _f0(float _p0)
{
    return fract(sin(_p0) * 43758.546875);
}

void _f2(vec2 _p0, vec2 _p1, vec2 _p2, vec2 _p3, float _p4, float _p5, float _p6, float _p7, float _p8, float _p9, float _p10, float _p11, mediump sampler2D _p12, mediump sampler2D _p13, mediump sampler2D _p14, mediump sampler2D _p15, mediump sampler2D _p16, mediump sampler2D _p17, float _p18, vec3 _p19, vec3 _p20, inout vec4 _p21)
{
    if (_p5 >= (_p6 + _p7))
    {
        _p21 = vec4(0.0);
        return;
    }
    _p21 = vec4(0.0);
    float _106 = max(0.001000000047497451305389404296875, _p8);
    if (_p5 < _p6)
    {
        float _116 = _p5 / max(0.001000000047497451305389404296875, _p6);
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
        for (mediump int _t14 = 0; _t14 < 2; _t14++)
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
            vec2 _t20 = _p1 - vec2(_p3.x, _128 + _185);
            vec2 _230 = vec2((1.0 * _t20.x) - (0.0 * _t20.y), (0.0 * _t20.x) + (1.0 * _t20.y));
            if (_p4 > 0.5)
            {
                vec2 _t25 = (_230 / vec2(_149)) + vec2(0.5);
                vec2 _249 = vec2(_t25.x, 1.0 - _t25.y);
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
                    vec4 _t27 = texture2D(_p12, _249);
                    if (mod(float(_t14), 2.0) == 0.0)
                    {
                        _t27 = texture2D(_p13, _249);
                    }
                    vec4 param = vec4(_p19 * _t27.xyz, _t27.w * 1.0);
                    vec4 param_1 = _p21;
                    vec4 _304 = _f1(param, param_1);
                    _p21 = _304;
                }
            }
            else
            {
                vec4 param_2 = vec4(_p19, smoothstep(_149, 0.0, length(_230)) * 1.0);
                vec4 param_3 = _p21;
                vec4 _324 = _f1(param_2, param_3);
                _p21 = _324;
            }
        }
    }
    else
    {
        float _331 = _p5 - _p6;
        float _337 = clamp(_331 / max(0.001000000047497451305389404296875, _p7), 0.0, 1.0);
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
        vec3 _423 = mix(_p19, _p20, vec3(0.4000000059604644775390625));
        vec3 _428 = mix(_p19, _p20, vec3(0.699999988079071044921875));
        vec4 _434 = vec4(_p20, 1.0);
        float _443 = smoothstep(0.0, _p7 * 0.02857142873108386993408203125, _331);
        float _522 = _443 * pow(1.0 - smoothstep(_p7 * 0.14285714924335479736328125, _p7 * 0.20000000298023223876953125, _331), 1.25);
        float _526 = _443 * pow(1.0 - smoothstep(_p7 * 0.15714286267757415771484375, _p7 * 0.21428571641445159912109375, _331), 1.25);
        float _530 = _443 * pow(1.0 - smoothstep(_p7 * 0.17142857611179351806640625, _p7 * 0.22857142984867095947265625, _331), 1.25);
        float _534 = _443 * pow(1.0 - smoothstep(_p7 * 0.1857142746448516845703125, _p7 * 0.24285714328289031982421875, _331), 1.25);
        float _538 = _443 * pow(1.0 - smoothstep(_p7 * 0.20000000298023223876953125, _p7 * 0.2857142984867095947265625, _331), 1.25);
        vec4 _t85;
        for (mediump int _t73 = 0; _t73 < 12; _t73++)
        {
            float _565 = (float(_t73) / 12.0) * 6.283185482025146484375;
            vec2 _571 = vec2(cos(_565), sin(_565));
            vec2 _t76 = (_571 * _375) * _359;
            float _580 = cos(_369);
            float _583 = sin(_369);
            _t76 = vec2((_580 * _t76.x) - (_583 * _t76.y), (_583 * _t76.x) + (_580 * _t76.y)) + (((normalize(_571) * _364) * 0.02999999932944774627685546875) * _106);
            _t76.y -= (((_364 * _364) * 0.0500000007450580596923828125) * _106);
            vec2 _624 = _t76;
            vec2 _625 = _624 + _p3;
            _t76 = _625;
            vec2 _t79 = _p1 - _625;
            float _635 = _565 - 1.57079637050628662109375;
            float _636 = cos(_635);
            float _642 = sin(_635);
            vec2 _663 = vec2((_636 * _t79.x) + (_642 * _t79.y), ((-_642) * _t79.x) + (_636 * _t79.y));
            if (_p4 > 0.5)
            {
                vec2 _t83 = (_663 / vec2(_399)) + vec2(0.5);
                vec2 _681 = vec2(_t83.x, 1.0 - _t83.y);
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
                        _t85 = texture2D(_p13, _681);
                        if (mod(float(_t73), 2.0) == 0.0)
                        {
                            _t85 = texture2D(_p12, _681);
                        }
                    }
                    else
                    {
                        if (_p18 < 2.5)
                        {
                            _t85 = texture2D(_p15, _681);
                            if (mod(float(_t73), 2.0) == 0.0)
                            {
                                _t85 = texture2D(_p14, _681);
                            }
                        }
                        else
                        {
                            _t85 = texture2D(_p17, _681);
                            if (mod(float(_t73), 2.0) == 0.0)
                            {
                                _t85 = texture2D(_p16, _681);
                            }
                        }
                    }
                    vec4 param_4 = vec4(_p19 * _t85.xyz, _t85.w * _522);
                    vec4 param_5 = _p21;
                    vec4 _771 = _f1(param_4, param_5);
                    _p21 = _771;
                }
            }
            else
            {
                vec4 param_6 = vec4(_p19, smoothstep(_399, 0.0, length(_663)) * _522);
                vec4 param_7 = _p21;
                vec4 _791 = _f1(param_6, param_7);
                _p21 = _791;
            }
        }
        vec4 _t101;
        for (mediump int _t89 = 0; _t89 < 36; _t89++)
        {
            float _810 = (float(_t89) / 36.0) * 6.283185482025146484375;
            vec2 _816 = vec2(cos(_810), sin(_810));
            vec2 _t92 = (_816 * _380) * _359;
            float _825 = cos(_369);
            float _828 = sin(_369);
            _t92 = vec2((_825 * _t92.x) - (_828 * _t92.y), (_828 * _t92.x) + (_825 * _t92.y)) + (((normalize(_816) * _364) * 0.02999999932944774627685546875) * _106);
            _t92.y -= (((_364 * _364) * 0.0500000007450580596923828125) * _106);
            vec2 _868 = _t92;
            vec2 _869 = _868 + _p3;
            _t92 = _869;
            vec2 _t95 = _p1 - _869;
            float _878 = _810 - 1.57079637050628662109375;
            float _879 = cos(_878);
            float _885 = sin(_878);
            vec2 _906 = vec2((_879 * _t95.x) + (_885 * _t95.y), ((-_885) * _t95.x) + (_879 * _t95.y));
            if (_p4 > 0.5)
            {
                vec2 _t99 = (_906 / vec2(_403)) + vec2(0.5);
                vec2 _924 = vec2(_t99.x, 1.0 - _t99.y);
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
                        _t101 = texture2D(_p13, _924);
                        if (mod(float(_t89), 2.0) == 0.0)
                        {
                            _t101 = texture2D(_p12, _924);
                        }
                    }
                    else
                    {
                        if (_p18 < 2.5)
                        {
                            _t101 = texture2D(_p15, _924);
                            if (mod(float(_t89), 2.0) == 0.0)
                            {
                                _t101 = texture2D(_p14, _924);
                            }
                        }
                        else
                        {
                            _t101 = texture2D(_p17, _924);
                            if (mod(float(_t89), 2.0) == 0.0)
                            {
                                _t101 = texture2D(_p16, _924);
                            }
                        }
                    }
                    vec4 param_8 = vec4(_p19 * _t101.xyz, _t101.w * _526);
                    vec4 param_9 = _p21;
                    vec4 _1012 = _f1(param_8, param_9);
                    _p21 = _1012;
                }
            }
            else
            {
                vec4 param_10 = vec4(_p19, smoothstep(_403, 0.0, length(_906)) * _526);
                vec4 param_11 = _p21;
                vec4 _1032 = _f1(param_10, param_11);
                _p21 = _1032;
            }
        }
        vec4 _t117;
        for (mediump int _t105 = 0; _t105 < 18; _t105++)
        {
            float _1051 = (float(_t105) / 18.0) * 6.283185482025146484375;
            vec2 _1057 = vec2(cos(_1051), sin(_1051));
            vec2 _t108 = (_1057 * _385) * _359;
            float _1066 = cos(_369);
            float _1069 = sin(_369);
            _t108 = vec2((_1066 * _t108.x) - (_1069 * _t108.y), (_1069 * _t108.x) + (_1066 * _t108.y)) + (((normalize(_1057) * _364) * 0.02999999932944774627685546875) * _106);
            _t108.y -= (((_364 * _364) * 0.0500000007450580596923828125) * _106);
            vec2 _1109 = _t108;
            vec2 _1110 = _1109 + _p3;
            _t108 = _1110;
            vec2 _t111 = _p1 - _1110;
            float _1119 = _1051 - 1.57079637050628662109375;
            float _1120 = cos(_1119);
            float _1126 = sin(_1119);
            vec2 _1147 = vec2((_1120 * _t111.x) + (_1126 * _t111.y), ((-_1126) * _t111.x) + (_1120 * _t111.y));
            if (_p4 > 0.5)
            {
                vec2 _t115 = (_1147 / vec2(_407)) + vec2(0.5);
                vec2 _1165 = vec2(_t115.x, 1.0 - _t115.y);
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
                        _t117 = texture2D(_p13, _1165);
                        if (mod(float(_t105), 2.0) == 0.0)
                        {
                            _t117 = texture2D(_p12, _1165);
                        }
                    }
                    else
                    {
                        if (_p18 < 2.5)
                        {
                            _t117 = texture2D(_p15, _1165);
                            if (mod(float(_t105), 2.0) == 0.0)
                            {
                                _t117 = texture2D(_p14, _1165);
                            }
                        }
                        else
                        {
                            _t117 = texture2D(_p17, _1165);
                            if (mod(float(_t105), 2.0) == 0.0)
                            {
                                _t117 = texture2D(_p16, _1165);
                            }
                        }
                    }
                    vec4 param_12 = vec4(_423 * _t117.xyz, _t117.w * _530);
                    vec4 param_13 = _p21;
                    vec4 _1253 = _f1(param_12, param_13);
                    _p21 = _1253;
                }
            }
            else
            {
                vec4 param_14 = vec4(_423, smoothstep(_407, 0.0, length(_1147)) * _530);
                vec4 param_15 = _p21;
                vec4 _1273 = _f1(param_14, param_15);
                _p21 = _1273;
            }
        }
        vec4 _t133;
        for (mediump int _t121 = 0; _t121 < 45; _t121++)
        {
            float _1292 = (float(_t121) / 45.0) * 6.283185482025146484375;
            vec2 _1298 = vec2(cos(_1292), sin(_1292));
            vec2 _t124 = (_1298 * _390) * _359;
            float _1307 = cos(_369);
            float _1310 = sin(_369);
            _t124 = vec2((_1307 * _t124.x) - (_1310 * _t124.y), (_1310 * _t124.x) + (_1307 * _t124.y)) + (((normalize(_1298) * _364) * 0.02999999932944774627685546875) * _106);
            _t124.y -= (((_364 * _364) * 0.0500000007450580596923828125) * _106);
            vec2 _1350 = _t124;
            vec2 _1351 = _1350 + _p3;
            _t124 = _1351;
            vec2 _t127 = _p1 - _1351;
            float _1360 = _1292 - 1.57079637050628662109375;
            float _1361 = cos(_1360);
            float _1367 = sin(_1360);
            vec2 _1388 = vec2((_1361 * _t127.x) + (_1367 * _t127.y), ((-_1367) * _t127.x) + (_1361 * _t127.y));
            if (_p4 > 0.5)
            {
                vec2 _t131 = (_1388 / vec2(_399)) + vec2(0.5);
                vec2 _1406 = vec2(_t131.x, 1.0 - _t131.y);
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
                        _t133 = texture2D(_p13, _1406);
                        if (mod(float(_t121), 2.0) == 0.0)
                        {
                            _t133 = texture2D(_p12, _1406);
                        }
                    }
                    else
                    {
                        if (_p18 < 2.5)
                        {
                            _t133 = texture2D(_p15, _1406);
                            if (mod(float(_t121), 2.0) == 0.0)
                            {
                                _t133 = texture2D(_p14, _1406);
                            }
                        }
                        else
                        {
                            _t133 = texture2D(_p17, _1406);
                            if (mod(float(_t121), 2.0) == 0.0)
                            {
                                _t133 = texture2D(_p16, _1406);
                            }
                        }
                    }
                    vec4 param_16 = vec4(_428 * _t133.xyz, _t133.w * _534);
                    vec4 param_17 = _p21;
                    vec4 _1494 = _f1(param_16, param_17);
                    _p21 = _1494;
                }
            }
            else
            {
                vec4 param_18 = vec4(_428, smoothstep(_399, 0.0, length(_1388)) * _534);
                vec4 param_19 = _p21;
                vec4 _1514 = _f1(param_18, param_19);
                _p21 = _1514;
            }
        }
        vec4 _t149;
        for (mediump int _t137 = 0; _t137 < 16; _t137++)
        {
            float _1533 = (float(_t137) / 16.0) * 6.283185482025146484375;
            vec2 _1539 = vec2(cos(_1533), sin(_1533));
            vec2 _t140 = (_1539 * _395) * _359;
            float _1548 = cos(_369);
            float _1551 = sin(_369);
            _t140 = vec2((_1548 * _t140.x) - (_1551 * _t140.y), (_1551 * _t140.x) + (_1548 * _t140.y)) + (((normalize(_1539) * _364) * 0.02999999932944774627685546875) * _106);
            _t140.y -= (((_364 * _364) * 0.0500000007450580596923828125) * _106);
            vec2 _1591 = _t140;
            vec2 _1592 = _1591 + _p3;
            _t140 = _1592;
            vec2 _t143 = _p1 - _1592;
            float _1601 = _1533 - 1.57079637050628662109375;
            float _1602 = cos(_1601);
            float _1608 = sin(_1601);
            vec2 _1629 = vec2((_1602 * _t143.x) + (_1608 * _t143.y), ((-_1608) * _t143.x) + (_1602 * _t143.y));
            if (_p4 > 0.5)
            {
                vec2 _t147 = (_1629 / vec2(_414)) + vec2(0.5);
                vec2 _1647 = vec2(_t147.x, 1.0 - _t147.y);
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
                        _t149 = texture2D(_p13, _1647);
                        if (mod(float(_t137), 2.0) == 0.0)
                        {
                            _t149 = texture2D(_p12, _1647);
                        }
                    }
                    else
                    {
                        if (_p18 < 2.5)
                        {
                            _t149 = texture2D(_p15, _1647);
                            if (mod(float(_t137), 2.0) == 0.0)
                            {
                                _t149 = texture2D(_p14, _1647);
                            }
                        }
                        else
                        {
                            _t149 = texture2D(_p17, _1647);
                            if (mod(float(_t137), 2.0) == 0.0)
                            {
                                _t149 = texture2D(_p16, _1647);
                            }
                        }
                    }
                    vec4 param_20 = vec4(_434.xyz * _t149.xyz, _t149.w * _538);
                    vec4 param_21 = _p21;
                    vec4 _1736 = _f1(param_20, param_21);
                    _p21 = _1736;
                }
            }
            else
            {
                vec4 param_22 = vec4(_434.xyz, smoothstep(_414, 0.0, length(_1629)) * _538);
                vec4 param_23 = _p21;
                vec4 _1757 = _f1(param_22, param_23);
                _p21 = _1757;
            }
        }
        float _1775 = _443 * (1.0 - smoothstep(_p7 * 0.20000000298023223876953125, _p7 * 0.2857142984867095947265625, _331));
        for (mediump int _t155 = 0; _t155 < 25; _t155++)
        {
            float _1806 = ((((float(_t155) * 13.13000011444091796875) + (_p2.x * 17.0)) + (_p2.y * 31.0)) + (_p8 * 7.0)) + (_p18 * 3.0);
            float param_24 = _1806 + 1.0;
            float param_25 = _1806 + 2.0;
            float param_26 = _1806 + 3.0;
            float param_27 = _1806 + 4.0;
            float _1830 = _f0(param_25) * 6.283185482025146484375;
            float _1834 = (_f0(param_26) * 2.0) - 1.0;
            float _1841 = sqrt(max(0.0, 1.0 - (_1834 * _1834)));
            vec2 _1851 = vec2(cos(_1830) * _1841, sin(_1830) * _1841);
            vec2 _t166 = ((_1851 * (_395 * pow(_f0(param_24), 0.333333313465118408203125))) * _359) + (((normalize(_1851 + vec2(0.001000000047497451305389404296875, 0.0)) * _364) * 0.100000001490116119384765625) * _106);
            _t166.y -= (((_364 * _364) * 0.1599999964237213134765625) * _106);
            vec2 _1887 = _t166;
            vec2 _1888 = _1887 + _p3;
            _t166 = _1888;
            float _1922 = length(_p1 - _1888) / max((0.0199999995529651641845703125 * _106) * ((0.5 + (0.5 + (0.5 * sin(((_337 * 8.3999996185302734375) * 6.283185482025146484375) + (_f0(param_27) * 6.283185482025146484375))))) * 0.699999988079071044921875), 9.9999997473787516355514526367188e-05);
            if (_1922 > 0.5)
            {
                continue;
            }
            vec4 param_28 = vec4(_p19, ((1.0 - smoothstep(0.300000011920928955078125, 0.5, _1922)) * _1775) * 0.800000011920928955078125);
            vec4 param_29 = _p21;
            vec4 _1948 = _f1(param_28, param_29);
            _p21 = _1948;
        }
    }
    vec4 _1957 = _p21;
    vec3 _1959 = _1957.xyz * vec3(_p9, _p10, _p11);
    _p21.x = _1959.x;
    _p21.y = _1959.y;
    _p21.z = _1959.z;
}

void main()
{
    vec2 _t177 = v_uv;
    float _1978 = u_ScreenParams.x / u_ScreenParams.y;
    vec2 _1986 = vec2(_t177.x * _1978, _t177.y);
    vec4 _t180 = vec4(0.0);
    vec4 param_15;
    for (mediump int _t181 = 0; _t181 < 10; _t181++)
    {
        if (_t181 >= uFireworksCount)
        {
            break;
        }
        if (uFireworkTime[_t181] < 0.0)
        {
            continue;
        }
        vec2 _2027 = vec2(uFireworkCenterX[_t181], uFireworkCenterY[_t181]);
        vec2 _t183 = _2027;
        vec2 param = v_uv;
        vec2 param_1 = _1986;
        vec2 param_2 = _2027;
        vec2 param_3 = vec2(_t183.x * _1978, _t183.y);
        float param_4 = uUseParticleTex;
        float param_5 = uFireworkTime[_t181];
        float param_6 = uLaunchDuration;
        float param_7 = uExplosionDuration;
        float param_8 = uFireworkScale[_t181];
        float param_9 = uGlobalTintR;
        float param_10 = uGlobalTintG;
        float param_11 = uGlobalTintB;
        float param_12 = uFireworkTextureGroup[_t181];
        vec3 param_13 = vec3(uFireworkColorInnerR[_t181], uFireworkColorInnerG[_t181], uFireworkColorInnerB[_t181]);
        vec3 param_14 = vec3(uFireworkColorOuterR[_t181], uFireworkColorOuterG[_t181], uFireworkColorOuterB[_t181]);
        _f2(param, param_1, param_2, param_3, param_4, param_5, param_6, param_7, param_8, param_9, param_10, param_11, u_particleTexture_1_1, u_particleTexture_1_2, u_particleTexture_2_1, u_particleTexture_2_2, u_particleTexture_3_1, u_particleTexture_3_2, param_12, param_13, param_14, param_15);
        vec4 param_16 = param_15;
        vec4 param_17 = _t180;
        vec4 _2122 = _f1(param_16, param_17);
        _t180 = _2122;
    }
    gl_FragData[0] = _t180;
}

