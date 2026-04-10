'use strict';

function cleanSnippet(code) {
    // AI 偶发会夹带 import/export/class 等结构行；如果被塞进 onStart/onUpdate 会直接语法炸。
    // 这里做“行级清理”，只移除明显的顶层结构行，尽量不改动真正的逻辑代码。
    return String(code || '')
        .split('\n')
        .filter((line) => {
            const t = String(line || '').trim();
            if (!t) return true;
            if (t.startsWith('```')) return false;
            if (t.startsWith('import ')) return false;
            if (t.startsWith('export default class')) return false;
            if (t.startsWith('export class')) return false;
            if (t.startsWith('class EngineEffect')) return false;
            if (t.startsWith('export default EngineEffect')) return false;
            return true;
        })
        .join('\n')
        .trim();
}

function stripMarkdownCodeFence(text) {
    if (typeof text !== 'string') return '';
    const m = text.match(/```[a-zA-Z0-9_-]*\s*\n([\s\S]*?)\n```/);
    const code = m ? m[1] : text;
    return code;
}

function stripModelNonCodePrologue(text) {
    // Some providers may prepend <think>...</think> or <analysis>...</analysis>.
    // If left in-place, the generated module can fail with "Unexpected token '<'".
    let s = typeof text === 'string' ? text : '';
    s = s.replace(/^\s*<think>[\s\S]*?<\/think>\s*/i, '');
    s = s.replace(/^\s*<analysis>[\s\S]*?<\/analysis>\s*/i, '');
    return s;
}

function validateAndNormalizeUIConfig(raw) {
    const MAX_ITEMS = 6;
    const MAX_SELECT_OPTIONS = 10;
    const bindRe = /^[A-Za-z_][A-Za-z0-9_]{0,31}$/;
    const allowed = new Set(['color', 'range', 'checkbox', 'select']);

    const arr = Array.isArray(raw) ? raw : [];
    const out = [];

    const toNum = (x, d) => {
        const n = typeof x === 'number' ? x : parseFloat(String(x));
        return Number.isFinite(n) ? n : d;
    };

    for (const item of arr) {
        if (!item || typeof item !== 'object') continue;
        const bind = typeof item.bind === 'string' ? item.bind.trim() : '';
        const type = typeof item.type === 'string' ? item.type.trim() : '';
        const name = typeof item.name === 'string' ? item.name.trim() : bind;
        if (!bindRe.test(bind)) continue;
        if (!allowed.has(type)) continue;
        if (!name) continue;

        const normalized = { bind, name, type };

        if (type === 'color') {
            const v = typeof item.value === 'string' ? item.value.trim() : '';
            normalized.value = v && v.startsWith('#') ? v : '#00f2ff';
            out.push(normalized);
        } else if (type === 'checkbox') {
            normalized.value = !!item.value;
            out.push(normalized);
        } else if (type === 'select') {
            const opts = Array.isArray(item.options) ? item.options.filter((x) => typeof x === 'string') : [];
            const options = opts.slice(0, MAX_SELECT_OPTIONS);
            if (!options.length) continue;
            normalized.options = options;
            const v = item.value;
            if (typeof v === 'number' && Number.isFinite(v) && v >= 0 && v < options.length) normalized.value = v;
            else if (typeof v === 'string' && options.includes(v)) normalized.value = v;
            else normalized.value = options[0];
            out.push(normalized);
        } else {
            // range
            let min = toNum(item.min, 0);
            let max = toNum(item.max, 1);
            let step = toNum(item.step, 0.01);
            let value = toNum(item.value, min);
            if (max < min) {
                const t = max;
                max = min;
                min = t;
            }
            if (step <= 0) step = 0.01;
            value = Math.max(min, Math.min(max, value));
            normalized.min = min;
            normalized.max = max;
            normalized.step = step;
            normalized.value = value;
            out.push(normalized);
        }

        if (out.length >= MAX_ITEMS) break;
    }

    return out;
}

function extractJSONArrayFromText(text) {
    const s = typeof text === 'string' ? text : '';
    const start = s.indexOf('[');
    const end = s.lastIndexOf(']');
    if (start < 0 || end < 0 || end <= start) return '';
    return s.slice(start, end + 1);
}

