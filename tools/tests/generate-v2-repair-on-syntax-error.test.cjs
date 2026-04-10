const fs = require('fs');
const path = require('path');
const assert = require('assert');

const serverPath = path.join(__dirname, '..', '..', 'server.js');
const server = fs.readFileSync(serverPath, 'utf8');

const routeStart = server.indexOf("app.post('/api/generate-effect-v2'");
assert(routeStart >= 0, 'server.js should contain the /api/generate-effect-v2 route');

const routeEnd = server.indexOf('// API: Get Demos', routeStart);
assert(routeEnd > routeStart, 'server.js should continue with later routes after /api/generate-effect-v2');

const v2Route = server.slice(routeStart, routeEnd);

assert(v2Route.includes('attempting repair'), 'v2 route should log when validation fails and repair starts');
assert(v2Route.includes('repairEngineEffectCode({'), 'v2 route should attempt repair when generated code fails validation');
assert(v2Route.includes('badCode: generatedCode'), 'v2 route should pass the invalid generated code into repair');
assert(v2Route.includes('error: scanErr'), 'v2 route should pass the validation error into repair');
assert(v2Route.includes('const repairedFixed = autoFixEngineEffectCode(repaired);'), 'v2 route should re-run auto-fix on repaired code');

console.log('generate-v2-repair-on-syntax-error.test.cjs passed');
