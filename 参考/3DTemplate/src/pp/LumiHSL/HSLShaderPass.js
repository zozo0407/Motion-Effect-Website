
/*threeJS*/ const THREE = require('three');
/*threeJS*/ const { ShaderPass } = require('three/examples/jsm/postprocessing/ShaderPass.js');

// /*Effect*/ const THREE = require('../../ThreeJS/three-amg-wrapper.js').THREE;
// /*Effect*/ const { ShaderPass } = require('../../ThreeJS/ShaderPass.js');

const hslVertexSource = require('./shaders/03f5e9d4e11e8b8393014fe4a74f7154Vert.js').source;
const hslFragmentSource = require('./shaders/03f5e9d4e11e8b8393014fe4a74f7154Frag.js').source;

function createHSLShader() {
    const vertexShader = hslVertexSource
        .replace(/attribute /g, '//attribute ')
        .replace(/a_position/g, 'position')
        .replace(/a_texcoord0/g, 'uv')
        .replace(/uv0/g, 'v_uv')
        .replace('sign(vec4(position, 0.0, 1.0))', 'projectionMatrix * modelViewMatrix * vec4(position, 1.0)');

    const fragmentShader = hslFragmentSource
        .replace(/uv0/g, 'v_uv')
        .replace(/inputImageTexture/g, 'tDiffuse')
        .replace(/gl_FragData\[0\]/g, 'gl_FragColor');
        
    return {
        name: 'HSLShaderPass',
        uniforms: {
            'tDiffuse': { value: null },
            'hsl_param_0': { value: new THREE.Vector3(0, 0, 0) }, // Red
            'hsl_param_1': { value: new THREE.Vector3(0, 0, 0) }, // Orange
            'hsl_param_2': { value: new THREE.Vector3(0, 0, 0) }, // Yellow
            'hsl_param_3': { value: new THREE.Vector3(0, 0, 0) }, // Green
            'hsl_param_4': { value: new THREE.Vector3(0, 0, 0) }, // Cyan
            'hsl_param_5': { value: new THREE.Vector3(0, 0, 0) }, // Blue
            'hsl_param_6': { value: new THREE.Vector3(0, 0, 0) }, // Purple
            'hsl_param_7': { value: new THREE.Vector3(0, 0, 0) }, // Magenta
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
    };
}

class HSLShaderPass extends ShaderPass {
    constructor() {
        super(createHSLShader());

        // 参数默认值 - 对应AEInfo.json中的配置
        this.params = {
            Red: { value: new THREE.Vector3(0, 0, 0) }, // Red
            Orange: { value: new THREE.Vector3(0, 0, 0) }, // Orange
            Yellow: { value: new THREE.Vector3(0, 0, 0) }, // Yellow
            Green: { value: new THREE.Vector3(0, 0, 0) }, // Green
            Cyan: { value: new THREE.Vector3(0, 0, 0) }, // Cyan
            Blue: { value: new THREE.Vector3(0, 0, 0) }, // Blue
            Purple: { value: new THREE.Vector3(0, 0, 0) }, // Purple
            Magenta: { value: new THREE.Vector3(0, 0, 0) }, // Magenta
            intensity: { value: 1.0 },
        };

        // 内部常量
        this.constants = {
            slider_max_value: 100,
        };

        // LumiHSL预设配置
        this.presets = {
            // 无效果
            none: {
                intensity: 0,
            },

            // 暖色增强
            warm_boost: {
                intensity: 1.0,
                red: [0.3, 0.5, 0.2],
                orange: [0.4, 0.6, 0.1],
                yellow: [0.3, 0.5, 0.0],
                green: [-0.1, -0.1, -0.1],
                cyan: [-0.2, -0.3, -0.1],
                blue: [-0.2, -0.4, -0.1],
                purple: [-0.1, -0.2, -0.05],
                magenta: [0.2, 0.3, 0.1]
            },
            
            // 冷色增强
            cool_boost: {
                intensity: 1.0,
                red: [-0.2, -0.4, -0.1],
                orange: [-0.3, -0.5, -0.1],
                yellow: [-0.2, -0.4, -0.1],
                green: [0.1, 0.2, 0.1],
                cyan: [0.3, 0.5, 0.2],
                blue: [0.4, 0.6, 0.3],
                purple: [0.2, 0.4, 0.1],
                magenta: [0.1, 0.2, 0.05]
            },
            
            // 复古胶片
            vintage_film: {
                intensity: 1.0,
                red: [0.2, -0.3, -0.2],
                orange: [0.3, -0.1, -0.3],
                yellow: [0.1, -0.5, -0.4],
                green: [-0.1, -0.3, -0.2],
                cyan: [0.1, 0.3, 0.1],
                blue: [0.3, 0.5, 0.3],
                purple: [0.1, 0.3, 0.1],
                magenta: [-0.1, -0.2, -0.1]
            },
        };

    }

    render(renderer, writeBuffer, readBuffer, deltaTime, maskActive) {
        this.uniforms.tDiffuse.value = readBuffer.texture;
        this.uniforms.hsl_param_0.value = this.params.Red.value.clone().multiplyScalar(this.constants.slider_max_value * this.params.intensity.value);
        this.uniforms.hsl_param_1.value = this.params.Orange.value.clone().multiplyScalar(this.constants.slider_max_value * this.params.intensity.value);
        this.uniforms.hsl_param_2.value = this.params.Yellow.value.clone().multiplyScalar(this.constants.slider_max_value * this.params.intensity.value);
        this.uniforms.hsl_param_3.value = this.params.Green.value.clone().multiplyScalar(this.constants.slider_max_value * this.params.intensity.value);
        this.uniforms.hsl_param_4.value = this.params.Cyan.value.clone().multiplyScalar(this.constants.slider_max_value * this.params.intensity.value);
        this.uniforms.hsl_param_5.value = this.params.Blue.value.clone().multiplyScalar(this.constants.slider_max_value * this.params.intensity.value);
        this.uniforms.hsl_param_6.value = this.params.Purple.value.clone().multiplyScalar(this.constants.slider_max_value * this.params.intensity.value);
        this.uniforms.hsl_param_7.value = this.params.Magenta.value.clone().multiplyScalar(this.constants.slider_max_value * this.params.intensity.value);

        super.render(renderer, writeBuffer, readBuffer, deltaTime, maskActive);
    }

    _clampValue(value) {
        return Math.max(0, Math.min(1, value));
    }

    setIntensity(intensity) {
        this.params.intensity.value = this._clampValue(intensity);
    }

    setRed(value) {
        this.params.Red.value.set(
            this._clampValue(value[0]),
            this._clampValue(value[1]),
            this._clampValue(value[2])
        );
    }

    setOrange(value) {
        this.params.Orange.value.set(
            this._clampValue(value[0]),
            this._clampValue(value[1]),
            this._clampValue(value[2])
        );
    }

    setYellow(value) {
        this.params.Yellow.value.set(
            this._clampValue(value[0]),
            this._clampValue(value[1]),
            this._clampValue(value[2])
        );
    }

    setGreen(value) {
        this.params.Green.value.set(
            this._clampValue(value[0]),
            this._clampValue(value[1]),
            this._clampValue(value[2])
        );
    }

    setCyan(value) {
        this.params.Cyan.value.set(
            this._clampValue(value[0]),
            this._clampValue(value[1]),
            this._clampValue(value[2])
        );
    }

    setBlue(value) {
        this.params.Blue.value.set(
            this._clampValue(value[0]),
            this._clampValue(value[1]),
            this._clampValue(value[2])
        );
    }

    setPurple(value) {
        this.params.Purple.value.set(
            this._clampValue(value[0]),
            this._clampValue(value[1]),
            this._clampValue(value[2])
        );
    }

    setMagenta(value) {
        this.params.Magenta.value.set(
            this._clampValue(value[0]),
            this._clampValue(value[1]),
            this._clampValue(value[2])
        );
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

/*threeJS*/ module.exports = { HSLShaderPass, createHSLShader };
// /*Effect*/ exports.HSLShaderPass = HSLShaderPass;
