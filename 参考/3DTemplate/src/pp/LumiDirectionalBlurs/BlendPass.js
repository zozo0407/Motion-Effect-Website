/**
 * BlendPass - 简化版混合处理Pass
 * 用于将多个方向的模糊结果与原图混合
 */

/*threeJS*/ const THREE = require('three');
/*threeJS*/ const { ShaderPass } = require('three/examples/jsm/postprocessing/ShaderPass.js');

// /*Effect*/ const THREE = require('../../ThreeJS/three-amg-wrapper.js').THREE;
// /*Effect*/ const { ShaderPass } = require('../../ThreeJS/ShaderPass.js');

// 导入着色器文件内容
const blendVertSource = require('./shaders/blendVert.js').source;
const blendFragSource = require('./shaders/blendFrag.js').source;

/**
 * 创建混合着色器
 * @returns {Object} 着色器对象
 */
function createBlendShader() {
    // 适配Three.js标准的vertex shader
    const vertexShader = blendVertSource
        .replace(/attribute /g, '//attribute ')
        .replace(/a_position/g, 'position')
        .replace(/a_texcoord0/g, 'uv')
        .replace('sign(vec4(position, 0.0, 1.0))', 'projectionMatrix * modelViewMatrix * vec4(position, 1.0)');

    const fragmentShader = blendFragSource
        .replace(/gl_FragData\[0\]/g, 'gl_FragColor');
    
    return {
        name: 'DirectionalBlursBlendShaderPass',
        uniforms: {
            'u_blendMode': { value: 2 }, // 默认Mean模式
            'u_tex1': { value: null },
            'u_tex2': { value: null },
            'u_tex3': { value: null },
            'u_tex4': { value: null },
            'u_directionNum': { value: 1 },
            'u_exposure': { value: 1.0 }
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader
    };
}
/**
 * 混合Pass类
 */
class BlendPass extends ShaderPass {
    constructor() {
        super(createBlendShader());
        
        // 默认参数
        this.blendMode = 'Screen';
        this.directionNum = 1;
        this.exposure = 1.0;
        
        // 纹理引用
        this.blurTextures = [null, null, null, null];

        this.constants = {
            DirectionNumLimit: 4,
        }
    }
    
    setBlurTexture(index, texture) {
        if (index >= 0 && index < this.constants.DirectionNumLimit) {
            this.blurTextures[index] = texture;
        }
    }
    
    setBlendMode(blendMode) {
        this.blendMode = blendMode;
    }
    
    setDirectionNum(directionNum) {
        this.directionNum = Math.max(1, Math.min(4, directionNum));
    }
    
    setExposure(exposure) {
        this.exposure = Math.max(0, exposure);
    }
    
    getBlendModeValue() {
        const blendModeMap = { 'Screen': 0, 'Add': 1, 'Mean': 2 };
        return blendModeMap[this.blendMode] || 0;
    }
    
    render(renderer, writeBuffer, readBuffer, deltaTime, maskActive) {
        // 更新uniforms
        for (let index = 0; index < this.constants.DirectionNumLimit; index++) {
            const uniformName = `u_tex${index + 1}`;
            this.material.uniforms[uniformName].value = this.blurTextures[index];
        }
        
        this.material.uniforms.u_blendMode.value = this.getBlendModeValue();
        this.material.uniforms.u_directionNum.value = this.directionNum;
        this.material.uniforms.u_exposure.value = this.exposure;
        
        super.render(renderer, writeBuffer, readBuffer, deltaTime, maskActive);
    }
}

/*threeJS*/ module.exports = { BlendPass};
// /*Effect*/ exports.BlendPass = BlendPass;
