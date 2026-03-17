import { BaseTest } from './BaseTest.js';
const { CloneShaderPass } = require('../../src/pp/LumiClone/CloneShaderPass.js');

class LumiCloneTest extends BaseTest {
    constructor() {
        super();
        this.params = {};
    }

    async init() {
        this.effect = new CloneShaderPass();
        await super.init();
    }

    setupGUI() {
        this.params = {
            cloneCount: this.effect.cloneCount,
            cloneSpacing: this.effect.cloneSpacing,
            cloneScale: this.effect.cloneScale,
            cloneRotation: this.effect.cloneRotation,
        };

        this.gui.add(this.params, 'cloneCount', 0, 20, 1).onChange(value => { this.effect.cloneCount = value; });
        this.gui.add(this.params, 'cloneSpacing', 0, 1).onChange(value => { this.effect.cloneSpacing = value; });
        this.gui.add(this.params, 'cloneScale', 0, 1).onChange(value => { this.effect.cloneScale = value; });
        this.gui.add(this.params, 'cloneRotation', 0, 1).onChange(value => { this.effect.cloneRotation = value; });

        super.setupGUI();
    }
}

export { LumiCloneTest };