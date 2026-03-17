exports.source = `
#version 300 es
precision highp float;
precision highp int;

uniform mediump int pShapeType;
uniform mediump sampler2D materialTex;

in vec4 particleColor;
in vec2 sprite_uv;
in float particleOpacity;
layout(location = 0) out vec4 o_fragColor;

void main()
{
    vec4 _t0 = vec4(particleColor);
    if (pShapeType == 0)
    {
        _t0.w *= smoothstep(0.5, 0.449999988079071044921875, length(sprite_uv - vec2(0.5)));
    }
    else
    {
        if (pShapeType == 2)
        {
            _t0 *= texture(materialTex, sprite_uv);
        }
    }
    _t0.w *= particleOpacity;
    o_fragColor = vec4(_t0);
}`