exports.source = `
precision highp float;
precision highp int;

uniform mediump vec2 u_Center;
uniform mediump vec4 u_ScreenParams;
uniform mediump float u_Radius;
uniform mediump float u_Convergence;
uniform mediump float u_Intensity; // 添加intensity uniform
uniform mediump sampler2D u_InputTex;

varying vec2 uv0;

mediump vec3 _f1(mediump vec2 _p0, mediump float _p1, mediump float _p2)
{
    mediump vec2 _t1 = _p0 - u_Center;
    _t1.x *= (u_ScreenParams.x / u_ScreenParams.y);
    mediump float _68 = length(_t1);
    mediump float _74 = _68 * _68;
    mediump float _85 = _68 * ((1.0 + ((((-_p2) * 203.087493896484375) / pow(_p1, 2.0)) * _74)) + (0.0 * (_74 * _68)));
    mediump float _91 = atan(_t1.x, _t1.y);
    mediump vec2 _t9 = vec2((sin(_91) * _85) * 1.0, (cos(_91) * _85) * 1.0);
    _t9.x *= (u_ScreenParams.y / u_ScreenParams.x);
    mediump vec2 _118 = _t9;
    mediump vec2 _119 = _118 + u_Center;
    _t9 = _119;
    return vec3(_119, _68);
}

mediump vec2 _f0(mediump vec2 _p0)
{
    return step(vec2(0.0), _p0) * step(_p0, vec2(1.0));
}

void main()
{
    // 当intensity为0时，直接使用原始纹理坐标
    if (u_Intensity <= 0.0) {
        gl_FragColor = texture2D(u_InputTex, uv0);
        return;
    }
    
    mediump vec2 _t10 = uv0;
    mediump float _142 = u_Radius * pow(1.60000002384185791015625, (u_ScreenParams.x / u_ScreenParams.y) - 1.0);
    mediump vec2 param = uv0;
    mediump float param_1 = _142 * u_Intensity; // 应用强度控制
    mediump float param_2 = u_Convergence * u_Intensity; // 应用强度控制
    mediump vec3 _152 = _f1(param, param_1, param_2);
    mediump vec3 _t12 = _152;
    mediump vec2 _154 = _152.xy;
    _t10 = _154;
    mediump vec2 param_3 = _154;
    mediump vec2 _t13 = _f0(param_3);
    mediump float _176 = _142 * 0.007000000216066837310791015625;
    
    // 使用mix函数在原始颜色和处理后的颜色之间插值
    mediump vec4 originalColor = texture2D(u_InputTex, uv0);
    mediump vec4 processedColor = ((texture2D(u_InputTex, _t10) * _t13.x) * _t13.y) * smoothstep(_176 + 0.001000000047497451305389404296875, _176 - 0.001000000047497451305389404296875, _t12.z);
    gl_FragColor = mix(originalColor, processedColor, u_Intensity);
}

`