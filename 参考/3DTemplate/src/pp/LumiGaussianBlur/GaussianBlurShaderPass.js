/*threeJS*/ const THREE = require('three');
// /*Effect*/ const THREE = require('../../ThreeJS/three-amg-wrapper.js').THREE;

// todo
const { Pass } = require('three/examples/jsm/postprocessing/Pass.js');

const { GaussianBlurPassH } = require('./GaussianBlurPassH.js');
const { GaussianBlurPassV } = require('./GaussianBlurPassV.js');

/**
 * 高斯模糊参数控制器
 * 只负责创建和管理Pass，不负责EffectComposer和渲染
 */
class GaussianBlurShaderPass extends Pass {
    constructor() {
        super();

        // 参数默认值 - 对应AEInfo.json中的配置
        this.params = {
            intensity: 20.0,               // 模糊强度 (0-1000)
            quality: 0.5,                  // 质量 (0-1)
            spaceDither: 0.0,              // 空间抖动 (0-1)
            horizontalStrength: 1.0,       // 水平强度 (0-1)
            verticalStrength: 1.0,         // 垂直强度 (0-1)
            blurDirection: 'Horizontal and Vertical', // 模糊方向
            borderType: 'Normal',          // 边界模式
            blurAlpha: true,               // 模糊透明通道
            inverseGammaCorrection: true   // 反伽马校正
        };
        
        // 内部常量 - 来自Lua代码
        this.constants = {
            NormalizationSize: 1000.0,
            MaxIntensity: 1000.0,
            RadiusOverSigma: 2.5,
            Gamma: 2.2,
            Eps: 1e-5
        };
        
        // Passes
        this.passH = null;
        this.passV = null;
        
        // 状态
        this.width = 512;   // 默认宽度
        this.height = 512;  // 默认高度

        // LumiGaussianBlur预设配置
        this.presets = {
            // 无效果
            none: {
                intensity: 0,
                horizontalStrength: 0.0,
                verticalStrength: 0.0,
                blurDirection: 'Horizontal and Vertical',
            },

            // 轻度模糊
            low: {
                intensity: 20,
                horizontalStrength: 1.0,
                verticalStrength: 1.0,
                blurDirection: "Horizontal and Vertical"
            },
            
            // 中等模糊
            medium: {
                intensity: 60,
                horizontalStrength: 1.0,
                verticalStrength: 1.0,
                blurDirection: "Horizontal and Vertical"
            },
            
            // 强烈模糊
            high: {
                intensity: 120,
                horizontalStrength: 1.0,
                verticalStrength: 1.0,
                blurDirection: "Horizontal and Vertical"
            },

            // 水平模糊
            horizontal: {
                intensity: 80,
                horizontalStrength: 1.0,
                verticalStrength: 0.0,
                blurDirection: "Horizontal"
            },

            // 垂直模糊
            vertical: {
                intensity: 80,
                horizontalStrength: 0.0,
                verticalStrength: 1.0,
                blurDirection: "Vertical"
            }
        };

        // 初始化
        this.initialize();
    }
    
    /**
     * 初始化Pass
     */
    initialize() {
        // 创建模糊处理 Pass
        this.passH = new GaussianBlurPassH();
        this.passV = new GaussianBlurPassV();
        
        // 创建渲染目标用于存储水平模糊的结果
        this.horizontalRenderTarget = new THREE.WebGLRenderTarget(this.width, this.height, {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat,
            encoding: THREE.sRGBEncoding
        });
        
        // 初始化参数
        this.updateParameters();
    }
    
    /**
     * 获取Passes
     */
    getPasses() {
        return [this.passH, this.passV];
    }
    
    /**
     * 计算采样数量和降采样比例
     */
    _getSampleNum(intensity) {
        let scale = 1.0;
        let bias = 0.0;
        let s = 1.0;
        
        if (intensity <= 30) {
            scale = 0.5;
            bias = 2.0;
            s = 0.78;
        } else if (intensity <= 100) {
            scale = 0.5;
            bias = 10.0;
            s = 0.66;
        } else if (intensity <= 200) {
            scale = 0.25;
            bias = 50.0;
            s = 0.7;
        } else {
            scale = 0.125;
            bias = 80.0;
            s = 0.8;
        }

        let sampleNum = scale * intensity + bias;
        sampleNum = sampleNum * s;
        
        if (sampleNum < 2.0) {
            sampleNum = Math.floor(sampleNum + 0.5);
        }
        
        return { sampleNum, downScale: scale };
    }
    
