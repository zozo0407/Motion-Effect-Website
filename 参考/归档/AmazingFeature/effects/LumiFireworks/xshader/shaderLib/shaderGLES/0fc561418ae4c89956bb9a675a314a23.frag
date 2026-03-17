precision highp float;
precision highp int;

uniform mediump sampler2D u_inputTexture;
uniform mediump sampler2D u_originalTex;
uniform float uGradientSpread;
uniform float uGradientContrast;
uniform float uGradientHeight;
uniform float uEndTime;
uniform float uStartTime;
uniform float uTime;
uniform float uDarkIns;

varying vec2 v_uv;

vec4 _f0(vec4 _p0, inout vec4 _p1)
{
    vec4 _23 = _p1;
    vec3 _25 = _23.xyz + (_p0.xyz * _p0.w);
    _p1.x = _25.x;
    _p1.y = _25.y;
    _p1.z = _25.z;
    _p1.w = max(_p1.w, _p0.w);
    return _p1;
}

void main()
{
    mediump vec4 _54 = texture2D(u_inputTexture, v_uv);
    mediump vec4 _59 = texture2D(u_originalTex, v_uv);
    vec4 _t1 = _59;
    float _93 = clamp((((1.0 - v_uv.y) - clamp(uGradientHeight, 0.0, 1.0)) * ((uGradientSpread <= 0.0) ? 1.0 : uGradientSpread)) + 0.5, 0.0, 1.0);
    float _109 = clamp(((((_93 * _93) * (3.0 - (2.0 * _93))) - 0.5) * ((uGradientContrast <= 0.0) ? 1.0 : uGradientContrast)) + 0.5, 0.0, 1.0);
    float _t7 = 1.0;
    float _124 = uEndTime - uStartTime;
    float _129 = uTime - uStartTime;
    float _135 = _124 - 0.5;
    if (_129 > _135)
    {
        _t7 = smoothstep(_124, _135, _129);
    }
    vec4 param = (_54 * _t7) * smoothstep(0.0, 0.300000011920928955078125, _129);
    vec4 param_1 = vec4(_59.xyz * mix(vec3(1.0), vec4(vec3((_109 * _109) * (3.0 - (2.0 * _109))), 1.0).xyz, vec3(uDarkIns * _t7)), _t1.w);
    vec4 _179 = _f0(param, param_1);
    gl_FragData[0] = _179;
}

