/*threeJS*/ const THREE = require('three');
/*threeJS*/ const { ShaderPass } = require('three/examples/jsm/postprocessing/ShaderPass.js');

// /*Effect*/ const THREE = require('../../ThreeJS/three-amg-wrapper.js').THREE;
// /*Effect*/ const { ShaderPass } = require('../../ThreeJS/ShaderPass.js');

// 导入Shader源码
const vertexShaderY = require('./shaders/gaussianBlurYVert.js').source;
const fragmentShaderY = require('./shaders/gaussianBlurYFrag.js').source;

// 创建Y方向Shader
function createShaderY() {
    const vertexShader = vertexShaderY
        .replace(/attribute /g, '//attribute ')
        .replace(/a_position/g, 'position')
        .replace(/a_texcoord0/g, 'uv')
        .replace(/uv0/g, 'v_uv')
        .replace('sign(vec4(position, 0.0, 1.0))', 'projectionMatrix * modelViewMatrix * vec4(position, 1.0)');

    const fragmentShader = fragmentShaderY
        .replace(/uv0/g, 'v_uv')
        .replace(/u_inputTexture/g, 'tDiffuse')
        .replace(/gl_FragData\[0\]/g, 'gl_FragColor');

    return {
        name: 'GaussianBlurPassV',
        uniforms: {
            'tDiffuse': { value: null },
            'u_sampleY': { value: 10.0 },
            'u_sigmaY': { value: 1.0 },
            'u_stepX': { value: 0.001 },
            'u_stepY': { value: 0.001 },
            'u_gamma': { value: 2.2 },
            'u_spaceDither': { value: 0.0 },
            'u_borderType': { value: 0 },
            'u_inverseGammaCorrection': { value: 1 },
            'u_blurAlpha': { value: 1 },
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
    };
}

/**
 * Y方向高斯模糊ShaderPass类
 */
class GaussianBlurPassV extends ShaderPass {
    /**
     * 构造函数
     */
    constructor() {
        super(createShaderY());
    }
}

/*threeJS*/ module.exports = { GaussianBlurPassV };
// /*Effect*/ exports.GaussianBlurPassV = GaussianBlurPassV;
