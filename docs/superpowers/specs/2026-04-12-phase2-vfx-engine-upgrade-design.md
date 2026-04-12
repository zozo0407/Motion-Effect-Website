# Phase 2: VFX 引擎升级 + 后端重构预热 — 精确改造方案

## 0. 背景与目标

Phase 1 完成了宿主页 Shell 与 iframe Preview Runtime 的解耦，建立了 V1.0 消息协议和清晰的模块边界。Phase 2 在此基础上做两件事：

1. **前端 VFX 引擎升级**：让 UnifiedRenderer 从"裸渲染循环"进化为"可插拔特效管线"，支持 EffectComposer 后处理链、高层特效 API、以及自动导出能力声明的注册表。
2. **后端 server.js 解耦预热**：把 1742 行的巨型 server.js 拆分为 `routes/` + `services/`，理清数据流向，为 Phase 3 的 AI 链路维稳打好地基。

**技术栈底线**：原生 JS + ES Modules + Three.js，不引入新框架。

**本 Spec 覆盖**：
1. EffectComposer 接入与生命周期管理
2. 核心特效高层 API 设计
3. 积木注册表（EffectRegistry）设计
4. server.js 目录拆分方案与数据流

**非目标**：不涉及 Phase 3 Code-Execution Agent、Phase 4 性能加固的具体代码。

---

## 一、前端：VFX 引擎升级 (UnifiedRenderer.js)

### 1.1 现状分析

当前 UnifiedRenderer 的渲染循环（`_loop()` 第 661-663 行）已经预留了 EffectComposer 的接入点：

```js
// 现有代码 _loop() 中
if (this.customRender) {
    this.customRender(this, time, deltaTime);
} else if (this.composer) {
    this.composer.render();       // ← 钩子已存在！
} else {
    this.renderer.render(this.scene, this.camera);
}
```

但存在以下问题：

| 问题 | 说明 |
|------|------|
| **composer 无生命周期管理** | `this.composer` 只在 `_loop` 中被读取，没有创建/销毁逻辑 |
| **特效无法动态增删** | 没有 API 往 composer 里加/删 Pass |
| **切换 Demo 时特效污染** | `dispose()` 不清理 composer 和 passes，残留 WebGL 资源 |
| **resize 不联动** | composer 不跟随窗口 resize，画面会错位 |
| **参数热更新断裂** | `UPDATE_PARAM` 只更新 `this.params` 和 `this.uniforms`，不触及 Pass 参数 |
| **现有 PostProcessing.js 是孤岛** | `useBloom()` 能用但脱离生命周期，resize 靠 monkey-patch `onResize` |

### 1.2 EffectComposer 接入与生命周期

#### 1.2.1 核心思路：惰性创建 + 链式管理

EffectComposer 不是默认创建的，只有在 Demo 调用 `addBloom()` / `addGlitch()` 等高层 API 时才惰性初始化。这保证了不使用后处理的 Demo 零开销。

#### 1.2.2 生命周期状态机

```
                    addXxx() 首次调用
  [NoComposer] ──────────────────────► [ComposerActive]
       │                                    │  │
       │                                    │  │ removeEffect() 清空所有 Pass
       │                                    │  ▼
       │                                    │ [ComposerActive (empty)]
       │                                    │  │
       │                                    │  │ 自动降级（无 Pass 则回退直出）
       │                                    │  ▼
       │  dispose()                         │ [NoComposer]
       └────────────────────────────────────┘
```

#### 1.2.3 惰性初始化逻辑

```js
_ensureComposer() {
    if (this.composer) return this.composer;

    this.composer = new EffectComposer(this.renderer);

    // RenderPass 是 composer 的第一个 Pass，永远存在
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);
    this._renderPass = renderPass;

    // 标记：composer 已激活
    this._composerActive = true;

    return this.composer;
}
```

**为什么 RenderPass 永远存在**：EffectComposer 的工作方式是"先渲染场景到缓冲区，再逐 Pass 处理"。没有 RenderPass 就没有输入源，后续 Pass 全部黑屏。

#### 1.2.4 销毁逻辑（防特效污染）

在 `dispose()` 中增加 composer 清理：

```js
dispose() {
    // ... 现有清理逻辑 ...

    // 新增：清理 composer 和所有 Pass
    if (this.composer) {
        this._disposeComposer();
    }
}

_disposeComposer() {
    if (!this.composer) return;

    // 遍历所有 Pass，逐个 dispose
    const passes = this.composer.passes || [];
    for (const pass of passes) {
        if (typeof pass.dispose === 'function') {
            pass.dispose();
        }
    }

    // 清空 passes 数组
    this.composer.passes = [];

    // 释放 composer 内部的 renderTarget
    if (this.composer.renderTarget1) this.composer.renderTarget1.dispose();
    if (this.composer.renderTarget2) this.composer.renderTarget2.dispose();
    if (this.composer._renderTargetBackup) this.composer._renderTargetBackup.dispose();

    this.composer = null;
    this._renderPass = null;
    this._composerActive = false;
    this._effectPasses = [];  // 清空注册表
}
```

