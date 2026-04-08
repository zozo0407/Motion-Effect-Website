# README 更新：新模块结构与职责简介 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 按“方案 1”更新根 `README.md`，补充/替换目录结构说明，使其与当前 `src/main.js + src/site/*` 模块化结构一致，避免误导。

**Architecture:** 仅修改文档：新增“模块地图”小节，并替换原“目录结构”树与关键说明；不改代码逻辑。

**Tech Stack:** Markdown

---

### Task 1: 更新 README 的模块地图与目录结构

**Files:**
- Modify: `/Users/bytedance/Downloads/cupcut-website/README.md`

- [ ] **Step 1: 增加“模块结构与职责”小节**
在 README 的“目录结构”之前插入一个简短模块地图，覆盖：
- `src/main.js`（装配层：import/init/window 绑定）
- `src/site/*`（hero/lab/boot/demos/templates/ui/ai-chat/wizard）
- `my-motion-portfolio/public/*`（demos/data/js/sample）
- `tools/*`（creator/build/archive）

- [ ] **Step 2: 替换 README 原“目录结构”树与描述**
将旧树（包含“index.html 包含大量逻辑”“video-intro”等）替换为当前真实目录树与说明（index.html + src/* + tools/*）。

- [ ] **Step 3: 自检**
检查 README 内容与当前仓库实际目录一致，避免出现不存在路径或过期描述。

