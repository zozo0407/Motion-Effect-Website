# Balanced Skeleton Routing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 `/api/generate-effect-v2` 增加“半骨架路由”，让常见高频题材优先走稳定骨架，同时保留 prompt 驱动的风格变化和长尾题材的 AI 自由生成能力。

**Architecture:** 在后端请求入口先做轻量题材识别与参数提取，命中高频题材时直接返回稳定骨架代码；未命中时保留现有 AI 生成、auto-fix、validate、repair 链路。骨架 builder 只负责稳定结构，prompt 继续驱动颜色、速度、密度、雾感、质感等参数。

**Tech Stack:** Node.js、Express、CommonJS、Three.js、字符串级测试脚本、现有 EngineEffect 合约校验链路。

---

## File Structure

- Modify: `tools/creator/skeleton-router.cjs`
  - 扩展为多题材路由与轻量参数提取
- Modify: `server.js`
  - 在 `/api/generate-effect-v2` 入口前置骨架命中分流
- Create: `tools/creator/skeletons/wireframe-geo.cjs`
  - 线框几何体骨架 builder
- Create: `tools/creator/skeletons/digital-rain.cjs`
  - 数字雨骨架 builder
- Create: `tools/creator/skeletons/glass-geo.cjs`
  - 玻璃几何体骨架 builder
- Create: `tools/creator/skeletons/liquid-metal.cjs`
  - 液态金属球骨架 builder
- Modify: `tools/creator/skeletons/particles.cjs`
  - 让已有粒子骨架更适合 vortex 风格参数
- Create: `tools/tests/skeleton-router-balanced.test.cjs`
  - 路由命中与参数提取测试
- Create: `tools/tests/generate-v2-skeleton-short-circuit.test.cjs`
  - 验证 v2 路由命中骨架时直接返回，不进入 AI 主链
- Create: `tools/tests/skeleton-builders-contract.test.cjs`
  - 验证各 builder 输出满足 EngineEffect 合约关键结构

### Task 1: 写路由测试（先红）

**Files:**
- Create: `tools/tests/skeleton-router-balanced.test.cjs`
- Modify: `tools/creator/skeleton-router.cjs`
- Test: `tools/tests/skeleton-router-balanced.test.cjs`

- [ ] **Step 1: 写失败测试**

```js
const assert = require('assert');
const { routePromptToSkeleton } = require('../creator/skeleton-router.cjs');

const vortex = routePromptToSkeleton('紫色发光粒子漩涡，中心脉冲，带轻微雾感。');
assert.equal(vortex.kind, 'particles-vortex');
assert.equal(vortex.params.primaryColor, '#8b5cf6');
assert(vortex.params.pulseStrength > 0);
assert(vortex.params.fogStrength > 0);

const wireframe = routePromptToSkeleton('绿色霓虹线框立方体，缓慢旋转，黑色背景。');
assert.equal(wireframe.kind, 'wireframe-geo');
assert.equal(wireframe.params.primaryColor, '#22c55e');
assert(wireframe.params.speed < 1.1);

const rain = routePromptToSkeleton('红色的数字雨数据流，从上往下掉落，赛博朋克风。');
assert.equal(rain.kind, 'digital-rain');
assert.equal(rain.params.primaryColor, '#ff0000');

const glass = routePromptToSkeleton('透明玻璃质感的二十面体，内部蓝色点光源，缓慢旋转。');
assert.equal(glass.kind, 'glass-geo');
assert(glass.params.transparency > 0.5);

const metal = routePromptToSkeleton('金色液态金属球，表面水波纹起伏，高光反射。');
assert.equal(metal.kind, 'liquid-metal');
assert(metal.params.metalness > 0.7);

const longTail = routePromptToSkeleton('一个抽象的叙事化宇宙记忆宫殿，漂浮的门与光带交错。');
assert.equal(longTail.matched, false);

console.log('skeleton-router-balanced.test.cjs passed');
```

