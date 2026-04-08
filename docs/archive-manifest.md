# Archive 迁移清单（Keep / Move / Verify）

本清单用于把“非 Core 内容”迁移到独立仓库 `cupcut-website-archive`，从而显著减少主仓库文件数量与目录噪音。

迁移原则：
- 以 Core 10（官方展厅）为主路径，主仓库必须保持可独立运行与可维护
- Creator 工具链可保留在主仓库，但入口统一为 `tools/creator/`
- 所有“非 Core demo 内容/历史试验/子项目”进入 archive 仓库

## Keep（主仓库保留）

### 入口与构建
- `index.html`
- `package.json`
- `vite.config.js`
- `netlify.toml`
- `DEVELOPMENT.md`

### Core 数据源
- `my-motion-portfolio/public/data/demos.core.json`

### Core 10 demo HTML（官方展厅）
- `my-motion-portfolio/public/demos/demo4.html`（圣诞照片墙）
- `my-motion-portfolio/public/demos/demo8.html`（动能粒子）
- `my-motion-portfolio/public/demos/demo5.html`（姿态识别）
- `my-motion-portfolio/public/demos/demo9.html`（深度视差）
- `my-motion-portfolio/public/demos/demo10.html`（动态追踪）
- `my-motion-portfolio/public/demos/demo11.html`（植物手绘）
- `my-motion-portfolio/public/demos/demo20.html`（拼贴风景）
- `my-motion-portfolio/public/demos/demo_audio_anomaly.html`（音频可视化）
- `my-motion-portfolio/public/demos/demo_text_glitch.html`（赛博文字）
- `my-motion-portfolio/public/demos/demo_curl_noise.html`（流场粒子）

### 运行时引擎与依赖
- `my-motion-portfolio/public/js/UnifiedRenderer.js`
- `my-motion-portfolio/public/js/libs/three/`（以及 `three/addons` 相关路径）
- `my-motion-portfolio/public/js/vfx/`
- `my-motion-portfolio/public/js/engine/`
- `my-motion-portfolio/public/js/modules/`

### Creator 工具链入口
- `tools/creator/`（文档与启动器）
- `server.js`（兼容入口，短期保留）
- `scripts/`（Creator 辅助脚本）
- `prompts/`（Creator 读取的提示词资产）

### 允许继续保留但后续可再瘦身
- `my-motion-portfolio/public/data/demos.json`（全量清单：工作室模式/本地管理工具链使用）

## Move（迁出到 archive 仓库）

### 顶层目录（独立或历史包袱）
- `video-intro/`（Remotion 子项目）
- `参考/`（历史参考目录）
- 其他历史目录（如存在）：`备份/`、`归档/`

迁移执行建议：
- 先在主仓库运行一次 dry-run：`npm run archive:move-top -- --dry-run`
- 确认输出无误后执行真实迁移：`npm run archive:move-top`
- 默认迁移目标目录为主仓库同级的 `../cupcut-website-archive`，可通过 `--dest` 指定：`npm run archive:move-top -- --dest ../your-archive-dir`

### demos.json 中非 Core 的 Demo 条目（建议整体迁出）
以下条目不在 `demos.core.json` 内，建议作为“非核心内容”迁出：
- `my-motion-portfolio/public/demos/demo14.html`（文字烟花，id: 008）
- `my-motion-portfolio/public/demos/demo7.html`（赛博人脸，id: 010）
- `my-motion-portfolio/public/demos/demo17.html`（绝美海景，id: 017）
- `my-motion-portfolio/public/demos/demo18.html`（星际穿越，id: 018）
- `my-motion-portfolio/public/demos/demo21.html`（手势网格，id: 021）
- `my-motion-portfolio/public/demos/template_demo.html`（引擎模版(3D)，id: T01）
- `my-motion-portfolio/public/demos/template_demo_p5.html`（引擎模版(p5)，id: T02）
- `my-motion-portfolio/public/demos/demo_bloom.html`（辉光组件，id: T03）
- `my-motion-portfolio/public/demos/demo_vibe.html`（Vibe Coding，id: T04）
- `my-motion-portfolio/public/demos/demo_fluid.html`（流体模拟，id: T05）
- `my-motion-portfolio/public/demos/demo_audio.html`（音频可视化(旧)，id: T06）
- `my-motion-portfolio/public/demos/demo_splat.html`（3D高斯泼溅，id: T07）
- `my-motion-portfolio/public/demos/demo_particle_standard.html`（标准粒子，id: T08）
- `my-motion-portfolio/public/demos/demo_liquid_orb.html`（液态光球，id: 028）
- `my-motion-portfolio/public/demos/demo_audio_sphere.html`（音频光球，id: 029）

说明：
- 上述列表来自 `my-motion-portfolio/public/data/demos.json` 的差集（Core 10 之外的条目）。
- demos 目录中可能还存在未登记在 demos.json 的 HTML 文件，需要在迁移执行时补充一次清点：除 Core 10 外，默认都进入 archive，除非明确被 Creator 或主站引用。

迁移执行建议：
- 先在主仓库运行一次 dry-run：`npm run archive:move-demos -- --dry-run`
- 确认输出无误后执行真实迁移：`npm run archive:move-demos`
- 默认迁移目标目录为主仓库同级的 `../cupcut-website-archive`，可通过 `--dest` 指定：`npm run archive:move-demos -- --dest ../your-archive-dir`
 
说明（子文件夹）：
- `my-motion-portfolio/public/demos/` 下的子文件夹也会一起迁出（除非你手动把它们加入脚本的保留列表）。

## Verify（迁移后验证清单）

迁移完成后，在主仓库进行以下验证：
- 首页只展示 10 个 Core demo（不多不少）
- 逐个点击 Core demo，Lab iframe 均能正常打开
- 切换“工作室模式”仍能加载全量列表（如保留 demos.json 与 /api/demos 逻辑）
- `npm run creator` 能启动本地 Creator，且 `GET /api/demos` 可访问（用于后续 UGC/管理）

## 回滚与验收策略

### 回滚策略
- 迁移到 archive 仓库后，主仓库不再依赖被迁出文件；如发现误迁，可从 archive 仓库按路径拷回并重新加入主仓库（优先恢复到迁移前的原路径以避免引用路径变化）。
- 任何“路径级别调整”（例如移动 demo HTML、重命名目录）都应拆成小批次迁移，每批次迁移后立刻跑完本清单的 Verify 项。

### 验收策略（每批次迁移都要满足）
- Core 10 清单文件可读取（`demos.core.json` 解析无误）
- 首页网格为 10，且每个 Core demo 可打开
- Creator 工具链仍可启动（至少能访问 `/api/demos`）

## 临时执行方案（在迁出前先“变清爽”）

如果暂时不方便立刻创建 archive 仓库或批量移动文件，可以先使用以下临时策略：
- 将 `video-intro/`、`参考/` 等归档目录从编辑器文件树与搜索中隐藏：`.vscode/settings.json`
- 仍保留完整文件以便后续迁出或回滚
