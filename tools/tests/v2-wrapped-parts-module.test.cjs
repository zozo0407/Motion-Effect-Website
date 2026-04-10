const assert = require('assert');
const { wrapAsEngineEffect, parseAIOutput, cleanSnippet } = require('../creator/v2-wrapped-parts.cjs');

// cleanSnippet: removes structure lines but keeps logic
{
  const inText = [
    "import * as THREE from 'three';",
    'export default class EngineEffect {',
    'class EngineEffect {',
    'export default EngineEffect;',
    'const x = 1;',
    'this.mesh.rotation.y += 0.01;'
  ].join('\n');
  const outText = cleanSnippet(inText);
  assert(!outText.includes('import * as THREE'), 'cleanSnippet should remove import lines');
  assert(!outText.includes('export default class'), 'cleanSnippet should remove export class lines');
  assert(!outText.includes('class EngineEffect'), 'cleanSnippet should remove class EngineEffect lines');
  assert(outText.includes('const x = 1;'), 'cleanSnippet should keep ordinary code');
}

// parseAIOutput: split and clean
{
  const raw = [
    '<think>do not leak</think>',
    '```js',
    "import * as THREE from 'three';",
    '// === setup ===',
    'this.mesh = new THREE.Mesh();',
    '---SPLIT---',
    '// === animate ===',
    'this.mesh.rotation.y += 0.01;',
    '```'
  ].join('\n');
  const { setup, animate } = parseAIOutput(raw, { stripMarkdown: true });
  assert(setup.includes('this.mesh = new THREE.Mesh()'), 'setup should contain logic');
  assert(!setup.includes('import * as THREE'), 'setup should be cleaned');
  assert(!setup.includes('<think>'), 'setup should not contain <think> prologue');
  assert(animate.includes('rotation.y'), 'animate should contain logic');
}

// wrapAsEngineEffect: must not be template-literal injected; should include required scaffolding
{
  const setup =
    "scene.background = new THREE.Color(0x0a0a0f);\nthis.a = `backtick`;\nthis.b = `${1+2}`;";
  const animate = 'this.a = this.a;';
  const code = wrapAsEngineEffect(setup, animate);
  assert(code.includes('export default class EngineEffect'), 'wrap should produce EngineEffect');
  assert(code.includes('onStart(ctx)'), 'wrap should include onStart');
  assert(code.includes('onUpdate(ctx)'), 'wrap should include onUpdate');
  // We are not asserting syntax validity here, but we ensure it contains the raw backticks and ${...}
  // without breaking the wrapper generation step itself.
  assert(code.includes('`backtick`'), 'wrap should carry through snippet content');
  assert(code.includes('${1+2}'), 'wrap should carry through snippet content');
}

// parseAIOutput: UI block (---UI---) should be extracted as JSON array
{
  const raw = [
    '// === setup ===',
    'this.mesh = new THREE.Mesh();',
    '---SPLIT---',
    '// === animate ===',
    'this.mesh.rotation.y += deltaTime;',
    '---UI---',
    JSON.stringify([
      { bind: 'primaryColor', name: '主色调', type: 'color', value: '#00f2ff' },
      { bind: 'speed', name: '速度', type: 'range', min: 0.1, max: 5, step: 0.05, value: 1.0 },
    ]),
  ].join('\n');
  const out = parseAIOutput(raw, { stripMarkdown: false });
  assert(out && typeof out === 'object', 'parseAIOutput should return object');
  assert(out.setup.includes('this.mesh'), 'setup should contain logic');
  assert(out.animate.includes('rotation.y'), 'animate should contain logic');
  assert(Array.isArray(out.uiConfig), 'uiConfig should be an array when ---UI--- is present');
  assert(out.uiConfig.length === 2, 'uiConfig should have 2 items');
  assert(out.uiConfig[0].bind === 'primaryColor', 'first bind should match');
}

// parseAIOutput: UI validation should drop invalid items and cap at 6
{
  const ui = [
    { bind: 'ok1', name: 'A', type: 'range', min: 0, max: 1, value: 0.5 },
    { bind: 'ok2', name: 'B', type: 'color', value: '#ffffff' },
    { bind: 'bad-bind-!', name: 'BAD', type: 'range', min: 0, max: 1, value: 0.5 },
    { bind: 'ok3', name: 'C', type: 'checkbox', value: true },
    { bind: 'ok4', name: 'D', type: 'select', options: ['x', 'y'], value: 'x' },
    { bind: 'ok5', name: 'E', type: 'range', min: 0, max: 10, value: 2 },
    { bind: 'ok6', name: 'F', type: 'range', min: 0, max: 10, value: 3 },
    { bind: 'ok7', name: 'G', type: 'range', min: 0, max: 10, value: 4 },
    { bind: 'badType', name: 'H', type: 'text', value: 'nope' },
  ];
  const raw = ['this.group = new THREE.Group();', '---SPLIT---', 'this.group.rotation.y = time;', '---UI---', JSON.stringify(ui)].join(
    '\n',
  );
  const out = parseAIOutput(raw, { stripMarkdown: false });
  assert(Array.isArray(out.uiConfig), 'uiConfig should exist');
  assert(out.uiConfig.length === 6, 'uiConfig should be capped at 6');
  assert(
    out.uiConfig.every((it) => ['color', 'range', 'checkbox', 'select'].includes(it.type)),
    'only allowed types',
  );
  assert(out.uiConfig.every((it) => /^[A-Za-z_][A-Za-z0-9_]{0,31}$/.test(it.bind)), 'bind regex enforced');
}

console.log('v2-wrapped-parts-module.test.cjs passed');
