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
        name: 'GlowShaderPass',
        uniforms: {
            'tDiffuse': { value: null },
            'progress': { value: 0.1 },
            'ratio': { value: 1.0 },
            'glowThreshold': { value: 0.5 },
            'glowRadius': { value: 10.0 },
            'glowIntensity': { value: 1.0 },
            'glowColor': { value: new THREE.Vector3(1.0, 1.0, 1.0) },
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        transparent: true,
        side: THREE.DoubleSide
    };
}

/**
 * GlowShaderPass类
 * 继承自Three.js的ShaderPass，提供glow效果
 */
class GlowShaderPass extends ShaderPass {
  constructor() {
    super(createShader());
    
    // 设置默认参数
    this.glowThreshold = 0.5;
    this.glowRadius = 10.0;
    this.intensity = 1.0;
    this.glowColor = new THREE.Vector3(1.0, 1.0, 1.0);

    // LumiGlow预设配置
    this.presets = {
        // 无效果
        none: {
            intensity: 0,
            glowThreshold: 0.8,
            glowRadius: 10,
            glowColor: [1.0, 1.0, 1.0]
        },

        // 轻微发光
        low: {
            intensity: 0.5,
            glowThreshold: 0.7,
            glowRadius: 15,
            glowColor: [1.0, 1.0, 0.8]
        },
        
        // 中等发光
        medium: {
            intensity: 1.0,
            glowThreshold: 0.6,
            glowRadius: 25,
            glowColor: [1.0, 0.9, 0.7]
        },
        
        // 强烈发光
        high: {
            intensity: 2.0,
            glowThreshold: 0.5,
            glowRadius: 40,
            glowColor: [1.0, 0.8, 0.6]
        },

        // 冷光 -- 蓝色发光
        cool: {
            intensity: 1.5,
            glowThreshold: 0.6,
            glowRadius: 30,
            glowColor: [0.3, 0.7, 1.0]
        },

        // 暖光 -- 黄色发光
        warm: {
            intensity: 1.5,
            glowThreshold: 0.6,
            glowRadius: 30,
            glowColor: [1.0, 0.8, 0.6]
        }
    };

  }

  _clampValue(value, min = 0, max = 1) {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * 设置发光阈值
   * @param {number} glowThreshold - 发光阈值
   */
  setGlowThreshold(glowThreshold) {
    this.glowThreshold = this._clampValue(glowThreshold);
  }
  /**
   * 设置发光半径
   * @param {number} glowRadius - 发光半径
   */
  setGlowRadius(glowRadius) {
    this.glowRadius = this._clampValue(glowRadius, 0, 100);
  }
  /**
   * 设置发光强度
   * @param {number} intensity - 发光强度
   */
  setIntensity(intensity) {
    this.intensity = this._clampValue(intensity, 0, 4);
  }
  /**
   * 设置发光颜色
   * @param {THREE.Vector3} glowColor - 发光颜色
   */
  setGlowColor(glowColor) {
    this.glowColor = new THREE.Vector3(
      this._clampValue(glowColor[0]),
      this._clampValue(glowColor[1]),
      this._clampValue(glowColor[2]),
    );
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
    this.material.uniforms.glowThreshold.value = this.glowThreshold;
    this.material.uniforms.glowRadius.value = this.glowRadius;
    this.material.uniforms.glowIntensity.value = this.intensity;
    this.material.uniforms.glowColor.value = this.glowColor;
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

/*threeJS*/ module.exports = { GlowShaderPass };
// /*Effect*/ exports.GlowShaderPass = GlowShaderPass;
