/*threeJS*/ const THREE = require('three');
/*threeJS*/ const { ShaderPass } = require('three/examples/jsm/postprocessing/ShaderPass.js');

// /*Effect*/ const THREE = require('../../ThreeJS/three-amg-wrapper.js').THREE;
// /*Effect*/ const { ShaderPass } = require('../../ThreeJS/ShaderPass.js');


// 导入Shader
const vertexSource = require('./shaders/bezier_deformationVert.js').source;
const fragmentSource = require('./shaders/bezier_deformationFrag.js').source;

// 创建Shader
function createShader() {
    // 适配顶点着色器为Three.js格式
    const vertexShader = vertexSource
        .replace(/attribute /g, '//attribute ')
        .replace(/a_position/g, 'position')
        .replace(/a_texcoord0/g, 'uv')
        .replace(/varying vec2 v_uv/g, 'varying vec2 vUv')
        .replace(/v_uv = uv/g, 'vUv = uv');

    // 适配片元着色器为Three.js格式
    const fragmentShader = fragmentSource
        .replace(/u_InputTex/g, 'tDiffuse')
        .replace(/varying vec2 v_uv/g, 'varying vec2 vUv')
        .replace(/v_uv/g, 'vUv')
        .replace(/gl_FragData\[0\]/g, 'gl_FragColor');

    // 定义uniforms，包含12个贝塞尔控制点参数
    return {
        name: 'BezierDeformationShaderPass',
        uniforms: {
            'tDiffuse': { value: null },
            'u_LeftBottomVertex': { value: new THREE.Vector2(0, 0) },
            'u_BottomLeftTangent': { value: new THREE.Vector2(0.333, 0) },
            'u_BottomRightTangent': { value: new THREE.Vector2(0.667, 0) },
            'u_BottomRightVertex': { value: new THREE.Vector2(1, 0) },
            'u_TopLeftVertex': { value: new THREE.Vector2(0, 1) },
            'u_TopLeftTangent': { value: new THREE.Vector2(0.333, 1) },
            'u_TopRightTangent': { value: new THREE.Vector2(0.667, 1) },
            'u_RightTopVertex': { value: new THREE.Vector2(1, 1) },
            'u_LeftBottomTangent': { value: new THREE.Vector2(0, 0.333) },
            'u_LeftTopTangent': { value: new THREE.Vector2(0, 0.667) },
            'u_RightBottomTangent': { value: new THREE.Vector2(1, 0.333) },
            'u_RightTopTangent': { value: new THREE.Vector2(1, 0.667) }
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
    };
}

// 创建BezierDeformationShaderPass
class BezierDeformationShaderPass extends ShaderPass {
    constructor() {
        super(createShader());

        // 参数默认值 - 对应AEInfo.json中的配置
        this.params = {
            BottomLeftTangent: { value: new THREE.Vector2(0.333, 0) },
            BottomRightTangent: { value: new THREE.Vector2(0.667, 0) },
            BottomRightVertex: { value: new THREE.Vector2(1, 0) },
            LeftBottomTangent: { value: new THREE.Vector2(0, 0.333) },
            LeftBottomVertex: { value: new THREE.Vector2(0, 0) },
            LeftTopTangent: { value: new THREE.Vector2(0, 0.667) },
            RightBottomTangent: { value: new THREE.Vector2(1, 0.333) },
            RightTopTangent: { value: new THREE.Vector2(1, 0.667) },
            RightTopVertex: { value: new THREE.Vector2(1, 1) },
            TopLeftTangent: { value: new THREE.Vector2(0.333, 1) },
            TopLeftVertex: { value: new THREE.Vector2(0, 1) },
            TopRightTangent: { value: new THREE.Vector2(0.667, 1) },
            intensity: { value: 1.0 }
        };
        
        // 定义默认控制点值（无变形状态）
        this.defaultControlPoints = {
            BottomLeftTangent: new THREE.Vector2(0.333, 0),
            BottomRightTangent: new THREE.Vector2(0.667, 0),
            BottomRightVertex: new THREE.Vector2(1, 0),
            LeftBottomTangent: new THREE.Vector2(0, 0.333),
            LeftBottomVertex: new THREE.Vector2(0, 0),
            LeftTopTangent: new THREE.Vector2(0, 0.667),
            RightBottomTangent: new THREE.Vector2(1, 0.333),
            RightTopTangent: new THREE.Vector2(1, 0.667),
            RightTopVertex: new THREE.Vector2(1, 1),
            TopLeftTangent: new THREE.Vector2(0.333, 1),
            TopLeftVertex: new THREE.Vector2(0, 1),
            TopRightTangent: new THREE.Vector2(0.667, 1)
        };

        this.presets = {
            // 无效果
            none: {
                intensity: 0,
            },
        };
    }

    // 渲染函数，对齐Lua中onUpdate的逻辑
    render(renderer, writeBuffer, readBuffer, deltaTime, maskActive) {
        // 设置输入纹理
        this.uniforms.tDiffuse.value = readBuffer.texture;
        
        // 获取强度参数
        const intensity = this.params.intensity.value;
        
        // 对每个控制点进行线性插值
        this.uniforms.u_BottomLeftTangent.value.lerpVectors(
            this.defaultControlPoints.BottomLeftTangent,
            this.params.BottomLeftTangent.value,
            intensity
        );
        this.uniforms.u_BottomRightTangent.value.lerpVectors(
            this.defaultControlPoints.BottomRightTangent,
            this.params.BottomRightTangent.value,
            intensity
        );
        this.uniforms.u_BottomRightVertex.value.lerpVectors(
            this.defaultControlPoints.BottomRightVertex,
            this.params.BottomRightVertex.value,
            intensity
        );
        this.uniforms.u_LeftBottomTangent.value.lerpVectors(
            this.defaultControlPoints.LeftBottomTangent,
            this.params.LeftBottomTangent.value,
            intensity
        );
        this.uniforms.u_LeftBottomVertex.value.lerpVectors(
            this.defaultControlPoints.LeftBottomVertex,
            this.params.LeftBottomVertex.value,
            intensity
        );
        this.uniforms.u_LeftTopTangent.value.lerpVectors(
            this.defaultControlPoints.LeftTopTangent,
            this.params.LeftTopTangent.value,
            intensity
        );
        this.uniforms.u_RightBottomTangent.value.lerpVectors(
            this.defaultControlPoints.RightBottomTangent,
            this.params.RightBottomTangent.value,
            intensity
        );
        this.uniforms.u_RightTopTangent.value.lerpVectors(
            this.defaultControlPoints.RightTopTangent,
            this.params.RightTopTangent.value,
            intensity
        );
        this.uniforms.u_RightTopVertex.value.lerpVectors(
            this.defaultControlPoints.RightTopVertex,
            this.params.RightTopVertex.value,
            intensity
        );
        this.uniforms.u_TopLeftTangent.value.lerpVectors(
            this.defaultControlPoints.TopLeftTangent,
            this.params.TopLeftTangent.value,
            intensity
        );
        this.uniforms.u_TopLeftVertex.value.lerpVectors(
            this.defaultControlPoints.TopLeftVertex,
            this.params.TopLeftVertex.value,
            intensity
        );
        this.uniforms.u_TopRightTangent.value.lerpVectors(
            this.defaultControlPoints.TopRightTangent,
            this.params.TopRightTangent.value,
            intensity
        );

        super.render(renderer, writeBuffer, readBuffer, deltaTime, maskActive);
    }

    _clampValue(value) {
        return Math.max(0, Math.min(1, value));
    }

    // 参数设置函数 - 根据AEInfo.json中的配置进行设定
    setBottomLeftTangent(value) {
        this.params.BottomLeftTangent.value.set(
            this._clampValue(value[0]),
            this._clampValue(value[1])
        );
    }

    setBottomRightTangent(value) {
        this.params.BottomRightTangent.value.set(
            this._clampValue(value[0]),
            this._clampValue(value[1])
        );
    }

    setBottomRightVertex(value) {
        this.params.BottomRightVertex.value.set(
            this._clampValue(value[0]),
            this._clampValue(value[1])
        );
    }

    setLeftBottomTangent(value) {
        this.params.LeftBottomTangent.value.set(
            this._clampValue(value[0]),
            this._clampValue(value[1])
        );
    }

    setLeftBottomVertex(value) {
        this.params.LeftBottomVertex.value.set(
            this._clampValue(value[0]),
            this._clampValue(value[1])
        );
    }

    setLeftTopTangent(value) {
        this.params.LeftTopTangent.value.set(
            this._clampValue(value[0]),
            this._clampValue(value[1])
        );
    }

    setRightBottomTangent(value) {
        this.params.RightBottomTangent.value.set(
            this._clampValue(value[0]),
            this._clampValue(value[1])
        );
    }

    setRightTopTangent(value) {
        this.params.RightTopTangent.value.set(
            this._clampValue(value[0]),
            this._clampValue(value[1])
        );
    }

    setRightTopVertex(value) {
        this.params.RightTopVertex.value.set(
            this._clampValue(value[0]),
            this._clampValue(value[1])
        );
    }

    setTopLeftTangent(value) {
        this.params.TopLeftTangent.value.set(
            this._clampValue(value[0]),
            this._clampValue(value[1])
        );
    }

    setTopLeftVertex(value) {
        this.params.TopLeftVertex.value.set(
            this._clampValue(value[0]),
            this._clampValue(value[1])
        );
    }

    setTopRightTangent(value) {
        this.params.TopRightTangent.value.set(
            this._clampValue(value[0]),
            this._clampValue(value[1])
        );
    }

    setIntensity(intensity) {
        this.params.intensity.value = this._clampValue(intensity);
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

/*threeJS*/ module.exports = { BezierDeformationShaderPass };
// /*Effect*/ exports.BezierDeformationShaderPass = BezierDeformationShaderPass;