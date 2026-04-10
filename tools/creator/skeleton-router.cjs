function clamp(n, a, b) {
  const x = Number(n);
  if (!Number.isFinite(x)) return a;
  return Math.max(a, Math.min(b, x));
}

const COLOR_MAP = [
  ['紫', '#8b5cf6'],
  ['purple', '#8b5cf6'],
  ['绿色', '#22c55e'],
  ['绿', '#22c55e'],
  ['green', '#22c55e'],
  ['红色', '#ff0000'],
  ['红', '#ff0000'],
  ['red', '#ff0000'],
  ['蓝色', '#3b82f6'],
  ['蓝', '#3b82f6'],
  ['blue', '#3b82f6'],
  ['青色', '#00caff'],
  ['青', '#00caff'],
  ['cyan', '#00caff'],
  ['洋红', '#ff00aa'],
  ['粉', '#ff66cc'],
  ['pink', '#ff66cc'],
  ['金色', '#f59e0b'],
  ['金', '#f59e0b'],
  ['gold', '#f59e0b'],
  ['银', '#d1d5db'],
  ['白', '#ffffff'],
  ['黑', '#05050a']
];

function extractHexColor(prompt) {
  const s = typeof prompt === 'string' ? prompt : '';
  const m = s.match(/#([0-9a-fA-F]{6})\b/);
  return m ? `#${m[1].toLowerCase()}` : null;
}

function hashToIndex(str, mod) {
  const s = typeof str === 'string' ? str : '';
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const m = Math.max(1, mod | 0);
  return Math.abs(h) % m;
}

function defaultPalette(prompt) {
  const palette = ['#ff0040', '#00caff', '#8b5cf6', '#22c55e', '#f97316', '#ffd166'];
  return palette[hashToIndex(prompt, palette.length)];
}

function normalizePrompt(prompt) {
  return typeof prompt === 'string' ? prompt.toLowerCase() : '';
}

function extractSpeed(prompt) {
  const s = normalizePrompt(prompt);
  if (s.includes('slow') || s.includes('缓慢') || s.includes('慢')) return 0.6;
  if (s.includes('fast') || s.includes('快速') || s.includes('快')) return 1.6;
  return 1.0;
}

function extractPrimaryColor(prompt) {
  const hex = extractHexColor(prompt);
  if (hex) return hex;
  const s = normalizePrompt(prompt);
  const hit = COLOR_MAP.find(([keyword]) => s.includes(keyword));
  return hit ? hit[1] : defaultPalette(prompt);
}

function extractSecondaryColor(prompt, primaryColor) {
  const s = normalizePrompt(prompt);
  if (s.includes('青') && s.includes('洋红')) return '#ff00aa';
  if (s.includes('蓝') && s.includes('紫')) return '#8b5cf6';
  if (s.includes('双色') || s.includes('渐变')) return primaryColor === '#ff0000' ? '#ff3366' : '#ffffff';
  return primaryColor === '#05050a' ? '#ffffff' : primaryColor;
}

function extractDensity(prompt) {
  const s = normalizePrompt(prompt);
  if (s.includes('成千上万') || s.includes('高密度') || s.includes('dense') || s.includes('密集') || s.includes('很多')) return 1.6;
  if (s.includes('稀疏') || s.includes('极简') || s.includes('很少') || s.includes('sparse')) return 0.7;
  return 1.0;
}

function extractGlowIntensity(prompt) {
  const s = normalizePrompt(prompt);
  if (s.includes('霓虹') || s.includes('发光') || s.includes('高亮') || s.includes('glow')) return 1.5;
  return 1.0;
}

function extractFogStrength(prompt) {
  const s = normalizePrompt(prompt);
  if (s.includes('轻微雾感')) return 0.35;
  if (s.includes('雾感') || s.includes('烟雾')) return 0.6;
  return 0.0;
}

function extractPulseStrength(prompt) {
  const s = normalizePrompt(prompt);
  if (s.includes('脉冲') || s.includes('呼吸')) return 0.65;
  return 0.0;
}

function extractTransparency(prompt) {
  const s = normalizePrompt(prompt);
  if (s.includes('透明') || s.includes('玻璃') || s.includes('水晶')) return 0.72;
  return 0.15;
}

function extractMetalness(prompt) {
  const s = normalizePrompt(prompt);
  if (s.includes('液态金属') || s.includes('金属') || s.includes('高光反射') || s.includes('镜面')) return 0.92;
  return 0.2;
}

function extractRoughness(prompt) {
  const s = normalizePrompt(prompt);
  if (s.includes('镜面') || s.includes('高光')) return 0.12;
  if (s.includes('磨砂')) return 0.45;
  return 0.22;
}

function extractFlowIntensity(prompt) {
  const s = normalizePrompt(prompt);
  if (s.includes('波纹') || s.includes('流动') || s.includes('起伏')) return 0.7;
  return 0.35;
}

function matchesEnergyCore(prompt) {
  const s = normalizePrompt(prompt);
  // Keep this narrow; otherwise "core" matches too many prompts.
  return (
    s.includes('能量核心') ||
    s.includes('全息能量核心') ||
    s.includes('全息核心') ||
    s.includes('energy core') ||
    s.includes('holographic core') ||
    s.includes('reactor core')
  );
}

function matchesParticlesVortex(prompt) {
  const s = normalizePrompt(prompt);
  // NOTE: do NOT match generic words like "能量" here, otherwise "能量核心" is misrouted.
  return ['particle', 'particles', 'spark', 'nebula', '粒子', '星尘', '漩涡', '火花'].some(k => s.includes(k));
}

function matchesWireframeGeo(prompt) {
  const s = normalizePrompt(prompt);
  return ['线框', 'wireframe', '立方体', 'cube', '几何体', 'torusknot', '莫比乌斯'].some(k => s.includes(k));
}

function matchesDigitalRain(prompt) {
  const s = normalizePrompt(prompt);
  return ['数字雨', '数据流', 'matrix', '矩阵', '黑客', '代码雨'].some(k => s.includes(k));
}

function matchesGlassGeo(prompt) {
  const s = normalizePrompt(prompt);
  const hasMaterial = ['玻璃', '透明', '水晶', 'crystal', 'glass'].some(k => s.includes(k));
  const hasShape = ['球', 'sphere', '二十面体', 'icosa', '几何体', 'geo'].some(k => s.includes(k));
  return hasMaterial && hasShape;
}

function matchesLiquidMetal(prompt) {
  const s = normalizePrompt(prompt);
  return ['液态金属', '金属球', '流体金属', 'liquid metal', 'metal sphere'].some(k => s.includes(k));
}

function extractPromptStyleParams(prompt) {
  const primaryColor = extractPrimaryColor(prompt);
  return {
    primaryColor,
    secondaryColor: extractSecondaryColor(prompt, primaryColor),
    color: primaryColor,
    speed: clamp(extractSpeed(prompt), 0.4, 2.2),
    density: clamp(extractDensity(prompt), 0.6, 1.8),
    glowIntensity: clamp(extractGlowIntensity(prompt), 0.6, 2.0),
    pulseStrength: clamp(extractPulseStrength(prompt), 0.0, 1.0),
    fogStrength: clamp(extractFogStrength(prompt), 0.0, 1.0),
    transparency: clamp(extractTransparency(prompt), 0.05, 0.9),
    metalness: clamp(extractMetalness(prompt), 0.0, 1.0),
    roughness: clamp(extractRoughness(prompt), 0.05, 0.95),
    flowIntensity: clamp(extractFlowIntensity(prompt), 0.0, 1.0),
    scale: 1.0
  };
}

function routePromptToSkeleton(prompt) {
  const params = extractPromptStyleParams(prompt);
  if (matchesEnergyCore(prompt)) {
    return { matched: true, kind: 'energy-core', params, confidence: 0.96 };
  }
  if (matchesDigitalRain(prompt)) {
    return { matched: true, kind: 'digital-rain', params, confidence: 0.95 };
  }
  if (matchesGlassGeo(prompt)) {
    return { matched: true, kind: 'glass-geo', params, confidence: 0.92 };
  }
  if (matchesLiquidMetal(prompt)) {
    return { matched: true, kind: 'liquid-metal', params, confidence: 0.91 };
  }
  if (matchesWireframeGeo(prompt)) {
    return { matched: true, kind: 'wireframe-geo', params, confidence: 0.90 };
  }
  if (matchesParticlesVortex(prompt)) {
    return { matched: true, kind: 'particles-vortex', params, confidence: 0.88 };
  }
  return { matched: false };
}

module.exports = {
  routePromptToSkeleton
};
