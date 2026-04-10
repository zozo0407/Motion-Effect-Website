const fs = require('fs');
const path = require('path');
const assert = require('assert');

const serverPath = path.join(__dirname, '..', '..', 'server.js');
const server = fs.readFileSync(serverPath, 'utf8');

assert(server.includes('AI_ENABLE_MINIMAL_FALLBACK'), 'server.js should include AI_ENABLE_MINIMAL_FALLBACK flag');
assert(server.includes('buildMinimalFallbackPayload'), 'server.js should wire minimal fallback payload builder');

const routeStart = server.indexOf("app.post('/api/generate-effect-v2'");
assert(routeStart >= 0, 'server.js should contain the /api/generate-effect-v2 route');
const routeEnd = server.indexOf('// API: Get Demos', routeStart);
assert(routeEnd > routeStart, 'server.js should continue with later routes after /api/generate-effect-v2');

const v2Route = server.slice(routeStart, routeEnd);
assert(v2Route.includes('minimalFallbackEnabled'), 'v2 route should compute minimal fallback enable flag');
assert(v2Route.includes('buildMinimalFallbackPayload'), 'v2 route should use minimal fallback on failures');

console.log('generate-v2-minimal-fallback-wiring.test.cjs passed');
