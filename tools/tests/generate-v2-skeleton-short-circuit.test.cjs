const fs = require('fs');
const path = require('path');
const assert = require('assert');

const server = fs.readFileSync(path.join(__dirname, '..', '..', 'server.js'), 'utf8');
const routeStart = server.indexOf("app.post('/api/generate-effect-v2'");
assert(routeStart >= 0, 'server.js should contain the /api/generate-effect-v2 route');
const routeEnd = server.indexOf('// API: Get Demos', routeStart);
assert(routeEnd > routeStart, 'server.js should continue with later routes after /api/generate-effect-v2');
const v2Route = server.slice(routeStart, routeEnd);

assert(v2Route.includes('routePromptToSkeleton(prompt)'), 'v2 route should consult skeleton router before AI generation');
assert(server.includes('AI_ENABLE_SKELETON_ROUTER'), 'server.js should guard skeleton routing by env flag');
assert(v2Route.includes('if (skeletonRoute && skeletonRoute.matched)'), 'v2 route should short-circuit on matched skeletons when enabled');
assert(server.includes('buildWireframeGeoEffectCode'), 'server.js should support wireframe skeleton builder');
assert(server.includes('buildDigitalRainEffectCode'), 'server.js should support digital-rain skeleton builder');
assert(server.includes('buildGlassGeoEffectCode'), 'server.js should support glass skeleton builder');
assert(server.includes('buildLiquidMetalEffectCode'), 'server.js should support liquid-metal skeleton builder');

console.log('generate-v2-skeleton-short-circuit.test.cjs passed');