function parseAIOutput(rawText, options = {}) {
    const stripMarkdown = options.stripMarkdown !== false;
    let cleaned = (stripMarkdown ? stripMarkdownCodeFence(rawText) : String(rawText || '')).trim();
    cleaned = stripModelNonCodePrologue(cleaned).trim();

    // Optional UI section: ---UI--- + pure JSON array
    let uiConfig = null;
    if (cleaned.includes('---UI---')) {
        const parts = cleaned.split(/---UI---/);
        cleaned = (parts[0] || '').trim();
        const uiRaw = (parts.slice(1).join('---UI---') || '').trim();
        if (uiRaw) {
            try {
                const parsed = JSON.parse(uiRaw);
                uiConfig = validateAndNormalizeUIConfig(parsed);
            } catch (_) {
                try {
                    const arrText = extractJSONArrayFromText(uiRaw);
                    if (arrText) {
                        const parsed2 = JSON.parse(arrText);
                        uiConfig = validateAndNormalizeUIConfig(parsed2);
                    }
                } catch (_) {
                    uiConfig = [];
                }
            }
        } else {
            uiConfig = [];
        }
    }

    if (cleaned.includes('---SPLIT---')) {
        const parts = cleaned.split(/---SPLIT---/);
        let setup = (parts[0] || '').trim();
        let animate = (parts[1] || '').trim();
        setup = cleanSnippet(setup);
        animate = cleanSnippet(animate);
        if (setup) return { setup, animate: animate || '', uiConfig };
    }

    return { setup: cleanSnippet(cleaned), animate: '', uiConfig };
}

