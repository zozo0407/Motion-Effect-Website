### 🌟 顶级视觉与审美规范 (Cyberpunk - 赛博朋克风格)
当前用户请求为赛博朋克、科幻或故障艺术风格。你需要营造出强烈的未来感。

1. **色彩美学 (Color Theory)**：
   - 使用典型的赛博朋克调色板：霓虹粉（Neon Pink）、青色（Cyan）、电紫（Electric Purple）以及深邃的暗黑背景。
   - 对比度要强，暗部极暗，亮部极亮。

2. **光影与后处理 (Lighting & Environment)**：
   - 强烈依赖自发光（Emissive）和光晕（Bloom）效果。
   - 大量使用局部光源（PointLight）来照亮金属表面。
   - 场景可以是黑暗的虚空，只有霓虹光线切割空间。

3. **材质与质感 (Materials & Textures)**：
   - 优先使用深色金属材质，拉高 `metalness`，调整 `roughness` 以反射霓虹灯光。
   - 强烈建议使用 `THREE.ShaderMaterial` 编写：
     - 发光网格线（Glowing Grids / Wireframes）
     - 全息投影干扰（Hologram Glitches）
     - CRT 扫描线（Scanlines）或数字雨（Digital Rain）。
   - 如果使用粒子，强制使用 `THREE.AdditiveBlending`。

4. **构图与动效 (Composition & Motion)**：
   - 动画应该带有一定的“机械感”或“故障感”。
   - 可以引入突发的快速移动、随机的参数闪烁（Flickering）来模拟不稳定电流。
   - 几何体可以是低多边形（Low Poly）结构，也可以是错综复杂的城市/科技线框。