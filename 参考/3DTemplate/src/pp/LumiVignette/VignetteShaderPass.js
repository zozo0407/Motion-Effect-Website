
/*threeJS*/ const THREE = require('three');
/*threeJS*/ const { ShaderPass } = require('three/examples/jsm/postprocessing/ShaderPass.js');

// /*Effect*/ const THREE = require('../../ThreeJS/three-amg-wrapper.js').THREE;
// /*Effect*/ const { ShaderPass } = require('../../ThreeJS/ShaderPass.js');

// 导入Shader文件
const vertexSource = require('./shaders/vignetteVert.js').source;
const fragmentSource = require('./shaders/vignetteFrag.js').source;

// 创建Shader
function createShader() {
    // 适配three.js的shader代码
    const vertexShader = vertexSource
        .replace(/attribute /g, '//attribute ')
        .replace(/a_position/g, 'position')
        .replace(/a_texcoord0/g, 'uv')
        .replace(/varying vec2 v_uv;/g, 'varying vec2 v_uv;')
        .replace('sign(vec4(position, 0.0, 1.0))', 'projectionMatrix * modelViewMatrix * vec4(position, 1.0)');

    const fragmentShader = fragmentSource
        .replace(/varying vec2 v_uv;/g, 'varying vec2 v_uv;')
        .replace(/u_inputTexture/g, 'tDiffuse')
        .replace(/gl_FragData\[0\]/g, 'gl_FragColor');
        
    return {
        name: 'VignetteShaderPass',
        uniforms: {
            'tDiffuse': { value: null },
            'u_highlight': { value: 0.0 },
            'u_ScreenParams': { value: new THREE.Vector4() },
            'u_geometricMeanSize': { value: 1.0 },
            'u_center': { value: new THREE.Vector2(0.5, 0.5) },
            'u_opacity': { value: 0.0 },
            'u_midpoint': { value: 0.0 },
            'u_roundness': { value: 0.0 },
            'u_featherPivot': { value: 0.5 },
            'u_featherPower': { value: 1.0 },
            'u_halfDiagonalLength': { value: Math.sqrt(2) * 0.5 },
            'u_color': { value: new THREE.Vector3(0, 0, 0) },
            'u_transparent': { value: 0 },
            'u_intensity': { value: 1.0 }
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
    };
}

// Vignette ShaderPass类
class VignetteShaderPass extends ShaderPass {
    constructor() {
        super(createShader());

        // 参数默认值 - 对应AEInfo.json中的配置
        this.params = {
            color: new THREE.Color(0, 0, 0),
            amount: 0.0,
            midpoint: 0.0,
            roundness: 0.0,
            feather: 0.5,
            highlight: 0.0,
            transparent: false,
            intensity: 1.0
        };

        // 内部常量
        this.constants = {
            HalfDiagonalLength: Math.sqrt(2) * 0.5,  // √2/2
            Center: new THREE.Vector2(0.5, 0.5)
        };

        this.presets = {
            // 无效果
            none: {
                intensity: 0
            },

            // 轻度暗角
            low: {
                intensity: 1.0,
                color: [0, 0, 0],
                amount: 0.3,
                midpoint: 0.2,
                roundness: 0.0,
                feather: 0.7,
                highlight: 0.0,
                transparent: false
            },
            
            // 中等暗角
            medium: {
                intensity: 1.0,
                color: [0, 0, 0],
                amount: 0.5,
                midpoint: 0.3,
                roundness: 0.0,
                feather: 0.5,
                highlight: 0.0,
                transparent: false
            },
            
            // 强烈暗角
            high: {
                intensity: 1.0,
                color: [0, 0, 0],
                amount: 0.8,
                midpoint: 0.5,
                roundness: 0.0,
                feather: 0.3,
                highlight: 0.0,
                transparent: false
            },
        };
    }

    // 数学函数移植 - 基于Lua代码分析
    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    remap(value, oldMin, oldMax, newMin, newMax) {
        return newMin + (value - oldMin) * (newMax - newMin) / (oldMax - oldMin);
    }

    // 不透明度映射 - 7次多项式函数
    getOpacity(amount) {
        const x = amount;
        const x2 = x * x, x3 = x2 * x, x4 = x3 * x, x5 = x4 * x, x6 = x5 * x, x7 = x6 * x;
        const opacity = 0.791515 * x + (-0.120212) * x2 + 19.1491 * x3 + (-64.6869) * x4 + 
                       88.4132 * x5 + (-56.7089) * x6 + 14.1622 * x7;
        return this.clamp(opacity, 0.0, 1.0);
    }

    // 中点重映射
    getMidpoint(midpoint) {
        return 0.5 * midpoint + 0.15 * midpoint * midpoint;
    }

    // 羽化参数计算
    getFeatherParams(feather) {
        const pivot = 0.5 - 0.17 * feather * feather;
        let p = 1;
        if (feather >= 0.5) {
            p = 0.4 * feather;
        } else {
            p = 0.38 * feather + 0.01;
        }
        const power = 1.0 / p;
        return { pivot, power };
    }

    // 几何平均尺寸计算
    getGeometricMeanSize(width, height) {
        let res = Math.sqrt(width * height);
        let ratio = 1.0;
        if (width <= height) {
            ratio = Math.pow(height / width, 0.25);
        } else {
            ratio = Math.pow(width / height, 0.25);
        }
        res = res * ratio;
        return res;
    }

    // 中点缩放计算（基于圆度）
    getMidpointScaleFromRoundness(roundness, width, height) {
        if (roundness >= 0) {
            return 1.0;
        }
        const aspectRatio = width / height;
        const scale = Math.min(aspectRatio, 1.0 / aspectRatio);
        return this.remap(Math.abs(roundness), 0, 1, 1.0, scale);
    }

    // 羽化缩放计算（基于中点）
    getFeatherScaleFromMidpoint(midpoint) {
        return this.remap(midpoint, 0, 1, 1.0, 0.3);
    }

    // 羽化缩放计算（基于圆度）
    getFeatherScaleFromRoundness(roundness, width, height) {
        if (roundness >= 0) {
            return 1.0;
        }
        const aspectRatio = width / height;
        const scale = Math.min(aspectRatio, 1.0 / aspectRatio);
        return this.remap(Math.abs(roundness), 0, 1, 1.0, scale);
    }

    // 渲染函数
    render(renderer, writeBuffer, readBuffer, deltaTime, maskActive) {
        const textureWidth = readBuffer.width;
        const textureHeight = readBuffer.height;
        
        // 参数预处理和范围限制
        const amount = this.clamp(this.params.amount, 0.0, 1.0);
        const midpoint = this.clamp(this.params.midpoint, 0.0, 1.0);
        const roundness = this.clamp(this.params.roundness, -1.0, 1.0);
        const feather = this.clamp(this.params.feather, 0.0, 1.0);
        const highlight = this.clamp(this.params.highlight, 0.0, 1.0);

        // 计算派生参数
        const opacity = this.getOpacity(amount);
        const midpointScale = this.getMidpointScaleFromRoundness(roundness, textureWidth, textureHeight);
        const midpoint1 = this.getMidpoint(midpoint);
        const midpoint2 = midpoint1 * midpointScale;
        const finalMidpoint = this.remap(Math.pow(Math.abs(roundness), 2), 0, 1, midpoint1, midpoint2);
        
        // 羽化参数计算
        const featherScaleMidPt = this.getFeatherScaleFromMidpoint(midpoint);
        const featherScaleRd = this.getFeatherScaleFromRoundness(roundness, textureWidth, textureHeight);
        const { pivot: featherPivot, power: featherPower } = this.getFeatherParams(feather * featherScaleMidPt * featherScaleRd);
        const geometricMeanSize = this.getGeometricMeanSize(textureWidth, textureHeight);

        // 设置uniform参数
        this.uniforms.tDiffuse.value = readBuffer.texture;
        this.uniforms.u_opacity.value = opacity;
        this.uniforms.u_midpoint.value = finalMidpoint;
        this.uniforms.u_roundness.value = roundness;
        this.uniforms.u_featherPivot.value = featherPivot;
        this.uniforms.u_featherPower.value = featherPower;
        this.uniforms.u_highlight.value = highlight;
        this.uniforms.u_halfDiagonalLength.value = this.constants.HalfDiagonalLength;
        this.uniforms.u_geometricMeanSize.value = geometricMeanSize;
        this.uniforms.u_transparent.value = this.params.transparent ? 1 : 0;
        this.uniforms.u_center.value = this.constants.Center;
        this.uniforms.u_color.value.set(this.params.color.r, this.params.color.g, this.params.color.b);
        this.uniforms.u_ScreenParams.value.set(textureWidth, textureHeight, 1.0 / textureWidth, 1.0 / textureHeight);
        this.uniforms.u_intensity.value = this.clamp(this.params.intensity, 0.0, 1.0);

        super.render(renderer, writeBuffer, readBuffer, deltaTime, maskActive);
    }

    // 参数设置方法
    setColor(value) {
        this.params.color.set(value);
    }

    setAmount(value) {
        this.params.amount = this.clamp(value, 0.0, 1.0);
    }

    setMidpoint(value) {
        this.params.midpoint = this.clamp(value, 0.0, 1.0);
    }

    setRoundness(value) {
        this.params.roundness = this.clamp(value, -1.0, 1.0);
    }

    setFeather(value) {
        this.params.feather = this.clamp(value, 0.0, 1.0);
    }

    setHighlight(value) {
        this.params.highlight = this.clamp(value, 0.0, 1.0);
    }

    setTransparent(value) {
        this.params.transparent = Boolean(value);
    }

    setIntensity(value) {
        this.params.intensity = this.clamp(value, 0.0, 1.0);
    }

    // 重置为默认值
    resetToDefaults() {
        this.params.color.setRGB(0, 0, 0);
        this.params.amount = 0.0;
        this.params.midpoint = 0.0;
        this.params.roundness = 0.0;
        this.params.feather = 0.5;
        this.params.highlight = 0.0;
        this.params.transparent = false;
    }

    // 获取当前参数值
    getParams() {
        return {
            color: this.params.color.clone(),
            amount: this.params.amount,
            midpoint: this.params.midpoint,
            roundness: this.params.roundness,
            feather: this.params.feather,
            highlight: this.params.highlight,
            transparent: this.params.transparent,
            intensity: this.params.intensity
        };
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

/*threeJS*/ module.exports = { VignetteShaderPass };
// /*Effect*/ exports.VignetteShaderPass = VignetteShaderPass;
