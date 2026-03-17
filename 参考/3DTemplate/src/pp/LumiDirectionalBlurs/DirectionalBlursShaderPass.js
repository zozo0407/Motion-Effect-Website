/**
 * DirectionalBlurs参数控制器
 * 只负责创建和管理Pass，不负责EffectComposer和渲染
 */

/*threeJS*/ const THREE = require('three');
// /*Effect*/ const THREE = require('../../ThreeJS/three-amg-wrapper.js').THREE;

// todo
const { Pass } = require('three/examples/jsm/postprocessing/Pass.js');


const { DirectionalBlurPass } = require('./DirectionalBlurPass.js');
const { BlendPass } = require('./BlendPass.js');

/**
 * DirectionalBlurs参数控制器类
 */
class DirectionalBlursShaderPass extends Pass {
    constructor() {
        super();

        // 参数默认值 - 对应AEInfo.json中的配置
        this.params = {
            intensity: 50.0,        // 模糊强度 (0-1000)
            angle: 0,               // 角度 (0-360度)
            directionNum: 1,        // 方向数量 (1-4)
            exposure: 1.0,          // 曝光度 (0-10.0)
            quality: 0.5,           // 质量 (0-1.0)
            spaceDither: 0.0,       // 空间抖动 (0-1.0)
            borderType: 'Normal',   // 边界类型 {"Normal", "Black", "Mirror"}
            blendMode: 'Mean'       // 混合模式 {"Screen", "Add", "Mean"}
        };
        
        // Passes
        this.blurPasses = [];
        this.blendPass = null;

        // RT
        this.renderTargets = [];
        
        // 状态
        this.width = 512;   // 默认宽度
        this.height = 512;  // 默认高度

        // LumiDirectionalBlurs 预设配置
        this.presets = {
            // 无效果
            none: {
                intensity: 0,
            },

            // 轻度方向模糊 - 单方向模糊
            low: {
                intensity: 20,
                angle: 0,
                directionNum: 1,
                exposure: 1.0,
                quality: 1.0,
                spaceDither: 0.0,
                borderType: 'Normal',
                blendMode: 'Mean',
            },
            
            // 中等方向模糊 - 双方向模糊
            medium: {
                intensity: 50,
                angle: 0,
                directionNum: 2,
                exposure: 1.0,
                quality: 1.0,
                spaceDither: 0.0,
                borderType: 'Normal',
                blendMode: 'Mean',
            },
            
            // 重度方向模糊 - 四方向模糊
            high: {
                intensity: 100,
                angle: 0,
                directionNum: 4,
                exposure: 1.0,
                quality: 1.0,
                spaceDither: 0.0,
                borderType: 'Normal',
                blendMode: 'Mean',
            }
        };

        // 初始化
        this.initialize();
    }
    
    /**
     * 初始化Pass
     */
    initialize() {
        // 创建各方向模糊Pass
        this.blurPasses = [];
        for (let i = 0; i < 4; i++) {
            const blurPass = new DirectionalBlurPass();
            // 确保模糊Pass不直接渲染到屏幕
            blurPass.renderToScreen = false;
            this.blurPasses.push(blurPass);
        }
        
        // 创建混合Pass
        this.blendPass = new BlendPass();
        
        // 初始化RT
        this.renderTargets = [];
        for (let i = 0; i < this.blurPasses.length; i++) {
            const renderTarget = new THREE.WebGLRenderTarget(this.width, this.height, {
                minFilter: THREE.LinearFilter,
                magFilter: THREE.LinearFilter,
                format: THREE.RGBAFormat,
                encoding: THREE.sRGBEncoding
            });
            this.renderTargets.push(renderTarget);
        }
        
        // 初始化参数
        this.updateParameters();
    }
    
    /**
     * 自定义渲染方法，控制整个DirectionalBlur的渲染流程
     */
    render(renderer, writeBuffer, readBuffer, deltaTime, maskActive) {
        // 保存当前自动清除设置
        const oldAutoClear = renderer.autoClear;
        renderer.autoClear = false;
        
        // 为每个启用的模糊Pass渲染到对应的RT
        for (let i = 0; i < this.params.directionNum; i++) {
            const pass = this.blurPasses[i];
            const rt = this.renderTargets[i];
            
            // 设置Pass的输入纹理为readBuffer的纹理
            if (pass.material && pass.material.uniforms.tDiffuse) {
                pass.material.uniforms.tDiffuse.value = readBuffer.texture;
            }
            
            // 保存当前渲染目标
            const currentRenderTarget = renderer.getRenderTarget();
            
            // 设置渲染目标并渲染
            renderer.setRenderTarget(rt);
            renderer.clear();
            pass.render(renderer, rt, readBuffer, deltaTime, maskActive);
            
            // 恢复渲染目标
            renderer.setRenderTarget(currentRenderTarget);
            
            // 将渲染结果纹理传递给BlendPass
            this.blendPass.setBlurTexture(i, rt.texture);
        }
        
        // 更新混合Pass的其他参数
        this.blendPass.setBlendMode(this.params.blendMode);
        this.blendPass.setDirectionNum(this.params.directionNum);
        const finalExposure = (this.params.directionNum > 1) ? this.params.exposure : 1.0;
        this.blendPass.setExposure(finalExposure);
        
        if (this.renderToScreen) {
            // 渲染到屏幕
            this.blendPass.render(renderer, null, readBuffer, deltaTime, maskActive);
        } else {
            // 渲染到writeBuffer，供后续Pass使用
            this.blendPass.render(renderer, writeBuffer, readBuffer, deltaTime, maskActive);
        }
        
        // 恢复自动清除设置
        renderer.autoClear = oldAutoClear;
    }
    
