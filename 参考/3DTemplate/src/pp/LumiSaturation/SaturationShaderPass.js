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
        name: 'SaturationShaderPass',
        uniforms: {
            'tDiffuse': { value: null },
            'progress': { value: 0.1 },
            'ratio': { value: 1.0 },
            'intensity': { value: 0.0 },
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        transparent: true,
        side: THREE.DoubleSide
    };
}

/**
 * SaturationShaderPass类
 * 继承自Three.js的ShaderPass，提供Saturation效果
 */
class SaturationShaderPass extends ShaderPass {
  constructor() {
    super(createShader());
    
    // 设置默认参数
    this.saturationIntensity = 0.5; // 修改变量名
    this.intensity = 1.0; // 添加新的intensity属性

    this.presets = {
        // 无效果
        none: {
            intensity: 0,
        },

        // 轻度去饱和
        low: {
            intensity: 1,
            saturationIntensity: -0.3
        },
        
        // 中等饱和度调节
        medium: {
            intensity: 1,
            saturationIntensity: 0.5
        },
        
        // 高饱和度
        high: {
            intensity: 1,
            saturationIntensity: 1.0
        },

        // 黑白效果
        grayscale: {
            intensity: 1,
            saturationIntensity: -1.0
        }
    };
  }

  _clampValue(value, min = 0, max = 1) {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * 设置饱和度强度
   * @param {number} saturationIntensity - 饱和度强度 (-1.0 到 1.0)
   */
  setSaturationIntensity(saturationIntensity) {
    this.saturationIntensity = this._clampValue(saturationIntensity, -1, 1);
  }
  
  /**
   * 设置效果整体强度
   * @param {number} intensity - 效果整体强度 (0.0-1.0)
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
    this.material.uniforms.intensity.value = this.saturationIntensity * this.intensity;
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

/*threeJS*/ module.exports = { SaturationShaderPass };
// /*Effect*/ exports.SaturationShaderPass = SaturationShaderPass;
