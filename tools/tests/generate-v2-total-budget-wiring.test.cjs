const fs = require('fs');
const path = require('path');
const assert = require('assert');

const serverPath = path.join(__dirname, '..', '..', 'server.js');
const server = fs.readFileSync(serverPath, 'utf8');

assert(server.includes('AI_V2_TOTAL_BUDGET_MS'), 'server.js should include AI_V2_TOTAL_BUDGET_MS config');
assert(server.includes('function getV2TotalBudgetMs'), 'server.js should define getV2TotalBudgetMs()');
assert(server.includes('remainingBudgetMs'), 'server.js should compute remainingBudgetMs for v2');
assert(server.includes('budget exceeded'), 'server.js should log budget exceeded path');

console.log('generate-v2-total-budget-wiring.test.cjs passed');
