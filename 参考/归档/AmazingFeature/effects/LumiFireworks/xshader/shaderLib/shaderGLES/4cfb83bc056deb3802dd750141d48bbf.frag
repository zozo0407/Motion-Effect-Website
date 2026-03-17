precision highp float;
precision highp int;

uniform mediump sampler2D u_particleTexture_4_1;
uniform mediump sampler2D u_particleTexture_4_2;
uniform mediump sampler2D u_particleTexture_2_1;
uniform mediump sampler2D u_particleTexture_2_2;
uniform mediump sampler2D u_particleTexture_3_1;
uniform mediump sampler2D u_particleTexture_3_2;
uniform vec4 u_ScreenParams;
uniform mediump int uFireworksCount;
uniform float uFireworkTime[3];
uniform float uFireworkCenterX[3];
uniform float uFireworkCenterY[3];
uniform float uUseParticleTex;
uniform float uLaunchDuration;
uniform float uExplosionDuration;
uniform float uFireworkScale[3];
uniform float uGlobalTintR;
uniform float uGlobalTintG;
uniform float uGlobalTintB;
uniform mediump sampler2D u_particleTexture_1_1;
uniform mediump sampler2D u_particleTexture_1_2;
uniform float uFireworkTextureGroup[3];
uniform float uFireworkColorInnerR[3];
uniform float uFireworkColorInnerG[3];
uniform float uFireworkColorInnerB[3];
uniform float uFireworkColorOuterR[3];
uniform float uFireworkColorOuterG[3];
uniform float uFireworkColorOuterB[3];
uniform mediump sampler2D preFirework;

varying vec2 v_uv;

vec4 _f1(vec4 _p0, inout vec4 _p1)
{
    vec4 _84 = _p1;
    vec3 _86 = _84.xyz + (_p0.xyz * _p0.w);
    _p1.x = _86.x;
    _p1.y = _86.y;
    _p1.z = _86.z;
    _p1.w = max(_p1.w, _p0.w);
    return _p1;
}

void _f2(mediump int _p0, float _p1, float _p2, vec3 _p3, float _p4, float _p5, float _p6, float _p7, float _p8, vec2 _p9, vec2 _p10, float _p11, float _p12, inout vec4 _p13)
{
    float _109 = cos(_p6);
    float _112 = sin(_p6);
    vec4 _t15;
    mediump vec4 _281;
    mediump vec4 _301;
    mediump vec4 _316;
    for (mediump int _t3 = 0; _t3 < _p0; _t3++)
    {
        float _131 = (float(_t3) / float(_p0)) * 6.283185482025146484375;
        vec2 _137 = vec2(cos(_131), sin(_131));
        vec2 _t6 = (_137 * _p1) * _p5;
        _t6 = vec2((_109 * _t6.x) - (_112 * _t6.y), (_112 * _t6.x) + (_109 * _t6.y)) + (((_137 * _p7) * 0.02999999932944774627685546875) * _p8);
        _t6.y -= (((_p7 * _p7) * 0.0500000007450580596923828125) * _p8);
        vec2 _184 = _t6;
        vec2 _185 = _184 + _p9;
        _t6 = _185;
        vec2 _t7 = _p10 - _185;
        float _195 = (_131 + _p6) - 1.57079601287841796875;
        float _198 = cos(_195);
        float _201 = sin(_195);
        vec2 _222 = vec2((_198 * _t7.x) + (_201 * _t7.y), ((-_201) * _t7.x) + (_198 * _t7.y));
        if (_p11 > 0.5)
        {
            vec2 _t12 = (_222 / vec2(_p2)) + vec2(0.5);
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
                vec2 _266 = vec2(_t12.x, 1.0 - _t12.y);
                bool _273 = mod(float(_t3), 2.0) == 0.0;
                if (_p12 < 1.5)
                {
                    if (_273)
                    {
                        _281 = texture2D(u_particleTexture_4_1, _266);
                    }
                    else
                    {
                        _281 = texture2D(u_particleTexture_4_2, _266);
                    }
                    _t15 = _281;
                }
                else
                {
                    if (_p12 < 2.5)
                    {
                        if (_273)
                        {
                            _301 = texture2D(u_particleTexture_2_1, _266);
                        }
                        else
                        {
                            _301 = texture2D(u_particleTexture_2_2, _266);
                        }
                        _t15 = _301;
                    }
                    else
                    {
                        if (_273)
                        {
                            _316 = texture2D(u_particleTexture_3_1, _266);
                        }
                        else
                        {
                            _316 = texture2D(u_particleTexture_3_2, _266);
                        }
                        _t15 = _316;
                    }
                }
                vec4 param = vec4(_p3 * _t15.xyz, _t15.w * _p4);
                vec4 param_1 = _p13;
                vec4 _346 = _f1(param, param_1);
                _p13 = _346;
            }
        }
        else
        {
            vec4 param_2 = vec4(_p3, smoothstep(_p2 * 0.5, 0.0, length(_222)) * _p4);
            vec4 param_3 = _p13;
            vec4 _369 = _f1(param_2, param_3);
            _p13 = _369;
        }
    }
}

