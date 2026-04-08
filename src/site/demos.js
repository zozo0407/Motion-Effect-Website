let DEMO_LIST = [];
let isStudioMode = false;

let activeCategory = 'all';
let activeSubCategory = 'all';

const API_BASE = window.location.port === '3000'
    ? '/api'
    : `${window.location.protocol}//${window.location.hostname}:3000/api`;

const CORE_DEMOS_URL = 'my-motion-portfolio/public/data/demos.core.json';
const ALL_DEMOS_URL = 'my-motion-portfolio/public/data/demos.json';

const subCategories = {
    '画面': ['全部', '物理模拟', 'AI识别', '3D特效', '材质纹理'],
    '文字': ['全部', '字符特效'],
    '音频': ['全部'],
    '测试': ['全部', '生成作品', '实验草稿']
};

function updateSearchDropdown() {
    const searchInput = document.getElementById('effect-search');
    if (searchInput && searchInput.value.trim() !== '') {
        searchInput.dispatchEvent(new Event('input'));
    }
}

function generateGridHTML(list) {
    return list.map((demo, index) => `
        <div 
            class="lab-card group relative w-full aspect-[4/3] bg-gray-900/40 rounded-[1.5rem] overflow-hidden border border-white/5 hover:border-white/20 cursor-pointer backdrop-blur-md opacity-0 translate-y-4 animate-fade-in-card" 
            style="animation-delay: ${index * 50}ms" 
            data-url="${demo.url}"
            data-title="${demo.title}"
            data-tech="${demo.tech}"
            data-original="${demo.isOriginal}"
            data-id="${demo.id}"
            draggable="${isStudioMode}"
            ondragstart="handleDragStart(event)"
            ondragend="handleDragEnd(event)"
            ondragover="handleDragOver(event)"
            ondragenter="handleDragEnter(event)"
            ondragleave="handleDragLeave(event)"
            ondrop="handleDrop(event)"
        >
            <div class="absolute inset-0 bg-black/20">
                <div class="scan-line z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div class="absolute top-4 right-4 w-1.5 h-1.5 rounded-full ${index % 3 === 0 ? 'bg-capcut-green' : 'bg-gray-600'} shadow-[0_0_8px_rgba(0,202,224,0.5)] z-30"></div>
                
                ${isStudioMode ? `<div class="absolute top-4 left-4 z-40 flex gap-2" onclick="event.stopPropagation()">
                    <button onclick="deleteDemo('${demo.id}')" class="w-6 h-6 bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white rounded-full flex items-center justify-center border border-red-500/50 transition-colors" title="Delete">
                        ×
                    </button>
                    <button onclick="moveDemo('${demo.id}', -1)" class="w-6 h-6 bg-white/10 hover:bg-white text-white rounded-full flex items-center justify-center border border-white/20 transition-colors" title="Move Left">
                        ←
                    </button>
                    <button onclick="moveDemo('${demo.id}', 1)" class="w-6 h-6 bg-white/10 hover:bg-white text-white rounded-full flex items-center justify-center border border-white/20 transition-colors" title="Move Right">
                        →
                    </button>
                </div>` : ''}

                <div class="absolute inset-0 flex items-center justify-center text-white/30 group-hover:${demo.color} transition-all duration-500 scale-100 group-hover:scale-110 transform">
                    <svg class="w-3/4 h-3/4" viewBox="0 0 200 200" fill="currentColor">
                        ${demo.icon}
                    </svg>
                </div>
            </div>
            
            <div class="absolute inset-0 p-6 flex flex-col justify-between z-10">
                <div class="flex justify-between items-start">
                    <span class="text-[10px] ${demo.color} font-mono uppercase bg-black/50 backdrop-blur-md px-2 py-1 border border-white/10 rounded group-hover:bg-white/10 transition-colors">${demo.id} // ${demo.tech}</span>
                    <div class="flex gap-2 text-[10px] font-mono font-bold uppercase">
                        <span class="${demo.isOriginal ? 'text-white opacity-100' : 'text-gray-600 opacity-30'}">原创</span>
                        <span class="text-gray-600 opacity-30">/</span>
                        <span class="${!demo.isOriginal ? 'text-white opacity-100' : 'text-gray-600 opacity-30'}">搬运</span>
                    </div>
                    <i data-lucide="arrow-up-right" class="w-4 h-4 text-gray-500 group-hover:text-white transition-colors opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300"></i>
                </div>
                
                <div>
                    <h3 class="text-xl font-bold text-white mb-1 group-hover:translate-x-1 transition-transform duration-300">${demo.title}</h3>
                    <p class="text-[10px] text-gray-500 font-mono uppercase group-hover:translate-x-1 transition-transform duration-300 delay-75">${demo.enTitle}</p>
                </div>
            </div>
            
            <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity pointer-events-none"></div>
        </div>
    `).join('');
}

