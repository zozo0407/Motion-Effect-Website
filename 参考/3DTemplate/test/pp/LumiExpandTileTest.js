import { BaseTest } from './BaseTest.js';
const { ExpandTileShaderPass } = require('../../src/pp/LumiExpandTile/ExpandTileShaderPass.js');

class LumiExpandTileTest extends BaseTest {
    constructor() {
        super();
        this.params = {};
    }

    async init() {
        this.effect = new ExpandTileShaderPass();
        await super.init();
    }

    setupGUI() {
        this.params = {
            tile_count: this.effect.tile_count,
        };

        this.gui.add(this.params, 'tile_count', 0, 4.0).onChange(value => { this.effect.tile_count = value; });

        super.setupGUI();
    }
}

export { LumiExpandTileTest };
