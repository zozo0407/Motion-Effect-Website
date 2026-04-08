if (!window.__aiSemantic) {
  window.__aiSemantic = {
    extractor: null,
    loading: null,
    cacheKey: '',
    paramVectors: [],
    paramTexts: [],
    params: [],
  };
}

const AI_TYPE_HINTS = {
  color: ['color', 'col', 'tint', 'hue', 'rgb', '颜色', '色调', '色彩', '饱和', '亮度'],
  speed: ['speed', 'velocity', 'rate', 'tempo', 'flow', '速度', '快慢', '节奏', '频率', '流速'],
  size: ['size', 'scale', 'radius', 'range', 'amplitude', '大小', '尺寸', '半径', '范围', '幅度'],
  intensity: ['intensity', 'strength', 'power', 'bloom', 'glow', '强度', '力度', '光辉', '发光'],
};

const AI_COLOR_MAP = [
  { keys: ['红', 'red'], value: '#ff0000' },
  { keys: ['蓝', 'blue'], value: '#0088ff' },
  { keys: ['绿', 'green'], value: '#00ff66' },
  { keys: ['紫', 'purple', 'violet'], value: '#7a42f4' },
  { keys: ['黄', 'yellow'], value: '#ffd000' },
  { keys: ['白', 'white'], value: '#ffffff' },
  { keys: ['黑', 'black'], value: '#000000' },
];

const AI_INCREASE_WORDS = ['更快', '加速', '快一点', '快些', '增强', '加强', '提高', '变强', '更强', '增加', '变大', '放大', '更大', '更亮', '亮一点'];
const AI_DECREASE_WORDS = ['慢一点', '慢些', '减速', '缓慢', '缓慢一些', '变慢', '降低', '减弱', '变弱', '减少', '变小', '缩小', '更小', '更暗', '暗一点'];

const aiNormalize = (s) => (s || '').toLowerCase();
const aiHasAny = (text, list) => list.some((k) => text.includes(k));

const aiDetectParamType = (param) => {
  const name = aiNormalize(param.name);
  const bind = aiNormalize(param.bind);
  const combined = `${name} ${bind}`;
  if (AI_TYPE_HINTS.color.some((k) => combined.includes(k))) return 'color';
  if (AI_TYPE_HINTS.speed.some((k) => combined.includes(k))) return 'speed';
  if (AI_TYPE_HINTS.size.some((k) => combined.includes(k))) return 'size';
  if (AI_TYPE_HINTS.intensity.some((k) => combined.includes(k))) return 'intensity';
  return 'generic';
};

const aiBuildParamText = (param) => {
  const type = aiDetectParamType(param);
  const base = `${param.name || ''} ${param.bind || ''}`.trim();
  const hints = type === 'generic' ? [] : AI_TYPE_HINTS[type];
  return `${base} ${hints.join(' ')}`.trim();
};

const aiGetExtractor = async () => {
  if (window.__aiSemantic.extractor) return window.__aiSemantic.extractor;
  if (!window.__aiSemantic.loading) {
    window.__aiSemantic.loading = (async () => {
      const mod = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/transformers.min.js');
      const { pipeline, env } = mod;
      env.allowLocalModels = false;
      env.useBrowserCache = true;
      const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
      window.__aiSemantic.extractor = extractor;
      return extractor;
    })();
  }
  return window.__aiSemantic.loading;
};

const aiEmbed = async (extractor, text) => {
  const output = await extractor(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
};

const aiCosine = (a, b) => {
  let sum = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) sum += a[i] * b[i];
  return sum;
};

const aiEnsureParamVectors = async (config) => {
  const key = config.map((p) => `${p.bind || ''}|${p.name || ''}`).join('||');
  if (key === window.__aiSemantic.cacheKey) return;
  const extractor = await aiGetExtractor();
  const texts = config.map(aiBuildParamText);
  const vectors = await Promise.all(texts.map((t) => aiEmbed(extractor, t)));
  window.__aiSemantic.cacheKey = key;
  window.__aiSemantic.paramTexts = texts;
  window.__aiSemantic.paramVectors = vectors;
  window.__aiSemantic.params = config;
};

const aiPickParam = async (config, msg) => {
  const extractor = await aiGetExtractor();
  await aiEnsureParamVectors(config);
  const msgVec = await aiEmbed(extractor, msg);
  let bestIdx = -1;
  let bestScore = -Infinity;
  for (let i = 0; i < config.length; i++) {
    const score = aiCosine(msgVec, window.__aiSemantic.paramVectors[i] || []);
    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }
  return bestIdx >= 0 ? config[bestIdx] : null;
};

const aiDetectIntent = (msg) => {
  const text = aiNormalize(msg);
  let color = null;
  for (const entry of AI_COLOR_MAP) {
    if (aiHasAny(text, entry.keys)) {
      color = entry.value;
      break;
    }
  }
  let direction = 0;
  if (aiHasAny(text, AI_INCREASE_WORDS)) direction = 1;
  if (aiHasAny(text, AI_DECREASE_WORDS)) direction = -1;
  let type = null;
  if (color || text.includes('颜色') || text.includes('色')) type = 'color';
  else if (aiHasAny(text, AI_TYPE_HINTS.speed)) type = 'speed';
  else if (aiHasAny(text, AI_TYPE_HINTS.size)) type = 'size';
  else if (aiHasAny(text, AI_TYPE_HINTS.intensity)) type = 'intensity';
  return { type, direction, color };
};

const aiFilterByType = (config, type) => {
  if (!type) return config;
  return config.filter((p) => aiDetectParamType(p) === type);
};