#### 1.2.5 Resize 联动

在 `_onResize()` 中增加 composer 尺寸同步：

```js
_onResize() {
    // ... 现有 resize 逻辑 ...

    // 新增：同步 composer 尺寸
    if (this.composer) {
        this.composer.setSize(width, height);
    }
}
```

#### 1.2.6 切换 Demo 时的防污染保障

关键原则：**dispose 是唯一的清理入口，且必须彻底**。

当 Host Shell 通过 bridge 发送新 preview URL 时，iframe 会整体销毁重建，所以 `dispose()` 的彻底性是唯一保障。但为了防御性编程，在 `addXxx()` 系列方法内部也要做幂等检查：

```js
addBloom(options = {}) {
    // 幂等：如果同名 effect 已存在，先移除旧的
    if (this._findEffect('bloom')) {
        this.removeEffect('bloom');
    }
    // ... 创建新 bloom ...
}
```

---

### 1.3 核心特效 API 规划

#### 1.3.1 设计原则

1. **高层 API，低层实现**：Demo 开发者只调 `addBloom({ strength: 1.5 })`，不需要知道 UnrealBloomPass 的细节
2. **参数与 UPDATE_PARAM 热更新对接**：每个特效的可调参数自动注册到 `this.params`，通过 `setParam()` 实时调整
3. **可组合**：多个特效可以叠加（Bloom + Glitch 同时生效）
4. **可移除**：每个特效有唯一标识，可以单独移除

#### 1.3.2 三个核心高层接口

##### API 1: `addBloom(options)`

```js
addBloom(options = {}) {
    const config = {
        strength:   options.strength   ?? 1.5,
        radius:     options.radius     ?? 0.4,
        threshold:  options.threshold  ?? 0.0,
    };

    this._ensureComposer();

    const pass = new UnrealBloomPass(
        new THREE.Vector2(this.renderer.domElement.width, this.renderer.domElement.height),
        config.strength,
        config.radius,
        config.threshold
    );

    this._registerEffect('bloom', pass, {
        params: {
            bloomStrength:  { value: config.strength,  passProp: 'strength',  ui: { name: 'Bloom 强度', min: 0, max: 3, step: 0.1 } },
            bloomRadius:    { value: config.radius,    passProp: 'radius',    ui: { name: 'Bloom 半径', min: 0, max: 1, step: 0.01 } },
            bloomThreshold: { value: config.threshold, passProp: 'threshold', ui: { name: 'Bloom 阈值', min: 0, max: 1, step: 0.01 } },
        }
    });

    return this;
}
```

**参数热更新对接**：当 Host Shell 发送 `UPDATE_PARAM { key: 'bloomStrength', value: 2.0 }` 时：

1. `UPDATE_PARAM` 处理器更新 `this.params.bloomStrength = 2.0`
2. 触发 `_applyEffectParam('bloomStrength', 2.0)`
3. 查注册表找到 `bloomStrength` → 映射到 `bloom pass.strength = 2.0`

##### API 2: `addGlitch(options)`

```js
addGlitch(options = {}) {
    const config = {
        intensity: options.intensity ?? 0.5,
        speed:     options.speed     ?? 1.0,
    };

    this._ensureComposer();

    // GlitchPass 来自 three/addons/postprocessing/GlitchPass.js
    const pass = new GlitchPass();
    pass.goWild = config.intensity > 0.8;

    this._registerEffect('glitch', pass, {
        params: {
            glitchIntensity: { value: config.intensity, ui: { name: 'Glitch 强度', min: 0, max: 1, step: 0.05 }, apply: (pass, v) => { pass.goWild = v > 0.8; } },
            glitchSpeed:     { value: config.speed,     ui: { name: 'Glitch 速度', min: 0.1, max: 5, step: 0.1 } },
        }
    });

    return this;
}
```

**设计说明**：GlitchPass 的原生 API 比较粗糙（只有 `goWild` 开关），所以 `apply` 回调允许自定义参数到 Pass 属性的映射逻辑。

##### API 3: `addCustomPass(pass, options)`

```js
addCustomPass(pass, options = {}) {
    const name = options.name || `custom_${Date.now()}`;

    this._ensureComposer();

    // 确保传入的 pass 不是 RenderPass（RenderPass 由引擎管理）
    if (pass instanceof RenderPass) {
        console.warn('addCustomPass: RenderPass 由引擎自动管理，无需手动添加');
        return this;
    }

    this._registerEffect(name, pass, {
        params: options.params || {}
    });

    return this;
}
```

**用途**：给高级开发者留的逃生舱口，可以传入任意 Three.js Pass。

