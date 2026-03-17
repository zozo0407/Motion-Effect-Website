
import { BaseTest } from './BaseTest';
const { ShadowHighlightShaderPass } = require('../../src/pp/LumiShadowHighlight/ShadowHighlightShaderPass.js');

class LumiShadowHighlightTest extends BaseTest {
    constructor() {
        super();
        this.params = {};
    }

    async init() {
        this.effect = new ShadowHighlightShaderPass();
        await super.init();
    }

    // 根据AEInfo.json中的配置设置GUI参数
    setupGUI() {
        this.params = {
            shadowIntensity: this.effect.params.shadowIntensity,
            highlightIntensity: this.effect.params.highlightIntensity,
        };

        // Shadow参数：范围-1.0到1.0，默认值0.5
        this.gui.add(this.params, 'shadowIntensity', -1.0, 1.0).onChange(value => { 
            this.effect.setShadowIntensity(value); 
        });

        // Highlight参数：范围-1.0到1.0，默认值0.5
        this.gui.add(this.params, 'highlightIntensity', -1.0, 1.0).onChange(value => { 
            this.effect.setHighlightIntensity(value); 
        });

        super.setupGUI();
    }
}

export { LumiShadowHighlightTest };
