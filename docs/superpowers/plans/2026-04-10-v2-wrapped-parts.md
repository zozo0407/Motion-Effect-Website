# V2 Wrapped Parts Generation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/api/generate-effect-v2` optionally use a safer "wrapped_parts" mode where the model outputs only `setup+animate` snippets and backend wraps them into a fixed `EngineEffect` template, improving success rate.

**Architecture:** Add a small helper module `tools/creator/v2-wrapped-parts.cjs` for `wrapAsEngineEffect/parseAIOutput/cleanSnippet`. Wire it into `server.js` guarded by env `AI_V2_OUTPUT_MODE=wrapped_parts`, but only for `/api/generate-effect-v2` via `options.outputMode` to avoid impacting `/api/generate-effect?v=2`.

**Tech Stack:** Node.js (CommonJS), Express, Three.js, existing v2 pipeline (`runV2Stage`, `autoFixEngineEffectCode`, `validateEngineEffectCode`, `repairEngineEffectCode`, budget + minimal fallback).

---

## File Map

**Create**
- `tools/creator/v2-wrapped-parts.cjs` (exports: `wrapAsEngineEffect`, `parseAIOutput`, `cleanSnippet`, optionally `buildWrappedPartsSystemPrompt`)
- `tools/tests/v2-wrapped-parts-module.test.cjs` (unit tests for wrapping/parsing/cleaning)
- `tools/tests/v2-wrapped-parts-wiring.test.cjs` (static wiring tests against `server.js`)

**Modify**
- `server.js` (use module; add `wrapped_parts` branch inside `generateEffectV2FromPrompt`; pass `outputMode` only from `/api/generate-effect-v2`)

---

### Task 1: Add Failing Tests (Wiring + Unit)

**Files:**
- Create: `tools/tests/v2-wrapped-parts-wiring.test.cjs`
- Create: `tools/tests/v2-wrapped-parts-module.test.cjs`

- [ ] **Step 1: Write wiring test (static assertions)**

Create `tools/tests/v2-wrapped-parts-wiring.test.cjs`:

```js
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const serverPath = path.join(__dirname, '..', '..', 'server.js');
const server = fs.readFileSync(serverPath, 'utf8');

// Implementation must read outputMode from options, not directly from env,
// so /api/generate-effect?v=2 is not changed accidentally.
assert(
  server.includes('options.outputMode'),
  'generateEffectV2FromPrompt should read outputMode from options.outputMode (not process.env)'
);

// /api/generate-effect-v2 must pass env into options.outputMode
assert(
  server.includes('outputMode: process.env.AI_V2_OUTPUT_MODE'),
  '/api/generate-effect-v2 should pass outputMode: process.env.AI_V2_OUTPUT_MODE into generateEffectV2FromPrompt'
);

// v=2 branch must NOT pass outputMode
const v2BranchStart = server.indexOf("if (req && req.query && String(req.query.v || '') === '2') {");
assert(v2BranchStart >= 0, 'server.js should contain the v=2 branch');
const v2BranchEnd = server.indexOf('const style = await classifyStyle', v2BranchStart);
assert(v2BranchEnd > v2BranchStart, 'server.js should contain non-v2 branch after v=2 branch');
const v2Branch = server.slice(v2BranchStart, v2BranchEnd);
assert(
  !v2Branch.includes('AI_V2_OUTPUT_MODE') && !v2Branch.includes('outputMode:'),
  'v=2 branch should not pass outputMode (keep default two-stage behavior)'
);

console.log('v2-wrapped-parts-wiring.test.cjs passed');
```

- [ ] **Step 2: Write unit test for helper module**

Create `tools/tests/v2-wrapped-parts-module.test.cjs`:

```js
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
    "```js",
    "import * as THREE from 'three';",
    "// === setup ===",
    "this.mesh = new THREE.Mesh();",
    "---SPLIT---",
    "// === animate ===",
    "this.mesh.rotation.y += 0.01;",
    "```"
  ].join('\n');
  const { setup, animate } = parseAIOutput(raw, { stripMarkdown: true });
  assert(setup.includes('this.mesh = new THREE.Mesh()'), 'setup should contain logic');
  assert(!setup.includes('import * as THREE'), 'setup should be cleaned');
  assert(animate.includes('rotation.y'), 'animate should contain logic');
}

