const assert = require('assert');
const {
  buildBlueprintMessages,
  buildCodeMessages,
  parseBlueprintResponse
} = require('../creator/effect-blueprint.cjs');

const blueprintMessages = buildBlueprintMessages('极简风，柔和配色，旋转几何体');
assert(blueprintMessages.system.includes('只输出 JSON'), 'stage 1 system prompt should require pure JSON');
assert(blueprintMessages.user.includes('极简风'), 'stage 1 user prompt should include the original request');

const parsed = parseBlueprintResponse('```json\n{"title":"Nebula Ring","summary":"soft neon ring","palette":["#00f0ff","#8b5cf6"],"scene":{"background":"#0a0a1a","fog":true},"camera":{"fov":55,"distance":5.5},"animation":{"motion":"rotate and pulse"},"params":[{"bind":"primaryColor","name":"主色调","type":"color","value":"#00f0ff"},{"bind":"speed","name":"速度","type":"range","value":1.2,"min":0.2,"max":3,"step":0.1}]}\n```');
assert.equal(parsed.title, 'Nebula Ring');
assert.equal(parsed.params.length, 2);
assert.equal(parsed.params[0].bind, 'primaryColor');

const codeMessages = buildCodeMessages('极简风，柔和配色，旋转几何体', parsed, 'contract');
assert(codeMessages.system.includes('EngineEffect'), 'stage 2 system prompt should mention EngineEffect contract');
assert(codeMessages.user.includes('"title": "Nebula Ring"'), 'stage 2 user prompt should embed blueprint JSON');

console.log('effect-blueprint.test.cjs passed');
