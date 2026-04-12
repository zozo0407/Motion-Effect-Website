const fs = require('fs');
const path = require('path');
const assert = require('assert');

const route = fs.readFileSync(path.join(__dirname, '..', '..', 'server', 'routes', 'generate-v2.js'), 'utf8');

assert(route.includes("app.post('/api/generate-effect-v2'"), 'generate-v2.js should contain the /api/generate-effect-v2 route');
assert(route.includes('attempting repair'), 'v2 route should log when validation fails and repair starts');
assert(route.includes('repairEngineEffectCode({'), 'v2 route should attempt repair when generated code fails validation');
assert(route.includes('badCode: generatedCode'), 'v2 route should pass the invalid generated code into repair');
assert(route.includes('error: scanErr'), 'v2 route should pass the validation error into repair');
assert(route.includes('const repairedFixed = codeAutofix.autoFixEngineEffectCode(repaired);'), 'v2 route should re-run auto-fix on repaired code');

console.log('generate-v2-repair-on-syntax-error.test.cjs passed');