function renderDemoGrid() {
    const grid = document.getElementById('demo-grid');
    if (!grid) return;

    let filteredList = DEMO_LIST;

    if (activeCategory !== 'all') {
        filteredList = filteredList.filter(demo => demo.category === activeCategory);
    } else {
        filteredList = filteredList.filter(demo => demo.category !== '测试');
    }

    if (activeSubCategory !== 'all' && activeSubCategory !== '全部') {
        filteredList = filteredList.filter(demo => demo.subcategory === activeSubCategory);
    }

    grid.innerHTML = generateGridHTML(filteredList);

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function applyDemoList(list) {
    DEMO_LIST = (Array.isArray(list) ? list : []).filter(d => d.id !== '023' && d.id !== '026');
    renderDemoGrid();
    updateSearchDropdown();
}

async function fetchCoreDemos() {
    const res = await fetch(CORE_DEMOS_URL);
    if (!res.ok) throw new Error('Failed to fetch core demos JSON');
    applyDemoList(await res.json());
}

async function fetchAllDemos() {
    try {
        const res = await fetch(`${API_BASE}/demos`);
        if (!res.ok) throw new Error('Failed to fetch from API');
        applyDemoList(await res.json());
    } catch (err) {
        console.warn('Creator Studio Server API offline. Trying static fallback...', err);
        const res = await fetch(ALL_DEMOS_URL);
        if (!res.ok) throw new Error('Failed to fetch static JSON');
        applyDemoList(await res.json());
    }
}

export async function fetchDemos() {
    try {
        if (isStudioMode) {
            await fetchAllDemos();
        } else {
            await fetchCoreDemos();
        }
    } catch (err) {
        console.error('All data sources failed:', err);
    }
}

async function saveDemos(newList) {
    try {
        const res = await fetch(`${API_BASE}/demos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newList)
        });
        if (res.ok) {
            DEMO_LIST = newList.filter(d => d.id !== '023' && d.id !== '026');
            renderDemoGrid();
            updateSearchDropdown();
        }
    } catch (err) {
        console.error('Failed to save', err);
        alert('Save failed: Is server running?');
    }
}

export async function deleteDemo(id) {
    if (!confirm('Delete this demo? This only removes it from the list.')) return;
    const newList = DEMO_LIST.filter(d => d.id !== id && d.id !== '023' && d.id !== '026');
    await saveDemos(newList);
}

let saveTimeout;
const debouncedSave = (newList) => {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        silentSave(newList);
    }, 1000);
};

async function silentSave(newList) {
    try {
        DEMO_LIST = newList;

        const res = await fetch(`${API_BASE}/demos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newList)
        });
        if (!res.ok) console.warn('Silent save failed');
    } catch (err) {
        console.error('Silent save error', err);
    }
}

export async function moveDemo(id, direction) {
    const index = DEMO_LIST.findIndex(d => d.id === id);
    if (index === -1) return;

    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= DEMO_LIST.length) return;

    const currentId = DEMO_LIST[index].id;
    const targetId = DEMO_LIST[newIndex].id;

    const temp = DEMO_LIST[index];
    DEMO_LIST[index] = DEMO_LIST[newIndex];
    DEMO_LIST[newIndex] = temp;

    const grid = document.getElementById('demo-grid');
    const card1 = grid ? grid.querySelector(`[data-id="${currentId}"]`) : null;
    const card2 = grid ? grid.querySelector(`[data-id="${targetId}"]`) : null;

    if (card1 && card2) {
        const parent = card1.parentNode;
        if (direction === 1) {
            parent.insertBefore(card1, card2.nextSibling);
        } else {
            parent.insertBefore(card1, card2);
        }
    } else {
        renderDemoGrid();
    }

    debouncedSave(DEMO_LIST);
}

export function toggleStudioMode() {
    isStudioMode = !isStudioMode;
    const btn = document.getElementById('studio-mode-btn');
    const indicator = document.getElementById('studio-indicator');
    const createBtn = document.getElementById('create-demo-btn');

    if (isStudioMode) {
        if (btn) {
            btn.classList.add('text-capcut-green', 'border-capcut-green');
            btn.innerText = '[ 工作室模式：开启 ]';
        }
        if (indicator) indicator.classList.remove('hidden');
        if (createBtn) createBtn.classList.remove('hidden');
        document.body.classList.add('studio-mode');
    } else {
        if (btn) {
            btn.classList.remove('text-capcut-green', 'border-capcut-green');
            btn.innerText = '工作室模式';
        }
        if (indicator) indicator.classList.add('hidden');
        if (createBtn) createBtn.classList.add('hidden');
        document.body.classList.remove('studio-mode');
    }
    fetchDemos();
}

