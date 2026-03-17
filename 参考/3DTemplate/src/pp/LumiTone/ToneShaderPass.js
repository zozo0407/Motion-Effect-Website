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
        name: 'ToneShaderPass',
        uniforms: {
            'tDiffuse': { value: null },
            'progress': { value: 0.1 },
            'ratio': { value: 1.0 },
            'exposure': { value: 0.0 },
            'contrast': { value: 0.0 },
            'highlights': { value: 0.0 },
            'shadows': { value: 0.0 },
            'whites': { value: 0.0 },
            'blacks': { value: 0.0 },
            'saturation': { value: 0.0 },
            'vibrance': { value: 0.0 },
            'intensity': { value: 1.0 }
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        transparent: true,
        side: THREE.DoubleSide
    };
}

/**
 * ToneShaderPass类
 * 继承自Three.js的ShaderPass，提供Tone效果
 */
class ToneShaderPass extends ShaderPass {
  constructor() {
    super(createShader());
    
    // 设置默认参数
    this.exposure = 0.0;
    this.contrast = 0.0;
    this.highlights = 0.0;
    this.shadows = 0.0;
    this.whites = 0.0;
    this.blacks = 0.0;
    this.saturation = 0.0;
    this.vibrance = 0.0;
    this.intensity = 1.0;

    this.presets = {
        // 无效果
        none: {
            intensity: 0,
        },

        // 自然增强
        low: {
            intensity: 1,
            exposure: 0.1,
            contrast: 0.2,
            highlights: -0.1,
            shadows: 0.1,
            whites: 0.0,
            blacks: 0.0,
            saturation: 0.2,
            vibrance: 0.3
        },
        
        // 电影级调色
        medium: {
            intensity: 1,
            exposure: 0.0,
            contrast: 0.4,
            highlights: -0.3,
            shadows: 0.2,
            whites: -0.1,
            blacks: 0.1,
            saturation: 0.3,
            vibrance: 0.5
        },
        
        // 戏剧化效果
        high: {
            intensity: 1,
            exposure: 0.2,
            contrast: 0.6,
            highlights: -0.5,
            shadows: 0.4,
            whites: -0.2,
            blacks: 0.2,
            saturation: 0.5,
            vibrance: 0.7
        },

        // 胶片风格
        cinematic: {
            intensity: 1,
            exposure: -0.1,
            contrast: 0.5,
            highlights: -0.4,
            shadows: 0.3,
            whites: -0.15,
            blacks: 0.15,
            saturation: 0.2,
            vibrance: 0.4
        }
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
   * 设置曝光调节
   * @param {number} exposure - 曝光调节
   */
  setExposure(exposure) {
    this.exposure = this._clampValue(exposure);
  }
  /**
   * 设置对比度
   * @param {number} contrast - 对比度
   */
  setContrast(contrast) {
    this.contrast = this._clampValue(contrast);
  }
  /**
   * 设置高光调节
   * @param {number} highlights - 高光调节
   */
  setHighlights(highlights) {
    this.highlights = this._clampValue(highlights);
  }
  /**
   * 设置阴影调节
   * @param {number} shadows - 阴影调节
   */
  setShadows(shadows) {
    this.shadows = this._clampValue(shadows);
  }
  /**
   * 设置白色调节
   * @param {number} whites - 白色调节
   */
  setWhites(whites) {
    this.whites = this._clampValue(whites);
  }
  /**
   * 设置黑色调节
   * @param {number} blacks - 黑色调节
   */
  setBlacks(blacks) {
    this.blacks = this._clampValue(blacks);
  }
  /**
   * 设置饱和度
   * @param {number} saturation - 饱和度
   */
  setSaturation(saturation) {
    this.saturation = this._clampValue(saturation);
  }
  /**
   * 设置自然饱和度
   * @param {number} vibrance - 自然饱和度
   */
  setVibrance(vibrance) {
    this.vibrance = this._clampValue(vibrance);
  }
  /**
   * 设置强度
   * @param {number} intensity - 效果强度 (0.0-1.0)
   */
  setIntensity(intensity) {
    this.intensity = this._clampValue(intensity);
  }
  
  /**
   * 获取强度
   * @returns {number} 当前强度值
   */
  getIntensity() {
    return this.intensity;
  }
  /**
   * 设置自然饱和度
   * @param {number} vibrance - 自然饱和度
   */
  setVibrance(vibrance) {
    this.vibrance = this._clampValue(vibrance);
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
    this.material.uniforms.exposure.value = this.exposure;
    this.material.uniforms.contrast.value = this.contrast;
    this.material.uniforms.highlights.value = this.highlights;
    this.material.uniforms.shadows.value = this.shadows;
    this.material.uniforms.whites.value = this.whites;
    this.material.uniforms.blacks.value = this.blacks;
    this.material.uniforms.saturation.value = this.saturation;
    this.material.uniforms.vibrance.value = this.vibrance;
    this.material.uniforms.intensity.value = this.intensity;
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

/*threeJS*/ module.exports = { ToneShaderPass };
// /*Effect*/ exports.ToneShaderPass = ToneShaderPass;
