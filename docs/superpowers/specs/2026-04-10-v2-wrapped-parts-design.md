# V2 Wrapped Parts Generation (Design)

Source of truth during drafting: `.trae/specs/refactor_v2_prompt.md` (ignored by git).
This doc is the tracked design snapshot used for implementation and rollback.

## Goal

Increase AI generation success rate and reduce runtime/syntax failures by changing V2 generation from "LLM outputs full EngineEffect class" to:

- LLM outputs only two function-body snippets: `setup` and `animate`
- Backend wraps them into a fixed `export default class EngineEffect` template

## Non-goals

- No frontend changes.
- No changes to v1 generation pipeline.
- Do not remove existing `autoFixEngineEffectCode`, `validateEngineEffectCode`, `repairEngineEffectCode`, or minimal fallback logic.

## Scope / Entry Point

Only affects `/api/generate-effect-v2`.

`/api/generate-effect?v=2` also calls `generateEffectV2FromPrompt(...)` today, but must NOT be affected by this change.

## Rollout Switch

New env var:

- `AI_V2_OUTPUT_MODE=wrapped_parts` enables the new mode for `/api/generate-effect-v2` only.

Implementation detail: `generateEffectV2FromPrompt(...)` must read `options.outputMode` (passed by the v2 route), not `process.env`, to avoid unintentionally changing the `?v=2` endpoint.

## Budget Alignment

Do not introduce an internal fixed 120s timeout.

Timeout for the LLM call must be provided by the v2 route using existing `remainingBudgetMs()`:

- `codeTimeoutMs = clamp(remainingBudgetMs() - 1500, 1000..90000)`

## Key Safety Fix: No Template-String Injection

Do not wrap by injecting AI code via JS template literals, because AI snippets can contain:

- backticks: `` ` ``
- template interpolations: `${...}`

Either will break the generated module if we build it as `` `...${setup}...` ``.

Therefore, `wrapAsEngineEffect(setup, animate)` must build the final module using array concatenation + `join('\n')`.

## Snippet Parsing / Cleaning

AI may still violate the output format and prepend structure lines (even when instructed not to).

`parseAIOutput(rawText)` must:

1. `stripMarkdownCodeFence(rawText)`
2. Split by `---SPLIT---` if present, otherwise treat everything as `setup` and keep `animate=''`
3. Run `cleanSnippet()` on both snippets:
   - Drop lines starting with: `import `, `export default class`, `export class`, `class EngineEffect`, `export default EngineEffect`, and code fences
   - Preserve other lines to avoid altering valid logic

## Execution Flow (V2 Route)

In `/api/generate-effect-v2` (AI path only):

1. `generateEffectV2FromPrompt(prompt, provider, { outputMode: process.env.AI_V2_OUTPUT_MODE, codeTimeoutMs })`
2. `autoFixEngineEffectCode(code)`
3. `validateEngineEffectCode(code)`
4. If invalid: attempt `repairEngineEffectCode(...)` within remaining budget
5. If still invalid or errors: return minimal fallback payload when enabled

## Testing

Add/update tests to ensure:

- Default v2 path remains unchanged when `outputMode` is not passed (existing stage-probe/static checks keep passing).
- Wrapped parts mode is reachable from `/api/generate-effect-v2` when env is set.
- `wrapAsEngineEffect` does not use template-literal injection (basic static assertion).
- `cleanSnippet` removes top-level structure lines and keeps ordinary code lines.

