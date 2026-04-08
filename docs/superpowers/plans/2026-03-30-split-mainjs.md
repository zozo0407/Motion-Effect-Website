# 拆分 src/main.js（方案 A）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将根 `src/main.js` 拆成若干功能域模块，让入口文件变成“装配 + 初始化 + window 绑定”，在不改行为的前提下显著提升可维护性。

**Architecture:** 以 ESM 模块拆分功能域（Hero / Lab / Boot / Demos / Studio / Wizard&AI / Templates 等），每次迁移一个功能域，保持原逻辑原样搬迁；`src/main.js` 负责 import、初始化顺序与 `window.*` 暴露。

**Tech Stack:** Vite（ESM）、原生 DOM、Three.js（import `three`）、GSAP/Lucide/Lenis（全局）

---

## 变更范围与文件结构（锁定）

**将创建：**
- `src/site/hero.js`
- `src/site/lab.js`
- `src/site/boot.js`
- `src/site/demos.js`
- `src/site/studio.js`
- `src/site/wizard.js`
- `src/site/templates.js`
- `src/site/ui.js`

**将修改：**
- `src/main.js`

## 全局约束（执行时必须遵守）
- 不引入新依赖、不改 UI 交互、不改 demo 清单与 API 形状。
- 保留并维持所有 `window.*` 对外 API 名称不变（兼容 `onclick`）。
- 初始化顺序保持一致（尤其是：`fetchDemos()` / `initGridInteractions()` / `runBootSequence()` 的时序）。

## 统一约定（避免拆分后变成“分散的全局”）

### 模块导出约定
- 每个模块导出 `initXxx()`（若该功能域需要初始化）以及必要的对外函数。
- `src/main.js` 负责：
  - 调用各 `initXxx()`
  - `window.* = ...` 的统一绑定（避免散落在各模块）

### 迁移方式约定
- 迁移代码时尽量“原样剪切粘贴”，只改：
  - 顶部 `import ...`（如果该模块需要）
  - 导出（`export function ...` / `export { ... }`）
  - 极少量跨模块依赖（优先通过 main.js 组装传参；实在不行再做模块间 import）

## Task 1: 抽离 Hero（Three shader 背景）

**Files:**
- Create: `/Users/bytedance/Downloads/cupcut-website/src/site/hero.js`
- Modify: `/Users/bytedance/Downloads/cupcut-website/src/main.js`
- Verify: `npm run build`

- [ ] **Step 1: 创建 hero.js（包含 initHero 原样搬迁）**

在 `src/site/hero.js` 写入（仅示意骨架，函数体直接从 `src/main.js` 的 “Liquid Distortion Shader (Three.js)” 区块整段搬迁）：

```js
import * as THREE from 'three';

let renderer, scene, camera, mesh, uniforms;
let animationId;
let resizeHandler;

export const initHero = () => {
  // 从 src/main.js 的 initHero 复制粘贴到这里（保持逻辑不变）
};
```

- [ ] **Step 2: main.js 里移除原 Hero 区块，改为 import**

在 `src/main.js` 顶部附近加入：

```js
import { initHero } from './site/hero.js';
```

并删除/移除原 `initHero` 定义及其配套的 `renderer/scene/...` 变量声明（避免重复定义）。

- [ ] **Step 3: 运行 build 验证不回归**

Run: `npm run build`  
Expected: exit code 0；dist 正常生成；无语法错误。

---

## Task 2: 抽离 Lab（iframe + Workbench + postMessage）

**Files:**
- Create: `/Users/bytedance/Downloads/cupcut-website/src/site/lab.js`
- Modify: `/Users/bytedance/Downloads/cupcut-website/src/main.js`
- Verify: `npm run build`

- [ ] **Step 1: 创建 lab.js 并搬迁 “Lab View Logic” 区块**

