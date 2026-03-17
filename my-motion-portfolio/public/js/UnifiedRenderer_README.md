# UnifiedRenderer 使用指南

`UnifiedRenderer` 是一个标准化的 Creative Coding 引擎基类，旨在简化 Demo 的创建流程，统一代码风格，并自动处理与主应用的 UI 通信。

## 核心优势

* **自动样板代码**: 自动处理 Three.js 的 Scene, Camera, Renderer, Controls 初始化。
* **统一生命周期**: 提供标准的 `init`, `update`, `draw` 钩子。
* **内置 UI 通信**: 通过 `params` 和 `setUI` 自动与主控面板同步，无需手写 `postMessage` 逻辑。
* **自适应**: 自动处理窗口 `resize` 事件。

## 快速开始

1. 引入库文件：

   ```javascript
   import { UnifiedRenderer } from '../js/UnifiedRenderer.js';
   ```
2. 实例化并配置：

   ```javascript
   new UnifiedRenderer({
       type: 'three', // 目前支持 'three'

       // 1. 定义初始参数 (会自动绑定到 UI)
       params: {
           speed: 1.0,
           color: '#ff0000'
       },

       // 2. 初始化逻辑 (场景搭建)
       init: (sketch) => {
           const { scene, params } = sketch;
           // ... 添加物体到 scene ...

           // 配置 UI 面板
           sketch.setUI([
               { name: 'Speed', value: params.speed, min: 0, max: 5, bind: 'speed' },
               { name: 'Color', value: params.color, type: 'color', bind: 'color' }
           ]);
       },

       // 3. 动画循环 (每帧调用)
       update: ({ deltaTime, time }, sketch) => {
           // ... 更新逻辑 ...
       },

       // 4. 参数响应 (当 UI 改变时调用)
       onParamChange: (key, value, sketch) => {
           // ... 根据 key 更新物体属性 ...
       }
   });
   ```

## API 参考

### `constructor(options)`


| 选项            | 类型     | 描述                                                |
| :-------------- | :------- | :-------------------------------------------------- |
| `type`          | String   | 渲染类型，目前仅支持`'three'`。                     |
| `params`        | Object   | 初始参数对象，用于存储所有可调数值。                |
| `init`          | Function | 初始化回调，接收`sketch` 实例作为参数。             |
| `update`        | Function | 动画帧回调，接收`{ time, deltaTime }` 和 `sketch`。 |
| `onParamChange` | Function | 参数变更回调，接收`key`, `value`, `sketch`。        |

### 实例属性 (通过 `sketch` 访问)

* `sketch.scene`: Three.js Scene 对象
* `sketch.camera`: Three.js Camera 对象
* `sketch.renderer`: Three.js Renderer 对象
* `sketch.params`: 当前参数对象

### 实例方法

* `sketch.setUI(config)`: 发送 UI 配置到主应用。`config` 格式遵循之前的协议。

---

## Demo 开发标准 (Standard Protocol)

为确保所有 Demo 的交互体验一致且高质量，所有新开发或迁移的 Demo 必须遵循以下规范：

### 1. 资源与输入 (Assets & Input)

* **默认素材**: 严禁加载可能失效的外部 URL。所有 Demo 初始加载时必须使用本地 Sample 资源作为兜底（如 `../sample/Sample1.jpg` 或 `../sample/Sample1.mp4`），**严禁出现黑屏**。
* **协议支持**: 必须监听并响应全局 `LOAD_SOURCE` 消息：
  * **Image/Video**: 支持用户上传图片或视频替换默认纹理。
  * **Camera**: 必须支持摄像头输入。对于静态处理类特效（如网格变形），应支持抓取摄像头快照；对于实时特效，应绑定视频流。

### 2. AI 与视觉 (AI & Vision)

* **引擎选择**: 涉及手势、姿态、人脸识别时，**强制使用 MediaPipe** 系列库 (Hands, Pose, FaceMesh)，弃用 Handsfree.js 等旧库。
* **视觉调试小窗 (Vision UI)**:
  * **Corner Debugger**: 必须在屏幕右下角（推荐位置 `bottom: 20px; right: 20px`）悬浮显示一个半透明的调试小窗 (建议尺寸 240x180px)。
  * **内容**: 小窗内必须实时渲染摄像头的原始画面，并叠加绿色的骨骼/关键点连线，让用户直观看到 AI 的识别状态。
* **交互逻辑**:
  * **镜像 (Mirroring)**: 摄像头输入和交互坐标必须做**水平镜像**处理，符合“魔镜”直觉。
  * **平滑回归 (Fallback)**: 当 AI 未识别到目标（如手移出画面）时，特效必须**平滑回归到默认状态**（如网格复原），禁止卡死在最后一帧。
