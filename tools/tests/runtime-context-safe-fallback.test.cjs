const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.join(__dirname, '..', '..');
const wizard = fs.readFileSync(path.join(root, 'src', 'site', 'wizard.js'), 'utf8');
const server = fs.readFileSync(path.join(root, 'server.js'), 'utf8');

assert(!wizard.includes('this.scene = ctx.scene;'), 'wizard fallback must not assume ctx.scene exists');
assert(!wizard.includes('this.camera = ctx.camera;'), 'wizard fallback must not assume ctx.camera exists');
assert(!wizard.includes('this.renderer = ctx.renderer;'), 'wizard fallback must not assume ctx.renderer exists');
assert(wizard.includes('new THREE.Scene()'), 'wizard fallback should create its own THREE.Scene');
assert(wizard.includes('new THREE.WebGLRenderer'), 'wizard fallback should create its own renderer');

assert(!server.includes('this.scene = ctx.scene;'), 'server auto-fix must not inject ctx.scene usage');
assert(server.includes('new THREE.Scene()'), 'server auto-fix should create its own THREE.Scene');

console.log('runtime-context-safe-fallback.test.cjs passed');
