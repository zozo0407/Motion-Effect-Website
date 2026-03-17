import { BaseTest } from './BaseTest.js';
const { ThresholdShaderPass } = require('../../src/pp/LumiThreshold/ThresholdShaderPass.js');

class LumiThresholdTest extends BaseTest {
    constructor() {
        super();
        this.params = {};
    }

    async init() {
        this.effect = new ThresholdShaderPass();
        await super.init();
    }

    setupGUI() {
        this.params = {
            threshold: this.effect.threshold,
            smoothness: this.effect.smoothness,
        };

        this.gui.add(this.params, 'threshold', 0, 1).onChange(value => { this.effect.threshold = value; });
        this.gui.add(this.params, 'smoothness', 0, 1).onChange(value => { this.effect.smoothness = value; });

        super.setupGUI();
    }
}

export { LumiThresholdTest };
