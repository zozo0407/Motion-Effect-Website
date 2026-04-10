# Wrapped Parts UI Config Implementation Plan
 
> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
 
**Goal:** In `AI_V2_OUTPUT_MODE=wrapped_parts`, have the model generate effect-specific Lab left-panel controls by outputting a strict `---UI---` JSON block, safely parsed/validated server-side and exposed via `EngineEffect.getUIConfig()`.
 
**Architecture:** Extend the wrapped_parts contract to include a third section (`---UI---` + pure JSON). Backend parses and validates that JSON (max 6 controls, whitelisted types) and bakes it into the wrapped `EngineEffect` module.
 
**Tech Stack:** Node.js (CommonJS), Express, existing V2 pipeline (`runV2Stage`), existing wrapped_parts helper (`tools/creator/v2-wrapped-parts.cjs`), Lab UI handshake (`HANDSHAKE` -> `UI_CONFIG`) in `src/site/templates.js` and UI renderer in `src/site/lab.js`.
 
---
 
## File Map
 
**Modify**
- `server.js` (wrapped_parts system prompt + pass parsed UI config into wrapper)
- `tools/creator/v2-wrapped-parts.cjs` (parse `---UI---`, validate UI, bake UI into wrapper output)
- `tools/tests/v2-wrapped-parts-module.test.cjs` (add unit tests for UI parsing/validation)
 
---
 
### Task 1: Add Unit Tests For `---UI---` Parsing & Validation
 
**Files:**
- Modify: `tools/tests/v2-wrapped-parts-module.test.cjs`
 
- [ ] **Step 1: Add a test for parsing UI JSON**
 
Append to `tools/tests/v2-wrapped-parts-module.test.cjs`:
 
```js
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
      { bind: 'speed', name: '速度', type: 'range', min: 0.1, max: 5, step: 0.05, value: 1.0 }
    ])
  ].join('\\n');
  const out = parseAIOutput(raw, { stripMarkdown: false });
  assert(out && typeof out === 'object', 'parseAIOutput should return object');
  assert(out.setup.includes('this.mesh'), 'setup should contain logic');
  assert(out.animate.includes('rotation.y'), 'animate should contain logic');
  assert(Array.isArray(out.uiConfig), 'uiConfig should be an array when ---UI--- is present');
  assert(out.uiConfig.length === 2, 'uiConfig should have 2 items');
  assert(out.uiConfig[0].bind === 'primaryColor', 'first bind should match');
}
```
 
- [ ] **Step 2: Add a test for validation limits (max 6 controls + bind regex + type allowlist)**
 
Append:
 
```js
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
  const raw = [
    'this.group = new THREE.Group();',
    '---SPLIT---',
    'this.group.rotation.y = time;',
    '---UI---',
    JSON.stringify(ui)
  ].join('\\n');
  const out = parseAIOutput(raw, { stripMarkdown: false });
  assert(Array.isArray(out.uiConfig), 'uiConfig should exist');
  assert(out.uiConfig.length === 6, 'uiConfig should be capped at 6');
  assert(out.uiConfig.every((it) => ['color','range','checkbox','select'].includes(it.type)), 'only allowed types');
  assert(out.uiConfig.every((it) => /^[A-Za-z_][A-Za-z0-9_]{0,31}$/.test(it.bind)), 'bind regex enforced');
}
```
 
- [ ] **Step 3: Run the unit test**
 
Run:
 
```bash
node tools/tests/v2-wrapped-parts-module.test.cjs
```
 
Expected: FAIL until Task 2 is implemented.
 
- [ ] **Step 4: Commit**
 
```bash
git add tools/tests/v2-wrapped-parts-module.test.cjs
git commit -m "test: add wrapped_parts UI parsing/validation coverage"
```
 
---
 
### Task 2: Implement `---UI---` Parsing + Validation + Wrapper Baking
 
**Files:**
- Modify: `tools/creator/v2-wrapped-parts.cjs`
- Test: `tools/tests/v2-wrapped-parts-module.test.cjs`
 
- [ ] **Step 1: Extend `parseAIOutput()` to split `---UI---`**
 
In `tools/creator/v2-wrapped-parts.cjs`, update `parseAIOutput(rawText, options)` to:
 
```js
// Pseudocode shape (implement in-file with existing helpers):
// 1) strip fences + prologues (existing)
// 2) split by ---UI--- (optional)
// 3) parse JSON array from UI part (best-effort)
// 4) split main code by ---SPLIT--- into setup/animate (existing)
// 5) return { setup, animate, uiConfig }
```
 
Implementation requirements:
- If `---UI---` not present -> `uiConfig = null`.
- UI parsing must be tolerant:
  - Try `JSON.parse(trimmed)`.
  - If that fails, attempt to extract the first JSON array substring from the text (between first `[` and last `]`) and parse again.
- Apply validation (next step) before returning `uiConfig`.
 
- [ ] **Step 2: Add `validateAndNormalizeUIConfig(raw)`**
 
Add a helper in `tools/creator/v2-wrapped-parts.cjs`:
 
