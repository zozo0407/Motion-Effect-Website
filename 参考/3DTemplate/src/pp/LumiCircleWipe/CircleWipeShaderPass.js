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
        name: 'CircleWipeShaderPass',
        uniforms: {
            'tDiffuse': { value: null },
            'progress': { value: 0.1 },
            'ratio': { value: 1.0 },
            'center': { value: new THREE.Vector2(0.5, 0.5) },
            'feather': { value: 0.05 },
            'reverse': { value: 0.0 },
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        transparent: true,
        side: THREE.DoubleSide
    };
}

/**
 * CircleWipeShaderPass类
 * 继承自Three.js的ShaderPass，提供circleWipe效果
 */
class CircleWipeShaderPass extends ShaderPass {
  constructor() {
    super(createShader());
    
    // 设置默认参数
    this.center = new THREE.Vector2(0.5, 0.5);
    this.feather = 0.05;
    this.reverse = 0.0;
    this.intensity = 0.5;

    // LumiCircleWipe 预设配置
    this.presets = {
        // 无效果
        none: {
            intensity: 0,
        },

        // 轻度圆形擦除 - 柔和的渐现效果
        low: {
            intensity: 0.3,
            center: [0.5, 0.5],
            feather: 0.1,
            reverse: 0.0,
        },
        
        // 中等圆形擦除 - 标准转场效果
        medium: {
            intensity: 0.5,
            center: [0.5, 0.5],
            feather: 0.1,
            reverse: 0.0,
        },
        
        // 重度圆形擦除 - 锐利的切换效果
        high: {
            intensity: 0.7,
            center: [0.5, 0.5],
            feather: 0.1,
            reverse: 0.0,
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
   * 设置圆心位置
   * @param {THREE.Vector2} center - 圆心位置
   */
  setCenter(center) {
    this.center = new THREE.Vector2(
      this._clampValue(center[0]),
      this._clampValue(center[1])
    );
  }
  /**
   * 设置羽化程度
   * @param {number} feather - 羽化程度
   */
  setFeather(feather) {
    this.feather = this._clampValue(feather);
  }
  /**
   * 设置反转效果
   * @param {number} reverse - 反转效果
   */
  setReverse(reverse) {
    this.reverse = this._clampValue(reverse);
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
    this.material.uniforms.progress.value = 1.0 - this.intensity;
    this.material.uniforms.center.value = this.center;
    this.material.uniforms.feather.value = this.feather * (1.0 - this.intensity);
    this.material.uniforms.reverse.value = this.reverse;
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

/*threeJS*/ module.exports = { CircleWipeShaderPass };
// /*Effect*/ exports.CircleWipeShaderPass = CircleWipeShaderPass;