float _f0(float _p0)
{
    return fract(sin(_p0) * 43758.546875);
}

void _f3(vec2 _p0, vec2 _p1, vec2 _p2, vec2 _p3, float _p4, float _p5, float _p6, float _p7, float _p8, float _p9, float _p10, float _p11, mediump sampler2D _p12, mediump sampler2D _p13, mediump sampler2D _p14, mediump sampler2D _p15, mediump sampler2D _p16, mediump sampler2D _p17, float _p18, vec3 _p19, vec3 _p20, inout vec4 _p21)
{
    if ((_p5 >= (_p6 + _p7)) || (_p5 < 0.0))
    {
        _p21 = vec4(0.0);
        return;
    }
    float _390 = max(0.001000000047497451305389404296875, _p8);
    _p21 = vec4(0.0);
    if (_p5 < _p6)
    {
    }
    else
    {
        float _400 = _p5 - _p6;
        float _406 = clamp(_400 / max(0.001000000047497451305389404296875, _p7), 0.0, 1.0);
        float _415 = smoothstep(0.0, _p7 * 0.14285714924335479736328125, _400);
        float _427 = smoothstep(_p7 * 0.085714288055896759033203125, _p7 * 0.2857142984867095947265625, _400);
        float _430 = _400 * 0.0500000007450580596923828125;
        float _438 = smoothstep(0.0, _p7 * 0.02857142873108386993408203125, _400);
        mediump int param = 45;
        float param_1 = 0.231000006198883056640625 * _390;
        float param_2 = 0.039999999105930328369140625 * _390;
        vec3 param_3 = mix(_p19, _p20, vec3(0.699999988079071044921875));
        float param_4 = _438 * pow(1.0 - smoothstep((_p7 * 0.64999997615814208984375) / 3.5, (_p7 * 0.85000002384185791015625) / 3.5, _400), 1.25);
        float param_5 = _415;
        float param_6 = _430;
        float param_7 = _427;
        float param_8 = _390;
        vec2 param_9 = _p3;
        vec2 param_10 = _p1;
        float param_11 = _p4;
        float param_12 = _p18;
        vec4 param_13 = _p21;
        _f2(param, param_1, param_2, param_3, param_4, param_5, param_6, param_7, param_8, param_9, param_10, param_11, param_12, param_13);
        _p21 = param_13;
        float _496 = 0.30099999904632568359375 * _390;
        mediump int param_14 = 16;
        float param_15 = _496;
        float param_16 = 0.087999999523162841796875 * _390;
        vec3 param_17 = _p20;
        float param_18 = _438 * pow(1.0 - smoothstep((_p7 * 0.699999988079071044921875) / 3.5, (_p7 * 1.0) / 3.5, _400), 1.25);
        float param_19 = _415;
        float param_20 = _430;
        float param_21 = _427;
        float param_22 = _390;
        vec2 param_23 = _p3;
        vec2 param_24 = _p1;
        float param_25 = _p4;
        float param_26 = _p18;
        vec4 param_27 = _p21;
        _f2(param_14, param_15, param_16, param_17, param_18, param_19, param_20, param_21, param_22, param_23, param_24, param_25, param_26, param_27);
        _p21 = param_27;
        float _552 = _438 * (1.0 - smoothstep((_p7 * 0.699999988079071044921875) / 3.5, _p7 / 3.5, _400));
        for (mediump int _t30 = 0; _t30 < 25; _t30++)
        {
            float _576 = ((float(_t30) * 13.13000011444091796875) + (_p2.x * 17.0)) + (_p2.y * 31.0);
            float param_28 = _576 + 1.0;
            float param_29 = _576 + 2.0;
            float param_30 = _576 + 3.0;
            float param_31 = _576 + 4.0;
            float _601 = _f0(param_29) * 6.283185482025146484375;
            float _605 = (_f0(param_30) * 2.0) - 1.0;
            float _612 = sqrt(max(0.0, 1.0 - (_605 * _605)));
            vec2 _622 = vec2(cos(_601) * _612, sin(_601) * _612);
            vec2 _t39 = ((_622 * (_496 * pow(_f0(param_28), 0.333000004291534423828125))) * _415) + (((_622 * _427) * 0.100000001490116119384765625) * _390);
            _t39.y -= (((_427 * _427) * 0.1599999964237213134765625) * _390);
            vec2 _654 = _t39;
            vec2 _655 = _654 + _p3;
            _t39 = _655;
            vec4 param_32 = vec4(_p19, ((1.0 - smoothstep(0.300000011920928955078125, 0.5, length(_p1 - _655) / max(((0.0199999995529651641845703125 * _390) * (0.5 + (0.5 + (0.5 * sin((_406 * 52.700000762939453125) + (_f0(param_31) * 6.280000209808349609375)))))) * 0.699999988079071044921875, 9.9999997473787516355514526367188e-05))) * _552) * 0.800000011920928955078125);
            vec4 param_33 = _p21;
            vec4 _699 = _f1(param_32, param_33);
            _p21 = _699;
        }
    }
    vec4 _706 = _p21;
    vec3 _708 = _706.xyz * vec3(_p9, _p10, _p11);
    _p21.x = _708.x;
    _p21.y = _708.y;
    _p21.z = _708.z;
}

