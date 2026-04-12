
/**
 * UnifiedRenderer.js
 * A standardized base class for Creative Coding demos.
 * Handles lifecycle, resize, UI communication, and Three.js/P5.js setup.
 * 
 * Version: 2.1 (Phase 1 Refactored: No cross-iframe DOM, No workbench, V1.0 messaging)
 */

import * as THREE from 'three';
import { TrackballControls } from 'three/addons/controls/TrackballControls.js';
import Stats from 'three/addons/libs/stats.module.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

export class UnifiedRenderer {
    constructor(options = {}) {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.stats = null;
        this.clock = new THREE.Clock();
        
        this.container = options.container || document.body;
        this.type = options.type || 'three';
        this.params = options.params || {};
        this.onParamChange = options.onParamChange || (() => {}); 
        this.showStats = options.showStats !== false;
        this.buffers = options.buffers || false;
        this.audio = options.audio || false;
        this.mouseDragOnly = options.mouseDragOnly || false;
        
        this.fragmentShader = options.fragmentShader || null;
        this.uniforms = {};

        this.initCallback = options.init || options.onInit || (() => {});
        this.updateCallback = options.update || (() => {});
        this.drawCallback = options.draw || (() => {});
        this.customRender = options.customRender || null;
        
        this._isRunning = false;
        this._animationId = null;
        this._isDestroyed = false;
        this._effectPasses = [];
        this._composerActive = false;
        this._renderPass = null;
        this._sessionId = '';
        
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
        this.pause();
        this._sendProtocolMessage('RUNTIME_ERROR', {
            message: error.toString(),
            stack: error.stack || null,
            timestamp: Date.now(),
        });
        let errDiv = document.getElementById('unified-error-overlay');
        if (!errDiv) {
            errDiv = document.createElement('div');
            errDiv.id = 'unified-error-overlay';
            errDiv.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(40,0,0,0.9);color:#ff6b6b;padding:40px;font-family:monospace;font-size:16px;z-index:9999;box-sizing:border-box;overflow:auto;';
            document.body.appendChild(errDiv);
        }
        errDiv.innerHTML = '<h2 style="margin-top:0;color:#ff3333">⚠️ Runtime Error</h2><pre style="white-space:pre-wrap;background:rgba(0,0,0,0.5);padding:20px;border-radius:8px">' + error.toString() + '</pre><p style="color:#888;font-size:12px;margin-top:20px">Check the console for full stack trace.</p>';
    }

    _sendProtocolMessage(type, payload) {
        if (window.parent) {
            window.parent.postMessage({
                channel: 'cupcut-lab',
                version: 1,
                sessionId: this._sessionId || '',
                type: type,
                payload: payload || {},
                timestamp: Date.now(),
            }, '*');
        }
    }

    _setup() {
        if (this.showStats) {
            this.stats = new Stats();
            this.stats.dom.style.position = 'absolute';
            this.stats.dom.style.top = '0';
            this.stats.dom.style.left = '0';
            this.stats.dom.style.zIndex = '10';
            this.stats.dom.id = 'unified-stats';
            const existingStats = this.container.querySelector('#unified-stats');
            if (existingStats) existingStats.remove();
            this.container.appendChild(this.stats.dom);
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
        
        if (this.type === 'three' || this.type === 'shader' || this.type === 'custom') {
            this.initCallback(this);
            if (this.type !== 'custom') this.play();
        }
    }

    async _setupSplat() {
        try {
            console.log("Loading Splat Library...");
            
            const SplatModule = await import('https://unpkg.com/@mkkellogg/gaussian-splats-3d@0.3.1/build/gaussian-splats-3d.module.js');
            console.log("Splat Module Keys:", Object.keys(SplatModule));

            const Viewer = SplatModule.Viewer;
            
            if (!Viewer) {
                 throw new Error(`Could not find Viewer class. Available exports: ${Object.keys(SplatModule).join(', ')}`);
            }
            
            console.log("Viewer class found:", Viewer);
            
            const viewer = new Viewer({
                'cameraUp': [0, 1, 0],
                'initialCameraPosition': [0, 1, 5],
                'initialCameraLookAt': [0, 0, 0],
                'rootElement': this.container,
                'sharedMemoryForWorkers': false,
                'useBuiltInControls': true,
                'ignoreDevicePixelRatio': false,
                'gpuAcceleratedSort': true
            });
            
            this.splatViewer = viewer;
            
            if (this.params.url) {
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
            
            this._isRunning = true;
            
            this.scene = viewer.threeScene;
            this.camera = viewer.camera;
            this.renderer = viewer.renderer;
            
            this.initCallback(this);

        } catch (e) {
            console.error(e);
            this._handleError("Failed to load Splat library: " + e.message);
        }
    }

    _setupThree() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);

        const { width, height } = this._getContainerMetrics();
        const aspect = width / height;
        this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
        this.camera.position.z = 5;

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.container.appendChild(this.renderer.domElement);

        if (this.fragmentShader) {
            this._setupShaderMode();
        } else {
            this.controls = new TrackballControls(this.camera, this.renderer.domElement);
            this.controls.rotateSpeed = 2.0;
        }

        this.renderer.render(this.scene, this.camera);
    }

