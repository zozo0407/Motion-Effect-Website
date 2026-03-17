/**
 * 场景核心模块
 * 
 * 包含Three.js核心对象的创建和管理
 * 提供场景管理的核心功能：初始化、配置和更新
 */

// ThreeJS Env
// 导入TWEEN库
const TWEEN = require('../lib/tween');
// 导入Three.js库
const THREE = require('three');


// Effect Env
// 导入TWEEN库
// const TWEEN = require('./tween');
// 导入Three.js 的 wrapper库
// const THREE = require('./three-amg-wrapper').THREE;

/**
 * ScriptScene类 - 3D场景管理器
 * 负责创建和管理Three.js场景、相机、渲染器及场景对象
 */
class ScriptScene {
    /**
     * 构造函数，创建场景管理器
     * @param {effect.Amaz.Scene} [amgScene] - AMG场景对象，可选参数
     * @param {HTMLElement} [container] - 放置渲染器的DOM容器，可选参数
     */
    constructor(amgScene = null, container = null) {
        // 核心对象初始化
        if (amgScene) {
            this.scene = new THREE.Scene();
            this.scene._amgScene = amgScene;
        } else {
            this.scene = new THREE.Scene();
        }
        this.effect_type = "transition";
        this.camera = null;
        this.renderer = null;
        this.scene.background = new THREE.Color(0x333333);
        this.isAnimating = false;
        this.animationFrameId = null;
        this.sceneObjects = null;

        this.texture1 = null;
        this.texture2 = null;
        this.texture3 = null;
        this.texture4 = null;
        this.texture5 = null;
        this.texture6 = null;
        this.texture7 = null;
        this.texture8 = null;
        this.texture9 = null;

        // 后处理相关属性
        this.composer = null;
        this.renderPass = null;
        this.usePostProcessing = true; // 是否启用后处理效果
        this.ambientLight = null;
        this.directionalLight = null;
        this._effectDefaults = null;

        // 初始化核心对象和基本场景
        this.initCoreObjects();
        if (container) {
            this.init(container);
        }
    }

    /**
     * 析构函数，清理场景并释放资源
     * 在不再需要场景时调用，确保正确释放内存和停止动画循环
     */
    destroy() {
        // 停止动画循环
        this.isAnimating = false;

        // 取消动画帧请求
        if (this.animationFrameId !== null && typeof cancelAnimationFrame !== 'undefined') {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        // 清理渲染器
        if (this.renderer) {
            this.renderer.setAnimationLoop(null);
            this.renderer.dispose();

            // 移除渲染器的DOM元素
            if (this.renderer.domElement && this.renderer.domElement.parentNode) {
                this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
            }
        }

        // 清理场景中的对象
        if (this.scene) {
            this.scene.dispose();
        }

        // 移除窗口事件监听器
        if (typeof window !== 'undefined') {
            window.removeEventListener('resize', this.handleResize);
        }

        // 清理TWEEN动画
        if (this.sceneObjects && this.sceneObjects.tweens) {
            this.sceneObjects.tweens.forEach(tween => {
                if (tween && typeof tween.stop === 'function') {
                    tween.stop();
                }
            });
            this.sceneObjects.tweens = [];
        }

        // 清理后处理效果
        if (this.composer) {
            this.composer.dispose();
            this.composer = null;
        }

        this.renderPass = null;

        // 清理引用
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.sceneObjects = null;
    }

    /**
     * 初始化Three.js核心对象
     * 包括场景、相机和渲染器
     */
    initCoreObjects() {
        window.innerWidth = 600;
        window.innerHeight = 600;
        window.devicePixelRatio = 1;
        // 创建透视相机
        this.camera = new THREE.PerspectiveCamera(
            53.1,                                 // 视场角
            window.innerWidth / window.innerHeight, // 纵横比
            0.1,                                // 近平面
            10000                                // 远平面
        );
        this.camera.position.z = 10;  // 设置默认相机位置
        this.scene.add(this.camera);

        // 添加默认基础光源
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8); // 柔和的环境光
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2); // 主光源
        directionalLight.position.set(5, 10, 7.5);
        this.scene.add(directionalLight);
        this.ambientLight = ambientLight;
        this.directionalLight = directionalLight;

