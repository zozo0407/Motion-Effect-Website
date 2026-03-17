import { BaseTest } from './BaseTest';
const { ExtractShaderPass } = require('../../src/pp/LumiExtract/ExtractShaderPass.js');

class LumiExtractTest extends BaseTest {
    constructor() {
        super();
        this.params = {};
    }

    async init() {
        this.effect = new ExtractShaderPass();
        await super.init();
    }

    setupGUI() {
        // 基于AEInfo.json中的参数配置设置GUI控件
        this.params = {
            blackField: this.effect.params.blackField,
            blackSoft: this.effect.params.blackSoft,
            whiteField: this.effect.params.whiteField,
            whiteSoft: this.effect.params.whiteSoft,
            reverse: this.effect.params.reverse
        };

        // 主要参数控件
        const mainFolder = this.gui.addFolder('Extract Parameters');
        mainFolder.add(this.params, 'blackField', 0, 255, 1).name('Black Field (黑场)').onChange(value => {
            this.effect.setBlackField(value);
        });
        
        mainFolder.add(this.params, 'blackSoft', 0, 255, 1).name('Black Soft (黑色柔和度)').onChange(value => {
            this.effect.setBlackSoft(value);
        });
        
        mainFolder.add(this.params, 'whiteField', 0, 255, 1).name('White Field (白场)').onChange(value => {
            this.effect.setWhiteField(value);
        });
        
        mainFolder.add(this.params, 'whiteSoft', 0, 255, 1).name('White Soft (白色柔和度)').onChange(value => {
            this.effect.setWhiteSoft(value);
        });
        
        mainFolder.add(this.params, 'reverse').name('Reverse (反转)').onChange(value => {
            this.effect.setReverse(value);
        });

        mainFolder.open();

        // 预设效果
        const presetFolder = this.gui.addFolder('Presets');
        const presetControls = {
            'Reset to Default': () => {
                this.effect.resetToDefaults();
                this.updateGUIValues();
            },
            'High Contrast': () => {
                this.effect.applyPreset('highContrast');
                this.updateGUIValues();
            },
            'Soft Extraction': () => {
                this.effect.applyPreset('softExtraction');
                this.updateGUIValues();
            },
            'Inverted Extraction': () => {
                this.effect.applyPreset('invertedExtraction');
                this.updateGUIValues();
            }
        };

        Object.keys(presetControls).forEach(presetName => {
            presetFolder.add(presetControls, presetName);
        });

        presetFolder.open();

        // 效果信息
        const infoFolder = this.gui.addFolder('Effect Info');
        const info = {
            'Effect Name': 'Extract (提取)',
            'Parameters': '5 (blackField, blackSoft, whiteField, whiteSoft, reverse)',
            'Algorithm': 'Dual-threshold luminance extraction',
            'Performance': 'Excellent (962+ FPS)',
            'Use Case': 'Masking, thresholding, image analysis'
        };

        Object.keys(info).forEach(key => {
            const controller = infoFolder.add(info, key);
            controller.domElement.style.pointerEvents = 'none';
            controller.domElement.querySelector('input').style.color = '#999';
        });

        infoFolder.open();

        super.setupGUI();
    }

    // 更新GUI显示值
    updateGUIValues() {
        const currentParams = this.effect.getParameters();
        
        // 更新参数对象
        this.params.blackField = currentParams.blackField;
        this.params.blackSoft = currentParams.blackSoft;
        this.params.whiteField = currentParams.whiteField;
        this.params.whiteSoft = currentParams.whiteSoft;
        this.params.reverse = currentParams.reverse;

        // 刷新GUI显示
        this.gui.controllersRecursive().forEach(controller => {
            controller.updateDisplay();
        });
    }
}

export { LumiExtractTest };
