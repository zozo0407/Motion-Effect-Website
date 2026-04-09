function clamp(n, a, b) {
  const x = Number(n);
  if (!Number.isFinite(x)) return a;
  return Math.max(a, Math.min(b, x));
}

function sanitizeHexColor(c, fallback) {
  const s = typeof c === 'string' ? c.trim() : '';
  if (/^#[0-9a-fA-F]{6}$/.test(s)) return s.toLowerCase();
  return (fallback && /^#[0-9a-fA-F]{6}$/.test(fallback)) ? fallback.toLowerCase() : '#00caff';
}

function buildParticlesEffectCode(opts) {
  const color = sanitizeHexColor(opts && opts.color, '#00caff');
  const speed = clamp(opts && opts.speed, 0.0, 3.0);
  const density = Math.floor(clamp(opts && opts.density, 300, 4000));

  return `import * as THREE from 'three';

export default class EngineEffect {
  constructor() {
    this.params = {
      color: '${color}',
      speed: ${speed},
      density: ${density}
    };
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.points = null;
    this.geometry = null;
    this.material = null;
    this._seed = 1337;
  }

  getUIConfig() {
    return [
      { bind: 'color', name: '主色调', type: 'color', value: this.params.color },
      { bind: 'speed', name: '速度', type: 'range', value: this.params.speed, min: 0.0, max: 3.0, step: 0.05 },
      { bind: 'density', name: '密度', type: 'range', value: this.params.density, min: 300, max: 4000, step: 100 }
    ];
  }

  setParam(key, value) {
    this.params = this.params || {};
    this.params[key] = value;

    if (key === 'color' && typeof value === 'string') {
      if (this.material && this.material.uniforms && this.material.uniforms.uColor) {
        this.material.uniforms.uColor.value.set(value);
      }
      return;
    }
    if (key === 'speed' && typeof value === 'number' && Number.isFinite(value)) {
      if (this.material && this.material.uniforms && this.material.uniforms.uSpeed) {
        this.material.uniforms.uSpeed.value = value;
      }
      return;
    }
    if (key === 'density' && typeof value === 'number' && Number.isFinite(value)) {
      const d = Math.max(300, Math.min(4000, Math.floor(value)));
      this.params.density = d;
      this._rebuildParticles();
    }
  }

  _rand() {
    // LCG: deterministic pseudo-random generator
    this._seed = (1664525 * this._seed + 1013904223) >>> 0;
    return (this._seed & 0xffffff) / 0x1000000;
  }

  _rebuildParticles() {
    if (!this.scene) return;

    if (this.points) {
      this.scene.remove(this.points);
      this.points = null;
    }
    if (this.geometry) {
      this.geometry.dispose();
      this.geometry = null;
    }

    const count = Math.max(300, Math.min(4000, Math.floor(this.params.density || 1500)));
    const positions = new Float32Array(count * 3);
    const phases = new Float32Array(count);

    // Reset seed so "same prompt / same density" looks stable
    this._seed = 1337 ^ (count * 2654435761 >>> 0);

    for (let i = 0; i < count; i += 1) {
      // Random point in a soft sphere
      const u = this._rand();
      const v = this._rand();
      const w = this._rand();
      const theta = 6.28318530718 * u;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = Math.pow(w, 0.6) * 1.6;
      const sinPhi = Math.sin(phi);
      const x = r * sinPhi * Math.cos(theta);
      const y = r * Math.cos(phi);
      const z = r * sinPhi * Math.sin(theta);
      positions[i * 3 + 0] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      phases[i] = this._rand() * 6.28318530718;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    this.geometry = geo;

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0.0 },
        uSpeed: { value: Number.isFinite(this.params.speed) ? this.params.speed : 1.0 },
        uColor: { value: new THREE.Color(this.params.color) },
        uSize: { value: 3.0 }
      },
      vertexShader: \`
        attribute float aPhase;
        uniform float uTime;
        uniform float uSpeed;
        uniform float uSize;
        varying float vPulse;
        void main() {
          vec3 p = position;
          float t = uTime * (0.6 + 1.2 * uSpeed) + aPhase;
          // Gentle swirl
          p.xz = mat2(cos(t*0.2), -sin(t*0.2), sin(t*0.2), cos(t*0.2)) * p.xz;
          // Breathing
          float breathe = 0.06 * sin(t);
          p *= (1.0 + breathe);
          vPulse = 0.5 + 0.5 * sin(t);
          vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          // Size attenuates with distance
          gl_PointSize = uSize * (300.0 / -mvPosition.z);
        }
      \`,
      fragmentShader: \`
        precision highp float;
        uniform vec3 uColor;
        varying float vPulse;
        void main() {
          vec2 uv = gl_PointCoord.xy * 2.0 - 1.0;
          float r2 = dot(uv, uv);
          if (r2 > 1.0) discard;
          float a = smoothstep(1.0, 0.0, r2);
          a *= (0.6 + 0.4 * vPulse);
          vec3 c = uColor * (0.6 + 0.8 * a);
          gl_FragColor = vec4(c, a);
        }
      \`,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.points);
  }

  onStart(ctx) {
    const size = ctx && ctx.size ? ctx.size : { width: 1, height: 1, dpr: 1 };
    const width = Math.max(1, Math.floor(size.width || 1));
    const height = Math.max(1, Math.floor(size.height || 1));
    const dpr = Math.max(1, Math.min(2, Number(size.dpr) || 1));

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x05050a);

    this.camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 100);
    this.camera.position.set(0, 0, 5.0);

    const rendererOptions = { antialias: true, alpha: true };
    if (ctx && ctx.canvas) rendererOptions.canvas = ctx.canvas;
    if (ctx && ctx.gl) rendererOptions.context = ctx.gl;
    this.renderer = new THREE.WebGLRenderer(rendererOptions);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(width, height, false);

    const ambient = new THREE.AmbientLight(0xffffff, 0.15);
    this.scene.add(ambient);

    this._rebuildParticles();
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

    if (this.material && this.material.uniforms) {
      this.material.uniforms.uTime.value = time;
      this.material.uniforms.uSpeed.value = Number.isFinite(this.params.speed) ? this.params.speed : 1.0;
    }
    if (this.points) {
      const s = Number.isFinite(this.params.speed) ? this.params.speed : 1.0;
      this.points.rotation.y = time * 0.10 * s;
      this.points.rotation.x = time * 0.05 * s;
    }

    this.renderer.render(this.scene, this.camera);
  }

  onDestroy() {
    if (this.points && this.scene) this.scene.remove(this.points);
    if (this.geometry) this.geometry.dispose();
    if (this.material) this.material.dispose();
    if (this.renderer) this.renderer.dispose();
    this.points = null;
    this.geometry = null;
    this.material = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
  }
}
`;
}

module.exports = {
  buildParticlesEffectCode
};

