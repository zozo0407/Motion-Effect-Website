import { BaseTest } from './BaseTest.js';
const { ToneShaderPass } = require('../../src/pp/LumiTone/ToneShaderPass.js');

class LumiToneTest extends BaseTest {
    constructor() {
        super();
        this.params = {};
    }

    async init() {
        this.effect = new ToneShaderPass();
        await super.init();
    }

    setupGUI() {
        this.params = {
            exposure: this.effect.exposure,
            contrast: this.effect.contrast,
            highlights: this.effect.highlights,
            shadows: this.effect.shadows,
            whites: this.effect.whites,
            blacks: this.effect.blacks,
            saturation: this.effect.saturation,
            vibrance: this.effect.vibrance,
        };



        this.gui.add(this.params, 'exposure', 0, 1).name('曝光调节').onChange(value => { this.effect.setExposure(value); });
        this.gui.add(this.params, 'contrast', 0, 1).name('对比度').onChange(value => { this.effect.setContrast(value); });
        this.gui.add(this.params, 'highlights', 0, 1).name('高光调节').onChange(value => { this.effect.setHighlights(value); });
        this.gui.add(this.params, 'shadows', 0, 1).name('阴影调节').onChange(value => { this.effect.setShadows(value); });
        this.gui.add(this.params, 'whites', 0, 1).name('白色调节').onChange(value => { this.effect.setWhites(value); });
        this.gui.add(this.params, 'blacks', 0, 1).name('黑色调节').onChange(value => { this.effect.setBlacks(value); });
        this.gui.add(this.params, 'saturation', 0, 1).name('饱和度').onChange(value => { this.effect.setSaturation(value); });
        this.gui.add(this.params, 'vibrance', 0, 1).name('自然饱和度').onChange(value => { this.effect.setVibrance(value); });

        super.setupGUI();
    }
}

export { LumiToneTest };
