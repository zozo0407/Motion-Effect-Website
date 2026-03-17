/*threeJS*/ const THREE = require('three');
/*threeJS*/ const { ShaderPass } = require('three/examples/jsm/postprocessing/ShaderPass.js');

// /*Effect*/ const THREE = require('../../ThreeJS/three-amg-wrapper.js').THREE;
// /*Effect*/ const { ShaderPass } = require('../../ThreeJS/ShaderPass.js');

// 导入Shader
const vertexSource = require('./shaders/shaderVert.js').source;
const fragmentSource = require('./shaders/shaderFrag.js').source;

// 创建Shader
function createShader() {
    const vertexShader = vertexSource
        .replace(/attribute /g, '//attribute ')
        .replace(/a_position/g, 'position')
        .replace(/a_texcoord0/g, 'uv')
        .replace(/uv0/g, 'v_uv')
        .replace('sign(vec4(position, 0.0, 1.0))', 'projectionMatrix * modelViewMatrix * vec4(position, 1.0)');

    const fragmentShader = fragmentSource
        .replace(/uv0/g, 'v_uv')
        .replace(/u_InputTex/g, 'tDiffuse')
        .replace(/gl_FragData\[0\]/g, 'gl_FragColor');
        
    return {
        name: 'LensShaderPass',
        uniforms: {
            'tDiffuse': { value: null },
            'u_Radius': { value: 60 },
            'u_Convergence': { value: 100 },
            'u_Center': { value: new THREE.Vector2(0.5, 0.5) },
            'u_ScreenParams': { value: new THREE.Vector2(1920, 1080) },
            'u_Intensity': { value: 1.0 } // 添加intensity uniform
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
    };
}

// 创建LensShaderPass类
class LensShaderPass extends ShaderPass {
    constructor() {
        super(createShader());

        // 参数默认值 - 对应AEInfo.json中的配置
        this.params = {
            radius: { value: 60 },
            convergence: { value: 100 },
            center: { value: new THREE.Vector2(0.5, 0.5) },
        };
        
        // 添加intensity属性，默认值为1.0
        this.intensity = 1.0;

        // LumiLens预设配置
        this.presets = {
            // 无效果
            none: {
                intensity: 0,
            },

            // 鱼眼镜头 -- 低畸变
            fisheye_low: {
                intensity: 1.0,
                radius: 60,
                convergence: 10,
                center: [0.5, 0.5]
            },

            // 鱼眼镜头 -- 中畸变
            fisheye_medium: {
                intensity: 1.0,
                radius: 60,
                convergence: 50,
                center: [0.5, 0.5]
            },
            
            // 鱼眼镜头 -- 高畸变
            fisheye_high: {
                intensity: 1.0,
                radius: 60,
                convergence: 100,
                center: [0.5, 0.5]
            },

            // 枕形畸变
            pincushion: {
                intensity: 1.0,
                radius: 80,
                convergence: -30,
                center: [0.5, 0.5]
            }
        };

    }

    // 渲染函数
    render(renderer, writeBuffer, readBuffer, deltaTime, maskActive) {
        const textureWidth = readBuffer.width;
        const textureHeight = readBuffer.height;
        
        this.uniforms.tDiffuse.value = readBuffer.texture;
        
        // 更新屏幕参数
        this.uniforms.u_ScreenParams.value.set(
            textureWidth, 
            textureHeight, 
            1.0/textureWidth, 
            1.0/textureHeight
        );

        // 设置参数
        this.material.uniforms.u_Radius.value = this.params.radius.value;
        this.material.uniforms.u_Convergence.value = this.params.convergence.value;
        this.material.uniforms.u_Center.value = this.params.center.value;
        this.material.uniforms.u_Intensity.value = this.intensity; // 设置intensity uniform

        super.render(renderer, writeBuffer, readBuffer, deltaTime, maskActive);
    }

    _clampValue(value, min = -1, max = 1) {
        return Math.max(min, Math.min(max, value));
    }

    // 添加setIntensity方法
    setIntensity(intensity) {
        this.intensity = this._clampValue(intensity, 0.0, 1.0);
    }

    /**
     * 设置半径
     * @param {number} radius - 半径
     */
    setRadius(radius) {
        this.params.radius.value = this._clampValue(radius, 0, 500);
    }

    /**
     * 设置收敛
     * @param {number} convergence - 收敛
     */
    setConvergence(convergence) {
        this.params.convergence.value = this._clampValue(convergence, -100, 100);
    }

    /**
     * 设置中心
     * @param {THREE.Vector2} center - 中心
     */
    setCenter(center) {
        this.params.center.value = new THREE.Vector2(this._clampValue(center[0], 0, 1), this._clampValue(center[1], 0, 1));
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

/*threeJS*/ module.exports = { LensShaderPass };
// /*Effect*/ exports.LensShaderPass = LensShaderPass;
