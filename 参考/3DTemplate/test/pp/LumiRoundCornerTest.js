import { BaseTest } from './BaseTest.js';
const { RoundCornerShaderPass } = require('../../src/pp/LumiRoundCorner/RoundCornerShaderPass.js');

class LumiRoundCornerTest extends BaseTest {
    constructor() {
        super();
        this.params = {};
    }

    async init() {
        this.effect = new RoundCornerShaderPass();
        await super.init();
    }

    setupGUI() {
        this.params = {
            radius: this.effect.radius,
        };

        this.gui.add(this.params, 'radius', 0, 1).onChange(value => { this.effect.radius = value; });

        super.setupGUI();
    }
}

export { LumiRoundCornerTest };
