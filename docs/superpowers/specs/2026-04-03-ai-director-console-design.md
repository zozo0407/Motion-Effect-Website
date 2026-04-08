# AI 导演台专项 Spec（方案 C：规则 + LLM 灰区判定）

## 0. 背景与目标

当前平台已具备：
- Web 端实时预览（core demos + AI 生成页）
- `game.js` 导出（含 minigame 外壳封装）

下一阶段重点是优化“AI 导演台”（AI 理解与交互）：
- 让用户以 **一句话** 开始创作
- AI 能 **理解意图**，并在必要时 **反问澄清**
- 生成 **可预览** 的效果
- 用户可继续 **对话式修改**（迭代优化、加交互、换风格、改强度等）

本专项 Spec 只覆盖 AI 导演台的生成效果与交互，不覆盖 Zip 打包与 SDK 接入实现细节（但保留可扩展接口）。

## 1. 现状盘点（与本 Spec 的关系）

### 1.1 目前的两条 AI 能力链路

**A) 生成链路（后端 LLM → 输出 code）**
- 前端入口：`wizard.generateDemo()` 调用 `POST /api/generate-effect?v=2`，拿到 `json.code` 并生成预览页
- 后端入口：`POST /api/generate-effect`，`?v=2` 时走 `generateEffectV2FromPrompt`，使用 [v2-prompt.md](file:///Users/bytedance/Downloads/cupcut-website/prompts/v2-prompt.md) 作为系统提示词骨架

**B) 调参链路（前端本地“AI”语义调参）**
- 前端入口：[ai-chat.js](file:///Users/bytedance/Downloads/cupcut-website/src/site/ai-chat.js) 通过 embeddings 将用户一句话映射到 `window.lastUIConfig` 的某个参数，并调用 `updateDemoParam`
- 特点：快、便宜、稳定，但只能“调参”，不能“重构效果/生成新逻辑”

### 1.2 本专项 Spec 的策略

把“AI 导演台”明确拆成两个子能力：
- **导演对话（理解/反问/规划）**：LLM（必要时） + 规则（优先）
- **执行（生成/修改）**：优先复用已有链路
  - 生成：沿用后端 `/api/generate-effect?v=2`
  - 修改：短期先走“本地调参 AI”（能覆盖 60% 高频需求），中期再补“LLM 增量修改代码”

## 2. 新用户流程（你定义的目标流程）

### 2.1 关键流程

1. **一句话输入**：用户输入效果需求
2. **AI 理解并反问（仅在不明确时）**：AI 只在信息缺失/冲突/不可实现风险高时反问 1-3 个问题
3. **预览**：AI 生成并自动加载预览
4. **继续对话修改**：用户继续聊天，AI 进行调参或迭代生成，预览实时刷新

### 2.2 状态机（建议实现的交互状态）

- `Idle`：等待输入
- `ClarifyNeeded`：展示反问（待用户回答）
- `Generating`：生成中（loading + 可取消）
- `PreviewReady`：已预览（可继续对话修改）
- `Iterating`：迭代中（调参/重生成/修复）
- `Failed`：失败态（给出可行动的下一步：重试/补充信息/降级）

## 3. 方案 C：规则 + LLM 灰区判定（核心）

### 3.1 设计原则

- **能不问就不问**：宁可先给一个可运行的粗版预览，也不要“面试式盘问”
- **只问决定性问题**：每个问题必须显著影响生成方向或可运行性
- **最多 1-3 问**：避免用户疲劳
- **问完立即生成**：用户回答后立刻进入生成流程

### 3.2 规则层（优先）

规则层负责快速判断两类情况：

**A) 明确 → 直接生成**
- 用户明确给出：主体 + 风格/情绪 + 关键动效（至少两项）
  - 例：“赛博朋克风的发光粒子文字，字边缘有电流闪烁”

**B) 明显不明确/冲突 → 直接反问**
- 缺关键槽位：主体不明（“做个酷炫特效”）、风格完全缺失、输出介质不明（要叠加还是要全屏背景）
- 冲突明显：同时要求“极简纯色”与“高频复杂粒子爆炸”、同时要求“强交互”与“导出为静态单文件且无输入源”

规则层输出：`needClarify: boolean` + `missingSlots[]` + `riskFlags[]`

### 3.3 LLM 灰区判定层（仅在灰区触发）

当规则层无法确定（既不是明显明确，也不是明显缺失）时，调用 LLM 做一次“澄清判定”。

**输入**（系统端构造）：
- 用户一句话原始 prompt
- 当前页面上下文（可选）：当前 demo 类型、是否已有预览、当前 `lastUIConfig`（如存在）
- 规则层输出（missingSlots/riskFlags）

