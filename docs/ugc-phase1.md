# Phase 1：小团队在线创建/保存/分享 Demo（UGC）设计说明

## 背景
当前项目存在两类需求同时成立：
- 官方展厅需要收口为少量高质量的 Core demos（例如 10 个），以降低维护成本并提升整体一致性。
- 仍需要支持用户（先是你的小团队，后续扩展到大量用户）在线创建更多作品，并能够保存、分享、导出。

因此需要把“官方 Core”与“用户作品 UGC”做成双轨：同一套运行时（iframe + UnifiedRenderer），两条数据与治理路径。

## Phase 1 的定位
Phase 1 指的是“你/几个人的小团队先用起来”的最小可用版本（MVP）：
- 目标是跑通完整闭环：创建 → 在线编辑预览 → 保存 → 分享链接 → 导出 HTML
- 权限采用团队口令（passcode）实现最小访问控制
- 存储可以先使用文件/JSON（低成本），但要与 Core 数据隔离，方便 Phase 2 升级到数据库/对象存储

## 目标（Goals）
- 允许团队成员在线创建新作品，不影响 Core 10 个的稳定性
- 用户作品以“源码”为主（JS/参数）保存，保证后续可升级、可审计
- 同时支持导出“可独立打开预览”的 HTML 分发物
- 主页/网格能展示 User Gallery（可独立区域或 Tab），并可生成可分享的 URL

## 非目标（Non-goals）
- 不做面向公网的大规模账号体系、配额、审核、风控
- 不支持任意用户上传整页 HTML 并直接作为线上运行源（安全与治理成本过高）

## 核心概念
### Core demos（官方展厅）
- 由项目仓库维护的精选作品集合（约 10 个）
- 数据来源建议为独立的只读清单（例如 `demos.core.json`）
- 视为产品“承诺稳定”的部分

### User demos（用户作品 / UGC）
- 可写内容集合，数量不设上限
- 数据来源为 API（Phase 1 由 Node/Express 提供）
- 以“源码（JS/参数）”为真相源，HTML 仅作为导出分发物生成

## 闭环流程（User Journey）
1. 用户点击“创建作品”
2. 系统生成一个新的作品草稿（draft），打开编辑/预览（iframe + UnifiedRenderer）
3. 用户调整参数/代码，实时预览
4. 用户点击“保存”
5. 系统生成一个可分享的作品链接（作品详情页或 demo 路径）
6. 用户可点击“导出 HTML”，得到一个可独立打开预览的 HTML 文件

## 数据与接口（建议形状）
### 数据模型（Phase 1）
- `UserDemo`
  - `id`：唯一 ID
  - `title` / `tech` / `tags`：元信息
  - `createdAt` / `updatedAt`
  - `sourceType`：`engine-effect`（默认）
  - `source`：JS 源码（EngineEffect ESM）或结构化配置
  - `uiConfig`：可选，便于默认参数与控件定义
  - `visibility`：`team`（Phase 1 默认）
  - `export`：可选导出信息（最近一次导出时间、导出文件名等）

### API（Phase 1）
- `GET /api/user-demos`：返回用户作品列表（分页可后置）
- `POST /api/user-demos`：创建草稿作品（需要口令）
- `GET /api/user-demos/:id`：获取作品详情与源码
- `PUT /api/user-demos/:id`：保存作品（需要口令）
- `POST /api/user-demos/:id/export`：生成导出 HTML（需要口令）

## 安全与权限（Phase 1）
- 团队口令（passcode）用于所有“写操作”：创建/保存/导出
- 读操作可按需要：
  - 内测期：读也需要口令（更安全）
  - 展示期：读开放，写需要口令（更易传播）

## 与现有系统的兼容点
- 运行时继续使用现有 iframe + postMessage 握手与 UI 参数更新机制
- 作品导出 HTML 应通过统一模板生成（把 JS/参数嵌入模板），而不是存储用户提交的任意 HTML
- Core 与 User 的数据源分离，避免“用户作品把 demos.json 越写越乱”

## Phase 2（未来升级方向，供研发扩容）
- 存储：JSON 文件 → 数据库（Postgres/SQLite）+ 对象存储（S3/OSS）
- 权限：口令 → 账号体系（OAuth/Email/企业登录）+ 角色/配额
- 安全：审核、沙箱、资源隔离、限流、日志与审计

