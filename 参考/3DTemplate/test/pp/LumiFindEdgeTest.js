import { BaseTest } from './BaseTest.js';
const { FindEdgeShaderPass } = require('../../src/pp/LumiFindEdge/FindEdgeShaderPass.js');

class LumiFindEdgeTest extends BaseTest {
    constructor() {
        super();
        this.params = {};
    }

    async init() {
        this.effect = new FindEdgeShaderPass();
        await super.init();
    }

    setupGUI() {
        this.params = {
            brightness: this.effect.brightness,
            grayColor: this.effect.grayColor,
            upperLimit: this.effect.upperLimit,
            lowerLimit: this.effect.lowerLimit,
        };

        this.gui.add(this.params, 'brightness', 0, 1).onChange(value => { this.effect.brightness = value; });
        this.gui.add(this.params, 'grayColor', 0, 1).onChange(value => { this.effect.grayColor = value; });
        this.gui.add(this.params, 'upperLimit', 0, 1).onChange(value => { this.effect.upperLimit = value; });
        this.gui.add(this.params, 'lowerLimit', 0, 1).onChange(value => { this.effect.lowerLimit = value; });

        super.setupGUI();
    }
}

export { LumiFindEdgeTest };
