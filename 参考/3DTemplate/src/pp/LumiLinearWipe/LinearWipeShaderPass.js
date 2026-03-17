/*threeJS*/ const THREE = require('three');
/*threeJS*/ const { ShaderPass } = require('three/examples/jsm/postprocessing/ShaderPass.js');

// /*Effect*/ const THREE = require('../../ThreeJS/three-amg-wrapper.js').THREE;
// /*Effect*/ const { ShaderPass } = require('../../ThreeJS/ShaderPass.js');

// 导入着色器文件
const shaderVertSource = require('./shaders/shaderVert.js').source;
const shaderFragSource = require('./shaders/shaderFrag.js').source;

function createShader() {
    const vertexShader = shaderVertSource;
    const fragmentShader = shaderFragSource.replace(/texture1/g, 'tDiffuse');

    return {
        name: 'LinearWipeShaderPass',
        uniforms: {
            'tDiffuse': { value: null },
            'progress': { value: 0.1 },
            'ratio': { value: 1.0 },
            'rotation': { value: 0.0 },
            'feather': { value: 0.05 },
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        transparent: true,
        side: THREE.DoubleSide
    };
}

/**
 * LinearWipeShaderPass类
 * 继承自Three.js的ShaderPass，提供LinearWipe效果
 */
class LinearWipeShaderPass extends ShaderPass {
  constructor() {
    super(createShader());
    
    // 设置默认参数
    this.intensity = 0.0;
    this.rotation = 0.0;
    this.feather = 0.05;

    this.presets = {
      // 无效果
      none: {
          intensity: 0,
      },

      // 从下到上擦除
      down2up: {
          intensity: 1.0,
          rotation: 0,
      },
      
      // 从左到右擦除
      left2right: {
          intensity: 1.0,
          rotation: 90,
      },
      
      // 从上到下擦除
      up2down: {
          intensity: 1.0,
          rotation: 180,
      },

      // 从右到左擦除
      right2left: {
          intensity: 1.0,
          rotation: 270,
      },
      
      // 从左下到右上擦除
      downleft2upright: {
          intensity: 1.0,
          rotation: 45,
      },
      
      // 从右下到左上擦除
      downright2upleft: {
          intensity: 1.0,
          rotation: 135,
      },
      
      // 从右上到左下擦除
      upright2downleft: {
          intensity: 1.0,
          rotation: 225,
      },
      
      // 从左上到右下擦除
      upleft2downright: {
          intensity: 1.0,
          rotation: 315,
      },
    };
  }
  
  /**
   * 限制参数值在指定范围内
   * @param {number} value - 输入值
   * @param {number} min - 最小值
   * @param {number} max - 最大值
   * @returns {number} 限制后的值
   */
  _clampValue(value, min = 0, max = 1) {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * 设置强度
   * @param {number} intensity - 强度
   */
  setIntensity(intensity) {
    this.intensity = this._clampValue(intensity);
  }

  /**
   * 设置旋转角度（角度）
   * @param {number} rotation - 旋转角度（角度）
   */
  setRotation(rotation) {
    this.rotation = THREE.MathUtils.degToRad(this._clampValue(rotation, 0, 360));
  }
  /**
   * 设置羽化程度，控制边缘柔和度
   * @param {number} feather - 羽化程度，控制边缘柔和度
   */
  setFeather(feather) {
    this.feather = this._clampValue(feather);
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
    this.material.uniforms.progress.value = this.intensity;
    this.material.uniforms.rotation.value = this.rotation;
    this.material.uniforms.feather.value = this.feather * this.intensity;
    super.render(renderer, writeBuffer, readBuffer, delta, maskActive);
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

/*threeJS*/ module.exports = { LinearWipeShaderPass };
// /*Effect*/ exports.LinearWipeShaderPass = LinearWipeShaderPass;
