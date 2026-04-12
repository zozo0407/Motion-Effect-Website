const { fetchWithRetry } = require('./ai-provider');

async function analyzeIntent({ prompt, uiConfig, apiKey, baseUrl, model, timeoutMs }) {
    const paramList = Array.isArray(uiConfig) ? uiConfig : [];
    const paramDesc = paramList.map((p) => {
        const parts = [`bind: "${p.bind}"`, `name: "${p.name}"`, `type: "${p.type}"`];
        if (p.value !== undefined) parts.push(`currentValue: ${JSON.stringify(p.value)}`);
        if (p.min !== undefined) parts.push(`min: ${p.min}`);
        if (p.max !== undefined) parts.push(`max: ${p.max}`);
        if (p.step !== undefined) parts.push(`step: ${p.step}`);
        if (Array.isArray(p.options)) parts.push(`options: ${JSON.stringify(p.options)}`);
        return `{ ${parts.join(', ')} }`;
    }).join('\n');

    const system = [
        '你是一个意图分类器。根据用户的输入和当前可调参数列表，判断用户意图。',
        '',
        '有三种意图：',
        '1. UPDATE_PARAM — 用户只想调整现有参数的值（如改颜色、调速度、改大小等），不需要修改代码结构。',
        '2. REWRITE — 用户只做结构性修改（添加/删除/替换物体等），不涉及现有参数调整。',
        '3. MIXED — 用户同时要求参数调整和结构性修改。',
        '',
        '【输出格式（严格）】只输出一行纯 JSON，不要任何其他文字：',
        '参数修改：{"intent":"UPDATE_PARAM","parameters":{"bind1":value1,"bind2":value2}}',
        '结构修改：{"intent":"REWRITE","reason":"简短原因"}',
        '混合修改：{"intent":"MIXED","parameters":{"bind1":value1},"reason":"简短结构修改原因"}',
        '',
        '【规则】',
        '- 如果用户提到颜色、速度、大小、强度等，且对应 bind 存在于参数列表中，则提取对应参数',
        '- 颜色值必须是 #RRGGBB 格式的 hex 字符串',
        '- 数值型参数必须给出具体数字，不要给范围',
        '- 如果用户说"加一个xxx"、"换成xxx"、"新增xxx"、"删除xxx"等结构性修改，则涉及 REWRITE',
        '- 如果同时包含参数调整和结构修改，必须判为 MIXED，并在 parameters 中提取可调参数',
        '- 如果无法确定，默认为 REWRITE（宁可多生成，也不要错误修改参数）',
    ].join('\n');

    const user = [
        '当前可调参数列表：',
        paramDesc || '（无参数）',
        '',
        `用户输入："${prompt}"`,
        '',
        '请判断意图并输出 JSON：',
    ].join('\n');

    const controller = new AbortController();
    const budgetMs = Number.isFinite(timeoutMs) ? timeoutMs : 10000;
    const tid = setTimeout(() => controller.abort(), budgetMs);

    try {
        const url = `${baseUrl}/chat/completions`;
        const res = await fetchWithRetry(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({
                model,
                stream: false,
                messages: [
                    { role: 'system', content: system },
                    { role: 'user', content: user },
                ],
                temperature: 0,
                max_tokens: 256,
            }),
            signal: controller.signal,
        }, { retries: 1, baseDelayMs: 200 });

        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`Intent analysis failed: ${res.status} ${errText}`);
        }

        const data = await res.json();
        const msg = data && data.choices && data.choices[0] && data.choices[0].message;
        const content = (msg && (msg.content || msg.reasoning_content)) || '';
        console.log('[intent-analyzer] Raw AI response:', JSON.stringify(content).substring(0, 500));
        return parseIntentResponse(content);
    } finally {
        clearTimeout(tid);
    }
}

function parseIntentResponse(raw) {
    const text = (raw || '').trim();

    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
        try {
            const parsed = JSON.parse(codeBlockMatch[1].trim());
            return validateIntent(parsed);
        } catch (_) {}
    }

    const jsonLines = text.split('\n').filter((l) => l.trim().startsWith('{'));
    for (const line of jsonLines) {
        try {
            const parsed = JSON.parse(line.trim());
            return validateIntent(parsed);
        } catch (_) {}
    }

    const firstBrace = text.indexOf('{');
    if (firstBrace >= 0) {
        for (let end = text.length; end > firstBrace; end--) {
            if (text[end - 1] !== '}') continue;
            try {
                const parsed = JSON.parse(text.substring(firstBrace, end));
                return validateIntent(parsed);
            } catch (_) {}
        }
    }

    console.log('[intent-analyzer] No JSON found in response:', text.substring(0, 200));
    return { intent: 'REWRITE', reason: '无法解析意图，默认重新生成' };
}

function validateIntent(parsed) {
    if (parsed.intent === 'UPDATE_PARAM' && parsed.parameters && typeof parsed.parameters === 'object') {
        return { intent: 'UPDATE_PARAM', parameters: parsed.parameters };
    }
    if (parsed.intent === 'MIXED' && parsed.parameters && typeof parsed.parameters === 'object') {
        return { intent: 'MIXED', parameters: parsed.parameters, reason: parsed.reason || '同时包含参数调整和结构修改' };
    }
    if (parsed.intent === 'REWRITE') {
        return { intent: 'REWRITE', reason: parsed.reason || '需要结构性修改' };
    }
    return { intent: 'REWRITE', reason: '意图字段不明确，默认重新生成' };
}

module.exports = { analyzeIntent };
