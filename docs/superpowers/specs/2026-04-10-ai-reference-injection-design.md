# AI Reference Injection Design

## Goal

Improve the success rate of `/api/generate-effect-v2` by injecting compliant EngineEffect reference patterns into the stage-2 code prompt, while preserving the current validation, auto-fix, and frontend fallback behavior.

## Scope

This design changes only the stage-2 prompt assembly in `tools/creator/effect-blueprint.cjs` and related prompt-content tests.

It does not:
- replace the current provider fallback flow
- remove server-side validation
- remove auto-fix logic
- switch to parameter-only generation

## Approach

Use "light reference injection":
- keep AI generating full code
- add a concise compliance checklist to the system prompt
- add short reference summaries derived from stable skeletons to the user prompt
- avoid embedding full source files to reduce prompt bloat and copy-paste behavior

## Compliance Framework For AI

The stage-2 system prompt should explicitly require:

- first line must be `import * as THREE from 'three';`
- output must be `export default class EngineEffect`
- required methods:
  - `constructor()`
  - `onStart(ctx)`
  - `onUpdate(ctx)`
  - `onResize(ctx)`
  - `onDestroy(ctx)`
  - `getUIConfig()`
  - `setParam(key, value)`
- do not assume `ctx.scene`, `ctx.camera`, or `ctx.renderer` exist
- if scene/camera/renderer are needed, create them inside `onStart(ctx)` using `ctx.canvas` and size data
- do not use `document`, `window`, `navigator`
- do not use `requestAnimationFrame`
- do not use `ctx.renderer`
- do not create or mount DOM nodes
- render inside `onUpdate(ctx)`
- resize inside `onResize(ctx)`
- cleanup inside `onDestroy(ctx)`

## Reference Summaries

The stage-2 user prompt should include short summaries based on these compliant sources:

- `tools/creator/skeletons/glow-sphere.cjs`
- `tools/creator/skeletons/particles.cjs`

The summaries should describe structure, not copy full files:

### Glow Sphere Summary

- create `Scene`, `PerspectiveCamera`, and `WebGLRenderer({ canvas: ctx.canvas })` in `onStart`
- size renderer using width, height, and dpr from `ctx`
- create a mesh-based focal object
- animate transforms in `onUpdate`
- call `renderer.render(scene, camera)` in `onUpdate`
- update renderer size and camera aspect in `onResize`

### Particles Summary

- create the render pipeline in `onStart`
- create particle geometry/material in `onStart`
- update particle motion in `onUpdate`
- call `renderer.render(scene, camera)` in `onUpdate`
- update renderer size and camera aspect in `onResize`

The prompt must clearly state:
- reference the structure and organization
- do not copy the exact visual parameters
- adapt the effect to the current user prompt and blueprint

## Files To Change

- `tools/creator/effect-blueprint.cjs`
- `tools/tests/generate-v2-stage-probe.test.cjs`

## Verification

Add or update tests to confirm:

- the stage-2 system prompt includes the compliance checklist keywords
- the stage-2 user prompt includes reference-summary keywords such as:
  - `new THREE.Scene()`
  - `new THREE.WebGLRenderer({ canvas: ctx.canvas })`
  - `renderer.render(scene, camera)`

Then run:

```bash
node tools/tests/generate-v2-stage-probe.test.cjs
npm run build
```

Optionally perform one local end-to-end request against `/api/generate-effect-v2` to compare latency and compliance after the prompt change.

## Risks And Mitigations

- Risk: prompt becomes too long
  - Mitigation: inject summaries, not full source files
- Risk: model copies reference visuals too literally
  - Mitigation: explicitly say to copy structure only, not exact visual parameters
- Risk: model still violates contract
  - Mitigation: keep existing validation, auto-fix, and frontend fallback layers
