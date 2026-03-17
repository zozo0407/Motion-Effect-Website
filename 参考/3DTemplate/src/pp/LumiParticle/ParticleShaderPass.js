/*threeJS*/ const THREE = require('three');
/*threeJS*/ const { ShaderPass } = require('three/examples/jsm/postprocessing/ShaderPass.js');

// /*Effect*/ const THREE = require('../../ThreeJS/three-amg-wrapper.js').THREE;
// /*Effect*/ const { ShaderPass } = require('../../ThreeJS/ShaderPass.js');

// 导入Shader
const vertexSource = require('./shaders/921649439b264339f84c295e7517a0d0Vert.js').source;
const fragmentSource = require('./shaders/921649439b264339f84c295e7517a0d0Frag.js').source;

// 创建Shader
function createShader() {
    // Three.js适配处理
    const vertexShader = vertexSource
        .replace(/#version 300 es/g, '');

    const fragmentShader = fragmentSource
        .replace(/#version 300 es/g, '')
        .replace(/layout/g, '//layout')
        .replace(/o_fragColor/g, 'gl_FragColor');

    // 根据分析报告中的参数定义uniforms
    return {
        name: 'ParticleShaderPass',
        uniforms: {
            // 基础纹理
            'tDiffuse': { value: null },
            'inputTex': { value: null },
            'materialTex': { value: null },
            'pSizeOverLifeTex': { value: null },
            'pOpacityOverLifeTex': { value: null },
            
            // 时间和控制参数
            'iTime': { value: 0.0 },
            'sliderSpeed': { value: 1.0 },
            'sliderNumber': { value: 1.0 },
            'randSeed': { value: 23.87 },
            
            // 粒子基础属性
            'particleTotalNum': { value: 10000.0 },
            'particleTotalSeed': { value: 10000.0 },
            'pEndCycle': { value: 3.0 },
            'pLife': { value: 3.0 },
            'pLifeRandom': { value: 0.0 },
            
            // 发射器设置
            'emitterTranslationX': { value: 0.0 },
            'emitterTranslationY': { value: 0.0 },
            'emitterTranslationZ': { value: 0.0 },
            'emitterScaleX': { value: 1.0 },
            'emitterScaleY': { value: 1.0 },
            'emitterScaleZ': { value: 1.0 },
            
            // 粒子材质设置
            'pShapeType': { value: 0 }, // 0: Circle, 1: Rect, 2: Texture
            'pColor': { value: new THREE.Vector3(1.0, 1.0, 1.0) },
            'pUseInputColor': { value: 0 },
            
            // 粒子大小设置
            'pSize': { value: 1.5 },
            'pSizeRandom': { value: 0.0 },
            'pSizeRatioX': { value: 1.0 },
            'pSizeRatioY': { value: 1.0 },
            
            // 粒子透明度设置
            'pOpacity': { value: 1.0 },
            'pOpacityRandom': { value: 0.0 },
            
            // 粒子速度设置
            'pVeloX': { value: 0.1 },
            'pVeloY': { value: 0.1 },
            'pVeloZ': { value: 0.0 },
            'pVeloRandomX': { value: 0.0 },
            'pVeloRandomY': { value: 0.0 },
            'pVeloRandomZ': { value: 0.0 },
            
            // 粒子加速度设置
            'accelerationX': { value: 0.0 },
            'accelerationY': { value: 0.0 },
            'accelerationZ': { value: 0.0 },
            'accelerationRandomX': { value: 0.0 },
            'accelerationRandomY': { value: 0.0 },
            'accelerationRandomZ': { value: 0.0 },
            
            // 物理参数
            'resistance': { value: 0.01 }, // 避免除零，最小值0.01
            'turbulence': { value: 0.0 },
            
            // 粒子旋转设置
            'pRotationX': { value: 0.0 },
            'pRotationY': { value: 0.0 },
            'pRotationZ': { value: 0.0 },
            'pRotationRandomX': { value: 0.0 },
            'pRotationRandomY': { value: 0.0 },
            'pRotationRandomZ': { value: 0.0 },
            
            // 屏幕参数
            'u_ScreenParams': { value: new THREE.Vector4(1920, 1080, 1.0/1920, 1.0/1080) }
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
	    glslVersion: THREE.GLSL3,
    };
}

// 创建ParticleShaderPass
class ParticleShaderPass extends ShaderPass {
    constructor() {
        super(createShader());
        
        // 参数默认值 - 对应AEInfo.json中的配置
        this.params = {
            // 基础设置
            randSeed: 23.87,
            
            // 发射器设置
            emitterTranslationX: 0.0,
            emitterTranslationY: 0.0,
            emitterTranslationZ: 0.0,
            emitterScaleX: 1.0,
            emitterScaleY: 1.0,
            emitterScaleZ: 1.0,
            
            // 粒子材质设置
            pShapeType: 'Circle', // Circle, Rect, Texture
            pColor: { r: 1.0, g: 1.0, b: 1.0 },
            pUseInputColor: false,
            
            // 粒子属性设置
            pEndCycle: 3,
            particleTotalNum: 10000,
            pSize: 1.5,
            pSizeRandom: 0.0,
            pSizeRatioX: 1.0,
            pSizeRatioY: 1.0,
            pSizeOverLife: 'const', // const, fadeIn, fadeOut, fadeInOut, customize
            pOpacity: 1.0,
            pOpacityRandom: 0.0,
            pOpacityOverLife: 'const',
            pLife: 3.0,
            pLifeRandom: 0.0,
            
            // 运动参数
            pVeloX: 1.0,
            pVeloY: 1.0,
            pVeloZ: 0.0,
            pVeloRandomX: 0.0,
            pVeloRandomY: 0.0,
            pVeloRandomZ: 0.0,
            pAccelerationX: 0.0,
            pAccelerationY: 0.0,
            pAccelerationZ: 0.0,
            pAccelerationRandomX: 0.0,
            pAccelerationRandomY: 0.0,
            pAccelerationRandomZ: 0.0,
            resistance: 0.0,
            turbulence: 0.0,
            
            // 粒子旋转
            pRotationX: 0.0,
            pRotationY: 0.0,
            pRotationZ: 0.0,
            pRotationRandomX: 0.0,
            pRotationRandomY: 0.0,
            pRotationRandomZ: 0.0,
            
            // 滑杆设置
            sliderSpeed: 1.0,
            sliderNumber: 1.0
        };

        // 内部常量
        this.constants = {
            size_scale_factor: 250.0,
            velocity_scale_factor: 10.0,
            z_offset: 16.9,
            min_resistance: 0.01
        };
        
        // 时间管理
        this.time = 0.0;
        
        // 纹理
        this.textures = {
            const: null,
            fadeIn: null,
            fadeOut: null,
            fadeInOut: null
        };
        
        // 初始化纹理
        this._initTextures();

        // 设置默认分辨率
        this.setSize(1920, 1080);
    }

    // 设置渲染目标尺寸
    setSize(width, height) {
        this.width = width;
        this.height = height;
        
        // 更新Shader中的屏幕分辨率参数
        this.uniforms.u_ScreenParams.value.set(width, height, 1.0/width, 1.0/height);
    }

    // 纹理加载函数
    _loadTexture(texturePath) { 
        const textureLoader = new THREE.TextureLoader(); 
        return new Promise(resolve => { 
            const texture = textureLoader.load(texturePath, resolve); 
            texture.colorSpace = THREE.LinearSRGBColorSpace; 
            texture.wrapS = THREE.ClampToEdgeWrapping; 
            texture.wrapT = THREE.ClampToEdgeWrapping; 
            texture.minFilter = THREE.LinearFilter; 
            texture.magFilter = THREE.LinearFilter; 
            return texture;
        });
    }

    _initTextures() {
        // 加载常量纹理
        /*threeJS*/ this.textures.const = this._loadTexture(require('./images/const.png'));
        // /*Effect*/ this.textures.const = this._loadTexture('js/pp/LumiParticle/images/const.png');
        
        // 加载淡入纹理
        /*threeJS*/ this.textures.fadeIn = this._loadTexture(require('./images/fadeIn.png'));
        // /*Effect*/ this.textures.fadeIn = this._loadTexture('js/pp/LumiParticle/images/fadeIn.png');

        // 加载淡出纹理
        /*threeJS*/ this.textures.fadeOut = this._loadTexture(require('./images/fadeOut.png'));
        // /*Effect*/ this.textures.fadeOut = this._loadTexture('js/pp/LumiParticle/images/fadeOut.png');

        // 加载淡入淡出纹理
        /*threeJS*/ this.textures.fadeInOut = this._loadTexture(require('./images/fadeInOut.png'));
        // /*Effect*/ this.textures.fadeInOut = this._loadTexture('js/pp/LumiParticle/images/fadeInOut.png');
    }

    // 渲染函数，对齐Lua中onUpdate的逻辑
    render(renderer, writeBuffer, readBuffer, deltaTime, maskActive) {
        // 更新时间
        this.time += deltaTime;
        this.uniforms.iTime.value = this.time;
        
        // 设置输入纹理
        this.uniforms.tDiffuse.value = readBuffer.texture;
        this.uniforms.inputTex.value = readBuffer.texture;
        
        // 更新所有参数到uniforms (对齐Lua的updateMaterials方法)
        this._updateUniforms();
        
        // 调用父类渲染方法
        super.render(renderer, writeBuffer, readBuffer, deltaTime, maskActive);
    }
    
    // 更新uniforms，对齐Lua中的参数传递逻辑
    _updateUniforms() {
        // 基础参数
        this.uniforms.randSeed.value = this.params.randSeed;
        this.uniforms.sliderSpeed.value = this.params.sliderSpeed;
        this.uniforms.sliderNumber.value = this.params.sliderNumber;
        
        // 粒子数量和生命周期
        this.uniforms.particleTotalNum.value = this.params.particleTotalNum;
        this.uniforms.particleTotalSeed.value = Math.max(this.params.particleTotalNum / 100, 20);
        this.uniforms.pEndCycle.value = this.params.pEndCycle + 0.5;
        this.uniforms.pLife.value = this.params.pLife;
        this.uniforms.pLifeRandom.value = Math.min(this.params.pLifeRandom, this.params.pLife - 0.1);
        
        // 发射器设置
        this.uniforms.emitterTranslationX.value = this.params.emitterTranslationX;
        this.uniforms.emitterTranslationY.value = this.params.emitterTranslationY;
        this.uniforms.emitterTranslationZ.value = this.params.emitterTranslationZ - this.constants.z_offset;
        this.uniforms.emitterScaleX.value = this.params.emitterScaleX + 0.01;
        this.uniforms.emitterScaleY.value = this.params.emitterScaleY + 0.01;
        this.uniforms.emitterScaleZ.value = this.params.emitterScaleZ + 0.01;
        
        // 粒子材质设置
        const shapeTypeMap = { 'Circle': 0, 'Rect': 1, 'Texture': 2 };
        this.uniforms.pShapeType.value = shapeTypeMap[this.params.pShapeType] || 0;
        this.uniforms.pColor.value.set(this.params.pColor.r, this.params.pColor.g, this.params.pColor.b);
        this.uniforms.pUseInputColor.value = this.params.pUseInputColor ? 1 : 0;
        
        // 粒子大小设置 (应用缩放因子)
        this.uniforms.pSize.value = this.params.pSize / this.constants.size_scale_factor;
        this.uniforms.pSizeRandom.value = Math.min(this.params.pSizeRandom, this.params.pSize) / 50.0;
        this.uniforms.pSizeRatioX.value = this.params.pSizeRatioX;
        this.uniforms.pSizeRatioY.value = this.params.pSizeRatioY;
        
        // 粒子透明度设置
        this.uniforms.pOpacity.value = this.params.pOpacity;
        this.uniforms.pOpacityRandom.value = this.params.pOpacityRandom;
        
        // 粒子速度设置 (应用缩放因子)
        this.uniforms.pVeloX.value = this.params.pVeloX / this.constants.velocity_scale_factor;
        this.uniforms.pVeloY.value = this.params.pVeloY / this.constants.velocity_scale_factor;
        this.uniforms.pVeloZ.value = this.params.pVeloZ / this.constants.velocity_scale_factor;
        this.uniforms.pVeloRandomX.value = this.params.pVeloRandomX / this.constants.velocity_scale_factor;
        this.uniforms.pVeloRandomY.value = this.params.pVeloRandomY / this.constants.velocity_scale_factor;
        this.uniforms.pVeloRandomZ.value = this.params.pVeloRandomZ / this.constants.velocity_scale_factor;
        
        // 粒子加速度设置
        this.uniforms.accelerationX.value = this.params.pAccelerationX / this.constants.velocity_scale_factor;
        this.uniforms.accelerationY.value = this.params.pAccelerationY / this.constants.velocity_scale_factor;
        this.uniforms.accelerationZ.value = this.params.pAccelerationZ / this.constants.velocity_scale_factor;
        this.uniforms.accelerationRandomX.value = this.params.pAccelerationRandomX / this.constants.velocity_scale_factor;
        this.uniforms.accelerationRandomY.value = this.params.pAccelerationRandomY / this.constants.velocity_scale_factor;
        this.uniforms.accelerationRandomZ.value = this.params.pAccelerationRandomZ / this.constants.velocity_scale_factor;
        
        // 物理参数 (阻力避免除零)
        this.uniforms.resistance.value = this.params.resistance + 0.01;
        this.uniforms.turbulence.value = this.params.turbulence / 3.0;
        
        // 粒子旋转设置
        this.uniforms.pRotationX.value = this.params.pRotationX;
        this.uniforms.pRotationY.value = this.params.pRotationY;
        this.uniforms.pRotationZ.value = this.params.pRotationZ;
        this.uniforms.pRotationRandomX.value = this.params.pRotationRandomX;
        this.uniforms.pRotationRandomY.value = this.params.pRotationRandomY;
        this.uniforms.pRotationRandomZ.value = this.params.pRotationRandomZ;
        
        // 纹理更新 (对齐Lua逻辑)
        this._updateTextures();
    }
    
    // 更新生命周期纹理
    _updateTextures() {
        // 大小生命周期纹理
        const sizeTexture = this.textures[this.params.pSizeOverLife] || this.textures.const;
        this.uniforms.pSizeOverLifeTex.value = sizeTexture;
        
        // 透明度生命周期纹理
        const opacityTexture = this.textures[this.params.pOpacityOverLife] || this.textures.const;
        this.uniforms.pOpacityOverLifeTex.value = opacityTexture;
    }

    // 参数设置方法 - 根据AEInfo.json中的配置
    
    // 基础设置
    setRandSeed(value) {
        this.params.randSeed = this._clampValue(value, 10, 1000);
    }
    
    // 发射器设置
    setEmitterTranslation(x, y, z) {
        this.params.emitterTranslationX = this._clampValue(x, -20, 20);
        this.params.emitterTranslationY = this._clampValue(y, -20, 20);
        this.params.emitterTranslationZ = this._clampValue(z, -20, 20);
    }
    
    setEmitterScale(x, y, z) {
        this.params.emitterScaleX = this._clampValue(x, 0, 20);
        this.params.emitterScaleY = this._clampValue(y, 0, 20);
        this.params.emitterScaleZ = this._clampValue(z, 0, 20);
    }
    
    // 粒子材质设置
    setShapeType(type) {
        const validTypes = ['Circle', 'Rect', 'Texture'];
        this.params.pShapeType = validTypes.includes(type) ? type : 'Circle';
    }
    
    setColor(r, g, b) {
        this.params.pColor.r = this._clampValue(r, 0, 1);
        this.params.pColor.g = this._clampValue(g, 0, 1);
        this.params.pColor.b = this._clampValue(b, 0, 1);
    }
    
    setUseInputColor(use) {
        this.params.pUseInputColor = Boolean(use);
    }
    
    setMaterialTexture(texture) {
        this.uniforms.materialTex.value = texture;
    }
    
    // 粒子属性设置
    setEndCycle(value) {
        this.params.pEndCycle = this._clampValue(value, 0, 100);
    }
    
    setParticleTotalNum(value) {
        this.params.particleTotalNum = this._clampValue(value, 0, 1000000);
    }
    
    setSize(size, random = 0) {
        this.params.pSize = this._clampValue(size, 0, 20);
        this.params.pSizeRandom = this._clampValue(random, 0, 20);
    }
    
    setSizeRatio(x, y) {
        this.params.pSizeRatioX = this._clampValue(x, 0, 20);
        this.params.pSizeRatioY = this._clampValue(y, 0, 20);
    }
    
    setSizeOverLife(type, texture = null) {
        const validTypes = ['const', 'fadeIn', 'fadeOut', 'fadeInOut', 'customize'];
        this.params.pSizeOverLife = validTypes.includes(type) ? type : 'const';
        if (type === 'customize' && texture) {
            this.uniforms.pSizeOverLifeTex.value = texture;
        }
    }
    
    setOpacity(opacity, random = 0) {
        this.params.pOpacity = this._clampValue(opacity, 0, 1);
        this.params.pOpacityRandom = this._clampValue(random, 0, 1);
    }
    
    setOpacityOverLife(type, texture = null) {
        const validTypes = ['const', 'fadeIn', 'fadeOut', 'fadeInOut', 'customize'];
        this.params.pOpacityOverLife = validTypes.includes(type) ? type : 'const';
        if (type === 'customize' && texture) {
            this.uniforms.pOpacityOverLifeTex.value = texture;
        }
    }
    
    setLife(life, random = 0) {
        this.params.pLife = this._clampValue(life, 0, 100);
        this.params.pLifeRandom = this._clampValue(random, 0, 100);
    }
    
    // 运动参数设置
    setVelocity(x, y, z, randomX = 0, randomY = 0, randomZ = 0) {
        this.params.pVeloX = this._clampValue(x, -20, 20);
        this.params.pVeloY = this._clampValue(y, -20, 20);
        this.params.pVeloZ = this._clampValue(z, -20, 20);
        this.params.pVeloRandomX = this._clampValue(randomX, 0, 20);
        this.params.pVeloRandomY = this._clampValue(randomY, 0, 20);
        this.params.pVeloRandomZ = this._clampValue(randomZ, 0, 20);
    }
    
    setAcceleration(x, y, z, randomX = 0, randomY = 0, randomZ = 0) {
        this.params.pAccelerationX = this._clampValue(x, -20, 20);
        this.params.pAccelerationY = this._clampValue(y, -20, 20);
        this.params.pAccelerationZ = this._clampValue(z, -20, 20);
        this.params.pAccelerationRandomX = this._clampValue(randomX, 0, 20);
        this.params.pAccelerationRandomY = this._clampValue(randomY, 0, 20);
        this.params.pAccelerationRandomZ = this._clampValue(randomZ, 0, 20);
    }
    
    setResistance(value) {
        this.params.resistance = this._clampValue(value, 0, 10);
    }
    
    setTurbulence(value) {
        this.params.turbulence = this._clampValue(value, 0, 10);
    }
    
    // 粒子旋转设置
    setRotation(x, y, z, randomX = 0, randomY = 0, randomZ = 0) {
        this.params.pRotationX = this._clampValue(x, -360, 360);
        this.params.pRotationY = this._clampValue(y, -360, 360);
        this.params.pRotationZ = this._clampValue(z, -360, 360);
        this.params.pRotationRandomX = this._clampValue(randomX, 0, 360);
        this.params.pRotationRandomY = this._clampValue(randomY, 0, 360);
        this.params.pRotationRandomZ = this._clampValue(randomZ, 0, 360);
    }
    
    // 滑杆设置
    setSliderSpeed(value) {
        this.params.sliderSpeed = this._clampValue(value, 0, 10);
    }
    
    setSliderNumber(value) {
        this.params.sliderNumber = this._clampValue(value, 0, 10);
    }
    
    // 工具方法
    _clampValue(value, min = 0, max = 1) {
        return Math.max(min, Math.min(max, value));
    }
    
    // 重置所有参数到默认值
    resetToDefaults() {
        this.params = {
            randSeed: 23.87,
            emitterTranslationX: 0.0,
            emitterTranslationY: 0.0,
            emitterTranslationZ: 0.0,
            emitterScaleX: 1.0,
            emitterScaleY: 1.0,
            emitterScaleZ: 1.0,
            pShapeType: 'Circle',
            pColor: { r: 1.0, g: 1.0, b: 1.0 },
            pUseInputColor: false,
            pEndCycle: 3,
            particleTotalNum: 10000,
            pSize: 1.5,
            pSizeRandom: 0.0,
            pSizeRatioX: 1.0,
            pSizeRatioY: 1.0,
            pSizeOverLife: 'const',
            pOpacity: 1.0,
            pOpacityRandom: 0.0,
            pOpacityOverLife: 'const',
            pLife: 3.0,
            pLifeRandom: 0.0,
            pVeloX: 1.0,
            pVeloY: 1.0,
            pVeloZ: 0.0,
            pVeloRandomX: 0.0,
            pVeloRandomY: 0.0,
            pVeloRandomZ: 0.0,
            pAccelerationX: 0.0,
            pAccelerationY: 0.0,
            pAccelerationZ: 0.0,
            pAccelerationRandomX: 0.0,
            pAccelerationRandomY: 0.0,
            pAccelerationRandomZ: 0.0,
            resistance: 0.0,
            turbulence: 0.0,
            pRotationX: 0.0,
            pRotationY: 0.0,
            pRotationZ: 0.0,
            pRotationRandomX: 0.0,
            pRotationRandomY: 0.0,
            pRotationRandomZ: 0.0,
            sliderSpeed: 1.0,
            sliderNumber: 1.0
        };
        this.time = 0.0;
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
}

// 导出
/*threeJS*/ module.exports = { ParticleShaderPass };
// /*Effect*/ exports.ParticleShaderPass = ParticleShaderPass;
