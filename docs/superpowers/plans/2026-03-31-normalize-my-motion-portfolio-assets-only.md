# 规范化：my-motion-portfolio 作为纯资源目录 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 删除 `my-motion-portfolio/` 中不再需要的 Vite 样板（`src/`、`index.html`、`package.json` 等），让项目只保留一个权威 `src/`，并把 `my-motion-portfolio/` 明确为纯运行时资源目录（只保留 `public/**`）。

**Architecture:** 不迁移任何运行时路径；仅删除无引用的子工程文件，并同步修正文档中对 `my-motion-portfolio/package.json` 的过期描述；最后用 build 验证无回归。

**Tech Stack:** Node/Vite（验证），文件系统变更（删除），Markdown（文档）

---

### Task 1: 盘点并删除 my-motion-portfolio 的 Vite 样板

**Files:**
- Delete: `/Users/bytedance/Downloads/cupcut-website/my-motion-portfolio/src/`
- Delete: `/Users/bytedance/Downloads/cupcut-website/my-motion-portfolio/index.html`
- Delete: `/Users/bytedance/Downloads/cupcut-website/my-motion-portfolio/package.json`
- Delete (if exists): `/Users/bytedance/Downloads/cupcut-website/my-motion-portfolio/package-lock.json`

- [ ] **Step 1: 确认运行时代码未引用 my-motion-portfolio/src**

Run (read-only): 搜索全仓库是否存在 `my-motion-portfolio/src` 引用。  
Expected: 无匹配。

- [ ] **Step 2: 执行删除**

使用删除操作移除上述路径（`public/**` 绝不删除）。

---

### Task 2: 修正文档中的过期描述

**Files:**
- Modify: `/Users/bytedance/Downloads/cupcut-website/DEVELOPMENT.md`

- [ ] **Step 1: 移除或改写对子项目配置的描述**

将 “子项目配置: my-motion-portfolio/package.json” 这一项删除或改为：
- “my-motion-portfolio 为纯资源目录，仅保留 public/**”

---

### Task 3: 验证

**Files:**
- Verify: `npm run build`

- [ ] **Step 1: 运行构建**

Run: `npm run build`  
Expected: exit code 0；`dist/my-motion-portfolio/public/**` 正常复制。

