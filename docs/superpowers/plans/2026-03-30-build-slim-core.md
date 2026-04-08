# 构建瘦身：仅打包 Core 10 + 必要资源 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将生产构建产物收口为“Core 10 展厅 + 引擎/库 + 必要资源（sample）”，避免整包复制 `my-motion-portfolio/public` 导致产物臃肿。

**Architecture:** 保留 Vite 的 build；将 `package.json` 的 build 后拷贝步骤替换为一个 Node 脚本 `tools/build/copy-core-public.js`：按白名单复制 `my-motion-portfolio/public` 下的必要子目录与文件（`js/`、`data/`、`demos/`、`sample/`、以及其它被 Core 引用的静态资产）。白名单由 `demos.core.json` 与固定列表共同决定，且先采用“保守白名单”以保证不破坏运行。

**Tech Stack:** Node.js (CommonJS), Vite

---

## Files

**Create**
- `/Users/bytedance/Downloads/cupcut-website/tools/build/copy-core-public.js`

**Modify**
- `/Users/bytedance/Downloads/cupcut-website/package.json`
- `/Users/bytedance/Downloads/cupcut-website/docs/project-cleanup-design.md`（可选）

---

### Task 1: 新增按白名单复制的构建脚本

**Files:**
- Create: `/Users/bytedance/Downloads/cupcut-website/tools/build/copy-core-public.js`

- [ ] **Step 1: 创建脚本（实现 copyCorePublic）**
脚本职责：
- 输入：项目根路径（隐式）、源目录 `my-motion-portfolio/public/`、目标目录 `dist/my-motion-portfolio/public/`
- 复制内容（保守白名单）：
  - 必须：`js/`、`data/`、`demos/`、`sample/`
  - 可选：`assets/`（如果存在且 Core 引用），以及其它 Core 依赖目录（后续再收口）
- 行为：
  - 先清空旧目标目录（仅目标目录）
  - 复制目录（递归）
  - 输出 JSON 报告：复制了哪些路径、总文件数

- [ ] **Step 2: 本地 dry-run（可选）**
若实现支持 `--dry-run`，则先跑 dry-run 查看将复制哪些目录。

---

### Task 2: 修改 npm run build 使用新脚本

**Files:**
- Modify: `/Users/bytedance/Downloads/cupcut-website/package.json`

- [ ] **Step 1: 替换 build 脚本的拷贝部分**
将原来的：
```json
"build": "vite build && mkdir -p dist/my-motion-portfolio && cp -r my-motion-portfolio/public dist/my-motion-portfolio/"
```
替换为：
```json
"build": "vite build && node tools/build/copy-core-public.js"
```

---

### Task 3: 验证构建产物

- [ ] **Step 1: 生产构建**
Run:
```bash
npm run build
```

Expected:
- `dist/` 生成成功
- `dist/my-motion-portfolio/public/demos/` 仅包含 Core demo 与必要文件
- `dist/my-motion-portfolio/public/sample/` 保留（因为 Core 引用）

- [ ] **Step 2: 手动回归**
在静态服务器环境下打开 `dist/index.html`（或用 Vite preview/任意静态 server）：
- 首页 Core 10 正常展示
- 任意 Core demo 可打开，且引用 sample 资源的 demo 不报 404

