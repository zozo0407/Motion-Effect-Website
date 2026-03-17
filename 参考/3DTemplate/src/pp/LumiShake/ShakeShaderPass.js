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
        name: 'ShakeShaderPass',
        uniforms: {
            'tDiffuse': { value: null },
            'progress': { value: 0.1 },
            'ratio': { value: 1.0 },
            'shakeIntensity': { value: 0.02 },
            'shakeFrequency': { value: 10.0 },
            'shakeDirection': { value: new THREE.Vector2(1.0, 1.0) },
            'shakeSpeed': { value: 1.0 },
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        transparent: true,
        side: THREE.DoubleSide
    };
}

/**
 * ShakeShaderPass类
 * 继承自Three.js的ShaderPass，提供shake效果
 */
class ShakeShaderPass extends ShaderPass {
  constructor() {
    super(createShader());
    
    // 设置默认参数
    this.progress = 0.1;
    this.intensity = 0.02;
    this.shakeFrequency = 10.0;
    this.shakeDirection = new THREE.Vector2(1.0, 1.0);
    this.shakeSpeed = 1.0;

    this.presets = {
        // 无效果
        none: {
            intensity: 0,
        },

        // 轻微抖动
        low: {
            intensity: 1.0,
            shakeFrequency: 5.0,
            shakeDirection: [1.0, 1.0],
            shakeSpeed: 1.0
        },
        
        // 中等抖动
        medium: {
            intensity: 1.0,
            shakeFrequency: 10.0,
            shakeDirection: [1.0, 1.0],
            shakeSpeed: 1.0
        },
        
        // 强烈抖动
        high: {
            intensity: 1.0,
            shakeFrequency: 20.0,
            shakeDirection: [1.0, 1.0],
            shakeSpeed: 1.0
        },
    };
  }

  _clampValue(value, min = 0, max = 1) {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * 设置进度
   * @param {number} progress - 进度
   */
  setProgress(progress) {
    this.progress = this._clampValue(progress);
  }

  /**
   * 设置抖动强度
   * @param {number} intensity - 抖动强度
   */
  setIntensity(intensity) {
    this.intensity = this._clampValue(intensity);
  }
  /**
   * 设置抖动频率
   * @param {number} shakeFrequency - 抖动频率
   */
  setShakeFrequency(shakeFrequency) {
    this.shakeFrequency = this._clampValue(shakeFrequency, 0, 15);
  }
  /**
   * 设置抖动方向
   * @param {THREE.Vector2} shakeDirection - 抖动方向
   */
  setShakeDirection(shakeDirection) {
    this.shakeDirection = new THREE.Vector2(
      this._clampValue(shakeDirection[0], 0, 1),
      this._clampValue(shakeDirection[1], 0, 1)
    );
  }
  /**
   * 设置抖动速度
   * @param {number} shakeSpeed - 抖动速度
   */
  setShakeSpeed(shakeSpeed) {
    this.shakeSpeed = this._clampValue(shakeSpeed);
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
   * 渲染
   * @param {WebGLRenderer} renderer - WebGL渲染器
   * @param {WebGLRenderTarget} writeBuffer - 写入缓冲区
   * @param {WebGLRenderTarget} readBuffer - 读取缓冲区
   * @param {number} delta - 时间增量
   * @param {boolean} maskActive - 掩码是否激活
   */
  render(renderer, writeBuffer, readBuffer, delta, maskActive) {
    this.material.uniforms.progress.value = this.progress * this.intensity;
    this.material.uniforms.shakeIntensity.value = this.intensity;
    this.material.uniforms.shakeFrequency.value = this.shakeFrequency;
    this.material.uniforms.shakeDirection.value = this.shakeDirection;
    this.material.uniforms.shakeSpeed.value = this.shakeSpeed;
    super.render(renderer, writeBuffer, readBuffer, delta, maskActive);
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

/*threeJS*/ module.exports = { ShakeShaderPass };
// /*Effect*/ exports.ShakeShaderPass = ShakeShaderPass;
