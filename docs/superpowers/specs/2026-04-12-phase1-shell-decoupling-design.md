# Phase 1: 宿主页 Shell 与渲染 Runtime 解耦 — 精确拆分方案

## 0. 背景与目标

本方案是平台 4-Phase 演进蓝图中 Phase 1 的精确设计文档。

**核心判断**：Phase 1 不是"视觉上的左右双栏改版"，而是"宿主页 Workbench Shell 与 iframe Preview Runtime 的彻底解耦"。只有建立清晰的层次边界，Phase 2（VFX 引擎升级）和 Phase 3（AI 链路维稳）才能不被结构性耦合拖住。

**技术栈底线**：原生 JS + ES Modules + Three.js + iframe/sandbox，不引入 React/Vue 等重型框架。

**本 Spec 覆盖**：
1. 模块边界图
2. `lab.js` 拆分建议
3. `UnifiedRenderer.js` 职责洗牌清单
4. V1.0 标准化消息协议草案

**非目标**：不涉及 Phase 2 EffectComposer 集成、Phase 3 Code-Execution Agent 实现、Phase 4 性能加固的具体代码。

---

## 1. 模块边界图

### 1.1 三层架构总览

```
┌─────────────────────────────────────────────────────────────────────┐
│                     HOST SHELL (宿主页工作台)                        │
│                                                                     │
│  ┌──────────────────────┐  ┌──────────────────────────────────────┐ │
│  │   LEFT PANE          │  │   RIGHT PANE                        │ │
│  │                      │  │                                      │ │
│  │  ┌────────────────┐  │  │  ┌────────────────────────────────┐  │ │
│  │  │ AI Chat Zone   │  │  │  │                                │  │ │
│  │  │ (对话+状态)     │  │  │  │     <iframe>                  │  │ │
│  │  └────────────────┘  │  │  │     Preview Runtime            │  │ │
│  │  ┌────────────────┐  │  │  │     (UnifiedRenderer)          │  │ │
│  │  │ Control Zone   │  │  │  │                                │  │ │
│  │  │ (动态参数控件)  │  │  │  │                                │  │ │
│  │  └────────────────┘  │  │  │                                │  │ │
│  │  ┌────────────────┐  │  │  │                                │  │ │
│  │  │ Action Bar     │  │  │  │                                │  │ │
│  │  │ (导出/截图/录屏)│  │  │  │                                │  │ │
│  │  └────────────────┘  │  │  └────────────────────────────────┘  │ │
│  └──────────────────────┘  └──────────────────────────────────────┘ │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │  BRIDGE LAYER (消息路由 + 状态管理)                              ││
│  │  session-store / message-router / error-handler                 ││
│  └─────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 模块职责定义

| 层次 | 模块 | 职责 | 依赖方向 |
|------|------|------|----------|
| **Host Shell** | `lab-shell` | 工作台开关、布局管理、标题栏、状态栏 | 依赖 bridge |
| | `lab-controls` | 动态参数控件渲染、值同步、preset 管理 | 依赖 bridge |
| | `lab-actions` | 导出、截图、录屏、source upload、代码查看 | 依赖 bridge |
| | `lab-ai-chat` | AI 对话区 UI、消息展示、输入处理（由现有 `ai-chat.js` 重构而来） | 依赖 bridge |
| **Bridge Layer** | `lab-preview-bridge` | iframe 生命周期、消息收发、协议编解码 | 无上层依赖 |
| | `session-store` | 当前 session 状态（UIConfig、LKG、错误记录） | 无上层依赖 |
| **Preview Runtime** | `UnifiedRenderer` | Three.js/P5/Shader 渲染循环、参数应用、错误上报 | 仅依赖 bridge 协议 |

### 1.3 依赖规则（铁律）

1. **Host Shell 模块之间不直接互引**，统一通过 `session-store` 读写共享状态。
2. **Host Shell 与 Preview Runtime 之间零直接 DOM 操作**，所有交互走 `postMessage` 协议。
3. **UnifiedRenderer 不允许访问 `window.parent.document`**，不允许向父页面插入任何 DOM 元素。
4. **Bridge Layer 不依赖任何 Host Shell 模块**，它只做消息路由和状态持久化。

### 1.4 数据流方向

```
用户操作 → Host Shell 模块
         → session-store (更新状态)
         → lab-preview-bridge (编码消息)
         → postMessage → iframe

