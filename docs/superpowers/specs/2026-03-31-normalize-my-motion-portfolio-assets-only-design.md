# 规范化目录：将 my-motion-portfolio 作为纯资源目录（assets-only）设计稿

## 背景

当前仓库同时存在：
- 根目录的 `src/`：主站逻辑（`src/main.js` + `src/site/*`）
- `my-motion-portfolio/src/`：一个独立 Vite 样板（`my-motion-portfolio/index.html` + `my-motion-portfolio/package.json`）

但主站运行时实际依赖的是：
- `my-motion-portfolio/public/**`（demos、data、UnifiedRenderer、three libs、sample 等静态资源）

因此 `my-motion-portfolio/src/` 与其配套的 Vite 工程文件会制造“两个 src”的认知噪音。

## 目标

把 `my-motion-portfolio/` 规范为**纯资源目录**：
- **只保留** `my-motion-portfolio/public/**`
- 删除 `my-motion-portfolio/src/` 与 `my-motion-portfolio/index.html/package.json/package-lock.json` 等样板文件
- 在文档中明确“主站入口在根目录，my-motion-portfolio 仅是资源包”

## 非目标

- 不迁移 `my-motion-portfolio/public/**` 的路径（避免引入大量路径改动）
- 不改变 demo 加载方式、数据清单格式、build 白名单复制策略

## 拟执行变更

### 删除（降低噪音）
- `my-motion-portfolio/src/`（整个目录）
- `my-motion-portfolio/index.html`
- `my-motion-portfolio/package.json`
- `my-motion-portfolio/package-lock.json`（如存在）

### 保留（运行时需要）
- `my-motion-portfolio/public/**` 全部保留

### 文档同步
- 更新根 `README.md` 与/或 `DEVELOPMENT.md` 中对 `my-motion-portfolio/` 的描述：
  - 标注其为“运行时资源目录（assets-only）”
  - 明确主站入口为根 `index.html` + `src/main.js`

## 校验与回滚

### 校验清单
- `npm run dev`：首页可正常打开，demo grid 可加载，Lab 可打开任一 demo
- `npm run build`：构建通过，`dist/my-motion-portfolio/public/**` 仍按白名单复制完成

### 回滚策略
- 若发现某处仍依赖 `my-motion-portfolio` 作为独立 Vite 子项目：
  - 恢复被删除的文件（可从 git 历史或 archive 中恢复）

## 风险点

- 低风险：目前代码未检索到对 `my-motion-portfolio/src` 的引用；主站入口与构建均只依赖 `my-motion-portfolio/public/**`。

