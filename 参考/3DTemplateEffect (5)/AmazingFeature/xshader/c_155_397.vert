precision highp float; attribute vec3 attPosition; attribute vec2 attTexcoord0; uniform mat4 u_MVP; uniform mat4 u_MV; uniform mat4 u_Projection;
      varying vec2 vUv;
      void main() {
        vUv = attTexcoord0;
        gl_Position = u_MVP *  vec4(attPosition, 1.0);
      }
    
