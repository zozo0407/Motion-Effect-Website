# Preview Engine（分级兜底）详细设计（Spec）

## 0. 背景与目标

AI 导演台的核心体验是：用户用一句话输入创作意图，系统生成可运行的特效并进入预览，再允许继续对话迭代。

现实约束是：LLM 生成代码存在不确定性，且预览运行在浏览器/WebGL 环境中，运行时错误、性能问题、合约不符合都可能导致“预览不可用”。如果失败直接报错或白屏，会严重破坏创作体验。

本 Spec 定义 Preview Engine 的“分级兜底（Graded Fallback）”策略，确保：

- **硬承诺**：用户永远能看到“可预览的东西”（不白屏、不阻断），即便提示词复杂或连续失败。
- **软目标**：兜底不应是“同一个固定 demo”，而应尽可能贴近用户意图（风格/主体/节奏），让回退看起来是“降级成功”，而不是“失败”。

## 1. 范围（Scope）

### 1.1 本 Spec 覆盖

- Preview Engine 的分级兜底策略（L1-L4）与触发条件
- 失败学习（Failure Learning）：同 prompt 失败缓存、阈值策略、自动降级与澄清分流
- 前后端统一的回退信号（meta contract）与前端 UI 行为准则
- 兜底骨架库（Template Skeleton Library）的约束与最小集合
- 预览运行时安全网（Runtime Safety Net）：加载/执行失败捕获与自动切换兜底

### 1.2 非目标（本 Spec 不做）

- “保证每次都生成完全符合用户复杂意图的满意效果”（只能提升概率，不能 100% 保证）
- Zip 打包链路、剪映 SDK 接入（见蓝图 Phase 2/3）
- 完整的埋点与线上监控平台（可先本地日志/轻量记录，后续再接）

## 2. 现状盘点（与本 Spec 的关系）

### 2.1 现有生成与合约校验

