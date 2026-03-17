import { BaseTest } from './BaseTest.js';
const { TwirlShaderPass } = require('../../src/pp/LumiTwirl/TwirlShaderPass.js');

class LumiTwirlTest extends BaseTest {
    constructor() {
        super();
        this.params = {};
    }

    async init() {
        this.effect = new TwirlShaderPass();
        await super.init();
    }

    setupGUI() {
        this.params = {
            center: this.effect.center,
            radius: this.effect.radius,
            angle: this.effect.angle,
            intensity: this.effect.intensity,
        };

        this.gui.add(this.params.center, 'x', 0, 1).name('旋涡中心 X').onChange(value => { this.effect.center[0] = value; });
        this.gui.add(this.params.center, 'y', 0, 1).name('旋涡中心 Y').onChange(value => { this.effect.center[1] = value; });
        this.gui.add(this.params, 'radius', 0, 1).name('影响半径').onChange(value => { this.effect.radius = value; });
        this.gui.add(this.params, 'angle', 0, 360).name('最大旋转角度').onChange(value => { this.effect.angle = value; });
        this.gui.add(this.params, 'intensity', 0, 1).name('效果强度').onChange(value => { this.effect.intensity = value; });

        super.setupGUI();
    }
}

export { LumiTwirlTest };
