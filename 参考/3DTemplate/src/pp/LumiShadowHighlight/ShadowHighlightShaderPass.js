
/*threeJS*/ const THREE = require('three');
/*threeJS*/ const { ShaderPass } = require('three/examples/jsm/postprocessing/ShaderPass.js');

// /*Effect*/ const THREE = require('../../ThreeJS/three-amg-wrapper.js').THREE;
// /*Effect*/ const { ShaderPass } = require('../../ThreeJS/ShaderPass.js');


// 导入Shader
const vertexSource = require('./shaders/ShadowHighlightVert.js').source;
const fragmentSource = require('./shaders/ShadowHighlightFrag.js').source;

// 创建Shader
function createShader() {
    // 适配three.js的shader代码
    const vertexShader = vertexSource
        .replace(/attribute /g, '//attribute ')
        .replace(/a_position/g, 'position')
        .replace(/a_texcoord0/g, 'uv')
        .replace(/v_uv/g, 'vUv')
        .replace('sign(vec4(position, 0.0, 1.0))', 'projectionMatrix * modelViewMatrix * vec4(position, 1.0)');

    const fragmentShader = fragmentSource
        .replace(/v_uv/g, 'vUv')
        .replace(/u_inputTexture/g, 'tDiffuse')
        .replace(/gl_FragData\[0\]/g, 'gl_FragColor');
        
    // 根据shader实际情况设置uniforms
    return {
        name: 'ShadowHighlightShaderPass',
        uniforms: {
            'tDiffuse': { value: null },
            'u_highlightParam': { value: 1.0 },
            'u_shadowParam': { value: 1.0 }
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
    };
}

// 创建ShadowHighlightShaderPass
class ShadowHighlightShaderPass extends ShaderPass {
    constructor() {
        super(createShader());

        // 参数默认值 - 对应AEInfo.json中的配置
        this.params = {
            shadowIntensity: 0.5,
            highlightIntensity: 0.5,
            intensity: 1.0,  // 添加intensity参数
        };

        // 内部常量
        this.constants = {
            minIntensity: -1.0,
            maxIntensity: 1.0,
            eps: 1e-5
        };

        this.presets = {
            // 无效果
            none: {
                intensity: 0,
            },

            // 轻度调节
            low: {
                intensity: 1,
                shadowIntensity: 0.2,
                highlightIntensity: 0.2
            },
            
            // 中等调节
            medium: {
                intensity: 1,
                shadowIntensity: 0.5,
                highlightIntensity: 0.5
            },
            
            // 强烈调节
            high: {
                intensity: 1,
                shadowIntensity: 0.8,
                highlightIntensity: 0.8
            },
        };
    }

    // 映射用户参数到公式参数 - 对齐Lua中getShadowParam逻辑
    _getShadowParam(intensity) {
        const p = intensity;
        const p2 = p * p;
        const p3 = p2 * p;
        const p4 = p3 * p;
        return 1.0 - 0.503 * p + 0.183 * p2 - 0.147 * p3 + 0.067 * p4;
    }

    // 映射用户参数到公式参数 - 对齐Lua中getHighlightParam逻辑
    _getHighlightParam(intensity) {
        const p = intensity;
        const p2 = p * p;
        const p3 = p2 * p;
        const p4 = p3 * p;
        return 1.0 + 0.503 * p + 0.183 * p2 + 0.147 * p3 + 0.067 * p4;
    }

    // 限制值在指定范围内
    _clampValue(value, min = 0, max = 1) {
        return Math.max(min, Math.min(max, value));
    }

    // 渲染函数，对齐Lua中onUpdate的逻辑
    render(renderer, writeBuffer, readBuffer, deltaTime, maskActive) {
        // 限制参数范围
        const shadowIntensity = this._clampValue(this.params.shadowIntensity, this.constants.minIntensity, this.constants.maxIntensity);
        const highlightIntensity = this._clampValue(this.params.highlightIntensity, this.constants.minIntensity, this.constants.maxIntensity);
        const intensity = this._clampValue(this.params.intensity, 0.0, 1.0);  // 限制intensity范围

        // 计算shader参数
        const shadowParam = this._getShadowParam(shadowIntensity);
        const highlightParam = this._getHighlightParam(highlightIntensity);

        // 根据intensity调整参数强度
        const adjustedShadowParam = 1.0 + (shadowParam - 1.0) * intensity;
        const adjustedHighlightParam = 1.0 + (highlightParam - 1.0) * intensity;

        // 设置uniforms
        this.uniforms.tDiffuse.value = readBuffer.texture;
        this.uniforms.u_shadowParam.value = adjustedShadowParam;
        this.uniforms.u_highlightParam.value = adjustedHighlightParam;

        super.render(renderer, writeBuffer, readBuffer, deltaTime, maskActive);
    }

    // 设置阴影强度
    setShadowIntensity(value) {
        this.params.shadowIntensity = this._clampValue(value, this.constants.minIntensity, this.constants.maxIntensity);
    }

    // 设置高光强度
    setHighlightIntensity(value) {
        this.params.highlightIntensity = this._clampValue(value, this.constants.minIntensity, this.constants.maxIntensity);
    }

    // 获取阴影强度
    getShadowIntensity() {
        return this.params.shadowIntensity;
    }

    // 获取高光强度
    getHighlightIntensity() {
        return this.params.highlightIntensity;
    }

    // 添加intensity设置方法
    setIntensity(value) {
        this.params.intensity = this._clampValue(value, 0.0, 1.0);
    }

    // 获取intensity值
    getIntensity() {
        return this.params.intensity;
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

/*threeJS*/ module.exports = { ShadowHighlightShaderPass };
// /*Effect*/ exports.ShadowHighlightShaderPass = ShadowHighlightShaderPass;
