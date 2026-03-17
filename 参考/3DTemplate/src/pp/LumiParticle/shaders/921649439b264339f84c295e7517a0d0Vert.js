exports.source = `
#version 300 es

uniform float sliderNumber;
uniform float particleTotalNum;
uniform float pLife;
uniform float pLifeRandom;
uniform float particleTotalSeed;
uniform float iTime;
uniform float pEndCycle;
uniform float randSeed;
uniform float emitterTranslationX;
uniform float emitterScaleX;
uniform float emitterTranslationY;
uniform float emitterScaleY;
uniform float emitterTranslationZ;
uniform float emitterScaleZ;
uniform mat4 u_Projection;
uniform mat4 u_View;
uniform vec4 u_ScreenParams;
uniform int pUseInputColor;
uniform mediump sampler2D inputTex;
uniform vec3 pColor;
uniform float pVeloX;
uniform float pVeloRandomX;
uniform float pVeloY;
uniform float pVeloRandomY;
uniform float pVeloZ;
uniform float pVeloRandomZ;
uniform float accelerationX;
uniform float accelerationRandomX;
uniform float accelerationY;
uniform float accelerationRandomY;
uniform float accelerationZ;
uniform float accelerationRandomZ;
uniform float resistance;
uniform float sliderSpeed;
uniform float turbulence;
uniform float pSize;
uniform float pSizeRandom;
uniform float pSizeRatioX;
uniform float pSizeRatioY;
uniform mediump sampler2D pSizeOverLifeTex;
uniform mediump sampler2D pOpacityOverLifeTex;
uniform float pOpacity;
uniform float pOpacityRandom;
uniform float pRotationX;
uniform float pRotationRandomX;
uniform float pRotationY;
uniform float pRotationRandomY;
uniform float pRotationZ;
uniform float pRotationRandomZ;

out vec4 particleColor;
out float particleOpacity;
layout(location = 0) in vec3 attPosition;
out vec2 sprite_uv;
layout(location = 2) in vec2 attUV;

float _f0(float _p0, float _p1)
{
    float _32 = fract(_p0 * 12.23099994659423828125);
    float _41 = _32 + (_32 * ((_32 + 22.118999481201171875) + _p1));
    return fract((_41 + _41) * _41);
}

vec4 _f2(float _p0, float _p1, float _p2)
{
    float _207 = cos(_p2 * 0.5);
    float _211 = sin(_p2 * 0.5);
    float _215 = cos(_p1 * 0.5);
    float _219 = sin(_p1 * 0.5);
    float _223 = cos(_p0 * 0.5);
    float _227 = sin(_p0 * 0.5);
    float _231 = _207 * _215;
    float _236 = _211 * _219;
    float _255 = _211 * _215;
    float _260 = _207 * _219;
    return vec4((_231 * _223) + (_236 * _227), (_231 * _227) - (_236 * _223), (_255 * _227) + (_260 * _223), (_255 * _223) - (_260 * _227));
}

vec3 _f1(vec4 _p0, vec3 _p1)
{
    vec4 _t1 = _p0;
    float _81 = _t1.w * _t1.w;
    float _84 = _t1.x * _t1.x;
    float _88 = _t1.y * _t1.y;
    float _92 = _t1.z * _t1.z;
    float _99 = _t1.x * _t1.y;
    float _102 = _t1.w * _t1.z;
    float _110 = _t1.x * _t1.z;
    float _113 = _t1.w * _t1.y;
    vec3 _t9;
    _t9.x = (((((_81 + _84) - _88) - _92) * _p1.x) + ((2.0 * (_99 - _102)) * _p1.y)) + ((2.0 * (_110 + _113)) * _p1.z);
    float _136 = _81 - _84;
    float _150 = _t1.y * _t1.z;
    float _153 = _t1.w * _t1.x;
    _t9.y = (((2.0 * (_99 + _102)) * _p1.x) + (((_136 + _88) - _92) * _p1.y)) + ((2.0 * (_150 - _153)) * _p1.z);
    _t9.z = (((2.0 * (_110 - _113)) * _p1.x) + ((2.0 * (_150 + _153)) * _p1.y)) + (((_136 - _88) + _92) * _p1.z);
    return _t9;
}

void main()
{
    float _288 = float(gl_InstanceID);
    if ((_288 + 1.0) > (sliderNumber * particleTotalNum))
    {
        gl_Position = vec4(10.0);
        return;
    }
    float _312 = pLife + pLifeRandom;
    float _317 = _288 / particleTotalSeed;
    float param = _317;
    float param_1 = 14.86999988555908203125 + _317;
    float _333 = iTime + ((_f0(param, param_1) * _312) * 1.0);
    float _338 = floor(_333 / _312);
    if ((_338 < 0.5) || (_338 > pEndCycle))
    {
        gl_Position = vec4(10.0);
        return;
    }
    float _360 = _338 / 3.0;
    float param_2 = _288 / 105.0;
    float param_3 = ((11.11999988555908203125 + (_288 / 104.0)) + _360) + randSeed;
    float _376 = mix(pLife - pLifeRandom, _312, _f0(param_2, param_3));
    float _382 = _333 - (_338 * _312);
    if (_382 > _376)
    {
        gl_Position = vec4(10.0);
        return;
    }
    float _402 = _288 / (particleTotalSeed - 5.0);
    float param_4 = _402;
    float param_5 = ((11.86999988555908203125 + (_288 / (particleTotalSeed - 3.0))) + _360) + randSeed;
    float _422 = _288 / (particleTotalSeed + 4.0);
    float param_6 = _422;
    float param_7 = ((12.22000026702880859375 + (_288 / (particleTotalSeed + 3.0))) + _360) + randSeed;
    float _441 = _288 / (particleTotalSeed - 1.0);
    float _446 = _288 / (particleTotalSeed - 2.0);
    float param_8 = _441;
    float param_9 = ((13.3299999237060546875 + _446) + _360) + randSeed;
    vec3 _487 = mix(vec3(emitterTranslationX - emitterScaleX, emitterTranslationY - emitterScaleY, emitterTranslationZ - emitterScaleZ), vec3(emitterTranslationX + emitterScaleX, emitterTranslationY + emitterScaleY, emitterTranslationZ + emitterScaleZ), vec3(_f0(param_4, param_5), _f0(param_6, param_7), _f0(param_8, param_9)));
    vec4 _519 = vec4(_487, 1.0);
    vec4 _t36 = _519;
    float _528 = max(u_ScreenParams.x / u_ScreenParams.y, 1.0);
    vec2 _532 = _519.xy * _528;
    _t36.x = _532.x;
    _t36.y = _532.y;
    mat4 _540 = u_Projection * u_View;
    vec4 _542 = _540 * _t36;
    vec4 _t38 = _542;
    vec2 _552 = ((_542.xy / vec2(_t38.w)) * 0.5) + vec2(0.5);
    if (pUseInputColor == 1)
    {
        particleColor = textureLod(inputTex, _552, 0.0);
    }
    else
    {
        particleColor = vec4(pColor, textureLod(inputTex, _552, 0.0).w);
    }
    if (particleColor.w < 0.00999999977648258209228515625)
    {
        gl_Position = vec4(10.0);
        return;
    }
    float param_10 = _446;
    float param_11 = ((12.86999988555908203125 + (_288 / (particleTotalSeed - 13.0))) + _360) + randSeed;
    float param_12 = _288 / (particleTotalSeed + 10.0);
    float param_13 = ((13.22000026702880859375 + (_288 / (particleTotalSeed + 13.0))) + _360) + randSeed;
    float _633 = _288 / (particleTotalSeed - 11.0);
    float _639 = _288 / (particleTotalSeed - 12.0);
    float _645 = ((18.3299999237060546875 + _639) + _360) + randSeed;
    float param_14 = _633;
    float param_15 = _645;
    float param_16 = _441;
    float param_17 = ((12.11999988555908203125 + _446) + _360) + randSeed;
    float _704 = _288 / (particleTotalSeed + 5.0);
    float param_18 = _704;
    float param_19 = ((12.21000003814697265625 + _422) + _360) + randSeed;
    float param_20 = _639;
    float param_21 = ((14.13000011444091796875 + _402) + _360) + randSeed;
    vec3 _776 = mix(vec3(accelerationX - accelerationRandomX, accelerationY - accelerationRandomY, accelerationZ - accelerationRandomZ), vec3(accelerationX + accelerationRandomX, accelerationY + accelerationRandomY, accelerationZ + accelerationRandomZ), vec3(_f0(param_16, param_17), _f0(param_18, param_19), _f0(param_20, param_21))) / vec3(resistance);
    vec3 _t48 = _487 + (((_776 * _382) + (((mix(vec3(pVeloX - pVeloRandomX, pVeloY - pVeloRandomY, pVeloZ - pVeloRandomZ), vec3(pVeloX + pVeloRandomX, pVeloY + pVeloRandomY, pVeloZ + pVeloRandomZ), vec3(_f0(param_10, param_11), _f0(param_12, param_13), _f0(param_14, param_15))) - _776) * (1.0 / resistance)) * (1.0 - pow(2.7182800769805908203125, -(resistance * _382))))) * sliderSpeed);
    float _806 = _288 / (particleTotalSeed + 7.0);
    float param_22 = _806;
    float param_23 = (26.979999542236328125 + (_288 / (particleTotalSeed + 12.0))) + _360;
    float _819 = _f0(param_22, param_23) - 0.5;
    float param_24 = _446;
    float param_25 = (26.979999542236328125 + _704) + _360;
    float _848 = _f0(param_24, param_25) - 0.5;
    float _859 = 1.0 - (resistance / 10.0);
    float _870 = _288 / (particleTotalSeed + 2.0);
    float param_26 = _441;
    float param_27 = (13.77999973297119140625 + _870) + _360;
    float _885 = ((_382 + (_f0(param_26, param_27) - 0.5)) * 3.1400001049041748046875) * ((((0.5 + abs(_848)) * mix(-1.0, 1.0, step(0.0, _848))) * 0.5) * _859);
    vec3 _907 = _t48;
    vec2 _909 = _907.xy + (((((vec2(sin(_885), cos(_885)) * _859) * _382) * (turbulence * (_819 + (0.5 * mix(-1.0, 1.0, step(0.0, _819)))))) * 0.300000011920928955078125) * sliderSpeed);
    _t48.x = _909.x;
    _t48.y = _909.y;
    float param_28 = _633;
    float param_29 = _645;
    float param_30 = _402;
    float param_31 = ((11.229999542236328125 + _806) + _360) + randSeed;
    vec2 _t56 = vec2(pSizeRatioX, pSizeRatioY) * mix(pSize - pSizeRandom, pSize + pSizeRandom, _f0(param_30, param_31));
    vec2 _978 = vec2(_382 / _376, 0.5);
    float param_32 = _446;
    float param_33 = ((12.53999996185302734375 + _704) + _360) + randSeed;
    particleOpacity = mix(pOpacity, pOpacity - pOpacityRandom, _f0(param_32, param_33)) * textureLod(pOpacityOverLifeTex, _978, 0.0).x;
    float param_34 = _441;
    float param_35 = ((12.86999988555908203125 + _639) + _360) + randSeed;
    float param_36 = _870;
    float param_37 = ((13.22000026702880859375 + (_288 / (particleTotalSeed + 16.0))) + _360) + randSeed;
    float param_38 = _288 / (particleTotalSeed - 9.0);
    float param_39 = ((18.3299999237060546875 + (_288 / (particleTotalSeed - 19.0))) + _360) + randSeed;
    vec3 _t63 = mix(vec3(pRotationX - pRotationRandomX, pRotationY - pRotationRandomY, pRotationZ - pRotationRandomZ), vec3(pRotationX + pRotationRandomX, pRotationY + pRotationRandomY, pRotationZ + pRotationRandomZ), vec3(_f0(param_34, param_35), _f0(param_36, param_37), _f0(param_38, param_39)));
    float param_40 = _t63.z * _382;
    float param_41 = _t63.y * _382;
    float param_42 = _t63.x * _382;
    vec4 param_43 = _f2(param_40, param_41, param_42);
    vec3 param_44 = attPosition;
    vec3 _1133 = _t48;
    vec2 _1135 = _1133.xy * _528;
    _t48.x = _1135.x;
    _t48.y = _1135.y;
    float param_45 = _441;
    float param_46 = (16.450000762939453125 + (_288 / (particleTotalSeed + 8.0))) + _360;
    sprite_uv = attUV;
    gl_Position = _540 * vec4(_t48 + ((((_f1(param_43, param_44) * _t56.x) * textureLod(pSizeOverLifeTex, _978, 0.0).x) * 4.0) * _528), 1.0);
}`