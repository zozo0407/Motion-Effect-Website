# Creator 工具链（本地创作/管理）

Creator 是用于本地或小团队内测的创作与管理工具链，提供：
- Demo 列表读取/写入（用于工作室模式排序、创建）
- 预览路由（用于 AI 生成或临时代码的预览）

## 启动

```bash
npm run creator
```

启动后默认监听 `http://localhost:3000`。

## 常用接口

- `GET /api/demos`：读取 Demo 列表
- `POST /api/demos`：保存 Demo 列表（工作室模式排序会用到）
- `GET /preview/:id`：预览临时代码

## 快速生成预览（可选）

```bash
node scripts/quick-preview.js --prompt "你的效果描述"
```

如需保存为永久 Demo：

```bash
node scripts/quick-preview.js --prompt "你的效果描述" --save
```

## 兼容入口

根目录的 `server.js` 仍可直接运行，但推荐统一使用 `npm run creator` 作为启动方式。
