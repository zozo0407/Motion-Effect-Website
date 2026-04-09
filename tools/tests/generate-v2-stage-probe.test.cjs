const fs = require('fs');
const path = require('path');
const assert = require('assert');

const serverPath = path.join(__dirname, '..', '..', 'server.js');
const server = fs.readFileSync(serverPath, 'utf8');

assert(server.includes('async function runV2Stage('), 'server.js should define a runV2Stage helper');
assert(server.includes("[v2][${stage}] start"), 'server.js should log stage start');
assert(server.includes("[v2][${stage}] response status="), 'server.js should log stage response status');
assert(server.includes("[v2][${stage}] timeout"), 'server.js should log stage timeout');
assert(server.includes("stage: 'blueprint'"), 'generateEffectV2FromPrompt should call runV2Stage for blueprint');
assert(server.includes("stage: 'code'"), 'generateEffectV2FromPrompt should call runV2Stage for code');
assert(server.includes('timeoutMs: 25000'), 'blueprint stage should have a dedicated timeout');
assert(server.includes('timeoutMs: 120000'), 'code stage should have a dedicated timeout');

console.log('generate-v2-stage-probe.test.cjs passed');
