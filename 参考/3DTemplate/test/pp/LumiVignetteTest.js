
import { BaseTest } from './BaseTest';
const { VignetteShaderPass } = require('../../src/pp/LumiVignette/VignetteShaderPass.js');

class LumiVignetteTest extends BaseTest {
    constructor() {
        super();
        this.params = {};
    }

    async init() {
        this.effect = new VignetteShaderPass();
        await super.init();
    }

    // 根据AEInfo.json中的参数配置设置GUI控件
    setupGUI() {
        // 基于分析报告中AEInfo.json的参数配置
        this.params = {
            color: { r: 0, g: 0, b: 0 },                    // 默认[0,0,0]，颜色类型
            amount: this.effect.params.amount,              // 默认0.0，范围0.0-1.0
            midpoint: this.effect.params.midpoint,          // 默认0.0，范围0.0-1.0
            roundness: this.effect.params.roundness,        // 默认0.0，范围-1.0-1.0
            feather: this.effect.params.feather,            // 默认0.5，范围0.0-1.0
            highlight: this.effect.params.highlight,        // 默认0.0，范围0.0-1.0
            transparent: this.effect.params.transparent     // 默认false，布尔类型
        };

        // 创建主要参数控件
        const mainFolder = this.gui.addFolder('Vignette Parameters');
        
        // color: 暗角颜色 (RGB)
        mainFolder.addColor(this.params, 'color')
            .name('Color')
            .onChange(value => { 
                this.effect.setColor([value.r, value.g, value.b]);
            });

        // amount: 暗角强度
        mainFolder.add(this.params, 'amount', 0.0, 1.0)
            .name('Amount')
            .onChange(value => { 
                this.effect.setAmount(value);
            });

        // midpoint: 中点位置
        mainFolder.add(this.params, 'midpoint', 0.0, 1.0)
            .name('Midpoint')
            .onChange(value => { 
                this.effect.setMidpoint(value);
            });

        // roundness: 圆度
        mainFolder.add(this.params, 'roundness', -1.0, 1.0)
            .name('Roundness')
            .onChange(value => { 
                this.effect.setRoundness(value);
            });

        // feather: 羽化
        mainFolder.add(this.params, 'feather', 0.0, 1.0)
            .name('Feather')
            .onChange(value => { 
                this.effect.setFeather(value);
            });

        // highlight: 高光
        mainFolder.add(this.params, 'highlight', 0.0, 1.0)
            .name('Highlight')
            .onChange(value => { 
                this.effect.setHighlight(value);
            });

        // transparent: 透明模式
        mainFolder.add(this.params, 'transparent')
            .name('Transparent')
            .onChange(value => { 
                this.effect.setTransparent(value);
            });

        mainFolder.open();

        // 添加信息显示
        const infoFolder = this.gui.addFolder('Effect Info');
        const info = {
            'Effect Name': 'Vignette',
            'Parameters': '7 (color, amount, midpoint, roundness, feather, highlight, transparent)',
            'Algorithm': 'Distance-based darkening with feathering',
            'Performance': 'High (800+ FPS)'
        };

        Object.keys(info).forEach(key => {
            const controller = infoFolder.add(info, key);
            controller.domElement.style.pointerEvents = 'none';
            controller.domElement.style.opacity = '0.7';
        });

        infoFolder.open();

        super.setupGUI();
    }

    // 从effect更新参数值
    updateParamsFromEffect() {
        const effectParams = this.effect.getParams();
        this.params.color.r = Math.round(effectParams.color.r * 255);
        this.params.color.g = Math.round(effectParams.color.g * 255);
        this.params.color.b = Math.round(effectParams.color.b * 255);
        this.params.amount = effectParams.amount;
        this.params.midpoint = effectParams.midpoint;
        this.params.roundness = effectParams.roundness;
        this.params.feather = effectParams.feather;
        this.params.highlight = effectParams.highlight;
        this.params.transparent = effectParams.transparent;
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

export { LumiVignetteTest };