// wrapAsEngineEffect: must not be template-literal injected; should include required scaffolding
{
  const setup = "scene.background = new THREE.Color(0x0a0a0f);\nthis.a = `backtick`;\nthis.b = `${1+2}`;";
  const animate = "this.a = this.a;";
  const code = wrapAsEngineEffect(setup, animate);
  assert(code.includes("export default class EngineEffect"), 'wrap should produce EngineEffect');
  assert(code.includes('onStart(ctx)'), 'wrap should include onStart');
  assert(code.includes('onUpdate(ctx)'), 'wrap should include onUpdate');
  // We are not asserting syntax validity here, but we ensure it contains the raw backticks and ${...}
  // without breaking the wrapper generation step itself.
  assert(code.includes('`backtick`'), 'wrap should carry through snippet content');
  assert(code.includes('${1+2}'), 'wrap should carry through snippet content');
}

console.log('v2-wrapped-parts-module.test.cjs passed');
```

- [ ] **Step 3: Run tests to confirm they fail (module missing)**

Run:

```bash
node tools/tests/v2-wrapped-parts-wiring.test.cjs
node tools/tests/v2-wrapped-parts-module.test.cjs
```

Expected:
- Wiring test fails because `options.outputMode` and v2 route wiring are not implemented yet.
- Module test fails because `tools/creator/v2-wrapped-parts.cjs` does not exist yet.

- [ ] **Step 4: Commit tests**

```bash
git add tools/tests/v2-wrapped-parts-wiring.test.cjs tools/tests/v2-wrapped-parts-module.test.cjs
git commit -m "test: add wrapped_parts wiring and module tests"
```

---

### Task 2: Implement Helper Module (wrap/parse/clean)

**Files:**
- Create: `tools/creator/v2-wrapped-parts.cjs`
- Test: `tools/tests/v2-wrapped-parts-module.test.cjs`

- [ ] **Step 1: Implement `tools/creator/v2-wrapped-parts.cjs`**

Create `tools/creator/v2-wrapped-parts.cjs`:

```js
'use strict';

function cleanSnippet(code) {
  return String(code || '')
    .split('\n')
    .filter((line) => {
      const t = String(line || '').trim();
      if (!t) return true;
      if (t.startsWith('```')) return false;
      if (t.startsWith('import ')) return false;
      if (t.startsWith('export default class')) return false;
      if (t.startsWith('export class')) return false;
      if (t.startsWith('class EngineEffect')) return false;
      if (t.startsWith('export default EngineEffect')) return false;
      return true;
    })
    .join('\n')
    .trim();
}

// Keep in sync with server.js stripMarkdownCodeFence behavior.
function stripMarkdownCodeFence(text) {
  if (typeof text !== 'string') return '';
  const m = text.match(/```[a-zA-Z0-9_-]*\s*\n([\s\S]*?)\n```/);
  return m ? m[1] : text;
}

function parseAIOutput(rawText, options = {}) {
  const strip = options.stripMarkdown !== false;
  const cleaned = (strip ? stripMarkdownCodeFence(rawText) : String(rawText || '')).trim();

  if (cleaned.includes('---SPLIT---')) {
    const parts = cleaned.split(/---SPLIT---/);
    let setup = (parts[0] || '').trim();
    let animate = (parts[1] || '').trim();
    setup = cleanSnippet(setup);
    animate = cleanSnippet(animate);
    if (setup) return { setup, animate: animate || '' };
  }

  return { setup: cleanSnippet(cleaned), animate: '' };
}

