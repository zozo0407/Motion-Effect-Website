/*threeJS*/ const THREE = require('three');
/*threeJS*/ const { ShaderPass } = require('three/examples/jsm/postprocessing/ShaderPass.js');

// /*Effect*/ const THREE = require('../../ThreeJS/three-amg-wrapper.js').THREE;
// /*Effect*/ const { ShaderPass } = require('../../ThreeJS/ShaderPass.js');

// 导入Shader
const vertexSource = require('./shaders/contrastVert.js').source;
const fragmentSource = require('./shaders/contrastFrag.js').source;

// 创建Shader
function createShader() {
    // Three.js适配规则
    const vertexShader = vertexSource
        .replace(/attribute /g, '//attribute ')
        .replace(/a_position/g, 'position')
        .replace(/a_texcoord0/g, 'uv')
        .replace(/uv0/g, 'vUv')
        .replace('sign(vec4(position, 0.0, 1.0))', 'projectionMatrix * modelViewMatrix * vec4(position, 1.0)');

    const fragmentShader = fragmentSource
        .replace(/uv0/g, 'vUv')
        .replace(/u_inputTexture/g, 'tDiffuse')
        .replace(/gl_FragData\[0\]/g, 'gl_FragColor')
        .replace(/mediump sampler2D/g, 'sampler2D')
        .replace(/varying vec2 uv0;/g, 'varying vec2 vUv;');

    // 根据分析报告中的uniform参数设置
    return {
        name: 'ContrastShaderPass',
        uniforms: {
            'tDiffuse': { value: null },
            'u_intensity': { value: 1.5 },
            'u_pivot': { value: 0.43 },
            'u_xFactor': { value: 0.0 },
            'u_pivotSlope': { value: 0.0 },
            'u_leftDiff': { value: 0.0 },
            'u_rightDiff': { value: 0.0 },
            'u_leftSlopeDiff': { value: 0.0 },
            'u_rightSlopeDiff': { value: 0.0 }
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
    };
}

// 创建ContrastShaderPass
class ContrastShaderPass extends ShaderPass {
    constructor() {
        super(createShader());

        // 参数默认值 - 对应AEInfo.json中的配置
        this.params = {
            contrastIntensity: 1.5,  // 默认1.5，范围0.0-2.0
            pivot: 0.43,              // 默认0.43，范围0.0-1.0
            intensity: 1.0
        };

        // 内部常量
        this.constants = {
            DEFAULT_CONTRAST_INTENSITY: 1.5,
            DEFAULT_PIVOT: 0.43,
            MIN_INTENSITY: 0.0,
            MAX_INTENSITY: 2.0,
            EPS: 1e-5
        };

        // LumiContrast 预设配置
        this.presets = {
            // 无效果
            none: {
                intensity: 0,
            },

            // 轻度对比度增强 - 微妙的层次提升
            low: {
                intensity: 0.5,
                contrastIntensity: 1.2,
                pivot: 0.5,
            },
            
            // 中等对比度增强 - 明显的视觉改善
            medium: {
                intensity: 0.7,
                contrastIntensity: 1.5,
                pivot: 0.43,
            },
            
            // 重度对比度增强 - 强烈的戏剧效果
            high: {
                intensity: 1.0,
                contrastIntensity: 1.7,
                pivot: 0.4,
            }
        };

    }

    // Sigmoid X因子计算函数（基于分析报告中的Lua代码）
    getSigmoidXFactor(intensity) {
        return Math.exp(8.33 * intensity - 12.16) + 5.82 * intensity - 1.72;
    }

    // Sigmoid函数计算（基于分析报告中的Lua代码）
    getSigmoid(x, intensity, pivot) {
        const a = this.getSigmoidXFactor(intensity);
        const s = 1.0 / (1.0 + Math.exp(-a * (x - pivot)));
        const y = s + pivot - 0.5;        // sigmoid值
        const k = a * s * (1.0 - s);      // sigmoid导数
        return { y, k };
    }

    // 参数计算函数（基于分析报告中的Lua逻辑）
    calculateParameters(intensity, pivot) {
        // 参数范围限制
        intensity = Math.max(this.constants.MIN_INTENSITY, Math.min(this.constants.MAX_INTENSITY, intensity));
        pivot = Math.max(0.0, Math.min(1.0, pivot));

        const xFactor = this.getSigmoidXFactor(intensity);
        const left = this.getSigmoid(0.0, intensity, pivot);
        const right = this.getSigmoid(1.0, intensity, pivot);
        const pivotResult = this.getSigmoid(pivot, intensity, pivot);
        
        return {
            xFactor: xFactor,
            leftDiff: 0.0 - left.y,
            rightDiff: 1.0 - right.y,
            leftSlopeDiff: pivotResult.k - left.k,
            rightSlopeDiff: pivotResult.k - right.k,
            pivotSlope: pivotResult.k
        };
    }

    // 渲染函数，对齐Lua中onUpdate的逻辑
    render(renderer, writeBuffer, readBuffer, deltaTime, maskActive) {
        this.uniforms.tDiffuse.value = readBuffer.texture;

        const actualContrastIntensity = THREE.MathUtils.lerp(
            1.0, 
            this.params.contrastIntensity, 
            this.params.intensity
        );
        
        // 计算复杂的uniform参数
        const calculated = this.calculateParameters(actualContrastIntensity, this.params.pivot);
        
        // 更新所有uniform参数
        this.uniforms.u_intensity.value = actualContrastIntensity;
        this.uniforms.u_pivot.value = this.params.pivot;
        this.uniforms.u_xFactor.value = calculated.xFactor;
        this.uniforms.u_pivotSlope.value = calculated.pivotSlope;
        this.uniforms.u_leftDiff.value = calculated.leftDiff;
        this.uniforms.u_rightDiff.value = calculated.rightDiff;
        this.uniforms.u_leftSlopeDiff.value = calculated.leftSlopeDiff;
        this.uniforms.u_rightSlopeDiff.value = calculated.rightSlopeDiff;

        super.render(renderer, writeBuffer, readBuffer, deltaTime, maskActive);
    }

    _clampValue(value, min = 0, max = 1) {
        return Math.max(min, Math.min(max, value));
    }

    // 参数设置函数，根据AEInfo.json中的配置进行设定
    setContrastIntensity(value) {
        this.params.contrastIntensity = this._clampValue(value, this.constants.MIN_INTENSITY, this.constants.MAX_INTENSITY);
    }

    setPivot(value) {
        this.params.pivot = this._clampValue(value, 0.0, 1.0);
    }

    setIntensity(value) {
        this.params.intensity = this._clampValue(value);
    }

    // 便捷的重置方法
    reset() {
        this.params.contrastIntensity = this.constants.DEFAULT_CONTRAST_INTENSITY;
        this.params.pivot = this.constants.DEFAULT_PIVOT;
    }

    // 获取当前参数值
    getContrastIntensity() {
        return this.params.contrastIntensity;
    }

    getPivot() {
        return this.params.pivot;
    }

    /**
     * 设置参数
     * @param {string} key - 参数名
     * @param {*} value - 参数值
     */
    setParameter(key, value) {
        // 将key转换为setter方法名，首字母大写
        const methodName = 'set' + key.charAt(0).toUpperCase() + key.slice(1);
        
        // 检查是否存在对应的setter方法，如果存在则调用
        if (typeof this[methodName] === 'function') {
        this[methodName](value);
        } else {
        console.warn(`No setter method found for parameter: ${key}`);
        }
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

/*threeJS*/ module.exports = { ContrastShaderPass };
// /*Effect*/ exports.ContrastShaderPass = ContrastShaderPass;
