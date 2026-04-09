const assert = require('assert');
const { defaultBlueprint } = require('../creator/effect-blueprint.cjs');

const bp = defaultBlueprint('极简风，柔和配色，旋转几何体');
assert(typeof bp.title === 'string' && bp.title.length > 0);
assert(Array.isArray(bp.palette));
assert(bp.scene && typeof bp.scene === 'object');
assert(bp.camera && typeof bp.camera === 'object');
assert(bp.animation && typeof bp.animation === 'object');
assert(Array.isArray(bp.params) && bp.params.length >= 2 && bp.params.length <= 5);
assert(bp.params.every(p => typeof p.bind === 'string' && p.bind.length > 0));

console.log('effect-blueprint-default.test.cjs passed');
