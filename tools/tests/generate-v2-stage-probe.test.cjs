const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { buildCodeMessages, defaultBlueprint } = require('../creator/effect-blueprint.cjs');

const aiProvider = fs.readFileSync(path.join(__dirname, '..', '..', 'server', 'services', 'ai-provider.js'), 'utf8');
const aiGenerator = fs.readFileSync(path.join(__dirname, '..', '..', 'server', 'services', 'ai-generator.js'), 'utf8');

assert(aiProvider.includes('async function runV2Stage('), 'ai-provider.js should define a runV2Stage helper');
assert(aiProvider.includes('[v2][${stage}] start'), 'ai-provider.js should log stage start');
assert(aiProvider.includes('[v2][${stage}] response status='), 'ai-provider.js should log stage response status');
assert(aiProvider.includes('[v2][${stage}] timeout'), 'ai-provider.js should log stage timeout');
assert(aiGenerator.includes("stage: 'blueprint'"), 'generateEffectV2FromPrompt should call runV2Stage for blueprint');
assert(aiGenerator.includes("stage: 'code'"), 'generateEffectV2FromPrompt should call runV2Stage for code');
assert(
  aiGenerator.includes('timeoutMs: 25000') || aiGenerator.includes('timeoutMs: blueprintTimeoutMs'),
  'blueprint stage should pass a dedicated timeout to runV2Stage'
);
assert(
  aiGenerator.includes('timeoutMs: 90000') || aiGenerator.includes('timeoutMs: codeTimeoutMs'),
  'code stage should pass a dedicated timeout to runV2Stage'
);
assert(
  aiGenerator.includes('const blueprintTimeoutMs') && aiGenerator.includes(': 25000'),
  'ai-generator.js should define blueprintTimeoutMs default 25000ms'
);
assert(
  aiGenerator.includes('const codeTimeoutMs') && aiGenerator.includes(': 90000'),
  'ai-generator.js should define codeTimeoutMs default 90000ms'
);

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