#### 1.3.3 通用移除接口

```js
removeEffect(name) {
    const entry = this._findEffect(name);
    if (!entry) return this;

    // 从 composer 中移除 Pass
    const idx = this.composer.passes.indexOf(entry.pass);
    if (idx !== -1) {
        this.composer.passes.splice(idx, 1);
    }

    // dispose Pass 资源
    if (typeof entry.pass.dispose === 'function') {
        entry.pass.dispose();
    }

    // 从注册表移除
    this._effectPasses = this._effectPasses.filter(e => e.name !== name);

    // 清理 params 中对应的参数
    for (const [paramKey] of Object.entries(entry.paramMap || {})) {
        delete this.params[paramKey];
    }

    // 如果 composer 只剩 RenderPass，降级为直出
    if (this.composer && this.composer.passes.length <= 1) {
        this._downgradeToDirectRender();
    }

    return this;
}
```

#### 1.3.4 参数热更新的完整链路

```
Host Shell 发送 UPDATE_PARAM { key: 'bloomStrength', value: 2.0 }
  ↓
_setupMessaging() 中的消息处理器
  ↓
this.params['bloomStrength'] = 2.0       // 更新参数存储
  ↓
_applyEffectParam('bloomStrength', 2.0)  // 新增：同步到特效 Pass
  ↓
查注册表：bloomStrength → bloom pass 的 strength 属性
  ↓
pass.strength = 2.0                       // 实时生效！
  ↓
onParamChange('bloomStrength', 2.0, this) // 通知 Demo 层（现有逻辑不变）
```

`_applyEffectParam` 的实现：

```js
_applyEffectParam(key, value) {
    for (const entry of this._effectPasses) {
        const mapping = entry.paramMap && entry.paramMap[key];
        if (!mapping) continue;

        const pass = entry.pass;

        if (mapping.apply) {
            // 自定义映射函数（如 GlitchPass 的 goWild 逻辑）
            mapping.apply(pass, value);
        } else if (mapping.passProp) {
            // 直接属性映射（如 bloom.strength）
            pass[mapping.passProp] = value;
        }
    }
}
```

在 `_setupMessaging()` 的 `UPDATE_PARAM` 处理中增加一行调用：

```js
if (type === 'UPDATE_PARAM') {
    const { key, value } = payload;
    this.params[key] = value;
    // ... 现有 uniforms 处理逻辑 ...

    this._applyEffectParam(key, value);  // ← 新增
    this.onParamChange(key, value, this);
}
```

---

### 1.4 积木注册表设计（EffectRegistry）

#### 1.4.1 设计目标

注册表要解决三个问题：

1. **引擎内部管理**：追踪当前激活了哪些特效、每个特效有哪些可调参数
2. **能力声明导出**：能自动生成"这个 Demo 支持哪些特效"的结构化文档
3. **AI 友好**：AI 生成代码时可以查询注册表，知道有哪些积木可用

#### 1.4.2 数据结构

```js
// 引擎内部注册表（实例级，不是全局单例）
this._effectPasses = [];  // EffectEntry[]

// 单个 EffectEntry 的结构
{
    name: 'bloom',                    // 特效唯一标识
    pass: UnrealBloomPass实例,         // Three.js Pass 对象
    category: 'postprocessing',       // 分类
    paramMap: {                       // 参数映射表
        bloomStrength: {
            value: 1.5,               // 当前值
            passProp: 'strength',     // 对应 Pass 的属性名（或用 apply 回调）
            ui: {                     // UI 声明（用于自动生成控件）
                name: 'Bloom 强度',
                min: 0,
                max: 3,
                step: 0.1,
                type: 'range'
            }
        },
        bloomRadius: { ... },
        bloomThreshold: { ... }
    },
    meta: {                           // 元信息（用于能力声明导出）
        description: '泛光后处理效果',
        tags: ['glow', 'light', 'bloom'],
        version: '1.0',
        author: 'engine'
    }
}
```

#### 1.4.3 注册与反注册

```js
_registerEffect(name, pass, options = {}) {
    // 幂等检查：同名特效先移除
    if (this._findEffect(name)) {
        this.removeEffect(name);
    }

    const entry = {
        name,
        pass,
        category: options.category || 'postprocessing',
        paramMap: options.params || {},
        meta: options.meta || {}
    };

    // 将 Pass 添加到 composer（在 RenderPass 之后）
    this.composer.addPass(pass);

    // 将参数注册到 this.params
    for (const [paramKey, mapping] of Object.entries(entry.paramMap)) {
        this.params[paramKey] = mapping.value;
    }

    this._effectPasses.push(entry);
}

_findEffect(name) {
    return this._effectPasses.find(e => e.name === name) || null;
}
```

#### 1.4.4 能力声明导出（Capabilities）