let draggedItem = null;

export function handleDragStart(e) {
    if (!isStudioMode) {
        e.preventDefault();
        return;
    }
    draggedItem = e.currentTarget;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', e.currentTarget.dataset.id);
    setTimeout(() => e.currentTarget.classList.add('opacity-50'), 0);
}

export function handleDragEnd(e) {
    e.currentTarget.classList.remove('opacity-50');
    draggedItem = null;

    document.querySelectorAll('.lab-card').forEach(item => {
        item.classList.remove('border-capcut-green', 'border-dashed');
    });
}

export function handleDragOver(e) {
    if (isStudioMode) {
        e.preventDefault();
    }
    return false;
}

export function handleDragEnter(e) {
    if (!isStudioMode) return;
    const card = e.currentTarget;
    if (card !== draggedItem) {
        card.classList.add('border-capcut-green', 'border-dashed');
    }
}

export function handleDragLeave(e) {
    e.currentTarget.classList.remove('border-capcut-green', 'border-dashed');
}

export function handleDrop(e) {
    e.stopPropagation();
    e.preventDefault();

    if (!isStudioMode) return false;

    const target = e.currentTarget;
    target.classList.remove('border-capcut-green', 'border-dashed');

    if (draggedItem !== target && draggedItem !== null) {
        const grid = document.getElementById('demo-grid');
        const allItems = grid ? [...grid.querySelectorAll('.lab-card')] : [];
        const draggedIdx = allItems.indexOf(draggedItem);
        const targetIdx = allItems.indexOf(target);

        if (draggedIdx === -1 || targetIdx === -1) return;

        if (draggedIdx < targetIdx) {
            target.after(draggedItem);
        } else {
            target.before(draggedItem);
        }

        const draggedId = draggedItem.dataset.id;
        const targetId = target.dataset.id;

        const listDraggedIdx = DEMO_LIST.findIndex(d => d.id === draggedId);

        if (listDraggedIdx !== -1) {
            const itemToMove = DEMO_LIST[listDraggedIdx];
            DEMO_LIST.splice(listDraggedIdx, 1);

            const listTargetIdx = DEMO_LIST.findIndex(d => d.id === targetId);

            if (draggedIdx < targetIdx) {
                DEMO_LIST.splice(listTargetIdx + 1, 0, itemToMove);
            } else {
                DEMO_LIST.splice(listTargetIdx, 0, itemToMove);
            }

            debouncedSave(DEMO_LIST);
        }
    }
    return false;
}

export function initGridInteractions({ openLab }) {
    const grid = document.getElementById('demo-grid');
    if (!grid) return;

    grid.addEventListener('click', (e) => {
        const card = e.target.closest('.lab-card');
        if (!card || e.target.closest('button') || e.target.closest('a')) return;

        const url = card.dataset.url;
        const title = card.dataset.title;
        const tech = card.dataset.tech;

        let isOriginal = true;
        if (card.dataset.original === 'false') isOriginal = false;

        if (url && url !== 'undefined') {
            openLab(url, title, tech, isOriginal);
        }
    });
}

export function initFilters() {
    const mainFilter = document.getElementById('main-filter');
    const subFilter = document.getElementById('sub-filter');

    if (!mainFilter || !subFilter) return;

    mainFilter.addEventListener('click', (e) => {
        if (e.target.tagName !== 'BUTTON') return;

        document.querySelectorAll('.filter-cat').forEach(b => {
            b.classList.remove('active', 'bg-white', 'text-black');
            b.classList.add('bg-transparent', 'text-gray-500', 'border-transparent');
        });
        e.target.classList.add('active', 'bg-white', 'text-black');
        e.target.classList.remove('bg-transparent', 'text-gray-500', 'border-transparent');

        const cat = e.target.dataset.cat;
        activeCategory = cat;
        activeSubCategory = 'all';

        if (cat === 'all') {
            subFilter.innerHTML = '';
            renderDemoGrid();
        } else {
            const subs = subCategories[cat] || [];
            subFilter.innerHTML = subs.map(sub => `
                <button class="sub-filter-btn px-4 py-1.5 rounded-full text-xs font-mono uppercase transition-all border border-white/10 ${sub === '全部' ? 'bg-capcut-green text-black font-bold border-capcut-green' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}" data-sub="${sub}">
                    ${sub}
                </button>
            `).join('');

            renderDemoGrid();
        }
    });

    subFilter.addEventListener('click', (e) => {
        if (e.target.tagName !== 'BUTTON') return;

        document.querySelectorAll('.sub-filter-btn').forEach(b => {
            b.classList.remove('bg-capcut-green', 'text-black', 'font-bold', 'border-capcut-green');
            b.classList.add('bg-white/5', 'text-gray-400', 'border-white/10');
        });
        e.target.classList.add('bg-capcut-green', 'text-black', 'font-bold', 'border-capcut-green');
        e.target.classList.remove('bg-white/5', 'text-gray-400', 'border-white/10');

        activeSubCategory = e.target.dataset.sub;
        renderDemoGrid();
    });
}

