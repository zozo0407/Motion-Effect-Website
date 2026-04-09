const fs = require('fs');
const path = require('path');
const assert = require('assert');

const serverPath = path.join(__dirname, '..', '..', 'server.js');
const server = fs.readFileSync(serverPath, 'utf8');

assert(server.includes('defaultBlueprint('), 'server.js should use defaultBlueprint as a fallback when blueprint stage fails');
assert(server.includes('[v2][blueprint] fallback'), 'server.js should log blueprint fallback');

console.log('generate-v2-blueprint-fallback.test.cjs passed');
