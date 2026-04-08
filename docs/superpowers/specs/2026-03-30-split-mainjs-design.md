# 拆分 src/main.js（方案 A）设计稿

## 背景与目标

当前 [src/main.js](file:///Users/bytedance/Downloads/cupcut-website/src/main.js) 已从根 [index.html](file:///Users/bytedance/Downloads/cupcut-website/index.html) 抽离，但仍包含大量互相交织的站点逻辑（Hero、Demo Grid、Lab、Studio、Wizard、AI/Template 等）。为了让项目更清晰、降低回归风险，并为后续 UGC/Creator 迭代铺路，需要对 `src/main.js` 进行**最小风险**模块化拆分。

本设计稿采用你已确认的 **方案 A：最小风险模块化拆分**：
- **只改结构，不改行为**
- 保留现有 `window.*` 暴露（兼容 HTML `onclick`）
- 初始化顺序保持一致
- 不引入新依赖

## 非目标（本阶段不做）
- 不做 UI 重构/样式重构
- 不改动 demo 数据结构与 API 形状
- 不引入全局 store/状态管理库
- 不做大量“去全局化”或彻底消除共享变量（仅做可控收敛）

## 成功标准
- `npm run dev` 下：首页 Core 10、Studio 切换、Lab 打开/关闭、Wizard/AI 入口不回归
- `npm run build` 通过，产物正常
- `src/main.js` 体积显著下降（变成“装配 + 初始化 + window 绑定”）
- 未来新增功能时能明确定位到某个模块文件，而非继续堆在入口文件

## 约束与原则

### 1) 运行时兼容性
- 仍以 `index.html` 通过 `<script type="module" src="/src/main.js"></script>` 作为唯一入口。
- `window.*` 暴露是硬约束：例如 `window.openLab`、`window.toggleStudioMode` 等必须保留（名称不变）。

### 2) 最小侵入依赖处理（推荐：依赖注入）
模块之间尽量不直接互相 import 调用，而由 `main.js` 作为装配层：
- `createXxx(...)` / `initXxx(...)` 返回一组函数与初始化方法
- `main.js` 把需要的依赖以参数形式注入
- 这样拆分过程中不需要一次性重构大量共享变量

## 目标目录结构

在 `src/` 下新增站点模块目录（命名可按实际调整，本稿用 `site/`）：

```
src/
  main.js                 # 入口装配：import + init + window.* 暴露
  site/
    hero.js               # Hero three/shader 初始化与 resize/cleanup
    boot.js               # boot sequence / loading UI
    demos.js              # demo 列表获取与应用（Core/All）、demo grid 渲染入口
    ui.js                 # filter/sort/grid interactions/text scramble 等纯 UI 行为
    lab.js                # Lab iframe 打开/关闭与 postMessage 协议
    studio.js             # Studio 模式：切换、拖拽、silent save、delete/move
    wizard.js             # Wizard 流程
    ai-chat.js            # AI chat 逻辑（若与 wizard 强耦合，可先放 wizard）
    templates.js          # generateTemplateHTML / generateAIHTML
```

说明：
- 不要求一步到位拆到最细；允许以“功能域”为粒度逐步迁移。
- 若某块仍强依赖 DOM 与共享变量，优先保持“整体搬迁到模块”而不是“立刻抽象干净”。

## 模块边界与对外 API（草案）

> 这里描述的是“模块对 main.js 暴露什么”，避免 main.js 再长回去。

### hero.js
- `initHero()`：初始化 hero canvas / 动画循环
- （可选）`disposeHero()`：如当前逻辑已有清理代码，可原样保留并导出

### boot.js
- `runBootSequence()`：保留现有启动动画/日志逻辑（如存在）

### demos.js
- `fetchCoreDemos()` / `fetchAllDemos()` / `fetchDemos()`：保留现有数据源切换行为
- `applyDemoList(list)`：把 list 应用到运行时（原逻辑搬迁）
- `renderDemoGrid(filter?)`：渲染入口（若当前在 main.js 中）

### ui.js
- `sortSwitchButtons()` / `initGridInteractions()` / `bindFilters()` 等纯 UI 初始化函数
- `flipCard()` / `textScramble` 等只依赖 DOM 的行为

### lab.js
- `openLab(url, title, tech, isOriginal)` / `closeLab()`：对外 API（将继续绑定到 `window`）
- `updateDemoParam(...)` / `resetDemo(...)`：与 iframe 通讯相关的 API（如已有）
- `setupLabMessaging()`：集中处理 HANDSHAKE/UI_CONFIG/UPDATE_PARAM 等消息协议监听

### studio.js
- `toggleStudioMode()`：对外 API（将继续绑定到 `window`）
- `deleteDemo(id)` / `moveDemo(...)`：对外 API（如已有）
- `initStudioBindings()`：Studio 模式下拖拽/保存等事件绑定

### wizard.js / ai-chat.js / templates.js
- 以“把现有大段逻辑搬迁到独立文件”为第一目标
- 对外只暴露 main.js 需要调用的 `init...()` 与少量 UI API

## 初始化顺序（保持与现状一致）

`main.js` 的职责：
1. 先初始化 Hero（如现状是尽早启动）
2. 然后初始化 Lab/UI/Studio/Wizard 等事件与监听
3. 调用 `fetchDemos()` + `sortSwitchButtons()` + `initGridInteractions()`
4. 初始化 Lenis（如存在）
5. 最后 `runBootSequence()`
6. 统一进行 `window.*` 绑定

拆分后要求：上述顺序在行为层面不改变。

## 迁移策略（最小回归）

采用“分块迁移 + 每步可运行”的方式：
- 每次只迁一个功能域（例如先迁 `hero`，再迁 `lab`，再迁 `demos`…）
- 迁移时优先：
  - 把整段代码剪切到新模块文件
  - 把模块需要访问的 DOM 查询与常量留在模块内
  - 把 main.js 中对外 API（`window.*`）改为引用模块导出
- 对共享变量处理优先级：
  1) 同一功能域内共享：留在模块内
  2) 跨功能域共享：先由 main.js 注入（函数参数/对象参数）
  3) 仍无法快速拆：临时集中到 `site/runtime.js`（仅作为过渡层；若需要再新增）

## 验证与回滚

验证清单：
- dev：打开首页，点击任一 demo → 进入 Lab → 返回
- dev：切换 Studio 模式（如 UI 存在）并确认 demo 列表仍可渲染
- dev：检查 `window.openLab` 等 onclick 入口仍有效
- build：`npm run build` 通过

回滚策略：
- 如果某一步迁移导致不可控回归：把对应模块内容临时回填到 main.js（保持 git diff 小且可逆）

## 风险点与规避
- **隐式全局变量依赖**：迁移时尽量保留原本的声明作用域；跨文件后通过显式参数传入。
- **DOM 查询时机**：某些元素需在 DOM ready 后；ESM 默认 deferred，但仍可能有时序差异。迁移保持 init() 的触发点一致。
- **事件监听重复绑定**：拆分后注意避免同一监听被多处 init；以“单一 init 入口”治理。

