import { BaseTest } from './BaseTest.js';
const { NegativeShaderPass } = require('../../src/pp/LumiNegative/NegativeShaderPass.js');

class LumiNegativeTest extends BaseTest {
    constructor() {
        super();
        this.params = {};
    }

    async init() {
        this.effect = new NegativeShaderPass();
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

export { LumiNegativeTest };
