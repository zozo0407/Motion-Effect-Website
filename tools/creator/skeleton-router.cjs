function clamp(n, a, b) {
  const x = Number(n);
  if (!Number.isFinite(x)) return a;
  return Math.max(a, Math.min(b, x));
}

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

function isParticlesPrompt(prompt) {
  const s = typeof prompt === 'string' ? prompt.toLowerCase() : '';
  const keywords = [
    'particle', 'particles', 'spark', 'sparks', 'nebula',
    '粒子', '星尘', '点云', '爆炸', '喷发', '烟雾', '火花', '尘埃'
  ];
  return keywords.some(k => s.includes(k));
}

function extractSpeed(prompt) {
  const s = typeof prompt === 'string' ? prompt.toLowerCase() : '';
  if (s.includes('slow') || s.includes('缓慢') || s.includes('慢')) return 0.6;
  if (s.includes('fast') || s.includes('快速') || s.includes('快')) return 1.6;
  return 1.0;
}

function extractDensity(prompt) {
  const s = typeof prompt === 'string' ? prompt.toLowerCase() : '';
  if (s.includes('dense') || s.includes('密集') || s.includes('很多')) return 2500;
  if (s.includes('sparse') || s.includes('稀疏') || s.includes('很少')) return 900;
  return 1600;
}

function routePromptToSkeleton(prompt) {
  const color = extractHexColor(prompt) || defaultPalette(prompt);
  if (isParticlesPrompt(prompt)) {
    return {
      kind: 'particles',
      params: {
        color,
        speed: clamp(extractSpeed(prompt), 0.0, 3.0),
        density: Math.floor(clamp(extractDensity(prompt), 300, 4000))
      }
    };
  }
  return {
    kind: 'glow-sphere',
    params: {
      color,
      glowIntensity: 1.2,
      speed: clamp(extractSpeed(prompt), 0.0, 3.0)
    }
  };
}

module.exports = {
  routePromptToSkeleton
};

