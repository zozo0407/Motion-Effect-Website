/*threeJS*/ const THREE = require('three');
/*threeJS*/ const { ShaderPass } = require('three/examples/jsm/postprocessing/ShaderPass.js');

// /*Effect*/ const THREE = require('../../ThreeJS/three-amg-wrapper.js').THREE;
// /*Effect*/ const { ShaderPass } = require('../../ThreeJS/ShaderPass.js');

// 导入着色器文件
const shaderVertSource = require('./shaders/9777e7321ac2ec20ae1a00760883649eVert.js').source;
const shaderFragSource = require('./shaders/9777e7321ac2ec20ae1a00760883649eFrag.js').source;

function createShader() {
    const vertexShader = shaderVertSource
        .replace(/attribute /g, '//attribute ')
        .replace(/a_position/g, 'position')
        .replace(/a_texcoord0/g, 'uv')
        .replace(/uv0/g, 'v_uv')
        .replace('vec4(a_position, 1.0)', 'projectionMatrix * modelViewMatrix * vec4(position, 1.0)');

    const fragmentShader = shaderFragSource
        .replace(/uv0/g, 'v_uv')
        .replace(/u_backTex/g, 'tDiffuse')
        .replace(/gl_FragData\[0\]/g, 'gl_FragColor');

    return {
        name: 'PageTurnShaderPass',
        uniforms: {
            'tDiffuse': { value: null },
            'u_frontTex': { value: null },
            'u_renderFace': { value: 0 },
            'u_inCornerPosition': { value: new THREE.Vector2(0, 0) },
            'u_inFoldPosition': { value: new THREE.Vector2(0, 0) },
            'u_foldRadius': { value: 0 },
            'u_classicUi': { value: 0 },
            'u_intensity': { value: 1.0 } // 添加intensity uniform
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        transparent: true,
        side: THREE.DoubleSide
    };
}

/**
 * PageTurnShaderPass类
 * 继承自Three.js的ShaderPass，提供翻页效果
 */
class PageTurnShaderPass extends ShaderPass {
  constructor() {
    super(createShader());
    
    // 设置默认参数
    this.backTex = null;
    this.frontTex = null;
    this.inCornerPosition = new THREE.Vector2(0, 1.57);
    this.inFoldPosition = new THREE.Vector2(0, 1);
    this.inFoldDirection = 234;
    this.foldRadius = 0.3;
    this.classicUi = 0.9;
    this.renderFace = 0;
    this.intensity = 1.0; // 添加intensity属性

    // 预设配置
    this.presets = {
        // 无效果
        none: {
            intensity: 0,
        },
        // 从左下翻页
        downleft2upright: {
            intensity: 1.0,
            inCornerPosition: [0, 1.57],
            inFoldPosition: [0, 1],
            inFoldDirection: 35,
            foldRadius: 0.3,
            classicUi: 1
        },
        // 从右上翻页
        upright2downleft: {
            intensity: 1.0,
            inCornerPosition: [0, 1.57],
            inFoldPosition: [0, 1],
            inFoldDirection: 234,
            foldRadius: 0.3,
            classicUi: 1
        }
    };
  }

  _clampValue(value, min = 0, max = 1) {
    return Math.max(min, Math.min(max, value));
  }

  setFrontTex(texture) {
    if (texture) {
        this.frontTex = texture;
    }
  }

  setBackTex(texture) {
    if (texture) {
        this.backTex = texture;
    }
  }

  _clampValue(value, min = 0, max = 1) {
    return Math.max(min, Math.min(max, value));
  }

  setInCornerPosition(value) {
    this.inCornerPosition = new THREE.Vector2(
        this._clampValue(value[0], 0, 1), 
        this._clampValue(value[1], 0, 1) 
    );
  }

  setInFoldPosition(value) {
    this.inFoldPosition = new THREE.Vector2(
        this._clampValue(value[0], 0, 1), 
        this._clampValue(value[1], 0, 1) 
    );
  }

  setInFoldDirection(direction) {
    this.inFoldDirection = this._clampValue(direction, 0, 360);
  }

  setFoldRadius(radius) {
    this.foldRadius = this._clampValue(radius, 0, 5);
  }

  setClassicUi(value) {
    this.classicUi = this._clampValue(value, 0, 4);
  }

  setRenderFace(value) {
    this.renderFace = this._clampValue(value, 0, 2);
  }

  /**
   * 从两点获取线
   * @param {THREE.Vector2} p1 - 点1
   * @param {THREE.Vector2} p2 - 点2
   * @returns {THREE.Vector3} 线
   */
  _getLineFrom2Pts(p1, p2) {
    const a = p1.y - p2.y;
    const b = p2.x - p1.x;
    const c = p1.x * p2.y - p1.y * p2.x;
    return new THREE.Vector3(a, b, c);
  }

  /**
   * 通过线对称点
   * @param {THREE.Vector2} pt - 点
   * @param {THREE.Vector3} line - 线
   * @returns {THREE.Vector2} 对称点
   */
  _symmetryPtByLine(pt, line) {
    const a = line.x;
    const b = line.y;
    const c = line.z;
    const x = ((b * b - a * a) * pt.x - 2.0 * a * (b * pt.y + c)) / (a * a + b * b);
    const y = ((a * a - b * b) * pt.y - 2.0 * b * (a * pt.x + c)) / (a * a + b * b);
    return new THREE.Vector2(x, y);
  }

  /**
   * 设置强度
   * @param {number} intensity - 强度 (0.0-1.0)
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
    if (this.backTex) {
        this.material.uniforms.tDiffuse.value = this.backTex;
    }
    if (this.frontTex) {
        this.material.uniforms.u_frontTex.value = this.frontTex;
    }
    else {
        this.material.uniforms.u_frontTex.value = this.backTex;
    }

    // 计算inCornerPosition和inFoldPosition
    let inCornerPosition = this.inCornerPosition;
    let inFoldPosition = this.inFoldPosition;

    if (this.classicUi > 0.5) {
      const r = (this.inFoldDirection + 0.0000001) / 180 * Math.PI;
      inCornerPosition = new THREE.Vector2(
        Math.sin(r) < 0 ? 1 : 0,
        Math.cos(r) < 0 ? 1 : 0
      );

      const rightDir = new THREE.Vector2(1, 0);
      let rotPoint = new THREE.Vector2(
        rightDir.x * Math.cos(r) + rightDir.y * Math.sin(r),
        -rightDir.x * Math.sin(r) + rightDir.y * Math.cos(r)
      );

      rotPoint = new THREE.Vector2(
        rotPoint.x + this.inFoldPosition.x,
        rotPoint.y + this.inFoldPosition.y
      );

      const line = this._getLineFrom2Pts(rotPoint, this.inFoldPosition);
      inFoldPosition = this._symmetryPtByLine(inCornerPosition, line);
    }

    // 更新uniforms
    this.material.uniforms.u_classicUi.value = this.classicUi;
    this.material.uniforms.u_inCornerPosition.value = inCornerPosition;
    this.material.uniforms.u_inFoldPosition.value = inFoldPosition;
    this.material.uniforms.u_foldRadius.value = this.foldRadius;
    this.material.uniforms.u_renderFace.value = this.renderFace;
    this.material.uniforms.u_intensity.value = this.intensity; // 传递intensity值

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

/*threeJS*/ module.exports = { PageTurnShaderPass };
// /*Effect*/ exports.PageTurnShaderPass = PageTurnShaderPass;
