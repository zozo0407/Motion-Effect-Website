import * as THREE from 'three';

let renderer, scene, camera, mesh, uniforms;
let animationId;
let resizeHandler;

export const initHero = () => {
  const container = document.getElementById('hero-canvas');
  if (!container) return;

  if (animationId) cancelAnimationFrame(animationId);
  if (renderer) {
    renderer.dispose();
    if (scene) {
      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) object.material.dispose();
      });
    }
  }
  if (resizeHandler) {
    window.removeEventListener('resize', resizeHandler);
    resizeHandler = null;
  }
  if (typeof ScrollTrigger !== 'undefined') {
    ScrollTrigger.getAll().forEach((t) => t.kill());
  }

  container.innerHTML = '';

  const canvas = document.createElement('canvas');
  canvas.className = 'fixed top-0 left-0 w-full h-full block';
  container.appendChild(canvas);

  scene = new THREE.Scene();

  renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: false,
    antialias: true,
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setClearColor(new THREE.Color(0x000000));

  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, -1);

  const vertexShader = `
    attribute vec3 position;
    void main() {
      gl_Position = vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    precision highp float;
    uniform vec2 resolution;
    uniform float time;
    uniform float xScale;
    uniform float yScale;
    uniform float distortion;

    void main() {
      vec2 p = (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y);
      p.x += 1.0;
      float d = length(p) * distortion;
      float rx = p.x * (1.0 + d);
      float gx = p.x;
      float bx = p.x * (1.0 - d);
      float r = 0.03 / abs(p.y + sin(rx * xScale + time) * yScale);
      float g = 0.03 / abs(p.y + sin(gx * xScale + time) * yScale);
      float b = 0.03 / abs(p.y + sin(bx * xScale + time) * yScale);

      float uvX = gl_FragCoord.x / resolution.x;
      float edgeDist = min(uvX, 1.0 - uvX);
      float mask = smoothstep(0.0, 0.1, edgeDist) * 0.5 + 0.5;

      gl_FragColor = vec4(r * mask, g * mask, b * mask, 1.0);
    }
  `;

  uniforms = {
    resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    time: { value: 0.0 },
    xScale: { value: 1.0 },
    yScale: { value: 0.5 },
    distortion: { value: 0.05 },
  };

  const position = [
    -1.0, -1.0, 0.0,
    1.0, -1.0, 0.0,
    -1.0, 1.0, 0.0,
    1.0, -1.0, 0.0,
    -1.0, 1.0, 0.0,
    1.0, 1.0, 0.0,
  ];
  const positions = new THREE.BufferAttribute(new Float32Array(position), 3);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', positions);

  const material = new THREE.RawShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
    side: THREE.DoubleSide,
  });

  mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  const handleResize = () => {
    if (!renderer || !uniforms) return;
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height, false);
    uniforms.resolution.value.set(width, height);
  };
  resizeHandler = handleResize;
  window.addEventListener('resize', handleResize);
  handleResize();

  const settings = { speed: 0.01 };
  const animate = () => {
    if (uniforms) uniforms.time.value += settings.speed;
    if (renderer && scene && camera) renderer.render(scene, camera);
    animationId = requestAnimationFrame(animate);
  };
  animate();

  if (typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
    gsap.to(uniforms.xScale, {
      scrollTrigger: {
        trigger: document.body,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1,
      },
      value: 0.2,
      ease: 'none',
    });
  }
};
