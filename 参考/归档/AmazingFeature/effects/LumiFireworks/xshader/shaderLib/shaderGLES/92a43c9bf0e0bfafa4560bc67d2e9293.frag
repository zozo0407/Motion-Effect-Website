precision highp float;
precision highp int;

uniform mediump sampler2D u_picture_1;
uniform mediump sampler2D u_picture_2;
uniform mediump sampler2D u_picture_3;
uniform mediump sampler2D u_picture_4;
uniform mediump sampler2D u_picture_5;
uniform mediump sampler2D u_picture_6;
uniform mediump sampler2D u_picture_7;
uniform mediump sampler2D u_picture_8;
uniform mediump sampler2D u_picture_9;
uniform mediump sampler2D u_picture_10;
uniform mediump sampler2D u_picture_11;
uniform mediump sampler2D u_picture_12;
uniform mediump sampler2D u_picture_13;
uniform mediump sampler2D u_picture_14;
uniform mediump sampler2D u_picture_15;
uniform mediump sampler2D u_fireWork;
uniform vec4 u_ScreenParams;
uniform mediump int uFireworksCount;
uniform float uFireworkTime[3];
uniform float uFireworkCenterX[3];
uniform float uFireworkCenterY[3];
uniform float uLaunchDuration;
uniform float uExplosionDuration;
uniform float uFireworkScale[3];
uniform float uGlobalTintR;
uniform float uGlobalTintG;
uniform float uGlobalTintB;
uniform float uFireworkTextureGroup[3];
uniform float uFireworkColorInnerR[3];
uniform float uFireworkColorInnerG[3];
uniform float uFireworkColorInnerB[3];
uniform float uFireworkColorOuterR[3];
uniform float uFireworkColorOuterG[3];
uniform float uFireworkColorOuterB[3];

varying vec2 v_uv;

vec4 _f1(vec4 _p0, inout vec4 _p1)
{
    vec4 _66 = _p1;
    vec3 _73 = (_p0.xyz * _p0.w) + (_66.xyz * (1.0 - _p0.w));
    _p1.x = _73.x;
    _p1.y = _73.y;
    _p1.z = _73.z;
    _p1.w = max(_p1.w, _p0.w);
    return _p1;
}

float _f2(float _p0)
{
    return 1.0 - ((1.0 - _p0) * (1.0 - _p0));
}

vec4 _f3(mediump int _p0, mediump int _p1, vec2 _p2)
{
    mediump int _111 = (int(mod(float(_p0), 3.0)) * 5) + _p1;
    if (_111 == 0)
    {
        return texture2D(u_picture_1, _p2);
    }
    if (_111 == 1)
    {
        return texture2D(u_picture_2, _p2);
    }
    if (_111 == 2)
    {
        return texture2D(u_picture_3, _p2);
    }
    if (_111 == 3)
    {
        return texture2D(u_picture_4, _p2);
    }
    if (_111 == 4)
    {
        return texture2D(u_picture_5, _p2);
    }
    if (_111 == 5)
    {
        return texture2D(u_picture_6, _p2);
    }
    if (_111 == 6)
    {
        return texture2D(u_picture_7, _p2);
    }
    if (_111 == 7)
    {
        return texture2D(u_picture_8, _p2);
    }
    if (_111 == 8)
    {
        return texture2D(u_picture_9, _p2);
    }
    if (_111 == 9)
    {
        return texture2D(u_picture_10, _p2);
    }
    if (_111 == 10)
    {
        return texture2D(u_picture_11, _p2);
    }
    if (_111 == 11)
    {
        return texture2D(u_picture_12, _p2);
    }
    if (_111 == 12)
    {
        return texture2D(u_picture_13, _p2);
    }
    if (_111 == 13)
    {
        return texture2D(u_picture_14, _p2);
    }
    if (_111 == 14)
    {
        return texture2D(u_picture_15, _p2);
    }
    return texture2D(u_picture_1, _p2);
}

float _f0(float _p0)
{
    return fract(sin(_p0) * 43758.546875);
}