function wrapAsEngineEffect(setupCode, animateCode, uiConfig) {
    const setupLines = String(setupCode || '').split('\n');
    const animateLines = String(animateCode || '').split('\n');
    const safeUIConfig = validateAndNormalizeUIConfig(uiConfig);

    // IMPORTANT: Do NOT use template literals to embed AI code. Use join() to avoid `${}` / backtick breakage.
    const out = [];
    out.push("import * as THREE from 'three';");
    out.push(`const __WRAPPED_UI_CONFIG = ${JSON.stringify(safeUIConfig)};`);
    out.push('');
    out.push('export default class EngineEffect {');
    out.push('  constructor() {');
    // Provide a baseline param set so Lab always has something to control in wrapped_parts mode.
    out.push("    this.params = { color: '#00f2ff', intensity: 1.2, speed: 1.0, scale: 1.0 };");
    out.push('    // Seed defaults from model-provided UI config.');
    out.push('    if (Array.isArray(__WRAPPED_UI_CONFIG)) {');
    out.push('      __WRAPPED_UI_CONFIG.forEach((it) => {');
    out.push('        if (!it || !it.bind) return;');
    out.push('        this.params[it.bind] = it.value;');
    out.push('      });');
    out.push('    }');
    out.push('    this.scene = null;');
    out.push('    this.camera = null;');
    out.push('    this.renderer = null;');
    out.push('  }');
    out.push('');
    out.push('  getUIConfig() {');
    out.push('    if (Array.isArray(__WRAPPED_UI_CONFIG) && __WRAPPED_UI_CONFIG.length) return __WRAPPED_UI_CONFIG;');
    out.push('    const p = this.params || {};');
    out.push('    const color = typeof p.color === "string" && p.color.trim() ? p.color.trim() : "#00f2ff";');
    out.push('    const intensity = Number.isFinite(p.intensity) ? p.intensity : parseFloat(String(p.intensity || 1.2));');
    out.push('    const speed = Number.isFinite(p.speed) ? p.speed : parseFloat(String(p.speed || 1.0));');
    out.push('    const scale = Number.isFinite(p.scale) ? p.scale : parseFloat(String(p.scale || 1.0));');
    out.push('    return [');
    out.push('      { bind: "color", name: "颜色 / Color", type: "color", value: color },');
    out.push('      { bind: "intensity", name: "强度 / Intensity", type: "range", min: 0.1, max: 3.0, step: 0.05, value: Number.isFinite(intensity) ? intensity : 1.2 },');
    out.push('      { bind: "speed", name: "速度 / Speed", type: "range", min: 0.1, max: 5.0, step: 0.05, value: Number.isFinite(speed) ? speed : 1.0 },');
    out.push('      { bind: "scale", name: "缩放 / Scale", type: "range", min: 0.25, max: 2.5, step: 0.05, value: Number.isFinite(scale) ? scale : 1.0 }');
    out.push('    ];');
    out.push('  }');
    out.push('');
    out.push('  setParam(key, value) {');
    out.push('    this.params = this.params || {};');
    out.push('    if (key === "color") {');
    out.push('      const s = String(value || "").trim();');
    out.push('      if (s) this.params.color = s;');
    out.push('    } else {');
    out.push('      const n = (typeof value === "number") ? value : parseFloat(String(value || ""));');
    out.push('      if (Number.isFinite(n)) this.params[key] = n;');
    out.push('    }');
    out.push('    if (this.material && this.material.uniforms) {');
    out.push("      const name = 'u' + String(key || '').charAt(0).toUpperCase() + String(key || '').slice(1);");
    out.push('      const u = this.material.uniforms[name];');
    out.push("      if (u && u.value && typeof u.value.set === 'function' && typeof value === 'string') u.value.set(value);");
    out.push("      else if (u && Object.prototype.hasOwnProperty.call(u, 'value')) u.value = value;");
    out.push('    }');
    out.push("    if (this.material && this.material.color && typeof this.material.color.set === 'function' && typeof value === 'string') this.material.color.set(value);");
    out.push('    // Common convention: if AI uses this.group, apply scale to it.');
    out.push('    if (key === "scale" && this.group && typeof this.group.scale === "object" && typeof this.group.scale.setScalar === "function") {');
    out.push('      const s = Number.isFinite(this.params.scale) ? this.params.scale : parseFloat(String(this.params.scale || 1.0));');
    out.push('      if (Number.isFinite(s)) this.group.scale.setScalar(Math.max(0.25, Math.min(2.5, s)));');
    out.push('    }');
    out.push('  }');
    out.push('');
    out.push('  onStart(ctx) {');
    out.push('    const size = (ctx && ctx.size) ? ctx.size : (ctx || {});');
    out.push('    const canvas = ctx && ctx.canvas ? ctx.canvas : undefined;');
    // Use internal names to avoid collisions if AI declares `const width/height/dpr`.
    out.push('    const __width = Math.max(1, Math.floor(size.width || 1));');
    out.push('    const __height = Math.max(1, Math.floor(size.height || 1));');
    out.push('    const __dpr = Math.max(1, Math.min(2, Number(size.dpr) || 1));');
    out.push('    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });');
    out.push('    this.renderer.setPixelRatio(__dpr);');
    out.push('    this.renderer.setSize(__width, __height, false);');
    out.push('    this.renderer.outputColorSpace = THREE.SRGBColorSpace;');
    out.push('    this.scene = new THREE.Scene();');
    out.push('    this.camera = new THREE.PerspectiveCamera(60, __width / __height, 0.1, 1000);');
    out.push('    this.camera.position.set(0, 0, 5);');
    out.push('    this.scene.add(this.camera);');
    out.push('    const scene = this.scene;');
    out.push('    const camera = this.camera;');
    out.push('    const renderer = this.renderer;');
    out.push('    // ===== AI 生成的 setup 代码 =====');
    for (const line of setupLines) out.push(`    ${line}`);
    out.push('    // ===== setup 结束 =====');
    out.push('  }');
    out.push('');
    out.push('  onUpdate(ctx) {');
    // Multiply time/deltaTime by user-controlled speed to make the UI meaningful for most snippets.
    out.push("    const __rawTime = (ctx && typeof ctx.time === 'number') ? ctx.time : 0;");
    out.push("    const __rawDelta = (ctx && typeof ctx.deltaTime === 'number') ? ctx.deltaTime : 0.016;");
    out.push("    const __speed = (this.params && Number.isFinite(this.params.speed)) ? this.params.speed : parseFloat(String((this.params && this.params.speed) || 1.0));");
    out.push("    const time = __rawTime * (Number.isFinite(__speed) ? __speed : 1.0);");
    out.push("    const deltaTime = __rawDelta * (Number.isFinite(__speed) ? __speed : 1.0);");
    out.push('    // ===== AI 生成的 animate 代码 =====');
    for (const line of animateLines) out.push(`    ${line}`);
    out.push('    // ===== animate 结束 =====');
    out.push('    if (this.renderer && this.scene && this.camera) this.renderer.render(this.scene, this.camera);');
    out.push('  }');
    out.push('');
    out.push('  onResize(size) {');
    out.push('    if (!this.camera || !this.renderer) return;');
    out.push('    const width = Math.max(1, Math.floor(size && size.width ? size.width : 1));');
    out.push('    const height = Math.max(1, Math.floor(size && size.height ? size.height : 1));');
    out.push('    const dpr = Math.max(1, Math.min(2, Number(size && size.dpr) || 1));');
    out.push('    this.camera.aspect = width / height;');
    out.push('    this.camera.updateProjectionMatrix();');
    out.push('    this.renderer.setPixelRatio(dpr);');
    out.push('    this.renderer.setSize(width, height, false);');
    out.push('  }');
    out.push('');
    out.push('  onDestroy() {');
    out.push('    if (this.renderer) this.renderer.dispose();');
    out.push('    if (this.scene) {');
    out.push('      this.scene.traverse(child => {');
    out.push('        if (child.geometry) child.geometry.dispose();');
    out.push('        if (child.material) {');
    out.push('          if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());');
    out.push('          else child.material.dispose();');
    out.push('        }');
    out.push('      });');
    out.push('    }');
    out.push('    this.renderer = null;');
    out.push('    this.scene = null;');
    out.push('    this.camera = null;');
    out.push('  }');
    out.push('}');
    return out.join('\n');
}

module.exports = { cleanSnippet, parseAIOutput, wrapAsEngineEffect };
