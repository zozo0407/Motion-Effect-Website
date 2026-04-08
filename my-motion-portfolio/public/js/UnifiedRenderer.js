
/**
 * UnifiedRenderer.js
 * A standardized base class for Creative Coding demos.
 * Handles lifecycle, resize, UI communication, and Three.js/P5.js setup.
 * 
 * Version: 2.0 (Enhanced for Stability & Shaders)
 */

import * as THREE from 'three';
import { TrackballControls } from 'three/addons/controls/TrackballControls.js';
import Stats from 'three/addons/libs/stats.module.js';

export class UnifiedRenderer {
    constructor(options = {}) {
        // Core Components
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.stats = null;
        this.clock = new THREE.Clock();
        
        // Configuration
        this.container = options.container || document.body;
        this.type = options.type || 'three'; // 'three', 'p5', 'shader'
        this.params = options.params || {}; // Initial parameters
        this.onParamChange = options.onParamChange || (() => {}); 
        this.showStats = options.showStats !== false; // Default true 
        this.buffers = options.buffers || false; // Enable Ping-Pong Buffers
        this.audio = options.audio || false; // Enable Audio Analysis
        this.mouseDragOnly = options.mouseDragOnly || false; // Only update mouse uniform on drag
        
        // Shader Specifics
        this.fragmentShader = options.fragmentShader || null;
        this.uniforms = {};

        // Lifecycle Hooks
        // Support both 'init' (standard) and 'onInit' (legacy/alias)
        this.initCallback = options.init || options.onInit || (() => {});
        this.updateCallback = options.update || (() => {});
        this.drawCallback = options.draw || (() => {});
        this.customRender = options.customRender || null;
        
        // Internal State
        this._isRunning = false;
        this._animationId = null;
        this._isDestroyed = false;
        
        // Error Handling
        this._setupErrorHandling();

        try {
            this._setup();
        } catch (error) {
            this._handleError(error);
        }
    }

    _getContainerMetrics() {
        const el = this.container || document.body;
        const rect = el && typeof el.getBoundingClientRect === 'function' ? el.getBoundingClientRect() : null;
        let width = rect ? Math.round(rect.width) : 0;
        let height = rect ? Math.round(rect.height) : 0;
        let left = rect ? rect.left : 0;
        let top = rect ? rect.top : 0;
        if (width <= 0 || height <= 0) {
            width = window.innerWidth;
            height = window.innerHeight;
            left = 0;
            top = 0;
        }
        return { width: Math.max(1, width), height: Math.max(1, height), left, top };
    }

    _setupErrorHandling() {
        this._onError = (event) => {
            this._handleError(event.error || event.message);
        };
        this._onUnhandledRejection = (event) => {
            this._handleError(event.reason);
        };
        window.addEventListener('error', this._onError);
        window.addEventListener('unhandledrejection', this._onUnhandledRejection);
    }

    _handleError(error) {
        console.error("UnifiedRenderer Caught Error:", error);
        // Stop the loop to prevent spamming errors
        this.pause();
        
        // Report to parent
        if (window.parent) {
            window.parent.postMessage({
                type: 'DEMO_ERROR',
                error: error.toString()
            }, '*');
        }

        // Visual Error Overlay
        let errDiv = document.getElementById('unified-error-overlay');
        if (!errDiv) {
            errDiv = document.createElement('div');
            errDiv.id = 'unified-error-overlay';
            errDiv.style.position = 'absolute';
            errDiv.style.top = '0';
            errDiv.style.left = '0';
            errDiv.style.width = '100%';
            errDiv.style.height = '100%';
            errDiv.style.background = 'rgba(40, 0, 0, 0.9)';
            errDiv.style.color = '#ff6b6b';
            errDiv.style.padding = '40px';
            errDiv.style.fontFamily = 'monospace';
            errDiv.style.fontSize = '16px';
            errDiv.style.zIndex = '9999';
            errDiv.style.boxSizing = 'border-box';
            errDiv.style.overflow = 'auto';
            document.body.appendChild(errDiv);
        }
        
        errDiv.innerHTML = `
            <h2 style="margin-top:0;color:#ff3333">⚠️ 运行错误 / Runtime Error</h2>
            <pre style="white-space:pre-wrap;background:rgba(0,0,0,0.5);padding:20px;border-radius:8px">${error.toString()}</pre>
            <p style="color:#888;font-size:12px;margin-top:20px">Check the console for full stack trace.</p>
        `;
    }

    _getUIRoot(id) {
        let target = this.container;
        if (window.parent && window.parent !== window) {
            try {
                const el = window.parent.document.getElementById(id);
                if (el) target = el;
            } catch (e) {}
        }
        return target;
    }

    _getCodeContainer() {
        if (this._codeContainer) return this._codeContainer;
        this._codeContainer = this._getUIRoot('lab-ui-top-right');
        return this._codeContainer;
    }

    _getStatsContainer() {
        if (this._statsContainer) return this._statsContainer;
        this._statsContainer = this._getUIRoot('lab-ui-top-left');
        return this._statsContainer;
    }

    _cleanupUI() {
        if (this.codeBtn && this.codeBtn.parentNode) {
            this.codeBtn.parentNode.removeChild(this.codeBtn);
        }
        if (this.stats && this.stats.dom && this.stats.dom.parentNode) {
            this.stats.dom.parentNode.removeChild(this.stats.dom);
        }
    }

    _setup() {
        if (this.showStats) {
            this.stats = new Stats();
            this.stats.dom.style.position = 'absolute';
            this.stats.dom.style.top = '0px';
            this.stats.dom.style.left = '0px';
            this.stats.dom.id = 'unified-stats';
            const statsContainer = this._getStatsContainer();
            const existingStats = statsContainer.querySelector('#unified-stats');
            if (existingStats) existingStats.remove();
            statsContainer.appendChild(this.stats.dom);
        }

        if (this.type === 'splat') {
            this._setupSplat();
        } else if (this.type === 'three' || this.type === 'shader') {
            this._setupThree();
        } else if (this.type === 'p5') {
            this._setupP5();
        } else if (this.type === 'custom') {
            // No setup required for custom type
        }

        this._setupEvents();
        this._setupMessaging();
        
        // Call user init
        if (this.type === 'three' || this.type === 'shader' || this.type === 'custom') {
            this.initCallback(this);
            if (this.type !== 'custom') this.play(); // Custom type usually manages its own loop
        }

        this._setupEditor();
    }

