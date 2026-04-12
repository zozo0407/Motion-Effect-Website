const fs = require('fs');
const path = require('path');
const assert = require('assert');

const route = fs.readFileSync(path.join(__dirname, '..', '..', 'server', 'routes', 'generate-v2.js'), 'utf8');
const config = fs.readFileSync(path.join(__dirname, '..', '..', 'server', 'config.js'), 'utf8');
const skeleton = fs.readFileSync(path.join(__dirname, '..', '..', 'server', 'services', 'skeleton-router.js'), 'utf8');

assert(route.includes('routePromptToSkeleton(prompt)'), 'v2 route should consult skeleton router before AI generation');
assert(config.includes('AI_ENABLE_SKELETON_ROUTER') || config.includes('isSkeletonRouterEnabled'), 'config should guard skeleton routing by env flag');
assert(route.includes('if (skeletonRoute && skeletonRoute.matched)'), 'v2 route should short-circuit on matched skeletons when enabled');
assert(skeleton.includes('buildWireframeGeoEffectCode'), 'skeleton-router.js should support wireframe skeleton builder');
assert(skeleton.includes('buildDigitalRainEffectCode'), 'skeleton-router.js should support digital-rain skeleton builder');
assert(skeleton.includes('buildGlassGeoEffectCode'), 'skeleton-router.js should support glass skeleton builder');
assert(skeleton.includes('buildLiquidMetalEffectCode'), 'skeleton-router.js should support liquid-metal skeleton builder');

console.log('generate-v2-skeleton-short-circuit.test.cjs passed');

