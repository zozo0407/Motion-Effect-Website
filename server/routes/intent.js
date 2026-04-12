module.exports = function (app, services) {
    const { aiProvider, config } = services;
    const { analyzeIntent } = require('../services/intent-analyzer');

    app.post('/api/analyze-intent', async (req, res) => {
        const body = req.body && typeof req.body === 'object' ? req.body : {};
        const prompt = typeof body.prompt === 'string' ? body.prompt : '';
        const uiConfig = Array.isArray(body.uiConfig) ? body.uiConfig : [];

        if (!prompt.trim()) return res.status(400).json({ error: 'prompt is required' });

        const providers = aiProvider.getAIProvidersFromEnv(process.env);
        if (!providers.length) return res.status(400).json({ error: 'Missing AI_PRIMARY_API_KEY' });

        try {
            const result = await aiProvider.runWithProviderFallback(providers, async (provider) => {
                return analyzeIntent({
                    prompt,
                    uiConfig,
                    apiKey: provider.apiKey,
                    baseUrl: provider.baseUrl,
                    model: provider.model,
                    timeoutMs: 10000,
                });
            });

            res.json(result);
        } catch (e) {
            console.error('Intent analysis failed:', e);
            res.json({ intent: 'REWRITE', reason: '意图分析服务暂不可用，默认重新生成' });
        }
    });
};
