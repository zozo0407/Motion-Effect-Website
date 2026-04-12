# Phase 1: Shell 与 Runtime 解耦 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将宿主页 Workbench Shell 与 iframe Preview Runtime 彻底解耦，建立三层架构（Host Shell / Bridge Layer / Preview Runtime），为后续 Phase 2-4 打好结构基础。

**Architecture:** 将 992 行的 `lab.js` God Module 拆分为 4 个职责清晰的子模块（`lab-shell`、`lab-preview-bridge`、`lab-controls`、`lab-actions`），新增 `session-store` 统一状态管理，引入 V1.0 结构化消息协议替代裸字符串通信，瘦身 `UnifiedRenderer.js` 使其不再跨 iframe 操作 DOM。

**Tech Stack:** 原生 JavaScript + ES Modules + Three.js + iframe postMessage + Tailwind CSS（现有）

**Spec:** [2026-04-12-phase1-shell-decoupling-design.md](file:///Users/bytedance/Downloads/cupcut-website/docs/superpowers/specs/2026-04-12-phase1-shell-decoupling-design.md)

---

## File Structure

### 新建文件

| 文件路径 | 职责 |
|---------|------|
| `src/site/session-store.js` | Session 状态管理（替代 `window.lastUIConfig` 等全局变量） |
| `src/site/lab-preview-bridge.js` | iframe 生命周期、V1.0 协议编解码、消息路由 |
| `src/site/lab-controls.js` | 动态参数控件渲染、值同步、preset 管理 |
| `src/site/lab-actions.js` | 导出、截图、录屏、source upload、banner 展示 |
| `src/site/lab-shell.js` | 工作台开关、布局管理、标题栏、状态栏 |

### 修改文件

| 文件路径 | 改动内容 |
|---------|---------|
| `src/site/lab.js` | 从 992 行 God Module 收缩为 < 80 行纯组装入口 |
| `src/main.js` | 更新 import 路径，window.xxx 暴露点指向新模块 |
| `my-motion-portfolio/public/js/UnifiedRenderer.js` | 删除所有跨 iframe DOM 操作和 workbench/chat UI 代码，升级消息协议 |
| `index.html` | 左栏分区重构（AI Chat Zone + Control Zone + Action Bar），删除散装按钮和旧工作台 |
| `src/site/ai-chat.js` | 重构为 `lab-ai-chat.js`，接入 bridge 和 session-store |

---

## Phase 1-A: 基础设施（无视觉变化）

### Task 1: 创建 session-store.js

**Files:**
- Create: `src/site/session-store.js`

- [ ] **Step 1: 创建 session-store.js 文件**

```js
let state = {
  sessionId: '',
  isOpen: false,
  previewUrl: '',
  title: '',
  tag: '',
  uiConfig: [],
  uiDefaults: {},
  lastKnownGood: null,
  lastError: null,
  errorCount: 0,
  isRecording: false,
  isGenerating: false,
  state: 'Idle',
}

const listeners = new Set()

export function getSession() {
  return { ...state }
}

export function updateSession(partial) {
  const prev = { ...state }
  state = { ...state, ...partial }
  listeners.forEach((fn) => {
    try { fn(state, prev) } catch (_) {}
  })
}

export function resetSession() {
  state = {
    sessionId: '',
    isOpen: false,
    previewUrl: '',
    title: '',
    tag: '',
    uiConfig: [],
    uiDefaults: {},
    lastKnownGood: null,
    lastError: null,
    errorCount: 0,
    isRecording: false,
    isGenerating: false,
    state: 'Idle',
  }
  listeners.forEach((fn) => {
    try { fn(state, {}) } catch (_) {}
  })
}

export function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function unsubscribe(listener) {
  listeners.delete(listener)
}
```

- [ ] **Step 2: 验证文件可被 import**

Run: `node -e "import('./src/site/session-store.js').then(m => console.log(Object.keys(m)))"` （在 vite dev server 运行时通过浏览器控制台验证，或直接检查语法）

Expected: 无语法错误

- [ ] **Step 3: Commit**

```bash
git add src/site/session-store.js
git commit -m "feat: add session-store for unified state management"
```

---

### Task 2: 创建 lab-preview-bridge.js（含 V1.0 协议）

**Files:**
- Create: `src/site/lab-preview-bridge.js`

- [ ] **Step 1: 创建 lab-preview-bridge.js 文件**

```js
import { updateSession, getSession } from './session-store.js'

const CHANNEL = 'cupcut-lab'
const PROTOCOL_VERSION = 1

let iframeEl = null
let messageHandler = null
let sessionId = ''
let isLoading = false
let lastError = null

function generateSessionId() {
  return 'sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8)
}

function wrapEnvelope(type, payload) {
  return {
    channel: CHANNEL,
    version: PROTOCOL_VERSION,
    sessionId: sessionId,
    type: type,
    payload: payload,
    timestamp: Date.now(),
  }
}

function extractLegacyPayload(rawData) {
  const payload = { ...rawData }
  delete payload.type
  return payload
}

function normalizeMessage(rawData) {
  if (rawData && rawData.channel === CHANNEL && rawData.version === PROTOCOL_VERSION) {
    return rawData
  }
  if (rawData && rawData.type) {
    return {
      channel: CHANNEL,
      version: PROTOCOL_VERSION,
      sessionId: sessionId,
      type: rawData.type,
      payload: extractLegacyPayload(rawData),
      timestamp: Date.now(),
      _legacy: true,
    }
  }
  return null
}

export function initBridge(iframeElement, handlers) {
  iframeEl = iframeElement

  messageHandler = (event) => {
    const envelope = normalizeMessage(event.data)
    if (!envelope) return
    if (envelope.sessionId && sessionId && envelope.sessionId !== sessionId) return

    const type = envelope.type
    const payload = envelope.payload

    switch (type) {
      case 'UI_CONFIG':
        if (handlers.onUIConfig) handlers.onUIConfig(payload.config || payload)
        break
      case 'IMAGE_DATA':
        if (handlers.onImageData) handlers.onImageData(payload)
        break
      case 'REC_BLOB':
        if (handlers.onRecBlob) handlers.onRecBlob(payload)
        break
      case 'REC_STARTED':
        if (handlers.onRecStarted) handlers.onRecStarted(payload)
        break
      case 'REC_ERROR':
        if (handlers.onRecError) handlers.onRecError(payload)
        break
      case 'GAME_JS_SOURCE':
        if (handlers.onGameJSSource) handlers.onGameJSSource(payload)
        break
      case 'DEMO_ERROR':
      case 'RUNTIME_ERROR':
        lastError = payload
        updateSession({ lastError: payload, errorCount: getSession().errorCount + 1 })
        if (handlers.onDemoError) handlers.onDemoError(payload)
        break
      default:
        break
    }
  }

  window.addEventListener('message', messageHandler)
}

export function loadPreview(url) {
  if (!iframeEl) return
  sessionId = generateSessionId()
  isLoading = true
  lastError = null
  updateSession({ previewUrl: url, sessionId: sessionId, lastError: null, errorCount: 0 })

  iframeEl.onload = () => {
    isLoading = false
    setTimeout(() => {
      if (iframeEl.contentWindow) {
        iframeEl.contentWindow.postMessage(wrapEnvelope('HANDSHAKE', { sessionId: sessionId }), '*')
      }
    }, 300)

    setTimeout(() => {
      try {
        const doc = iframeEl.contentDocument
        const win = doc && doc.defaultView
        if (doc && win && !win.__capcutShimLoaded) {
          const shim = doc.createElement('script')
          shim.type = 'text/javascript'
          shim.text = "if(!window.__capcutShimLoaded){window.__capcutShimLoaded=true;var __recorder=null;var __chunks=[];window.addEventListener('message',function(e){var d=e.data;if(!d||!d.type)return;var canvas=document.querySelector('canvas');if(d.type==='SAVE_IMAGE'){if(canvas){try{var url=canvas.toDataURL('image/png');parent.postMessage({type:'IMAGE_DATA',dataUrl:url},'*');}catch(err){parent.postMessage({type:'REC_ERROR',message:'Screenshot failed'},'*');}}else{parent.postMessage({type:'REC_ERROR',message:'No canvas found'},'*');}}if(d.type==='START_REC'){if(canvas&&typeof MediaRecorder!=='undefined'){try{var stream=canvas.captureStream(30);var mt='video/mp4;codecs=h264';if(!MediaRecorder.isTypeSupported(mt)){mt='video/webm;codecs=vp9';if(!MediaRecorder.isTypeSupported(mt)){mt='video/webm;codecs=vp8';if(!MediaRecorder.isTypeSupported(mt)){mt='video/webm';if(!MediaRecorder.isTypeSupported(mt)){mt='video/mp4';}}}}try{__recorder=new MediaRecorder(stream,{mimeType:mt});}catch(_){__recorder=new MediaRecorder(stream);}__chunks=[];__recorder.ondataavailable=function(ev){if(ev.data.size>0)__chunks.push(ev.data);};__recorder.onstop=function(){var blob=new Blob(__chunks,{type:(__recorder.mimeType||'video/webm')});parent.postMessage({type:'REC_BLOB',blob:blob,mimeType:(__recorder.mimeType||'video/webm')},'*');};__recorder.start();parent.postMessage({type:'REC_STARTED'},'*');}catch(err){parent.postMessage({type:'REC_ERROR',message:'Recorder start failed'},'*');}}else{parent.postMessage({type:'REC_ERROR',message:'MediaRecorder not supported or no canvas'},'*');}}if(d.type==='STOP_REC'){if(__recorder&&__recorder.state!=='inactive'){__recorder.stop();}}});}"
          doc.body.appendChild(shim)
        }
      } catch (_) {}
    }, 1000)
  }

  iframeEl.src = url
}

export function sendMessage(type, payload) {
  if (!iframeEl || !iframeEl.contentWindow) return
  iframeEl.contentWindow.postMessage(wrapEnvelope(type, payload || {}), '*')
}

export function destroyBridge() {
  if (messageHandler) {
    window.removeEventListener('message', messageHandler)
    messageHandler = null
  }
  iframeEl = null
  sessionId = ''
  isLoading = false
  lastError = null
}

export function getBridgeState() {
  return { isLoading: isLoading, sessionId: sessionId, lastError: lastError }
}
```

- [ ] **Step 2: 验证文件无语法错误**

Run: `node --check src/site/lab-preview-bridge.js` （ES Module 语法可能需要通过 vite 验证）

Expected: 无语法错误

- [ ] **Step 3: Commit**

```bash
git add src/site/lab-preview-bridge.js
git commit -m "feat: add lab-preview-bridge with V1.0 protocol and legacy compat"
```

---

### Task 3: 创建 lab-controls.js

**Files:**
- Create: `src/site/lab-controls.js`

- [ ] **Step 1: 创建 lab-controls.js 文件**

从 `lab.js` 中搬出全部动态控件渲染逻辑。核心函数：
- `initControls(container, { onParamChange })` — 初始化容器与回调
- `renderControls(config)` — 渲染控件到 `#dynamic-controls`
- `updateControlValue(bind, value)` — 单个控件值更新
- `resetControls()` — 重置到默认值
- `getCurrentConfig()` — 返回当前 UIConfig 快照
- `updateDemoParam(bind, value)` — 对外暴露的参数更新（UI 更新 + 调用 onParamChange）

实现内容：将 `lab.js` L451-L800 的 `UI_CONFIG` 处理逻辑完整搬出，包括 range/color/checkbox/select/text/button/row/file/presets 共 10 种控件类型的 DOM 生成。`onParamChange` 回调由调用方注入，内部不再直接操作 `contentFrame.contentWindow.postMessage`。

- [ ] **Step 2: 验证控件渲染逻辑完整**

确认 10 种控件类型全部覆盖：range, color, checkbox, select, text, button, row, file, presets, 以及 label/value 显示。

- [ ] **Step 3: Commit**

```bash
git add src/site/lab-controls.js
git commit -m "feat: add lab-controls module extracted from lab.js"
```

---

### Task 4: 创建 lab-actions.js

**Files:**
- Create: `src/site/lab-actions.js`

- [ ] **Step 1: 创建 lab-actions.js 文件**

从 `lab.js` 中搬出所有"从 preview 获取产物"的动作逻辑。核心函数：
- `initActions({ sendMessage, onBanner })` — 初始化，注入 bridge 通信能力
- `triggerSaveImage()` — 截图
- `triggerExportScriptScene()` — 导出 scriptScene
- `triggerExportGameJS()` — 导出 game.js
- `toggleRecording()` — 录屏开关
- `openExportSettings()` — 导出设置弹窗
- `toMinigameGameJS(code)` — 代码转换（从 lab.js L98-L126 搬出）
- `sanitizeExportPrefix(prefix)` — 文件名清理（从 lab.js L128-L132 搬出）

实现内容：将 `lab.js` 中的 `triggerSaveImage`、`triggerExportScriptScene`、`triggerExportGameJS`、`toggleRecording`、`openExportSettings`、`toMinigameGameJS`、`sanitizeExportPrefix` 搬出。所有 `contentFrame.contentWindow.postMessage` 调用替换为注入的 `sendMessage` 回调。banner 展示逻辑提取为 `onBanner(type, data)` 回调。

- [ ] **Step 2: 验证导出/截图/录屏逻辑完整**

确认以下消息的 UI 响应全部搬出：`IMAGE_DATA`、`REC_BLOB`、`REC_ERROR`、`GAME_JS_SOURCE`。

- [ ] **Step 3: Commit**

```bash
git add src/site/lab-actions.js
git commit -m "feat: add lab-actions module extracted from lab.js"
```

---

### Task 5: 创建 lab-shell.js

**Files:**
- Create: `src/site/lab-shell.js`

- [ ] **Step 1: 创建 lab-shell.js 文件**

从 `lab.js` 中搬出工作台壳层逻辑。核心函数：
- `initShell()` — 初始化 DOM 引用
- `openShell(title, tag, isOriginal)` — 打开工作台（弹层显示/隐藏、标题设置、gsap 动画）
- `closeShell()` — 关闭工作台
- `getShellState()` — 返回 `{ isOpen, title, tag }`

实现内容：将 `lab.js` 中的 `openLab()` 的弹层部分（L232-L322 中的 labView 显示/隐藏、标题设置、gsap 动画、左栏可见性控制）、`closeLab()` 的关闭逻辑（L324-L336）、`initLab()` 的 DOM 引用获取（L338-L444 中的 labView/loader/labUITopRight/globalCodeBtn/workbench 相关引用）搬出。

左栏可见性控制（hiddenDemos 逻辑）暂时保留在 shell 中，但标记为 `// TODO: 改为配置驱动`。

- [ ] **Step 2: 验证工作台开关逻辑完整**

确认 `openShell` / `closeShell` 覆盖了原 `openLab` / `closeLab` 的全部视觉行为。

- [ ] **Step 3: Commit**

```bash
git add src/site/lab-shell.js
git commit -m "feat: add lab-shell module extracted from lab.js"
```

---

### Task 6: 重写 lab.js 为纯组装入口

**Files:**
- Modify: `src/site/lab.js`

- [ ] **Step 1: 重写 lab.js 为 < 80 行的组装入口**

```js
import { initShell, openShell, closeShell } from './lab-shell.js'
import { initBridge, sendMessage, loadPreview } from './lab-preview-bridge.js'
import { initControls, renderControls, updateDemoParam, resetControls } from './lab-controls.js'
import { initActions, triggerSaveImage, triggerExportScriptScene, triggerExportGameJS, toggleRecording, openExportSettings } from './lab-actions.js'
import { initAIChat } from './ai-chat.js'
import { getSession, updateSession } from './session-store.js'

let labInitialized = false

function handleBanner(type, data) {
  if (type === 'image') showImageBanner(data)
  if (type === 'recording') showRecBanner(data)
  if (type === 'error') showErrorBanner(data)
}

function handleGameJSDownload(data) {
  const code = typeof data.code === 'string' ? data.code : ''
  const baseFilename = typeof data.filename === 'string' && data.filename.trim() ? data.filename.trim() : 'game.js'
  const prefix = sanitizeExportPrefix(localStorage.getItem('exportFilePrefix') || '')
  const filename = prefix ? `${prefix}-${baseFilename}` : baseFilename
  const finalCode = toMinigameGameJS(code)
  const blob = new Blob([finalCode], { type: 'application/javascript' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function initLab() {
  if (labInitialized) return
  labInitialized = true

  const iframe = document.getElementById('content-frame')
  initBridge(iframe, {
    onUIConfig: (config) => { updateSession({ uiConfig: config }); renderControls(config) },
    onImageData: (data) => handleBanner('image', data),
    onRecBlob: (data) => handleBanner('recording', data),
    onRecError: (data) => handleBanner('error', data),
    onGameJSSource: (data) => handleGameJSDownload(data),
    onDemoError: (data) => updateSession({ lastError: data }),
  })

  initControls(document.getElementById('dynamic-controls'), {
    onParamChange: (bind, value) => sendMessage('UPDATE_PARAM', { bind, value }),
  })

  initActions({ sendMessage, onBanner: handleBanner })
  initShell()
  initAIChat({ updateDemoParam })
}

export function openLab(url, title, tag, isOriginal) {
  initLab()
  openShell(title, tag, isOriginal)
  loadPreview(url)
}

export function closeLab() { closeShell() }
export { updateDemoParam, resetControls as resetDemo, triggerSaveImage, triggerExportScriptScene, triggerExportGameJS, toggleRecording, openExportSettings }
```

注意：`handleBanner` 中的 `showImageBanner` / `showRecBanner` / `showErrorBanner` / `toMinigameGameJS` / `sanitizeExportPrefix` 需要从 `lab-actions.js` 中 import 或内联。实际实现时根据 `lab-actions.js` 的导出调整。

- [ ] **Step 2: 更新 main.js 的 import 路径**

`main.js` 中的 `window.xxx` 暴露点保持不变（lab.js re-export 了所有函数），无需修改 `main.js`。

- [ ] **Step 3: 启动 dev server 验证所有 demo 正常**

Run: `npm run dev` 或 `npx vite`

Expected: 所有 demo 可正常加载、预览、调参

- [ ] **Step 4: Commit**

```bash
git add src/site/lab.js
git commit -m "refactor: rewrite lab.js as thin assembly entry (< 80 lines)"
```

---

## Phase 1-B: UnifiedRenderer 瘦身

### Task 7: 删除 UnifiedRenderer 中所有跨 iframe DOM 操作

**Files:**
- Modify: `my-motion-portfolio/public/js/UnifiedRenderer.js`

- [ ] **Step 1: 删除 `_getUIRoot()` 方法（L128-L137）**

该方法访问 `window.parent.document.getElementById()`，违反"不跨 iframe 操作 DOM"铁律。

- [ ] **Step 2: 删除 `_getCodeContainer()` 方法（L139-L143）**

该方法调用 `_getUIRoot('lab-ui-top-right')`，已无用途。

- [ ] **Step 3: 删除 `_getStatsContainer()` 方法（L145-L149）**

该方法调用 `_getUIRoot('lab-ui-top-left')`，Stats 将改为 iframe 内部定位。

- [ ] **Step 4: 删除 `_cleanupUI()` 方法（L151-L158）**

该方法清理插入父页面的 UI 元素，不再需要。

- [ ] **Step 5: 修改 `_setup()` 中的 Stats 定位逻辑（L160-L171）**

将 Stats DOM 改为插入 iframe 内部容器：

```js
if (this.showStats) {
  this.stats = new Stats()
  this.stats.dom.style.position = 'absolute'
  this.stats.dom.style.top = '0'
  this.stats.dom.style.left = '0'
  this.stats.dom.style.zIndex = '10'
  this.stats.dom.id = 'unified-stats'
  const existingStats = this.container.querySelector('#unified-stats')
  if (existingStats) existingStats.remove()
  this.container.appendChild(this.stats.dom)
}
```

- [ ] **Step 6: 删除 `_setupEditor()` 方法及 `_setup()` 中的调用（L195-L253, L192）**

删除整个 `_setupEditor()` 方法，删除 `_setup()` 末尾的 `this._setupEditor()` 调用。

- [ ] **Step 7: Commit**

```bash
git add my-motion-portfolio/public/js/UnifiedRenderer.js
git commit -m "refactor: remove cross-iframe DOM access from UnifiedRenderer"
```

---

### Task 8: 删除 UnifiedRenderer 中所有 workbench/chat UI 代码

**Files:**
- Modify: `my-motion-portfolio/public/js/UnifiedRenderer.js`

- [ ] **Step 1: 删除 `_createWorkbench()` 方法（L340-L475）**

- [ ] **Step 2: 删除 `_openEditor()` 和 `_closeEditor()` 方法（L255-L338）**

- [ ] **Step 3: 删除 `_bindWorkbenchUI()` 方法（L477-L498）**

- [ ] **Step 4: 删除 `_bindWorkbenchEvents()` 方法（L500-L517）**

- [ ] **Step 5: 删除 `_applyWorkbenchWidth()` 方法（L519-L529）**

- [ ] **Step 6: 删除 `_startWorkbenchResize()` / `_handleWorkbenchResize()` / `_stopWorkbenchResize()` 方法（L531-L569）**

- [ ] **Step 7: 删除 `_addChatMessage()` 方法（L571-L595）**

- [ ] **Step 8: 删除 `_handleMockAI()` 方法（L597-L632）**

- [ ] **Step 9: 删除 `_fetchSourceCode()` 方法（L634-L648）**

- [ ] **Step 10: 删除 `_runEditorCode()` 方法（L650-L703）**

- [ ] **Step 11: 删除 `_exportToScriptScene()` 方法（L705-L866）**

- [ ] **Step 12: 删除 `_exportToCapCut()` 和 `_exportToGameJS()` 方法（L868-L885）**

- [ ] **Step 13: 删除所有 `window.__unified_workbench_open` 和 `window.__unified_monaco_instance` 引用**

- [ ] **Step 14: 清理 `dispose()` 和 `disposeRuntime()` 中的工作台相关清理代码**

移除对 `this.codeBtn`、`this._workbenchEl`、`this._workbenchKeyHandler`、`this._onWorkbenchResizeMove`、`this._onWorkbenchResizeUp`、`this._isResizingWorkbench`、`this._workbenchEventsBound` 的引用。

- [ ] **Step 15: Commit**

```bash
git add my-motion-portfolio/public/js/UnifiedRenderer.js
git commit -m "refactor: remove workbench/chat UI code from UnifiedRenderer"
```

---

### Task 9: 升级 UnifiedRenderer 消息协议为 V1.0

**Files:**
- Modify: `my-motion-portfolio/public/js/UnifiedRenderer.js`

- [ ] **Step 1: 添加 `_sendProtocolMessage()` 辅助方法**

```js
_sendProtocolMessage(type, payload) {
  if (window.parent) {
    window.parent.postMessage({
      channel: 'cupcut-lab',
      version: 1,
      sessionId: this._sessionId || '',
      type: type,
      payload: payload || {},
      timestamp: Date.now(),
    }, '*')
  }
}
```

- [ ] **Step 2: 修改 `_setupMessaging()` 接收 V1.0 信封**

```js
_setupMessaging() {
  this._onMessage = (event) => {
    const data = event.data
    if (!data) return

    let type = data.type
    let payload = data

    if (data.channel === 'cupcut-lab' && data.version === 1) {
      type = data.type
      payload = data.payload
      if (data.sessionId) this._sessionId = data.sessionId
    }

    if (type === 'HANDSHAKE') {
      if (payload && payload.sessionId) this._sessionId = payload.sessionId
      this.sendConfig()
    }

    if (type === 'UPDATE_PARAM') {
      const { key, value } = payload
      this.params[key] = value
      if (this.uniforms && this.uniforms[key]) {
        if (typeof value === 'string' && value.startsWith('#') && this.uniforms[key].value && this.uniforms[key].value.isColor) {
          this.uniforms[key].value.set(value)
        } else if (value && value.type === 'file' && value.url) {
          new THREE.TextureLoader().load(value.url, (texture) => {
            this.uniforms[key].value = texture
            texture.needsUpdate = true
          })
        } else {
          this.uniforms[key].value = value
        }
      }
      if (typeof this.params[key] === 'function') {
        this.params[key]()
        return
      }
      this.onParamChange(key, value, this)
    }
  }
  window.addEventListener('message', this._onMessage)

  if (window.parent) {
    window.parent.postMessage({ type: 'HANDSHAKE' }, '*')
  }
}
```

- [ ] **Step 3: 修改 `sendConfig()` 使用 V1.0 信封**

```js
sendConfig() {
  if (this.uiConfig) {
    this._sendProtocolMessage('UI_CONFIG', { config: this.uiConfig })
  }
}
```

- [ ] **Step 4: 修改 `_handleError()` 增加协议上报**

```js
_handleError(error) {
  console.error("UnifiedRenderer Caught Error:", error)
  this.pause()

  this._sendProtocolMessage('RUNTIME_ERROR', {
    message: error.toString(),
    stack: error.stack || null,
    timestamp: Date.now(),
  })

  let errDiv = document.getElementById('unified-error-overlay')
  if (!errDiv) {
    errDiv = document.createElement('div')
    errDiv.id = 'unified-error-overlay'
    errDiv.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(40,0,0,0.9);color:#ff6b6b;padding:40px;font-family:monospace;font-size:16px;z-index:9999;box-sizing:border-box;overflow:auto;'
    document.body.appendChild(errDiv)
  }
  errDiv.innerHTML = '<h2 style="margin-top:0;color:#ff3333">⚠️ Runtime Error</h2><pre style="white-space:pre-wrap;background:rgba(0,0,0,0.5);padding:20px;border-radius:8px">' + error.toString() + '</pre><p style="color:#888;font-size:12px;margin-top:20px">Check the console for full stack trace.</p>'
}
```

- [ ] **Step 5: 在 constructor 中初始化 `_sessionId`**

在 constructor 的 Internal State 部分添加：`this._sessionId = ''`

- [ ] **Step 6: Commit**

```bash
git add my-motion-portfolio/public/js/UnifiedRenderer.js
git commit -m "feat: upgrade UnifiedRenderer messaging to V1.0 protocol"
```

---

### Task 10: 验证 Phase 1-B 完整性

- [ ] **Step 1: 搜索 UnifiedRenderer 中是否还有 `window.parent.document` 引用**

Run: `grep -n "window.parent.document" my-motion-portfolio/public/js/UnifiedRenderer.js`

Expected: 无匹配

- [ ] **Step 2: 搜索 UnifiedRenderer 中是否还有 workbench/editor/chat 相关方法**

Run: `grep -n "_setupEditor\|_createWorkbench\|_openEditor\|_closeEditor\|_addChatMessage\|_handleMockAI\|_fetchSourceCode\|_runEditorCode\|_exportToScriptScene\|_exportToGameJS\|_exportToCapCut\|__unified_workbench\|__unified_monaco" my-motion-portfolio/public/js/UnifiedRenderer.js`

Expected: 无匹配

- [ ] **Step 3: 启动 dev server 验证所有 demo 正常**

Run: `npm run dev`

Expected: 所有 demo 可正常加载、预览、调参、截图、导出

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: verify Phase 1-B UnifiedRenderer slimming complete"
```

---

## Phase 1-C: 双栏壳层升级

### Task 11: 重构 index.html 左栏分区

**Files:**
- Modify: `index.html`

- [ ] **Step 1: 将 `lab-left-panel` 内部拆分为三个区域**

将现有的 `lab-left-panel` 内容重构为：

```html
<aside id="lab-left-panel" class="w-full md:w-80 h-[35vh] md:h-full border-t md:border-t-0 md:border-r border-white/10 bg-white/[0.02] backdrop-blur-sm flex flex-col z-20 flex-shrink-0" data-lenis-prevent>
  <!-- AI Chat Zone -->
  <div id="ai-chat-zone" class="flex-1 flex flex-col border-b border-white/10 min-h-0">
    <div class="px-4 py-2 border-b border-white/5 text-[10px] font-mono text-gray-500 tracking-widest bg-white/5 flex items-center justify-between">
      <span>AI 助手 / COPILOT</span>
      <span id="ai-status" class="text-capcut-green">● IDLE</span>
    </div>
    <div id="ai-chat-history" class="flex-1 p-4 overflow-y-auto font-sans text-xs text-gray-300 space-y-3">
      <div class="text-gray-500 font-mono text-[10px]">> 输入效果描述开始创作</div>
    </div>
    <div class="p-3 border-t border-white/5 bg-white/5">
      <div class="flex gap-2">
        <input id="ai-chat-input" type="text" placeholder="描述你想要的效果..." class="flex-1 bg-black/20 border border-white/10 rounded px-3 py-2 text-xs text-white outline-none focus:border-capcut-green">
        <button onclick="sendAIChat()" class="px-3 py-2 bg-capcut-green text-black text-[10px] font-bold font-mono rounded hover:shadow-[0_0_15px_rgba(0,202,224,0.4)] transition-all">发送</button>
      </div>
    </div>
  </div>

  <!-- Control Zone -->
  <div id="control-zone" class="flex-1 overflow-y-auto p-4 md:p-6 min-h-0 custom-scrollbar">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-capcut-green font-mono text-xs uppercase tracking-widest">控制台 // CONSOLE</h3>
      <button onclick="resetDemo()" class="px-2 py-1 text-[9px] font-mono uppercase border border-white/20 rounded hover:bg-white hover:text-black transition-colors opacity-70 hover:opacity-100">RESET</button>
    </div>
    <div id="dynamic-controls" class="space-y-5"></div>
  </div>

  <!-- Action Bar -->
  <div id="action-bar" class="flex-shrink-0 border-t border-white/10 p-3 space-y-2">
    <div class="flex gap-2">
      <select id="aspect-select" class="flex-1 bg-gray-800 text-white text-[10px] font-mono p-2 rounded border border-white/10 outline-none focus:border-capcut-green">
        <option value="16:9">16:9</option>
        <option value="9:16">9:16</option>
        <option value="1:1">1:1</option>
        <option value="full" selected>Full</option>
      </select>
      <select id="source-select" class="flex-1 bg-gray-800 text-white text-[10px] font-mono p-2 rounded border border-white/10 outline-none focus:border-capcut-green">
        <option value="default">Default</option>
      </select>
    </div>
    <div class="flex gap-2">
      <button onclick="triggerSaveImage()" class="flex-1 px-2 py-1.5 bg-white/5 hover:bg-white/10 text-white text-[10px] font-mono rounded border border-white/10 transition-all">📷 截图</button>
      <button onclick="toggleRecording()" class="flex-1 px-2 py-1.5 bg-white/5 hover:bg-white/10 text-white text-[10px] font-mono rounded border border-white/10 transition-all" id="rec-btn"><span id="rec-text">🔴 录制</span></button>
      <button onclick="triggerExportGameJS()" class="flex-1 px-2 py-1.5 bg-white/5 hover:bg-white/10 text-white text-[10px] font-mono rounded border border-white/10 transition-all">⬇ game.js</button>
    </div>
  </div>
</aside>
```

- [ ] **Step 2: 删除 `global-workbench` div（L613-L651）**

宿主页旧工作台，由左侧 AI Chat Zone + Action Bar 替代。

- [ ] **Step 3: 删除 `lab-ui-top-right` 中的散装按钮（L605-L610）**

导出脚本、导出 game.js、导出设置、代码按钮全部迁移到左栏 Action Bar。`lab-ui-top-right` 容器保留但清空内容（供未来 iframe 内部 Stats overlay 使用）。

- [ ] **Step 4: 删除 `lab-ui-top-left` 容器（L604）**

Stats 已改为 iframe 内部定位，不再需要父页面容器。

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "refactor: restructure left pane into AI Chat + Controls + Action Bar"
```

---

### Task 12: 更新 lab-shell.js 适配新 HTML 结构

**Files:**
- Modify: `src/site/lab-shell.js`

- [ ] **Step 1: 更新 DOM 引用获取逻辑**

移除对已删除元素的引用（`global-workbench`、`workbench-monaco`、`workbench-run-btn`、`workbench-close-btn`、`workbench-resize`、`lab-ui-top-left`）。

- [ ] **Step 2: 移除 Monaco 工作台相关逻辑**

`openWorkbench()`、`closeWorkbench()`、Monaco 加载逻辑全部删除（已由左栏 AI Chat Zone + Action Bar 替代）。

- [ ] **Step 3: 更新 aspect ratio 事件绑定**

确认 `aspect-select` 的事件绑定仍然正常工作。

- [ ] **Step 4: Commit**

```bash
git add src/site/lab-shell.js
git commit -m "refactor: update lab-shell for new HTML structure"
```

---

### Task 13: 更新 lab-actions.js 适配新 HTML 结构

**Files:**
- Modify: `src/site/lab-actions.js`

- [ ] **Step 1: 更新录屏按钮引用**

`rec-btn` 和 `rec-text` 现在在 Action Bar 中，更新 DOM 查询路径。

- [ ] **Step 2: 更新 banner 展示逻辑**

确认 `onBanner` 回调正常工作，banner 展示位置适配新布局。

- [ ] **Step 3: Commit**

```bash
git add src/site/lab-actions.js
git commit -m "refactor: update lab-actions for new HTML structure"
```

---

### Task 14: 验证 Phase 1-C 完整性

- [ ] **Step 1: 启动 dev server 验证双栏布局**

Run: `npm run dev`

Expected: 左右双栏布局稳定，左栏三区（AI Chat + Controls + Action Bar）分区清晰

- [ ] **Step 2: 验证所有 demo 功能正常**

- 动态参数控件渲染和交互
- 截图/录屏/导出功能
- AI 语义调参
- Aspect ratio 切换

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: verify Phase 1-C dual-pane layout complete"
```

---

## Phase 1-D: AI Chat 接入

### Task 15: 重构 ai-chat.js 为 lab-ai-chat.js

**Files:**
- Create: `src/site/lab-ai-chat.js`
- Modify: `src/site/ai-chat.js` (保留为 re-export 兼容层)

- [ ] **Step 1: 创建 lab-ai-chat.js**

将 `ai-chat.js` 的语义调参逻辑重构，接入 session-store 和 bridge：

```js
import { getSession, updateSession, subscribe } from './session-store.js'

let initialized = false
let onParamChangeCallback = null

export function initAIChat({ onParamChange }) {
  if (initialized) return
  initialized = true
  onParamChangeCallback = onParamChange

  const chatInput = document.getElementById('ai-chat-input')
  if (!chatInput) return

  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendAIChat()
  })

  subscribe((state) => {
    const statusEl = document.getElementById('ai-status')
    if (statusEl) {
      const labels = { Idle: '● IDLE', Generating: '● GENERATING', PreviewReady: '● READY', Failed: '● FAILED', Iterating: '● ITERATING' }
      const colors = { Idle: 'text-capcut-green', Generating: 'text-yellow-400', PreviewReady: 'text-green-400', Failed: 'text-red-400', Iterating: 'text-blue-400' }
      statusEl.textContent = labels[state.state] || '● IDLE'
      statusEl.className = colors[state.state] || 'text-capcut-green'
    }
  })
}

