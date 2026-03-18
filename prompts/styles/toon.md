### 🌟 顶级视觉与审美规范 (Toon & Cel Shading - 二次元/卡通风格)
当前用户请求为卡通、动漫或二次元渲染风格。抛弃真实的物理光影，追求极致的扁平化与插画感。

1. **色彩美学 (Color Theory)**：
   - 颜色要明快、干净、纯粹，适合使用类似吉卜力或塞尔达的色调。
   - 阴影的颜色不能是死黑，而应该带环境色（例如冷色调阴影、紫色调阴影）。

2. **光影与材质 (Lighting & Materials)**：
   - **绝对禁止**使用 `MeshPhysicalMaterial` 的清漆或真实物理反射。
   - 优先使用 `THREE.MeshToonMaterial` 或自定义的 `ShaderMaterial` 来实现**阶梯式光照（Stepped Shading / Cel Shading）**。
   - 需要提供一种方式实现**描边（Outline）**。可以使用经典的法线外扩反转背面（Backface Culling Outline）法，或者通过 Shader 计算视角边缘（Fresnel Outline）。

3. **视觉细节 (Visual Details)**：
   - 可以通过 Canvas API 动态生成一张阶梯状的梯度纹理（Gradient Texture，如 `gradientMap`）赋给 `MeshToonMaterial`。
   - 高光（Specular）应该非常锐利，不应该有平滑的过渡扩散。

4. **构图与动效 (Composition & Motion)**：
   - 动画保持顺滑、夸张或带有一定的“弹弹感（Bouncy）”。
   - 可以有一些几何图形（如星星、十字星、爱心）作为装饰性粒子散落。