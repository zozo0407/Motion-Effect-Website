function clamp(n, a, b) {
  const x = Number(n);
  if (!Number.isFinite(x)) return a;
  return Math.max(a, Math.min(b, x));
}

function sanitizeHexColor(c, fallback) {
  const s = typeof c === 'string' ? c.trim() : '';
  if (/^#[0-9a-fA-F]{6}$/.test(s)) return s.toLowerCase();
  return fallback;
}

function buildLiquidMetalEffectCode(opts = {}) {
  const primaryColor = sanitizeHexColor(opts.primaryColor, '#f59e0b');
  const metalness = clamp(opts.metalness, 0.2, 1.0);
  const roughness = clamp(opts.roughness, 0.02, 0.8);
  const flowIntensity = clamp(opts.flowIntensity, 0.0, 1.0);
  const speed = clamp(opts.speed, 0.2, 3.0);

  return `import * as THREE from 'three';

export default class EngineEffect {
  constructor() {
    this.params = {
      primaryColor: '${primaryColor}',
      metalness: ${metalness},
      roughness: ${roughness},
      flowIntensity: ${flowIntensity},
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
      { bind: 'metalness', name: '金属感', type: 'range', value: this.params.metalness, min: 0.2, max: 1.0, step: 0.02 },
      { bind: 'roughness', name: '粗糙度', type: 'range', value: this.params.roughness, min: 0.02, max: 0.8, step: 0.02 },
      { bind: 'flowIntensity', name: '流动感', type: 'range', value: this.params.flowIntensity, min: 0.0, max: 1.0, step: 0.02 },
      { bind: 'speed', name: '速度', type: 'range', value: this.params.speed, min: 0.2, max: 3.0, step: 0.05 }
    ];
  }

  setParam(key, value) {
    this.params[key] = value;
    if (!this.material) return;
    if (key === 'primaryColor') this.material.color.set(value);
    if (key === 'metalness') this.material.metalness = Number(value) || this.material.metalness;
    if (key === 'roughness') this.material.roughness = Number(value) || this.material.roughness;
  }

  onStart(ctx) {
    const width = Math.max(1, Math.floor((ctx && (ctx.width || (ctx.size && ctx.size.width))) || 1));
    const height = Math.max(1, Math.floor((ctx && (ctx.height || (ctx.size && ctx.size.height))) || 1));
    const dpr = Math.max(1, Math.min(2, Number(ctx && (ctx.dpr || (ctx.size && ctx.size.dpr))) || 1));

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x080808);

    this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    this.camera.position.set(0, 0, 4.8);

    const rendererOptions = { antialias: true, alpha: true };
    if (ctx && ctx.canvas) rendererOptions.canvas = ctx.canvas;
    if (ctx && ctx.gl) rendererOptions.context = ctx.gl;
    this.renderer = new THREE.WebGLRenderer(rendererOptions);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(width, height, false);

    const ambient = new THREE.AmbientLight(0xffffff, 0.45);
    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(4, 3, 5);
    const rim = new THREE.PointLight(0xffd166, 1.2, 15);
    rim.position.set(-3, -1, 3);
    this.scene.add(ambient);
    this.scene.add(key);
    this.scene.add(rim);

    this.material = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(this.params.primaryColor),
      metalness: this.params.metalness,
      roughness: this.params.roughness,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08
    });

    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(1.15, 96, 96), this.material);
    this.scene.add(this.mesh);
  }

  onUpdate(ctx) {
    if (!this.renderer || !this.scene || !this.camera || !this.mesh) return;
    const time = (ctx && typeof ctx.time === 'number') ? ctx.time : 0;
    const dt = (ctx && typeof ctx.deltaTime === 'number') ? ctx.deltaTime : 1 / 60;
    const pulse = 1.0 + Math.sin(time * (1.1 + this.params.speed * 0.4)) * 0.05 * this.params.flowIntensity;
    this.mesh.scale.setScalar(pulse);
    this.mesh.rotation.y += dt * 0.25 * this.params.speed;
    this.mesh.rotation.x += dt * 0.08 * this.params.speed;
    this.renderer.render(this.scene, this.camera);
  }

  onResize(ctx) {
    if (!this.camera || !this.renderer) return;
    const width = Math.max(1, Math.floor((ctx && (ctx.width || (ctx.size && ctx.size.width))) || 1));
    const height = Math.max(1, Math.floor((ctx && (ctx.height || (ctx.size && ctx.size.height))) || 1));
    const dpr = Math.max(1, Math.min(2, Number(ctx && (ctx.dpr || (ctx.size && ctx.size.dpr))) || 1));
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(width, height, false);
  }

  onDestroy() {
    if (this.mesh) {
      this.mesh.geometry.dispose();
      this.mesh.material.dispose();
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
  buildLiquidMetalEffectCode
};
