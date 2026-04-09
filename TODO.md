# 项目总看板 (TODO / Kanban)

> 这是本仓库的单一入口看板：用于在 Solo 任务之间“交接上下文”、承接 plans/specs，并持续暴露缺口与风险。

## 0. Snapshot

- **定位**：影像动态特效的 coding 平台（Web 端实时预览 + AI 生成 + 单文件导出闭环）
- **核心模块**：Hero / Demo Grid & Studio / Lab / Wizard / AI Chat（见 [README.md](file:///Users/bytedance/Downloads/cupcut-website/README.md#L71-L120)）
- **文档体系**：
  - 规格/设计（Spec/Design）：[docs/superpowers/specs](file:///Users/bytedance/Downloads/cupcut-website/docs/superpowers/specs)
  - 实施计划（Implementation Plan）：[docs/superpowers/plans](file:///Users/bytedance/Downloads/cupcut-website/docs/superpowers/plans)
  - 项目整理/阶段文档： [docs](file:///Users/bytedance/Downloads/cupcut-website/docs)
  - Trae specs（局部专题）：[.trae/specs](file:///Users/bytedance/Downloads/cupcut-website/.trae/specs)

## 1. Working Agreements

- **WIP 限制**：Now 同时最多 3 个，避免上下文污染
- **Definition of Done**：能跑通关键路径（dev + build 或对应 test），并在本看板中更新状态
- **更新节奏**：每完成一个可验收节点，把“结论/契约/下一步”沉淀到本看板或对应文档
- **链接优先**：任务卡片尽量指向对应的 plan/spec，而不是把长文本复制进看板

## 2. Kanban

### Now（进行中）

- [ ] 选择一个当前焦点专项（从 Next 里挑 1 个放到 Now，并补充验收标准）

### Next（已准备好）

- [ ] AI 导演台专项优化（实现与验收按 plan 执行）→ [2026-04-03-ai-director-console.md](file:///Users/bytedance/Downloads/cupcut-website/docs/superpowers/plans/2026-04-03-ai-director-console.md) / [design](file:///Users/bytedance/Downloads/cupcut-website/docs/superpowers/specs/2026-04-03-ai-director-console-design.md)
- [ ] 平台蓝图落地：从“产品与架构蓝图”抽出可执行的 Phase 1 里程碑与验收项 → [2026-04-02-platform-blueprint-design.md](file:///Users/bytedance/Downloads/cupcut-website/docs/superpowers/specs/2026-04-02-platform-blueprint-design.md)
- [ ] Main.js 拆分后的持续收口（模块边界、回归清单、文档对齐）→ [2026-03-30-split-mainjs.md](file:///Users/bytedance/Downloads/cupcut-website/docs/superpowers/plans/2026-03-30-split-mainjs.md) / [design](file:///Users/bytedance/Downloads/cupcut-website/docs/superpowers/specs/2026-03-30-split-mainjs-design.md)

### Later（想法池 / 待评估）

- [ ] 全自动打包（ZipPackager）路径与接口草案（对应 blueprint Phase 2）
- [ ] 参数 schema（JSON Schema）与 Wizard UI 的双向映射策略（对应 blueprint 的“JS + Schema”数据契约）
- [ ] 更清晰的 Demo 分类与数据源治理（Core/UGC/Archive 的长期结构）

### Done（近期完成 / 归档）

- [ ] 从 plans/specs 汇总总看板（本文件创建）

## 3. Source Index（现有 plans/specs 汇总）

### 3.1 平台蓝图 / 产品规格

- Spec：AI 驱动特效原型工坊 - 产品与架构蓝图 → [2026-04-02-platform-blueprint-design.md](file:///Users/bytedance/Downloads/cupcut-website/docs/superpowers/specs/2026-04-02-platform-blueprint-design.md)

### 3.2 AI 导演台（AI Chat / Prompt Engine）

- Plan：AI 导演台专项优化 → [2026-04-03-ai-director-console.md](file:///Users/bytedance/Downloads/cupcut-website/docs/superpowers/plans/2026-04-03-ai-director-console.md)
- Design：AI 导演台专项优化设计 → [2026-04-03-ai-director-console-design.md](file:///Users/bytedance/Downloads/cupcut-website/docs/superpowers/specs/2026-04-03-ai-director-console-design.md)
- 相关代码模块：
  - 前端： [ai-chat.js](file:///Users/bytedance/Downloads/cupcut-website/src/site/ai-chat.js), [wizard.js](file:///Users/bytedance/Downloads/cupcut-website/src/site/wizard.js)
  - 后端： [server.js](file:///Users/bytedance/Downloads/cupcut-website/server.js)
  - Prompt 素材： [prompts](file:///Users/bytedance/Downloads/cupcut-website/prompts)

### 3.3 入口脚本与模块化重构

- Plan：拆分 main.js → [2026-03-30-split-mainjs.md](file:///Users/bytedance/Downloads/cupcut-website/docs/superpowers/plans/2026-03-30-split-mainjs.md)
- Design：拆分 main.js 设计 → [2026-03-30-split-mainjs-design.md](file:///Users/bytedance/Downloads/cupcut-website/docs/superpowers/specs/2026-03-30-split-mainjs-design.md)
- Plan：把 index.html 主脚本抽到 main.js → [2026-03-30-extract-index-script-to-mainjs.md](file:///Users/bytedance/Downloads/cupcut-website/docs/superpowers/plans/2026-03-30-extract-index-script-to-mainjs.md)

### 3.4 Build 瘦身 / Core 产物

- Plan：build slim core（只复制 Core 必需 public 子集）→ [2026-03-30-build-slim-core.md](file:///Users/bytedance/Downloads/cupcut-website/docs/superpowers/plans/2026-03-30-build-slim-core.md)
- Plan：Core demos homepage 收口 → [2026-03-30-core-demos-homepage.md](file:///Users/bytedance/Downloads/cupcut-website/docs/superpowers/plans/2026-03-30-core-demos-homepage.md)

### 3.5 Creator 工具链

- Plan：Creator toolchain A2 → [2026-03-30-creator-toolchain-a2.md](file:///Users/bytedance/Downloads/cupcut-website/docs/superpowers/plans/2026-03-30-creator-toolchain-a2.md)
- 开发说明： [DEVELOPMENT.md](file:///Users/bytedance/Downloads/cupcut-website/DEVELOPMENT.md)

### 3.6 Archive/迁移/项目整理

- 迁移蓝图： [project-cleanup-design.md](file:///Users/bytedance/Downloads/cupcut-website/docs/project-cleanup-design.md#L1-L13)
- 迁移清单（Keep/Move/Verify）： [archive-manifest.md](file:///Users/bytedance/Downloads/cupcut-website/docs/archive-manifest.md#L1-L12)
- Plan：archive migration → [2026-03-30-archive-migration.md](file:///Users/bytedance/Downloads/cupcut-website/docs/superpowers/plans/2026-03-30-archive-migration.md)

### 3.7 资产整理 / 文档对齐

- Plan：normalize my-motion-portfolio assets only → [2026-03-31-normalize-my-motion-portfolio-assets-only.md](file:///Users/bytedance/Downloads/cupcut-website/docs/superpowers/plans/2026-03-31-normalize-my-motion-portfolio-assets-only.md)
- Design：normalize my-motion-portfolio assets only → [2026-03-31-normalize-my-motion-portfolio-assets-only-design.md](file:///Users/bytedance/Downloads/cupcut-website/docs/superpowers/specs/2026-03-31-normalize-my-motion-portfolio-assets-only-design.md)
- Plan：README module map → [2026-03-31-readme-module-map.md](file:///Users/bytedance/Downloads/cupcut-website/docs/superpowers/plans/2026-03-31-readme-module-map.md)

### 3.8 Wizard / AI 代码拆分

- Plan：split wizard ai → [2026-03-31-split-wizard-ai.md](file:///Users/bytedance/Downloads/cupcut-website/docs/superpowers/plans/2026-03-31-split-wizard-ai.md)

### 3.9 Trae Specs（局部专题）

- Spec：integrate-ai-codegen → [spec.md](file:///Users/bytedance/Downloads/cupcut-website/.trae/specs/integrate-ai-codegen/spec.md#L1-L20)
- Tasks：integrate-ai-codegen → [tasks.md](file:///Users/bytedance/Downloads/cupcut-website/.trae/specs/integrate-ai-codegen/tasks.md#L1-L23)

## 4. Gaps & Risks（整体缺口清单）

### 4.1 项目“单一真相源”不足

- [ ] 定义“当前主线”与“暂停/废弃”的专项列表（避免 plans/specs 越堆越多但无人维护）
- [ ] 定义统一的文档索引规则（新 plan/spec 生成后必须在本看板登记）

### 4.2 验收与回归体系不足

- [ ] 建立跨模块 Smoke Checklist（dev 关键路径 + build）并固化在 `docs/` 或本看板
- [ ] 把 AI 导演台等关键链路的 contract/shape 变更策略写清楚（前后端对齐方式）

### 4.3 运行/部署/环境变量说明不足

- [ ] 记录 `.env` 中关键开关的含义、默认值与安全边界（例如 AI_MODEL 的可选项与行为差异）
- [ ] 明确 dev / build / preview / server 运行方式的差异与推荐入口（避免“能跑但不知道怎么跑”）

### 4.4 数据契约与参数体系缺口

- [ ] 把 blueprint 的“JS + JSON Schema”数据契约落成可执行的最小接口（至少定义 schema 的最小字段集合）
- [ ] 明确 Wizard UI 与 schema 的映射（生成、编辑、回写、版本兼容）

### 4.5 AI 导演台 Preview Engine（分级兜底）缺口

- [ ] 定义 Preview Engine 的“永远可预览”策略：L1 同提示词保守重试 → L2 自动降复杂度重生成 → L3 意图模板化（多骨架可变兜底）→ L4 Last Known Good（上次成功）
- [ ] 设计“失败学习”规则：同一 prompt 连续失败阈值与缓存策略；超过阈值自动进入澄清或降级路径，避免用户无限撞墙
- [ ] 统一前后端的回退信号：响应中显式携带 `meta.isFallback / meta.fallbackLevel / meta.errorCode / meta.errorSummary`，前端按 level 决定提示文案与 UI 行为
- [ ] 定义兜底骨架库（3–5 个）：粒子场 / 流体线条 / 发光文字 / 几何阵列 / glitch；保证稳定、性能可控、审美中性，且能被用户提示词驱动配色/节奏/密度
- [ ] 制定预览运行时安全网：加载/执行失败的捕获与自动切换兜底；确保不白屏、不阻断后续“继续对话修改”

### 4.5 质量与协作基础设施缺口

- [ ] 最小 CI（至少跑一次 build 与关键 tests）与失败排查指引
- [ ] 代码规范（lint/format）与提交规范（如果需要）对齐，减少多人协作摩擦
