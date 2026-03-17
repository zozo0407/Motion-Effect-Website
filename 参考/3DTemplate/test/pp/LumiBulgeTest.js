import { BaseTest } from './BaseTest.js';
const { BulgeShaderPass } = require('../../src/pp/LumiBulge/BulgeShaderPass.js');

class LumiBulgeTest extends BaseTest {
    constructor() {
        super();
        this.params = {};
    }

    async init() {
        this.effect = new BulgeShaderPass();
        await super.init();
    }

    setupGUI() {
        this.params = {
            bulgeCenter: this.effect.bulgeCenter,
            bulgeRadius: this.effect.bulgeRadius,
            bulgeHeight: this.effect.bulgeHeight,
            coneRadius: this.effect.coneRadius,
            pinEdges: this.effect.pinEdges,
        };

        this.params.bulgeCenter = this.effect.bulgeCenter;
        this.params.bulgeRadius = this.effect.bulgeRadius;

        this.gui.add(this.params.bulgeCenter, 'x', -2, 2).name('膨胀中心偏移 X').onChange(value => { this.effect.bulgeCenter.x = value; });
        this.gui.add(this.params.bulgeCenter, 'y', -2, 2).name('膨胀中心偏移 Y').onChange(value => { this.effect.bulgeCenter.y = value; });
        this.gui.add(this.params.bulgeRadius, 'x', -2, 2).name('椭圆半径 X').onChange(value => { this.effect.bulgeRadius.x = value; });
        this.gui.add(this.params.bulgeRadius, 'y', -2, 2).name('椭圆半径 Y').onChange(value => { this.effect.bulgeRadius.y = value; });
        this.gui.add(this.params, 'bulgeHeight', 0, 2).onChange(value => { this.effect.bulgeHeight = value; });
        this.gui.add(this.params, 'coneRadius', 0, 1).onChange(value => { this.effect.coneRadius = value; });
        this.gui.add(this.params, 'pinEdges', 0, 1).onChange(value => { this.effect.pinEdges = value; });

        super.setupGUI();
    }
}

export { LumiBulgeTest };