function wrapAsEngineEffect(setupCode, animateCode) {
  const setupLines = String(setupCode || '').split('\n');
  const animateLines = String(animateCode || '').split('\n');

  // IMPORTANT: Do NOT use template literals to embed AI code. Use join() to avoid `${}` / backtick breakage.
  const out = [];
  out.push("import * as THREE from 'three';");
  out.push('');
  out.push('export default class EngineEffect {');
  out.push('  constructor() {');
  out.push('    this.params = {};');
  out.push('    this.scene = null;');
  out.push('    this.camera = null;');
  out.push('    this.renderer = null;');
  out.push('  }');
  out.push('');
  out.push('  getUIConfig() { return []; }');
  out.push('');
  out.push('  setParam(key, value) {');
  out.push('    this.params = this.params || {};');
  out.push('    this.params[key] = value;');
  out.push('    if (this.material && this.material.uniforms) {');
  out.push("      const name = 'u' + String(key || '').charAt(0).toUpperCase() + String(key || '').slice(1);");
  out.push('      const u = this.material.uniforms[name];');
  out.push("      if (u && u.value && typeof u.value.set === 'function' && typeof value === 'string') u.value.set(value);");
  out.push("      else if (u && Object.prototype.hasOwnProperty.call(u, 'value')) u.value = value;");
  out.push('    }');
  out.push("    if (this.material && this.material.color && typeof this.material.color.set === 'function' && typeof value === 'string') this.material.color.set(value);");
  out.push('  }');
  out.push('');
  out.push('  onStart(ctx) {');
  out.push('    const size = (ctx && ctx.size) ? ctx.size : (ctx || {});');
  out.push('    const canvas = ctx && ctx.canvas ? ctx.canvas : undefined;');
  out.push('    const width = Math.max(1, Math.floor(size.width || 1));');
  out.push('    const height = Math.max(1, Math.floor(size.height || 1));');
  out.push('    const dpr = Math.max(1, Math.min(2, Number(size.dpr) || 1));');
  out.push('    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });');
  out.push('    this.renderer.setPixelRatio(dpr);');
  out.push('    this.renderer.setSize(width, height, false);');
  out.push('    this.renderer.outputColorSpace = THREE.SRGBColorSpace;');
  out.push('    this.scene = new THREE.Scene();');
  out.push('    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);');
  out.push('    this.camera.position.set(0, 0, 5);');
  out.push('    this.scene.add(this.camera);');
  out.push('    const scene = this.scene;');
  out.push('    const camera = this.camera;');
  out.push('    const renderer = this.renderer;');
  out.push('    // ===== AI 生成的 setup 代码 =====');
  for (const line of setupLines) out.push(`    ${line}`);
  out.push('    // ===== setup 结束 =====');
  out.push('  }');
  out.push('');
  out.push('  onUpdate(ctx) {');
  out.push("    const time = (ctx && typeof ctx.time === 'number') ? ctx.time : 0;");
  out.push("    const deltaTime = (ctx && typeof ctx.deltaTime === 'number') ? ctx.deltaTime : 0.016;");
  out.push('    // ===== AI 生成的 animate 代码 =====');
  for (const line of animateLines) out.push(`    ${line}`);
  out.push('    // ===== animate 结束 =====');
  out.push('    if (this.renderer && this.scene && this.camera) this.renderer.render(this.scene, this.camera);');
  out.push('  }');
  out.push('');
  out.push('  onResize(size) {');
  out.push('    if (!this.camera || !this.renderer) return;');
  out.push('    const width = Math.max(1, Math.floor(size && size.width ? size.width : 1));');
  out.push('    const height = Math.max(1, Math.floor(size && size.height ? size.height : 1));');
  out.push('    const dpr = Math.max(1, Math.min(2, Number(size && size.dpr) || 1));');
  out.push('    this.camera.aspect = width / height;');
  out.push('    this.camera.updateProjectionMatrix();');
  out.push('    this.renderer.setPixelRatio(dpr);');
  out.push('    this.renderer.setSize(width, height, false);');
  out.push('  }');
  out.push('');
  out.push('  onDestroy() {');
  out.push('    if (this.renderer) this.renderer.dispose();');
  out.push('    if (this.scene) {');
  out.push('      this.scene.traverse(child => {');
  out.push('        if (child.geometry) child.geometry.dispose();');
  out.push('        if (child.material) {');
  out.push('          if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());');
  out.push('          else child.material.dispose();');
  out.push('        }');
  out.push('      });');
  out.push('    }');
  out.push('    this.renderer = null;');
  out.push('    this.scene = null;');
  out.push('    this.camera = null;');
  out.push('  }');
  out.push('}');
  return out.join('\n');
}