iframe 内部:
  UnifiedRenderer 收到消息
  → 应用参数 / 执行动作
  → postMessage → parent

parent 收到:
  lab-preview-bridge (解码消息)
  → session-store (更新状态)
  → Host Shell 模块 (响应式更新 UI)
```

---

## 2. lab.js 拆分建议

### 2.1 现状问题

当前 `lab.js` 是一个 992 行的 God Module，同时承担：
- 工作台弹层开关与布局
- iframe 加载与生命周期
- 动态控件生成（range/color/checkbox/select/text/button/row/file/presets 共 10 种控件类型）
- 录屏/截图/导出
- `postMessage` 全量分发（UI_CONFIG / GAME_JS_SOURCE / IMAGE_DATA / REC_BLOB / REC_ERROR）
- source upload / aspect ratio / 全局代码按钮同步
- demo 特判逻辑（按文件名隐藏左栏）

### 2.2 拆分方案

#### 文件 1: `lab-shell.js` — 工作台壳层

**职责**：工作台的"容器"，管开关、布局、标题。

```js
// 导出 API
export function openShell(url, title, tag, options)  // 打开工作台
export function closeShell()                          // 关闭工作台
export function initShell()                           // 初始化 DOM 引用
export function getShellState()                       // 返回 { isOpen, title, tag }
```

**接管内容**：
- `openLab()` 中的弹层显示/隐藏、标题设置、gsap 动画
- `closeLab()` 中的关闭逻辑
- `initLab()` 中的 DOM 引用获取（labView, loader 等）
- 左栏可见性控制（从 `openLab` 中的 hiddenDemos 特判逻辑迁移进来，但后续应改为配置驱动）

**不接管**：
- iframe src 设置（归 bridge）
- 动态控件渲染（归 controls）
- 消息监听（归 bridge）

#### 文件 2: `lab-preview-bridge.js` — iframe 生命周期与消息路由

**职责**：iframe 的"脐带"，管加载、握手、消息编解码。

```js
// 导出 API
export function initBridge(iframeElement, handlers)   // 绑定 iframe + 注册消息处理器
export function loadPreview(url)                      // 设置 iframe.src 并触发加载
export function sendMessage(type, payload)            // 向 iframe 发送结构化消息
export function destroyBridge()                       // 清理监听器
export function getBridgeState()                      // 返回 { isLoading, sessionId, lastError }
```

**接管内容**：
- `contentFrame.onload` 回调（HANDSHAKE 发送、shim 注入）
- `window.addEventListener('message', ...)` 全局消息监听
- 消息类型分发：`UI_CONFIG` → controls handler, `IMAGE_DATA` → actions handler, `REC_BLOB` → actions handler, `GAME_JS_SOURCE` → actions handler, `REC_ERROR` / `DEMO_ERROR` → error handler
- iframe src 设置
- `postMessage` 发送（`HANDSHAKE`, `UPDATE_PARAM`, `START_REC`, `STOP_REC`, `SAVE_IMAGE`, `EXPORT_SCRIPT_SCENE`, `REQUEST_GAME_JS_SOURCE`, `FILE_UPLOAD`, `LOAD_SOURCE`）

**关键设计**：
- `initBridge` 接收一个 `handlers` 对象，按消息类型分发，不再由一个巨型 switch 处理
- 每次加载新 preview 时生成 `sessionId`，所有消息携带此 ID，防止过期消息干扰
- 错误消息统一路由到 `session-store` 的错误记录

#### 文件 3: `lab-controls.js` — 动态参数控件

**职责**：将 `UI_CONFIG` 渲染为可交互控件，并将用户操作回写到 bridge。

```js
// 导出 API
export function renderControls(config)                // 渲染控件到 #dynamic-controls
export function updateControlValue(bind, value)       // 单个控件值更新（不触发 postMessage）
export function resetControls()                       // 重置到默认值
export function getCurrentConfig()                    // 返回当前 UIConfig 快照
export function initControls(container, { onParamChange }) // 初始化容器与回调
```

**接管内容**：
- `UI_CONFIG` 消息处理中的全部 DOM 生成逻辑（range/color/checkbox/select/text/button/row/file/presets）
- `resetDemo()` 逻辑
- `updateDemoParam()` 的 UI 侧部分（更新控件显示值）
- preset 按钮的点击与激活态管理

**关键设计**：
- `onParamChange(bind, value)` 回调由调用方（lab-shell 组装时）注入，内部调用 `lab-preview-bridge.sendMessage('UPDATE_PARAM', { bind, value })`
- 不再直接操作 `contentFrame.contentWindow.postMessage`，全部通过 bridge
- `window.lastUIConfig` 迁移到 `session-store`，控件模块通过 `getCurrentConfig()` 读取

#### 文件 4: `lab-actions.js` — 导出/截图/录屏/上传

**职责**：所有"从 preview 获取产物"的动作。

```js
// 导出 API
export function triggerSaveImage()                    // 截图
export function triggerExportScriptScene()             // 导出 scriptScene
export function triggerExportGameJS()                  // 导出 game.js
export function toggleRecording()                      // 录屏开关
export function handleFileUpload(files)                // 文件上传
export function handleSourceUpload(file)               // 输入源上传
export function initActions({ sendMessage, onBanner }) // 初始化，注入 bridge 通信能力
```

**接管内容**：
- `triggerSaveImage()`, `triggerExportScriptScene()`, `triggerExportGameJS()`, `toggleRecording()`
- `IMAGE_DATA`, `REC_BLOB`, `REC_ERROR`, `GAME_JS_SOURCE` 消息的 UI 响应（banner 展示/下载触发）
- `toMinigameGameJS()` 代码转换逻辑
- `sanitizeExportPrefix()` 导出文件名清理
- `openExportSettings()` 导出设置弹窗
- `file-upload` 和 source upload 事件绑定

**关键设计**：
- 不再直接调用 `contentFrame.contentWindow.postMessage`，通过注入的 `sendMessage` 回调
- banner 展示逻辑提取为 `onBanner(type, data)` 回调，由 shell 层决定展示方式

### 2.3 拆分后的组装方式

在 `main.js` 中，由一个新的轻量入口 `lab.js`（重写版，< 80 行）负责组装：

```js
// lab.js (新版，纯组装入口)
import { initShell, openShell, closeShell } from './lab-shell.js'
import { initBridge, sendMessage, loadPreview } from './lab-preview-bridge.js'
import { initControls, renderControls, resetControls } from './lab-controls.js'
import { initActions, triggerSaveImage, triggerExportScriptScene, triggerExportGameJS, toggleRecording } from './lab-actions.js'
import { initAIChat } from './lab-ai-chat.js'
import { getSession, updateSession } from './session-store.js'

