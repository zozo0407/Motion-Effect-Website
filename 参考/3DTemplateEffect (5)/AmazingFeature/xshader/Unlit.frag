precision highp float;
uniform sampler2D u_AlbedoTexture;
uniform vec4 u_AlbedoColor;
uniform vec2 u_Repeat;
uniform vec2 u_Offset;
uniform float u_Translucency;
uniform float u_Opacity;
varying vec2 g_vary_uv0;
void main ()
{
  vec2 uv_1;
  uv_1.x = g_vary_uv0.x;
  uv_1.y = (g_vary_uv0.y);
  lowp vec4 tmpvar_2;
  tmpvar_2 = texture2D (u_AlbedoTexture, (uv_1 * u_Repeat + u_Offset));
  lowp vec3 tmpvar_3;
  tmpvar_3 = (tmpvar_2.xyz * u_AlbedoColor.xyz);
  lowp float tmpvar_4;
  tmpvar_4 = (tmpvar_2.w * u_Translucency);
  mediump vec4 tmpvar_5;
  tmpvar_5.xyz = tmpvar_3;
  tmpvar_5.w = tmpvar_4;
  gl_FragColor = vec4(tmpvar_5.xyz * u_Opacity, tmpvar_5.w * u_Opacity);
}

