# CapCut Motion Graphics Lab - Design System

本文档定义了「剪映动态影像实验室」的专属网页设计系统。该系统**完全摒弃了传统的发光发绿的“网吧赛博朋克”感**，全面转向 **Vercel 的极简工程美学**与 **RunwayML 的电影级隐形界面**。

所有的 UI 必须克制、精准、冷峻。

---

## 1. 核心设计理念 (Design Philosophy)

- **The Invisible Interface (隐形界面)**：UI 是为了承载内容而存在的框架，不应该喧宾夺主。抛弃高饱和度的发光（Glow）、抛弃强烈的赛博朋克青绿色。界面应该像一个高端的相机取景器，克制而专业。
- **Typographic Hierarchy (排版即层级)**：不再依赖背景色或粗边框来区分层级，而是通过字体的粗细、大小、颜色对比度（白度）和极端的负字间距来建立视觉秩序。
- **Zero-Shadow Precision (零阴影精确度)**：摒弃大面积的阴影和模糊（Blur）。使用 1px 的硬边缘线和极其克制的单层柔和阴影，营造干练的工程工具感。

---

## 2. 色彩系统 (Color Palette)

系统以极致的黑白灰构成，抛弃高饱和度的点缀色，只在最关键的交互点使用极低饱和度的冷色。

### 基础背景 (Backgrounds)
- **App Background**: `#000000` (纯黑) 或 `#0A0A0A` (极深灰)。
- **Panel Background**: `#111111` 到 `#171717`。没有毛玻璃，只有纯粹的深灰色块。

### 文本颜色 (Typography Colors)
- **Primary Text**: `#FFFFFF` (纯白) - 标题、主文本。
- **Secondary Text**: `#A1A1AA` (中灰) - 描述、次要信息。
- **Tertiary Text**: `#52525B` (深灰) - 装饰性代码注释、极弱的标签。

### 边框与线条 (Borders & Lines)
- **Default Border**: `#27272A` 或 `rgba(255,255,255,0.1)` - 用于面板边界、分割线。
- **Focus/Active Border**: `#FFFFFF` 或 `#E4E4E7` - 交互激活时，边框变为高对比度的白色。

### 强调与状态 (Accents - 极度克制)
- **Brand Accent**: 抛弃原有的亮青绿（`#00CAE0`）。转而使用极其克制的冷白色，或者非常低调的冷蓝色（如 `#3B82F6`），仅用于 Switch、Checkbox 或进度条等组件的激活状态，绝不大面积使用。
- **Error/Alert**: `#EF4444` (Red) - 报错。

---

## 3. 排版系统 (Typography)

完全遵循 Vercel 和 RunwayML 的极端排版规则。

### 3.1 字体定义 (Typefaces)
- **Sans-serif (无衬线/主字体)**: `Geist Sans`, `Inter`, `sans-serif`。
  - 用于所有的标题、段落、按钮。
- **Monospace (等宽/极客字体)**: `Geist Mono`, `JetBrains Mono`, `monospace`。
  - 仅用于：真实的代码、终端输出、精确的数据坐标。**不再用于装饰性的面板标题。**

### 3.2 字体梯度 (Type Scale & Styling)
- **Display (巨型标题)**: 
  - 极紧凑的行高 (`leading-[1.0]`) 和极端的负字间距 (`tracking-[-0.04em]`)。
  - 字体粗细通常为中等 (`font-medium` 或 `font-semibold`)，而非极粗的 Black。
- **Headings (面板标题)**: 
  - `text-sm`，纯白色，紧凑的字间距。
- **Labels (标签)**:
  - `text-[11px]` 或 `text-xs`，中灰色，**全大写 (Uppercase)**，并带有轻微的**正字间距 (tracking-wider)**。

---

## 4. 边框与深度 (Borders & Depth)

抛弃光晕（Glow）和毛玻璃（Glassmorphism）。

### 4.1 边框即阴影 (Shadow as Border)
- 采用 Vercel 的技术，使用 1px 的内阴影代替传统边框，以获得更平滑的圆角渲染。
- `box-shadow: 0 0 0 1px rgba(255,255,255,0.1)`

### 4.2 深度体系 (Depth System)
- **Level 0**: 纯黑底色。
- **Level 1 (Panels)**: `#111111` 背景 + 1px 边框阴影。没有外发光，没有悬浮感。
- **Level 2 (Popovers/Dropdowns)**: `#171717` 背景 + 1px 边框阴影 + 一层极其微弱的扩散阴影 `box-shadow: 0 4px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)`。

---

## 5. 组件范式 (Component Patterns)

### 5.1 按钮 (Buttons)
- **Primary Action (主操作)**: 
  - 背景：纯白色 (`#FFFFFF`)。
  - 文字：纯黑色 (`#000000`)。
  - 交互：Hover 时透明度降为 90% 或背景变为浅灰。**没有发光，没有上浮缩放。**
  - 形状：适度的圆角（如 `rounded-md`）。
- **Secondary / Outline (次级/描边)**:
  - 背景：透明或 `#111111`。
  - 边框：`1px solid rgba(255,255,255,0.1)`。
  - 文字：纯白色。
  - 交互：Hover 时背景变为 `rgba(255,255,255,0.05)`，边框变为 `rgba(255,255,255,0.2)`。

### 5.2 面板与表单 (Panels & Inputs)
- **Input / Select**: 
  - 背景：透明或极深的灰 (`#0A0A0A`)。
  - 边框：`rgba(255,255,255,0.1)`。
  - 交互：Focus 时，边框变为纯白色（Vercel 风格）。没有发光效果。文字为小号（`text-sm`）。
- **Slider (滑动条)**:
  - 轨道：`2px` 高，中灰色。
  - Thumb：纯白色的小圆点，无发光。

### 5.3 卡片 (Cards)
- **静态、平整**：卡片悬停时**不应该**有上浮（`translateY`）和边框发光。
- 交互反馈仅仅是卡片背景色轻微变亮（例如从 `#0A0A0A` 变到 `#111111`），或者边框透明度提高。

---

## 6. 动画法则 (Animation Principles)

- **极度克制 (Extreme Restraint)**：抛弃一切扫描线（Scanline）、脉冲呼吸灯（Pulse）和跑马灯（Marquee）。
- **微小的透明度渐变 (Micro-opacity Transitions)**：所有的 Hover 效果都应该通过微小的背景色或透明度渐变（如 150ms 的 `transition-colors`）来完成，而不是位移。
- **瞬间的响应 (Instant Feedback)**：工具类软件需要给人极快的响应感。动画时长通常控制在 100ms - 200ms。
