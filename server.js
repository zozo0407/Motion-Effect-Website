const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('node:child_process');
const cors = require('cors');
const {
    buildBlueprintMessages,
    buildCodeMessages,
    defaultBlueprint,
    parseBlueprintResponse
} = require('./tools/creator/effect-blueprint.cjs');
const { getAIProvidersFromEnv, normalizeAIBaseUrl } = require('./tools/creator/ai-providers.cjs');
const { shouldUseBlueprintStage } = require('./tools/creator/generation-config.cjs');
require('dotenv').config();

const { routePromptToSkeleton } = require('./tools/creator/skeleton-router.cjs');
const { buildGlowSphereEffectCode } = require('./tools/creator/skeletons/glow-sphere.cjs');
const { buildParticlesEffectCode } = require('./tools/creator/skeletons/particles.cjs');
const { buildWireframeGeoEffectCode } = require('./tools/creator/skeletons/wireframe-geo.cjs');
const { buildDigitalRainEffectCode } = require('./tools/creator/skeletons/digital-rain.cjs');
const { buildGlassGeoEffectCode } = require('./tools/creator/skeletons/glass-geo.cjs');
const { buildLiquidMetalEffectCode } = require('./tools/creator/skeletons/liquid-metal.cjs');
const { buildEnergyCoreEffectCode } = require('./tools/creator/skeletons/energy-core.cjs');
const { ensureOnUpdateMethod, fixUnsafeCtxHelperUsage } = require('./tools/creator/engine-autofix.cjs');
const { buildMinimalFallbackPayload } = require('./tools/creator/minimal-fallback.cjs');
const { wrapAsEngineEffect, parseAIOutput } = require('./tools/creator/v2-wrapped-parts.cjs');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'my-motion-portfolio/public/data/demos.json');
const DEMO_DIR = path.join(__dirname, 'my-motion-portfolio/public/demos');

app.use(cors());
app.use(bodyParser.json());
app.get('/favicon.ico', (req, res) => res.status(204).end());
app.use(express.static(__dirname)); // Serve root directly

