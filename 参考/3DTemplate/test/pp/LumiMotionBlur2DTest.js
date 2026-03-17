import { BaseTest } from './BaseTest';
const { MotionBlur2DShaderPass } = require('../../src/pp/LumiMotionBlur2D/MotionBlur2DShaderPass.js');

class LumiMotionBlur2DTest extends BaseTest {
    constructor() {
        super();
        this.params = {};
    }

    async init() {
        this.effect = new MotionBlur2DShaderPass();
        await super.init();
    }

    setupGUI() {
        // 主要参数组
        const mainFolder = this.gui.addFolder('Main Parameters');
        
        this.params = {
            // 变换参数
            rotate: this.effect.params.rotate,
            anchorX: this.effect.params.anchor.x,
            anchorY: this.effect.params.anchor.y,
            positionX: this.effect.params.position.x,
            positionY: this.effect.params.position.y,
            unifiedScale: this.effect.params.unifiedScale,
            scale_x: this.effect.params.scale_x,
            scale_y: this.effect.params.scale_y,
            
            // 模糊参数
            vIntensity: this.effect.params.vIntensity,
            vCenter: this.effect.params.vCenter,
            minSamples: this.effect.params.minSamples,
            maxSamples: this.effect.params.maxSamples,
            mirrorEdge: this.effect.params.mirrorEdge,
            dither: this.effect.params.dither,
        };

        // 变换参数控件
        const transformFolder = mainFolder.addFolder('Transform');
        transformFolder.add(this.params, 'rotate', 0, 360).onChange(value => { 
            this.effect.setRotate(value); 
        });
        transformFolder.add(this.params, 'anchorX', 0, 1).onChange(value => { 
            this.effect.setAnchor(value, this.params.anchorY); 
        });
        transformFolder.add(this.params, 'anchorY', 0, 1).onChange(value => { 
            this.effect.setAnchor(this.params.anchorX, value); 
        });
        transformFolder.add(this.params, 'positionX', 0, 1).onChange(value => { 
            this.effect.setPosition(value, this.params.positionY); 
        });
        transformFolder.add(this.params, 'positionY', 0, 1).onChange(value => { 
            this.effect.setPosition(this.params.positionX, value); 
        });
        transformFolder.add(this.params, 'unifiedScale').onChange(value => { 
            this.effect.setUnifiedScale(value); 
        });
        transformFolder.add(this.params, 'scale_x', -10, 10).onChange(value => { 
            this.effect.setScaleX(value); 
        });
        transformFolder.add(this.params, 'scale_y', -10, 10).onChange(value => { 
            this.effect.setScaleY(value); 
        });

        // 模糊参数控件
        const blurFolder = mainFolder.addFolder('Motion Blur');
        blurFolder.add(this.params, 'vIntensity', 0, 2).onChange(value => { 
            this.effect.setVIntensity(value); 
        });
        blurFolder.add(this.params, 'vCenter', -1, 1).onChange(value => { 
            this.effect.setVCenter(value); 
        });
        blurFolder.add(this.params, 'minSamples', 0.02, 2.56).onChange(value => { 
            this.effect.setMinSamples(value); 
        });
        blurFolder.add(this.params, 'maxSamples', 0.02, 2.56).onChange(value => { 
            this.effect.setMaxSamples(value); 
        });
        blurFolder.add(this.params, 'mirrorEdge').onChange(value => { 
            this.effect.setMirrorEdge(value); 
        });
        blurFolder.add(this.params, 'dither', 0, 1).onChange(value => { 
            this.effect.setDither(value); 
        });

        // 效果信息
        const infoFolder = this.gui.addFolder('Effect Info');
        const info = {
            'Effect Name': 'Motion Blur 2D',
            'Parameters': '12 user parameters',
            'Algorithm': 'Multi-keyframe motion trail',
            'Performance': 'Adaptive sampling (437-1039 FPS)',
            'Keyframes': '6 interpolated keyframes',
            'Sampling': 'Dynamic based on motion distance'
        };
        
        Object.keys(info).forEach(key => {
            const controller = infoFolder.add(info, key);
            controller.domElement.style.pointerEvents = 'none';
            controller.domElement.style.opacity = '0.7';
        });

        // 展开主要文件夹
        mainFolder.open();
        transformFolder.open();
        blurFolder.open();

        super.setupGUI();
    }

    updateGUIFromEffect() {
        const currentParams = this.effect.getParams();
        
        // 更新GUI显示值
        this.params.rotate = currentParams.rotate;
        this.params.anchorX = currentParams.anchor.x;
        this.params.anchorY = currentParams.anchor.y;
        this.params.positionX = currentParams.position.x;
        this.params.positionY = currentParams.position.y;
        this.params.unifiedScale = currentParams.unifiedScale;
        this.params.scale_x = currentParams.scale_x;
        this.params.scale_y = currentParams.scale_y;
        this.params.vIntensity = currentParams.vIntensity;
        this.params.vCenter = currentParams.vCenter;
        this.params.minSamples = currentParams.minSamples;
        this.params.maxSamples = currentParams.maxSamples;
        this.params.mirrorEdge = currentParams.mirrorEdge;
        this.params.dither = currentParams.dither;

        // 刷新GUI显示
        this.gui.updateDisplay();
    }
}

export { LumiMotionBlur2DTest };