这是注册表的杀手级功能：**自动生成当前 Demo 的特效能力声明**，供 Host Shell 和 AI 查询。

```js
getCapabilities() {
    return {
        engine: 'UnifiedRenderer',
        version: '2.2',
        type: this.type,
        hasComposer: !!this.composer,
        effects: this._effectPasses.map(entry => ({
            name: entry.name,
            category: entry.category,
            description: entry.meta.description || '',
            tags: entry.meta.tags || [],
            params: Object.entries(entry.paramMap).map(([key, mapping]) => ({
                bind: key,
                ...mapping.ui,
                value: this.params[key] ?? mapping.value
            }))
        })),
        // 合并 Demo 自定义 UIConfig 中的参数
        customParams: this.uiConfig || []
    };
}
```

#### 1.4.5 能力声明如何被消费

**消费方 1：Host Shell 的 CAPABILITIES 消息**

当 Host Shell 发送 `REQUEST_CAPABILITIES` 消息时，UnifiedRenderer 回复：

```js
// 在 _setupMessaging() 中
if (type === 'REQUEST_CAPABILITIES') {
    this._sendProtocolMessage('CAPABILITIES', this.getCapabilities());
}
```

Host Shell 收到后可以：
- 在 Control Zone 自动渲染特效参数控件
- 在 AI Chat Zone 展示"当前支持哪些特效"
- 为录屏/截图功能判断是否需要特殊处理

**消费方 2：AI 代码生成**

后端的 AI 生成 prompt 可以注入注册表信息：

```
当前引擎支持的特效积木：
- bloom: 泛光效果，参数 bloomStrength/bloomRadius/bloomThreshold
- glitch: 故障效果，参数 glitchIntensity/glitchSpeed

在 init 回调中调用 sketch.addBloom({ strength: 1.5 }) 即可启用。
```

**消费方 3：Demo 开发者**

在浏览器控制台中：

```js
// 查看当前 Demo 的完整能力声明
window.unifiedRenderer.getCapabilities()
```

#### 1.4.6 全局注册表 vs 实例注册表

**选择：实例级注册表**，不搞全局单例。

理由：
1. 每个 Demo 是独立 iframe，有独立的 UnifiedRenderer 实例
2. 不同 Demo 可能启用不同特效组合
3. 全局注册表在多 iframe 场景下容易混乱

但我们会提供一个**静态能力目录**（`EffectCatalog`），列出引擎侧所有可用的特效积木：

```js
// EffectCatalog.js — 静态目录，不随实例变化
export const EffectCatalog = {
    bloom: {
        description: '泛光后处理效果',
        tags: ['glow', 'light', 'bloom'],
        params: {
            bloomStrength:  { type: 'range', min: 0, max: 3, step: 0.1, default: 1.5, name: 'Bloom 强度' },
            bloomRadius:    { type: 'range', min: 0, max: 1, step: 0.01, default: 0.4, name: 'Bloom 半径' },
            bloomThreshold: { type: 'range', min: 0, max: 1, step: 0.01, default: 0.0, name: 'Bloom 阈值' },
        }
    },
    glitch: {
        description: '故障风格后处理效果',
        tags: ['cyberpunk', 'distortion', 'glitch'],
        params: {
            glitchIntensity: { type: 'range', min: 0, max: 1, step: 0.05, default: 0.5, name: 'Glitch 强度' },
            glitchSpeed:     { type: 'range', min: 0.1, max: 5, step: 0.1, default: 1.0, name: 'Glitch 速度' },
        }
    }
};
```

这个目录有两个用途：
1. **AI prompt 注入**：告诉 AI 有哪些积木可用
2. **Host Shell 展示**：在特效选择器 UI 中列出可添加的特效

---

### 1.5 改造后的 UnifiedRenderer 公开 API 总览

```js
class UnifiedRenderer {
    // === 现有 API（不变） ===
    constructor(options)
    play()
    pause()
    dispose()
    disposeRuntime()
    capture(format, quality)
    setUI(config)
    createUI(config)
    sendConfig()

    // === 新增：特效管线 API ===
    addBloom(options)              // 添加泛光特效
    addGlitch(options)             // 添加故障特效
    addCustomPass(pass, options)   // 添加自定义 Pass
    removeEffect(name)             // 移除指定特效
    getCapabilities()              // 导出能力声明

    // === 新增：内部方法 ===
    _ensureComposer()              // 惰性创建 EffectComposer
    _disposeComposer()             // 销毁 composer 及所有 Pass
    _registerEffect(name, pass, options)  // 注册特效到注册表
    _findEffect(name)              // 查找特效
    _applyEffectParam(key, value)  // 参数热更新同步到 Pass
    _downgradeToDirectRender()     // 无 Pass 时降级为直出
}
```

### 1.6 与现有 PostProcessing.js 的关系

