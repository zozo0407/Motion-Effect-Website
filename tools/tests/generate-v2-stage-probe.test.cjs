const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { buildCodeMessages, defaultBlueprint } = require('../creator/effect-blueprint.cjs');

const serverPath = path.join(__dirname, '..', '..', 'server.js');
const server = fs.readFileSync(serverPath, 'utf8');

assert(server.includes('async function runV2Stage('), 'server.js should define a runV2Stage helper');
assert(server.includes("[v2][${stage}] start"), 'server.js should log stage start');
assert(server.includes("[v2][${stage}] response status="), 'server.js should log stage response status');
assert(server.includes("[v2][${stage}] timeout"), 'server.js should log stage timeout');
assert(server.includes("stage: 'blueprint'"), 'generateEffectV2FromPrompt should call runV2Stage for blueprint');
assert(server.includes("stage: 'code'"), 'generateEffectV2FromPrompt should call runV2Stage for code');
assert(server.includes('timeoutMs: 25000'), 'blueprint stage should have a dedicated timeout');
assert(server.includes('timeoutMs: 90000'), 'code stage should have a dedicated timeout');

const prompt = '极简风，柔和配色，旋转几何体';
const messages = buildCodeMessages(prompt, defaultBlueprint(prompt), 'contract');

assert(messages.system.includes("import * as THREE from 'three';"), 'system prompt should require the THREE namespace import');
assert(messages.system.includes('不要假设 ctx.scene'), 'system prompt should forbid assuming ctx.scene exists');
assert(messages.system.includes('onStart(ctx)'), 'system prompt should enumerate required lifecycle methods');
assert(messages.system.includes('避免复杂后处理'), 'system prompt should discourage complex postprocessing');
assert(messages.user.includes('参考合规框架摘要'), 'user prompt should include the reference summary heading');
assert(messages.user.includes('new THREE.Scene()'), 'user prompt should reference creating a new THREE.Scene()');
assert(messages.user.includes("new THREE.WebGLRenderer({ canvas: ctx.canvas })"), 'user prompt should reference renderer creation from ctx.canvas');
assert(messages.user.includes('renderer.render(scene, camera)'), 'user prompt should reference renderer.render(scene, camera)');

console.log('generate-v2-stage-probe.test.cjs passed');
