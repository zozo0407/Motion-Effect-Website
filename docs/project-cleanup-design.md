# 项目整理设计稿：Core 10 展厅 + UGC 创作 + Archive 迁出

## 背景与目标
当前仓库同时承载了主站、引擎、Demo 内容、创作工具链、历史试验与子项目，导致：
- demos 数量过多、入口不收口，难以维护与筛选
- 目录层级与用途混杂，阅读与修改成本高
- 构建产物复制范围过大，影响体积与心智模型

本设计稿目标是把项目整理成“清晰的主路径 + 可扩展的创作路径 + 可迁出的历史路径”：
- 首页默认只展示 Core 10 个官方展厅作品（稳定、可维护）
- 仍支持团队/用户在线创建更多作品（UGC），但与 Core 分离治理
- 历史试验与非核心子项目迁出到 Archive 仓库，主仓库瘦身

## 核心决策
### 首页默认视图
- 首页默认只展示 Core 10 个（不混入 User/Archive）
- User 作品入口通过独立按钮/Tab 进入（不干扰主展厅）

### Core demos（官方展厅）清单
Core 10 个最终选型（来自 `my-motion-portfolio/public/data/demos.json`）：
- 001：圣诞照片墙（demo4.html）
- 002：动能粒子（demo8.html）
- 003：姿态识别（demo5.html）
- 005：深度视差（demo9.html）
- 006：动态追踪（demo10.html）
- 007：植物手绘（demo11.html）
- 020：拼贴风景（demo20.html）
- 031：音频可视化（更酷版本 / demo_audio_anomaly.html）
- 030：赛博文字（demo_text_glitch.html）
- 027：流场粒子（demo_curl_noise.html）

### UGC（在线创作/保存/分享/导出）
UGC Phase 1 的详细说明见：
- docs/ugc-phase1.md

核心约束：
- “保存（Save）”以 JS/参数为真相源（可审计、可升级）
- “导出（Export）”生成独立 HTML 分发物（可移植、可单文件打开）
- Phase 1 写操作采用团队口令控制

### Archive（迁出主仓库）
主仓库不再承载以下内容的持续维护责任：
- video-intro（Remotion 子项目）
- 参考/、备份/、归档/（历史参考与备份）
- 非 Core 的 demos 与其资源（迁到 archive 仓库）

Archive 目标仓库建议命名：
- cupcut-website-archive

迁移执行以清单为准：
- docs/archive-manifest.md

## 数据与入口链路（整理后的形态）
### 入口数据源拆分
- Core 清单：新增只读文件（建议命名 `demos.core.json`），仅包含上述 10 条
- User 清单：API（Phase 1）提供（例如 `/api/user-demos`），用于创作中心展示

### 首页渲染逻辑
- 首页默认只读 Core 清单渲染网格
- 用户进入“创作中心/我的作品”后再加载 User 列表

### Lab/iframe 运行机制
- 继续沿用现有 iframe + postMessage 握手机制
- Demo 侧继续通过 UnifiedRenderer 上报 UI 配置与接收参数更新

## 目录用途地图（整理目标）
### Core（主站必需）
- index.html
- vite.config.js / package.json / netlify.toml
- my-motion-portfolio/public/js/UnifiedRenderer.js
- my-motion-portfolio/public/js/libs/three/*
- my-motion-portfolio/public/data/demos.core.json（新增）
- my-motion-portfolio/public/demos/（仅保留 Core 10 相关 demo）

### UGC（创作中心必需）
- 后端 API（Phase 1）：用于创建/保存/导出用户作品（与 Core 数据隔离存储）
- user content 存储目录（建议不放在 public 下；由服务端管理）

### 工具链（Creator）
- server.js、scripts/、prompts/、.temp_previews/
- 整理目标：归并到单一命名空间（例如 `tools/creator/`），避免与主站 Core/UGC 混放

### Archive（迁出）
- video-intro/
- 参考/（以及备份/归档等历史目录）
- 非 Core demos 与资源

## 构建与发布（整理后的策略）
### 现状问题
当前 build 会整包复制 `my-motion-portfolio/public`，导致非核心内容也进入产物。

### 目标
构建产物只包含：
- Core 10 所需 demo 与资源
- 运行时引擎与必要库

UGC 内容不随静态产物发布，走服务端 API/存储。

实现方式（当前版本）：
- `npm run build` 使用 `tools/build/copy-core-public.js` 按白名单复制 `my-motion-portfolio/public` 子集（包含 `sample/`）。

## 迁移步骤（建议执行顺序）
1. 生成 Core 清单（demos.core.json），首页默认只读该清单
2. 验证 Core 10 在首页与 Lab 中可正常打开运行
3. 将非 Core demos/资源迁移到 archive 仓库（保留可回溯历史）
4. 工具链收敛：将 server/scripts/prompts/temp 归并为 Creator 工具链目录
5. 收口构建复制范围：只复制 Core 相关子集
6. 启用创作中心的 User 列表（Phase 1），与 Core 分离展示

## 验收标准（Definition of Done）
- 打开仓库时，主路径清晰：Core 10 + 引擎/主站入口一眼可见
- 首页默认只展示 Core 10，点击后均可在 Lab 运行
- 非 Core demos 已迁出至 archive 仓库，主仓库体积与目录噪音显著降低
- UGC 创作中心可扩展，不会污染 Core 清单与主站结构
