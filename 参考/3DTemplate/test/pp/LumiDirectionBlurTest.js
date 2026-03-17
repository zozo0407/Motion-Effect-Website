import { BaseTest } from './BaseTest';
const { DirectionBlurShaderPass } = require('../../src/pp/LumiDirectionBlur/DirectionBlurShaderPass.js');

class LumiDirectionBlurTest extends BaseTest {
    constructor() {
        super();
        this.params = {};
    }

    async init() {
        // Directional Blur Effect Setup
        this.effect = new DirectionBlurShaderPass();
        
        await super.init();
    }

    setupGUI() {
        // Use a proxy object to interact with the GUI, initialized with the effect's current state
        this.params = {
            blurIntensity: this.effect.blurIntensity,
            angle: this.effect.angle,
            steps: this.effect.steps,
            expandFlag: this.effect.expandFlag,
            mirrorEdge: this.effect.mirrorEdge
        };

        // Link GUI controls to the effect's public setter methods
        this.gui.add(this.params, 'blurIntensity', 0, 100).onChange(value => this.effect.setBlurIntensity(value));
        this.gui.add(this.params, 'angle', 0, 360).onChange(value => this.effect.setAngle(value));
        this.gui.add(this.params, 'steps', 0, 100).onChange(value => this.effect.setSteps(value));
        this.gui.add(this.params, 'expandFlag').onChange(value => this.effect.setExpandFlag(value));
        this.gui.add(this.params, 'mirrorEdge').onChange(value => this.effect.setMirrorEdge(value));
    }
}

export { LumiDirectionBlurTest };