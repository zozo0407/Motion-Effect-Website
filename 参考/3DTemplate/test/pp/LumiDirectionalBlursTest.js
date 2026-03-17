import { BaseTest } from './BaseTest';
const { DirectionalBlursShaderPass } = require('../../src/pp/LumiDirectionalBlurs/DirectionalBlursShaderPass.js');
const { EffectComposer } = require('three/examples/jsm/postprocessing/EffectComposer.js');
const { RenderPass } = require('three/examples/jsm/postprocessing/RenderPass.js');

class LumiDirectionalBlursTest extends BaseTest {
    constructor() {
        super();
        this.params = {};
    }

    async init() {
        this.setupScene();

        this.effect = new DirectionalBlursShaderPass();
        this.initComposer();

        await super.init();
    }

    initComposer() {
        // 创建后处理渲染目标
        this.composer = new EffectComposer(this.renderer);
        this.renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(this.renderPass);
        this.composer.addPass(this.effect);
    }

    // 重写animate方法，使用Composer方式渲染
    animate() {
        if (this.effect && this.composer) {
            requestAnimationFrame(() => this.animate());

            // 使用RT链式处理编排器渲染
            this.composer.render();
        } else {
            super.animate();
        }
    }

    setupGUI() {
        if (!this.effect) {
            return;
        }

        this.params = {
            intensity: this.effect.params.intensity,
            angle: this.effect.params.angle,
            directionNum: this.effect.params.directionNum,
            exposure: this.effect.params.exposure,
            quality: this.effect.params.quality,
            spaceDither: this.effect.params.spaceDither,
            borderType: this.effect.params.borderType,
            blendMode: this.effect.params.blendMode,
        };

        this.gui.add(this.params, 'intensity', 0, 1000).onChange(value => { 
            this.effect.setParameter('intensity', value);
        }).name('模糊强度 (Blur Intensity)');
        
        this.gui.add(this.params, 'angle', 0, 360).onChange(value => { 
            this.effect.setParameter('angle', value);
        }).name('角度 (Angle)');
        
        this.gui.add(this.params, 'directionNum', 1, 4, 1).onChange(value => { 
            this.effect.setParameter('directionNum', value);
        }).name('方向数量 (Direction Number)');
        
        this.gui.add(this.params, 'exposure', 0, 10).onChange(value => { 
            this.effect.setParameter('exposure', value);
        }).name('曝光度 (Exposure)');
        
        this.gui.add(this.params, 'quality', 0.1, 1).onChange(value => { 
            this.effect.setParameter('quality', value);
        }).name('质量 (Quality)');
        
        this.gui.add(this.params, 'spaceDither', 0, 1).onChange(value => { 
            this.effect.setParameter('spaceDither', value);
        }).name('空间抖动 (Space Dither)');
        
        this.gui.add(this.params, 'borderType', ['Normal', 'Black', 'Mirror']).onChange(value => { 
            this.effect.setParameter('borderType', value);
        }).name('边界模式 (Border Type)');
        
        this.gui.add(this.params, 'blendMode', ['Screen', 'Add', 'Mean']).onChange(value => { 
            this.effect.setParameter('blendMode', value);
        }).name('混合模式 (Blend Mode)');

        super.setupGUI();
    }
    
    // 清理资源
    dispose() {
        if (this.effect) {
            this.effect.dispose();
        }
        super.dispose();
    }
}

export { LumiDirectionalBlursTest };