export function initLab() {
  const iframe = document.getElementById('content-frame')
  
  initBridge(iframe, {
    onUIConfig: (config) => {
      updateSession({ uiConfig: config })
      renderControls(config)
    },
    onImageData: (data) => handleBanner('image', data),
    onRecBlob: (data) => handleBanner('recording', data),
    onRecError: (data) => handleBanner('error', data),
    onGameJSSource: (data) => handleGameJSDownload(data),
    onDemoError: (data) => updateSession({ lastError: data }),
  })

  initControls(document.getElementById('dynamic-controls'), {
    onParamChange: (bind, value) => sendMessage('UPDATE_PARAM', { bind, value })
  })

  initActions({
    sendMessage,
    onBanner: (type, data) => handleBanner(type, data)
  })

  initShell()
  initAIChat({ onParamChange: (bind, value) => sendMessage('UPDATE_PARAM', { bind, value }) })
}

export function openLab(url, title, tag, isOriginal) {
  initLab()
  openShell(title, tag)
  loadPreview(url)
}

export function closeLab() {
  closeShell()
}

// 以下 re-export 保持 main.js 的 window.xxx 暴露点不变
export { updateDemoParam } from './lab-controls.js'
export { resetDemo as resetControls } from './lab-controls.js'
export { triggerSaveImage, triggerExportScriptScene, triggerExportGameJS, toggleRecording } from './lab-actions.js'
```

### 2.4 迁移兼容策略

拆分采用**渐进式**，不是一次性重写：

1. **第一步**：新建 4 个文件，每个文件先从 `lab.js` 中"搬出"对应函数，`lab.js` 改为 re-export，保证外部调用不变。
2. **第二步**：`main.js` 中的 `window.xxx` 暴露点逐步指向新模块。
3. **第三步**：确认所有 demo 正常后，删除 `lab.js` 中的旧实现。
4. **第四步**：`lab.js` 收缩为纯组装入口（< 80 行）。

---

## 3. UnifiedRenderer.js 职责洗牌清单

### 3.1 设计原则

**一句话**：UnifiedRenderer 应该是"渲染 runtime"，不是"工作台 UI"。

它只负责：
- 在 iframe 内部创建和管理 Three.js/P5/Shader/Splat 渲染循环
- 接收参数变更并应用到渲染
- 上报 UI 配置、运行状态、错误信息

它**不再负责**：
- 向父页面插入任何 DOM 元素
- 创建代码编辑器、工作台、聊天 UI
- 管理父页面的按钮状态

### 3.2 剥离清单（上浮给 Host Shell）

| 当前代码位置 | 功能 | 剥离去向 | 剥离优先级 |
|-------------|------|----------|-----------|
| `_setupEditor()` (L195-253) | 创建 code button 并插入父页面 `lab-ui-top-right` | Host Shell 的 Action Bar | **P0 必须剥离** |
| `_getCodeContainer()` (L139-143) | 访问 `window.parent.document.getElementById('lab-ui-top-right')` | 删除，Host Shell 自行管理 | **P0 必须剥离** |
| `_getStatsContainer()` (L145-149) | 访问 `window.parent.document.getElementById('lab-ui-top-left')` | Stats 改为 iframe 内部绝对定位，或通过消息上报 | **P0 必须剥离** |
| `_getUIRoot()` (L128-137) | 跨 iframe 访问父页面 DOM 的通用方法 | 删除，禁止跨 iframe DOM 操作 | **P0 必须剥离** |
| `_createWorkbench()` (L340-475) | 在 iframe 内创建完整工作台 UI（Monaco + Chat） | Host Shell 的 Workbench | **P0 必须剥离** |
| `_openEditor()` / `_closeEditor()` (L255-338) | 工作台开关逻辑 | Host Shell 的 Workbench | **P0 必须剥离** |
| `_bindWorkbenchUI()` (L477-498) | 工作台按钮绑定 | Host Shell 的 Workbench | **P0 必须剥离** |
| `_bindWorkbenchEvents()` (L500-517) | 工作台键盘事件 | Host Shell 的 Workbench | **P0 必须剥离** |
| `_applyWorkbenchWidth()` (L519-529) | 工作台宽度调整 | Host Shell 的 Workbench | **P0 必须剥离** |
| `_startWorkbenchResize()` / `_handleWorkbenchResize()` / `_stopWorkbenchResize()` (L531-569) | 工作台拖拽调整 | Host Shell 的 Workbench | **P0 必须剥离** |
| `_addChatMessage()` (L571-595) | Chat UI 消息渲染 | Host Shell 的 AI Chat Zone | **P0 必须剥离** |
| `_handleMockAI()` (L597-632) | Mock AI 逻辑 | 删除，Phase 3 由真正的 Agent 接管 | **P0 必须剥离** |
| `_fetchSourceCode()` (L634-648) | 获取自身源码 | Host Shell 的 Workbench（通过 fetch iframe URL 获取） | **P1 剥离** |
| `_runEditorCode()` (L650-703) | 在 iframe 内重执行代码 | Host Shell 的 Workbench（通过 bridge 发消息让 iframe 重载） | **P1 剥离** |
| `_exportToScriptScene()` (L705-866) | 导出 scriptScene | Host Shell 的 `lab-actions.js` | **P1 剥离** |
| `_exportToCapCut()` / `_exportToGameJS()` (L868-885) | 导出 game.js | Host Shell 的 `lab-actions.js` | **P1 剥离** |
| `_cleanupUI()` (L151-158) | 清理插入父页面的 UI 元素 | 删除，不再向父页面插入元素 | **P0 必须剥离** |
| `window.__unified_workbench_open` / `window.__unified_monaco_instance` (L216-222, L262, L313, L317) | 全局工作台状态标记 | Host Shell 的 session-store | **P0 必须剥离** |

### 3.3 保留清单（引擎内部职责）

| 当前代码位置 | 功能 | 保留理由 | 是否需要改造 |
|-------------|------|----------|-------------|
| `_setup()` (L160-193) | 初始化渲染环境 | 核心职责 | 改造：移除 `_setupEditor()` 调用 |
| `_setupThree()` (L978-1006) | Three.js 场景/相机/渲染器初始化 | 核心职责 | 保留 |
| `_setupShaderMode()` (L1008-1043) | Shader 全屏四边形初始化 | 核心职责 | 保留 |
| `_setupP5()` (L1045-1075) | P5.js 实例初始化 | 核心职责 | 保留 |
| `_setupSplat()` (L887-976) | Gaussian Splat 加载 | 核心职责 | 保留 |
| `_setupEvents()` (L1077-1134) | resize/mouse/touch 事件 | 核心职责 | 保留 |
| `_onResize()` (L1136-1164) | 响应式调整 | 核心职责 | 保留 |
| `_setupMessaging()` (L1166-1213) | 消息监听 | 核心职责 | **改造：升级为 V1.0 协议** |
| `_setupErrorHandling()` / `_handleError()` (L76-126) | 错误捕获与上报 | 核心职责 | **改造：错误通过协议上报，不再直接操作 DOM** |
| `_loop()` (L1464-1515) | 渲染循环 | 核心职责 | 保留 |
| `play()` / `pause()` (L1451-1462) | 播放控制 | 核心职责 | 保留 |
| `dispose()` / `disposeRuntime()` (L1218-1398) | 资源清理 | 核心职责 | 改造：移除工作台相关清理 |
| `capture()` (L1419-1430) | 截图 | 核心职责 | 保留 |
| `setUI()` / `createUI()` / `sendConfig()` (L1432-1449) | UI 配置上报 | 核心职责 | **改造：通过 V1.0 协议发送** |
| `_getContainerMetrics()` (L60-74) | 容器尺寸获取 | 核心职责 | 保留 |
| `_disposeMaterial()` (L1400-1409) | 材质清理 | 核心职责 | 保留 |
| `constructor` (L15-58) | 初始化 | 核心职责 | **改造：移除 editor 相关选项** |

### 3.4 改造后的 UnifiedRenderer 公开 API

```js
class UnifiedRenderer {
  constructor(options) {
    // 保留的选项：
    //   container, type, params, onParamChange, showStats,
    //   buffers, audio, mouseDragOnly, fragmentShader,
    //   init/onInit, update, draw, customRender, onResize, onDispose
    //
    // 移除的选项：
    //   (无 editor/workbench 相关选项，这些从未在 options 中暴露，
    //    但内部方法 _setupEditor 等需要删除)
  }

