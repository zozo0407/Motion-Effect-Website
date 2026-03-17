# 1 渲染对象运动

## 1.1 基础变换

### 1.1.1 旋转（Rotate）

描述：物体围绕某个轴（X/Y/Z）进行旋转，常用于翻转、展示、转台等；默认以几何中心为锚点。

- 可选轴：X / Y / Z（默认绕自身局部轴、以几何中心为锚点），也可以选其他的坐标轴

伪代码：

```js

// 沿单轴的绝对角度旋转（简单版，使用 Euler）
function rotateAxisTo(node, {
  axis = 'y',            // 'x' | 'y' | 'z'
  endDeg = 90,
  durationMs = 800,
  easing = TWEEN.Easing.Cubic.InOut,
  delayMs = 0,
} = {}) {
  const startDeg = THREE.MathUtils.radToDeg(node.rotation[axis]);
  const v = { a: startDeg };
  new TWEEN.Tween(v)
    .to({ a: endDeg }, durationMs)
    .easing(easing)
    .delay(delayMs)
    .onUpdate(() => { node.rotation[axis] = THREE.MathUtils.degToRad(v.a); })
    .start();
}

// 绕任意点旋转：配合 1.1.2 setPivotViaParentTween 使用
// setPivotViaParentTween(node, pivotWorld, { rotateAxis: 'y', rotateDeg: 90, ... });
```

参数意见：

- 轴选择：绕 y 轴最常用（转台/翻页），x 轴用于俯仰，z 轴用于平面内旋转
- 幅度：轻微 15~45°，强调 60~120°，翻转 180°，整圈 360° 可配匀速
- 时长与缓动：0.4~1.2s；推荐 easeInOutCubic；活泼可用 Back.Out/Back.InOut
- 锚点：默认几何中心；翻页/开合门建议绕边缘/铰链点，参见 1.1.3

### 1.1.2 锚点切换（Pivot / Anchor）

描述：

- 在目标锚点位置创建父级 Group 并将节点 attach 到该 Group，对父级做补间，实现绕任意点的旋转/缩放/平移。

伪代码（threeJS + tween）：

```js
function setPivotViaParentTween(node, pivotWorld, {
  rotateAxis = 'y',        // 'x' | 'y' | 'z'
  rotateDeg = 0,
  scaleTo = null,          // THREE.Vector3 或 null
  moveToWorld = null,      // THREE.Vector3 或 null
  durationMs = 800,
  easing = TWEEN.Easing.Sinusoidal.InOut,
  delayMs = 0,
} = {}) {
  const prevParent = node.parent;
  const pivotLocal = prevParent.worldToLocal(pivotWorld.clone());
  const pivotGroup = new THREE.Group();
  pivotGroup.position.copy(pivotLocal);
  prevParent.add(pivotGroup);
  pivotGroup.attach(node);

  if (rotateDeg !== 0) {
    const state = { a: 0 };
    new TWEEN.Tween(state)
      .to({ a: THREE.MathUtils.degToRad(rotateDeg) }, durationMs)
      .easing(easing)
      .delay(delayMs)
      .onUpdate(() => {
        if (rotateAxis === 'x') pivotGroup.rotation.x = state.a;
        else if (rotateAxis === 'y') pivotGroup.rotation.y = state.a;
        else pivotGroup.rotation.z = state.a;
      })
      .start();
  }

  if (scaleTo) {
    const from = pivotGroup.scale.clone();
    const s = { x: from.x, y: from.y, z: from.z };
    new TWEEN.Tween(s)
      .to({ x: scaleTo.x, y: scaleTo.y, z: scaleTo.z }, durationMs)
      .easing(easing)
      .delay(delayMs)
      .onUpdate((v) => pivotGroup.scale.set(v.x, v.y, v.z))
      .start();
  }

  if (moveToWorld) {
    const targetLocal = prevParent.worldToLocal(moveToWorld.clone());
    const p = { x: pivotGroup.position.x, y: pivotGroup.position.y, z: pivotGroup.position.z };
    new TWEEN.Tween(p)
      .to({ x: targetLocal.x, y: targetLocal.y, z: targetLocal.z }, durationMs)
      .easing(easing)
      .delay(delayMs)
      .onUpdate((v) => pivotGroup.position.set(v.x, v.y, v.z))
      .start();
  }

  return pivotGroup;
}
```

