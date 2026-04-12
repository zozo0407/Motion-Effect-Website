# Phase 2: VFX 引擎升级 + 后端重构预热 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 UnifiedRenderer 支持可插拔后处理特效管线，并将 1742 行的 server.js 拆分为 routes/ + services/ 架构。

**Architecture:** 前端在 UnifiedRenderer 中惰性创建 EffectComposer，通过注册表管理特效 Pass 的生命周期和参数映射；后端按职责将 server.js 拆分为 7 个 service 模块和 7 个路由文件，用依赖注入组装。

**Tech Stack:** 原生 JS + ES Modules + Three.js EffectComposer + Express + CommonJS

---

## File Structure

### 前端（VFX 引擎）

| 操作 | 文件路径 | 职责 |
|------|---------|------|
| **修改** | `my-motion-portfolio/public/js/UnifiedRenderer.js` | 增加特效管线 API + 注册表 + 生命周期管理 |
| **创建** | `my-motion-portfolio/public/js/EffectCatalog.js` | 静态特效积木目录（AI prompt 注入用） |
| **修改** | `my-motion-portfolio/public/js/modules/PostProcessing.js` | 标记 deprecated 注释 |

### 后端（server.js 拆分）

| 操作 | 文件路径 | 职责 |
|------|---------|------|
| **创建** | `server/config.js` | 常量与配置 |
| **创建** | `server/services/ai-provider.js` | AI Provider 管理 + fetch + retry |
| **创建** | `server/services/ai-generator.js` | AI 代码生成核心 |
| **创建** | `server/services/ai-repair.js` | AI 代码修复 |
| **创建** | `server/services/code-validator.js` | 代码校验 |
| **创建** | `server/services/code-autofix.js` | 代码自动修复 |
| **创建** | `server/services/code-transforms.js` | 代码文本变换 |
| **创建** | `server/services/skeleton-router.js` | 骨架路由聚合 |
| **创建** | `server/services/demo-store.js` | Demo 数据 CRUD |
| **创建** | `server/routes/generate.js` | POST /api/generate-effect |
| **创建** | `server/routes/generate-v2.js` | POST /api/generate-effect-v2 |
| **创建** | `server/routes/demos.js` | GET/POST /api/demos |
| **创建** | `server/routes/import-script-scene.js` | POST /api/import-script-scene |
| **创建** | `server/routes/save-preview.js` | POST /api/save-preview-as-demo |
| **创建** | `server/routes/create-demo.js` | POST /api/create-demo |
| **创建** | `server/routes/preview.js` | GET /preview/:id |
| **创建** | `server/index.js` | 入口：组装 app |
| **修改** | `package.json` | start 脚本指向新入口 |
| **修改** | `server.js` | 改为 re-export 兼容入口 |

---

## Task 1: UnifiedRenderer — 增加构造函数初始化和 import

**Files:**
- Modify: `my-motion-portfolio/public/js/UnifiedRenderer.js:1-52`

- [ ] **Step 1: 添加 EffectComposer 相关 import**

在文件顶部 import 区域（第 10-12 行之后）添加：

```js
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
```

- [ ] **Step 2: 在 constructor 中初始化特效相关属性**

在 `this._isDestroyed = false;`（第 42 行）之后添加：

```js
        this._effectPasses = [];
        this._composerActive = false;
        this._renderPass = null;
```

- [ ] **Step 3: 验证文件无语法错误**

Run: `node -e "import('./my-motion-portfolio/public/js/UnifiedRenderer.js').catch(e => console.log(e.message))"` — 注意这是 ES Module，用浏览器环境验证更合适。直接在编辑器中检查无红色波浪线即可。

- [ ] **Step 4: Commit**

```bash
git add my-motion-portfolio/public/js/UnifiedRenderer.js
git commit -m "feat(vfx): add EffectComposer imports and effect registry init in constructor"
```

---

## Task 2: UnifiedRenderer — 实现 _ensureComposer 和 _disposeComposer

**Files:**
- Modify: `my-motion-portfolio/public/js/UnifiedRenderer.js` (在 `_disposeMaterial` 方法之后，约第 588 行)

- [ ] **Step 1: 在 `_disposeMaterial()` 方法之后添加 _ensureComposer 方法**

```js
    _ensureComposer() {
        if (this.composer) return this.composer;

        this.composer = new EffectComposer(this.renderer);

        const renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);
        this._renderPass = renderPass;

        this._composerActive = true;

        return this.composer;
    }
```

- [ ] **Step 2: 添加 _disposeComposer 方法**

```js
    _disposeComposer() {
        if (!this.composer) return;

        const passes = this.composer.passes || [];
        for (const pass of passes) {
            if (typeof pass.dispose === 'function') {
                pass.dispose();
            }
        }

        this.composer.passes = [];

        if (this.composer.renderTarget1) this.composer.renderTarget1.dispose();
        if (this.composer.renderTarget2) this.composer.renderTarget2.dispose();

        this.composer = null;
        this._renderPass = null;
        this._composerActive = false;
        this._effectPasses = [];
    }
```

- [ ] **Step 3: Commit**

```bash
git add my-motion-portfolio/public/js/UnifiedRenderer.js
git commit -m "feat(vfx): implement _ensureComposer and _disposeComposer lifecycle methods"
```

---

## Task 3: UnifiedRenderer — 实现注册表核心方法

**Files:**
- Modify: `my-motion-portfolio/public/js/UnifiedRenderer.js` (在 _disposeComposer 之后)

- [ ] **Step 1: 添加 _registerEffect 方法**

```js
    _registerEffect(name, pass, options = {}) {
        if (this._findEffect(name)) {
            this.removeEffect(name);
        }

        const entry = {
            name,
            pass,
            category: options.category || 'postprocessing',
            paramMap: options.params || {},
            meta: options.meta || {}
        };

        this.composer.addPass(pass);

        for (const [paramKey, mapping] of Object.entries(entry.paramMap)) {
            if (!(paramKey in this.params)) {
                this.params[paramKey] = mapping.value;
            }
        }

        this._effectPasses.push(entry);
    }
```

- [ ] **Step 2: 添加 _findEffect 方法**

```js
    _findEffect(name) {
        return this._effectPasses.find(e => e.name === name) || null;
    }
```

- [ ] **Step 3: 添加 _applyEffectParam 方法**

```js
    _applyEffectParam(key, value) {
        for (const entry of this._effectPasses) {
            const mapping = entry.paramMap && entry.paramMap[key];
            if (!mapping) continue;

            const pass = entry.pass;

            if (mapping.apply) {
                mapping.apply(pass, value);
            } else if (mapping.passProp) {
                pass[mapping.passProp] = value;
            }
        }
    }
```

- [ ] **Step 4: 添加 _downgradeToDirectRender 方法**

```js
    _downgradeToDirectRender() {
        if (!this.composer) return;
        if (this.composer.passes.length > 1) return;

        this._disposeComposer();
    }
```

- [ ] **Step 5: Commit**

```bash
git add my-motion-portfolio/public/js/UnifiedRenderer.js
git commit -m "feat(vfx): implement effect registry core methods (_registerEffect, _findEffect, _applyEffectParam, _downgradeToDirectRender)"
```

---

## Task 4: UnifiedRenderer — 实现高层特效 API

**Files:**
- Modify: `my-motion-portfolio/public/js/UnifiedRenderer.js` (在注册表方法之后)

- [ ] **Step 1: 添加 addBloom 方法**

```js
    addBloom(options = {}) {
        const config = {
            strength: options.strength ?? 1.5,
            radius: options.radius ?? 0.4,
            threshold: options.threshold ?? 0.0,
        };

        this._ensureComposer();

        const { width, height } = this._getContainerMetrics();
        const pass = new UnrealBloomPass(
            new THREE.Vector2(width, height),
            config.strength,
            config.radius,
            config.threshold
        );

        this._registerEffect('bloom', pass, {
            category: 'postprocessing',
            params: {
                bloomStrength: { value: config.strength, passProp: 'strength', ui: { name: 'Bloom 强度', min: 0, max: 3, step: 0.1, type: 'range' } },
                bloomRadius: { value: config.radius, passProp: 'radius', ui: { name: 'Bloom 半径', min: 0, max: 1, step: 0.01, type: 'range' } },
                bloomThreshold: { value: config.threshold, passProp: 'threshold', ui: { name: 'Bloom 阈值', min: 0, max: 1, step: 0.01, type: 'range' } },
            },
            meta: {
                description: '泛光后处理效果',
                tags: ['glow', 'light', 'bloom'],
                version: '1.0',
                author: 'engine'
            }
        });

        return this;
    }
```

- [ ] **Step 2: 添加 addGlitch 方法**

注意：本地 three/addons 中没有 GlitchPass，需要用 ShaderPass + 自定义 shader 实现一个轻量版。

```js
    addGlitch(options = {}) {
        const config = {
            intensity: options.intensity ?? 0.5,
        };

        this._ensureComposer();

        const GlitchShader = {
            uniforms: {
                tDiffuse: { value: null },
                uIntensity: { value: config.intensity },
                uTime: { value: 0 },
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D tDiffuse;
                uniform float uIntensity;
                uniform float uTime;
                varying vec2 vUv;

                float rand(vec2 co) {
                    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
                }

                void main() {
                    vec2 uv = vUv;
                    float glitchTrigger = step(1.0 - uIntensity * 0.15, rand(vec2(uTime * 0.1, floor(uv.y * 50.0))));
                    float offset = (rand(vec2(uTime, uv.y)) - 0.5) * 0.1 * uIntensity * glitchTrigger;
                    uv.x += offset;
                    vec4 color = texture2D(tDiffuse, uv);

                    float scanline = sin(uv.y * 800.0 + uTime * 5.0) * 0.04 * uIntensity;
                    color.rgb -= scanline;

                    if (glitchTrigger > 0.5) {
                        color.r = texture2D(tDiffuse, uv + vec2(offset * 0.5, 0.0)).r;
                        color.b = texture2D(tDiffuse, uv - vec2(offset * 0.5, 0.0)).b;
                    }

                    gl_FragColor = color;
                }
            `
        };

        const pass = new ShaderPass(GlitchShader);

        this._registerEffect('glitch', pass, {
            category: 'postprocessing',
            params: {
                glitchIntensity: {
                    value: config.intensity,
                    ui: { name: 'Glitch 强度', min: 0, max: 1, step: 0.05, type: 'range' },
                    apply: (p, v) => { p.uniforms.uIntensity.value = v; }
                },
            },
            meta: {
                description: '故障风格后处理效果',
                tags: ['cyberpunk', 'distortion', 'glitch'],
                version: '1.0',
                author: 'engine'
            }
        });

        this._glitchPass = pass;

        return this;
    }
```

- [ ] **Step 3: 添加 addCustomPass 方法**

```js
    addCustomPass(pass, options = {}) {
        const name = options.name || `custom_${Date.now()}`;

        this._ensureComposer();

        if (pass.isPass && pass.constructor.name === 'RenderPass') {
            console.warn('addCustomPass: RenderPass 由引擎自动管理，无需手动添加');
            return this;
        }

        this._registerEffect(name, pass, {
            category: options.category || 'custom',
            params: options.params || {},
            meta: options.meta || {}
        });

        return this;
    }
