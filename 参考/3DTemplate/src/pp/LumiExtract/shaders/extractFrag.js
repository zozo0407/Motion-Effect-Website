exports.source = `
precision highp float;
precision highp int;

uniform mediump sampler2D u_InputTexture;
uniform mediump float u_BlackField;
uniform mediump float u_BlackSoft;
uniform mediump float u_WhiteField;
uniform mediump float u_WhiteSoft;
uniform mediump float u_Reverse;
uniform mediump float u_Intensity;

varying vec2 v_uv;

mediump float _f0(mediump float _p0, mediump float _p1, mediump float _p2)
{
    return clamp((_p2 - _p0) / ((_p1 - _p0) + 9.9999997473787516355514526367188e-06), 0.0, 1.0);
}

void main()
{
    mediump vec4 _42 = texture2D(u_InputTexture, v_uv);
    mediump vec4 _t1 = _42;
    mediump float _49 = _t1.w;
    vec3 _53 = _42.xyz / vec3(max(_49, 9.9999997473787516355514526367188e-05));
    _t1.x = _53.x;
    _t1.y = _53.y;
    _t1.z = _53.z;
    float _70 = dot(_t1.xyz, vec3(0.300000011920928955078125, 0.588235318660736083984375, 0.111764706671237945556640625));
    mediump float param = u_BlackField - u_BlackSoft;
    mediump float param_1 = u_BlackField;
    mediump float param_2 = _70;
    mediump float param_3 = u_WhiteField;
    mediump float param_4 = u_WhiteField + u_WhiteSoft;
    mediump float param_5 = _70;
    
    // 原始颜色
    mediump vec4 originalColor = _t1;
    
    // 应用提取效果的颜色
    mediump vec4 extractedColor = _t1 * abs(u_Reverse - (_f0(param, param_1, param_2) * (1.0 - _f0(param_3, param_4, param_5))));
    
    // 使用强度控制混合两种颜色
    gl_FragData[0] = mix(originalColor, extractedColor, u_Intensity);
}`