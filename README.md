# 剪映 - 动态影像实验室 | CapCut Motion Graphics Lab

> 一个探索逻辑与影像边界的创意编程实验展示平台。
> Exploration of visual boundaries through creative coding and generative art.

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

```
cupcut-website/
├── index.html              # 主页入口 (包含 Hero, Grid, UI 逻辑)
├── package.json            # 项目配置与脚本
├── vite.config.js          # Vite 构建配置
├── server.js               # 本地开发用简单服务器 (可选)
├── my-motion-portfolio/    # 核心资源目录
│   └── public/
│       ├── demos/          # 各个独立特效 Demo 的 HTML 文件
│       ├── js/             # 通用 JS 库 (UnifiedRenderer.js 等)
│       └── data/           # 项目元数据 (demos.json)
└── video-intro/            # 视频介绍相关资源 (Remotion 项目)
```

## 📝 许可证

[ISC License](LICENSE)