**迁移策略**：Phase 2 完成后，`PostProcessing.js` 中的 `useBloom()` 将被标记为 deprecated。

| 阶段 | 行为 |
|------|------|
| Phase 2 初期 | `PostProcessing.js` 保留不动，新 API 并行存在 |
| Phase 2 后期 | 所有 Demo 迁移到 `sketch.addBloom()`，`useBloom()` 标记 deprecated |
| Phase 3 | 删除 `PostProcessing.js`，所有后处理走引擎 API |

迁移期间，两种方式可以共存（因为底层都是 EffectComposer），但不建议在同一个 Demo 中混用。

---

## 二、后端：server.js 解耦大扫除

### 2.1 现状分析

当前 `server.js` 是一个 1742 行的巨型文件，包含以下所有内容：

| 类别 | 行数估算 | 包含内容 |
|------|---------|---------|
| **AI 生成逻辑** | ~400 行 | `generateEffectV2FromPrompt()`, `repairEngineEffectCode()`, `classifyStyle()`, `assemblePrompt()` |
| **AI 基础设施** | ~200 行 | `getAIConfig()`, `runWithProviderFallback()`, `fetchWithRetry()`, `runV2Stage()`, `sleep()` |
| **代码校验/修复** | ~300 行 | `validateEngineEffectCode()`, `autoFixEngineEffectCode()`, `basicSyntaxScan()`, `checkESMModuleSyntax()`, `findUnsafeCtxHelperUsage()`, `normalizeEngineEffectExport()`, `findVisibleSceneClosureIssue()` |
| **代码处理工具** | ~100 行 | `stripMarkdownCodeFence()`, `stripModelNonCodePrologue()`, `normalizeThreeNamespaceImport()`, `extractScriptSceneBlock()`, `toExportTemplate()`, `buildScriptSceneDemoHtml()` |
| **路由处理** | ~400 行 | 6 个 API 路由的 handler 逻辑 |
| **骨架/配置** | ~100 行 | `buildCodeFromSkeletonRoute()`, `isSkeletonRouterEnabled()`, `isMinimalFallbackEnabled()`, `getV2TotalBudgetMs()` |
| **常量/配置** | ~50 行 | `DATA_FILE`, `DEMO_DIR`, `PROMPTS_DIR`, `TEMP_PREVIEWS_DIR` |

**核心问题**：
1. **路由与业务逻辑耦合**：路由 handler 里直接调用 AI API、做代码校验、写文件，全混在一起
2. **AI 生成是"面条代码"**：`generateEffectV2FromPrompt()` 一个函数 200+ 行，blueprint/wrapped_parts/repaired 三条路径交织
3. **校验/修复散落各处**：`autoFixEngineEffectCode()` 和 `validateEngineEffectCode()` 在 server.js 中，但 `ensureOnUpdateMethod()` 和 `fixUnsafeCtxHelperUsage()` 在 `tools/creator/engine-autofix.cjs` 中，职责分散
4. **配置硬编码**：AI provider 配置、超时时间、温度参数等散落在各函数内部

### 2.2 目录拆分方案

```
server/
├── index.js                    # 入口：创建 app、挂载路由、启动监听（< 50 行）
├── routes/
│   ├── generate.js             # POST /api/generate-effect
│   ├── generate-v2.js          # POST /api/generate-effect-v2
│   ├── demos.js                # GET/POST /api/demos
│   ├── import-script-scene.js  # POST /api/import-script-scene
│   ├── save-preview.js         # POST /api/save-preview-as-demo
│   ├── create-demo.js          # POST /api/create-demo
│   └── preview.js              # GET /preview/:id
├── services/
│   ├── ai-generator.js         # AI 代码生成核心（generateEffectV2FromPrompt + classifyStyle + assemblePrompt）
│   ├── ai-repair.js            # AI 代码修复（repairEngineEffectCode）
│   ├── ai-provider.js          # AI Provider 管理（getAIConfig + runWithProviderFallback + fetchWithRetry + runV2Stage）
│   ├── code-validator.js       # 代码校验（validateEngineEffectCode + basicSyntaxScan + checkESMModuleSyntax + findUnsafeCtxHelperUsage + findVisibleSceneClosureIssue）
│   ├── code-autofix.js         # 代码自动修复（autoFixEngineEffectCode + normalizeEngineEffectExport + normalizeThreeNamespaceImport）— 聚合 tools/creator/engine-autofix.cjs
│   ├── code-transforms.js      # 代码文本变换（stripMarkdownCodeFence + stripModelNonCodePrologue + extractScriptSceneBlock + toExportTemplate + buildScriptSceneDemoHtml）
│   ├── skeleton-router.js      # 骨架路由（聚合 tools/creator/skeleton-router.cjs + 所有 skeleton builders）
│   └── demo-store.js           # Demo 数据 CRUD（读写 demos.json + 创建 demo HTML 文件）
└── config.js                   # 常量与配置（DATA_FILE, DEMO_DIR, PROMPTS_DIR, 超时时间, 环境变量读取）
```

