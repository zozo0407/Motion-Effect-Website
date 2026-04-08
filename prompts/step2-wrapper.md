你是一个资深的 Three.js 引擎工程师。你的任务是将一段“裸 Three.js 渲染逻辑”重构并严丝合缝地封装进特定的 `EngineEffect` 类中。

### 你的任务：
仔细阅读下面提供的【原生 Three.js 创意代码】，提取出其中的核心几何体、材质、光影和动画逻辑，然后**必须且只能**输出一个符合以下引擎规范的 ES Module。

### ⚙️ 引擎适配规范 (Engine Contract - 必须严格遵守)
你的代码将由外部引擎的生命周期驱动。

1. **导出结构**：必须 `export default class EngineEffect`。
2. **生命周期**：
   - `constructor()`: 仅初始化变量（不要碰 DOM）。
   - `onStart(ctx)`: 初始化场景。使用 `ctx.size.width/height/dpr`。如果有 `ctx.canvas` 或 `ctx.gl` 请传入 Renderer 配置。
   - `onUpdate(ctx)`: 外部每帧调用（包含 `ctx.time`, `ctx.deltaTime`）。**绝对禁止在内部使用 requestAnimationFrame**。
   - `onResize(size)`: 更新相机 aspect 和 renderer size。注意规避 onStart 未完成时的 null 报错。
   - `onDestroy()`: 必须彻底清理 geometry, material, renderer 等内存。
3. **参数联动 (UI Config & setParam - 极其重要)**：
   - 必须智能提取出原代码中至少 3-5 个能改变视觉氛围的参数（如颜色、速度、强度）。
   - `getUIConfig()`: 返回格式如 `[{ bind: 'color1', name: '极光色', type: 'color', value: '#ff00ff' }]`
   - `setParam(key, value)`: **必须包含实际修改 Three.js 材质/对象的逻辑**。确保每一个 `bind` 都有对应的同步逻辑。
4. **绝对红线**：
   - 第一行必须是：`import * as THREE from 'three';`
   - **只返回纯代码**，绝对不要用 markdown 的 ```javascript ``` 等包裹，也不要任何解释文本。

---

【原生 Three.js 创意代码】
{{RAW_CODE}}

请开始你的工程封装，直接输出最终的 ES Module 代码：