```

- [ ] **Step 4: 添加 removeEffect 方法**

```js
    removeEffect(name) {
        const entry = this._findEffect(name);
        if (!entry) return this;

        const idx = this.composer.passes.indexOf(entry.pass);
        if (idx !== -1) {
            this.composer.passes.splice(idx, 1);
        }

        if (typeof entry.pass.dispose === 'function') {
            entry.pass.dispose();
        }

        this._effectPasses = this._effectPasses.filter(e => e.name !== name);

        for (const [paramKey] of Object.entries(entry.paramMap || {})) {
            delete this.params[paramKey];
        }

        if (name === 'glitch') {
            this._glitchPass = null;
        }

        this._downgradeToDirectRender();

        return this;
    }
```

- [ ] **Step 5: Commit**

```bash
git add my-motion-portfolio/public/js/UnifiedRenderer.js
git commit -m "feat(vfx): implement high-level effect APIs (addBloom, addGlitch, addCustomPass, removeEffect)"
```

---

## Task 5: UnifiedRenderer — 改造 dispose / _onResize / _setupMessaging

**Files:**
- Modify: `my-motion-portfolio/public/js/UnifiedRenderer.js`

- [ ] **Step 1: 在 dispose() 方法中添加 composer 清理**

在 `dispose()` 方法中，`this.pause();` 之后（约第 421 行后），添加：

```js
        if (this.composer) {
            this._disposeComposer();
        }
```

同样在 `disposeRuntime()` 方法中，`this.pause();` 之后（约第 504 行后），添加同样的代码。

- [ ] **Step 2: 在 _onResize() 中添加 composer 尺寸同步**

在 `_onResize()` 方法的 `if (this.onResize) this.onResize(width, height);` 之前（约第 369 行前），添加：

```js
        if (this.composer) {
            this.composer.setSize(width, height);
        }
```

- [ ] **Step 3: 在 _setupMessaging() 的 UPDATE_PARAM 处理中添加 _applyEffectParam 调用**

在 `_setupMessaging()` 中，`this.onParamChange(key, value, this);` 之前（约第 406 行前），添加：

```js
                this._applyEffectParam(key, value);
```

- [ ] **Step 4: 在 _setupMessaging() 中添加 REQUEST_CAPABILITIES 消息处理**

在 `_setupMessaging()` 的 `if (type === 'UPDATE_PARAM')` 块之后，添加：

```js
            if (type === 'REQUEST_CAPABILITIES') {
                this._sendProtocolMessage('CAPABILITIES', this.getCapabilities());
            }
```

- [ ] **Step 5: 在 _loop() 中更新 glitch shader 的 uTime**

在 `_loop()` 方法的 `this.updateCallback(...)` 调用之后、`if (this.customRender)` 之前（约第 658 行），添加：

```js
                if (this._glitchPass) {
                    this._glitchPass.uniforms.uTime.value = time;
                }
```

- [ ] **Step 6: Commit**

```bash
git add my-motion-portfolio/public/js/UnifiedRenderer.js
git commit -m "feat(vfx): integrate composer lifecycle into dispose/resize/messaging/loop"
```

---

## Task 6: UnifiedRenderer — 实现 getCapabilities 方法

**Files:**
- Modify: `my-motion-portfolio/public/js/UnifiedRenderer.js` (在 removeEffect 之后)

- [ ] **Step 1: 添加 getCapabilities 方法**

```js
    getCapabilities() {
        return {
            engine: 'UnifiedRenderer',
            version: '2.2',
            type: this.type,
            hasComposer: !!this.composer,
            effects: this._effectPasses.map(entry => ({
                name: entry.name,
                category: entry.category,
                description: entry.meta.description || '',
                tags: entry.meta.tags || [],
                params: Object.entries(entry.paramMap).map(([key, mapping]) => ({
                    bind: key,
                    ...mapping.ui,
                    value: this.params[key] ?? mapping.value
                }))
            })),
            customParams: this.uiConfig || []
        };
    }
```

- [ ] **Step 2: Commit**

```bash
git add my-motion-portfolio/public/js/UnifiedRenderer.js
git commit -m "feat(vfx): implement getCapabilities for effect registry export"
```

---

## Task 7: 创建 EffectCatalog.js 静态目录

**Files:**
- Create: `my-motion-portfolio/public/js/EffectCatalog.js`

- [ ] **Step 1: 创建 EffectCatalog.js**

```js
export const EffectCatalog = {
    bloom: {
        description: '泛光后处理效果',
        tags: ['glow', 'light', 'bloom'],
        api: 'sketch.addBloom({ strength, radius, threshold })',
        params: {
            bloomStrength: { type: 'range', min: 0, max: 3, step: 0.1, default: 1.5, name: 'Bloom 强度' },
            bloomRadius: { type: 'range', min: 0, max: 1, step: 0.01, default: 0.4, name: 'Bloom 半径' },
            bloomThreshold: { type: 'range', min: 0, max: 1, step: 0.01, default: 0.0, name: 'Bloom 阈值' },
        }
    },
    glitch: {
        description: '故障风格后处理效果',
        tags: ['cyberpunk', 'distortion', 'glitch'],
        api: 'sketch.addGlitch({ intensity })',
        params: {
            glitchIntensity: { type: 'range', min: 0, max: 1, step: 0.05, default: 0.5, name: 'Glitch 强度' },
        }
    }
};
```

- [ ] **Step 2: Commit**

```bash
git add my-motion-portfolio/public/js/EffectCatalog.js
git commit -m "feat(vfx): create EffectCatalog static registry for AI prompt injection"
```

---

## Task 8: 标记 PostProcessing.js 为 deprecated

**Files:**
- Modify: `my-motion-portfolio/public/js/modules/PostProcessing.js:1-6`

- [ ] **Step 1: 在文件顶部添加 deprecated 注释**

在现有注释之后添加：

```js
/**
 * PostProcessing.js
 * A plug-and-play module for adding post-processing effects to UnifiedRenderer.
 * Currently supports: Bloom (UnrealBloomPass)
 *
 * @deprecated Phase 2: 请使用 UnifiedRenderer 的 addBloom() / addGlitch() 等 API 替代。
 * 此文件将在 Phase 3 中移除。
 */
```

- [ ] **Step 2: Commit**

```bash
git add my-motion-portfolio/public/js/modules/PostProcessing.js
git commit -m "chore(vfx): mark PostProcessing.js as deprecated in favor of engine APIs"
```

---

## Task 9: 后端拆分 — 创建 server/config.js

**Files:**
- Create: `server/config.js`

- [ ] **Step 1: 创建 config.js**

从 server.js 中提取所有常量和配置读取逻辑：

```js
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const DATA_FILE = path.join(ROOT_DIR, 'my-motion-portfolio/public/data/demos.json');
const DEMO_DIR = path.join(ROOT_DIR, 'my-motion-portfolio/public/demos');
const PROMPTS_DIR = path.join(ROOT_DIR, 'prompts');
const TEMP_PREVIEWS_DIR = path.join(ROOT_DIR, '.temp_previews');

function isSkeletonRouterEnabled(env) {
    const raw = typeof env.AI_ENABLE_SKELETON_ROUTER === 'string' ? env.AI_ENABLE_SKELETON_ROUTER.trim().toLowerCase() : '';
    return raw === '1' || raw === 'true' || raw === 'yes' || raw === 'on';
}

function isLegacySkeletonsDisabled(env) {
    const raw = typeof env.AI_DISABLE_LEGACY_SKELETONS === 'string' ? env.AI_DISABLE_LEGACY_SKELETONS.trim().toLowerCase() : '';
    return raw === '1' || raw === 'true' || raw === 'yes' || raw === 'on';
}

function isMinimalFallbackEnabled(env) {
    const raw = typeof env.AI_ENABLE_MINIMAL_FALLBACK === 'string' ? env.AI_ENABLE_MINIMAL_FALLBACK.trim().toLowerCase() : '';
    if (!raw) return true;
    return !(raw === '0' || raw === 'false' || raw === 'no' || raw === 'off');
}

function getV2TotalBudgetMs(env) {
    const raw = typeof env.AI_V2_TOTAL_BUDGET_MS === 'string' ? env.AI_V2_TOTAL_BUDGET_MS.trim() : '';
    const v = raw ? Number(raw) : 90000;
    if (!Number.isFinite(v)) return 90000;
    return Math.max(15000, Math.min(180000, Math.floor(v)));
}

module.exports = {
    PORT: process.env.PORT || 3000,
    ROOT_DIR,
    DATA_FILE,
    DEMO_DIR,
    PROMPTS_DIR,
    TEMP_PREVIEWS_DIR,
    isSkeletonRouterEnabled,
    isLegacySkeletonsDisabled,
    isMinimalFallbackEnabled,
    getV2TotalBudgetMs,
};
```

- [ ] **Step 2: 确保 .temp_previews 目录创建逻辑**

```js
const fs = require('fs');
if (!fs.existsSync(TEMP_PREVIEWS_DIR)) {
    fs.mkdirSync(TEMP_PREVIEWS_DIR, { recursive: true });
}
```

将这段加到 config.js 底部（module.exports 之前）。

- [ ] **Step 3: Commit**

```bash
mkdir -p server
git add server/config.js
git commit -m "feat(server): extract config constants and env readers to server/config.js"
```

---

## Task 10: 后端拆分 — 创建 server/services/ai-provider.js

**Files:**
- Create: `server/services/ai-provider.js`

- [ ] **Step 1: 创建 ai-provider.js**

从 server.js 提取：`getAIConfig`, `runWithProviderFallback`, `sleep`, `sleepWithSignal`, `fetchWithRetry`, `runV2Stage`，以及 `getAIProvidersFromEnv` 和 `normalizeAIBaseUrl` 的引用。

```js
const { getAIProvidersFromEnv, normalizeAIBaseUrl } = require('../../tools/creator/ai-providers.cjs');

function getAIConfig(env) {
    const providers = getAIProvidersFromEnv(env || process.env);
    if (providers.length > 0) {
        const first = providers[0];
        return {
            apiKey: first.apiKey,
            baseUrl: first.baseUrl,
            model: first.model
        };
    }
    const apiKey = (env || process.env).AI_API_KEY || (env || process.env).OPENAI_API_KEY;
    const baseUrlRaw = (env || process.env).AI_BASE_URL || (env || process.env).OPENAI_BASE_URL || (env || process.env).OPENAI_API_BASE || 'https://api.openai.com/v1';
    const model = (env || process.env).AI_MODEL || (env || process.env).OPENAI_MODEL || 'gpt-4o';
    return {
        apiKey,
        baseUrl: normalizeAIBaseUrl(baseUrlRaw),
        model
    };
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function sleepWithSignal(ms, signal) {
    if (!signal) return sleep(ms);
    return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(resolve, ms);
        const onAbort = () => {
            clearTimeout(timeoutId);
            const err = new Error('aborted');
            err.name = 'AbortError';
            reject(err);
        };
        if (signal.aborted) return onAbort();
        signal.addEventListener('abort', onAbort, { once: true });
    });
}