### 2.3 数据流向

#### 2.3.1 生成特效的完整数据流

```
用户请求 POST /api/generate-effect-v2 { prompt }
  │
  ▼
routes/generate-v2.js
  │  1. 参数校验
  │  2. 读取配置（config.js）
  │  3. 判断是否走骨架路由
  │
  ├─ 骨架路由 ──► services/skeleton-router.js
  │                  │ routePromptToSkeleton(prompt)
  │                  │ buildCodeFromSkeletonRoute(route)
  │                  ▼
  │              返回骨架代码
  │
  ├─ AI 生成 ──► services/ai-generator.js
  │                  │ generateEffectV2FromPrompt(prompt, providers, options)
  │                  │   内部调用 ai-provider.js 获取 provider 列表
  │                  │   内部调用 ai-provider.js 的 runV2Stage() 发请求
  │                  ▼
  │              返回原始 AI 代码
  │
  ├─ 自动修复 ──► services/code-autofix.js
  │                  │ autoFixEngineEffectCode(code)
  │                  ▼
  │              返回修复后代码
  │
  ├─ 校验 ──► services/code-validator.js
  │              │ validateEngineEffectCode(code)
  │              ▼
  │          校验通过？── 是 ──► 返回 { code }
  │              │
  │              否
  │              ▼
  ├─ AI 修复 ──► services/ai-repair.js
  │                  │ repairEngineEffectCode({ prompt, badCode, error, providers })
  │                  ▼
  │              返回修复后代码
  │
  ├─ 再次自动修复 ──► services/code-autofix.js
  ├─ 再次校验 ──► services/code-validator.js
  │
  └─ 校验仍失败？
       │
       ├─ minimalFallback 启用 ──► services/skeleton-router.js (fallback)
       └─ minimalFallback 禁用 ──► 返回 502 { error }
```

#### 2.3.2 Demo CRUD 的数据流

```
GET /api/demos
  │
  ▼
routes/demos.js ──► services/demo-store.js
                      │ readDemos()
                      ▼
                  返回 demos.json 内容

POST /api/demos
  │
  ▼
routes/demos.js ──► services/demo-store.js
                      │ writeDemos(data)
                      ▼
                  写入 demos.json

POST /api/save-preview-as-demo
  │
  ▼
routes/save-preview.js
  │  1. 读取临时预览文件
  │  2. 调用 services/code-transforms.js 生成 HTML
  │  3. 调用 services/demo-store.js 写入 demo 文件 + 更新 JSON
  ▼
返回 { success, demo }
```

### 2.4 各模块职责与接口定义

#### `config.js` — 配置中心

```js
module.exports = {
    PORT: process.env.PORT || 3000,
    DATA_FILE: path.join(__dirname, '..', 'my-motion-portfolio/public/data/demos.json'),
    DEMO_DIR: path.join(__dirname, '..', 'my-motion-portfolio/public/demos'),
    PROMPTS_DIR: path.join(__dirname, '..', 'prompts'),
    TEMP_PREVIEWS_DIR: path.join(__dirname, '..', '.temp_previews'),
    AI_V2_TOTAL_BUDGET_MS: getV2TotalBudgetMs(),
    AI_DEMO_MODE: process.env.AI_DEMO_MODE === '1',
    AI_ENABLE_SKELETON_ROUTER: isSkeletonRouterEnabled(),
    AI_DISABLE_LEGACY_SKELETONS: isLegacySkeletonsDisabled(),
    AI_ENABLE_MINIMAL_FALLBACK: isMinimalFallbackEnabled(),
    AI_V2_OUTPUT_MODE: process.env.AI_V2_OUTPUT_MODE,
};
```

#### `services/ai-provider.js` — AI Provider 管理

```js
module.exports = {
    getProviders(env),                    // 从环境变量解析 provider 列表
    getFirstProvider(env),                // 获取第一个可用 provider
    runWithProviderFallback(providers, runner),  // 带 fallback 的执行
    fetchWithRetry(url, options, retryOptions),  // 带重试的 fetch
    runV2Stage({ stage, url, apiKey, model, messages, temperature, maxTokens, timeoutMs }),
    sleep(ms),
    sleepWithSignal(ms, signal),
};
```

#### `services/ai-generator.js` — AI 代码生成

```js
module.exports = {
    generateEffectV2FromPrompt(prompt, providers, options),
    classifyStyle(prompt, providers),
    assemblePrompt(style, userPrompt),
};
```

#### `services/ai-repair.js` — AI 代码修复

```js
module.exports = {
    repairEngineEffectCode({ prompt, badCode, error, providers, timeoutMs }),
};
```

#### `services/code-validator.js` — 代码校验

