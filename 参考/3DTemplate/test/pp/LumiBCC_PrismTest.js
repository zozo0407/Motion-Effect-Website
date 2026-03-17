import { BaseTest } from './BaseTest';
const { BCC_PrismShaderPass } = require('../../src/pp/LumiBCC_Prism/BCC_PrismShaderPass.js');

class LumiBCC_PrismTest extends BaseTest {
    constructor() {
        super();
        this.params = {};
    }

    async init() {
        this.effect = new BCC_PrismShaderPass();
        await super.init();
    }

    // 根据AEInfo.json中的参数配置设置GUI
    setupGUI() {
        // 创建GUI参数对象，映射到effect的params
        this.params = {
            // 强度参数
            intensity: this.effect.params.intensity.value,

            // globalTransform: 默认100, 范围0-400
            globalTransform: this.effect.params.globalTransform.value,
            
            // smoothness: 默认1, 范围0-1
            smoothness: this.effect.params.smoothness.value,
            
            // center: 默认[0.5, 0.5], point2d类型
            centerX: this.effect.params.center.value.x,
            centerY: this.effect.params.center.value.y,
            
            // weight: 默认1, 范围0-1
            weight: this.effect.params.weight.value,
            
            // scaleStart: 默认102, 范围1-500
            scaleStart: this.effect.params.scaleStart.value,
            
            // scaleEnd: 默认98, 范围1-500
            scaleEnd: this.effect.params.scaleEnd.value,
            
            // angleStart: 默认0.0, angle类型
            angleStart: this.effect.params.angleStart.value,
            
            // angleEnd: 默认0.0, angle类型
            angleEnd: this.effect.params.angleEnd.value,
            
            // falloff: 默认0, 范围-100到100
            falloff: this.effect.params.falloff.value,
            
            // offsetStart: 默认[0.5, 0.5], point2d类型
            offsetStartX: this.effect.params.offsetStart.value.x,
            offsetStartY: this.effect.params.offsetStart.value.y,
            
            // offsetEnd: 默认[0.5, 0.5], point2d类型
            offsetEndX: this.effect.params.offsetEnd.value.x,
            offsetEndY: this.effect.params.offsetEnd.value.y,
            
            // colorStart: 默认[255, 0, 0], RGB颜色
            colorStartR: this.effect.params.colorStart.value.x * 255,
            colorStartG: this.effect.params.colorStart.value.y * 255,
            colorStartB: this.effect.params.colorStart.value.z * 255,
            
            // colorMid: 默认[0, 255, 0], RGB颜色
            colorMidR: this.effect.params.colorMid.value.x * 255,
            colorMidG: this.effect.params.colorMid.value.y * 255,
            colorMidB: this.effect.params.colorMid.value.z * 255,
            
            // colorEnd: 默认[0, 0, 255], RGB颜色
            colorEndR: this.effect.params.colorEnd.value.x * 255,
            colorEndG: this.effect.params.colorEnd.value.y * 255,
            colorEndB: this.effect.params.colorEnd.value.z * 255
        };

        // 创建GUI控件并设置回调

        // 强度参数
        this.gui.add(this.params, 'intensity', 0, 1).onChange(value => {
            this.effect.setIntensity(value);
        });
        
        // 全局变换参数
        this.gui.add(this.params, 'globalTransform', 0, 400).onChange(value => {
            this.effect.setGlobalTransform(value);
        });

        // 平滑度参数
        this.gui.add(this.params, 'smoothness', 0, 1).onChange(value => {
            this.effect.setSmoothness(value);
        });

        // 中心点参数
        const centerFolder = this.gui.addFolder('Center');
        centerFolder.add(this.params, 'centerX', 0, 1).onChange(value => {
            this.effect.setCenter(value, this.params.centerY);
        });
        centerFolder.add(this.params, 'centerY', 0, 1).onChange(value => {
            this.effect.setCenter(this.params.centerX, value);
        });

        // 权重参数
        this.gui.add(this.params, 'weight', 0, 1).onChange(value => {
            this.effect.setWeight(value);
        });

        // 缩放参数
        const scaleFolder = this.gui.addFolder('Scale');
        scaleFolder.add(this.params, 'scaleStart', 1, 500).onChange(value => {
            this.effect.setScaleStart(value);
        });
        scaleFolder.add(this.params, 'scaleEnd', 1, 500).onChange(value => {
            this.effect.setScaleEnd(value);
        });

        // 角度参数
        const angleFolder = this.gui.addFolder('Angle');
        angleFolder.add(this.params, 'angleStart', -360, 360).onChange(value => {
            this.effect.setAngleStart(value);
        });
        angleFolder.add(this.params, 'angleEnd', -360, 360).onChange(value => {
            this.effect.setAngleEnd(value);
        });

        // 衰减参数
        this.gui.add(this.params, 'falloff', -100, 100).onChange(value => {
            this.effect.setFalloff(value);
        });

        // 起始偏移参数
        const offsetStartFolder = this.gui.addFolder('Offset Start');
        offsetStartFolder.add(this.params, 'offsetStartX', 0, 1).onChange(value => {
            this.effect.setOffsetStart(value, this.params.offsetStartY);
        });
        offsetStartFolder.add(this.params, 'offsetStartY', 0, 1).onChange(value => {
            this.effect.setOffsetStart(this.params.offsetStartX, value);
        });

        // 结束偏移参数
        const offsetEndFolder = this.gui.addFolder('Offset End');
        offsetEndFolder.add(this.params, 'offsetEndX', 0, 1).onChange(value => {
            this.effect.setOffsetEnd(value, this.params.offsetEndY);
        });
        offsetEndFolder.add(this.params, 'offsetEndY', 0, 1).onChange(value => {
            this.effect.setOffsetEnd(this.params.offsetEndX, value);
        });

        // 起始颜色参数
        const colorStartFolder = this.gui.addFolder('Color Start');
        colorStartFolder.add(this.params, 'colorStartR', 0, 255).onChange(value => {
            this.effect.setColorStartRGB(value, this.params.colorStartG, this.params.colorStartB);
        });
        colorStartFolder.add(this.params, 'colorStartG', 0, 255).onChange(value => {
            this.effect.setColorStartRGB(this.params.colorStartR, value, this.params.colorStartB);
        });
        colorStartFolder.add(this.params, 'colorStartB', 0, 255).onChange(value => {
            this.effect.setColorStartRGB(this.params.colorStartR, this.params.colorStartG, value);
        });

        // 中间颜色参数
        const colorMidFolder = this.gui.addFolder('Color Mid');
        colorMidFolder.add(this.params, 'colorMidR', 0, 255).onChange(value => {
            this.effect.setColorMidRGB(value, this.params.colorMidG, this.params.colorMidB);
        });
        colorMidFolder.add(this.params, 'colorMidG', 0, 255).onChange(value => {
            this.effect.setColorMidRGB(this.params.colorMidR, value, this.params.colorMidB);
        });
        colorMidFolder.add(this.params, 'colorMidB', 0, 255).onChange(value => {
            this.effect.setColorMidRGB(this.params.colorMidR, this.params.colorMidG, value);
        });

        // 结束颜色参数
        const colorEndFolder = this.gui.addFolder('Color End');
        colorEndFolder.add(this.params, 'colorEndR', 0, 255).onChange(value => {
            this.effect.setColorEndRGB(value, this.params.colorEndG, this.params.colorEndB);
        });
        colorEndFolder.add(this.params, 'colorEndG', 0, 255).onChange(value => {
            this.effect.setColorEndRGB(this.params.colorEndR, value, this.params.colorEndB);
        });
        colorEndFolder.add(this.params, 'colorEndB', 0, 255).onChange(value => {
            this.effect.setColorEndRGB(this.params.colorEndR, this.params.colorEndG, value);
        });

        super.setupGUI();
    }
}

export { LumiBCC_PrismTest };