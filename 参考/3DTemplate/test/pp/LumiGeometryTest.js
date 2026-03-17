import { BaseTest } from './BaseTest';
const { GeometryShaderPass } = require('../../src/pp/LumiGeometry/GeometryShaderPass.js');

class LumiGeometryTest extends BaseTest {
    constructor() {
        super();
        this.params = {};
    }

    async init() {
        this.effect = new GeometryShaderPass();
        await super.init();
    }

    // 设置GUI方法中的参数和取值范围，参考AEInfo.json中的配置
    setupGUI() {
        this.params = {
            rotation: this.effect.params.rotation,
            rotationAxis: this.effect.params.rotationAxis,
        };

        // 主要参数控制
        const mainFolder = this.gui.addFolder('Main Parameters');
        mainFolder.add(this.params, 'rotation', 0, 360).onChange(value => { 
            this.effect.setRotation(value);
        }).name('Rotation (倾斜)');
        
        mainFolder.add(this.params, 'rotationAxis', 0, 360).onChange(value => { 
            this.effect.setRotationAxis(value);
        }).name('Rotation Axis (倾斜轴)');

        mainFolder.open();

        // 效果信息
        const infoFolder = this.gui.addFolder('Effect Info');
        const info = {
            'Effect Name': 'Geometry (四边形变形)',
            'Parameters': '2 (rotation, rotationAxis)',
            'Algorithm': 'Geometric Transform',
            'Performance': '808 FPS (Excellent)',
            'Category': 'Distort (扭曲)'
        };

        Object.keys(info).forEach(key => {
            const controller = infoFolder.add(info, key);
            controller.domElement.style.pointerEvents = 'none';
            controller.domElement.style.opacity = '0.7';
        });

        infoFolder.open();

        super.setupGUI();
    }

    // 更新GUI显示值
    updateGUIValues() {
        this.params.rotation = this.effect.getRotation();
        this.params.rotationAxis = this.effect.getRotationAxis();
        
        // 刷新GUI显示
        this.gui.controllersRecursive().forEach(controller => {
            controller.updateDisplay();
        });
    }
}

export { LumiGeometryTest };