    _setupEditor() {
        // Create Edit Button
        this.codeBtn = document.createElement('button');
        const btn = this.codeBtn;
        const codeContainer = this._getCodeContainer();
        const existingBtn = codeContainer.querySelector('#unified-code-btn');
        if (existingBtn) existingBtn.remove();
        btn.id = 'unified-code-btn';
        btn.innerHTML = '</> 代码 / Code';
        btn.style.position = 'relative';
        btn.style.zIndex = '100000'; // Force on top
        btn.style.padding = '8px 12px';
        btn.style.background = 'rgba(0,0,0,0.6)';
        btn.style.color = '#fff';
        btn.style.border = '1px solid #444';
        btn.style.borderRadius = '4px';
        btn.style.cursor = 'pointer';
        btn.style.fontFamily = 'monospace';
        btn.style.pointerEvents = 'auto';
        
        // Sync state with global flag (for hot-reload)
        if (window.__unified_workbench_open) {
            btn.style.display = 'none';
            this._isEditorOpen = true;
            if (!this.monacoInstance && window.__unified_monaco_instance) {
                this.monacoInstance = window.__unified_monaco_instance;
            }
        }

        btn.onclick = () => this._openEditor();
        codeContainer.appendChild(btn);

        // Load Monaco Editor Loader Script
        if (!window.monaco) {
            if (!this._monacoLoaderPromise) {
                this._monacoLoaderPromise = new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs/loader.min.js';
                    script.onload = () => {
                        if (typeof require === 'function') {
                            require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' }});
                            resolve();
                        } else {
                            reject(new Error('Monaco loader unavailable'));
                        }
                    };
                    script.onerror = () => reject(new Error('Failed to load Monaco loader'));
                    document.head.appendChild(script);
                });
            }
        } else {
            this._monacoLoaderPromise = Promise.resolve();
        }

        const existingWorkbench = document.getElementById('unified-workbench');
        if (existingWorkbench) {
            this._bindWorkbenchUI(existingWorkbench);
        }
    }

    async _openEditor() {
        // Toggle Mode
        if (this._isEditorOpen) {
            this._closeEditor();
            return;
        }
        this._isEditorOpen = true;
        window.__unified_workbench_open = true; // Set Global Flag

        // Hide Code Button to prevent obstruction
        if (this.codeBtn) this.codeBtn.style.display = 'none';

        this.container.style.transition = 'width 0.3s ease';
        
        // Trigger resize event after transition
        this._resizeTimeoutId = setTimeout(() => this._onResize(), 310);

        // 2. Create/Show Workbench (Right Split)
        let workbench = document.getElementById('unified-workbench');
        if (!workbench) {
            workbench = this._createWorkbench();
        }
        workbench.style.display = 'flex';
        this._workbenchEl = workbench;
        const initialWidth = this._workbenchWidth || Math.round(window.innerWidth * 0.5);
        this._applyWorkbenchWidth(initialWidth);
        this._bindWorkbenchUI(workbench);
        // Small delay to allow display:flex to apply before sliding in
        requestAnimationFrame(() => {
            workbench.style.transform = 'translateX(0)';
        });
        
        // 3. Load Code
        const code = await this._fetchSourceCode();
        
        // Initialize Monaco
        if (!this.monacoInstance) {
            if (this._monacoLoaderPromise) {
                try {
                    await this._monacoLoaderPromise;
                } catch (e) {
                    this._handleError(e);
                    return;
                }
            }
            if (typeof require !== 'function') {
                this._handleError(new Error('Monaco loader unavailable'));
                return;
            }
            require(['vs/editor/editor.main'], () => {
                this.monacoInstance = monaco.editor.create(document.getElementById('unified-monaco-container'), {
                    value: code,
                    language: 'javascript',
                    theme: 'vs-dark',
                    minimap: { enabled: false },
                    fontSize: 14,
                    automaticLayout: true
                });
                window.__unified_monaco_instance = this.monacoInstance;
            });
        } else {
            this.monacoInstance.setValue(code);
            window.__unified_monaco_instance = this.monacoInstance;
        }
    }

    _closeEditor() {
        this._isEditorOpen = false;
        window.__unified_workbench_open = false;
        
        // Restore Container
        this.container.style.width = '100%';
        this._resizeTimeoutId = setTimeout(() => this._onResize(), 310);

        // Hide Workbench
        const workbench = document.getElementById('unified-workbench');
        if (workbench) {
            workbench.style.transform = 'translateX(100%)';
        }

        if (this.codeBtn) {
            this.codeBtn.style.display = 'block';
        }
    }

    _createWorkbench() {
        const workbench = document.createElement('div');
        workbench.id = 'unified-workbench';
        workbench.style.cssText = `
            position: fixed; top: 0; right: 0; width: 50%; height: 100%;
            background: rgba(20, 20, 20, 0.95); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
            z-index: 99999; display: none;
            flex-direction: column; border-left: 1px solid rgba(255,255,255,0.1);
            transform: translateX(100%); transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: -10px 0 30px rgba(0,0,0,0.8);
        `;
        this._workbenchEl = workbench;
        this._workbenchTransition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        
        const resizeHandle = document.createElement('div');
        resizeHandle.id = 'unified-workbench-resize';
        resizeHandle.style.cssText = `
            position: absolute; left: -4px; top: 0; width: 8px; height: 100%;
            cursor: ew-resize; background: rgba(255,255,255,0.04);
            border-left: 1px solid rgba(255,255,255,0.12);
            border-right: 1px solid rgba(255,255,255,0.06);
            z-index: 100000; touch-action: none;
        `;
        resizeHandle.onpointerdown = (e) => this._startWorkbenchResize(e);

        // --- Toolbar ---
        const toolbar = document.createElement('div');
        toolbar.style.cssText = `
            display: flex; justify-content: space-between; align-items: center;
            padding: 12px 20px; background: rgba(255,255,255,0.03); border-bottom: 1px solid rgba(255,255,255,0.1);
        `;
        toolbar.innerHTML = `<span style="color:#fff;font-weight:bold;font-family:'JetBrains Mono', monospace; font-size:14px; letter-spacing:1px;">🛠️ 视觉工作台 / VFX WORKBENCH</span>`;
        
        const btnGroup = document.createElement('div');
        btnGroup.style.display = 'flex';
        btnGroup.style.gap = '10px';

        const runBtn = document.createElement('button');
        runBtn.id = 'unified-run-btn';
        runBtn.innerText = '▶ 运行 / RUN';
        runBtn.style.cssText = `
            background: #00CAE0; color: #000; border: none; padding: 6px 16px; 
            cursor: pointer; font-weight: bold; border-radius: 4px; font-family: sans-serif; font-size: 12px;
            box-shadow: 0 0 15px rgba(0, 202, 224, 0.3); transition: all 0.2s;
        `;
        runBtn.onmouseover = () => runBtn.style.boxShadow = '0 0 20px rgba(0, 202, 224, 0.6)';
        runBtn.onmouseout = () => runBtn.style.boxShadow = '0 0 15px rgba(0, 202, 224, 0.3)';
        const exportBtn = document.createElement('button');
        exportBtn.id = 'unified-export-btn';
        exportBtn.innerText = '⬇︎ 导出 game.js / EXPORT';
        exportBtn.style.cssText = `
            background: rgba(122, 66, 244, 0.2); color: #b388ff; border: 1px solid rgba(122, 66, 244, 0.5); 
            padding: 6px 16px; cursor: pointer; font-weight: bold; border-radius: 4px; font-family: sans-serif; font-size: 12px;
            transition: all 0.2s;
        `;
        exportBtn.onmouseover = () => { exportBtn.style.background = 'rgba(122, 66, 244, 0.4)'; exportBtn.style.color = '#fff'; };
        exportBtn.onmouseout = () => { exportBtn.style.background = 'rgba(122, 66, 244, 0.2)'; exportBtn.style.color = '#b388ff'; };
        const closeBtn = document.createElement('button');
        closeBtn.id = 'unified-close-btn';
        closeBtn.innerText = '✕';
        closeBtn.style.cssText = `background: transparent; color: #666; border: none; font-size: 16px; cursor: pointer; padding: 0 8px;`;
        closeBtn.onmouseover = () => closeBtn.style.color = '#fff';
        closeBtn.onmouseout = () => closeBtn.style.color = '#666';

        btnGroup.appendChild(runBtn);
        btnGroup.appendChild(exportBtn);
        btnGroup.appendChild(closeBtn);
        toolbar.appendChild(btnGroup);

        // --- Code Editor Container ---
        const editorContainer = document.createElement('div');
        editorContainer.id = 'unified-monaco-container';
        editorContainer.style.cssText = `flex: 1; min-height: 50%; border-bottom: 1px solid #333;`;

        // --- Chat Interface ---
        const chatContainer = document.createElement('div');
        chatContainer.style.cssText = `
            height: 35%; display: flex; flex-direction: column; background: rgba(0,0,0,0.3); border-top: 1px solid rgba(255,255,255,0.1);
        `;
        
        // Chat Header
        const chatHeader = document.createElement('div');
        chatHeader.style.cssText = `padding: 10px 15px; background: rgba(255,255,255,0.02); color: #888; font-size: 11px; font-family: 'JetBrains Mono', monospace; border-bottom: 1px solid rgba(255,255,255,0.05); letter-spacing: 1px;`;
        chatHeader.innerText = 'AI 编程助手 / COPILOT';
        
        // Chat History
        const chatHistory = document.createElement('div');
        chatHistory.id = 'unified-chat-history';
        chatHistory.style.cssText = `
            flex: 1; overflow-y: auto; padding: 15px; font-family: sans-serif; font-size: 13px; color: #ddd;
        `;
        chatHistory.innerHTML = `<div style="color:#666; margin-bottom:10px; font-family:monospace; font-size:11px;">> 系统: AI 助手已就绪。<br>> 尝试输入: "变红", "加速"</div>`;

        // Chat Input Area
        const inputArea = document.createElement('div');
        inputArea.style.cssText = `padding: 15px; background: rgba(0,0,0,0.2); border-top: 1px solid rgba(255,255,255,0.05); display: flex; gap: 10px;`;
        
        const chatInput = document.createElement('input');
        chatInput.id = 'unified-chat-input';
        chatInput.type = 'text';
        chatInput.disabled = true;
        chatInput.placeholder = 'AI 辅助编程 - 待打通';
        chatInput.style.cssText = `
            flex: 1; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #888; padding: 10px; border-radius: 6px; outline: none; font-family: sans-serif; font-size: 13px;
            cursor: not-allowed;
        `;
        chatInput.onfocus = () => chatInput.style.borderColor = '#00CAE0';
        chatInput.onblur = () => chatInput.style.borderColor = 'rgba(255,255,255,0.1)';
        
        const sendBtn = document.createElement('button');
        sendBtn.id = 'unified-chat-send-btn';
        sendBtn.innerText = '发送';
        sendBtn.disabled = true;
        sendBtn.style.cssText = `background: #222; color: #555; border: 1px solid #333; padding: 0 15px; border-radius: 6px; cursor: not-allowed; font-size: 12px;`;
        
        inputArea.appendChild(chatInput);
        inputArea.appendChild(sendBtn);

        chatContainer.appendChild(chatHeader);
        chatContainer.appendChild(chatHistory);
        chatContainer.appendChild(inputArea);

        // Assemble
        workbench.appendChild(resizeHandle);
        workbench.appendChild(toolbar);
        workbench.appendChild(editorContainer);
        workbench.appendChild(chatContainer);
        
        document.body.appendChild(workbench);
        
        // Initial Binding
        this._bindWorkbenchEvents();
        this._bindWorkbenchUI(workbench);

        return workbench;
    }

    _bindWorkbenchUI(workbench) {
        const root = workbench || document;
        const runBtn = root.querySelector('#unified-run-btn');
        if (runBtn) runBtn.onclick = () => this._runEditorCode();
        const exportBtn = root.querySelector('#unified-export-btn');
        if (exportBtn) exportBtn.onclick = () => this._exportToCapCut();
        const closeBtn = root.querySelector('#unified-close-btn');
        if (closeBtn) closeBtn.onclick = () => this._closeEditor();
        const chatInput = root.querySelector('#unified-chat-input');
        const sendBtn = root.querySelector('#unified-chat-send-btn');
        if (chatInput && sendBtn) {
            const handleSend = () => {
                const text = chatInput.value.trim();
                if (!text) return;
                this._addChatMessage('User', text);
                chatInput.value = '';
                this._handleMockAI(text);
            };
            sendBtn.onclick = handleSend;
            chatInput.onkeypress = (e) => { if (e.key === 'Enter') handleSend(); };
        }
    }

    _bindWorkbenchEvents() {
        if (this._workbenchEventsBound) return;
        this._workbenchEventsBound = true;
        this._workbenchKeyHandler = (event) => {
            if (!this._isEditorOpen) return;
            const key = (event.key || '').toLowerCase();
            if ((event.metaKey || event.ctrlKey) && key === 's') {
                event.preventDefault();
                this._runEditorCode();
                return;
            }
            if (event.key === 'Escape') {
                event.preventDefault();
                this._closeEditor();
            }
        };
        window.addEventListener('keydown', this._workbenchKeyHandler);
    }

    _applyWorkbenchWidth(width) {
        const minW = this._resizeMinWidth || 360;
        const maxW = this._resizeMaxWidth || Math.floor(window.innerWidth * 0.85);
        const clamped = Math.max(minW, Math.min(maxW, Math.round(width)));
        this._workbenchWidth = clamped;
        if (this._workbenchEl) {
            this._workbenchEl.style.width = `${clamped}px`;
        }
        const leftWidth = Math.max(0, window.innerWidth - clamped);
        this.container.style.width = `${leftWidth}px`;
    }

    _startWorkbenchResize(event) {
        if (!this._workbenchEl) return;
        this._isResizingWorkbench = true;
        this._resizeStartX = event.clientX;
        this._resizeStartWidth = this._workbenchEl.getBoundingClientRect().width;
        this._resizeMinWidth = Math.max(320, Math.floor(window.innerWidth * 0.25));
        this._resizeMaxWidth = Math.max(this._resizeMinWidth + 40, Math.floor(window.innerWidth * 0.85));
        this._prevContainerTransition = this.container.style.transition;
        this._prevWorkbenchTransition = this._workbenchEl.style.transition;
        this.container.style.transition = 'none';
        this._workbenchEl.style.transition = 'none';
        this._onWorkbenchResizeMove = (e) => this._handleWorkbenchResize(e);
        this._onWorkbenchResizeUp = () => this._stopWorkbenchResize();
        window.addEventListener('pointermove', this._onWorkbenchResizeMove);
        window.addEventListener('pointerup', this._onWorkbenchResizeUp);
        document.body.style.cursor = 'ew-resize';
        event.preventDefault();
    }

    _handleWorkbenchResize(event) {
        if (!this._isResizingWorkbench) return;
        const delta = this._resizeStartX - event.clientX;
        const nextWidth = this._resizeStartWidth + delta;
        this._applyWorkbenchWidth(nextWidth);
    }

    _stopWorkbenchResize() {
        this._isResizingWorkbench = false;
        if (this._onWorkbenchResizeMove) window.removeEventListener('pointermove', this._onWorkbenchResizeMove);
        if (this._onWorkbenchResizeUp) window.removeEventListener('pointerup', this._onWorkbenchResizeUp);
        this._onWorkbenchResizeMove = null;
        this._onWorkbenchResizeUp = null;
        this.container.style.transition = this._prevContainerTransition || 'width 0.3s ease';
        if (this._workbenchEl) {
            this._workbenchEl.style.transition = this._prevWorkbenchTransition || this._workbenchTransition || 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        }
        document.body.style.cursor = '';
        this._resizeTimeoutId = setTimeout(() => this._onResize(), 0);
    }

    _addChatMessage(role, text) {
        const history = document.getElementById('unified-chat-history');
        const msg = document.createElement('div');
        msg.style.marginBottom = '12px';
        msg.style.lineHeight = '1.5';
        msg.style.display = 'flex';
        msg.style.gap = '10px';
        
        const isUser = role === 'User';
        const color = isUser ? '#00CAE0' : '#b388ff';
        const icon = isUser ? 'U' : 'AI';
        const bg = isUser ? 'rgba(0, 202, 224, 0.1)' : 'rgba(179, 136, 255, 0.1)';
        
        if (role === 'System') {
             msg.innerHTML = `<span style="color:#666; font-size:11px; font-family:monospace;">> ${text}</span>`;
        } else {
            msg.innerHTML = `
                <div style="width:24px; height:24px; border-radius:50%; background:${bg}; color:${color}; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:bold; flex-shrink:0;">${icon}</div>
                <div style="background:${isUser ? 'transparent' : 'rgba(255,255,255,0.05)'}; padding:${isUser ? '0' : '8px 12px'}; border-radius:8px; color:${isUser ? '#fff' : '#ddd'}; font-size:13px;">${text}</div>
            `;
        }
        
        history.appendChild(msg);
        history.scrollTop = history.scrollHeight;
    }

    _handleMockAI(text) {
        // Simple Mock Logic to demonstrate the loop
        setTimeout(() => {
            let response = "I understand, but I'm just a mock AI for now.";
            let action = null;

            const lower = text.toLowerCase();
            
            if (lower.includes('red')) {
                response = "Sure, changing color to red.";
                action = (code) => code.replace(/color:\s*['"]?#?[0-9a-fA-F]+['"]?/g, "color: '#ff0000'").replace(/0x[0-9a-fA-F]+/g, "0xff0000");
            } else if (lower.includes('blue')) {
                response = "Making it blue.";
                action = (code) => code.replace(/color:\s*['"]?#?[0-9a-fA-F]+['"]?/g, "color: '#0000ff'").replace(/0x[0-9a-fA-F]+/g, "0x0000ff");
            } else if (lower.includes('fast') || lower.includes('speed')) {
                response = "Increasing speed.";
                // Try to find speed param and double it
                action = (code) => code.replace(/speed:\s*([\d.]+)/g, (m, v) => `speed: ${parseFloat(v) * 2.0}`);
            }

            this._addChatMessage('AI', response);

            if (action && this.monacoInstance) {
                const currentCode = this.monacoInstance.getValue();
                const newCode = action(currentCode);
                if (newCode !== currentCode) {
                    this.monacoInstance.setValue(newCode);
                    this._addChatMessage('System', 'Code updated. Running...');
                    this._runEditorCode();
                } else {
                    this._addChatMessage('System', 'Could not find matching pattern to update code.');
                }
            }

        }, 800);
    }

    async _fetchSourceCode() {
        try {
            const response = await fetch(window.location.href);
            const html = await response.text();
            // Extract the main module script
            // Regex to find <script type="module"> content
            const match = html.match(/<script type="module">([\s\S]*?)<\/script>/);
            if (match && match[1]) {
                return match[1].trim();
            }
            return "// Could not extract source code automatically.";
        } catch (e) {
            return "// Error fetching source code: " + e.message;
        }
    }

    async _runEditorCode() {
        if (!this.monacoInstance) return;
        const code = this.monacoInstance.getValue();
        
        console.log("Re-running code...");
        
        // 1. Dispose current renderer resources
        this.disposeRuntime();
        
        // 2. Prepare Blob URL for the new code
        // We need to rewrite imports because Blob URLs change the base path
        // We need to convert ALL relative imports (starting with ./ or ../) to absolute URLs based on the current page location.
        
        const baseUrl = window.location.href.substring(0, window.location.href.lastIndexOf('/'));
        // baseUrl is like "http://localhost:8080/demos"
        
        let processedCode = code;
        
        // Regex to find import paths: import ... from "PATH" or import "PATH"
        // Captures: 1=quote, 2=path, 1=quote
        processedCode = processedCode.replace(/(from\s+['"])(.*?)(['"])|(import\s+['"])(.*?)(['"])/g, (match, p1, p2, p3, p4, p5, p6) => {
            const quoteStart = p1 || p4;
            const path = p2 || p5;
            const quoteEnd = p3 || p6;
            
            // Only process relative paths
            if (path.startsWith('.')) {
                // Resolve absolute path using URL API
                try {
                    const absoluteUrl = new URL(path, baseUrl + '/').href;
                    return `${quoteStart}${absoluteUrl}${quoteEnd}`;
                } catch (e) {
                    console.warn(`Failed to resolve path: ${path}`, e);
                    return match;
                }
            }
            return match;
        });
        
        console.log("Processed Code Imports:", processedCode.substring(0, 500) + "...");
        
        const blob = new Blob([processedCode], { type: 'application/javascript' });
        const blobUrl = URL.createObjectURL(blob);
        
        try {
            // 3. Import and Run
            // Since the code is a module that usually does "new UnifiedRenderer()", importing it should execute it.
            await import(blobUrl);
            console.log("Code re-executed successfully.");
        } catch (e) {
            alert("Runtime Error: " + e.message);
            console.error(e);
        }
    }

    async _exportToScriptScene() {
        if (!this.monacoInstance) return;
        const code = this.monacoInstance.getValue();
        
        try {
            // 1. Fetch Template
            const templateUrl = new URL('./templates/scriptScene.js.txt', import.meta.url);
            const response = await fetch(templateUrl.href);
            if (!response.ok) throw new Error("Template file not found");
            let template = await response.text();
            
            // 2. Extract Logic
            // Strategy: Look for markers first. If not found, use heuristics.
            
            let setupCode = "";
            let animationCode = "";
            let extraMethods = "";

            // Extract Extra Methods (anything inside ScriptScene class that isn't setupScene, setupAnimations, constructor, etc.)
            // We use a simple regex to find methods defined as `name() {` or `async name() {`
            // But doing this reliably with regex is hard.
            // A better approach for this project: explicitly look for `// --- Extra Methods Begin ---` if we add it, 
            // OR, more robustly: extract the methods we know are missing.
            
            // For now, let's extract specific known helper methods if they exist in the code
            const methodsToExtract = ['createInstancedGrid', 'handleResize'];
            
            methodsToExtract.forEach(methodName => {
                const methodRegex = new RegExp(`${methodName}\\s*\\([^)]*\\)\\s*{[\\s\\S]*?^\\s{12}}`, 'm');
                // The regex above is tricky because of matching closing brace. 
                // Let's try to capture the block using a simpler assumption: indentation.
                // Assuming standard formatting: method starts at indent 12, ends with } at indent 12.
                
                // Let's try to match: methodName(...) { ... }
                // We'll capture until the next method definition or class end (heuristic)
                
                // Actually, let's look at the source code structure in demo_instanced_grid.html
                // It's inside class ScriptScene.
                
                const methodMatch = code.match(new RegExp(`(${methodName}\\s*\\([^)]*\\)\\s*{[\\s\\S]*?^\\s{12}})`, 'm'));
                if (methodMatch) {
                     extraMethods += "\n" + methodMatch[1] + "\n";
                }
            });
            
            // Regex for Setup
            const setupMatch = code.match(/\/\/ --- Setup Begin ---([\s\S]*?)\/\/ --- Setup End ---/);
            if (setupMatch) {
                setupCode = setupMatch[1].trim();
            } else {
                // Fallback: Try to find the body of a 'setupScene' function if it exists
                const fnMatch = code.match(/function\s+setupScene\s*\([^)]*\)\s*{([\s\S]*?)}/);
                if (fnMatch) {
                    setupCode = fnMatch[1].trim();
                } else {
                    // Ultimate Fallback: Dump everything that isn't import/export
                    // This is risky but better than empty.
                    // We filter out lines starting with import/export/init()/animate()
                    setupCode = code
                        .replace(/import\s+.*?[\r\n]/g, '')
                        .replace(/export\s+.*?[\r\n]/g, '')
                        .replace(/init\(\);?/g, '')
                        .replace(/animate\(\);?/g, '')
                        .trim();
                }
            }
            
            // Regex for Animation
            const animMatch = code.match(/\/\/ --- Animation Begin ---([\s\S]*?)\/\/ --- Animation End ---/);
            if (animMatch) {
                animationCode = animMatch[1].trim();
            } else {
                 const fnMatch = code.match(/function\s+setupAnimations\s*\([^)]*\)\s*{([\s\S]*?)}/);
                 if (fnMatch) {
                     animationCode = fnMatch[1].trim();
                 }
            }
            
            // 3. Transform Code (Simple AST-like replacements)
            // Replace 'scene.add' with 'this.scene.add' IF it's not already 'this.scene'
            // We use a negative lookbehind (if supported) or just specific replacement
            setupCode = setupCode.replace(/(?<!this\.)scene\.add/g, 'this.scene.add');
            setupCode = setupCode.replace(/(?<!this\.)camera/g, 'this.camera');
            setupCode = setupCode.replace(/(?<!this\.)renderer/g, 'this.renderer');
            
            animationCode = animationCode.replace(/(?<!this\.)sceneObjects/g, 'this.sceneObjects');
            
            // 4. Inject
            template = template.replace('/*{{SETUP_CODE}}*/', setupCode);
            template = template.replace('/*{{ANIMATION_CODE}}*/', animationCode);
            
            // Inject Init Vars
            if (initVarsCode) {
                // Insert after `this.sceneObjects = { tweens: [] };`
                template = template.replace('this.sceneObjects = { tweens: [] };', `this.sceneObjects = { tweens: [] };\n${initVarsCode}`);
            }

            // Inject extra methods before the end of the class
            // We assume the template ends with `}` for the class. We insert before that.
            // Actually, let's add a placeholder in the template or just append to setupAnimations? 
            // No, methods must be class members.
            // Let's replace the last brace `}` with `\n${extraMethods}\n}`
            // But the template has module.exports at the end.
            // Let's find the class closing brace.
            // The template ends with:
            //   handleResize() { ... }
            // }
            // module.exports = ScriptScene;
            
            // We can look for `//===end===` which is inside the class, and append there?
            // No, `//===end===` marks end of setup/anim block.
            
            // Let's replace the handleResize method in template if we have a custom one, 
            // OR just append extra methods before the class closing brace.
            // Finding the class closing brace reliably is hard without a parser.
            // BUT, we can add a new injection point in the template: /*{{EXTRA_METHODS}}*/
            
            // Handle Resize Deduplication
            // If extracted methods include handleResize, we should REMOVE the default handleResize from template first
            if (extraMethods.includes('handleResize')) {
                // Remove default handleResize implementation from template
                // It looks like: handleResize() { ... }
                // We use a regex to match the block.
                template = template.replace(/handleResize\(\)\s*{[\s\S]*?^  }/m, '');
            }

            // Quick fix: Replace `handleResize() {` with `${extraMethods}\n  handleResize() {`
            // This inserts our methods before handleResize.
            // If handleResize was removed above, this won't match, so we need a fallback injection point.
            // We can inject before the last closing brace of the class.
            
            if (template.includes('handleResize() {')) {
                 template = template.replace('handleResize() {', `${extraMethods}\n  handleResize() {`);
            } else {
                 // If handleResize is gone (or wasn't there), inject before class end
                 // Find the last closing brace before module.exports
                 const lastBraceIndex = template.lastIndexOf('}');
                 if (lastBraceIndex !== -1) {
                     template = template.substring(0, lastBraceIndex) + extraMethods + template.substring(lastBraceIndex);
                 }
            }


            
            // 5. Download
            const blob = new Blob([template], { type: 'application/javascript' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'scriptScene.js';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this._addChatMessage('System', '✅ scriptScene.js 导出成功！');
            
        } catch (e) {
            console.error("Export failed:", e);
            this._addChatMessage('System', '❌ 导出失败: ' + e.message);
        }
    }

    _exportToCapCut() {
        this._exportToGameJS();
    }

    async _exportToGameJS() {
        const code = this.monacoInstance ? this.monacoInstance.getValue() : await this._fetchSourceCode();
        const rawPrefix = (window.localStorage && localStorage.getItem('exportFilePrefix')) ? localStorage.getItem('exportFilePrefix') : '';
        const prefix = (rawPrefix || '').trim().replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
        const blob = new Blob([code], { type: 'application/javascript' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = prefix ? `${prefix}-game.js` : 'game.js';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    async _setupSplat() {
        // Dynamic Import for Splat Library
        try {
            console.log("Loading Splat Library...");
            
            const SplatModule = await import('https://unpkg.com/@mkkellogg/gaussian-splats-3d@0.3.1/build/gaussian-splats-3d.module.js');
            console.log("Splat Module Keys:", Object.keys(SplatModule));

            // Based on user logs, 'Viewer' is available. 'GaussianSplatMesh' is NOT exported in this build.
            // We must use 'Viewer' class which encapsulates everything.
            
            const Viewer = SplatModule.Viewer;
            
            if (!Viewer) {
                 throw new Error(`Could not find Viewer class. Available exports: ${Object.keys(SplatModule).join(', ')}`);
            }
            
            console.log("Viewer class found:", Viewer);
            
            // The Viewer class in mkkellogg/gaussian-splats-3d handles its own Three.js scene, camera, and renderer internally by default
            // BUT it can also be configured.
            // Let's look at how to integrate it. 
            // Since we want to control the loop in UnifiedRenderer, we need to be careful.
            // However, the Viewer is designed to "take over".
            // For a "Demo" mode, let's let it take over the container.
            
            // Clean up any existing renderer stuff if UnifiedRenderer created it? 
            // UnifiedRenderer constructor doesn't create renderer until _setupThree.
            
            // Initialize Viewer
            const viewer = new Viewer({
                'cameraUp': [0, 1, 0],
                'initialCameraPosition': [0, 1, 5],
                'initialCameraLookAt': [0, 0, 0],
                'rootElement': this.container, // Render into our container
                'sharedMemoryForWorkers': false, // DISABLE SHARED MEMORY to prevent TypedArray errors in some envs
                'useBuiltInControls': true,
                'ignoreDevicePixelRatio': false,
                'gpuAcceleratedSort': true // Try GPU sort if available, else CPU
            });
            
            this.splatViewer = viewer;
            
            // Load the file
            if (this.params.url) {
                // Configure CORS helper for splat files
                // Using cors-anywhere proxy if needed, or ensuring the URL allows CORS.
                // The Viewer internally uses fetch/XHR.
                
                viewer.addSplatScene(this.params.url, {
                    'splatAlphaRemovalThreshold': 5,
                    'showLoadingUI': false,
                    'position': [0, 0, 0],
                    'rotation': [0, 0, 0, 1],
                    'scale': [1, 1, 1]
                })
                .then(() => {
                    viewer.start();
                    console.log("Splat scene loaded and started.");
                    const loading = document.getElementById('loading');
                    if(loading) loading.style.display = 'none';
                })
                .catch(err => {
                    console.error(err);
                    this._handleError("Splat Load Error: " + err);
                });
            }
            
            // We override our internal loop to do nothing, or we hook into it?
            // The Viewer has its own requestAnimationFrame.
            // So we should NOT call this.play() in the standard way.
            this._isRunning = true; // Mark as running so we don't double start
            
            // We still want to call initCallback so user can add UI
            // But we might need to expose the viewer's internals
            // viewer.threeScene, viewer.camera, viewer.renderer
            
            // Wait for viewer to be ready?
            // Let's expose what we can.
            this.scene = viewer.threeScene; // Might be null until initialized
            this.camera = viewer.camera;
            this.renderer = viewer.renderer;
            
            this.initCallback(this);

        } catch (e) {
            console.error(e);
            this._handleError("Failed to load Splat library: " + e.message);
        }
    }

    _setupThree() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);

        // Camera
        const { width, height } = this._getContainerMetrics();
        const aspect = width / height;
        this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
        this.camera.position.z = 5;

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap pixel ratio for performance
        this.container.appendChild(this.renderer.domElement);

        // Special Setup for Shader Demos
        if (this.fragmentShader) {
            this._setupShaderMode();
        } else {
            // Default Controls for standard 3D
            this.controls = new TrackballControls(this.camera, this.renderer.domElement);
            this.controls.rotateSpeed = 2.0;
        }

        // Force a render
        this.renderer.render(this.scene, this.camera);
    }

    _setupShaderMode() {
        // For shaders, we usually want an Orthographic camera or just a full screen quad
        // Here we use a plane filling the view of the perspective camera
        
        // Standard Uniforms for Shadertoy-like porting
        const { width, height } = this._getContainerMetrics();
        this.uniforms = {
            uTime: { value: 0 },
            uResolution: { value: new THREE.Vector2(width, height) },
            uMouse: { value: new THREE.Vector2(0, 0) }
        };

        // Merge user params into uniforms if they match known types
        for (const [key, val] of Object.entries(this.params)) {
            this.uniforms[key] = { value: val };
        }

        const geometry = new THREE.PlaneGeometry(2, 2);
        const material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = vec4(position, 1.0);
                }
            `,
            fragmentShader: this.fragmentShader
        });

        const mesh = new THREE.Mesh(geometry, material);
        this.scene.add(mesh);
        
        // We don't need standard controls for a flat shader usually, 
        // but we keep the camera simple.
    }

    _setupP5() {
        // Verify p5 exists
        if (typeof p5 === 'undefined') {
            throw new Error("p5.js library is not loaded. Please include it in your HTML.");
        }

        this.p5Instance = new p5((p) => {
            p.setup = () => {
                const { width, height } = this._getContainerMetrics();
                p.createCanvas(width, height);
                this.initCallback(p, this);
            };

            p.draw = () => {
                const deltaTime = p.deltaTime / 1000;
                const time = p.millis() / 1000;
                
                try {
                    this.updateCallback({ time, deltaTime }, this);
                    this.drawCallback(p, this);
                } catch (e) {
                    this._handleError(e);
                    p.noLoop();
                }
            };

            p.windowResized = () => {
                this._onResize();
            };
        }, this.container);
    }

    _setupEvents() {
        this._onResizeBound = () => this._onResize();
        window.addEventListener('resize', this._onResizeBound);

        if (window.ResizeObserver && !this._resizeObserver) {
            this._resizeObserver = new ResizeObserver(() => this._onResize());
            try {
                this._resizeObserver.observe(this.container);
            } catch (e) {
                try {
                    this._resizeObserver.disconnect();
                } catch (e2) {}
                this._resizeObserver = null;
            }
        }
        
        // Mouse State Tracking
        this._isMouseDown = false;
        this._onMouseDownBound = () => { this._isMouseDown = true; };
        this._onMouseUpBound = () => { this._isMouseDown = false; };
        window.addEventListener('mousedown', this._onMouseDownBound);
        window.addEventListener('mouseup', this._onMouseUpBound);

        // Mouse move for uniforms
        const updateMouseFromClient = (clientX, clientY) => {
            if (this.uniforms && this.uniforms.uMouse) {
                const { width, height, left, top } = this._getContainerMetrics();
                const x = Math.max(0, Math.min(width, clientX - left));
                const y = Math.max(0, Math.min(height, clientY - top));
                this.uniforms.uMouse.value.x = x;
                this.uniforms.uMouse.value.y = height - y;
            }
        };

        this._onMouseMoveBound = (e) => {
            if (this.mouseDragOnly && !this._isMouseDown) return;
            updateMouseFromClient(e.clientX, e.clientY);
        };
        window.addEventListener('mousemove', this._onMouseMoveBound);

        // Touch Adapter for Mobile
        this._onTouchMoveBound = (e) => {
            if (e.touches.length > 0) {
                e.preventDefault(); // Prevent scrolling
                const touch = e.touches[0];
                updateMouseFromClient(touch.clientX, touch.clientY);
            }
        };
        window.addEventListener('touchmove', this._onTouchMoveBound, { passive: false });

        this._onTouchStartBound = (e) => {
            if (e.touches.length > 0) {
                const touch = e.touches[0];
                updateMouseFromClient(touch.clientX, touch.clientY);
            }
        };
        window.addEventListener('touchstart', this._onTouchStartBound, { passive: false });
    }

    _onResize() {
        if (this._isDestroyed) return;
        const { width, height } = this._getContainerMetrics();

        if (this.type === 'splat' && this.splatViewer) {
            // Viewer usually listens to resize itself if we pass window as root?
            // But we passed a container.
            // There isn't a documented resize method on Viewer, 
            // but it might check clientWidth/Height of rootElement on its loop.
            // Let's force a style update just in case.
        } else if (this.type === 'three' || this.type === 'shader') {
            if (!this.camera || !this.renderer) return;
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            this.renderer.setPixelRatio(dpr);
            this.renderer.setSize(width, height);
            
            if (this.uniforms && this.uniforms.uResolution) {
                this.uniforms.uResolution.value.set(width, height);
            }

            if (this.controls && typeof this.controls.handleResize === 'function') this.controls.handleResize();
        } else if (this.type === 'p5' && this.p5Instance) {
            this.p5Instance.resizeCanvas(width, height);
        }
        
        if (this.onResize) this.onResize(width, height);
    }

    _setupMessaging() {
        this._onMessage = (event) => {
            const data = event.data;
            if (!data) return;

            if (data.type === 'HANDSHAKE') {
                this.sendConfig();
            }

            if (data.type === 'UPDATE_PARAM') {
                const { key, value } = data;
                
                // Update params object
                this.params[key] = value;

                // Auto-update uniforms if they exist
                if (this.uniforms && this.uniforms[key]) {
                    // Handle Color conversion if needed
                    if (typeof value === 'string' && value.startsWith('#') && this.uniforms[key].value.isColor) {
                        this.uniforms[key].value.set(value);
                    } else if (value && value.type === 'file' && value.url) {
                        // Handle File Upload (Texture)
                        new THREE.TextureLoader().load(value.url, (texture) => {
                            this.uniforms[key].value = texture;
                            texture.needsUpdate = true;
                        });
                    } else {
                        this.uniforms[key].value = value;
                    }
                }

                // Handle Action Buttons (Functions in params)
                // If the value is a timestamp (often sent by buttons), check if params[key] is a function
                if (typeof this.params[key] === 'function') {
                    this.params[key]();
                    return; // Don't overwrite the function with the timestamp
                }

                // Call user callback
                this.onParamChange(key, value, this);
            }
        };
        window.addEventListener('message', this._onMessage);

        if (window.parent) {
            window.parent.postMessage({ type: 'HANDSHAKE' }, '*');
        }
    }

    /**
     * Clean up resources to prevent memory leaks when reloading or destroying the renderer.
     */
    dispose() {
        if (this._isDestroyed) return;
        this._isDestroyed = true;

        console.log("UnifiedRenderer: Disposing...");

        // 1. Stop the loop
        this.pause();

        // 2. Remove Event Listeners
        if (this._resizeTimeoutId) {
            clearTimeout(this._resizeTimeoutId);
            this._resizeTimeoutId = null;
        }
        if (this._resizeObserver) {
            try {
                this._resizeObserver.disconnect();
            } catch (e) {}
            this._resizeObserver = null;
        }
        if (this._onResizeBound) window.removeEventListener('resize', this._onResizeBound);
        if (this._onMouseMoveBound) window.removeEventListener('mousemove', this._onMouseMoveBound);
        if (this._onMouseDownBound) window.removeEventListener('mousedown', this._onMouseDownBound);
        if (this._onMouseUpBound) window.removeEventListener('mouseup', this._onMouseUpBound);
        if (this._onTouchMoveBound) window.removeEventListener('touchmove', this._onTouchMoveBound);
        if (this._onTouchStartBound) window.removeEventListener('touchstart', this._onTouchStartBound);
        if (this._onMessage) window.removeEventListener('message', this._onMessage);
        if (this._onError) window.removeEventListener('error', this._onError);
        if (this._onUnhandledRejection) window.removeEventListener('unhandledrejection', this._onUnhandledRejection);
        if (this._workbenchKeyHandler) window.removeEventListener('keydown', this._workbenchKeyHandler);
        if (this._onWorkbenchResizeMove) window.removeEventListener('pointermove', this._onWorkbenchResizeMove);
        if (this._onWorkbenchResizeUp) window.removeEventListener('pointerup', this._onWorkbenchResizeUp);
        this._onWorkbenchResizeMove = null;
        this._onWorkbenchResizeUp = null;
        this._isResizingWorkbench = false;
        document.body.style.cursor = '';
        this._workbenchEventsBound = false;

        // 3. Destroy Three.js Resources
        if (this.renderer) {
            this.renderer.dispose();
            if (this.renderer.domElement && this.renderer.domElement.parentNode) {
                this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
            }
        }

        if (this.scene) {
            this.scene.traverse((object) => {
                if (object.geometry) {
                    object.geometry.dispose();
                }
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach(material => this._disposeMaterial(material));
                    } else {
                        this._disposeMaterial(object.material);
                    }
                }
            });
        }

        if (this.controls) {
            this.controls.dispose();
        }
        this._cleanupUI();

        // 4. Destroy p5.js Instance
        if (this.p5Instance) {
            this.p5Instance.remove();
            this.p5Instance = null;
        }

        // 5. Destroy Splat Viewer
        if (this.splatViewer) {
            // Check if viewer has a dispose method
            if (typeof this.splatViewer.dispose === 'function') {
                this.splatViewer.dispose();
            }
            this.splatViewer = null;
        }

        // 6. User Custom Cleanup
        if (this.onDispose) {
            try {
                this.onDispose();
            } catch (e) {
                console.error("Error in onDispose callback:", e);
            }
        }

        // 7. Clear References
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.container.innerHTML = '';

        console.log("UnifiedRenderer: Disposed.");
    }

    disposeRuntime() {
        if (this._isDestroyed) return;

        this.pause();

        if (this._resizeTimeoutId) {
            clearTimeout(this._resizeTimeoutId);
            this._resizeTimeoutId = null;
        }
        if (this._resizeObserver) {
            try {
                this._resizeObserver.disconnect();
            } catch (e) {}
            this._resizeObserver = null;
        }
        if (this._onResizeBound) window.removeEventListener('resize', this._onResizeBound);
        if (this._onMouseMoveBound) window.removeEventListener('mousemove', this._onMouseMoveBound);
        if (this._onTouchMoveBound) window.removeEventListener('touchmove', this._onTouchMoveBound);
        if (this._onTouchStartBound) window.removeEventListener('touchstart', this._onTouchStartBound);
        if (this._onMessage) window.removeEventListener('message', this._onMessage);
        if (this._onError) window.removeEventListener('error', this._onError);
        if (this._onUnhandledRejection) window.removeEventListener('unhandledrejection', this._onUnhandledRejection);
        if (this._workbenchKeyHandler) window.removeEventListener('keydown', this._workbenchKeyHandler);
        if (this._onWorkbenchResizeMove) window.removeEventListener('pointermove', this._onWorkbenchResizeMove);
        if (this._onWorkbenchResizeUp) window.removeEventListener('pointerup', this._onWorkbenchResizeUp);
        this._onWorkbenchResizeMove = null;
        this._onWorkbenchResizeUp = null;
        this._isResizingWorkbench = false;
        document.body.style.cursor = '';
        this._workbenchEventsBound = false;

        if (this.renderer) {
            this.renderer.dispose();
            if (this.renderer.domElement && this.renderer.domElement.parentNode) {
                this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
            }
        }

        if (this.scene) {
            this.scene.traverse((object) => {
                if (object.geometry) {
                    object.geometry.dispose();
                }
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach(material => this._disposeMaterial(material));
                    } else {
                        this._disposeMaterial(object.material);
                    }
                }
            });
        }

        if (this.controls) {
            this.controls.dispose();
        }
        this._cleanupUI();

        if (this.p5Instance) {
            this.p5Instance.remove();
            this.p5Instance = null;
        }

        if (this.splatViewer) {
            if (typeof this.splatViewer.dispose === 'function') {
                this.splatViewer.dispose();
            }
            this.splatViewer = null;
        }

        if (this.onDispose) {
            try {
                this.onDispose();
            } catch (e) {
                console.error("Error in onDispose callback:", e);
            }
        }

        this.scene = null;
        this.camera = null;
        this.renderer = null;
    }

    _disposeMaterial(material) {
        material.dispose();
        // Dispose textures
        for (const key of Object.keys(material)) {
            const value = material[key];
            if (value && typeof value === 'object' && 'minFilter' in value) {
                value.dispose();
            }
        }
    }

    // --- Public API ---

    /**
     * Capture the current canvas state as an image
     * @param {string} format - 'image/png' or 'image/jpeg'
     * @param {number} quality - 0.0 to 1.0
     * @returns {string} - Data URL of the image
     */
    capture(format = 'image/png', quality = 0.9) {
        if (!this.renderer) return null;
        
        // Ensure we capture the latest frame
        if (this.type === 'three' || this.type === 'shader') {
            this.renderer.render(this.scene, this.camera);
            return this.renderer.domElement.toDataURL(format, quality);
        } else if (this.type === 'p5' && this.p5Instance) {
            return this.p5Instance.canvas.toDataURL(format, quality);
        }
        return null;
    }

    setUI(config) {
        this.uiConfig = config;
        this.sendConfig();
    }
    
    // Alias for createUI to match some demos
    createUI(config) {
        this.setUI(config);
    }

    sendConfig() {
        if (window.parent && this.uiConfig) {
            window.parent.postMessage({ 
                type: 'UI_CONFIG', 
                config: this.uiConfig 
            }, '*');
        }
    }

    play() {
        if (this._isRunning) return;
        this._isRunning = true;
        this._loop();
    }

    pause() {
        this._isRunning = false;
        if (this._animationId) {
            cancelAnimationFrame(this._animationId);
        }
    }

    _loop() {
        if (!this._isRunning) return;

        // If Splat Viewer is active, it handles its own loop internally (viewer.start())
        // But we might want to update stats or custom logic.
        // However, if we call requestAnimationFrame here, we might double-loop.
        // For 'splat' type, let's rely on the Viewer's loop OR hook into it if possible.
        // The mkkellogg Viewer doesn't easily expose a "render frame" method for external loops without modification.
        // So for 'splat' type, we simply return and let the viewer drive.
        if (this.type === 'splat') {
             // We can still update stats if we want, but syncing is hard.
             // Let's assume Viewer handles it.
             return; 
        }

        this._animationId = requestAnimationFrame(() => this._loop());

        if (this.stats) this.stats.begin();

        const deltaTime = this.clock.getDelta();
        const time = this.clock.getElapsedTime();

        try {
            if (this.type === 'splat') {
                if (this.controls) this.controls.update();
                if (this.splatMesh) this.splatMesh.update();
                this.renderer.render(this.scene, this.camera);
            } else if (this.type === 'three' || this.type === 'shader') {
                if (this.controls) this.controls.update();
                
                // Update Uniforms
                if (this.uniforms && this.uniforms.uTime) {
                    this.uniforms.uTime.value = time;
                }

                this.updateCallback({ time, deltaTime, scene: this.scene, camera: this.camera, renderer: this.renderer }, this);
                
                // Support custom render loop (e.g. Composer)
                if (this.customRender) {
                    this.customRender(this, time, deltaTime);
                } else if (this.composer) {
                    this.composer.render();
                } else {
                    this.renderer.render(this.scene, this.camera);
                }
            }
        } catch (e) {
            this._handleError(e);
        }

        if (this.stats) this.stats.end();
    }
}
