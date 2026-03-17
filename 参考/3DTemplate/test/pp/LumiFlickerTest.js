import { BaseTest } from './BaseTest.js';
const { FlickerShaderPass } = require('../../src/pp/LumiFlicker/FlickerShaderPass.js');

class LumiFlickerTest extends BaseTest {
    constructor() {
        super();
        this.params = {};
    }

    async init() {
        this.effect = new FlickerShaderPass();
        await super.init();
    }

    setupGUI() {
        this.params = {
            intensity: this.effect.intensity,
            progress: this.effect.progress,
            globalAmp: this.effect.globalAmp,
            randLumaAmp: this.effect.randLumaAmp,
            randColorAmp: this.effect.randColorAmp,
            randFreq: this.effect.randFreq,
            waveAmp: this.effect.waveAmp,
            waveFreq: this.effect.waveFreq,
            phaseR: this.effect.phaseR,
            phaseG: this.effect.phaseG,
            phaseB: this.effect.phaseB,
            ampR: this.effect.ampR,
            ampG: this.effect.ampG,
            ampB: this.effect.ampB,
            brightness: this.effect.brightness,
            seed: this.effect.seed,
        };

        this.gui.add(this.params, 'intensity', 0, 1).onChange(value => { this.effect.setIntensity(value); });
        this.gui.add(this.params, 'progress', 0, 1).onChange(value => { this.effect.setProgress(value); });
        this.gui.add(this.params, 'globalAmp', 0, 10).onChange(value => { this.effect.globalAmp = value; });
        this.gui.add(this.params, 'randLumaAmp', 0, 200).onChange(value => { this.effect.randLumaAmp = value; });
        this.gui.add(this.params, 'randColorAmp', 0, 200).onChange(value => { this.effect.randColorAmp = value; });
        this.gui.add(this.params, 'randFreq', 0, 60).onChange(value => { this.effect.randFreq = value; });
        this.gui.add(this.params, 'waveAmp', 0, 200).onChange(value => { this.effect.waveAmp = value; });
        this.gui.add(this.params, 'waveFreq', 0, 60).onChange(value => { this.effect.waveFreq = value; });
        this.gui.add(this.params, 'phaseR', -1, 1).onChange(value => { this.effect.phaseR = value; });
        this.gui.add(this.params, 'phaseG', -1, 1).onChange(value => { this.effect.phaseG = value; });
        this.gui.add(this.params, 'phaseB', -1, 1).onChange(value => { this.effect.phaseB = value; });
        this.gui.add(this.params, 'ampR', -1, 1).onChange(value => { this.effect.ampR = value; });
        this.gui.add(this.params, 'ampG', -1, 1).onChange(value => { this.effect.ampG = value; });
        this.gui.add(this.params, 'ampB', -1, 1).onChange(value => { this.effect.ampB = value; });
        this.gui.add(this.params, 'brightness', 0, 200).onChange(value => { this.effect.brightness = value; });
        this.gui.add(this.params, 'seed', 0, 5).onChange(value => { this.effect.seed = value; });

        super.setupGUI();
    }
}

export { LumiFlickerTest };