参数建议：

- 锚点：几何中心 / 边缘 / 角点 / 质心；先设置锚点，再进行旋转/缩放
- 轴选择：绕 y 轴最常用（转台/翻页），x/z 轴用于俯仰/平面内旋
- 复杂层级：`attach` 保持世界变换，便于复杂父子层重设锚点

### 1.1.3 翻页

描述：模拟纸张/卡片绕装订边（铰链）翻转，常用于画册/卡片序列切换。

伪代码（threeJS + tween，假设已建立“铰链父级”作为翻页轴）：

```js
// hinge 为卡片的父级，位于装订边；绕 Y 轴翻页（左右翻）
function pageFlipTween(hinge, { angleDeg = 180, durationMs = 900, easing = TWEEN.Easing.Cubic.InOut, delayMs = 0 } = {}) {
  const st = { a: 0 };
  return new TWEEN.Tween(st)
    .to({ a: THREE.MathUtils.degToRad(angleDeg) }, durationMs)
    .easing(easing)
    .delay(delayMs)
    .onUpdate(() => (hinge.rotation.y = st.a));
}
```

参数建议：

- 轴位：铰链应位于页面左/右边缘；多页序列可按列级联
- 角度：单页 160°~200° 观感较自然；时长 0.6~1.2s
- 组合：翻页同时可轻微 scale/阴影改变增强质感
- 翻页之后，面片的位置都变了，需要注意相机的位置是否需要变化

简化说明：

1) 锚点设置（Hinge）：

```js
// 在装订边创建父级作为翻页轴，并把页面 attach 到该父级
function makePageHinge(pageMesh, edge = 'left', axis = 'y') {
  const parent = pageMesh.parent;
  const box = new THREE.Box3().setFromObject(pageMesh);
  const midY = 0.5 * (box.min.y + box.max.y);
  const midZ = 0.5 * (box.min.z + box.max.z);
  const midX = 0.5 * (box.min.x + box.max.x);
  const hingeWorld = edge === 'left' ? new THREE.Vector3(box.min.x, midY, midZ)
                    : edge === 'right' ? new THREE.Vector3(box.max.x, midY, midZ)
                    : edge === 'top' ? new THREE.Vector3(midX, box.max.y, midZ)
                    : new THREE.Vector3(midX, box.min.y, midZ);
  const hingeLocal = parent.worldToLocal(hingeWorld.clone());
  const hinge = new THREE.Group();
  hinge.position.copy(hingeLocal);
  parent.add(hinge);
  hinge.attach(pageMesh);
  hinge.userData.flipAxis = axis; // 'y' 左右翻，'x' 上下翻
  return hinge;
}
```

2) 旋转补间：

```js
function pageFlipTween(hinge, angleDeg = 180, durationMs = 900, easing = TWEEN.Easing.Cubic.InOut, delayMs = 0) {
  const axis = hinge.userData.flipAxis || 'y';
  const st = { a: 0 };
  new TWEEN.Tween(st)
    .to({ a: THREE.MathUtils.degToRad(angleDeg) }, durationMs)
    .easing(easing)
    .delay(delayMs)
    .onUpdate(() => {
      if (axis === 'x') hinge.rotation.x = st.a; else hinge.rotation.y = st.a;
    })
    .start();
}
```

注意：页面需双面可见（DoubleSide）；翻页后若构图变化，适当微调相机（Dolly/Truck）。


### 1.1.4 百叶窗翻转

伪代码（百叶示例）：