```js
module.exports = {
    validateEngineEffectCode(code),       // 主校验入口，返回 null 或错误字符串
    basicSyntaxScan(code),                // 基础语法扫描
    checkESMModuleSyntax(code),           // Node --check 语法校验
    findUnsafeCtxHelperUsage(code),       // 检测不安全的 ctx 使用
    findVisibleSceneClosureIssue(code),   // 检测可见对象闭环问题
};
```

#### `services/code-autofix.js` — 代码自动修复

```js
module.exports = {
    autoFixEngineEffectCode(code),        // 主修复入口
    normalizeEngineEffectExport(code),     // 标准化 export
    normalizeThreeNamespaceImport(code),   // 标准化 THREE import
    stripMarkdownCodeFence(text),          // 去除 markdown 代码围栏
    stripModelNonCodePrologue(text),       // 去除模型输出前缀
    ensureOnUpdateMethod(code),            // 确保有 onUpdate 方法
    fixUnsafeCtxHelperUsage(code),         // 修复不安全的 ctx 使用
};
```

**注意**：`ensureOnUpdateMethod` 和 `fixUnsafeCtxHelperUsage` 当前在 `tools/creator/engine-autofix.cjs` 中，Phase 2 将它们迁移到 `services/code-autofix.js`，原文件改为 re-export 以保持向后兼容。

#### `services/code-transforms.js` — 代码文本变换

```js
module.exports = {
    extractScriptSceneBlock(scriptSceneText),
    toExportTemplate(templateText, blockText),
    buildScriptSceneDemoHtml({ title, threePath, threeAddonsPath, blockText, exportTextLiteral }),
    isPathAllowed(userPath),
};
```

#### `services/skeleton-router.js` — 骨架路由

```js
module.exports = {
    routePromptToSkeleton(prompt),
    buildCodeFromSkeletonRoute(route),
    buildMinimalFallbackPayload(options),
};
```

#### `services/demo-store.js` — Demo 数据 CRUD

```js
module.exports = {
    readDemos(),                          // 读取 demos.json
    writeDemos(data),                     // 写入 demos.json
    getNextDemoId(),                      // 获取下一个可用 ID
    createDemoFile(fileName, html),       // 创建 demo HTML 文件
    readTempPreview(id),                  // 读取临时预览文件
};
```

#### `routes/*.js` — 路由处理

每个路由文件导出一个函数，接收 `app` 和 `services` 依赖注入：

```js
// routes/generate-v2.js
module.exports = function(app, services) {
    const { aiGenerator, aiRepair, codeValidator, codeAutofix, skeletonRouter, config } = services;

    app.post('/api/generate-effect-v2', async (req, res) => {
        // 路由逻辑：参数校验 → 调用 services → 返回结果
        // 不再包含任何业务逻辑！
    });
};
```

#### `index.js` — 入口

