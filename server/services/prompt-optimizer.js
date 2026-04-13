const RULES = [
  {
    pattern: /成千上万|数以万计|数万|数百万|数千万|数亿|无数|海量|漫天/g,
    replacement: '数百',
    reason: '降级对象数量：极端量级→数百（Bloom泛光可弥补视觉密度）',
  },
  {
    pattern: /千万个|百万个|数万个|几万个|上万个/g,
    replacement: '几百个',
    reason: '降级对象数量：万级→百级',
  },
  {
    pattern: /数千个|几千个|好几千/g,
    replacement: '几百个',
    reason: '降级对象数量：千级→百级',
  },
  {
    pattern: /运动模糊|motion\s*blur/gi,
    replacement: '轻微拖尾效果（使用半透明叠加模拟）',
    reason: '运动模糊需自定义后处理，改为半透明叠加模拟',
  },
  {
    pattern: /真实(?:的)?(?:物理|光线追踪|全局光照|路径追踪)/g,
    replacement: '近似',
    reason: '真实物理渲染超出运行时能力，改为近似效果',
  },
  {
    pattern: /光线追踪|ray\s*tracing/gi,
    replacement: '环境反射（使用 MeshStandardMaterial envMap）',
    reason: '光线追踪不可用，改为环境贴图反射',
  },
  {
    pattern: /体积光|体积雾|volumetric\s*light/gi,
    replacement: 'Bloom泛光和雾效（THREE.FogExp2）',
    reason: '体积光需自定义Shader，改为内置Fog+Bloom',
  },
  {
    pattern: /焦散|caustics/gi,
    replacement: '高光反射（MeshPhysicalMaterial）',
    reason: '焦散需自定义Shader，改为PBR材质高光',
  },
  {
    pattern: /GPGPU|gpu\s*compute|compute\s*shader/gi,
    replacement: 'InstancedMesh + 简单数学变换',
    reason: 'GPGPU超出运行时能力，改为InstancedMesh',
  },
  {
    pattern: /自定义\s*Shader|custom\s*shader|ShaderMaterial|RawShaderMaterial/gi,
    replacement: 'Three.js 内置材质（MeshStandardMaterial / MeshPhysicalMaterial）',
    reason: '自定义Shader易出错，改为内置PBR材质',
  },
  {
    pattern: /后处理|post[\s-]?processing|post[\s-]?process/gi,
    replacement: 'Bloom泛光（renderer.addBloom）',
    reason: '通用后处理不可用，仅支持Bloom',
  },
  {
    pattern: /景深|depth\s*of\s*field|DOF|bokeh/gi,
    replacement: '雾效（THREE.FogExp2）营造深度感',
    reason: '景深需BokehPass，改为内置Fog',
  },
  {
    pattern: /色差|chromatic\s*aberration/gi,
    replacement: '边缘发光（emissive属性）',
    reason: '色差需自定义后处理，改为自发光',
  },
  {
    pattern: /多系统|多个子系统|联动|复杂交互/g,
    replacement: '单一主体+灯光动画',
    reason: '多系统联动易超时，改为单主体+灯光',
  },
  {
    pattern: /疾速|极速|高速|飞速|超高速/g,
    replacement: '缓慢匀速',
    reason: '极速运动需复杂物理模拟，改为匀速',
  },
  {
    pattern: /实时(?:的)?(?:流体|烟雾|火焰|水面)模拟/g,
    replacement: '正弦波动画模拟',
    reason: '实时流体模拟不可用，改为数学函数模拟',
  },
  {
    pattern: /物理引擎|physics\s*engine|刚体|碰撞检测|重力模拟/gi,
    replacement: '简单数学动画（正弦波/线性插值）',
    reason: '物理引擎不可用，改为数学动画',
  },
  {
    pattern: /RoomEnvironment|环境贴图生成/g,
    replacement: '点光源+环境光组合',
    reason: 'RoomEnvironment不可用，改为灯光组合',
  },
];

const SUFFIX_STABILITY = '请确保代码简洁（setup+animate合计不超过120行），仅使用Three.js内置材质和几何体，必须scene.add()确保首帧可见。';

function scoreComplexity(prompt) {
  let score = 0;
  const high = /成千上万|数万|数百万|海量|GPGPU|compute.shader|自定义.Shader|ShaderMaterial|光线追踪|运动模糊|体积光|物理引擎|实时流体|多系统联动/i;
  const mid = /数千|几千|后处理|景深|色差|焦散|疾速|高速|碰撞|实时模拟/i;
  const low = /数百|几百|缓慢|简单|内置材质|InstancedMesh|Points/i;
  if (high.test(prompt)) score += 3;
  if (mid.test(prompt)) score += 2;
  if (low.test(prompt)) score -= 1;
  if (prompt.length > 150) score += 1;
  if (/和|与|以及|同时|并且|，.*，.*，/.test(prompt)) score += 1;
  return Math.max(0, score);
}

function optimizePrompt(rawPrompt) {
  if (!rawPrompt || typeof rawPrompt !== 'string') {
    return { optimized: rawPrompt || '', changes: [], complexityScore: 0 };
  }

  let optimized = rawPrompt;
  const changes = [];

  for (const rule of RULES) {
    if (rule.pattern.test(optimized)) {
      const matches = optimized.match(rule.pattern);
      changes.push({
        original: [...new Set(matches)].join(', '),
        replacement: rule.replacement,
        reason: rule.reason,
      });
      optimized = optimized.replace(rule.pattern, rule.replacement);
    }
  }

  const complexityScore = scoreComplexity(rawPrompt);

  const alreadyHasConstraint = /仅使用|内置材质|避免复杂|不要声明|scene\.add|不超过.*行/.test(optimized);
  if (!alreadyHasConstraint && complexityScore >= 2) {
    optimized = optimized.trimEnd();
    if (!/[。！？；]$/.test(optimized)) optimized += '。';
    optimized += SUFFIX_STABILITY;
    changes.push({
      original: '(无约束后缀)',
      replacement: '追加稳定性约束后缀',
      reason: '强化合约合规性，减少AI偏航',
    });
  }

  return { optimized, changes, complexityScore };
}

module.exports = { optimizePrompt, scoreComplexity, RULES, SUFFIX_STABILITY };
