const assert = require('assert');
const { findUnsafeCtxHelperUsage } = require('../../server/services/code-validator.js');

const code = `
import * as THREE from 'three';
export default class EngineEffect {
  onStart(ctx) {
    this.ctx = ctx;
  }
  for() {
    ctx.size.width;
  }
  onUpdate(ctx) { }
}
`;

const res = findUnsafeCtxHelperUsage(code);
assert.strictEqual(res, null, `Expected null (no unsafe helper ctx usage), got ${String(res)}`);

console.log('unsafe-helper-ctx-usage-keyword-false-positive.test.cjs passed');