void _f4(vec2 _p0, vec2 _p1, vec2 _p2, vec2 _p3, float _p4, float _p5, float _p6, float _p7, float _p8, float _p9, float _p10, float _p11, vec3 _p12, vec3 _p13, inout vec4 _p14)
{
    if ((_p4 >= (_p5 + _p6)) || (_p4 < 0.0))
    {
        return;
    }
    float _319 = max(0.001000000047497451305389404296875, _p7);
    if (_p4 < _p5)
    {
        float _329 = _p4 / max(0.001000000047497451305389404296875, _p5);
        float _t8 = 1.0;
        if (_329 < 0.800000011920928955078125)
        {
            _t8 = 1.0 - ((_329 / 0.800000011920928955078125) * 0.60000002384185791015625);
        }
        else
        {
            _t8 = 0.4000000059604644775390625;
        }
        vec2 _t12 = _p1 - vec2(_p3.x, (-0.5) + (_329 * (_p2.y - (-0.5))));
        vec2 _t14 = (vec2(_t12.x / 0.2115384638309478759765625, _t12.y) / vec2((0.5 * _319) * _t8)) + vec2(0.5);
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
            mediump vec4 _420 = texture2D(u_fireWork, vec2(_t14.x, 1.0 - _t14.y));
            vec4 _t15 = _420;
            if (_t15.w > 0.00999999977648258209228515625)
            {
                vec4 param = vec4((_420.xyz * vec3(_p8, _p9, _p10)) * _p12, _t15.w);
                vec4 param_1 = _p14;
                vec4 _448 = _f1(param, param_1);
                _p14 = _448;
            }
        }
    }
    else
    {
        float _453 = _p4 - _p5;
        float _460 = clamp(_453 / _p6, 0.0, 1.0);
        float _463 = smoothstep(0.0, 0.5, _460);
        float param_2 = _463;
        float _477 = _319 * (0.100000001490116119384765625 + (0.89999997615814208984375 * _f2(param_2)));
        float _480 = smoothstep(0.0, 0.100000001490116119384765625, _460);
        for (mediump int _t25 = 0; _t25 < 5; _t25++)
        {
            float _t26 = 1.0;
            if (_t25 < 4)
            {
                mediump float _499 = 0.5 + (float(_t25) * 0.0500000007450580596923828125);
                _t26 = 1.0 - smoothstep(_499, _499 + 0.20000000298023223876953125, _460);
            }
            else
            {
                _t26 = 1.0 - smoothstep(0.699999988079071044921875, 1.0, _460);
            }
            float _517 = _480 * _t26;
            if (_517 > 0.00999999977648258209228515625)
            {
                vec3 _t30 = _p12;
                if (_t25 == 2)
                {
                    _t30 = mix(_p12, _p13, vec3(0.4000000059604644775390625));
                }
                else
                {
                    if (_t25 == 3)
                    {
                        _t30 = mix(_p12, _p13, vec3(0.699999988079071044921875));
                    }
                    else
                    {
                        if (_t25 == 4)
                        {
                            _t30 = _p13;
                        }
                    }
                }
                vec2 _t31 = _p1 - _p3;
                float _555 = _453 * 0.0500000007450580596923828125;
                float _558 = cos(_555);
                float _561 = sin(_555);
                vec2 _t37 = (vec2((_t31.x * _558) + (_t31.y * _561), ((-_t31.x) * _561) + (_t31.y * _558)) / vec2(_477)) + vec2(0.5);
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
                    mediump int param_3 = int(_p11);
                    mediump int param_4 = _t25;
                    vec2 param_5 = vec2(_t37.x, 1.0 - _t37.y);
                    vec4 _626 = _f3(param_3, param_4, param_5);
                    vec4 _t38 = _626;
                    float _630 = smoothstep(0.20000000298023223876953125, 0.800000011920928955078125, _t38.w);
                    if (_630 > 0.00999999977648258209228515625)
                    {
                        vec4 param_6 = vec4((_626.xyz * _t30) * vec3(_p8, _p9, _p10), _630 * _517);
                        vec4 param_7 = _p14;
                        vec4 _656 = _f1(param_6, param_7);
                        _p14 = _656;
                    }
                }
            }
        }
        float _661 = _p6 + 3.0;
        float _667 = clamp(_453 / max(0.001000000047497451305389404296875, _661), 0.0, 1.0);
        float _681 = smoothstep(_661 * 0.085714288055896759033203125, _661 * 0.2857142984867095947265625, _453);
        float _694 = _480 * (1.0 - smoothstep((_661 * 0.699999988079071044921875) / 3.5, _661 / 3.5, _453));
        for (mediump int _t46 = 0; _t46 < 25; _t46++)
        {
            float _718 = ((float(_t46) * 13.13000011444091796875) + (_p2.x * 17.0)) + (_p2.y * 31.0);
            float param_8 = _718 + 1.0;
            float param_9 = _718 + 2.0;
            float param_10 = _718 + 3.0;
            float param_11 = _718 + 4.0;
            float _744 = _f0(param_9) * 6.283185482025146484375;
            float _748 = (_f0(param_10) * 2.0) - 1.0;
            float _755 = sqrt(max(0.0, 1.0 - (_748 * _748)));
            vec2 _765 = vec2(cos(_744) * _755, sin(_744) * _755);
            vec2 _t55 = ((_765 * ((0.30099999904632568359375 * _319) * pow(_f0(param_8), 0.333000004291534423828125))) * _463) + (((_765 * _681) * 0.100000001490116119384765625) * _319);
            _t55.y -= (((_681 * _681) * 0.1599999964237213134765625) * _319);
            vec2 _798 = _t55;
            vec2 _799 = _798 + _p3;
            _t55 = _799;
            vec4 param_12 = vec4(_p12, ((1.0 - smoothstep(0.300000011920928955078125, 0.5, length(_p1 - _799) / max(((0.0199999995529651641845703125 * _319) * (0.5 + (0.5 + (0.5 * sin((_667 * 52.700000762939453125) + (_f0(param_11) * 6.280000209808349609375)))))) * 0.699999988079071044921875, 9.9999997473787516355514526367188e-05))) * _694) * 0.800000011920928955078125);
            vec4 param_13 = _p14;
            vec4 _842 = _f1(param_12, param_13);
            _p14 = _842;
        }
    }
    vec4 _849 = _p14;
    vec3 _851 = _849.xyz * vec3(_p8, _p9, _p10);
    _p14.x = _851.x;
    _p14.y = _851.y;
    _p14.z = _851.z;
}

