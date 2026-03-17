exports.source = `
precision highp float;
precision highp int;

uniform vec2 u_downLeftVertex;
uniform vec2 u_downRightVertex;
uniform vec2 u_upRightVertex;
uniform vec2 u_upLeftVertex;
uniform mediump int u_motionTileType;
uniform mediump sampler2D u_InputTex;
uniform float u_intensity;

varying vec2 v_uv;

mat3 _f0(mat3 _p0)
{
    return mat3(vec3(vec3((_p0[1].y * _p0[2].z) - (_p0[2].y * _p0[1].z), (_p0[2].y * _p0[0].z) - (_p0[0].y * _p0[2].z), (_p0[0].y * _p0[1].z) - (_p0[1].y * _p0[0].z))), vec3(vec3((_p0[2].x * _p0[1].z) - (_p0[1].x * _p0[2].z), (_p0[0].x * _p0[2].z) - (_p0[2].x * _p0[0].z), (_p0[1].x * _p0[0].z) - (_p0[0].x * _p0[1].z))), vec3(vec3((_p0[1].x * _p0[2].y) - (_p0[2].x * _p0[1].y), (_p0[2].x * _p0[0].y) - (_p0[0].x * _p0[2].y), (_p0[0].x * _p0[1].y) - (_p0[1].x * _p0[0].y))));
}

mat3 _f1(vec2 _p0, vec2 _p1, vec2 _p2, vec2 _p3)
{
    mat3 _200 = mat3(vec3(vec3(_p0, 1.0)), vec3(vec3(_p1, 1.0)), vec3(vec3(_p2, 1.0)));
    mat3 param = _200;
    vec3 _t2 = _f0(param) * vec3(_p3, 1.0);
    return _200 * mat3(vec3(vec3(_t2.x, 0.0, 0.0)), vec3(vec3(0.0, _t2.y, 0.0)), vec3(vec3(0.0, 0.0, _t2.z)));
}

mat3 _f2(vec2 _p0, vec2 _p1, vec2 _p2, vec2 _p3, vec2 _p4, vec2 _p5, vec2 _p6, vec2 _p7)
{
    vec2 param = _p0;
    vec2 param_1 = _p2;
    vec2 param_2 = _p4;
    vec2 param_3 = _p6;
    vec2 param_4 = _p1;
    vec2 param_5 = _p3;
    vec2 param_6 = _p5;
    vec2 param_7 = _p7;
    mat3 param_8 = _f1(param, param_1, param_2, param_3);
    return _f1(param_4, param_5, param_6, param_7) * _f0(param_8);
}

void _f3(inout vec2 _p0, mat3 _p1)
{
    vec3 _274 = _p1 * vec3(_p0, 1.0);
    vec3 _t6 = _274;
    _p0 = _274.xy / vec2(_t6.z);
}

float _f5(vec2 _p0)
{
    return ((step(0.0, _p0.x) * step(_p0.x, 1.0)) * step(0.0, _p0.y)) * step(_p0.y, 1.0);
}

vec2 _f4(vec2 _p0)
{
    return abs(mod(_p0 - vec2(1.0), vec2(2.0)) - vec2(1.0));
}

void main()
{
    vec2 param = u_downLeftVertex;
    vec2 param_1 = vec2(0.0);
    vec2 param_2 = u_downRightVertex;
    vec2 param_3 = vec2(1.0, 0.0);
    vec2 param_4 = u_upRightVertex;
    vec2 param_5 = vec2(1.0);
    vec2 param_6 = u_upLeftVertex;
    vec2 param_7 = vec2(0.0, 1.0);
    vec2 _t12 = v_uv;
    vec2 param_8 = v_uv;
    mat3 param_9 = _f2(param, param_1, param_2, param_3, param_4, param_5, param_6, param_7);
    _f3(param_8, param_9);
    _t12 = param_8;
    float _t13 = 1.0;
    if (u_motionTileType == 0)
    {
        vec2 param_10 = _t12;
        _t13 = _f5(param_10);
    }
    else
    {
        if (u_motionTileType == 1)
        {
            vec2 param_11 = _t12;
            _t12 = _f4(param_11);
        }
        else
        {
            if (u_motionTileType == 2)
            {
                _t12 = fract(_t12);
            }
        }
    }
    // 获取原始纹理颜色
    vec4 originalColor = texture2D(u_InputTex, v_uv);
    // 获取变换后的颜色
    vec4 transformedColor = texture2D(u_InputTex, _t12) * _t13;
    // 根据intensity在原始颜色和变换后的颜色之间插值
    gl_FragData[0] = mix(originalColor, transformedColor, u_intensity);
}`