async function fetchWithRetry(url, options, retryOptions) {
    const retries = (retryOptions && Number.isFinite(retryOptions.retries)) ? retryOptions.retries : 2;
    const baseDelayMs = (retryOptions && Number.isFinite(retryOptions.baseDelayMs)) ? retryOptions.baseDelayMs : 300;
    let lastErr = null;
    for (let attempt = 0; attempt <= retries; attempt += 1) {
        try {
            const res = await fetch(url, options);
            if ((res.status === 429 || res.status === 529) && attempt < retries) {
                const retryAfter = res.headers && typeof res.headers.get === 'function' ? res.headers.get('retry-after') : null;
                const retryAfterSeconds = retryAfter ? parseInt(String(retryAfter), 10) : NaN;
                const waitMs = Number.isFinite(retryAfterSeconds)
                    ? retryAfterSeconds * 1000
                    : baseDelayMs * Math.pow(2, attempt) + Math.floor(Math.random() * 1000);
                console.log(`[fetchWithRetry] ${res.status} 服务过载，${waitMs}ms 后重试 (${attempt + 1}/${retries})`);
                await sleepWithSignal(waitMs, options && options.signal);
                continue;
            }
            if (res.status >= 500 && res.status < 600 && attempt < retries) {
                const waitMs = baseDelayMs * Math.pow(2, attempt) + Math.floor(Math.random() * 500);
                console.log(`[fetchWithRetry] ${res.status} 服务端错误，${waitMs}ms 后重试 (${attempt + 1}/${retries})`);
                await sleepWithSignal(waitMs, options && options.signal);
                continue;
            }
            return res;
        } catch (e) {
            lastErr = e;
            if (e && e.name === 'AbortError') throw e;
            const msg = String((e && e.message) || '');
            const isFetchFailed = e && e.name === 'TypeError' && /fetch failed/i.test(msg);
            if (!isFetchFailed || attempt === retries) throw e;
            const jitter = Math.floor(Math.random() * 200);
            await sleepWithSignal(baseDelayMs * (attempt + 1) + jitter, options && options.signal);
        }
    }
    throw lastErr || new Error('fetch failed');
}

async function runWithProviderFallback(providers, runner) {
    let lastErr = null;
    for (const provider of providers) {
        try {
            return await runner(provider);
        } catch (error) {
            lastErr = error;
            console.warn(`[ai-provider:${provider.label}] failed:`, error && error.message ? error.message : String(error));
        }
    }
    throw lastErr || new Error('No AI providers available');
}

async function runV2Stage({ stage, url, apiKey, model, messages, temperature, maxTokens, timeoutMs }) {
    const startedAt = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(new Error(`${stage} timeout`)), timeoutMs);
    console.log(`[v2][${stage}] start`);
    try {
        const res = await fetchWithRetry(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({
                model,
                stream: false,
                messages,
                temperature,
                max_tokens: maxTokens
            }),
            signal: controller.signal
        }, { retries: 2, baseDelayMs: 400 });
        const elapsedMs = Date.now() - startedAt;
        console.log(`[v2][${stage}] response status=${res.status} elapsedMs=${elapsedMs}`);
        return res;
    } catch (e) {
        const elapsedMs = Date.now() - startedAt;
        const message = String((e && e.message) || e || 'unknown error');
        if (e && e.name === 'AbortError') {
            console.error(`[v2][${stage}] timeout elapsedMs=${elapsedMs} timeoutMs=${timeoutMs}`);
            throw new Error(`V2 ${stage} stage timeout after ${timeoutMs}ms`);
        }
        console.error(`[v2][${stage}] error elapsedMs=${elapsedMs} message=${message}`);
        throw e;
    } finally {
        clearTimeout(timeoutId);
    }
}

module.exports = {
    getAIConfig,
    getAIProvidersFromEnv,
    runWithProviderFallback,
    fetchWithRetry,
    runV2Stage,
    sleep,
    sleepWithSignal,
};
```

- [ ] **Step 2: Commit**

```bash
mkdir -p server/services
git add server/services/ai-provider.js
git commit -m "feat(server): extract AI provider management to server/services/ai-provider.js"
```

---

## Task 11: 后端拆分 — 创建 server/services/code-validator.js

**Files:**
- Create: `server/services/code-validator.js`

- [ ] **Step 1: 创建 code-validator.js**

从 server.js 提取：`basicSyntaxScan`, `checkESMModuleSyntax`, `findUnsafeCtxHelperUsage`, `findVisibleSceneClosureIssue`, `validateEngineEffectCode`。

```js
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('node:child_process');
const config = require('../config');

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

function checkESMModuleSyntax(code) {
    const src = String(code || '');
    if (!src.trim()) return '代码语法错误：Code is empty';
    const tmpName = `syntax-${Date.now()}-${Math.random().toString(16).slice(2)}.mjs`;
    const tmpPath = path.join(config.TEMP_PREVIEWS_DIR, tmpName);
    try {
        fs.writeFileSync(tmpPath, src, 'utf8');
        const r = spawnSync(process.execPath, ['--check', tmpPath], {
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'pipe']
        });
        if (r.status === 0) return null;
        const out = String((r.stderr && r.stderr.trim()) || (r.stdout && r.stdout.trim()) || '').trim();
        const lines = out.split('\n').map(s => s.trim()).filter(Boolean);
        const syntaxLine = lines.find(l => /^SyntaxError:/i.test(l)) || (lines.length ? lines[lines.length - 1] : 'Unknown syntax error');
        return `代码语法错误：${syntaxLine}`;
    } catch (e) {
        return `代码语法错误：${e && e.message ? e.message : String(e)}`;
    } finally {
        try { fs.unlinkSync(tmpPath); } catch (_) {}
    }
}

function findUnsafeCtxHelperUsage(code) {
    const src = String(code || '');
    const methodRe = /\n\s*([A-Za-z_$][\w$]*)\s*\(([^)]*)\)\s*\{([\s\S]*?)\n\s*\}/g;
    const lifecycle = new Set(['constructor', 'onStart', 'onUpdate', 'onResize', 'onDestroy', 'getUIConfig', 'setParam']);
    const keywordNames = new Set(['for', 'if', 'while', 'switch', 'catch']);
    let m;
    while ((m = methodRe.exec(src))) {
        const name = m[1];
        const params = m[2] || '';
        const body = m[3] || '';
        if (lifecycle.has(name)) continue;
        if (keywordNames.has(name)) continue;
        if (/\bctx\b/.test(params)) continue;
        if (/\bctx\./.test(body)) {
            return name;
        }
    }
    return null;
}

