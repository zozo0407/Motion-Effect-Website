let injectedOpenLab = null;
let injectedPrependDemo = null;
let injectedGenerateAIHTML = null;
let injectedGenerateTemplateHTML = null;

const API_BASE = '/api';

let currentTemplate = null;
let scriptSceneAutoIndex = 1;

import { updateSession } from './session-store.js';

// Tracks the currently running AI generation so we can cancel it when user closes the console.
// This prevents late responses from a previous run from mutating UI after the user re-opens.
let activeGeneration = null;

const templates = {
    'ai-custom': {
        name: 'AI 创意生成',
        fields: [
            { id: 'prompt', label: '创意描述 (Prompt)', type: 'textarea', value: '一个赛博朋克风格的旋转立方体，带有霓虹灯光效，背景是流动的数字雨' }
        ]
    },
    'script-scene': {
        name: 'ScriptScene 导入',
        fields: [
            { id: 'title', label: '作品名称', type: 'text', value: '测试-1' },
            { id: 'sourceContent', label: '脚本文件', type: 'file-read', value: '' }
        ]
    },
    'particles': {
        name: '粒子系统 (Advanced)',
        fields: [
            { id: 'initialShape', label: '初始形状', type: 'select', options: ['sphere', 'tree', 'heart', 'cube'], value: 'sphere' },
            { id: 'color', label: '主色调', type: 'color', value: '#00CAE0' },
            { id: 'speed', label: '流动速度', type: 'range', min: 0.1, max: 5.0, step: 0.1, value: 1.0 },
            { id: 'density', label: '粒子密度', type: 'range', min: 100, max: 5000, step: 100, value: 1000 }
        ]
    },
    'fluid': {
        name: '流体模拟',
        fields: [
            { id: 'color1', label: '颜色 A', type: 'color', value: '#00ff88' },
            { id: 'color2', label: '颜色 B', type: 'color', value: '#0099ff' },
            { id: 'viscosity', label: '粘稠度', type: 'range', min: 0.0, max: 1.0, step: 0.05, value: 0.8 }
        ]
    },
    'text': {
        name: '动态文字',
        fields: [
            { id: 'content', label: '显示内容', type: 'text', value: 'CAPCUT LAB' },
            { id: 'glow', label: '发光强度', type: 'range', min: 0.0, max: 2.0, step: 0.1, value: 1.0 },
            { id: 'shake', label: '抖动幅度', type: 'range', min: 0.0, max: 1.0, step: 0.05, value: 0.1 }
        ]
    },
    'grid': {
        name: '三维网格',
        fields: [
            { id: 'color', label: '网格颜色', type: 'color', value: '#ff00ff' },
            { id: 'bend', label: '弯曲程度', type: 'range', min: -1.0, max: 1.0, step: 0.1, value: 0.2 },
            { id: 'speed', label: '穿梭速度', type: 'range', min: 0.0, max: 10.0, step: 0.5, value: 2.0 }
        ]
    }
};

const AI_RANDOM_PROMPTS = [
    "一个金属质感的球体，使用 MeshStandardMaterial（高金属度、低粗糙度），缓慢自转。两盏不同色温的点光源从对角照射，在曲面上产生流动的高光，背景纯黑。",
    "一组发光的线条（使用 LineSegments），呈现深紫与电蓝的渐变色，缓慢旋转。使用自发光材质 (emissive)，背景纯黑。",
    "一个半透明的发光晶体（使用 MeshPhysicalMaterial 的 transmission 属性），缓慢自转。内部透出柔和的青色光晕，配合一盏点光源从侧面照射，背景纯黑。",
    "一个漆黑的球体，周围环绕着一圈缓慢旋转的发光粒子环（使用 Points），粒子带有紫红渐变色。",
    "深色背景下，一个低多边形平面 (PlaneGeometry) 展现平滑的水面波纹效果，顶点随正弦波起伏。使用 MeshStandardMaterial 配合一盏暖橙色点光源从上方照射，营造静谧氛围。",
    "两个发光的圆环 (Torus)，一个散发青色光晕，一个散发洋红色光晕，以不同速度和轴向交错旋转。使用自发光材质 (emissive)，带 Bloom 泛光。",
    "数百个微小的发光球体（使用 Points 或小球体 Mesh），在纯黑空间中沿缓慢的曲线轨迹漂浮游动。使用自发光材质 (emissive) 呈现柔和的蓝绿色光晕，带 Bloom 泛光。",
    "一个线框模式 (Wireframe) 的二十面体，缓慢匀速旋转，发出锐利的赛博绿光。使用自发光材质 (emissive)，带 Bloom 泛光。",
    "一个完全纯黑的圆盘遮挡住后方强烈的白色点光源，四周溢出夺目的日冕光晕（Bloom）。随着光源微小的位移，光斑在边缘游走。",
    "一排围绕成圆形的垂直发光柱体（使用 CylinderGeometry），高度随正弦波函数平滑起伏，颜色在青到洋红之间渐变，缓慢旋转。使用自发光材质 (emissive)。"
];

