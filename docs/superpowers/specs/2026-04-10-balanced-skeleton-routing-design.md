# AI 创作半骨架路由设计（Balanced Skeleton Routing）

## 目标

在不牺牲太多创作自由度的前提下，显著提升 `/api/generate-effect-v2` 的生成成功率、首屏可见率和平均响应稳定性。

本设计采用“半骨架模式”：

- 常见高频题材优先命中稳定骨架
- 骨架只负责结构保底，不负责固定视觉
- 用户 prompt 中的风格词、颜色词、运动词、质感词继续驱动参数变化
- 未命中的长尾题材仍走现有 AI 代码生成链路

## 现状问题

当前 AI 创作的问题已经收敛为三类：

- 高频题材虽然常见，但仍让模型从零生成整套结构，导致运行时错误频发
- 中等复杂 prompt 容易出现代码截断、辅助方法错误使用 `ctx`、生命周期不合规等问题
- 即使启用了 provider fallback、repair 和语法校验，整体链路仍然可能过长，导致单次生成超过用户可接受等待时间

其中最典型的失败题材包括：

- 数字雨 / 数据流
- 粒子漩涡 / 星尘
- 线框几何体 / 旋转立方体
- 玻璃 / 水晶几何体
- 液态金属球

这些题材具备明显共性，适合用稳定结构承载，再用参数保留自由度。

## 范围

本设计覆盖：

- `tools/creator/skeleton-router.cjs` 的题材识别扩展
- `tools/creator/skeletons/` 下新增骨架生成器
- `server.js` 中 `/api/generate-effect-v2` 的“常见题材优先骨架”分流
- 轻量 prompt 参数提取规则
- 对应的只读/字符串级测试与真实接口回归

本设计不覆盖：

- 前端 UI 交互重构
- blueprint 阶段恢复
- AI Chat 对骨架参数的二次编辑增强
- 新的三维后处理框架

## 核心策略

### 1. 路由分层

`/api/generate-effect-v2` 的处理顺序改为：

1. 接收 prompt
2. 先尝试命中“常见题材骨架路由”
3. 如果命中，直接生成稳定骨架代码，并根据 prompt 注入风格参数
4. 如果未命中，再走现有：
   - provider fallback
   - 两阶段生成
   - auto-fix
   - validate
   - repair

这意味着：

- 高频题材走“结构确定、风格可变”
- 长尾题材仍保留 AI 自由生成

### 2. 半骨架，不是死模板

每个骨架只固定：

- scene/camera/renderer 创建方式
- geometry / material / update 的基本组织结构
- 生命周期方法与 EngineEffect 合约
- resize / destroy / UI 参数联动的基本模式

每个骨架仍允许通过 prompt 变化：

- 主色 / 辅色
- 发光强度
- 运动速度
- 密度
- 透明度 / 粗糙度 / 金属感
- 雾感 / 背景明暗
- 脉冲强度 / 流动感 / 相机距离

## 第一批骨架集合

第一批只做 5 类，覆盖当前高频失败题材。

### `particles-vortex`

覆盖：

- 粒子漩涡
- 星尘
- 能量旋涡
- 火花场

保底结构：

- `THREE.Points`
- `BufferGeometry`
- 粒子围绕中心旋转 / 呼吸 / 脉冲

可变参数：

- `primaryColor`
- `secondaryColor`
- `density`
- `speed`
- `glowIntensity`
- `pulseStrength`
- `fogStrength`

### `wireframe-geo`

覆盖：

- 线框立方体
- 旋转几何体
- 莫比乌斯 / TorusKnot 风格基础变体

保底结构：

- 几何体 + `EdgesGeometry` / wireframe material
- 稳定旋转与缩放脉冲

可变参数：

- `primaryColor`
- `speed`
- `scale`
- `glowIntensity`
- `rotationStyle`

### `digital-rain`

覆盖：

- 数字雨
- 数据流
- hacker / matrix 风

保底结构：

- 2D canvas texture 或 instanced plane 列阵
- 自上而下的列式下落动画

可变参数：

- `primaryColor`
- `secondaryColor`
- `density`
- `speed`
- `trailStrength`
- `glowIntensity`

### `glass-geo`

覆盖：

- 玻璃球
- 玻璃二十面体
- 水晶几何体

保底结构：

- 简化透明材质几何体
- 内部点光源 / 边缘高光 / 稳定自转

可变参数：

- `primaryColor`
- `secondaryColor`
- `transparency`
- `roughness`
- `metalness`
- `glowIntensity`

### `liquid-metal`

覆盖：

- 液态金属球
- 金属波纹球
- 反光流体感球体

保底结构：

- 球体为主体
- 顶点轻微扰动 / 法线伪流动 / 镜面高光

可变参数：

- `primaryColor`
- `metalness`
- `roughness`
- `flowIntensity`
- `speed`
- `highlightStrength`

## Prompt 参数提取策略

不再为骨架题材额外调用大模型，只做轻量规则提取。

### 1. 颜色词

从 prompt 中提取：

- 明确 hex 色值：如 `#ff00ff`
- 常见中文颜色词：红、绿、蓝、紫、金、银、白、黑、青、洋红、粉
- 常见英文颜色词：red、green、blue、purple、gold、silver、cyan、magenta

输出：

