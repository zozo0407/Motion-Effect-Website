# 拆分 Wizard + AI Chat（src/main.js → src/site/*）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 `src/main.js` 中的 Wizard（创意控制台）与 AI Chat（语义调参）逻辑抽离到独立模块，保持现有交互与 `window.*` 入口不变，使 `main.js` 更接近“装配层”。

**Architecture:** 新增 `src/site/ai-chat.js` 与 `src/site/wizard.js`，以依赖注入方式接入 `updateDemoParam/openLab/prependDemo/generateAIHTML/generateTemplateHTML` 等；`src/main.js` 负责 import、初始化顺序、以及统一的 `window.*` 绑定。

**Tech Stack:** Vite（ESM）、原生 DOM、GSAP/Lucide（全局）、Xenova transformers（远程 ESM import）

---

## 文件范围（锁定）

**Create**
- `/Users/bytedance/Downloads/cupcut-website/src/site/ai-chat.js`
- `/Users/bytedance/Downloads/cupcut-website/src/site/wizard.js`

**Modify**
- `/Users/bytedance/Downloads/cupcut-website/src/main.js`

**Verify**
- `npm run build`

---

## 约束（必须遵守）
- 不引入新依赖。
- 不改 UI/交互行为：Wizard 打开、步骤切换、AI Prompt 随机/补全、AI Chat Enter 发送、生成后的 demo 插入与 Lab 打开等必须保持一致。
- `window.*` 入口名称保持不变（至少包括：`window.openWizard`、`window.closeConsole`、`window.selectTemplate`、`window.fillRandomPrompt`、`window.enhancePrompt`、`window.sendAIChat`）。
- 避免在模块内部写 `window.* = ...`（统一在 `src/main.js` 绑定）。

---

## Task 1: 抽离 AI Chat（语义调参 + 聊天 UI）

**Files:**
- Create: `src/site/ai-chat.js`
- Modify: `src/main.js`

- [ ] **Step 1: 创建 ai-chat.js 并导出 initAIChat / sendAIChat**

从 `src/main.js` 中 “AI Chat Logic” 段落整体迁移到 `src/site/ai-chat.js`，改为模块内私有常量/函数，并导出：

```js
export function initAIChat({ updateDemoParam }) {}
export async function sendAIChat({ updateDemoParam }) {}
```

实现规则：
- `sendAIChat` 的核心逻辑保持原样（包括 `window.__aiSemantic` 缓存、语义匹配与 fallback 规则）。
- 原先对 `updateDemoParam(...)` 的调用改为使用注入参数 `updateDemoParam`。
- “Attach Enter Key for Chat” 的事件绑定移入 `initAIChat` 内：监听 `#ai-chat-input` 的 Enter 触发 `sendAIChat({ updateDemoParam })`。

- [ ] **Step 2: main.js 引入并绑定 window.sendAIChat**

在 `src/main.js` 顶部 import：

```js
import { initAIChat, sendAIChat } from './site/ai-chat.js';
```

并在 window 绑定区新增：

```js
window.sendAIChat = () => sendAIChat({ updateDemoParam });
```

同时在 `init()` 内调用：

```js
initAIChat({ updateDemoParam });
```

- [ ] **Step 3: 删除 main.js 内原 AI Chat 代码块**

确保 `src/main.js` 内不再包含：
- `window.__aiSemantic = ...` 初始化
- `AI_TYPE_HINTS / AI_COLOR_MAP / aiGetExtractor ...` 等函数
- `window.sendAIChat = async () => { ... }`
- chat input 的 keypress 绑定

---

## Task 2: 抽离 Wizard（Creative Console）

**Files:**
- Create: `src/site/wizard.js`
- Modify: `src/main.js`

- [ ] **Step 1: 创建 wizard.js 并导出所需 API**

把 `src/main.js` 中 “Wizard Logic” 段落（包含 `openWizard/closeConsole/currentTemplate/templates/AI_RANDOM_PROMPTS/AI_ENHANCEMENTS/selectTemplate/fillRandomPrompt/enhancePrompt/...`）整体迁移到 `src/site/wizard.js`。

导出 API（名称保持与现有 window 入口一致）：

```js
export function initWizard({ openLab, prependDemo, generateAIHTML, generateTemplateHTML }) {}
export function openWizard() {}
export function closeConsole() {}
export function selectTemplate(type) {}
export function fillRandomPrompt() {}
export function enhancePrompt() {}
```

实现规则：
- wizard 内如需要调用 `openLab/prependDemo/generateAIHTML/generateTemplateHTML`，统一通过 `initWizard` 传入并保存在模块内（避免循环依赖）。
- wizard 内若调用 `lucide.createIcons()` / `gsap` 等全局对象，保持原行为不变。
- `selectTemplate` 内原先对 `window.selectTemplate` 的依赖，改为内部函数互相调用（同名函数即可）。

- [ ] **Step 2: main.js 引入 wizard 并统一绑定 window 入口**

在 `src/main.js` 顶部 import：

```js
import {
  initWizard,
  openWizard,
  closeConsole,
  selectTemplate,
  fillRandomPrompt,
  enhancePrompt,
} from './site/wizard.js';
```

在 `init()` 内调用：

```js
initWizard({ openLab, prependDemo, generateAIHTML, generateTemplateHTML });
```

在 window 绑定区新增/替换：

```js
window.openWizard = openWizard;
window.closeConsole = closeConsole;
window.selectTemplate = selectTemplate;
window.fillRandomPrompt = fillRandomPrompt;
window.enhancePrompt = enhancePrompt;
```

- [ ] **Step 3: 删除 main.js 内原 Wizard 代码块**

确保 `src/main.js` 内不再包含：
- `function openWizard() { ... }`
- `function closeConsole() { ... }`
- `const templates = { ... }`、`AI_RANDOM_PROMPTS/AI_ENHANCEMENTS` 等
- `window.fillRandomPrompt / window.enhancePrompt / window.selectTemplate` 的实现
- 以及所有与 wizard UI 渲染、步骤切换相关的函数实现

---

## Task 3: 验证

- [ ] **Step 1: 运行构建**

Run: `npm run build`  
Expected: exit code 0

- [ ] **Step 2: 静态诊断**

检查编辑器诊断应为空（无语法错误、无未定义引用）。

---

## 验收清单（手动 smoke）
- 打开首页 → 点击 Wizard（创意控制台）→ 能正常打开并渲染（含随机灵感/智能补全按钮图标）
- Wizard 生成新作品 → 能插入到列表并可打开 Lab
- Lab 内 AI Chat 输入框 Enter 可发送，并能触发参数更新（UI_CONFIG 存在时）