```js
// 百叶：对若干条带（子节点）做级联旋开/闭合（配合 orderByRow/Col）
function makeSlatOpenPlay({ axis = 'x', angleDeg = 80, durationMs = 700, easing = TWEEN.Easing.Cubic.Out } = {}) {
  return (node, idx, delayMs) => {
    const state = { a: 0 };
    new TWEEN.Tween(state)
      .to({ a: THREE.MathUtils.degToRad(angleDeg) }, durationMs)
      .easing(easing)
      .delay(delayMs)
      .onUpdate(() => {
        if (axis === 'x') node.rotation.x = state.a; else node.rotation.y = state.a;
      })
      .start();
  };
}
```

参数建议：

- 遮罩方向：direction 取单位向量（1,0）/（0,1）/斜向；progress 0→1
- 百叶条数：8~32；baseDelay 20~60ms；角度 60°~100°
- 组合：可先 reveal 进场，随后少量旋开条带形成层次

## 1.2 路径与轨迹

圆环/螺旋，速度曲线（缓入缓出/自定义曲线）

### 1.2.1 物体沿着圆环运动（Circle，XZ 平面）

除了XZ平面，还可以是其他平面，比如 XY YZ 平面

```js
const center = new THREE.Vector3(0, 0, 0);
const radius = 6;
const pathFnCircle = (u) => {
  const t = THREE.MathUtils.degToRad(360 * THREE.MathUtils.clamp(u, 0, 1));
  return new THREE.Vector3(
    center.x + radius * Math.cos(t),
    center.y,
    center.z + radius * Math.sin(t)
  );
};
// followPathTween(node, pathFnCircle, { durationMs: 2400, lookAhead: true });
```

参数建议：

- 半径：主体对角线的 0.8~1.5 倍；过小显得局促，过大易“出框”
- 平面：默认 XZ；如需俯视圆形轨迹可用 XY，侧视可用 YZ
- 起始相位：指定起点更易控构图（例如从 -90° 入场）
- 方向：顺/逆时针按叙事需要选择；可在 easing 上做缓入/缓出

### 1.2.2 螺旋（Helix），主平面是XZ平面，Y是螺旋上升的坐标轴

除XZ平面，还可以是其他平面，比如 XY YZ 平面

```js
const helixCenter = new THREE.Vector3(0, 0, 0);
const helixRadius = 4;
const helixTurns  = 2;     // 圈数
const helixHeight = 6;     // 总高度
const pathFnHelix = (u) => {
  const v = THREE.MathUtils.clamp(u, 0, 1);
  const theta = 2 * Math.PI * helixTurns * v;
  return new THREE.Vector3(
    helixCenter.x + helixRadius * Math.cos(theta),
    helixCenter.y + helixHeight * v,
    helixCenter.z + helixRadius * Math.sin(theta)
  );
};
// followPathTween(node, pathFnHelix, { durationMs: 3000, lookAhead: true });
```

参数建议：

- 半径：3~8；与主体尺寸、镜头距离匹配，避免穿模
- 圈数：1~3 圈常用；圈数越多，时长应适当增加
- 高度：总高度 2~12；如需“电梯式”强调纵深可取更大
- 方向：上升/下降与顺/逆时针组合以形成不同视觉动势

## 1.3 阵列联动，按照触发时机有不同的效果

按 行 / 列 / 层 / 环向 / 辐射 / 棋盘 / 对角波次触发，时序偏移

通用伪代码（threeJS + tween）：

```js
// order: (nodes[]) => nodes[]        // 返回重排后的节点数组
// makeTween: (node) => TWEEN.Tween   // 返回已配置好 onUpdate 的 tween（此处统一加延迟与 start）
function cascadeTween(nodes, {
  baseDelayMs = 40,
  order = (list) => list,
  makeTween
} = {}) {
  const ordered = order(nodes);
  ordered.forEach((node, idx) => {
    const tween = makeTween(node);
    tween.delay(baseDelayMs * idx).start();
  });
}
```

tween 工厂示例（创建逻辑）：

