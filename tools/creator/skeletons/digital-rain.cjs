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

function buildDigitalRainEffectCode(opts = {}) {
  const primaryColor = sanitizeHexColor(opts.primaryColor, '#ff0000');
  const secondaryColor = sanitizeHexColor(opts.secondaryColor, '#ff3366');
  const speed = clamp(opts.speed, 0.3, 3.0);
  const density = clamp(opts.density, 0.6, 1.8);
  const glowIntensity = clamp(opts.glowIntensity, 0.2, 2.5);

  return `import * as THREE from 'three';

export default class EngineEffect {
  constructor() {
    this.params = {
      primaryColor: '${primaryColor}',
      secondaryColor: '${secondaryColor}',
      speed: ${speed},
      density: ${density},
      glowIntensity: ${glowIntensity}
    };
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.instancedMesh = null;
    this.columns = [];
    this.count = 0;
  }

  getUIConfig() {
    return [
      { bind: 'primaryColor', name: '主色调', type: 'color', value: this.params.primaryColor },
      { bind: 'secondaryColor', name: '辅助色', type: 'color', value: this.params.secondaryColor },
      { bind: 'speed', name: '下落速度', type: 'range', value: this.params.speed, min: 0.3, max: 3.0, step: 0.05 },
      { bind: 'density', name: '密度', type: 'range', value: this.params.density, min: 0.6, max: 1.8, step: 0.05 },
      { bind: 'glowIntensity', name: '发光强度', type: 'range', value: this.params.glowIntensity, min: 0.2, max: 2.5, step: 0.05 }
    ];
  }

  setParam(key, value) {
    this.params[key] = value;
    if (!this.instancedMesh || !this.instancedMesh.material) return;
    const mat = this.instancedMesh.material;
    if (key === 'primaryColor') mat.color.set(value);
    if (key === 'secondaryColor') mat.emissive.set(value);
    if (key === 'glowIntensity') mat.emissiveIntensity = Number(value) || 0;
    if (key === 'density') this._buildColumns();
  }

  _buildColumns() {
    if (!this.scene) return;
    if (this.instancedMesh) {
      this.scene.remove(this.instancedMesh);
      this.instancedMesh.geometry.dispose();
      this.instancedMesh.material.dispose();
      this.instancedMesh = null;
    }

    const columnCount = Math.max(12, Math.floor(28 * this.params.density));
    const rowCount = Math.max(16, Math.floor(22 * this.params.density));
    this.count = columnCount * rowCount;
    this.columns = [];

    const geometry = new THREE.PlaneGeometry(0.14, 0.42);
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(this.params.primaryColor),
      emissive: new THREE.Color(this.params.secondaryColor),
      emissiveIntensity: this.params.glowIntensity,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide
    });

    this.instancedMesh = new THREE.InstancedMesh(geometry, material, this.count);
    this.instancedMesh.frustumCulled = false;
    this.scene.add(this.instancedMesh);

    const matrix = new THREE.Matrix4();
    let index = 0;
    for (let col = 0; col < columnCount; col += 1) {
      const x = (col - columnCount / 2) * 0.28;
      const speed = 0.35 + (col % 5) * 0.18 + this.params.speed * 0.28;
      for (let row = 0; row < rowCount; row += 1) {
        const y = row * 0.52 - rowCount * 0.24;
        const phase = ((col * 31 + row * 17) % 100) / 100;
        this.columns.push({ x, baseY: y, speed, phase });
        matrix.makeTranslation(x, y, 0);
        this.instancedMesh.setMatrixAt(index, matrix);
        index += 1;
      }
    }
    this.instancedMesh.instanceMatrix.needsUpdate = true;
  }

  onStart(ctx) {
    const width = Math.max(1, Math.floor((ctx && (ctx.width || (ctx.size && ctx.size.width))) || 1));
    const height = Math.max(1, Math.floor((ctx && (ctx.height || (ctx.size && ctx.size.height))) || 1));
    const dpr = Math.max(1, Math.min(2, Number(ctx && (ctx.dpr || (ctx.size && ctx.size.dpr))) || 1));

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x05020a);

    this.camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 100);
    this.camera.position.set(0, 0, 8);

    const rendererOptions = { antialias: true, alpha: true };
    if (ctx && ctx.canvas) rendererOptions.canvas = ctx.canvas;
    if (ctx && ctx.gl) rendererOptions.context = ctx.gl;
    this.renderer = new THREE.WebGLRenderer(rendererOptions);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(width, height, false);

    const ambient = new THREE.AmbientLight(0xffffff, 0.22);
    const point = new THREE.PointLight(0xff6677, 1.1, 25);
    point.position.set(0, 2, 5);
    this.scene.add(ambient);
    this.scene.add(point);

    this._buildColumns();
  }

  onUpdate(ctx) {
    if (!this.renderer || !this.scene || !this.camera || !this.instancedMesh) return;
    const time = (ctx && typeof ctx.time === 'number') ? ctx.time : 0;
    const matrix = new THREE.Matrix4();
    for (let i = 0; i < this.columns.length; i += 1) {
      const item = this.columns[i];
      const y = ((((item.baseY - time * item.speed - item.phase * 6.0) + 9.5) % 19.0) - 9.5);
      matrix.makeTranslation(item.x, y, 0);
      this.instancedMesh.setMatrixAt(i, matrix);
    }
    this.instancedMesh.instanceMatrix.needsUpdate = true;
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
    if (this.instancedMesh) {
      this.instancedMesh.geometry.dispose();
      this.instancedMesh.material.dispose();
    }
    if (this.renderer) this.renderer.dispose();
    this.instancedMesh = null;
    this.columns = [];
    this.scene = null;
    this.camera = null;
    this.renderer = null;
  }
}
`;
}

module.exports = {
  buildDigitalRainEffectCode
};
