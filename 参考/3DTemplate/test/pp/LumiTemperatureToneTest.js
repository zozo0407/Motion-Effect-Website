import { BaseTest } from './BaseTest.js';
const { TemperatureToneShaderPass } = require('../../src/pp/LumiTemperatureTone/TemperatureToneShaderPass.js');

class LumiTemperatureToneTest extends BaseTest {
    constructor() {
        super();
        this.params = {};
    }

    async init() {
        this.effect = new TemperatureToneShaderPass();
        await super.init();
    }

    setupGUI() {
        this.params = {
            temperature: this.effect.temperature,
            tint: this.effect.tint,
        };

        this.gui.add(this.params, 'temperature', 0, 1).onChange(value => { this.effect.temperature = value; });
        this.gui.add(this.params, 'tint', 0, 1).onChange(value => { this.effect.tint = value; });

        super.setupGUI();
    }
}

export { LumiTemperatureToneTest };