```js
// 位置 tween（绝对）
function makePosTweenAbsolute(to, durationMs = 800, easing = TWEEN.Easing.Cubic.Out) {
  return (node) => {
    const from = { x: node.position.x, y: node.position.y, z: node.position.z };
    return new TWEEN.Tween(from)
      .to({ x: to.x, y: to.y, z: to.z }, durationMs)
      .easing(easing)
      .onUpdate((v) => node.position.set(v.x, v.y, v.z));
  };
}

// 位置 tween（相对）
function makePosTweenRelative(offset, durationMs = 800, easing = TWEEN.Easing.Cubic.Out) {
  return (node) => {
    const start = node.position.clone();
    const to = start.clone().add(offset);
    const from = { x: start.x, y: start.y, z: start.z };
    return new TWEEN.Tween(from)
      .to({ x: to.x, y: to.y, z: to.z }, durationMs)
      .easing(easing)
      .onUpdate((v) => node.position.set(v.x, v.y, v.z));
  };
}

// 缩放 tween
function makeScaleTween(to, durationMs = 700, easing = TWEEN.Easing.Back.Out) {
  return (node) => {
    const from = { x: node.scale.x, y: node.scale.y, z: node.scale.z };
    return new TWEEN.Tween(from)
      .to({ x: to.x, y: to.y, z: to.z }, durationMs)
      .easing(easing)
      .onUpdate((v) => node.scale.set(v.x, v.y, v.z));
  };
}

// 用法：
// const makeTween = makePosTweenRelative(new THREE.Vector3(0, 1, 0), 900);
// cascadeTween(nodes, { baseDelayMs: 50, order: orderByRow, makeTween });
```

参数建议：

- 时序：baseDelay 20~80ms；总时长 0.6~1.8s
- 组合：可与分散/聚集/旋转/缩放等 tween 同用

### 1.3.1 行波次触发（Row Cascade）

描述：按行从上到下（或下到上）依次触发。

伪代码（仅排序）：

```js
const orderByRow = (list) => list.sort((a, b) => a.userData.row - b.userData.row);
// cascadeTween(nodes, { baseDelayMs: 50, order: orderByRow });
```

### 1.3.2 列波次触发（Column Cascade）

描述：按列从左到右（或右到左）依次触发。

伪代码（仅排序）：

```js
const orderByCol = (list) => list.sort((a, b) => a.userData.col - b.userData.col);
```

### 1.3.3 层波次触发（Layer/Depth Cascade）

描述：按层（k 轴，前→后或后→前）依次触发。

伪代码（仅排序）：

```js
const orderByLayer = (list) => list.sort((a, b) => a.userData.layer - b.userData.layer);
```

### 1.3.4 环向波次触发（Ring/Angular Cascade）

描述：按与中心连线的极角从小到大触发（顺/逆时针）。

伪代码（仅排序）：

```js
const center = new THREE.Vector3(cx, cy, cz);
const orderByAngle = (list) => list.slice().sort((a, b) => {
  const va = a.position.clone().sub(center); const angA = Math.atan2(va.z, va.x);
  const vb = b.position.clone().sub(center); const angB = Math.atan2(vb.z, vb.x);
  return angA - angB; // 逆序可改为 angB - angA
});
```

### 1.3.5 辐射波次触发（Radial/Distance Cascade）

描述：按距中心的半径从小到大触发（由内向外）。

伪代码（仅排序）：

```js
const center2 = new THREE.Vector3(cx, cy, cz);
const orderByRadius = (list) => list.slice().sort((a, b) => {
  const ra = a.position.distanceToSquared(center2);
  const rb = b.position.distanceToSquared(center2);
  return ra - rb; // 外向内则反转
});
```

### 1.3.6 棋盘波次触发（Checkerboard Cascade）

描述：按 (row + col) 奇偶分组，先偶后奇（或反之），组内再行/列排序。

伪代码（仅排序）：

```js
const orderCheckerboard = (list) => list.slice().sort((a, b) => {
  const pa = (a.userData.row + a.userData.col) & 1;
  const pb = (b.userData.row + b.userData.col) & 1;
  if (pa !== pb) return pa - pb; // 先偶后奇
  // 组内：先行后列
  if (a.userData.row !== b.userData.row) return a.userData.row - b.userData.row;
  return a.userData.col - b.userData.col;
});
```

