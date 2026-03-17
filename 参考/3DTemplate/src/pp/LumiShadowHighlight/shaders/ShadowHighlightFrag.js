exports.source = `
precision highp float;
precision highp int;

uniform mediump sampler2D u_inputTexture;
uniform float u_highlightParam;
uniform float u_shadowParam;

varying vec2 v_uv;

vec3 _f1(vec3 _p0, float _p1)
{
    vec3 _46 = vec3(1.0) - _p0;
    vec3 _50 = _46 * _46;
    return (vec3(1.0) - pow(_46, vec3(_p1))) - ((_50 - (_50 * _46)) * (_p1 - 1.0));
}

vec3 _f0(vec3 _p0, float _p1)
{
    vec3 _22 = _p0 * _p0;
    return pow(_p0, vec3(_p1)) + ((_22 - (_22 * _p0)) * (_p1 - 1.0));
}

void main()
{
    mediump vec4 _84 = texture2D(u_inputTexture, v_uv);
    vec4 _t7 = _84;
    vec3 param = _84.xyz;
    float param_1 = u_highlightParam;
    vec3 _92 = _f1(param, param_1);
    _t7.x = _92.x;
    _t7.y = _92.y;
    _t7.z = _92.z;
    vec3 param_2 = _t7.xyz;
    float param_3 = u_shadowParam;
    vec3 _109 = _f0(param_2, param_3);
    _t7.x = _109.x;
    _t7.y = _109.y;
    _t7.z = _109.z;
    gl_FragData[0] = clamp(_t7, vec4(0.0), vec4(1.0));
}

`