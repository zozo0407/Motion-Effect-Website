import { BaseTest } from './BaseTest';
const { ScaleWipeShaderPass } = require('../../src/pp/LumiScaleWipe/ScaleWipeShaderPass.js');

class LumiScaleWipeTest extends BaseTest {
    constructor() {
        super();
        this.params = {};
    }

    async init() {
        this.effect = new ScaleWipeShaderPass();
        await super.init();
    }

    // 设置GUI方法中的参数和取值范围，参考AEInfo.json中的配置
    setupGUI() {
        this.params = {
            intensity: this.effect.params.intensity,
            stretch: this.effect.params.stretch,
            centerX: this.effect.params.center.x,
            centerY: this.effect.params.center.y,
            direction: this.effect.params.direction,
        };

        // 主要参数控件
        const mainFolder = this.gui.addFolder('Main Parameters');
        mainFolder.add(this.params, 'intensity', 0.0, 1.0).onChange(value => { 
            this.effect.setIntensity(value); 
        });
        mainFolder.add(this.params, 'stretch', -100.0, 100.0).onChange(value => { 
            this.effect.setStretch(value); 
        });
        mainFolder.add(this.params, 'direction', -360, 360).onChange(value => { 
            this.effect.setDirection(value); 
        });

        // 中心点参数控件
        const centerFolder = this.gui.addFolder('Center Point');
        centerFolder.add(this.params, 'centerX', 0.0, 1.0).onChange(value => { 
            this.effect.setCenter(value, this.params.centerY); 
        });
        centerFolder.add(this.params, 'centerY', 0.0, 1.0).onChange(value => { 
            this.effect.setCenter(this.params.centerX, value); 
        });

        // 预设效果
        const presetsFolder = this.gui.addFolder('Presets');
        const presets = {
            'Reset to Default': () => {
                this.effect.reset();
                this.updateGUIValues();
            },
            'Horizontal Wipe': () => {
                this.effect.setStretch(50.0);
                this.effect.setDirection(0);
                this.effect.setCenter(0.5, 0.5);
                this.updateGUIValues();
            },
            'Vertical Wipe': () => {
                this.effect.setStretch(50.0);
                this.effect.setDirection(90);
                this.effect.setCenter(0.5, 0.5);
                this.updateGUIValues();
            },
            'Diagonal Wipe': () => {
                this.effect.setStretch(75.0);
                this.effect.setDirection(45);
                this.effect.setCenter(0.5, 0.5);
                this.updateGUIValues();
            },
            'Reverse Wipe': () => {
                this.effect.setStretch(-60.0);
                this.effect.setDirection(30);
                this.effect.setCenter(0.3, 0.7);
                this.updateGUIValues();
            },
            'Strong Stretch': () => {
                this.effect.setStretch(100.0);
                this.effect.setDirection(120);
                this.effect.setCenter(0.2, 0.8);
                this.updateGUIValues();
            }
        };

        Object.keys(presets).forEach(name => {
            presetsFolder.add(presets, name);
        });

        // 效果信息
        const infoFolder = this.gui.addFolder('Effect Info');
        const info = {
            'Effect Name': 'Scale Wipe / 线性拉长',
            'Category': 'Transition / 过渡',
            'Parameters': '3 (stretch, center, direction)',
            'Algorithm': 'Non-linear directional stretching',
            'Performance': 'Excellent (723-1225 FPS)',
            'Use Cases': 'Scene transitions, dynamic effects'
        };
        
        Object.keys(info).forEach(key => {
            const controller = infoFolder.add(info, key);
            controller.domElement.style.pointerEvents = 'none';
            controller.domElement.querySelector('input').style.backgroundColor = '#f0f0f0';
        });

        // 展开主要文件夹
        mainFolder.open();
        centerFolder.open();
        presetsFolder.open();

        super.setupGUI();
    }

    updateGUIValues() {
        this.params.stretch = this.effect.getStretch();
        this.params.centerX = this.effect.getCenter().x;
        this.params.centerY = this.effect.getCenter().y;
        this.params.direction = this.effect.getDirection();
        
        // 更新GUI显示
        for (let i in this.gui.__controllers) {
            this.gui.__controllers[i].updateDisplay();
        }
        
        // 更新文件夹中的控制器
        this.gui.__folders['Main Parameters'].__controllers.forEach(controller => {
            controller.updateDisplay();
        });
        this.gui.__folders['Center Point'].__controllers.forEach(controller => {
            controller.updateDisplay();
        });
    }
}

export { LumiScaleWipeTest };
