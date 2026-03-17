import { BaseTest } from './BaseTest';
const { CornerPinShaderPass } = require('../../src/pp/LumiCornerPin/CornerPinShaderPass.js');

class LumiCornerPinTest extends BaseTest {
    constructor() {
        super();
        this.params = {};
    }

    async init() {
        this.effect = new CornerPinShaderPass();
        await super.init();
    }

    setupGUI() {
        // 基于AEInfo.json中的参数配置设置GUI控件
        this.params = {
            // 顶点控制参数
            leftUpVertexX: this.effect.params.leftUpVertex.x,
            leftUpVertexY: this.effect.params.leftUpVertex.y,
            rightUpVertexX: this.effect.params.rightUpVertex.x,
            rightUpVertexY: this.effect.params.rightUpVertex.y,
            leftDownVertexX: this.effect.params.leftDownVertex.x,
            leftDownVertexY: this.effect.params.leftDownVertex.y,
            rightDownVertexX: this.effect.params.rightDownVertex.x,
            rightDownVertexY: this.effect.params.rightDownVertex.y,
            
            // 边缘处理类型
            motionTileType: ['Normal', 'Mirror', 'Stretch'][this.effect.params.motionTileType]
        };

        // 创建顶点控制文件夹
        const vertexFolder = this.gui.addFolder('Vertex Control');
        
        // 左上角顶点控制
        const leftUpFolder = vertexFolder.addFolder('Left Up Vertex');
        leftUpFolder.add(this.params, 'leftUpVertexX', -2.0, 3.0).onChange(value => {
            this.effect.setLeftUpVertex(value, this.params.leftUpVertexY);
            this.updateGUIDisplay();
        });
        leftUpFolder.add(this.params, 'leftUpVertexY', -2.0, 3.0).onChange(value => {
            this.effect.setLeftUpVertex(this.params.leftUpVertexX, value);
            this.updateGUIDisplay();
        });

        // 右上角顶点控制
        const rightUpFolder = vertexFolder.addFolder('Right Up Vertex');
        rightUpFolder.add(this.params, 'rightUpVertexX', -2.0, 3.0).onChange(value => {
            this.effect.setRightUpVertex(value, this.params.rightUpVertexY);
            this.updateGUIDisplay();
        });
        rightUpFolder.add(this.params, 'rightUpVertexY', -2.0, 3.0).onChange(value => {
            this.effect.setRightUpVertex(this.params.rightUpVertexX, value);
            this.updateGUIDisplay();
        });

        // 左下角顶点控制
        const leftDownFolder = vertexFolder.addFolder('Left Down Vertex');
        leftDownFolder.add(this.params, 'leftDownVertexX', -2.0, 3.0).onChange(value => {
            this.effect.setLeftDownVertex(value, this.params.leftDownVertexY);
            this.updateGUIDisplay();
        });
        leftDownFolder.add(this.params, 'leftDownVertexY', -2.0, 3.0).onChange(value => {
            this.effect.setLeftDownVertex(this.params.leftDownVertexX, value);
            this.updateGUIDisplay();
        });

        // 右下角顶点控制
        const rightDownFolder = vertexFolder.addFolder('Right Down Vertex');
        rightDownFolder.add(this.params, 'rightDownVertexX', -2.0, 3.0).onChange(value => {
            this.effect.setRightDownVertex(value, this.params.rightDownVertexY);
            this.updateGUIDisplay();
        });
        rightDownFolder.add(this.params, 'rightDownVertexY', -2.0, 3.0).onChange(value => {
            this.effect.setRightDownVertex(this.params.rightDownVertexX, value);
            this.updateGUIDisplay();
        });

        // 边缘处理控制
        const edgeFolder = this.gui.addFolder('Edge Processing');
        edgeFolder.add(this.params, 'motionTileType', ['Normal', 'Mirror', 'Stretch']).onChange(value => {
            this.effect.setMotionTileType(value);
            this.updateGUIDisplay();
        });

        // 预设效果
        const presetsFolder = this.gui.addFolder('Presets');
        
        presetsFolder.add({
            'Reset to Default': () => {
                this.effect.reset();
                this.updateParamsFromEffect();
                this.updateGUIDisplay();
            }
        }, 'Reset to Default');

        presetsFolder.add({
            'Perspective Correction': () => {
                this.effect.setPerspectiveCorrection(0.8, 1.0, 1.0);
                this.updateParamsFromEffect();
                this.updateGUIDisplay();
            }
        }, 'Perspective Correction');

        presetsFolder.add({
            'Trapezoid Transform': () => {
                this.effect.setTrapezoidTransform(15);
                this.updateParamsFromEffect();
                this.updateGUIDisplay();
            }
        }, 'Trapezoid Transform');

        presetsFolder.add({
            'Strong Perspective': () => {
                this.effect.setLeftUpVertex([0.2, 1.0]);
                this.effect.setRightUpVertex([0.8, 1.0]);
                this.effect.setLeftDownVertex([0.0, 0.0]);
                this.effect.setRightDownVertex([1.0, 0.0]);
                this.updateParamsFromEffect();
                this.updateGUIDisplay();
            }
        }, 'Strong Perspective');

        presetsFolder.add({
            'Keystone Correction': () => {
                this.effect.setLeftUpVertex([-0.1, 1.2]);
                this.effect.setRightUpVertex([1.1, 1.2]);
                this.effect.setLeftDownVertex([0.0, 0.0]);
                this.effect.setRightDownVertex([1.0, 0.0]);
                this.updateParamsFromEffect();
                this.updateGUIDisplay();
            }
        }, 'Keystone Correction');

        // 效果信息
        const infoFolder = this.gui.addFolder('Effect Info');
        infoFolder.add({
            'Effect Name': 'CornerPin (边角定位)',
            'Parameters': '5 (4 vertices + 1 edge mode)',
            'Algorithm': 'Perspective Transform',
            'Performance': '810-827 FPS',
            'Category': 'Distort (扭曲)'
        }, 'Effect Name').listen();
        
        infoFolder.add({
            'Effect Name': 'CornerPin (边角定位)',
            'Parameters': '5 (4 vertices + 1 edge mode)',
            'Algorithm': 'Perspective Transform',
            'Performance': '810-827 FPS',
            'Category': 'Distort (扭曲)'
        }, 'Parameters').listen();
        
        infoFolder.add({
            'Effect Name': 'CornerPin (边角定位)',
            'Parameters': '5 (4 vertices + 1 edge mode)',
            'Algorithm': 'Perspective Transform',
            'Performance': '810-827 FPS',
            'Category': 'Distort (扭曲)'
        }, 'Algorithm').listen();
        
        infoFolder.add({
            'Effect Name': 'CornerPin (边角定位)',
            'Parameters': '5 (4 vertices + 1 edge mode)',
            'Algorithm': 'Perspective Transform',
            'Performance': '810-827 FPS',
            'Category': 'Distort (扭曲)'
        }, 'Performance').listen();

        // 展开主要控制文件夹
        vertexFolder.open();
        edgeFolder.open();
        presetsFolder.open();

        super.setupGUI();
    }

