const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'my-motion-portfolio/public/data/demos.json');
const DEMO_DIR = path.join(__dirname, 'my-motion-portfolio/public/demos');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname)); // Serve root directly

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

function stripMarkdownCodeFence(text) {
    if (typeof text !== 'string') return '';
    const m = text.match(/^```[a-zA-Z0-9_-]*\s*\n([\s\S]*?)\n```$/);
    return m ? m[1] : text;
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

    const { apiKey, baseUrl, model } = getAIConfig();

    if (!apiKey) {
        const mockCode = `
import * as THREE from 'three';

class ScriptScene {
    constructor(container) {
        this.container = container;
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x111111);
        
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 0, 5);
        
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.container.appendChild(this.renderer.domElement);
        
        // Add Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        const pointLight = new THREE.PointLight(0xffffff, 1);
        pointLight.position.set(5, 5, 5);
        this.scene.add(pointLight);

        // Add Object (Mock: Rotating Torus)
        const geometry = new THREE.TorusKnotGeometry(1, 0.3, 100, 16);
        const material = new THREE.MeshStandardMaterial({ color: 0x00CAE0, roughness: 0.1, metalness: 0.8 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.scene.add(this.mesh);
        
        this.animate = this.animate.bind(this);
        this.onResize = this.onResize.bind(this);
        window.addEventListener('resize', this.onResize);
        
        this.clock = new THREE.Clock();
        this.animate();
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        if (!this.renderer) return;
        requestAnimationFrame(this.animate);
        const time = this.clock.getElapsedTime();
        
        if (this.mesh) {
            this.mesh.rotation.x = time * 0.5;
            this.mesh.rotation.y = time * 0.8;
        }
        
        this.renderer.render(this.scene, this.camera);
    }
    
    destroy() {
        window.removeEventListener('resize', this.onResize);
        if (this.renderer) {
            this.renderer.dispose();
            if (this.renderer.domElement.parentNode) {
                this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
            }
        }
    }
}

export default ScriptScene;
        `;
        return res.json({ code: mockCode });
    }

    try {
        const systemPrompt = `
You are an expert Creative Coder specializing in Three.js and WebGL.
Your task is to generate a JavaScript ES Module that exports a class named 'ScriptScene'.
The class must follow this structure exactly:

\`\`\`javascript
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
// Import other addons from 'three/addons/...' if needed.

class ScriptScene {
    constructor(container) {
        this.container = container;
        this.scene = new THREE.Scene();
        // Setup camera, renderer, lights, objects...
        // Use 'this.container.appendChild(this.renderer.domElement)'
        
        // Setup Resize Listener
        this.onResize = this.onResize.bind(this);
        window.addEventListener('resize', this.onResize);
        
        // Setup Animation Loop
        this.animate = this.animate.bind(this);
        this.clock = new THREE.Clock();
        this.animate();
    }

    onResize() {
        // Handle resize
    }

    animate() {
        if (!this.renderer) return;
        requestAnimationFrame(this.animate);
        // Update logic
        this.renderer.render(this.scene, this.camera);
    }
    
    destroy() {
        // Cleanup resources and listeners
    }
}

export default ScriptScene;
\`\`\`

Requirements:
1. Do not include any markdown formatting (like \`\`\`javascript). Just return the raw code.
2. Ensure the code is valid ES6 module.
3. The user wants: ${prompt}
4. Make it visually impressive but performant.
`;

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
            })
        });

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

        res.json({ code: generatedCode });

    } catch (error) {
        console.error('Generate effect failed:', error && error.message ? error.message : 'Unknown error');
        res.status(500).json({ error: 'Internal Server Error' });
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

app.listen(PORT, () => {
    console.log(`Creator Server running at http://localhost:${PORT}`);
});
