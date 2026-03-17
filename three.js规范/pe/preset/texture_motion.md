# 3 面片切换

遮罩 / 扫光 / 擦除 / 像素化 / 溶解，主要用于图A到图B的切换。

描述：通过遮罩或条带/页片/特效控制显隐边界，完成从部分展示到全显（或反向）的过渡。

## 3.1 遮罩

伪代码（threeJS + tween，遮罩揭露）：可以加上 线性/径向/纹理/条纹/噪声 等效果，方向一般有：左->右 上->下 左下角->右上角

```js
// 1) 遮罩揭露：material.uniforms.reveal={progress:[0..1], direction:vec2}
function revealMaskTween(material, toProgress = 1.0, durationMs = 900, easing = TWEEN.Easing.Sinusoidal.InOut, delayMs = 0) {
  const from = { p: material.uniforms.reveal.value.progress ?? 0 };
  return new TWEEN.Tween(from)
    .to({ p: toProgress }, durationMs)
    .easing(easing)
    .delay(delayMs)
    .onUpdate((u) => (material.uniforms.reveal.value.progress = u.p));
}
```

建议参数：

- direction：
  - (1, 0) 左→右；(-1, 0) 右→左；(0, 1) 下→上；(0, -1) 上→下
  - 对角线如 (1, 1)、(-1, 1) 等请归一化后使用（影响速度一致性）
- progress：
  - 取值 [0, 1]；0 为全遮挡，1 为全显
  - 动画时长建议 0.6~1.2s；需要入场+出场可用 yoyo 或反向补间
- 软边/羽化（若 shader 支持 feather 或 edgeWidth）：
  - 取值 0~0.2（相对屏幕/UV 尺度）；常用 0.02~0.08，避免硬切边
- 偏移 offset（若支持）：
  - 取值 -1~1；用于改变起始位置（例如从画面中线或任意线开始揭露）
- 噪声/抖动（若支持 noiseScale 或 noiseAmount）：
  - 取值 0~1；常用 0.2~0.6，用于制造粗糙或颗粒化边缘
- 重复条带（若支持 repeat 或 stripes）：
  - 取值 1~3；配合 direction 可实现百叶/条带式揭露
- 缓动：
  - 推荐 TWEEN.Easing.Sinusoidal.InOut；强调速度感可用 Cubic/Expo 系列
  - 需要“扫光尾韵”可在后段使用 easeOut 并延时叠加高光层
- 组合建议：
  - 与翻页/聚合类动画组合时，先 reveal 再叠加高光 roll，避免高光提前泄露
  - 与相机 whip pan 同步可强调转场方向性，注意时长对齐

## 3.2 擦除

描述：沿某方向移动的“擦除线”带来显隐切换，常用于推入/推出转场。擦除可视为“线性遮罩”的特化版本。方向一般有：左->右 上->下 左下角->右上角

伪代码（threeJS + tween，基于 wipe uniforms）：

```js
// material.uniforms.wipe={ pos:[0..1], dir:vec2, softness }
function wipeTween(material, toPos = 1.0, durationMs = 900, easing = TWEEN.Easing.Cubic.InOut, delayMs = 0) {
  const st = { p: material.uniforms.wipe.value.pos ?? 0 };
  return new TWEEN.Tween(st)
    .to({ p: toPos }, durationMs)
    .easing(easing)
    .delay(delayMs)
    .onUpdate((u) => (material.uniforms.wipe.value.pos = u.p));
}
```

参数建议：

- 软化：softness 0.0~0.2 控制边缘羽化
- 方向：dir 取单位向量控制擦除方向

## 3.3 扫光

描述：一道“高亮条”沿表面滑过，增强材质质感或作为过渡提示。

伪代码（threeJS + tween，基于 glint uniforms）：

```js
// material.uniforms.glintPos: [0..1] 扫光位置；glintWidth/strength 可预设
function glintTween(material, toPos = 1.0, durationMs = 1200, easing = TWEEN.Easing.Sinusoidal.InOut, delayMs = 0) {
  const st = { x: material.uniforms.glintPos.value ?? 0 };
  return new TWEEN.Tween(st)
    .to({ x: toPos }, durationMs)
    .easing(easing)
    .delay(delayMs)
    .onUpdate((u) => (material.uniforms.glintPos.value = u.x));
}
```

参数建议：

- 宽度：glintWidth 0.05~0.2；强度：glintStrength 0.5~1.2
- 路径：可改为沿 UV V 方向或自定义路径移动

## 3.4 像素化

描述：通过动态改变像素单元尺寸来“像素化/去像素化”图像，常与溶解/遮罩组合。纹理在开始阶段是图A，此时是去像素化的，然后通过 像素化 渐变为图B，然后在通过去像素化变为图B原图。 

伪代码（threeJS + tween，基于 pixelSize uniform）：

```js
// material.uniforms.pixelSize: 像素单元大小（像素化强度）
function pixelateTween(material, toSize = 1.0, durationMs = 800, easing = TWEEN.Easing.Sinusoidal.InOut, delayMs = 0) {
  const st = { s: material.uniforms.pixelSize.value ?? 0 };
  return new TWEEN.Tween(st)
    .to({ s: toSize }, durationMs)
    .easing(easing)
    .delay(delayMs)
    .onUpdate((u) => (material.uniforms.pixelSize.value = u.s));
}
```

参数建议：

- 范围：toSize 由 shader 实现决定；常用 0（清晰）到 8/16（重像素化）然后在到0（清晰）
- 纹理在开始阶段是图A，此时是去像素化的，然后通过 像素化 渐变为图B，然后在通过去像素化变为图B原图。 

## 3.5 溶解/噪声/裁剪

通过 UV 变换控制贴图运动；配合噪声阈值可实现溶解类显隐。

伪代码（threeJS + tween）：

```js
// 2) 溶解阈值（噪声裁剪）
function dissolveTween(material, toThreshold = 1.0, durationMs = 900, easing = TWEEN.Easing.Cubic.InOut, delayMs = 0) {
  const from = { t: material.uniforms.dissolveThreshold.value ?? 0 };
  return new TWEEN.Tween(from)
    .to({ t: toThreshold }, durationMs)
    .easing(easing)
    .delay(delayMs)
    .onUpdate((u) => (material.uniforms.dissolveThreshold.value = u.t));
}
```