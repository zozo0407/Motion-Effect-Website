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
        name: 'MosaicShaderPass',
        uniforms: {
            'tDiffuse': { value: null },
            'progress': { value: 0.1 },
            'ratio': { value: 1.0 },
            'horizontal': { value: 10.0 },
            'vertical': { value: 10.0 },
            'sharp': { value: 0.0 },
            'intensity': { value: 1.0 } // 添加intensity uniform
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        transparent: true,
        side: THREE.DoubleSide
    };
}

/**
 * MosaicShaderPass类
 * 继承自Three.js的ShaderPass，提供Mosaic效果
 */
class MosaicShaderPass extends ShaderPass {
  constructor() {
    super(createShader());
    
    // 设置默认参数
    this.horizontal = 10.0;
    this.vertical = 10.0;
    this.sharp = 0.0;
    this.intensity = 1.0; // 添加intensity属性

    this.presets = {
        // 无效果
        none: {
            intensity: 0,
        },

        // 轻度马赛克
        low: {
            intensity: 1.0,
            horizontal: 20,
            vertical: 20,
            sharp: 0.2
        },
        
        // 中等马赛克
        medium: {
            intensity: 1.0,
            horizontal: 15,
            vertical: 15,
            sharp: 0.5
        },
        
        // 重度马赛克
        high: {
            intensity: 1.0,
            horizontal: 8,
            vertical: 8,
            sharp: 0.8
        },

        // 像素风格
        pixel_art: {
            intensity: 1.0,
            horizontal: 32,
            vertical: 32,
            sharp: 1.0
        }
    };
  }

  _clampValue(value, min = 0, max = 1) {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * 设置水平
   * @param {number} horizontal - 水平
   */
  setHorizontal(horizontal) {
    this.horizontal = this._clampValue(horizontal, 0, 4000);
  }
  /**
   * 设置垂直
   * @param {number} vertical - 垂直
   */
  setVertical(vertical) {
    this.vertical = this._clampValue(vertical, 0, 4000);
  }
  /**
   * 设置锐化
   * @param {number} sharp - 锐化
   */
  setSharp(sharp) {
    this.sharp = this._clampValue(sharp, 0, 1);
  }

  /**
   * 设置强度
   * @param {number} intensity - 强度 (0.0-1.0)
   */
  setIntensity(intensity) {
    this.intensity = this._clampValue(intensity, 0, 1);
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
    this.material.uniforms.horizontal.value = this.horizontal;
    this.material.uniforms.vertical.value = this.vertical;
    this.material.uniforms.sharp.value = this.sharp;
    this.material.uniforms.intensity.value = this.intensity; // 传递intensity值
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

/*threeJS*/ module.exports = { MosaicShaderPass };
// /*Effect*/ exports.MosaicShaderPass = MosaicShaderPass;
