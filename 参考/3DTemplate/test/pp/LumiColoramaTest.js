import { BaseTest } from './BaseTest.js';
const { ColoramaShaderPass } = require('../../src/pp/LumiColorama/ColoramaShaderPass.js');

class LumiColoramaTest extends BaseTest {
    constructor() {
        super();
        this.params = {};
    }

    async init() {
        this.effect = new ColoramaShaderPass();
        await super.init();
    }

    setupGUI() {
        this.params = {
            color1: this.effect.color1,
            color2: this.effect.color2,
            color3: this.effect.color3,
            point1: this.effect.point1,
            point2: this.effect.point2,
            point3: this.effect.point3,
        };

        this.params.color1 = this.effect.color1;
        this.params.color2 = this.effect.color2;
        this.params.color3 = this.effect.color3;

        this.gui.add(this.params.color1, 'x', 0, 1).name('颜色1 R').onChange(value => { this.effect.color1.x = value; });
        this.gui.add(this.params.color1, 'y', 0, 1).name('颜色1 G').onChange(value => { this.effect.color1.y = value; });
        this.gui.add(this.params.color1, 'z', 0, 1).name('颜色1 B').onChange(value => { this.effect.color1.z = value; });
        this.gui.add(this.params.color2, 'x', 0, 1).name('颜色2 R').onChange(value => { this.effect.color2.x = value; });
        this.gui.add(this.params.color2, 'y', 0, 1).name('颜色2 G').onChange(value => { this.effect.color2.y = value; });
        this.gui.add(this.params.color2, 'z', 0, 1).name('颜色2 B').onChange(value => { this.effect.color2.z = value; });
        this.gui.add(this.params.color3, 'x', 0, 1).name('颜色3 R').onChange(value => { this.effect.color3.x = value; });
        this.gui.add(this.params.color3, 'y', 0, 1).name('颜色3 G').onChange(value => { this.effect.color3.y = value; });
        this.gui.add(this.params.color3, 'z', 0, 1).name('颜色3 B').onChange(value => { this.effect.color3.z = value; });
        this.gui.add(this.params, 'point1', 0, 1).onChange(value => { this.effect.point1 = value; });
        this.gui.add(this.params, 'point2', 0, 1).onChange(value => { this.effect.point2 = value; });
        this.gui.add(this.params, 'point3', 0, 1).onChange(value => { this.effect.point3 = value; });

        super.setupGUI();
    }
}

export { LumiColoramaTest };