void main()
{
    float _723 = u_ScreenParams.x / u_ScreenParams.y;
    vec2 _734 = vec2(v_uv.x * _723, v_uv.y);
    vec4 _t45 = vec4(0.0);
    bool _739 = uFireworksCount > 0;
    bool _748;
    if (_739)
    {
        _748 = uFireworkTime[0] >= 0.0;
    }
    else
    {
        _748 = _739;
    }
    if (_748)
    {
        vec2 _758 = vec2(uFireworkCenterX[0], uFireworkCenterY[0]);
        vec2 _t46 = _758;
        vec2 param = v_uv;
        vec2 param_1 = _734;
        vec2 param_2 = _758;
        vec2 param_3 = vec2(_t46.x * _723, _t46.y);
        float param_4 = uUseParticleTex;
        float param_5 = uFireworkTime[0];
        float param_6 = uLaunchDuration;
        float param_7 = uExplosionDuration;
        float param_8 = uFireworkScale[0];
        float param_9 = uGlobalTintR;
        float param_10 = uGlobalTintG;
        float param_11 = uGlobalTintB;
        float param_12 = uFireworkTextureGroup[0];
        vec3 param_13 = vec3(uFireworkColorInnerR[0], uFireworkColorInnerG[0], uFireworkColorInnerB[0]);
        vec3 param_14 = vec3(uFireworkColorOuterR[0], uFireworkColorOuterG[0], uFireworkColorOuterB[0]);
        vec4 param_15;
        _f3(param, param_1, param_2, param_3, param_4, param_5, param_6, param_7, param_8, param_9, param_10, param_11, u_particleTexture_1_1, u_particleTexture_1_2, u_particleTexture_2_1, u_particleTexture_2_2, u_particleTexture_3_1, u_particleTexture_3_2, param_12, param_13, param_14, param_15);
        vec4 param_16 = param_15;
        vec4 param_17 = _t45;
        vec4 _834 = _f1(param_16, param_17);
        _t45 = _834;
    }
    bool _836 = uFireworksCount > 1;
    bool _842;
    if (_836)
    {
        _842 = uFireworkTime[1] >= 0.0;
    }
    else
    {
        _842 = _836;
    }
    if (_842)
    {
        vec2 _850 = vec2(uFireworkCenterX[1], uFireworkCenterY[1]);
        vec2 _t48 = _850;
        vec2 param_18 = v_uv;
        vec2 param_19 = _734;
        vec2 param_20 = _850;
        vec2 param_21 = vec2(_t48.x * _723, _t48.y);
        float param_22 = uUseParticleTex;
        float param_23 = uFireworkTime[1];
        float param_24 = uLaunchDuration;
        float param_25 = uExplosionDuration;
        float param_26 = uFireworkScale[1];
        float param_27 = uGlobalTintR;
        float param_28 = uGlobalTintG;
        float param_29 = uGlobalTintB;
        float param_30 = uFireworkTextureGroup[1];
        vec3 param_31 = vec3(uFireworkColorInnerR[1], uFireworkColorInnerG[1], uFireworkColorInnerB[1]);
        vec3 param_32 = vec3(uFireworkColorOuterR[1], uFireworkColorOuterG[1], uFireworkColorOuterB[1]);
        vec4 param_33;
        _f3(param_18, param_19, param_20, param_21, param_22, param_23, param_24, param_25, param_26, param_27, param_28, param_29, u_particleTexture_1_1, u_particleTexture_1_2, u_particleTexture_2_1, u_particleTexture_2_2, u_particleTexture_3_1, u_particleTexture_3_2, param_30, param_31, param_32, param_33);
        vec4 param_34 = param_33;
        vec4 param_35 = _t45;
        vec4 _910 = _f1(param_34, param_35);
        _t45 = _910;
    }
    bool _913 = uFireworksCount > 2;
    bool _919;
    if (_913)
    {
        _919 = uFireworkTime[2] >= 0.0;
    }
    else
    {
        _919 = _913;
    }
    if (_919)
    {
        vec2 _927 = vec2(uFireworkCenterX[2], uFireworkCenterY[2]);
        vec2 _t50 = _927;
        vec2 param_36 = v_uv;
        vec2 param_37 = _734;
        vec2 param_38 = _927;
        vec2 param_39 = vec2(_t50.x * _723, _t50.y);
        float param_40 = uUseParticleTex;
        float param_41 = uFireworkTime[2];
        float param_42 = uLaunchDuration;
        float param_43 = uExplosionDuration;
        float param_44 = uFireworkScale[2];
        float param_45 = uGlobalTintR;
        float param_46 = uGlobalTintG;
        float param_47 = uGlobalTintB;
        float param_48 = uFireworkTextureGroup[2];
        vec3 param_49 = vec3(uFireworkColorInnerR[2], uFireworkColorInnerG[2], uFireworkColorInnerB[2]);
        vec3 param_50 = vec3(uFireworkColorOuterR[2], uFireworkColorOuterG[2], uFireworkColorOuterB[2]);
        vec4 param_51;
        _f3(param_36, param_37, param_38, param_39, param_40, param_41, param_42, param_43, param_44, param_45, param_46, param_47, u_particleTexture_1_1, u_particleTexture_1_2, u_particleTexture_2_1, u_particleTexture_2_2, u_particleTexture_3_1, u_particleTexture_3_2, param_48, param_49, param_50, param_51);
        vec4 param_52 = param_51;
        vec4 param_53 = _t45;
        vec4 _987 = _f1(param_52, param_53);
        _t45 = _987;
    }
    vec4 param_54 = texture2D(preFirework, v_uv);
    vec4 param_55 = _t45;
    vec4 _999 = _f1(param_54, param_55);
    gl_FragData[0] = _999;
}

