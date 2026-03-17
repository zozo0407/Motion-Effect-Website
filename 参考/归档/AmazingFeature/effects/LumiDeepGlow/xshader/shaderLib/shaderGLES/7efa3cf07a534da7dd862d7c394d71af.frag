precision highp float;
precision highp int;

uniform mediump int u_blendMode;
uniform mediump sampler2D u_blurTex;
uniform mediump sampler2D u_inputTex;
uniform mediump int u_tint;
uniform mediump int u_tintMode;
uniform vec3 u_tintColor;
uniform float u_tintMix;
uniform mediump int u_unmult;
uniform float u_srcOpacity;
uniform mediump int u_view;
uniform mediump sampler2D u_thresholdTex;

varying vec2 v_uv;

float _f0(float _p0, float _p1)
{
    float _51;
    if (_p0 < 0.5)
    {
        _51 = (2.0 * _p0) * _p1;
    }
    else
    {
        _51 = 1.0 - ((2.0 * (1.0 - _p0)) * (1.0 - _p1));
    }
    return _51;
}

vec3 _f1(vec3 _p0, vec3 _p1)
{
    return ((vec3(1.0) - (vec3(2.0) * _p1)) * pow(_p0, vec3(2.0))) + ((vec3(2.0) * _p1) * _p0);
}

vec4 _f7(vec4 _p0)
{
    float _186 = max(max(_p0.x, _p0.y), _p0.z);
    if (_186 > 0.0)
    {
        return vec4(_p0.xyz, _186);
    }
    else
    {
        return vec4(0.0);
    }
}

float _f3(float _p0, float _p1)
{
    return 1.0 - ((1.0 - _p0) * (1.0 - _p1));
}

vec3 _f4(vec3 _p0, vec3 _p1)
{
    float param = _p0.x;
    float param_1 = _p1.x;
    float param_2 = _p0.y;
    float param_3 = _p1.y;
    float param_4 = _p0.z;
    float param_5 = _p1.z;
    return vec3(_f3(param, param_1), _f3(param_2, param_3), _f3(param_4, param_5));
}

vec3 _f2(vec3 _p0, vec3 _p1)
{
    return min(_p0 + _p1, vec3(1.0));
}

float _f5(float _p0, float _p1)
{
    return (_p0 + _p1) - (_p0 * _p1);
}

vec4 _f6(vec4 _p0, vec4 _p1)
{
    vec3 _t0;
    if (u_blendMode == 0)
    {
        vec3 param = _p0.xyz;
        vec3 param_1 = _p1.xyz;
        _t0 = _f4(param, param_1);
    }
    else
    {
        vec3 param_2 = _p0.xyz;
        vec3 param_3 = _p1.xyz;
        _t0 = _f2(param_2, param_3);
    }
    float param_4 = _p0.w;
    float param_5 = _p1.w;
    return vec4(_t0, _f5(param_4, param_5));
}

void main()
{
    vec4 _t3 = texture2D(u_blurTex, v_uv);
    mediump vec4 _219 = texture2D(u_inputTex, v_uv);
    if (u_tint == 1)
    {
        vec4 _t5;
        _t5.w = _t3.w;
        if (u_tintMode == 1)
        {
            vec3 _240 = _t3.xyz * u_tintColor;
            _t5.x = _240.x;
            _t5.y = _240.y;
            _t5.z = _240.z;
        }
        else
        {
            if (u_tintMode == 2)
            {
                vec3 _t7 = pow(_t3.xyz, vec3(1.0));
                vec3 _t8 = pow(u_tintColor, vec3(1.0));
                float param = _t7.x;
                float param_1 = _t8.x;
                float param_2 = _t7.y;
                float param_3 = _t8.y;
                float param_4 = _t7.z;
                float param_5 = _t8.z;
                vec3 _286 = vec3(_f0(param, param_1), _f0(param_2, param_3), _f0(param_4, param_5));
                _t5.x = _286.x;
                _t5.y = _286.y;
                _t5.z = _286.z;
            }
            else
            {
                vec4 _294 = _t3;
                vec3 _296 = min(_294.xyz, vec3(1.0));
                _t3.x = _296.x;
                _t3.y = _296.y;
                _t3.z = _296.z;
                vec3 param_6 = _t3.xyz;
                vec3 param_7 = u_tintColor;
                vec3 _308 = _f1(param_6, param_7);
                _t5.x = _308.x;
                _t5.y = _308.y;
                _t5.z = _308.z;
            }
        }
        _t3 = mix(_t3, _t5, vec4(u_tintMix));
    }
    if (u_unmult == 1)
    {
        vec4 param_8 = _t3;
        _t3 = _f7(param_8);
    }
    vec4 param_9 = _219;
    vec4 param_10 = _t3;
    _t3 = mix(_t3, _f6(param_9, param_10), vec4(u_srcOpacity));
    if (u_view == 0)
    {
        _t3 = texture2D(u_thresholdTex, v_uv);
    }
    gl_FragData[0] = _t3;
}

