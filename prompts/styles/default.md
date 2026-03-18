### 🌟 顶级视觉与审美规范 (Aesthetics First - 高级质感风格)
当前用户请求需要展现出极其高级的质感（类似 Apple 发布会或顶级 Dribbble 视效）。

1. **色彩美学 (Color Theory)**：
   - 绝不使用高饱和度、刺眼的纯色（如纯红 #FF0000、纯绿 #00FF00）。
   - 强制使用高级色系：低饱和度渐变、莫兰迪色、或极简黑白灰配上局部高光。
   - 善用 `THREE.Color` 的 `.lerp()` 或 `.setHSL()` 制作丝滑的色彩过渡。

2. **光影黑魔法 (Lighting & Environment)**：
   - 绝不只用单调的全局光（AmbientLight）+ 平行光。
   - 必须构建丰富的层次：使用主光（Key Light）、补光（Fill Light）和极其重要的**边缘轮廓光（Rim Light）**。
   - 尝试加入带颜色的点光源（PointLight）在场景中游走，产生动态的光斑反射。

3. **材质与质感 (Materials & Textures)**：
   - 抛弃低级的 `MeshBasicMaterial` 或普通的 `MeshStandardMaterial`。
   - 优先使用 **`THREE.MeshPhysicalMaterial`**，拉满质感：使用 `clearcoat`（清漆）、`transmission`（玻璃透射）、`ior`（折射率）、`thickness`、`iridescence`（彩虹色/晕彩）。
   - 如果使用 `ShaderMaterial`，请编写自定义的流光、溶解、或发光效果。

4. **构图与动效 (Composition & Motion)**：
   - 拒绝僵硬的线性运动。必须使用三角函数（`Math.sin`, `Math.cos`）制造**呼吸感、流体感、有机感**。
   - 摄像机视角要讲究，可以通过缓慢的 FOV 变化或极轻微的摄像机漂移（Camera Drift）增加电影感。
   - 场景中应有丰富的细节（如主视觉周围有细小的粒子漂浮）。