    // 从effect更新params
    updateParamsFromEffect() {
        this.params.leftUpVertexX = this.effect.params.leftUpVertex.x;
        this.params.leftUpVertexY = this.effect.params.leftUpVertex.y;
        this.params.rightUpVertexX = this.effect.params.rightUpVertex.x;
        this.params.rightUpVertexY = this.effect.params.rightUpVertex.y;
        this.params.leftDownVertexX = this.effect.params.leftDownVertex.x;
        this.params.leftDownVertexY = this.effect.params.leftDownVertex.y;
        this.params.rightDownVertexX = this.effect.params.rightDownVertex.x;
        this.params.rightDownVertexY = this.effect.params.rightDownVertex.y;
        this.params.motionTileType = ['Normal', 'Mirror', 'Stretch'][this.effect.params.motionTileType];
    }

    // 更新GUI显示
    updateGUIDisplay() {
        // 触发GUI更新
        for (let i in this.gui.__controllers) {
            this.gui.__controllers[i].updateDisplay();
        }
        
        // 递归更新所有文件夹中的控制器
        const updateFolder = (folder) => {
            for (let i in folder.__controllers) {
                folder.__controllers[i].updateDisplay();
            }
            for (let folderName in folder.__folders) {
                updateFolder(folder.__folders[folderName]);
            }
        };
        
        for (let folderName in this.gui.__folders) {
            updateFolder(this.gui.__folders[folderName]);
        }
    }
}

export { LumiCornerPinTest };