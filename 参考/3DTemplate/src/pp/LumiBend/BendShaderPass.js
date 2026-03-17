/*threeJS*/ const THREE = require('three');
/*threeJS*/ const { ShaderPass } = require('three/examples/jsm/postprocessing/ShaderPass.js');

// /*Effect*/ const THREE = require('../../ThreeJS/three-amg-wrapper.js').THREE;
// /*Effect*/ const { ShaderPass } = require('../../ThreeJS/ShaderPass.js');


// 导入着色器文件
const shaderVertSource = require('./shaders/shaderVert.js').source;
const shaderFragSource = require('./shaders/shaderFrag.js').source;

function createShader() {
    const vertexShader = shaderVertSource;
    const fragmentShader = shaderFragSource
        .replace(/texture1/g, 'tDiffuse');

    return {
        name: 'BendShaderPass',
        uniforms: {
            'tDiffuse': { value: null },
            'progress': { value: 0.1 },
            'ratio': { value: 1.0 },
            'startPoint': { value: new THREE.Vector2(0.2, 0.5) },
            'endPoint': { value: new THREE.Vector2(0.8, 0.5) },
            'bendAmount': { value: 30.0 },
            'renderMode': { value: 0 },
            'distortMode': { value: 0 },
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        transparent: true,
        side: THREE.DoubleSide
  };
}

/**
 * 弯曲ShaderPass类
 * 继承自Three.js的ShaderPass，提供弯曲效果
 */
class BendShaderPass extends ShaderPass {
  constructor() {
    super(createShader());
    
    // 设置默认参数 - 确保效果可见
    this.startPoint = new THREE.Vector2(0.2, 0.5);
    this.endPoint = new THREE.Vector2(0.8, 0.5);
    this.bendAmount = 30.0;
    this.renderMode = 0;
    this.distortMode = 0;
    this.intensity = 1.0;

    // 预设配置
    this.presets = {
        // 无效果
        none: {
            intensity: 0,
        },

        // 轻度弯曲效果
        low: {
            intensity: 1,
            bendAmount: 15,
            startPoint: [0.5, 0.5],
            endPoint: [0.4, 0.5],
            renderMode: 0,
            distortMode: 0
        },
        
        // 中等弯曲效果
        medium: {
            intensity: 1,
            bendAmount: 30,
            startPoint: [0.5, 0.5],
            endPoint: [0.4, 0.5],
            renderMode: 0,
            distortMode: 0
        },
        
        // 重度弯曲效果
        high: {
            intensity: 1,
            bendAmount: 50,
            startPoint: [0.5, 0.5],
            endPoint: [0.4, 0.5],
            renderMode: 0,
            distortMode: 0
        }
    };
  }

  _clampValue(value, min = 0, max = 1) {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * 设置起始点
   * @param {THREE.Vector2} startPoint - 起始点
   */
  setStartPoint(startPoint) {
    this.startPoint = new THREE.Vector2(
      this._clampValue(startPoint[0], 0, 1),
      this._clampValue(startPoint[1], 0, 1)
    );
  }

  /**
   * 设置结束点
   * @param {THREE.Vector2} endPoint - 结束点
   */
  setEndPoint(endPoint) {
    this.endPoint = new THREE.Vector2(
      this._clampValue(endPoint[0], 0, 1),
      this._clampValue(endPoint[1], 0, 1)
    );
  }

  /**
   * 设置弯曲参数
   * @param {number} bendAmount - 弯曲金额
   */
  setBendAmount(bendAmount) {
    this.bendAmount = this._clampValue(bendAmount, -250, 250);
  }

  /**
   * 设置渲染模式
   * @param {number} renderMode - 渲染模式
   */
  setRenderMode(renderMode) {
    this.renderMode = this._clampValue(renderMode, 0, 3);
  }

  /**
   * 设置扭曲模式
   * @param {number} distortMode - 扭曲模式
   */
  setDistortMode(distortMode) {
    this.distortMode = this._clampValue(distortMode, 0, 1);
  }

  /**
   * 设置强度
   * @param {number} intensity - 强度
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
    this.material.uniforms.startPoint.value = this.startPoint;
    this.material.uniforms.endPoint.value = this.endPoint;
    this.material.uniforms.bendAmount.value = this.bendAmount * this.intensity;
    this.material.uniforms.renderMode.value = this.renderMode;
    this.material.uniforms.distortMode.value = this.distortMode;
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

/*threeJS*/ module.exports = { BendShaderPass }; 
// /*Effect*/ exports.BendShaderPass = BendShaderPass;