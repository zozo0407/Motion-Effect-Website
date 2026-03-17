import { BaseTest } from './BaseTest.js';
const { HalftoneShaderPass } = require('../../src/pp/LumiHalftone/HalftoneShaderPass.js');

class LumiHalftoneTest extends BaseTest {
    constructor() {
        super();
        this.params = {};
    }

    async init() {
        this.effect = new HalftoneShaderPass();
        await super.init();
    }

    setupGUI() {
        this.params = {
            colorMode: this.effect.colorMode,
            blackDots: this.effect.blackDots,
            dotFreq: this.effect.dotFreq,
            rotationAngle: this.effect.rotationAngle,
            dotsRelativeWidth: this.effect.dotsRelativeWidth,
            dotsSharpen: this.effect.dotsSharpen,
            dotsLighten: this.effect.dotsLighten,
            color1: this.effect.color1,
            color2: this.effect.color2,
            dotsShift: this.effect.dotsShift,
            alternateShift: this.effect.alternateShift,
            redOffsetX: this.effect.redOffsetX,
            redOffsetY: this.effect.redOffsetY,
            greenOffsetX: this.effect.greenOffsetX,
            greenOffsetY: this.effect.greenOffsetY,
            blueOffsetX: this.effect.blueOffsetX,
            blueOffsetY: this.effect.blueOffsetY,
        };

        this.params.color1 = this.effect.color1;
        this.params.color2 = this.effect.color2;
        this.params.dotsShift = this.effect.dotsShift;
        this.params.alternateShift = this.effect.alternateShift;

        this.gui.add(this.params, 'colorMode', 0, 2).onChange(value => { this.effect.colorMode = value; });
        this.gui.add(this.params, 'blackDots', 0, 1).onChange(value => { this.effect.blackDots = value; });
        this.gui.add(this.params, 'dotFreq', 0, 2000.0).onChange(value => { this.effect.dotFreq = value; });
        this.gui.add(this.params, 'rotationAngle', 0, 360).onChange(value => { this.effect.rotationAngle = value; });
        this.gui.add(this.params, 'dotsRelativeWidth', 0, 100).onChange(value => { this.effect.dotsRelativeWidth = value; });
        this.gui.add(this.params, 'dotsSharpen', 0, 1).onChange(value => { this.effect.dotsSharpen = value; });
        this.gui.add(this.params, 'dotsLighten', -1, 1).onChange(value => { this.effect.dotsLighten = value; });
        this.gui.add(this.params.color1, 'x', 0, 1).name('颜色1 R').onChange(value => { this.effect.color1.x = value; });
        this.gui.add(this.params.color1, 'y', 0, 1).name('颜色1 G').onChange(value => { this.effect.color1.y = value; });
        this.gui.add(this.params.color1, 'z', 0, 1).name('颜色1 B').onChange(value => { this.effect.color1.z = value; });
        this.gui.add(this.params.color2, 'x', 0, 1).name('颜色2 R').onChange(value => { this.effect.color2.x = value; });
        this.gui.add(this.params.color2, 'y', 0, 1).name('颜色2 G').onChange(value => { this.effect.color2.y = value; });
        this.gui.add(this.params.color2, 'z', 0, 1).name('颜色2 B').onChange(value => { this.effect.color2.z = value; });
        this.gui.add(this.params.dotsShift, 'x', -1, 1).name('点偏移 X').onChange(value => { this.effect.dotsShift.x = value; });
        this.gui.add(this.params.dotsShift, 'y', -1, 1).name('点偏移 Y').onChange(value => { this.effect.dotsShift.y = value; });
        this.gui.add(this.params.alternateShift, 'x', -1, 1).name('交替偏移 X').onChange(value => { this.effect.alternateShift.x = value; });
        this.gui.add(this.params.alternateShift, 'y', -1, 1).name('交替偏移 Y').onChange(value => { this.effect.alternateShift.y = value; });
        this.gui.add(this.params, 'redOffsetX', -1, 1).onChange(value => { this.effect.redOffsetX = value; });
        this.gui.add(this.params, 'redOffsetY', -1, 1).onChange(value => { this.effect.redOffsetY = value; });
        this.gui.add(this.params, 'greenOffsetX', -1, 1).onChange(value => { this.effect.greenOffsetX = value; });
        this.gui.add(this.params, 'greenOffsetY', -1, 1).onChange(value => { this.effect.greenOffsetY = value; });
        this.gui.add(this.params, 'blueOffsetX', -1, 1).onChange(value => { this.effect.blueOffsetX = value; });
        this.gui.add(this.params, 'blueOffsetY', -1, 1).onChange(value => { this.effect.blueOffsetY = value; });

        super.setupGUI();
    }
}

export { LumiHalftoneTest };
