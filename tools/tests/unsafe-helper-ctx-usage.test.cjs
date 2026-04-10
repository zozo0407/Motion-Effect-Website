const fs = require('fs');
const path = require('path');
const assert = require('assert');

const serverPath = path.join(__dirname, '..', '..', 'server.js');
const server = fs.readFileSync(serverPath, 'utf8');

assert(server.includes('function findUnsafeCtxHelperUsage('), 'server.js should define helper ctx-usage detection');
assert(server.includes('const unsafeCtxHelper = findUnsafeCtxHelperUsage(code);'), 'validator should check unsafe ctx usage in helper methods');
assert(server.includes('辅助方法中直接使用 ctx'), 'validator should explain helper-method ctx misuse clearly');

console.log('unsafe-helper-ctx-usage.test.cjs passed');
