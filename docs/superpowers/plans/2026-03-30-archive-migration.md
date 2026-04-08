# Archive 迁出（Milestone 3）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将非 Core 内容（历史 demos/资源/子项目）从主仓库迁出到 `cupcut-website-archive`，显著减少主仓库文件数量与目录噪音，同时保证 Core 10 与 Creator 工具链不受影响。

**Architecture:** 主仓库只保留 Core 10 展厅（`demos.core.json` + 10 个 demo HTML + 运行时引擎/库）以及 Creator 工具链入口（`tools/creator`）。迁出动作以“清单驱动”为准：先生成 `docs/archive-manifest.md`（Keep/Move/Verify），再按清单迁移并在迁移后做两轮验证（首页 Core 10 + Creator API）。

**Tech Stack:** Git（跨仓库迁移）、Vite、Node/Express（Creator）

---

## Files

**Create**
- `/Users/bytedance/Downloads/cupcut-website/docs/archive-manifest.md`

**Modify**
- `/Users/bytedance/Downloads/cupcut-website/docs/project-cleanup-design.md`

---

### Task 1: 生成 Archive 迁移清单（Keep/Move/Verify）

**Files:**
- Create: `/Users/bytedance/Downloads/cupcut-website/docs/archive-manifest.md`

- [ ] **Step 1: 写入清单的三段结构**

清单必须包含三段：
1) `Keep（主仓库保留）`：必须保留的目录与文件（Core 10 + 引擎/库 + Creator 入口）
2) `Move（迁出到 archive 仓库）`：明确列出要迁出的目录与 demo 条目（至少包含：video-intro/、参考/、非 Core demo 条目）
3) `Verify（迁移后验证）`：迁移后需要人工/脚本验证的检查点（首页 Core 10、Studio/Creator、关键 demo 是否可打开）

---

### Task 2: 更新总体整理设计稿，指向 manifest

**Files:**
- Modify: `/Users/bytedance/Downloads/cupcut-website/docs/project-cleanup-design.md`

- [ ] **Step 1: 在 Archive 章节加入 manifest 链接**
增加一行说明：
- “迁移时以 `docs/archive-manifest.md` 为准”

---

### Task 3: 迁移执行步骤（跨仓库操作，需人工或可运行环境）

- [ ] **Step 1: 创建新仓库 cupcut-website-archive**
建议用空仓库初始化，作为历史/非 Core 内容的承载。

- [ ] **Step 2: 按 docs/archive-manifest.md 逐项迁移**
迁移建议策略：
- 优先迁出明显独立的顶层目录（video-intro/、参考/ 等）
- 再迁出 demos 目录中的非 Core demo HTML 与其专属资源

- [ ] **Step 3: 主仓库回归验证**
至少验证：
- 首页仅展示 10 个 Core demo
- 10 个 demo 都能通过 Lab 打开
- `npm run creator` 启动后 `/api/demos` 可访问（用于后续 UGC/管理）

