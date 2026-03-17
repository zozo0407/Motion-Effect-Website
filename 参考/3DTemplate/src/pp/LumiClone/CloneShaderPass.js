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
        name: 'CloneShaderPass',
        uniforms: {
            'tDiffuse': { value: null },
            'progress': { value: 0.1 },
            'ratio': { value: 1.0 },
            'cloneCount': { value: 4, type: 'i' },
            'cloneSpacing': { value: 0.3 },
            'cloneScale': { value: 0.8 },
            'cloneRotation': { value: 0.0 },
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        transparent: true,
        side: THREE.DoubleSide
    };
}

/**
 * CloneShaderPass类
 * 继承自Three.js的ShaderPass，提供clone效果
 */
class CloneShaderPass extends ShaderPass {
  constructor() {
    super(createShader());
    
    // 设置默认参数
    this.cloneCount = 4;
    this.cloneSpacing = 0.3;
    this.cloneScale = 0.8;
    this.cloneRotation = 0.0;
    this.intensity = 1.0;

    // LumiClone 预设配置
    this.presets = {
        // 无效果
        none: {
            intensity: 0,
        },

        // 轻度克隆效果 - 双重影像
        low: {
            intensity: 1,
            cloneCount: 2,
            cloneSpacing: 0.1,
            cloneScale: 0.8,
            cloneRotation: 0.0,
        },
        
        // 中等克隆效果 - 三重影像
        medium: {
            intensity: 1,
            cloneCount: 3,
            cloneSpacing: 0.2,
            cloneScale: 0.8,
            cloneRotation: 0.0,
        },
        
        // 重度克隆效果 - 多重影像
        high: {
            intensity: 1,
            cloneCount: 4,
            cloneSpacing: 0.3,
            cloneScale: 0.8,
            cloneRotation: 0.0,
        }
    };

  }

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
   * 设置克隆数量
   * @param {number} cloneCount - 克隆数量
   */
  setCloneCount(cloneCount) {
    this.cloneCount = this._clampValue(cloneCount, 0, 20);
  }
  /**
   * 设置克隆间距
   * @param {number} cloneSpacing - 克隆间距
   */
  setCloneSpacing(cloneSpacing) {
    this.cloneSpacing = this._clampValue(cloneSpacing);
  }
  /**
   * 设置克隆缩放
   * @param {number} cloneScale - 克隆缩放
   */
  setCloneScale(cloneScale) {
    this.cloneScale = this._clampValue(cloneScale);
  }
  /**
   * 设置克隆旋转
   * @param {number} cloneRotation - 克隆旋转
   */
  setCloneRotation(cloneRotation) {
    this.cloneRotation = this._clampValue(cloneRotation);
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
    this.material.uniforms.cloneCount.value = 1.0 + (this.cloneCount - 1.0) * this.intensity;
    this.material.uniforms.cloneSpacing.value = this.cloneSpacing * this.intensity;
    this.material.uniforms.cloneScale.value = 1.0 + (this.cloneScale - 1.0) * this.intensity;
    this.material.uniforms.cloneRotation.value = this.cloneRotation * this.intensity;
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

/*threeJS*/ module.exports = { CloneShaderPass };
// /*Effect*/ exports.CloneShaderPass = CloneShaderPass;
