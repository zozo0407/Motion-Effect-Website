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

assert(!v2Branch.includes('repairEngineEffectCode('), 'v2 route should not invoke repairEngineEffectCode while repair is temporarily disabled');
assert(v2Branch.includes('if (scanErr) return res.status(502).json({ error: `AI 输出不符合 EngineEffect 合约：${scanErr}` });'), 'v2 route should return validation error directly when repair is disabled');

console.log('generate-v2-no-repair.test.cjs passed');
