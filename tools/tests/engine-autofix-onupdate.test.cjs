const assert = require('node:assert/strict');

const { ensureOnUpdateMethod } = require('../creator/engine-autofix.cjs');

const input = `import * as THREE from 'three';
export default class EngineEffect {
  onStart(ctx) {
    if (ctx && ctx.canvas) {
      const a = { x: 1 };
      if (a.x) {
        // nested braces
      }
    }
  }
  onResize(ctx) {}
  onDestroy() {}
  getUIConfig() { return []; }
  setParam() {}
}
`;

const out = ensureOnUpdateMethod(input);
assert.match(out, /\bonUpdate\s*\(/, 'should inject onUpdate when missing');
assert.match(out, /renderer\.render\s*\(/, 'injected onUpdate should render when possible');

const input2 = `import * as THREE from 'three';
export default class EngineEffect {
  onStart(ctx) {}
  onUpdate(ctx) { this.renderer.render(this.scene, this.camera); }
  onResize(ctx) {}
  onDestroy() {}
  getUIConfig() { return []; }
  setParam() {}
}
`;
const out2 = ensureOnUpdateMethod(input2);
assert.equal(out2, input2, 'should not change code if onUpdate already exists');

console.log('engine-autofix-onupdate.test.cjs passed');
