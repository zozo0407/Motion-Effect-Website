const assert = require('node:assert/strict');

const { buildMinimalFallbackPayload } = require('../creator/minimal-fallback.cjs');

const payload = buildMinimalFallbackPayload({
  reason: 'Upstream AI request timed out',
  prompt: 'any prompt'
});

assert.equal(payload.degraded, true);
assert.equal(typeof payload.degradedReason, 'string');
assert(payload.degradedReason.includes('timed out'));
assert.equal(typeof payload.code, 'string');

// Very basic contract/visibility checks (string-level)
assert(/import \* as THREE from 'three';/.test(payload.code));
assert(/export default class EngineEffect/.test(payload.code));
assert(/\bonStart\s*\(/.test(payload.code));
assert(/\bonUpdate\s*\(/.test(payload.code));
assert(/new THREE\.WebGLRenderer\s*\(/.test(payload.code));
assert(/\.render\s*\(/.test(payload.code));

console.log('minimal-fallback.test.cjs passed');