    _setupShaderMode() {
        const { width, height } = this._getContainerMetrics();
        this.uniforms = {
            uTime: { value: 0 },
            uResolution: { value: new THREE.Vector2(width, height) },
            uMouse: { value: new THREE.Vector2(0, 0) }
        };

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
    }

    _setupP5() {
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
        
        this._isMouseDown = false;
        this._onMouseDownBound = () => { this._isMouseDown = true; };
        this._onMouseUpBound = () => { this._isMouseDown = false; };
        window.addEventListener('mousedown', this._onMouseDownBound);
        window.addEventListener('mouseup', this._onMouseUpBound);

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

        this._onTouchMoveBound = (e) => {
            if (e.touches.length > 0) {
                e.preventDefault();
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
            // Viewer handles its own resize
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
        
        if (this.composer) {
            this.composer.setSize(width, height);
        }

        if (this.onResize) this.onResize(width, height);
    }

    _setupMessaging() {
        this._onMessage = (event) => {
            const data = event.data;
            if (!data) return;
            let type = data.type;
            let payload = data;
            if (data.channel === 'cupcut-lab' && data.version === 1) {
                type = data.type;
                payload = data.payload;
                if (data.sessionId) this._sessionId = data.sessionId;
            }
            if (type === 'HANDSHAKE') {
                if (payload && payload.sessionId) this._sessionId = payload.sessionId;
                this.sendConfig();
            }
            if (type === 'UPDATE_PARAM') {
                const { key, value } = payload;
                this.params[key] = value;
                if (this.uniforms && this.uniforms[key]) {
                    if (typeof value === 'string' && value.startsWith('#') && this.uniforms[key].value && this.uniforms[key].value.isColor) {
                        this.uniforms[key].value.set(value);
                    } else if (value && value.type === 'file' && value.url) {
                        new THREE.TextureLoader().load(value.url, (texture) => {
                            this.uniforms[key].value = texture;
                            texture.needsUpdate = true;
                        });
                    } else {
                        this.uniforms[key].value = value;
                    }
                }
                if (typeof this.params[key] === 'function') {
                    this.params[key]();
                    return;
                }
                this._applyEffectParam(key, value);
                this.onParamChange(key, value, this);
            }
            if (type === 'REQUEST_CAPABILITIES') {
                this._sendProtocolMessage('CAPABILITIES', this.getCapabilities());
            }
        };
        window.addEventListener('message', this._onMessage);
        if (window.parent) {
            window.parent.postMessage({ type: 'HANDSHAKE' }, '*');
        }
    }

    dispose() {
        if (this._isDestroyed) return;
        this._isDestroyed = true;

        console.log("UnifiedRenderer: Disposing...");

        this.pause();

        if (this.composer) {
            this._disposeComposer();
        }

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

        if (this.stats && this.stats.dom && this.stats.dom.parentNode) {
            this.stats.dom.parentNode.removeChild(this.stats.dom);
        }

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
        this.container.innerHTML = '';

        console.log("UnifiedRenderer: Disposed.");
    }

    disposeRuntime() {
        if (this._isDestroyed) return;

        this.pause();

        if (this.composer) {
            this._disposeComposer();
        }

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

        if (this.stats && this.stats.dom && this.stats.dom.parentNode) {
            this.stats.dom.parentNode.removeChild(this.stats.dom);
        }

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
        for (const key of Object.keys(material)) {
            const value = material[key];
            if (value && typeof value === 'object' && 'minFilter' in value) {
                value.dispose();
            }
        }
    }

    _ensureComposer() {
        if (this.composer) return this.composer;
        this.composer = new EffectComposer(this.renderer);
        const renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);
        this._renderPass = renderPass;
        this._composerActive = true;
        return this.composer;
    }

    _disposeComposer() {
        if (!this.composer) return;
        const passes = this.composer.passes || [];
        for (const pass of passes) {
            if (typeof pass.dispose === 'function') {
                pass.dispose();
            }
        }
        this.composer.passes = [];
        if (this.composer.renderTarget1) this.composer.renderTarget1.dispose();
        if (this.composer.renderTarget2) this.composer.renderTarget2.dispose();
        this.composer = null;
        this._renderPass = null;
        this._composerActive = false;
        this._effectPasses = [];
    }

    _registerEffect(name, pass, options = {}) {
        if (this._findEffect(name)) {
            this.removeEffect(name);
        }
        const entry = {
            name,
            pass,
            category: options.category || 'postprocessing',
            paramMap: options.params || {},
            meta: options.meta || {}
        };
        this.composer.addPass(pass);
        for (const [paramKey, mapping] of Object.entries(entry.paramMap)) {
            if (!(paramKey in this.params)) {
                this.params[paramKey] = mapping.value;
            }
        }
        this._effectPasses.push(entry);
    }

    _findEffect(name) {
        return this._effectPasses.find(e => e.name === name) || null;
    }

    _applyEffectParam(key, value) {
        for (const entry of this._effectPasses) {
            const mapping = entry.paramMap && entry.paramMap[key];
            if (!mapping) continue;
            const pass = entry.pass;
            if (mapping.apply) {
                mapping.apply(pass, value);
            } else if (mapping.passProp) {
                pass[mapping.passProp] = value;
            }
        }
    }

    _downgradeToDirectRender() {
        if (!this.composer) return;
        if (this.composer.passes.length > 1) return;
        this._disposeComposer();
    }

    addBloom(options = {}) {
        const config = {
            strength: options.strength ?? 1.5,
            radius: options.radius ?? 0.4,
            threshold: options.threshold ?? 0.0,
        };
        this._ensureComposer();
        const { width, height } = this._getContainerMetrics();
        const pass = new UnrealBloomPass(
            new THREE.Vector2(width, height),
            config.strength,
            config.radius,
            config.threshold
        );
        this._registerEffect('bloom', pass, {
            category: 'postprocessing',
            params: {
                bloomStrength: { value: config.strength, passProp: 'strength', ui: { name: 'Bloom 强度', min: 0, max: 3, step: 0.1, type: 'range' } },
                bloomRadius: { value: config.radius, passProp: 'radius', ui: { name: 'Bloom 半径', min: 0, max: 1, step: 0.01, type: 'range' } },
                bloomThreshold: { value: config.threshold, passProp: 'threshold', ui: { name: 'Bloom 阈值', min: 0, max: 1, step: 0.01, type: 'range' } },
            },
            meta: {
                description: '泛光后处理效果',
                tags: ['glow', 'light', 'bloom'],
                version: '1.0',
                author: 'engine'
            }
        });
        return this;
    }

    addGlitch(options = {}) {
        const config = {
            intensity: options.intensity ?? 0.5,
        };
        this._ensureComposer();
        const GlitchShader = {
            uniforms: {
                tDiffuse: { value: null },
                uIntensity: { value: config.intensity },
                uTime: { value: 0 },
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D tDiffuse;
                uniform float uIntensity;
                uniform float uTime;
                varying vec2 vUv;
                float rand(vec2 co) {
                    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
                }
                void main() {
                    vec2 uv = vUv;
                    float glitchTrigger = step(1.0 - uIntensity * 0.15, rand(vec2(uTime * 0.1, floor(uv.y * 50.0))));
                    float offset = (rand(vec2(uTime, uv.y)) - 0.5) * 0.1 * uIntensity * glitchTrigger;
                    uv.x += offset;
                    vec4 color = texture2D(tDiffuse, uv);
                    float scanline = sin(uv.y * 800.0 + uTime * 5.0) * 0.04 * uIntensity;
                    color.rgb -= scanline;
                    if (glitchTrigger > 0.5) {
                        color.r = texture2D(tDiffuse, uv + vec2(offset * 0.5, 0.0)).r;
                        color.b = texture2D(tDiffuse, uv - vec2(offset * 0.5, 0.0)).b;
                    }
                    gl_FragColor = color;
                }
            `
        };
        const pass = new ShaderPass(GlitchShader);
        this._registerEffect('glitch', pass, {
            category: 'postprocessing',
            params: {
                glitchIntensity: {
                    value: config.intensity,
                    ui: { name: 'Glitch 强度', min: 0, max: 1, step: 0.05, type: 'range' },
                    apply: (p, v) => { p.uniforms.uIntensity.value = v; }
                },
            },
            meta: {
                description: '故障风格后处理效果',
                tags: ['cyberpunk', 'distortion', 'glitch'],
                version: '1.0',
                author: 'engine'
            }
        });
        this._glitchPass = pass;
        return this;
    }

    addCustomPass(pass, options = {}) {
        const name = options.name || `custom_${Date.now()}`;
        this._ensureComposer();
        if (pass.isPass && pass.constructor.name === 'RenderPass') {
            console.warn('addCustomPass: RenderPass 由引擎自动管理，无需手动添加');
            return this;
        }
        this._registerEffect(name, pass, {
            category: options.category || 'custom',
            params: options.params || {},
            meta: options.meta || {}
        });
        return this;
    }

    removeEffect(name) {
        const entry = this._findEffect(name);
        if (!entry) return this;
        const idx = this.composer.passes.indexOf(entry.pass);
        if (idx !== -1) {
            this.composer.passes.splice(idx, 1);
        }
        if (typeof entry.pass.dispose === 'function') {
            entry.pass.dispose();
        }
        this._effectPasses = this._effectPasses.filter(e => e.name !== name);
        for (const [paramKey] of Object.entries(entry.paramMap || {})) {
            delete this.params[paramKey];
        }
        if (name === 'glitch') {
            this._glitchPass = null;
        }
        this._downgradeToDirectRender();
        return this;
    }

    getCapabilities() {
        return {
            engine: 'UnifiedRenderer',
            version: '2.2',
            type: this.type,
            hasComposer: !!this.composer,
            effects: this._effectPasses.map(entry => ({
                name: entry.name,
                category: entry.category,
                description: entry.meta.description || '',
                tags: entry.meta.tags || [],
                params: Object.entries(entry.paramMap).map(([key, mapping]) => ({
                    bind: key,
                    ...mapping.ui,
                    value: this.params[key] ?? mapping.value
                }))
            })),
            customParams: this.uiConfig || []
        };
    }

    // --- Public API ---

    capture(format = 'image/png', quality = 0.9) {
        if (!this.renderer) return null;
        
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
    
    createUI(config) {
        this.setUI(config);
    }

    sendConfig() {
        if (this.uiConfig) {
            this._sendProtocolMessage('UI_CONFIG', { config: this.uiConfig });
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

        if (this.type === 'splat') {
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
                
                if (this.uniforms && this.uniforms.uTime) {
                    this.uniforms.uTime.value = time;
                }

                this.updateCallback({ time, deltaTime, scene: this.scene, camera: this.camera, renderer: this.renderer }, this);
                
                if (this._glitchPass) {
                    this._glitchPass.uniforms.uTime.value = time;
                }

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
