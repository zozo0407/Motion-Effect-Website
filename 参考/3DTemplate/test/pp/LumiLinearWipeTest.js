import { BaseTest } from './BaseTest.js';
const { LinearWipeShaderPass } = require('../../src/pp/LumiLinearWipe/LinearWipeShaderPass.js');

class LumiLinearWipeTest extends BaseTest {
    constructor() {
        super();
        this.params = {};
    }

    async init() {
        this.effect = new LinearWipeShaderPass();
        await super.init();
    }

    setupGUI() {
        this.params = {
            intensity: this.effect.intensity,
            rotation: this.effect.rotation,
            feather: this.effect.feather,
        };

        this.gui.add(this.params, 'intensity', 0, 1).name('强度').onChange(value => { this.effect.setIntensity(value); });
        this.gui.add(this.params, 'rotation', 0, 360).name('旋转角度（角度）').onChange(value => { this.effect.setRotation(value); });
        this.gui.add(this.params, 'feather', 0, 1).name('羽化程度，控制边缘柔和度').onChange(value => { this.effect.setFeather(value); });

        super.setupGUI();
    }
}

export { LumiLinearWipeTest };
