/*threeJS*/ const THREE = require('three');
/*threeJS*/ const { ShaderPass } = require('three/examples/jsm/postprocessing/ShaderPass.js');

// /*Effect*/ const THREE = require('../../ThreeJS/three-amg-wrapper.js').THREE;
// /*Effect*/ const { ShaderPass } = require('../../ThreeJS/ShaderPass.js');

// 导入Shader
const vertexSource = require('./shaders/motionblur2dVert.js').source;
const fragmentSource = require('./shaders/motionblur2dFrag.js').source;

// 创建Shader
function createShader() {
    const vertexShader = vertexSource
        .replace(/attribute /g, '//attribute ')
        .replace(/a_position/g, 'position')
        .replace(/a_texcoord0/g, 'uv')
        .replace(/uv0/g, 'v_uv')
        .replace('gl_Position = vec4(a_position, 1.0);', 'gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);');

    const fragmentShader = fragmentSource
        .replace(/uv0/g, 'v_uv')
        .replace(/u_inputImageTexture/g, 'tDiffuse')
        .replace(/gl_FragData\[0\]/g, 'gl_FragColor')
        .replace(/mediump sampler2D/g, 'sampler2D')
        .replace(/mediump int/g, 'int');

    return {
        name: 'MotionBlur2DShaderPass',
        uniforms: {
            'tDiffuse': { value: null },
            'u_ScreenParams': { value: new THREE.Vector4(1920, 1080, 1.0/1920, 1.0/1080) },
            'u_skipSample': { value: 0 , type: 'i'},
            'u_rotationFloatVector': { value: [0, 0, 0, 0, 0, 0], type:  'float[]'},
            'u_positionVec2Vector': { value: [
                new THREE.Vector2(0, 0), new THREE.Vector2(0, 0), new THREE.Vector2(0, 0),
                new THREE.Vector2(0, 0), new THREE.Vector2(0, 0), new THREE.Vector2(0, 0)
            ], type: 'vec2[]'},
            'u_pivotVec2Vector': { value: [
                new THREE.Vector2(0, 0), new THREE.Vector2(0, 0), new THREE.Vector2(0, 0),
                new THREE.Vector2(0, 0), new THREE.Vector2(0, 0), new THREE.Vector2(0, 0)
            ], type: 'vec2[]'},
            'u_scaleVec2Vector': { value: [
                new THREE.Vector2(1, 1), new THREE.Vector2(1, 1), new THREE.Vector2(1, 1),
                new THREE.Vector2(1, 1), new THREE.Vector2(1, 1), new THREE.Vector2(1, 1)
            ], type: 'vec2[]'},
            'u_mirrorEdge': { value: 0.0 },
            'u_minSamples': { value: 2.0 },
            'u_maxSamples': { value: 24.0 },
            'u_dither': { value: 1.0 },
            'u_intensity': { value: 1.0 } // 添加intensity uniform
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
    };
}

// 创建MotionBlur2DShaderPass
class MotionBlur2DShaderPass extends ShaderPass {
    constructor() {
        super(createShader());

        // 参数默认值 - 对应AEInfo.json中的配置
        this.params = {
            rotate: 0,                                    // 旋转角度
            anchor: new THREE.Vector2(0.5, 0.5),         // 锚点位置
            position: new THREE.Vector2(0.5, 0.5),       // 位置坐标
            unifiedScale: false,                          // 统一缩放标志
            scale_x: 1.0,                                 // X轴缩放
            scale_y: 1.0,                                 // Y轴缩放
            vIntensity: 0.5,                              // 运动模糊强度
            vCenter: -0.25,                               // 模糊中心
            minSamples: 0.12,                             // 最小采样次数
            maxSamples: 0.24,                             // 最大采样次数
            mirrorEdge: false,                            // 镜像边缘
            dither: 1.0,                                  // 抖动强度
            intensity: 1.0                                // 添加intensity参数
        };

        // 前一帧参数（用于运动轨迹计算）
        this.prevParams = {
            rotate: 0,
            anchor: new THREE.Vector2(0, 0),
            position: new THREE.Vector2(0, 0),
            scale_x: 1.0,
            scale_y: 1.0
        };

        // 内部常量
        this.constants = {
            KEYFRAME_COUNT: 6,
            POINT_SIZE: 5,
            MIN_SCALE_VALUE: 0.001,
            SAMPLES_MULTIPLIER: 100,
            SKIP_THRESHOLD: 0.001,
            COORDINATE_OFFSET: 0.5,
        };

        this.presets = {
            // 无效果
            none: {
                intensity: 0,
            },
            
            // 低等旋转模糊
            rotate_low: {
                intensity: 1.0,
                rotate: 45,
                minSamples: 0.12,
                maxSamples: 0.24,
                vIntensity: 0.09,
                vCenter: -0.7,
                dither: 1.0,
                mirrorEdge: true,
            },

            // 高等旋转模糊
            rotate_high: {
                intensity: 1.0,
                rotate: 180,
                minSamples: 0.12,
                maxSamples: 0.24,
                vIntensity: 0.5,
                vCenter: -0.25,
                dither: 1.0,
                mirrorEdge: true,
            },
        };
    }

    // 渲染函数
    render(renderer, writeBuffer, readBuffer, deltaTime, maskActive) {
        const textureWidth = readBuffer.width;
        const textureHeight = readBuffer.height;
        
        // 更新屏幕参数
        this.uniforms.u_ScreenParams.value.set(
            textureWidth, 
            textureHeight, 
            1.0 / textureWidth, 
            1.0 / textureHeight
        );
        
        this.uniforms.tDiffuse.value = readBuffer.texture;
        
        // 生成关键帧数据
        this.updateKeyframes();
        
        // 更新采样参数
        this.uniforms.u_minSamples.value = this.convertSamples(this.params.minSamples);
        this.uniforms.u_maxSamples.value = this.convertSamples(this.params.maxSamples);
        this.uniforms.u_dither.value = this.params.dither;
        this.uniforms.u_mirrorEdge.value = this.params.mirrorEdge ? 1.0 : 0.0;
        this.uniforms.u_intensity.value = this.params.intensity; // 传递intensity值
        
        // 优化处理：强度过小时跳过采样
        if (Math.abs(this.params.vIntensity * this.params.intensity) < this.constants.SKIP_THRESHOLD) {
            this.uniforms.u_skipSample.value = 1;
        } else {
            this.uniforms.u_skipSample.value = 0;
        }

        super.render(renderer, writeBuffer, readBuffer, deltaTime, maskActive);
    }

    // 生成关键帧数据
    updateKeyframes() {
        const keyframes = this.generateKeyframes(
            this.prevParams, 
            this.getCurrentParams(), 
            this.params.vIntensity, 
            this.params.vCenter
        );
        
        // 更新uniform数组
        for (let i = 0; i < this.constants.KEYFRAME_COUNT; i++) {
            if (i < keyframes.length) {
                this.uniforms.u_rotationFloatVector.value[i] = keyframes[i].rotation;
                this.uniforms.u_positionVec2Vector.value[i].copy(keyframes[i].position);
                this.uniforms.u_pivotVec2Vector.value[i].copy(keyframes[i].pivot);
                this.uniforms.u_scaleVec2Vector.value[i].copy(keyframes[i].scale);
            }
        }
    }

    // 关键帧生成算法
    generateKeyframes(prevParams, currParams, intensity, center) {
        const keyframes = [];
        
        for (let i = 0; i <= this.constants.POINT_SIZE; i++) {
            const w = intensity * (i / this.constants.POINT_SIZE) + center + 1.0;
            
            // 插值计算
            const pivot = new THREE.Vector2(
                prevParams.anchor.x * (1.0 - w) + currParams.anchor.x * w,
                prevParams.anchor.y * (1.0 - w) + currParams.anchor.y * w
            );
            
            const position = new THREE.Vector2(
                prevParams.position.x * (1.0 - w) + currParams.position.x * w,
                prevParams.position.y * (1.0 - w) + currParams.position.y * w
            );
            
            const scale = new THREE.Vector2(
                prevParams.scale_x * (1.0 - w) + currParams.scale_x * w,
                prevParams.scale_y * (1.0 - w) + currParams.scale_y * w
            );
            
            if (this.params.unifiedScale) {
                scale.y = scale.x;
            }
            
            const rotation = prevParams.rotate * (1.0 - w) + currParams.rotate * w;
            
            keyframes.push({ pivot, position, scale, rotation });
        }
        
        return keyframes;
    }

    // 获取当前参数（转换坐标系）
    getCurrentParams() {
        return {
            rotate: this.params.rotate,
            anchor: this.convertCoordinates(this.params.anchor),
            position: this.convertCoordinates(this.params.position),
            scale_x: this.protectScale(this.params.scale_x),
            scale_y: this.protectScale(this.params.scale_y)
        };
    }

    // 坐标转换函数
    convertCoordinates(value) {
        return new THREE.Vector2(
            value.x - this.constants.COORDINATE_OFFSET,
            value.y - this.constants.COORDINATE_OFFSET
        );
    }

    // 缩放保护函数
    protectScale(value) {
        return Math.abs(value) < this.constants.MIN_SCALE_VALUE ? this.constants.MIN_SCALE_VALUE : value;
    }

    // 采样数转换
    convertSamples(value) {
        return Math.floor(value * this.constants.SAMPLES_MULTIPLIER);
    }

    // 参数设置函数
    setRotate(value) {
        this.params.rotate = value;
    }

    setAnchor(x, y) {
        this.params.anchor.set(
            Math.max(0, Math.min(1, x)),
            Math.max(0, Math.min(1, y))
        );
    }

    setPosition(x, y) {
        this.params.position.set(
            Math.max(0, Math.min(1, x)),
            Math.max(0, Math.min(1, y))
        );
    }

    setUnifiedScale(value) {
        this.params.unifiedScale = value;
    }

    setScaleX(value) {
        this.params.scale_x = Math.max(-10, Math.min(10, value));
    }

    setScaleY(value) {
        this.params.scale_y = Math.max(-10, Math.min(10, value));
    }

    setVIntensity(value) {
        this.params.vIntensity = Math.max(0, Math.min(2, value));
    }

    setVCenter(value) {
        this.params.vCenter = Math.max(-1, Math.min(1, value));
    }

    setMinSamples(value) {
        this.params.minSamples = Math.max(0.02, Math.min(2.56, value));
    }

    setMaxSamples(value) {
        this.params.maxSamples = Math.max(0.02, Math.min(2.56, value));
    }

    setMirrorEdge(value) {
        this.params.mirrorEdge = value;
    }

    setDither(value) {
        this.params.dither = Math.max(0, Math.min(1, value));
    }

    // 设置强度
    setIntensity(value) {
        this.params.intensity = Math.max(0, Math.min(1, value));
    }

    setDither(value) {
        this.params.dither = Math.max(0, Math.min(1, value));
    }

    // 重置为默认值
    resetToDefaults() {
        this.params.rotate = 0;
        this.params.anchor.set(0.5, 0.5);
        this.params.position.set(0.5, 0.5);
        this.params.unifiedScale = false;
        this.params.scale_x = 1.0;
        this.params.scale_y = 1.0;
        this.params.vIntensity = 0.5;
        this.params.vCenter = -0.25;
        this.params.minSamples = 0.12;
        this.params.maxSamples = 0.24;
        this.params.mirrorEdge = false;
        this.params.dither = 1.0;
        this.params.intensity = 1.0; // 重置intensity

        this.prevParams.rotate = 0;
        this.prevParams.anchor.set(0, 0);
        this.prevParams.position.set(0, 0);
        this.prevParams.scale_x = 1.0;
        this.prevParams.scale_y = 1.0;
    }

    // 获取当前参数值
    getParams() {
        return {
            rotate: this.params.rotate,
            anchor: this.params.anchor.clone(),
            position: this.params.position.clone(),
            unifiedScale: this.params.unifiedScale,
            scale_x: this.params.scale_x,
            scale_y: this.params.scale_y,
            vIntensity: this.params.vIntensity,
            vCenter: this.params.vCenter,
            minSamples: this.params.minSamples,
            maxSamples: this.params.maxSamples,
            mirrorEdge: this.params.mirrorEdge,
            dither: this.params.dither,
            intensity: this.params.intensity // 添加intensity到返回值
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

/*threeJS*/ module.exports = { MotionBlur2DShaderPass };
// /*Effect*/ exports.MotionBlur2DShaderPass = MotionBlur2DShaderPass;
