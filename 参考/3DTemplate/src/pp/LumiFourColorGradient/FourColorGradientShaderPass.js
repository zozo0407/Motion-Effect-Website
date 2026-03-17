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
        name: 'FourColorGradientShaderPass',
        uniforms: {
            'tDiffuse': { value: null },
            'color1': { value: new THREE.Vector3(1.0, 1.0, 0.0) },
            'color2': { value: new THREE.Vector3(0.0, 1.0, 0.0) },
            'color3': { value: new THREE.Vector3(1.0, 0.0, 1.0) },
            'color4': { value: new THREE.Vector3(0.0, 0.0, 1.0) },
            'point1': { value: new THREE.Vector2(0.1, 0.9) },
            'point2': { value: new THREE.Vector2(0.9, 0.9) },
            'point3': { value: new THREE.Vector2(0.1, 0.1) },
            'point4': { value: new THREE.Vector2(0.9, 0.1) },
            'blendWithOriginal': { value: 0.0 },
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        transparent: true,
        side: THREE.DoubleSide
  };
}

/**
 * 4色渐变ShaderPass类
 * 继承自Three.js的ShaderPass，提供4色渐变效果
 */
class FourColorGradientShaderPass extends ShaderPass {
  constructor() {
    super(createShader());
    
    // 设置默认参数 - 确保效果可见
    this.color1 = new THREE.Vector3(1.0, 1.0, 0.0);
    this.color2 = new THREE.Vector3(0.0, 1.0, 0.0);
    this.color3 = new THREE.Vector3(1.0, 0.0, 1.0);
    this.color4 = new THREE.Vector3(0.0, 0.0, 1.0);
    this.point1 = new THREE.Vector2(0.1, 0.9);
    this.point2 = new THREE.Vector2(0.9, 0.9);
    this.point3 = new THREE.Vector2(0.1, 0.1);
    this.point4 = new THREE.Vector2(0.9, 0.1);
    this.intensity = 0.0;

    // LumiFourColorGradient预设配置
    this.presets = {
        // 无效果
        none: {
            intensity: 0,
            color1: [1.0, 1.0, 1.0],
            color2: [1.0, 1.0, 1.0],
            color3: [1.0, 1.0, 1.0],
            color4: [1.0, 1.0, 1.0],
            point1: [0.0, 0.0],
            point2: [1.0, 0.0],
            point3: [0.0, 1.0],
            point4: [1.0, 1.0]
        },

        // 暖色调渐变
        warm: {
            intensity: 0.4,
            color1: [1.0, 0.8, 0.6],
            color2: [1.0, 0.6, 0.4],
            color3: [0.9, 0.7, 0.5],
            color4: [1.0, 0.5, 0.3],
            point1: [0.0, 0.0],
            point2: [1.0, 0.0],
            point3: [0.0, 1.0],
            point4: [1.0, 1.0]
        },
        
        // 冷色调渐变
        cool: {
            intensity: 0.4,
            color1: [0.6, 0.8, 1.0],
            color2: [0.4, 0.6, 1.0],
            color3: [0.5, 0.7, 0.9],
            color4: [0.3, 0.5, 1.0],
            point1: [0.0, 0.0],
            point2: [1.0, 0.0],
            point3: [0.0, 1.0],
            point4: [1.0, 1.0]
        },
        
        // 电影级调色
        cinematic: {
            intensity: 0.6,
            color1: [0.2, 0.3, 0.6],
            color2: [1.0, 0.8, 0.4],
            color3: [0.1, 0.2, 0.4],
            color4: [1.0, 0.6, 0.2],
            point1: [0.0, 0.0],
            point2: [1.0, 0.0],
            point3: [0.0, 1.0],
            point4: [1.0, 1.0]
        }
    };

  }

  _clampValue(value, min = 0, max = 1) {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * 设置颜色1
   * @param {THREE.Vector3} color1 - 颜色1
   */
  setColor1(color1) {
    this.color1 = new THREE.Vector3(
      this._clampValue(color1[0], 0, 1),
      this._clampValue(color1[1], 0, 1),
      this._clampValue(color1[2], 0, 1)
    );
  }

  /**
   * 设置颜色2
   * @param {THREE.Vector3} color2 - 颜色2
   */
  setColor2(color2) {
    this.color2 = new THREE.Vector3(
      this._clampValue(color2[0], 0, 1),
      this._clampValue(color2[1], 0, 1),
      this._clampValue(color2[2], 0, 1)
    );
  }

  /**
   * 设置颜色3
   * @param {THREE.Vector3} color3 - 颜色3
   */
  setColor3(color3) {
    this.color3 = new THREE.Vector3(
      this._clampValue(color3[0], 0, 1),
      this._clampValue(color3[1], 0, 1),
      this._clampValue(color3[2], 0, 1)
    );
  }

  /**
   * 设置颜色4
   * @param {THREE.Vector3} color4 - 颜色4
   */
  setColor4(color4) {
    this.color4 = new THREE.Vector3(
      this._clampValue(color4[0], 0, 1),
      this._clampValue(color4[1], 0, 1),
      this._clampValue(color4[2], 0, 1)
    );
  }

  /**
   * 设置点1
   * @param {THREE.Vector2} point1 - 点1
   */
  setPoint1(point1) {
    this.point1 = new THREE.Vector2(
      this._clampValue(point1[0], 0, 1),
      this._clampValue(point1[1], 0, 1)
    );
  }

  /**
   * 设置点2
   * @param {THREE.Vector2} point2 - 点2
   */
  setPoint2(point2) {
    this.point2 = new THREE.Vector2(
      this._clampValue(point2[0], 0, 1),
      this._clampValue(point2[1], 0, 1)
    );
  }

  /**
   * 设置点3
   * @param {THREE.Vector2} point3 - 点3
   */
  setPoint3(point3) {
    this.point3 = new THREE.Vector2(
      this._clampValue(point3[0], 0, 1),
      this._clampValue(point3[1], 0, 1)
    );
  }

  /**
   * 设置点4
   * @param {THREE.Vector2} point4 - 点4
   */
  setPoint4(point4) {
    this.point4 = new THREE.Vector2(
      this._clampValue(point4[0], 0, 1),
      this._clampValue(point4[1], 0, 1)
    );
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
    this.material.uniforms.color1.value = this.color1;
    this.material.uniforms.color2.value = this.color2;
    this.material.uniforms.color3.value = this.color3;
    this.material.uniforms.color4.value = this.color4;
    this.material.uniforms.point1.value = this.point1;
    this.material.uniforms.point2.value = this.point2;
    this.material.uniforms.point3.value = this.point3;
    this.material.uniforms.point4.value = this.point4;
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

/*threeJS*/ module.exports = { FourColorGradientShaderPass }; 
// /*Effect*/ exports.FourColorGradientShaderPass = FourColorGradientShaderPass;
