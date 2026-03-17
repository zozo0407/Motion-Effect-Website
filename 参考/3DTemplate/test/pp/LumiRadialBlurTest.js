import { BaseTest } from './BaseTest.js';
const { RadialBlurShaderPass } = require('../../src/pp/LumiRadialBlur/RadialBlurShaderPass.js');

class LumiRadialBlurTest extends BaseTest {
    constructor() {
        super();
        this.params = {};
    }

    async init() {
        this.effect = new RadialBlurShaderPass();
        await super.init();
    }

    setupGUI() {
        this.params = {
            blurType: this.effect.blurType,
            amount: this.effect.amount,
            quality: this.effect.quality,
            center: this.effect.center,
            weightDecay: this.effect.weightDecay,
        };

        this.gui.add(this.params, 'blurType', 0, 5).onChange(value => { this.effect.blurType = value; });
        this.gui.add(this.params, 'amount', -250.0, 250.0).onChange(value => { this.effect.amount = value; });
        this.gui.add(this.params, 'quality', 0, 1).onChange(value => { this.effect.quality = value; });
        this.gui.add(this.params.center, 'x', 0, 1).name('中心 X').onChange(value => { this.effect.center.x = value; });
        this.gui.add(this.params.center, 'y', 0, 1).name('中心 Y').onChange(value => { this.effect.center.y = value; });
        this.gui.add(this.params, 'weightDecay', 0, 1).onChange(value => { this.effect.weightDecay = value; });

        super.setupGUI();
    }
}

export { LumiRadialBlurTest };
