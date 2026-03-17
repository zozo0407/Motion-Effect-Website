exports.source = `
uniform vec2 u_LeftBottomVertex;
uniform vec2 u_BottomLeftTangent;
uniform vec2 u_BottomRightTangent;
uniform vec2 u_BottomRightVertex;
uniform vec2 u_TopLeftVertex;
uniform vec2 u_TopLeftTangent;
uniform vec2 u_TopRightTangent;
uniform vec2 u_RightTopVertex;
uniform vec2 u_LeftBottomTangent;
uniform vec2 u_LeftTopTangent;
uniform vec2 u_RightBottomTangent;
uniform vec2 u_RightTopTangent;

attribute vec3 a_position;
varying vec2 v_uv;
attribute vec2 a_texcoord0;

vec2 _f0(vec2 _p0, vec2 _p1, vec2 _p2, vec2 _p3, float _p4)
{
    vec2 _29 = mix(_p1, _p2, vec2(_p4));
    return mix(mix(mix(_p0, _p1, vec2(_p4)), _29, vec2(_p4)), mix(_29, mix(_p2, _p3, vec2(_p4)), vec2(_p4)), vec2(_p4));
}

void main()
{
    vec2 _64 = (a_position.xy * 0.5) + vec2(0.5);
    vec2 _t5 = _64;
    vec2 _t6 = u_LeftBottomVertex;
    vec2 _t9 = u_BottomRightVertex;
    vec2 _t10 = u_TopLeftVertex;
    vec2 _t13 = u_RightTopVertex;
    vec2 _t14 = u_LeftBottomVertex;
    vec2 _t17 = u_TopLeftVertex;
    vec2 _t18 = u_BottomRightVertex;
    vec2 _t21 = u_RightTopVertex;
    vec2 param = u_BottomRightVertex;
    vec2 param_1 = u_RightBottomTangent;
    vec2 param_2 = u_RightTopTangent;
    vec2 param_3 = u_RightTopVertex;
    float param_4 = _t5.y;
    vec2 _124 = _f0(param, param_1, param_2, param_3, param_4);
    vec2 _t22 = _124;
    vec2 param_5 = u_LeftBottomVertex;
    vec2 param_6 = u_LeftBottomTangent;
    vec2 param_7 = u_LeftTopTangent;
    vec2 param_8 = u_TopLeftVertex;
    float param_9 = _t5.y;
    vec2 _137 = _f0(param_5, param_6, param_7, param_8, param_9);
    vec2 _t23 = _137;
    vec2 _t24 = smoothstep(vec2(0.0), vec2(1.0), _64.yy);
    vec2 _178 = vec2(mix(-mix(_t6.x, _t10.x, _t24.y), 1.0 - mix(_t9.x, _t13.x, _t24.y), _t5.x) + mix(_t23.x, _t22.x - 1.0, _t5.x), 0.0);
    vec2 param_10 = _137;
    vec2 param_11 = mix(u_BottomLeftTangent, u_TopLeftTangent, vec2(_t24.y, _t5.y)) + _178;
    vec2 param_12 = mix(u_BottomRightTangent, u_TopRightTangent, vec2(_t24.y, _t5.y)) + _178;
    vec2 param_13 = _124;
    float param_14 = _t5.x;
    vec2 _t31 = _f0(param_10, param_11, param_12, param_13, param_14);
    vec2 param_15 = u_TopLeftVertex;
    vec2 param_16 = u_TopLeftTangent;
    vec2 param_17 = u_TopRightTangent;
    vec2 param_18 = u_RightTopVertex;
    float param_19 = _t5.x;
    vec2 _230 = _f0(param_15, param_16, param_17, param_18, param_19);
    vec2 _t32 = _230;
    vec2 param_20 = u_LeftBottomVertex;
    vec2 param_21 = u_BottomLeftTangent;
    vec2 param_22 = u_BottomRightTangent;
    vec2 param_23 = u_BottomRightVertex;
    float param_24 = _t5.x;
    vec2 _243 = _f0(param_20, param_21, param_22, param_23, param_24);
    vec2 _t33 = _243;
    vec2 _t34 = smoothstep(vec2(0.0), vec2(1.0), _64.xx);
    vec2 _281 = vec2(0.0, mix(-mix(_t14.y, _t18.y, _t34.x), 1.0 - mix(_t17.y, _t21.y, _t34.x), _t5.y) + mix(_t33.y, _t32.y - 1.0, _t5.y));
    vec2 param_25 = _243;
    vec2 param_26 = mix(u_LeftBottomTangent, u_RightBottomTangent, vec2(_t5.x, _t34.x)) + _281;
    vec2 param_27 = mix(u_LeftTopTangent, u_RightTopTangent, vec2(_t5.x, _t34.x)) + _281;
    vec2 param_28 = _230;
    float param_29 = _t5.y;
    vec2 _t41 = _f0(param_25, param_26, param_27, param_28, param_29);
    gl_Position = vec4((vec2(_t31.x, _t41.y) * 2.0) - vec2(1.0), 0.0, 1.0);
    v_uv = a_texcoord0;
}`