        // 创建渲染器，启用抗锯齿
        // 当amgScene为null时，创建渲染器
        if (this.scene._amgScene == null) {
            this.renderer = new THREE.WebGLRenderer({ antialias: true });
            this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
        }
        if (this.renderer) {
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.setPixelRatio(window.devicePixelRatio);
        }
        const defaultRenderer = this.renderer ? {
            toneMapping: this.renderer.toneMapping,
            exposure: this.renderer.toneMappingExposure,
            outputColorSpace: this.renderer.outputColorSpace
        } : null;
        this._effectDefaults = {
            fog: this.scene.fog || null,
            lightingRig: {
                ambientIntensity: ambientLight.intensity,
                ambientColor: ambientLight.color.clone(),
                directionalIntensity: directionalLight.intensity,
                directionalColor: directionalLight.color.clone(),
                directionalDirection: directionalLight.position.clone(),
                castShadow: directionalLight.castShadow
            },
            renderer: defaultRenderer
        };

        // 滑竿列表
        this.sliders = {};

        // 创建TWEEN实例
        this.TWEEN = TWEEN;

        // 时长 毫秒
        this.Duration = 2000;

        // 加载纹理
        this.loadTextures();
    }

    /** 
     * 添加ShaderPass
     * @param {Array} shaderPassConfigs - ShaderPass配置数组
     * @return {void}
     */
    addShaderPass(shaderPassConfigs) {
        if (!Array.isArray(shaderPassConfigs)) {
            shaderPassConfigs = [shaderPassConfigs];
        }

        shaderPassConfigs.forEach(config => {
            const atomicName = config.name;
            const className = atomicName.startsWith('Lumi') ? atomicName.substring(4) : atomicName;
            const shaderPassModule = require('../pp/Lumi' + className + '/' + className + 'ShaderPass.js');
            const ShaderPassClass = shaderPassModule[className + 'ShaderPass'];
            const shaderPass = new ShaderPassClass();
            console.log('ShaderPass created:', shaderPass, className);
            // 统一单Pass和多Pass的添加逻辑
            this.composer.addPass(shaderPass);
            this.shaderPasses.push(shaderPass);
        });
    }

    /**
     * 设置后处理
     * @param {Array} shaderPassConfigs - ShaderPass配置数组
     * @return {void}
    */
    setupPostProcessing(shaderPassConfigs) {
        const { EffectComposer } = require('three/examples/jsm/postprocessing/EffectComposer.js');
        const { RenderPass } = require('three/examples/jsm/postprocessing/RenderPass.js');

        // 创建后处理渲染目标
        this.composer = new EffectComposer(this.renderer);
        this.renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(this.renderPass);
        this.shaderPasses = [];

        this.addShaderPass(shaderPassConfigs);
    }

    applyEffectStack(effects) {
        const list = Array.isArray(effects) ? effects : [];
        this._applyFogEffect(this._getEnabledEffect(list, 'Fog'));
        this._applyLightingRigEffect(this._getEnabledEffect(list, 'LightingRig'));
        this._applyRendererToneMappingEffect(this._getEnabledEffect(list, 'RendererToneMapping'));
    }

    _getEnabledEffect(effects, id) {
        return effects.find(effect => effect && effect.id === id && effect.enabled !== false) || null;
    }

    _resolveNumber(value, fallback) {
        const num = Number(value);
        return Number.isFinite(num) ? num : fallback;
    }

    _resolveColor(value, fallback) {
        const color = new THREE.Color();
        if (value && value.isColor) {
            color.copy(value);
            return color;
        }
        if (Array.isArray(value) && value.length >= 3) {
            const r = this._resolveNumber(value[0], 1);
            const g = this._resolveNumber(value[1], 1);
            const b = this._resolveNumber(value[2], 1);
            color.setRGB(Math.max(0, Math.min(1, r)), Math.max(0, Math.min(1, g)), Math.max(0, Math.min(1, b)));
            return color;
        }
        if (typeof value === 'string' || typeof value === 'number') {
            color.set(value);
            return color;
        }
        if (fallback && fallback.isColor) {
            color.copy(fallback);
            return color;
        }
        if (Array.isArray(fallback) && fallback.length >= 3) {
            color.setRGB(fallback[0], fallback[1], fallback[2]);
            return color;
        }
        if (typeof fallback === 'string' || typeof fallback === 'number') {
            color.set(fallback);
            return color;
        }
        color.setRGB(1, 1, 1);
        return color;
    }

    _resolveVector3(value, fallback) {
        const vec = new THREE.Vector3();
        if (Array.isArray(value) && value.length >= 3) {
            vec.set(this._resolveNumber(value[0], 0), this._resolveNumber(value[1], 0), this._resolveNumber(value[2], 0));
            return vec;
        }
        if (value && typeof value === 'object' && Number.isFinite(value.x) && Number.isFinite(value.y) && Number.isFinite(value.z)) {
            vec.set(value.x, value.y, value.z);
            return vec;
        }
        if (fallback && fallback.isVector3) {
            vec.copy(fallback);
            return vec;
        }
        if (Array.isArray(fallback) && fallback.length >= 3) {
            vec.set(fallback[0], fallback[1], fallback[2]);
            return vec;
        }
        vec.set(1, 1, 1);
        return vec;
    }

    _applyFogEffect(effect) {
        if (!this.scene) return;
        const defaults = this._effectDefaults ? this._effectDefaults.fog : null;
        if (!effect || !effect.params) {
            this.scene.fog = defaults || null;
            return;
        }
        const params = effect.params || {};
        const mode = typeof params.mode === 'string' ? params.mode : 'none';
        if (mode === 'linear') {
            const color = this._resolveColor(params.color, [1, 1, 1]);
            const near = this._resolveNumber(params.near, 1);
            const far = this._resolveNumber(params.far, 1000);
            this.scene.fog = new THREE.Fog(color, near, far);
            return;
        }
        if (mode === 'exp2') {
            const color = this._resolveColor(params.color, [1, 1, 1]);
            const density = this._resolveNumber(params.density, 0.02);
            this.scene.fog = new THREE.FogExp2(color, density);
            return;
        }
        this.scene.fog = null;
    }

    _applyLightingRigEffect(effect) {
        if (!this.scene) return;
        let ambientLight = this.ambientLight;
        if (!ambientLight) {
            ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
            this.scene.add(ambientLight);
            this.ambientLight = ambientLight;
        }
        let directionalLight = this.directionalLight;
        if (!directionalLight) {
            directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
            directionalLight.position.set(5, 10, 7.5);
            this.scene.add(directionalLight);
            this.directionalLight = directionalLight;
        }
        const defaults = this._effectDefaults ? this._effectDefaults.lightingRig : null;
        if (!effect || !effect.params) {
            if (defaults) {
                ambientLight.intensity = defaults.ambientIntensity;
                ambientLight.color.copy(defaults.ambientColor);
                directionalLight.intensity = defaults.directionalIntensity;
                directionalLight.color.copy(defaults.directionalColor);
                directionalLight.position.copy(defaults.directionalDirection);
                directionalLight.castShadow = defaults.castShadow;
            }
            return;
        }
        const params = effect.params || {};
        ambientLight.intensity = this._resolveNumber(params.ambientIntensity, defaults ? defaults.ambientIntensity : ambientLight.intensity);
        ambientLight.color.copy(this._resolveColor(params.ambientColor, defaults ? defaults.ambientColor : ambientLight.color));
        directionalLight.intensity = this._resolveNumber(params.directionalIntensity, defaults ? defaults.directionalIntensity : directionalLight.intensity);
        directionalLight.color.copy(this._resolveColor(params.directionalColor, defaults ? defaults.directionalColor : directionalLight.color));
        directionalLight.position.copy(this._resolveVector3(params.directionalDirection, defaults ? defaults.directionalDirection : directionalLight.position));
        directionalLight.castShadow = typeof params.castShadow === 'boolean' ? params.castShadow : (defaults ? defaults.castShadow : directionalLight.castShadow);
    }

    _applyRendererToneMappingEffect(effect) {
        if (!this.renderer) return;
        const defaults = this._effectDefaults ? this._effectDefaults.renderer : null;
        if (!effect || !effect.params) {
            if (defaults) {
                this.renderer.toneMapping = defaults.toneMapping;
                this.renderer.toneMappingExposure = defaults.exposure;
                this.renderer.outputColorSpace = defaults.outputColorSpace;
            }
            return;
        }
        const params = effect.params || {};
        this.renderer.toneMapping = this._resolveToneMapping(params.toneMapping, defaults ? defaults.toneMapping : THREE.NoToneMapping);
        this.renderer.toneMappingExposure = this._resolveNumber(params.exposure, defaults ? defaults.exposure : 1);
        this.renderer.outputColorSpace = this._resolveOutputColorSpace(params.outputColorSpace, defaults ? defaults.outputColorSpace : this.renderer.outputColorSpace);
    }

    _resolveToneMapping(value, fallback) {
        const map = {
            None: THREE.NoToneMapping,
            Linear: THREE.LinearToneMapping,
            Reinhard: THREE.ReinhardToneMapping,
            Cineon: THREE.CineonToneMapping,
            ACESFilmic: THREE.ACESFilmicToneMapping
        };
        if (typeof value === 'string' && map[value]) return map[value];
        return fallback;
    }

    _resolveOutputColorSpace(value, fallback) {
        const map = {
            SRGB: THREE.SRGBColorSpace,
            LinearSRGB: THREE.LinearSRGBColorSpace
        };
        if (typeof value === 'string' && map[value]) return map[value];
        return fallback;
    }

    //===begin_pp===
    addAnimations() {
        const duration = this.Duration;
        const tweens = [];

        // 为所有ShaderPass添加动画
        this.shaderPasses.forEach(shaderPass => {
            if (shaderPass.constructor.name === 'BCC_PrismShaderPass') {
                // 应用预设配置检查：如果没有预设配置函数或设置参数函数，则打印错误并返回
                if (typeof shaderPass.getPresetConfig !== 'function' || typeof shaderPass.setParameter !== 'function') {
                    console.error(`${shaderPass.constructor.name} 中没有 getPresetConfig 或 setParameter 方法`);
                    return;
                }

                // 如果有预设配置，则先获取预设配置，再应用预设配置构造Tween动画
                const config1 = shaderPass.getPresetConfig('none');
                if (!config1) {
                    console.error(`${shaderPass.constructor.name} 中没有 none 预设配置`);
                    return;
                }

                const config2 = shaderPass.getPresetConfig('high');
                if (!config2) {
                    console.error(`${shaderPass.constructor.name} 中没有 high 预设配置`);
                    return;
                }

                // 创建从0到1的动画
                const tween1 = new TWEEN.Tween(config1)
                    .to(config2, duration * 0.5)
                    .easing(TWEEN.Easing.Linear.None)
                    .onUpdate((obj) => {
                        // 遍历obj中的所有属性，自动设置参数
                        for (const key in obj) {
                            shaderPass.setParameter(key, obj[key]);
                        }
                    });

                // 创建从1到0的动画
                const tween2 = new TWEEN.Tween(config2)
                    .to(config1, duration * 0.5)
                    .delay(duration * 0.5)
                    .easing(TWEEN.Easing.Linear.None)
                    .onUpdate((obj) => {
                        // 遍历obj中的所有属性，自动设置参数
                        for (const key in obj) {
                            shaderPass.setParameter(key, obj[key]);
                        }
                    });

                tweens.push(tween1, tween2);
            } else if (shaderPass.constructor.name === 'ChromaticAberrationShaderPass') {
                // 应用参数配置检查：如果没有设置参数函数，则打印错误并返回
                if (typeof shaderPass.setParameter !== 'function') {
                    console.error(`${shaderPass.constructor.name} 中没有 setParameter 方法`);
                    return;
                }

                // 创建从0到1的动画
                const tween1 = new TWEEN.Tween({ intensity: 0 })
                    .to({ intensity: 1 }, duration * 0.5)
                    .easing(TWEEN.Easing.Linear.None)
                    .onUpdate((obj) => {
                        // 遍历obj中的所有属性，自动设置参数
                        for (const key in obj) {
                            shaderPass.setParameter(key, obj[key]);
                        }
                    });

                // 创建从1到0的动画
                const tween2 = new TWEEN.Tween({ intensity: 1 })
                    .to({ intensity: 0 }, duration * 0.5)
                    .delay(duration * 0.5)
                    .easing(TWEEN.Easing.Linear.None)
                    .onUpdate((obj) => {
                        // 遍历obj中的所有属性，自动设置参数
                        for (const key in obj) {
                            shaderPass.setParameter(key, obj[key]);
                        }
                    });

                tweens.push(tween1, tween2);
            }
        });

        // 启动所有动画
        tweens.forEach(tween => tween.start());

        return tweens;
    }

    /**
     * 初始化后处理效果
     */
    initPostProcessing() {
        if (!this.usePostProcessing) return;
        if (typeof this.setupEffects === 'function') return;
        if (this.shaderPasses && this.shaderPasses.length) return;

        // 定义ShaderPass配置数组，并初始化shaderPass
        const shaderPassConfigs = [
            { name: 'LumiBCC_Prism' },
            { name: 'LumiChromaticAberration' }
        ];
        this.setupPostProcessing(shaderPassConfigs);

        // 添加Tween动画，并且将动画添加到场景对象中
        const tweens = this.addAnimations();
        if (tweens.length > 0) {
            if (!this.sceneObjects.tweens) {
                this.sceneObjects.tweens = [];
            }
            this.sceneObjects.tweens.push(...tweens);
        }
    }
    //===end_pp===

    /**
     * 初始化场景
     * 设置基本的Three.js环境，添加渲染器到DOM
     * @param {HTMLElement} container - 放置渲染器的DOM容器
     */
    init(container) {
        if (this.renderer) {
            if (container) {
                container.appendChild(this.renderer.domElement);
            } else if (typeof document !== 'undefined') {
                document.body.appendChild(this.renderer.domElement);
            }
        }
        if (typeof window !== 'undefined') {
            window.addEventListener('resize', () => this.handleResize());
        }
    }

    /**
     * 开始场景动画循环
     * @param {Function} updateCallback - 每帧调用的更新函数
     */
    start(updateCallback) {
        if (this.isAnimating) return;

        this.isAnimating = true;

        // 如果提供了更新回调，使用requestAnimationFrame
        if (updateCallback) {
            const animateFrame = () => {
                if (!this.isAnimating) return;
                updateCallback();
                this.animationFrameId = requestAnimationFrame(animateFrame);
            };

            animateFrame();
        } else {
            // 否则使用Three.js的setAnimationLoop，直接调用update渲染场景
            this.renderer.setAnimationLoop(() => {
                this.update();
            });
        }
    }



    /**
     * 更新场景（由外部动画循环调用）
     * @param {number} timestamp - 当前时间戳
     */
    updateScene(timestamp) {
        // 标记动画开始
        if (!this.isAnimating) {
            this.isAnimating = true;
        }

        // 直接调用默认更新函数，传入时间戳
        this.defaultUpdate(timestamp);
    }

    /**
     * 更新并渲染场景
     * 在每一帧调用，将当前场景通过渲染器绘制到屏幕
     */
    update() {
        if (this.usePostProcessing && this.composer) {
            // 确保composer使用当前活动的相机
            if (this.renderPass) {
                this.renderPass.camera = this.camera;
            }

            // 使用后处理效果渲染
            this.composer.render();
        } else if (this.renderer) {
            // 直接渲染场景
            this.renderer.render(this.scene, this.camera);
        }
    }

    /**
     * 窗口大小调整处理
     * 在窗口大小变化时调整相机和渲染器
     */
    handleResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        if (this.renderer) {
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        }

        // 调整后处理效果的大小
        if (this.composer) {
            this.composer.setSize(window.innerWidth, window.innerHeight);
        }

        // 如果不在动画循环中，触发一次渲染以更新视图
        if (!this.isAnimating) {
            this.update();
        }
    }

    loadTextures() {
        const textureLoader = new THREE.TextureLoader();
        return Promise.all([
            new Promise(resolve => {
                this.texture1 = textureLoader.load('image/Sample1.jpg', resolve);
                this.texture1.colorSpace = THREE.LinearSRGBColorSpace;
                this.texture1.wrapS = THREE.RepeatWrapping;
                this.texture1.wrapT = THREE.RepeatWrapping;
            }),
            new Promise(resolve => {
                this.texture2 = textureLoader.load('image/Sample2.jpg', resolve);
                this.texture2.colorSpace = THREE.LinearSRGBColorSpace;
                this.texture2.wrapS = THREE.RepeatWrapping;
                this.texture2.wrapT = THREE.RepeatWrapping;
            }),
            new Promise(resolve => {
                this.texture3 = textureLoader.load('image/Sample3.jpg', resolve);
                this.texture3.colorSpace = THREE.LinearSRGBColorSpace;
                this.texture3.wrapS = THREE.RepeatWrapping;
                this.texture3.wrapT = THREE.RepeatWrapping;
            }),
            new Promise(resolve => {
                this.texture4 = textureLoader.load('image/Sample4.jpg', resolve);
                this.texture4.colorSpace = THREE.LinearSRGBColorSpace;
                this.texture4.wrapS = THREE.RepeatWrapping;
                this.texture4.wrapT = THREE.RepeatWrapping;
            }),
            new Promise(resolve => {
                this.texture5 = textureLoader.load('image/Sample5.jpg', resolve);
                this.texture5.colorSpace = THREE.LinearSRGBColorSpace;
                this.texture5.wrapS = THREE.RepeatWrapping;
                this.texture5.wrapT = THREE.RepeatWrapping;
            }),
            new Promise(resolve => {
                this.texture6 = textureLoader.load('image/Sample6.jpg', resolve);
                this.texture6.colorSpace = THREE.LinearSRGBColorSpace;
                this.texture6.wrapS = THREE.RepeatWrapping;
                this.texture6.wrapT = THREE.RepeatWrapping;
            }),
            new Promise(resolve => {
                this.texture7 = textureLoader.load('image/Sample7.jpg', resolve);
                this.texture7.colorSpace = THREE.LinearSRGBColorSpace;
                this.texture7.wrapS = THREE.RepeatWrapping;
                this.texture7.wrapT = THREE.RepeatWrapping;
            }),
            new Promise(resolve => {
                this.texture8 = textureLoader.load('image/Sample8.jpg', resolve);
                this.texture8.colorSpace = THREE.LinearSRGBColorSpace;
                this.texture8.wrapS = THREE.RepeatWrapping;
                this.texture8.wrapT = THREE.RepeatWrapping;
            }),
            new Promise(resolve => {
                this.texture9 = textureLoader.load('image/Sample9.jpg', resolve);
                this.texture9.colorSpace = THREE.LinearSRGBColorSpace;
                this.texture9.wrapS = THREE.RepeatWrapping;
                this.texture9.wrapT = THREE.RepeatWrapping;
            })
        ]);
    }

    /**
     * 根据时间直接设置动画状态（用于时间跳转）
     * @param {number} time - 动画时间（毫秒）
     */
    seekToTime(time) {
        // 标记动画开始
        if (!this.isAnimating) {
            this.isAnimating = true;
        }

        let maxTime = Number.isFinite(this.Duration) ? this.Duration : 0;
        if (this.sceneObjects && Array.isArray(this.sceneObjects.tweens)) {
            this.sceneObjects.tweens.forEach((tween) => {
                const delay = tween && Number.isFinite(tween._delayTime) ? tween._delayTime : 0;
                const duration = tween && Number.isFinite(tween._duration) ? tween._duration : 0;
                maxTime = Math.max(maxTime, delay + duration);
            });
        }
        if (Array.isArray(this.effectStack)) {
            this.effectStack.forEach((effect) => {
                if (!effect || !effect.keyframes || typeof effect.keyframes !== 'object') return;
                Object.keys(effect.keyframes).forEach((paramName) => {
                    const frames = effect.keyframes[paramName];
                    if (!Array.isArray(frames)) return;
                    frames.forEach((kf) => {
                        const t = kf && Number.isFinite(kf.time) ? kf.time : Number(kf && kf.time);
                        if (Number.isFinite(t)) maxTime = Math.max(maxTime, t);
                    });
                });
            });
        }
        const clampedTime = Math.max(0, Math.min(time, maxTime));

        if (!this.sceneObjects || !this.sceneObjects.tweens || this.sceneObjects.tweens.length === 0) {
            this.update();
            return;
        }

        // 使用逆序遍历 TWEEN，确保正确的属性覆盖优先级
        // 逆序处理：让开始时间晚的tween先处理，开始时间早的tween后处理并覆盖

        let notStartTweens = [];
        let runningTweens = [];
        let finishedTweens = [];

        for (let i = 0; i <= this.sceneObjects.tweens.length - 1; i++) {
            const tween = this.sceneObjects.tweens[i];

            let TweenStartTime = tween._delayTime + 10;
            let TweenEndTime = tween._delayTime + tween._duration;

            // 将tween分为三种，未开始，进行中，已结束  
            // 分到3个列表中

            if (clampedTime <= TweenStartTime) {
                notStartTweens.push({ time: TweenStartTime, tween: tween });
            }
            else if (clampedTime >= TweenEndTime) {
                finishedTweens.push({ time: TweenEndTime, tween: tween });
            }
            else {
                runningTweens.push(tween);
            }
        }

        // 按照开始时间排序
        notStartTweens.sort((a, b) => b.time - a.time);
        // 按照结束时间排序
        finishedTweens.sort((a, b) => a.time - b.time);

        notStartTweens.forEach((item, index) => {
            let tween = item.tween;
            tween.start(0);
            tween.update(tween._delayTime + 2 + index * 0.04);
        });

        finishedTweens.forEach(item => {
            let tween = item.tween;
            tween.start(0);
            tween.update(tween._delayTime + tween._duration + 2);
        });

        runningTweens.forEach(tween => {
            tween.start(0);
            tween.update(clampedTime);
        });

        this.update();
    }
  //===begin===
  initSceneObjects() {
    this.sceneObjects = {
      group_1: null,
      box_1: null,
      tweens: []
    };
  }

  setupScene() {
    this.initSceneObjects();
    this.scene.background = new THREE.Color(0x333333);

    // 创建 group_1
    const group_1_geo = new THREE.BoxGeometry(1, 1, 1);
    const group_1_mat = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
    });
    const group_1 = new THREE.Mesh(group_1_geo, group_1_mat);
    group_1.position.set(0.0000, 0.0000, 0.0000);
    group_1.rotation.set(0.0000, 0.0000, 0.0000);
    group_1.scale.set(1.0000, 1.0000, 1.0000);
    this.scene.add(group_1);
    this.sceneObjects.group_1 = group_1;

    // 创建 box_1
    const box_1_geo = new THREE.BoxGeometry(1, 1, 1);
    const box_1_mat = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
    });
    const box_1 = new THREE.Mesh(box_1_geo, box_1_mat);
    box_1.position.set(0.0000, 0.0000, 0.0000);
    box_1.rotation.set(-1.5708, 1.5708, 0.0000);
    box_1.scale.set(1.0000, 1.0000, 1.0000);
    this.scene.add(box_1);
    this.sceneObjects.box_1 = box_1;

    this.setupEffects();
    this.setupAnimations();
    return this.sceneObjects;
  }

  setupAnimations() {
    const duration = this.Duration;
    this.sceneObjects.tweens = [];
    const resolveEasing = (name) => {
      if (typeof name !== 'string' || !name) return TWEEN.Easing.Linear.None;
      const parts = name.split('.');
      if (parts.length === 2 && TWEEN.Easing[parts[0]] && TWEEN.Easing[parts[0]][parts[1]]) {
        return TWEEN.Easing[parts[0]][parts[1]];
      }
      return TWEEN.Easing.Linear.None;
    };
    const applyShaderParam = (shaderPass, key, value) => {
      if (!shaderPass) return;
      if (typeof shaderPass.setParameter === 'function') {
        shaderPass.setParameter(key, value);
        return;
      }
      if (typeof shaderPass.setParameters === 'function') {
        shaderPass.setParameters({ [key]: value });
        return;
      }
      if (typeof shaderPass.setParams === 'function') {
        shaderPass.setParams({ [key]: value });
        return;
      }
      if (shaderPass.params && Object.prototype.hasOwnProperty.call(shaderPass.params, key)) {
        shaderPass.params[key] = value;
      }
    };

    const effectStack = Array.isArray(this.effectStack) ? this.effectStack : [];
    const effectPassMap = Array.isArray(this.effectPassMap) ? this.effectPassMap : [];
    effectStack.forEach((effect, effectIndex) => {
      if (!effect || !effect.keyframes) return;
      const passIndex = effectPassMap[effectIndex];
      if (!Number.isFinite(passIndex) || passIndex < 0) return;
      const shaderPass = this.shaderPasses ? this.shaderPasses[passIndex] : null;
      if (!shaderPass) return;
      const keyframes = effect.keyframes || {};
      Object.keys(keyframes).forEach((paramName) => {
        const frames = keyframes[paramName];
        if (!Array.isArray(frames) || frames.length < 2) return;
        for (let k = 0; k < frames.length - 1; k++) {
          const kfA = frames[k];
          const kfB = frames[k + 1];
          const tweenDuration = kfB.time - kfA.time;
          const delay = kfA.time;
          const easingFn = resolveEasing(kfB.easing);
          const fromValue = kfA.value;
          const toValue = kfB.value;
          if (!Number.isFinite(tweenDuration) || tweenDuration <= 0) {
            applyShaderParam(shaderPass, paramName, toValue);
            return;
          }
          if (Array.isArray(fromValue) && Array.isArray(toValue)) {
            const start = {};
            const end = {};
            const len = Math.min(fromValue.length, toValue.length);
            for (let i = 0; i < len; i++) {
              const startNum = Number(fromValue[i]);
              const endNum = Number(toValue[i]);
              start[`v${i}`] = Number.isFinite(startNum) ? startNum : 0;
              end[`v${i}`] = Number.isFinite(endNum) ? endNum : start[`v${i}`];
            }
            const tween = new TWEEN.Tween(start)
              .to(end, tweenDuration)
              .easing(easingFn)
              .onUpdate((obj) => {
                const arr = [];
                for (let i = 0; i < len; i++) {
                  arr.push(obj[`v${i}`]);
                }
                applyShaderParam(shaderPass, paramName, arr);
              });
            if (delay > 0) {
              tween.delay(delay);
            }
            this.sceneObjects.tweens.push(tween);
            return;
          }
          const startNum = Number(fromValue);
          const endNum = Number(toValue);
          if (Number.isFinite(startNum) && Number.isFinite(endNum)) {
            const tween = new TWEEN.Tween({ value: startNum })
              .to({ value: endNum }, tweenDuration)
              .easing(easingFn)
              .onUpdate((obj) => {
                applyShaderParam(shaderPass, paramName, obj.value);
              });
            if (delay > 0) {
              tween.delay(delay);
            }
            this.sceneObjects.tweens.push(tween);
            return;
          }
          const tween = new TWEEN.Tween({ t: 0 })
            .to({ t: 1 }, tweenDuration)
            .easing(easingFn)
            .onUpdate((obj) => {
              const value = obj.t < 1 ? fromValue : toValue;
              applyShaderParam(shaderPass, paramName, value);
            });
          if (delay > 0) {
            tween.delay(delay);
          }
          this.sceneObjects.tweens.push(tween);
        }
      });
    });

    // 启动所有动画
    this.sceneObjects.tweens.forEach(t => t.start());
  }

  setupEffects() {
    this.effectStack = [];
    const shaderPassConfigs = [];
    this.effectPassMap = [];
    this.effectStack.forEach((effect, index) => {
      if (effect && typeof effect.id === 'string' && effect.id.startsWith('Lumi')) {
        shaderPassConfigs.push({ name: effect.id });
        this.effectPassMap[index] = shaderPassConfigs.length - 1;
      } else {
        this.effectPassMap[index] = -1;
      }
    });
    this.shaderPasses = [];
    if (shaderPassConfigs.length > 0) {
      this.setupPostProcessing(shaderPassConfigs);
    }
    this.applyEffectStack(this.effectStack);
    if (this.shaderPasses && this.shaderPasses.length) {
      this.effectStack.forEach((effect, index) => {
        const passIndex = this.effectPassMap[index];
        if (!Number.isFinite(passIndex) || passIndex < 0) return;
        const shaderPass = this.shaderPasses[passIndex];
        if (!shaderPass || !effect) return;
        shaderPass.enabled = effect.enabled !== false;
        const params = effect.params || {};
        Object.keys(params).forEach((key) => {
          const value = params[key];
          if (typeof shaderPass.setParameter === 'function') {
            shaderPass.setParameter(key, value);
            return;
          }
          if (typeof shaderPass.setParameters === 'function') {
            shaderPass.setParameters({ [key]: value });
            return;
          }
          if (typeof shaderPass.setParams === 'function') {
            shaderPass.setParams({ [key]: value });
            return;
          }
          if (shaderPass.params && Object.prototype.hasOwnProperty.call(shaderPass.params, key)) {
            shaderPass.params[key] = value;
          }
        });
      });
    }
  }

  updateEffects() {
    if (!this.effectStack) return;
    this.applyEffectStack(this.effectStack);
  }
  //===end===

/**
 * 默认的场景更新函数，实现轨道交错转场动画
 */
defaultUpdate(timestamp) {
    // 更新所有TWEEN动画
    if (this.sceneObjects.tweens && this.sceneObjects.tweens.length > 0) {
        this.sceneObjects.tweens.forEach(tween => {
            if (tween && typeof tween.update === 'function') {
                tween.update(timestamp);
            }
        });
    }

    if (typeof this.updateEffects === 'function') {
        this.updateEffects(timestamp);
    }

    this.update();
}

  //===Predefined Function Begin===
  //===Predefined Function End===
}

// 导入Three.js库
module.exports = ScriptScene;

// 导入Three.js 的 wrapper库
// exports.ScriptScene = ScriptScene;
