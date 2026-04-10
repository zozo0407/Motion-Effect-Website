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

function buildGlassGeoEffectCode(opts = {}) {
  const primaryColor = sanitizeHexColor(opts.primaryColor, '#60a5fa');
  const secondaryColor = sanitizeHexColor(opts.secondaryColor, '#93c5fd');
  const transparency = clamp(opts.transparency, 0.1, 0.9);
  const roughness = clamp(opts.roughness, 0.02, 0.9);
  const metalness = clamp(opts.metalness, 0.0, 1.0);

  return `import * as THREE from 'three';

export default class EngineEffect {
  constructor() {
    this.params = {
      primaryColor: '${primaryColor}',
      secondaryColor: '${secondaryColor}',
      transparency: ${transparency},
      roughness: ${roughness},
      metalness: ${metalness}
    };
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.group = null;
    this.outerMesh = null;
    this.innerMesh = null;
  }

  getUIConfig() {
    return [
      { bind: 'primaryColor', name: '主体色', type: 'color', value: this.params.primaryColor },
      { bind: 'secondaryColor', name: '内光色', type: 'color', value: this.params.secondaryColor },
      { bind: 'transparency', name: '透明度', type: 'range', value: this.params.transparency, min: 0.1, max: 0.9, step: 0.05 },
      { bind: 'roughness', name: '粗糙度', type: 'range', value: this.params.roughness, min: 0.02, max: 0.9, step: 0.02 },
      { bind: 'metalness', name: '金属感', type: 'range', value: this.params.metalness, min: 0.0, max: 1.0, step: 0.02 }
    ];
  }

  setParam(key, value) {
    this.params[key] = value;
    if (this.outerMesh && this.outerMesh.material) {
      if (key === 'primaryColor') this.outerMesh.material.color.set(value);
      if (key === 'transparency') this.outerMesh.material.opacity = Number(value) || this.outerMesh.material.opacity;
      if (key === 'roughness') this.outerMesh.material.roughness = Number(value) || this.outerMesh.material.roughness;
      if (key === 'metalness') this.outerMesh.material.metalness = Number(value) || this.outerMesh.material.metalness;
    }
    if (this.innerMesh && this.innerMesh.material && key === 'secondaryColor') {
      this.innerMesh.material.emissive.set(value);
      this.innerMesh.material.color.set(value);
    }
  }

  onStart(ctx) {
    const width = Math.max(1, Math.floor((ctx && (ctx.width || (ctx.size && ctx.size.width))) || 1));
    const height = Math.max(1, Math.floor((ctx && (ctx.height || (ctx.size && ctx.size.height))) || 1));
    const dpr = Math.max(1, Math.min(2, Number(ctx && (ctx.dpr || (ctx.size && ctx.size.dpr))) || 1));

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x070b14);

    this.camera = new THREE.PerspectiveCamera(52, width / height, 0.1, 100);
    this.camera.position.set(0, 0.2, 5.6);

    const rendererOptions = { antialias: true, alpha: true };
    if (ctx && ctx.canvas) rendererOptions.canvas = ctx.canvas;
    if (ctx && ctx.gl) rendererOptions.context = ctx.gl;
    this.renderer = new THREE.WebGLRenderer(rendererOptions);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(width, height, false);

    this.group = new THREE.Group();
    this.scene.add(this.group);

    const ambient = new THREE.AmbientLight(0xffffff, 0.42);
    const point = new THREE.PointLight(new THREE.Color(this.params.secondaryColor), 2.0, 18);
    point.position.set(0, 0, 2.5);
    this.scene.add(ambient);
    this.scene.add(point);

    this.outerMesh = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.25, 1),
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(this.params.primaryColor),
        transparent: true,
        opacity: this.params.transparency,
        roughness: this.params.roughness,
        metalness: this.params.metalness,
        transmission: 0.6,
        thickness: 0.8
      })
    );
    this.group.add(this.outerMesh);

    this.innerMesh = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.52, 0),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(this.params.secondaryColor),
        emissive: new THREE.Color(this.params.secondaryColor),
        emissiveIntensity: 1.3,
        roughness: 0.18,
        metalness: 0.1
      })
    );
    this.group.add(this.innerMesh);
  }

  onUpdate(ctx) {
    if (!this.renderer || !this.scene || !this.camera || !this.group) return;
    const dt = (ctx && typeof ctx.deltaTime === 'number') ? ctx.deltaTime : 1 / 60;
    this.group.rotation.y += dt * 0.35;
    this.group.rotation.x += dt * 0.18;
    if (this.innerMesh) this.innerMesh.rotation.y -= dt * 0.55;
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
    if (this.outerMesh) {
      this.outerMesh.geometry.dispose();
      this.outerMesh.material.dispose();
    }
    if (this.innerMesh) {
      this.innerMesh.geometry.dispose();
      this.innerMesh.material.dispose();
    }
    if (this.renderer) this.renderer.dispose();
    this.group = null;
    this.outerMesh = null;
    this.innerMesh = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
  }
}
`;
}

module.exports = {
  buildGlassGeoEffectCode
};
