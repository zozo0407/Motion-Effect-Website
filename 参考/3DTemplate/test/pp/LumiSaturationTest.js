import { BaseTest } from './BaseTest.js';
const { SaturationShaderPass } = require('../../src/pp/LumiSaturation/SaturationShaderPass.js');

class LumiSaturationTest extends BaseTest {
    constructor() {
        super();
        this.params = {};
    }

    async init() {
        this.effect = new SaturationShaderPass();
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

export { LumiSaturationTest };
