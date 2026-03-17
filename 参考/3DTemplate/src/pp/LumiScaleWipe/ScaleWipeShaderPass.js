/*threeJS*/ const THREE = require('three');
/*threeJS*/ const { ShaderPass } = require('three/examples/jsm/postprocessing/ShaderPass.js');

// /*Effect*/ const THREE = require('../../ThreeJS/three-amg-wrapper.js').THREE;
// /*Effect*/ const { ShaderPass } = require('../../ThreeJS/ShaderPass.js');

// 导入Shader
const vertexSource = require('./shaders/scalewipeVert.js').source;
const fragmentSource = require('./shaders/scalewipeFrag.js').source;

// 创建Shader
function createShader() {
    // 适配three.js的shader代码
    const vertexShader = vertexSource
        .replace(/attribute /g, '//attribute ')
        .replace(/a_position/g, 'position')
        .replace(/a_texcoord0/g, 'uv')
        .replace(/v_xy/g, 'v_uv')
        .replace('gl_Position = position;', 'gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);');

    const fragmentShader = fragmentSource
        .replace(/v_xy/g, 'v_uv')
        .replace(/u_inputTex/g, 'tDiffuse')
        .replace(/gl_FragData\[0\]/g, 'gl_FragColor');
        
    return {
        name: 'ScaleWipeShaderPass',
        uniforms: {
            'tDiffuse': { value: null },
            'u_orientation': { value: new THREE.Vector2(1.0, 0.0) },
            'u_center': { value: new THREE.Vector2(0.5, 0.5) },
            'u_stretch': { value: 0.0 },
            'u_size': { value: new THREE.Vector2(1.0, 1.0) },
            'u_intensity': { value: 1.0 },  // 添加intensity uniform
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
    };
}

// 创建ScaleWipeShaderPass
class ScaleWipeShaderPass extends ShaderPass {
    constructor() {
        super(createShader());

        // 参数默认值 - 对应AEInfo.json中的配置
        this.params = {
            stretch: 0.0,                    // 拉伸强度 (-100.0 - 100.0)
            center: new THREE.Vector2(0.5, 0.5),  // 中心点 (0.0 - 1.0)
            direction: 50,                   // 方向角度 (-360 - 360)
            intensity: 1.0,                  // 添加intensity参数
        };

        // 内部常量
        this.constants = {
            DEFAULT_STRETCH: 0.0,
            DEFAULT_CENTER: [0.5, 0.5],
            DEFAULT_DIRECTION: 50,
            MIN_STRETCH: -100.0,
            MAX_STRETCH: 100.0,
            MIN_DIRECTION: -360,
            MAX_DIRECTION: 360,
        };

        this.presets = {
            // 无效果
            none: {
                intensity: 0,
            },

            // 轻度拉伸
            low: {
                intensity: 1,
                stretch: 20.0,
                center: [0.5, 0.5],
                direction: 0
            },
            
            // 中等拉伸
            medium: {
                intensity: 1,
                stretch: 50.0,
                center: [0.5, 0.5],
                direction: 45
            },
            
            // 强烈拉伸
            high: {
                intensity: 1,
                stretch: 80.0,
                center: [0.5, 0.5],
                direction: 90
            },

            // 对角擦除
            diagonal: {
                intensity: 1,
                stretch: 60.0,
                center: [0.3, 0.7],
                direction: 135
            }
        };
    }

    // 渲染函数，对齐Lua中updateMaterial的逻辑
    render(renderer, writeBuffer, readBuffer, deltaTime, maskActive) {
        const textureWidth = readBuffer.width;
        const textureHeight = readBuffer.height;
        
        // 屏幕尺寸归一化 (对应Lua中的逻辑)
        const w = textureWidth;
        const h = textureHeight;
        const b = Math.sqrt(w * w + h * h);  // 对角线长度
        const normalizedW = w / b;
        const normalizedH = h / b;
        
        // 方向计算 (对应Lua中的方向处理逻辑)
        let r;
        if (this.params.stretch >= 0) {
            r = (90 - this.params.direction) * Math.PI / 180;  // 正拉伸
        } else {
            r = (270 - this.params.direction) * Math.PI / 180; // 负拉伸
        }
        const rx = Math.cos(r);
        const ry = Math.sin(r);
        
        // 中心点转换为像素坐标
        const centerX = normalizedW * this.params.center.x;
        const centerY = normalizedH * this.params.center.y;
        
        // 设置uniform值
        this.uniforms.tDiffuse.value = readBuffer.texture;
        this.uniforms.u_size.value.set(normalizedW, normalizedH);
        this.uniforms.u_center.value.set(centerX, centerY);
        this.uniforms.u_orientation.value.set(rx, ry);
        this.uniforms.u_stretch.value = Math.abs(this.params.stretch);  // 传递绝对值
        this.uniforms.u_intensity.value = this.params.intensity;  // 传递intensity值

        super.render(renderer, writeBuffer, readBuffer, deltaTime, maskActive);
    }

    _clampValue(value, min = 0, max = 1) {
        return Math.max(min, Math.min(max, value));
    }

    // 参数设置函数
    setStretch(value) {
        this.params.stretch = this._clampValue(value, this.constants.MIN_STRETCH, this.constants.MAX_STRETCH);
    }

    setCenter(x, y) {
        this.params.center.set(
            this._clampValue(x, 0.0, 1.0),
            this._clampValue(y, 0.0, 1.0)
        );
    }

    setDirection(value) {
        this.params.direction = this._clampValue(value, this.constants.MIN_DIRECTION, this.constants.MAX_DIRECTION);
    }

    // 添加intensity设置方法
    setIntensity(value) {
        this.params.intensity = this._clampValue(value, 0.0, 1.0);
    }

    // 便捷的重置方法
    reset() {
        this.params.stretch = this.constants.DEFAULT_STRETCH;
        this.params.center.set(this.constants.DEFAULT_CENTER[0], this.constants.DEFAULT_CENTER[1]);
        this.params.direction = this.constants.DEFAULT_DIRECTION;
        this.params.intensity = 1.0;  // 重置intensity
    }

    // 获取参数值
    getStretch() {
        return this.params.stretch;
    }

    getCenter() {
        return this.params.center.clone();
    }

    getDirection() {
        return this.params.direction;
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

/*threeJS*/ module.exports = { ScaleWipeShaderPass };
// /*Effect*/ exports.ScaleWipeShaderPass = ScaleWipeShaderPass;
