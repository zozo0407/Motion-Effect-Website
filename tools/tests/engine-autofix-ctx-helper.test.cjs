const assert = require('node:assert/strict');

const { fixUnsafeCtxHelperUsage } = require('../creator/engine-autofix.cjs');

const input = `import * as THREE from 'three';
export default class EngineEffect {
  constructor() {}
  onStart(ctx) {
    this.createDigitRain();
  }
  createDigitRain() {
    const w = ctx.size.width;
    const h = ctx?.size?.height;
    return w + h;
  }
  onUpdate(ctx) {
    // lifecycle ctx use should remain untouched
    const t = ctx.time || 0;
    return t;
  }
  onResize(ctx) {}
  onDestroy() {}
  getUIConfig() { return []; }
  setParam() {}
}
`;

const out = fixUnsafeCtxHelperUsage(input);

// Should save ctx in onStart
assert.match(out, /onStart\s*\(\s*ctx\s*\)\s*\{[\s\S]*?\bthis\.ctx\s*=\s*ctx\s*;/, 'should inject this.ctx = ctx in onStart');

// Should rewrite helper ctx references to this.ctx
assert.match(out, /\bcreateDigitRain\s*\(\)\s*\{[\s\S]*?\bthis\.ctx\.size\.width\b/, 'should rewrite ctx. to this.ctx. in helper method');
assert.match(out, /\bcreateDigitRain\s*\(\)\s*\{[\s\S]*?\bthis\.ctx\?\.\s*size\?\.\s*height\b/, 'should rewrite ctx?. to this.ctx?. in helper method');

// Should not rewrite lifecycle ctx usage
assert.match(out, /\bonUpdate\s*\(\s*ctx\s*\)\s*\{[\s\S]*?\bctx\.time\b/, 'should keep ctx in lifecycle methods');
assert.doesNotMatch(out, /\bonUpdate\s*\(\s*ctx\s*\)\s*\{[\s\S]*?\bthis\.ctx\.time\b/, 'should not rewrite lifecycle ctx to this.ctx');

// No-op when no unsafe usage
const input2 = `import * as THREE from 'three';
export default class EngineEffect {
  onStart(ctx) { this.ctx = ctx; }
  helper(ctx) { return ctx.size.width; }
  onUpdate(ctx) { return ctx.time; }
  onResize(ctx) {}
  onDestroy() {}
  getUIConfig() { return []; }
  setParam() {}
}
`;
assert.equal(fixUnsafeCtxHelperUsage(input2), input2, 'should not change code when no unsafe helper ctx usage exists');

console.log('engine-autofix-ctx-helper.test.cjs passed');

