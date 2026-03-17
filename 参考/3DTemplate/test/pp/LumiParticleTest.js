import { BaseTest } from './BaseTest';
const { ParticleShaderPass } = require('../../src/pp/LumiParticle/ParticleShaderPass.js');

// LumiParticle测试类
class LumiParticleTest extends BaseTest {
    constructor() {
        super();
        this.params = {};
    }

    async init() {
        // 创建ParticleShaderPass实例
        this.effect = new ParticleShaderPass();
        await super.init();
    }

    // 根据AEInfo.json中的参数配置实现GUI控件
    setupGUI() {
        // 创建参数引用，便于GUI控制
        this.params = {
            // 基础设置
            randSeed: this.effect.params.randSeed,
            
            // 发射器设置
            emitterTranslationX: this.effect.params.emitterTranslationX,
            emitterTranslationY: this.effect.params.emitterTranslationY,
            emitterTranslationZ: this.effect.params.emitterTranslationZ,
            emitterScaleX: this.effect.params.emitterScaleX,
            emitterScaleY: this.effect.params.emitterScaleY,
            emitterScaleZ: this.effect.params.emitterScaleZ,
            
            // 粒子材质设置
            pShapeType: this.effect.params.pShapeType,
            pColorR: this.effect.params.pColor.r,
            pColorG: this.effect.params.pColor.g,
            pColorB: this.effect.params.pColor.b,
            pUseInputColor: this.effect.params.pUseInputColor,
            
            // 粒子属性设置
            pEndCycle: this.effect.params.pEndCycle,
            particleTotalNum: this.effect.params.particleTotalNum,
            pSize: this.effect.params.pSize,
            pSizeRandom: this.effect.params.pSizeRandom,
            pSizeRatioX: this.effect.params.pSizeRatioX,
            pSizeRatioY: this.effect.params.pSizeRatioY,
            pSizeOverLife: this.effect.params.pSizeOverLife,
            pOpacity: this.effect.params.pOpacity,
            pOpacityRandom: this.effect.params.pOpacityRandom,
            pOpacityOverLife: this.effect.params.pOpacityOverLife,
            pLife: this.effect.params.pLife,
            pLifeRandom: this.effect.params.pLifeRandom,
            
            // 运动参数
            pVeloX: this.effect.params.pVeloX,
            pVeloY: this.effect.params.pVeloY,
            pVeloZ: this.effect.params.pVeloZ,
            pVeloRandomX: this.effect.params.pVeloRandomX,
            pVeloRandomY: this.effect.params.pVeloRandomY,
            pVeloRandomZ: this.effect.params.pVeloRandomZ,
            pAccelerationX: this.effect.params.pAccelerationX,
            pAccelerationY: this.effect.params.pAccelerationY,
            pAccelerationZ: this.effect.params.pAccelerationZ,
            pAccelerationRandomX: this.effect.params.pAccelerationRandomX,
            pAccelerationRandomY: this.effect.params.pAccelerationRandomY,
            pAccelerationRandomZ: this.effect.params.pAccelerationRandomZ,
            resistance: this.effect.params.resistance,
            turbulence: this.effect.params.turbulence,
            
            // 粒子旋转
            pRotationX: this.effect.params.pRotationX,
            pRotationY: this.effect.params.pRotationY,
            pRotationZ: this.effect.params.pRotationZ,
            pRotationRandomX: this.effect.params.pRotationRandomX,
            pRotationRandomY: this.effect.params.pRotationRandomY,
            pRotationRandomZ: this.effect.params.pRotationRandomZ,
            
            // 滑杆设置
            sliderSpeed: this.effect.params.sliderSpeed,
            sliderNumber: this.effect.params.sliderNumber
        };

        // === 基础设置 ===
        const basicFolder = this.gui.addFolder('基础设置');
        basicFolder.add(this.params, 'randSeed', 10, 1000).onChange(value => {
            this.effect.setRandSeed(value);
        });

        // === 发射器设置 ===
        const emitterFolder = this.gui.addFolder('发射器设置');
        
        // 发射器位置
        const emitterPosFolder = emitterFolder.addFolder('位置');
        emitterPosFolder.add(this.params, 'emitterTranslationX', -20, 20).onChange(value => {
            this.effect.setEmitterTranslation(value, this.params.emitterTranslationY, this.params.emitterTranslationZ);
        });
        emitterPosFolder.add(this.params, 'emitterTranslationY', -20, 20).onChange(value => {
            this.effect.setEmitterTranslation(this.params.emitterTranslationX, value, this.params.emitterTranslationZ);
        });
        emitterPosFolder.add(this.params, 'emitterTranslationZ', -20, 20).onChange(value => {
            this.effect.setEmitterTranslation(this.params.emitterTranslationX, this.params.emitterTranslationY, value);
        });
        
        // 发射器大小
        const emitterScaleFolder = emitterFolder.addFolder('大小');
        emitterScaleFolder.add(this.params, 'emitterScaleX', 0, 20).onChange(value => {
            this.effect.setEmitterScale(value, this.params.emitterScaleY, this.params.emitterScaleZ);
        });
        emitterScaleFolder.add(this.params, 'emitterScaleY', 0, 20).onChange(value => {
            this.effect.setEmitterScale(this.params.emitterScaleX, value, this.params.emitterScaleZ);
        });
        emitterScaleFolder.add(this.params, 'emitterScaleZ', 0, 20).onChange(value => {
            this.effect.setEmitterScale(this.params.emitterScaleX, this.params.emitterScaleY, value);
        });

        // === 粒子材质设置 ===
        const materialFolder = this.gui.addFolder('粒子材质设置');
        
        // 粒子形状
        materialFolder.add(this.params, 'pShapeType', ['Circle', 'Rect', 'Texture']).onChange(value => {
            this.effect.setShapeType(value);
        });
        
        // 粒子颜色
        const colorFolder = materialFolder.addFolder('颜色');
        colorFolder.add(this.params, 'pColorR', 0, 1).onChange(value => {
            this.effect.setColor(value, this.params.pColorG, this.params.pColorB);
        });
        colorFolder.add(this.params, 'pColorG', 0, 1).onChange(value => {
            this.effect.setColor(this.params.pColorR, value, this.params.pColorB);
        });
        colorFolder.add(this.params, 'pColorB', 0, 1).onChange(value => {
            this.effect.setColor(this.params.pColorR, this.params.pColorG, value);
        });
        
        // 使用输入颜色
        materialFolder.add(this.params, 'pUseInputColor').onChange(value => {
            this.effect.setUseInputColor(value);
        });

        // === 粒子属性设置 ===
        const attributeFolder = this.gui.addFolder('粒子属性设置');
        
        // 基础属性
        attributeFolder.add(this.params, 'pEndCycle', 0, 100).onChange(value => {
            this.effect.setEndCycle(value);
        });
        attributeFolder.add(this.params, 'particleTotalNum', 0, 1000000).onChange(value => {
            this.effect.setParticleTotalNum(value);
        });
        
        // 粒子大小
        const sizeFolder = attributeFolder.addFolder('大小');
        sizeFolder.add(this.params, 'pSize', 0, 20).onChange(value => {
            this.effect.setSize(value, this.params.pSizeRandom);
        });
        sizeFolder.add(this.params, 'pSizeRandom', 0, 20).onChange(value => {
            this.effect.setSize(this.params.pSize, value);
        });
        sizeFolder.add(this.params, 'pSizeRatioX', 0, 20).onChange(value => {
            this.effect.setSizeRatio(value, this.params.pSizeRatioY);
        });
        sizeFolder.add(this.params, 'pSizeRatioY', 0, 20).onChange(value => {
            this.effect.setSizeRatio(this.params.pSizeRatioX, value);
        });
        sizeFolder.add(this.params, 'pSizeOverLife', ['const', 'fadeIn', 'fadeOut', 'fadeInOut', 'customize']).onChange(value => {
            this.effect.setSizeOverLife(value);
        });
        
        // 粒子透明度
        const opacityFolder = attributeFolder.addFolder('透明度');
        opacityFolder.add(this.params, 'pOpacity', 0, 1).onChange(value => {
            this.effect.setOpacity(value, this.params.pOpacityRandom);
        });
        opacityFolder.add(this.params, 'pOpacityRandom', 0, 1).onChange(value => {
            this.effect.setOpacity(this.params.pOpacity, value);
        });
        opacityFolder.add(this.params, 'pOpacityOverLife', ['const', 'fadeIn', 'fadeOut', 'fadeInOut', 'customize']).onChange(value => {
            this.effect.setOpacityOverLife(value);
        });
        
        // 粒子生命周期
        const lifeFolder = attributeFolder.addFolder('生命周期');
        lifeFolder.add(this.params, 'pLife', 0, 100).onChange(value => {
            this.effect.setLife(value, this.params.pLifeRandom);
        });
        lifeFolder.add(this.params, 'pLifeRandom', 0, 100).onChange(value => {
            this.effect.setLife(this.params.pLife, value);
        });

        // === 运动参数 ===
        const motionFolder = this.gui.addFolder('运动参数');
        
        // 粒子速度
        const velocityFolder = motionFolder.addFolder('速度');
        velocityFolder.add(this.params, 'pVeloX', -20, 20).onChange(value => {
            this.effect.setVelocity(value, this.params.pVeloY, this.params.pVeloZ, 
                                   this.params.pVeloRandomX, this.params.pVeloRandomY, this.params.pVeloRandomZ);
        });
        velocityFolder.add(this.params, 'pVeloY', -20, 20).onChange(value => {
            this.effect.setVelocity(this.params.pVeloX, value, this.params.pVeloZ, 
                                   this.params.pVeloRandomX, this.params.pVeloRandomY, this.params.pVeloRandomZ);
        });
        velocityFolder.add(this.params, 'pVeloZ', -20, 20).onChange(value => {
            this.effect.setVelocity(this.params.pVeloX, this.params.pVeloY, value, 
                                   this.params.pVeloRandomX, this.params.pVeloRandomY, this.params.pVeloRandomZ);
        });
        
        // 速度随机值
        const velocityRandomFolder = motionFolder.addFolder('速度随机值');
        velocityRandomFolder.add(this.params, 'pVeloRandomX', 0, 20).onChange(value => {
            this.effect.setVelocity(this.params.pVeloX, this.params.pVeloY, this.params.pVeloZ, 
                                   value, this.params.pVeloRandomY, this.params.pVeloRandomZ);
        });
        velocityRandomFolder.add(this.params, 'pVeloRandomY', 0, 20).onChange(value => {
            this.effect.setVelocity(this.params.pVeloX, this.params.pVeloY, this.params.pVeloZ, 
                                   this.params.pVeloRandomX, value, this.params.pVeloRandomZ);
        });
        velocityRandomFolder.add(this.params, 'pVeloRandomZ', 0, 20).onChange(value => {
            this.effect.setVelocity(this.params.pVeloX, this.params.pVeloY, this.params.pVeloZ, 
                                   this.params.pVeloRandomX, this.params.pVeloRandomY, value);
        });
        
        // 粒子加速度
        const accelerationFolder = motionFolder.addFolder('加速度');
        accelerationFolder.add(this.params, 'pAccelerationX', -20, 20).onChange(value => {
            this.effect.setAcceleration(value, this.params.pAccelerationY, this.params.pAccelerationZ, 
                                       this.params.pAccelerationRandomX, this.params.pAccelerationRandomY, this.params.pAccelerationRandomZ);
        });
        accelerationFolder.add(this.params, 'pAccelerationY', -20, 20).onChange(value => {
            this.effect.setAcceleration(this.params.pAccelerationX, value, this.params.pAccelerationZ, 
                                       this.params.pAccelerationRandomX, this.params.pAccelerationRandomY, this.params.pAccelerationRandomZ);
        });
        accelerationFolder.add(this.params, 'pAccelerationZ', -20, 20).onChange(value => {
            this.effect.setAcceleration(this.params.pAccelerationX, this.params.pAccelerationY, value, 
                                       this.params.pAccelerationRandomX, this.params.pAccelerationRandomY, this.params.pAccelerationRandomZ);
        });
        
        // 加速度随机值
        const accelerationRandomFolder = motionFolder.addFolder('加速度随机值');
        accelerationRandomFolder.add(this.params, 'pAccelerationRandomX', 0, 20).onChange(value => {
            this.effect.setAcceleration(this.params.pAccelerationX, this.params.pAccelerationY, this.params.pAccelerationZ, 
                                       value, this.params.pAccelerationRandomY, this.params.pAccelerationRandomZ);
        });
        accelerationRandomFolder.add(this.params, 'pAccelerationRandomY', 0, 20).onChange(value => {
            this.effect.setAcceleration(this.params.pAccelerationX, this.params.pAccelerationY, this.params.pAccelerationZ, 
                                       this.params.pAccelerationRandomX, value, this.params.pAccelerationRandomZ);
        });
        accelerationRandomFolder.add(this.params, 'pAccelerationRandomZ', 0, 20).onChange(value => {
            this.effect.setAcceleration(this.params.pAccelerationX, this.params.pAccelerationY, this.params.pAccelerationZ, 
                                       this.params.pAccelerationRandomX, this.params.pAccelerationRandomY, value);
        });
        
        // 物理参数
        const physicsFolder = motionFolder.addFolder('物理参数');
        physicsFolder.add(this.params, 'resistance', 0, 10).onChange(value => {
            this.effect.setResistance(value);
        });
        physicsFolder.add(this.params, 'turbulence', 0, 10).onChange(value => {
            this.effect.setTurbulence(value);
        });
        
        // 粒子旋转
        const rotationFolder = motionFolder.addFolder('旋转');
        rotationFolder.add(this.params, 'pRotationX', -360, 360).onChange(value => {
            this.effect.setRotation(value, this.params.pRotationY, this.params.pRotationZ, 
                                   this.params.pRotationRandomX, this.params.pRotationRandomY, this.params.pRotationRandomZ);
        });
        rotationFolder.add(this.params, 'pRotationY', -360, 360).onChange(value => {
            this.effect.setRotation(this.params.pRotationX, value, this.params.pRotationZ, 
                                   this.params.pRotationRandomX, this.params.pRotationRandomY, this.params.pRotationRandomZ);
        });
        rotationFolder.add(this.params, 'pRotationZ', -360, 360).onChange(value => {
            this.effect.setRotation(this.params.pRotationX, this.params.pRotationY, value, 
                                   this.params.pRotationRandomX, this.params.pRotationRandomY, this.params.pRotationRandomZ);
        });
        
        // 旋转随机值
        const rotationRandomFolder = motionFolder.addFolder('旋转随机值');
        rotationRandomFolder.add(this.params, 'pRotationRandomX', 0, 360).onChange(value => {
            this.effect.setRotation(this.params.pRotationX, this.params.pRotationY, this.params.pRotationZ, 
                                   value, this.params.pRotationRandomY, this.params.pRotationRandomZ);
        });
        rotationRandomFolder.add(this.params, 'pRotationRandomY', 0, 360).onChange(value => {
            this.effect.setRotation(this.params.pRotationX, this.params.pRotationY, this.params.pRotationZ, 
                                   this.params.pRotationRandomX, value, this.params.pRotationRandomZ);
        });
        rotationRandomFolder.add(this.params, 'pRotationRandomZ', 0, 360).onChange(value => {
            this.effect.setRotation(this.params.pRotationX, this.params.pRotationY, this.params.pRotationZ, 
                                   this.params.pRotationRandomX, this.params.pRotationRandomY, value);
        });

        // === 滑杆设置 ===
        const sliderFolder = this.gui.addFolder('滑杆设置');
        sliderFolder.add(this.params, 'sliderSpeed', 0, 10).onChange(value => {
            this.effect.setSliderSpeed(value);
        });
        sliderFolder.add(this.params, 'sliderNumber', 0, 10).onChange(value => {
            this.effect.setSliderNumber(value);
        });

        // === 预设和工具 ===
        const toolsFolder = this.gui.addFolder('工具');
        
        // 重置按钮
        toolsFolder.add({
            resetToDefaults: () => {
                this.effect.resetToDefaults();
                // 更新GUI显示的参数值
                this._updateGUIParams();
                // 刷新GUI显示
                this._refreshGUI();
            }
        }, 'resetToDefaults').name('重置为默认值');

        // 默认展开一些重要的文件夹
        basicFolder.open();
        emitterFolder.open();
        materialFolder.open();
        attributeFolder.open();
        sliderFolder.open();
    }
    