- [ ] **Step 2: 运行测试确认失败**

Run: `node tools/tests/skeleton-router-balanced.test.cjs`  
Expected: FAIL，报 `kind` 不存在或命中仍为旧的 `particles/glow-sphere`

- [ ] **Step 3: 最小实现 skeleton router 扩展**

```js
function routePromptToSkeleton(prompt) {
  const text = String(prompt || '').toLowerCase();
  const params = extractPromptStyleParams(prompt);

  if (matchesDigitalRain(text)) return { matched: true, kind: 'digital-rain', params, confidence: 0.95 };
  if (matchesGlassGeo(text)) return { matched: true, kind: 'glass-geo', params, confidence: 0.92 };
  if (matchesLiquidMetal(text)) return { matched: true, kind: 'liquid-metal', params, confidence: 0.91 };
  if (matchesWireframeGeo(text)) return { matched: true, kind: 'wireframe-geo', params, confidence: 0.9 };
  if (matchesParticlesVortex(text)) return { matched: true, kind: 'particles-vortex', params, confidence: 0.88 };

  return { matched: false };
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `node tools/tests/skeleton-router-balanced.test.cjs`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tools/creator/skeleton-router.cjs tools/tests/skeleton-router-balanced.test.cjs
git commit -m "feat: expand skeleton router for common ai themes"
```

### Task 2: 写 builder 合约测试（先红）

**Files:**
- Create: `tools/tests/skeleton-builders-contract.test.cjs`
- Create: `tools/creator/skeletons/wireframe-geo.cjs`
- Create: `tools/creator/skeletons/digital-rain.cjs`
- Create: `tools/creator/skeletons/glass-geo.cjs`
- Create: `tools/creator/skeletons/liquid-metal.cjs`
- Modify: `tools/creator/skeletons/particles.cjs`
- Test: `tools/tests/skeleton-builders-contract.test.cjs`

- [ ] **Step 1: 写失败测试**

```js
const assert = require('assert');
const { buildParticlesEffectCode } = require('../creator/skeletons/particles.cjs');
const { buildWireframeGeoEffectCode } = require('../creator/skeletons/wireframe-geo.cjs');
const { buildDigitalRainEffectCode } = require('../creator/skeletons/digital-rain.cjs');
const { buildGlassGeoEffectCode } = require('../creator/skeletons/glass-geo.cjs');
const { buildLiquidMetalEffectCode } = require('../creator/skeletons/liquid-metal.cjs');

const builders = [
  buildParticlesEffectCode({ color: '#8b5cf6', density: 1.2, speed: 0.8, glowIntensity: 1.4, pulseStrength: 0.6 }),
  buildWireframeGeoEffectCode({ primaryColor: '#22c55e', speed: 0.8, scale: 1.0, glowIntensity: 1.2 }),
  buildDigitalRainEffectCode({ primaryColor: '#ff0000', secondaryColor: '#ff3366', speed: 1.3, density: 1.0 }),
  buildGlassGeoEffectCode({ primaryColor: '#60a5fa', transparency: 0.75, roughness: 0.15, metalness: 0.05 }),
  buildLiquidMetalEffectCode({ primaryColor: '#f59e0b', metalness: 0.95, roughness: 0.18, flowIntensity: 0.7 })
];

for (const code of builders) {
  assert(/import \* as THREE from 'three';/.test(code));
  assert(/export default class EngineEffect/.test(code));
  assert(/\bonStart\s*\(/.test(code));
  assert(/\bonUpdate\s*\(/.test(code));
  assert(/\bonResize\s*\(/.test(code));
  assert(/\bonDestroy\s*\(/.test(code));
  assert(/\bgetUIConfig\s*\(/.test(code));
  assert(/\bsetParam\s*\(/.test(code));
  assert(/new THREE\.WebGLRenderer\s*\(/.test(code));
  assert(/\.render\s*\(/.test(code));
}

console.log('skeleton-builders-contract.test.cjs passed');
```

