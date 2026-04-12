const fs = require('fs');
const path = require('path');
const config = require('../config');
const { fetchWithRetry } = require('./ai-provider');
const { stripMarkdownCodeFence, stripModelNonCodePrologue, normalizeThreeNamespaceImport } = require('./code-autofix');

async function modifyEffectCode({ prompt, existingCode, modification, apiKey, baseUrl, model, timeoutMs }) {
    const read = (f) => {
        try {
            return fs.readFileSync(path.join(config.PROMPTS_DIR, f), 'utf8');
        } catch (_) {
            return '';
        }
    };

    const contract = read('engine-contract.md');
    const system = [
        '你是 Three.js/WebGL 专家。你的任务是对现有代码做**最小化修改**以满足用户的新需求。',
        '',
        '【核心原则】',
        '- 只修改与用户需求直接相关的代码，不要重写无关部分',
        '- 保留现有的场景结构、材质、灯光、动画逻辑，除非用户明确要求改变',
        '- 如果用户说"加一个球"，就只在场景中添加一个球，不要改变已有的物体',
        '- 如果用户说"换个颜色"，就只改颜色相关的代码，不要改几何体或动画',
        '- 保持现有的 getUIConfig/setParam 结构不变，除非用户要求修改参数',
        '',
        '【输出要求】',
        '- 只输出完整可执行的 ES Module 纯代码，不要任何解释，不要 markdown code fence',
        '- 必须满足 EngineEffect 合约：import * as THREE from \'three\'; 并 export default class EngineEffect',
        '- 包含 constructor/onStart/onUpdate/onResize/onDestroy/getUIConfig/setParam',
        '- 严禁 requestAnimationFrame；渲染只能在 onUpdate(ctx) 内由外部驱动',
        '- 禁止使用 Three.js *Helper 调试对象和 RoomEnvironment',
        '- 如需容器只能使用 ctx.container；渲染必须使用 ctx.canvas/ctx.gl',
        '- ctx 只能在生命周期方法内直接使用；辅助方法通过 this.ctx 访问',
        contract ? `\n合约参考：\n${contract}` : ''
    ].filter(Boolean).join('\n');

    const user = [
        `原始需求：${prompt || '（无）'}`,
        `用户新的修改要求：${modification}`,
        '',
        '以下是当前正在运行的代码，请在此基础上做最小化修改：',
        existingCode
    ].join('\n\n');

    const controller = new AbortController();
    const budgetMs = Number.isFinite(timeoutMs) ? timeoutMs : 90000;
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
        }, { retries: 1, baseDelayMs: 400 });

        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`Modify failed: ${res.status} ${errText}`);
        }

        const data = await res.json();
        const msg = data && data.choices && data.choices[0] && data.choices[0].message;
        const content = (msg && (msg.content || msg.reasoning_content)) || '';
        let modified = stripModelNonCodePrologue(stripMarkdownCodeFence(content)).trim();
        modified = normalizeThreeNamespaceImport(modified);
        return modified;
    } finally {
        clearTimeout(timeoutId);
    }
}

module.exports = { modifyEffectCode };
