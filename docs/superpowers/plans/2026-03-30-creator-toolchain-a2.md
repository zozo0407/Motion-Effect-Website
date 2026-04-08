# Creator 工具链收敛（方案 A2）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增 `tools/creator/` 作为 Creator 工具链统一入口，并提供 `npm run creator` 启动方式；在不搬迁现有 `server.js/scripts/prompts` 的前提下，降低仓库心智噪音与启动门槛。

**Architecture:** 保留根目录 `server.js` 为兼容入口；新增 `tools/creator/start.js` 作为稳定启动器（内部 `require('../../server.js')`）；根 `package.json` 新增 `creator` script 指向该启动器；补充 `tools/creator/README.md` 作为单一权威文档入口，并更新现有脚本与开发文档的启动提示；将 `.temp_previews/` 纳入 `.gitignore` 以避免临时文件污染。

**Tech Stack:** Node.js (CommonJS), npm scripts, Express（现有）

---

## Files

**Create**
- `/Users/bytedance/Downloads/cupcut-website/tools/creator/README.md`
- `/Users/bytedance/Downloads/cupcut-website/tools/creator/start.js`

**Modify**
- `/Users/bytedance/Downloads/cupcut-website/package.json`
- `/Users/bytedance/Downloads/cupcut-website/scripts/quick-preview.js`
- `/Users/bytedance/Downloads/cupcut-website/DEVELOPMENT.md`
- `/Users/bytedance/Downloads/cupcut-website/.gitignore`

---

### Task 1: 新增 Creator 入口目录与启动器

**Files:**
- Create: `/Users/bytedance/Downloads/cupcut-website/tools/creator/start.js`
- Create: `/Users/bytedance/Downloads/cupcut-website/tools/creator/README.md`

- [ ] **Step 1: 创建 tools/creator/start.js**

```js
require('../../server.js');
```

- [ ] **Step 2: 创建 tools/creator/README.md**
文档至少包含：
- Creator 是什么/什么时候用
- 启动命令：`npm run creator`
- 常用能力指引：`/api/demos`、`/preview/:id`、以及 quick-preview 的使用方式（保持与现状一致）
- 说明：根目录 `server.js` 仍为兼容入口（不作为推荐入口）

---

### Task 2: 提供 npm run creator

**Files:**
- Modify: `/Users/bytedance/Downloads/cupcut-website/package.json`

- [ ] **Step 1: 新增 scripts.creator**

```json
{
  "scripts": {
    "creator": "node tools/creator/start.js"
  }
}
```

---

### Task 3: 更新工具链提示与文档入口

**Files:**
- Modify: `/Users/bytedance/Downloads/cupcut-website/scripts/quick-preview.js`
- Modify: `/Users/bytedance/Downloads/cupcut-website/DEVELOPMENT.md`

- [ ] **Step 1: quick-preview 的提示文案改为 npm run creator**
将提示中的 `node server.js` 替换为 `npm run creator`（保持其它逻辑不变）。

- [ ] **Step 2: DEVELOPMENT.md 增加 Creator 工具链统一入口说明**
在构建/部署或相关章节加入：
- Creator 启动方式：`npm run creator`
- Creator 文档入口：`tools/creator/README.md`

---

### Task 4: 忽略临时目录

**Files:**
- Modify: `/Users/bytedance/Downloads/cupcut-website/.gitignore`

- [ ] **Step 1: 添加 .temp_previews/ 到 .gitignore**

```gitignore
.temp_previews/
```

---

### Task 5: 基础验证

- [ ] **Step 1: 静态自检**
确认新增文件可被 Node require、无语法错误；编辑器 diagnostics 为 0。

- [ ] **Step 2: 运行验证（如环境允许）**
Run:
```bash
npm run creator
```
Expected:
- 3000 端口可用（能访问 `/api/demos`）

