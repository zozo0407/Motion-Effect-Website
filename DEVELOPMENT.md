# CapCut Motion Graphics Lab - 开发指南

## 📂 项目结构导航 (Project Map)

### 核心系统 (Core System)
- **入口文件**: `index.html` (位于根目录)
  - 负责 UI 框架、Demo 列表渲染、Iframe 加载器、全局录屏/截图功能。
- **渲染引擎**: `my-motion-portfolio/public/js/UnifiedRenderer.js`
  - **关键文件**。所有 Demo 的基类。处理 Three.js/p5.js 初始化、生命周期、通信协议。
- **路由配置**: `my-motion-portfolio/public/data/demos.json`
  - 注册 Demo 的元数据（标题、路径、图标）。新增 Demo 必改此文件。

### 活跃演示 (Active Demos)
- **Demo 存放路径**: `my-motion-portfolio/public/demos/`
  - `demo4.html`: 圣诞照片墙 (Three.js)
  - `demo11.html`: 植物手绘 (Three.js)
  - `demo_metal_sphere.html`: 金属球体 (Three.js Standard)
  - ...以及其他具体特效文件。
- **通用特效库**: `my-motion-portfolio/public/js/vfx/`

### 构建与部署 (Build & Deploy)
- **Netlify 配置**: `netlify.toml` (根目录)
- **构建脚本**: `package.json` (根目录)
- **子项目配置**: `my-motion-portfolio/package.json`

### 🚫 忽略目录 (Ignored Paths)
*请在阅读代码时跳过以下目录，仅作历史参考：*
- `备份/`
- `参考/`
- `归档/`
- `video-intro/` (独立子项目，非主站核心)

## 🛠 开发规范 (Development Standards)

### 1. 新建 Demo 流程
1.  在 `my-motion-portfolio/public/demos/` 下创建 HTML 文件。
2.  使用 `class ScriptScene` 结构（参考 `threejs-expert` skill）。
3.  必须包含导出标记：
    - `// --- Setup Begin ---` ... `// --- Setup End ---`
    - `// --- Animation Begin ---` ... `// --- Animation End ---`
4.  在 `my-motion-portfolio/public/data/demos.json` 中添加记录。

### 2. 导出合规性
- 严禁在 `ScriptScene` 外部编写业务逻辑。
- 保持 `setupScene` 和 `setupAnimations` 方法的纯粹性，确保上下文 (`this.scene`) 引用正确。
