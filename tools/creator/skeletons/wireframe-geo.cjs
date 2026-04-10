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

function buildWireframeGeoEffectCode(opts = {}) {
  const primaryColor = sanitizeHexColor(opts.primaryColor, '#22c55e');
  const speed = clamp(opts.speed, 0.2, 3.0);
  const scale = clamp(opts.scale, 0.4, 2.0);
  const glowIntensity = clamp(opts.glowIntensity, 0.2, 3.0);

  return `import * as THREE from 'three';

export default class EngineEffect {
  constructor() {
    this.params = {
      primaryColor: '${primaryColor}',
      speed: ${speed},
      scale: ${scale},
      glowIntensity: ${glowIntensity}
    };
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.group = null;
    this.lines = null;
    this.glowLines = null;
  }

  getUIConfig() {
    return [
      { bind: 'primaryColor', name: '主色调', type: 'color', value: this.params.primaryColor },
      { bind: 'speed', name: '旋转速度', type: 'range', value: this.params.speed, min: 0.2, max: 3.0, step: 0.05 },
      { bind: 'scale', name: '缩放', type: 'range', value: this.params.scale, min: 0.4, max: 2.0, step: 0.05 },
      { bind: 'glowIntensity', name: '发光强度', type: 'range', value: this.params.glowIntensity, min: 0.2, max: 3.0, step: 0.05 }
    ];
  }

  setParam(key, value) {
    this.params[key] = value;
    if (key === 'primaryColor') {
      if (this.lines && this.lines.material) this.lines.material.color.set(value);
      if (this.glowLines && this.glowLines.material) this.glowLines.material.color.set(value);
    }
    if (key === 'glowIntensity' && this.glowLines && this.glowLines.material) {
      this.glowLines.material.opacity = Math.max(0.08, Math.min(0.95, Number(value) * 0.22));
    }
  }

  onStart(ctx) {
    const size = ctx && ctx.size ? ctx.size : { width: 1, height: 1, dpr: 1 };
    const width = Math.max(1, Math.floor(size.width || 1));
    const height = Math.max(1, Math.floor(size.height || 1));
    const dpr = Math.max(1, Math.min(2, Number(size.dpr) || 1));

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x03060a);

    this.camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 100);
    this.camera.position.set(0, 0, 5.5);

    const rendererOptions = { antialias: true, alpha: true };
    if (ctx && ctx.canvas) rendererOptions.canvas = ctx.canvas;
    if (ctx && ctx.gl) rendererOptions.context = ctx.gl;
    this.renderer = new THREE.WebGLRenderer(rendererOptions);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(width, height, false);

    const ambient = new THREE.AmbientLight(0xffffff, 0.35);
    const point = new THREE.PointLight(0xffffff, 1.2, 30);
    point.position.set(3, 3, 5);
    this.scene.add(ambient);
    this.scene.add(point);

    this.group = new THREE.Group();
    this.scene.add(this.group);

    const geometry = new THREE.TorusKnotGeometry(1.2, 0.32, 180, 24);
    const edges = new THREE.EdgesGeometry(geometry, 25);

    const lineMaterial = new THREE.LineBasicMaterial({ color: new THREE.Color(this.params.primaryColor) });
    this.lines = new THREE.LineSegments(edges, lineMaterial);
    this.group.add(this.lines);

    const glowMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color(this.params.primaryColor),
      transparent: true,
      opacity: Math.max(0.08, Math.min(0.95, this.params.glowIntensity * 0.22))
    });
    this.glowLines = new THREE.LineSegments(edges.clone(), glowMaterial);
    this.glowLines.scale.setScalar(1.03);
    this.group.add(this.glowLines);
  }

  onUpdate(ctx) {
    if (!this.renderer || !this.scene || !this.camera || !this.group) return;
    const dt = (ctx && typeof ctx.deltaTime === 'number') ? ctx.deltaTime : 1 / 60;
    this.group.scale.setScalar(this.params.scale);
    this.group.rotation.x += dt * 0.45 * this.params.speed;
    this.group.rotation.y += dt * 0.65 * this.params.speed;
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
    if (this.lines) {
      this.lines.geometry.dispose();
      this.lines.material.dispose();
    }
    if (this.glowLines) {
      this.glowLines.geometry.dispose();
      this.glowLines.material.dispose();
    }
    if (this.renderer) this.renderer.dispose();
    this.group = null;
    this.lines = null;
    this.glowLines = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
  }
}
`;
}

module.exports = {
  buildWireframeGeoEffectCode
};
