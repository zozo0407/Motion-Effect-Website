exports.source = `

uniform vec2 u_size;
uniform float u_intensity;  // 添加intensity uniform

attribute vec4 a_position;
varying vec2 v_xy;
attribute vec2 a_texcoord0;

void main()
{
    gl_Position = a_position;
    // 根据intensity在原始UV和变换后的UV之间插值
    v_xy = mix( a_texcoord0, a_texcoord0 * u_size, u_intensity);
}

`