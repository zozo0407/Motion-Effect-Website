const fs = require('fs');
const path = require('path');
const assert = require('assert');

const retryPolicyPath = path.join(__dirname, '..', 'creator', 'retry-policy.cjs');
const retryPolicy = fs.readFileSync(retryPolicyPath, 'utf8');
assert(retryPolicy.includes('status === 529'), 'retry policy should include 529');
assert(retryPolicy.includes('status === 429'), 'retry policy should include 429');

const aiProvider = fs.readFileSync(path.join(__dirname, '..', '..', 'server', 'services', 'ai-provider.js'), 'utf8');
assert(aiProvider.includes('res.status === 529'), 'fetchWithRetry should handle 529');
assert(aiProvider.includes('res.status === 429'), 'fetchWithRetry should handle 429');
assert(aiProvider.includes('res.status >= 500'), 'fetchWithRetry should handle 5xx');
assert(aiProvider.includes('[fetchWithRetry] ${res.status} 服务过载'), 'fetchWithRetry should log overload retries');
assert(aiProvider.includes('[fetchWithRetry] ${res.status} 服务端错误'), 'fetchWithRetry should log 5xx retries');

console.log('retry-529.test.cjs passed');