### 1.3.7 对角波次触发（Diagonal Cascade）

描述：按 (row + col) 的和从小到大触发，形成左上→右下的对角推进。

伪代码（仅排序）：

```js
const orderDiagonal = (list) => list.slice().sort((a, b) => {
  const sa = a.userData.row + a.userData.col;
  const sb = b.userData.row + b.userData.col;
  if (sa !== sb) return sa - sb;
  // 同一对角线内再按行或列细排
  return a.userData.row - b.userData.row;
});
```

## 1.4 形变与重组

拆分 / 爆散 / 合并 / 聚合，尺寸挤压/拉伸，扭转/膨胀

### 1.4.1 从中心分散到周边，拆分、爆散

描述：从中心向外辐射式平移，常配合错峰形成波次扩散。

伪代码（threeJS + tween）：

```js
function disperseFromCenterTween(nodes, center, {
  radius,
  durationMs = 1000,
  easing = TWEEN.Easing.Cubic.Out,
  baseDelayMs = 40,
  orderIndex = (idx) => idx // 可按行/列/层计算
} = {}) {
  nodes.forEach((node, idx) => {
    const from = node.position.clone();
    const dir = node.position.clone().sub(center).normalize();
    const to = center.clone().add(dir.multiplyScalar(radius));
    const v = { x: from.x, y: from.y, z: from.z };
    new TWEEN.Tween(v)
      .to({ x: to.x, y: to.y, z: to.z }, durationMs)
      .easing(easing)
      .delay(baseDelayMs * orderIndex(idx))
      .onUpdate((p) => node.position.set(p.x, p.y, p.z))
      .start();
  });
}
```

参数建议：

- 距离：radius≈max(W,H,D)*[0.5~1.5]
- 时长：0.6~1.6s（快节奏 0.4~0.8s）
- 缓动：easeOutCubic；stagger 20~80ms/元素

### 1.4.2 从周边聚集到中心，合并、聚合

描述：从当前分布位置向中心汇聚，常用于合体/组装与收束过渡。

伪代码（threeJS + tween）：

```js
function gatherToCenterTween(nodes, center, {
  durationMs = 800,
  easing = TWEEN.Easing.Cubic.In,
  baseDelayMs = 30,
  orderIndex = (idx) => idx
} = {}) {
  nodes.forEach((node, idx) => {
    const from = node.position.clone();
    const to = center.clone();
    const v = { x: from.x, y: from.y, z: from.z };
    new TWEEN.Tween(v)
      .to({ x: to.x, y: to.y, z: to.z }, durationMs)
      .easing(easing)
      .delay(baseDelayMs * orderIndex(idx))
      .onUpdate((p) => node.position.set(p.x, p.y, p.z))
      .start();
  });
}
```

参数建议：

- 距离：按当前至中心距离自动确定
- 时长：0.6~1.2s（与分散配对时取相近时长）
- 缓动：easeInCubic；stagger 10~60ms

### 1.4.3 比例形变（挤压/拉伸）

描述：通过非等比缩放产生形变，强调方向性的挤压或拉伸以增强动势。

伪代码（threeJS + tween）：

```js
function morphScaleTween(node, startS, endS, {
  durationMs = 900,
  easing = TWEEN.Easing.Back.Out,
  delayMs = 0
} = {}) {
  const from = { x: startS.x, y: startS.y, z: startS.z };
  const to   = { x: endS.x,   y: endS.y,   z: endS.z };
  new TWEEN.Tween(from)
    .to(to, durationMs)
    .easing(easing)
    .delay(delayMs)
    .onUpdate((v) => node.scale.set(v.x, v.y, v.z))
    .start();
}
```

参数建议：

- 幅度：等比 0.6~1.4；非等比用于方向性形变
- 时长：0.4~1.2s
- 缓动：easeOutBack / easeInOutCubic

### 1.4.4 扭转/膨胀

