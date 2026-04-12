const fs = require('fs');
const path = require('path');
const assert = require('assert');

const validator = fs.readFileSync(path.join(__dirname, '..', '..', 'server', 'services', 'code-validator.js'), 'utf8');

assert(validator.includes('function findUnsafeCtxHelperUsage('), 'code-validator.js should define helper ctx-usage detection');
assert(validator.includes('const unsafeCtxHelper = findUnsafeCtxHelperUsage(code);'), 'validator should check unsafe ctx usage in helper methods');
assert(validator.includes('辅助方法中直接使用 ctx'), 'validator should explain helper-method ctx misuse clearly');

console.log('unsafe-helper-ctx-usage.test.cjs passed');