在 `src/site/lab.js` 写入骨架，并把以下函数/逻辑从 `src/main.js` 原样搬迁进去（保持函数名不变）：
- `syncGlobalCodeBtn`
- `loadMonaco`
- `openWorkbench` / `closeWorkbench`
- `updateDemoParam`
- `resetDemo`
- `openLab`
- `closeLab`
- `triggerSaveImage` / `triggerExportScriptScene` / `toggleRecording`
- `window.addEventListener('message', ...)`（UI_CONFIG 等消息处理）

建议导出（供 main.js 绑定到 window）：

```js
export function updateDemoParam(key, value) {}
export function resetDemo() {}
export function openLab(url, title, tag, isOriginal = true) {}
export function closeLab() {}
export function initLab() {}
```

其中 `initLab()` 里只做“事件绑定/监听初始化”，例如：
- workbench resize 的 pointer 事件
- global code button click
- message listener

- [ ] **Step 2: main.js 改为 import lab 模块并调用 initLab()**

在 `src/main.js` 顶部附近加入：

```js
import { initLab, updateDemoParam, resetDemo, openLab, closeLab } from './site/lab.js';
```

并删除 `src/main.js` 里原本的同名函数与事件监听代码块，避免重复绑定。

- [ ] **Step 3: 保持 window 绑定不变（仍在 main.js）**

在 `src/main.js` 保留这些绑定，但右侧引用改为模块 import 的函数：

```js
window.updateDemoParam = updateDemoParam;
window.resetDemo = resetDemo;
window.openLab = openLab;
window.closeLab = closeLab;
```

- [ ] **Step 4: build 验证**

Run: `npm run build`  
Expected: exit code 0。

---

## Task 3: 抽离 Boot Sequence（启动动画）

**Files:**
- Create: `/Users/bytedance/Downloads/cupcut-website/src/site/boot.js`
- Modify: `/Users/bytedance/Downloads/cupcut-website/src/main.js`
- Verify: `npm run build`

- [ ] **Step 1: 创建 boot.js 并导出 runBootSequence**

在 `src/site/boot.js` 导出：

```js
export const runBootSequence = ({ initHero, letters }) => {
  // 从 src/main.js 的 “Boot Sequence” 区块整段搬迁到这里
};
```

其中：
- `initHero` 由 main.js 传入（避免 boot.js 直接 import hero.js）
- `letters` 由 main.js 传入（保留现有 scramble 字符集）

- [ ] **Step 2: main.js 改为 import 并按原时序调用**

在 `src/main.js` 顶部附近加入：

```js
import { runBootSequence } from './site/boot.js';
```

并把原先的 `runBootSequence()` 调用替换为：

```js
runBootSequence({ initHero, letters });
```

- [ ] **Step 3: build 验证**

Run: `npm run build`  
Expected: exit code 0。

---

## Task 4: 抽离 Demos（列表获取 + Grid 渲染 + 搜索 + 过滤）

**Files:**
- Create: `/Users/bytedance/Downloads/cupcut-website/src/site/demos.js`
- Modify: `/Users/bytedance/Downloads/cupcut-website/src/main.js`
- Verify: `npm run build`

- [ ] **Step 1: 创建 demos.js，导出 fetchDemos/render/init**

在 `src/site/demos.js` 导出以下 API（函数体从 `src/main.js` 对应区块原样搬迁）：

```js
export let DEMO_LIST = [];

export async function fetchDemos() {}
export function renderDemoGrid() {}
export function sortSwitchButtons() {}
export function initGridInteractions({ openLab }) {}
export function initDemoFilters() {}
export function initSearch({ openLab }) {}
```

迁移要点：
- `initGridInteractions` / `initSearch` 需要调用 `openLab`，通过参数注入（避免 demos.js 强耦合 lab.js）
- `window.selectSearchResult = ...` 保留为导出函数，由 main.js 绑定到 window：

```js
export function selectSearchResultFactory({ openLab }) {
  return (id) => { /* 原 window.selectSearchResult 逻辑 */ };
}
```

