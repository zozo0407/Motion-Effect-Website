const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.join(__dirname, '..', '..');
const targets = [
  path.join(root, 'src', 'site', 'wizard.js'),
  path.join(root, 'src', 'site', 'demos.js')
];

const badPatterns = [
  ':3000/api',
  '/api/generate-effect?v=2',
  'generate-effect?v=2'
];

for (const file of targets) {
  const content = fs.readFileSync(file, 'utf8');
  for (const p of badPatterns) {
    assert(!content.includes(p), `${path.basename(file)} should not include ${p}`);
  }
  assert(content.includes("/api"), `${path.basename(file)} should include /api base path`);
}

// wizard.js must call the AI generation endpoint
const wizard = fs.readFileSync(targets[0], 'utf8');
assert(wizard.includes("generate-effect-v2"), 'wizard.js should call generate-effect-v2');

console.log('frontend-api-endpoints.test.cjs passed');
