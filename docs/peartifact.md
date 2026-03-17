# PEArtifact：最小 effect 导入/导出清单（JSON manifest）

## 现状：仓库里已有的 effect 导出点

- EffectRegistry 的 effect 数据模型与导出钩子：提供 sanitizeEffectStack / getExportConfig（见 [effectRegistry.js](file:///Users/bytedance/Downloads/cupcut-website/three.js规范/3d模板/3DTemplate_副本/public/js/effectRegistry.js#L184-L208)）
- 编辑器导出 scriptScene.js：把当前 this.effectStack 直接序列化进生成代码（见 [editor.js](file:///Users/bytedance/Downloads/cupcut-website/three.js规范/3d模板/3DTemplate_副本/public/js/editor.js#L3458-L3474)）

仓库内没有与之对称的“导入 effect stack / preset”的通用 manifest 与解析逻辑，因此补充 PEArtifact。

## 最小 Manifest 结构

```json
{
  "kind": "peartifact",
  "schemaVersion": 1,
  "id": "optional",
  "name": "optional",
  "createdAt": "2026-03-03T00:00:00.000Z",
  "meta": { "optional": true },
  "effects": [
    {
      "id": "LumiExposure",
      "version": 1,
      "enabled": true,
      "params": { "intensity": 0.2 },
      "keyframes": {
        "intensity": [
          { "time": 0, "value": 0, "easing": "Linear.None" },
          { "time": 1200, "value": 0.2, "easing": "Quadratic.Out" }
        ]
      },
      "export": { "id": "LumiExposure", "version": 1, "params": { "intensity": 0.2 } }
    }
  ]
}
```

- 根级别与 effect 级别都允许扩展字段（additionalProperties = true），用于前向兼容。
- effects[i].export 用于保留 EffectRegistry.exportHook 的“效果专用导出配置”（如果存在）。

对应 JSON Schema： [peartifact.schema.json](file:///Users/bytedance/Downloads/cupcut-website/three.js规范/3d模板/3DTemplate_副本/public/schemas/peartifact.schema.json)

## 使用方式（浏览器）

把脚本加入页面（需要先加载 EffectRegistry）：

```html
<script src="/three.js规范/3d模板/3DTemplate_副本/public/js/effectRegistry.js"></script>
<script src="/three.js规范/3d模板/3DTemplate_副本/public/js/peartifact.js"></script>
```

### 导出

```js
const registry = window.EffectRegistry;
const artifact = window.PEArtifact.exportFromEffectStack(editor.effectStack, registry, {
  name: 'My Preset',
  withCreatedAt: true
});
const json = window.PEArtifact.stringifyPEArtifact(artifact, { pretty: true });
```

### 导入

```js
const registry = window.EffectRegistry;
const artifact = window.PEArtifact.parsePEArtifact(jsonString);
const effectStack = window.PEArtifact.importToEffectStack(artifact, registry);

editor.effectStack = effectStack;
editor.applyEffectStack(editor.effectStack);
```

## 向后兼容（Legacy）

解析器会尽量把旧格式“自动转换”为 schemaVersion=1 的标准 manifest，再继续走校验与导入流程。支持的常见旧格式包括：

- 根级数组：`[ { id, ... }, ... ]`（视为 effects[]）
- 只有 effects 的对象：`{ effects: [...] }`（缺少 kind/schemaVersion 也会补齐）
- 带 objects/effects 的对象：`{ objects: [...], effects: [...] }`（会转换为 `sceneData.objects` + `effects`）
- 带 sceneData 的对象：`{ sceneData: { objects: [...], effects: [...] }, ... }`（会转换为 `sceneData.objects` + `effects`）

如果你希望在 UI/日志中展示“发生了哪些兼容转换”，可以使用兼容 helper：

```js
const { manifest, warnings, source } = window.PEArtifact.coerceToManifestV1(anyJsonValue);
if (warnings.length) console.warn('PEArtifact legacy warnings:', warnings, source);
```

## 文件位置

- 运行时实现： [peartifact.js](file:///Users/bytedance/Downloads/cupcut-website/three.js规范/3d模板/3DTemplate_副本/public/js/peartifact.js)
- TypeScript 类型声明： [peartifact.d.ts](file:///Users/bytedance/Downloads/cupcut-website/three.js规范/3d模板/3DTemplate_副本/public/js/peartifact.d.ts)
- JSON Schema： [peartifact.schema.json](file:///Users/bytedance/Downloads/cupcut-website/three.js规范/3d模板/3DTemplate_副本/public/schemas/peartifact.schema.json)
