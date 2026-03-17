
/*threeJS*/ const THREE = require('three');
/*threeJS*/ const { ShaderPass } = require('three/examples/jsm/postprocessing/ShaderPass.js');

// /*Effect*/ const THREE = require('../../ThreeJS/three-amg-wrapper.js').THREE;
// /*Effect*/ const { ShaderPass } = require('../../ThreeJS/ShaderPass.js');

// 导入Shader
const vertexSource = require('./shaders/LightSensationVert.js').source;
const fragmentSource = require('./shaders/LightSensationFrag.js').source;

// 创建Shader
function createShader() {
    // 适配three.js的shader代码
    const vertexShader = vertexSource
        .replace(/attribute /g, '//attribute ')
        .replace(/a_position/g, 'position')
        .replace(/a_texcoord0/g, 'uv')
        .replace(/uv0/g, 'v_uv')
        .replace('sign(vec4(position, 0.0, 1.0))', 'projectionMatrix * modelViewMatrix * vec4(position, 1.0)');

    const fragmentShader = fragmentSource
        .replace(/uv0/g, 'v_uv')
        .replace(/inputImageTexture/g, 'tDiffuse')
        .replace(/gl_FragData\[0\]/g, 'gl_FragColor');
        
    // 根据shader和AEInfo.json设置uniforms
    return {
        name: 'LightSensationShaderPass',
        uniforms: {
            'tDiffuse': { value: null },
            'tDiffuse2': { value: null },
            'tDiffuse3': { value: null },
            'intensity': { value: 1.0 }
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
    };
}

// 创建LightSensationShaderPass
class LightSensationShaderPass extends ShaderPass {
    constructor() {
        super(createShader());

        // 参数默认值 - 对应AEInfo.json中的配置
        this.params = {
            lightIntensity: 1.0, // 对应AEInfo.json中的lightIntensity参数
            tLookupMin: null,
            tLookupMax: null,
            intensity: 1.0,
        };

        // LumiLightSensation预设配置
        this.presets = {
            // 无效果
            none: {
                intensity: 0,
                lightIntensity: 0
            },

            // 轻度光感调整
            low: {
                intensity: 0.3,
                lightIntensity: 0.2
            },
            
            // 中等光感调整
            medium: {
                intensity: 0.6,
                lightIntensity: 0.4
            },
            
            // 强烈光感调整
            high: {
                intensity: 1.0,
                lightIntensity: 0.8
            },

            // 低光环境
            low_light: {
                intensity: 0.8,
                lightIntensity: -0.6
            }
        };

        // 需要加载LUT纹理
        this.loadLookupTextures();
    }

    // 纹理加载函数
    _loadTexture(texturePath) {
        const textureLoader = new THREE.TextureLoader(); 
        return new Promise(resolve => { 
            const texture = textureLoader.load(texturePath, resolve); 
            texture.colorSpace = THREE.LinearSRGBColorSpace; 
            texture.wrapS = THREE.ClampToEdgeWrapping; 
            texture.wrapT = THREE.ClampToEdgeWrapping; 
            texture.minFilter = THREE.LinearFilter; 
            texture.magFilter = THREE.LinearFilter; 
            return texture;
        });
    }

    async loadLookupTextures() {
        /*threeJS*/ const minTexture = await this._loadTexture(require('./images/lightSensation_min.png'));
        /*threeJS*/ const maxTexture = await this._loadTexture(require('./images/lightSensation_max.png'));
        // /*Effect*/ const minTexture = await this._loadTexture('js/pp/LumiLightSensation/images/lightSensation_min.png');
        // /*Effect*/ const maxTexture = await this._loadTexture('js/pp/LumiLightSensation/images/lightSensation_max.png');
        this.params.tLookupMin = minTexture;
        this.params.tLookupMax = maxTexture;
    }

    // 渲染函数，对齐Lua中onUpdate的逻辑
    render(renderer, writeBuffer, readBuffer, deltaTime, maskActive) {
        this.uniforms.tDiffuse.value = readBuffer.texture;
        this.uniforms.intensity.value = this.params.lightIntensity * this.params.intensity;
        this.uniforms.tDiffuse2.value = this.params.tLookupMin;
        this.uniforms.tDiffuse3.value = this.params.tLookupMax;

        super.render(renderer, writeBuffer, readBuffer, deltaTime, maskActive);
    }

    _clampValue(value, min = 0, max = 1) {
        return Math.max(min, Math.min(max, value));
    }

    // 参数设置函数，根据AEInfo.json中的配置
    setLightIntensity(intensity) {
        this.params.lightIntensity = this._clampValue(intensity, -1, 1);
    }

    setIntensity(intensity) {
        this.params.intensity = this._clampValue(intensity, 0, 1);
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

/*threeJS*/ module.exports = { LightSensationShaderPass };
// /*Effect*/ exports.LightSensationShaderPass = LightSensationShaderPass;
