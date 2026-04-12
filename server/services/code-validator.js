const fs = require('fs');
const path = require('path');
const { spawnSync } = require('node:child_process');
const config = require('../config');

function basicSyntaxScan(code) {
    if (!code) return 'Code is empty';
    if (!/import\s+.*from\s+['"]three['"]/.test(code) && !/const\s+THREE/.test(code)) return 'Missing Three.js import';
    if (!/export\s+default\s+class\s+EngineEffect/.test(code)) return 'Missing "export default class EngineEffect"';
    if (!/setParam\s*\(/.test(code)) return 'Missing setParam method';
    return null;
}

function checkESMModuleSyntax(code) {
    const src = String(code || '');
    if (!src.trim()) return '代码语法错误：Code is empty';
    const tmpName = `syntax-${Date.now()}-${Math.random().toString(16).slice(2)}.mjs`;
    const tmpPath = path.join(config.TEMP_PREVIEWS_DIR, tmpName);
    try {
        fs.writeFileSync(tmpPath, src, 'utf8');
        const r = spawnSync(process.execPath, ['--check', tmpPath], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
        if (r.status === 0) return null;
        const out = String((r.stderr && r.stderr.trim()) || (r.stdout && r.stdout.trim()) || '').trim();
        const lines = out.split('\n').map(s => s.trim()).filter(Boolean);
        const syntaxLine = lines.find(l => /^SyntaxError:/i.test(l)) || (lines.length ? lines[lines.length - 1] : 'Unknown syntax error');
        return `代码语法错误：${syntaxLine}`;
    } catch (e) {
        return `代码语法错误：${e && e.message ? e.message : String(e)}`;
    } finally {
        try { fs.unlinkSync(tmpPath); } catch (_) {}
    }
}

function findUnsafeCtxHelperUsage(code) {
    const src = String(code || '');
    const methodRe = /\n\s*([A-Za-z_$][\w$]*)\s*\(([^)]*)\)\s*\{([\s\S]*?)\n\s*\}/g;
    const lifecycle = new Set(['constructor', 'onStart', 'onUpdate', 'onResize', 'onDestroy', 'getUIConfig', 'setParam']);
    const keywordNames = new Set(['for', 'if', 'while', 'switch', 'catch']);
    let m;
    while ((m = methodRe.exec(src))) {
        const name = m[1]; const params = m[2] || ''; const body = m[3] || '';
        if (lifecycle.has(name)) continue;
        if (keywordNames.has(name)) continue;
        if (/\bctx\b/.test(params)) continue;
        if (/\bctx\./.test(body)) return name;
    }
    return null;
}

function findVisibleSceneClosureIssue(code) {
    const src = String(code || '');
    const resourceHints = /\bnew THREE\.\w*Geometry\b|\bnew THREE\.\w*Material\b|\bvertexShader\b|\bfragmentShader\b|\buniforms\b/;
    if (!resourceHints.test(src)) return null;
    const renderableCtor = /\bnew THREE\.(Mesh|Points|Line|LineSegments|InstancedMesh|Sprite)\s*\(/;
    const sceneAddMatches = src.match(/\b(?:this\.)?scene\.add\s*\(/g) || [];
    const userSceneAdds = Math.max(0, sceneAddMatches.length - 1);
    if (!renderableCtor.test(src)) return '检测到定义了 Geometry / Material / shader，但没有创建实际可渲染对象（如 new THREE.Mesh / Points / Line），这会导致黑屏。';
    if (userSceneAdds <= 0) return '检测到定义了 Geometry / Material / shader，但没有把实际可见对象加入 scene（缺少 scene.add(...)），这会导致黑屏。';
    return null;
}

function validateEngineEffectCode(code) {
    const err = basicSyntaxScan(code);
    if (err) return err;
    if (!/\bonStart\s*\(/.test(code)) return 'Missing onStart(ctx)';
    if (!/\bonUpdate\s*\(/.test(code)) return 'Missing onUpdate(ctx)';
    const openBraces = (String(code).match(/\{/g) || []).length;
    const closeBraces = (String(code).match(/\}/g) || []).length;
    if (closeBraces < openBraces) return '代码疑似被截断（大括号不闭合）';
    const syntaxErr = checkESMModuleSyntax(code);
    if (syntaxErr) return syntaxErr;
    if (/\bTHREE\.\w+Helper\b/.test(String(code))) return '检测到 Three.js Helper（如 SpotLightHelper / AxesHelper / GridHelper 等）。为避免运行时崩溃与性能问题，禁止使用 Helper 调试对象。';
    if (/\bTHREE\.RoomEnvironment\b/.test(String(code)) || /\bRoomEnvironment\b/.test(String(code))) return '检测到 RoomEnvironment（three/examples 扩展，不在核心 three 模块中）。为避免运行时崩溃（not a constructor），禁止使用 RoomEnvironment。请改用基础灯光 + 深色背景，或直接设置 scene.environment = null。';
    const unsafeCtxHelper = findUnsafeCtxHelperUsage(code);
    if (unsafeCtxHelper) return `检测到辅助方法中直接使用 ctx：${unsafeCtxHelper}()。请改为在 onStart(ctx) 中保存 this.ctx，并在辅助方法里使用 this.ctx；或者调用辅助方法时显式传入 ctx 参数。`;
    const ctor = String(code).match(/\bconstructor\s*\(([^)]*)\)/);
    if (ctor && ctor[1] && ctor[1].trim()) return 'constructor() 不应接收任何参数（外部会以 new EngineEffect() 方式实例化）';
    if (/\bclass\s+ScriptScene\b/.test(code)) return '检测到 ScriptScene（应输出 EngineEffect）';
    if (/\bctx\.renderer\b/.test(code)) return '检测到 ctx.renderer（预览引擎不会注入 renderer，请在 onStart(ctx) 内使用 ctx.canvas/ctx.gl 自行创建 THREE.WebGLRenderer）';
    if (/\brequestAnimationFrame\s*\(/.test(code)) return '检测到 requestAnimationFrame（禁止使用，渲染应由 onUpdate 驱动）';
    const visibleSceneIssue = findVisibleSceneClosureIssue(code);
    if (visibleSceneIssue) return visibleSceneIssue;
    return null;
}

module.exports = { validateEngineEffectCode, basicSyntaxScan, checkESMModuleSyntax, findUnsafeCtxHelperUsage, findVisibleSceneClosureIssue };
