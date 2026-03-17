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
        name: 'FillShaderPass',
        uniforms: {
            'tDiffuse': { value: null },
            'progress': { value: 0.1 },
            'ratio': { value: 1.0 },
            'fillColor': { value: new THREE.Vector3(1.0, 0.0, 0.0) },
            'fillOpacity': { value: 1.0 },
            'fillMode': { value: 0 },
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        transparent: true,
        side: THREE.DoubleSide
    };
}

/**
 * FillShaderPass类
 * 继承自Three.js的ShaderPass，提供fill效果
 */
class FillShaderPass extends ShaderPass {
  constructor() {
    super(createShader());
    
    // 设置默认参数
    this.fillColor = new THREE.Vector3(1.0, 0.0, 0.0);
    this.intensity = 0.5;
    this.fillMode = 0;
    
    // LumiFill 预设配置
    this.presets = {
        // 无效果
        none: {
            intensity: 0,
        },

        // 红色填充
        red: {
            intensity: 0.5,
            fillColor: [1.0, 0.0, 0.0],
            fillMode: 0,
        },
        
        // 绿色填充
        green: {
            intensity: 0.5,
            fillColor: [0.0, 1.0, 0.0],
            fillMode: 0,
        },

        // 蓝色填充
        blue: {
            intensity: 0.5,
            fillColor: [0.0, 0.0, 1.0],
            fillMode: 0,
        },

        // 黄色填充
        yellow: {
            intensity: 0.5,
            fillColor: [1.0, 1.0, 0.0],
            fillMode: 0,
        },
    };
  }

  _clampValue(value, min = 0, max = 1) {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * 设置填充颜色
   * @param {THREE.Vector3} fillColor - 填充颜色
   */
  setFillColor(fillColor) {
    this.fillColor = new THREE.Vector3(
      this._clampValue(fillColor[0]),
      this._clampValue(fillColor[1]),
      this._clampValue(fillColor[2])
    );
  }
  /**
   * 设置填充透明度
   * @param {number} intensity - 填充透明度
   */
  setIntensity(intensity) {
    this.intensity = this._clampValue(intensity);
  }
  /**
   * 设置填充模式
   * @param {number} fillMode - 填充模式
   */
  setFillMode(fillMode) {
    this.fillMode = this._clampValue(fillMode);
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
    this.material.uniforms.fillColor.value = this.fillColor;
    this.material.uniforms.fillOpacity.value = this.intensity;
    this.material.uniforms.fillMode.value = this.fillMode;
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

/*threeJS*/ module.exports = { FillShaderPass };
// /*Effect*/ exports.FillShaderPass = FillShaderPass;
