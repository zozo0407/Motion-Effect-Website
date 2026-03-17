exports.source = `
precision highp float;
precision highp int;

uniform mediump int u_blendMode;
uniform mediump sampler2D u_tex1;
uniform mediump int u_directionNum;
uniform mediump sampler2D u_tex2;
uniform mediump sampler2D u_tex3;
uniform mediump sampler2D u_tex4;
uniform float u_exposure;

varying vec2 v_uv;

vec4 _f0(vec4 _p0, vec4 _p1)
{
    return (_p0 + _p1) - (_p0 * _p1);
}

vec4 _f1(vec4 _p0, vec4 _p1)
{
    return _p0 + _p1;
}

vec4 _f2(vec4 _p0, vec4 _p1)
{
    if (u_blendMode == 0)
    {
        vec4 param = _p0;
        vec4 param_1 = _p1;
        return _f0(param, param_1);
    }
    else
    {
        vec4 param_2 = _p0;
        vec4 param_3 = _p1;
        return _f1(param_2, param_3);
    }
}

void main()
{
    vec4 _t0 = texture2D(u_tex1, v_uv);
    if (u_directionNum >= 2)
    {
        vec4 param = _t0;
        vec4 param_1 = texture2D(u_tex2, v_uv);
        _t0 = _f2(param, param_1);
    }
    if (u_directionNum >= 3)
    {
        vec4 param_2 = _t0;
        vec4 param_3 = texture2D(u_tex3, v_uv);
        _t0 = _f2(param_2, param_3);
    }
    if (u_directionNum >= 4)
    {
        vec4 param_4 = _t0;
        vec4 param_5 = texture2D(u_tex4, v_uv);
        _t0 = _f2(param_4, param_5);
    }
    if (u_blendMode == 2)
    {
        _t0 /= vec4(float(u_directionNum));
    }
    vec4 _129 = _t0;
    vec3 _131 = _129.xyz * u_exposure;
    _t0.x = _131.x;
    _t0.y = _131.y;
    _t0.z = _131.z;
    gl_FragData[0] = clamp(_t0, vec4(0.0), vec4(1.0));
}`