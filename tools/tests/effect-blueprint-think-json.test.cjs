const assert = require('assert');
const { parseBlueprintResponse } = require('../creator/effect-blueprint.cjs');

const raw = `<think>\nplan\n</think>\n\n{\n  \"title\": \"Nebula Ring\",\n  \"summary\": \"soft neon ring\",\n  \"palette\": [\"#00f0ff\", \"#8b5cf6\"],\n  \"scene\": {\"background\": \"#0a0a1a\", \"fog\": true},\n  \"camera\": {\"fov\": 55, \"distance\": 5.5},\n  \"animation\": {\"motion\": \"rotate and pulse\"},\n  \"params\": [{\"bind\": \"speed\", \"name\": \"速度\", \"type\": \"range\", \"value\": 1.2, \"min\": 0.2, \"max\": 3, \"step\": 0.1}]\n}\n`;

const parsed = parseBlueprintResponse(raw);
assert.equal(parsed.title, 'Nebula Ring');
assert.equal(parsed.params[0].bind, 'speed');

console.log('effect-blueprint-think-json.test.cjs passed');
