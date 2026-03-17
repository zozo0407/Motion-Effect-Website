# 2 相机运动

## 2.1 机位操作

推拉（Dolly）、坐标轴平移（Truck/Pedestal）、旋转（Pan/Tilt/Roll）、环绕/弧移（Orbit/Arc）、正面俯视场景/侧面仰视场景

### 2.1.1 推拉（Dolly）

描述：沿相机朝向的方向进行前后的移动（dolly）。

伪代码（threeJS + tween）：

```js
// 位置推拉（沿 Z 方向，或根据相机朝向的前向）
function dollyTween(camera, { delta = -5, durationMs = 900, easing = TWEEN.Easing.Sinusoidal.InOut, delayMs = 0 } = {}) {
  const start = camera.position.clone();
  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward); // 指向 -Z（默认）
  const to = start.clone().add(forward.multiplyScalar(delta));
  const v = { x: start.x, y: start.y, z: start.z };
  return new TWEEN.Tween(v)
    .to({ x: to.x, y: to.y, z: to.z }, durationMs)
    .easing(easing)
    .delay(delayMs)
    .onUpdate((p) => camera.position.set(p.x, p.y, p.z));
}


调用参数示例（仅参数）：

```js
// Dolly 前进 6m
{ delta: -6, durationMs: 900, easing: TWEEN.Easing.Sinusoidal.InOut }
```

参数建议：

- Dolly 距离按场景纵深 0.5~2.0 倍
- 同时使用 dolly 时保持画面感受一致性（避免突兀变形）

### 2.1.2 坐标轴平移（Truck/Pedestal）

描述：相机沿水平/垂直方向平移，保持 LookAt 不变或同步调整。

伪代码（threeJS + tween）：

```js
function truckTween(camera, { offset = new THREE.Vector3(2, 0, 0), durationMs = 800, easing = TWEEN.Easing.Sinusoidal.InOut, delayMs = 0 } = {}) {
  const start = camera.position.clone();
  const to = start.clone().add(offset);
  const v = { x: start.x, y: start.y, z: start.z };
  return new TWEEN.Tween(v)
    .to({ x: to.x, y: to.y, z: to.z }, durationMs)
    .easing(easing)
    .delay(delayMs)
    .onUpdate((p) => camera.position.set(p.x, p.y, p.z));
}
```

调用参数示例（仅参数）：

```js
{ offset: new THREE.Vector3(2, 0, 0), durationMs: 800, easing: TWEEN.Easing.Sinusoidal.InOut }
```

参数建议：

- 侧向 truck 2~6m，pedestal（上下）1~4m；缓动用 InOut 型

### 2.1.3 旋转（Pan/Tilt/Roll）

描述：绕相机局部轴旋转以改变取景方向（不改变机位）。

伪代码（threeJS + tween）：

```js
function panTiltRollTween(camera, { panDeg = 0, tiltDeg = 0, rollDeg = 0, durationMs = 700, easing = TWEEN.Easing.Cubic.InOut, delayMs = 0 } = {}) {
  const start = camera.rotation.clone();
  const st = { px: 0, ty: 0, rz: 0 };
  return new TWEEN.Tween(st)
    .to({ px: THREE.MathUtils.degToRad(panDeg), ty: THREE.MathUtils.degToRad(tiltDeg), rz: THREE.MathUtils.degToRad(rollDeg) }, durationMs)
    .easing(easing)
    .delay(delayMs)
    .onUpdate(() => {
      camera.rotation.set(start.x + st.ty, start.y + st.px, start.z + st.rz);
    });
}
```

调用参数示例（仅参数）：

```js
{ panDeg: 20, tiltDeg: -10, rollDeg: 0, durationMs: 700, easing: TWEEN.Easing.Cubic.InOut }
```

参数建议：

- Pan/Tilt 5°~30°，Roll 0°~10°；镜头语言偏强时可叠加 dolly

### 2.1.4 环绕/弧移（Orbit/Arc）

描述：相机绕目标点做圆弧或整圈移动，持续 LookAt 目标。

伪代码（threeJS + tween）：

```js
function orbitTween(camera, center, { radius = 6, startDeg = 0, endDeg = 120, durationMs = 2000, easing = TWEEN.Easing.Sinusoidal.InOut, delayMs = 0 } = {}) {
  const st = { a: startDeg };
  return new TWEEN.Tween(st)
    .to({ a: endDeg }, durationMs)
    .easing(easing)
    .delay(delayMs)
    .onUpdate(() => {
      const t = THREE.MathUtils.degToRad(st.a);
      camera.position.set(center.x + radius * Math.cos(t), camera.position.y, center.z + radius * Math.sin(t));
      camera.lookAt(center);
    });
}
```

调用参数示例（仅参数）：

```js
{ center: new THREE.Vector3(cx, cy, cz), radius: 8, startDeg: 0, endDeg: 150, durationMs: 2200 }
```

参数建议：

- 半径 ≈ 场景对角线 1.2~2.5 倍；角度 90°/120°/180°/360°

### 2.1.5 相机正面俯视场景

描述：相机位于主体正前方上方，以一定俯角俯视主体，构图稳定、信息量清晰。一般情况下是Y和Z都+10

伪代码（threeJS + tween）：

```js
function frontTopViewTween(camera, lookAt, { dy = 10, dz = 10, durationMs = 900, easing = TWEEN.Easing.Sinusoidal.InOut, delayMs = 0 } = {}) {
  const start = camera.position.clone();
  const end = start.clone().add(new THREE.Vector3(0, dy, dz));
  const v = { y: start.y, z: start.z };
  return new TWEEN.Tween(v)
    .to({ y: end.y, z: end.z }, durationMs)
    .easing(easing)
    .delay(delayMs)
    .onUpdate((p) => {
      camera.position.set(start.x, p.y, p.z);
      if (lookAt) camera.lookAt(lookAt);
    });
}
```

调用参数示例（仅参数）：

```js
{ lookAt: new THREE.Vector3(0, 0, 0), dy: 10, dz: 10, durationMs: 900 }
```

参数建议：

- dy：5~20（垂直微调；上移为正，下降为负，和场景大小相关）
- dz：5~20（前后微调；后退为正，前推为负；和场景大小相关）
- durationMs：700~1400ms；easing：Sinusoidal.InOut 或 Cubic.InOut

### 2.1.6 相机侧面仰视场景

描述：相机位于主体一侧偏低位置，略带仰拍（低机位），强调体量与张力，一般是X +5 ，Y -5。

伪代码（threeJS + tween）：

```js
function sideLowAngleViewTween(camera, lookAt, { dx = 5, dy = -5, durationMs = 900, easing = TWEEN.Easing.Sinusoidal.InOut, delayMs = 0 } = {}) {
  const start = camera.position.clone();
  const end = start.clone().add(new THREE.Vector3(dx, dy, 0)); // x 向右、y 下移
  const v = { x: start.x, y: start.y };
  return new TWEEN.Tween(v)
    .to({ x: end.x, y: end.y }, durationMs)
    .easing(easing)
    .delay(delayMs)
    .onUpdate((p) => {
      camera.position.set(p.x, p.y, start.z);
      if (lookAt) camera.lookAt(lookAt);
    });
}
```

调用参数示例（仅参数）：

```js
{ lookAt: new THREE.Vector3(0, 0, 0), dx: 5, dy: -5, durationMs: 900 }
```

参数建议：

- dx：5 ~ 20（侧向位移；正值向 +X, 相机在场景中偏右；如果侧向位移为负，则相机在场景中偏左。）
- dy：-5~ -20（下移量；越大仰视感越强）
- durationMs：700~1400ms；easing：Sinusoidal.InOut 或 Cubic.InOut

## 2.2 轨道/曲线

螺旋 / 摇臂（Jib），固定目标 LookAt

### 2.2.1 螺旋轨道

描述：相机在上升 / 下降的螺旋轨道上运动，LookAt 目标。

伪代码：

```js
function cameraHelixTween(camera, center, { radius = 6, turns = 2, height = 6, durationMs = 3000, easing = TWEEN.Easing.Sinusoidal.InOut } = {}) {
  const st = { u: 0 };
  return new TWEEN.Tween(st)
    .to({ u: 1 }, durationMs)
    .easing(easing)
    .onUpdate(() => {
      const u = st.u;
      const theta = 2 * Math.PI * turns * u;
      camera.position.set(center.x + radius * Math.cos(theta), center.y + height * u, center.z + radius * Math.sin(theta));
      camera.lookAt(center);
    });
}
```

参数建议：

- radius：建议为主体对角线 0.8~2.0 倍；远景 1.5~2.5 倍
- turns：0.5~2 圈；转场 0.75~1.25，展示 1.5~2
- height：每圈爬升 ≈ height/turns；每圈推荐 0.5~1.2×主体高度（下降用负值）
- durationMs：0.5 圈 1200~2200ms；1 圈 2000~3500ms；2 圈 3500~6000ms
- easing：Sinusoidal.InOut（常用）、Cubic.InOut（沉稳）、Quadratic.In（干脆）

### 2.2.2 摇臂（Jib）

描述：以基点和臂长为参数的弧形/升降机位运动。

伪代码：

```js
function craneTween(camera, basePos, { armLen = 6, pitchDeg = 30, durationMs = 1500, easing = TWEEN.Easing.Sinusoidal.InOut } = {}) {
  const st = { a: 0 };
  return new TWEEN.Tween(st)
    .to({ a: pitchDeg }, durationMs)
    .easing(easing)
    .onUpdate(() => {
      const rad = THREE.MathUtils.degToRad(st.a);
      camera.position.copy(basePos).add(new THREE.Vector3(Math.sin(rad) * armLen, Math.cos(rad) * armLen, 0));
      camera.lookAt(basePos);
    });
}
```

建议参数：

- armLen：依据主体/场景尺度 2~8（室内 2~4，广角 6~12）
- pitchDeg：±10°~30° 常规；强调 30°~60°；下降用负值
- durationMs：800~1500ms
- easing：Sinusoidal.InOut（平稳）、Cubic.InOut（厚重）、Quadratic.Out（抬升感强）

## 2.3 过渡手法

Whip Pan、视差揭示（Parallax Reveal）、穿越/穿幕 Push‑Through

### 2.3.1 Whip Pan（甩镜）

描述：短时间大幅度 pan，产生快速甩动的模糊感（需配合动效/后处理）。

伪代码：

```js
function whipPanTween(camera, { yawDeg = 90, durationMs = 280, easing = TWEEN.Easing.Cubic.In, delayMs = 0 } = {}) {
  const startYaw = camera.rotation.y;
  const st = { y: 0 };
  return new TWEEN.Tween(st)
    .to({ y: THREE.MathUtils.degToRad(yawDeg) }, durationMs)
    .easing(easing)
    .delay(delayMs)
    .onUpdate(() => { camera.rotation.y = startYaw + st.y; });
}
```

建议参数：

- yawDeg：60°~180° 常用；90°/120°是安全选择；>180° 需配合遮挡或转场
- durationMs：150~350ms（典型甩镜）；更慢的甩镜 400~600ms
- easing：Cubic.In（快速起笔）、Cubic.InOut（更平衡）、Quintic.In（更猛）
- delayMs：0~100ms（按节奏需要）
