
import { BaseTest } from './BaseTest';
const { BezierDeformationShaderPass } = require('../../src/pp/LumiBezierDeformation/BezierDeformationShaderPass.js');

/**
 * LumiBezierDeformationTest - 贝塞尔变形效果测试类
 * 
 * 基于BaseTest框架实现，提供完整的GUI界面来测试BezierDeformationShaderPass的所有功能。
 * 支持12个贝塞尔控制点的实时调整，每个控制点包含x,y两个坐标参数。
 */
class LumiBezierDeformationTest extends BaseTest {
    constructor() {
        super();
        this.params = {};
    }

    async init() {
        // 创建BezierDeformationShaderPass实例
        this.effect = new BezierDeformationShaderPass();
        await super.init();
    }

    /**
     * 设置GUI控制界面
     * 根据AEInfo.json配置，为12个控制点参数创建GUI控制
     * 每个控制点都是point2d类型，需要为x,y坐标分别创建控制项
     */
    setupGUI() {
        // 初始化参数对象，使用单独的x/y值用于GUI控制
        this.params = {
            // BottomLeftTangent - 下左切点
            bottomLeftTangentX: this.effect.params.BottomLeftTangent.value.x,
            bottomLeftTangentY: this.effect.params.BottomLeftTangent.value.y,
            
            // BottomRightTangent - 下右切点
            bottomRightTangentX: this.effect.params.BottomRightTangent.value.x,
            bottomRightTangentY: this.effect.params.BottomRightTangent.value.y,
            
            // BottomRightVertex - 下右顶点
            bottomRightVertexX: this.effect.params.BottomRightVertex.value.x,
            bottomRightVertexY: this.effect.params.BottomRightVertex.value.y,
            
            // LeftBottomTangent - 左下切点
            leftBottomTangentX: this.effect.params.LeftBottomTangent.value.x,
            leftBottomTangentY: this.effect.params.LeftBottomTangent.value.y,
            
            // LeftBottomVertex - 左下顶点
            leftBottomVertexX: this.effect.params.LeftBottomVertex.value.x,
            leftBottomVertexY: this.effect.params.LeftBottomVertex.value.y,
            
            // LeftTopTangent - 左上切点
            leftTopTangentX: this.effect.params.LeftTopTangent.value.x,
            leftTopTangentY: this.effect.params.LeftTopTangent.value.y,
            
            // RightBottomTangent - 右下切点
            rightBottomTangentX: this.effect.params.RightBottomTangent.value.x,
            rightBottomTangentY: this.effect.params.RightBottomTangent.value.y,
            
            // RightTopTangent - 右上切点
            rightTopTangentX: this.effect.params.RightTopTangent.value.x,
            rightTopTangentY: this.effect.params.RightTopTangent.value.y,
            
            // RightTopVertex - 右上顶点
            rightTopVertexX: this.effect.params.RightTopVertex.value.x,
            rightTopVertexY: this.effect.params.RightTopVertex.value.y,
            
            // TopLeftTangent - 上左切点
            topLeftTangentX: this.effect.params.TopLeftTangent.value.x,
            topLeftTangentY: this.effect.params.TopLeftTangent.value.y,
            
            // TopLeftVertex - 上左顶点
            topLeftVertexX: this.effect.params.TopLeftVertex.value.x,
            topLeftVertexY: this.effect.params.TopLeftVertex.value.y,
            
            // TopRightTangent - 上右切点
            topRightTangentX: this.effect.params.TopRightTangent.value.x,
            topRightTangentY: this.effect.params.TopRightTangent.value.y
        };

        // 创建GUI控制器 - 按照贝塞尔曲线的逻辑分组
        
        // === 底边控制点组 ===
        const bottomFolder = this.gui.addFolder('底边控制点');
        
        // BottomLeftTangent - 下左切点
        bottomFolder.add(this.params, 'bottomLeftTangentX', 0, 1).name('下左切点 X').onChange(value => {
            this.effect.setBottomLeftTangent([value, this.params.bottomLeftTangentY]);
        });
        bottomFolder.add(this.params, 'bottomLeftTangentY', 0, 1).name('下左切点 Y').onChange(value => {
            this.effect.setBottomLeftTangent([this.params.bottomLeftTangentX, value]);
        });
        
        // BottomRightTangent - 下右切点
        bottomFolder.add(this.params, 'bottomRightTangentX', 0, 1).name('下右切点 X').onChange(value => {
            this.effect.setBottomRightTangent([value, this.params.bottomRightTangentY]);
        });
        bottomFolder.add(this.params, 'bottomRightTangentY', 0, 1).name('下右切点 Y').onChange(value => {
            this.effect.setBottomRightTangent([this.params.bottomRightTangentX, value]);
        });
        
        // BottomRightVertex - 下右顶点
        bottomFolder.add(this.params, 'bottomRightVertexX', 0, 1).name('下右顶点 X').onChange(value => {
            this.effect.setBottomRightVertex([value, this.params.bottomRightVertexY]);
        });
        bottomFolder.add(this.params, 'bottomRightVertexY', 0, 1).name('下右顶点 Y').onChange(value => {
            this.effect.setBottomRightVertex([this.params.bottomRightVertexX, value]);
        });
        
        // === 左边控制点组 ===
        const leftFolder = this.gui.addFolder('左边控制点');
        
        // LeftBottomTangent - 左下切点
        leftFolder.add(this.params, 'leftBottomTangentX', 0, 1).name('左下切点 X').onChange(value => {
            this.effect.setLeftBottomTangent([value, this.params.leftBottomTangentY]);
        });
        leftFolder.add(this.params, 'leftBottomTangentY', 0, 1).name('左下切点 Y').onChange(value => {
            this.effect.setLeftBottomTangent([this.params.leftBottomTangentX, value]);
        });
        
        // LeftBottomVertex - 左下顶点
        leftFolder.add(this.params, 'leftBottomVertexX', 0, 1).name('左下顶点 X').onChange(value => {
            this.effect.setLeftBottomVertex([value, this.params.leftBottomVertexY]);
        });
        leftFolder.add(this.params, 'leftBottomVertexY', 0, 1).name('左下顶点 Y').onChange(value => {
            this.effect.setLeftBottomVertex([this.params.leftBottomVertexX, value]);
        });
        
        // LeftTopTangent - 左上切点
        leftFolder.add(this.params, 'leftTopTangentX', 0, 1).name('左上切点 X').onChange(value => {
            this.effect.setLeftTopTangent([value, this.params.leftTopTangentY]);
        });
        leftFolder.add(this.params, 'leftTopTangentY', 0, 1).name('左上切点 Y').onChange(value => {
            this.effect.setLeftTopTangent([this.params.leftTopTangentX, value]);
        });
        
        // === 右边控制点组 ===
        const rightFolder = this.gui.addFolder('右边控制点');
        
        // RightBottomTangent - 右下切点
        rightFolder.add(this.params, 'rightBottomTangentX', 0, 1).name('右下切点 X').onChange(value => {
            this.effect.setRightBottomTangent([value, this.params.rightBottomTangentY]);
        });
        rightFolder.add(this.params, 'rightBottomTangentY', 0, 1).name('右下切点 Y').onChange(value => {
            this.effect.setRightBottomTangent([this.params.rightBottomTangentX, value]);
        });
        
        // RightTopTangent - 右上切点
        rightFolder.add(this.params, 'rightTopTangentX', 0, 1).name('右上切点 X').onChange(value => {
            this.effect.setRightTopTangent([value, this.params.rightTopTangentY]);
        });
        rightFolder.add(this.params, 'rightTopTangentY', 0, 1).name('右上切点 Y').onChange(value => {
            this.effect.setRightTopTangent([this.params.rightTopTangentX, value]);
        });
        
        // RightTopVertex - 右上顶点
        rightFolder.add(this.params, 'rightTopVertexX', 0, 1).name('右上顶点 X').onChange(value => {
            this.effect.setRightTopVertex([value, this.params.rightTopVertexY]);
        });
        rightFolder.add(this.params, 'rightTopVertexY', 0, 1).name('右上顶点 Y').onChange(value => {
            this.effect.setRightTopVertex([this.params.rightTopVertexX, value]);
        });
        
        // === 顶边控制点组 ===
        const topFolder = this.gui.addFolder('顶边控制点');
        
        // TopLeftTangent - 上左切点
        topFolder.add(this.params, 'topLeftTangentX', 0, 1).name('上左切点 X').onChange(value => {
            this.effect.setTopLeftTangent([value, this.params.topLeftTangentY]);
        });
        topFolder.add(this.params, 'topLeftTangentY', 0, 1).name('上左切点 Y').onChange(value => {
            this.effect.setTopLeftTangent([this.params.topLeftTangentX, value]);
        });
        
        // TopLeftVertex - 上左顶点
        topFolder.add(this.params, 'topLeftVertexX', 0, 1).name('上左顶点 X').onChange(value => {
            this.effect.setTopLeftVertex([value, this.params.topLeftVertexY]);
        });
        topFolder.add(this.params, 'topLeftVertexY', 0, 1).name('上左顶点 Y').onChange(value => {
            this.effect.setTopLeftVertex([this.params.topLeftVertexX, value]);
        });
        
        // TopRightTangent - 上右切点
        topFolder.add(this.params, 'topRightTangentX', 0, 1).name('上右切点 X').onChange(value => {
            this.effect.setTopRightTangent([value, this.params.topRightTangentY]);
        });
        topFolder.add(this.params, 'topRightTangentY', 0, 1).name('上右切点 Y').onChange(value => {
            this.effect.setTopRightTangent([this.params.topRightTangentX, value]);
        });
        
        // === 便捷控制组 ===
        const quickFolder = this.gui.addFolder('便捷控制');
        
        // 重置按钮
        quickFolder.add({
            reset: () => {
                // 重置所有参数到默认值
                this.effect.setBottomLeftTangent([0.333, 0]);
                this.effect.setBottomRightTangent([0.667, 0]);
                this.effect.setBottomRightVertex([1, 0]);
                this.effect.setLeftBottomTangent([0, 0.333]);
                this.effect.setLeftBottomVertex([0, 0]);
                this.effect.setLeftTopTangent([0, 0.667]);
                this.effect.setRightBottomTangent([1, 0.333]);
                this.effect.setRightTopTangent([1, 0.667]);
                this.effect.setRightTopVertex([1, 1]);
                this.effect.setTopLeftTangent([0.333, 1]);
                this.effect.setTopLeftVertex([0, 1]);
                this.effect.setTopRightTangent([0.667, 1]);
                
                // 更新GUI显示
                this._updateGUIValues();
            }
        }, 'reset').name('重置为默认值');

        super.setupGUI();
        
        // 默认展开主要控制组
        bottomFolder.open();
        topFolder.open();
    }
    
