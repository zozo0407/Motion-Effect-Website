/*threeJS*/ const THREE = require('three');
/*threeJS*/ const { ShaderPass } = require('three/examples/jsm/postprocessing/ShaderPass.js');

// /*Effect*/ const THREE = require('../../ThreeJS/three-amg-wrapper.js').THREE;
// /*Effect*/ const { ShaderPass } = require('../../ThreeJS/ShaderPass.js');


// 导入Shader
const vertexSource = require('./shaders/prismVert.js').source;
const fragmentSource = require('./shaders/prismFrag.js').source;

// 创建Shader
function createShader() {
    // Three.js适配规则
    const vertexShader = vertexSource
        .replace(/attribute /g, '//attribute ')
        .replace(/a_position/g, 'position')
        .replace(/a_texcoord0/g, 'uv')
        .replace(/v_uv/g, 'vUv')
        .replace('sign(vec4(position, 0.0, 1.0))', 'projectionMatrix * modelViewMatrix * vec4(position, 1.0)');

    const fragmentShader = fragmentSource
        .replace(/v_uv/g, 'vUv')
        .replace(/u_inputTexture/g, 'tDiffuse')
        .replace(/gl_FragData\[0\]/g, 'gl_FragColor')
        .replace(/mediump sampler2D/g, 'sampler2D')
        .replace(/mediump /g, '')
        .replace(/varying vec2 v_uv;/g, 'varying vec2 vUv;');

    // 根据分析报告中的参数映射设置uniforms
    return {
        name: 'BCC_PrismShaderPass',
        uniforms: {
            'tDiffuse': { value: null },
            'u_ScreenParams': { value: new THREE.Vector4(1024, 1024, 1.0/1024, 1.0/1024) },
            'u_center': { value: new THREE.Vector2(0.5, 0.5) },
            'u_globalTransform': { value: 1.0 },
            'u_scaleStart': { value: 1.02 },
            'u_scaleEnd': { value: 0.98 },
            'u_angleStart': { value: 0.0 },
            'u_angleEnd': { value: 0.0 },
            'u_smoothness': { value: 1.0 },
            'u_offsetStart': { value: new THREE.Vector2(0.5, 0.5) },
            'u_offsetEnd': { value: new THREE.Vector2(0.5, 0.5) },
            'u_colorStart': { value: new THREE.Vector3(1.0, 0.0, 0.0) },
            'u_colorMid': { value: new THREE.Vector3(0.0, 1.0, 0.0) },
            'u_colorEnd': { value: new THREE.Vector3(0.0, 0.0, 1.0) },
            'u_weight': { value: 1.0 },
            'u_fallOff': { value: 0.0 }
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
    };
}

// 创建BCC_PrismShaderPass
class BCC_PrismShaderPass extends ShaderPass {
    constructor() {
        super(createShader());

        // 参数默认值 - 对应AEInfo.json中的配置
        this.params = {
            globalTransform: { value: 100 },        // 默认100，范围0-400
            smoothness: { value: 1 },               // 默认1，范围0-1
            center: { value: new THREE.Vector2(0.5, 0.5) },  // 默认[0.5, 0.5]
            weight: { value: 1 },                   // 默认1，范围0-1
            scaleStart: { value: 102 },             // 默认102，范围1-500
            scaleEnd: { value: 98 },                // 默认98，范围1-500
            angleStart: { value: 0.0 },             // 默认0.0，角度类型
            angleEnd: { value: 0.0 },               // 默认0.0，角度类型
            falloff: { value: 0 },                  // 默认0，范围-100-100
            offsetStart: { value: new THREE.Vector2(0.5, 0.5) },  // 默认[0.5, 0.5]
            offsetEnd: { value: new THREE.Vector2(0.5, 0.5) },    // 默认[0.5, 0.5]
            colorStart: { value: new THREE.Vector3(1.0, 0.0, 0.0) }, // 默认红色
            colorMid: { value: new THREE.Vector3(0.0, 1.0, 0.0) },   // 默认绿色
            colorEnd: { value: new THREE.Vector3(0.0, 0.0, 1.0) }, // 默认蓝色
            intensity: { value: 1.0 }
        };

        // 内部常量
        this.constants = {
            DEFAULT_SCALE: 100,
            DEFAULT_ANGLE: 0,
            DEFAULT_FALLOFF: 0,
            DEFAULT_WEIGHT: 0,
            DEFAULT_SMOOTHNESS: 0,
            DEFAULT_GLOBAL_TRANSFORM: 100,
            DEFAULT_CENTER: [0.5, 0.5],
            DEFAULT_OFFSET: [0.5, 0.5],
            DEFAULT_COLOR_START: [1, 0, 0],
            DEFAULT_COLOR_MID: [0, 1, 0],
            DEFAULT_COLOR_END: [0, 0, 1]
        };

        // 预设配置
        this.presets = {
            // 无效果 
            none: {
                intensity: 0,
            },

            // 轻度效果
            low: {
                intensity: 1,
                globalTransform: 100,
                scaleStart: 105,
                scaleEnd: 98,
                angleStart: 0,
                angleEnd: 0,
                weight: 1,
                smoothness: 1,
                falloff: 0
            },
            
            // 中等效果
            medium: {
                intensity: 1,
                globalTransform: 100,
                scaleStart: 110,
                scaleEnd: 95,
                angleStart: 0,
                angleEnd: 0,
                weight: 0.5,
                smoothness: 0.6,
                falloff: 0
            },
            
            // 重度效果
            high: {
                intensity: 1,
                globalTransform: 200,
                scaleStart: 120,
                scaleEnd: 80,
                angleStart: 0,
                angleEnd: 0,
                weight: 0.7,
                smoothness: 0.4,
                falloff: 0
            }
        };
    }

    // 渲染函数，对齐Lua中onUpdate的逻辑
    render(renderer, writeBuffer, readBuffer, deltaTime, maskActive) {
        const textureWidth = readBuffer.width;
        const textureHeight = readBuffer.height;
        
        this.uniforms.tDiffuse.value = readBuffer.texture;
        
        // 更新屏幕参数
        this.uniforms.u_ScreenParams.value.set(
            textureWidth, 
            textureHeight, 
            1.0/textureWidth, 
            1.0/textureHeight
        );

        // 根据Lua代码中的参数处理逻辑进行映射
        // globalTransform: 除以100
        this.uniforms.u_globalTransform.value = this.params.globalTransform.value / 100.0 * this.params.intensity.value;
        
        // scaleStart/scaleEnd: 除以100
        this.uniforms.u_scaleStart.value = this.params.scaleStart.value / 100.0;
        this.uniforms.u_scaleEnd.value = this.params.scaleEnd.value / 100.0;
        
        // angleStart/angleEnd: 转换为弧度
        this.uniforms.u_angleStart.value = this.params.angleStart.value * Math.PI / 180.0;
        this.uniforms.u_angleEnd.value = this.params.angleEnd.value * Math.PI / 180.0;
        
        // falloff: 除以100
        this.uniforms.u_fallOff.value = this.params.falloff.value / 100.0;
        
        // weight: 开平方根处理
        this.uniforms.u_weight.value = Math.sqrt(Math.max(0, this.params.weight.value));
        
        // 直接传递的参数
        this.uniforms.u_center.value.copy(this.params.center.value);
        this.uniforms.u_smoothness.value = this.params.smoothness.value;
        this.uniforms.u_offsetStart.value.copy(this.params.offsetStart.value);
        this.uniforms.u_offsetEnd.value.copy(this.params.offsetEnd.value);
        this.uniforms.u_colorStart.value.copy(this.params.colorStart.value);
        this.uniforms.u_colorMid.value.copy(this.params.colorMid.value);
        this.uniforms.u_colorEnd.value.copy(this.params.colorEnd.value);

        super.render(renderer, writeBuffer, readBuffer, deltaTime, maskActive);
    }

    _clampValue(value, min = 0, max = 1) {
        return Math.max(min, Math.min(max, value));
    }

    // 参数设置函数，根据AEInfo.json中的配置进行设定
    setGlobalTransform(value) {
        this.params.globalTransform.value = this._clampValue(value, 0, 400);
    }

    setSmoothness(value) {
        this.params.smoothness.value = this._clampValue(value, 0, 1);
    }

    setCenter(x, y) {
        this.params.center.value.set(x, y);
    }

    setWeight(value) {
        this.params.weight.value = this._clampValue(value, 0, 1);
    }

    setScaleStart(value) {
        this.params.scaleStart.value = this._clampValue(value, 1, 500);
    }

    setScaleEnd(value) {
        this.params.scaleEnd.value = this._clampValue(value, 1, 500);
    }

    setAngleStart(value) {
        this.params.angleStart.value = value; // 角度类型，不限制范围
    }

    setAngleEnd(value) {
        this.params.angleEnd.value = value; // 角度类型，不限制范围
    }

    setFalloff(value) {
        this.params.falloff.value = this._clampValue(value, -100, 100);
    }

    setOffsetStart(x, y) {
        this.params.offsetStart.value.set(x, y);
    }

    setOffsetEnd(x, y) {
        this.params.offsetEnd.value.set(x, y);
    }

    setColorStart(r, g, b) {
        this.params.colorStart.value.set(
            this._clampValue(r, 0, 1),
            this._clampValue(g, 0, 1),
            this._clampValue(b, 0, 1)
        );
    }

    setColorMid(r, g, b) {
        this.params.colorMid.value.set(
            this._clampValue(r, 0, 1),
            this._clampValue(g, 0, 1),
            this._clampValue(b, 0, 1)
        );
    }

    setColorEnd(r, g, b) {
        this.params.colorEnd.value.set(
            this._clampValue(r, 0, 1),
            this._clampValue(g, 0, 1),
            this._clampValue(b, 0, 1)
        );
    }

    // 便捷的颜色设置方法（接受0-255范围的RGB值）
    setColorStartRGB(r, g, b) {
        this.setColorStart(r/255.0, g/255.0, b/255.0);
    }

    setColorMidRGB(r, g, b) {
        this.setColorMid(r/255.0, g/255.0, b/255.0);
    }

    setColorEndRGB(r, g, b) {
        this.setColorEnd(r/255.0, g/255.0, b/255.0);
    }

    setIntensity(value) {
        this.params.intensity.value = this._clampValue(value, 0, 1);
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

/*threeJS*/ module.exports = { BCC_PrismShaderPass };
// /*Effect*/ exports.BCC_PrismShaderPass = BCC_PrismShaderPass;