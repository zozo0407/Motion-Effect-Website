let injectedOpenLab = null;
let injectedPrependDemo = null;
let injectedGenerateAIHTML = null;
let injectedGenerateTemplateHTML = null;

const API_BASE = window.location.port === '3000'
    ? '/api'
    : `${window.location.protocol}//${window.location.hostname}:3000/api`;

let currentTemplate = null;
let scriptSceneAutoIndex = 1;

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
    "赛博朋克风格的旋转立方体，带有霓虹发光边缘，背景是流动的数据流，深蓝色调，金属质感。",
    "金色的液体球体在空中漂浮，表面有波纹动画，高光反射，极简主义风格，白色背景。",
    "由成千上万个粒子组成的漩涡，跟随鼠标移动，色彩斑斓，发光效果，具有动感的拖尾。",
    "复古波风格的网格地面，远处的紫色太阳缓缓落下，带有扫描线效果，80年代风格。",
    "透明的水晶材质球体，内部有复杂的几何结构旋转，焦散效果，柔和的光照。"
];

const AI_ENHANCEMENTS = [
    "，高质量渲染，4k分辨率，细节丰富",
    "，具有发光效果，动态模糊，平滑过渡",
    "，使用PBR材质，物理真实感，环境光遮蔽",
    "，极简设计，柔和配色，高级感",
    "，带有交互动画，跟随鼠标位置变化"
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
        const promptField = (config.fields || []).find(f => f.id === 'prompt') || (config.fields || [])[0] || { value: '' };
        container.innerHTML = `
            <div class="space-y-4 h-full flex flex-col">
                <div class="flex justify-between items-center">
                    <div class="text-sm text-gray-400 font-mono uppercase tracking-wider">Prompt / 描述词</div>
                </div>
                <textarea id="input-prompt" class="w-full flex-1 bg-gray-800 text-white text-lg font-mono p-6 rounded-xl border border-white/10 outline-none focus:border-capcut-green resize-none transition-all leading-relaxed" placeholder="描述你想要的特效：主体、材质、运动、背景、配色…">${promptField.value || ''}</textarea>
                
                <div class="flex justify-between items-center pt-2">
                    <div class="text-xs text-gray-500 font-mono">
                        示例：赛博朋克风旋转立方体，霓虹边缘发光...
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

    document.querySelectorAll('.step-content').forEach(el => el.classList.add('hidden'));
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

    const startSimulatedProgress = () => {
        progressInterval = setInterval(() => {
            if (progress < 90) {
                const increment = progress < 30 ? Math.random() * 5 :
                    progress < 60 ? Math.random() * 2 :
                        Math.random() * 0.5;
                progress += increment;
                if (progress > 90) progress = 90;

                if (progressBar) progressBar.style.width = `${progress}%`;
                if (progressText) progressText.innerText = `${Math.floor(progress)}%`;

                if (logs) {
                    if (progress < 20) logs.innerText = '> 正在解析提示词语义并提取关键特征...';
                    else if (progress < 40) logs.innerText = '> 正在构建基础三维场景拓扑结构...';
                    else if (progress < 70) logs.innerText = '> AI 核心正在编写并优化 WebGL 着色器代码...';
                    else if (progress < 85) logs.innerText = '> 正在合成 PBR 材质与全局光照参数...';
                    else logs.innerText = '> 正在校验代码并准备注入 UnifiedRenderer 引擎...';
                }
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
            const __timeoutMs = 180000;
            const __timeoutId = setTimeout(() => {
                __ctrl.abort();
            }, __timeoutMs);
            const res = await fetch(`${API_BASE}/generate-effect?v=2`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: data.prompt }),
                signal: __ctrl.signal
            });
            clearTimeout(__timeoutId);

            const raw = await res.text();
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
            finishProgress();
        } catch (e) {
            const isAbort = e && (e.name === 'AbortError' || /aborted/i.test(String(e.message || '')));
            showCompileError(isAbort ? '生成超时，请重试' : (e && e.message ? e.message : String(e)));
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
