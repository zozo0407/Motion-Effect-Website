# AI Reference Injection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve `/api/generate-effect-v2` success rate by injecting compliant EngineEffect reference guidance into the stage-2 prompt without changing the existing runtime and validation flow.

**Architecture:** Extend `buildCodeMessages()` so the stage-2 prompt contains a concise compliance checklist plus short structural summaries derived from the stable `glow-sphere` and `particles` skeletons. Keep the summaries text-only and test the prompt content directly so the change is isolated, reviewable, and low risk.

**Tech Stack:** Node.js CommonJS, plain JS prompt builders, existing ad-hoc Node test scripts, Vite build

---

### Task 1: Add the failing prompt-content test

**Files:**
- Modify: `tools/tests/generate-v2-stage-probe.test.cjs`
- Read for context: `tools/creator/effect-blueprint.cjs`

- [ ] **Step 1: Write the failing test**

```js
const assert = require('assert');
const { buildCodeMessages, defaultBlueprint } = require('../creator/effect-blueprint.cjs');

const msgs = buildCodeMessages('极简风，柔和配色，旋转几何体', defaultBlueprint('极简风，柔和配色，旋转几何体'), 'contract');

assert(msgs.system.includes("import * as THREE from 'three';"), 'system prompt should require the THREE namespace import');
assert(msgs.system.includes('不要假设 ctx.scene'), 'system prompt should forbid assuming ctx.scene exists');
assert(msgs.system.includes('onStart(ctx)'), 'system prompt should enumerate required lifecycle methods');
assert(msgs.user.includes('参考合规框架摘要'), 'user prompt should include the reference summary heading');
assert(msgs.user.includes('new THREE.Scene()'), 'user prompt should reference creating a new THREE.Scene()');
assert(msgs.user.includes("new THREE.WebGLRenderer({ canvas: ctx.canvas })"), 'user prompt should reference renderer creation from ctx.canvas');
assert(msgs.user.includes('renderer.render(scene, camera)'), 'user prompt should reference renderer.render(scene, camera)');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tools/tests/generate-v2-stage-probe.test.cjs`
Expected: FAIL because the current prompt does not include the compliance checklist or reference summaries.

- [ ] **Step 3: Commit the test-only change**

```bash
git add tools/tests/generate-v2-stage-probe.test.cjs
git commit -m "test: add ai reference prompt assertions"
```

### Task 2: Inject compliance checklist and reference summaries

**Files:**
- Modify: `tools/creator/effect-blueprint.cjs`
- Read for reference: `tools/creator/skeletons/glow-sphere.cjs`
- Read for reference: `tools/creator/skeletons/particles.cjs`

- [ ] **Step 1: Add prompt helper constants**

Add small string helpers near `buildCodeMessages()`:

```js
const CODE_COMPLIANCE_CHECKLIST = [
  "第一行必须是 import * as THREE from 'three';",
  '必须输出 export default class EngineEffect。',
  '必须实现 constructor()、onStart(ctx)、onUpdate(ctx)、onResize(ctx)、onDestroy(ctx)、getUIConfig()、setParam(key, value)。',
  '不要假设 ctx.scene、ctx.camera、ctx.renderer 存在；如需这些对象，必须在 onStart(ctx) 内自行创建。',
  '只可安全使用 ctx.canvas 与尺寸信息（ctx.size / ctx.width / ctx.height / ctx.dpr）。',
  '禁止使用 document/window/navigator。',
  '禁止使用 requestAnimationFrame。',
  '禁止使用 ctx.renderer。',
  '禁止创建或挂载 DOM。',
  '必须在 onUpdate(ctx) 中执行 renderer.render(scene, camera)。',
  '必须在 onResize(ctx) 中更新 renderer 尺寸和 camera.aspect。',
  '必须在 onDestroy(ctx) 中释放资源。'
].join('\\n');

const REFERENCE_SUMMARY = [
  '参考合规框架摘要（只参考结构，不要照抄视觉参数）：',
  '示例 A：glow sphere',
  "- onStart: new THREE.Scene() / new THREE.PerspectiveCamera(...) / new THREE.WebGLRenderer({ canvas: ctx.canvas })",
  '- onStart: 根据 ctx.width/ctx.height/ctx.dpr 或 ctx.size 设置 renderer 尺寸',
  '- onStart: 创建一个 mesh 作为主体',
  '- onUpdate: 更新旋转或动画，再调用 renderer.render(scene, camera)',
  '- onResize: 更新 renderer 尺寸与 camera.aspect',
  '示例 B：particles',
  '- onStart: 创建 scene/camera/renderer，并初始化粒子 geometry/material',
  '- onUpdate: 更新粒子运动，再调用 renderer.render(scene, camera)',
  '- onResize: 更新 renderer 尺寸与 camera.aspect',
  '务必沿用这些合规结构，但视觉设计、颜色、运动、材质应根据当前用户需求和蓝图重新创作。'
].join('\\n');
```

