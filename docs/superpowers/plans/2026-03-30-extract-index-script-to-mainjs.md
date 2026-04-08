# 抽离 index.html 逻辑到 src/main.js Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 `index.html` 中的主业务脚本抽离为 `src/main.js`，让 `index.html` 变为“结构与资源引用为主”的薄入口文件，提升可维护性。

**Architecture:** 在 Vite 环境下新增 `/src/main.js` 并通过 `<script type="module" src="/src/main.js"></script>` 引入；把原来 `index.html` 里的主脚本内容原样迁移（尽量不改逻辑），保留对 `window.*` 的函数暴露，以兼容 HTML 内的 `onclick`/交互绑定；保留其它独立 module 脚本（例如 Background Model Preloader）在 `index.html` 中不动。

**Tech Stack:** HTML, Vanilla JS, Vite

---

## Files

**Create**
- `/Users/bytedance/Downloads/cupcut-website/src/main.js`

**Modify**
- `/Users/bytedance/Downloads/cupcut-website/index.html`

---

### Task 1: 提取主脚本到 src/main.js

**Files:**
- Create: `/Users/bytedance/Downloads/cupcut-website/src/main.js`

- [ ] **Step 1: 找到 index.html 的“主脚本块”边界**
定位 `index.html` 中负责网格渲染/Lab/Studio/全局事件挂载的那段脚本（含 `fetchDemos()`、`openLab()`、`toggleStudioMode()`、`init()` 等）。

- [ ] **Step 2: 原样迁移脚本内容到 src/main.js**
迁移规则：
- 保持脚本内部逻辑与顺序不变（尽量仅做“复制粘贴”级别改动）
- 保留对 `window.*` 的赋值（兼容 HTML onclick）
- 不引入新依赖、不改路径

---

### Task 2: index.html 改为引用 src/main.js

**Files:**
- Modify: `/Users/bytedance/Downloads/cupcut-website/index.html`

- [ ] **Step 1: 删除原主脚本块**
移除被迁移到 `src/main.js` 的那段主脚本内容。

- [ ] **Step 2: 新增脚本引用**
在原位置替换为：

```html
<script type="module" src="/src/main.js"></script>
```

- [ ] **Step 3: 保留其它脚本块不动**
例如 Background Model Preloader 的 module 脚本应继续留在 `index.html`。

---

### Task 3: 验证

- [ ] **Step 1: 静态自检**
编辑器 diagnostics：
- `src/main.js` 无语法错误
- `index.html` 无语法错误

- [ ] **Step 2: 行为回归（手动）**
在 `npm run dev` 下验证：
- 首页 Core 10 正常展示
- 点击任意卡片可进入 Lab 并正常运行
- 切换工作室模式不报错（若仍保留入口）

