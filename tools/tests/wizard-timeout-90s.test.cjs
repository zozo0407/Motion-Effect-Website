const fs = require('fs');
const path = require('path');
const assert = require('assert');

const wizardPath = path.join(__dirname, '..', '..', 'src', 'site', 'wizard.js');
const wizard = fs.readFileSync(wizardPath, 'utf8');

// Keep frontend abort + countdown aligned with server-side 90s timeout.
assert(wizard.includes('const MAX_WAIT_MS = 90000'), 'wizard should use MAX_WAIT_MS = 90000');
assert(wizard.includes('const __timeoutMs = 90000'), 'wizard should use __timeoutMs = 90000');
assert(wizard.includes('最多 01:30'), 'wizard countdown label should show 01:30 max');

console.log('wizard-timeout-90s.test.cjs passed');
