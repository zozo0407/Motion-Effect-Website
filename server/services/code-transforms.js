const path = require('path');
const config = require('../config');

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
    const root = path.resolve(config.ROOT_DIR) + path.sep;
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

module.exports = { extractScriptSceneBlock, isPathAllowed, toExportTemplate, buildScriptSceneDemoHtml };
