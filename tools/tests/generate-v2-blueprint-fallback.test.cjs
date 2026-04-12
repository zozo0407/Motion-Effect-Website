const fs = require('fs');
const path = require('path');
const assert = require('assert');

const aiGenerator = fs.readFileSync(path.join(__dirname, '..', '..', 'server', 'services', 'ai-generator.js'), 'utf8');

assert(aiGenerator.includes('defaultBlueprint('), 'ai-generator.js should use defaultBlueprint as a fallback when blueprint stage fails');
assert(aiGenerator.includes('[v2][blueprint] fallback'), 'ai-generator.js should log blueprint fallback');

console.log('generate-v2-blueprint-fallback.test.cjs passed');

