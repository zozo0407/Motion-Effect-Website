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

vec4 _f0(vec4 _p0, inout vec4 _p1)
{
    vec4 _73 = _p1;
    vec3 _75 = _73.xyz + (_p0.xyz * _p0.w);
    _p1.x = _75.x;
    _p1.y = _75.y;
    _p1.z = _75.z;
    _p1.w = max(_p1.w, _p0.w);
    return _p1;
}

void _f1(mediump int _p0, float _p1, float _p2, vec3 _p3, float _p4, float _p5, float _p6, float _p7, float _p8, vec2 _p9, vec2 _p10, float _p11, float _p12, inout vec4 _p13)
{
    float _98 = cos(_p6);
    float _101 = sin(_p6);
    vec4 _t15;
    mediump vec4 _270;
    mediump vec4 _290;
    mediump vec4 _305;
    for (mediump int _t3 = 0; _t3 < _p0; _t3++)
    {
        float _120 = (float(_t3) / float(_p0)) * 6.283185482025146484375;
        vec2 _126 = vec2(cos(_120), sin(_120));
        vec2 _t6 = (_126 * _p1) * _p5;
        _t6 = vec2((_98 * _t6.x) - (_101 * _t6.y), (_101 * _t6.x) + (_98 * _t6.y)) + (((_126 * _p7) * 0.02999999932944774627685546875) * _p8);
        _t6.y -= (((_p7 * _p7) * 0.0500000007450580596923828125) * _p8);
        vec2 _173 = _t6;
        vec2 _174 = _173 + _p9;
        _t6 = _174;
        vec2 _t7 = _p10 - _174;
        float _184 = (_120 + _p6) - 1.57079601287841796875;
        float _187 = cos(_184);
        float _190 = sin(_184);
        vec2 _211 = vec2((_187 * _t7.x) + (_190 * _t7.y), ((-_190) * _t7.x) + (_187 * _t7.y));
        if (_p11 > 0.5)
        {
            vec2 _t12 = (_211 / vec2(_p2)) + vec2(0.5);
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
                vec2 _255 = vec2(_t12.x, 1.0 - _t12.y);
                bool _262 = mod(float(_t3), 2.0) == 0.0;
                if (_p12 < 1.5)
                {
                    if (_262)
                    {
                        _270 = texture2D(u_particleTexture_4_1, _255);
                    }
                    else
                    {
                        _270 = texture2D(u_particleTexture_4_2, _255);
                    }
                    _t15 = _270;
                }
                else
                {
                    if (_p12 < 2.5)
                    {
                        if (_262)
                        {
                            _290 = texture2D(u_particleTexture_2_1, _255);
                        }
                        else
                        {
                            _290 = texture2D(u_particleTexture_2_2, _255);
                        }
                        _t15 = _290;
                    }
                    else
                    {
                        if (_262)
                        {
                            _305 = texture2D(u_particleTexture_3_1, _255);
                        }
                        else
                        {
                            _305 = texture2D(u_particleTexture_3_2, _255);
                        }
                        _t15 = _305;
                    }
                }
                vec4 param = vec4(_p3 * _t15.xyz, _t15.w * _p4);
                vec4 param_1 = _p13;
                vec4 _335 = _f0(param, param_1);
                _p13 = _335;
            }
        }
        else
        {
            vec4 param_2 = vec4(_p3, smoothstep(_p2 * 0.5, 0.0, length(_211)) * _p4);
            vec4 param_3 = _p13;
            vec4 _358 = _f0(param_2, param_3);
            _p13 = _358;
        }
    }
}

void _f2(vec2 _p0, vec2 _p1, vec2 _p2, vec2 _p3, float _p4, float _p5, float _p6, float _p7, float _p8, float _p9, float _p10, float _p11, mediump sampler2D _p12, mediump sampler2D _p13, mediump sampler2D _p14, mediump sampler2D _p15, mediump sampler2D _p16, mediump sampler2D _p17, float _p18, vec3 _p19, vec3 _p20, inout vec4 _p21)
{
    if ((_p5 >= (_p6 + _p7)) || (_p5 < 0.0))
    {
        _p21 = vec4(0.0);
        return;
    }
    float _379 = max(0.001000000047497451305389404296875, _p8);
    _p21 = vec4(0.0);
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
        mediump int param = 36;
        float param_1 = 0.122000001370906829833984375 * _379;
        float param_2 = 0.0280000008642673492431640625 * _379;
        vec3 param_3 = _p19;
        float param_4 = _427 * pow(1.0 - smoothstep((_p7 * 0.550000011920928955078125) / 3.5, (_p7 * 0.75) / 3.5, _389), 1.25);
        float param_5 = _404;
        float param_6 = _419;
        float param_7 = _416;
        float param_8 = _379;
        vec2 param_9 = _p3;
        vec2 param_10 = _p1;
        float param_11 = _p4;
        float param_12 = _p18;
        vec4 param_13 = _p21;
        _f1(param, param_1, param_2, param_3, param_4, param_5, param_6, param_7, param_8, param_9, param_10, param_11, param_12, param_13);
        _p21 = param_13;
        mediump int param_14 = 18;
        float param_15 = 0.17499999701976776123046875 * _379;
        float param_16 = 0.0599999986588954925537109375 * _379;
        vec3 param_17 = mix(_p19, _p20, vec3(0.4000000059604644775390625));
        float param_18 = _427 * pow(1.0 - smoothstep((_p7 * 0.60000002384185791015625) / 3.5, (_p7 * 0.800000011920928955078125) / 3.5, _389), 1.25);
        float param_19 = _404;
        float param_20 = _419;
        float param_21 = _416;
        float param_22 = _379;
        vec2 param_23 = _p3;
        vec2 param_24 = _p1;
        float param_25 = _p4;
        float param_26 = _p18;
        vec4 param_27 = _p21;
        _f1(param_14, param_15, param_16, param_17, param_18, param_19, param_20, param_21, param_22, param_23, param_24, param_25, param_26, param_27);
        _p21 = param_27;
    }
    vec4 _535 = _p21;
    vec3 _537 = _535.xyz * vec3(_p9, _p10, _p11);
    _p21.x = _537.x;
    _p21.y = _537.y;
    _p21.z = _537.z;
}

