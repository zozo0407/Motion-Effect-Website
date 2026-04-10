const fs = require('fs');
const path = require('path');
const assert = require('assert');

const serverPath = path.join(__dirname, '..', '..', 'server.js');
const server = fs.readFileSync(serverPath, 'utf8');

// Implementation must read outputMode from options, not directly from env,
// so /api/generate-effect?v=2 is not changed accidentally.
assert(
  server.includes('options.outputMode'),
  'generateEffectV2FromPrompt should read outputMode from options.outputMode (not process.env)'
);

// /api/generate-effect-v2 must pass env into options.outputMode
assert(
  server.includes('outputMode: process.env.AI_V2_OUTPUT_MODE'),
  '/api/generate-effect-v2 should pass outputMode: process.env.AI_V2_OUTPUT_MODE into generateEffectV2FromPrompt'
);

// v=2 branch must NOT pass outputMode
const v2BranchStart = server.indexOf("if (req && req.query && String(req.query.v || '') === '2') {");
assert(v2BranchStart >= 0, 'server.js should contain the v=2 branch');
const v2BranchEnd = server.indexOf('const style = await classifyStyle', v2BranchStart);
assert(v2BranchEnd > v2BranchStart, 'server.js should contain non-v2 branch after v=2 branch');
const v2Branch = server.slice(v2BranchStart, v2BranchEnd);
assert(
  !v2Branch.includes('AI_V2_OUTPUT_MODE') && !v2Branch.includes('outputMode:'),
  'v=2 branch should not pass outputMode (keep default two-stage behavior)'
);

console.log('v2-wrapped-parts-wiring.test.cjs passed');
