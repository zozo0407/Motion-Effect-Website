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

console.log('v2-wrapped-parts-module.test.cjs passed');
