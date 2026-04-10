const fs = require('fs');
const path = require('path');
const assert = require('assert');

const serverPath = path.join(__dirname, '..', '..', 'server.js');
const server = fs.readFileSync(serverPath, 'utf8');

assert(server.includes('SpotLightHelper'), 'server.js should mention SpotLightHelper in validation or repair rules');
assert(server.includes('Helper'), 'server.js should include a general Helper ban for stability');

console.log('ban-three-helpers.test.cjs passed');
