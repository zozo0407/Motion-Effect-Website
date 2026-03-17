import { BaseTest } from './BaseTest.js';
const { WaveWarpShaderPass } = require('../../src/pp/LumiWaveWarp/WaveWarpShaderPass.js');

class LumiWaveWarpTest extends BaseTest {
    constructor() {
        super();
        this.params = {};
    }

    async init() {
        this.effect = new WaveWarpShaderPass();
        await super.init();
    }

    setupGUI() {
        this.params = {
            wavelength: this.effect.wavelength,
            amplitude: this.effect.amplitude,
            phase: this.effect.phase,
            direction: this.effect.direction,
            waveType: this.effect.waveType,
            edgeMode: this.effect.edgeMode,
        };

        this.gui.add(this.params, 'wavelength', 0, 1).onChange(value => { this.effect.wavelength = value; });
        this.gui.add(this.params, 'amplitude',  0, 1).onChange(value => { this.effect.amplitude = value; });
        this.gui.add(this.params, 'phase', 0, 1).onChange(value => { this.effect.phase = value; });
        this.gui.add(this.params.direction, 'x', 0, 1).name('波浪方向 X').onChange(value => { this.effect.direction.x = value; });
        this.gui.add(this.params.direction, 'y', 0, 1).name('波浪方向 Y').onChange(value => { this.effect.direction.y = value; });
        this.gui.add(this.params, 'waveType', 0, 2, 1).onChange(value => { this.effect.waveType = value; });
        this.gui.add(this.params, 'edgeMode', 0, 2, 1).onChange(value => { this.effect.edgeMode = value; });

        super.setupGUI();
    }
}

export { LumiWaveWarpTest };