function findVisibleSceneClosureIssue(code) {
    const src = String(code || '');
    const resourceHints = /\bnew THREE\.\w*Geometry\b|\bnew THREE\.\w*Material\b|\bvertexShader\b|\bfragmentShader\b|\buniforms\b/;
    if (!resourceHints.test(src)) return null;
    const renderableCtor = /\bnew THREE\.(Mesh|Points|Line|LineSegments|InstancedMesh|Sprite)\s*\(/;
    const sceneAddMatches = src.match(/\b(?:this\.)?scene\.add\s*\(/g) || [];
    const userSceneAdds = Math.max(0, sceneAddMatches.length - 1);
    if (!renderableCtor.test(src)) {
        return '检测到定义了 Geometry / Material / shader，但没有创建实际可渲染对象（如 new THREE.Mesh / Points / Line），这会导致黑屏。';
    }
    if (userSceneAdds <= 0) {
        return '检测到定义了 Geometry / Material / shader，但没有把实际可见对象加入 scene（缺少 scene.add(...)），这会导致黑屏。';
    }
    return null;
}

function validateEngineEffectCode(code) {
    const err = basicSyntaxScan(code);
    if (err) return err;
    if (!/\bonStart\s*\(/.test(code)) return 'Missing onStart(ctx)';
    if (!/\bonUpdate\s*\(/.test(code)) return 'Missing onUpdate(ctx)';
    const openBraces = (String(code).match(/\{/g) || []).length;
    const closeBraces = (String(code).match(/\}/g) || []).length;
    if (closeBraces < openBraces) return '代码疑似被截断（大括号不闭合）';
    const syntaxErr = checkESMModuleSyntax(code);
    if (syntaxErr) return syntaxErr;
    if (/\bTHREE\.\w+Helper\b/.test(String(code))) {
        return '检测到 Three.js Helper（如 SpotLightHelper / AxesHelper / GridHelper 等）。为避免运行时崩溃与性能问题，禁止使用 Helper 调试对象。';
    }
    if (/\bTHREE\.RoomEnvironment\b/.test(String(code)) || /\bRoomEnvironment\b/.test(String(code))) {
        return '检测到 RoomEnvironment（three/examples 扩展，不在核心 three 模块中）。为避免运行时崩溃（not a constructor），禁止使用 RoomEnvironment。请改用基础灯光 + 深色背景，或直接设置 scene.environment = null。';
    }
    const unsafeCtxHelper = findUnsafeCtxHelperUsage(code);
    if (unsafeCtxHelper) {
        return `检测到辅助方法中直接使用 ctx：${unsafeCtxHelper}()。请改为在 onStart(ctx) 中保存 this.ctx，并在辅助方法里使用 this.ctx；或者调用辅助方法时显式传入 ctx 参数。`;
    }
    const ctor = String(code).match(/\bconstructor\s*\(([^)]*)\)/);
    if (ctor && ctor[1] && ctor[1].trim()) return 'constructor() 不应接收任何参数（外部会以 new EngineEffect() 方式实例化）';
    if (/\bclass\s+ScriptScene\b/.test(code)) return '检测到 ScriptScene（应输出 EngineEffect）';
    if (/\bctx\.renderer\b/.test(code)) return '检测到 ctx.renderer（预览引擎不会注入 renderer，请在 onStart(ctx) 内使用 ctx.canvas/ctx.gl 自行创建 THREE.WebGLRenderer）';
    if (/\brequestAnimationFrame\s*\(/.test(code)) return '检测到 requestAnimationFrame（禁止使用，渲染应由 onUpdate 驱动）';
    const visibleSceneIssue = findVisibleSceneClosureIssue(code);
    if (visibleSceneIssue) return visibleSceneIssue;
    return null;
}

module.exports = {
    validateEngineEffectCode,
    basicSyntaxScan,
    checkESMModuleSyntax,
    findUnsafeCtxHelperUsage,
    findVisibleSceneClosureIssue,
};
```

- [ ] **Step 2: Commit**

```bash
git add server/services/code-validator.js
git commit -m "feat(server): extract code validation to server/services/code-validator.js"
```

---

## Task 12: 后端拆分 — 创建 server/services/code-autofix.js

**Files:**
- Create: `server/services/code-autofix.js`

- [ ] **Step 1: 创建 code-autofix.js**

从 server.js 提取：`stripMarkdownCodeFence`, `stripModelNonCodePrologue`, `normalizeThreeNamespaceImport`, `normalizeEngineEffectExport`, `autoFixEngineEffectCode`。从 `tools/creator/engine-autofix.cjs` 聚合 `ensureOnUpdateMethod`, `fixUnsafeCtxHelperUsage`。

```js
const { ensureOnUpdateMethod, fixUnsafeCtxHelperUsage } = require('../../tools/creator/engine-autofix.cjs');

function stripMarkdownCodeFence(text) {
    if (typeof text !== 'string') return '';
    let m = text.match(/```[a-zA-Z0-9_-]*\s*\n([\s\S]*?)\n```/);
    let code = m ? m[1] : text;
    return code;
}

function stripModelNonCodePrologue(text) {
    let s = typeof text === 'string' ? text : '';
    s = s.replace(/^\s*<think[\s\S]*?<\/think>\s*/i, '');
    const importMatch = s.match(/^\s*import\s/m);
    const exportMatch = s.match(/^\s*export\s+default\s+class\s+EngineEffect\b/m);
    const importIdx = importMatch ? (importMatch.index || 0) : -1;
    const exportIdx = exportMatch ? (exportMatch.index || 0) : -1;
    const cutIdx = importIdx >= 0 ? importIdx : (exportIdx >= 0 ? exportIdx : 0);
    if (cutIdx > 0) s = s.slice(cutIdx);
    return s.trim();
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

function normalizeEngineEffectExport(code) {
    if (typeof code !== 'string') return code;
    let s = code;
    if (/export\s+default\s+class\s+EngineEffect\b/.test(s)) return s;
    if (/export\s+default\s+EngineEffect\b/.test(s) && /\bclass\s+EngineEffect\b/.test(s)) {
        s = s.replace(/\bexport\s+default\s+EngineEffect\s*;?\s*/g, '');
        s = s.replace(/\bclass\s+EngineEffect\b/, 'export default class EngineEffect');
        if (/export\s+default\s+class\s+EngineEffect\b/.test(s)) return s;
    }
    s = s.replace(/\bexport\s+class\s+EngineEffect\b/g, 'export default class EngineEffect');
    if (/export\s+default\s+class\s+EngineEffect\b/.test(s)) return s;
    s = s.replace(/(^|\n)\s*class\s+EngineEffect\b/m, '$1export default class EngineEffect');
    return s;
}

function autoFixEngineEffectCode(code) {
    if (typeof code !== 'string' || !code.trim()) return code;
    code = stripModelNonCodePrologue(code);
    code = normalizeThreeNamespaceImport(code);
    code = normalizeEngineEffectExport(code);
    code = fixUnsafeCtxHelperUsage(code);
    if (!/export\s+default\s+class\s+EngineEffect/.test(code)) return code;
    if (!/\bonStart\s*\(/.test(code)) {
        code = code.replace(/class\s+EngineEffect\s*(?:extends\s+[^{]+)?\s*\{/, "class EngineEffect {\n    onStart(ctx) {\n        const width = Math.max(1, Math.floor((ctx && (ctx.width || (ctx.size && ctx.size.width))) || 800));\n        const height = Math.max(1, Math.floor((ctx && (ctx.height || (ctx.size && ctx.size.height))) || 600));\n        const dpr = Math.max(1, Math.min(2, (ctx && (ctx.dpr || (ctx.size && ctx.size.dpr))) || 1));\n        this.scene = new THREE.Scene();\n        this.camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 100);\n        this.camera.position.set(0, 0, 6);\n        this.renderer = new THREE.WebGLRenderer({ canvas: ctx && ctx.canvas ? ctx.canvas : undefined, antialias: true });\n        this.renderer.setPixelRatio(dpr);\n        this.renderer.setSize(width, height, false);\n    }");
    }
    if (!/\bonUpdate\s*\(/.test(code)) {
        code = ensureOnUpdateMethod(code);
    }
    if (!/\bonResize\s*\(/.test(code)) {
        code = code.replace(/\n\s*onUpdate\s*\([^)]*\)\s*\{[^}]*\}/, "$&\n    onResize(ctx) {\n    }");
    }
    if (!/\bonDestroy\s*\(/.test(code)) {
        code = code.replace(/\n\s*onResize\s*\([^)]*\)\s*\{[^}]*\}/, "$&\n    onDestroy(ctx) {\n    }");
    }
    if (!/\bgetUIConfig\s*\(/.test(code)) {
        code = code.replace(/\n\s*onDestroy\s*\([^)]*\)\s*\{[^}]*\}/, "$&\n    getUIConfig() {\n        return [];\n    }");
    }
    if (/setParam\s*\(/.test(code)) return code;
    const insertion = `\n\n    setParam(key, value) {\n        this.params = this.params || {};\n        this.params[key] = value;\n        if (this.material && this.material.uniforms) {\n            const name = 'u' + String(key || '').charAt(0).toUpperCase() + String(key || '').slice(1);\n            const u = this.material.uniforms[name];\n            if (u && u.value && typeof u.value.set === 'function' && typeof value === 'string') {\n                u.value.set(value);\n            } else if (u && Object.prototype.hasOwnProperty.call(u, 'value')) {\n                u.value = value;\n            }\n        }\n        if (this.material && this.material.color && typeof this.material.color.set === 'function' && typeof value === 'string') {\n            this.material.color.set(value);\n        }\n    }\n`;
    if (/\bonStart\s*\(/.test(code)) {
        return code.replace(/\n(\s*)onStart\s*\(/, `${insertion}\n$1onStart(`);
    }
    return code.replace(/\n(\s*)onUpdate\s*\(/, `${insertion}\n$1onUpdate(`);
}

module.exports = {
    autoFixEngineEffectCode,
    normalizeEngineEffectExport,
    normalizeThreeNamespaceImport,
    stripMarkdownCodeFence,
    stripModelNonCodePrologue,
    ensureOnUpdateMethod,
    fixUnsafeCtxHelperUsage,
};
```

- [ ] **Step 2: Commit**

```bash
git add server/services/code-autofix.js
git commit -m "feat(server): extract code autofix to server/services/code-autofix.js"
```

---

## Task 13: 后端拆分 — 创建 server/services/code-transforms.js

**Files:**
- Create: `server/services/code-transforms.js`

- [ ] **Step 1: 创建 code-transforms.js**

从 server.js 提取：`extractScriptSceneBlock`, `isPathAllowed`, `toExportTemplate`, `buildScriptSceneDemoHtml`。

```js
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
    const boot = needsTextures ? `await s._ensureTextures();` : '';

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
      const Easing = { Linear: { None: (k) => k } };
      class Tween {
        constructor(object) { this._object = object || {}; this._valuesStart = {}; this._valuesEnd = {}; this._duration = 1000; this._delayTime = 0; this._startTime = 0; this._easingFunction = Easing.Linear.None; this._onUpdate = null; this._isPlaying = false; }
        to(properties, duration) { this._valuesEnd = properties || {}; if (Number.isFinite(duration)) this._duration = duration; return this; }
        easing(fn) { if (typeof fn === 'function') this._easingFunction = fn; return this; }
        delay(amount) { if (Number.isFinite(amount)) this._delayTime = amount; return this; }
        onUpdate(cb) { if (typeof cb === 'function') this._onUpdate = cb; return this; }
        start(time = 0) { this._isPlaying = true; this._startTime = (Number.isFinite(time) ? time : 0) + this._delayTime; Object.keys(this._valuesEnd).forEach((k) => { const v = this._object[k]; this._valuesStart[k] = Number.isFinite(v) ? v : Number(v); }); _tweens.add(this); return this; }
        stop() { this._isPlaying = false; _tweens.delete(this); return this; }
        update(time) { if (!this._isPlaying) return false; const t = Number.isFinite(time) ? time : 0; if (t < this._startTime) return true; const elapsed = (t - this._startTime) / (this._duration || 1); const clamped = elapsed >= 1 ? 1 : (elapsed <= 0 ? 0 : elapsed); const k = this._easingFunction(clamped); Object.keys(this._valuesEnd).forEach((key) => { const start = this._valuesStart[key]; const endRaw = this._valuesEnd[key]; const end = Number.isFinite(endRaw) ? endRaw : Number(endRaw); const s = Number.isFinite(start) ? start : 0; const e = Number.isFinite(end) ? end : s; this._object[key] = s + (e - s) * k; }); if (this._onUpdate) this._onUpdate(this._object); if (elapsed >= 1) { this.stop(); return false; } return true; }
      }
      const update = (time) => { Array.from(_tweens).forEach(t => t.update(time)); };
      return { Tween, Easing, update };
    })();

    const __EXPORT_TEXT = ${exportTextLiteral};

    class ScriptScene {
      constructor(amgScene = null, container = null) {
        this.scene = new THREE.Scene(); this.camera = null; this.renderer = null; this.sceneObjects = { tweens: [] }; this.isAnimating = false; this.animationFrameId = null; this.TWEEN = TWEEN; this.Duration = 2000; this.texture1 = null; this.texture2 = null; this.effectStack = []; this.effectPassMap = []; this.shaderPasses = []; this.usePostProcessing = false;
        this.initCoreObjects();
        if (container) this.init(container);
      }
      initCoreObjects() {
        this.camera = new THREE.PerspectiveCamera(53.1, window.innerWidth / window.innerHeight, 0.1, 10000); this.camera.position.z = 10; this.scene.add(this.camera); this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); this.renderer.outputColorSpace = THREE.SRGBColorSpace; this.renderer.setSize(window.innerWidth, window.innerHeight); this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      }
      init(container) { container.appendChild(this.renderer.domElement); window.addEventListener('resize', () => this.handleResize()); }
      handleResize() { if (!this.camera || !this.renderer) return; this.camera.aspect = window.innerWidth / window.innerHeight; this.camera.updateProjectionMatrix(); this.renderer.setSize(window.innerWidth, window.innerHeight); }
      start(updateCallback) { if (this.isAnimating) return; this.isAnimating = true; const animateFrame = (t) => { if (!this.isAnimating) return; updateCallback(t); this.animationFrameId = requestAnimationFrame(animateFrame); }; this.animationFrameId = requestAnimationFrame(animateFrame); }
      update() { if (this.renderer) this.renderer.render(this.scene, this.camera); }
      defaultUpdate(timestamp) { if (this.TWEEN && typeof this.TWEEN.update === 'function') { this.TWEEN.update(timestamp); } else if (this.sceneObjects && this.sceneObjects.tweens && this.sceneObjects.tweens.length > 0) { this.sceneObjects.tweens.forEach(tween => { if (tween && typeof tween.update === 'function') tween.update(timestamp); }); } this.update(); }
      addShaderPass() {}
      setupPostProcessing() { this.shaderPasses = []; }
      applyEffectStack() {}
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
      if (d.type === 'HANDSHAKE') { parent.postMessage({ type: 'UI_CONFIG', config: [] }, '*'); }
      if (d.type === 'EXPORT_SCRIPT_SCENE') {
        const blob = new Blob([__EXPORT_TEXT], { type: 'application/javascript' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'scriptScene.js'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
      }
    });
  </script>
</body>
</html>`;
}

module.exports = {
    extractScriptSceneBlock,
    isPathAllowed,
    toExportTemplate,
    buildScriptSceneDemoHtml,
};
```

- [ ] **Step 2: Commit**

```bash
git add server/services/code-transforms.js
git commit -m "feat(server): extract code transforms to server/services/code-transforms.js"
```

---

## Task 14: 后端拆分 — 创建 server/services/ai-generator.js, ai-repair.js, skeleton-router.js, demo-store.js

**Files:**
- Create: `server/services/ai-generator.js`
- Create: `server/services/ai-repair.js`
- Create: `server/services/skeleton-router.js`
- Create: `server/services/demo-store.js`

这四个 service 可以并行创建，因为它们互不依赖。

- [ ] **Step 1: 创建 ai-generator.js**

从 server.js 提取 `generateEffectV2FromPrompt`, `classifyStyle`, `assemblePrompt`。这些函数较长，需要引用 `ai-provider.js` 和 `code-autofix.js`。

```js
const fs = require('fs');
const path = require('path');
const config = require('../config');
const { buildBlueprintMessages, buildCodeMessages, defaultBlueprint, parseBlueprintResponse } = require('../../tools/creator/effect-blueprint.cjs');
const { shouldUseBlueprintStage } = require('../../tools/creator/generation-config.cjs');
const { wrapAsEngineEffect, parseAIOutput } = require('../../tools/creator/v2-wrapped-parts.cjs');
const { fetchWithRetry, runV2Stage } = require('./ai-provider');
const { stripMarkdownCodeFence, stripModelNonCodePrologue, normalizeThreeNamespaceImport } = require('./code-autofix');

async function generateEffectV2FromPrompt(prompt, apiKey, baseUrl, model, options = {}) {
    const outputMode = String(options.outputMode || '').trim();
    const read = (f) => {
        try { return fs.readFileSync(path.join(config.PROMPTS_DIR, f), 'utf8'); }
        catch (_) { return ''; }
    };
    const contract = read('engine-contract.md');
    const url = `${baseUrl}/chat/completions`;
    let blueprint = defaultBlueprint(prompt);
    const codeTimeoutMs = Number.isFinite(options.codeTimeoutMs) ? options.codeTimeoutMs : 90000;
    const blueprintTimeoutMs = Number.isFinite(options.blueprintTimeoutMs) ? options.blueprintTimeoutMs : 25000;

    if (outputMode === 'wrapped_parts') {
        const systemPrompt = [
            '你是 Three.js / WebGL 视觉特效专家。根据用户的需求描述，输出两段 JavaScript 代码（仅函数体）。',
            '',
            '【setup】用于初始化场景。你可以添加灯光/几何体/材质/粒子等。',
            '可直接使用变量（已由外部创建，不要重新声明）：scene / camera / renderer',
            '需要在 animate 中访问的对象，必须挂在 this 上，例如：this.mesh = new THREE.Mesh(...)',
            '如需可调参数，请统一从 this.params 读取，例如：this.params.primaryColor / this.params.speed。',
            '',
            '【animate】每帧调用一次。可直接使用变量：time / deltaTime，并通过 this.xxx 访问 setup 对象。',
            '不要调用 renderer.render()（外层会自动 render）。',
            '【可见对象闭环（严格）】如果你定义了 Geometry / Material / shader / uniforms，必须把它们组装成一个实际可渲染对象，例如 new THREE.Mesh(...) / new THREE.Points(...) / new THREE.Line(...)。',
            '【可见对象闭环（严格）】在 setup 结束前，必须调用 scene.add(...) 把至少一个非相机对象加入场景；不能只停留在 geometry、material、vertexShader、fragmentShader、uniforms 的变量声明阶段。',
            '【首帧可见（严格）】输出必须保证首帧能看到内容，禁止生成只有相机和空场景的代码。',
            '',
            '【输出格式（严格）】必须输出三段内容：setup、animate、UI JSON。不要 markdown/code fence；不要 import/export/class；不要解释文字：',
            '// === setup ===',
            '(setup code)',
            '---SPLIT---',
            '// === animate ===',
            '(animate code)',
            '---UI---',
            '[{ "bind":"primaryColor", "name":"主色调", "type":"color", "value":"#00f2ff" }, ...]',
            '',
            '【禁止】document./window./requestAnimationFrame/appendChild/getElementById',
            '【禁止】声明 const scene / const camera / const renderer',
            '【禁止】重复声明 width / height / dpr（外层 wrapper 已创建内部尺寸变量，请直接使用 scene/camera/renderer/this.xxx 驱动动画）',
            '【禁止】THREE.*Helper（SpotLightHelper/PointLightHelper 等）',
            '【禁止】THREE.RoomEnvironment / RoomEnvironment（属于 three/examples 扩展，核心 three 中不存在，会导致运行时报错 not a constructor）',
            '【禁止】async/await',
            '',
            '【UI JSON 规范（严格）】',
            '1) ---UI--- 后面必须是"纯 JSON 数组"，不能有任何多余文字/注释/markdown。',
            '2) 控件最多 6 个；超出将被丢弃。',
            '3) 允许的 type 仅限：color / range / checkbox / select。',
            '4) bind 必须匹配正则：^[a-zA-Z_][a-zA-Z0-9_]{0,31}$（最长 32）。',
            '5) range 字段：min/max/step/value 必须是数字。',
            '6) select 字段：options 必须是字符串数组（最多 10 项），value 必须是 options 里的值或索引。',
            '7) 请确保 setup/animate 里会使用到这些 bind（通过 this.params.<bind>），这样调节才有效。',
            '',
            '【质量】深色背景、配色低饱和、有层次、代码简洁（setup+animate 合计 <= 120 行）。'
        ].join('\n');

        const partsRes = await runV2Stage({
            stage: 'parts', url, apiKey, model,
            messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: prompt }],
            temperature: (() => {
                const raw = process.env.AI_WRAPPED_PARTS_TEMPERATURE;
                const n = typeof raw === 'string' && raw.trim() ? Number(raw) : 0.25;
                return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0.25;
            })(),
            maxTokens: 4096,
            timeoutMs: codeTimeoutMs
        });

        if (!partsRes.ok) {
            const errText = await partsRes.text();
            throw new Error(`Generation failed: ${partsRes.status} ${errText}`);
        }

        const data = await partsRes.json();
        const msg = data && data.choices && data.choices[0] && data.choices[0].message;
        const content = (msg && (msg.content || msg.reasoning_content)) || '';
        if (!content.trim()) throw new Error('AI 返回内容为空');

        const wantsUISection = content.includes('---UI---');
        const hasSplit = content.includes('---SPLIT---');
        const { setup, animate, uiConfig, uiParseFailed } = parseAIOutput(content);

        const isFormatFailure = !hasSplit || !wantsUISection || !setup || !String(setup).trim() || uiParseFailed;

        if (isFormatFailure) {
            const reformatSystem = [
                '你是严格的"格式化器/重排器"。你的任务：只把输入内容重排为指定格式，绝对不要改动任何代码逻辑。',
                '',
                '输入内容是上一轮模型的输出，可能缺少分隔符或夹杂文字。',
                '',
                '【必须输出格式（严格）】',
                '// === setup ===',
                '(setup code: 仅函数体，使用 scene/camera/renderer/this.xxx，不要 import/export/class)',
                '---SPLIT---',
                '// === animate ===',
                '(animate code: 仅函数体，可用 time/deltaTime/this.xxx，不要 renderer.render())',
                '---UI---',
                '(纯 JSON 数组，最多 6 项；type 仅限 color/range/checkbox/select；bind 正则 ^[a-zA-Z_][a-zA-Z0-9_]{0,31}$ )',
                '',
                '【重要】',
                '1) 只能做"重排/补分隔符/去掉解释文字/提取代码片段"，不要新增或修改任何逻辑语句。',
                '2) 如果 UI JSON 缺失，请根据代码中可调参数推断最少 1-3 个控件；如果完全无法推断，输出空数组 []。',
                '3) 除了三段内容本身，不要输出任何别的字符。',
            ].join('\n');

            const reformatUser = ['请把下面内容重排为严格格式：', '---BEGIN---', content, '---END---'].join('\n');

            const retryTimeout = Math.max(5000, Math.min(20000, Math.floor(codeTimeoutMs / 3)));
            const retryRes = await runV2Stage({
                stage: 'parts_reformat', url, apiKey, model,
                messages: [{ role: 'system', content: reformatSystem }, { role: 'user', content: reformatUser }],
                temperature: 0.0, maxTokens: 4096, timeoutMs: retryTimeout
            });

            if (!retryRes.ok) {
                const errText = await retryRes.text();
                throw new Error(`Format retry failed: ${retryRes.status} ${errText}`);
            }

            const retryData = await retryRes.json();
            const retryMsg = retryData && retryData.choices && retryData.choices[0] && retryData.choices[0].message;
            const retryContent = (retryMsg && (retryMsg.content || retryMsg.reasoning_content)) || '';
            if (!retryContent.trim()) throw new Error('格式重排返回内容为空');

            const reparsed = parseAIOutput(retryContent);
            if (!reparsed.setup || !String(reparsed.setup).trim()) throw new Error('AI 未输出有效的 setup 代码');
            return wrapAsEngineEffect(reparsed.setup, reparsed.animate, reparsed.uiConfig);
        }

        if (!setup || !String(setup).trim()) throw new Error('AI 未输出有效的 setup 代码');
        return wrapAsEngineEffect(setup, animate, uiConfig);
    }

    if (shouldUseBlueprintStage(process.env)) {
        const blueprintMessages = buildBlueprintMessages(prompt);
        try {
            const blueprintRes = await runV2Stage({
                stage: 'blueprint', url, apiKey, model,
                messages: [{ role: 'system', content: blueprintMessages.system }, { role: 'user', content: blueprintMessages.user }],
                temperature: 0.3, maxTokens: 1024, timeoutMs: blueprintTimeoutMs
            });
            if (!blueprintRes.ok) {
                const errText = await blueprintRes.text();
                throw new Error(`Generation failed: ${blueprintRes.status} ${errText}`);
            }
            const blueprintData = await blueprintRes.json();
            const blueprintMsg = blueprintData && blueprintData.choices && blueprintData.choices[0] && blueprintData.choices[0].message;
            const blueprintContent = (blueprintMsg && (blueprintMsg.content || blueprintMsg.reasoning_content)) || '';
            blueprint = parseBlueprintResponse(blueprintContent);
        } catch (e) {
            const msg = String((e && e.message) || e || '');
            console.log(`[v2][blueprint] fallback due to error: ${msg}`);
        }
    } else {
        console.log('[v2][blueprint] skipped (AI_ENABLE_BLUEPRINT not enabled)');
    }

    const codeMessages = buildCodeMessages(prompt, blueprint, contract);
    const codeRes = await runV2Stage({
        stage: 'code', url, apiKey, model,
        messages: [{ role: 'system', content: codeMessages.system }, { role: 'user', content: codeMessages.user }],
        temperature: 0.5, maxTokens: 8192, timeoutMs: codeTimeoutMs
    });

    if (!codeRes.ok) {
        const errText = await codeRes.text();
        throw new Error(`Generation failed: ${codeRes.status} ${errText}`);
    }

    const data = await codeRes.json();
    const msg = data && data.choices && data.choices[0] && data.choices[0].message;
    const finalCodeContent = (msg && (msg.content || msg.reasoning_content)) || '';
    let generatedCode = stripModelNonCodePrologue(stripMarkdownCodeFence(finalCodeContent)).trim();
    generatedCode = normalizeThreeNamespaceImport(generatedCode);
    return generatedCode;
}

async function classifyStyle(prompt, apiKey, baseUrl, model) {
    const sysPrompt = `You are a router. Classify the following user request for a 3D scene into one of these styles:\n- 'cyberpunk': neon, futuristic, glowing, sci-fi, dark, glitch.\n- 'toon': cartoon, anime, cel-shaded, flat, outline, cute.\n- 'minimalist': clean, simple, geometric, soft, pure color, flat design.\n- 'realistic': PBR, realistic materials, physics, natural light.\n- 'default': anything else, or high-end apple-like abstract aesthetic.\nReply ONLY with the style name.`;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        let response;
        let data = null;
        try {
            response = await fetchWithRetry(`${baseUrl}/chat/completions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
                body: JSON.stringify({ model, messages: [{ role: 'system', content: sysPrompt }, { role: 'user', content: prompt }], temperature: 0.1, max_tokens: 10 }),
                signal: controller.signal
            }, { retries: 1, baseDelayMs: 200 });
            data = await response.json();
        } finally { clearTimeout(timeoutId); }
        if (data && data.choices && data.choices[0] && data.choices[0].message) {
            const style = data.choices[0].message.content.trim().toLowerCase();
            const validStyles = ['cyberpunk', 'toon', 'minimalist', 'realistic'];
            for (const s of validStyles) { if (style.includes(s)) return s; }
        }
        return 'default';
    } catch (e) {
        console.error('Classification failed, falling back to default:', e);
        return 'default';
    }
}

function assemblePrompt(style, userPrompt) {
    const read = (filename) => {
        try { return fs.readFileSync(path.join(config.PROMPTS_DIR, filename), 'utf8'); }
        catch (e) { console.error(`Failed to read prompt file ${filename}:`, e); return ''; }
    };
    const base = read('base-role.md');
    let styleText = read(`styles/${style}.md`);
    if (!styleText) styleText = read('styles/default.md');
    const contract = read('engine-contract.md');
    let exampleText = read(`styles/${style}-example.md`);
    if (!exampleText && style !== 'default') { exampleText = read('styles/default-example.md'); }
    let fullPrompt = `${base}\n\n${styleText}\n\n${exampleText ? exampleText + '\n\n' : ''}${contract}`;
    return fullPrompt.split('{{USER_PROMPT}}').join(userPrompt);
}

module.exports = { generateEffectV2FromPrompt, classifyStyle, assemblePrompt };
```

- [ ] **Step 2: 创建 ai-repair.js**

```js
const { fetchWithRetry } = require('./ai-provider');
const { stripMarkdownCodeFence, stripModelNonCodePrologue, normalizeThreeNamespaceImport } = require('./code-autofix');
const config = require('../config');

async function repairEngineEffectCode({ prompt, badCode, error, apiKey, baseUrl, model, timeoutMs }) {
    const read = (f) => {
        try { return require('fs').readFileSync(require('path').join(config.PROMPTS_DIR, f), 'utf8'); }
        catch (_) { return ''; }
    };
    const contract = read('engine-contract.md');
    const system = [
        '你是 Three.js/WebGL 专家。你只输出"可直接执行的 ES Module 纯代码"，不要任何解释，不要 markdown code fence。',
        '必须满足 EngineEffect 合约：第一行 import * as THREE from \'three\'; 并 export default class EngineEffect，包含 constructor/onStart/onUpdate/onResize/onDestroy/getUIConfig/setParam。',
        '不得省略任何必需方法，尤其是 onUpdate(ctx)。如果你发现缺失，请优先补齐方法签名与最小可见渲染逻辑（renderer.render(scene, camera)）。',
        '禁止使用 Three.js 的 *Helper 调试对象（例如 SpotLightHelper、DirectionalLightHelper、PointLightHelper、CameraHelper、AxesHelper、GridHelper 等）。',
        '禁止使用 RoomEnvironment（THREE.RoomEnvironment 或 RoomEnvironment）。它来自 three/examples 扩展，核心 three 模块中不存在，容易导致运行时崩溃。',
        '如需容器只能使用 ctx.container；渲染必须使用 ctx.canvas/ctx.gl（如存在），禁止使用 ctx.renderer。',
        'ctx 只能在生命周期方法内直接使用；如果辅助方法需要上下文，请在 onStart(ctx) 开头保存 this.ctx = ctx，并在其它方法中使用 this.ctx，或显式把 ctx 作为参数传入。',
        '严禁 requestAnimationFrame；渲染只能在 onUpdate(ctx) 内由外部驱动。',
        contract ? `合约参考：\n${contract}` : ''
    ].filter(Boolean).join('\n\n');

    const user = [`用户需求：${prompt}`, `上一次输出的校验错误：${error}`, '上一次输出（需要你修复为合规版本）：', badCode].join('\n\n');

    const controller = new AbortController();
    const budgetMs = Number.isFinite(timeoutMs) ? timeoutMs : 180000;
    const timeoutId = setTimeout(() => controller.abort(), budgetMs);

    try {
        const url = `${baseUrl}/chat/completions`;
        const res = await fetchWithRetry(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({ model, stream: false, messages: [{ role: 'system', content: system }, { role: 'user', content: user }], temperature: 0, max_tokens: 8192 }),
            signal: controller.signal
        }, { retries: 0, baseDelayMs: 400 });

        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`Repair failed: ${res.status} ${errText}`);
        }

        const data = await res.json();
        const msg = data && data.choices && data.choices[0] && data.choices[0].message;
        const content = (msg && (msg.content || msg.reasoning_content)) || '';
        let repaired = stripModelNonCodePrologue(stripMarkdownCodeFence(content)).trim();
        repaired = normalizeThreeNamespaceImport(repaired);
        return repaired;
    } finally {
        clearTimeout(timeoutId);
    }
}

