import { BaseTest } from './BaseTest';
const THREE = require('three');
const { CustomShaderPass } = require('../../src/pp/LumiCustom/CustomShaderPass.js');
const { EffectComposer } = require('three/examples/jsm/postprocessing/EffectComposer.js');
const { RenderPass } = require('three/examples/jsm/postprocessing/RenderPass.js');

class LumiCustomTest extends BaseTest {
    constructor() {
        super();
        this.params = {};
    }

    async init() {
        this.setupScene();

        this.effect = new CustomShaderPass();
        this.initComposer();

        await super.init();
    }

    initComposer() {
        // 创建后处理渲染目标
        this.composer = new EffectComposer(this.renderer);
        this.renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(this.renderPass);
        this.composer.addPass(this.effect);
    }

    // 重写animate方法，使用Composer方式渲染
    animate() {
        if (this.effect && this.composer) {
            requestAnimationFrame(() => this.animate());

            // 使用RT链式处理编排器渲染
            this.composer.render();
        } else {
            super.animate();
        }
    }

    setupGUI() {
        if (!this.effect) {
            return;
        }

        // 自动从effect中获取参数
        this.params = {};
        
        // 遍历effect中的所有参数
        for (const key in this.effect.params) {
            if (this.effect.params.hasOwnProperty(key)) {
                // 获取参数值
                this.params[key] = this.effect.params[key].value !== undefined ? 
                                  this.effect.params[key].value : 
                                  this.effect.params[key];
            }
        }

        // 自动为每个参数创建GUI控件
        this.createGUIControls();
    }
    
    createGUIControls() {
        // 定义参数配置（实际项目中可以从effect的元数据中获取）
        const paramConfig = {
            intensity: { type: 'float', min: 0, max: 1, step: 0.01, name: '强度 (Intensity)' },
            ratio: { type: 'float', min: 0.1, max: 2, step: 0.1, name: '宽高比 (Ratio)' },
            //===begin_gui===
            //===end_gui===
        };

        // 为每个参数创建相应的GUI控件
        for (const key in this.params) {
            if (this.params.hasOwnProperty(key)) {
                // 如果有预定义配置则使用，否则尝试从参数值推断类型
                const config = paramConfig[key] || this.inferParamConfig(key, this.params[key]);
                
                let controller;
                switch (config.type) {
                    case 'int':
                        controller = this.gui.add(this.params, key, config.min, config.max)
                            .step(config.step || 1)
                            .name(config.name || key);
                        break;
                    case 'float':
                        controller = this.gui.add(this.params, key, config.min, config.max)
                            .step(config.step || 0.1)
                            .name(config.name || key);
                        break;
                    case 'enum':
                    case 'select':
                        controller = this.gui.add(this.params, key, config.options)
                            .name(config.name || key);
                        break;
                    case 'vector':
                        // 对于向量类型，为每个分量创建单独的控制器
                        if (Array.isArray(this.params[key])) {
                            const vectorFolder = this.gui.addFolder(`${config.name || key} (Vector)`);
                            this.params[key].forEach((val, index) => {
                                vectorFolder.add(this.params[key], index, config.min || 0, config.max || 1)
                                    .step(config.step || 0.1)
                                    .name(`Component ${index}`)
                                    .onChange(value => {
                                        this.effect.setParameter(key, this.params[key]);
                                    });
                            });
                            continue; // 跳过下面的onChange设置
                        } else if (this.params[key] instanceof THREE.Vector2) {
                            // 处理 THREE.Vector2 对象
                            const vectorFolder = this.gui.addFolder(`${config.name || key} (Vector2)`);
                            const vector = this.params[key];
                            vectorFolder.add(vector, 'x', config.min || -1, config.max || 1)
                                .step(config.step || 0.1)
                                .name('X')
                                .onChange(value => {
                                    this.effect.setParameter(key, vector);
                                });
                            vectorFolder.add(vector, 'y', config.min || -1, config.max || 1)
                                .step(config.step || 0.1)
                                .name('Y')
                                .onChange(value => {
                                    this.effect.setParameter(key, vector);
                                });
                            continue; // 跳过下面的onChange设置
                        } else if (this.params[key] instanceof THREE.Vector3) {
                            // 处理 THREE.Vector3 对象
                            const vectorFolder = this.gui.addFolder(`${config.name || key} (Vector3)`);
                            const vector = this.params[key];
                            vectorFolder.add(vector, 'x', config.min || -1, config.max || 1)
                                .step(config.step || 0.1)
                                .name('X')
                                .onChange(value => {
                                    this.effect.setParameter(key, vector);
                                });
                            vectorFolder.add(vector, 'y', config.min || -1, config.max || 1)
                                .step(config.step || 0.1)
                                .name('Y')
                                .onChange(value => {
                                    this.effect.setParameter(key, vector);
                                });
                            vectorFolder.add(vector, 'z', config.min || -1, config.max || 1)
                                .step(config.step || 0.1)
                                .name('Z')
                                .onChange(value => {
                                    this.effect.setParameter(key, vector);
                                });
                            continue; // 跳过下面的onChange设置
                        } else if (this.params[key] instanceof THREE.Vector4) {
                            // 处理 THREE.Vector4 对象
                            const vectorFolder = this.gui.addFolder(`${config.name || key} (Vector4)`);
                            const vector = this.params[key];
                            vectorFolder.add(vector, 'x', config.min || -1, config.max || 1)
                                .step(config.step || 0.1)
                                .name('X')
                                .onChange(value => {
                                    this.effect.setParameter(key, vector);
                                });
                            vectorFolder.add(vector, 'y', config.min || -1, config.max || 1)
                                .step(config.step || 0.1)
                                .name('Y')
                                .onChange(value => {
                                    this.effect.setParameter(key, vector);
                                });
                            vectorFolder.add(vector, 'z', config.min || -1, config.max || 1)
                                .step(config.step || 0.1)
                                .name('Z')
                                .onChange(value => {
                                    this.effect.setParameter(key, vector);
                                });
                            vectorFolder.add(vector, 'w', config.min || -1, config.max || 1)
                                .step(config.step || 0.1)
                                .name('W')
                                .onChange(value => {
                                    this.effect.setParameter(key, vector);
                                });
                            continue; // 跳过下面的onChange设置
                        }
                        break;
                    case 'matrix':
                        // 为矩阵类型创建控制器，支持Matrix2(2x2=4个元素)、Matrix3(3x3=9个元素)、Matrix4(4x4=16个元素)
                        const matrix = this.params[key];
                        if (matrix && typeof matrix === 'object' && matrix.elements) {
                            // 获取矩阵元素数量来判断矩阵类型
                            const elementCount = matrix.elements.length;
                            
                            // 创建文件夹来组织矩阵控制器
                            const matrixFolder = this.gui.addFolder(`${config.name || key} (Matrix ${elementCount === 4 ? '2x2' : elementCount === 9 ? '3x3' : elementCount === 16 ? '4x4' : ''})`);
                            
                            // 为矩阵的每个元素创建控制器
                            for (let i = 0; i < elementCount; i++) {
                                // 创建一个闭包来保存当前索引
                                ((index) => {
                                    const controller = matrixFolder.add(matrix.elements, index, config.min || -1, config.max || 1)
                                        .step(config.step || 0.1)
                                        .name(`Element[${index}]`)
                                        .onChange(value => {
                                            this.effect.setParameter(key, matrix);
                                        });
                                })(i);
                            }
                        }
                        continue; // 跳过下面的onChange设置
                    default:
                        // 默认情况，作为文本输入
                        controller = this.gui.add(this.params, key)
                            .name(config.name || key);
                }
                
                // 添加值变化监听器（除非已在switch中处理）
                if (controller) {
                    controller.onChange(value => {
                        console.log('onChange', key, value);
                        this.effect.setParameter(key, value);
                    });
                }
            }
        }
    }

