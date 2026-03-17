exports.source = `
precision highp float;
precision highp int;

uniform float intensity;
uniform mediump sampler2D inputImageTexture;
uniform mediump sampler2D inputImageTexture2;
uniform mediump sampler2D inputImageTexture3;

varying vec2 uv0;

void main()
{
    mediump vec4 _25 = texture2D(inputImageTexture, uv0);
    vec4 _t1 = _25;
    vec4 _t2 = _25;
    float _34 = _t1.z * 16.0;
    vec2 _t4 = vec2(289.0, 17.0);
    vec2 _t6 = vec2(0.0);
    float _49 = floor(_34);
    _t6.y = floor(_49 / 17.0);
    _t6.x = _49 - (_t6.y * 1.0);
    float _64 = ceil(_34);
    vec2 _t7;
    _t7.y = floor(_64 / 17.0);
    _t7.x = _64 - (_t7.y * 1.0);
    vec2 _t8;
    _t8.x = (((_t6.x * 1.0) / 17.0) + (0.5 / _t4.x)) + ((0.0588235296308994293212890625 - (1.0 / _t4.x)) * _t2.x);
    _t8.y = (((_t6.y * 1.0) / 1.0) + (0.5 / _t4.y)) + ((1.0 - (1.0 / _t4.y)) * _t2.y);
    vec2 _t9;
    _t9.x = (((_t7.x * 1.0) / 17.0) + (0.5 / _t4.x)) + ((0.0588235296308994293212890625 - (1.0 / _t4.x)) * _t2.x);
    _t9.y = (((_t7.y * 1.0) / 1.0) + (0.5 / _t4.y)) + ((1.0 - (1.0 / _t4.y)) * _t2.y);
    float _149 = fract(_34);
    vec4 _t11 = vec4(0.0, 0.0, 0.0, 1.0);
    if (intensity <= 0.0)
    {
        _t11 = mix(texture2D(inputImageTexture2, _t8), texture2D(inputImageTexture2, _t9), vec4(_149));
    }
    else
    {
        _t11 = mix(texture2D(inputImageTexture3, _t8), texture2D(inputImageTexture3, _t9), vec4(_149));
    }
    vec4 _187 = _t11;
    vec4 _190 = mix(_25, _187, vec4(abs(intensity)));
    _t11 = _190;
    gl_FragData[0] = _190;
    gl_FragData[0].w = _t1.w;
}

`