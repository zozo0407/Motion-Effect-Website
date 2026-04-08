# Core Demos 首页收口 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增 Core 10 清单并让首页默认只展示 Core 10。

**Architecture:** 在 `my-motion-portfolio/public/data/` 新增 `demos.core.json` 作为只读官方展厅清单；`index.html` 的 demos 加载逻辑默认读取该清单（仍保留现有全量 demos 数据源供 Studio/UGC 后续使用）。

**Tech Stack:** HTML + Vanilla JS（ES Modules）、Vite、Express（可选本地工具链）

---

## Files

**Create**
- `/Users/bytedance/Downloads/cupcut-website/my-motion-portfolio/public/data/demos.core.json`

**Modify**
- `/Users/bytedance/Downloads/cupcut-website/index.html`
- `/Users/bytedance/Downloads/cupcut-website/DEVELOPMENT.md`（可选但推荐）

---

### Task 1: 新增 Core 10 清单文件

**Files:**
- Create: `/Users/bytedance/Downloads/cupcut-website/my-motion-portfolio/public/data/demos.core.json`

- [ ] **Step 1: 创建 demos.core.json（仅包含 10 个 Core）**

将以下 JSON 数组写入 `demos.core.json`（字段与现有 `demos.json` 保持一致）：

```json
[
  { "id": "001", "title": "圣诞照片墙", "keywords": "sdzpq", "enTitle": "Christmas Photo Wall", "tech": "Algorithm", "category": "画面", "subcategory": "材质纹理", "url": "my-motion-portfolio/public/demos/demo4.html", "color": "text-green-400", "isOriginal": true, "icon": "<rect x=\"40\" y=\"40\" width=\"120\" height=\"120\" rx=\"10\" stroke=\"currentColor\" fill=\"none\" stroke-width=\"2\"/><circle cx=\"100\" cy=\"90\" r=\"25\" fill=\"currentColor\" opacity=\"0.5\"/><path d=\"M50,150 L80,110 L110,140 L130,120 L150,150\" stroke=\"currentColor\" fill=\"none\" stroke-width=\"2\"/>" },
  { "id": "002", "title": "动能粒子", "keywords": "dnlz", "enTitle": "Kinetic Physics", "tech": "Matter.js", "category": "画面", "subcategory": "物理模拟", "url": "my-motion-portfolio/public/demos/demo8.html", "color": "text-orange-400", "isOriginal": true, "icon": "<circle cx=\"80\" cy=\"80\" r=\"15\" stroke=\"currentColor\" fill=\"none\"/><circle cx=\"120\" cy=\"120\" r=\"20\" stroke=\"currentColor\" fill=\"none\"/><line x1=\"90\" y1=\"90\" x2=\"110\" y2=\"110\" stroke=\"currentColor\"/>" },
  { "id": "003", "title": "姿态识别", "keywords": "ztsb", "enTitle": "Pose Estimation", "tech": "TensorFlow.js", "category": "画面", "subcategory": "AI识别", "url": "my-motion-portfolio/public/demos/demo5.html", "color": "text-cyan-400", "isOriginal": true, "icon": "<circle cx=\"100\" cy=\"60\" r=\"10\" fill=\"currentColor\"/><path d=\"M100,70 L100,130 M70,90 L130,90 M70,160 L100,130 L130,160\" stroke=\"currentColor\" stroke-width=\"4\" stroke-linecap=\"round\"/>" },
  { "id": "005", "title": "深度视差", "keywords": "sdsc", "enTitle": "AI Depth Parallax", "tech": "Transformers.js", "category": "画面", "subcategory": "AI识别", "url": "my-motion-portfolio/public/demos/demo9.html", "color": "text-purple-500", "isOriginal": true, "icon": "<rect x=\"60\" y=\"60\" width=\"80\" height=\"80\" stroke=\"currentColor\" fill=\"none\" stroke-width=\"2\"/><rect x=\"80\" y=\"40\" width=\"80\" height=\"80\" stroke=\"currentColor\" fill=\"none\" stroke-width=\"2\" opacity=\"0.5\"/>" },
  { "id": "006", "title": "动态追踪", "keywords": "dtzz", "enTitle": "Motion Tracking", "tech": "OpenCV / JS", "category": "画面", "subcategory": "AI识别", "url": "my-motion-portfolio/public/demos/demo10.html", "color": "text-yellow-400", "isOriginal": true, "icon": "<rect x=\"50\" y=\"50\" width=\"100\" height=\"100\" stroke=\"currentColor\" stroke-dasharray=\"10 5\" fill=\"none\"/><circle cx=\"100\" cy=\"100\" r=\"5\" fill=\"currentColor\"/>" },
  { "id": "007", "title": "植物手绘", "keywords": "ztsh", "enTitle": "Plant Sketch", "tech": "Three.js", "category": "画面", "subcategory": "3D特效", "url": "my-motion-portfolio/public/demos/demo11.html", "color": "text-green-500", "isOriginal": true, "icon": "<path d=\"M50,150 Q100,50 150,150\" stroke=\"currentColor\" fill=\"none\" stroke-width=\"4\" stroke-linecap=\"round\"/><circle cx=\"100\" cy=\"90\" r=\"12\" fill=\"currentColor\"/><circle cx=\"130\" cy=\"130\" r=\"10\" fill=\"currentColor\"/>" },
  { "id": "020", "title": "拼贴风景", "keywords": "ptfj", "enTitle": "Picture Cut Landscape", "tech": "p5.js / GenArt", "category": "画面", "subcategory": "生成艺术", "url": "my-motion-portfolio/public/demos/demo20.html", "color": "text-blue-400", "isOriginal": false, "icon": "<path d=\"M40,160 L80,100 L120,140 L160,90 L200,160\" stroke=\"currentColor\" fill=\"none\" stroke-width=\"2\"/><circle cx=\"160\" cy=\"60\" r=\"15\" stroke=\"currentColor\" fill=\"none\"/>" },
  { "id": "031", "title": "音频可视化", "keywords": "audio_anomaly", "enTitle": "Audio Visualizer", "tech": "Three.js / Shader", "category": "音频", "subcategory": "音频可视化", "url": "my-motion-portfolio/public/demos/demo_audio_anomaly.html", "color": "text-[#2ec4b6]", "isOriginal": false, "icon": "<path d=\"M100,20 L180,60 L180,140 L100,180 L20,140 L20,60 Z\" stroke=\"currentColor\" fill=\"none\" stroke-width=\"2\"/><circle cx=\"100\" cy=\"100\" r=\"30\" fill=\"currentColor\" opacity=\"0.6\"/><path d=\"M80,100 L120,100 M100,80 L100,120\" stroke=\"currentColor\" stroke-width=\"2\"/>" },
  { "id": "030", "title": "赛博文字", "keywords": "glitch_text", "enTitle": "Cyberpunk Glitch Text", "tech": "Shader / Canvas", "category": "文字", "subcategory": "字符特效", "url": "my-motion-portfolio/public/demos/demo_text_glitch.html", "color": "text-green-500", "isOriginal": false, "icon": "<text x=\"100\" y=\"120\" text-anchor=\"middle\" fill=\"currentColor\" font-size=\"60\" font-family=\"monospace\">TXT</text><line x1=\"40\" y1=\"80\" x2=\"160\" y2=\"80\" stroke=\"currentColor\" stroke-width=\"2\"/>" },
  { "id": "027", "title": "流场粒子", "keywords": "curl_noise", "enTitle": "Curl Noise Flow", "tech": "Three.js / Shader", "category": "画面", "subcategory": "粒子系统", "url": "my-motion-portfolio/public/demos/demo_curl_noise.html", "color": "text-purple-400", "isOriginal": false, "icon": "<path d=\"M50,150 C50,50 150,50 150,150\" stroke=\"currentColor\" fill=\"none\" stroke-width=\"2\" stroke-dasharray=\"5 5\"/><circle cx=\"80\" cy=\"80\" r=\"5\" fill=\"currentColor\"/><circle cx=\"120\" cy=\"120\" r=\"5\" fill=\"currentColor\"/>" }
]
```

