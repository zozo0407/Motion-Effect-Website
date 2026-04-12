# 项目总览 / AI Context

> 这份文档给新开的 AI 窗口快速建立上下文，不承担任务看板职责。

## 1. 项目定位与目标

- 这是一个面向影像动态特效创作的 Web 工作台，核心闭环是 `Web 端实时预览 + AI 生成 + 单文件导出`。
- 项目目标不是做静态展示站，而是让用户可以浏览 Demo、进入 Lab 预览、通过 Wizard 或 AI Chat 生成和修改效果，并把结果带入后续工作流。
- 整体方向是用统一运行时、稳定生成链路和参数协议，持续承接更多特效模板与自动化创作能力。

## 2. 当前状态

- 项目不是空白状态，主站、Lab、统一渲染运行时、AI 生成链路和 Creator 工具链都已存在。
- 仓库内已经形成 `Phase 1` 工作台形态，以及 `Phase 2` 相关的 VFX 引擎升级、后端解耦和配套文档。
- 当前工作更偏向在现有分层上继续收口，而不是重做整体架构。

## 3. 系统全景

- **前端主站**：`index.html` 加载 `src/main.js`，业务逻辑主要位于 `src/site/*`，包括 Hero、Demo Grid、Lab、Wizard、AI Chat。
- **运行时与 Demo**：`my-motion-portfolio/public/*` 存放 Demo、数据清单、`UnifiedRenderer.js` 和运行时静态资源。
- **后端服务**：当前真实入口是 `server/index.js`；根目录 `server.js` 仅保留兼容入口，不应再当作主组装层理解。
- **工具链**：`tools/creator/*` 负责本地创作、预览和管理；`tools/build/*` 负责构建后的核心资源整理。

## 4. 新 AI 从哪里开始理解

- 先读 [README.md](file:///Users/bytedance/Downloads/cupcut-website/README.md) 了解整体定位、目录结构和主站模块划分。
- 再读 [DEVELOPMENT.md](file:///Users/bytedance/Downloads/cupcut-website/DEVELOPMENT.md) 了解高频入口、运行约定和应忽略的历史目录。
- 任务涉及主站交互时，优先看 [main.js](file:///Users/bytedance/Downloads/cupcut-website/src/main.js) 和 `src/site/*`。
- 任务涉及预览或 Demo 运行时，优先看 [UnifiedRenderer.js](file:///Users/bytedance/Downloads/cupcut-website/my-motion-portfolio/public/js/UnifiedRenderer.js) 和 `my-motion-portfolio/public/*`。
- 任务涉及 API、生成链路或预览服务，优先看 [index.js](file:///Users/bytedance/Downloads/cupcut-website/server/index.js) 和 `tools/creator/*`。
- 开工前默认先找当前任务对应的 plan 或 design，不要脱离现有文档重设计一套架构。

## 5. 运行方式

- 安装依赖：`npm install`
- 主站开发：`npm run dev`
- Creator / 本地 API / 预览服务：`npm run creator`，默认监听 `http://localhost:3000`
- 后端启动：`npm start`，实际启动 `server/index.js`
- 构建：`npm run build`
- 快速生成预览：`node scripts/quick-preview.js --prompt "你的效果描述"`，需要持久化时追加 `--save`

## 6. 已完成与待完成

- **已完成**：主站已完成模块化拆分；Lab 已形成工作台形态；`UnifiedRenderer` 与后端服务都已完成一轮结构升级；AI 生成链路、Creator 工具链、预览路由和构建脚本已经存在，项目具备基本的本地创作与验证闭环。
- **待完成**：AI 导演台相关专项仍需继续收口；smoke checklist、关键回归路径和阶段完成说明仍需固化；运行方式、环境变量说明、数据契约与 Wizard UI 映射还需要进一步统一。

## 7. 风险与注意事项

- 浏览器级完整预览仍需重点关注；仓库文档与代码上下文中可见对 `Error creating WebGL context` 的持续处理，这会直接影响预览链路判断。
- AI 生成虽然已有 fallback，但回退分级、错误码和前后端统一信号还没有彻底收口。
- 文档和代码里仍有少量旧入口认知残留，看到 `server.js` 时要先确认它是不是兼容壳。
- 任务默认应复用现有分层：`src/site/*`、`my-motion-portfolio/public/*`、`server/*`、`tools/creator/*`，不要把逻辑重新揉回单文件。
- 阅读代码时默认跳过 `备份/`、`参考/`、`归档/`、`video-intro/` 等历史目录，避免被旧内容干扰。

## 8. 相关文档

- **必读**： [README.md](file:///Users/bytedance/Downloads/cupcut-website/README.md)、[DEVELOPMENT.md](file:///Users/bytedance/Downloads/cupcut-website/DEVELOPMENT.md)、[2026-04-02-platform-blueprint-design.md](file:///Users/bytedance/Downloads/cupcut-website/docs/superpowers/specs/2026-04-02-platform-blueprint-design.md)
- **按任务查看**：AI 导演台相关任务看 [2026-04-03-ai-director-console.md](file:///Users/bytedance/Downloads/cupcut-website/docs/superpowers/plans/2026-04-03-ai-director-console.md)；生成链路相关任务看 [2026-04-10-v2-wrapped-parts.md](file:///Users/bytedance/Downloads/cupcut-website/docs/superpowers/plans/2026-04-10-v2-wrapped-parts.md)；VFX 引擎和后端重构相关任务看 [2026-04-12-phase2-vfx-engine-upgrade.md](file:///Users/bytedance/Downloads/cupcut-website/docs/superpowers/plans/2026-04-12-phase2-vfx-engine-upgrade.md)；入口拆分相关任务看 [2026-03-30-split-mainjs.md](file:///Users/bytedance/Downloads/cupcut-website/docs/superpowers/plans/2026-03-30-split-mainjs.md)
