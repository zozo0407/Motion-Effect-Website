exports.source = `

attribute vec3 a_position;
varying vec2 v_uv0;
attribute vec2 a_texcoord0;

void main()
{
    gl_Position = vec4(a_position, 1.0);
    v_uv0 = a_texcoord0;
}

`