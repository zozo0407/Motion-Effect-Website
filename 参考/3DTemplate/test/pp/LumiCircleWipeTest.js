import { BaseTest } from './BaseTest.js';
const { CircleWipeShaderPass } = require('../../src/pp/LumiCircleWipe/CircleWipeShaderPass.js');

class LumiCircleWipeTest extends BaseTest {
    constructor() {
        super();
        this.params = {};
    }

    async init() {
        this.effect = new CircleWipeShaderPass();
        await super.init();
    }

    setupGUI() {
        this.params = {
            center: this.effect.center,
            feather: this.effect.feather,
            reverse: this.effect.reverse,
        };

        this.params.center = this.effect.center;

        this.gui.add(this.params.center, 'x', 0, 1).name('圆心位置 X').onChange(value => { this.effect.center.x = value; });
        this.gui.add(this.params.center, 'y', 0, 1).name('圆心位置 Y').onChange(value => { this.effect.center.y = value; });
        this.gui.add(this.params, 'feather', 0, 1).onChange(value => { this.effect.feather = value; });
        this.gui.add(this.params, 'reverse', 0, 1).onChange(value => { this.effect.reverse = value; });

        super.setupGUI();
    }
}

export { LumiCircleWipeTest };
