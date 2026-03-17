import { BaseTest } from './BaseTest.js';
const { MosaicShaderPass } = require('../../src/pp/LumiMosaic/MosaicShaderPass.js');

class LumiMosaicTest extends BaseTest {
    constructor() {
        super();
        this.params = {};
    }

    async init() {
        this.effect = new MosaicShaderPass();
        await super.init();
    }

    setupGUI() {
        this.params = {
            horizontal: this.effect.horizontal,
            vertical: this.effect.vertical,
            sharp: this.effect.sharp,
        };

        this.gui.add(this.params, 'horizontal', 0, 4000.0).onChange(value => { this.effect.horizontal = value; });
        this.gui.add(this.params, 'vertical', 0, 4000.0).onChange(value => { this.effect.vertical = value; });
        this.gui.add(this.params, 'sharp', 0, 1).onChange(value => { this.effect.sharp = value; });

        super.setupGUI();
    }
}

export { LumiMosaicTest };
