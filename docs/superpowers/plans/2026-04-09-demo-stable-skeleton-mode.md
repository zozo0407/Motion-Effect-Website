# Demo Stable Skeleton Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a public-demo "stable mode" that routes prompts to stable skeletons (glow geometry + particles) and always returns EngineEffect-contract-compliant code.

**Architecture:** Server-side prompt router selects a skeleton family. In demo mode, the `/api/generate-effect` (and optional v2 endpoint) bypasses LLM codegen and returns prebuilt EngineEffect code with deterministic parameters derived from the prompt (color, speed, density).

**Tech Stack:** Node.js (CommonJS), Express, Three.js (runtime in browser)

---

## Files

**Create**
- `tools/creator/skeletons/glow-sphere.cjs` (build stable glow-geometry EngineEffect code)
- `tools/creator/skeletons/particles.cjs` (build stable particles EngineEffect code)
- `tools/creator/skeleton-router.cjs` (route prompt -> skeleton type + extracted params)

**Modify**
- `server.js` (add demo stable mode flag; route `/api/generate-effect` to skeletons)

---

### Task 1: Add Skeleton Router + Param Extraction

**Files:**
- Create: `tools/creator/skeleton-router.cjs`

- [ ] **Step 1: Create router module**

Implement:
- `routePromptToSkeleton(prompt)` returns `{ kind: 'glow-sphere'|'particles', params }`
- Extract `#RRGGBB` if present, else choose deterministic palette via hash
- Keyword route: particles keywords -> `particles` else `glow-sphere`

- [ ] **Step 2: Quick manual test**

Run (node one-liner):
- `node -e "const r=require('./tools/creator/skeleton-router.cjs'); console.log(r.routePromptToSkeleton('粒子 星尘 #00ffaa'))"`
Expected: kind `particles`, params includes color `#00ffaa`

- [ ] **Step 3: Commit**

```bash
git add tools/creator/skeleton-router.cjs
git commit -m "feat: add demo skeleton prompt router"
```

---

### Task 2: Add Glow Sphere Skeleton

**Files:**
- Create: `tools/creator/skeletons/glow-sphere.cjs`

- [ ] **Step 1: Implement glow sphere code generator**

Export `buildGlowSphereEffectCode({ color, glowIntensity, speed }) -> string`:
- Returns ES module code
- Must satisfy EngineEffect contract (constructor/onStart/onUpdate/onResize/onDestroy/getUIConfig/setParam)
- Must not use DOM/window/navigator/requestAnimationFrame/ctx.renderer
- Uses ctx.canvas/ctx.gl to create THREE.WebGLRenderer

- [ ] **Step 2: Quick smoke compile**

Run:
- `node -e "const {buildGlowSphereEffectCode}=require('./tools/creator/skeletons/glow-sphere.cjs'); const code=buildGlowSphereEffectCode({color:'#ff0040',glowIntensity:1.2,speed:1.0}); console.log(code.slice(0,80));"`
Expected: starts with `import * as THREE from 'three';`

- [ ] **Step 3: Commit**

```bash
git add tools/creator/skeletons/glow-sphere.cjs
git commit -m "feat: add glow sphere skeleton EngineEffect"
```

---

### Task 3: Add Particles Skeleton

**Files:**
- Create: `tools/creator/skeletons/particles.cjs`

- [ ] **Step 1: Implement particles code generator**

Export `buildParticlesEffectCode({ color, speed, density }) -> string`:
- Stable GPU-friendly particles (Points + BufferGeometry)
- No textures, no external assets
- Uses deterministic init for point positions
- setParam updates material uniforms (or material color) + motion speed

- [ ] **Step 2: Quick smoke compile**

Run:
- `node -e "const {buildParticlesEffectCode}=require('./tools/creator/skeletons/particles.cjs'); const code=buildParticlesEffectCode({color:'#00ffaa',speed:1.0,density:1500}); console.log(code.slice(0,80));"`
Expected: starts with `import * as THREE from 'three';`

- [ ] **Step 3: Commit**

```bash
git add tools/creator/skeletons/particles.cjs
git commit -m "feat: add particles skeleton EngineEffect"
```

---

### Task 4: Wire Demo Mode Into API

**Files:**
- Modify: `server.js`
- Use: `tools/creator/skeleton-router.cjs`
- Use: `tools/creator/skeletons/glow-sphere.cjs`
- Use: `tools/creator/skeletons/particles.cjs`

- [ ] **Step 1: Add env flag**

Add `AI_DEMO_MODE=1` support:
- When enabled, `/api/generate-effect?v=2` returns skeleton code instead of calling upstream LLM
- Always return `{ code }` and `200` for valid prompt

- [ ] **Step 2: Implement code selection**

Pseudo:
- `const { routePromptToSkeleton } = require('./tools/creator/skeleton-router.cjs')`
- `const routed = routePromptToSkeleton(prompt)`
- if kind particles -> `buildParticlesEffectCode(routed.params)`
- else -> `buildGlowSphereEffectCode(routed.params)`

- [ ] **Step 3: Keep existing LLM path intact when AI_DEMO_MODE != 1**

Do not remove existing AI generation; only short-circuit in demo mode.

- [ ] **Step 4: Manual endpoint test**

Run:
- `AI_DEMO_MODE=1 node server.js`
- `curl -sS -X POST 'http://localhost:3000/api/generate-effect?v=2' -H 'Content-Type: application/json' -d '{"prompt":"粒子 星尘 #00ffaa"}' | head -c 120`
Expected: JSON with `code` string starting with `import * as THREE from 'three';`

- [ ] **Step 5: Commit**

```bash
git add server.js
git commit -m "feat: add AI_DEMO_MODE stable skeleton generation"
```

---

### Task 5: Final Smoke Checklist (Demo Night)

- [ ] **Step 1: Run server in demo mode**

Run:
- `AI_DEMO_MODE=1 node server.js`

- [ ] **Step 2: Test 6 prompts**

Prompts:
- "一个发光的红色球体 #ff0040"
- "粒子爆炸 #00ffaa"
- "星尘粒子流"
- "霓虹能量核心"
- "particle nebula purple"
- "random text"

Expected:
- No API errors
- Page previews render something every time