描述：在物体上叠加形体扭转（twist）与体积膨胀（inflate）效果，常用着色器 uniform 控制强度，配合补间获得连续形变。

伪代码（threeJS + tween，基于材质 uniforms）：

```js
// 要求材质 shader 内部使用 uniforms.twistAmount / uniforms.inflateAmount
function twistTween(material, to = 1.0, durationMs = 900, easing = TWEEN.Easing.Cubic.InOut, delayMs = 0) {
  const from = { v: material.uniforms.twistAmount.value ?? 0 };
  return new TWEEN.Tween(from)
    .to({ v: to }, durationMs)
    .easing(easing)
    .delay(delayMs)
    .onUpdate((u) => (material.uniforms.twistAmount.value = u.v));
}

function inflateTween(material, to = 1.0, durationMs = 900, easing = TWEEN.Easing.Sinusoidal.InOut, delayMs = 0) {
  const from = { v: material.uniforms.inflateAmount.value ?? 0 };
  return new TWEEN.Tween(from)
    .to({ v: to }, durationMs)
    .easing(easing)
    .delay(delayMs)
    .onUpdate((u) => (material.uniforms.inflateAmount.value = u.v));
}
```

参数建议：

- twistAmount：[-1, 1]，正负决定扭转方向；常用 0.2~0.8
- inflateAmount：[0, 1]，控制沿法线的位移幅度；常用 0.2~1.0
- 时长：扭转 0.7~1.2s；膨胀 0.5~1.0s；可叠加 yoyo/链式


## 1.5 噪声与物理

弹簧/阻尼，重力联动

### 1.5.1 弹簧/阻尼

描述：近似弹簧-阻尼系统的归位/跟随，产生 Q 式动态。

伪代码（threeJS + tween）：

```js
// 基于解析近似：返回位移随时间的弹簧曲线
function springToTween(node, target, {
  durationMs = 1200, delayMs = 0,
  stiffness = 8.0, damping = 0.6 // 影响曲线形状（非物理单位）
} = {}) {
  const p0 = node.position.clone();
  const st = { t: 0 };
  const curve = (t) => 1 - Math.exp(-damping * t) * Math.cos(stiffness * t); // 0→1 带衰减震荡
  return new TWEEN.Tween(st)
    .to({ t: 1 }, durationMs)
    .delay(delayMs)
    .onUpdate(() => {
      const w = curve(st.t);
      node.position.copy(p0.clone().lerp(target, w));
    });
}
```

参数建议：

- stiffness 6~14，damping 0.5~0.85；时长按视觉确定

### 1.5.2 重力联动（下落/回弹）

描述：模拟重力下落与地面回弹的近似效果。

伪代码（threeJS + tween）：

```js
function gravityBounceTween(node, {
  groundY = 0,
  height = 5,
  durationMs = 900,
  easingDown = TWEEN.Easing.Quadratic.In,
  easingUp = TWEEN.Easing.Quadratic.Out,
  bounces = 1
} = {}) {
  const y0 = node.position.y;
  node.position.y = y0 + height;
  new TWEEN.Tween({ y: node.position.y })
    .to({ y: groundY }, durationMs)
    .easing(easingDown)
    .onUpdate((s) => (node.position.y = s.y))
    .onComplete(() => {
      for (let i = 0; i < bounces; i++) {
        const up = new TWEEN.Tween({ y: groundY })
          .to({ y: groundY + height * Math.pow(0.5, i + 1) }, durationMs * Math.pow(0.5, i + 1))
          .easing(easingUp)
          .onUpdate((s) => (node.position.y = s.y));
        const down = new TWEEN.Tween({ y: node.position.y })
          .to({ y: groundY }, durationMs * Math.pow(0.5, i + 1))
          .easing(easingDown)
          .onUpdate((s) => (node.position.y = s.y));
        up.chain(down);
        (i === 0 ? up : prevDown).chain(up);
        var prevDown = down;
      }
    })
    .start();
}
```

参数建议：

- 反弹高度与时长按 0.4~0.6 衰减；上下缓动分别用 In/Out 二次或三次
