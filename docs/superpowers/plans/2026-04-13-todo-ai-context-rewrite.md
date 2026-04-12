# TODO.md AI Context Rewrite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `TODO.md` 从偏看板的项目总表改写为适合新 AI 快速阅读的“项目总览 / AI Context”文档。

**Architecture:** 保留 `TODO.md` 文件名，但重写正文结构，弱化 Kanban 语气，只保留项目定位、愿景、当前阶段、系统全景、入口、运行方式、已完成、待完成、风险与相关文档等高层信息。所有事实必须来自仓库现有文档与代码入口，不新增未经验证的细节。

**Tech Stack:** Markdown、README、DEVELOPMENT、package.json、tools/creator/README、现有 plans/specs

---

## File Structure

- Modify: `TODO.md`
- Reference: `README.md`
- Reference: `DEVELOPMENT.md`
- Reference: `package.json`
- Reference: `tools/creator/README.md`
- Reference: `docs/superpowers/specs/2026-04-13-todo-ai-context-design.md`

### Task 1: 重写 TODO.md 为 AI Context 文档

**Files:**
- Modify: `TODO.md`
- Reference: `docs/superpowers/specs/2026-04-13-todo-ai-context-design.md`

- [ ] **Step 1: 读取现有 TODO.md 并标记要删除的板块**

删除或重写以下内容：

- `Working Agreements`
- `Kanban`
- `Now / Next / Later`
- 过细的 `Done` 明细
- 过细的 `Source Index`

保留但压缩以下内容：

- 项目定位
- 愿景
- 当前阶段
- 风险
- 文档入口

- [ ] **Step 2: 按新结构写出正文骨架**

新的一级结构应为：

```md
# 项目总览 / AI Context

## 1. 项目定位
## 2. 项目愿景
## 3. 当前阶段
## 4. 系统全景
## 5. 新 AI 从哪里开始理解
## 6. 运行方式
## 7. 已完成
## 8. 待完成
## 9. 风险与注意事项
## 10. 相关文档
```

- [ ] **Step 3: 用仓库现有事实填充高层内容**

正文必须体现以下事实：

```md
- 主站逻辑主要位于 `src/site/*`
- 运行时资源与 Demo 位于 `my-motion-portfolio/public/*`
- 当前后端入口是 `server/index.js`
- 根目录 `server.js` 仅作兼容入口
- Creator 工具链位于 `tools/creator/*`
- 常用命令是 `npm run dev`、`npm run creator`、`npm start`、`npm run build`
```

- [ ] **Step 4: 压缩已完成与待完成为高层摘要**

改写要求：

```md
- 已完成：只保留平台主干已建成的能力，不展开函数名和微观修复记录
- 待完成：只保留下一阶段方向，如 AI 导演台收口、运行方式统一、数据契约/schema、回归与 smoke checklist、预览稳定性
```

- [ ] **Step 5: 运行文档检查并人工复读**

Run: 使用诊断工具检查 `TODO.md`  
Expected: 无 diagnostics

人工检查：

- 新 AI 是否能在 1 到 2 分钟内读完
- 是否还残留明显的 Kanban 语气
- 是否出现未经验证的新事实

- [ ] **Step 6: Commit**

```bash
git add TODO.md docs/superpowers/plans/2026-04-13-todo-ai-context-rewrite.md
git commit -m "docs: rewrite TODO as AI context overview"
```
