import { BaseTest } from './BaseTest.js';
const { PosterizeShaderPass } = require('../../src/pp/LumiPosterize/PosterizeShaderPass.js');

class LumiPosterizeTest extends BaseTest {
    constructor() {
        super();
        this.params = {};
    }

    async init() {
        this.effect = new PosterizeShaderPass();
        await super.init();
    }

    setupGUI() {
        this.params = {
            levels: this.effect.levels,
        };

        this.gui.add(this.params, 'levels', 2, 100.0).onChange(value => { this.effect.levels = value; });

        super.setupGUI();
    }
}

export { LumiPosterizeTest };
