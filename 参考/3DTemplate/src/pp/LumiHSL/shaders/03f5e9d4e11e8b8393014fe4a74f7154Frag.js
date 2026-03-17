exports.source = `
precision highp float;
precision highp int;

uniform vec3 hsl_param_0;
uniform vec3 hsl_param_1;
uniform vec3 hsl_param_2;
uniform vec3 hsl_param_3;
uniform vec3 hsl_param_4;
uniform vec3 hsl_param_5;
uniform vec3 hsl_param_6;
uniform vec3 hsl_param_7;
uniform mediump sampler2D inputImageTexture;

varying vec2 uv0;

vec3 _f0(vec3 _p0)
{
    float _t0 = 0.0;
    float _t1 = 0.0;
    float _57 = max(_p0.x, max(_p0.y, _p0.z));
    float _63 = min(_p0.x, min(_p0.y, _p0.z));
    float _67 = _57 - _63;
    float _70 = _57 + _63;
    float _72 = _70 / 2.0;
    if (_67 == 0.0)
    {
        _t1 = 0.0;
        _t0 = 0.0;
    }
    else
    {
        if (_72 <= 0.5)
        {
            _t1 = _67 / _70;
        }
        else
        {
            _t1 = _67 / (2.0 - _70);
        }
        if (_57 == _p0.x)
        {
            if (_p0.y >= _p0.z)
            {
                _t0 = (60.0 * (_p0.y - _p0.z)) / _67;
            }
            else
            {
                _t0 = ((60.0 * (_p0.y - _p0.z)) / _67) + 360.0;
            }
        }
        else
        {
            if (_57 == _p0.y)
            {
                _t0 = ((60.0 * (_p0.z - _p0.x)) / _67) + 120.0;
            }
            else
            {
                _t0 = ((60.0 * (_p0.x - _p0.y)) / _67) + 240.0;
            }
        }
    }
    return vec3(_t0, _t1, _72);
}

vec3 _f3(float _p0, float _p1, float _p2, float _p3, float _p4, float _p5, float _p6, float _p7, inout vec3 _p8)
{
    if (((_p4 < _p5) && (_p5 > _p6)) && (_p6 < _p7))
    {
        if ((_p0 >= _p5) && (_p0 <= 360.0))
        {
            _p8.x += _p1;
            _p8.y += _p2;
            _p8.z += _p3;
            return _p8;
        }
        if ((_p0 >= 0.0) && (_p0 <= _p6))
        {
            _p8.x += _p1;
            _p8.y += _p2;
            _p8.z += _p3;
            return _p8;
        }
        if ((_p0 >= _p4) && (_p0 <= _p5))
        {
            _p8.x += ((_p1 * (_p0 - _p4)) / (_p5 - _p4));
            _p8.y += ((_p2 * (_p0 - _p4)) / (_p5 - _p4));
            _p8.z += ((_p3 * (_p0 - _p4)) / (_p5 - _p4));
            return _p8;
        }
        if ((_p0 >= _p6) && (_p0 <= _p7))
        {
            _p8.x += ((_p1 * (_p7 - _p0)) / (_p7 - _p6));
            _p8.y += ((_p2 * (_p7 - _p0)) / (_p7 - _p6));
            _p8.z += ((_p3 * (_p7 - _p0)) / (_p7 - _p6));
            return _p8;
        }
    }
    if (((_p4 > _p5) && (_p5 < _p6)) && (_p6 < _p7))
    {
        if ((_p0 >= _p5) && (_p0 <= _p6))
        {
            _p8.x += _p1;
            _p8.y += _p2;
            _p8.z += _p3;
            return _p8;
        }
        if ((_p0 >= 0.0) && (_p0 <= _p5))
        {
            _p8.x += ((_p1 * ((_p0 + 360.0) - _p4)) / ((_p5 + 360.0) - _p4));
            _p8.y += ((_p2 * ((_p0 + 360.0) - _p4)) / ((_p5 + 360.0) - _p4));
            _p8.z += ((_p3 * ((_p0 + 360.0) - _p4)) / ((_p5 + 360.0) - _p4));
            return _p8;
        }
        if ((_p0 >= _p4) && (_p0 <= 360.0))
        {
            _p8.x += ((_p1 * (_p0 - _p4)) / ((_p5 + 360.0) - _p4));
            _p8.y += ((_p2 * (_p0 - _p4)) / ((_p5 + 360.0) - _p4));
            _p8.z += ((_p3 * (_p0 - _p4)) / ((_p5 + 360.0) - _p4));
            return _p8;
        }
        if ((_p0 >= _p6) && (_p0 <= _p7))
        {
            _p8.x += ((_p1 * (_p7 - _p0)) / (_p7 - _p6));
            _p8.y += ((_p2 * (_p7 - _p0)) / (_p7 - _p6));
            _p8.z += ((_p3 * (_p7 - _p0)) / (_p7 - _p6));
            return _p8;
        }
    }
    if (((_p4 <= _p5) && (_p5 < _p6)) && (_p6 <= _p7))
    {
        if ((_p0 >= _p5) && (_p0 <= _p6))
        {
            _p8.x += _p1;
            _p8.y += _p2;
            _p8.z += _p3;
            return _p8;
        }
        if ((_p0 >= _p4) && (_p0 <= _p5))
        {
            _p8.x += ((_p1 * (_p0 - _p4)) / (_p5 - _p4));
            _p8.y += ((_p2 * (_p0 - _p4)) / (_p5 - _p4));
            _p8.z += ((_p3 * (_p0 - _p4)) / (_p5 - _p4));
            return _p8;
        }
        if ((_p0 >= _p6) && (_p0 <= _p7))
        {
            _p8.x += ((_p1 * (_p7 - _p0)) / (_p7 - _p6));
            _p8.y += ((_p2 * (_p7 - _p0)) / (_p7 - _p6));
            _p8.z += ((_p3 * (_p7 - _p0)) / (_p7 - _p6));
            return _p8;
        }
    }
    if (((_p4 < _p5) && (_p5 < _p6)) && (_p6 > _p7))
    {
        if ((_p0 >= _p5) && (_p0 <= _p6))
        {
            _p8.x += _p1;
            _p8.y += _p2;
            _p8.z += _p3;
            return _p8;
        }
        if ((_p0 >= _p4) && (_p0 <= _p5))
        {
            _p8.x += ((_p1 * (_p0 - _p4)) / (_p5 - _p4));
            _p8.y += ((_p2 * (_p0 - _p4)) / (_p5 - _p4));
            _p8.z += ((_p3 * (_p0 - _p4)) / (_p5 - _p4));
            return _p8;
        }
        if ((_p0 >= _p6) && (_p0 <= 360.0))
        {
            _p8.x += ((_p1 * ((_p7 + 360.0) - _p0)) / ((_p7 + 360.0) - _p6));
            _p8.y += ((_p2 * ((_p7 + 360.0) - _p0)) / ((_p7 + 360.0) - _p6));
            _p8.z += ((_p3 * ((_p7 + 360.0) - _p0)) / ((_p7 + 360.0) - _p6));
            return _p8;
        }
        if ((_p0 >= 0.0) && (_p0 <= _p7))
        {
            _p8.x += ((_p1 * (_p7 - _p0)) / ((_p7 + 360.0) - _p6));
            _p8.y += ((_p2 * (_p7 - _p0)) / ((_p7 + 360.0) - _p6));
            _p8.z += ((_p3 * (_p7 - _p0)) / ((_p7 + 360.0) - _p6));
            return _p8;
        }
    }
    return _p8;
}

float _f1(float _p0, float _p1, inout float _p2)
{
    if (_p2 < 0.0)
    {
        _p2 += 1.0;
    }
    if (_p2 > 1.0)
    {
        _p2 -= 1.0;
    }
    if (_p2 < 0.16666667163372039794921875)
    {
        return _p0 + (((_p1 - _p0) * 6.0) * _p2);
    }
    if (_p2 < 0.5)
    {
        return _p1;
    }
    if (_p2 < 0.666666686534881591796875)
    {
        return _p0 + (((_p1 - _p0) * (0.666666686534881591796875 - _p2)) * 6.0);
    }
    return _p0;
}

vec3 _f2(vec3 _p0)
{
    float _206 = _p0.x / 360.0;
    float _t10;
    float _t11;
    float _t12;
    if (_p0.y == 0.0)
    {
        _t12 = _p0.z;
        _t11 = _p0.z;
        _t10 = _p0.z;
    }
    else
    {
        float _222;
        if (_p0.z < 0.5)
        {
            _222 = _p0.z * (1.0 + _p0.y);
        }
        else
        {
            _222 = (_p0.z + _p0.y) - (_p0.z * _p0.y);
        }
        float _249 = (2.0 * _p0.z) - _222;
        float param = _249;
        float param_1 = _222;
        float param_2 = _206 + 0.3333333432674407958984375;
        float _258 = _f1(param, param_1, param_2);
        _t10 = _258;
        float param_3 = _249;
        float param_4 = _222;
        float param_5 = _206;
        float _265 = _f1(param_3, param_4, param_5);
        _t11 = _265;
        float param_6 = _249;
        float param_7 = _222;
        float param_8 = _206 - 0.3333333432674407958984375;
        float _273 = _f1(param_6, param_7, param_8);
        _t12 = _273;
    }
    return vec3(_t10, _t11, _t12);
}

void main()
{
    vec3 _t15 = vec3(hsl_param_0.x * 0.25, hsl_param_0.y, hsl_param_0.z / 2.7000000476837158203125);
    vec3 _t16 = vec3(hsl_param_1.x * 0.1500000059604644775390625, hsl_param_1.y, hsl_param_1.z / 2.7000000476837158203125);
    vec3 _t17 = vec3(hsl_param_2.x * 0.300000011920928955078125, hsl_param_2.y, hsl_param_2.z / 2.7000000476837158203125);
    vec3 _t18 = vec3(hsl_param_3.x * 0.300000011920928955078125, hsl_param_3.y * 1.10000002384185791015625, hsl_param_3.z / 2.7000000476837158203125);
    vec3 _t19 = vec3(hsl_param_4.x * 0.4000000059604644775390625, hsl_param_4.y, hsl_param_4.z / 2.2000000476837158203125);
    vec3 _t20 = vec3(hsl_param_5.x * 0.4000000059604644775390625, hsl_param_5.y * 1.2000000476837158203125, hsl_param_5.z / 2.0);
    vec3 _t21 = vec3(hsl_param_6.x * 0.4000000059604644775390625, hsl_param_6.y, hsl_param_6.z / 2.7000000476837158203125);
    vec3 _t22 = vec3(hsl_param_7.x * 0.4000000059604644775390625, hsl_param_7.y, hsl_param_7.z / 2.7000000476837158203125);
    mediump vec4 _1089 = texture2D(inputImageTexture, uv0);
    vec4 _t23 = _1089;
    vec3 param = _1089.xyz;
    vec3 _t25 = _f0(param);
    vec3 _t26 = vec3(0.0);
    float param_1 = _t25.x;
    float param_2 = _t15.x;
    float param_3 = _t15.y;
    float param_4 = _t15.z;
    float param_5 = 315.0;
    float param_6 = 330.0;
    float param_7 = 5.0;
    float param_8 = 20.0;
    vec3 param_9 = vec3(0.0);
    vec3 _1121 = _f3(param_1, param_2, param_3, param_4, param_5, param_6, param_7, param_8, param_9);
    _t26 = _1121;
    float param_10 = _t25.x;
    float param_11 = _t16.x;
    float param_12 = _t16.y;
    float param_13 = _t16.z;
    float param_14 = 350.0;
    float param_15 = 20.0;
    float param_16 = 40.0;
    float param_17 = 60.0;
    vec3 param_18 = _1121;
    vec3 _1142 = _f3(param_10, param_11, param_12, param_13, param_14, param_15, param_16, param_17, param_18);
    _t26 = _1142;
    float param_19 = _t25.x;
    float param_20 = _t17.x;
    float param_21 = _t17.y;
    float param_22 = _t17.z;
    float param_23 = 25.0;
    float param_24 = 50.0;
    float param_25 = 70.0;
    float param_26 = 90.0;
    vec3 param_27 = _1142;
    vec3 _1165 = _f3(param_19, param_20, param_21, param_22, param_23, param_24, param_25, param_26, param_27);
    _t26 = _1165;
    float param_28 = _t25.x;
    float param_29 = _t18.x;
    float param_30 = _t18.y;
    float param_31 = _t18.z;
    float param_32 = 50.0;
    float param_33 = 70.0;
    float param_34 = 160.0;
    float param_35 = 190.0;
    vec3 param_36 = _1165;
    vec3 _1186 = _f3(param_28, param_29, param_30, param_31, param_32, param_33, param_34, param_35, param_36);
    _t26 = _1186;
    float param_37 = _t25.x;
    float param_38 = _t19.x;
    float param_39 = _t19.y;
    float param_40 = _t19.z;
    float param_41 = 135.0;
    float param_42 = 165.0;
    float param_43 = 195.0;
    float param_44 = 225.0;
    vec3 param_45 = _1186;
    vec3 _1209 = _f3(param_37, param_38, param_39, param_40, param_41, param_42, param_43, param_44, param_45);
    _t26 = _1209;
    float param_46 = _t25.x;
    float param_47 = _t20.x;
    float param_48 = 0.0;
    float param_49 = 0.0;
    float param_50 = 145.0;
    float param_51 = 180.0;
    float param_52 = 235.0;
    float param_53 = 275.0;
    vec3 param_54 = _1209;
    vec3 _1228 = _f3(param_46, param_47, param_48, param_49, param_50, param_51, param_52, param_53, param_54);
    _t26 = _1228;
    float param_55 = _t25.x;
    float param_56 = 0.0;
    float param_57 = _t20.y;
    float param_58 = _t20.z;
    float param_59 = 145.0;
    float param_60 = 180.0;
    float param_61 = 235.0;
    float param_62 = 270.0;
    vec3 param_63 = _1228;
    vec3 _1246 = _f3(param_55, param_56, param_57, param_58, param_59, param_60, param_61, param_62, param_63);
    _t26 = _1246;
    float param_64 = _t25.x;
    float param_65 = _t21.x;
    float param_66 = _t21.y;
    float param_67 = _t21.z;
    float param_68 = 235.0;
    float param_69 = 255.0;
    float param_70 = 315.0;
    float param_71 = 335.0;
    vec3 param_72 = _1246;
    vec3 _1267 = _f3(param_64, param_65, param_66, param_67, param_68, param_69, param_70, param_71, param_72);
    _t26 = _1267;
    float param_73 = _t25.x;
    float param_74 = _t22.x;
    float param_75 = _t22.y;
    float param_76 = _t22.z;
    float param_77 = 255.0;
    float param_78 = 285.0;
    float param_79 = 335.0;
    float param_80 = 5.0;
    vec3 param_81 = _1267;
    vec3 _1287 = _f3(param_73, param_74, param_75, param_76, param_77, param_78, param_79, param_80, param_81);
    _t26 = _1287;
    _t25.x += _t26.x;
    for (float _t27 = 0.100000001490116119384765625; _t27 >= 0.0; _t27 += 1.0)
    {
        if (_t25.x > 360.0)
        {
            _t25.x -= 360.0;
        }
        if (_t25.x < 0.0)
        {
            _t25.x += 360.0;
        }
        bool _1323 = _t25.x <= 360.0;
        bool _1329;
        if (_1323)
        {
            _1329 = _t25.x >= 0.0;
        }
        else
        {
            _1329 = _1323;
        }
        if (_1329)
        {
            break;
        }
    }
    _t26.y = clamp(_t26.y / 100.0, -1.0, 1.0);
    if (_t26.y < 0.0)
    {
        _t25.y *= (1.0 + _t26.y);
    }
    else
    {
        _t26.y /= 2.0;
        _t25.y += (_t25.y - (_t25.y * (1.0 - _t26.y)));
    }
    _t26.z = clamp(_t26.z / 100.0, -1.0, 1.0);
    if (_t26.z <= 0.0)
    {
        float _t29 = _t25.y;
        if (_t25.z >= 0.5)
        {
            _t29 = _t25.y * 1.0;
        }
        if (_t25.z < 0.5)
        {
            _t29 = (_t25.y * 2.0) * _t25.z;
        }
        _t25.z += (_t25.z - (_t25.z - ((_t29 * (1.0 - _t25.z)) * _t26.z)));
    }
    else
    {
        float _t31 = _t25.y;
        if (_t25.z >= 0.5)
        {
            _t31 = _t25.y * 1.0;
        }
        if (_t25.z < 0.5)
        {
            _t31 = (_t25.y * 2.0) * _t25.z;
        }
        _t26.z = (1.0 - _t26.y) * _t26.z;
        _t25.z += ((_t31 * (1.14999997615814208984375 - _t25.z)) * _t26.z);
    }
    _t25.y = clamp(_t25.y, 0.0, 1.0);
    _t25.z = clamp(_t25.z, 0.0, 1.0);
    vec3 param_82 = _t25;
    gl_FragData[0] = vec4(_f2(param_82), _t23.w);
}

`