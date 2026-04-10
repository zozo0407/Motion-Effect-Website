function hasOnUpdate(code) {
  return /\bonUpdate\s*\(/.test(String(code || ''));
}

function insertBeforeFirst(code, re, insertion) {
  const s = String(code || '');
  const m = s.match(re);
  if (!m || m.index == null) return null;
  const idx = m.index;
  return s.slice(0, idx) + insertion + s.slice(idx);
}

function insertBeforeLastClassBrace(code, insertion) {
  const s = String(code || '');
  // Heuristic: insert before the last "\n}" which is usually the class closing brace.
  const idx = s.lastIndexOf('\n}');
  if (idx < 0) return null;
  return s.slice(0, idx) + '\n' + insertion + s.slice(idx);
}

function ensureOnUpdateMethod(code) {
  const s = String(code || '');
  if (!s.trim()) return s;
  if (hasOnUpdate(s)) return s;

  const method = `  onUpdate(ctx, time, deltaTime) {
    // auto-injected onUpdate (runtime safety)
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

`;

  // Prefer inserting before onResize/onDestroy/getUIConfig if present, to keep lifecycle order.
  const beforeResize = insertBeforeFirst(s, /\n\s*onResize\s*\(/, '\n' + method);
  if (beforeResize) return beforeResize;

  const beforeDestroy = insertBeforeFirst(s, /\n\s*onDestroy\s*\(/, '\n' + method);
  if (beforeDestroy) return beforeDestroy;

  const beforeUI = insertBeforeFirst(s, /\n\s*getUIConfig\s*\(/, '\n' + method);
  if (beforeUI) return beforeUI;

  const beforeSetParam = insertBeforeFirst(s, /\n\s*setParam\s*\(/, '\n' + method);
  if (beforeSetParam) return beforeSetParam;

  const beforeEnd = insertBeforeLastClassBrace(s, method);
  if (beforeEnd) return beforeEnd;

  // Worst-case: append (should not happen in valid class bodies).
  return s + '\n' + method;
}

function findUnsafeCtxHelperUsage(code) {
  const src = String(code || '');
  const methodRe = /\n\s*([A-Za-z_$][\w$]*)\s*\(([^)]*)\)\s*\{([\s\S]*?)\n\s*\}/g;
  const lifecycle = new Set(['constructor', 'onStart', 'onUpdate', 'onResize', 'onDestroy', 'getUIConfig', 'setParam']);
  let m;
  while ((m = methodRe.exec(src))) {
    const name = m[1];
    const params = m[2] || '';
    const body = m[3] || '';
    if (lifecycle.has(name)) continue;
    if (/\bctx\b/.test(params)) continue;
    if (/\bctx\?*\./.test(body) || /\bctx\s*\[/.test(body)) {
      return name;
    }
  }
  return null;
}

function ensureOnStartSavesCtx(code) {
  const s = String(code || '');
  if (!/\bonStart\s*\(\s*ctx\b/.test(s)) return s;
  if (/\bthis\.ctx\s*=\s*ctx\s*;/.test(s)) return s;

  // Insert `this.ctx = ctx;` right after the opening brace of onStart(ctx) { ... }
  const re = /(\n\s*)onStart\s*\(\s*ctx[^)]*\)\s*\{/;
  const m = s.match(re);
  if (!m || m.index == null) return s;
  const indent = m[1] + '  ';
  return s.replace(re, `$1onStart(ctx) {\n${indent}this.ctx = ctx;`);
}

function rewriteHelperCtxToThisCtx(methodText) {
  // Only rewrite inside helper method bodies (the caller ensures this is not a lifecycle method and has no ctx param).
  return methodText
    .replace(/\bctx\?\./g, 'this.ctx?.')
    .replace(/\bctx\./g, 'this.ctx.')
    .replace(/\bctx\s*\[/g, 'this.ctx[');
}

function fixUnsafeCtxHelperUsage(code) {
  const src = String(code || '');
  const unsafeName = findUnsafeCtxHelperUsage(src);
  if (!unsafeName) return src;

  const methodRe = /\n(\s*)([A-Za-z_$][\w$]*)\s*\(([^)]*)\)\s*\{([\s\S]*?)\n(\s*)\}/g;
  const lifecycle = new Set(['constructor', 'onStart', 'onUpdate', 'onResize', 'onDestroy', 'getUIConfig', 'setParam']);
  let out = src;
  out = ensureOnStartSavesCtx(out);

  // Rewrite helper methods that reference ctx.* without having ctx param.
  out = out.replace(methodRe, (full, leadingIndent, name, params, body, closingIndent) => {
    const p = params || '';
    if (lifecycle.has(name)) return full;
    if (/\bctx\b/.test(p)) return full;
    if (!/\bctx\?*\./.test(body) && !/\bctx\s*\[/.test(body)) return full;
    const rewritten = rewriteHelperCtxToThisCtx(full);
    return rewritten;
  });

  return out;
}

module.exports = {
  ensureOnUpdateMethod,
  fixUnsafeCtxHelperUsage
};