module.exports = { repairEngineEffectCode };
```

- [ ] **Step 3: 创建 skeleton-router.js**

```js
const { routePromptToSkeleton } = require('../../tools/creator/skeleton-router.cjs');
const { buildGlowSphereEffectCode } = require('../../tools/creator/skeletons/glow-sphere.cjs');
const { buildParticlesEffectCode } = require('../../tools/creator/skeletons/particles.cjs');
const { buildWireframeGeoEffectCode } = require('../../tools/creator/skeletons/wireframe-geo.cjs');
const { buildDigitalRainEffectCode } = require('../../tools/creator/skeletons/digital-rain.cjs');
const { buildGlassGeoEffectCode } = require('../../tools/creator/skeletons/glass-geo.cjs');
const { buildLiquidMetalEffectCode } = require('../../tools/creator/skeletons/liquid-metal.cjs');
const { buildEnergyCoreEffectCode } = require('../../tools/creator/skeletons/energy-core.cjs');
const { buildMinimalFallbackPayload } = require('../../tools/creator/minimal-fallback.cjs');

function buildCodeFromSkeletonRoute(skeletonRoute) {
    if (!skeletonRoute || !skeletonRoute.matched) return '';
    const params = skeletonRoute.params || {};
    if (skeletonRoute.kind === 'energy-core') return buildEnergyCoreEffectCode(params);
    if (skeletonRoute.kind === 'particles-vortex') return buildParticlesEffectCode(params);
    if (skeletonRoute.kind === 'wireframe-geo') return buildWireframeGeoEffectCode(params);
    if (skeletonRoute.kind === 'digital-rain') return buildDigitalRainEffectCode(params);
    if (skeletonRoute.kind === 'glass-geo') return buildGlassGeoEffectCode(params);
    if (skeletonRoute.kind === 'liquid-metal') return buildLiquidMetalEffectCode(params);
    return '';
}