    /**
     * 计算采样数量
     */
    getSampleNum(intensity) {
        let scale = 1.0;
        let bias = 0.0;
        let s = 1.0;
        if (intensity <= 10) { scale = 0.8; bias = 0.0; s = 1.0; }
        else if (intensity <= 50) { scale = 0.7; bias = 2.0; s = 0.78; }
        else if (intensity <= 200) { scale = 0.5; bias = 10; s = 0.66; }
        else if (intensity <= 500) { scale = 0.25; bias = 60.0; s = 0.7; }
        else { scale = 0.125; bias = 100.0; s = 0.8; }

        let sampleNum = scale * intensity + bias;
        sampleNum = sampleNum * s;
        if (sampleNum < 2.0) {
            sampleNum = Math.floor(sampleNum + 0.5);
        }
        return [sampleNum, scale];
    }

    /**
     * 获取质量参数
     */
    getQualityParam(quality) {
        let qualityParam = quality * 2.0 - 1.0;
        if (qualityParam < 0.0) {
            qualityParam = Math.pow(10, qualityParam);
        } else {
            qualityParam = qualityParam * 2.0 + 1.0;
        }
        return qualityParam;
    }

    /**
     * 计算XY缩放
     */
    getXYScale(width, height) {
        const size1 = Math.min(width, height);
        const size2 = Math.max(width, height) / 2.0;
        const baseSize = Math.max(size1, size2);
        
        return [baseSize / width, baseSize / height];
    }

    /**
     * 获取边界类型值
     */
    getBorderTypeValue(borderType) {
        const borderTypeTable = { 'Normal': 0, 'Black': 1, 'Mirror': 2 };
        return borderTypeTable[borderType] || 0;
    }

    /**
     * 获取混合模式值
     */
    getBlendModeValue(blendMode) {
        const blendModeTable = { 'Screen': 0, 'Add': 1, 'Mean': 2 };
        return blendModeTable[blendMode] || 0;
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
    
    /**
     * 更新参数到Pass
     */
    updateParameters() {
        const [sampleNum, scale] = this.getSampleNum(this.params.intensity);
        const [xScale, yScale] = this.getXYScale(this.width, this.height);
        const radius = this.params.intensity / 1000.0;
        const sigma = radius / 3.0;
        const qualityParam = this.getQualityParam(this.params.quality);
        const sample = sampleNum * qualityParam;
        const ds = radius / Math.max(sample, 1e-5);
        
        const startAngle = (-this.params.angle - 90) * Math.PI / 180;
        const deltaAngle = Math.PI / Math.max(1, this.params.directionNum);
        
        // 更新模糊Pass参数
        this.blurPasses.forEach((pass, i) => {
            const angle = startAngle + i * deltaAngle;
            const dx = ds * Math.cos(angle) * xScale;
            const dy = ds * Math.sin(angle) * yScale;
            
            pass.setBlurDirection(angle);
            pass.setBlurRadius(this.params.intensity);
            pass.setSamples(Math.floor(sample));
            pass.setSigma(sigma);
            pass.setSpaceDither(this.params.spaceDither);
            pass.setBorderType(this.params.borderType);
            
            // 曝光处理
            const exposure = (this.params.directionNum === 1) ? this.params.exposure : 1.0;
            pass.setExposure(exposure);
            
            // 更新步长
            if (pass.material && pass.material.uniforms.u_stepX) {
                pass.material.uniforms.u_stepX.value = dx;
                pass.material.uniforms.u_stepY.value = dy;
            }
            
            // 控制Pass的启用状态
            pass.enabled = i < this.params.directionNum;
            
            // 确保模糊Pass不直接渲染到屏幕
            pass.renderToScreen = false;
        });
        
        // 更新混合Pass参数
        if (this.blendPass) {
            this.blendPass.setBlendMode(this.params.blendMode);
            this.blendPass.setDirectionNum(this.params.directionNum);
            
            // 多方向时使用曝光
            const finalExposure = (this.params.directionNum > 1) ? this.params.exposure : 1.0;
            this.blendPass.setExposure(finalExposure);
        }
    }
    
    /**
     * 设置模糊强度
     */
    setIntensity(intensity) {
        this.setParameter('intensity', intensity);
    }
    
    /**
     * 设置角度
     */
    setAngle(angle) {
        this.setParameter('angle', angle);
    }
    
    /**
     * 设置方向数量
     */
    setDirectionNum(num) {
        this.setParameter('directionNum', Math.max(1, Math.min(4, num)));
    }
    
    /**
     * 设置曝光度
     */
    setExposure(exposure) {
        this.setParameter('exposure', exposure);
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
     * 设置边界类型
     */
    setBorderType(borderType) {
        this.setParameter('borderType', borderType);
    }
    
    /**
     * 设置混合模式
     */
    setBlendMode(blendMode) {
        this.setParameter('blendMode', blendMode);
    }
    
    /**
     * 设置尺寸
     */
    setSize(width, height) {
        if (this.width !== width || this.height !== height) {
            this.width = width;
            this.height = height;
            this.updateParameters();
        }
    }
    
    /**
     * 清理资源
     */
    dispose() {
        this.blurPasses = [];
        this.blendPass = null;
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

/*threeJS*/ module.exports = { DirectionalBlursShaderPass };
// /*Effect*/ exports.DirectionalBlursShaderPass = DirectionalBlursShaderPass;
