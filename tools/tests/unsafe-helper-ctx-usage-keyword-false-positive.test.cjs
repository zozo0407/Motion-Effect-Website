const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const serverPath = path.join(__dirname, '..', '..', 'server.js');
const src = fs.readFileSync(serverPath, 'utf8');

const m = src.match(/function\s+findUnsafeCtxHelperUsage\s*\(code\)\s*\{[\s\S]*?\n\}/);
assert(m, 'Expected to find function findUnsafeCtxHelperUsage(code) in server.js');

const ctx = {};
vm.createContext(ctx);
vm.runInContext(`${m[0]}\nthis.findUnsafeCtxHelperUsage = findUnsafeCtxHelperUsage;`, ctx);

// Regression: do not treat `for (...) {}` or other control statements as helper methods.
const code = `
import * as THREE from 'three';
export default class EngineEffect {
  onStart(ctx) {
    // normal lifecycle code
    this.ctx = ctx;
  }
  // If the generator ever produces a keyword-named "method" (commonly from a parsing mistake),
  // we must not treat it as a helper method and trigger repair.
  for() {
    // This is the false-positive we saw in logs ("for()") - treat it as a keyword statement, not a helper method.
    ctx.size.width;
  }
  onUpdate(ctx) { }
}
`;

const res = ctx.findUnsafeCtxHelperUsage(code);
assert.strictEqual(res, null, `Expected null (no unsafe helper ctx usage), got ${String(res)}`);

console.log('unsafe-helper-ctx-usage-keyword-false-positive.test.cjs passed');