void main()
{
    float _866 = u_ScreenParams.x / u_ScreenParams.y;
    vec2 _877 = vec2(v_uv.x * _866, v_uv.y);
    vec4 _t61 = vec4(0.0);
    bool _883 = uFireworksCount > 0;
    bool _892;
    if (_883)
    {
        _892 = uFireworkTime[0] >= 0.0;
    }
    else
    {
        _892 = _883;
    }
    if (_892)
    {
        vec2 _902 = vec2(uFireworkCenterX[0], uFireworkCenterY[0]);
        vec2 _t62 = _902;
        vec2 param = v_uv;
        vec2 param_1 = _877;
        vec2 param_2 = _902;
        vec2 param_3 = vec2(_t62.x * _866, _t62.y);
        float param_4 = uFireworkTime[0];
        float param_5 = uLaunchDuration;
        float param_6 = uExplosionDuration;
        float param_7 = uFireworkScale[0];
        float param_8 = uGlobalTintR;
        float param_9 = uGlobalTintG;
        float param_10 = uGlobalTintB;
        float param_11 = uFireworkTextureGroup[0];
        vec3 param_12 = vec3(uFireworkColorInnerR[0], uFireworkColorInnerG[0], uFireworkColorInnerB[0]);
        vec3 param_13 = vec3(uFireworkColorOuterR[0], uFireworkColorOuterG[0], uFireworkColorOuterB[0]);
        vec4 param_14 = _t61;
        _f4(param, param_1, param_2, param_3, param_4, param_5, param_6, param_7, param_8, param_9, param_10, param_11, param_12, param_13, param_14);
        _t61 = param_14;
    }
    bool _970 = uFireworksCount > 1;
    bool _976;
    if (_970)
    {
        _976 = uFireworkTime[1] >= 0.0;
    }
    else
    {
        _976 = _970;
    }
    if (_976)
    {
        vec2 _984 = vec2(uFireworkCenterX[1], uFireworkCenterY[1]);
        vec2 _t63 = _984;
        vec2 param_15 = v_uv;
        vec2 param_16 = _877;
        vec2 param_17 = _984;
        vec2 param_18 = vec2(_t63.x * _866, _t63.y);
        float param_19 = uFireworkTime[1];
        float param_20 = uLaunchDuration;
        float param_21 = uExplosionDuration;
        float param_22 = uFireworkScale[1];
        float param_23 = uGlobalTintR;
        float param_24 = uGlobalTintG;
        float param_25 = uGlobalTintB;
        float param_26 = uFireworkTextureGroup[1];
        vec3 param_27 = vec3(uFireworkColorInnerR[1], uFireworkColorInnerG[1], uFireworkColorInnerB[1]);
        vec3 param_28 = vec3(uFireworkColorOuterR[1], uFireworkColorOuterG[1], uFireworkColorOuterB[1]);
        vec4 param_29 = _t61;
        _f4(param_15, param_16, param_17, param_18, param_19, param_20, param_21, param_22, param_23, param_24, param_25, param_26, param_27, param_28, param_29);
        _t61 = param_29;
    }
    bool _1039 = uFireworksCount > 2;
    bool _1045;
    if (_1039)
    {
        _1045 = uFireworkTime[2] >= 0.0;
    }
    else
    {
        _1045 = _1039;
    }
    if (_1045)
    {
        vec2 _1053 = vec2(uFireworkCenterX[2], uFireworkCenterY[2]);
        vec2 _t64 = _1053;
        vec2 param_30 = v_uv;
        vec2 param_31 = _877;
        vec2 param_32 = _1053;
        vec2 param_33 = vec2(_t64.x * _866, _t64.y);
        float param_34 = uFireworkTime[2];
        float param_35 = uLaunchDuration;
        float param_36 = uExplosionDuration;
        float param_37 = uFireworkScale[2];
        float param_38 = uGlobalTintR;
        float param_39 = uGlobalTintG;
        float param_40 = uGlobalTintB;
        float param_41 = uFireworkTextureGroup[2];
        vec3 param_42 = vec3(uFireworkColorInnerR[2], uFireworkColorInnerG[2], uFireworkColorInnerB[2]);
        vec3 param_43 = vec3(uFireworkColorOuterR[2], uFireworkColorOuterG[2], uFireworkColorOuterB[2]);
        vec4 param_44 = _t61;
        _f4(param_30, param_31, param_32, param_33, param_34, param_35, param_36, param_37, param_38, param_39, param_40, param_41, param_42, param_43, param_44);
        _t61 = param_44;
    }
    gl_FragData[0] = _t61;
}

