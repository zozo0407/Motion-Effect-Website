import { BaseTest } from './BaseTest';
const { UnmultShaderPass } = require('../../src/pp/LumiUnmult/UnmultShaderPass.js');

class LumiUnmultTest extends BaseTest {
    constructor() {
        super();
        this.params = {};
    }

    async init() {
        this.effect = new UnmultShaderPass();
        await super.init();
    }

    // setupGUI方法中的参数和取值范围，参考AEInfo.json中的配置
    setupGUI() {
        this.params = {
            intensity: this.effect.params.intensity
        };

        // Unmult只有一个布尔参数，对应AEInfo.json中的checkbox
        this.gui.add(this.params, 'intensity').onChange(value => { 
            this.effect.params.intensity = value; 
        });

        super.setupGUI();
    }
}

export { LumiUnmultTest };
