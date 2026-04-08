let initialized = false;

let labView = null;
let contentFrame = null;
let loader = null;
let labUITopRight = null;
let globalCodeBtn = null;

let workbench = null;
let workbenchMonaco = null;
let workbenchRunBtn = null;
let workbenchCloseBtn = null;
let workbenchResize = null;

let monacoInstance = null;
let monacoLoaderPromise = null;

let isResizing = false;
let isRecording = false;

let messageHandler = null;

function syncGlobalCodeBtn() {
  if (!globalCodeBtn || !labUITopRight) return;
  const hasUnifiedCode = labUITopRight.querySelector('#unified-code-btn');
  globalCodeBtn.style.display = hasUnifiedCode ? 'none' : 'inline-flex';
}

function loadMonaco() {
  if (window.monaco) return Promise.resolve();
  if (!monacoLoaderPromise) {
    monacoLoaderPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs/loader.min.js';
      script.onload = () => {
        if (typeof require === 'function') {
          require.config({
            paths: {
              vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs',
            },
          });
          require(['vs/editor/editor.main'], () => {
            resolve();
          });
        } else {
          reject(new Error('Monaco loader unavailable'));
        }
      };
      script.onerror = () => reject(new Error('Failed to load Monaco loader'));
      document.head.appendChild(script);
    });
  }
  return monacoLoaderPromise;
}

async function openWorkbench() {
  if (!contentFrame || !contentFrame.src || !workbench || !workbenchMonaco) return;

  workbench.classList.remove('hidden');
  requestAnimationFrame(() => {
    workbench.style.transform = 'translateX(0)';
  });

  const src = new URL(contentFrame.src, window.location.href);
  try {
    const res = await fetch(src.href, { cache: 'no-store' });
    const text = await res.text();

    await loadMonaco();

    if (!monacoInstance) {
      monacoInstance = monaco.editor.create(workbenchMonaco, {
        value: text,
        language: 'html',
        theme: 'vs-dark',
        minimap: { enabled: false },
        fontSize: 13,
        automaticLayout: true,
        readOnly: true,
      });
    } else {
      monacoInstance.setValue(text);
    }
  } catch (e) {
    console.error('Failed to load code:', e);
    workbenchMonaco.innerText = 'Error loading source code.';
  }
}

function closeWorkbench() {
  if (!workbench) return;
  workbench.style.transform = 'translateX(100%)';
  setTimeout(() => {
    workbench.classList.add('hidden');
  }, 300);
}

function toMinigameGameJS(code) {
  const src = typeof code === 'string' ? code : '';
  if (src.includes('tt.createCanvas') || src.includes('tt.getSystemInfoSync')) return src;
  const stripped = src.replace(/^\s*import\s+[\s\S]*?;?\s*$/gm, '').trim();
  if (stripped === '') return stripped;
  const template = `const systemInfo = tt.getSystemInfoSync();
const screenWidth = systemInfo.screenWidth;
const screenHeight = systemInfo.screenHeight;
const pixelRatio = systemInfo.pixelRatio;
const canvas = tt.createCanvas();
canvas.width = screenWidth * pixelRatio;
canvas.height = screenHeight * pixelRatio;
const ctx = canvas.getContext('2d');
ctx.scale(pixelRatio, pixelRatio);
const requestAnimationFrame = globalThis.requestAnimationFrame || ((cb) => setTimeout(() => cb(Date.now()), 16));
const cancelAnimationFrame = globalThis.cancelAnimationFrame || ((id) => clearTimeout(id));
const document = {
  createElement: () => canvas,
  body: { appendChild() {}, removeChild() {} },
  documentElement: { style: { setProperty() {} } },
  querySelector: () => null,
  querySelectorAll: () => [],
};
const window = globalThis;
(function () {
${stripped}
})();`;
  return template;
}

function sanitizeExportPrefix(prefix) {
  const raw = typeof prefix === 'string' ? prefix : '';
  const cleaned = raw.trim().replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '');
  return cleaned.slice(0, 40);
}

export function openExportSettings() {
  const current = localStorage.getItem('exportFilePrefix') || '';
  const next = window.prompt('导出文件名前缀（可留空）', current);
  if (next === null) return;
  const prefix = sanitizeExportPrefix(next);
  if (prefix) {
    localStorage.setItem('exportFilePrefix', prefix);
  } else {
    localStorage.removeItem('exportFilePrefix');
  }
}