    /**
     * 推断参数配置
     * @param {string} key - 参数名
     * @param {*} value - 参数值
     * @returns {Object} 推断的配置对象
     */
    inferParamConfig(key, value) {
        let config = { name: key };
        
        // 根据值的类型推断
        if (typeof value === 'number') {
            // 尝试判断是整数还是浮点数
            if (Number.isInteger(value)) {
                config.type = 'int';
                config.min = 0;
                config.max = 100;
                config.step = 1;
            } else {
                config.type = 'float';
                config.min = 0;
                config.max = 1;
                config.step = 0.1;
            }
        } else if (Array.isArray(value)) {
            config.type = 'vector';
            config.min = 0;
            config.max = 1;
            config.step = 0.1;
        } else if (typeof value === 'object' && value !== null) {
            // 检查是否是 THREE.Vector 对象
            if (value instanceof THREE.Vector2 || value instanceof THREE.Vector3 || value instanceof THREE.Vector4) {
                config.type = 'vector';
                config.min = -1;
                config.max = 1;
                config.step = 0.1;
            }
            // 检查是否是 THREE.Matrix 对象
            else if (value instanceof THREE.Vector2 || value instanceof THREE.Matrix3 || value instanceof THREE.Matrix4) {
                config.type = 'matrix';
                config.min = -1;
                config.max = 1;
                config.step = 0.1;
            }
        } else {
            config.type = 'string';
        }
        
        return config;
    }
    
    // 清理资源
    dispose() {
        if (this.effect) {
            this.effect.dispose();
        }
        super.dispose();
    }
}

const test = new LumiCustomTest();
test.init();