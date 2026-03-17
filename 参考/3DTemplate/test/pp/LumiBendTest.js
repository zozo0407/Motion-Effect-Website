import { BaseTest } from './BaseTest.js';
const { BendShaderPass } = require('../../src/pp/LumiBend/BendShaderPass.js');

class LumiBendTest extends BaseTest {
    constructor() {
        super();
        this.params = {};
    }

    async init() {
        this.effect = new BendShaderPass();
        await super.init();
    }

    setupGUI() {
        this.params = {
            startPoint: this.effect.startPoint,
            endPoint: this.effect.endPoint,
            bendAmount: this.effect.bendAmount,
            renderMode: this.effect.renderMode,
            distortMode: this.effect.distortMode,
        };

        // 为 Vector2 类型参数创建文件夹
        const startPointFolder = this.gui.addFolder('Start Point');
        startPointFolder.add(this.params.startPoint, 'x', 0, 1).onChange(value => { 
            this.effect.startPoint.x = value; 
            this.effect.startPoint = this.effect.startPoint; // 触发 setter
        });
        startPointFolder.add(this.params.startPoint, 'y', 0, 1).onChange(value => { 
            this.effect.startPoint.y = value; 
            this.effect.startPoint = this.effect.startPoint; // 触发 setter
        });
        
        const endPointFolder = this.gui.addFolder('End Point');
        endPointFolder.add(this.params.endPoint, 'x', 0, 1).onChange(value => { 
            this.effect.endPoint.x = value; 
            this.effect.endPoint = this.effect.endPoint; // 触发 setter
        });
        endPointFolder.add(this.params.endPoint, 'y', 0, 1).onChange(value => { 
            this.effect.endPoint.y = value; 
            this.effect.endPoint = this.effect.endPoint; // 触发 setter
        });

        this.gui.add(this.params, 'bendAmount').onChange(value => { this.effect.bendAmount = value; });
        this.gui.add(this.params, 'renderMode').onChange(value => { this.effect.renderMode = value; });
        this.gui.add(this.params, 'distortMode').onChange(value => { this.effect.distortMode = value; });

        super.setupGUI();
    }
}

export { LumiBendTest };