- 后端生成接口：`POST /api/generate-effect`（支持 `?v=2` 走 v2 prompt 生成）
- 合约校验：后端 `validateEngineEffectCode` 会拒绝不符合 `EngineEffect` 合约的输出（禁止 DOM 操作、禁止 requestAnimationFrame 等）见 [server.js](file:///Users/bytedance/Downloads/cupcut-website/server.js#L652-L675)

### 2.2 现有前端调参（但不是预览兜底）

- 前端本地语义调参： [ai-chat.js](file:///Users/bytedance/Downloads/cupcut-website/src/site/ai-chat.js) 通过 `window.lastUIConfig` 做参数映射，仅覆盖“调参”，无法作为“预览必达”的系统兜底。

### 2.3 相关专项文档

- AI 导演台整体交互与生成策略： [2026-04-03-ai-director-console-design.md](file:///Users/bytedance/Downloads/cupcut-website/docs/superpowers/specs/2026-04-03-ai-director-console-design.md)
- 平台宏观蓝图： [2026-04-02-platform-blueprint-design.md](file:///Users/bytedance/Downloads/cupcut-website/docs/superpowers/specs/2026-04-02-platform-blueprint-design.md)

## 3. 术语与定义

- **Preview**：用户在 Web 端看到的可运行画面（可交互可调参）
- **EngineEffect 合约**：生成代码必须导出 `export default class EngineEffect`，并通过后端静态扫描的约束
- **Fallback**：为了保证 Preview 可用，在失败场景下触发的降级生成/回退策略
- **LKG（Last Known Good）**：上一次成功生成并运行的预览产物（代码/预览页引用/元信息）
- **Skeleton（骨架）**：一段经过验证稳定的“基础特效结构”，可通过参数/少量片段改变外观以贴近用户意图
- **Prompt Fingerprint**：同一用户提示词的归一化指纹（用于失败缓存与去重策略）

## 4. 设计原则（Principles）

- **永远可预览优先级最高**：宁可降级也不白屏。
- **兜底必须“意图相关”**：回退也要看起来像“为当前提示词服务”，而不是无关 demo。
- **分级、可解释、可控**：每次回退都要能被解释（meta）、可控（阈值/次数）、可观测（记录原因）。
- **有限消耗**：对上游模型重试次数有限；避免用户在同一 prompt 上无限消耗。
- **安全边界清晰**：任何生成/预览失败都不得破坏页面主流程，必须被隔离并快速回收。

## 5. 总体架构与数据流

Preview Engine 作为“生成 → 预览”的编排层，可落在“AI 导演台”调用链里：

1. 用户输入 prompt（以及可选澄清回答）
2. 后端生成（LLM 或兜底生成）→ 返回 `{ code, meta }`
3. 前端加载预览（沙盒/iframe/模块动态 import 等）→ 成功则写入 LKG；失败则触发下一层兜底
4. 前端 UI 始终展示一个可运行 preview（可能是兜底），并允许继续迭代

本 Spec 不强制 Preview Engine 在前端还是后端实现“全部逻辑”，但要求：

- **后端必须提供“兜底可用 code”**（至少 L3 级）以保证网络/生成失败时仍可预览
- **前端必须提供“运行时安全网”**以保证加载/执行失败时自动切换兜底

## 6. “二极管”分级兜底策略（核心）

**目标：15秒内要么成功看到新效果，要么瞬间看到安全兜底，绝不让用户白屏死等。**

### 6.1 L1：冲刺层（大模型生成）
- **触发**：用户输入全新需求或进行结构性修改。
- **动作**：请求后端大模型生成代码。
- **为了“尽力让 L1 就成功”的保障机制（重点）：**
  1. **Prompt 防御**：在系统提示词中极度明确安全边界（如：禁止使用不受支持的 WebGL 扩展、禁止引入外部未验证贴图、强制包裹在 `try/catch` 渲染循环中）。
  2. **语法/沙盒预检**：后端或前端在把代码塞入 iframe 前，做一次极速 AST 扫描或正则表达式拦截（禁止操作 DOM，必须包含 `export default class EngineEffect` 等）。
  3. **严格熔断**：设置 15 秒硬超时。

### 6.2 L2：瞬发兜底层（纯本地、0毫秒）
- **触发**：L1 超时、生成代码预检不通过、或注入 iframe 后运行时抛出致命错误。
- **动作**：前端立刻接管，**绝不发起二次大模型请求**。
  - **若存在上次成功预览（Last Known Good）**：画面瞬间切回上一帧安全状态。
  - **若是首次生成就失败**：瞬间加载本地内置的“高颜值保底骨架”（如极简发光粒子阵列）。
- **用户感知与摊牌**：在聊天框抛出一条 AI 消息：
  > “抱歉，刚才的效果有点复杂，渲染引擎撑不住了。我已经为你恢复了安全版本（或基础版本）。建议简化一下描述，比如去掉‘物理碰撞’再试一次。”

## 7. 失败学习（Failure Learning）

**目标：避免同一复杂提示词无限撞墙。**

1. **同 prompt 失败计数**：前端或后端记录同一用户的相同（或高度相似的 embeddings）prompt fingerprint。
2. **阈值策略**：若用户执意重试该提示词导致 L1 连续失败，前端直接拦截，进入“强制澄清/降级”对话，不再发大模型请求。
3. **Telemetry**：记录 L1 失败的代码段和原因（如超时、合约报错、运行时 WebGL 报错），用于后续优化 prompt 边界。

## 8. 兜底骨架库（Skeleton Library）

### 8.1 骨架设计约束

- 必须稳定可运行（长时间运行不崩溃）
- 性能可控（默认粒子/几何规模保守，支持按设备降级）
- 视觉中性但不廉价（避免过于“默认三维结”那种强烈 demo 感）
- 参数可驱动（至少：颜色/速度/密度/强度）
- 无外部资源依赖（可选内置噪声/程序纹理）

### 8.2 最小集合（建议 5 个）

- `skeleton_particles_field`：2D/伪 3D 粒子场（流动/吸引/涡旋）
- `skeleton_flow_lines`：流体线条/噪声流线
- `skeleton_glow_text`：发光文字（若文字渲染复杂，先用简化形状/点阵替代）
- `skeleton_geo_array`：几何阵列（点/线/面）+ 简洁运动
- `skeleton_glitch_overlay`：glitch/扫描线/色偏叠加（强度可控，避免频闪）

每个骨架应提供：

- `skeletonId`
- 默认参数（安全值）
- 可支持的意图标签（例如：粒子/线条/文字/glitch）

## 9. 前后端交互契约 (Meta Signals)

**目标：前端根据后端返回或本地报错做精确回退。**

`POST /api/ai-director/message` 或现有生成接口：

- 成功：
  ```json
  {
    "code": "...",
    "meta": { "isFallback": false }
  }
  ```
- 失败（后端已熔断）：
  ```json
  {
    "error": "生成超时或编译不通过",
    "meta": {
      "isFallback": true,
      "errorCode": "TIMEOUT_OR_CONTRACT_FAIL"
    }
  }
  ```

前端接收到 error，或前端拿到 code 运行报错时：**立刻触发 L2 本地兜底**。

## 10. 预览运行时安全网（Frontend Runtime Safety Net）

目标：即便后端返回了看似合规的 code，前端也要保证“加载失败不白屏”。

关键机制：

- **加载隔离**：优先在 iframe/沙盒上下文加载预览（避免污染主页面）
- **错误捕获**：捕获动态 import 失败、运行时异常、初始化超时
- **自动切换**：加载失败时，按 L2/L3/L4 逻辑切换 code，并把失败原因写入 meta（或本地日志）
- **可恢复**：切换后仍允许继续对话与调参（不进入死锁状态）

与现有模块的关系：

- Wizard 预览加载逻辑需要可复用（计划中已有抽取方向）见 [2026-04-03-ai-director-console.md](file:///Users/bytedance/Downloads/cupcut-website/docs/superpowers/plans/2026-04-03-ai-director-console.md#L15-L27)

## 11. UX 行为准则（用户感知）

- 任何回退都必须给用户一个“积极解释”：
  - 例：“为了保证稳定预览，我先生成一个简化版本；你可以继续说‘更密一点/更亮一点/更电影感’来迭代。”
- 同 prompt 连续失败时，不要无脑重复生成：
  - 直接提示并给出二选一澄清，或进入模板化兜底（仍然可看）
- 回退到 LKG 时要明确标识：
  - 例：“本次运行失败，已回退到上次成功预览。要不要我把需求简化成可稳定运行的版本再试一次？”

## 12. 验收与回归（Definition of Done）

### 12.1 必须通过的体验验收

- 任意 prompt 输入后，最终都能进入可预览状态（L0-L4 任一）
- 生成失败/运行失败时不会白屏，且有可理解提示
- 连续多次输入同一复杂 prompt，不会无限 loading，不会无限重试，能进入 L2/L3/L4 的稳定路径

### 12.2 建议的最小回归集合

- 典型明确 prompt（应 L0）：主体 + 风格 + 节奏
- 典型灰区 prompt（应进入澄清或 L2）：风格模糊/信息缺失
- 明显高风险 prompt（应 L2 或 L3）：超高粒子数/复杂后处理/外部依赖倾向
- 模拟运行失败（强制 throw）：应回退到 L3/L4 并可继续

## 13. 与现有系统的对齐点（索引）

- 后端合约校验与生成： [server.js](file:///Users/bytedance/Downloads/cupcut-website/server.js#L459-L692)
- 导演台专项计划： [2026-04-03-ai-director-console.md](file:///Users/bytedance/Downloads/cupcut-website/docs/superpowers/plans/2026-04-03-ai-director-console.md)
- 导演台现有设计： [2026-04-03-ai-director-console-design.md](file:///Users/bytedance/Downloads/cupcut-website/docs/superpowers/specs/2026-04-03-ai-director-console-design.md)

## 14. 开放问题（后续决策）

1. L3 骨架库的“审美基线”是否需要提供 2 套主题（偏暗/偏亮）以适配不同用户输入？
2. prompt fingerprint 的归一化规则要做到多强（是否对数字/时间表达做脱敏）？
3. 回退提示文案的语气：更偏“导演式引导”还是“系统式提示”？

