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
        name: 'FlickerShaderPass',
        uniforms: {
            'tDiffuse': { value: null },
            'progress': { value: 0.1 },
            'ratio': { value: 1.0 },
            'globalAmp': { value: 0.2 },
            'randLumaAmp': { value: 1.0 },
            'randColorAmp': { value: 0.0 },
            'randFreq': { value: 30.0 },
            'waveAmp': { value: 0.0 },
            'waveFreq': { value: 5.0 },
            'phaseR': { value: 0.0 },
            'phaseG': { value: 0.0 },
            'phaseB': { value: 0.0 },
            'ampR': { value: 1.0 },
            'ampG': { value: 1.0 },
            'ampB': { value: 1.0 },
            'brightness': { value: 1.0 },
            'seed': { value: 0.123 },
            'u_Intensity': { value: 1.0 }
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        transparent: true,
        side: THREE.DoubleSide
    };
}

/**
 * FlickerShaderPass类
 * 继承自Three.js的ShaderPass，提供Flicker效果
 */
class FlickerShaderPass extends ShaderPass {
  constructor() {
    super(createShader());
    
    // 设置默认参数
    this.progress = 0.1;
    this.globalAmp = 0.2;
    this.randLumaAmp = 1.0;
    this.randColorAmp = 0.0;
    this.randFreq = 30.0;
    this.waveAmp = 0.0;
    this.waveFreq = 5.0;
    this.phaseR = 0.0;
    this.phaseG = 0.0;
    this.phaseB = 0.0;
    this.ampR = 1.0;
    this.ampG = 1.0;
    this.ampB = 1.0;
    this.brightness = 1.0;
    this.seed = 0.123;
    this.intensity = 1.0;

    // LumiFlicker预设配置
    this.presets = {
        // 无效果
        none: {
            intensity: 0,
            globalAmp: 0,
            randLumaAmp: 0,
            randColorAmp: 0,
            randFreq: 1.0,
            waveAmp: 0,
            waveFreq: 1.0,
            brightness: 100.0
        },

        // 轻微闪烁
        low: {
            intensity: 1.0,
            globalAmp: 0.2,
        },
        
        // 中等闪烁
        medium: {
            intensity: 1.0,
            globalAmp: 0.5,
        },
        
        // 强烈闪烁
        high: {
            intensity: 1.0,
            globalAmp: 1.0,
        },
    };

  }

  _clampValue(value, min = 0, max = 1) {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * 设置进度
   * @param {number} progress - 进度
   */
  setProgress(progress) {
    this.progress = this._clampValue(progress, 0, 1);
  }

  /**
   * 设置全局强度
   * @param {number} globalAmp - 全局强度
   */
  setGlobalAmp(globalAmp) {
    this.globalAmp = this._clampValue(globalAmp, 0, 10);
  }
  /**
   * 设置随机亮度强度
   * @param {number} randLumaAmp - 随机亮度强度
   */
  setRandLumaAmp(randLumaAmp) {
    this.randLumaAmp = this._clampValue(randLumaAmp, 0, 200);
  }
  /**
   * 设置随机颜色强度
   * @param {number} randColorAmp - 随机颜色强度
   */
  setRandColorAmp(randColorAmp) {
    this.randColorAmp = this._clampValue(randColorAmp, 0, 200);
  }
  /**
   * 设置随机频率
   * @param {number} randFreq - 随机频率
   */
  setRandFreq(randFreq) {
    this.randFreq = this._clampValue(randFreq, 0, 60);
  }
  /**
   * 设置波强度
   * @param {number} waveAmp - 波强度
   */
  setWaveAmp(waveAmp) {
    this.waveAmp = this._clampValue(waveAmp, 0, 200);
  }
  /**
   * 设置波频率
   * @param {number} waveFreq - 波频率
   */
  setWaveFreq(waveFreq) {
    this.waveFreq = this._clampValue(waveFreq, 0, 60);
  }
  /**
   * 设置红色相位
   * @param {number} phaseR - 红色相位
   */
  setPhaseR(phaseR) {
    this.phaseR = this._clampValue(phaseR, -1, 1);
  }
  /**
   * 设置绿色相位
   * @param {number} phaseG - 绿色相位
   */
  setPhaseG(phaseG) {
    this.phaseG = this._clampValue(phaseG, -1, 1);
  }
  /**
   * 设置蓝色相位
   * @param {number} phaseB - 蓝色相位
   */
  setPhaseB(phaseB) {
    this.phaseB = this._clampValue(phaseB, -1, 1);
  }
  /**
   * 设置红色强度
   * @param {number} ampR - 红色强度
   */
  setAmpR(ampR) {
    this.ampR = this._clampValue(ampR, -1, 1);
  }
  /**
   * 设置绿色强度
   * @param {number} ampG - 绿色强度
   */
  setAmpG(ampG) {
    this.ampG = this._clampValue(ampG, -1, 1);
  }
  /**
   * 设置蓝色强度
   * @param {number} ampB - 蓝色强度
   */
  setAmpB(ampB) {
    this.ampB = this._clampValue(ampB, -1, 1);
  }
  /**
   * 设置亮度
   * @param {number} brightness - 亮度
   */
  setBrightness(brightness) {
    this.brightness = this._clampValue(brightness, 0, 200);
  }
  /**
   * 设置随机种子
   * @param {number} seed - 随机种子
   */
  setSeed(seed) {
    this.seed = this._clampValue(seed, 0, 5);
  }
  /**
   * 设置强度
   * @param {number} intensity - 强度 (0.0-1.0)
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
    this.material.uniforms.tDiffuse.value = readBuffer.texture;
    this.material.uniforms.progress.value = this.progress * this.intensity;
    this.material.uniforms.globalAmp.value = this.globalAmp;
    this.material.uniforms.randLumaAmp.value = this.randLumaAmp;
    this.material.uniforms.randColorAmp.value = this.randColorAmp;
    this.material.uniforms.randFreq.value = this.randFreq;
    this.material.uniforms.waveAmp.value = this.waveAmp;
    this.material.uniforms.waveFreq.value = this.waveFreq;
    this.material.uniforms.phaseR.value = this.phaseR;
    this.material.uniforms.phaseG.value = this.phaseG;
    this.material.uniforms.phaseB.value = this.phaseB;
    this.material.uniforms.ampR.value = this.ampR;
    this.material.uniforms.ampG.value = this.ampG;
    this.material.uniforms.ampB.value = this.ampB;
    this.material.uniforms.brightness.value = this.brightness;
    this.material.uniforms.seed.value = this.seed;
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

/*threeJS*/ module.exports = { FlickerShaderPass };
// /*Effect*/ exports.FlickerShaderPass = FlickerShaderPass;