const AI_ENHANCEMENTS = [
    "，请确保代码结构极致精简，仅使用 Three.js 内置材质和几何体实现，避免复杂的自定义 Shader。",
    "，整体采用极简克制的设计风格，背景纯黑，突出主体的高级感和光影对比。",
    "，请为材质加入线框模式（wireframe）和自发光属性，增强科幻感。",
    "，增加柔和的灯光系统（环境光+点光源），让物理材质（PBR）的质感更加真实细腻。",
    "，颜色采用赛博朋克经典的霓虹粉与青色搭配，充满未来感，并确保对象正确加入 scene。"
];

export function initWizard({ openLab, prependDemo, generateAIHTML, generateTemplateHTML }) {
    injectedOpenLab = openLab;
    injectedPrependDemo = prependDemo;
    injectedGenerateAIHTML = generateAIHTML;
    injectedGenerateTemplateHTML = generateTemplateHTML;
}

export function openWizard() {
    const consoleModal = document.getElementById('creative-console');
    const panel = document.getElementById('console-panel');

    if (!consoleModal || !panel) return;

    consoleModal.classList.remove('hidden');
    void consoleModal.offsetWidth;

    consoleModal.classList.remove('opacity-0');
    panel.classList.remove('scale-95');
    panel.classList.add('scale-100');

    selectTemplate('ai-custom');
}

export function closeConsole() {
    const consoleModal = document.getElementById('creative-console');
    const panel = document.getElementById('console-panel');

    if (!consoleModal || !panel) return;

    // Hard-cancel any in-flight generation tied to this console session.
    if (activeGeneration) {
        try {
            activeGeneration.closed = true;
            if (activeGeneration.timeoutId) clearTimeout(activeGeneration.timeoutId);
            if (activeGeneration.progressInterval) clearInterval(activeGeneration.progressInterval);
            if (activeGeneration.controller) activeGeneration.controller.abort();
        } catch (_) {
            // best-effort cancel
        } finally {
            activeGeneration = null;
        }
    }

    consoleModal.classList.add('opacity-0');
    panel.classList.remove('scale-100');
    panel.classList.add('scale-95');

    setTimeout(() => {
        consoleModal.classList.add('hidden');
    }, 300);
}

export function fillRandomPrompt() {
    const prompt = AI_RANDOM_PROMPTS[Math.floor(Math.random() * AI_RANDOM_PROMPTS.length)];
    const textarea = document.getElementById('input-prompt');
    if (!textarea) return;
    textarea.value = prompt;
    textarea.dispatchEvent(new Event('input'));
}

export function enhancePrompt() {
    const textarea = document.getElementById('input-prompt');
    if (!textarea) return;
    const current = textarea.value.trim();
    if (!current) {
        alert('请先输入一些关键词！');
        return;
    }
    const enhancement = AI_ENHANCEMENTS[Math.floor(Math.random() * AI_ENHANCEMENTS.length)];
    textarea.value = current + enhancement;
    textarea.dispatchEvent(new Event('input'));
}

