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

function parseAIOutput(rawText, options = {}) {
    const stripMarkdown = options.stripMarkdown !== false;
    const cleaned = (stripMarkdown ? stripMarkdownCodeFence(rawText) : String(rawText || '')).trim();

    if (cleaned.includes('---SPLIT---')) {
        const parts = cleaned.split(/---SPLIT---/);
        let setup = (parts[0] || '').trim();
        let animate = (parts[1] || '').trim();
        setup = cleanSnippet(setup);
        animate = cleanSnippet(animate);
        if (setup) return { setup, animate: animate || '' };
    }

    return { setup: cleanSnippet(cleaned), animate: '' };
}

function wrapAsEngineEffect(setupCode, animateCode) {
    const setupLines = String(setupCode || '').split('\n');
    const animateLines = String(animateCode || '').split('\n');

    // IMPORTANT: Do NOT use template literals to embed AI code. Use join() to avoid `${}` / backtick breakage.
    const out = [];
    out.push("import * as THREE from 'three';");
    out.push('');
    out.push('export default class EngineEffect {');
    out.push('  constructor() {');
    out.push('    this.params = {};');
    out.push('    this.scene = null;');
    out.push('    this.camera = null;');
    out.push('    this.renderer = null;');
    out.push('  }');
    out.push('');
    out.push('  getUIConfig() { return []; }');
    out.push('');
    out.push('  setParam(key, value) {');
    out.push('    this.params = this.params || {};');
    out.push('    this.params[key] = value;');
    out.push('    if (this.material && this.material.uniforms) {');
    out.push("      const name = 'u' + String(key || '').charAt(0).toUpperCase() + String(key || '').slice(1);");
    out.push('      const u = this.material.uniforms[name];');
    out.push("      if (u && u.value && typeof u.value.set === 'function' && typeof value === 'string') u.value.set(value);");
    out.push("      else if (u && Object.prototype.hasOwnProperty.call(u, 'value')) u.value = value;");
    out.push('    }');
    out.push("    if (this.material && this.material.color && typeof this.material.color.set === 'function' && typeof value === 'string') this.material.color.set(value);");
    out.push('  }');
    out.push('');
    out.push('  onStart(ctx) {');
    out.push('    const size = (ctx && ctx.size) ? ctx.size : (ctx || {});');
    out.push('    const canvas = ctx && ctx.canvas ? ctx.canvas : undefined;');
    out.push('    const width = Math.max(1, Math.floor(size.width || 1));');
    out.push('    const height = Math.max(1, Math.floor(size.height || 1));');
    out.push('    const dpr = Math.max(1, Math.min(2, Number(size.dpr) || 1));');
    out.push('    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });');
    out.push('    this.renderer.setPixelRatio(dpr);');
    out.push('    this.renderer.setSize(width, height, false);');
    out.push('    this.renderer.outputColorSpace = THREE.SRGBColorSpace;');
    out.push('    this.scene = new THREE.Scene();');
    out.push('    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);');
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
    out.push("    const time = (ctx && typeof ctx.time === 'number') ? ctx.time : 0;");
    out.push("    const deltaTime = (ctx && typeof ctx.deltaTime === 'number') ? ctx.deltaTime : 0.016;");
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

