
import { BaseTest } from './BaseTest';
const { LightSensationShaderPass } = require('../../src/pp/LumiLightSensation/LightSensationShaderPass.js');

// LightSensation测试类
class LumiLightSensationTest extends BaseTest {
    constructor() {
        super();
        this.params = {};
    }

    async init() {
        this.effect = new LightSensationShaderPass();
        await super.init();
    }

    // 根据AEInfo.json中的配置设置GUI参数
    setupGUI() {
        this.params = {
            lightIntensity: this.effect.params.lightIntensity,
        };

        // 根据AEInfo.json中的参数范围设置GUI控件
        // lightIntensity: min: -1.0, max: 1.0, default: 1.0
        this.gui.add(this.params, 'lightIntensity', -1.0, 1.0).onChange(value => { 
            this.effect.setLightIntensity(value);
        });

        // 添加重置按钮
        const resetParams = {
            reset: () => {
                this.params.lightIntensity = 1.0;
                this.effect.setLightIntensity(1.0);
                // 更新GUI显示
                for (let i in this.gui.__controllers) {
                    this.gui.__controllers[i].updateDisplay();
                }
            }
        };
        this.gui.add(resetParams, 'reset').name('重置参数');

        // 添加说明文本
        const info = {
            info: 'LightSensation - 光感效果\n调整光感强度参数来改变图像的明暗对比效果\n正值增强亮部，负值增强暗部'
        };
        this.gui.add(info, 'info').name('说明').listen();

        super.setupGUI();
    }
}

export { LumiLightSensationTest };
