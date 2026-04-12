const fs = require('fs');
const path = require('path');
const assert = require('assert');

const config = fs.readFileSync(path.join(__dirname, '..', '..', 'server', 'config.js'), 'utf8');
const route = fs.readFileSync(path.join(__dirname, '..', '..', 'server', 'routes', 'generate-v2.js'), 'utf8');

assert(config.includes('AI_V2_TOTAL_BUDGET_MS') || config.includes('getV2TotalBudgetMs'), 'config.js should include AI_V2_TOTAL_BUDGET_MS config wiring');
assert(config.includes('function getV2TotalBudgetMs'), 'config.js should define getV2TotalBudgetMs()');
assert(route.includes('remainingBudgetMs'), 'generate-v2.js should compute remainingBudgetMs for v2');
assert(route.includes('budget exceeded'), 'generate-v2.js should log budget exceeded path');

console.log('generate-v2-total-budget-wiring.test.cjs passed');

