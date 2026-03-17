/**
 * DirectionalBlurPass - 简化版方向模糊处理Pass
 * 专注于核心DirectionalBlurs功能，兼容EffectComposer
 */

/*threeJS*/ const THREE = require('three');
/*threeJS*/ const { ShaderPass } = require('three/examples/jsm/postprocessing/ShaderPass.js');

// /*Effect*/ const THREE = require('../../ThreeJS/three-amg-wrapper.js').THREE;
// /*Effect*/ const { ShaderPass } = require('../../ThreeJS/ShaderPass.js');

// 导入着色器文件内容
const directionalBlurVertSource = require('./shaders/directionalBlurVert.js').source;
const directionalBlurFragSource = require('./shaders/directionalBlurFrag.js').source;

/**
 * 创建方向模糊着色器
 * @returns {Object} 着色器对象
 */
function createDirectionalBlurShader() {
    // 适配Three.js标准的vertex shader
    const vertexShader = directionalBlurVertSource
        .replace(/attribute /g, '//attribute ')
        .replace(/a_position/g, 'position')
        .replace(/a_texcoord0/g, 'uv')
        .replace('sign(vec4(position, 0.0, 1.0))', 'projectionMatrix * modelViewMatrix * vec4(position, 1.0)');
    
    // 适配fragment shader
    const fragmentShader = directionalBlurFragSource
        .replace(/u_inputTexture/g, 'tDiffuse')
        .replace(/gl_FragData\[0\]/g, 'gl_FragColor');
    
    return {
        name: 'DirectionalBlursShaderPass',
        uniforms: {
            'tDiffuse': { value: null },
            'u_ScreenParams': { value: new THREE.Vector4(1, 1, 1, 1) },
            'u_sample': { value: 0.0 },
            'u_sigma': { value: 1.0 },
            'u_spaceDither': { value: 0.0 },
            'u_stepX': { value: 0.0 },
            'u_stepY': { value: 0.0 },
            'u_borderType': { value: 0 },
            'u_directionNum': { value: 1 },
            'u_exposure': { value: 1.0 }
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader
    };
}

/**
 * 方向模糊Pass类
 */
class DirectionalBlurPass extends ShaderPass {
    constructor() {
        super(createDirectionalBlurShader());
        
        // 默认参数
        this.blurDirection = new THREE.Vector2(1, 0);
        this.blurRadius = 10.0;
        this.samples = 32;
        this.sigma = 3.0;
        this.spaceDither = 0.0;
        this.borderType = 'Normal';
        this.exposure = 1.0;
    }
    
    setBlurDirection(direction) {
        if (typeof direction === 'number') {
            this.blurDirection.set(Math.cos(direction), Math.sin(direction));
        } else {
            this.blurDirection.copy(direction).normalize();
        }
    }
    
    setBlurRadius(radius) {
        this.blurRadius = Math.max(0, radius);
    }
    
    setSamples(samples) {
        this.samples = Math.max(1, Math.min(64, samples));
    }
    
    setSigma(sigma) {
        this.sigma = Math.max(0.1, sigma);
    }
    
    setSpaceDither(spaceDither) {
        this.spaceDither = Math.max(0, Math.min(1, spaceDither));
    }
    
    setBorderType(borderType) {
        this.borderType = borderType;
    }
    
    setExposure(exposure) {
        this.exposure = Math.max(0, exposure);
    }
    
    getBorderTypeValue() {
        const borderTypeMap = { 'Normal': 0, 'Black': 1, 'Mirror': 2 };
        return borderTypeMap[this.borderType] || 0;
    }
    
    render(renderer, writeBuffer, readBuffer, deltaTime, maskActive) {
        const textureWidth = readBuffer.width;
        const textureHeight = readBuffer.height;
        
        // 计算步长
        const normalizedRadius = this.blurRadius / 1000.0;
        const stepLength = normalizedRadius / Math.max(this.samples, 1e-5);
        const stepX = stepLength * this.blurDirection.x;
        const stepY = stepLength * this.blurDirection.y;
        
        // 更新uniforms
        this.material.uniforms.u_ScreenParams.value.set(textureWidth, textureHeight, 1.0/textureWidth, 1.0/textureHeight);
        this.material.uniforms.u_sample.value = this.samples;
        this.material.uniforms.u_sigma.value = this.sigma;
        this.material.uniforms.u_spaceDither.value = this.spaceDither;
        this.material.uniforms.u_stepX.value = stepX;
        this.material.uniforms.u_stepY.value = stepY;
        this.material.uniforms.u_borderType.value = this.getBorderTypeValue();
        this.material.uniforms.u_exposure.value = this.exposure;
        this.material.uniforms.tDiffuse.value = readBuffer.texture;

        super.render(renderer, writeBuffer, readBuffer, deltaTime, maskActive);
    }
}

/*threeJS*/ module.exports = { DirectionalBlurPass };
// /*Effect*/ exports.DirectionalBlurPass = DirectionalBlurPass;