module.exports = {
    routePromptToSkeleton,
    buildCodeFromSkeletonRoute,
    buildMinimalFallbackPayload,
    buildEnergyCoreEffectCode,
    buildGlowSphereEffectCode,
};
```

- [ ] **Step 4: 创建 demo-store.js**

```js
const fs = require('fs');
const config = require('../config');

function readDemos() {
    return JSON.parse(fs.readFileSync(config.DATA_FILE, 'utf8'));
}

function writeDemos(data) {
    fs.writeFileSync(config.DATA_FILE, JSON.stringify(data, null, 4), 'utf8');
}

function getNextDemoId() {
    const list = readDemos();
    let maxId = 0;
    list.forEach(d => {
        const num = parseInt(d.id, 10);
        if (!isNaN(num) && num > maxId) maxId = num;
    });
    return { id: String(maxId + 1).padStart(3, '0'), num: maxId + 1 };
}

function createDemoFile(fileName, html) {
    const filePath = require('path').join(config.DEMO_DIR, fileName);
    fs.writeFileSync(filePath, html, 'utf8');
}

function readTempPreview(id) {
    const filePath = require('path').join(config.TEMP_PREVIEWS_DIR, `${id}.js`);
    if (!fs.existsSync(filePath)) return null;
    return fs.readFileSync(filePath, 'utf8');
}

