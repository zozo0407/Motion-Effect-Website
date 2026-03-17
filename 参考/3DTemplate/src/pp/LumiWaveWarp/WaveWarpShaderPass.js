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
        name: 'WaveWarpShaderPass',
        uniforms: {
            'tDiffuse': { value: null },
            'progress': { value: 0.1 },
            'ratio': { value: 1.0 },
            'wavelength': { value: 0.1 },
            'amplitude': { value: 0.05 },
            'phase': { value: 0.0 },
            'direction': { value: new THREE.Vector2(1.0, 0.0) },
            'waveType': { value: 0 },
            'edgeMode': { value: 0 },
            'intensity': { value: 1.0 }  // 添加intensity uniform
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        transparent: true,
        side: THREE.DoubleSide
    };
}

/**
 * WaveWarpShaderPass类
 * 继承自Three.js的ShaderPass，提供wavewarp效果
 */
class WaveWarpShaderPass extends ShaderPass {
  constructor() {
    super(createShader());
    
    // 设置默认参数
    this.wavelength = 0.1;
    this.amplitude = 0.05;
    this.phase = 0.0;
    this.direction = new THREE.Vector2(1.0, 0.0);
    this.waveType = 0;
    this.edgeMode = 0;
    this.intensity = 0.0;  // 添加intensity默认值

    this.presets = {
        // 无效果
        none: {
            intensity: 0
        },

        // 轻度波浪
        low: {
            intensity: 1.0,
            wavelength: 0.2,
            amplitude: 0.02,
            phase: 0.0,
            direction: { x: 1.0, y: 0.0 },
            waveType: 0,
            edgeMode: 1
        },
        
        // 中等波浪
        medium: {
            intensity: 1.0,
            wavelength: 0.15,
            amplitude: 0.04,
            phase: 0.0,
            direction: { x: 1.0, y: 0.0 },
            waveType: 0,
            edgeMode: 1
        },
        
        // 强烈波浪
        high: {
            intensity: 1.0,
            wavelength: 0.1,
            amplitude: 0.06,
            phase: 0.0,
            direction: { x: 1.0, y: 0.0 },
            waveType: 0,
            edgeMode: 1
        },

        // 水波纹效果
        ripple: {
            intensity: 1.0,
            wavelength: 0.08,
            amplitude: 0.03,
            phase: 0.25,
            direction: { x: 0.7, y: 0.7 },
            waveType: 0,
            edgeMode: 2
        },

        // 方波扭曲
        square_wave: {
            intensity: 1.0,
            wavelength: 0.12,
            amplitude: 0.05,
            phase: 0.0,
            direction: { x: 1.0, y: 0.0 },
            waveType: 1,
            edgeMode: 1
        }
    };
  }

  _clampValue(value, min = 0, max = 1) {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * 设置波长
   * @param {number} wavelength - 波长
   */
  setWavelength(wavelength) {
    this.wavelength = this._clampValue(wavelength, 0, 1);
  }
  /**
   * 设置振幅
   * @param {number} amplitude - 振幅
   */
  setAmplitude(amplitude) {
    this.amplitude = this._clampValue(amplitude, 0, 1);
  }
  /**
   * 设置相位偏移
   * @param {number} phase - 相位偏移
   */
  setPhase(phase) {
    this.phase = this._clampValue(phase, 0, 1);
  }
  /**
   * 设置波浪方向
   * @param {THREE.Vector2} direction - 波浪方向
   */
  setDirection(direction) {
    direction[0] = this._clampValue(direction[0], 0, 1);
    direction[1] = this._clampValue(direction[1], 0, 1);
    this.direction = direction;
  }
  /**
   * 设置波形类型
   * @param {number} waveType - 波形类型
   */
  setWaveType(waveType) {
    this.waveType = this._clampValue(waveType, 0, 2);
  }
  /**
   * 设置边缘模式
   * @param {number} edgeMode - 边缘模式
   */
  setEdgeMode(edgeMode) {
    this.edgeMode = this._clampValue(edgeMode, 0, 2);
  }

  /**
   * 设置强度
   * @param {number} intensity - 效果强度 (0.0-1.0)
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
    // 设置纹理
    this.material.uniforms.tDiffuse.value = readBuffer.texture;
    
    this.material.uniforms.progress.value = this.progress || 0.1;
    this.material.uniforms.ratio.value = this.ratio || 1.0;
    this.material.uniforms.wavelength.value = this.wavelength;
    this.material.uniforms.amplitude.value = this.amplitude;
    this.material.uniforms.phase.value = this.phase;
    this.material.uniforms.direction.value = this.direction;
    this.material.uniforms.waveType.value = this.waveType;
    this.material.uniforms.edgeMode.value = this.edgeMode;
    this.material.uniforms.intensity.value = this.intensity;  // 设置intensity uniform值
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

/*threeJS*/ module.exports = { WaveWarpShaderPass };
// /*Effect*/ exports.WaveWarpShaderPass = WaveWarpShaderPass;
