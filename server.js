const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const { routePromptToSkeleton } = require('./tools/creator/skeleton-router.cjs');
const { buildGlowSphereEffectCode } = require('./tools/creator/skeletons/glow-sphere.cjs');
const { buildParticlesEffectCode } = require('./tools/creator/skeletons/particles.cjs');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'my-motion-portfolio/public/data/demos.json');
const DEMO_DIR = path.join(__dirname, 'my-motion-portfolio/public/demos');

app.use(cors());
app.use(bodyParser.json());
app.get('/favicon.ico', (req, res) => res.status(204).end());
app.use(express.static(__dirname)); // Serve root directly

async function generateEffectV2FromPrompt(prompt, apiKey, baseUrl, model) {
    const read = (f) => {
        try {
            return fs.readFileSync(path.join(PROMPTS_DIR, f), 'utf8');
        } catch (_) {
            return '';
        }
    };

    const systemPromptTemplate = read('v2-prompt.md');
    const systemPrompt = systemPromptTemplate.split('{{USER_PROMPT}}').join(prompt);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 180000);
    
    const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
            model,
            messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: prompt }],
            temperature: 0.6 // Balanced temperature for creativity and structure
        }),
        signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Generation failed: ${res.status} ${errText}`);
    }
    
    const data = await res.json();
    const finalCodeContent = (data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';

    let generatedCode = stripMarkdownCodeFence(finalCodeContent).trim();
    generatedCode = normalizeThreeNamespaceImport(generatedCode);

    return generatedCode;
}

function normalizeAIBaseUrl(baseUrl) {
    const raw = typeof baseUrl === 'string' ? baseUrl.trim() : '';
    if (!raw) return 'https://api.openai.com/v1';
    const noTrailingSlash = raw.replace(/\/+$/, '');
    if (/\/v\d+(\/|$)/i.test(noTrailingSlash)) return noTrailingSlash;
    return `${noTrailingSlash}/v1`;
}

function getAIConfig() {
    const apiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY;
    const baseUrlRaw =
        process.env.AI_BASE_URL ||

        process.env.OPENAI_BASE_URL ||

        process.env.OPENAI_API_BASE ||
        'https://api.openai.com/v1';
    const model = process.env.AI_MODEL || process.env.OPENAI_MODEL || 'gpt-4o';
    return {
        apiKey,
        baseUrl: normalizeAIBaseUrl(baseUrlRaw),
        model
    };
}

const PROMPTS_DIR = path.join(__dirname, 'prompts');
const TEMP_PREVIEWS_DIR = path.join(__dirname, '.temp_previews');

// Ensure temp directory exists
if (!fs.existsSync(TEMP_PREVIEWS_DIR)) {
    fs.mkdirSync(TEMP_PREVIEWS_DIR, { recursive: true });
}

async function classifyStyle(prompt, apiKey, baseUrl, model) {
    const sysPrompt = `You are a router. Classify the following user request for a 3D scene into one of these styles:
- 'cyberpunk': neon, futuristic, glowing, sci-fi, dark, glitch.
- 'toon': cartoon, anime, cel-shaded, flat, outline, cute.
- 'minimalist': clean, simple, geometric, soft, pure color, flat design.
- 'realistic': PBR, realistic materials, physics, natural light.
- 'default': anything else, or high-end apple-like abstract aesthetic.
Reply ONLY with the style name.`;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        const response = await fetch(`${baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model,
                messages: [
                    { role: 'system', content: sysPrompt },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.1,
                max_tokens: 10
            }),
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        const data = await response.json();
        if (data && data.choices && data.choices[0] && data.choices[0].message) {
            const style = data.choices[0].message.content.trim().toLowerCase();
            const validStyles = ['cyberpunk', 'toon', 'minimalist', 'realistic'];
            for (const s of validStyles) {
                if (style.includes(s)) return s;
            }
        }
        return 'default';
    } catch (e) {
        console.error('Classification failed, falling back to default:', e);
        return 'default';
    }
}

function assemblePrompt(style, userPrompt) {
    const read = (filename) => {
        try {
            return fs.readFileSync(path.join(PROMPTS_DIR, filename), 'utf8');
        } catch (e) {
            console.error(`Failed to read prompt file ${filename}:`, e);
            return '';
        }
    };

    const base = read('base-role.md');
    let styleText = read(`styles/${style}.md`);
    if (!styleText) styleText = read('styles/default.md'); // fallback
    const contract = read('engine-contract.md');
    
    // Inject few-shot example if available
    let exampleText = read(`styles/${style}-example.md`);
    if (!exampleText && style !== 'default') {
        exampleText = read('styles/default-example.md');
    }

    let fullPrompt = `${base}\n\n${styleText}\n\n${exampleText ? exampleText + '\n\n' : ''}${contract}`;
    return fullPrompt.split('{{USER_PROMPT}}').join(userPrompt);
}