    // 更新GUI参数显示
    _updateGUIParams() {
        this.params.randSeed = this.effect.params.randSeed;
        this.params.emitterTranslationX = this.effect.params.emitterTranslationX;
        this.params.emitterTranslationY = this.effect.params.emitterTranslationY;
        this.params.emitterTranslationZ = this.effect.params.emitterTranslationZ;
        this.params.emitterScaleX = this.effect.params.emitterScaleX;
        this.params.emitterScaleY = this.effect.params.emitterScaleY;
        this.params.emitterScaleZ = this.effect.params.emitterScaleZ;
        this.params.pShapeType = this.effect.params.pShapeType;
        this.params.pColorR = this.effect.params.pColor.r;
        this.params.pColorG = this.effect.params.pColor.g;
        this.params.pColorB = this.effect.params.pColor.b;
        this.params.pUseInputColor = this.effect.params.pUseInputColor;
        this.params.pEndCycle = this.effect.params.pEndCycle;
        this.params.particleTotalNum = this.effect.params.particleTotalNum;
        this.params.pSize = this.effect.params.pSize;
        this.params.pSizeRandom = this.effect.params.pSizeRandom;
        this.params.pSizeRatioX = this.effect.params.pSizeRatioX;
        this.params.pSizeRatioY = this.effect.params.pSizeRatioY;
        this.params.pSizeOverLife = this.effect.params.pSizeOverLife;
        this.params.pOpacity = this.effect.params.pOpacity;
        this.params.pOpacityRandom = this.effect.params.pOpacityRandom;
        this.params.pOpacityOverLife = this.effect.params.pOpacityOverLife;
        this.params.pLife = this.effect.params.pLife;
        this.params.pLifeRandom = this.effect.params.pLifeRandom;
        this.params.pVeloX = this.effect.params.pVeloX;
        this.params.pVeloY = this.effect.params.pVeloY;
        this.params.pVeloZ = this.effect.params.pVeloZ;
        this.params.pVeloRandomX = this.effect.params.pVeloRandomX;
        this.params.pVeloRandomY = this.effect.params.pVeloRandomY;
        this.params.pVeloRandomZ = this.effect.params.pVeloRandomZ;
        this.params.pAccelerationX = this.effect.params.pAccelerationX;
        this.params.pAccelerationY = this.effect.params.pAccelerationY;
        this.params.pAccelerationZ = this.effect.params.pAccelerationZ;
        this.params.pAccelerationRandomX = this.effect.params.pAccelerationRandomX;
        this.params.pAccelerationRandomY = this.effect.params.pAccelerationRandomY;
        this.params.pAccelerationRandomZ = this.effect.params.pAccelerationRandomZ;
        this.params.resistance = this.effect.params.resistance;
        this.params.turbulence = this.effect.params.turbulence;
        this.params.pRotationX = this.effect.params.pRotationX;
        this.params.pRotationY = this.effect.params.pRotationY;
        this.params.pRotationZ = this.effect.params.pRotationZ;
        this.params.pRotationRandomX = this.effect.params.pRotationRandomX;
        this.params.pRotationRandomY = this.effect.params.pRotationRandomY;
        this.params.pRotationRandomZ = this.effect.params.pRotationRandomZ;
        this.params.sliderSpeed = this.effect.params.sliderSpeed;
        this.params.sliderNumber = this.effect.params.sliderNumber;
    }
    
    // 刷新GUI显示
    _refreshGUI() {
        // 遍历所有GUI控制器并更新显示
        this.gui.__controllers.forEach(controller => {
            controller.updateDisplay();
        });
        
        // 递归更新所有文件夹中的控制器
        const updateFolder = (folder) => {
            folder.__controllers.forEach(controller => {
                controller.updateDisplay();
            });
            Object.values(folder.__folders).forEach(subfolder => {
                updateFolder(subfolder);
            });
        };
        
        Object.values(this.gui.__folders).forEach(folder => {
            updateFolder(folder);
        });
    }
}

export { LumiParticleTest };