```js
function validateAndNormalizeUIConfig(raw) {
  const MAX_ITEMS = 6;
  const MAX_SELECT_OPTIONS = 10;
  const bindRe = /^[A-Za-z_][A-Za-z0-9_]{0,31}$/;
  const allowed = new Set(['color', 'range', 'checkbox', 'select']);
  const arr = Array.isArray(raw) ? raw : [];
  const out = [];
  for (const item of arr) {
    if (!item || typeof item !== 'object') continue;
    const bind = typeof item.bind === 'string' ? item.bind.trim() : '';
    const type = typeof item.type === 'string' ? item.type.trim() : '';
    const name = typeof item.name === 'string' ? item.name.trim() : bind;
    if (!bindRe.test(bind)) continue;
    if (!allowed.has(type)) continue;
    if (!name) continue;
 
    const normalized = { bind, name, type };
 
    if (type === 'color') {
      const v = typeof item.value === 'string' ? item.value.trim() : '';
      normalized.value = v && v.startsWith('#') ? v : '#00f2ff';
      out.push(normalized);
    } else if (type === 'checkbox') {
      normalized.value = !!item.value;
      out.push(normalized);
    } else if (type === 'select') {
      const opts = Array.isArray(item.options) ? item.options.filter((x) => typeof x === 'string') : [];
      const options = opts.slice(0, MAX_SELECT_OPTIONS);
      if (!options.length) continue;
      normalized.options = options;
      const v = item.value;
      if (typeof v === 'number' && Number.isFinite(v) && v >= 0 && v < options.length) normalized.value = v;
      else if (typeof v === 'string' && options.includes(v)) normalized.value = v;
      else normalized.value = options[0];
      out.push(normalized);
    } else {
      // range
      const toNum = (x, d) => {
        const n = (typeof x === 'number') ? x : parseFloat(String(x));
        return Number.isFinite(n) ? n : d;
      };
      let min = toNum(item.min, 0);
      let max = toNum(item.max, 1);
      let step = toNum(item.step, 0.01);
      let value = toNum(item.value, min);
      if (max < min) { const t = max; max = min; min = t; }
      if (step <= 0) step = 0.01;
      value = Math.max(min, Math.min(max, value));
      normalized.min = min;
      normalized.max = max;
      normalized.step = step;
      normalized.value = value;
      out.push(normalized);
    }
 
    if (out.length >= MAX_ITEMS) break;
  }
  return out;
}
```
 
- [ ] **Step 3: Bake validated UI into `wrapAsEngineEffect(setup, animate, uiConfig)`**
 
Update `wrapAsEngineEffect` signature and output:
 
Requirements:
- Add a top-level constant after the `three` import:
  - `const __WRAPPED_UI_CONFIG = <JSON.stringify(validatedUiConfig)>;`
  - Use `[]` when no valid UI exists.
- In `constructor()`:
  - Initialize `this.params` and seed defaults from `__WRAPPED_UI_CONFIG`:
    - For each item with `bind`, set `this.params[item.bind] = item.value`.
- In `getUIConfig()`:
  - Return `__WRAPPED_UI_CONFIG` if non-empty; otherwise return the existing safe default UI.
 
- [ ] **Step 4: Run the unit test**
 
```bash
node tools/tests/v2-wrapped-parts-module.test.cjs
```
 
Expected: PASS
 
- [ ] **Step 5: Commit**
 
```bash
git add tools/creator/v2-wrapped-parts.cjs
git commit -m "feat: add wrapped_parts UI config parsing and baking"
```
 
---
 
### Task 3: Update Wrapped Parts System Prompt To Require `---UI---` JSON
 
**Files:**
- Modify: `server.js` (inside `outputMode === 'wrapped_parts'` systemPrompt block)
 
- [ ] **Step 1: Extend the prompt**
 
Add rules:
- Output must include `---UI---` section after animate.
- After `---UI---`, output **pure JSON array**, no extra text.
- Allowed types: `color|range|checkbox|select`.
- Max 6 items.
- `bind` regex `^[a-zA-Z_][a-zA-Z0-9_]{0,31}$`.
- For `select`, `options` must be a string array (max 10).
- Tell the model to read parameters via `this.params.<bind>` in setup/animate.
 
- [ ] **Step 2: Wire parse result into wrapper call**
 
In the wrapped_parts branch of `generateEffectV2FromPrompt`, change:
 
```js
const { setup, animate } = parseAIOutput(content);
return wrapAsEngineEffect(setup, animate);
```
 
to:
 
```js
const { setup, animate, uiConfig } = parseAIOutput(content);
return wrapAsEngineEffect(setup, animate, uiConfig);
```
 
- [ ] **Step 3: Run existing static tests**
 
```bash
node tools/tests/v2-wrapped-parts-wiring.test.cjs
node tools/tests/v2-wrapped-parts-module.test.cjs
```
 
Expected: PASS
 
- [ ] **Step 4: Commit**
 
```bash
git add server.js
git commit -m "feat: require wrapped_parts UI JSON and pass through"
```
 
---
 
### Task 4: Manual Smoke Test (Local)
 
**Files:**
- None
 
- [ ] **Step 1: Start server**
 
```bash
PORT=3020 AI_V2_OUTPUT_MODE=wrapped_parts node server.js
```
 
- [ ] **Step 2: curl check**
 
```bash
curl -sS http://localhost:3020/api/generate-effect-v2 \
  -H 'Content-Type: application/json' \
  -d '{"prompt":"赛博朋克旋转立方体，霓虹描边，漂浮粒子，背景暗色雾"}' \
  | python3 -c 'import sys,json,re; o=json.load(sys.stdin); c=o.get("code",""); print("has_getUIConfig", "getUIConfig" in c); print("has_UI_marker", "__WRAPPED_UI_CONFIG" in c);'
```
 
Expected:
- `has_getUIConfig True`
- `has_UI_marker True`
 
- [ ] **Step 3: Browser check**
 
Open `http://localhost:3020/`, generate an AI effect, open Lab.
Expected: left panel shows up to 6 effect-specific controls; changes propagate via `UPDATE_PARAM`.
 
