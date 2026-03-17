import { BaseTest } from './BaseTest';
const { LensShaderPass } = require('../../src/pp/LumiLens/LensShaderPass.js');

class LumiLensTest extends BaseTest {
    constructor() {
        super();
        this.params = {};
    }

    async init() {
        this.effect = new LensShaderPass();
        await super.init();
    }

    setupGUI() {
        this.params = {
            convergence: this.effect.params.convergence.value,
            center: this.effect.params.center.value,
            radius: this.effect.params.radius.value,
        };

        this.gui.add(this.params, 'convergence', -100, 100).onChange(value => {
            this.effect.setConvergence(value);
        });
        this.gui.add(this.params.center, 'x', 0, 1).name('中心点 X').onChange(value => { this.effect.params.wipeCenter.x = value; });
        this.gui.add(this.params.center, 'y', 0, 1).name('中心点 Y').onChange(value => { this.effect.params.wipeCenter.y = value; });
        this.gui.add(this.params, 'radius', 0, 100).onChange(value => {
            this.effect.setRadius(value);
        });

        super.setupGUI();
    }
}

export { LumiLensTest };