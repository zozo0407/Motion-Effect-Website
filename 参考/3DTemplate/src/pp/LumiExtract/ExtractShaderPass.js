/*threeJS*/ const THREE = require('three');
/*threeJS*/ const { ShaderPass } = require('three/examples/jsm/postprocessing/ShaderPass.js');

// /*Effect*/ const THREE = require('../../ThreeJS/three-amg-wrapper.js').THREE;
// /*Effect*/ const { ShaderPass } = require('../../ThreeJS/ShaderPass.js');

// 导入Shader
const vertexSource = require('./shaders/extractVert.js').source;
const fragmentSource = require('./shaders/extractFrag.js').source;

// 创建Shader
function createShader() {
    // Three.js适配
    const vertexShader = vertexSource
        .replace(/attribute /g, '//attribute ')
        .replace(/a_position/g, 'position')
        .replace(/a_texcoord0/g, 'uv')
        .replace(/v_uv/g, 'vUv')
        .replace('sign(vec4(position, 0.0, 1.0))', 'projectionMatrix * modelViewMatrix * vec4(position, 1.0)');

    const fragmentShader = fragmentSource
        .replace(/varying vec2 v_uv;/g, 'varying vec2 vUv;')
        .replace(/v_uv/g, 'vUv')
        .replace(/u_InputTexture/g, 'tDiffuse')
        .replace(/gl_FragData\[0\]/g, 'gl_FragColor');
        
    return {
        name: 'ExtractShaderPass',
        uniforms: {
            'tDiffuse': { value: null },
            'u_BlackField': { value: 0.0 },
            'u_BlackSoft': { value: 0.0 },
            'u_WhiteField': { value: 1.0 },
            'u_WhiteSoft': { value: 0.0 },
            'u_Reverse': { value: 0.0 },
            'u_Intensity': { value: 1.0 }
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
    };
}

// 创建ExtractShaderPass
class ExtractShaderPass extends ShaderPass {
    constructor() {
        super(createShader());

        // 参数默认值 - 对应AEInfo.json中的配置
        this.params = {
            blackField: 0.0,        // 黑场阈值 (0.0-255.0)
            blackSoft: 0.0,         // 黑色柔和度 (0.0-255.0)
            whiteField: 255.0,      // 白场阈值 (0.0-255.0)
            whiteSoft: 0.0,         // 白色柔和度 (0.0-255.0)
            reverse: false,         // 反转标志
            intensity: 0.0          // 强度控制 (0.0-1.0)
        };

        // 内部常量
        this.constants = {
            NORMALIZE_FACTOR: 255.0,                        // 归一化因子
            LUMINANCE_WEIGHTS: [0.3, 0.588235, 0.111765],  // 亮度计算权重
            EPSILON: 1e-5                                   // 防除零小值
        };

        // LumiExtract 预设配置
        this.presets = {
            // 无效果
            none: {
                intensity: 0,
            },

            // 高对比度提取
            highContrast: {
                blackField: 50.0,
                blackSoft: 10.0,
                whiteField: 200.0,
                whiteSoft: 10.0,
                reverse: false,
                intensity: 1.0,
            },

            // 软提取 -- 过渡自然
            softExtraction: {
                blackField: 80.0,
                blackSoft: 40.0,
                whiteField: 180.0,
                whiteSoft: 40.0,
                reverse: false,
                intensity: 1.0,
            },

            // 反转提取 -- 提取非目标区域
            invertedExtraction: {
                blackField: 100.0,
                blackSoft: 20.0,
                whiteField: 150.0,
                whiteSoft: 20.0,
                reverse: true,
                intensity: 1.0,
            },
        };

    }

    // 渲染函数，对齐Lua中onUpdate的逻辑
    render(renderer, writeBuffer, readBuffer, deltaTime, maskActive) {
        const textureWidth = readBuffer.width;
        const textureHeight = readBuffer.height;
        
        // 设置输入纹理
        this.uniforms.tDiffuse.value = readBuffer.texture;
        
        // 参数归一化处理 - 从[0,255]范围转换到[0,1]范围
        this.uniforms.u_BlackField.value = this.params.blackField / this.constants.NORMALIZE_FACTOR;
        this.uniforms.u_BlackSoft.value = this.params.blackSoft / this.constants.NORMALIZE_FACTOR;
        this.uniforms.u_WhiteField.value = this.params.whiteField / this.constants.NORMALIZE_FACTOR;
        this.uniforms.u_WhiteSoft.value = this.params.whiteSoft / this.constants.NORMALIZE_FACTOR;
        
        // 布尔值转换为浮点数
        this.uniforms.u_Reverse.value = this.params.reverse ? 1.0 : 0.0;
        
        // 设置强度值
        this.uniforms.u_Intensity.value = this.params.intensity;
        
        super.render(renderer, writeBuffer, readBuffer, deltaTime, maskActive);
    }

    // 参数范围限制函数
    _clampValue(value, min = 0, max = 255) {
        return Math.max(min, Math.min(max, value));
    }

    // 平滑阈值函数的JavaScript实现
    _smoothThreshold(min, max, value) {
        const epsilon = this.constants.EPSILON;
        return Math.max(0.0, Math.min(1.0, (value - min) / (max - min + epsilon)));
    }

    // 亮度计算函数
    _calculateLuminance(r, g, b) {
        const weights = this.constants.LUMINANCE_WEIGHTS;
        return r * weights[0] + g * weights[1] + b * weights[2];
    }

    // 参数设置函数
    setBlackField(value) {
        this.params.blackField = this._clampValue(value, 0, 255);
    }

    setBlackSoft(value) {
        this.params.blackSoft = this._clampValue(value, 0, 255);
    }

    setWhiteField(value) {
        this.params.whiteField = this._clampValue(value, 0, 255);
    }

    setWhiteSoft(value) {
        this.params.whiteSoft = this._clampValue(value, 0, 255);
    }

    setReverse(value) {
        this.params.reverse = Boolean(value);
    }

    setIntensity(value) {
        this.params.intensity = Math.max(0.0, Math.min(1.0, value));
    }

    // 便捷的批量设置函数
    setParameters(params) {
        if (params.blackField !== undefined) this.setBlackField(params.blackField);
        if (params.blackSoft !== undefined) this.setBlackSoft(params.blackSoft);
        if (params.whiteField !== undefined) this.setWhiteField(params.whiteField);
        if (params.whiteSoft !== undefined) this.setWhiteSoft(params.whiteSoft);
        if (params.reverse !== undefined) this.setReverse(params.reverse);
    }

    // 重置为默认值
    resetToDefaults() {
        this.params.blackField = 0.0;
        this.params.blackSoft = 0.0;
        this.params.whiteField = 255.0;
        this.params.whiteSoft = 0.0;
        this.params.reverse = false;
    }

    // 获取当前参数值
    getParameters() {
        return {
            blackField: this.params.blackField,
            blackSoft: this.params.blackSoft,
            whiteField: this.params.whiteField,
            whiteSoft: this.params.whiteSoft,
            reverse: this.params.reverse
        };
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

/*threeJS*/ module.exports = { ExtractShaderPass };
// /*Effect*/ exports.ExtractShaderPass = ExtractShaderPass;
