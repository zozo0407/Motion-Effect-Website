// --- Template Generator Engine ---
 export function generateTemplateHTML(type, params) {
     // Determine base path for imports
     const origin = window.location.origin;
     const currentPath = window.location.pathname;
     const basePath = currentPath.substring(0, currentPath.lastIndexOf('/') + 1);
     
     // Construct full absolute URL for local environment to support Blob URL import
     // Assuming the structure: root/index.html and root/my-motion-portfolio/public/js/UnifiedRenderer.js
     const rendererPath = origin + basePath + 'my-motion-portfolio/public/js/UnifiedRenderer.js';
     const threePath = origin + basePath + 'my-motion-portfolio/public/js/libs/three/three.module.js';
     const threeAddonsPath = origin + basePath + 'my-motion-portfolio/public/js/libs/three/addons/';
       // Base Template
     const head = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Generated Demo</title>
    <style>body { margin: 0; overflow: hidden; background: #000; }</style>
    <script async src="https://unpkg.com/es-module-shims@1.8.0/dist/es-module-shims.js"><\/script>
    <script type="importmap">
 { 
     "imports": { 
         "three": "${threePath}",
         "three/addons/": "${threeAddonsPath}"
     } 
 }
    <\/script>
    <link rel="modulepreload" href="${threePath}">
    <link rel="modulepreload" href="${rendererPath}">
    ${type === 'text' ? '<script src="https://cdn.jsdelivr.net/npm/p5@1.11.10/lib/p5.js"><\/script>' : ''}
</head>
<body>
    <script type="module">
 import { UnifiedRenderer } from '${rendererPath}';
 import * as THREE from 'three';
`;
     
     let scriptBody = '';
       if (type === 'particles') {
         // Advanced Particle System with InstancedMesh, Tween, and Shape shifting
         // Ported from Demo 4 (Christmas Tree) but simplified for template use
         scriptBody = `
 import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
 import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
 import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
 import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
 import TWEEN from 'https://unpkg.com/@tweenjs/tween.js@23.1.1/dist/tween.esm.js';
     // --- Main Scene Class ---
 class DigitalWaveScene {
     constructor(container) {
         this.container = container;
         this.scene = new THREE.Scene();
         this.scene.background = new THREE.Color(0x000000);
         
         this.camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 1000);
         this.camera.position.set(20, 20, 20);
         this.camera.lookAt(0, 0, 0);
         
         this.renderer = new THREE.WebGLRenderer({ antialias: true });
         this.renderer.setSize(window.innerWidth, window.innerHeight);
         this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
         this.container.appendChild(this.renderer.domElement);
         
         this.controls = new OrbitControls(this.camera, this.renderer.domElement);
         this.controls.enableDamping = true;
         this.controls.autoRotate = true;
         this.controls.autoRotateSpeed = 0.5;
         
         // Post Processing
         this.composer = new EffectComposer(this.renderer);
         this.composer.addPass(new RenderPass(this.scene, this.camera));
         this.bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
         this.bloomPass.strength = 1.2;
         this.bloomPass.radius = 0.5;
         this.bloomPass.threshold = 0.2;
         this.composer.addPass(this.bloomPass);
         
         // State
         this.count = ${params.density || 4000}; 
         this.color = new THREE.Color("${params.color || '#00CAE0'}");
         this.waveSpeed = 1.0;
         this.waveHeight = 2.0;
         
         this.initScene();
         this.animate();
         
         window.addEventListener('resize', () => this.onResize());
         
         // Expose API
         window.sceneAPI = {
             setColor: (hex) => this.setColor(hex),
             setSpeed: (val) => this.waveSpeed = val,
             setHeight: (val) => this.waveHeight = val
         };
     }
     
     initScene() {
         // --- Setup Begin ---
           // Setup Lights
         const ambient = new THREE.AmbientLight(0xffffff, 0.5);
         this.scene.add(ambient);
         const point = new THREE.PointLight(this.color, 2, 50);
         point.position.set(0, 10, 0);
         this.scene.add(point);
         
         // Digital Wave Logic
         const gridSize = Math.floor(Math.sqrt(this.count));
         const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
         const material = new THREE.MeshStandardMaterial({
             color: this.color,
             emissive: this.color,
             emissiveIntensity: 0.8,
             roughness: 0.2,
             metalness: 0.9
         });
         
         this.mesh = new THREE.InstancedMesh(geometry, material, this.count);
         this.scene.add(this.mesh);
         
         this.dummy = new THREE.Object3D();
         this.initialPositions = [];
         
         let i = 0;
         const offset = (gridSize * 1.0) / 2;
         
         for(let x = 0; x < gridSize; x++) {
             for(let z = 0; z < gridSize; z++) {
                 if (i >= this.count) break;
                 const px = (x * 1.0) - offset;
                 const pz = (z * 1.0) - offset;
                 const py = 0;
                 
                 this.dummy.position.set(px, py, pz);
                 this.dummy.updateMatrix();
                 this.mesh.setMatrixAt(i, this.dummy.matrix);
                 
                 this.initialPositions.push({x: px, y: py, z: pz});
                 i++;
             }
         }
         this.mesh.instanceMatrix.needsUpdate = true;
         
         // --- Setup End ---
     }
     
     setColor(hex) {
         const c = new THREE.Color(hex);
         this.mesh.material.color = c;
         this.mesh.material.emissive = c;
     }
     
     animate() {
         requestAnimationFrame(() => this.animate());
         
         // --- Animation Begin ---
         this.controls.update();
         
         const time = Date.now() * 0.001 * this.waveSpeed;
         let i = 0;
         
         // Update Wave
         for (let pos of this.initialPositions) {
             // Calculate wave height based on position and time
             const dist = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
             const y = Math.sin(dist * 0.5 - time) * this.waveHeight + Math.sin(pos.x * 0.5 + time) * 0.5;
             
             this.dummy.position.set(pos.x, y, pos.z);
             
             // Rotate slightly for effect
             this.dummy.rotation.x = time * 0.2;
             this.dummy.rotation.z = time * 0.1;
             
             // Scale based on height
             const s = Math.max(0.2, (y + 2) * 0.5);
             this.dummy.scale.set(1, s, 1);
             
             this.dummy.updateMatrix();
             this.mesh.setMatrixAt(i++, this.dummy.matrix);
         }
         this.mesh.instanceMatrix.needsUpdate = true;
         
         // --- Animation End ---
         
         this.composer.render();
     }
     
     onResize() {
         this.camera.aspect = window.innerWidth / window.innerHeight;
         this.camera.updateProjectionMatrix();
         this.renderer.setSize(window.innerWidth, window.innerHeight);
         this.composer.setSize(window.innerWidth, window.innerHeight);
     }
 }
 // Initialize
 const scene = new DigitalWaveScene(document.body);
   // --- UI & Mock AI Logic ---
 
 // Inject UI
 const uiContainer = document.createElement('div');
 uiContainer.style.cssText = 'position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); display: flex; gap: 10px; background: rgba(0,0,0,0.6); padding: 10px; border-radius: 12px; backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1);';
 
 const controls = [
     { label: 'SLOW', action: () => window.sceneAPI.setSpeed(0.5) },
     { label: 'FAST', action: () => window.sceneAPI.setSpeed(2.0) },
     { label: 'LOW', action: () => window.sceneAPI.setHeight(0.5) },
     { label: 'HIGH', action: () => window.sceneAPI.setHeight(3.0) },
     { label: 'RED', action: () => window.sceneAPI.setColor('#ff0055') },
     { label: 'CYAN', action: () => window.sceneAPI.setColor('#00CAE0') }
 ];
 
 controls.forEach(c => {
     const btn = document.createElement('button');
     btn.innerText = c.label;
     btn.style.cssText = 'background: rgba(255,255,255,0.1); border: none; color: white; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-family: sans-serif; transition: 0.3s;';
     btn.onmouseover = () => btn.style.background = 'rgba(255,255,255,0.3)';
     btn.onmouseout = () => btn.style.background = 'rgba(255,255,255,0.1)';
     btn.onclick = c.action;
     uiContainer.appendChild(btn);
 });
 
 document.body.appendChild(uiContainer);
 
 `;
     } else if (type === 'fluid') {
         scriptBody = `
 const frag = \`
     uniform float uTime;
     uniform vec2 uResolution;
     uniform vec3 uColor1;
     uniform vec3 uColor2;
     varying vec2 vUv;
       void main() {
         vec2 uv = vUv;
         // Fluid Logic placeholder
         float t = uTime * 0.5;
         
         vec2 p = uv * 5.0;
         float a = sin(p.x + t) + sin(p.y + t);
         float b = sin(p.x * 0.5 - t) + sin(p.y * 0.5 + t);
         
         float mask = sin(a + b);
         vec3 col = mix(uColor1, uColor2, mask * 0.5 + 0.5);
         
         gl_FragColor = vec4(col, 1.0);
     }
 \`;
 
 new UnifiedRenderer({
     type: 'shader',
     fragmentShader: frag,
     params: {
         uColor1: new THREE.Color("${params.color1}"),
         uColor2: new THREE.Color("${params.color2}")
     },
     init: (r) => {
         r.setUI([
              { name: 'Color A', value: "${params.color1}", type: 'color', bind: 'uColor1' },
              { name: 'Color B', value: "${params.color2}", type: 'color', bind: 'uColor2' }
         ]);
     }
 });
`;
     } else if (type === 'grid') {
          scriptBody = `
 const frag = \`
     uniform float uTime;
     uniform vec2 uResolution;
     uniform vec3 uColor;
     uniform float uBend;
     uniform float uSpeed;
     varying vec2 vUv;
       void main() {
         vec2 uv = (vUv - 0.5) * 2.0;
         uv.x *= uResolution.x / uResolution.y;
         
         // Horizon bending
         float horizon = 0.2 * sin(uTime * 0.1);
         uv.y += horizon;
         
         // 3D Projection approximation
         float z = 1.0 / (abs(uv.y) + 0.001);
         
         // Grid
         float t = uTime * uSpeed;
         vec2 grid = fract(vec2(uv.x * z + uBend * sin(z), z + t));
         
         float line = smoothstep(0.95, 1.0, max(grid.x, grid.y));
         
         // Fade into distance
         float fade = smoothstep(0.0, 0.5, abs(uv.y));
         
         gl_FragColor = vec4(uColor * line * fade, 1.0);
     }
 \`;
 
 new UnifiedRenderer({
     type: 'shader',
     fragmentShader: frag,
     params: {
         uColor: new THREE.Color("${params.color}"),
         uBend: ${params.bend},
         uSpeed: ${params.speed}
     },
     init: (r) => {
         r.setUI([
              { name: 'Grid Color', value: "${params.color}", type: 'color', bind: 'uColor' },
              { name: 'Bend', value: ${params.bend}, min: -1.0, max: 1.0, bind: 'uBend' },
              { name: 'Speed', value: ${params.speed}, min: 0, max: 10, bind: 'uSpeed' }
         ]);
     }
 });
`;
     } else if (type === 'text') {
          // Text is complex in Shader, use Canvas 2D fallback or simple pattern
          scriptBody = `
 new UnifiedRenderer({
     type: 'p5',
     params: {
         text: "${params.content}",
         glow: ${params.glow},
         shake: ${params.shake}
     },
     init: (p, r) => {
         r.setUI([
             { name: 'Content', value: "${params.content}", type: 'text', bind: 'text' },
             { name: 'Glow', value: ${params.glow}, min: 0, max: 2, bind: 'glow' },
             { name: 'Shake', value: ${params.shake}, min: 0, max: 1, bind: 'shake' }
         ]);
     },
     draw: (p, r) => {
         p.background(0);
         p.fill(255);
         p.textSize(100);
         p.textAlign(p.CENTER, p.CENTER);
         p.textStyle(p.BOLD);
         
         // Glow effect
         p.drawingContext.shadowBlur = r.params.glow * 50;
         p.drawingContext.shadowColor = 'white';
         
         let x = p.width/2;
         let y = p.height/2;
         
         if(r.params.shake > 0) {
             x += p.random(-r.params.shake, r.params.shake) * 20;
             y += p.random(-r.params.shake, r.params.shake) * 20;
         }
         
         p.text(r.params.text, x, y);
     }
 });
`;
     }
       return head + scriptBody + '    <\/script>\n<\/body>\n<\/html>';
 }
   export function generateAIHTML(code) {
      const origin = window.location.origin;
      const currentPath = window.location.pathname;
      const basePath = currentPath.substring(0, currentPath.lastIndexOf('/') + 1);
      const threePath = origin + basePath + 'my-motion-portfolio/public/js/libs/three/three.module.js';
      const threeAddonsPath = origin + basePath + 'my-motion-portfolio/public/js/libs/three/addons/';
      
      const safeCode = (typeof code === 'string' ? code : '').replace(/<\/script/gi, '<\\/script');
      let normalizedCode = safeCode;
      if (!/import\s+\*\s+as\s+THREE\s+from\s+['"]three['"]\s*;?/m.test(normalizedCode)) {
          const ns = normalizedCode.match(/import\s+\*\s+as\s+([A-Za-z_$][\w$]*)\s+from\s+['"]three['"]\s*;?/m);
          if (ns) {
              const alias = ns[1];
              if (alias && alias !== 'THREE') {
                  normalizedCode = normalizedCode.replace(ns[0], `${ns[0]}\nconst THREE = ${alias};`);
              }
          } else {
              const firstImport = normalizedCode.match(/^\s*import[\s\S]*?;\s*$/m);
              const insert = `import * as THREE from 'three';\n`;
              if (firstImport) {
                  const idx = firstImport.index || 0;
                  normalizedCode = normalizedCode.slice(0, idx) + insert + normalizedCode.slice(idx);
              } else {
                  normalizedCode = insert + normalizedCode;
              }
          }
      }
      const jsonLiteral = JSON.stringify(normalizedCode)
          .replace(/\u2028/g, '\\u2028')
          .replace(/\u2029/g, '\\u2029');
      
      return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Generated Demo</title>
    <style>body { margin: 0; overflow: hidden; background: #000; }</style>
    <script async src="https://unpkg.com/es-module-shims@1.8.0/dist/es-module-shims.js"><\/script>
    <script type="importmap">
 { 
     "imports": { 
         "three": "${threePath}",
         "three/addons/": "${threeAddonsPath}"
     } 
 }
    <\/script>
</head>
<body>
    <script type="module">
 const __source = ${jsonLiteral};
 const __blob = new Blob([__source], { type: 'application/javascript' });
 const __url = URL.createObjectURL(__blob);
   const __showError = (err) => {
     const msg = (err && err.stack) ? err.stack : String(err || 'Unknown error');
     const el = document.createElement('div');
     el.style.position = 'fixed';
     el.style.left = '0';
     el.style.top = '0';
     el.style.right = '0';
     el.style.bottom = '0';
     el.style.background = 'rgba(0,0,0,0.92)';
     el.style.color = '#ff6b6b';
     el.style.fontFamily = 'monospace';
     el.style.fontSize = '12px';
     el.style.padding = '20px';
     el.style.whiteSpace = 'pre-wrap';
     el.style.overflow = 'auto';
     el.textContent = msg;
     document.body.appendChild(el);
 };
   let __mod = null;
 try {
     __mod = await import(__url);
 } catch (e) {
     __showError(e);
     throw e;
 }
   const EngineEffect = __mod && (__mod.default || __mod.EngineEffect);
 if (!EngineEffect) {
     const e = new Error('EngineEffect not found. The generated module must export default class EngineEffect.');
     __showError(e);
     throw e;
 }
   const __container = document.body;
 __container.style.margin = '0';
   const __canvas = document.createElement('canvas');
 __canvas.style.width = '100%';
 __canvas.style.height = '100%';
 __canvas.style.display = 'block';
 __container.appendChild(__canvas);
   const __getSize = () => {
     const width = Math.max(1, Math.floor(window.innerWidth || 1));
     const height = Math.max(1, Math.floor(window.innerHeight || 1));
     const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
     return { width, height, dpr };
 };
   let __started = false;
 let __effect = null;
 try {
     __effect = new EngineEffect();
 } catch (e) {
     __showError(e);
     throw e;
 }
   const __resize = () => {
     const size = __getSize();
     __canvas.width = Math.max(1, Math.floor(size.width * size.dpr));
     __canvas.height = Math.max(1, Math.floor(size.height * size.dpr));
     if (__started && typeof __effect.onResize === 'function') {
        // Be tolerant to both signatures:
        // - onResize(size): expects { width, height, dpr }
        // - onResize(ctx): expects ctx.size.width (EngineEffect-style ctx)
        __effect.onResize({ size, ...size });
     }
 };
   try {
     __resize();
     if (typeof __effect.onStart === 'function') {
         const __size = __getSize();
         __effect.onStart({ container: __container, canvas: __canvas, gl: null, size: __size, ...__size });
     }
     __started = true;
     __resize();
 } catch (e) {
     __showError(e);
     throw e;
 }
   window.addEventListener('resize', () => __resize());
   window.addEventListener('message', (e) => {
     const d = e.data;
     if (!d || !d.type) return;
       if (d.type === 'HANDSHAKE') {
         let cfg = [];
         try {
             cfg = (typeof __effect.getUIConfig === 'function') ? (__effect.getUIConfig() || []) : [];
         } catch (_) {
             cfg = [];
         }
         parent.postMessage({ type: 'UI_CONFIG', config: cfg }, '*');
         return;
     }
       if (d.type === 'UPDATE_PARAM') {
         if (typeof __effect.setParam === 'function') {
             try {
                 __effect.setParam(d.key, d.value);
             } catch (_) {}
         }
         return;
     }
      if (d.type === 'REQUEST_GAME_JS_SOURCE' || d.type === 'EXPORT_GAME_JS') {
        parent.postMessage({ type: 'GAME_JS_SOURCE', code: __source, filename: 'game.js' }, '*');
        return;
    }
       if (d.type === 'EXPORT_SCRIPT_SCENE' || d.type === 'EXPORT_ENGINE_EFFECT') {
         const blob = new Blob([__source], { type: 'application/javascript' });
         const url = URL.createObjectURL(blob);
         const a = document.createElement('a');
         a.href = url;
         a.download = 'engine-effect.js';
         document.body.appendChild(a);
         a.click();
         document.body.removeChild(a);
         URL.revokeObjectURL(url);
     }
 });
   let __raf = 0;
 let __last = performance.now();
 const __frame = (now) => {
     __raf = requestAnimationFrame(__frame);
     const deltaTime = Math.max(0, (now - __last) / 1000);
     __last = now;
     const time = now / 1000;
     try {
         if (typeof __effect.onUpdate === 'function') {
             const __size = __getSize();
             __effect.onUpdate({ time, deltaTime, size: __size, ...__size });
         }
     } catch (e) {
         cancelAnimationFrame(__raf);
         __showError(e);
     }
 };
 __raf = requestAnimationFrame(__frame);
   window.addEventListener('beforeunload', () => {
     try { cancelAnimationFrame(__raf); } catch (_) {}
     try { if (typeof __effect.onDestroy === 'function') __effect.onDestroy(); } catch (_) {}
     try { URL.revokeObjectURL(__url); } catch (_) {}
 });
    <\/script>
</body>
</html>`;
 }