export async function sendAIChat() {
  const input = document.getElementById('ai-chat-input')
  const history = document.getElementById('ai-chat-history')
  if (!input || !history) return

  const msg = input.value.trim()
  if (!msg) return

  const userBubble = document.createElement('div')
  userBubble.className = 'flex gap-3 flex-row-reverse'
  userBubble.innerHTML = `<div class="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center text-white text-[10px] font-bold">U</div><div class="bg-capcut-green text-black rounded-lg p-3 text-xs leading-relaxed max-w-[85%] font-bold">${msg}</div>`
  history.appendChild(userBubble)
  input.value = ''
  history.scrollTop = history.scrollHeight

  const config = getSession().uiConfig || []
  const semanticResult = await aiSemanticCommand(msg, config)
  if (semanticResult && onParamChangeCallback) {
    onParamChangeCallback(semanticResult.param.bind, semanticResult.value)
    addAIMessage(semanticResult.text || `已调整 ${semanticResult.param.name}`)
  } else {
    addAIMessage('抱歉，我不理解这个指令。试试说"变红"、"加速"、"更亮"等。')
  }
}

function addAIMessage(text) {
  const history = document.getElementById('ai-chat-history')
  if (!history) return
  const bubble = document.createElement('div')
  bubble.className = 'flex gap-3'
  bubble.innerHTML = `<div class="w-6 h-6 rounded-full bg-purple-600/30 flex items-center justify-center text-purple-300 text-[10px] font-bold">AI</div><div class="bg-white/5 text-gray-300 rounded-lg p-3 text-xs leading-relaxed max-w-[85%]">${text}</div>`
  history.appendChild(bubble)
  history.scrollTop = history.scrollHeight
}
```

注意：`aiSemanticCommand` 及其依赖的 `aiNormalize`、`aiHasAny`、`AI_COLOR_MAP`、`AI_TYPE_HINTS`、`AI_INCREASE_WORDS`、`AI_DECREASE_WORDS`、`aiDetectIntent`、`aiFilterByType`、`aiAdjustNumber`、`aiPickParam`、`aiDetectParamType` 等函数从原 `ai-chat.js` 搬出，保持不变。

- [ ] **Step 2: 更新 ai-chat.js 为 re-export 兼容层**

```js
export { initAIChat, sendAIChat } from './lab-ai-chat.js'
```

- [ ] **Step 3: 更新 lab.js 中的 import**

将 `import { initAIChat } from './ai-chat.js'` 改为 `import { initAIChat } from './lab-ai-chat.js'`

- [ ] **Step 4: Commit**

```bash
git add src/site/lab-ai-chat.js src/site/ai-chat.js src/site/lab.js
git commit -m "feat: refactor ai-chat into lab-ai-chat with session-store integration"
```

---

### Task 16: 验证 Phase 1-D 完整性

- [ ] **Step 1: 启动 dev server 验证 AI Chat 功能**

Run: `npm run dev`

Expected:
- AI Chat Zone 正确展示对话历史
- 语义调参（"变红"、"加速"等）正常工作
- 状态位（IDLE/GENERATING/READY/FAILED）正确展示

- [ ] **Step 2: 验证旧 demo 兼容性**

打开一个发送裸消息格式的旧 demo，确认通过兼容层正常工作。

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: verify Phase 1-D AI Chat integration complete"
```

---

## 最终验收

### Task 17: 全量验收

- [ ] **Step 1: 结构验收**

```bash
wc -l src/site/lab.js
grep -c "window.parent.document" my-motion-portfolio/public/js/UnifiedRenderer.js
grep -c "_setupEditor\|_createWorkbench\|_openEditor\|_addChatMessage" my-motion-portfolio/public/js/UnifiedRenderer.js
grep -r "window.lastUIConfig" src/site/
```

Expected:
- `lab.js` 行数 < 100
- UnifiedRenderer 中 `window.parent.document` 引用数 = 0
- UnifiedRenderer 中 workbench/editor/chat 方法数 = 0
- `window.lastUIConfig` 不再被直接读写

- [ ] **Step 2: 功能验收**

逐个验证：
- 所有现有 demo 正常加载和预览
- 动态参数控件正常渲染和交互
- 截图/录屏/导出功能正常
- AI 语义调参正常
- 旧 demo 通过兼容层正常工作

- [ ] **Step 3: 体验验收**

- 左右双栏布局稳定
- 左栏 AI Chat Zone 和 Control Zone 分区清晰
- 工作台状态位正确展示
- 无白屏、无按钮重叠、无 UI 闪烁

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete Phase 1 - Shell & Runtime decoupling"
```
