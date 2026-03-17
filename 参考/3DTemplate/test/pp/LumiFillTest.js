import { BaseTest } from './BaseTest.js';
const { FillShaderPass } = require('../../src/pp/LumiFill/FillShaderPass.js');

class LumiFillTest extends BaseTest {
    constructor() {
        super();
        this.params = {};
    }

    async init() {
        this.effect = new FillShaderPass();
        await super.init();
    }

    setupGUI() {
        this.params = {
            fillColor: this.effect.fillColor,
            fillMode: this.effect.fillMode,
        };

        // this.params.fillColor = this.effect.fillColor;

        this.gui.add(this.params.fillColor, 'x', 0, 1).name('填充颜色 R').onChange(value => { this.effect.fillColor.x = value; });
        this.gui.add(this.params.fillColor, 'y', 0, 1).name('填充颜色 G').onChange(value => { this.effect.fillColor.y = value; });
        this.gui.add(this.params.fillColor, 'z', 0, 1).name('填充颜色 B').onChange(value => { this.effect.fillColor.z = value; });
        this.gui.add(this.params, 'fillMode', 0, 1, 1).onChange(value => { this.effect.fillMode = value; });

        super.setupGUI();
    }
}

export { LumiFillTest };
