const fs = require('fs');
const path = require('path');
const assert = require('assert');

const route = fs.readFileSync(path.join(__dirname, '..', '..', 'server', 'routes', 'generate.js'), 'utf8');
const routeStart = route.indexOf("if (req && req.query && String(req.query.v || '') === '2') {");
assert(routeStart >= 0, 'generate route should contain the v=2 route branch');

const routeEnd = route.indexOf('const style = await aiGenerator.classifyStyle', routeStart);
assert(routeEnd > routeStart, 'generate route should continue with the non-v2 branch after the v2 route branch');

const v2Branch = route.slice(routeStart, routeEnd);
assert(v2Branch.includes('attempting repair'), 'v2 route should log when validation fails and repair starts');
assert(v2Branch.includes('repairEngineEffectCode({'), 'v2 route should attempt repair for invalid generated code');
assert(v2Branch.includes('const repairedFixed = codeAutofix.autoFixEngineEffectCode(repaired);'), 'v2 route should auto-fix repaired code before returning it');

console.log('generate-v2-no-repair.test.cjs passed');