module.exports = { readDemos, writeDemos, getNextDemoId, createDemoFile, readTempPreview };
```

- [ ] **Step 5: Commit**

```bash
git add server/services/ai-generator.js server/services/ai-repair.js server/services/skeleton-router.js server/services/demo-store.js
git commit -m "feat(server): extract AI generator, repair, skeleton-router, and demo-store services"
```

---

## Task 15: 后端拆分 — 创建 7 个路由文件

**Files:**
- Create: `server/routes/generate.js`
- Create: `server/routes/generate-v2.js`
- Create: `server/routes/demos.js`
- Create: `server/routes/import-script-scene.js`
- Create: `server/routes/save-preview.js`
- Create: `server/routes/create-demo.js`
- Create: `server/routes/preview.js`

每个路由文件从 server.js 中提取对应的 `app.post/get` handler，改为接收 `app` 和 `services` 参数的注册函数。由于代码量大，这里给出每个文件的核心骨架，handler 逻辑直接从 server.js 对应行搬入。

- [ ] **Step 1: 创建 routes/generate.js**

```js
module.exports = function(app, services) {
    const { aiProvider, aiGenerator, codeValidator, codeAutofix, skeletonRouter, config } = services;

    app.post('/api/generate-effect', async (req, res) => {
        const body = req.body && typeof req.body === 'object' ? req.body : {};
        const keys = Object.keys(body);
        if (keys.length === 0) return res.status(400).json({ error: 'Prompt is required' });
        if (keys.length !== 1 || keys[0] !== 'prompt') return res.status(400).json({ error: 'Only { prompt } is accepted' });
        const prompt = body.prompt;
        if (typeof prompt !== 'string' || !prompt.trim()) return res.status(400).json({ error: 'Prompt is required' });

        if (String(process.env.AI_DEMO_MODE || '') === '1') {
            try {
                const routed = skeletonRouter.routePromptToSkeleton(prompt);
                const params = routed && routed.params ? routed.params : {};
                const code = routed && routed.kind === 'particles'
                    ? skeletonRouter.buildParticlesEffectCode(params)
                    : skeletonRouter.buildGlowSphereEffectCode(params);
                return res.json({ code });
            } catch (e) {
                const code = skeletonRouter.buildGlowSphereEffectCode({ color: '#ff0040', glowIntensity: 1.2, speed: 1.0 });
                return res.json({ code });
            }
        }

        const { apiKey, baseUrl, model } = aiProvider.getAIConfig();

        if (!apiKey) {
            const code = skeletonRouter.buildEnergyCoreEffectCode({ color: '#00f2ff', intensity: 1.2, speed: 1.0 });
            return res.json({ code });
        }

        try {
            if (req && req.query && String(req.query.v || '') === '2') {
                let generatedCode = await aiGenerator.generateEffectV2FromPrompt(prompt, apiKey, baseUrl, model);
                generatedCode = codeAutofix.autoFixEngineEffectCode(generatedCode);
                let scanErr = codeValidator.validateEngineEffectCode(generatedCode);
                if (scanErr) {
                    console.log(`[v2][generate] Validation failed: ${scanErr}, attempting repair...`);
                    const { repairEngineEffectCode } = require('../services/ai-repair');
                    const repaired = await repairEngineEffectCode({ prompt, badCode: generatedCode, error: scanErr, apiKey, baseUrl, model });
                    const repairedFixed = codeAutofix.autoFixEngineEffectCode(repaired);
                    scanErr = codeValidator.validateEngineEffectCode(repairedFixed);
                    if (scanErr) return res.status(502).json({ error: `AI 输出不符合 EngineEffect 合约：${scanErr}` });
                    return res.json({ code: repairedFixed });
                }
                return res.json({ code: generatedCode });
            }
            const style = await aiGenerator.classifyStyle(prompt, apiKey, baseUrl, model);
            const systemPrompt = aiGenerator.assemblePrompt(style, prompt);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 180000);
            let response;
            let raw = '';
            try {
                response = await aiProvider.fetchWithRetry(`${baseUrl}/chat/completions`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
                    body: JSON.stringify({ model, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: prompt }], temperature: 0.7, max_tokens: 8192 }),
                    signal: controller.signal
                }, { retries: 2, baseDelayMs: 400 });
                raw = await response.text();
            } finally { clearTimeout(timeoutId); }

            let data = null;
            try { data = JSON.parse(raw); } catch (_) { data = null; }

            if (!response.ok) {
                const upstreamMessage = (data && data.error && typeof data.error.message === 'string' && data.error.message) || `Upstream AI request failed (${response.status})`;
                return res.status(502).json({ error: upstreamMessage });
            }

            const content = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
            if (typeof content !== 'string' || !content.trim()) return res.status(502).json({ error: 'Upstream AI response is empty or invalid' });

            let generatedCode = codeAutofix.stripModelNonCodePrologue(codeAutofix.stripMarkdownCodeFence(content)).trim();
            generatedCode = codeAutofix.normalizeThreeNamespaceImport(generatedCode);

            const scanErr = codeValidator.validateEngineEffectCode(generatedCode);
            if (scanErr) return res.status(502).json({ error: `AI 输出不符合 EngineEffect 合约：${scanErr}` });
            res.json({ code: generatedCode });
        } catch (error) {
            const msg = String((error && error.message) || '');
            const isFetchFailed = error && error.name === 'TypeError' && /fetch failed/i.test(msg);
            if (isFetchFailed) {
                console.error('Generate effect failed: upstream fetch failed', { baseUrl, model });
                return res.status(502).json({ error: '上游 AI 网络请求失败（fetch failed），请稍后重试' });
            }
            const genFailed = msg.match(/^Generation failed:\s*(\d{3})\s*([\s\S]*)$/);
            if (genFailed) {
                const status = parseInt(genFailed[1], 10);
                const bodyText = String(genFailed[2] || '').trim();
                let detail = '';
                try {
                    const parsed = JSON.parse(bodyText);
                    detail = (parsed && parsed.error && typeof parsed.error.message === 'string' && parsed.error.message) || (parsed && typeof parsed.error === 'string' && parsed.error) || '';
                } catch (_) { detail = ''; }
                const safeStatus = Number.isFinite(status) && status >= 400 && status <= 599 ? status : 502;
                const message = detail || (bodyText ? bodyText : `Upstream AI request failed (${safeStatus})`);
                return res.status(safeStatus).json({ error: message });
            }
            console.error('Generate effect failed:', msg || 'Unknown error');
            if (error && (error.name === 'AbortError' || /aborted/i.test(String(error.message || '')))) return res.status(504).json({ error: 'Upstream AI request timed out' });
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });
};
```

- [ ] **Step 2: 创建 routes/generate-v2.js**

```js
module.exports = function(app, services) {
    const { aiProvider, aiGenerator, codeValidator, codeAutofix, skeletonRouter, config } = services;
    const { repairEngineEffectCode } = require('../services/ai-repair');

    app.post('/api/generate-effect-v2', async (req, res) => {
        const body = req.body && typeof req.body === 'object' ? req.body : {};
        const prompt = typeof body.prompt === 'string' ? body.prompt : '';
        if (!prompt.trim()) return res.status(400).json({ error: 'Prompt is required' });

        const skeletonEnabled = config.isSkeletonRouterEnabled(process.env);
        const legacySkeletonsDisabled = config.isLegacySkeletonsDisabled(process.env);
        const minimalFallbackEnabled = config.isMinimalFallbackEnabled(process.env);
        const totalBudgetMs = config.getV2TotalBudgetMs(process.env);
        const t0 = Date.now();
        const remainingBudgetMs = () => totalBudgetMs - (Date.now() - t0);

        const budgetExceededPayload = (reason) => {
            console.log(`[v2][budget] budget exceeded: ${reason}`);
            return skeletonRouter.buildMinimalFallbackPayload({ reason: `budget exceeded: ${reason}`, prompt });
        };

        if (skeletonEnabled && String(process.env.AI_DEMO_MODE || '') === '1') {
            if (legacySkeletonsDisabled) {
                const code = skeletonRouter.buildEnergyCoreEffectCode({ color: '#00f2ff', intensity: 1.2, speed: 1.0 });
                return res.json({ code, degraded: true, degradedReason: 'AI_DISABLE_LEGACY_SKELETONS=1' });
            }
            try {
                const routed = skeletonRouter.routePromptToSkeleton(prompt);
                const code = skeletonRouter.buildCodeFromSkeletonRoute(routed) || skeletonRouter.buildEnergyCoreEffectCode({ color: '#00f2ff', intensity: 1.2, speed: 1.0 });
                return res.json({ code });
            } catch (e) {
                const code = skeletonRouter.buildEnergyCoreEffectCode({ color: '#00f2ff', intensity: 1.2, speed: 1.0 });
                return res.json({ code });
            }
        }

        if (skeletonEnabled) {
            if (legacySkeletonsDisabled) {
                const code = skeletonRouter.buildEnergyCoreEffectCode({ color: '#00f2ff', intensity: 1.2, speed: 1.0 });
                return res.json({ code, degraded: true, degradedReason: 'AI_DISABLE_LEGACY_SKELETONS=1' });
            }
            const skeletonRoute = skeletonRouter.routePromptToSkeleton(prompt);
            if (skeletonRoute && skeletonRoute.matched) {
                const code = skeletonRouter.buildCodeFromSkeletonRoute(skeletonRoute);
                if (code) return res.json({ code });
            }
        }

        const providers = aiProvider.getAIProvidersFromEnv(process.env);
        if (!providers.length) return res.status(400).json({ error: 'Missing AI_PRIMARY_API_KEY' });

        try {
            if (remainingBudgetMs() <= 0) return res.json(budgetExceededPayload('before generation'));
            let generatedCode = await aiProvider.runWithProviderFallback(providers, async (provider) => {
                return aiGenerator.generateEffectV2FromPrompt(prompt, provider.apiKey, provider.baseUrl, provider.model, {
                    outputMode: process.env.AI_V2_OUTPUT_MODE,
                    codeTimeoutMs: Math.max(1000, Math.min(90000, remainingBudgetMs() - 1500))
                });
            });
            generatedCode = codeAutofix.autoFixEngineEffectCode(generatedCode);
            let scanErr = codeValidator.validateEngineEffectCode(generatedCode);
            if (scanErr) {
                console.log(`[v2][generate-effect-v2] Validation failed: ${scanErr}, attempting repair...`);
                if (remainingBudgetMs() <= 0) return res.json(budgetExceededPayload('before repair'));
                const repaired = await aiProvider.runWithProviderFallback(providers, async (provider) => {
                    return repairEngineEffectCode({ prompt, badCode: generatedCode, error: scanErr, apiKey: provider.apiKey, baseUrl: provider.baseUrl, model: provider.model, timeoutMs: Math.max(1000, Math.min(45000, remainingBudgetMs() - 1500)) });
                });
                const repairedFixed = codeAutofix.autoFixEngineEffectCode(repaired);
                scanErr = codeValidator.validateEngineEffectCode(repairedFixed);
                if (scanErr) {
                    if (minimalFallbackEnabled) return res.json(skeletonRouter.buildMinimalFallbackPayload({ reason: `AI 输出不符合 EngineEffect 合约：${scanErr}`, prompt }));
                    return res.status(502).json({ error: `AI 输出不符合 EngineEffect 合约：${scanErr}` });
                }
                return res.json({ code: repairedFixed });
            }
            res.json({ code: generatedCode });
        } catch (e) {
            console.error('Two-step generation failed:', e);
            if (minimalFallbackEnabled) return res.json(skeletonRouter.buildMinimalFallbackPayload({ reason: e && e.message ? e.message : 'Internal Server Error', prompt }));
            res.status(500).json({ error: e && e.message ? e.message : 'Internal Server Error' });
        }
    });
};
```

- [ ] **Step 3: 创建 routes/demos.js**

```js
module.exports = function(app, services) {
    const { demoStore } = services;

    app.get('/api/demos', (req, res) => {
        try { res.json(demoStore.readDemos()); }
        catch (err) { console.error('Error reading demos:', err); res.status(500).json({ error: 'Failed to read data' }); }
    });

    app.post('/api/demos', (req, res) => {
        try { demoStore.writeDemos(req.body); res.json({ success: true }); }
        catch (err) { console.error('Error writing demos:', err); res.status(500).json({ error: 'Failed to save data' }); }
    });
};
```

- [ ] **Step 4: 创建 routes/import-script-scene.js**

```js
const fs = require('fs');
const path = require('path');
const config = require('../config');