export function updateDemoParam(key, value) {
  if (!contentFrame || !contentFrame.contentWindow) return;
  let finalVal = value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed !== '' && !isNaN(trimmed) && !value.startsWith('#')) {
      finalVal = parseFloat(trimmed);
    }
  }
  contentFrame.contentWindow.postMessage(
    {
      type: 'UPDATE_PARAM',
      key: key,
      value: finalVal,
    },
    '*',
  );
}

export function triggerSaveImage() {
  if (!contentFrame || !contentFrame.contentWindow) return;
  contentFrame.contentWindow.postMessage({ type: 'SAVE_IMAGE' }, '*');
}

export function triggerExportScriptScene() {
  if (!contentFrame || !contentFrame.contentWindow) return;
  contentFrame.contentWindow.postMessage({ type: 'EXPORT_SCRIPT_SCENE' }, '*');
}

export function triggerExportGameJS() {
  if (!contentFrame || !contentFrame.contentWindow) return;
  contentFrame.contentWindow.postMessage({ type: 'REQUEST_GAME_JS_SOURCE' }, '*');
}

export function toggleRecording() {
  if (!contentFrame || !contentFrame.contentWindow) return;
  const btn = document.getElementById('rec-btn');
  const txt = document.getElementById('rec-text');
  if (!btn || !txt) return;

  if (!isRecording) {
    contentFrame.contentWindow.postMessage({ type: 'START_REC' }, '*');
    isRecording = true;
    txt.textContent = '停止 (REC)';
    btn.classList.add('bg-red-500', 'text-white');
    btn.classList.remove('bg-gray-800', 'border-white/10');
    return;
  }

  contentFrame.contentWindow.postMessage({ type: 'STOP_REC' }, '*');
  isRecording = false;
  txt.textContent = '录制';
  btn.classList.remove('bg-red-500', 'text-white');
  btn.classList.add('bg-gray-800', 'border-white/10');
}

