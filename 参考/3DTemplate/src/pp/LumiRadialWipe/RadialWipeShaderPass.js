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
        name: 'RadialWipeShaderPass',
        uniforms: {
            'tDiffuse': { value: null },
            'progress': { value: 0.1 },
            'ratio': { value: 1.0 },
            'wipeCenter': { value: new THREE.Vector2(0.5, 0.5) },
            'startAngle': { value: 0.0 },
            'wipeMode': { value: 0.0 },
            'feather': { value: 0.1 },
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        transparent: true,
        side: THREE.DoubleSide
    };
}

/**
 * RadialWipeShaderPass类
 * 继承自Three.js的ShaderPass，提供radialwipe效果
 */
class RadialWipeShaderPass extends ShaderPass {
  constructor() {
    super(createShader());
    
    // 设置默认参数
    this.intensity = 0.0;
    this.wipeCenter = new THREE.Vector2(0.5, 0.5);
    this.startAngle = 0.0;
    this.wipeMode = 0.0;
    this.feather = 0.1;

    this.presets = {
        // 无效果
        none: {
            intensity: 0,
        },

        // 顺时针径向擦除
        clockwise: {
            intensity: 1.0,
            wipeCenter: [0.5, 0.5],
            startAngle: 0,
            wipeMode: 0,
            feather: 0.1
        },
        
        // 逆时针径向擦除
        counterclockwise: {
            intensity: 0.0,
            wipeCenter: [0.5, 0.5],
            startAngle: 0,
            wipeMode: 1,
            feather: 0.1
        },
        
        // 双向径向擦除
        bidirectional: {
            intensity: 1.0,
            wipeCenter: [0.5, 0.5],
            startAngle: 0,
            wipeMode: 2,
            feather: 0.1
        },
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
   * 设置擦除中心点
   * @param {THREE.Vector2} wipeCenter - 擦除中心点
   */
  setWipeCenter(wipeCenter) {
    this.wipeCenter = new THREE.Vector2(
      this._clampValue(wipeCenter[0], 0, 1),
      this._clampValue(wipeCenter[1], 0, 1)
    );
  }
  /**
   * 设置起始角度
   * @param {number} startAngle - 起始角度
   */
  setStartAngle(startAngle) {
    this.startAngle = this._clampValue(startAngle, 0, 360);
  }
  /**
   * 设置擦除模式
   * @param {number} wipeMode - 擦除模式
   */
  setWipeMode(wipeMode) {
    this.wipeMode = this._clampValue(wipeMode, 0, 2);
  }
  /**
   * 设置羽化强度
   * @param {number} feather - 羽化强度
   */
  setFeather(feather) {
    this.feather = this._clampValue(feather);
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
    this.material.uniforms.progress.value = this.intensity;
    this.material.uniforms.wipeCenter.value = this.wipeCenter;
    this.material.uniforms.startAngle.value = this.startAngle;
    this.material.uniforms.wipeMode.value = this.wipeMode;
    this.material.uniforms.feather.value = this.feather * this.intensity;
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

/*threeJS*/ module.exports = { RadialWipeShaderPass };
// /*Effect*/ exports.RadialWipeShaderPass = RadialWipeShaderPass;
