/*threeJS*/ const THREE = require('three');
/*threeJS*/ const { ShaderPass } = require('three/examples/jsm/postprocessing/ShaderPass.js');

// /*Effect*/ const THREE = require('../../ThreeJS/three-amg-wrapper.js').THREE;
// /*Effect*/ const { ShaderPass } = require('../../ThreeJS/ShaderPass.js');

// 导入Shader
const vertexSource = require('./shaders/geometryVert.js').source;
const fragmentSource = require('./shaders/geometryFrag.js').source;

// 创建Shader
function createShader() {
    // 适配three.js的shader代码
    const vertexShader = vertexSource
        .replace(/attribute /g, '//attribute ')
        .replace(/a_position/g, 'position')
        .replace(/a_texcoord0/g, 'uv')
        .replace('sign(vec4(position, 0.0, 1.0))', 'projectionMatrix * modelViewMatrix * vec4(position, 1.0)');

    const fragmentShader = fragmentSource
        .replace(/u_inputTex/g, 'tDiffuse')
        .replace(/gl_FragData\[0\]/g, 'gl_FragColor');
        
    return {
        name: 'GeometryShaderPass',
        uniforms: {
            'tDiffuse': { value: null },
            'u_rotation': { value: 0.0 },
            'u_rotationAxis': { value: 0.0 },
            'u_intensity': { value: 1.0 }
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
    };
}

// 创建GeometryShaderPass
class GeometryShaderPass extends ShaderPass {
    constructor() {
        super(createShader());

        // 参数默认值 - 对应AEInfo.json中的配置
        this.params = {
            rotation: 2.7,        // 默认倾斜角度（度）
            rotationAxis: 270,    // 默认倾斜轴角度（度）
            intensity: 1.0        // 强度控制 (0.0-1.0)
        };

        // 内部常量
        this.constants = {
            RADIAN_FACTOR: Math.PI / 180,  // 角度转弧度
            EPSILON: 0.01,                 // 奇点处理阈值
            HALF_PI: Math.PI / 2          // π/2，用于奇点检测
        };

        // LumiGeometry预设配置
        this.presets = {
            // 无效果
            none: {
                intensity: 0,
                rotation: 0,
                rotationAxis: 0
            },

            // 左倾斜
            tilt_left: {
                intensity: 1.0,
                rotation: 25,
                rotationAxis: 0
            },

            // 右倾斜
            tilt_right: {
                intensity: 1.0,
                rotation: -25,
                rotationAxis: 0
            }
        };

    }

    // 渲染函数，对齐Lua中onUpdate的逻辑
    render(renderer, writeBuffer, readBuffer, deltaTime, maskActive) {
        const textureWidth = readBuffer.width;
        const textureHeight = readBuffer.height;
        
        this.uniforms.tDiffuse.value = readBuffer.texture;
        
        // 角度转弧度处理
        this.uniforms.u_rotation.value = this.params.rotation * this.constants.RADIAN_FACTOR;
        
        // rotationAxis的奇点处理 - 避免tan函数在90度倍数时的奇点问题
        let rotationAxis = this.params.rotationAxis;
        if (Math.abs(rotationAxis % 90) < this.constants.EPSILON) {
            rotationAxis = rotationAxis - this.constants.EPSILON;
        }
        this.uniforms.u_rotationAxis.value = rotationAxis * this.constants.RADIAN_FACTOR;
        
        // 设置强度值
        this.uniforms.u_intensity.value = this.params.intensity;

        super.render(renderer, writeBuffer, readBuffer, deltaTime, maskActive);
    }

    // 参数范围限制函数
    _clampAngle(value) {
        // 将角度限制在0-360度范围内
        return ((value % 360) + 360) % 360;
    }

    // 参数设置函数
    setRotation(rotation) {
        this.params.rotation = this._clampAngle(rotation);
    }

    setRotationAxis(rotationAxis) {
        this.params.rotationAxis = this._clampAngle(rotationAxis);
    }

    setIntensity(intensity) {
        this.params.intensity = Math.max(0.0, Math.min(1.0, intensity));
    }

    // 获取参数值
    getRotation() {
        return this.params.rotation;
    }

    getRotationAxis() {
        return this.params.rotationAxis;
    }

    // 重置为默认值
    resetToDefault() {
        this.params.rotation = 2.7;
        this.params.rotationAxis = 270;
        this.params.intensity = 1.0;
    }

    // 预设效果
    setPreset(presetName) {
        switch (presetName) {
            case 'default':
                this.resetToDefault();
                break;
            case 'strong_tilt':
                this.params.rotation = 15.0;
                this.params.rotationAxis = 45;
                break;
            case 'perspective_left':
                this.params.rotation = 8.0;
                this.params.rotationAxis = 180;
                break;
            case 'perspective_right':
                this.params.rotation = 8.0;
                this.params.rotationAxis = 0;
                break;
            case 'vertical_tilt':
                this.params.rotation = 10.0;
                this.params.rotationAxis = 90;
                break;
            default:
                this.resetToDefault();
        }
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

/*threeJS*/ module.exports = { GeometryShaderPass };
// /*Effect*/ exports.GeometryShaderPass = GeometryShaderPass;
