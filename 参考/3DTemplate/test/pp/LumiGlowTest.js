import { BaseTest } from './BaseTest.js';
const { GlowShaderPass } = require('../../src/pp/LumiGlow/GlowShaderPass.js');

class LumiGlowTest extends BaseTest {
    constructor() {
        super();
        this.params = {};
    }

    async init() {
        this.effect = new GlowShaderPass();
        await super.init();
    }

    setupGUI() {
        this.params = {
            glowThreshold: this.effect.glowThreshold,
            glowRadius: this.effect.glowRadius,
            glowColor: this.effect.glowColor,
        };

        this.params.glowColor = this.effect.glowColor;

        this.gui.add(this.params, 'glowThreshold', 0, 1).onChange(value => { this.effect.glowThreshold = value; });
        this.gui.add(this.params, 'glowRadius', 0, 100).onChange(value => { this.effect.glowRadius = value; });
        this.gui.add(this.params.glowColor, 'x', 0, 1).name('发光颜色 R').onChange(value => { this.effect.glowColor.x = value; });
        this.gui.add(this.params.glowColor, 'y', 0, 1).name('发光颜色 G').onChange(value => { this.effect.glowColor.y = value; });
        this.gui.add(this.params.glowColor, 'z', 0, 1).name('发光颜色 B').onChange(value => { this.effect.glowColor.z = value; });

        super.setupGUI();
    }
}

export { LumiGlowTest };
