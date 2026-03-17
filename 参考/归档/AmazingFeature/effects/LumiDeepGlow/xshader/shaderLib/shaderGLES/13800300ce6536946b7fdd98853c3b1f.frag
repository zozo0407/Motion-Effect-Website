precision highp float;
precision highp int;

uniform mediump sampler2D u_inputTex;
uniform mediump int u_ca;
uniform float u_redOffset;
uniform float u_greenOffset;
uniform float u_blueOffset;
uniform float u_threshold;
uniform float u_thresholdSmooth;
uniform mediump int u_view;
uniform mediump int u_gamma;
uniform float u_gammaValue;
uniform float u_greyScale;

varying vec2 v_uv;

float _f0(vec3 _p0)
{
    return dot(_p0, vec3(0.2125999927520751953125, 0.715200006961822509765625, 0.072200000286102294921875));
}

void main()
{
    vec4 _t0 = texture2D(u_inputTex, v_uv);
    if (u_ca == 1)
    {
        vec4 _t1 = texture2D(u_inputTex, v_uv + vec2(-u_redOffset, u_redOffset)).yzwx;
        float _60 = _t1.w;
        float _63 = _t1.x;
        float _64 = _63 * _60;
        _t1.x = _64;
        _t1 = texture2D(u_inputTex, v_uv + vec2(-u_greenOffset, u_greenOffset)).yzwx;
        float _78 = _t1.w;
        float _81 = _t1.y;
        float _82 = _81 * _78;
        _t1.y = _82;
        _t1 = texture2D(u_inputTex, v_uv + vec2(-u_blueOffset, u_blueOffset)).yzwx;
        float _96 = _t1.w;
        float _99 = _t1.z;
        float _100 = _99 * _96;
        _t1.z = _100;
        _t0 = vec4(_64, _82, _100, 1.0);
    }
    if (_t0.x < u_threshold)
    {
        _t0.x = ((_t0.x / u_threshold) * _t0.x) * u_thresholdSmooth;
    }
    if (_t0.y < u_threshold)
    {
        _t0.y = ((_t0.y / u_threshold) * _t0.y) * u_thresholdSmooth;
    }
    if (_t0.z < u_threshold)
    {
        _t0.z = ((_t0.z / u_threshold) * _t0.z) * u_thresholdSmooth;
    }
    if (u_view == 1)
    {
        if (u_gamma == 1)
        {
            _t0 = pow(_t0, vec4(u_gammaValue));
        }
    }
    vec3 param = _t0.xyz;
    vec4 _182 = _t0;
    vec3 _189 = mix(_182.xyz, vec3(_f0(param)), vec3(u_greyScale));
    _t0.x = _189.x;
    _t0.y = _189.y;
    _t0.z = _189.z;
    gl_FragData[0] = _t0;
}

