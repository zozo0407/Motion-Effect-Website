/*threeJS*/ const THREE = require('three');
/*threeJS*/ const { ShaderPass } = require('three/examples/jsm/postprocessing/ShaderPass.js');

// /*Effect*/ const THREE = require('../../ThreeJS/three-amg-wrapper.js').THREE;
// /*Effect*/ const { ShaderPass } = require('../../ThreeJS/ShaderPass.js');

// 导入Shader
const vertexSource = require('./shaders/unmultVert.js').source;
const fragmentSource = require('./shaders/unmultFrag.js').source;

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
        .replace(/u_inputTex/g, 'tDiffuse')
        .replace(/gl_FragData\[0\]/g, 'gl_FragColor');

    return {
        name: 'UnmultShaderPass',
        uniforms: {
            'tDiffuse': { value: null },
            'u_unmult': { value: 1 }
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
    };
}

// 创建UnmultShaderPass
class UnmultShaderPass extends ShaderPass {
    constructor() {
        super(createShader());

        // 参数默认值 - 对应AEInfo.json中的配置
        this.params = {
            intensity: 1.0  // 直接使用intensity控制，默认为1.0
        };

        this.presets = {
            // 无效果
            none: {
                intensity: 0
            },

            // 启用去预乘
            enabled: {
                intensity: 1.0
            }
        };
    }

    // 渲染函数，对齐Lua中onUpdate的逻辑
    render(renderer, writeBuffer, readBuffer, deltaTime, maskActive) {
        this.uniforms.tDiffuse.value = readBuffer.texture;
        // 直接使用intensity控制，但限制其值只能是0或1
        this.uniforms.u_unmult.value = (this.params.intensity > 0.5) ? 1 : 0;

        super.render(renderer, writeBuffer, readBuffer, deltaTime, maskActive);
    }

    // 参数设置函数
    setIntensity(value) {
        this.params.intensity = Math.max(0.0, Math.min(1.0, Number(value)));
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

/*threeJS*/ module.exports = { UnmultShaderPass };
// /*Effect*/ exports.UnmultShaderPass = UnmultShaderPass;