- `primaryColor`
- 如命中“双色/渐变/蓝紫/青粉”等组合，再给 `secondaryColor`

### 2. 动态词

从 prompt 中提取：

- 缓慢 / 慢 / 匀速
- 快速 / 高速 / 激烈
- 脉冲 / 呼吸 / 起伏 / 波纹 / 旋转 / 下落 / 流动

映射：

- `speed`
- `pulseStrength`
- `flowIntensity`
- `rotationStyle`

### 3. 质感词

从 prompt 中提取：

- 玻璃 / 透明 / 水晶
- 金属 / 液态金属 / 高光 / 镜面
- 雾感 / 柔和 / 发光 / 霓虹

映射：

- `transparency`
- `roughness`
- `metalness`
- `glowIntensity`
- `fogStrength`

### 4. 密度词

从 prompt 中提取：

- 稀疏 / 少量 / 极简
- 密集 / 成千上万 / 高密度

映射：

- `density`

## 路由策略

### 推荐行为

`routePromptToSkeleton(prompt)` 返回：

```js
{
  matched: true,
  kind: 'particles-vortex',
  params: { ... },
  confidence: 0.92
}
```

或：

```js
{
  matched: false
}
```

### 命中规则

优先使用关键词匹配 + 少量同义词归并。

例如：

- `粒子` / `星尘` / `漩涡` / `火花` -> `particles-vortex`
- `线框` / `立方体` / `几何体` -> `wireframe-geo`
- `数字雨` / `数据流` / `矩阵` -> `digital-rain`
- `玻璃` / `水晶` / `透明` + `球/几何体` -> `glass-geo`
- `液态金属` / `金属球` / `流体金属` -> `liquid-metal`

### 冲突处理

若命中多个骨架：

- 选更具体的题材词优先
- 如仍冲突，按优先级：
  - `digital-rain`
  - `glass-geo`
  - `liquid-metal`
  - `wireframe-geo`
  - `particles-vortex`

## 服务端接入点

接入位置：

- [server.js](file:///Users/bytedance/Downloads/cupcut-website/server.js) 的 `/api/generate-effect-v2`

新逻辑应放在 AI 生成之前：

1. 读取 prompt
2. 调 `routePromptToSkeleton(prompt)`
3. 若命中：
   - 调对应骨架 builder
   - 返回 `{ code }`
4. 若未命中：
   - 继续走现有 AI 生成链路

这样前端 [wizard.js](file:///Users/bytedance/Downloads/cupcut-website/src/site/wizard.js) 完全不需要知道是骨架生成还是 AI 生成，继续只消费 `{ code }`。

## 文件修改清单

预计修改：

- `tools/creator/skeleton-router.cjs`
- `tools/creator/skeletons/glow-sphere.cjs`（可能抽公共参数模式）
- `tools/creator/skeletons/particles.cjs`（可能适配 vortex 参数）
- `server.js`

预计新增：

- `tools/creator/skeletons/wireframe-geo.cjs`
- `tools/creator/skeletons/digital-rain.cjs`
- `tools/creator/skeletons/glass-geo.cjs`
- `tools/creator/skeletons/liquid-metal.cjs`
- 对应测试文件

## 验证策略

### 自动验证

需要新增/更新测试，至少覆盖：

- 路由能正确命中 5 类常见题材
- 参数提取能识别颜色 / 快慢 / 密度 / 发光等基本词
- `/api/generate-effect-v2` 命中骨架时不进入 LLM 生成主链
- 返回的 code 仍满足 EngineEffect 合约关键结构

### 人工验证

建议用以下 prompt 回归：

- `绿色霓虹线框立方体，缓慢旋转，黑色背景。`
- `紫色发光粒子漩涡，中心脉冲，带轻微雾感。`
- `红色的数字雨数据流，从上往下掉落，赛博朋克风。`
- `透明玻璃质感的二十面体，内部蓝色点光源，缓慢旋转。`
- `金色液态金属球，表面水波纹起伏，高光反射。`

期望：

- 这 5 类都直接命中骨架
- 生成时间明显缩短
- 页面不再出现此前的高频结构性错误

## 风险与缓解

### 风险 1：效果趋同

缓解：

- 每个骨架保留足够参数面
- prompt 继续驱动颜色、速度、雾感、密度、质感变化
- 长尾题材仍走 AI 生成

### 风险 2：关键词路由误判

缓解：

- 第一版只覆盖非常高频、语义明显的题材
- 冲突时按具体词优先
- 未命中宁可回退 AI，也不乱命中

### 风险 3：骨架数量失控

缓解：

- 第一版只做 5 类
- 新骨架必须对应高频失败题材，不能为了“丰富”而泛滥增加

### 风险 4：参数抽取过弱导致视觉差异不明显

缓解：

- 先支持颜色、速度、密度、发光、雾感这些最有感知差异的参数
- 后续再逐步扩展更细参数

## 验收标准

实现完成后，以下条件同时满足才算通过：

- 5 类目标题材能稳定命中骨架
- 5 次真实生成测试中，这些题材不再出现此前高频的结构性报错
- 同类 prompt 的平均耗时明显低于当前纯 AI 生成链路
- 返回代码仍满足 EngineEffect 合约要求
- 未命中的 prompt 仍然保留原始 AI 创作能力