  // 保留的公开方法
  play()
  pause()
  dispose()
  disposeRuntime()
  capture(format, quality)
  setUI(config)
  createUI(config)    // alias
  sendConfig()

  // 新增的协议方法
  handleMessage(envelope)   // 接收 V1.0 协议信封，内部路由到具体处理
}
```

### 3.5 _handleError 改造方案

**现状**：直接在 iframe 内创建红色错误 overlay DOM。

**改造后**：
1. 仍然在 iframe 内显示轻量错误提示（保留用户可见性）
2. 同时通过 V1.0 协议向 Host Shell 上报 `RUNTIME_ERROR` 消息
3. Host Shell 收到后更新 session-store，左侧 AI Chat Zone 可展示错误信息和建议

```js
_handleError(error) {
  console.error("UnifiedRenderer Caught Error:", error)
  this.pause()

  // 上报 Host Shell
  this._sendProtocolMessage('RUNTIME_ERROR', {
    message: error.toString(),
    stack: error.stack || null,
    timestamp: Date.now()
  })

  // iframe 内轻量提示（保留，但简化）
  this._showErrorOverlay(error.toString())
}
```

### 3.6 Stats 展示改造方案

**现状**：Stats DOM 插入父页面 `lab-ui-top-left`。

**改造后**：
- Stats DOM 改为 iframe 内部绝对定位（左上角）
- 同时通过协议周期性上报 FPS 数据（可选，供 Host Shell 状态栏使用）

```js
// _setup() 中
if (this.showStats) {
  this.stats = new Stats()
  this.stats.dom.style.position = 'absolute'
  this.stats.dom.style.top = '0'
  this.stats.dom.style.left = '0'
  this.stats.dom.style.zIndex = '10'
  this.container.appendChild(this.stats.dom)  // 插入 iframe 内部容器
}
```

---

## 4. V1.0 标准化消息协议草案

### 4.1 设计目标

- 替代当前裸字符串 `type` 消息，引入结构化信封
- 支持 `channel`（消息通道）、`version`（协议版本）、`sessionId`（会话标识）
- 为 Phase 3 的 Agent 报错捕获、Auto-healing 重试打好基础
- 向后兼容：旧 demo 仍发送裸 `type` 消息时，bridge 层做适配

### 4.2 信封结构

所有 Host ↔ iframe 消息统一包裹在以下信封中：

```ts
interface ProtocolEnvelope {
  channel: 'cupcut-lab'        // 固定值，用于过滤无关 postMessage
  version: 1                   // 协议版本号，当前为 1
  sessionId: string            // 会话 ID，由 Host 生成，每次加载新 preview 时更新
  type: string                 // 消息类型（见下方定义）
  payload: any                 // 消息体，结构由 type 决定
  timestamp: number            // 发送时间戳 (Date.now())
}
```

### 4.3 Host → Preview 消息类型

| type | payload | 说明 | 对应旧消息 |
|------|---------|------|-----------|
| `HANDSHAKE` | `{ sessionId }` | Host 通知 iframe 会话建立 | 旧 `HANDSHAKE` |
| `UPDATE_PARAM` | `{ bind, value }` | 参数变更 | 旧 `UPDATE_PARAM` |
| `START_REC` | `{}` | 开始录制 | 旧 `START_REC` |
| `STOP_REC` | `{}` | 停止录制 | 旧 `STOP_REC` |
| `SAVE_IMAGE` | `{}` | 截图请求 | 旧 `SAVE_IMAGE` |
| `EXPORT_SCRIPT_SCENE` | `{}` | 导出 scriptScene | 旧 `EXPORT_SCRIPT_SCENE` |
| `REQUEST_GAME_JS_SOURCE` | `{}` | 请求 game.js 源码 | 旧 `REQUEST_GAME_JS_SOURCE` |
| `FILE_UPLOAD` | `{ bind, files: [{name, type, url}] }` | 文件上传 | 旧 `FILE_UPLOAD` |
| `LOAD_SOURCE` | `{ source }` | 加载输入源 | 旧 `LOAD_SOURCE` |
| `REQUEST_CAPABILITIES` | `{}` | 请求 preview 上报能力声明 | **新增** |
| `EXECUTE_CODE` | `{ code, language }` | 在 preview 中执行代码片段 | **新增，为 Phase 3 Agent 预留** |
| `SET_VIEWPORT` | `{ width, height }` | 通知 preview 视口尺寸变更 | **新增** |

### 4.4 Preview → Host 消息类型

| type | payload | 说明 | 对应旧消息 |
|------|---------|------|-----------|
| `UI_CONFIG` | `{ config: UIConfigItem[] }` | 上报参数配置 | 旧 `UI_CONFIG` |
| `IMAGE_DATA` | `{ dataUrl }` | 截图数据 | 旧 `IMAGE_DATA` |
| `REC_BLOB` | `{ blob, mimeType }` | 录制数据 | 旧 `REC_BLOB` |
| `REC_STARTED` | `{}` | 录制已开始 | 旧 `REC_STARTED` |
| `REC_ERROR` | `{ message }` | 录制/截图错误 | 旧 `REC_ERROR` |
| `GAME_JS_SOURCE` | `{ code, filename }` | game.js 源码 | 旧 `GAME_JS_SOURCE` |
| `DEMO_ERROR` | `{ message, stack }` | 运行时错误 | 旧 `DEMO_ERROR` |
| `RUNTIME_ERROR` | `{ message, stack, timestamp }` | 引擎级错误上报 | **新增，增强版 DEMO_ERROR** |
| `CAPABILITIES` | `{ types: string[], hasComposer: boolean, ... }` | preview 能力声明 | **新增** |
| `EXECUTION_RESULT` | `{ success, output, error? }` | 代码执行结果 | **新增，为 Phase 3 Agent 预留** |
| `PERFORMANCE_STATS` | `{ fps, memory?, drawCalls? }` | 性能数据 | **新增** |
| `STATE_SNAPSHOT` | `{ params, customState? }` | 状态快照（用于 LKG） | **新增** |

### 4.5 UIConfigItem 结构（标准化）

```ts
interface UIConfigItem {
  bind: string                 // 参数绑定键
  name: string                 // 显示名称
  type: 'range' | 'color' | 'checkbox' | 'select' | 'text' | 'button' | 'row' | 'file' | 'presets'
  value: any                   // 当前值
  min?: number                 // range 最小值
  max?: number                 // range 最大值
  step?: number                // range 步长
  options?: string[]           // select 选项列表
  placeholder?: string         // text 占位符
  text?: string                // button 显示文本
  width?: string               // button 宽度
  children?: UIConfigItem[]    // row 子项
  accept?: string              // file 接受类型
  multiple?: boolean           // file 多选
  label?: string               // presets 标签
}
```

### 4.6 兼容层设计

旧 demo 发送的裸消息格式：
```js
window.parent.postMessage({ type: 'UI_CONFIG', config: [...] }, '*')
```

V1.0 格式：
```js
window.parent.postMessage({
  channel: 'cupcut-lab',
  version: 1,
  sessionId: 'abc123',
  type: 'UI_CONFIG',
  payload: { config: [...] },
  timestamp: 1700000000000
}, '*')
```

**Bridge 层兼容逻辑**（在 `lab-preview-bridge.js` 中）：

```js
function normalizeMessage(rawData) {
  // V1.0 格式：直接返回
  if (rawData && rawData.channel === 'cupcut-lab' && rawData.version === 1) {
    return rawData
  }
  // 旧格式：包装为 V1.0
  if (rawData && rawData.type) {
    return {
      channel: 'cupcut-lab',
      version: 1,
      sessionId: currentSessionId,
      type: rawData.type,
      payload: extractLegacyPayload(rawData),
      timestamp: Date.now(),
      _legacy: true  // 标记为兼容消息
    }
  }
  return null  // 无关消息，忽略
}
```

### 4.7 消息安全

- `postMessage` 的 `targetOrigin` 从 `'*'` 改为具体 origin（生产环境）或 `'*'`（开发环境，通过配置切换）
- Bridge 层过滤 `channel !== 'cupcut-lab'` 的消息，防止第三方 iframe 干扰
- `sessionId` 校验：忽略 `sessionId` 不匹配的过期消息

### 4.8 错误上报链路（为 Phase 3 预留）

```
Preview Runtime 抛出错误
  → UnifiedRenderer._handleError()
  → 发送 RUNTIME_ERROR 消息
  → lab-preview-bridge 接收
  → session-store 记录 { lastError, errorCount, lastErrorTime }
  → lab-ai-chat 展示错误信息
  → (Phase 3) 触发 Auto-healing: 重新生成代码 → 重新加载 preview
