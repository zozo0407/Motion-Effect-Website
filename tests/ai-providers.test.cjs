const test = require('node:test');
const assert = require('node:assert/strict');

const { getAIProvidersFromEnv } = require('../tools/creator/ai-providers.cjs');

test('prefers primary and fallback provider config when available', () => {
    const providers = getAIProvidersFromEnv({
        AI_PRIMARY_API_KEY: 'primary-key',
        AI_PRIMARY_BASE_URL: 'https://primary.example.com',
        AI_PRIMARY_MODEL: 'primary-model',
        AI_FALLBACK_API_KEY: 'fallback-key',
        AI_FALLBACK_BASE_URL: 'https://fallback.example.com',
        AI_FALLBACK_MODEL: 'fallback-model'
    });

    assert.equal(providers.length, 2);
    assert.deepEqual(providers[0], {
        label: 'primary',
        apiKey: 'primary-key',
        baseUrl: 'https://primary.example.com/v1',
        model: 'primary-model'
    });
    assert.deepEqual(providers[1], {
        label: 'fallback',
        apiKey: 'fallback-key',
        baseUrl: 'https://fallback.example.com/v1',
        model: 'fallback-model'
    });
});

test('falls back to legacy AI_API_KEY config when primary is absent', () => {
    const providers = getAIProvidersFromEnv({
        AI_API_KEY: 'legacy-key',
        AI_BASE_URL: 'https://legacy.example.com/v1',
        AI_MODEL: 'legacy-model'
    });

    assert.equal(providers.length, 1);
    assert.deepEqual(providers[0], {
        label: 'legacy',
        apiKey: 'legacy-key',
        baseUrl: 'https://legacy.example.com/v1',
        model: 'legacy-model'
    });
});

test('ignores empty provider config', () => {
    const providers = getAIProvidersFromEnv({
        AI_PRIMARY_API_KEY: '   ',
        AI_API_KEY: ''
    });

    assert.deepEqual(providers, []);
});
