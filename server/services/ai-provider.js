const { getAIProvidersFromEnv, normalizeAIBaseUrl } = require('../../tools/creator/ai-providers.cjs');

function getAIConfig(env) {
    const e = env || process.env;
    const providers = getAIProvidersFromEnv(e);
    if (providers.length > 0) {
        const first = providers[0];
        return { apiKey: first.apiKey, baseUrl: first.baseUrl, model: first.model };
    }
    const apiKey = e.AI_API_KEY || e.OPENAI_API_KEY;
    const baseUrlRaw = e.AI_BASE_URL || e.OPENAI_BASE_URL || e.OPENAI_API_BASE || 'https://api.openai.com/v1';
    const model = e.AI_MODEL || e.OPENAI_MODEL || 'gpt-4o';
    return { apiKey, baseUrl: normalizeAIBaseUrl(baseUrlRaw), model };
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function sleepWithSignal(ms, signal) {
    if (!signal) return sleep(ms);
    return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(resolve, ms);
        const onAbort = () => { clearTimeout(timeoutId); const err = new Error('aborted'); err.name = 'AbortError'; reject(err); };
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
                const waitMs = Number.isFinite(retryAfterSeconds) ? retryAfterSeconds * 1000 : baseDelayMs * Math.pow(2, attempt) + Math.floor(Math.random() * 1000);
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
        try { return await runner(provider); }
        catch (error) { lastErr = error; console.warn(`[ai-provider:${provider.label}] failed:`, error && error.message ? error.message : String(error)); }
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
            body: JSON.stringify({ model, stream: false, messages, temperature, max_tokens: maxTokens }),
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
    } finally { clearTimeout(timeoutId); }
}

module.exports = { getAIConfig, getAIProvidersFromEnv, runWithProviderFallback, fetchWithRetry, runV2Stage, sleep, sleepWithSignal };
