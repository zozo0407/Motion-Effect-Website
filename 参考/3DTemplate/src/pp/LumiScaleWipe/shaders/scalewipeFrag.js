exports.source = `
precision highp float;
precision highp int;

uniform vec2 u_orientation;
uniform vec2 u_center;
uniform float u_stretch;
uniform mediump sampler2D u_inputTex;
uniform vec2 u_size;
uniform float u_intensity;  // 添加intensity uniform

varying vec2 v_xy;

float _f1(float _p0, float _p1)
{
    return ((_p1 * 2.0) * _p0) * _p0 + _p0;
}

float _f2(float _p0, float _p1)
{
    float param = _p0;
    float param_1 = _p1;
    return (_p0 * _p0) / _f1(param, param_1);
}

vec4 _f0(mediump sampler2D _p0, inout vec2 _p1)
{
    vec2 _31 = _p1;
    _p1 = step(vec2(0.0), _p1) * step(_p1, vec2(1.0));
    return (texture2D(_p0, _31) * _p1.x) * _p1.y;
}

void main()
{
    vec2 _t2 = u_orientation;
    vec2 _88 = vec2(_t2.y, -_t2.x);
    vec2 _95 = v_xy - u_center;
    float _107 = dot(_95, u_orientation);
    float param = _107;
    float param_1 = u_stretch;
    vec2 param_2 = mix((u_center + (_88 * dot(_95, _88))) + (u_orientation * _f2(param, param_1)), v_xy, vec2(step(_107 * u_stretch, 0.0))) / u_size;
    vec4 _135 = _f0(u_inputTex, param_2);
    
    // 保存原始颜色
    vec4 originalColor = texture2D(u_inputTex, v_xy);
    
    // 根据intensity在原始颜色和处理后的颜色之间插值
    gl_FragData[0] = mix(originalColor, _135, u_intensity);
}`