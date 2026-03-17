import { BaseTest } from './BaseTest.js';
const { BokehBlurShaderPass } = require('../../src/pp/LumiBokehBlur/BokehBlurShaderPass.js');

class LumiBokehBlurTest extends BaseTest {
    constructor() {
        super();
        this.params = {};
    }

    async init() {
        this.effect = new BokehBlurShaderPass();
        await super.init();
    }

    setupGUI() {
        this.params = {
            blurSize: this.effect.blurSize,
            intensity: this.effect.intensity,
            quality: this.effect.quality,
            lightIntensity: this.effect.lightIntensity,
        };

        this.gui.add(this.params, 'blurSize', 0, 50).onChange(value => { this.effect.blurSize = value; });
        this.gui.add(this.params, 'intensity', 0, 1).onChange(value => { this.effect.intensity = value; });
        this.gui.add(this.params, 'quality', 0, 1).onChange(value => { this.effect.quality = value; });
        this.gui.add(this.params, 'lightIntensity', 0, 1).onChange(value => { this.effect.lightIntensity = value; });

        super.setupGUI();
    }
}

export { LumiBokehBlurTest };