**输出**（强约束 JSON）：
```json
{
  "need_clarify": true,
  "questions": [
    { "id": "style", "question": "你想要偏赛博霓虹还是手绘涂鸦？", "options": ["赛博霓虹", "手绘涂鸦", "都可以"] }
  ],
  "assumptions_if_no_answer": [
    "默认黑底透明叠加",
    "默认 6 秒循环"
  ],
  "confidence": 0.72
}
```

约束：
- `need_clarify=false` 时 `questions` 必须为空
- `questions.length` ∈ [0,3]
- 每个问题应可选项化（降低用户输入成本）

## 4. 反问问题库（MVP 版本）

MVP 只保留最影响结果的 5 类问题，按优先级触发：

1. **主体/元素**：文字 / 粒子 / 几何 / 光束 / 烟雾 / 线条
2. **风格**：赛博霓虹 / 极简 / 手绘 / 复古胶片 / glitch
3. **节奏与强度**：慢/中/快；弱/中/强
4. **背景与叠加**：黑底 / 透明叠加（更适合剪映）
5. **交互（可选）**：跟随鼠标 / 无交互（MVP 可默认无交互）

## 5. 生成与迭代策略（MVP → 迭代）

### 5.1 首次生成（Preview）

- 直接调用后端生成：`POST /api/generate-effect?v=2`（复用现有能力）
- 生成前把“澄清答案 + 默认假设”合并成最终 prompt：
  - `finalPrompt = 用户原话 + 澄清答案总结 + 默认假设`

### 5.2 对话式修改（Iterate）

分两类修改请求：

**A) 可映射到参数的修改（优先走本地 AI 调参）**
- 例：“更快一点”“粒子更密”“颜色偏紫”
- 走 [ai-chat.js](file:///Users/bytedance/Downloads/cupcut-website/src/site/ai-chat.js) 的 embeddings + `updateDemoParam`

**B) 需要结构性改动的修改（MVP 先走“重生成”）**
- 例：“把粒子换成线条”“加一个电流闪烁边缘”“做成 3D 旋转文字”
- MVP 策略：把“当前意图摘要 + 用户追加指令”重新组合，触发一次重生成
- 中期策略（后续专项）：引入“LLM 增量补丁”模式（对 code 做 diff/patch），降低重生成成本

## 6. 输出契约（导演台需要保证的产物）

导演台每次成功生成必须产出：
- **预览可运行的 code**（现状已实现）
- **意图摘要（intent summary）**：用于后续对话迭代时作为上下文（短文本）
- **假设列表（assumptions）**：例如默认黑底/透明叠加/循环时长
- **可选：参数摘要**（若生成侧能提供）：用于更好地驱动本地调参 AI

导演台每次失败必须产出：
- 可复现的错误摘要（用户可读）
- 下一步建议（重试 / 补充信息 / 降级策略）

## 7. 失败兜底与自修复（MVP）

目标：让“首帧可运行率”最大化。

- **自动重试**：最多 1 次（避免无限消耗）
- **自动降级**：当检测到高风险需求（例如 heavy WebGL/外部依赖）时，优先建议 Canvas2D 方案
- **可行动提示**：反问式补充信息（而不是报错堆栈）

## 8. 评测与回归（必须做）

MVP 需要跟踪这些指标（可先 console / 本地记录，后续接埋点）：
- 首次生成可运行率
- 首帧时间（从点击生成到看到画面）
- 反问触发率（越低越好，但不能牺牲成功率）
- 平均反问数量（目标 ≤ 1.5）
- 用户迭代次数（用于衡量“可控性”）

基准集：
- 以 `core demo` + 常见用户 prompt 组合为回归集合（后续整理为固定 test prompts）

## 9. 与现有文档的关系（索引）

- 平台总蓝图（宏观）：[2026-04-02-platform-blueprint-design.md](file:///Users/bytedance/Downloads/cupcut-website/docs/superpowers/specs/2026-04-02-platform-blueprint-design.md)
- 系统提示词规范（生成约束）：[SYSTEM_PROMPT_CREATIVE_CODING.md](file:///Users/bytedance/Downloads/cupcut-website/docs/ai/SYSTEM_PROMPT_CREATIVE_CODING.md)
- Prompt 资产（运行时）：[prompts/](file:///Users/bytedance/Downloads/cupcut-website/prompts)

## 10. 非目标（本专项不做）

- 自动 Zip 打包全链路（Phase 2）
- 接入剪映官方 SDK（Phase 3）
- 多人协作、账号体系、云端素材库等平台化能力

## 11. 开放问题（需要你后续定夺）

1. 默认输出介质：透明叠加 vs 黑底（建议默认透明叠加，更贴近剪映叠加特效）
2. 风格体系：是固定风格标签（cyberpunk/toon/…），还是自由描述 + LLM 自解释
3. 迭代策略：结构性改动在 MVP 是否允许直接重生成（默认允许）

