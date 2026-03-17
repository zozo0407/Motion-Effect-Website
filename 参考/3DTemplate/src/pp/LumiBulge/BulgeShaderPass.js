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
        name: 'BulgeShaderPass',
        uniforms: {
            'tDiffuse': { value: null },
            'progress': { value: 0.1 },
            'ratio': { value: 1.0 },
            'bulgeCenter': { value: new THREE.Vector2(0.0, 0.0) },
            'bulgeRadius': { value: new THREE.Vector2(0.3, 0.3) },
            'bulgeHeight': { value: 0.2 },
            'coneRadius': { value: 0.8 },
            'pinEdges': { value: 0.0 },
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        transparent: true,
        side: THREE.DoubleSide
    };
}

/**
 * BulgeShaderPass类
 * 继承自Three.js的ShaderPass，提供bulge效果
 */
class BulgeShaderPass extends ShaderPass {
  constructor() {
    super(createShader());
    
    // 设置默认参数
    this.bulgeCenter = new THREE.Vector2(0.0, 0.0);
    this.bulgeRadius = new THREE.Vector2(1.0, 1.0);
    this.bulgeHeight = 1.0;
    this.coneRadius = 0.8;
    this.pinEdges = 0.0;
    this.intensity = 0.0;

    // 预设配置
    this.presets = {
        // 无效果
        none: {
            intensity: 0,
        },

        // 轻度膨胀效果
        low: {
            intensity: 1,
            bulgeCenter: [0.0, 0.0],
            bulgeRadius: [0.6, 0.6],
            bulgeHeight: 0.6,
            coneRadius: 0.8,
            pinEdges: 0.0
        },
        
        // 中等膨胀效果
        medium: {
            intensity: 1,
            bulgeCenter: [0.0, 0.0],
            bulgeRadius: [1.0, 1.0],
            bulgeHeight: 1.0,
            coneRadius: 0.8,
            pinEdges: 0.0
        },
        
        // 重度膨胀效果
        high: {
            intensity: 1,
            bulgeCenter: [0.0, 0.0],
            bulgeRadius: [1.0, 1.0],
            bulgeHeight: 2.0,
            coneRadius: 0.8,
            pinEdges: 0.0
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
   * 设置膨胀中心偏移
   * @param {THREE.Vector2} bulgeCenter - 膨胀中心偏移
   */
  setBulgeCenter(bulgeCenter) {
    this.bulgeCenter = new THREE.Vector2(
      this._clampValue(bulgeCenter[0], -2, 2),
      this._clampValue(bulgeCenter[1], -2, 2)
    );
  }
  /**
   * 设置椭圆半径
   * @param {THREE.Vector2} bulgeRadius - 椭圆半径
   */
  setBulgeRadius(bulgeRadius) {
    this.bulgeRadius = new THREE.Vector2(
      this._clampValue(bulgeRadius[0], -2, 2),
      this._clampValue(bulgeRadius[1], -2, 2)
    );
  }
  /**
   * 设置膨胀高度
   * @param {number} bulgeHeight - 膨胀高度
   */
  setBulgeHeight(bulgeHeight) {
    this.bulgeHeight = this._clampValue(bulgeHeight, 0, 2);
  }
  /**
   * 设置锥形半径
   * @param {number} coneRadius - 锥形半径
   */
  setConeRadius(coneRadius) {
    this.coneRadius = this._clampValue(coneRadius);
  }
  /**
   * 设置边缘固定
   * @param {number} pinEdges - 边缘固定
   */
  setPinEdges(pinEdges) {
    this.pinEdges = this._clampValue(pinEdges);
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
    this.material.uniforms.bulgeCenter.value = this.bulgeCenter;
    this.material.uniforms.bulgeRadius.value = this.bulgeRadius;
    this.material.uniforms.bulgeHeight.value = this.bulgeHeight * this.intensity;
    this.material.uniforms.coneRadius.value = this.coneRadius;
    this.material.uniforms.pinEdges.value = this.pinEdges;
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

/*threeJS*/ module.exports = { BulgeShaderPass };
// /*Effect*/ exports.BulgeShaderPass = BulgeShaderPass;
