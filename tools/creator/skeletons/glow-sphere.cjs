function clamp(n, a, b) {
  const x = Number(n);
  if (!Number.isFinite(x)) return a;
  return Math.max(a, Math.min(b, x));
}

function sanitizeHexColor(c, fallback) {
  const s = typeof c === 'string' ? c.trim() : '';
  if (/^#[0-9a-fA-F]{6}$/.test(s)) return s.toLowerCase();
  return (fallback && /^#[0-9a-fA-F]{6}$/.test(fallback)) ? fallback.toLowerCase() : '#ff0040';
}

function buildGlowSphereEffectCode(opts) {
  const color = sanitizeHexColor(opts && opts.color, '#ff0040');
  const glowIntensity = clamp(opts && opts.glowIntensity, 0.0, 3.0);
  const speed = clamp(opts && opts.speed, 0.0, 3.0);

  // NOTE: The generated code must be ES module code and must not touch DOM/window/navigator.
  return `import * as THREE from 'three';

export default class EngineEffect {
  constructor() {
    this.params = {
      primaryColor: '${color}',
      glowIntensity: ${glowIntensity},
      speed: ${speed}
    };

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.mesh = null;
    this.material = null;
  }

  getUIConfig() {
    return [
      { bind: 'primaryColor', name: '主色调', type: 'color', value: this.params.primaryColor },
      { bind: 'glowIntensity', name: '发光强度', type: 'range', value: this.params.glowIntensity, min: 0.0, max: 3.0, step: 0.05 },
      { bind: 'speed', name: '速度', type: 'range', value: this.params.speed, min: 0.0, max: 3.0, step: 0.05 }
    ];
  }

  setParam(key, value) {
    this.params = this.params || {};
    this.params[key] = value;

    if (!this.material || !this.material.uniforms) return;
    if (key === 'primaryColor' && typeof value === 'string') {
      this.material.uniforms.uColor.value.set(value);
      return;
    }
    if (key === 'glowIntensity' && typeof value === 'number' && Number.isFinite(value)) {
      this.material.uniforms.uGlow.value = value;
      return;
    }
    if (key === 'speed' && typeof value === 'number' && Number.isFinite(value)) {
      this.material.uniforms.uSpeed.value = value;
    }
  }

  onStart(ctx) {
    const size = ctx && ctx.size ? ctx.size : { width: 1, height: 1, dpr: 1 };
    const width = Math.max(1, Math.floor(size.width || 1));
    const height = Math.max(1, Math.floor(size.height || 1));
    const dpr = Math.max(1, Math.min(2, Number(size.dpr) || 1));

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a12);

    this.camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 100);
    this.camera.position.set(0, 0, 4.2);

    const rendererOptions = { antialias: true, alpha: true };
    if (ctx && ctx.canvas) rendererOptions.canvas = ctx.canvas;
    if (ctx && ctx.gl) rendererOptions.context = ctx.gl;
    this.renderer = new THREE.WebGLRenderer(rendererOptions);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(width, height, false);

    const ambient = new THREE.AmbientLight(0xffffff, 0.2);
    const point = new THREE.PointLight(0xff3355, 1.0, 20);
    point.position.set(3, 2, 4);
    this.scene.add(ambient);
    this.scene.add(point);

    const geo = new THREE.IcosahedronGeometry(1.0, 5);

    const uniforms = {
      uTime: { value: 0.0 },
      uSpeed: { value: this.params.speed },
      uGlow: { value: this.params.glowIntensity },
      uColor: { value: new THREE.Color(this.params.primaryColor) }
    };

    const vert = \`
      varying vec3 vNormal;
      varying vec3 vWorldPos;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    \`;

    const frag = \`
      precision highp float;
      varying vec3 vNormal;
      varying vec3 vWorldPos;

      uniform float uTime;
      uniform float uSpeed;
      uniform float uGlow;
      uniform vec3 uColor;

      void main() {
        vec3 n = normalize(vNormal);
        vec3 viewDir = normalize(-vWorldPos);

        float fresnel = pow(1.0 - max(dot(n, viewDir), 0.0), 3.0);
        float pulse = 0.5 + 0.5 * sin(uTime * (0.8 + uSpeed * 1.2) + length(vWorldPos) * 1.5);

        vec3 base = uColor * 0.6;
        vec3 glow = uColor * (fresnel * (0.6 + 0.6 * pulse) * uGlow);

        vec3 finalColor = base + glow;
        gl_FragColor = vec4(finalColor, 1.0);
      }
    \`;

    this.material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: vert,
      fragmentShader: frag,
      transparent: false,
      depthWrite: true
    });

    this.mesh = new THREE.Mesh(geo, this.material);
    this.mesh.rotation.y = 0.78539816339;
    this.mesh.rotation.x = 0.31415926535;
    this.scene.add(this.mesh);
  }

  onResize(size) {
    if (!this.camera || !this.renderer) return;
    const width = Math.max(1, Math.floor(size && size.width ? size.width : 1));
    const height = Math.max(1, Math.floor(size && size.height ? size.height : 1));
    const dpr = Math.max(1, Math.min(2, Number(size && size.dpr) || 1));
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(width, height, false);
  }

  onUpdate(ctx) {
    if (!this.renderer || !this.scene || !this.camera) return;
    const time = (ctx && typeof ctx.time === 'number') ? ctx.time : 0;
    const dt = (ctx && typeof ctx.deltaTime === 'number') ? ctx.deltaTime : (1.0 / 60.0);

    if (this.material && this.material.uniforms) {
      this.material.uniforms.uTime.value = time;
      this.material.uniforms.uSpeed.value = this.params.speed;
      this.material.uniforms.uGlow.value = this.params.glowIntensity;
    }

    if (this.mesh) {
      const s = Number.isFinite(this.params.speed) ? this.params.speed : 1.0;
      this.mesh.rotation.y += 0.25 * s * dt;
      this.mesh.rotation.x += 0.10 * s * dt;
    }

    this.renderer.render(this.scene, this.camera);
  }

  onDestroy() {
    if (this.mesh) {
      if (this.mesh.geometry) this.mesh.geometry.dispose();
      if (this.mesh.material) this.mesh.material.dispose();
    }
    if (this.renderer) this.renderer.dispose();
    this.mesh = null;
    this.material = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
  }
}
`;
}

module.exports = {
  buildGlowSphereEffectCode
};

