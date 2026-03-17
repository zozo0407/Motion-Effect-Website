import { BaseTest } from './BaseTest.js';
const { ChromaticAberrationShaderPass } = require('../../src/pp/LumiChromaticAberration/ChromaticAberrationShaderPass.js');

class LumiChromaticAberrationTest extends BaseTest {
    constructor() {
        super();
        this.params = {};
    }

    async init() {
        this.effect = new ChromaticAberrationShaderPass();
        await super.init();
    }

    setupGUI() {
        this.params = {
            offsetX: this.effect.offsetX,
            offsetY: this.effect.offsetY,
        };

        this.gui.add(this.params, 'offsetX', -1, 1).onChange(value => { this.effect.offsetX = value; });
        this.gui.add(this.params, 'offsetY', -1, 1).onChange(value => { this.effect.offsetY = value; });

        super.setupGUI();
    }
}

export { LumiChromaticAberrationTest };
