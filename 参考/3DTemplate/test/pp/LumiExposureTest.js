import { BaseTest } from './BaseTest.js';
const { ExposureShaderPass } = require('../../src/pp/LumiExposure/ExposureShaderPass.js');

class LumiExposureTest extends BaseTest {
    constructor() {
        super();
        this.params = {};
    }

    async init() {
        this.effect = new ExposureShaderPass();
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

export { LumiExposureTest };