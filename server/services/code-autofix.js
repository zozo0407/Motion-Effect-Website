const { ensureOnUpdateMethod, fixUnsafeCtxHelperUsage, fixTimeReferenceOutsideOnUpdate } = require('../../tools/creator/engine-autofix.cjs');

function stripMarkdownCodeFence(text) {
    if (typeof text !== 'string') return '';
    let m = text.match(/```[a-zA-Z0-9_-]*\s*\n([\s\S]*?)\n```/);
    return m ? m[1] : text;
}

function stripModelNonCodePrologue(text) {
    let s = typeof text === 'string' ? text : '';
    s = s.replace(/^\s*<think[\s\S]*?<\/think>\s*/i, '');
    const importMatch = s.match(/^\s*import\s/m);
    const exportMatch = s.match(/^\s*export\s+default\s+class\s+EngineEffect\b/m);
    const importIdx = importMatch ? (importMatch.index || 0) : -1;
    const exportIdx = exportMatch ? (exportMatch.index || 0) : -1;
    const cutIdx = importIdx >= 0 ? importIdx : (exportIdx >= 0 ? exportIdx : 0);
    if (cutIdx > 0) s = s.slice(cutIdx);
    return s.trim();
}

function normalizeThreeNamespaceImport(codeText) {
    const code = typeof codeText === 'string' ? codeText : '';
    if (/import\s+\*\s+as\s+THREE\s+from\s+['"]three['"]\s*;?/m.test(code)) return code;
    const ns = code.match(/import\s+\*\s+as\s+([A-Za-z_$][\w$]*)\s+from\s+['"]three['"]\s*;?/m);
    if (ns) {
        const alias = ns[1];
        let out = code.replace(ns[0], `import * as THREE from 'three';`);
        if (alias !== 'THREE') { const re = new RegExp(`\\b${alias}\\b`, 'g'); out = out.replace(re, 'THREE'); }
        return out;
    }
    const firstImport = code.match(/^\s*import[\s\S]*?;\s*$/m);
    const insert = `import * as THREE from 'three';\n`;
    if (firstImport) { const idx = firstImport.index || 0; return code.slice(0, idx) + insert + code.slice(idx); }
    return insert + code;
}

function normalizeEngineEffectExport(code) {
    if (typeof code !== 'string') return code;
    let s = code;
    if (/export\s+default\s+class\s+EngineEffect\b/.test(s)) return s;
    if (/export\s+default\s+EngineEffect\b/.test(s) && /\bclass\s+EngineEffect\b/.test(s)) {
        s = s.replace(/\bexport\s+default\s+EngineEffect\s*;?\s*/g, '');
        s = s.replace(/\bclass\s+EngineEffect\b/, 'export default class EngineEffect');
        if (/export\s+default\s+class\s+EngineEffect\b/.test(s)) return s;
    }
    s = s.replace(/\bexport\s+class\s+EngineEffect\b/g, 'export default class EngineEffect');
    if (/export\s+default\s+class\s+EngineEffect\b/.test(s)) return s;
    s = s.replace(/(^|\n)\s*class\s+EngineEffect\b/m, '$1export default class EngineEffect');
    return s;
}

function autoFixEngineEffectCode(code) {
    if (typeof code !== 'string' || !code.trim()) return code;
    code = stripModelNonCodePrologue(code);
    code = normalizeThreeNamespaceImport(code);
    code = normalizeEngineEffectExport(code);
    code = fixUnsafeCtxHelperUsage(code);
    code = fixTimeReferenceOutsideOnUpdate(code);
    if (!/export\s+default\s+class\s+EngineEffect/.test(code)) return code;
    if (!/\bonStart\s*\(/.test(code)) {
        code = code.replace(/class\s+EngineEffect\s*(?:extends\s+[^{]+)?\s*\{/, "class EngineEffect {\n    onStart(ctx) {\n        const width = Math.max(1, Math.floor((ctx && (ctx.width || (ctx.size && ctx.size.width))) || 800));\n        const height = Math.max(1, Math.floor((ctx && (ctx.height || (ctx.size && ctx.size.height))) || 600));\n        const dpr = Math.max(1, Math.min(2, (ctx && (ctx.dpr || (ctx.size && ctx.size.dpr))) || 1));\n        this.scene = new THREE.Scene();\n        this.camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 100);\n        this.camera.position.set(0, 0, 6);\n        this.renderer = new THREE.WebGLRenderer({ canvas: ctx && ctx.canvas ? ctx.canvas : undefined, antialias: true });\n        this.renderer.setPixelRatio(dpr);\n        this.renderer.setSize(width, height, false);\n    }");
    }
    if (!/\bonUpdate\s*\(/.test(code)) { code = ensureOnUpdateMethod(code); }
    if (!/\bonResize\s*\(/.test(code)) { code = code.replace(/\n\s*onUpdate\s*\([^)]*\)\s*\{[^}]*\}/, "$&\n    onResize(ctx) {\n    }"); }
    if (!/\bonDestroy\s*\(/.test(code)) { code = code.replace(/\n\s*onResize\s*\([^)]*\)\s*\{[^}]*\}/, "$&\n    onDestroy(ctx) {\n    }"); }
    if (!/\bgetUIConfig\s*\(/.test(code)) { code = code.replace(/\n\s*onDestroy\s*\([^)]*\)\s*\{[^}]*\}/, "$&\n    getUIConfig() {\n        return [];\n    }"); }
    if (/setParam\s*\(/.test(code)) return code;
    const insertion = `\n\n    setParam(key, value) {\n        this.params = this.params || {};\n        this.params[key] = value;\n        if (this.material && this.material.uniforms) {\n            const name = 'u' + String(key || '').charAt(0).toUpperCase() + String(key || '').slice(1);\n            const u = this.material.uniforms[name];\n            if (u && u.value && typeof u.value.set === 'function' && typeof value === 'string') { u.value.set(value); }\n            else if (u && Object.prototype.hasOwnProperty.call(u, 'value')) { u.value = value; }\n        }\n        if (this.material && this.material.color && typeof this.material.color.set === 'function' && typeof value === 'string') { this.material.color.set(value); }\n    }\n`;
    if (/\bonStart\s*\(/.test(code)) { return code.replace(/\n(\s*)onStart\s*\(/, `${insertion}\n$1onStart(`); }
    return code.replace(/\n(\s*)onUpdate\s*\(/, `${insertion}\n$1onUpdate(`);
}

module.exports = { autoFixEngineEffectCode, normalizeEngineEffectExport, normalizeThreeNamespaceImport, stripMarkdownCodeFence, stripModelNonCodePrologue, ensureOnUpdateMethod, fixUnsafeCtxHelperUsage, fixTimeReferenceOutsideOnUpdate };
