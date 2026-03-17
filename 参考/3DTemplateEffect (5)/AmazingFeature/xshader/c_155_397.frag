precision highp float;
      uniform sampler2D mapA;
      uniform sampler2D mapB;
      uniform float mixProgress;
      uniform vec2 uvScale;
      uniform vec2 uvOffset;
      varying vec2 vUv;
      void main() {
        vec2 uvp = vUv * uvScale + uvOffset;
        vec4 colorA = texture2D(mapA, uvp);
        vec4 colorB = texture2D(mapB, uvp);
        gl_FragColor = mix(colorA, colorB, mixProgress);
      }
    
