const fs = require('fs');
const path = require('path');
const config = require('../config');
const { runV2Stage, fetchWithRetry } = require('./ai-provider');
const { stripMarkdownCodeFence, stripModelNonCodePrologue, normalizeThreeNamespaceImport } = require('./code-autofix');
const {
    buildBlueprintMessages,
    buildCodeMessages,
    defaultBlueprint,
    parseBlueprintResponse
} = require('../../tools/creator/effect-blueprint.cjs');
const { shouldUseBlueprintStage } = require('../../tools/creator/generation-config.cjs');
const { wrapAsEngineEffect, parseAIOutput } = require('../../tools/creator/v2-wrapped-parts.cjs');
const { optimizePrompt } = require('./prompt-optimizer');

async function generateEffectV2FromPrompt(rawPrompt, apiKey, baseUrl, model, options = {}) {
    const { optimized: prompt, changes, complexityScore } = optimizePrompt(rawPrompt);
    if (changes.length > 0) {
        console.log(`[prompt-optimizer] complexity=${complexityScore} changes=${changes.length}`);
        changes.forEach((c, i) => {
            console.log(`  [${i + 1}] "${c.original}" → "${c.replacement}" (${c.reason})`);
        });
    } else {
        console.log(`[prompt-optimizer] complexity=${complexityScore} no changes needed`);
    }
    const outputMode = String(options.outputMode || '').trim();
    const read = (f) => {
        try {
            return fs.readFileSync(path.join(config.PROMPTS_DIR, f), 'utf8');
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
            stage: 'parts',
            url,
            apiKey,
            model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt }
            ],
            temperature: (() => {
                const raw = process.env.AI_WRAPPED_PARTS_TEMPERATURE;
                const n = typeof raw === 'string' && raw.trim() ? Number(raw) : 0.25;
                return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0.25;
            })(),
            // Keep output small and reduce slow generations; setup+animate is expected <= 120 lines.
            maxTokens: 2048,
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

        const isFormatFailure =
            !hasSplit ||
            !wantsUISection ||
            !setup ||
            !String(setup).trim() ||
            uiParseFailed;

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

            const reformatUser = [
                '请把下面内容重排为严格格式：',
                '---BEGIN---',
                content,
                '---END---',
            ].join('\n');

            // Reformat is cheap, but provider latency can exceed 20s occasionally. Give it a bit more headroom.
            const retryTimeout = Math.max(8000, Math.min(30000, Math.floor(codeTimeoutMs / 3)));
            const retryRes = await runV2Stage({
                stage: 'parts_reformat',
                url,
                apiKey,
                model,
                messages: [
                    { role: 'system', content: reformatSystem },
                    { role: 'user', content: reformatUser }
                ],
                temperature: 0.0,
                maxTokens: 2048,
                timeoutMs: retryTimeout
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
            return fs.readFileSync(path.join(config.PROMPTS_DIR, filename), 'utf8');
        } catch (e) {
            console.error(`Failed to read prompt file ${filename}:`, e);
            return '';
        }
    };

    const base = read('base-role.md');
    let styleText = read(`styles/${style}.md`);
    if (!styleText) styleText = read('styles/default.md');
    const contract = read('engine-contract.md');

    let exampleText = read(`styles/${style}-example.md`);
    if (!exampleText && style !== 'default') {
        exampleText = read('styles/default-example.md');
    }

    let fullPrompt = `${base}\n\n${styleText}\n\n${exampleText ? exampleText + '\n\n' : ''}${contract}`;
    return fullPrompt.split('{{USER_PROMPT}}').join(userPrompt);
}

module.exports = { generateEffectV2FromPrompt, classifyStyle, assemblePrompt };
