function normalizeAIBaseUrl(baseUrl) {
    const raw = typeof baseUrl === 'string' ? baseUrl.trim() : '';
    if (!raw) return 'https://api.openai.com/v1';
    const noTrailingSlash = raw.replace(/\/+$/, '');
    if (/\/v\d+(\/|$)/i.test(noTrailingSlash)) return noTrailingSlash;
    return `${noTrailingSlash}/v1`;
}

function buildProvider(label, apiKey, baseUrl, model, defaultModel) {
    const trimmedKey = typeof apiKey === 'string' ? apiKey.trim() : '';
    if (!trimmedKey) return null;
    return {
        label,
        apiKey: trimmedKey,
        baseUrl: normalizeAIBaseUrl(baseUrl),
        model: (typeof model === 'string' && model.trim()) ? model.trim() : defaultModel
    };
}

function getAIProvidersFromEnv(env = process.env) {
    const providers = [];

    const primary = buildProvider(
        'primary',
        env.AI_PRIMARY_API_KEY,
        env.AI_PRIMARY_BASE_URL,
        env.AI_PRIMARY_MODEL,
        'gpt-4o'
    );
    if (primary) providers.push(primary);

    const fallback = buildProvider(
        'fallback',
        env.AI_FALLBACK_API_KEY,
        env.AI_FALLBACK_BASE_URL,
        env.AI_FALLBACK_MODEL,
        primary ? primary.model : 'gpt-4o'
    );
    if (fallback) providers.push(fallback);

    if (providers.length > 0) return providers;

    const legacy = buildProvider(
        'legacy',
        env.AI_API_KEY || env.OPENAI_API_KEY,
        env.AI_BASE_URL || env.OPENAI_BASE_URL || env.OPENAI_API_BASE,
        env.AI_MODEL || env.OPENAI_MODEL,
        'gpt-4o'
    );
    return legacy ? [legacy] : [];
}

module.exports = {
    getAIProvidersFromEnv,
    normalizeAIBaseUrl
};
