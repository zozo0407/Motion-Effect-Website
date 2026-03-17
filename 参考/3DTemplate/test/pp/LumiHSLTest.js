import { BaseTest } from './BaseTest';
const { HSLShaderPass } = require('../../src/pp/LumiHSL/HSLShaderPass.js');

class LumiHSLTest extends BaseTest {
    constructor() {
        super();
        this.params = {};
    }

    async init() {
        // HSL Effect Setup
        this.effect = new HSLShaderPass();
        
        await super.init();
    }

    setupGUI() {
        const colorChannels = ['Red', 'Orange', 'Yellow', 'Green', 'Cyan', 'Blue', 'Purple', 'Magenta'];
        this.params = {};
        
        // 初始化参数
        colorChannels.forEach(color => {
            this.params[`${color.toLowerCase()}H`] = 0;
            this.params[`${color.toLowerCase()}S`] = 0;
            this.params[`${color.toLowerCase()}L`] = 0;
        });

        // 为每个颜色通道创建GUI控件
        colorChannels.forEach(color => {
            const folder = this.gui.addFolder(color);
            const lowerColor = color.toLowerCase();
            
            ['H', 'S', 'L'].forEach((param, index) => {
                folder.add(this.params, `${lowerColor}${param}`, 0, 1).step(0.01)
                    .name(`${param === 'H' ? 'Hue' : param === 'S' ? 'Saturation' : 'Lightness'}`)
                    .onChange(value => {
                        const h = this.params[`${lowerColor}H`];
                        const s = this.params[`${lowerColor}S`];
                        const l = this.params[`${lowerColor}L`];
                        this.effect[`set${color}`]([h, s, l]);
                    });
            });
        });

        super.setupGUI();
    }
}

export { LumiHSLTest };
