### ⚙️ 引擎适配规范 (Engine Contract - 必须严格遵守)
你的代码将由外部引擎的生命周期驱动，必须输出符合规范的 ES Module。

1. **导出结构**：必须 `export default class EngineEffect`。
2. **生命周期**：
   - `constructor()`: 仅初始化变量（不要碰 DOM）。
   - `onStart(ctx)`: 初始化场景。使用 `ctx.size.width/height/dpr`。渲染必须使用外部注入的 `ctx.canvas/ctx.gl`（如存在）；如需要挂载节点，只能使用 `ctx.container`（如存在），禁止使用 `document/window/navigator`。
   - `onUpdate(ctx)`: 外部每帧调用（包含 `ctx.time`, `ctx.deltaTime`）。**绝对禁止在内部使用 requestAnimationFrame**。
   - `onResize(size)`: 更新相机 aspect 和 renderer size。注意规避 onStart 未完成时的 null 报错。
   - `onDestroy()`: 必须彻底清理 geometry, material, renderer 等内存。
3. **参数联动 (UI Config & setParam - 极其重要)**：
   - 左侧面板的交互完全依赖你的 `setParam` 实现。如果你只更新了 `this.params[key] = value` 而不更新 Three.js 对象，画面就不会有任何变化！
   - `getUIConfig()`: 返回 3-5 个**能极大改变视觉氛围**的参数。格式：`[{ bind: 'color1', name: '极光色', type: 'color', value: '#ff00ff' }, { bind: 'speed', name: '流速', type: 'range', value: 1.0, min: 0.1, max: 5.0, step: 0.1 }]`
   - `setParam(key, value)`: **必须包含实际修改 Three.js 材质/对象的逻辑**。
     - 【普通材质颜色示例】：`if (key === 'color1' && this.material) { this.material.color.set(value); }`
     - 【Shader 变量示例】：`if (key === 'speed' && this.material) { this.material.uniforms.uSpeed.value = value; }`
     - 确保每一个在 `getUIConfig()` 中定义的 `bind` 字段，在 `setParam` 中都写了对应的同步逻辑！
4. **绝对红线**：
   - 第一行必须是：`import * as THREE from 'three';`
   - **只返回纯代码**，绝对不要用 markdown 的 ```javascript ``` 等包裹，也不要任何解释文本。直接输出可执行的 JS 代码。
   - 保持自包含（Self-contained），**不请求外部图片或贴图**，所有纹理必须用 Canvas API 动态生成或使用 Shader 计算。
   - 始终使用 `THREE.` 命名空间。
   - 禁止使用 `ctx.renderer`（预览引擎不会注入 renderer；请在 onStart(ctx) 内用 ctx.canvas/ctx.gl 自行创建 THREE.WebGLRenderer）。
   - 禁止出现 `document.` / `window.` / `navigator.`（包括但不限于 querySelector/getElementById/createElement/body/appendChild 等）。不要自己创建 canvas，不要把 renderer.domElement append 到 document 上。

---

用户想要的效果描述：
{{USER_PROMPT}}

请直接输出你的 ES Module 代码（记得只输出纯代码，追求极致的视觉惊艳！）：