```js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const config = require('./config');

// Services
const aiProvider = require('./services/ai-provider');
const aiGenerator = require('./services/ai-generator');
const aiRepair = require('./services/ai-repair');
const codeValidator = require('./services/code-validator');
const codeAutofix = require('./services/code-autofix');
const codeTransforms = require('./services/code-transforms');
const skeletonRouter = require('./services/skeleton-router');
const demoStore = require('./services/demo-store');

// Routes
const registerGenerateRoute = require('./routes/generate');
const registerGenerateV2Route = require('./routes/generate-v2');
const registerDemosRoute = require('./routes/demos');
const registerImportRoute = require('./routes/import-script-scene');
const registerSavePreviewRoute = require('./routes/save-preview');
const registerCreateDemoRoute = require('./routes/create-demo');
const registerPreviewRoute = require('./routes/preview');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(config.ROOT_DIR));

const services = {
    aiProvider, aiGenerator, aiRepair,
    codeValidator, codeAutofix, codeTransforms,
    skeletonRouter, demoStore, config
};

registerGenerateRoute(app, services);
registerGenerateV2Route(app, services);
registerDemosRoute(app, services);
registerImportRoute(app, services);
registerSavePreviewRoute(app, services);
registerCreateDemoRoute(app, services);
registerPreviewRoute(app, services);

app.listen(config.PORT, () => {
    console.log(`Creator Server running at http://localhost:${config.PORT}`);
});
```

### 2.5 迁移兼容策略

**渐进式拆分，不是一次性重写**：

1. **第一步**：创建 `server/` 目录结构，每个 service 文件从 `server.js` 中"搬出"对应函数，`server.js` 改为 re-export
2. **第二步**：创建 `server/index.js` 作为新入口，`package.json` 的 `start` 脚本指向 `node server/index.js`
3. **第三步**：所有测试通过后，删除根目录的 `server.js`（或保留为 compat 入口）
4. **第四步**：`tools/creator/engine-autofix.cjs` 中的函数迁移到 `services/code-autofix.js`，原文件 re-export

**测试保障**：
- 现有 `tools/tests/` 下的所有 `.test.cjs` 测试必须继续通过
- 迁移过程中不改变任何业务逻辑，只做文件搬移和接口对齐

### 2.6 拆分后的收益

| 维度 | 拆分前 | 拆分后 |
|------|--------|--------|
| **单文件行数** | 1742 行 | 最大文件 < 200 行 |
| **路由 handler 行数** | 100-200 行/个 | 30-50 行/个 |
| **新增 AI provider** | 改 server.js | 只改 `services/ai-provider.js` |
| **新增校验规则** | 改 server.js | 只改 `services/code-validator.js` |
| **新增路由** | 改 server.js | 新建 `routes/xxx.js` + 注册 |
| **单元测试** | 难以隔离 | 每个 service 独立测试 |

---

## 三、实施顺序建议

### Phase 2-A：VFX 引擎核心（前端）

1. 在 UnifiedRenderer 中实现 `_ensureComposer()` + `_disposeComposer()`
2. 实现 `_registerEffect()` + `_findEffect()` + `_applyEffectParam()`
3. 实现 `addBloom()` + `addGlitch()` + `addCustomPass()` + `removeEffect()`
4. 改造 `dispose()` 增加 composer 清理
5. 改造 `_onResize()` 增加 composer 尺寸同步
6. 改造 `_setupMessaging()` 的 `UPDATE_PARAM` 增加 `_applyEffectParam` 调用
7. 实现 `getCapabilities()` + `REQUEST_CAPABILITIES` 消息处理
8. 创建 `EffectCatalog.js` 静态目录
9. 在一个 Demo 中验证完整链路

### Phase 2-B：后端拆分（后端）

1. 创建 `server/config.js`，提取所有常量和配置
2. 创建 `server/services/ai-provider.js`，搬出 provider 管理 + fetch + retry
3. 创建 `server/services/code-validator.js`，搬出校验逻辑
4. 创建 `server/services/code-autofix.js`，搬出修复逻辑（聚合 engine-autofix.cjs）
5. 创建 `server/services/code-transforms.js`，搬出代码变换
6. 创建 `server/services/ai-generator.js`，搬出生成逻辑
7. 创建 `server/services/ai-repair.js`，搬出修复逻辑
8. 创建 `server/services/skeleton-router.js`，聚合骨架路由
9. 创建 `server/services/demo-store.js`，搬出 Demo CRUD
10. 创建 `server/routes/*.js`，搬出路由 handler
11. 创建 `server/index.js`，组装入口
12. 更新 `package.json` 的 `start` 脚本
13. 运行全部测试确认无回归

### Phase 2-C：联调与收尾

1. 前端特效 API 与后端 AI prompt 联调（注入 EffectCatalog 信息）
2. Host Shell 的 `REQUEST_CAPABILITIES` 消息联调
3. 旧 `PostProcessing.js` 标记 deprecated
4. 文档更新

---

## 四、验收标准

### 4.1 前端 VFX 引擎

- [ ] `addBloom()` 调用后，Demo 画面出现泛光效果
- [ ] `addGlitch()` 调用后，Demo 画面出现故障效果
- [ ] 多个特效可叠加（Bloom + Glitch 同时生效）
- [ ] `removeEffect('bloom')` 后泛光消失，其他特效不受影响
- [ ] `UPDATE_PARAM { key: 'bloomStrength', value: 2.0 }` 实时调整泛光强度
- [ ] `dispose()` 后无 WebGL 资源泄漏（composer + passes 全部清理）
- [ ] resize 后特效画面不错位
- [ ] 不使用特效的 Demo 零开销（不创建 composer）
- [ ] `getCapabilities()` 返回正确的结构化能力声明
- [ ] `REQUEST_CAPABILITIES` 消息触发 `CAPABILITIES` 回复

### 4.2 后端拆分

- [ ] `server.js` 行数 < 50（或删除，保留 compat 入口）
- [ ] 每个 service 文件 < 200 行
- [ ] 每个路由文件 < 80 行
- [ ] 所有现有 `.test.cjs` 测试通过
- [ ] `POST /api/generate-effect` 和 `POST /api/generate-effect-v2` 功能不变
- [ ] `GET /api/demos` 和 `POST /api/demos` 功能不变
- [ ] `POST /api/import-script-scene` 功能不变
- [ ] `POST /api/save-preview-as-demo` 功能不变
- [ ] `GET /preview/:id` 功能不变
- [ ] 新增 AI provider 只需修改 `services/ai-provider.js`

### 4.3 联调

- [ ] AI 生成的代码能正确使用 `sketch.addBloom()` 等 API
- [ ] Host Shell 能接收并展示 `CAPABILITIES` 消息
- [ ] 旧 Demo（不使用特效 API）完全不受影响
