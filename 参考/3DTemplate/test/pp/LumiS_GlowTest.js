import { BaseTest } from './BaseTest.js';
const { S_GlowShaderPass } = require('../../src/pp/LumiS_Glow/S_GlowShaderPass.js');

class LumiS_GlowTest extends BaseTest {
    constructor() {
        super();
        this.params = {};
    }

    async init() {
        this.effect = new S_GlowShaderPass();
        await super.init();
    }

    setupGUI() {
        this.params = {
            glowThreshold: this.effect.glowThreshold,
            innerRadius: this.effect.innerRadius,
            outerRadius: this.effect.outerRadius,
            innerIntensity: this.effect.innerIntensity,
            outerIntensity: this.effect.outerIntensity,
            glowColor: this.effect.glowColor,
        };

        this.params.glowColor = this.effect.glowColor;

        this.gui.add(this.params, 'glowThreshold', 0, 1).onChange(value => { this.effect.glowThreshold = value; });
        this.gui.add(this.params, 'innerRadius', 0, 100.0).onChange(value => { this.effect.innerRadius = value; });
        this.gui.add(this.params, 'outerRadius', 0, 100.0).onChange(value => { this.effect.outerRadius = value; });
        this.gui.add(this.params, 'innerIntensity', 0, 1).onChange(value => { this.effect.innerIntensity = value; });
        this.gui.add(this.params, 'outerIntensity', 0, 1).onChange(value => { this.effect.outerIntensity = value; });
        this.gui.add(this.params.glowColor, 'x', 0, 1).name('发光颜色 R').onChange(value => { this.effect.glowColor.x = value; });
        this.gui.add(this.params.glowColor, 'y', 0, 1).name('发光颜色 G').onChange(value => { this.effect.glowColor.y = value; });
        this.gui.add(this.params.glowColor, 'z', 0, 1).name('发光颜色 B').onChange(value => { this.effect.glowColor.z = value; });

        super.setupGUI();
    }
}

export { LumiS_GlowTest };
