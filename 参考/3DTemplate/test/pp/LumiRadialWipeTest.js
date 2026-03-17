import { BaseTest } from './BaseTest.js';
const { RadialWipeShaderPass } = require('../../src/pp/LumiRadialWipe/RadialWipeShaderPass.js');

class LumiRadialWipeTest extends BaseTest {
    constructor() {
        super();
        this.params = {};
    }

    async init() {
        this.effect = new RadialWipeShaderPass();
        await super.init();
    }

    setupGUI() {
        this.params = {
            intensity: this.effect.intensity,
            wipeCenter: this.effect.wipeCenter,
            startAngle: this.effect.startAngle,
            wipeMode: this.effect.wipeMode,
            feather: this.effect.feather,
        };

        this.gui.add(this.params, 'intensity', 0, 1).onChange(value => { this.effect.intensity = value; });
        this.gui.add(this.params.wipeCenter, 'x', 0, 1).name('擦除中心点 X').onChange(value => { this.effect.wipeCenter.x = value; });
        this.gui.add(this.params.wipeCenter, 'y', 0, 1).name('擦除中心点 Y').onChange(value => { this.effect.wipeCenter.y = value; });
        this.gui.add(this.params, 'startAngle', 0, 360).onChange(value => { this.effect.startAngle = value; });
        this.gui.add(this.params, 'wipeMode', 0, 2).onChange(value => { this.effect.wipeMode = value; });
        this.gui.add(this.params, 'feather', 0, 1).onChange(value => { this.effect.feather = value; });

        super.setupGUI();
    }
}

export { LumiRadialWipeTest };