export function selectTemplate(type) {
    currentTemplate = type;
    if (type === 'script-scene') {
        const t = templates['script-scene'];
        if (t && Array.isArray(t.fields) && t.fields[0] && t.fields[0].id === 'title') {
            t.fields[0].value = `测试-${scriptSceneAutoIndex}`;
            scriptSceneAutoIndex += 1;
        }
    }

    const sidebar = document.getElementById('wizard-sidebar');
    const content = document.getElementById('wizard-content');
    if (type === 'ai-custom') {
        if (sidebar) {
            sidebar.classList.add('hidden');
            sidebar.style.setProperty('display', 'none', 'important');
        }
        if (content) {
            content.classList.remove('w-2/3');
            content.classList.add('w-full');
            content.style.setProperty('width', '100%', 'important');
        }
    } else {
        if (sidebar) {
            sidebar.classList.remove('hidden');
            sidebar.style.display = '';
        }
        if (content) {
            content.classList.remove('w-full');
            content.style.width = '';
        }
    }

    const config = templates[type];
    if (!config) return;

    const container = document.getElementById('template-config-form');
    if (!container) return;

    if (type === 'ai-custom') {
        const randomPrompt = AI_RANDOM_PROMPTS[Math.floor(Math.random() * AI_RANDOM_PROMPTS.length)];
        const promptField = (config.fields || []).find(f => f.id === 'prompt') || (config.fields || [])[0] || { value: randomPrompt };
        // 动态覆盖默认的硬编码 value
        const initialValue = promptField.value === '一个赛博朋克风格的旋转立方体，带有霓虹灯光效，背景是流动的数字雨' ? randomPrompt : promptField.value;

        container.innerHTML = `
            <div class="space-y-4 h-full flex flex-col">
                <div class="flex justify-between items-center">
                    <div class="text-sm text-gray-400 font-mono uppercase tracking-wider">Prompt / 描述词</div>
                </div>
                <textarea id="input-prompt" class="w-full flex-1 bg-gray-800 text-white text-lg font-mono p-6 rounded-xl border border-white/10 outline-none focus:border-capcut-green resize-none transition-all leading-relaxed" placeholder="描述你想要的特效：主体、材质、运动、背景、配色…">${initialValue}</textarea>
                
                <div class="flex justify-between items-center pt-2">
                    <div class="text-xs text-gray-500 font-mono">
                        <i data-lucide="info" class="w-3 h-3 inline-block mr-1 opacity-60"></i>
                        支持中英文，描述越具体（颜色/材质/运动），效果越好
                    </div>
                    <div class="flex items-center gap-4">
                        <span id="char-count" class="text-xs text-gray-600 font-mono">0 chars</span>
                        <div class="h-4 w-px bg-white/10"></div>
                        <div class="flex gap-2">
                            <button onclick="fillRandomPrompt()" class="text-xs font-medium text-capcut-green hover:text-white transition-colors flex items-center gap-1.5 bg-gray-800/50 hover:bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-700/50 hover:border-capcut-green">
                                <i data-lucide="dice-5" class="w-3.5 h-3.5"></i> 随机灵感
                            </button>
                            <button onclick="enhancePrompt()" class="text-xs font-medium text-purple-400 hover:text-white transition-colors flex items-center gap-1.5 bg-gray-800/50 hover:bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-700/50 hover:border-purple-400">
                                <i data-lucide="sparkles" class="w-3.5 h-3.5"></i> 智能补全
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const ta = document.getElementById('input-prompt');
        const cc = document.getElementById('char-count');
        if (ta && cc) {
            cc.innerText = `${ta.value.length} chars`;
            ta.addEventListener('input', () => cc.innerText = `${ta.value.length} chars`);
        }
        if (window.lucide) window.lucide.createIcons();

        goToStep(2);
        return;
    }

    container.innerHTML = (config.fields || []).map(field => `
        <div class="space-y-2">
            <div class="flex justify-between text-[10px] text-gray-400 font-mono uppercase">
                <span>${field.label}</span>
                <span id="preview-${field.id}">${String(field.value || '').length > 20 ? '...' : field.value}</span>
            </div>
            ${field.type === 'range' ? `
                <input type="range" id="input-${field.id}" min="${field.min}" max="${field.max}" step="${field.step}" value="${field.value}" 
                    class="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-capcut-green"
                    oninput="document.getElementById('preview-${field.id}').innerText = this.value">
            ` : field.type === 'color' ? `
                 <div class="flex gap-2">
                    <input type="color" id="input-${field.id}" value="${field.value}" class="w-full h-8 rounded border border-white/10 bg-black cursor-pointer"
                        oninput="document.getElementById('preview-${field.id}').innerText = this.value">
                 </div>
            ` : field.type === 'select' ? `
                <select id="input-${field.id}" class="w-full bg-gray-800 text-white text-xs font-mono p-3 rounded border border-white/10 outline-none focus:border-capcut-green"
                    onchange="updateConfigPreview(this, '${field.id}')">
                    ${(field.options || []).map(opt => `<option value="${opt}" ${opt === field.value ? 'selected' : ''}>${String(opt).toUpperCase()}</option>`).join('')}
                </select>
            ` : field.type === 'textarea' ? `
                <textarea id="input-${field.id}" class="w-full h-24 bg-gray-800 text-white text-xs font-mono p-3 rounded border border-white/10 outline-none focus:border-capcut-green resize-none"
                    oninput="document.getElementById('preview-${field.id}').innerText = 'Text Input'">${field.value}</textarea>
            ` : field.type === 'password' ? `
                <input type="password" id="input-${field.id}" value="${field.value}" class="w-full bg-gray-800 text-white text-xs font-mono p-3 rounded border border-white/10 outline-none focus:border-capcut-green"
                    oninput="document.getElementById('preview-${field.id}').innerText = '******'">
            ` : field.type === 'file-read' ? `
                <div class="relative">
                    <input type="file" id="file-${field.id}" class="hidden" accept=".js,.txt" 
                        onchange="readWizardFile(this, 'input-${field.id}', 'preview-${field.id}')">
                    <label for="file-${field.id}" class="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white text-xs font-mono p-4 rounded-xl border border-white/10 hover:border-capcut-green cursor-pointer border-dashed transition-all">
                        <i data-lucide="upload" class="w-4 h-4"></i>
                        <span id="label-${field.id}">点击上传脚本文件 (.js)</span>
                    </label>
                    <textarea id="input-${field.id}" class="hidden">${field.value}</textarea>
                </div>
            ` : `
                <input type="text" id="input-${field.id}" value="${field.value}" class="w-full bg-gray-800 text-white text-xs font-mono p-3 rounded border border-white/10 outline-none focus:border-capcut-green"
                    oninput="document.getElementById('preview-${field.id}').innerText = this.value">
            `}
        </div>
    `).join('');

    if (window.lucide) window.lucide.createIcons();
    goToStep(2);
}

export function readWizardFile(input, targetId, previewId) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const target = document.getElementById(targetId);
        if (target) target.value = e.target.result;

        const label = document.getElementById(`label-${input.id.replace('file-', '')}`);
        if (label) label.innerText = file.name;

        const prev = document.getElementById(previewId);
        if (prev) prev.innerText = file.name;
    };
    reader.readAsText(file);
}

export function updateConfigPreview(el, id) {
    const preview = document.getElementById(`preview-${id}`);
    if (preview) preview.innerText = el.value;

    if (id === 'provider') {
        const val = el.value;
        const baseUrl = document.getElementById('input-baseUrl');
        const model = document.getElementById('input-model');
        if (val.includes('OpenAI')) {
            if (baseUrl) baseUrl.value = 'https://api.openai.com/v1';
            if (model) model.value = 'gpt-4o';
        } else if (val.includes('SiliconFlow')) {
            if (baseUrl) baseUrl.value = 'https://api.siliconflow.cn/v1';
            if (model) model.value = 'deepseek-ai/DeepSeek-V3';
        }
        const baseUrlPreview = document.getElementById('preview-baseUrl');
        const modelPreview = document.getElementById('preview-model');
        if (baseUrl && baseUrlPreview) baseUrlPreview.innerText = baseUrl.value;
        if (model && modelPreview) modelPreview.innerText = model.value;
    }
}

export function goToStep(step) {
    document.querySelectorAll('.step-item').forEach(el => {
        const s = parseInt(el.dataset.step);
        if (s === step) {
            el.className = 'step-item active flex items-center gap-3 text-capcut-green';
        } else if (s < step) {
            el.className = 'step-item completed flex items-center gap-3 text-white';
        } else {
            el.className = 'step-item text-gray-600 flex items-center gap-3';
        }
    });

    document.querySelectorAll('.step-content').forEach(el => {
        el.classList.add('hidden');
        el.style.display = '';
    });
    const targetContent = document.getElementById(`step-${step}-content`);
    if (targetContent) {
        targetContent.classList.remove('hidden');
        if (step === 3) {
            targetContent.style.display = 'flex';
        }
    }
}

export async function generateDemo() {
    goToStep(3);
    const logs = document.getElementById('compile-log');
    const loadingContainer = document.getElementById('ai-loading-container');
    const progressBar = document.getElementById('ai-progress-bar');
    const progressText = document.getElementById('ai-progress-text');
    const title = document.getElementById('compile-title');
    const errorContainer = document.getElementById('compile-error-container');
    const errorEl = document.getElementById('compile-error');

    if (loadingContainer) loadingContainer.classList.remove('hidden');
    if (errorContainer) errorContainer.classList.add('hidden');
    if (progressBar) progressBar.style.width = '0%';
    if (progressText) progressText.innerText = '0%';
    if (title) title.textContent = 'AI 引擎正在创作';
    if (logs) logs.innerText = 'Initializing AI core...';

    let progress = 0;
    let progressInterval;
    const sessionId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    const startSimulatedProgress = () => {
        const MAX_WAIT_MS = 90000; // 90 seconds (align with server)
        const startTime = Date.now();

        progressInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const remainingSec = Math.max(0, Math.ceil((MAX_WAIT_MS - elapsed) / 1000));
            const mm = String(Math.floor(remainingSec / 60)).padStart(2, '0');
            const ss = String(remainingSec % 60).padStart(2, '0');
            const countdownStr = `剩余 ${mm}:${ss}（最多 01:30）`;

            if (progress < 90) {
                const increment = progress < 30 ? Math.random() * 5 :
                    progress < 60 ? Math.random() * 2 :
                        Math.random() * 0.5;
                progress += increment;
                if (progress > 90) progress = 90;

                if (progressBar) progressBar.style.width = `${progress}%`;
                if (progressText) progressText.innerText = `${Math.floor(progress)}%`;
            }

            if (logs) {
                if (progress < 20) logs.innerText = `> 正在解析提示词语义并提取关键特征...\n> ${countdownStr}`;
                else if (progress < 40) logs.innerText = `> 正在构建基础三维场景拓扑结构...\n> ${countdownStr}`;
                else if (progress < 70) logs.innerText = `> AI 核心正在编写并优化 WebGL 着色器代码...\n> ${countdownStr}`;
                else if (progress < 85) logs.innerText = `> 正在合成 PBR 材质与全局光照参数...\n> ${countdownStr}`;
                else logs.innerText = `> 正在校验代码并准备注入 UnifiedRenderer 引擎...\n> ${countdownStr}`;
            }
        }, 200);
    };

    const finishProgress = () => {
        clearInterval(progressInterval);
        if (progressBar) progressBar.style.width = '100%';
        if (progressText) progressText.innerText = '100%';
        if (title) title.textContent = '生成完成！';
        if (logs) logs.innerText = '> 编译成功，准备启动渲染...';
    };

    const showCompileError = (message) => {
        clearInterval(progressInterval);
        if (loadingContainer) loadingContainer.classList.add('hidden');
        if (errorContainer) {
            errorContainer.classList.remove('hidden');
            errorContainer.classList.add('flex');
        }
        if (errorEl) errorEl.textContent = message || '未知错误';
    };

    const config = templates[currentTemplate];
    if (!config) {
        showCompileError('请先选择一个模板');
        return;
    }
    const data = {};
    (config.fields || []).forEach(f => {
        const input = document.getElementById(`input-${f.id}`);
        if (input) data[f.id] = input.value;
    });

    let htmlContent;
    startSimulatedProgress();

    if (currentTemplate === 'ai-custom') {
        try {
            const __ctrl = new AbortController();
            const __timeoutMs = 90000; // 90 seconds timeout to match the countdown
            const __timeoutId = setTimeout(() => {
                __ctrl.abort();
            }, __timeoutMs);

            // Register this run as the currently active generation.
            activeGeneration = {
                sessionId,
                controller: __ctrl,
                timeoutId: __timeoutId,
                progressInterval,
                closed: false
            };

            let res;
            let raw = '';
            try {
                res = await fetch(`${API_BASE}/generate-effect-v2`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: data.prompt }),
                    signal: __ctrl.signal
                });
                raw = await res.text();
            } finally {
                clearTimeout(__timeoutId);
            }

            // If the user has closed/re-opened the console, drop stale responses.
            if (!activeGeneration || activeGeneration.sessionId !== sessionId || activeGeneration.closed) {
                return;
            }
            let json = null;
            try { json = JSON.parse(raw); } catch (_) { json = null; }

            if (!res.ok) {
                const msg = (json && json.error) ? json.error : (raw && raw.trim() ? raw.trim() : `HTTP ${res.status}`);
                throw new Error(msg);
            }

            if (!json || typeof json !== 'object') throw new Error('服务返回非 JSON 响应');
            if (json.error) throw new Error(json.error);
            if (!json.code || typeof json.code !== 'string') throw new Error('服务返回缺少 code 字段');
            if (!injectedGenerateAIHTML) throw new Error('generateAIHTML 未初始化');

            htmlContent = injectedGenerateAIHTML(json.code);
            updateSession({
              lastGeneratedPrompt: data.prompt || '',
              lastGeneratedCode: json.code,
              autoHealRetryCount: 0,
              autoHealActive: false
            });
            finishProgress();

            if (json.degraded) {
              const reason = json.degradedReason || 'AI 生成的代码不符合规范';
              setTimeout(() => {
                const shell = document.getElementById('lab-shell');
                if (shell) {
                  const notice = document.createElement('div');
                  notice.className = 'fixed top-4 right-4 z-50 bg-orange-900/90 border border-orange-500/50 rounded-lg p-3 text-xs text-orange-300 max-w-xs shadow-lg';
                  notice.innerHTML = `<div class="font-bold text-orange-400 mb-1">⚠ AI 生成质量不佳</div><div class="text-[11px]">已暂时显示默认效果</div><div class="text-[10px] text-orange-400/60 mt-1">${reason}</div>`;
                  document.body.appendChild(notice);
                  setTimeout(() => { if (notice.parentNode) notice.parentNode.removeChild(notice); }, 8000);
                }
              }, 500);
            }
        } catch (e) {
            const isAbort = e && (e.name === 'AbortError' || /aborted/i.test(String(e.message || '')));
            const errorReason = isAbort ? '生成超时，网络可能拥堵' : (e && e.message ? e.message : String(e));
            
            // Show error state in UI instead of immediately opening fallback
            showCompileError(`AI 生成失败: ${errorReason}\n你可以返回修改提示词，或者使用内置兜底效果。`);
            
            // Add a "Load Backup" button dynamically next to the "Return" button
            const actionsContainer = document.getElementById('compile-actions');
            if (actionsContainer) {
                // Clear any previously injected backup buttons
                const existingBtn = document.getElementById('btn-load-backup');
                if (existingBtn) existingBtn.remove();

                const backupBtn = document.createElement('button');
                backupBtn.id = 'btn-load-backup';
                backupBtn.className = 'ml-4 px-6 py-2 bg-amber-500/20 hover:bg-amber-500/40 text-amber-400 rounded font-mono text-sm transition-colors border border-amber-500/50 hover:border-amber-500';
                backupBtn.innerText = '加载兜底方案';
                backupBtn.onclick = async () => {
                    if (!injectedGenerateAIHTML) return;
                    
                    let fallbackCode = '';
                    try {
                        // Fetch the latest fallback from server to ensure it has all UI interactions
                        const fallbackRes = await fetch(`${API_BASE}/generate-effect-v2`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ prompt: '能量核心' }) // Forces skeleton router to hit energy-core
                        });
                        const fallbackJson = await fallbackRes.json();
                        if (fallbackJson && fallbackJson.code) {
                            fallbackCode = fallbackJson.code;
                        }
                    } catch (err) {
                        console.error('Failed to fetch fallback from server', err);
                    }

                    // Ultimate hardcoded fallback just in case the server fails completely
                    if (!fallbackCode) {
                        fallbackCode = `import * as THREE from 'three';
export default class EngineEffect {
    constructor() {
        this.scene = null; this.camera = null; this.renderer = null; this.group = null;
    }
    onStart(ctx) {
        const width = Math.max(1, Math.floor((ctx && (ctx.width || (ctx.size && ctx.size.width))) || 800));
        const height = Math.max(1, Math.floor((ctx && (ctx.height || (ctx.size && ctx.size.height))) || 600));
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 100);
        this.camera.position.set(0, 0, 6);
        this.renderer = new THREE.WebGLRenderer({ canvas: ctx && ctx.canvas ? ctx.canvas : undefined, antialias: true });
        this.renderer.setSize(width, height, false);
        this.group = new THREE.Group(); this.scene.add(this.group);
        const geo = new THREE.IcosahedronGeometry(1.6, 0);
        const mat = new THREE.MeshStandardMaterial({ color: '#0ea5e9', wireframe: true });
        this.group.add(new THREE.Mesh(geo, mat));
        this.scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    }
    onUpdate(ctx) {
        if (!this.renderer || !this.scene || !this.camera) return;
        if (this.group) {
            this.group.rotation.x += (ctx && ctx.deltaTime ? ctx.deltaTime : 0.016) * 0.5;
            this.group.rotation.y += (ctx && ctx.deltaTime ? ctx.deltaTime : 0.016) * 0.3;
        }
        this.renderer.render(this.scene, this.camera);
    }
    onResize(size) {} onDestroy() {} getUIConfig() { return []; } setParam(key, value) {}
}`;
                    }

                    htmlContent = injectedGenerateAIHTML(fallbackCode);
                    
                    const blob = new Blob([htmlContent], { type: 'text/html' });
                    const url = URL.createObjectURL(blob);
                    const newId = 'GEN-' + Math.floor(Math.random() * 1000);
                    const newDemo = {
                        id: newId,
                        title: 'AI 生成作品 (降级)',
                        enTitle: 'AI Generated Demo (Fallback)',
                        tech: 'UnifiedRenderer / Fallback',
                        category: '测试',
                        subcategory: '生成作品',
                        url: url,
                        color: 'text-amber-500',
                        isOriginal: true,
                        icon: '<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" fill="none" stroke-width="2"/>'
                    };
                    if (injectedPrependDemo) injectedPrependDemo(newDemo);
                    closeConsole();
                    setTimeout(() => {
                        if (injectedOpenLab) injectedOpenLab(url, newDemo.title, newDemo.tech, true);
                    }, 500);
                };
                actionsContainer.appendChild(backupBtn);
            }
            return;
        }
    } else {
        try {
            if (!injectedGenerateTemplateHTML) throw new Error('generateTemplateHTML 未初始化');
            htmlContent = injectedGenerateTemplateHTML(currentTemplate, data);
            finishProgress();
        } catch (e) {
            showCompileError(e && e.message ? e.message : String(e));
            return;
        }
    }

    setTimeout(() => {
        // Drop stale completions if the user closed/re-opened the console.
        if (currentTemplate === 'ai-custom') {
            if (!activeGeneration || activeGeneration.sessionId !== sessionId || activeGeneration.closed) return;
        }
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);

        const newId = 'GEN-' + Math.floor(Math.random() * 1000);
        const isAICustom = currentTemplate === 'ai-custom';
        const newDemo = {
            id: newId,
            title: isAICustom ? 'AI 生成作品' : (data.title || (templates[currentTemplate] ? templates[currentTemplate].name : 'Generated Demo')),
            enTitle: isAICustom ? 'AI Generated Demo' : 'Generated Demo',
            tech: isAICustom ? 'UnifiedRenderer / AI' : 'UnifiedRenderer / Template',
            category: '测试',
            subcategory: isAICustom ? '生成作品' : '实验草稿',
            url: url,
            color: 'text-capcut-green',
            isOriginal: true,
            icon: '<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" fill="none" stroke-width="2"/>'
        };

        if (injectedPrependDemo) injectedPrependDemo(newDemo);

        closeConsole();
        setTimeout(() => {
            if (injectedOpenLab) injectedOpenLab(url, newDemo.title, newDemo.tech, true);
        }, 500);
    }, 800);
}