    /**
     * 计算质量参数
     */
    _getQualityParam(quality) {
        let qualityParam = quality * 2.0 - 1.0;
        if (qualityParam < 0.0) {
            qualityParam = Math.pow(10, qualityParam);
        } else {
            qualityParam = qualityParam * 2.0 + 1.0;
        }
        return qualityParam;
    }
    
    /**
     * 计算XY缩放比例
     */
    _getXYScale(width, height) {
        const size1 = Math.min(width, height);
        const size2 = Math.max(width, height) / 2.0;
        const baseSize = Math.max(size1, size2);
        
        return [baseSize / width, baseSize / height];
    }
    
    /**
     * 获取边界类型值
     */
    _getBorderType(borderType) {
        const borderTypeTable = {
            'Normal': 0,
            'Replicate': 1,
            'Black': 2,
            'Mirror': 3
        };
        return borderTypeTable[borderType] || 0;
    }
    
    /**
     * 设置参数
     */
    setParameter(name, value) {
        if (this.params.hasOwnProperty(name)) {
            this.params[name] = value;
            this.updateParameters();
        }
    }

    // 工具函数：限制数值范围
    _clampValue(value, min = 0, max = 1) {
        return Math.max(min, Math.min(max, value));
    }

    // 工具函数：布尔转整数
    _boolToInt(flag) {
        return flag ? 1 : 0;
    }
    
    /**
     * 更新参数到Pass
     */
    updateParameters() {
        // 参数约束和计算
        const blurIntensity = this._clampValue(this.params.intensity, 0, this.constants.MaxIntensity);
        const horizontalStrength = this._clampValue(this.params.horizontalStrength);
        const verticalStrength = this._clampValue(this.params.verticalStrength);
        const quality = this._clampValue(this.params.quality);
        const spaceDither = this._clampValue(this.params.spaceDither);
        
        const { sampleNum, downScale } = this._getSampleNum(blurIntensity);
        const qualityParam = this._getQualityParam(quality);
        const borderType = this._getBorderType(this.params.borderType);
        const inverseGammaCorrection = this._boolToInt(this.params.inverseGammaCorrection);
        const blurAlpha = this._boolToInt(this.params.blurAlpha);

        // 根据模糊方向调整强度
        let xStrength = horizontalStrength;
        let yStrength = verticalStrength;
        
        if (this.params.blurDirection === 'Horizontal') {
            yStrength = 0.0;
        } else if (this.params.blurDirection === 'Vertical') {
            xStrength = 0.0;
        }
        
        const intensityX = blurIntensity * xStrength;
        const intensityY = blurIntensity * yStrength;
        
        // 计算模糊参数
        const [xScale, yScale] = this._getXYScale(this.width, this.height);
        const radiusX = xScale * intensityX / this.constants.NormalizationSize;
        const radiusY = yScale * intensityY / this.constants.NormalizationSize;
        const sigmaX = radiusX / this.constants.RadiusOverSigma;
        const sigmaY = radiusY / this.constants.RadiusOverSigma;
        const sampleX = sampleNum * xStrength * qualityParam;
        const sampleY = sampleNum * yStrength * qualityParam;
        const dx = radiusX / Math.max(sampleX, this.constants.Eps);
        const dy = radiusY / Math.max(sampleY, this.constants.Eps);
        
        // 更新模糊Pass参数
        if (this.passH) {
            this.passH.uniforms.u_stepX.value = dx;
            this.passH.uniforms.u_stepY.value = dy;
            this.passH.uniforms.u_sampleX.value = sampleX;
            this.passH.uniforms.u_sigmaX.value = sigmaX;
            this.passH.uniforms.u_gamma.value = this.constants.Gamma;
            this.passH.uniforms.u_spaceDither.value = spaceDither;
            this.passH.uniforms.u_borderType.value = borderType;
            this.passH.uniforms.u_inverseGammaCorrection.value = inverseGammaCorrection;
            this.passH.uniforms.u_blurAlpha.value = blurAlpha;
        }
        
        if (this.passV) {
            this.passV.uniforms.u_stepX.value = dx;
            this.passV.uniforms.u_stepY.value = dy;
            this.passV.uniforms.u_sampleY.value = sampleY;
            this.passV.uniforms.u_sigmaY.value = sigmaY;
            this.passV.uniforms.u_gamma.value = this.constants.Gamma;
            this.passV.uniforms.u_spaceDither.value = spaceDither;
            this.passV.uniforms.u_borderType.value = borderType;
            this.passV.uniforms.u_inverseGammaCorrection.value = inverseGammaCorrection;
            this.passV.uniforms.u_blurAlpha.value = blurAlpha;
        }

        // 根据模糊方向启用/禁用 Pass
        const blurDirection = this.params.blurDirection;
        
        if (this.passH && this.passV) {
            if (this.params.intensity < 0.01) {
                this.passH.enabled = false;
                this.passV.enabled = false;
            }
            else if (blurDirection === 'Horizontal') {
                this.passH.enabled = true;
                this.passV.enabled = false;
            } else if (blurDirection === 'Vertical') {
                this.passH.enabled = false;
                this.passV.enabled = true;
            } else { // Horizontal and Vertical
                this.passH.enabled = true;
                this.passV.enabled = true;
            }
        }
    }
    
