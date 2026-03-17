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
        name: 'HalftoneShaderPass',
        uniforms: {
            'tDiffuse': { value: null },
            'progress': { value: 0.1 },
            'ratio': { value: 1.0 },
            'colorMode': { value: 0.0 },
            'blackDots': { value: 1.0 },
            'dotFreq': { value: 60.0 },
            'rotationAngle': { value: -30.0 },
            'dotsRelativeWidth': { value: 1.0 },
            'dotsSharpen': { value: 1.0 },
            'dotsLighten': { value: 0.0 },
            'color1': { value: new THREE.Vector3(1.0, 1.0, 1.0) },
            'color2': { value: new THREE.Vector3(0.0, 0.0, 0.0) },
            'dotsShift': { value: new THREE.Vector2(0.0, 0.0) },
            'alternateShift': { value: new THREE.Vector2(0.0, 0.0) },
            'redOffsetX': { value: 0.0 },
            'redOffsetY': { value: 0.25 },
            'greenOffsetX': { value: 0.0 },
            'greenOffsetY': { value: 0.0 },
            'blueOffsetX': { value: 0.0 },
            'blueOffsetY': { value: -0.25 },
            'intensity': { value: 1.0 } // 添加intensity uniform
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        transparent: true,
        side: THREE.DoubleSide
    };
}

/**
 * HalftoneShaderPass类
 * 继承自Three.js的ShaderPass，提供Halftone效果
 */
