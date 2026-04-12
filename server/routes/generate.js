module.exports = function (app, services) {
    const { aiProvider, aiGenerator, codeValidator, codeAutofix, skeletonRouter } = services;

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

        if (String(process.env.AI_DEMO_MODE || '') === '1') {
            try {
                const routed = skeletonRouter.routePromptToSkeleton(prompt);
                const params = routed && routed.params ? routed.params : {};
                const code = routed && routed.kind === 'particles'
                    ? skeletonRouter.buildGlowSphereEffectCode(params)
                    : skeletonRouter.buildGlowSphereEffectCode(params);
                return res.json({ code });
            } catch (e) {
                const code = skeletonRouter.buildGlowSphereEffectCode({ color: '#ff0040', glowIntensity: 1.2, speed: 1.0 });
                return res.json({ code });
            }
        }

        const { apiKey, baseUrl, model } = aiProvider.getAIConfig();

        if (!apiKey) {
            const mockCode = skeletonRouter.buildEnergyCoreEffectCode({ color: '#00f2ff', intensity: 1.2, speed: 1.0 });
            return res.json({ code: mockCode });
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
};