    /**
     * 设置模糊强度
     */
    setIntensity(intensity) {
        this.setParameter('intensity', intensity);
    }
    
    /**
     * 设置质量
     */
    setQuality(quality) {
        this.setParameter('quality', Math.max(0.1, Math.min(1.0, quality)));
    }
    
    /**
     * 设置空间抖动
     */
    setSpaceDither(spaceDither) {
        this.setParameter('spaceDither', spaceDither);
    }
    
    /**
     * 设置水平强度
     */
    setHorizontalStrength(strength) {
        this.setParameter('horizontalStrength', Math.max(0, Math.min(1.0, strength)));
    }
    
    /**
     * 设置垂直强度
     */
    setVerticalStrength(strength) {
        this.setParameter('verticalStrength', Math.max(0, Math.min(1.0, strength)));
    }
    
    /**
     * 设置模糊方向
     */
    setBlurDirection(direction) {
        const validDirections = ['Horizontal and Vertical', 'Horizontal', 'Vertical'];
        if (validDirections.includes(direction)) {
            this.setParameter('blurDirection', direction);
        }
    }
    
    /**
     * 设置边界类型
     */
    setBorderType(borderType) {
        const validTypes = ['Normal', 'Replicate', 'Black', 'Mirror'];
        if (validTypes.includes(borderType)) {
            this.setParameter('borderType', borderType);
        }
    }
    
    /**
     * 设置模糊透明通道
     */
    setBlurAlpha(value) {
        this.setParameter('blurAlpha', Boolean(value));
    }
    
    /**
     * 设置反伽马校正
     */
    setInverseGammaCorrection(value) {
        this.setParameter('inverseGammaCorrection', Boolean(value));
    }
    
    /**
     * 设置尺寸
     */
    setSize(width, height) {
        if (this.width !== width || this.height !== height) {
            this.width = width;
            this.height = height;
            
            // 更新渲染目标的尺寸
            if (this.horizontalRenderTarget) {
                this.horizontalRenderTarget.setSize(width, height);
            }
            
            this.updateParameters();
        }
    }
    
    /**
     * 清理资源
     */
    dispose() {
        this.passH = null;
        this.passV = null;
        
        // 清理渲染目标
        if (this.horizontalRenderTarget) {
            this.horizontalRenderTarget.dispose();
            this.horizontalRenderTarget = null;
        }
    }
    