module.exports = function(app, services) {
    const { codeTransforms, demoStore } = services;

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
            if (!codeTransforms.isPathAllowed(sourcePath)) return Promise.reject(new Error('sourcePath 不合法或不在允许目录内'));
            return fs.promises.readFile(path.resolve(sourcePath), 'utf8');
        };

        Promise.all([
            loadText(),
            fs.promises.readFile(path.join(config.ROOT_DIR, 'my-motion-portfolio/public/js/templates/scriptScene.js.txt'), 'utf8'),
            Promise.resolve(JSON.stringify(demoStore.readDemos()))
        ]).then(([scriptText, exportTemplateText, dataText]) => {
            const { mainBlockText, ppBlockText } = codeTransforms.extractScriptSceneBlock(scriptText);
            const previewBlockText = [ppBlockText, mainBlockText].filter(Boolean).join('\n\n').trim();
            const exportBlockText = (mainBlockText && mainBlockText.trim()) ? mainBlockText.trim() : previewBlockText;
            const exportText = codeTransforms.toExportTemplate(exportTemplateText, exportBlockText);
            const exportTextLiteral = JSON.stringify(exportText);

            const { id: newId, num: maxNum } = demoStore.getNextDemoId();
            const fileName = `demo${maxNum}.html`;

            const threePath = '../js/libs/three/three.module.js';
            const threeAddonsPath = '../js/libs/three/addons/';
            const html = codeTransforms.buildScriptSceneDemoHtml({ title, threePath, threeAddonsPath, blockText: previewBlockText, exportTextLiteral });

            const newDemo = { id: newId, title, keywords, enTitle, tech, url: `my-motion-portfolio/public/demos/${fileName}`, color: 'text-gray-400', isOriginal: true, icon };

            demoStore.createDemoFile(fileName, html);
            const list = demoStore.readDemos();
            list.unshift(newDemo);
            demoStore.writeDemos(list);
            res.json({ success: true, demo: newDemo });
        }).catch(err => {
            res.status(400).json({ error: err && err.message ? err.message : String(err) });
        });
    });
};
```

- [ ] **Step 5: 创建 routes/save-preview.js, create-demo.js, preview.js**

这三个路由较短，直接从 server.js 对应行搬入 handler 逻辑，改为 service 调用。

`save-preview.js`:
```js
const fs = require('fs');
const config = require('../config');

module.exports = function(app, services) {
    const { demoStore } = services;

    app.post('/api/save-preview-as-demo', (req, res) => {
        const { id, title, enTitle, tech, keywords, icon } = req.body;
        if (!id) return res.status(400).json({ error: 'Missing preview ID' });

        const sourceContent = demoStore.readTempPreview(id);
        if (!sourceContent) return res.status(404).json({ error: 'Preview code not found' });

        const list = demoStore.readDemos();
        const { id: newId, num: maxNum } = demoStore.getNextDemoId();
        const fileName = `demo${maxNum}.html`;

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
                canvas.style.width = '100%'; canvas.style.height = '100%'; canvas.style.display = 'block';
                container.appendChild(canvas);
                const getSize = () => ({ width: window.innerWidth, height: window.innerHeight, dpr: Math.min(2, window.devicePixelRatio || 1) });
                effect.onStart({ container, canvas, gl: null, size: getSize() });
                window.addEventListener('resize', () => { const size = getSize(); canvas.width = size.width * size.dpr; canvas.height = size.height * size.dpr; if (effect.onResize) effect.onResize(size); });
                let lastTime = performance.now();
                const frame = (now) => { const time = now / 1000; const deltaTime = Math.max(0, (now - lastTime) / 1000); lastTime = now; if (effect.onUpdate) effect.onUpdate({ time, deltaTime, size: getSize() }); requestAnimationFrame(frame); };
                requestAnimationFrame(frame);
                window.addEventListener('message', (e) => { if(e.data.type === 'HANDSHAKE') { const config = effect.getUIConfig ? effect.getUIConfig() : []; window.parent.postMessage({ type: 'UI_CONFIG', config }, '*'); } else if (e.data.type === 'UPDATE_PARAM' && effect.setParam) { effect.setParam(e.data.key, e.data.value); } });
            } catch (e) { console.error(e); }
        }
        init();
    </script>
</body>
</html>`;

        demoStore.createDemoFile(fileName, html);
        const newDemo = { id: newId, title: title || 'AI Generated Effect', keywords: keywords || 'ai, generated', enTitle: enTitle || 'AI Generated Effect', tech: tech || 'Three.js / AI', url: `my-motion-portfolio/public/demos/${fileName}`, color: 'text-gray-400', isOriginal: true, icon: icon || '<circle cx="100" cy="100" r="50" stroke="currentColor" fill="none" />' };
        list.unshift(newDemo);
        demoStore.writeDemos(list);
        res.json({ success: true, demo: newDemo });
    });
};
```

`create-demo.js`:
```js
module.exports = function(app, services) {
    const { demoStore } = services;

    app.post('/api/create-demo', (req, res) => {
        const { title, enTitle, tech, keywords, icon } = req.body;
        const { id: newId, num: maxNum } = demoStore.getNextDemoId();
        const fileName = `demo${maxNum}.html`;

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
        window.addEventListener('message', (e) => { if(e.data.type === 'HANDSHAKE') { window.parent.postMessage({ type: 'UI_CONFIG', config: [] }, '*'); } });
    </script>
</body>
</html>`;

        demoStore.createDemoFile(fileName, template);
        const newDemo = { id: newId, title, keywords: keywords || '', enTitle, tech, url: `my-motion-portfolio/public/demos/${fileName}`, color: 'text-gray-400', isOriginal: true, icon: icon || '<circle cx="100" cy="100" r="50" stroke="currentColor" fill="none" />' };
        const list = demoStore.readDemos();
        list.unshift(newDemo);
        demoStore.writeDemos(list);
        res.json({ success: true, demo: newDemo });
    });
};
```

`preview.js`:
```js
const fs = require('fs');
const config = require('../config');

module.exports = function(app, services) {
    app.get('/preview/:id', (req, res) => {
        const id = req.params.id;
        const filePath = require('path').join(config.TEMP_PREVIEWS_DIR, `${id}.js`);
        if (!fs.existsSync(filePath)) return res.status(404).send('Preview not found or expired.');
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
        function showError(e) { const errDiv = document.getElementById('error-overlay'); errDiv.textContent = e.message || String(e); errDiv.style.display = 'block'; console.error(e); }
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
                canvas.style.width = '100%'; canvas.style.height = '100%'; canvas.style.display = 'block';
                container.appendChild(canvas);
                const getSize = () => ({ width: window.innerWidth, height: window.innerHeight, dpr: Math.min(2, window.devicePixelRatio || 1) });
                effect.onStart({ container, canvas, gl: null, size: getSize() });
                window.addEventListener('resize', () => { const size = getSize(); canvas.width = size.width * size.dpr; canvas.height = size.height * size.dpr; if (effect.onResize) effect.onResize(size); });
                let lastTime = performance.now();
                const frame = (now) => { const time = now / 1000; const deltaTime = Math.max(0, (now - lastTime) / 1000); lastTime = now; if (effect.onUpdate) effect.onUpdate({ time, deltaTime, size: getSize() }); requestAnimationFrame(frame); };
                requestAnimationFrame(frame);
            } catch (e) { showError(e); }
        }
        init();
    </script>
</body>
</html>`;
        res.send(html);
    });
};
```

- [ ] **Step 6: Commit**

```bash
mkdir -p server/routes
git add server/routes/
git commit -m "feat(server): create all 7 route files with handler logic extracted from server.js"
```

---

## Task 16: 后端拆分 — 创建 server/index.js 入口 + 更新 package.json

**Files:**
- Create: `server/index.js`
- Modify: `package.json`

- [ ] **Step 1: 创建 server/index.js**

```js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const config = require('./config');
require('dotenv').config();

const fs = require('fs');
if (!fs.existsSync(config.TEMP_PREVIEWS_DIR)) {
    fs.mkdirSync(config.TEMP_PREVIEWS_DIR, { recursive: true });
}

const aiProvider = require('./services/ai-provider');
const aiGenerator = require('./services/ai-generator');
const codeValidator = require('./services/code-validator');
const codeAutofix = require('./services/code-autofix');
const codeTransforms = require('./services/code-transforms');
const skeletonRouter = require('./services/skeleton-router');
const demoStore = require('./services/demo-store');

const services = {
    aiProvider, aiGenerator, codeValidator, codeAutofix,
    codeTransforms, skeletonRouter, demoStore, config
};

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.get('/favicon.ico', (req, res) => res.status(204).end());
app.use(express.static(config.ROOT_DIR));

require('./routes/generate')(app, services);
require('./routes/generate-v2')(app, services);
require('./routes/demos')(app, services);
require('./routes/import-script-scene')(app, services);
require('./routes/save-preview')(app, services);
require('./routes/create-demo')(app, services);
require('./routes/preview')(app, services);

app.listen(config.PORT, () => {
    console.log(`Creator Server running at http://localhost:${config.PORT}`);
});
```

- [ ] **Step 2: 更新 package.json 的 start 脚本**

将 `"start": "node server.js"` 改为 `"start": "node server/index.js"`。

- [ ] **Step 3: 将原 server.js 改为兼容入口**

将 `server.js` 内容替换为：

```js
module.exports = require('./server/index.js');
```

这样如果有其他脚本 `require('./server.js')` 不会断掉。

- [ ] **Step 4: 启动服务器验证**

Run: `node server/index.js`

Expected: `Creator Server running at http://localhost:3000`

- [ ] **Step 5: 运行现有测试**

Run: `cd /Users/bytedance/Downloads/cupcut-website && find tools/tests -name "*.test.cjs" -exec node {} \;`

Expected: 所有测试通过。

- [ ] **Step 6: Commit**

```bash
git add server/index.js package.json server.js
git commit -m "feat(server): create server/index.js entry point, update package.json, convert server.js to compat re-export"
```

---

## Task 17: 端到端验证

**Files:** 无新文件

- [ ] **Step 1: 启动后端服务器**

Run: `node server/index.js`

Expected: 服务器正常启动，无报错。

- [ ] **Step 2: 测试 /api/demos 接口**

Run: `curl http://localhost:3000/api/demos`

Expected: 返回 demos JSON 数据。

- [ ] **Step 3: 测试 /preview/:id 接口**

Run: `curl http://localhost:3000/preview/nonexistent`

Expected: 返回 404 "Preview not found or expired."

- [ ] **Step 4: 运行全部测试**

Run: `find tools/tests -name "*.test.cjs" -exec node {} \;`

Expected: 所有测试通过。

- [ ] **Step 5: 前端 VFX 引擎语法检查**

在浏览器中打开一个使用 UnifiedRenderer 的 demo 页面，检查控制台无 import 错误。

- [ ] **Step 6: 最终 Commit**

```bash
git add -A
git commit -m "chore: Phase 2 complete — VFX engine upgrade + server.js decomposition"
```
