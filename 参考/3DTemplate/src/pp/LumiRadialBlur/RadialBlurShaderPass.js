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
        name: 'RadialBlurShaderPass',
        uniforms: {
            'tDiffuse': { value: null },
            'progress': { value: 0.1 },
            'ratio': { value: 1.0 },
            'blurType': { value: 0.0 },
            'amount': { value: 60.0 },
            'quality': { value: 0.2 },
            'center': { value: new THREE.Vector2(0.5, 0.5) },
            'weightDecay': { value: 0.965 },
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        transparent: true,
        side: THREE.DoubleSide
    };
}

/**
 * RadialBlurShaderPass类
 * 继承自Three.js的ShaderPass，提供RadialBlur效果
 */
class RadialBlurShaderPass extends ShaderPass {
  constructor() {
    super(createShader());
    
    // 设置默认参数
    this.blurType = 0.0;
    this.amount = 60.0;
    this.quality = 0.2;
    this.center = new THREE.Vector2(0.5, 0.5);
    this.weightDecay = 0.965;
    this.intensity = 0.0;

    this.presets = {
        // 无效果
        none: {
            intensity: 0,
        },

        // 轻度径向模糊
        low: {
            intensity: 1.0,
            blurType: 0,
            amount: 30,
            quality: 0.3,
            center: [0.5, 0.5],
            weightDecay: 0.98
        },
        
        // 中等径向模糊
        medium: {
            intensity: 1.0,
            blurType: 0,
            amount: 60,
            quality: 0.5,
            center: [0.5, 0.5],
            weightDecay: 0.965
        },
        
        // 重度径向模糊
        high: {
            intensity: 1.0,
            blurType: 0,
            amount: 240,
            quality: 0.8,
            center: [0.5, 0.5],
            weightDecay: 0.95
        }
    };
  }

  _clampValue(value, min = 0, max = 1) {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * 设置模糊类型
   * @param {number} blurType - 模糊类型
   */
  setBlurType(blurType) {
    this.blurType = this._clampValue(blurType, 0, 5);
  }
  /**
   * 设置权重衰减
   * @param {number} weightDecay - 权重衰减
   */
  setWeightDecay(weightDecay) {
    this.weightDecay = this._clampValue(weightDecay, 0, 1);
  }
  /**
   * 设置数量
   * @param {number} amount - 数量
   */
  setAmount(amount) {
    this.amount = this._clampValue(amount, -250.0, 250.0);
  }
  /**
   * 设置质量
   * @param {number} quality - 质量
   */
  setQuality(quality) {
    this.quality = this._clampValue(quality, 0, 1);
  }
  /**
   * 设置中心
   * @param {THREE.Vector2} center - 中心
   */
  setCenter(center) {
    this.center = new THREE.Vector2(
      this._clampValue(center[0], 0, 1),
      this._clampValue(center[1], 0, 1)
    );
  }
  /**
   * 设置权重衰减
   * @param {number} weightDecay - 权重衰减
   */
  setWeightdecay(weightDecay) {
    this.weightDecay = this._clampValue(weightDecay, 0, 1);
  }

  /**
   * 设置强度
   * @param {number} intensity - 强度
   */
  setIntensity(intensity) {
    this.intensity = this._clampValue(intensity);
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
    this.material.uniforms.blurType.value = this.blurType;
    this.material.uniforms.amount.value = this.amount * this.intensity;
    this.material.uniforms.quality.value = this.quality;
    this.material.uniforms.center.value = this.center;
    this.material.uniforms.weightDecay.value = this.weightDecay;
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

/*threeJS*/ module.exports = { RadialBlurShaderPass };
// /*Effect*/ exports.RadialBlurShaderPass = RadialBlurShaderPass;