class HalftoneShaderPass extends ShaderPass {
  constructor() {
    super(createShader());
    
    // 设置默认参数
    this.colorMode = 0.0;
    this.blackDots = 1.0;
    this.dotFreq = 60.0;
    this.rotationAngle = -30.0;
    this.dotsRelativeWidth = 1.0;
    this.dotsSharpen = 1.0;
    this.dotsLighten = 0.0;
    this.color1 = new THREE.Vector3(1.0, 1.0, 1.0);
    this.color2 = new THREE.Vector3(0.0, 0.0, 0.0);
    this.dotsShift = new THREE.Vector2(0.0, 0.0);
    this.alternateShift = new THREE.Vector2(0.0, 0.0);
    this.redOffsetX = 0.0;
    this.redOffsetY = 0.25;
    this.greenOffsetX = 0.0;
    this.greenOffsetY = 0.0;
    this.blueOffsetX = 0.0;
    this.blueOffsetY = -0.25;
    this.intensity = 1.0; // 添加intensity属性

    // LumiHalftone预设配置
    this.presets = {
        // 无效果
        none: {
            intensity: 0,
        },

        // 经典报纸风格
        newspaper: {
            intensity: 0.8,
            colorMode: 0,
            dotFreq: 300,
            rotationAngle: 45,
            dotsRelativeWidth: 60,
            dotsSharpen: 0.7
        },
        
        // 彩色半色调
        color_halftone: {
            intensity: 0.6,
            colorMode: 2,
            dotFreq: 200,
            rotationAngle: 15,
            dotsRelativeWidth: 55,
            dotsSharpen: 0.6
        },
        
        // 粗糙印刷
        rough_print: {
            intensity: 1.0,
            colorMode: 1,
            dotFreq: 150,
            rotationAngle: 30,
            dotsRelativeWidth: 70,
            dotsSharpen: 0.3
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
    this.intensity = this._clampValue(intensity, 0.0, 1.0);
  }

  /**
   * 设置颜色模式
   * @param {number} colorMode - 颜色模式
   */
  setColorMode(colorMode) {
    this.colorMode = this._clampValue(colorMode, 0, 2);
  }
  /**
   * 设置黑点
   * @param {number} blackDots - 黑点
   */
  setBlackDots(blackDots) {
    this.blackDots = this._clampValue(blackDots, 0, 1);
  }
  /**
   * 设置点频率
   * @param {number} dotFreq - 点频率
   */
  setDotFreq(dotFreq) {
    this.dotFreq = this._clampValue(dotFreq, 0, 2000.0);
  }
  /**
   * 设置旋转角度
   * @param {number} rotationAngle - 旋转角度
   */
  setRotationAngle(rotationAngle) {
    this.rotationAngle = this._clampValue(rotationAngle, 0, 360);
  }
  /**
   * 设置点相对宽度
   * @param {number} dotsRelativeWidth - 点相对宽度
   */
  setDotsRelativeWidth(dotsRelativeWidth) {
    this.dotsRelativeWidth = this._clampValue(dotsRelativeWidth, 0, 100);
  }
  /**
   * 设置点锐化
   * @param {number} dotsSharpen - 点锐化
   */
  setDotsSharpen(dotsSharpen) {
    this.dotsSharpen = this._clampValue(dotsSharpen, 0, 1);
  }
  /**
   * 设置点变亮
   * @param {number} dotsLighten - 点变亮
   */
  setDotsLighten(dotsLighten) {
    this.dotsLighten = this._clampValue(dotsLighten, -1, 1);
  }
  /**
   * 设置红色X偏移
   * @param {number} redOffsetX - 红色X偏移
   */
  setRedOffsetX(redOffsetX) {
    this.redOffsetX = this._clampValue(redOffsetX, -1, 1);
  }
  /**
   * 设置红色Y偏移
   * @param {number} redOffsetY - 红色Y偏移
   */
  setRedOffsetY(redOffsetY) {
    this.redOffsetY = this._clampValue(redOffsetY, -1, 1);
  }
  /**
   * 设置绿色X偏移
   * @param {number} greenOffsetX - 绿色X偏移
   */
  setGreenOffsetX(greenOffsetX) {
    this.greenOffsetX = this._clampValue(greenOffsetX, -1, 1);
  }
  /**
   * 设置绿色Y偏移
   * @param {number} greenOffsetY - 绿色Y偏移
   */
  setGreenOffsetY(greenOffsetY) {
    this.greenOffsetY = this._clampValue(greenOffsetY, -1, 1);
  }
  /**
   * 设置蓝色X偏移
   * @param {number} blueOffsetX - 蓝色X偏移
   */
  setBlueOffsetX(blueOffsetX) {
    this.blueOffsetX = this._clampValue(blueOffsetX, -1, 1);
  }
  /**
   * 设置蓝色Y偏移
   * @param {number} blueOffsetY - 蓝色Y偏移
   */
  setBlueOffsetY(blueOffsetY) {
    this.blueOffsetY = this._clampValue(blueOffsetY, -1, 1);
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
   * 设置点偏移
   * @param {THREE.Vector2} dotsShift - 点偏移
   */
  setDotsShift(dotsShift) {
    this.dotsShift = new THREE.Vector2(
      this._clampValue(dotsShift[0], 0, 1),
      this._clampValue(dotsShift[1], 0, 1)
    );
  }
  /**
   * 设置交替偏移
   * @param {THREE.Vector2} alternateShift - 交替偏移
   */
  setAlternateShift(alternateShift) {
    this.alternateShift = new THREE.Vector2(
      this._clampValue(alternateShift[0], 0, 1),
      this._clampValue(alternateShift[1], 0, 1)
    );
  }
  /**
   * 设置红色X偏移
   * @param {number} redOffsetX - 红色X偏移
   */
  setRedoffsetx(redOffsetX) {
    this.redOffsetX = redOffsetX;
  }
  /**
   * 设置红色Y偏移
   * @param {number} redOffsetY - 红色Y偏移
   */
  setRedoffsety(redOffsetY) {
    this.redOffsetY = redOffsetY;
  }
  /**
   * 设置绿色X偏移
   * @param {number} greenOffsetX - 绿色X偏移
   */
  setGreenoffsetx(greenOffsetX) {
    this.greenOffsetX = greenOffsetX;
  }
  /**
   * 设置绿色Y偏移
   * @param {number} greenOffsetY - 绿色Y偏移
   */
  setGreenoffsety(greenOffsetY) {
    this.greenOffsetY = greenOffsetY;
  }
  /**
   * 设置蓝色X偏移
   * @param {number} blueOffsetX - 蓝色X偏移
   */
  setBlueoffsetx(blueOffsetX) {
    this.blueOffsetX = blueOffsetX;
  }
  /**
   * 设置蓝色Y偏移
   * @param {number} blueOffsetY - 蓝色Y偏移
   */
  setBlueoffsety(blueOffsetY) {
    this.blueOffsetY = blueOffsetY;
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
    this.material.uniforms.colorMode.value = this.colorMode;
    this.material.uniforms.blackDots.value = this.blackDots;
    this.material.uniforms.dotFreq.value = this.dotFreq;
    this.material.uniforms.rotationAngle.value = this.rotationAngle;
    this.material.uniforms.dotsRelativeWidth.value = this.dotsRelativeWidth;
    this.material.uniforms.dotsSharpen.value = this.dotsSharpen;
    this.material.uniforms.dotsLighten.value = this.dotsLighten;
    this.material.uniforms.color1.value = this.color1;
    this.material.uniforms.color2.value = this.color2;
    this.material.uniforms.dotsShift.value = this.dotsShift;
    this.material.uniforms.alternateShift.value = this.alternateShift;
    this.material.uniforms.redOffsetX.value = this.redOffsetX;
    this.material.uniforms.redOffsetY.value = this.redOffsetY;
    this.material.uniforms.greenOffsetX.value = this.greenOffsetX;
    this.material.uniforms.greenOffsetY.value = this.greenOffsetY;
    this.material.uniforms.blueOffsetX.value = this.blueOffsetX;
    this.material.uniforms.blueOffsetY.value = this.blueOffsetY;
    this.material.uniforms.intensity.value = this.intensity; // 添加intensity uniform设置
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

/*threeJS*/ module.exports = { HalftoneShaderPass };
// /*Effect*/ exports.HalftoneShaderPass = HalftoneShaderPass;