function stripMarkdownCodeFence(text) {
    if (typeof text !== 'string') return '';
    // Optional: Extract CoT if we want to log it, but for now we just keep it or let it be part of the code block.
    // Usually, the LLM will output the code block including the comment.
    // If it outputs the comment outside the code block, we might need to be careful.
    let m = text.match(/```[a-zA-Z0-9_-]*\s*\n([\s\S]*?)\n```/);
    let code = m ? m[1] : text;
    return code;
}

function normalizeThreeNamespaceImport(codeText) {
    const code = typeof codeText === 'string' ? codeText : '';
    if (/import\s+\*\s+as\s+THREE\s+from\s+['"]three['"]\s*;?/m.test(code)) return code;

    const ns = code.match(/import\s+\*\s+as\s+([A-Za-z_$][\w$]*)\s+from\s+['"]three['"]\s*;?/m);
    if (ns) {
        const alias = ns[1];
        let out = code.replace(ns[0], `import * as THREE from 'three';`);
        if (alias !== 'THREE') {
            const re = new RegExp(`\\b${alias}\\b`, 'g');
            out = out.replace(re, 'THREE');
        }
        return out;
    }

    const firstImport = code.match(/^\s*import[\s\S]*?;\s*$/m);
    const insert = `import * as THREE from 'three';\n`;
    if (firstImport) {
        const idx = firstImport.index || 0;
        return code.slice(0, idx) + insert + code.slice(idx);
    }
    return insert + code;
}

function extractScriptSceneBlock(scriptSceneText) {
    const text = typeof scriptSceneText === 'string' ? scriptSceneText : '';
    const beginEnd = text.match(/^[ \t]*\/\/===begin===[ \t]*\r?\n([\s\S]*?)^[ \t]*\/\/===end===[ \t]*$/m);
    const beginEndPP = text.match(/^[ \t]*\/\/===begin_pp===[ \t]*\r?\n([\s\S]*?)^[ \t]*\/\/===end_pp===[ \t]*$/m);
    if (beginEnd) {
        return {
            blockKind: 'begin_end',
            mainBlockText: beginEnd[1].replace(/\s+$/, ''),
            ppBlockText: beginEndPP ? beginEndPP[1].replace(/\s+$/, '') : ''
        };
    }
    if (beginEndPP) {
        return { blockKind: 'beginpp_endpp', mainBlockText: '', ppBlockText: beginEndPP[1].replace(/\s+$/, '') };
    }
    throw new Error('未识别到可导入区段：需要包含 //===begin===...//===end===（或至少 //===begin_pp===...//===end_pp===）');
}

function isPathAllowed(userPath) {
    if (typeof userPath !== 'string' || !userPath.trim()) return false;
    const resolved = path.resolve(userPath);
    const root = path.resolve(__dirname) + path.sep;
    return resolved.startsWith(root) && resolved.endsWith('.js');
}

function toExportTemplate(templateText, blockText) {
    let out = templateText;
    out = out.replace(/^[ \t]*\/\/===begin===[ \t]*\r?\n[\s\S]*?^[ \t]*\/\/===end===[ \t]*$/m, `  //===begin===\n${blockText}\n  //===end===`);
    const needsTextures = /this\.texture1|this\.texture2/.test(blockText);
    if (needsTextures) {
        out = out.replace(
            /loadTextures\(\)\s*{\s*return Promise\.resolve\(\);\s*\/\/ 默认实现，返回空 Promise\s*}/m,
            `loadTextures() {\n    const loader = new THREE.TextureLoader();\n    const loadOne = (url) => new Promise(resolve => {\n      loader.load(url, (tex) => resolve(tex), undefined, () => resolve(null));\n    });\n    return Promise.all([\n      loadOne('image/Sample1.jpg'),\n      loadOne('image/Sample2.jpg')\n    ]).then(([t1, t2]) => {\n      if (t1) {\n        t1.colorSpace = THREE.LinearSRGBColorSpace;\n        t1.wrapS = THREE.RepeatWrapping;\n        t1.wrapT = THREE.RepeatWrapping;\n      }\n      if (t2) {\n        t2.colorSpace = THREE.LinearSRGBColorSpace;\n        t2.wrapS = THREE.RepeatWrapping;\n        t2.wrapT = THREE.RepeatWrapping;\n      }\n      this.texture1 = t1;\n      this.texture2 = t2;\n    });\n  }`
        );
    }
    return out;
}

function buildScriptSceneDemoHtml({ title, threePath, threeAddonsPath, blockText, exportTextLiteral }) {
    const needsTextures = /this\.texture1|this\.texture2/.test(blockText);
    const ensureTextures = needsTextures
        ? `\n    async _ensureTextures() {\n      const loader = new THREE.TextureLoader();\n      const loadOne = (url) => new Promise(resolve => {\n        loader.load(url, (tex) => resolve(tex), undefined, () => resolve(null));\n      });\n      const [t1, t2] = await Promise.all([\n        loadOne('../sample/Sample1.jpg'),\n        loadOne('../sample/Sample2.jpg')\n      ]);\n      if (t1) {\n        t1.colorSpace = THREE.SRGBColorSpace;\n        t1.wrapS = THREE.RepeatWrapping;\n        t1.wrapT = THREE.RepeatWrapping;\n      }\n      if (t2) {\n        t2.colorSpace = THREE.SRGBColorSpace;\n        t2.wrapS = THREE.RepeatWrapping;\n        t2.wrapT = THREE.RepeatWrapping;\n      }\n      this.texture1 = t1;\n      this.texture2 = t2;\n    }\n`
        : '';

    const boot = needsTextures
        ? `await s._ensureTextures();`
        : '';

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title || 'ScriptScene Demo'}</title>
  <style>
    html, body { margin: 0; padding: 0; width: 100%; height: 100%; background: #000; overflow: hidden; }
    #container { width: 100vw; height: 100vh; }
  </style>
</head>
<body>
  <div id="container"></div>
  <script type="module">
    import * as THREE from '${threePath}';
    const TWEEN = (() => {
      const _tweens = new Set();
      const Easing = {
        Linear: {
          None: (k) => k
        }
      };
      class Tween {
        constructor(object) {
          this._object = object || {};
          this._valuesStart = {};
          this._valuesEnd = {};
          this._duration = 1000;
          this._delayTime = 0;
          this._startTime = 0;
          this._easingFunction = Easing.Linear.None;
          this._onUpdate = null;
          this._isPlaying = false;
        }
        to(properties, duration) {
          this._valuesEnd = properties || {};
          if (Number.isFinite(duration)) this._duration = duration;
          return this;
        }
        easing(fn) {
          if (typeof fn === 'function') this._easingFunction = fn;
          return this;
        }
        delay(amount) {
          if (Number.isFinite(amount)) this._delayTime = amount;
          return this;
        }
        onUpdate(cb) {
          if (typeof cb === 'function') this._onUpdate = cb;
          return this;
        }
        start(time = 0) {
          this._isPlaying = true;
          this._startTime = (Number.isFinite(time) ? time : 0) + this._delayTime;
          Object.keys(this._valuesEnd).forEach((k) => {
            const v = this._object[k];
            this._valuesStart[k] = Number.isFinite(v) ? v : Number(v);
          });
          _tweens.add(this);
          return this;
        }
        stop() {
          this._isPlaying = false;
          _tweens.delete(this);
          return this;
        }
        update(time) {
          if (!this._isPlaying) return false;
          const t = Number.isFinite(time) ? time : 0;
          if (t < this._startTime) return true;
          const elapsed = (t - this._startTime) / (this._duration || 1);
          const clamped = elapsed >= 1 ? 1 : (elapsed <= 0 ? 0 : elapsed);
          const k = this._easingFunction(clamped);
          Object.keys(this._valuesEnd).forEach((key) => {
            const start = this._valuesStart[key];
            const endRaw = this._valuesEnd[key];
            const end = Number.isFinite(endRaw) ? endRaw : Number(endRaw);
            const s = Number.isFinite(start) ? start : 0;
            const e = Number.isFinite(end) ? end : s;
            this._object[key] = s + (e - s) * k;
          });
          if (this._onUpdate) this._onUpdate(this._object);
          if (elapsed >= 1) {
            this.stop();
            return false;
          }
          return true;
        }
      }
      const update = (time) => {
        Array.from(_tweens).forEach(t => t.update(time));
      };
      return { Tween, Easing, update };
    })();

    const __EXPORT_TEXT = ${exportTextLiteral};

    class ScriptScene {
      constructor(amgScene = null, container = null) {
        this.scene = new THREE.Scene();
        this.camera = null;
        this.renderer = null;
        this.sceneObjects = { tweens: [] };
        this.isAnimating = false;
        this.animationFrameId = null;
        this.TWEEN = TWEEN;
        this.Duration = 2000;
        this.texture1 = null;
        this.texture2 = null;
        this.effectStack = [];
        this.effectPassMap = [];
        this.shaderPasses = [];
        this.usePostProcessing = false;

        this.initCoreObjects();
        if (container) this.init(container);
      }

      initCoreObjects() {
        this.camera = new THREE.PerspectiveCamera(53.1, window.innerWidth / window.innerHeight, 0.1, 10000);
        this.camera.position.z = 10;
        this.scene.add(this.camera);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      }

      init(container) {
        container.appendChild(this.renderer.domElement);
        window.addEventListener('resize', () => this.handleResize());
      }

      handleResize() {
        if (!this.camera || !this.renderer) return;
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
      }

      start(updateCallback) {
        if (this.isAnimating) return;
        this.isAnimating = true;
        const animateFrame = (t) => {
          if (!this.isAnimating) return;
          updateCallback(t);
          this.animationFrameId = requestAnimationFrame(animateFrame);
        };
        this.animationFrameId = requestAnimationFrame(animateFrame);
      }

      update() {
        if (this.renderer) this.renderer.render(this.scene, this.camera);
      }

      defaultUpdate(timestamp) {
        if (this.TWEEN && typeof this.TWEEN.update === 'function') {
          this.TWEEN.update(timestamp);
        } else if (this.sceneObjects && this.sceneObjects.tweens && this.sceneObjects.tweens.length > 0) {
          this.sceneObjects.tweens.forEach(tween => {
            if (tween && typeof tween.update === 'function') tween.update(timestamp);
          });
        }
        this.update();
      }

      addShaderPass() {
      }

      setupPostProcessing() {
        this.shaderPasses = [];
      }

      applyEffectStack() {
      }
${ensureTextures}
${blockText}
    }

    const container = document.getElementById('container');
    const s = new ScriptScene(null, container);
    window.__scriptScene = s;

    async function boot() {
      ${boot}
      if (typeof s.setupScene === 'function') await s.setupScene();
      s.start((t) => s.defaultUpdate(t));
    }
    boot();

    window.addEventListener('message', (e) => {
      const d = e.data;
      if (!d || !d.type) return;
      if (d.type === 'HANDSHAKE') {
        parent.postMessage({ type: 'UI_CONFIG', config: [] }, '*');
      }
      if (d.type === 'EXPORT_SCRIPT_SCENE') {
        const blob = new Blob([__EXPORT_TEXT], { type: 'application/javascript' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'scriptScene.js';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    });
  </script>
</body>
</html>`;
}

// API: Generate AI Effect
app.post('/api/generate-effect', async (req, res) => {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const keys = Object.keys(body);
    if (keys.length === 0) {
        return res.status(400).json({ error: 'Prompt is required' });
    }
    if (keys.length !== 1 || keys[0] !== 'prompt') {
        return res.status(400).json({ error: 'Only { prompt } is accepted' });
    }

    const prompt = body.prompt;
    if (typeof prompt !== 'string' || !prompt.trim()) {
        return res.status(400).json({ error: 'Prompt is required' });
    }

    // Demo stable mode: bypass LLM codegen and always return a known-good skeleton.
    // This is designed for public-facing demos where "always preview" beats "perfect fidelity".
    if (String(process.env.AI_DEMO_MODE || '') === '1') {
        try {
            const routed = routePromptToSkeleton(prompt);
            const params = routed && routed.params ? routed.params : {};
            const code = routed && routed.kind === 'particles'
                ? buildParticlesEffectCode(params)
                : buildGlowSphereEffectCode(params);
            return res.json({ code });
        } catch (e) {
            // Last-resort fallback: glow sphere with safe defaults.
            const code = buildGlowSphereEffectCode({ color: '#ff0040', glowIntensity: 1.2, speed: 1.0 });
            return res.json({ code });
        }
    }

    const { apiKey, baseUrl, model } = getAIConfig();

    if (!apiKey) {
        const mockCode = `
import * as THREE from 'three';

export default class EngineEffect {
    constructor() {
        this.params = {
            color: '#00CAE0',
            intensity: 1.0,
            speed: 1.0
        };
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.mesh = null;
    }

    getUIConfig() {
        return [
            { bind: 'color', name: '主色', type: 'color', value: this.params.color },
            { bind: 'intensity', name: '强度', type: 'range', value: this.params.intensity, min: 0, max: 2, step: 0.01 },
            { bind: 'speed', name: '速度', type: 'range', value: this.params.speed, min: 0, max: 5, step: 0.01 }
        ];
    }

    setParam(key, value) {
        if (key === 'color' && typeof value === 'string') {
            this.params.color = value;
            if (this.mesh && this.mesh.material && this.mesh.material.color) {
                this.mesh.material.color.set(value);
            }
            return;
        }
        if ((key === 'intensity' || key === 'speed') && typeof value === 'number' && Number.isFinite(value)) {
            this.params[key] = value;
        }
    }

    onStart(ctx) {
        const size = ctx && ctx.size ? ctx.size : { width: 1, height: 1, dpr: 1 };
        const width = Math.max(1, Math.floor(size.width || 1));
        const height = Math.max(1, Math.floor(size.height || 1));
        const dpr = Math.max(1, Math.min(2, Number(size.dpr) || 1));

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x111111);

        this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
        this.camera.position.set(0, 0, 5);

        const rendererOptions = { antialias: true, alpha: true };
        if (ctx && ctx.canvas) rendererOptions.canvas = ctx.canvas;
        if (ctx && ctx.gl) rendererOptions.context = ctx.gl;
        this.renderer = new THREE.WebGLRenderer(rendererOptions);
        this.renderer.setPixelRatio(dpr);
        this.renderer.setSize(width, height, false);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        const pointLight = new THREE.PointLight(0xffffff, 1);
        pointLight.position.set(5, 5, 5);
        this.scene.add(pointLight);

        const geometry = new THREE.TorusKnotGeometry(1, 0.3, 100, 16);
        const material = new THREE.MeshStandardMaterial({ color: this.params.color, roughness: 0.1, metalness: 0.8 });
        this.mesh = new THREE.Mesh(geometry, material);
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
        if (this.mesh) {
            const s = Number.isFinite(this.params.speed) ? this.params.speed : 1;
            this.mesh.rotation.x = time * 0.5 * s;
            this.mesh.rotation.y = time * 0.8 * s;
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
        this.scene = null;
        this.camera = null;
        this.renderer = null;
    }
}
        `;
        return res.json({ code: mockCode });
    }

    try {
        if (req && req.query && String(req.query.v || '') === '2') {
            const generatedCode = await generateEffectV2FromPrompt(prompt, apiKey, baseUrl, model);
            return res.json({ code: generatedCode });
        }
        const style = await classifyStyle(prompt, apiKey, baseUrl, model);
        const systemPrompt = assemblePrompt(style, prompt);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 180000);
        const response = await fetch(`${baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7
            }),
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        const raw = await response.text();
        let data = null;
        try {
            data = JSON.parse(raw);
        } catch (_) {
            data = null;
        }

        if (!response.ok) {
            const upstreamMessage =
                (data && data.error && typeof data.error.message === 'string' && data.error.message) ||
                `Upstream AI request failed (${response.status})`;
            return res.status(502).json({ error: upstreamMessage });
        }

        const content = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
        if (typeof content !== 'string' || !content.trim()) {
            return res.status(502).json({ error: 'Upstream AI response is empty or invalid' });
        }

        let generatedCode = stripMarkdownCodeFence(content).trim();
        generatedCode = normalizeThreeNamespaceImport(generatedCode);

        res.json({ code: generatedCode });

    } catch (error) {
        console.error('Generate effect failed:', error && error.message ? error.message : 'Unknown error');
        if (error && (error.name === 'AbortError' || /aborted/i.test(String(error.message || '')))) {
            res.status(504).json({ error: 'Upstream AI request timed out' });
            return;
        }
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

function basicSyntaxScan(code) {
    if (!code) return 'Code is empty';
    if (!/import\s+.*from\s+['"]three['"]/.test(code) && !/const\s+THREE/.test(code)) {
        return 'Missing Three.js import';
    }
    if (!/export\s+default\s+class\s+EngineEffect/.test(code)) {
        return 'Missing "export default class EngineEffect"';
    }
    if (!/setParam\s*\(/.test(code)) {
        return 'Missing setParam method';
    }
    return null;
}

app.post('/api/generate-effect-v2', async (req, res) => {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const prompt = typeof body.prompt === 'string' ? body.prompt : '';
    if (!prompt.trim()) return res.status(400).json({ error: 'Prompt is required' });
    const { apiKey, baseUrl, model } = getAIConfig();
    if (!apiKey) return res.status(400).json({ error: 'Missing AI_API_KEY' });
    try {
        const generatedCode = await generateEffectV2FromPrompt(prompt, apiKey, baseUrl, model);
        res.json({ code: generatedCode });
    } catch (e) {
        console.error('Two-step generation failed:', e);
        res.status(500).json({ error: e && e.message ? e.message : 'Internal Server Error' });
    }
});

// API: Get Demos
app.get('/api/demos', (req, res) => {
    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading demos:', err);
            return res.status(500).json({ error: 'Failed to read data' });
        }
        res.json(JSON.parse(data));
    });
});

// API: Save Demos (Reorder/Update)
app.post('/api/demos', (req, res) => {
    const newData = req.body;
    fs.writeFile(DATA_FILE, JSON.stringify(newData, null, 4), (err) => {
        if (err) {
            console.error('Error writing demos:', err);
            return res.status(500).json({ error: 'Failed to save data' });
        }
        res.json({ success: true });
    });
});

app.post('/api/import-script-scene', (req, res) => {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const title = typeof body.title === 'string' ? body.title : 'Imported ScriptScene';
    const enTitle = typeof body.enTitle === 'string' ? body.enTitle : 'Imported ScriptScene';
    const tech = typeof body.tech === 'string' ? body.tech : 'Three.js / ScriptScene';
    const keywords = typeof body.keywords === 'string' ? body.keywords : '';
    const icon = typeof body.icon === 'string' ? body.icon : '<circle cx="100" cy="100" r="50" stroke="currentColor" fill="none" />';
    const sourcePath = typeof body.sourcePath === 'string' ? body.sourcePath : '';
    const sourceContent = typeof body.sourceContent === 'string' ? body.sourceContent : '';

    const loadText = () => {
        if (sourceContent && sourceContent.trim()) return Promise.resolve(sourceContent);
        if (!isPathAllowed(sourcePath)) return Promise.reject(new Error('sourcePath 不合法或不在允许目录内'));
        return fs.promises.readFile(path.resolve(sourcePath), 'utf8');
    };

    Promise.all([
        loadText(),
        fs.promises.readFile(path.join(__dirname, 'my-motion-portfolio/public/js/templates/scriptScene.js.txt'), 'utf8'),
        fs.promises.readFile(DATA_FILE, 'utf8')
    ]).then(([scriptText, exportTemplateText, dataText]) => {
        const { mainBlockText, ppBlockText } = extractScriptSceneBlock(scriptText);
        const previewBlockText = [ppBlockText, mainBlockText].filter(Boolean).join('\n\n').trim();
        const exportBlockText = (mainBlockText && mainBlockText.trim()) ? mainBlockText.trim() : previewBlockText;
        const exportText = toExportTemplate(exportTemplateText, exportBlockText);
        const exportTextLiteral = JSON.stringify(exportText);

        const list = JSON.parse(dataText);
        let maxId = 0;
        list.forEach(d => {
            const num = parseInt(d.id, 10);
            if (!isNaN(num) && num > maxId) maxId = num;
        });
        const newId = String(maxId + 1).padStart(3, '0');
        const fileName = `demo${maxId + 1}.html`;
        const filePath = path.join(DEMO_DIR, fileName);

        const threePath = '../js/libs/three/three.module.js';
        const threeAddonsPath = '../js/libs/three/addons/';
        const html = buildScriptSceneDemoHtml({ title, threePath, threeAddonsPath, blockText: previewBlockText, exportTextLiteral });

        const newDemo = {
            id: newId,
            title,
            keywords,
            enTitle,
            tech,
            url: `my-motion-portfolio/public/demos/${fileName}`,
            color: 'text-gray-400',
            isOriginal: true,
            icon
        };

        return fs.promises.writeFile(filePath, html, 'utf8')
            .then(() => {
                list.unshift(newDemo);
                return fs.promises.writeFile(DATA_FILE, JSON.stringify(list, null, 4), 'utf8');
            })
            .then(() => res.json({ success: true, demo: newDemo }));
    }).catch(err => {
        res.status(400).json({ error: err && err.message ? err.message : String(err) });
    });
});

// API: Save Preview as Permanent Demo
app.post('/api/save-preview-as-demo', (req, res) => {
    const { id, title, enTitle, tech, keywords, icon } = req.body;
    
    if (!id) return res.status(400).json({ error: 'Missing preview ID' });
    
    const tempPath = path.join(TEMP_PREVIEWS_DIR, `${id}.js`);
    if (!fs.existsSync(tempPath)) {
        return res.status(404).json({ error: 'Preview code not found' });
    }
    
    const sourceContent = fs.readFileSync(tempPath, 'utf8');
    
    // We can reuse the import-script-scene logic to generate the full HTML
    // But since it's an EngineEffect, we need to wrap it appropriately.
    // The import-script-scene API handles "ScriptScene", but let's make sure it handles EngineEffect too.
    // Actually, the easiest way is to just call our own /api/import-script-scene internally or simulate it.
    // Let's use a simpler approach: build the HTML directly here.
    
    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Read error' });
        
        const list = JSON.parse(data);
        let maxId = 0;
        list.forEach(d => {
            const num = parseInt(d.id, 10);
            if (!isNaN(num) && num > maxId) maxId = num;
        });
        
        const newId = String(maxId + 1).padStart(3, '0');
        const fileName = `demo${maxId + 1}.html`;
        const filePath = path.join(DEMO_DIR, fileName);
        
        const safeCode = sourceContent.replace(/`/g, '\\`').replace(/\$/g, '\\$').replace(/<\//g, '<\\/');
        
        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title || 'AI Generated'}</title>
    <style>
        body, html { margin: 0; padding: 0; width: 100%; height: 100%; background: #111; overflow: hidden; }
        #canvas-container { width: 100%; height: 100%; }
    </style>
    <script type="importmap">
    {
        "imports": {
            "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
            "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/"
        }
    }
    </script>
</head>
<body>
    <div id="canvas-container"></div>
    <script type="module">
        const codeSource = \`${safeCode}\`;
        
        async function init() {
            try {
                const blob = new Blob([codeSource], { type: 'application/javascript' });
                const url = URL.createObjectURL(blob);
                const mod = await import(url);
                URL.revokeObjectURL(url);
                
                const EngineEffect = mod.default || mod.EngineEffect;
                if (!EngineEffect) return;

                const effect = new EngineEffect();
                const container = document.getElementById('canvas-container');
                const canvas = document.createElement('canvas');
                canvas.style.width = '100%';
                canvas.style.height = '100%';
                canvas.style.display = 'block';
                container.appendChild(canvas);

                const getSize = () => ({
                    width: window.innerWidth,
                    height: window.innerHeight,
                    dpr: Math.min(2, window.devicePixelRatio || 1)
                });

                effect.onStart({ container, canvas, gl: null, size: getSize() });

                window.addEventListener('resize', () => {
                    const size = getSize();
                    canvas.width = size.width * size.dpr;
                    canvas.height = size.height * size.dpr;
                    if (effect.onResize) effect.onResize(size);
                });

                let lastTime = performance.now();
                const frame = (now) => {
                    const time = now / 1000;
                    const deltaTime = Math.max(0, (now - lastTime) / 1000);
                    lastTime = now;
                    if (effect.onUpdate) effect.onUpdate({ time, deltaTime, size: getSize() });
                    requestAnimationFrame(frame);
                };
                requestAnimationFrame(frame);
                
                // Expose UI Config if in iframe
                window.addEventListener('message', (e) => {
                    if(e.data.type === 'HANDSHAKE') {
                        const config = effect.getUIConfig ? effect.getUIConfig() : [];
                        window.parent.postMessage({ type: 'UI_CONFIG', config }, '*');
                    } else if (e.data.type === 'UPDATE_PARAM' && effect.setParam) {
                        effect.setParam(e.data.key, e.data.value);
                    }
                });
                
            } catch (e) {
                console.error(e);
            }
        }
        init();
    </script>
</body>
</html>`;

        fs.writeFile(filePath, html, (err) => {
            if (err) return res.status(500).json({ error: 'Write file error' });
            
            const newDemo = {
                id: newId,
                title: title || 'AI Generated Effect',
                keywords: keywords || 'ai, generated',
                enTitle: enTitle || 'AI Generated Effect',
                tech: tech || 'Three.js / AI',
                url: `my-motion-portfolio/public/demos/${fileName}`,
                color: 'text-gray-400',
                isOriginal: true,
                icon: icon || '<circle cx="100" cy="100" r="50" stroke="currentColor" fill="none" />'
            };
            
            list.unshift(newDemo);
            
            fs.writeFile(DATA_FILE, JSON.stringify(list, null, 4), (err) => {
                if (err) return res.status(500).json({ error: 'Update JSON error' });
                res.json({ success: true, demo: newDemo });
            });
        });
    });
});

// API: Create New Demo Placeholder
app.post('/api/create-demo', (req, res) => {
    const { title, enTitle, tech, keywords, icon } = req.body;
    
    // Read current list to find next ID
    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Read error' });
        
        const list = JSON.parse(data);
        // Find max ID
        let maxId = 0;
        list.forEach(d => {
            const num = parseInt(d.id, 10);
            if (!isNaN(num) && num > maxId) maxId = num;
        });
        
        const newId = String(maxId + 1).padStart(3, '0');
        const fileName = `demo${maxId + 1}.html`;
        const filePath = path.join(DEMO_DIR, fileName);
        
        // Create Placeholder File
        const template = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body { margin: 0; overflow: hidden; background: #000; color: #fff; display: flex; align-items: center; justify-content: center; font-family: monospace; }
        .placeholder { text-align: center; animation: pulse 2s infinite; }
        @keyframes pulse { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }
    </style>
</head>
<body>
    <div class="placeholder">
        <h1>${title}</h1>
        <p>AWAITING AI GENERATION...</p>
        <p class="tech">[ ${tech} ]</p>
    </div>
    <script>
        // Placeholder Config
        window.addEventListener('message', (e) => {
            if(e.data.type === 'HANDSHAKE') {
                window.parent.postMessage({
                    type: 'UI_CONFIG',
                    config: []
                }, '*');
            }
        });
    </script>
</body>
</html>`;

        fs.writeFile(filePath, template, (err) => {
            if (err) return res.status(500).json({ error: 'Write file error' });
            
            // Update JSON
            const newDemo = {
                id: newId,
                title,
                keywords: keywords || '',
                enTitle,
                tech,
                url: `my-motion-portfolio/public/demos/${fileName}`,
                color: 'text-gray-400', // Default color
                isOriginal: true,
                icon: icon || '<circle cx="100" cy="100" r="50" stroke="currentColor" fill="none" />'
            };
            
            list.unshift(newDemo); // Add to top
            
            fs.writeFile(DATA_FILE, JSON.stringify(list, null, 4), (err) => {
                if (err) return res.status(500).json({ error: 'Update JSON error' });
                res.json({ success: true, demo: newDemo });
            });
        });
    });
});

// API: Preview Temporary Generated Code
app.get('/preview/:id', (req, res) => {
    const id = req.params.id;
    const filePath = path.join(TEMP_PREVIEWS_DIR, `${id}.js`);
    
    if (!fs.existsSync(filePath)) {
        return res.status(404).send('Preview not found or expired.');
    }

    const code = fs.readFileSync(filePath, 'utf8');
    const safeCode = code.replace(/`/g, '\\`').replace(/\$/g, '\\$').replace(/<\//g, '<\\/');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quick Preview</title>
    <style>
        body, html { margin: 0; padding: 0; width: 100%; height: 100%; background: #111; overflow: hidden; }
        #canvas-container { width: 100%; height: 100%; }
        #error-overlay { position: fixed; top: 0; left: 0; width: 100%; padding: 20px; background: rgba(255,0,0,0.8); color: white; display: none; z-index: 9999; font-family: monospace; white-space: pre-wrap;}
    </style>
    <script type="importmap">
    {
        "imports": {
            "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
            "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/"
        }
    }
    </script>
</head>
<body>
    <div id="error-overlay"></div>
    <div id="canvas-container"></div>
    <script type="module">
        const codeSource = \`${safeCode}\`;
        
        function showError(e) {
            const errDiv = document.getElementById('error-overlay');
            errDiv.textContent = e.message || String(e);
            errDiv.style.display = 'block';
            console.error(e);
        }

        async function init() {
            try {
                const blob = new Blob([codeSource], { type: 'application/javascript' });
                const url = URL.createObjectURL(blob);
                const mod = await import(url);
                URL.revokeObjectURL(url);
                
                const EngineEffect = mod.default || mod.EngineEffect;
                if (!EngineEffect) throw new Error('Cannot find default class EngineEffect');

                const effect = new EngineEffect();
                const container = document.getElementById('canvas-container');
                const canvas = document.createElement('canvas');
                canvas.style.width = '100%';
                canvas.style.height = '100%';
                canvas.style.display = 'block';
                container.appendChild(canvas);

                const getSize = () => ({
                    width: window.innerWidth,
                    height: window.innerHeight,
                    dpr: Math.min(2, window.devicePixelRatio || 1)
                });

                effect.onStart({
                    container,
                    canvas,
                    gl: null,
                    size: getSize()
                });

                window.addEventListener('resize', () => {
                    const size = getSize();
                    canvas.width = size.width * size.dpr;
                    canvas.height = size.height * size.dpr;
                    if (effect.onResize) effect.onResize(size);
                });

                let lastTime = performance.now();
                const frame = (now) => {
                    const time = now / 1000;
                    const deltaTime = Math.max(0, (now - lastTime) / 1000);
                    lastTime = now;
                    if (effect.onUpdate) effect.onUpdate({ time, deltaTime, size: getSize() });
                    requestAnimationFrame(frame);
                };
                requestAnimationFrame(frame);
            } catch (e) {
                showError(e);
            }
        }
        init();
    </script>
</body>
</html>`;

    res.send(html);
});

app.listen(PORT, () => {
    console.log(`Creator Server running at http://localhost:${PORT}`);
});