- [ ] **Step 2: 快速校验 JSON 可解析**

Run:
```bash
node -e "const fs=require('fs'); JSON.parse(fs.readFileSync('my-motion-portfolio/public/data/demos.core.json','utf8')); console.log('OK')"
```

Expected:
```text
OK
```

---

### Task 2: 首页默认读取 Core 清单

**Files:**
- Modify: `/Users/bytedance/Downloads/cupcut-website/index.html`

- [ ] **Step 1: 定位并阅读 fetchDemos / renderDemoGrid 的调用链**
确认当前链路（用于在不破坏 Studio/UGC 的前提下改默认行为）：
- `fetchDemos()`：当前会尝试 `${API_BASE}/demos`，失败回退到 `my-motion-portfolio/public/data/demos.json`
- `renderDemoGrid()`：根据 DEMO_LIST 渲染网格

- [ ] **Step 2: 将“默认数据源”切换为 demos.core.json**
实现规则：
- 首页初始化时：优先加载 `my-motion-portfolio/public/data/demos.core.json`
- 保留原有“全量 demos”加载函数（命名可为 `fetchAllDemos()` 或 `fetchDemos({ scope: 'all' })`），供 Studio 模式/管理功能后续使用

（实现方式：在 `fetchDemos()` 内把静态 fallback 从 `demos.json` 改为 `demos.core.json`，并避免在非 Studio 场景强依赖 API）

- [ ] **Step 3: 验证首页网格数量为 10 且点击可打开 Lab**
手动验证清单：
- 首页只展示 10 张卡片
- 点击每一张，iframe 能加载对应 demo（`openLab()` 正常）

---

### Task 3: 更新开发文档（推荐）

**Files:**
- Modify: `/Users/bytedance/Downloads/cupcut-website/DEVELOPMENT.md`

- [ ] **Step 1: 在“新增 Demo / 修改 demos.json”相关章节加入 Core 清单说明**
新增要点：
- `demos.core.json`：官方展厅清单（首页默认读取）
- `demos.json`：历史全量清单（用于 Studio/UGC/归档，后续会逐步分流）

---

### Task 4: 回归验证

- [ ] **Step 1: 本地启动并访问首页**
Run:
```bash
npm run dev
```

Expected:
- 浏览器打开 `http://localhost:5173`
- 首页网格仅显示 Core 10

- [ ] **Step 2: 生产构建（可选但推荐）**
Run:
```bash
npm run build
```

Expected:
- `dist/` 生成成功

