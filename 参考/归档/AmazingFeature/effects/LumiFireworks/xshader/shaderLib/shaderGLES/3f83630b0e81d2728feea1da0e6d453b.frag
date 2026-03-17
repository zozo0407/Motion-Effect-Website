precision highp float;
precision highp int;

uniform vec4 u_ScreenParams;
uniform float u_bloomRadius;
uniform float u_bloomSamples;
uniform mediump sampler2D u_inputTexture;
uniform float u_bloomGlow;
uniform float u_bloomBase;
uniform float u_vignetteIntensity;
uniform mediump sampler2D u_originalTexture;
uniform float u_filterSize;

varying vec2 v_uv;

void main()
{
    vec2 _23 = vec2(1.0) / u_ScreenParams.xy;
    vec4 _t3 = vec4(0.0);
    vec2 _t4 = vec2(u_bloomRadius, 0.0) * inversesqrt(u_bloomSamples);
    for (float _t5 = 0.0; _t5 < u_bloomSamples; _t5 += 1.0)
    {
        vec2 _55 = _t4;
        vec2 _56 = _55 * mat2(vec2(-0.737399995326995849609375, -0.675499975681304931640625), vec2(0.675499975681304931640625, -0.737399995326995849609375));
        _t4 = _56;
        _t3 += (texture2D(u_inputTexture, v_uv + ((_56 * sqrt(_t5)) * _23)) * (1.0 - (_t5 / u_bloomSamples)));
    }
    vec4 _90 = _t3;
    vec4 _99 = (_90 * (u_bloomGlow / u_bloomSamples)) + (texture2D(u_inputTexture, v_uv) * u_bloomBase);
    _t3 = _99;
    vec2 _105 = (v_uv * 2.0) - vec2(1.0);
    vec2 _t10 = max(vec2(1.0) - (_105 * _105), vec2(0.0));
    vec3 _130 = _99.xyz * pow(_t10.x * _t10.y, u_vignetteIntensity);
    _t3.x = _130.x;
    _t3.y = _130.y;
    _t3.z = _130.z;
    vec4 _144 = _t3;
    vec4 _148 = mix(texture2D(u_originalTexture, v_uv), _144, vec4(u_filterSize));
    _t3 = _148;
    gl_FragData[0] = _148;
}

