/*threeJS*/ const THREE = require('three');
/*threeJS*/ const { ShaderPass } = require('three/examples/jsm/postprocessing/ShaderPass.js');

// /*Effect*/ const THREE = require('../../ThreeJS/three-amg-wrapper.js').THREE;
// /*Effect*/ const { ShaderPass } = require('../../ThreeJS/ShaderPass.js');

// 导入Shader
const vertexSource = require('./shaders/cornerpinVert.js').source;
const fragmentSource = require('./shaders/cornerpinFrag.js').source;

// 创建Shader
function createShader() {
    // 适配three.js的shader代码
    const vertexShader = vertexSource
        .replace(/attribute /g, '//attribute ')
        .replace(/a_position/g, 'position')
        .replace(/a_texcoord0/g, 'uv')
        .replace(/v_uv/g, 'vUv')
        .replace('gl_Position = vec4(a_position, 1.0);', 'gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);');

    const fragmentShader = fragmentSource
        .replace(/v_uv/g, 'vUv')
        .replace(/u_InputTex/g, 'tDiffuse')
        .replace(/gl_FragData\[0\]/g, 'gl_FragColor');

    return {
        name: 'CornerPinShaderPass',
        uniforms: {
            'tDiffuse': { value: null },
            'u_downLeftVertex': { value: new THREE.Vector2(0.0, 0.0) },
            'u_downRightVertex': { value: new THREE.Vector2(1.0, 0.0) },
            'u_upRightVertex': { value: new THREE.Vector2(1.0, 1.0) },
            'u_upLeftVertex': { value: new THREE.Vector2(0.0, 1.0) },
            'u_motionTileType': { value: 0 },
            'u_intensity': { value: 1.0 }  // 添加intensity uniform
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
    };
}

// 创建CornerPinShaderPass
class CornerPinShaderPass extends ShaderPass {
    constructor() {
        super(createShader());

        // 参数默认值 - 对应AEInfo.json中的配置
        this.params = {
            leftUpVertex: new THREE.Vector2(0.0, 1.0),
            rightUpVertex: new THREE.Vector2(1.0, 1.0),
            leftDownVertex: new THREE.Vector2(0.0, 0.0),
            rightDownVertex: new THREE.Vector2(1.0, 0.0),
            motionTileType: 0,  // 0: Normal, 1: Mirror, 2: Stretch
            intensity: 1.0      // 添加intensity参数
        };

        // 内部常量
        this.constants = {
            // 默认顶点位置（单位正方形）
            DEFAULT_LEFT_UP_VERTEX: [0.0, 1.0],
            DEFAULT_RIGHT_UP_VERTEX: [1.0, 1.0],
            DEFAULT_LEFT_DOWN_VERTEX: [0.0, 0.0],
            DEFAULT_RIGHT_DOWN_VERTEX: [1.0, 0.0],
            
            // 边缘处理模式
            MOTION_TILE_NORMAL: 0,
            MOTION_TILE_MIRROR: 1,
            MOTION_TILE_STRETCH: 2,
            
            // 边缘处理模式映射
            MOTION_TILE_TYPES: {
                'Normal': 0,
                'Mirror': 1,
                'Stretch': 2
            }
        };

        // LumiCornerPin 预设配置
        this.presets = {
            // 无效果
            none: {
                intensity: 0,
            },
            
            // 分块透视效果 - 类似九宫格
            blocks: {
                intensity: 1.0,
                leftUpVertex: [0.3, 0.7],
                rightUpVertex: [0.7, 0.7],
                leftDownVertex: [0.3, 0.3],
                rightDownVertex: [0.7, 0.3],
                motionTileType: 2,
            },
            
            // 倾斜透视效果 - 3D倾斜感
            tilt: {
                intensity: 1.0,
                leftUpVertex: [0.3, 0.7],
                rightUpVertex: [0.7, 0.7],
                leftDownVertex: [0.0, 0.0],
                rightDownVertex: [1.0, 0.0],
                motionTileType: 2,
            }
        };

    }

    // 渲染函数，对齐Lua中onUpdate的逻辑
    render(renderer, writeBuffer, readBuffer, deltaTime, maskActive) {
        const textureWidth = readBuffer.width;
        const textureHeight = readBuffer.height;
        
        // 设置输入纹理
        this.uniforms.tDiffuse.value = readBuffer.texture;
        
        // 传递顶点坐标到Shader（对应Lua中的参数映射）
        this.uniforms.u_downLeftVertex.value.copy(this.params.leftDownVertex);
        this.uniforms.u_downRightVertex.value.copy(this.params.rightDownVertex);
        this.uniforms.u_upLeftVertex.value.copy(this.params.leftUpVertex);
        this.uniforms.u_upRightVertex.value.copy(this.params.rightUpVertex);
        
        // 传递边缘处理类型
        this.uniforms.u_motionTileType.value = this.params.motionTileType;
        
        // 传递强度参数
        this.uniforms.u_intensity.value = this.params.intensity;

        super.render(renderer, writeBuffer, readBuffer, deltaTime, maskActive);
    }

    // 参数验证函数
    _clampVertex(vertex) {
        // CornerPin允许顶点超出[0,1]范围，所以这里不做限制
        return vertex;
    }

    _validateMotionTileType(type) {
        return Math.max(0, Math.min(2, Math.floor(type)));
    }

    // 设置左上角顶点
    setLeftUpVertex(value) {
        // 支持通过数组设置 [x, y]
        if (Array.isArray(value)) {
            this.params.leftUpVertex.set(value[0], value[1]);
        } else {
            this.params.leftUpVertex.set(value.x, value.y);
        }
    }

    // 设置右上角顶点
    setRightUpVertex(value) {
        // 支持通过数组设置 [x, y]
        if (Array.isArray(value)) {
            this.params.rightUpVertex.set(value[0], value[1]);
        } else {
            this.params.rightUpVertex.set(value.x, value.y);
        }
    }

    // 设置左下角顶点
    setLeftDownVertex(value) {
        // 支持通过数组设置 [x, y]
        if (Array.isArray(value)) {
            this.params.leftDownVertex.set(value[0], value[1]);
        } else {
            this.params.leftDownVertex.set(value.x, value.y);
        }
    }

    // 设置右下角顶点
    setRightDownVertex(value) {
        // 支持通过数组设置 [x, y]
        if (Array.isArray(value)) {
            this.params.rightDownVertex.set(value[0], value[1]);
        } else {
            this.params.rightDownVertex.set(value.x, value.y);
        }
    }

    // 设置边缘处理类型
    setMotionTileType(type) {
        if (typeof type === 'string') {
            this.params.motionTileType = this.constants.MOTION_TILE_TYPES[type] || 0;
        } else {
            this.params.motionTileType = this._validateMotionTileType(type);
        }
    }

    // 设置所有四个顶点
    setVertices(leftUp, rightUp, leftDown, rightDown) {
        this.setLeftUpVertex(leftUp.x, leftUp.y);
        this.setRightUpVertex(rightUp.x, rightUp.y);
        this.setLeftDownVertex(leftDown.x, leftDown.y);
        this.setRightDownVertex(rightDown.x, rightDown.y);
    }

    // 重置为默认值
    reset() {
        this.setLeftUpVertex(...this.constants.DEFAULT_LEFT_UP_VERTEX);
        this.setRightUpVertex(...this.constants.DEFAULT_RIGHT_UP_VERTEX);
        this.setLeftDownVertex(...this.constants.DEFAULT_LEFT_DOWN_VERTEX);
        this.setRightDownVertex(...this.constants.DEFAULT_RIGHT_DOWN_VERTEX);
        this.setMotionTileType(this.constants.MOTION_TILE_NORMAL);
    }

    // 获取当前参数值
    getParams() {
        return {
            leftUpVertex: this.params.leftUpVertex.clone(),
            rightUpVertex: this.params.rightUpVertex.clone(),
            leftDownVertex: this.params.leftDownVertex.clone(),
            rightDownVertex: this.params.rightDownVertex.clone(),
            motionTileType: this.params.motionTileType
        };
    }

    // 应用透视校正预设
    setPerspectiveCorrection(topWidth = 0.8, bottomWidth = 1.0, height = 1.0) {
        const topOffset = (1.0 - topWidth) / 2.0;
        const bottomOffset = (1.0 - bottomWidth) / 2.0;
        
        this.setLeftUpVertex(topOffset, height);
        this.setRightUpVertex(1.0 - topOffset, height);
        this.setLeftDownVertex(bottomOffset, 0.0);
        this.setRightDownVertex(1.0 - bottomOffset, 0.0);
    }

    // 应用梯形变换预设
    setTrapezoidTransform(angle = 15) {
        const radians = (angle * Math.PI) / 180;
        const offset = Math.tan(radians) * 0.5;
        
        this.setLeftUpVertex(-offset, 1.0);
        this.setRightUpVertex(1.0 + offset, 1.0);
        this.setLeftDownVertex(0.0, 0.0);
        this.setRightDownVertex(1.0, 0.0);
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

    // 设置强度参数
    setIntensity(value) {
        this.params.intensity = value;
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

/*threeJS*/ module.exports = { CornerPinShaderPass };
// /*Effect*/ exports.CornerPinShaderPass = CornerPinShaderPass;
