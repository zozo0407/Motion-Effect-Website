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
        name: 'FindEdgeShaderPass',
        uniforms: {
            'tDiffuse': { value: null },
            'progress': { value: 0.1 },
            'ratio': { value: 1.0 },
            'brightness': { value: 1.0 },
            'grayColor': { value: 0.0 },
            'upperLimit': { value: 1.0 },
            'lowerLimit': { value: 0.0 },
            'u_Intensity': { value: 1.0 }
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        transparent: true,
        side: THREE.DoubleSide
    };
}

/**
 * FindEdgeShaderPass类
 * 继承自Three.js的ShaderPass，提供FindEdge效果
 */
class FindEdgeShaderPass extends ShaderPass {
  constructor() {
    super(createShader());
    
    // 设置默认参数
    this.brightness = 1.0;
    this.grayColor = 0.0;
    this.upperLimit = 1.0;
    this.lowerLimit = 0.0;
    this.intensity = 1.0;

    // LumiFindEdge预设配置
    this.presets = {
        // 无效果
        none: {
            intensity: 0
        },

        // 颜色边缘检测
        color: {
            intensity: 1.0,
            brightness: 1.2,
            grayColor: 0.0,
            upperLimit: 0.8,
            lowerLimit: 0.2
        },
        
        // 灰度边缘检测
        gray: {
            intensity: 1.0,
            brightness: 2.0,
            grayColor: 1.0,
            upperLimit: 0.6,
            lowerLimit: 0.4
        }
    };

  }

  _clampValue(value, min = 0, max = 1) {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * 设置亮度
   * @param {number} brightness - 亮度
   */
  setBrightness(brightness) {
    this.brightness = this._clampValue(brightness);
  }
  /**
   * 设置灰度颜色
   * @param {number} grayColor - 灰度颜色
   */
  setGrayColor(grayColor) {
    this.grayColor = this._clampValue(grayColor);
  }
  /**
   * 设置上限
   * @param {number} upperLimit - 上限
   */
  setUpperLimit(upperLimit) {
    this.upperLimit = this._clampValue(upperLimit);
  }
  /**
   * 设置下限
   * @param {number} lowerLimit - 下限
   */
  setLowerLimit(lowerLimit) {
    this.lowerLimit = this._clampValue(lowerLimit);
  }
  /**
   * 设置强度
   * @param {number} intensity - 强度 (0.0-1.0)
   */
  setIntensity(intensity) {
    this.intensity = Math.max(0.0, Math.min(1.0, intensity));
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
    this.material.uniforms.tDiffuse.value = readBuffer.texture;
    this.material.uniforms.brightness.value = this.brightness;
    this.material.uniforms.grayColor.value = this.grayColor;
    this.material.uniforms.upperLimit.value = this.upperLimit;
    this.material.uniforms.lowerLimit.value = this.lowerLimit;
    this.material.uniforms.u_Intensity.value = this.intensity;
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

/*threeJS*/ module.exports = { FindEdgeShaderPass };
// /*Effect*/ exports.FindEdgeShaderPass = FindEdgeShaderPass;