- [ ] **Step 2: main.js 改为 import 并保持 init() 内调用顺序**

在 `src/main.js` 顶部附近加入：

```js
import {
  fetchDemos,
  sortSwitchButtons,
  initGridInteractions,
  initDemoFilters,
  initSearch,
  selectSearchResultFactory
} from './site/demos.js';
```

并在 `init()` 内保持原顺序：

```js
fetchDemos();
sortSwitchButtons();
initGridInteractions({ openLab });
initDemoFilters();
initSearch({ openLab });
window.selectSearchResult = selectSearchResultFactory({ openLab });
```

- [ ] **Step 3: build 验证**

Run: `npm run build`  
Expected: exit code 0。

---

## Task 5: 抽离 Studio（模式切换 + 拖拽 + delete/move）

**Files:**
- Create: `/Users/bytedance/Downloads/cupcut-website/src/site/studio.js`
- Modify: `/Users/bytedance/Downloads/cupcut-website/src/main.js`
- Verify: `npm run build`

- [ ] **Step 1: 创建 studio.js 并导出对外 API**

在 `src/site/studio.js` 导出：

```js
export function toggleStudioMode({ fetchDemos }) {}
export async function deleteDemo(id) {}
export async function moveDemo(id, direction) {}
export function initStudio() {}
```

迁移要点：
- `toggleStudioMode` 内若需要刷新列表，改为使用注入的 `fetchDemos`（保持现状：切换模式时会重新拉取/渲染）。

- [ ] **Step 2: main.js import + window 绑定保持不变**

在 `src/main.js` 顶部加入：

```js
import { initStudio, toggleStudioMode, deleteDemo, moveDemo } from './site/studio.js';
```

并在 main.js 保持：

```js
window.toggleStudioMode = () => toggleStudioMode({ fetchDemos });
window.deleteDemo = deleteDemo;
window.moveDemo = moveDemo;
```

- [ ] **Step 3: build 验证**

Run: `npm run build`  
Expected: exit code 0。

---

## Task 6: 抽离 Wizard / AI / Templates / 其它 UI 杂项

**Files:**
- Create: `/Users/bytedance/Downloads/cupcut-website/src/site/wizard.js`
- Create: `/Users/bytedance/Downloads/cupcut-website/src/site/templates.js`
- Create: `/Users/bytedance/Downloads/cupcut-website/src/site/ui.js`
- Modify: `/Users/bytedance/Downloads/cupcut-website/src/main.js`
- Verify: `npm run build`

- [ ] **Step 1: ui.js（text scramble + flipCard + 其它纯 UI 绑定）**

导出：

```js
export const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_//";
export function initTextScramble() {}
export function flipCard(card) {}
```

并在 main.js：

```js
import { letters, initTextScramble, flipCard } from './site/ui.js';
window.flipCard = flipCard;
```

- [ ] **Step 2: templates.js（generateTemplateHTML / generateAIHTML）**

导出：

```js
export function generateTemplateHTML(type, params) {}
export function generateAIHTML(code) {}
```

并在需要引用处从模块 import。

- [ ] **Step 3: wizard.js（openWizard + AI chat 相关 init）**

导出：

```js
export function openWizard() {}
export function initWizard() {}
```

并在 main.js：

```js
import { initWizard, openWizard } from './site/wizard.js';
window.openWizard = openWizard;
```

- [ ] **Step 4: 最终 build 验证**

Run: `npm run build`  
Expected: exit code 0。

---

## 最终验收（必须做）

- [ ] **Smoke 1（dev）**：打开首页 → 点击任一 demo → 进入 Lab → 返回
- [ ] **Smoke 2（dev）**：切换 Studio（如 UI 存在）→ demo 列表仍能刷新
- [ ] **Smoke 3（dev）**：验证 `onclick` 入口：`window.openLab` / `window.toggleStudioMode` / `window.openWizard` 可用
- [ ] **Build**：`npm run build` 通过