```

---

## 5. session-store 设计

### 5.1 数据结构

```js
const sessionStore = {
  sessionId: '',              // 当前会话 ID
  isOpen: false,              // 工作台是否打开
  previewUrl: '',             // 当前预览 URL
  title: '',                  // 当前标题
  tag: '',                    // 当前标签
  uiConfig: [],               // 当前 UI 配置
  uiDefaults: {},             // 默认参数值（用于 reset）
  lastKnownGood: null,        // LKG: { code, url, uiConfig, timestamp }
  lastError: null,            // 最近错误: { message, stack, timestamp }
  errorCount: 0,              // 当前会话错误计数
  isRecording: false,         // 是否正在录制
  isGenerating: false,        // 是否正在 AI 生成
  state: 'Idle',              // Idle | Generating | PreviewReady | Failed | Iterating
}
```

### 5.2 API

```js
export function getSession()              // 返回当前 session 快照
export function updateSession(partial)    // 合并更新
export function resetSession()            // 重置为初始状态
export function subscribe(listener)       // 订阅变更通知
export function unsubscribe(listener)     // 取消订阅
```

### 5.3 替代全局变量映射

| 旧全局变量 | 新位置 |
|-----------|--------|
| `window.lastUIConfig` | `sessionStore.uiConfig` |
| `window.__unified_workbench_open` | `sessionStore.isOpen`（工作台状态） |
| `window.__unified_monaco_instance` | Host Shell Workbench 内部管理 |
| `isRecording` (lab.js 模块变量) | `sessionStore.isRecording` |
| `initialized` (lab.js 模块变量) | `sessionStore.isOpen` |

---

## 6. 左侧工作台分区设计

### 6.1 布局结构

```
┌──────────────────────────┐
│  HEADER (标题 + 状态)     │  ← lab-shell 管理
├──────────────────────────┤
│                          │
│  AI CHAT ZONE            │  ← lab-ai-chat 管理
│  (对话历史 + 输入框)      │     占比: flex 1 (自适应)
│                          │
├──────────────────────────┤
│                          │
│  CONTROL ZONE            │  ← lab-controls 管理
│  (动态参数控件)           │     占比: flex 1 (自适应)
│                          │
├──────────────────────────┤
│  ACTION BAR              │  ← lab-actions 管理
│  (导出/截图/录屏/代码)    │     高度: 固定
└──────────────────────────┘
```

### 6.2 状态位占位

AI Chat Zone 顶部需要展示当前 session 状态，与导演台 spec 的状态机对齐：

| 状态 | Chat Zone 顶部提示 |
|------|-------------------|
| `Idle` | "输入效果描述开始创作" |
| `Generating` | "AI 正在生成效果..." + loading 动画 |
| `PreviewReady` | "预览就绪，可继续对话修改" |
| `Iterating` | "正在调整效果..." |
| `Failed` | "生成失败：{error}。建议：{suggestion}" |

---

## 7. 实施顺序建议

### Phase 1-A：基础设施（无视觉变化）

1. 创建 `session-store.js`
2. 创建 `lab-preview-bridge.js`，含 V1.0 协议编解码 + 旧格式兼容层
3. 创建 `lab-controls.js`，从 lab.js 搬出控件渲染逻辑
4. 创建 `lab-actions.js`，从 lab.js 搬出导出/截图/录屏逻辑
5. 创建 `lab-shell.js`，从 lab.js 搬出开关/布局逻辑
6. 重写 `lab.js` 为纯组装入口

### Phase 1-B：UnifiedRenderer 瘦身

1. 删除 `_setupEditor()` 及所有 workbench/chat 相关方法
2. 删除 `_getUIRoot()` / `_getCodeContainer()` / `_getStatsContainer()` / `_cleanupUI()`
3. Stats 改为 iframe 内部定位
4. `_handleError()` 增加协议上报
5. `_setupMessaging()` 升级为 V1.0 协议收发
6. `sendConfig()` 改用 V1.0 信封格式

### Phase 1-C：双栏壳层升级

1. `index.html` 中 `lab-view` 改为稳定的左右分栏布局
2. 左栏拆分为 AI Chat Zone + Control Zone + Action Bar
3. 删除 `global-workbench`（宿主页旧工作台）
4. Action Bar 统一管理所有操作按钮
5. 删除 `lab-ui-top-right` 中的散装按钮

### Phase 1-D：AI Chat 接入

1. `ai-chat.js` 接入左栏 AI Chat Zone
2. 对话历史展示在 Chat Zone
3. 语义调参结果通过 bridge 发送
4. 状态位展示（Idle/Generating/PreviewReady/Failed）

---

## 8. 验收标准

### 8.1 结构验收

- [ ] `lab.js` 行数 < 100（纯组装入口）
- [ ] UnifiedRenderer 不包含任何 `window.parent.document` 访问
- [ ] UnifiedRenderer 不包含任何 workbench/editor/chat UI 创建代码
- [ ] 所有 Host ↔ iframe 通信走 V1.0 协议信封
- [ ] `window.lastUIConfig` 不再被任何模块直接读写

### 8.2 功能验收

- [ ] 所有现有 demo 正常加载和预览
- [ ] 动态参数控件正常渲染和交互
- [ ] 截图/录屏/导出功能正常
- [ ] AI 语义调参正常
- [ ] 旧 demo（发送裸消息格式）通过兼容层正常工作

### 8.3 体验验收

- [ ] 左右双栏布局稳定，可调整比例
- [ ] 左栏 AI Chat Zone 和 Control Zone 分区清晰
- [ ] 工作台状态位正确展示
- [ ] 无白屏、无按钮重叠、无 UI 闪烁