- [ ] **Step 2: Wire the new helpers into `buildCodeMessages()`**

Update the existing prompt assembly:

```js
function buildCodeMessages(prompt, blueprint, contract) {
  const blueprintJson = JSON.stringify(blueprint, null, 2);
  return {
    system: [
      '你是 Three.js/WebGL 工程师。',
      '基于给定蓝图输出可直接运行的 ES Module 纯代码。',
      '不要解释，不要 markdown code fence。',
      '必须满足 EngineEffect 合约。',
      CODE_COMPLIANCE_CHECKLIST,
      contract || ''
    ].filter(Boolean).join('\\n\\n'),
    user: [
      `用户需求：${prompt}`,
      '蓝图：',
      blueprintJson,
      REFERENCE_SUMMARY
    ].join('\\n\\n')
  };
}
```

- [ ] **Step 3: Keep scope tight**

Do not change:
- `buildBlueprintMessages()`
- `defaultBlueprint()`
- server-side validation behavior
- runtime code or fallback order

- [ ] **Step 4: Commit the implementation**

```bash
git add tools/creator/effect-blueprint.cjs
git commit -m "feat: inject compliant engineeffect references into prompt"
```

### Task 3: Verify prompt content and build

**Files:**
- Test: `tools/tests/generate-v2-stage-probe.test.cjs`
- Build entry: `package.json`

- [ ] **Step 1: Run the updated prompt-content test**

Run: `node tools/tests/generate-v2-stage-probe.test.cjs`
Expected: PASS

- [ ] **Step 2: Run the nearby prompt tests**

Run: `node tools/tests/effect-blueprint.test.cjs`
Expected: PASS

- [ ] **Step 3: Run the production build**

Run: `npm run build`
Expected: exit code 0 and Vite build success output

- [ ] **Step 4: Commit verification-safe code**

```bash
git add tools/tests/generate-v2-stage-probe.test.cjs
git commit -m "test: verify ai prompt reference injection"
```

### Task 4: Optional local end-to-end spot check

**Files:**
- Read only: `server.js`

- [ ] **Step 1: Start the local server**

Run: `npm start`
Expected: log line containing `Creator Server running at http://localhost:3000`

- [ ] **Step 2: Call the v2 endpoint once**

Run:

```bash
curl --noproxy '*' -sS -w '\nHTTP_CODE=%{http_code}\nTIME_TOTAL=%{time_total}\n' \
  -o /tmp/gen_v2_probe.json \
  -X POST 'http://localhost:3000/api/generate-effect-v2' \
  -H 'Content-Type: application/json' \
  -d '{"prompt":"极简风，柔和配色，旋转几何体"}'
```

Expected:
- ideally `HTTP_CODE=200`
- if non-200, capture the returned `error` text exactly for follow-up

- [ ] **Step 3: Inspect the returned code head**

Run:

```bash
head -c 240 /tmp/gen_v2_probe.json
```

Expected:
- response contains `{"code":"import * as THREE from 'three';`
- or an actionable error message from server validation

- [ ] **Step 4: Stop the local server**

Stop the terminal process and note the measured `TIME_TOTAL`.

---

## Self-Review

- Spec coverage: prompt injection, compliance checklist, reference summaries, targeted test coverage, and build verification are all covered.
- Placeholder scan: no TBD/TODO markers remain.
- Type consistency: file paths, function names, and prompt strings match the existing codebase.
