/*threeJS*/ const THREE = require('three');
/*threeJS*/ const { ShaderPass } = require('three/examples/jsm/postprocessing/ShaderPass.js');

// /*Effect*/ const THREE = require('../../ThreeJS/three-amg-wrapper.js').THREE;
// /*Effect*/ const { ShaderPass } = require('../../ThreeJS/ShaderPass.js');

// 导入着色器文件
const shaderVertSource = require('./shaders/shaderVert.js').source;
const shaderFragSource = require('./shaders/shaderFrag.js').source;

function createShader() {
    const vertexShader = shaderVertSource;
    const fragmentShader = shaderFragSource;

    return {
        name: 'CustomShaderPass',
        uniforms: {
            'tDiffuse': { value: null },
            'tDiffuse1': { value: null },
            'intensity': { value: 1.0 },
            'ratio': { value: 1.0 },
            'progress': { value: 0.0 },
            // 自定义uniforms
            //===begin_uniforms===
            'blurSize': { value: 10.0 },
            'quality': { value: 0.5 },
            'lightIntensity': { value: 1.0 } // 高光散景强度
            //===end_uniforms===
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        transparent: true,
        side: THREE.DoubleSide
  };
}

/**
 * ShaderPass类
 * 继承自Three.js的ShaderPass
 */
class CustomShaderPass extends ShaderPass {
  constructor() {
    super(createShader());
    
    // 设置默认参数
    this.params = {
        intensity: 1.0,
        ratio: 1.0,
        progress: 0.0,
        // 根据createShader中的uniforms添加参数
        //===begin_params===
        blurSize: 10.0,
        quality: 0.5,
        lightIntensity: 1.0,
        //===end_params===
    };

    // 初始化时更新一次uniforms
    this._updateShaderUniforms();
  }

  _updateShaderUniforms() {
    this.material.uniforms.intensity.value = this.params.intensity;
    this.material.uniforms.ratio.value = this.params.ratio;
    this.material.uniforms.progress.value = this.params.progress;
    //===begin_render_settings===
    this.material.uniforms.blurSize.value = this.params.blurSize;
    this.material.uniforms.quality.value = this.params.quality;
    this.material.uniforms.lightIntensity.value = this.params.lightIntensity;
    //===end_render_settings===
  }

  _clampValue(value, min = 0, max = 1) {
    return Math.max(min, Math.min(max, value));
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
    this._updateShaderUniforms();
    super.render(renderer, writeBuffer, readBuffer, delta, maskActive);
  }

  /**
   * 设置参数
   * @param {string} key - 参数名
   * @param {*} value - 参数值
   */
  setParameter(key, value) {
    // 检查参数是否存在
    if (this.params.hasOwnProperty(key)) {
      // 直接设置this.params对象中的值
      this.params[key] = value;
      // 更新对应的uniforms值
      this.material.uniforms[key].value = value;
    } else {
      console.warn(`Parameter '${key}' does not exist in this.params`);
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

/*threeJS*/ module.exports = { CustomShaderPass }; 
// /*Effect*/ exports.CustomShaderPass = CustomShaderPass;
