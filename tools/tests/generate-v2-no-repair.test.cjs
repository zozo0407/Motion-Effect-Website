const fs = require('fs');
const path = require('path');
const assert = require('assert');

const serverPath = path.join(__dirname, '..', '..', 'server.js');
const server = fs.readFileSync(serverPath, 'utf8');
const routeStart = server.indexOf("if (req && req.query && String(req.query.v || '') === '2') {");
assert(routeStart >= 0, 'server.js should contain the v2 route branch');

const routeEnd = server.indexOf('const style = await classifyStyle', routeStart);
assert(routeEnd > routeStart, 'server.js should continue with the non-v2 branch after the v2 route branch');

const v2Branch = server.slice(routeStart, routeEnd);

assert(v2Branch.includes('attempting repair'), 'v2 route should log when validation fails and repair starts');
assert(v2Branch.includes('repairEngineEffectCode({'), 'v2 route should attempt repair for invalid generated code');
assert(v2Branch.includes('const repairedFixed = autoFixEngineEffectCode(repaired);'), 'v2 route should auto-fix repaired code before returning it');

console.log('generate-v2-no-repair.test.cjs passed');