- [ ] **Step 2: 运行测试确认失败**

Run: `node tools/tests/skeleton-builders-contract.test.cjs`  
Expected: FAIL，提示缺少新 builder 文件

- [ ] **Step 3: 实现最小 builder 文件**

```js
function buildWireframeGeoEffectCode(params = {}) {
  return `import * as THREE from 'three';
export default class EngineEffect {
  constructor() { this.params = { primaryColor: '${params.primaryColor || '#22c55e'}', speed: ${params.speed || 1}, scale: ${params.scale || 1}, glowIntensity: ${params.glowIntensity || 1.2} }; this.scene = null; this.camera = null; this.renderer = null; this.mesh = null; }
  onStart(ctx) { /* create scene/camera/renderer and wireframe geometry */ }
  onUpdate(ctx) { /* rotate and render */ }
  onResize(ctx) { /* resize renderer/camera */ }
  onDestroy() { /* dispose */ }
  getUIConfig() { return []; }
  setParam(key, value) { this.params[key] = value; }
}`;
}
module.exports = { buildWireframeGeoEffectCode };
```

- [ ] **Step 4: 让粒子骨架支持 vortex 参数**

```js
function buildParticlesEffectCode(params = {}) {
  const glowIntensity = Number.isFinite(params.glowIntensity) ? params.glowIntensity : 1.2;
  const pulseStrength = Number.isFinite(params.pulseStrength) ? params.pulseStrength : 0.0;
  const fogStrength = Number.isFinite(params.fogStrength) ? params.fogStrength : 0.0;
  // keep existing stable particle implementation, only expand params and uniforms
}
```

- [ ] **Step 5: 运行测试确认通过**

Run: `node tools/tests/skeleton-builders-contract.test.cjs`  
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add tools/creator/skeletons/particles.cjs tools/creator/skeletons/wireframe-geo.cjs tools/creator/skeletons/digital-rain.cjs tools/creator/skeletons/glass-geo.cjs tools/creator/skeletons/liquid-metal.cjs tools/tests/skeleton-builders-contract.test.cjs
git commit -m "feat: add balanced skeleton builders for common ai themes"
```

### Task 3: 写 v2 入口短路测试（先红）

**Files:**
- Create: `tools/tests/generate-v2-skeleton-short-circuit.test.cjs`
- Modify: `server.js`
- Test: `tools/tests/generate-v2-skeleton-short-circuit.test.cjs`

- [ ] **Step 1: 写失败测试**

```js
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const server = fs.readFileSync(path.join(__dirname, '..', '..', 'server.js'), 'utf8');
const routeStart = server.indexOf(\"app.post('/api/generate-effect-v2'\");
const routeEnd = server.indexOf('// API: Get Demos', routeStart);
const v2Route = server.slice(routeStart, routeEnd);

assert(v2Route.includes('routePromptToSkeleton(prompt)'), 'v2 route should consult skeleton router before AI generation');
assert(v2Route.includes('if (skeletonRoute && skeletonRoute.matched)'), 'v2 route should short-circuit on matched skeletons');
assert(v2Route.includes('buildWireframeGeoEffectCode'), 'v2 route should support wireframe skeleton builder');
assert(v2Route.includes('buildDigitalRainEffectCode'), 'v2 route should support digital-rain skeleton builder');
assert(v2Route.includes('buildGlassGeoEffectCode'), 'v2 route should support glass skeleton builder');
assert(v2Route.includes('buildLiquidMetalEffectCode'), 'v2 route should support liquid-metal skeleton builder');

console.log('generate-v2-skeleton-short-circuit.test.cjs passed');
```

- [ ] **Step 2: 运行测试确认失败**

Run: `node tools/tests/generate-v2-skeleton-short-circuit.test.cjs`  
Expected: FAIL，提示缺少新 builder 或未在 v2 route 前置路由

- [ ] **Step 3: 在 v2 route 中接入骨架短路**

```js
const skeletonRoute = routePromptToSkeleton(prompt);
if (skeletonRoute && skeletonRoute.matched) {
  const params = skeletonRoute.params || {};
  let code = '';
  if (skeletonRoute.kind === 'particles-vortex') code = buildParticlesEffectCode(params);
  else if (skeletonRoute.kind === 'wireframe-geo') code = buildWireframeGeoEffectCode(params);
  else if (skeletonRoute.kind === 'digital-rain') code = buildDigitalRainEffectCode(params);
  else if (skeletonRoute.kind === 'glass-geo') code = buildGlassGeoEffectCode(params);
  else if (skeletonRoute.kind === 'liquid-metal') code = buildLiquidMetalEffectCode(params);
  if (code) return res.json({ code });
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `node tools/tests/generate-v2-skeleton-short-circuit.test.cjs`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add server.js tools/tests/generate-v2-skeleton-short-circuit.test.cjs
git commit -m "feat: short-circuit common prompts to stable skeletons"
```

### Task 4: 真实接口回归

**Files:**
- Modify: `server.js`
- Test: `tools/tests/skeleton-router-balanced.test.cjs`
- Test: `tools/tests/skeleton-builders-contract.test.cjs`
- Test: `tools/tests/generate-v2-skeleton-short-circuit.test.cjs`

- [ ] **Step 1: 跑所有目标测试**

Run:

```bash
node tools/tests/skeleton-router-balanced.test.cjs
node tools/tests/skeleton-builders-contract.test.cjs
node tools/tests/generate-v2-skeleton-short-circuit.test.cjs
node tools/tests/generate-v2-repair-on-syntax-error.test.cjs
node tools/tests/unsafe-helper-ctx-usage.test.cjs
```

Expected: 全部 PASS

- [ ] **Step 2: 重启本地服务**

Run:

```bash
node server.js
```

Expected: `Creator Server running at http://localhost:3000`

- [ ] **Step 3: 真实打 5 个高频题材 prompt**

Run:

```bash
node <<'NODE'
const prompts = [
  '绿色霓虹线框立方体，缓慢旋转，黑色背景。',
  '紫色发光粒子漩涡，中心脉冲，带轻微雾感。',
  '红色的数字雨数据流，从上往下掉落，赛博朋克风。',
  '透明玻璃质感的二十面体，内部蓝色点光源，缓慢旋转。',
  '金色液态金属球，表面水波纹起伏，高光反射。'
];

(async () => {
  for (const prompt of prompts) {
    const start = Date.now();
    const res = await fetch('http://localhost:3000/api/generate-effect-v2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    const json = await res.json();
    console.log(prompt, res.status, Date.now() - start, Boolean(json.code));
  }
})();
NODE
```

Expected:

- 5 个 prompt 全部 `status=200`
- 返回 `code=true`
- 不再触发此前高频的 `ctx is not defined` / `missing )` / `大括号不闭合`

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: add balanced skeleton routing for frequent ai prompts"
```

## Self-Review

- Spec coverage:
  - 已覆盖 5 类骨架、参数映射、v2 路由前置短路、回归验证
  - 不包含前端 UI 改动，符合 spec 范围
- Placeholder scan:
  - 无 `TODO/TBD`
  - 每个测试步骤都给出具体代码或命令
- Type consistency:
  - 路由 kind 与 builder 名称在各任务中保持一致：
    - `particles-vortex`
    - `wireframe-geo`
    - `digital-rain`
    - `glass-geo`
    - `liquid-metal`

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-10-balanced-skeleton-routing.md`. Two execution options:

**1. Subagent-Driven (recommended)** - 我按任务逐个派新 subagent 执行，每步之间做检查

**2. Inline Execution** - 我就在当前会话里按这个计划直接实现

Which approach?