async function generateEffectV2FromPrompt(prompt, apiKey, baseUrl, model, options = {}) {
    const outputMode = String(options.outputMode || '').trim();
    const read = (f) => {
        try {
            return fs.readFileSync(path.join(PROMPTS_DIR, f), 'utf8');
        } catch (_) {
            return '';
        }
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
            '',
            '【animate】每帧调用一次。可直接使用变量：time / deltaTime，并通过 this.xxx 访问 setup 对象。',
            '不要调用 renderer.render()（外层会自动 render）。',
            '',
            '【输出格式（严格）】只输出两段纯 JavaScript，用 ---SPLIT--- 分隔；不要 markdown/code fence；不要 import/export/class；不要解释文字：',
            '// === setup ===',
            '(setup code)',
            '---SPLIT---',
            '// === animate ===',
            '(animate code)',
            '',
            '【禁止】document./window./requestAnimationFrame/appendChild/getElementById',
            '【禁止】声明 const scene / const camera / const renderer',
            '【禁止】THREE.*Helper（SpotLightHelper/PointLightHelper 等）',
            '【禁止】THREE.RoomEnvironment / RoomEnvironment（属于 three/examples 扩展，核心 three 中不存在，会导致运行时报错 not a constructor）',
            '【禁止】async/await',
            '',
            '【质量】深色背景、配色低饱和、有层次、代码简洁（setup+animate 合计 <= 120 行）。'
        ].join('\n');

        const partsRes = await runV2Stage({
            stage: 'parts',
            url,
            apiKey,
            model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt }
            ],
            temperature: 0.7,
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

        const { setup, animate } = parseAIOutput(content);
        if (!setup || !String(setup).trim()) throw new Error('AI 未输出有效的 setup 代码');

        // Wrap into a full EngineEffect module without template-literal injection.
        return wrapAsEngineEffect(setup, animate);
    }

    if (shouldUseBlueprintStage(process.env)) {
        const blueprintMessages = buildBlueprintMessages(prompt);
        try {
            const blueprintRes = await runV2Stage({
                stage: 'blueprint',
                url,
                apiKey,
                model,
                messages: [
                    { role: 'system', content: blueprintMessages.system },
                    { role: 'user', content: blueprintMessages.user }
                ],
                temperature: 0.3,
                maxTokens: 1024,
                timeoutMs: blueprintTimeoutMs
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
        stage: 'code',
        url,
        apiKey,
        model,
        messages: [
            { role: 'system', content: codeMessages.system },
            { role: 'user', content: codeMessages.user }
        ],
        temperature: 0.5,
        maxTokens: 8192,
        timeoutMs: codeTimeoutMs
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

async function repairEngineEffectCode({ prompt, badCode, error, apiKey, baseUrl, model, timeoutMs }) {
    const read = (f) => {
        try {
            return fs.readFileSync(path.join(PROMPTS_DIR, f), 'utf8');
        } catch (_) {
            return '';
        }
    };

    const contract = read('engine-contract.md');
    const system = [
        '你是 Three.js/WebGL 专家。你只输出“可直接执行的 ES Module 纯代码”，不要任何解释，不要 markdown code fence。',
        '必须满足 EngineEffect 合约：第一行 import * as THREE from \'three\'; 并 export default class EngineEffect，包含 constructor/onStart/onUpdate/onResize/onDestroy/getUIConfig/setParam。',
        '不得省略任何必需方法，尤其是 onUpdate(ctx)。如果你发现缺失，请优先补齐方法签名与最小可见渲染逻辑（renderer.render(scene, camera)）。',
        '禁止使用 Three.js 的 *Helper 调试对象（例如 SpotLightHelper、DirectionalLightHelper、PointLightHelper、CameraHelper、AxesHelper、GridHelper 等）。',
        '禁止使用 RoomEnvironment（THREE.RoomEnvironment 或 RoomEnvironment）。它来自 three/examples 扩展，核心 three 模块中不存在，容易导致运行时崩溃。',
        '如需容器只能使用 ctx.container；渲染必须使用 ctx.canvas/ctx.gl（如存在），禁止使用 ctx.renderer。',
        'ctx 只能在生命周期方法内直接使用；如果辅助方法需要上下文，请在 onStart(ctx) 开头保存 this.ctx = ctx，并在其它方法中使用 this.ctx，或显式把 ctx 作为参数传入。',
        '严禁 requestAnimationFrame；渲染只能在 onUpdate(ctx) 内由外部驱动。',
        contract ? `合约参考：\n${contract}` : ''
    ].filter(Boolean).join('\n\n');

    const user = [
        `用户需求：${prompt}`,
        `上一次输出的校验错误：${error}`,
        '上一次输出（需要你修复为合规版本）：',
        badCode
    ].join('\n\n');

    const controller = new AbortController();
    const budgetMs = Number.isFinite(timeoutMs) ? timeoutMs : 180000;
    const timeoutId = setTimeout(() => controller.abort(), budgetMs);

    try {
        const url = `${baseUrl}/chat/completions`;
        const res = await fetchWithRetry(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({
                model,
                stream: false,
                messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
                temperature: 0,
                max_tokens: 8192
            }),
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

function getAIConfig() {
    const providers = getAIProvidersFromEnv(process.env);
    if (providers.length > 0) {
        const first = providers[0];
        return {
            apiKey: first.apiKey,
            baseUrl: first.baseUrl,
            model: first.model
        };
    }
    const apiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY;
    const baseUrlRaw = process.env.AI_BASE_URL || process.env.OPENAI_BASE_URL || process.env.OPENAI_API_BASE || 'https://api.openai.com/v1';
    const model = process.env.AI_MODEL || process.env.OPENAI_MODEL || 'gpt-4o';
    return {
        apiKey,
        baseUrl: normalizeAIBaseUrl(baseUrlRaw),
        model
    };
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

const PROMPTS_DIR = path.join(__dirname, 'prompts');
const TEMP_PREVIEWS_DIR = path.join(__dirname, '.temp_previews');

// Ensure temp directory exists
if (!fs.existsSync(TEMP_PREVIEWS_DIR)) {
    fs.mkdirSync(TEMP_PREVIEWS_DIR, { recursive: true });
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
        let response;
        let data = null;
        try {
            response = await fetchWithRetry(`${baseUrl}/chat/completions`, {
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
            }, { retries: 1, baseDelayMs: 200 });
            data = await response.json();
        } finally {
            clearTimeout(timeoutId);
        }
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

function stripModelNonCodePrologue(text) {
    let s = typeof text === 'string' ? text : '';
    s = s.replace(/^\s*<think>[\s\S]*?<\/think>\s*/i, '');
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
        const { buildEnergyCoreEffectCode } = require('./tools/creator/skeletons/energy-core.cjs');
        const mockCode = buildEnergyCoreEffectCode({ color: '#00f2ff', intensity: 1.2, speed: 1.0 });
        return res.json({ code: mockCode });
    }

    try {
        if (req && req.query && String(req.query.v || '') === '2') {
            let generatedCode = await generateEffectV2FromPrompt(prompt, apiKey, baseUrl, model);
            generatedCode = autoFixEngineEffectCode(generatedCode);
            let scanErr = validateEngineEffectCode(generatedCode);
            if (scanErr) {
                console.log(`[v2][generate] Validation failed: ${scanErr}, attempting repair...`);
                const repaired = await repairEngineEffectCode({ prompt, badCode: generatedCode, error: scanErr, apiKey, baseUrl, model });
                const repairedFixed = autoFixEngineEffectCode(repaired);
                scanErr = validateEngineEffectCode(repairedFixed);
                if (scanErr) return res.status(502).json({ error: `AI 输出不符合 EngineEffect 合约：${scanErr}` });
                return res.json({ code: repairedFixed });
            }
            return res.json({ code: generatedCode });
        }
        const style = await classifyStyle(prompt, apiKey, baseUrl, model);
        const systemPrompt = assemblePrompt(style, prompt);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 180000);
        let response;
        let raw = '';
        try {
            response = await fetchWithRetry(`${baseUrl}/chat/completions`, {
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
                    temperature: 0.7,
                    max_tokens: 8192
                }),
                signal: controller.signal
            }, { retries: 2, baseDelayMs: 400 });

            raw = await response.text();
        } finally {
            clearTimeout(timeoutId);
        }
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

        let generatedCode = stripModelNonCodePrologue(stripMarkdownCodeFence(content)).trim();
        generatedCode = normalizeThreeNamespaceImport(generatedCode);

        const scanErr = validateEngineEffectCode(generatedCode);
        if (scanErr) return res.status(502).json({ error: `AI 输出不符合 EngineEffect 合约：${scanErr}` });
        res.json({ code: generatedCode });

    } catch (error) {
        const msg = String((error && error.message) || '');
        const isFetchFailed = error && error.name === 'TypeError' && /fetch failed/i.test(msg);
        if (isFetchFailed) {
            console.error('Generate effect failed: upstream fetch failed', { baseUrl, model });
            res.status(502).json({ error: '上游 AI 网络请求失败（fetch failed），请稍后重试' });
            return;
        }
        const genFailed = msg.match(/^Generation failed:\s*(\d{3})\s*([\s\S]*)$/);
        if (genFailed) {
            const status = parseInt(genFailed[1], 10);
            const bodyText = String(genFailed[2] || '').trim();
            let detail = '';
            try {
                const parsed = JSON.parse(bodyText);
                detail =
                    (parsed && parsed.error && typeof parsed.error.message === 'string' && parsed.error.message) ||
                    (parsed && typeof parsed.error === 'string' && parsed.error) ||
                    '';
            } catch (_) {
                detail = '';
            }
            const safeStatus = Number.isFinite(status) && status >= 400 && status <= 599 ? status : 502;
            const message = detail || (bodyText ? bodyText : `Upstream AI request failed (${safeStatus})`);
            res.status(safeStatus).json({ error: message });
            return;
        }
        console.error('Generate effect failed:', msg || 'Unknown error');
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

function checkESMModuleSyntax(code) {
    const src = String(code || '');
    // Quick skip for obviously empty payloads
    if (!src.trim()) return '代码语法错误：Code is empty';

    // Use Node's parser for a reliable syntax check (supports `import` in .mjs).
    const tmpName = `syntax-${Date.now()}-${Math.random().toString(16).slice(2)}.mjs`;
    const tmpPath = path.join(TEMP_PREVIEWS_DIR, tmpName);
    try {
        fs.writeFileSync(tmpPath, src, 'utf8');
        const r = spawnSync(process.execPath, ['--check', tmpPath], {
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'pipe']
        });
        if (r.status === 0) return null;
        const out = String((r.stderr && r.stderr.trim()) || (r.stdout && r.stdout.trim()) || '').trim();
        // Extract the most useful line, typically: "SyntaxError: ..."
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
    let m;
    while ((m = methodRe.exec(src))) {
        const name = m[1];
        const params = m[2] || '';
        const body = m[3] || '';
        if (lifecycle.has(name)) continue;
        if (/\bctx\b/.test(params)) continue;
        if (/\bctx\./.test(body)) {
            return name;
        }
    }
    return null;
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

    // If it doesn't look like EngineEffect at all, let the validator catch it.
    if (!/export\s+default\s+class\s+EngineEffect/.test(code)) return code;

    // Minimum skeleton repair
    if (!/\bonStart\s*\(/.test(code)) {
        code = code.replace(/class\s+EngineEffect\s*(?:extends\s+[^{]+)?\s*\{/, "class EngineEffect {\n    onStart(ctx) {\n        const width = Math.max(1, Math.floor((ctx && (ctx.width || (ctx.size && ctx.size.width))) || 800));\n        const height = Math.max(1, Math.floor((ctx && (ctx.height || (ctx.size && ctx.size.height))) || 600));\n        const dpr = Math.max(1, Math.min(2, (ctx && (ctx.dpr || (ctx.size && ctx.size.dpr))) || 1));\n        this.scene = new THREE.Scene();\n        this.camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 100);\n        this.camera.position.set(0, 0, 6);\n        this.renderer = new THREE.WebGLRenderer({ canvas: ctx && ctx.canvas ? ctx.canvas : undefined, antialias: true });\n        this.renderer.setPixelRatio(dpr);\n        this.renderer.setSize(width, height, false);\n    }");
    }
    if (!/\bonUpdate\s*\(/.test(code)) {
        // The previous regex-based insertion could fail when onStart contains nested braces.
        // Use a more robust insertion strategy.
        code = ensureOnUpdateMethod(code);
    }
    if (!/\bonResize\s*\(/.test(code)) {
        code = code.replace(/\n\s*onUpdate\s*\([^)]*\)\s*\{[^}]*\}/, "$&\n    onResize(ctx) {\n        // auto-injected onResize\n    }");
    }
    if (!/\bonDestroy\s*\(/.test(code)) {
        code = code.replace(/\n\s*onResize\s*\([^)]*\)\s*\{[^}]*\}/, "$&\n    onDestroy(ctx) {\n        // auto-injected onDestroy\n    }");
    }
    if (!/\bgetUIConfig\s*\(/.test(code)) {
        code = code.replace(/\n\s*onDestroy\s*\([^)]*\)\s*\{[^}]*\}/, "$&\n    getUIConfig() {\n        return [];\n    }");
    }

    if (/setParam\s*\(/.test(code)) return code;
    const insertion = `

    setParam(key, value) {
        this.params = this.params || {};
        this.params[key] = value;

        if (this.material && this.material.uniforms) {
            const name = 'u' + String(key || '').charAt(0).toUpperCase() + String(key || '').slice(1);
            const u = this.material.uniforms[name];
            if (u && u.value && typeof u.value.set === 'function' && typeof value === 'string') {
                u.value.set(value);
            } else if (u && Object.prototype.hasOwnProperty.call(u, 'value')) {
                u.value = value;
            }
        }

        if (this.material && this.material.color && typeof this.material.color.set === 'function' && typeof value === 'string') {
            this.material.color.set(value);
        }
    }
`;
    if (/\bonStart\s*\(/.test(code)) {
        return code.replace(/\n(\s*)onStart\s*\(/, `${insertion}\n$1onStart(`);
    }
    return code.replace(/\n(\s*)onUpdate\s*\(/, `${insertion}\n$1onUpdate(`);
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
    // Stability: disallow Three.js debug helpers that often cause runtime crashes when misused
    // (e.g. SpotLightHelper with undefined light/target).
    if (/\bTHREE\.\w+Helper\b/.test(String(code))) {
        return '检测到 Three.js Helper（如 SpotLightHelper / AxesHelper / GridHelper 等）。为避免运行时崩溃与性能问题，禁止使用 Helper 调试对象。';
    }
    // RoomEnvironment is part of three/examples, not core "three". In our sandbox it will be undefined and crash.
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
    return null;
}

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

function isSkeletonRouterEnabled(env = process.env) {
    const raw = typeof env.AI_ENABLE_SKELETON_ROUTER === 'string' ? env.AI_ENABLE_SKELETON_ROUTER.trim().toLowerCase() : '';
    return raw === '1' || raw === 'true' || raw === 'yes' || raw === 'on';
}

function isLegacySkeletonsDisabled(env = process.env) {
    const raw = typeof env.AI_DISABLE_LEGACY_SKELETONS === 'string' ? env.AI_DISABLE_LEGACY_SKELETONS.trim().toLowerCase() : '';
    return raw === '1' || raw === 'true' || raw === 'yes' || raw === 'on';
}

function isMinimalFallbackEnabled(env = process.env) {
    // Default ON. Set AI_ENABLE_MINIMAL_FALLBACK=0/false/off to disable.
    const raw = typeof env.AI_ENABLE_MINIMAL_FALLBACK === 'string' ? env.AI_ENABLE_MINIMAL_FALLBACK.trim().toLowerCase() : '';
    if (!raw) return true;
    return !(raw === '0' || raw === 'false' || raw === 'no' || raw === 'off');
}

function getV2TotalBudgetMs(env = process.env) {
    const raw = typeof env.AI_V2_TOTAL_BUDGET_MS === 'string' ? env.AI_V2_TOTAL_BUDGET_MS.trim() : '';
    const v = raw ? Number(raw) : 90000;
    // Keep a sane floor/ceiling so misconfig doesn't break UX.
    if (!Number.isFinite(v)) return 90000;
    return Math.max(15000, Math.min(180000, Math.floor(v)));
}

app.post('/api/generate-effect-v2', async (req, res) => {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const prompt = typeof body.prompt === 'string' ? body.prompt : '';
    if (!prompt.trim()) return res.status(400).json({ error: 'Prompt is required' });

    const skeletonEnabled = isSkeletonRouterEnabled(process.env);
    const legacySkeletonsDisabled = isLegacySkeletonsDisabled(process.env);
    const minimalFallbackEnabled = isMinimalFallbackEnabled(process.env);
    const totalBudgetMs = getV2TotalBudgetMs(process.env);
    const t0 = Date.now();
    const remainingBudgetMs = () => totalBudgetMs - (Date.now() - t0);

    const budgetExceededPayload = (reason) => {
        console.log(`[v2][budget] budget exceeded: ${reason}`);
        return buildMinimalFallbackPayload({ reason: `budget exceeded: ${reason}`, prompt });
    };

    // Demo stable mode: the public-facing "always preview" path.
    // Frontend "AI 创作" currently calls /api/generate-effect-v2, so the demo
    // skeleton fallback must exist here (not only in /api/generate-effect).
    if (skeletonEnabled && String(process.env.AI_DEMO_MODE || '') === '1') {
        if (legacySkeletonsDisabled) {
            const code = buildEnergyCoreEffectCode({ color: '#00f2ff', intensity: 1.2, speed: 1.0 });
            return res.json({ code, degraded: true, degradedReason: 'AI_DISABLE_LEGACY_SKELETONS=1' });
        }
        try {
            const routed = routePromptToSkeleton(prompt);
            const code = buildCodeFromSkeletonRoute(routed) || buildEnergyCoreEffectCode({ color: '#00f2ff', intensity: 1.2, speed: 1.0 });
            return res.json({ code });
        } catch (e) {
            const code = buildEnergyCoreEffectCode({ color: '#00f2ff', intensity: 1.2, speed: 1.0 });
            return res.json({ code });
        }
    }

    if (skeletonEnabled) {
        if (legacySkeletonsDisabled) {
            const code = buildEnergyCoreEffectCode({ color: '#00f2ff', intensity: 1.2, speed: 1.0 });
            return res.json({ code, degraded: true, degradedReason: 'AI_DISABLE_LEGACY_SKELETONS=1' });
        }
        const skeletonRoute = routePromptToSkeleton(prompt);
        if (skeletonRoute && skeletonRoute.matched) {
            const code = buildCodeFromSkeletonRoute(skeletonRoute);
            if (code) return res.json({ code });
        }
    }

    const providers = getAIProvidersFromEnv(process.env);
    if (!providers.length) return res.status(400).json({ error: 'Missing AI_PRIMARY_API_KEY' });
    try {
        if (remainingBudgetMs() <= 0) {
            return res.json(budgetExceededPayload('before generation'));
        }
        let generatedCode = await runWithProviderFallback(providers, async (provider) => {
            return generateEffectV2FromPrompt(prompt, provider.apiKey, provider.baseUrl, provider.model, {
                // Only /api/generate-effect-v2 enables wrapped_parts. Keep ?v=2 behavior unchanged.
                outputMode: process.env.AI_V2_OUTPUT_MODE,
                codeTimeoutMs: Math.max(1000, Math.min(90000, remainingBudgetMs() - 1500))
            });
        });
        generatedCode = autoFixEngineEffectCode(generatedCode);
        let scanErr = validateEngineEffectCode(generatedCode);
        if (scanErr) {
            console.log(`[v2][generate-effect-v2] Validation failed: ${scanErr}, attempting repair...`);
            if (remainingBudgetMs() <= 0) {
                return res.json(budgetExceededPayload('before repair'));
            }
            const repaired = await runWithProviderFallback(providers, async (provider) => {
                return repairEngineEffectCode({
                    prompt,
                    badCode: generatedCode,
                    error: scanErr,
                    apiKey: provider.apiKey,
                    baseUrl: provider.baseUrl,
                    model: provider.model,
                    timeoutMs: Math.max(1000, Math.min(45000, remainingBudgetMs() - 1500))
                });
            });
            const repairedFixed = autoFixEngineEffectCode(repaired);
            scanErr = validateEngineEffectCode(repairedFixed);
            if (scanErr) {
                if (minimalFallbackEnabled) {
                    return res.json(buildMinimalFallbackPayload({
                        reason: `AI 输出不符合 EngineEffect 合约：${scanErr}`,
                        prompt
                    }));
                }
                return res.status(502).json({ error: `AI 输出不符合 EngineEffect 合约：${scanErr}` });
            }
            return res.json({ code: repairedFixed });
        }
        res.json({ code: generatedCode });
    } catch (e) {
        console.error('Two-step generation failed:', e);
        if (minimalFallbackEnabled) {
            return res.json(buildMinimalFallbackPayload({
                reason: e && e.message ? e.message : 'Internal Server Error',
                prompt
            }));
        }
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
