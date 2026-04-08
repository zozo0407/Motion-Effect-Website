# CapCut Motion Graphics Lab - 开发指南

## 📂 项目结构导航 (Project Map)

## 🎯 迭代时关注哪些文件（Where to Edit）

### 主站入口与装配（最常改）
- **HTML 壳层**: `index.html`（根目录）
  - 负责页面结构与少量内联脚本（例如 Background Model Preloader），并加载 `/src/main.js`。
- **入口装配层**: `src/main.js`
  - 负责模块 import、初始化顺序、以及 `window.*` 绑定（兼容 HTML `onclick`）。
- **站点模块目录**: `src/site/*`
  - 这里是主站大部分逻辑的归属地（按功能域拆分）。

### 业务核心模块（按功能域）
- **Demo 展厅/列表/搜索/筛选/Studio**: `src/site/demos.js`
- **Lab（iframe + 控制面板 + postMessage + 截图/录制）**: `src/site/lab.js`
- **Wizard 创意控制台**: `src/site/wizard.js`
- **AI Chat 语义调参**: `src/site/ai-chat.js`
- **生成器（导出/模板 HTML）**: `src/site/templates.js`
- **启动与视觉**: `src/site/hero.js`、`src/site/boot.js`、`src/site/ui.js`

### Demo 内容与资源（做作品时最常改）
- **官方展厅清单（Core）**: `my-motion-portfolio/public/data/demos.core.json`（首页默认读取）
- **全量清单（Studio/工具链）**: `my-motion-portfolio/public/data/demos.json`
- **Demo HTML**: `my-motion-portfolio/public/demos/`（每个 demo 一个 HTML）
- **通用运行时引擎**: `my-motion-portfolio/public/js/UnifiedRenderer.js`（改引擎能力会影响所有 demo）
- **示例资源**: `my-motion-portfolio/public/sample/`

### 工具链与构建（影响迭代效率）
- **Creator/Studio API**: `server.js`（`/api/demos` 等）
- **统一启动入口**: `npm run creator` → `tools/creator/start.js`
- **构建瘦身复制白名单**: `tools/build/copy-core-public.js`
- **部署配置**: `netlify.toml`

### 核心系统 (Core System)
- **入口文件**: `index.html` (位于根目录)
  - 页面结构与少量脚本；主站逻辑由 `src/main.js` 与 `src/site/*` 承载。
- **主站逻辑**: `src/main.js` + `src/site/*`
  - Demo Grid、Lab、Wizard、AI Chat 等主要交互逻辑都在这里。
- **渲染引擎**: `my-motion-portfolio/public/js/UnifiedRenderer.js`
  - **关键文件**。所有 Demo 的基类。处理 Three.js/p5.js 初始化、生命周期、通信协议。
- **官方展厅清单（Core）**: `my-motion-portfolio/public/data/demos.core.json`
  - 首页默认读取的精选 Demo 元数据清单（建议保持约 10 个，人工维护）。
- **全量清单（Studio/历史/UGC）**: `my-motion-portfolio/public/data/demos.json`
  - Demo 的全量元数据清单（标题、路径、图标等）。工作室模式与本地管理工具链使用。

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
- **资源目录（assets-only）**: `my-motion-portfolio/public/`（主站运行时静态资源与 demos）

### Creator 工具链（本地创作/管理）
- **启动命令**: `npm run creator`
- **入口文档**: `tools/creator/README.md`

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
4.  在 `my-motion-portfolio/public/data/demos.json` 中添加记录（全量清单）。
5.  仅当需要加入首页官方展厅时，再同步更新 `my-motion-portfolio/public/data/demos.core.json`（Core 清单）。

### 2. 导出合规性
- 严禁在 `ScriptScene` 外部编写业务逻辑。
- 保持 `setupScene` 和 `setupAnimations` 方法的纯粹性，确保上下文 (`this.scene`) 引用正确。