void main()
{
    float _552 = u_ScreenParams.x / u_ScreenParams.y;
    vec2 _563 = vec2(v_uv.x * _552, v_uv.y);
    vec4 _t31 = vec4(0.0);
    bool _568 = uFireworksCount > 0;
    bool _577;
    if (_568)
    {
        _577 = uFireworkTime[0] >= 0.0;
    }
    else
    {
        _577 = _568;
    }
    if (_577)
    {
        vec2 _587 = vec2(uFireworkCenterX[0], uFireworkCenterY[0]);
        vec2 _t32 = _587;
        vec2 param = v_uv;
        vec2 param_1 = _563;
        vec2 param_2 = _587;
        vec2 param_3 = vec2(_t32.x * _552, _t32.y);
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
        _f2(param, param_1, param_2, param_3, param_4, param_5, param_6, param_7, param_8, param_9, param_10, param_11, u_particleTexture_1_1, u_particleTexture_1_2, u_particleTexture_2_1, u_particleTexture_2_2, u_particleTexture_3_1, u_particleTexture_3_2, param_12, param_13, param_14, param_15);
        vec4 param_16 = param_15;
        vec4 param_17 = _t31;
        vec4 _663 = _f0(param_16, param_17);
        _t31 = _663;
    }
    bool _665 = uFireworksCount > 1;
    bool _671;
    if (_665)
    {
        _671 = uFireworkTime[1] >= 0.0;
    }
    else
    {
        _671 = _665;
    }
    if (_671)
    {
        vec2 _679 = vec2(uFireworkCenterX[1], uFireworkCenterY[1]);
        vec2 _t34 = _679;
        vec2 param_18 = v_uv;
        vec2 param_19 = _563;
        vec2 param_20 = _679;
        vec2 param_21 = vec2(_t34.x * _552, _t34.y);
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
        _f2(param_18, param_19, param_20, param_21, param_22, param_23, param_24, param_25, param_26, param_27, param_28, param_29, u_particleTexture_1_1, u_particleTexture_1_2, u_particleTexture_2_1, u_particleTexture_2_2, u_particleTexture_3_1, u_particleTexture_3_2, param_30, param_31, param_32, param_33);
        vec4 param_34 = param_33;
        vec4 param_35 = _t31;
        vec4 _739 = _f0(param_34, param_35);
        _t31 = _739;
    }
    bool _742 = uFireworksCount > 2;
    bool _748;
    if (_742)
    {
        _748 = uFireworkTime[2] >= 0.0;
    }
    else
    {
        _748 = _742;
    }
    if (_748)
    {
        vec2 _756 = vec2(uFireworkCenterX[2], uFireworkCenterY[2]);
        vec2 _t36 = _756;
        vec2 param_36 = v_uv;
        vec2 param_37 = _563;
        vec2 param_38 = _756;
        vec2 param_39 = vec2(_t36.x * _552, _t36.y);
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
        _f2(param_36, param_37, param_38, param_39, param_40, param_41, param_42, param_43, param_44, param_45, param_46, param_47, u_particleTexture_1_1, u_particleTexture_1_2, u_particleTexture_2_1, u_particleTexture_2_2, u_particleTexture_3_1, u_particleTexture_3_2, param_48, param_49, param_50, param_51);
        vec4 param_52 = param_51;
        vec4 param_53 = _t31;
        vec4 _816 = _f0(param_52, param_53);
        _t31 = _816;
    }
    vec4 param_54 = texture2D(preFirework, v_uv);
    vec4 param_55 = _t31;
    vec4 _828 = _f0(param_54, param_55);
    gl_FragData[0] = _828;
}