export function resetDemo() {
  const cfg = window.lastUIConfig || [];
  if (!cfg.length) return;
  cfg.forEach((item) => {
    const el = document.querySelector(`[data-bind="${item.bind}"]`);
    if (!el) return;
    if (item.type === 'color') {
      el.value = item.value;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      return;
    }
    if (item.type === 'checkbox') {
      el.checked = !!item.value;
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return;
    }
    if (item.type === 'select') {
      let val = item.value;
      if (typeof val === 'number' && Array.isArray(item.options)) {
        val = item.options[val];
      }
      el.value = val;
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return;
    }
    el.value = item.value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

export function openLab(url, title, tag, isOriginal = true) {
  initLab();
  if (!labView || !contentFrame || !loader) return;

  labView.classList.remove('hidden');
  gsap.to(labView, { opacity: 1, duration: 0.3 });
  syncGlobalCodeBtn();

  const titleEl = document.getElementById('lab-title');
  if (titleEl) titleEl.textContent = `${tag} // ${title}`;

  const leftPanel = document.getElementById('lab-left-panel');
  if (leftPanel) {
    const hiddenDemos = [
      'demo11.html',
      'demo19.html',
      'demo22.html',
      'demo23.html',
      'demo24.html',
      'demo25.html',
      'demo26.html',
      'demo_liquid_orb.html',
    ];
    const isScriptScene = typeof tag === 'string' && tag.toLowerCase().includes('scriptscene');
    const isHidden = !isScriptScene && hiddenDemos.some((d) => url.includes(d));
    if (isHidden) leftPanel.classList.add('hidden');
    else leftPanel.classList.remove('hidden');
  }

  const originalSpan = document.getElementById('lab-status-original');
  const copySpan = document.getElementById('lab-status-copy');
  if (originalSpan && copySpan) {
    if (isOriginal) {
      originalSpan.className = 'text-white opacity-100';
      copySpan.className = 'text-gray-600 opacity-30';
    } else {
      originalSpan.className = 'text-gray-600 opacity-30';
      copySpan.className = 'text-white opacity-100';
    }
  }

  loader.classList.remove('opacity-0');

  const dynamicControls = document.getElementById('dynamic-controls');
  if (dynamicControls)
    dynamicControls.innerHTML =
      '<div class="text-[10px] text-gray-500 font-mono animate-pulse">Initializing Interface...</div>';

  const aspectSelect = document.getElementById('aspect-select');
  if (aspectSelect) {
    aspectSelect.value = 'full';
    aspectSelect.dispatchEvent(new Event('change'));
  }

  document.querySelectorAll('input[type="range"]').forEach((input) => {
    const oninput = input.getAttribute('oninput') || '';
    if (oninput.includes('param1')) input.value = 50;
    if (oninput.includes('param2')) input.value = 100;
    if (oninput.includes('param3')) input.value = 100;
    input.dispatchEvent(new Event('input'));
  });

  contentFrame.onload = () => {
    setTimeout(() => {
      loader.classList.add('opacity-0');
      if (contentFrame.contentWindow) {
        contentFrame.contentWindow.postMessage({ type: 'HANDSHAKE' }, '*');
      }
    }, 300);

    setTimeout(() => {
      try {
        const doc = contentFrame.contentDocument;
        const win = doc && doc.defaultView;
        if (doc && win && !win.__capcutShimLoaded) {
          const shim = doc.createElement('script');
          shim.type = 'text/javascript';
          shim.text =
            "if(!window.__capcutShimLoaded){window.__capcutShimLoaded=true;var __recorder=null;var __chunks=[];window.addEventListener('message',function(e){var d=e.data;if(!d||!d.type)return;var canvas=document.querySelector('canvas');if(d.type==='SAVE_IMAGE'){if(canvas){try{var url=canvas.toDataURL('image/png');parent.postMessage({type:'IMAGE_DATA',dataUrl:url},'*');}catch(err){parent.postMessage({type:'REC_ERROR',message:'Screenshot failed'},'*');}}else{parent.postMessage({type:'REC_ERROR',message:'No canvas found'},'*');}}if(d.type==='START_REC'){if(canvas&&typeof MediaRecorder!=='undefined'){try{var stream=canvas.captureStream(30);var mt='video/mp4;codecs=h264';if(!MediaRecorder.isTypeSupported(mt)){mt='video/webm;codecs=vp9';if(!MediaRecorder.isTypeSupported(mt)){mt='video/webm;codecs=vp8';if(!MediaRecorder.isTypeSupported(mt)){mt='video/webm';if(!MediaRecorder.isTypeSupported(mt)){mt='video/mp4';}}}}try{__recorder=new MediaRecorder(stream,{mimeType:mt});}catch(_){__recorder=new MediaRecorder(stream);}__chunks=[];__recorder.ondataavailable=function(ev){if(ev.data.size>0)__chunks.push(ev.data);};__recorder.onstop=function(){var blob=new Blob(__chunks,{type:(__recorder.mimeType||'video/webm')});parent.postMessage({type:'REC_BLOB',blob:blob,mimeType:(__recorder.mimeType||'video/webm')},'*');};__recorder.start();parent.postMessage({type:'REC_STARTED'},'*');}catch(err){parent.postMessage({type:'REC_ERROR',message:'Recorder start failed'},'*');}}else{parent.postMessage({type:'REC_ERROR',message:'MediaRecorder not supported or no canvas'},'*');}}if(d.type==='STOP_REC'){if(__recorder&&__recorder.state!=='inactive'){__recorder.stop();}}});}";
          doc.body.appendChild(shim);
        }
      } catch (_) {}
    }, 1000);

    setTimeout(() => {
      syncGlobalCodeBtn();
    }, 400);
  };

  contentFrame.src = url;
}

export function closeLab() {
  initLab();
  if (!labView || !contentFrame) return;
  gsap.to(labView, {
    opacity: 0,
    duration: 0.3,
    onComplete: () => {
      labView.classList.add('hidden');
      contentFrame.src = '';
      closeWorkbench();
    },
  });
}

export function initLab() {
  if (initialized) return;
  initialized = true;

  labView = document.getElementById('lab-view');
  contentFrame = document.getElementById('content-frame');
  loader = document.getElementById('loader');
  labUITopRight = document.getElementById('lab-ui-top-right');
  globalCodeBtn = document.getElementById('global-code-btn');

  workbench = document.getElementById('global-workbench');
  workbenchMonaco = document.getElementById('workbench-monaco');
  workbenchRunBtn = document.getElementById('workbench-run-btn');
  workbenchCloseBtn = document.getElementById('workbench-close-btn');
  workbenchResize = document.getElementById('workbench-resize');

  if (globalCodeBtn) globalCodeBtn.addEventListener('click', openWorkbench);
  if (workbenchCloseBtn) workbenchCloseBtn.addEventListener('click', closeWorkbench);

  if (workbenchRunBtn) {
    workbenchRunBtn.addEventListener('click', () => {
      if (!contentFrame || !monacoInstance) return;
      const code = monacoInstance.getValue();
      const blob = new Blob([code], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      contentFrame.src = url;
    });
  }

  if (workbenchResize) {
    workbenchResize.addEventListener('pointerdown', (e) => {
      isResizing = true;
      document.body.style.cursor = 'ew-resize';
      workbenchResize.setPointerCapture(e.pointerId);
    });

    window.addEventListener('pointermove', (e) => {
      if (!isResizing || !workbench) return;
      const newWidth = window.innerWidth - e.clientX;
      const clampedWidth = Math.max(300, Math.min(newWidth, window.innerWidth * 0.8));
      workbench.style.width = `${clampedWidth}px`;
    });

    window.addEventListener('pointerup', (e) => {
      if (!isResizing) return;
      isResizing = false;
      document.body.style.cursor = '';
      try {
        workbenchResize.releasePointerCapture(e.pointerId);
      } catch (_) {}
      if (monacoInstance) monacoInstance.layout();
    });
  }

  if (labUITopRight && !labUITopRight.__codeObserver) {
    const observer = new MutationObserver(() => syncGlobalCodeBtn());
    observer.observe(labUITopRight, { childList: true, subtree: true });
    labUITopRight.__codeObserver = observer;
  }

  const aspectSelect = document.getElementById('aspect-select');
  const labCanvasContainer = document.getElementById('lab-canvas-container');
  if (aspectSelect && labCanvasContainer) {
    aspectSelect.addEventListener('change', (e) => {
      if (!contentFrame) return;
      const ratio = e.target.value;
      const iframe = contentFrame;

      iframe.style.width = '';
      iframe.style.height = '';
      iframe.style.position = '';
      iframe.style.left = '';
      iframe.style.top = '';
      iframe.style.transform = '';

      labCanvasContainer.style.display = 'flex';
      labCanvasContainer.style.alignItems = 'center';
      labCanvasContainer.style.justifyContent = 'center';

      if (ratio === 'full') {
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        return;
      }

      let w;
      let h;
      const containerW = labCanvasContainer.clientWidth;
      const containerH = labCanvasContainer.clientHeight;
      const [rw, rh] = ratio.split(':').map(Number);
      const targetRatio = rw / rh;
      const containerRatio = containerW / containerH;

      if (containerRatio > targetRatio) {
        h = containerH * 0.9;
        w = h * targetRatio;
      } else {
        w = containerW * 0.9;
        h = w / targetRatio;
      }

      iframe.style.width = `${w}px`;
      iframe.style.height = `${h}px`;
      iframe.style.border = '1px solid rgba(255,255,255,0.1)';
      iframe.style.boxShadow = '0 0 50px rgba(0,0,0,0.5)';
    });
  }

  if (!messageHandler) {
    messageHandler = (event) => {
      const data = event.data;
      if (!data || !data.type) return;

      if (data.type === 'UI_CONFIG') {
        const container = document.getElementById('dynamic-controls');
        if (!container) return;

        container.innerHTML = '';

        let config = data.config || [];
        if (config && !Array.isArray(config)) {
          config = Object.entries(config).map(([bind, cfg]) => {
            const type =
              cfg.type === 'boolean' ? 'checkbox' : cfg.type === 'number' ? 'range' : cfg.type;
            return {
              bind,
              name: cfg.label || bind,
              type: type,
              value: cfg.value,
              min: cfg.min,
              max: cfg.max,
              step: cfg.step,
              options: cfg.options,
              placeholder: cfg.placeholder,
              text: cfg.text,
              width: cfg.width,
              children: cfg.children,
              accept: cfg.accept,
              multiple: cfg.multiple,
            };
          });
        }
        window.lastUIConfig = config;

        const hasPresets = config.some((item) => item.type === 'presets');
        if (!hasPresets) {
          const defaultValues = {};
          let hasDefaults = false;

          const extractDefaults = (items) => {
            items.forEach((item) => {
              if (item.bind && item.value !== undefined) {
                defaultValues[item.bind] = item.value;
                hasDefaults = true;
              }
              if (item.children) extractDefaults(item.children);
            });
          };
          extractDefaults(config);

          if (hasDefaults) {
            config = [
              {
                type: 'presets',
                label: '常用预设 / PRESETS',
                options: [{ label: '默认 / Default', values: defaultValues }],
              },
              ...config,
            ];
          }
        }

        if (config.length > 0) {
          config.forEach((item) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'space-y-2';

            if (item.type === 'presets') {
              const presetContainer = document.createElement('div');
              presetContainer.className = 'mb-6';

              if (item.label) {
                const label = document.createElement('div');
                label.className =
                  'text-[10px] text-gray-500 font-mono uppercase mb-3 tracking-wider flex items-center gap-2';
                label.innerHTML = `<span class="w-1 h-1 bg-capcut-green rounded-full"></span>${item.label}`;
                presetContainer.appendChild(label);
              }

              const grid = document.createElement('div');
              grid.className = 'grid grid-cols-3 gap-2';

              item.options.forEach((opt) => {
                const btn = document.createElement('button');
                btn.className =
                  'px-2 py-2 bg-white/5 hover:bg-white/10 text-gray-300 text-[10px] font-mono rounded border border-transparent hover:border-white/10 transition-all active:scale-95 flex items-center justify-center text-center';
                const shortLabel = opt.label.includes('/') ? opt.label.split('/')[0].trim() : opt.label;
                btn.textContent = shortLabel;
                btn.title = opt.label;

                btn.onclick = () => {
                  Array.from(grid.children).forEach((b) => {
                    b.className =
                      'px-2 py-2 bg-white/5 hover:bg-white/10 text-gray-300 text-[10px] font-mono rounded border border-transparent hover:border-white/10 transition-all active:scale-95 flex items-center justify-center text-center';
                  });
                  btn.className =
                    'px-2 py-2 bg-capcut-green text-black text-[10px] font-bold font-mono rounded border border-capcut-green transition-all active:scale-95 flex items-center justify-center text-center shadow-[0_0_10px_rgba(0,202,224,0.4)]';

                  if (opt.values) {
                    Object.entries(opt.values).forEach(([key, val]) => {
                      updateDemoParam(key, val);

                      const input = document.querySelector(`[data-bind="${key}"]`);
                      if (input) {
                        if (input.type === 'checkbox') {
                          input.checked = val;
                          input.dispatchEvent(new Event('change'));
                        } else {
                          input.value = val;
                          input.dispatchEvent(new Event('input'));
                        }
                      } else {
                        const labelVal = document.getElementById(`val-${key}`);
                        if (labelVal) {
                          labelVal.textContent =
                            typeof val === 'number' && val % 1 !== 0 ? val.toFixed(2) : val;
                        }
                      }
                    });
                  }
                };
                grid.appendChild(btn);
              });

              presetContainer.appendChild(grid);
              wrapper.appendChild(presetContainer);
              container.appendChild(wrapper);
              return;
            }

            const labelRow = document.createElement('div');
            labelRow.className =
              'flex justify-between text-[10px] text-gray-400 font-mono uppercase mb-2';
            labelRow.innerHTML = `<span>${item.name}</span><span id="val-${item.bind}" class="text-white">${item.value}</span>`;

            wrapper.appendChild(labelRow);

            if (!item.type || item.type === 'range') {
              const sliderContainer = document.createElement('div');
              sliderContainer.className = 'relative h-4 flex items-center';

              const slider = document.createElement('input');
              slider.type = 'range';
              slider.min = item.min;
              slider.max = item.max;
              slider.step = item.step || 0.01;
              slider.value = item.value;
              slider.className = 'w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer';
              slider.dataset.bind = item.bind;

              slider.addEventListener('input', (e) => {
                const val = e.target.value;
                const valEl = document.getElementById(`val-${item.bind}`);
                if (valEl) valEl.textContent = parseFloat(val).toFixed(2);
                updateDemoParam(item.bind, val);
              });
              sliderContainer.appendChild(slider);
              wrapper.appendChild(sliderContainer);
            } else if (item.type === 'color') {
              const picker = document.createElement('div');
              picker.className = 'flex gap-2 items-center';

              const colorWrapper = document.createElement('div');
              colorWrapper.className =
                'w-full h-8 rounded border border-white/10 bg-white/5 relative overflow-hidden flex items-center px-2 gap-2 cursor-pointer hover:border-white/30 transition-colors';

              const colorPreview = document.createElement('div');
              colorPreview.className = 'w-4 h-4 rounded-full shadow-sm border border-white/10';
              colorPreview.style.backgroundColor = item.value;

              const colorText = document.createElement('span');
              colorText.className = 'text-[10px] font-mono text-gray-400';
              colorText.textContent = item.value;

              const input = document.createElement('input');
              input.type = 'color';
              input.value = item.value;
              input.className = 'absolute inset-0 opacity-0 cursor-pointer w-full h-full';
              input.dataset.bind = item.bind;

              input.addEventListener('input', (e) => {
                const val = e.target.value;
                const valEl = document.getElementById(`val-${item.bind}`);
                if (valEl) valEl.textContent = val;
                colorPreview.style.backgroundColor = val;
                colorText.textContent = val;
                updateDemoParam(item.bind, val);
              });

              colorWrapper.appendChild(colorPreview);
              colorWrapper.appendChild(colorText);
              colorWrapper.appendChild(input);
              picker.appendChild(colorWrapper);
              wrapper.appendChild(picker);
            } else if (item.type === 'checkbox') {
              const checkboxWrapper = document.createElement('label');
              checkboxWrapper.className = 'flex items-center gap-2 cursor-pointer group';

              const checkbox = document.createElement('input');
              checkbox.type = 'checkbox';
              checkbox.checked = item.value;
              checkbox.className = 'peer sr-only';
              checkbox.dataset.bind = item.bind;

              const toggle = document.createElement('div');
              toggle.className =
                "w-8 h-4 bg-gray-700 peer-checked:bg-capcut-green rounded-full peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all relative transition-colors";

              checkbox.addEventListener('change', (e) => {
                const val = e.target.checked;
                const valEl = document.getElementById(`val-${item.bind}`);
                if (valEl) valEl.textContent = val ? 'ON' : 'OFF';
                updateDemoParam(item.bind, val);
              });

              checkboxWrapper.appendChild(checkbox);
              checkboxWrapper.appendChild(toggle);
              wrapper.appendChild(checkboxWrapper);
            } else if (item.type === 'select') {
              const selectWrapper = document.createElement('div');
              selectWrapper.className = 'relative group';

              const select = document.createElement('select');
              select.className =
                'w-full bg-white/5 text-white text-[10px] font-mono p-2 rounded border border-white/10 outline-none focus:border-capcut-green appearance-none cursor-pointer hover:bg-white/10 transition-colors';
              select.dataset.bind = item.bind;

              item.options.forEach((opt, idx) => {
                const option = document.createElement('option');
                option.value = opt;
                option.text = opt;
                if (item.value === idx || item.value === opt) option.selected = true;
                select.appendChild(option);
              });

              select.addEventListener('change', (e) => {
                const val = e.target.value;
                const valEl = document.getElementById(`val-${item.bind}`);
                if (valEl) valEl.textContent = val;
                updateDemoParam(item.bind, val);
              });

              const arrow = document.createElement('div');
              arrow.className =
                'absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 text-[8px] group-hover:text-white transition-colors';
              arrow.innerHTML = '▼';

              selectWrapper.appendChild(select);
              selectWrapper.appendChild(arrow);
              wrapper.appendChild(selectWrapper);
            } else if (item.type === 'text') {
              const input = document.createElement('textarea');
              input.value = item.value;
              input.className =
                'w-full bg-white/5 text-white text-[10px] font-mono p-2 rounded border border-white/10 outline-none focus:border-capcut-green placeholder-gray-500 hover:bg-white/10 transition-colors resize-none';
              input.placeholder = item.placeholder || '';
              input.dataset.bind = item.bind;

              input.addEventListener('input', (e) => {
                const val = e.target.value;
                updateDemoParam(item.bind, val);
              });

              wrapper.appendChild(input);
            } else if (item.type === 'button') {
              const btn = document.createElement('button');
              const baseClass =
                'w-full bg-white/5 hover:bg-white/10 text-white text-[10px] font-mono py-2 rounded border border-white/10 transition-all active:bg-capcut-green active:text-black active:scale-[0.98]';

              if (item.width) {
                btn.style.width = item.width;
                btn.className = baseClass.replace('w-full', '');
              } else {
                btn.className = baseClass;
              }

              if (item.className) btn.className = item.className;

              btn.textContent = item.text || item.name;
              btn.dataset.bind = item.bind;

              btn.addEventListener('click', () => {
                const val = item.value !== undefined ? item.value : Date.now();
                updateDemoParam(item.bind, val);
              });

              wrapper.appendChild(btn);
            } else if (item.type === 'row') {
              const row = document.createElement('div');
              row.className = 'flex gap-2 w-full';

              if (item.children && Array.isArray(item.children)) {
                item.children.forEach((childItem) => {
                  if (childItem.type !== 'button') return;
                  const btn = document.createElement('button');
                  btn.className =
                    'flex-1 bg-white/5 hover:bg-white/10 text-white text-[10px] font-mono py-2 rounded border border-white/10 transition-all active:bg-capcut-green active:text-black active:scale-[0.98]';
                  btn.textContent = childItem.text || childItem.name;
                  btn.dataset.bind = childItem.bind;
                  btn.addEventListener('click', () => {
                    const val = childItem.value !== undefined ? childItem.value : Date.now();
                    updateDemoParam(childItem.bind, val);
                  });
                  row.appendChild(btn);
                });
              }
              wrapper.appendChild(row);
            } else if (item.type === 'file') {
              const btn = document.createElement('button');
              btn.className =
                'w-full bg-white/5 hover:bg-white/10 text-white text-[10px] font-mono py-2 rounded border border-white/10 transition-all active:bg-capcut-green active:text-black flex items-center justify-center gap-2 group';
              btn.innerHTML = `<i data-lucide="upload" class="w-3 h-3 group-hover:scale-110 transition-transform"></i> ${item.text || item.name}`;

              const hiddenInput = document.createElement('input');
              hiddenInput.type = 'file';
              hiddenInput.style.display = 'none';
              if (item.multiple) hiddenInput.multiple = true;
              hiddenInput.accept = item.accept || 'image/*';

              btn.addEventListener('click', () => hiddenInput.click());

              hiddenInput.addEventListener('change', (e) => {
                if (!contentFrame || !contentFrame.contentWindow) return;
                const files = Array.from(e.target.files);
                if (files.length === 0) return;

                const payloads = files.map((f) => ({
                  name: f.name,
                  type: f.type,
                  url: URL.createObjectURL(f),
                }));

                contentFrame.contentWindow.postMessage(
                  {
                    type: 'FILE_UPLOAD',
                    bind: item.bind,
                    files: payloads,
                  },
                  '*',
                );
                hiddenInput.value = '';
              });

              wrapper.appendChild(btn);
              wrapper.appendChild(hiddenInput);
            }

            container.appendChild(wrapper);
          });
        } else {
          container.innerHTML =
            '<div class="text-[10px] text-gray-600 font-mono italic">No parameters available</div>';
        }

        if (data.sources) {
          const select = document.getElementById('source-select');
          if (select) {
            select.innerHTML = '';
            data.sources.forEach((src) => {
              const opt = document.createElement('option');
              opt.value = src.value;
              opt.textContent = src.name;
              select.appendChild(opt);
            });

            select.onchange = (e) => {
              if (!contentFrame || !contentFrame.contentWindow) return;
              contentFrame.contentWindow.postMessage(
                {
                  type: 'LOAD_SOURCE',
                  source: data.sources.find((s) => s.value == e.target.value) || { type: 'camera' },
                },
                '*',
              );
            };
          }
        }
      }

      if (data.type === 'GAME_JS_SOURCE') {
        const code = typeof data.code === 'string' ? data.code : '';
        const baseFilename = typeof data.filename === 'string' && data.filename.trim() ? data.filename.trim() : 'game.js';
        const prefix = sanitizeExportPrefix(localStorage.getItem('exportFilePrefix') || '');
        const filename = prefix ? `${prefix}-${baseFilename}` : baseFilename;
        const finalCode = toMinigameGameJS(code);
        const blob = new Blob([finalCode], { type: 'application/javascript' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      if (data.type === 'IMAGE_DATA') {
        const url = data.dataUrl;
        const banner = document.createElement('div');
        banner.style.position = 'fixed';
        banner.style.bottom = '20px';
        banner.style.left = '20px';
        banner.style.zIndex = '9999';
        banner.style.padding = '12px 16px';
        banner.style.background = 'rgba(0,0,0,0.8)';
        banner.style.border = '1px solid rgba(255,255,255,0.15)';
        banner.style.borderRadius = '10px';
        banner.style.color = '#fff';
        banner.style.fontFamily = 'JetBrains Mono, monospace';
        banner.style.fontSize = '12px';
        banner.style.display = 'flex';
        banner.style.alignItems = 'center';
        banner.style.gap = '10px';
        banner.innerText = '截图已生成，点击下载图片';
        const btn = document.createElement('a');
        btn.href = url;
        btn.download = 'capcut-lab-export.png';
        btn.textContent = '下载';
        btn.style.padding = '6px 10px';
        btn.style.background = '#00CAE0';
        btn.style.color = '#000';
        btn.style.fontWeight = '700';
        btn.style.borderRadius = '6px';
        btn.style.textDecoration = 'none';
        const close = document.createElement('button');
        close.textContent = '×';
        close.style.background = 'transparent';
        close.style.color = '#aaa';
        close.style.border = 'none';
        close.style.fontSize = '16px';
        close.style.cursor = 'pointer';
        close.onclick = () => banner.remove();
        banner.appendChild(btn);
        banner.appendChild(close);
        document.body.appendChild(banner);
      }

      if (data.type === 'REC_BLOB') {
        const url = URL.createObjectURL(data.blob);
        const ext = data.mimeType && data.mimeType.includes('mp4') ? 'mp4' : 'webm';
        const banner = document.createElement('div');
        banner.style.position = 'fixed';
        banner.style.bottom = '20px';
        banner.style.left = '20px';
        banner.style.zIndex = '9999';
        banner.style.padding = '12px 16px';
        banner.style.background = 'rgba(0,0,0,0.8)';
        banner.style.border = '1px solid rgba(255,255,255,0.15)';
        banner.style.borderRadius = '10px';
        banner.style.color = '#fff';
        banner.style.fontFamily = 'JetBrains Mono, monospace';
        banner.style.fontSize = '12px';
        banner.style.display = 'flex';
        banner.style.alignItems = 'center';
        banner.style.gap = '10px';
        banner.innerText = '录制完成，点击下载文件';
        const btn = document.createElement('a');
        btn.href = url;
        btn.download = `capcut-lab-record.${ext}`;
        btn.textContent = '下载';
        btn.style.padding = '6px 10px';
        btn.style.background = '#00CAE0';
        btn.style.color = '#000';
        btn.style.fontWeight = '700';
        btn.style.borderRadius = '6px';
        btn.style.textDecoration = 'none';
        const close = document.createElement('button');
        close.textContent = '×';
        close.style.background = 'transparent';
        close.style.color = '#aaa';
        close.style.border = 'none';
        close.style.fontSize = '16px';
        close.style.cursor = 'pointer';
        close.onclick = () => {
          banner.remove();
          URL.revokeObjectURL(url);
        };
        banner.appendChild(btn);
        banner.appendChild(close);
        document.body.appendChild(banner);
      }

      if (data.type === 'REC_ERROR') {
        const banner = document.createElement('div');
        banner.style.position = 'fixed';
        banner.style.bottom = '20px';
        banner.style.left = '20px';
        banner.style.zIndex = '9999';
        banner.style.padding = '12px 16px';
        banner.style.background = 'rgba(0,0,0,0.8)';
        banner.style.border = '1px solid rgba(255,255,255,0.15)';
        banner.style.borderRadius = '10px';
        banner.style.color = '#fff';
        banner.style.fontFamily = 'JetBrains Mono, monospace';
        banner.style.fontSize = '12px';
        banner.style.display = 'flex';
        banner.style.alignItems = 'center';
        banner.style.gap = '10px';
        banner.innerText = '录制/截图失败：' + (data.message || 'Unknown error');
        const close = document.createElement('button');
        close.textContent = '×';
        close.style.background = 'transparent';
        close.style.color = '#aaa';
        close.style.border = 'none';
        close.style.fontSize = '16px';
        close.style.cursor = 'pointer';
        close.onclick = () => banner.remove();
        banner.appendChild(close);
        document.body.appendChild(banner);
      }
    };
  }

  window.addEventListener('message', messageHandler);

  const fileUpload = document.getElementById('file-upload');
  if (fileUpload) {
    fileUpload.addEventListener('change', (e) => {
      if (!contentFrame || !contentFrame.contentWindow) return;
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      const type = file.type && file.type.startsWith('video') ? 'video' : 'image';
      contentFrame.contentWindow.postMessage(
        {
          type: 'LOAD_SOURCE',
          source: { type: type, path: url, name: file.name },
        },
        '*',
      );

      const select = document.getElementById('source-select');
      if (!select) return;
      const opt = document.createElement('option');
      let displayName = file.name;
      if (displayName.length > 20) {
        displayName = displayName.substring(0, 8) + '...' + displayName.substring(displayName.length - 7);
      }
      opt.text = `[Upload] ${displayName}`;
      opt.value = 'custom';
      opt.selected = true;
      select.add(opt, 0);
    });
  }
}
