
/*threeJS*/ const THREE = require('three');
/*threeJS*/ const { ShaderPass } = require('three/examples/jsm/postprocessing/ShaderPass.js');

// /*Effect*/ const THREE = require('../../ThreeJS/three-amg-wrapper.js').THREE;
// /*Effect*/ const { ShaderPass } = require('../../ThreeJS/ShaderPass.js');

// 导入Shader文件
const vertexSource = require('./shaders/warpVert.js').source;
const fragmentSource = require('./shaders/warpFrag.js').source;

// 15种变形样式定义
const WarpStyles = {
    'Arc': 0,
    'Arc Lower': 1,
    'Arc Upper': 2,
    'Arch': 3,
    'Bulge': 4,
    'Shell Lower': 5,
    'Shell Upper': 6,
    'Flag': 7,
    'Wave': 8,
    'Fish': 9,
    'Rise': 10,
    'FishEye': 11,
    'Inflate': 12,
    'Twist': 13,
    'Squeeze': 14
};

// 轴向定义
const WarpAxis = {
    'Horizontal': 0,
    'Vertical': 1
};

// 创建Shader
function createShader() {
    // 适配Three.js的shader代码
    const vertexShader = vertexSource
        .replace(/attribute /g, '//attribute ')
        .replace(/a_position/g, 'position')
        .replace(/a_texcoord0/g, 'uv')
        .replace(/vec2 _t113 = position;/g, 'vec2 _t113 = position.xy;')
        .replace(/gl_Position = vec4\(_t113, 0.0, 1.0\);/g, 'gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);')
        .replace(/v_uv = a_texcoord0;/g, 'v_uv = uv;');

    const fragmentShader = fragmentSource
        .replace(/u_inputTex/g, 'tDiffuse')
        .replace(/gl_FragData\[0\]/g, 'gl_FragColor');

    return {
        name: 'WarpShaderPass',
        uniforms: {
            'tDiffuse': { value: null },
            'u_warpStyleVert': { value: 0 },
            'u_warpStyleFrag': { value: 0 },
            'u_axisVert': { value: 0 },
            'u_axisFrag': { value: 0 },
            'u_bend': { value: 0.0 },
            'u_ScreenParams': { value: new THREE.Vector4(1.0, 1.0, 1.0, 1.0) },
            'u_intensity': { value: 1.0 }
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
    };
}

// 创建WarpShaderPass
class WarpShaderPass extends ShaderPass {
    constructor() {
        super(createShader());

        // 参数默认值 - 对应AEInfo.json中的配置
        this.params = {
            warpStyle: 'Arc',        // 默认弧形
            warpAxis: 'Horizontal',  // 默认水平轴
            bend: 50,                // 默认弯曲强度50 (范围-100到100)
            intensity: 1.0           // 添加intensity参数，默认值为1.0
        };

        // 内部常量
        this.constants = {
            bendRange: 100  // 弯曲强度范围
        };

        this.presets = {
            // 无效果
            none: {
                intensity: 0
            },

            // 轻度弧形
            low: {
                intensity: 1.0,
                warpStyle: 'Arc',
                warpAxis: 'Horizontal',
                bend: 25
            },
            
            // 中等弧形
            medium: {
                intensity: 1.0,
                warpStyle: 'Arc',
                warpAxis: 'Horizontal',
                bend: 50
            },
            
            // 强烈弧形
            high: {
                intensity: 1.0,
                warpStyle: 'Arc',
                warpAxis: 'Horizontal',
                bend: 75
            },
        };
    }

    // 渲染函数，对齐Lua中onUpdate的逻辑
    render(renderer, writeBuffer, readBuffer, deltaTime, maskActive) {
        const textureWidth = readBuffer.width;
        const textureHeight = readBuffer.height;
        
        // 设置输入纹理
        this.uniforms.tDiffuse.value = readBuffer.texture;
        
        // 弯曲强度归一化 (0-100 -> 0-1)
        const normalizedBend = this.params.bend / this.constants.bendRange;
        this.uniforms.u_bend.value = normalizedBend;
        
        // 设置变形样式索引
        const styleIndex = WarpStyles[this.params.warpStyle] || 0;
        this.uniforms.u_warpStyleVert.value = styleIndex;
        this.uniforms.u_warpStyleFrag.value = styleIndex;
        
        // 设置轴向
        const axisIndex = WarpAxis[this.params.warpAxis] || 0;
        this.uniforms.u_axisVert.value = axisIndex;
        this.uniforms.u_axisFrag.value = axisIndex;
        
        // 设置屏幕参数
        this.uniforms.u_ScreenParams.value.set(
            textureWidth, 
            textureHeight, 
            1.0 / textureWidth, 
            1.0 / textureHeight
        );
        
        // 设置intensity参数
        this.uniforms.u_intensity.value = this._clampValue(this.params.intensity, 0.0, 1.0);

        super.render(renderer, writeBuffer, readBuffer, deltaTime, maskActive);
    }

    // 参数范围限制函数
    _clampValue(value, min = 0, max = 1) {
        return Math.max(min, Math.min(max, value));
    }

    // 设置变形样式
    setWarpStyle(style) {
        if (WarpStyles.hasOwnProperty(style)) {
            this.params.warpStyle = style;
        } else {
            console.warn(`Invalid warp style: ${style}. Using default 'Arc'.`);
            this.params.warpStyle = 'Arc';
        }
    }

    // 设置变形轴向
    setWarpAxis(axis) {
        if (WarpAxis.hasOwnProperty(axis)) {
            this.params.warpAxis = axis;
        } else {
            console.warn(`Invalid warp axis: ${axis}. Using default 'Horizontal'.`);
            this.params.warpAxis = 'Horizontal';
        }
    }

    // 设置弯曲强度
    setBend(bend) {
        this.params.bend = this._clampValue(bend, -100, 100);
    }

    // 添加设置intensity的方法
    setIntensity(intensity) {
        this.params.intensity = this._clampValue(intensity, 0.0, 1.0);
    }

    // 添加获取intensity的方法
    getIntensity() {
        return this.params.intensity;
    }

    // 获取当前参数
    getParams() {
        return {
            warpStyle: this.params.warpStyle,
            warpAxis: this.params.warpAxis,
            bend: this.params.bend,
            intensity: this.params.intensity
        };
    }

    // 批量设置参数
    setParams(params) {
        if (params.warpStyle !== undefined) {
            this.setWarpStyle(params.warpStyle);
        }
        if (params.warpAxis !== undefined) {
            this.setWarpAxis(params.warpAxis);
        }
        if (params.bend !== undefined) {
            this.setBend(params.bend);
        }
    }

    // 获取所有可用的变形样式
    static getAvailableWarpStyles() {
        return Object.keys(WarpStyles);
    }

    // 获取所有可用的轴向
    static getAvailableWarpAxis() {
        return Object.keys(WarpAxis);
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

/*threeJS*/ module.exports = { WarpShaderPass };
// /*Effect*/ exports.WarpShaderPass = WarpShaderPass;
