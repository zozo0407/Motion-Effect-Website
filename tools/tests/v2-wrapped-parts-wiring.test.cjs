const fs = require('fs');
const path = require('path');
const assert = require('assert');

const aiGenerator = fs.readFileSync(path.join(__dirname, '..', '..', 'server', 'services', 'ai-generator.js'), 'utf8');
const route = fs.readFileSync(path.join(__dirname, '..', '..', 'server', 'routes', 'generate-v2.js'), 'utf8');
const generateRoute = fs.readFileSync(path.join(__dirname, '..', '..', 'server', 'routes', 'generate.js'), 'utf8');

assert(
  aiGenerator.includes('options.outputMode'),
  'generateEffectV2FromPrompt should read outputMode from options.outputMode (not process.env)'
);
assert(
  route.includes('outputMode: process.env.AI_V2_OUTPUT_MODE'),
  '/api/generate-effect-v2 should pass outputMode: process.env.AI_V2_OUTPUT_MODE into generateEffectV2FromPrompt'
);

const v2BranchStart = generateRoute.indexOf("if (req && req.query && String(req.query.v || '') === '2') {");
assert(v2BranchStart >= 0, 'generate.js should contain the v=2 branch');
const v2BranchEnd = generateRoute.indexOf('const style = await aiGenerator.classifyStyle', v2BranchStart);
assert(v2BranchEnd > v2BranchStart, 'generate.js should contain non-v2 branch after v=2 branch');
const v2Branch = generateRoute.slice(v2BranchStart, v2BranchEnd);
assert(
  !v2Branch.includes('AI_V2_OUTPUT_MODE') && !v2Branch.includes('outputMode:'),
  'v=2 branch should not pass outputMode (keep default two-stage behavior)'
);

console.log('v2-wrapped-parts-wiring.test.cjs passed');

