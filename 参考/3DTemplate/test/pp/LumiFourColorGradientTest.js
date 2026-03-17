import { BaseTest } from './BaseTest.js';
const { FourColorGradientShaderPass } = require('../../src/pp/LumiFourColorGradient/FourColorGradientShaderPass.js');

class LumiFourColorGradientTest extends BaseTest {
    constructor() {
        super();
        this.params = {};
    }

    async init() {
        this.effect = new FourColorGradientShaderPass();
        await super.init();
    }

    setupGUI() {
        this.params = {
            color1: this.effect.color1,
            color2: this.effect.color2,
            color3: this.effect.color3,
            color4: this.effect.color4,
            point1: this.effect.point1,
            point2: this.effect.point2,
            point3: this.effect.point3,
            point4: this.effect.point4,
        };

        this.gui.addColor(this.params, 'color1').onChange(value => { this.effect.color1 = value; });
        this.gui.addColor(this.params, 'color2').onChange(value => { this.effect.color2 = value; });
        this.gui.addColor(this.params, 'color3').onChange(value => { this.effect.color3 = value; });
        this.gui.addColor(this.params, 'color4').onChange(value => { this.effect.color4 = value; });
        // 替换原有的point1-point4添加代码
        const point1Folder = this.gui.addFolder('Point 1');
        point1Folder.add(this.params.point1, 'x', 0, 1).onChange(value => { this.effect.point1.x = value; });
        point1Folder.add(this.params.point1, 'y', 0, 1).onChange(value => { this.effect.point1.y = value; });
        
        const point2Folder = this.gui.addFolder('Point 2');
        point2Folder.add(this.params.point2, 'x', 0, 1).onChange(value => { this.effect.point2.x = value; });
        point2Folder.add(this.params.point2, 'y', 0, 1).onChange(value => { this.effect.point2.y = value; });
        
        const point3Folder = this.gui.addFolder('Point 3');
        point3Folder.add(this.params.point3, 'x', 0, 1).onChange(value => { this.effect.point3.x = value; });
        point3Folder.add(this.params.point3, 'y', 0, 1).onChange(value => { this.effect.point3.y = value; });
        
        const point4Folder = this.gui.addFolder('Point 4');
        point4Folder.add(this.params.point4, 'x', 0, 1).onChange(value => { this.effect.point4.x = value; });
        point4Folder.add(this.params.point4, 'y', 0, 1).onChange(value => { this.effect.point4.y = value; });

        super.setupGUI();
    }
}

export { LumiFourColorGradientTest };
