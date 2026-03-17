import { BaseTest } from './BaseTest.js';
const { TritoneShaderPass } = require('../../src/pp/LumiTritone/TritoneShaderPass.js');

class LumiTritoneTest extends BaseTest {
    constructor() {
        super();
        this.params = {};
    }

    async init() {
        this.effect = new TritoneShaderPass();
        await super.init();
    }

    setupGUI() {
        this.params = {
            shadowColor: this.effect.shadowColor,
            middleColor: this.effect.middleColor,
            highlightColor: this.effect.highlightColor,
        };

        this.params.shadowColor = this.effect.shadowColor;
        this.params.middleColor = this.effect.middleColor;
        this.params.highlightColor = this.effect.highlightColor;

        this.gui.add(this.params.shadowColor, 'x', 0, 1).name('阴影颜色 R').onChange(value => { this.effect.shadowColor.x = value; });
        this.gui.add(this.params.shadowColor, 'y', 0, 1).name('阴影颜色 G').onChange(value => { this.effect.shadowColor.y = value; });
        this.gui.add(this.params.shadowColor, 'z', 0, 1).name('阴影颜色 B').onChange(value => { this.effect.shadowColor.z = value; });
        this.gui.add(this.params.middleColor, 'x', 0, 1).name('中间色 R').onChange(value => { this.effect.middleColor.x = value; });
        this.gui.add(this.params.middleColor, 'y', 0, 1).name('中间色 G').onChange(value => { this.effect.middleColor.y = value; });
        this.gui.add(this.params.middleColor, 'z', 0, 1).name('中间色 B').onChange(value => { this.effect.middleColor.z = value; });
        this.gui.add(this.params.highlightColor, 'x', 0, 1).name('高光颜色 R').onChange(value => { this.effect.highlightColor.x = value; });
        this.gui.add(this.params.highlightColor, 'y', 0, 1).name('高光颜色 G').onChange(value => { this.effect.highlightColor.y = value; });
        this.gui.add(this.params.highlightColor, 'z', 0, 1).name('高光颜色 B').onChange(value => { this.effect.highlightColor.z = value; });

        super.setupGUI();
    }
}

export { LumiTritoneTest };
