exports.source = `
precision highp float;
precision highp int;

uniform mediump sampler2D u_inputTex;
uniform mediump int u_unmult;

varying vec2 v_uv;

void main()
{
    mediump vec4 _19 = texture2D(u_inputTex, v_uv);
    mediump vec4 _t0 = _19;
    if (u_unmult == 1)
    {
        mediump float _42 = max(max(_t0.x, _t0.y), _t0.z);
        if (_42 > 0.0)
        {
            gl_FragData[0] = vec4(_19.xyz, _42);
        }
        else
        {
            gl_FragData[0] = vec4(0.0);
        }
    }
    else
    {
        gl_FragData[0] = _19;
    }
}`