    /**
     * 更新GUI显示值，用于重置等操作后同步显示
     */
    _updateGUIValues() {
        this.params.bottomLeftTangentX = this.effect.params.BottomLeftTangent.value.x;
        this.params.bottomLeftTangentY = this.effect.params.BottomLeftTangent.value.y;
        this.params.bottomRightTangentX = this.effect.params.BottomRightTangent.value.x;
        this.params.bottomRightTangentY = this.effect.params.BottomRightTangent.value.y;
        this.params.bottomRightVertexX = this.effect.params.BottomRightVertex.value.x;
        this.params.bottomRightVertexY = this.effect.params.BottomRightVertex.value.y;
        this.params.leftBottomTangentX = this.effect.params.LeftBottomTangent.value.x;
        this.params.leftBottomTangentY = this.effect.params.LeftBottomTangent.value.y;
        this.params.leftBottomVertexX = this.effect.params.LeftBottomVertex.value.x;
        this.params.leftBottomVertexY = this.effect.params.LeftBottomVertex.value.y;
        this.params.leftTopTangentX = this.effect.params.LeftTopTangent.value.x;
        this.params.leftTopTangentY = this.effect.params.LeftTopTangent.value.y;
        this.params.rightBottomTangentX = this.effect.params.RightBottomTangent.value.x;
        this.params.rightBottomTangentY = this.effect.params.RightBottomTangent.value.y;
        this.params.rightTopTangentX = this.effect.params.RightTopTangent.value.x;
        this.params.rightTopTangentY = this.effect.params.RightTopTangent.value.y;
        this.params.rightTopVertexX = this.effect.params.RightTopVertex.value.x;
        this.params.rightTopVertexY = this.effect.params.RightTopVertex.value.y;
        this.params.topLeftTangentX = this.effect.params.TopLeftTangent.value.x;
        this.params.topLeftTangentY = this.effect.params.TopLeftTangent.value.y;
        this.params.topLeftVertexX = this.effect.params.TopLeftVertex.value.x;
        this.params.topLeftVertexY = this.effect.params.TopLeftVertex.value.y;
        this.params.topRightTangentX = this.effect.params.TopRightTangent.value.x;
        this.params.topRightTangentY = this.effect.params.TopRightTangent.value.y;
        
        // 刷新GUI显示
        for (let i in this.gui.__controllers) {
            this.gui.__controllers[i].updateDisplay();
        }
    }
}

export { LumiBezierDeformationTest };
