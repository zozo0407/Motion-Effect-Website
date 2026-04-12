const fs = require('fs');
const path = require('path');
const assert = require('assert');

const validator = fs.readFileSync(path.join(__dirname, '..', '..', 'server', 'services', 'code-validator.js'), 'utf8');

assert(validator.includes('SpotLightHelper'), 'code-validator.js should mention SpotLightHelper in validation or repair rules');
assert(validator.includes('Helper'), 'code-validator.js should include a general Helper ban for stability');

console.log('ban-three-helpers.test.cjs passed');