function filterResults(term) {
    if (!term) return [];
    return DEMO_LIST.filter(demo =>
        (demo.title || '').toLowerCase().includes(term) ||
        (demo.enTitle || '').toLowerCase().includes(term) ||
        (demo.tech || '').toLowerCase().includes(term) ||
        (demo.id || '').toLowerCase().includes(term) ||
        (demo.keywords && String(demo.keywords).toLowerCase().includes(term))
    );
}

export function selectSearchResultFactory({ openLab }) {
    return (id) => {
        const demo = DEMO_LIST.find(d => d.id === id);
        if (!demo) return;

        openLab(demo.url, demo.title, demo.tech, demo.isOriginal);

        const searchDropdown = document.getElementById('search-dropdown');
        if (searchDropdown) {
            searchDropdown.classList.add('hidden');
            searchDropdown.classList.remove('flex');
        }
    };
}

export function initSearch({ openLab }) {
    const searchInput = document.getElementById('effect-search');
    const searchDropdown = document.getElementById('search-dropdown');

    if (!searchInput || !searchDropdown) return;

    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase().trim();
        const grid = document.getElementById('demo-grid');
        if (!grid) return;

        if (!term) {
            renderDemoGrid();
            searchDropdown.classList.add('hidden');
            searchDropdown.classList.remove('flex');
            return;
        }

        const filtered = filterResults(term);
        grid.innerHTML = generateGridHTML(filtered);
        if (typeof lucide !== 'undefined') lucide.createIcons();

        if (filtered.length > 0) {
            searchDropdown.innerHTML = filtered.map(demo => `
                <div class="px-4 py-3 border-b border-white/5 hover:bg-white/10 cursor-pointer transition-colors flex items-center justify-between group" onclick="selectSearchResult('${demo.id}')">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded bg-white/5 flex items-center justify-center text-white/50 group-hover:text-white group-hover:scale-110 transition-all">
                            <svg class="w-4 h-4" viewBox="0 0 200 200" fill="currentColor">${demo.icon}</svg>
                        </div>
                        <div>
                            <div class="text-xs font-bold text-white group-hover:text-capcut-green transition-colors">${demo.title}</div>
                            <div class="text-[10px] text-gray-500 font-mono">${demo.enTitle}</div>
                        </div>
                    </div>
                    <span class="text-[10px] font-mono text-gray-600 group-hover:text-white transition-colors">${demo.tech}</span>
                </div>
            `).join('');
            searchDropdown.classList.remove('hidden');
            searchDropdown.classList.add('flex');
        } else {
            searchDropdown.innerHTML = `<div class="px-4 py-3 text-[10px] text-gray-500 font-mono text-center">NO RESULTS FOUND / 未找到结果</div>`;
            searchDropdown.classList.remove('hidden');
            searchDropdown.classList.add('flex');
        }
    });

    searchInput.addEventListener('focus', () => {
        if (searchInput.value.trim().length > 0) {
            searchDropdown.classList.remove('hidden');
            searchDropdown.classList.add('flex');
        }
    });

    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
            searchDropdown.classList.add('hidden');
            searchDropdown.classList.remove('flex');
        }
    });
}

export function sortSwitchButtons() {
    const containers = document.querySelectorAll('.mt-4.pt-4.border-t.border-white\\/10 .space-y-2');
    if (!containers || containers.length < 2) return;
    const list = containers[1];
    const buttons = Array.from(list.querySelectorAll('button'));
    if (buttons.length === 0) return;
    const sorted = buttons.sort((a, b) => {
        const getNum = (btn) => {
            const on = btn.getAttribute('onclick') || '';
            const m = on.match(/demo(\d+)\.html/);
            return m ? parseInt(m[1], 10) : 0;
        };
        return getNum(a) - getNum(b);
    });
    list.innerHTML = '';
    sorted.forEach(btn => list.appendChild(btn));
}

export function prependDemo(demo) {
    if (!demo) return;
    DEMO_LIST.unshift(demo);
    renderDemoGrid();
    updateSearchDropdown();
}
