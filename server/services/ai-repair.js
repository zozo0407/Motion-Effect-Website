const fs = require('fs');
const path = require('path');
const config = require('../config');
const { fetchWithRetry } = require('./ai-provider');
const { stripMarkdownCodeFence, stripModelNonCodePrologue, normalizeThreeNamespaceImport } = require('./code-autofix');

async function repairEngineEffectCode({ prompt, badCode, error, apiKey, baseUrl, model, timeoutMs }) {
    const read = (f) => {
        try {
            return fs.readFileSync(path.join(config.PROMPTS_DIR, f), 'utf8');
        } catch (_) {
            return '';
        }
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

module.exports = { repairEngineEffectCode };
