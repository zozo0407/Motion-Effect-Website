import { BaseTest } from './BaseTest.js';
const { BrightnessShaderPass } = require('../../src/pp/LumiBrightness/BrightnessShaderPass.js');

class LumiBrightnessTest extends BaseTest {
    constructor() {
        super();
        this.params = {};
    }

    async init() {
        this.effect = new BrightnessShaderPass();
        await super.init();
    }

    setupGUI() {
        this.params = {
            intensity: this.effect.intensity,
        };

        this.gui.add(this.params, 'intensity', 0, 1).onChange(value => { this.effect.intensity = value; });

        super.setupGUI();
    }
}

export { LumiBrightnessTest };
