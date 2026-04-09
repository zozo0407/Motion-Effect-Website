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
    "一个由无数微小发光粒子组成的星系漩涡，粒子随时间缓慢旋转并呈现紫到蓝的渐变色。整体具有深邃的宇宙感，纯靠数学函数驱动粒子的运动与呼吸闪烁。",
    "中心是一个巨大的低多边形（Low-Poly）地形，表面使用线框材质（Wireframe）并散发着荧光绿色的光芒。地形像海浪一样有节奏地起伏，极具复古科幻与赛博朋克感。",
    "一个复杂的嵌套几何体，外层是缓慢旋转的透明玻璃质感二十面体，内层是一个反向旋转的金色发光圆环。场景中带有柔和的点光源照明，让玻璃材质折射出高级的物理光泽。",
    "一条无限延伸的3D光速隧道，由无数个发光圆环组成，镜头仿佛在隧道中高速穿梭。圆环的颜色在红黄蓝之间循环渐变，营造出强烈的视觉冲击力。",
    "一组漂浮在空中的金属质感方块阵列，它们像呼吸一样有节奏地上下浮动。场景使用PBR物理材质，配合主光源和边缘补光，展现出极其细腻的光影对比。",
    "一个梦幻般的莫比乌斯环（TorusKnot），表面覆盖着流动的彩虹色材质。它在屏幕中央优雅地自转，背景纯净，模型表面呈现水波纹般的色彩流动。",
    "无数根细长的霓虹光线在空间中交织，形成一个动态的DNA双螺旋结构。整体色调以青色和洋红为主，给人一种强烈的未来生物科技感。",
    "一个极简的高级感展示台：中心是一个悬浮的哑光纯色球体，下方是一个光滑的镜面底座。顶部有柔和的光源打下，球体投下清晰的阴影，画面纯净、克制。",
    "一个充满科幻感的全息投影地球仪，由成千上万的青色数据点阵构成。球体缓慢自转，表面不时有高亮的数据流划过，背景是极深的暗蓝色。",
    "微观世界下的分形几何体（Mandelbulb），表面覆盖着金属拉丝材质。随着时间的推移，它的形态发生诡异而美丽的扭曲，打着对比强烈的粉蓝双色光。",
    "一个动态的水波纹平面，上面漂浮着几个不同大小的磨砂玻璃球。玻璃球不仅会反射水面的波纹，自身也会随波浪轻轻起伏，营造出一种宁静的禅意。",
    "充满活力的抽象几何流体，像是漂浮在空中的熔岩灯。形态不断地融合与分裂，材质使用高度反光的电镀金属，反射出周围环境的幻彩光芒。",
    "一个复古游戏风格的像素化（Voxel）爱心，它在中心以极富弹性的节奏跳动。材质呈现出8-bit时代的鲜艳色彩，并伴随着轻微的抖动发光特效。",
    "由无数个微小三棱锥排列成的巨大球体外壳，每个三棱锥都在独立地自转。当摄像机缓慢推进时，可以穿过外壳看到内部耀眼的核心光源。",
    "一个充满赛博朋克风的动态均衡器，由多根垂直的发光柱组成。柱子的高度随时间呈波浪状随机起伏，底部是深紫色的网格地面，充满未来电子感。",
    "高级珠宝展示：一枚切割完美的钻石漂浮在空中，缓慢旋转。使用极其逼真的折射材质和环境光映射（HDRI），让钻石折射出令人惊叹的火彩。",
    "一条由发光粒子组成的丝带，像丝绸一样在空中优雅地舞动。粒子的颜色随着轨迹的延伸从暖橙色渐变到冷青色，留下美丽的光轨。",
    "一个巨大的低多边形水晶洞穴，内部有几个发光的水晶簇。摄像机缓慢地在水晶之间穿梭游历，水晶材质半透明且带有神秘的内部自发光。",
    "极具机械感的齿轮传动系统，由多个黄铜和精钢材质的齿轮互相咬合旋转。材质上有细腻的金属划痕，打着温暖的复古钨丝灯光照。",
    "一个由无数白色细线组成的动态声波球，线条像刺猬的刺一样向外延伸并随时间收缩。背景纯黑，线条末端带有微弱的荧光，极简而充满张力。"
];

const AI_ENHANCEMENTS = [
    "，整体采用极简克制的设计风格，背景纯黑，突出主体的高级感。",
    "，请为材质加入线框模式（wireframe）和自发光属性，增强科幻感。",
    "，增加柔和的光影对比与物理材质（PBR），让质感更加真实细腻。",
    "，让摄像机保持缓慢推近或环绕的动态效果，增强沉浸体验。",
    "，颜色采用赛博朋克经典的霓虹粉与青色搭配，充满未来感。"
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
            const __timeoutMs = 240000;
            const __timeoutId = setTimeout(() => {
                __ctrl.abort();
            }, __timeoutMs);
            let res;
            let raw = '';
            try {
                res = await fetch(`${API_BASE}/generate-effect?v=2`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: data.prompt }),
                    signal: __ctrl.signal
                });
                raw = await res.text();
            } finally {
                clearTimeout(__timeoutId);
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
