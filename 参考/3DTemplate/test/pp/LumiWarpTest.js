
import { BaseTest } from './BaseTest';
const { WarpShaderPass } = require('../../src/pp/LumiWarp/WarpShaderPass.js');

// LumiWarp测试类
class LumiWarpTest extends BaseTest {
    constructor() {
        super();
        this.params = {};
    }

    async init() {
        // 创建WarpShaderPass实例
        this.effect = new WarpShaderPass();
        await super.init();
    }

    // 设置GUI控制面板，参考AEInfo.json中的配置
    setupGUI() {
        // 获取可用的变形样式和轴向
        const warpStyles = WarpShaderPass.getAvailableWarpStyles();
        const warpAxis = WarpShaderPass.getAvailableWarpAxis();
        
        // 初始化参数
        this.params = {
            warpStyle: this.effect.params.warpStyle,
            warpAxis: this.effect.params.warpAxis,
            bend: this.effect.params.bend,
        };

        // 变形样式选择器
        this.gui.add(this.params, 'warpStyle', warpStyles).onChange(value => {
            this.effect.setWarpStyle(value);
        }).name('变形样式 (Warp Style)');

        // 变形轴向选择器
        this.gui.add(this.params, 'warpAxis', warpAxis).onChange(value => {
            this.effect.setWarpAxis(value);
        }).name('变形轴向 (Warp Axis)');

        // 弯曲强度滑块 (范围-100到100)
        this.gui.add(this.params, 'bend', -100, 100).onChange(value => {
            this.effect.setBend(value);
        }).name('弯曲强度 (Bend)');

        // 添加预设按钮
        const presets = {
            '重置': () => {
                this.params.warpStyle = 'Arc';
                this.params.warpAxis = 'Horizontal';
                this.params.bend = 50;
                this.effect.setParams(this.params);
                this.gui.updateDisplay();
            },
            '弧形水平': () => {
                this.params.warpStyle = 'Arc';
                this.params.warpAxis = 'Horizontal';
                this.params.bend = 75;
                this.effect.setParams(this.params);
                this.gui.updateDisplay();
            },
            '波形垂直': () => {
                this.params.warpStyle = 'Wave';
                this.params.warpAxis = 'Vertical';
                this.params.bend = -60;
                this.effect.setParams(this.params);
                this.gui.updateDisplay();
            },
            '鱼眼效果': () => {
                this.params.warpStyle = 'FishEye';
                this.params.warpAxis = 'Horizontal';
                this.params.bend = 80;
                this.effect.setParams(this.params);
                this.gui.updateDisplay();
            },
            '扭转效果': () => {
                this.params.warpStyle = 'Twist';
                this.params.warpAxis = 'Horizontal';
                this.params.bend = 45;
                this.effect.setParams(this.params);
                this.gui.updateDisplay();
            }
        };

        // 添加预设按钮到GUI
        Object.keys(presets).forEach(name => {
            this.gui.add(presets, name);
        });

        // 添加信息显示
        const info = {
            '当前参数': () => {
                const currentParams = this.effect.getParams();
                console.log('当前Warp参数:', currentParams);
                alert(`当前参数:\n样式: ${currentParams.warpStyle}\n轴向: ${currentParams.warpAxis}\n强度: ${currentParams.bend}`);
            }
        };
        this.gui.add(info, '当前参数');

        super.setupGUI();
    }

    // 更新函数，可以在这里添加实时更新逻辑
    update() {
        // 可以在这里添加动画或实时参数调整
        super.update();
    }

    // 清理资源
    dispose() {
        if (this.effect) {
            this.effect.dispose();
        }
        super.dispose();
    }
}

export { LumiWarpTest };
