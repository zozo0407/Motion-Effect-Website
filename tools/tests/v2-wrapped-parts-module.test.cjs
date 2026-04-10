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

// wrapAsEngineEffect: should bridge setup locals into onUpdate when AI forgets `this.`
{
  const setup = [
    'const cubeGroup = new THREE.Group();',
    'const angles = [0, 1, 2];',
    'scene.add(cubeGroup);',
  ].join('\n');
  const animate = [
    'cubeGroup.rotation.y += deltaTime;',
    'angles[0] += 0.1;',
  ].join('\n');
  const code = wrapAsEngineEffect(setup, animate);
  assert(
    code.includes('let cubeGroup = this.cubeGroup = new THREE.Group();'),
    'setup local should be mirrored onto this for cross-method access',
  );
  assert(code.includes('let angles = this.angles = [0, 1, 2];'), 'setup array local should be mirrored onto this');
  assert(code.includes('let cubeGroup = this.cubeGroup;'), 'onUpdate should rehydrate mirrored local from this');
  assert(code.includes('let angles = this.angles;'), 'onUpdate should rehydrate array local from this');
  assert(code.includes('this.cubeGroup = cubeGroup;'), 'onUpdate should sync local back to this');
  assert(code.includes('this.angles = angles;'), 'onUpdate should sync array local back to this');
}

// wrapAsEngineEffect: should fall back to creating its own renderer if ctx.canvas WebGL init fails
{
  const code = wrapAsEngineEffect('this.group = new THREE.Group();\nscene.add(this.group);', 'this.group.rotation.y += deltaTime;');
  assert(
    code.includes("try {") && code.includes("this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });"),
    'wrapper should attempt ctx.canvas renderer first',
  );
  assert(code.includes("this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });"), 'wrapper should have fallback renderer init');
  assert(
    code.includes("canvas.parentNode.replaceChild(this.renderer.domElement, canvas);") ||
      code.includes("container.appendChild(this.renderer.domElement);"),
    'wrapper should attach fallback canvas into DOM',
  );
}

// wrapAsEngineEffect: should inject safe default lights to avoid black unlit Phong/Standard materials
{
  const code = wrapAsEngineEffect(
    "const material = new THREE.MeshPhongMaterial({ color: 0xffaa00 });\nthis.mesh = new THREE.Mesh(new THREE.BoxGeometry(1,1,1), material);\nscene.add(this.mesh);",
    'this.mesh.rotation.y += deltaTime;',
  );
  assert(code.includes('this.__defaultAmbientLight = new THREE.AmbientLight('), 'wrapper should add default ambient light');
  assert(code.includes('this.__defaultKeyLight = new THREE.DirectionalLight('), 'wrapper should add default directional light');
  assert(code.includes('scene.add(this.__defaultAmbientLight);'), 'wrapper should attach ambient light to scene');
  assert(code.includes('scene.add(this.__defaultKeyLight);'), 'wrapper should attach key light to scene');
}

console.log('v2-wrapped-parts-module.test.cjs passed');