    /**
     * 自定义渲染方法，控制整个高斯模糊的渲染流程
     */
    render(renderer, writeBuffer, readBuffer, deltaTime, maskActive) {
        // 保存当前自动清除设置
        const oldAutoClear = renderer.autoClear;
        renderer.autoClear = false;
        
        // 根据模糊方向处理
        const blurDirection = this.params.blurDirection;

        // 检查是否启用了任何Pass
        const isPassHEnabled = this.passH && this.passH.enabled && (blurDirection === 'Horizontal' || blurDirection === 'Horizontal and Vertical');
        const isPassVEnabled = this.passV && this.passV.enabled && (blurDirection === 'Vertical' || blurDirection === 'Horizontal and Vertical');
        
        // 如果没有启用任何Pass，直接将输入纹理复制到输出缓冲区
        if (!isPassHEnabled && !isPassVEnabled) {
            // 使用一个简单的着色器材质来复制纹理
            if (!this.copyShader) {
                this.copyShader = new THREE.ShaderMaterial({
                    uniforms: {
                        tDiffuse: { value: null }
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
                        varying vec2 vUv;
                        void main() {
                            gl_FragColor = texture2D(tDiffuse, vUv);
                        }
                    `
                });
            }
            
            // 创建全屏四边形（如果还没有创建）
            if (!this.fullScreenQuad) {
                const geometry = new THREE.BufferGeometry();
                const vertices = new Float32Array([
                    -1, -1, 0,
                    3, -1, 0,
                    -1, 3, 0
                ]);
                const uvs = new Float32Array([
                    0, 0,
                    2, 0,
                    0, 2
                ]);
                geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
                geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
                
                this.fullScreenQuad = new THREE.Mesh(geometry, this.copyShader);
            }
            
            // 设置材质uniforms
            this.copyShader.uniforms.tDiffuse.value = readBuffer.texture;
            
            // 保存当前状态
            const currentRenderTarget = renderer.getRenderTarget();
            const oldAutoClear = renderer.autoClear;
            
            // 设置渲染目标并渲染
            renderer.autoClear = false;
            renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer);
            renderer.clear();
            
            // 创建临时场景和相机
            const scene = new THREE.Scene();
            scene.add(this.fullScreenQuad);
            const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
            
            renderer.render(scene, camera);
            
            // 恢复状态
            renderer.setRenderTarget(currentRenderTarget);
            renderer.autoClear = oldAutoClear;
            
            return;
        }
        
        // 水平模糊处理
        if (isPassHEnabled) {
            // 设置Pass的输入纹理为readBuffer的纹理
            if (this.passH.material && this.passH.material.uniforms.tDiffuse) {
                this.passH.material.uniforms.tDiffuse.value = readBuffer.texture;
            }
            
            // 如果是H&V模糊，先渲染水平模糊到中间渲染目标
            if (blurDirection === 'Horizontal and Vertical') {
                // 保存当前渲染目标
                const currentRenderTarget = renderer.getRenderTarget();
                
                // 设置渲染目标并渲染水平模糊
                renderer.setRenderTarget(this.horizontalRenderTarget);
                renderer.clear();
                this.passH.render(renderer, this.horizontalRenderTarget, readBuffer, deltaTime, maskActive);
                
                // 恢复渲染目标
                renderer.setRenderTarget(currentRenderTarget);
            }
            // 如果只有水平模糊且需要渲染到屏幕
            else if (blurDirection === 'Horizontal' && this.renderToScreen) {
                this.passH.render(renderer, null, readBuffer, deltaTime, maskActive);
            } 
            // 如果只有水平模糊且不需要渲染到屏幕
            else if (blurDirection === 'Horizontal' && !this.renderToScreen) {
                this.passH.render(renderer, writeBuffer, readBuffer, deltaTime, maskActive);
            }
        }
        
        // 垂直模糊处理
        if (isPassVEnabled) {
            // 如果是H&V模糊，垂直模糊的输入应该是水平模糊的输出（即中间渲染目标的纹理）
            if (blurDirection === 'Horizontal and Vertical') {
                // 设置垂直模糊的输入纹理为水平模糊的结果
                if (this.passV.material && this.passV.material.uniforms.tDiffuse) {
                    this.passV.material.uniforms.tDiffuse.value = this.horizontalRenderTarget.texture;
                }
                
                // 渲染垂直模糊到最终目标
                if (this.renderToScreen) {
                    this.passV.render(renderer, null, this.horizontalRenderTarget, deltaTime, maskActive);
                } else {
                    this.passV.render(renderer, writeBuffer, this.horizontalRenderTarget, deltaTime, maskActive);
                }
            }
            // 如果只有垂直模糊
            else if (blurDirection === 'Vertical') {
                // 输入是原始纹理
                if (this.passV.material && this.passV.material.uniforms.tDiffuse) {
                    this.passV.material.uniforms.tDiffuse.value = readBuffer.texture;
                }
                
                // 渲染垂直模糊
                if (this.renderToScreen) {
                    this.passV.render(renderer, null, readBuffer, deltaTime, maskActive);
                } else {
                    this.passV.render(renderer, writeBuffer, readBuffer, deltaTime, maskActive);
                }
            }
        }
        
        // 恢复自动清除设置
        renderer.autoClear = oldAutoClear;
    }

    /**
     * 应用预设配置
     * @param {string} presetName - 预设名称 (e.g.: 'none', 'low', 'medium', 'high')
     */
    applyPreset(presetName) {
        const preset = this.presets[presetName];
        if (!preset) {
            console.warn(`Preset '${presetName}' not found`);
            return;
        }

        // 遍历预设对象的所有属性并设置
        for (const key in preset) {
            if (preset.hasOwnProperty(key)) {
                this.setParameter(key, preset[key]);
            }
        }
    }

    /**
     * 获取所有可用的预设名称
     * @returns {string[]} 预设名称数组
     */
    getPresetNames() {
        return Object.keys(this.presets);
    }

    /**
     * 获取指定预设的配置
     * @param {string} presetName - 预设名称
     * @returns {Object|null} 预设配置对象，如果找不到则返回null
     */
    getPresetConfig(presetName) {
        if (!this.presets.hasOwnProperty(presetName)) {
            console.warn(`Preset '${presetName}' not found`);
            return null;
        }
        return this.presets[presetName];
    }
}

/*threeJS*/ module.exports = { GaussianBlurShaderPass };
// /*Effect*/ exports.GaussianBlurShaderPass = GaussianBlurShaderPass;
