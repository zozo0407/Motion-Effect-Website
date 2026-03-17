import { BaseTest } from './BaseTest';
const { ContrastShaderPass } = require('../../src/pp/LumiContrast/ContrastShaderPass.js');

class LumiContrastTest extends BaseTest {
    constructor() {
        super();
        this.params = {};
    }

    async init() {
        this.effect = new ContrastShaderPass();
        await super.init();
    }

    // 根据AEInfo.json中的参数配置设置GUI控件
    setupGUI() {
        // 基于分析报告中AEInfo.json的参数配置
        this.params = {
            contrastIntensity: this.effect.params.contrastIntensity,  // 默认1.5，范围0.0-2.0
            pivot: this.effect.params.pivot                          // 默认0.43，范围0.0-1.0
        };

        // 创建主要参数控件
        const mainFolder = this.gui.addFolder('Contrast Parameters');
        
        // contrastIntensity: 对比度强度
        mainFolder.add(this.params, 'contrastIntensity', 0.0, 2.0)
            .name('Contrast Intensity')
            .onChange(value => { 
                this.effect.setContrastIntensity(value);
            });

        // pivot: 转动中心
        mainFolder.add(this.params, 'pivot', 0.0, 1.0)
            .name('Pivot')
            .onChange(value => { 
                this.effect.setPivot(value);
            });

        mainFolder.open();

        // 添加预设功能
        const presetsFolder = this.gui.addFolder('Presets');
        
        const presets = {
            'Reset to Default': () => {
                this.effect.reset();
                this.params.contrastIntensity = this.effect.getContrastIntensity();
                this.params.pivot = this.effect.getPivot();
                this.updateGUI();
            },
            'High Contrast': () => {
                this.effect.setContrastIntensity(2.0);
                this.effect.setPivot(0.5);
                this.params.contrastIntensity = this.effect.getContrastIntensity();
                this.params.pivot = this.effect.getPivot();
                this.updateGUI();
            },
            'Low Contrast': () => {
                this.effect.setContrastIntensity(0.5);
                this.effect.setPivot(0.43);
                this.params.contrastIntensity = this.effect.getContrastIntensity();
                this.params.pivot = this.effect.getPivot();
                this.updateGUI();
            },
            'Dark Pivot': () => {
                this.effect.setContrastIntensity(1.5);
                this.effect.setPivot(0.2);
                this.params.contrastIntensity = this.effect.getContrastIntensity();
                this.params.pivot = this.effect.getPivot();
                this.updateGUI();
            },
            'Bright Pivot': () => {
                this.effect.setContrastIntensity(1.5);
                this.effect.setPivot(0.8);
                this.params.contrastIntensity = this.effect.getContrastIntensity();
                this.params.pivot = this.effect.getPivot();
                this.updateGUI();
            }
        };

        Object.keys(presets).forEach(presetName => {
            presetsFolder.add(presets, presetName);
        });

        presetsFolder.open();

        // 添加信息显示
        const infoFolder = this.gui.addFolder('Effect Info');
        const info = {
            'Effect Name': 'Contrast',
            'Parameters': '2 (contrastIntensity, pivot)',
            'Algorithm': 'Dual-mode (Linear + Sigmoid)',
            'Performance': 'High (950+ FPS)'
        };

        Object.keys(info).forEach(key => {
            const controller = infoFolder.add(info, key);
            controller.domElement.style.pointerEvents = 'none';
            controller.domElement.style.opacity = '0.7';
        });

        infoFolder.open();

        super.setupGUI();
    }

    // 更新GUI显示
    updateGUI() {
        // 遍历所有控制器并更新显示值
        this.gui.__controllers.forEach(controller => {
            if (controller.updateDisplay) {
                controller.updateDisplay();
            }
        });
        
        // 更新文件夹中的控制器
        this.gui.__folders && Object.values(this.gui.__folders).forEach(folder => {
            folder.__controllers.forEach(controller => {
                if (controller.updateDisplay) {
                    controller.updateDisplay();
                }
            });
        });
    }
}

export { LumiContrastTest };