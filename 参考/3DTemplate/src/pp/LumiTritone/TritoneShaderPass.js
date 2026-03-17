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
        name: 'TritoneShaderPass',
        uniforms: {
            'tDiffuse': { value: null },
            'progress': { value: 0.1 },
            'ratio': { value: 1.0 },
            'shadowColor': { value: new THREE.Vector3(0.0, 0.0, 0.0) },
            'middleColor': { value: new THREE.Vector3(0.498, 0.392, 0.274) },
            'highlightColor': { value: new THREE.Vector3(1.0, 1.0, 1.0) },
            'blendWithOriginal': { value: 0.0 },
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        transparent: true,
        side: THREE.DoubleSide
    };
}

/**
 * TritoneShaderPass类
 * 继承自Three.js的ShaderPass，提供Tritone效果
 */
class TritoneShaderPass extends ShaderPass {
  constructor() {
    super(createShader());
    
    // 设置默认参数
    this.shadowColor = new THREE.Vector3(0.0, 0.0, 0.0);
    this.middleColor = new THREE.Vector3(0.498, 0.392, 0.274);
    this.highlightColor = new THREE.Vector3(1.0, 1.0, 1.0);
    this.intensity = 1.0;

    this.presets = {
        // 无效果
        none: {
            intensity: 0,
        },

        // 轻度三色调
        low: {
            intensity: 0.3,
            shadowColor: [0.1, 0.1, 0.2],
            middleColor: [0.5, 0.4, 0.3],
            highlightColor: [0.9, 0.9, 0.8]
        },
        
        // 中等三色调 -- 复古风格
        medium: {
            intensity: 0.6,
            shadowColor: [0.0, 0.0, 0.1],
            middleColor: [0.498, 0.392, 0.274],
            highlightColor: [1.0, 0.95, 0.8]
        },
        
        // 强烈三色调
        high: {
            intensity: 1.0,
            shadowColor: [0.0, 0.0, 0.0],
            middleColor: [0.4, 0.3, 0.2],
            highlightColor: [1.0, 0.9, 0.7]
        },
    };
  }

  _clampValue(value, min = 0, max = 1) {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * 设置阴影颜色
   * @param {THREE.Vector3} shadowColor - 阴影颜色
   */
  setShadowColor(shadowColor) {
    this.shadowColor = new THREE.Vector3(this._clampValue(shadowColor[0]), this._clampValue(shadowColor[1]), this._clampValue(shadowColor[2]));
  }
  /**
   * 设置中间色
   * @param {THREE.Vector3} middleColor - 中间色
   */
  setMiddleColor(middleColor) {
    this.middleColor = new THREE.Vector3(this._clampValue(middleColor[0]), this._clampValue(middleColor[1]), this._clampValue(middleColor[2]));
  }
  /**
   * 设置高光颜色
   * @param {THREE.Vector3} highlightColor - 高光颜色
   */
  setHighlightColor(highlightColor) {
    this.highlightColor = new THREE.Vector3(this._clampValue(highlightColor[0]), this._clampValue(highlightColor[1]), this._clampValue(highlightColor[2]));
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
    this.material.uniforms.shadowColor.value = this.shadowColor;
    this.material.uniforms.middleColor.value = this.middleColor;
    this.material.uniforms.highlightColor.value = this.highlightColor;
    this.material.uniforms.blendWithOriginal.value = 1.0 - this.intensity;
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

/*threeJS*/ module.exports = { TritoneShaderPass };
// /*Effect*/ exports.TritoneShaderPass = TritoneShaderPass;