const aiAdjustNumber = (param, direction) => {
  let val = parseFloat(param.value);
  if (Number.isNaN(val)) return null;
  const min = param.min != null ? parseFloat(param.min) : null;
  const max = param.max != null ? parseFloat(param.max) : null;
  let step = param.step != null ? parseFloat(param.step) : null;
  if (!step || Number.isNaN(step)) {
    const span = max != null && min != null ? max - min : Math.max(Math.abs(val) * 0.2, 0.1);
    step = span * 0.15;
  }
  if (direction === 0) direction = 1;
  val = val + step * direction;
  if (min != null) val = Math.max(min, val);
  if (max != null) val = Math.min(max, val);
  return val;
};

const aiSemanticCommand = async (msg, config) => {
  if (!config.length) return null;
  const intent = aiDetectIntent(msg);
  let candidates = aiFilterByType(config, intent.type);
  if (!candidates.length) candidates = config;
  const param = await aiPickParam(candidates, msg);
  if (!param) return null;
  if (intent.type === 'color' || aiDetectParamType(param) === 'color') {
    const color = intent.color || '#00CAE0';
    return { param, value: color, text: `已将 ${param.name} 调整为 ${color}` };
  }
  const nextVal = aiAdjustNumber(param, intent.direction);
  if (nextVal == null) return null;
  return { param, value: nextVal, text: `已调整 ${param.name} -> ${nextVal.toFixed(2)}` };
};

let initialized = false;

export function initAIChat({ updateDemoParam }) {
  if (initialized) return;
  initialized = true;

  const chatInput = document.getElementById('ai-chat-input');
  if (!chatInput) return;

  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendAIChat({ updateDemoParam });
  });
}

export async function sendAIChat({ updateDemoParam }) {
  const input = document.getElementById('ai-chat-input');
  const history = document.getElementById('ai-chat-history');
  const status = document.getElementById('ai-status');
  if (!input || !history || !status) return;

  const msg = input.value.trim();

  if (!msg) return;

  const userBubble = document.createElement('div');
  userBubble.className = 'flex gap-3 flex-row-reverse';
  userBubble.innerHTML = `
                <div class="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center text-white text-[10px] font-bold">U</div>
                <div class="bg-capcut-green text-black rounded-lg p-3 text-xs leading-relaxed max-w-[85%] font-bold">
                    ${msg}
                </div>
            `;
  history.appendChild(userBubble);
  input.value = '';
  history.scrollTop = history.scrollHeight;

  status.style.opacity = '1';

  await new Promise((r) => setTimeout(r, 1000));

  const config = window.lastUIConfig || [];
  let actionTaken = false;
  let responseText = '抱歉，我不理解这个指令。';

  const lowerMsg = msg.toLowerCase();

  const findParam = (keywords) => {
    return config.find((p) => {
      const name = (p.name || '').toLowerCase();
      const bind = (p.bind || '').toLowerCase();
      return keywords.some((k) => name.includes(k) || bind.includes(k));
    });
  };

  try {
    status.textContent = 'AI 正在理解指令...';
    const semanticResult = await aiSemanticCommand(msg, config);
    if (semanticResult) {
      updateDemoParam(semanticResult.param.bind, semanticResult.value);
      responseText = semanticResult.text || `已调整 ${semanticResult.param.name}`;
      actionTaken = true;
    }
  } catch (e) {
    actionTaken = false;
  }

  if (!actionTaken && (lowerMsg.includes('red') || lowerMsg.includes('红'))) {
    const colorParam = findParam(['color', 'col', 'tint']);
    if (colorParam) {
      updateDemoParam(colorParam.bind, '#ff0000');
      responseText = `已将 ${colorParam.name} 调整为红色。`;
      actionTaken = true;
    }
  } else if (!actionTaken && (lowerMsg.includes('blue') || lowerMsg.includes('蓝'))) {
    const colorParam = findParam(['color', 'col', 'tint']);
    if (colorParam) {
      updateDemoParam(colorParam.bind, '#0088ff');
      responseText = `已将 ${colorParam.name} 调整为蓝色。`;
      actionTaken = true;
    }
  } else if (!actionTaken && (lowerMsg.includes('fast') || lowerMsg.includes('快'))) {
    const speedParam = findParam(['speed', 'velocity', 'rate']);
    if (speedParam) {
      let val = parseFloat(speedParam.value) || 1.0;
      val *= 1.5;
      updateDemoParam(speedParam.bind, val);
      responseText = `已加速 (${speedParam.name} -> ${val.toFixed(2)})`;
      actionTaken = true;
    }
  } else if (!actionTaken && (lowerMsg.includes('slow') || lowerMsg.includes('慢'))) {
    const speedParam = findParam(['speed', 'velocity', 'rate']);
    if (speedParam) {
      let val = parseFloat(speedParam.value) || 1.0;
      val *= 0.6;
      updateDemoParam(speedParam.bind, val);
      responseText = `已减速 (${speedParam.name} -> ${val.toFixed(2)})`;
      actionTaken = true;
    }
  }

  status.style.opacity = '0';

  const aiBubble = document.createElement('div');
  aiBubble.className = 'flex gap-3';
  aiBubble.innerHTML = `
                <div class="w-6 h-6 rounded-full bg-capcut-green flex items-center justify-center text-black text-[10px] font-bold">AI</div>
                <div class="bg-white/10 rounded-lg p-3 text-xs text-gray-300 leading-relaxed max-w-[85%]">
                    ${actionTaken ? responseText : "抱歉，我暂时无法调整该参数。请尝试说 '变红' 或 '变快'。"}
                </div>
            `;
  history.appendChild(aiBubble);
  history.scrollTop = history.scrollHeight;
}
