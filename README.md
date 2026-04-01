# 影像动态特效的coding平台 | Motion Graphics Coding Platform

> 一个探索逻辑与影像边界的创意编程实验展示平台。
> Exploration of visual boundaries through creative coding and generative art.

![项目演示](docs/assets/demo.gif)

## 🌟 项目简介

本项目是一个基于 Web 技术的动态视觉实验室，旨在展示各种前沿的图形特效、交互设计和 AI 视觉应用。它结合了 WebGL Shader、Three.js 3D 渲染、p5.js 生成艺术以及 AI 姿态识别等技术。

## ✨ 主要特性

-   **沉浸式 Hero 视觉**：基于 Three.js 的液态扭曲着色器（Liquid Distortion Shader），支持鼠标交互与滚动响应。
-   **交互式项目网格**：
    -   支持 **Studio Mode**（工作室模式），允许用户通过拖拽重新排列项目卡片。
    -   内置搜索与多维度筛选（画面/文字/音频）。
    -   3D 翻转卡片与光效反馈。
-   **Lab View (实验室视图)**：
    -   独立的 iframe 容器运行各种 Demo。
    -   提供参数控制面板（Control Panel），实时调整特效参数。
    -   支持截图与录制功能。
-   **AI 能力集成**：
    -   集成 `ml5.js` (PoseNet) 进行人体姿态识别。
    -   集成 `Transformers.js` 进行深度图估算。

## 🛠️ 技术栈

-   **构建工具**: [Vite](https://vitejs.dev/)
-   **核心框架**: HTML5, JavaScript (ES6+)
-   **样式库**: [Tailwind CSS](https://tailwindcss.com/)
-   **图形/3D**: [Three.js](https://threejs.org/), [p5.js](https://p5js.org/)
-   **动画**: [GSAP](https://greensock.com/gsap/), [Lenis](https://lenis.studiofreight.com/) (平滑滚动)
-   **AI/ML**: [ml5.js](https://ml5js.org/), [Transformers.js](https://huggingface.co/docs/transformers.js)

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/zozo0407/capcut-website.git
cd capcut-website
```

### 2. 安装依赖

确保你已经安装了 Node.js。

```bash
npm install
```

### 3. 启动本地开发服务器

```bash
npm run dev
```

启动后访问 `http://localhost:5173` 即可预览。

### 4. 构建与部署

本项目包含自定义构建脚本，确保所有静态资源正确复制。

```bash
npm run build
```

构建产物将位于 `dist` 目录。你可以直接将其部署到 Netlify, Vercel 或任何静态托管服务。

## 📂 目录结构

### 模块结构（2026 重构）

- `index.html`：站点 HTML 壳层；加载 `/src/main.js`；保留 Background Model Preloader 等少量脚本。
- `src/main.js`：入口装配层（import + 初始化顺序 + `window.*` 绑定，兼容 HTML `onclick`）。
- `src/site/*`：按功能域拆分的模块（核心逻辑都在这里）。
  - `hero.js`：Hero 背景渲染（`initHero`）。
  - `lab.js`：Lab iframe/Workbench/postMessage（`openLab/updateDemoParam/...`）。
  - `demos.js`：Demo 列表/网格/过滤/搜索 + Studio 操作（拖拽/删除/移动等）。
  - `boot.js`：启动序列（`runBootSequence`）。
  - `templates.js`：生成器（`generateTemplateHTML/generateAIHTML`）。
  - `ui.js`：通用小交互（翻卡/文字扰动等）。
  - `ai-chat.js`：AI Chat 语义调参（`sendAIChat`）。
  - `wizard.js`：创意控制台 Wizard（生成/步骤流转等）。
- `my-motion-portfolio/public/*`：运行时静态资源与 Demo 文件（数据清单、demos、UnifiedRenderer、three libs、sample 资源等）。
- `tools/*`：项目整理与本地创作工具链（`creator/`、`build/`、`archive/`）。
- `docs/ai/*`：创意编程/UnifiedRenderer 移植提示词与规范。
- `docs/effects/*`：特效交付模板与技术交接文档。

```
cupcut-website/
├── index.html                    # 主页 HTML 壳层（加载 /src/main.js）
├── src/                          # 主站逻辑
│   ├── main.js                   # 入口装配层（init + window.* 绑定）
│   └── site/                     # 功能域模块
│       ├── hero.js               # Hero 背景（initHero）
│       ├── lab.js                # Lab iframe/控制面板/录制截图
│       ├── demos.js              # Demo 列表/网格/过滤/搜索 + Studio 操作
│       ├── boot.js               # 启动序列
│       ├── templates.js          # 模板/AI 生成 HTML
│       ├── ui.js                 # 小交互（翻卡/文字扰动）
│       ├── ai-chat.js            # AI Chat 语义调参
│       └── wizard.js             # Wizard 创意控制台
├── my-motion-portfolio/          # 运行时资源目录
│   └── public/
│       ├── data/                 # Demo 元数据清单（demos.core.json / demos.json）
│       ├── demos/                # Demo HTML 与 lab.html
│       ├── js/                   # UnifiedRenderer + three libs + 通用模块
│       └── sample/               # Demo 资源样本（图片/音视频等）
├── tools/                        # 本地工具链
│   ├── creator/                  # 统一入口：npm run creator
│   ├── build/                    # 构建瘦身：只复制 Core 必需 public 子集
│   └── archive/                  # 迁出/归档脚本（可选）
├── server.js                     # Creator/Studio API（/api/demos 等）
├── scripts/                      # 辅助脚本（如 quick-preview）
├── docs/                         # 文档与整理设计/计划
├── vite.config.js                # Vite 构建配置
└── package.json                  # 项目脚本与依赖
```

## 📝 许可证

[ISC License](LICENSE)
