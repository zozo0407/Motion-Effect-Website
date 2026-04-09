const assert = require('assert');
const { getAIProvidersFromEnv } = require('../creator/ai-providers.cjs');

const providers = getAIProvidersFromEnv({
  AI_PRIMARY_API_KEY: 'k1',
  AI_PRIMARY_BASE_URL: 'https://example.com/v1',
  AI_PRIMARY_MODEL: 'gemini-3.1-pro-preview',
  AI_FALLBACK_API_KEY: 'k2',
  AI_FALLBACK_BASE_URL: 'https://example.org/v1',
  AI_FALLBACK_MODEL: 'MiniMax-M2.7-highspeed'
});

assert.equal(providers.length, 2);
assert.equal(providers[0].label, 'fallback');
assert.equal(providers[1].label, 'primary');

console.log('provider-order-highspeed.test.cjs passed');