module.exports = { cleanSnippet, parseAIOutput, wrapAsEngineEffect };
```

- [ ] **Step 2: Run unit test**

Run:

```bash
node tools/tests/v2-wrapped-parts-module.test.cjs
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add tools/creator/v2-wrapped-parts.cjs
git commit -m "feat: add wrapped_parts helper module"
```

---

### Task 3: Wire Wrapped Parts Into `server.js` (No Behavior Change By Default)

**Files:**
- Modify: `server.js`
- Test: `tools/tests/v2-wrapped-parts-wiring.test.cjs`
- Test: existing `tools/tests/generate-v2-stage-probe.test.cjs` (must keep passing)

- [ ] **Step 1: Add `require`**

In `server.js` near other creator imports, add:

```js
const { wrapAsEngineEffect, parseAIOutput } = require('./tools/creator/v2-wrapped-parts.cjs');
```

- [ ] **Step 2: Update `generateEffectV2FromPrompt` signature and outputMode source**

Ensure it reads:

```js
async function generateEffectV2FromPrompt(prompt, apiKey, baseUrl, model, options = {}) {
  const outputMode = String(options.outputMode || '').trim();
  // keep existing codeTimeoutMs/blueprintTimeoutMs handling
```

Do NOT change the default blueprint+code logic, except wrapping it with:

```js
if (outputMode === 'wrapped_parts') {
  // new one-shot "parts" stage:
  // - runV2Stage({ stage: 'parts', ... timeoutMs: codeTimeoutMs })
  // - parseAIOutput(content)
  // - return wrapAsEngineEffect(setup, animate)
}
// else: existing blueprint+code implementation remains identical
```

Notes:
- Use existing `runV2Stage` (not a new fetch function) so logs/retry behavior remains consistent.
- Keep `normalizeThreeNamespaceImport` / `stripMarkdownCodeFence` etc for the default path as-is so existing tests keep passing.

- [ ] **Step 3: Pass `outputMode` only from `/api/generate-effect-v2`**

In `/api/generate-effect-v2` route, update call site:

```js
return generateEffectV2FromPrompt(prompt, provider.apiKey, provider.baseUrl, provider.model, {
  outputMode: process.env.AI_V2_OUTPUT_MODE,
  codeTimeoutMs: Math.max(1000, Math.min(90000, remainingBudgetMs() - 1500))
});
```

Do NOT add `outputMode` to `/api/generate-effect?v=2` branch; keep it calling:

```js
generateEffectV2FromPrompt(prompt, apiKey, baseUrl, model)
```

- [ ] **Step 4: Run wiring test + existing static tests**

Run:

```bash
node tools/tests/v2-wrapped-parts-wiring.test.cjs
node tools/tests/generate-v2-stage-probe.test.cjs
node tools/tests/generate-v2-total-budget-wiring.test.cjs
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add server.js tools/tests/v2-wrapped-parts-wiring.test.cjs
git commit -m "feat: add wrapped_parts mode for generate-effect-v2"
```

---

### Task 4: Full Verification (Local)

**Files:**
- None (runtime verification)

- [ ] **Step 1: Run a quick offline suite (static/unit tests)**

Run:

```bash
node tools/tests/v2-wrapped-parts-module.test.cjs
node tools/tests/v2-wrapped-parts-wiring.test.cjs
node tools/tests/generate-v2-stage-probe.test.cjs
node tools/tests/ban-three-helpers.test.cjs
node tools/tests/unsafe-helper-ctx-usage.test.cjs
```

Expected: PASS

- [ ] **Step 2: Start server and smoke test with curl**

Run (wrapped_parts enabled):

```bash
AI_V2_TOTAL_BUDGET_MS=90000 AI_V2_OUTPUT_MODE=wrapped_parts node server.js
```

In another terminal:

```bash
for i in 1 2 3 4 5; do
  echo "--- run $i"
  curl -s -X POST -H "Content-Type: application/json" \
    -d '{"prompt":"紫色发光粒子漩涡，中心脉冲，带轻微雾感"}' \
    "http://localhost:3000/api/generate-effect-v2" | \
    python3 -c '
import sys, json, re
d = json.load(sys.stdin)
code = d.get("code","")
print("degraded=", bool(d.get("degraded")), "len=", len(code))
print("export=", bool(re.search(r"export\\s+default\\s+class\\s+EngineEffect", code)))
'
done
```

Expected:
- Mostly `degraded=false`
- Always returns valid `export default class EngineEffect` (or minimal fallback when degraded)

- [ ] **Step 3: Web manual check**

Open `http://localhost:3000` and generate a few prompts in the Wizard.
Expected: fewer contract/runtime errors; faster fallback if upstream is slow.

