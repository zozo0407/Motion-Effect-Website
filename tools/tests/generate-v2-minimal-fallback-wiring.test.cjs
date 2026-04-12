const fs = require('fs');
const path = require('path');
const assert = require('assert');

const config = fs.readFileSync(path.join(__dirname, '..', '..', 'server', 'config.js'), 'utf8');
const route = fs.readFileSync(path.join(__dirname, '..', '..', 'server', 'routes', 'generate-v2.js'), 'utf8');
const skeleton = fs.readFileSync(path.join(__dirname, '..', '..', 'server', 'services', 'skeleton-router.js'), 'utf8');

assert(config.includes('AI_ENABLE_MINIMAL_FALLBACK') || config.includes('isMinimalFallbackEnabled'), 'server/config.js should include minimal fallback config wiring');
assert(skeleton.includes('buildMinimalFallbackPayload'), 'skeleton-router.js should expose minimal fallback payload builder');
assert(route.includes('minimalFallbackEnabled'), 'generate-v2 route should compute minimal fallback enable flag');
assert(route.includes('buildMinimalFallbackPayload'), 'generate-v2 route should use minimal fallback on failures');

console.log('generate-v2-minimal-fallback-wiring.test.cjs passed');

