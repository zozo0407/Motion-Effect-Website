import { BaseTest } from './BaseTest';
const { GaussianBlurShaderPass } = require('../../src/pp/LumiGaussianBlur/GaussianBlurShaderPass.js');
const { EffectComposer } = require('three/examples/jsm/postprocessing/EffectComposer.js');
const { RenderPass } = require('three/examples/jsm/postprocessing/RenderPass.js');

class LumiGaussianBlurTest extends BaseTest {
    constructor() {
        super();
        this.params = {};
    }

    async init() {
        this.setupScene();

        this.effect = new GaussianBlurShaderPass();
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
            quality: this.effect.params.quality,
            spaceDither: this.effect.params.spaceDither,
            horizontalStrength: this.effect.params.horizontalStrength,
            verticalStrength: this.effect.params.verticalStrength,
            blurDirection: this.effect.params.blurDirection,
            borderType: this.effect.params.borderType,
            blurAlpha: this.effect.params.blurAlpha,
            inverseGammaCorrection: this.effect.params.inverseGammaCorrection
        };

        this.gui.add(this.params, 'intensity', 0, 1000).onChange(value => { 
            this.effect.setParameter('intensity', value);
        }).name('模糊度 (Intensity)');

        this.gui.add(this.params, 'quality', 0, 1).onChange(value => { 
            this.effect.setParameter('quality', value);
            // 质量改变需要重新初始化
            this.effect.initialize();
        }).name('质量 (Quality)');

        this.gui.add(this.params, 'spaceDither', 0, 1).onChange(value => { 
            this.effect.setParameter('spaceDither', value);
        }).name('消减格子效应 (Space Dither)');

        this.gui.add(this.params, 'horizontalStrength', 0, 1).onChange(value => { 
            this.effect.setParameter('horizontalStrength', value);
        }).name('水平强度 (Horizontal Strength)');

        this.gui.add(this.params, 'verticalStrength', 0, 1).onChange(value => { 
            this.effect.setParameter('verticalStrength', value);
        }).name('垂直强度 (Vertical Strength)');

        this.gui.add(this.params, 'blurDirection', [
            'Horizontal and Vertical', 
            'Horizontal', 
            'Vertical'
        ]).onChange(value => { 
            this.effect.setParameter('blurDirection', value);
        }).name('模糊方向 (Blur Direction)');

        this.gui.add(this.params, 'borderType', [
            'Normal', 
            'Replicate', 
            'Black', 
            'Mirror'
        ]).onChange(value => { 
            this.effect.setParameter('borderType', value);
        }).name('边界模式 (Border Type)');

        this.gui.add(this.params, 'blurAlpha').onChange(value => { 
            this.effect.setParameter('blurAlpha', value);
        }).name('模糊透明通道 (Blur Alpha Channel)');

        this.gui.add(this.params, 'inverseGammaCorrection').onChange(value => { 
            this.effect.setParameter('inverseGammaCorrection', value);
        }).name('反伽马校正 (Inverse Gamma Correction)');

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

export { LumiGaussianBlurTest };