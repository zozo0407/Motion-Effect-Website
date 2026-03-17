import { BaseTest } from './BaseTest.js';
const { ShakeShaderPass } = require('../../src/pp/LumiShake/ShakeShaderPass.js');

class LumiShakeTest extends BaseTest {
    constructor() {
        super();
        this.params = {};
    }

    async init() {
        this.effect = new ShakeShaderPass();
        await super.init();
    }

    setupGUI() {
        this.params = {
            intensity: this.effect.intensity,
            shakeFrequency: this.effect.shakeFrequency,
            shakeDirection: this.effect.shakeDirection,
            shakeSpeed: this.effect.shakeSpeed,
        };

        this.gui.add(this.params, 'intensity', 0, 1).onChange(value => { this.effect.intensity = value; });
        this.gui.add(this.params, 'shakeFrequency', 0, 15).onChange(value => { this.effect.shakeFrequency = value; });
        this.gui.add(this.params.shakeDirection, 'x', 0, 1).name('抖动方向 X').onChange(value => { this.effect.shakeDirection.x = value; });
        this.gui.add(this.params.shakeDirection, 'y', 0, 1).name('抖动方向 Y').onChange(value => { this.effect.shakeDirection.y = value; });
        this.gui.add(this.params, 'shakeSpeed', 0, 1).onChange(value => { this.effect.shakeSpeed = value; });

        super.setupGUI();
    }
}

export { LumiShakeTest };
