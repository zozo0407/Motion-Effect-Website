/**
 * 方向模糊后处理着色器Pass
 * 基于LumiDirectionalBlurs的原始着色器
 */

/*threeJS*/ const THREE = require('three');
/*threeJS*/ const { ShaderPass } = require('three/examples/jsm/postprocessing/ShaderPass.js');

// /*Effect*/ const THREE = require('../../ThreeJS/three-amg-wrapper.js').THREE;
// /*Effect*/ const { ShaderPass } = require('../../ThreeJS/ShaderPass.js');

// 导入着色器文件
const directionBlurVert = require('./shaders/c364479b70ba275cac850a7d98add02bVert.js').source;
const directionBlurFrag = require('./shaders/c364479b70ba275cac850a7d98add02bFrag.js').source;

/**
 * 创建方向模糊着色器
 * @returns {Object} 着色器对象
 */
function createShader() {
  // 使用Three.js标准的vertex shader
  const vertexShader = directionBlurVert
    .replace(/attribute /g, '//attribute ')
    .replace(/a_position/g, 'position')
    .replace(/a_texcoord0/g, 'uv')
    .replace('sign(vec4(position, 0.0, 1.0))', 'projectionMatrix * modelViewMatrix * vec4(position, 1.0)');
  
  // 适配fragment shader
  let fragmentShader = directionBlurFrag
    .replace(/u_InputTexture/g, 'tDiffuse')
    .replace(/gl_FragData\[0\]/g, 'gl_FragColor');
  
  return {
    name: 'DirectionBlurShaderPass',
    uniforms: {
      'tDiffuse': { value: null },
      'u_ScreenParams': { value: new THREE.Vector4(1, 1, 1, 1) },
      'u_Sample': { value: 0.0 },
      'u_Angle': { value: 0.0 },
      'u_Steps': { value: 1.0 },
      'u_ExpandFlag': { value: 0.0 },
      'u_mirrorEdge': { value: 0.0 }
    },
    vertexShader: vertexShader,
    fragmentShader: fragmentShader
  };
}

/**
 * 方向模糊ShaderPass类
 * 继承自Three.js的ShaderPass，提供方向性模糊效果
 */
class DirectionBlurShaderPass extends ShaderPass {
  constructor() {
    super(createShader());
    
    // 设置默认参数 - 确保模糊效果可见
    this.angle = 0.0
    this.intensity = 1.0
    this.steps = 1.0
    this.expandFlag = false
    this.mirrorEdge = false

    // 初始化时设置一次默认参数
    this.setIntensity(this.intensity)
    this.setAngle(this.angle)
    this.setSteps(this.steps)
    this.setExpandFlag(this.expandFlag)
    this.setMirrorEdge(this.mirrorEdge)
  }

  _clampValue(value, min = 0, max = 1) {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * 设置模糊强度
   * @param {number} intensity - 模糊强度
   */
  setIntensity(intensity) {
    this.intensity = this._clampValue(intensity);
    this.material.uniforms.u_Sample.value = intensity * 100;
  }

  /**
   * 设置角度
   * @param {number} angle - 角度
   */
  setAngle(angle) {
    this.angle = angle;
    this.material.uniforms.u_Angle.value = 90 - angle;
  }

  /**
   * 设置步数
   * @param {number} steps - 步数
   */
  setSteps(steps) {
    this.steps = steps;
    this.material.uniforms.u_Steps.value = Math.max(0, Math.min(100, steps));
  }

  /**
   * 设置扩展标志
   * @param {boolean} expandFlag - 扩展标志
   */
  setExpandFlag(expandFlag) {
    this.expandFlag = expandFlag;
    this.material.uniforms.u_ExpandFlag.value = expandFlag ? 1.0 : 0.0;
  }

  /**
   * 设置边缘镜像
   * @param {boolean} mirrorEdge - 边缘镜像
   */
  setMirrorEdge(mirrorEdge) {
    this.mirrorEdge = mirrorEdge;
    this.material.uniforms.u_mirrorEdge.value = mirrorEdge ? 1.0 : 0.0;
  }

  /**
   * 渲染
   * @param {WebGLRenderer} renderer - WebGL渲染器
   * @param {WebGLRenderTarget} writeBuffer - 写入缓冲区
   * @param {WebGLRenderTarget} readBuffer - 读取缓冲区
   * @param {number} delta - 时间增量
   * @param {boolean} maskActive - 掩码是否激活
   */
  render(renderer, writeBuffer, readBuffer, delta, maskActive) {
    super.render(renderer, writeBuffer, readBuffer, delta, maskActive)
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

}

/*threeJS*/ module.exports = { DirectionBlurShaderPass }; 
// /*Effect*/ exports.DirectionBlurShaderPass = DirectionBlurShaderPass;
