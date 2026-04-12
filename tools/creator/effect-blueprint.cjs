function stripMarkdownCodeFence(text) {
  const value = typeof text === 'string' ? text.trim() : '';
  if (!value.startsWith('```')) return value;
  return value.replace(/^```[a-zA-Z0-9_-]*\n?/, '').replace(/\n?```$/, '').trim();
}

function normalizeParams(params) {
  if (!Array.isArray(params)) return [];
  return params
    .filter(item => item && typeof item === 'object' && typeof item.bind === 'string')
    .slice(0, 5)
    .map(item => ({
      bind: item.bind,
      name: typeof item.name === 'string' && item.name.trim() ? item.name : item.bind,
      type: item.type === 'color' ? 'color' : 'range',
      value: item.value,
      min: item.min,
      max: item.max,
      step: item.step
    }));
}

function extractFirstJsonObjectString(text) {
  const s = stripMarkdownCodeFence(text);
  const start = s.indexOf('{');
  if (start < 0) return s.trim();
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < s.length; i += 1) {
    const ch = s[i];
    if (inString) {
      if (escape) {
        escape = false;
      } else if (ch === '\\') {
        escape = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === '{') depth += 1;
    if (ch === '}') depth -= 1;
    if (depth === 0) return s.slice(start, i + 1).trim();
  }
  return s.slice(start).trim();
}

function sanitizeJsonLikeNumberLiterals(text) {
  const s = typeof text === 'string' ? text : '';
  let out = '';
  let inString = false;
  let escape = false;

  for (let i = 0; i < s.length; i += 1) {
    const ch = s[i];
    if (inString) {
      out += ch;
      if (escape) {
        escape = false;
      } else if (ch === '\\') {
        escape = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      out += ch;
      continue;
    }

    if (
      ch === '.' &&
      i > 0 &&
      /[0-9]/.test(s[i - 1]) &&
      (i + 1 >= s.length || /[\s,\]}]/.test(s[i + 1]))
    ) {
      out += '.0';
      continue;
    }

    out += ch;
  }

  return out;
}

function parseBlueprintResponse(raw) {
  const parsed = JSON.parse(sanitizeJsonLikeNumberLiterals(extractFirstJsonObjectString(raw)));
  return {
    title: typeof parsed.title === 'string' ? parsed.title : 'Generated Effect',
    summary: typeof parsed.summary === 'string' ? parsed.summary : '',
    palette: Array.isArray(parsed.palette) ? parsed.palette.slice(0, 4) : [],
    scene: parsed.scene && typeof parsed.scene === 'object' ? parsed.scene : {},
    camera: parsed.camera && typeof parsed.camera === 'object' ? parsed.camera : {},
    animation: parsed.animation && typeof parsed.animation === 'object' ? parsed.animation : {},
    params: normalizeParams(parsed.params)
  };
}

function buildBlueprintMessages(prompt) {
  return {
    system: [
      '你是 Three.js 创意导演。',
      '根据用户需求输出一个极简 JSON 蓝图，用于后续代码生成。',
      '只输出 JSON，不要解释，不要 markdown。',
      'JSON 字段必须包含：title, summary, palette, scene, camera, animation, params。',
      'params 最多 5 项，每项包含 bind,name,type,value；range 类型再补 min,max,step。'
    ].join('\n'),
    user: `用户需求：${prompt}`
  };
}

const CODE_COMPLIANCE_CHECKLIST = [
  "第一行必须是 import * as THREE from 'three';",
  '必须输出 export default class EngineEffect。',
  '必须实现 constructor()、onStart(ctx)、onUpdate(ctx)、onResize(ctx)、onDestroy(ctx)、getUIConfig()、setParam(key, value)。',
  '不要假设 ctx.scene、ctx.camera、ctx.renderer 存在；如需这些对象，必须在 onStart(ctx) 内自行创建。',
  '只可安全使用 ctx.canvas 与尺寸信息（ctx.size / ctx.width / ctx.height / ctx.dpr）。',
  '优先使用简洁的几何体/材质/灯光组合，避免复杂后处理（例如 composer/postprocessing 多通道）。',
  '禁止使用 document/window/navigator。',
  '禁止使用 requestAnimationFrame。',
  '禁止使用 ctx.renderer。',
  '禁止创建或挂载 DOM。',
  '必须在 onUpdate(ctx) 中执行 renderer.render(scene, camera)。',
  '必须在 onResize(ctx) 中更新 renderer 尺寸和 camera.aspect。',
  '必须在 onDestroy(ctx) 中释放资源。'
].join('\n');

const REFERENCE_SUMMARY = [
  '参考合规框架摘要（只参考结构，不要照抄视觉参数）：',
  '示例 A：glow sphere',
  "- onStart: new THREE.Scene() / new THREE.PerspectiveCamera(...) / new THREE.WebGLRenderer({ canvas: ctx.canvas })",
  '- onStart: 根据 ctx.width/ctx.height/ctx.dpr 或 ctx.size 设置 renderer 尺寸',
  '- onStart: 创建一个 mesh 作为主体',
  '- onUpdate: 更新旋转或动画，再调用 renderer.render(scene, camera)',
  '- onResize: 更新 renderer 尺寸与 camera.aspect',
  '示例 B：particles',
  '- onStart: 创建 scene/camera/renderer，并初始化粒子 geometry/material',
  '- onUpdate: 更新粒子运动，再调用 renderer.render(scene, camera)',
  '- onResize: 更新 renderer 尺寸与 camera.aspect',
  '务必沿用这些合规结构，但视觉设计、颜色、运动、材质应根据当前用户需求和蓝图重新创作。'
].join('\n');

function buildCodeMessages(prompt, blueprint, contract) {
  const blueprintJson = JSON.stringify(blueprint, null, 2);
  return {
    system: [
      '你是 Three.js/WebGL 工程师。',
      '基于给定蓝图输出可直接运行的 ES Module 纯代码。',
      '不要解释，不要 markdown code fence。',
      '必须满足 EngineEffect 合约。',
      CODE_COMPLIANCE_CHECKLIST,
      contract || ''
    ].filter(Boolean).join('\n\n'),
    user: [
      `用户需求：${prompt}`,
      '蓝图：',
      blueprintJson,
      REFERENCE_SUMMARY
    ].join('\n\n')
  };
}

function defaultBlueprint(prompt) {
  const title = typeof prompt === 'string' && prompt.trim() ? prompt.trim().slice(0, 24) : 'Generated Effect';
  return {
    title,
    summary: 'minimal abstract 3D effect',
    palette: ['#0ea5e9', '#8b5cf6', '#22c55e', '#f97316'],
    scene: { background: '#0a0a1a', fog: true },
    camera: { fov: 55, distance: 5.5 },
    animation: { motion: 'rotate and pulse' },
    params: [
      { bind: 'primaryColor', name: '主色调', type: 'color', value: '#0ea5e9' },
      { bind: 'speed', name: '速度', type: 'range', value: 1.2, min: 0.2, max: 3.0, step: 0.1 },
      { bind: 'intensity', name: '光强', type: 'range', value: 1.4, min: 0.0, max: 4.0, step: 0.1 },
      { bind: 'scale', name: '缩放', type: 'range', value: 1.0, min: 0.2, max: 2.0, step: 0.05 }
    ]
  };
}

module.exports = {
  buildBlueprintMessages,
  buildCodeMessages,
  defaultBlueprint,
  parseBlueprintResponse,
  sanitizeJsonLikeNumberLiterals,
  stripMarkdownCodeFence,
  extractFirstJsonObjectString
};
