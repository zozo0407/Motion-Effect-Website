/*threeJS*/ const THREE = require('three');
/*threeJS*/ const { ShaderPass } = require('three/examples/jsm/postprocessing/ShaderPass.js');

// /*Effect*/ const THREE = require('../../ThreeJS/three-amg-wrapper.js').THREE;
// /*Effect*/ const { ShaderPass } = require('../../ThreeJS/ShaderPass.js');

// 导入着色器文件
const shaderVertSource = require('./shaders/shaderVert.js').source;
const shaderFragSource = require('./shaders/shaderFrag.js').source;

function createShader() {
    const vertexShader = shaderVertSource;
    // 将输入纹理替换成tDiffuse
    const fragmentShader = shaderFragSource
        .replace(/texture1/g, 'tDiffuse');

    return {
        name: 'TwirlShaderPass',
        uniforms: {
            'tDiffuse': { value: null },
            'progress': { value: 0.5 },
            'ratio': { value: 1.0 },
            'center': { value: new THREE.Vector2(0.5, 0.5) }, // 旋涡中心
            'radius': { value: 0.3 }, // 影响半径
            'angle': { value: 180.0 }, // 最大旋转角度
            'strength': { value: 1.0 } // 效果强度
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        transparent: true,
        side: THREE.DoubleSide
    };
}

/**
 * Twirl旋涡扭曲ShaderPass类
 * 继承自Three.js的ShaderPass，提供旋涡扭曲变形效果
 */
class TwirlShaderPass extends ShaderPass {
    constructor() {
        super(createShader());
        
        // 设置默认参数 - 确保效果可见
        this.center = new THREE.Vector2(0.5, 0.5);
        this.radius = 0.3;
        this.angle = 180.0;
        this.intensity = 1.0;

        this.presets = {
            // 无效果
            none: {
                intensity: 0
            },

            // 轻度旋涡
            low: {
                intensity: 1.0,
                center: [0.5, 0.5],
                radius: 0.2,
                angle: 90.0
            },
            
            // 中等旋涡
            medium: {
                intensity: 1.0,
                center: [0.5, 0.5],
                radius: 0.3,
                angle: 180.0
            },
            
            // 强烈旋涡
            high: {
                intensity: 1.0,
                center: [0.5, 0.5],
                radius: 0.4,
                angle: 270.0
            },

            // 螺旋效果
            spiral: {
                intensity: 1.0,
                center: [0.5, 0.5],
                radius: 0.5,
                angle: 360.0
            }
        };
    }
    
    /**
     * 限制数值在指定范围内
     * @param {number} value - 输入值
     * @param {number} min - 最小值
     * @param {number} max - 最大值
     * @returns {number} 限制后的值
     */
    _clampValue(value, min = 0, max = 1) {
        return Math.max(min, Math.min(max, value));
    }

    /**
     * 设置旋涡中心
     * @param {number} x - X轴中心 (0.0 - 1.0)
     * @param {number} y - Y轴中心 (0.0 - 1.0)
     */
    setCenter(value) {
        const clampedX = this._clampValue(value[0], 0, 1);
        const clampedY = this._clampValue(value[1], 0, 1);
        this.center.set(clampedX, clampedY);
    }

    /**
     * 设置旋涡半径
     * @param {number} radius - 半径 (0.0 - 1.0)
     */
    setRadius(radius) {
        this.radius = this._clampValue(radius, 0, 1);
    }

    /**
     * 设置旋涡角度
     * @param {number} angle - 角度 (0.0 - 360.0)
     */
    setAngle(angle) {
        this.angle = this._clampValue(angle, 0, 360);
    }

    /**
     * 设置旋涡强度
     * @param {number} intensity - 强度 (0.0 - 1.0)
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
        // 更新所有uniform值
        this.material.uniforms.center.value = this.center;
        this.material.uniforms.radius.value = this.radius;
        this.material.uniforms.angle.value = this.angle;
        this.material.uniforms.strength.value = this.intensity;
        
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

/*threeJS*/ module.exports = { TwirlShaderPass };
// /*Effect*/ exports.TwirlShaderPass = TwirlShaderPass;
