const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.join(__dirname, '..', '..');
const wizardPath = path.join(root, 'src', 'site', 'wizard.js');
const wizard = fs.readFileSync(wizardPath, 'utf8');

// The "close AI creation UI" action must abort any in-flight generation and
// prevent late responses from mutating state after the user re-opens.
assert(
  wizard.includes('activeGeneration'),
  'wizard.js should track activeGeneration session state'
);
assert(
  wizard.includes('.abort('),
  'wizard.js should abort in-flight fetch via AbortController when closing the console'
);
assert(
  wizard.includes('sessionId'),
  'wizard.js should gate async completion by sessionId to avoid stale updates'
);

console.log('wizard-close-aborts-generation.test.cjs passed');

