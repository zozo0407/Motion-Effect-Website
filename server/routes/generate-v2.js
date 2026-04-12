module.exports = function (app, services) {
    const { aiProvider, aiGenerator, codeValidator, codeAutofix, skeletonRouter, config } = services;
    const { repairEngineEffectCode } = require('../services/ai-repair');
    const { modifyEffectCode } = require('../services/code-modifier');

    app.post('/api/modify-effect-code', async (req, res) => {
        const body = req.body && typeof req.body === 'object' ? req.body : {};
        const prompt = typeof body.prompt === 'string' ? body.prompt : '';
        const existingCode = typeof body.code === 'string' ? body.code : '';
        const modification = typeof body.modification === 'string' ? body.modification : '';

        if (!existingCode.trim()) return res.status(400).json({ error: 'code is required' });
        if (!modification.trim()) return res.status(400).json({ error: 'modification is required' });

        const providers = aiProvider.getAIProvidersFromEnv(process.env);
        if (!providers.length) return res.status(400).json({ error: 'Missing AI_PRIMARY_API_KEY' });

        const totalBudgetMs = config.getV2TotalBudgetMs(process.env);
        const t0 = Date.now();
        const remainingBudgetMs = () => totalBudgetMs - (Date.now() - t0);

        try {
            const modified = await aiProvider.runWithProviderFallback(providers, async (provider) => {
                return modifyEffectCode({
                    prompt,
                    existingCode,
                    modification,
                    apiKey: provider.apiKey,
                    baseUrl: provider.baseUrl,
                    model: provider.model,
                    timeoutMs: Math.max(1000, Math.min(90000, remainingBudgetMs() - 1500))
                });
            });

            const modifiedFixed = codeAutofix.autoFixEngineEffectCode(modified);
            const scanErr = codeValidator.validateEngineEffectCode(modifiedFixed);

            if (scanErr) {
                console.log(`[modify-effect-code] Validation failed: ${scanErr}, attempting repair...`);
                if (remainingBudgetMs() > 5000) {
                    const repaired = await aiProvider.runWithProviderFallback(providers, async (provider) => {
                        return repairEngineEffectCode({
                            prompt: `${prompt} (修改: ${modification})`,
                            badCode: modifiedFixed,
                            error: scanErr,
                            apiKey: provider.apiKey,
                            baseUrl: provider.baseUrl,
                            model: provider.model,
                            timeoutMs: Math.max(1000, Math.min(45000, remainingBudgetMs() - 1500))
                        });
                    });
                    const repairedFixed = codeAutofix.autoFixEngineEffectCode(repaired);
                    const reScanErr = codeValidator.validateEngineEffectCode(repairedFixed);
                    if (!reScanErr) {
                        return res.json({ code: repairedFixed });
                    }
                }
                if (config.isMinimalFallbackEnabled(process.env)) {
                    return res.json(skeletonRouter.buildMinimalFallbackPayload({
                        reason: `修改后代码不符合合约: ${scanErr}`,
                        prompt
                    }));
                }
                return res.status(502).json({ error: `修改后代码不符合合约: ${scanErr}` });
            }

            res.json({ code: modifiedFixed });
        } catch (e) {
            console.error('Modify effect code failed:', e);
            if (config.isMinimalFallbackEnabled(process.env)) {
                return res.json(skeletonRouter.buildMinimalFallbackPayload({
                    reason: e && e.message ? e.message : 'Modify failed',
                    prompt
                }));
            }
            res.status(500).json({ error: e && e.message ? e.message : 'Modify failed' });
        }
    });

    app.post('/api/repair-runtime-error', async (req, res) => {
        const body = req.body && typeof req.body === 'object' ? req.body : {};
        const prompt = typeof body.prompt === 'string' ? body.prompt : '';
        const badCode = typeof body.code === 'string' ? body.code : '';
        const errorMessage = typeof body.errorMessage === 'string' ? body.errorMessage : '';
        const stackTrace = typeof body.stackTrace === 'string' ? body.stackTrace : '';

        if (!badCode.trim()) return res.status(400).json({ error: 'code is required' });
        if (!errorMessage.trim()) return res.status(400).json({ error: 'errorMessage is required' });

        const providers = aiProvider.getAIProvidersFromEnv(process.env);
        if (!providers.length) return res.status(400).json({ error: 'Missing AI_PRIMARY_API_KEY' });

        const totalBudgetMs = config.getV2TotalBudgetMs(process.env);
        const t0 = Date.now();
        const remainingBudgetMs = () => totalBudgetMs - (Date.now() - t0);

        if (remainingBudgetMs() <= 0) {
            return res.json(skeletonRouter.buildMinimalFallbackPayload({ reason: 'budget exceeded before runtime repair', prompt }));
        }

        try {
            const errorSummary = [
                `运行时错误: ${errorMessage}`,
                stackTrace ? `堆栈追踪:\n${stackTrace}` : ''
            ].filter(Boolean).join('\n\n');

            const repaired = await aiProvider.runWithProviderFallback(providers, async (provider) => {
                return repairEngineEffectCode({
                    prompt: prompt || '(无原始需求描述)',
                    badCode: badCode,
                    error: errorSummary,
                    apiKey: provider.apiKey,
                    baseUrl: provider.baseUrl,
                    model: provider.model,
                    timeoutMs: Math.max(1000, Math.min(60000, remainingBudgetMs() - 1500))
                });
            });

            const repairedFixed = codeAutofix.autoFixEngineEffectCode(repaired);
            const scanErr = codeValidator.validateEngineEffectCode(repairedFixed);

            if (scanErr) {
                console.log(`[repair-runtime-error] Post-repair validation failed: ${scanErr}`);
                if (config.isMinimalFallbackEnabled(process.env)) {
                    return res.json(skeletonRouter.buildMinimalFallbackPayload({
                        reason: `修复后代码仍不符合合约: ${scanErr}`,
                        prompt
                    }));
                }
                return res.status(502).json({ error: `修复后代码仍不符合合约: ${scanErr}` });
            }

            res.json({ code: repairedFixed });
        } catch (e) {
            console.error('Runtime repair failed:', e);
            if (config.isMinimalFallbackEnabled(process.env)) {
                return res.json(skeletonRouter.buildMinimalFallbackPayload({
                    reason: e && e.message ? e.message : 'Runtime repair failed',
                    prompt
                }));
            }
            res.status(500).json({ error: e && e.message ? e.message : 'Runtime repair failed' });
        }
    });

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
            if (remainingBudgetMs() <= 0) {
                return res.json(budgetExceededPayload('before generation'));
            }
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
                if (remainingBudgetMs() <= 0) {
                    return res.json(budgetExceededPayload('before repair'));
                }
                const repaired = await aiProvider.runWithProviderFallback(providers, async (provider) => {
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
                const repairedFixed = codeAutofix.autoFixEngineEffectCode(repaired);
                scanErr = codeValidator.validateEngineEffectCode(repairedFixed);
                if (scanErr) {
                    if (minimalFallbackEnabled) {
                        return res.json(skeletonRouter.buildMinimalFallbackPayload({
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
                return res.json(skeletonRouter.buildMinimalFallbackPayload({
                    reason: e && e.message ? e.message : 'Internal Server Error',
                    prompt
                }));
            }
            res.status(500).json({ error: e && e.message ? e.message : 'Internal Server Error' });
        }
    });
};
