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
        name: 'ColoramaShaderPass',
        uniforms: {
            'tDiffuse': { value: null },
            'color1': { value: new THREE.Vector3(1.0, 0.0, 0.0) },
            'color2': { value: new THREE.Vector3(0.0, 1.0, 0.0) },
            'color3': { value: new THREE.Vector3(0.0, 0.0, 1.0) },
            'point1': { value: 0.0 },
            'point2': { value: 0.5 },
            'point3': { value: 1.0 },
            'intensity': { value: 1.0 },
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        transparent: true,
        side: THREE.DoubleSide
    };
}

/**
 * ColoramaShaderPass类
 * 继承自Three.js的ShaderPass，提供Colorama效果
 */
class ColoramaShaderPass extends ShaderPass {
  constructor() {
    super(createShader());
    
    // 设置默认参数
    this.color1 = new THREE.Vector3(1.0, 0.0, 0.0);
    this.color2 = new THREE.Vector3(0.0, 1.0, 0.0);
    this.color3 = new THREE.Vector3(0.0, 0.0, 1.0);
    this.point1 = 0.0;
    this.point2 = 0.5;
    this.point3 = 1.0;
    this.intensity = 1.0;

    // LumiColorama 预设配置
    this.presets = {
        // 无效果
        none: {
            intensity: 0,
        },

        // 暖色调预设 - 温暖舒适的色彩
        warm: {
            intensity: 0.5,
            color1: [0.2, 0.1, 0.4],  // 深紫色
            color2: [1.0, 0.6, 0.2],  // 橙色
            color3: [1.0, 0.9, 0.7],  // 浅黄色
            point1: 0.0,
            point2: 0.5,
            point3: 1.0,
        },
        
        // 冷色调预设 - 冷静科技的色彩
        cold: {
            intensity: 0.7,
            color1: [0.1, 0.2, 0.6],  // 深蓝色
            color2: [0.2, 0.8, 0.9],  // 青色
            color3: [0.8, 0.9, 1.0],  // 浅蓝色
            point1: 0.0,
            point2: 0.5,
            point3: 1.0,
        },
        
        // 强烈对比预设 - 高饱和度色彩
        high: {
            intensity: 1.0,
            color1: [1.0, 0.0, 0.0],  // 红色
            color2: [0.0, 1.0, 0.0],  // 绿色
            color3: [0.0, 0.0, 1.0],  // 蓝色
            point1: 0.0,
            point2: 0.5,
            point3: 1.0,
        }
    };

  }

  _clampValue(value, min = 0, max = 1) {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * 设置强度
   * @param {number} intensity - 强度值 (0.0到1.0)
   */
  setIntensity(intensity) {
    this.intensity = this._clampValue(intensity);
  }

  /**
   * 设置颜色1
   * @param {THREE.Vector3} color1 - 颜色1
   */
  setColor1(color1) {
    this.color1 = new THREE.Vector3(
      this._clampValue(color1[0]),
      this._clampValue(color1[1]),
      this._clampValue(color1[2])
    );
  }
  /**
   * 设置颜色2
   * @param {THREE.Vector3} color2 - 颜色2
   */
  setColor2(color2) {
    this.color2 = new THREE.Vector3(
      this._clampValue(color2[0]),
      this._clampValue(color2[1]),
      this._clampValue(color2[2])
    );
  }
  /**
   * 设置颜色3
   * @param {THREE.Vector3} color3 - 颜色3
   */
  setColor3(color3) {
    this.color3 = new THREE.Vector3(
      this._clampValue(color3[0]),
      this._clampValue(color3[1]),
      this._clampValue(color3[2])
    );
  }
  /**
   * 设置点1
   * @param {number} point1 - 点1
   */
  setPoint1(point1) {
    this.point1 = this._clampValue(point1);
  }
  /**
   * 设置点2
   * @param {number} point2 - 点2
   */
  setPoint2(point2) {
    this.point2 = this._clampValue(point2);
  }
  /**
   * 设置点3
   * @param {number} point3 - 点3
   */
  setPoint3(point3) {
    this.point3 = this._clampValue(point3);
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
    this.material.uniforms.point1.value = this.point1;
    this.material.uniforms.point2.value = this.point2;
    this.material.uniforms.point3.value = this.point3;
    this.material.uniforms.intensity.value = this.intensity;
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

/*threeJS*/ module.exports = { ColoramaShaderPass };
// /*Effect*/ exports.ColoramaShaderPass = ColoramaShaderPass;
