import * as THREE from 'three';
import GUI from 'lil-gui';

class BaseTest {
    constructor() {
        this.renderer = null;
        this.scene = null;
        this.camera = null;
        this.plane = null;
        this.texture = null;
        this.gui = null;
        this.effect = null;
        this.hasEffect = null;
        this.sceneSetup = false;
        this.animationId = null; // 添加动画ID
    }

    setupScene() {
        // Scene Setup
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        this.sceneSetup = true;
    }

    async init() {
        if (!this.sceneSetup) {
            this.setupScene();
        }

        // Load Texture
        const textureLoader = new THREE.TextureLoader();
        this.texture = await textureLoader.loadAsync('../../public/image/Sample1.jpg');
        this.texture.wrapS = THREE.ClampToEdgeWrapping;
        this.texture.wrapT = THREE.ClampToEdgeWrapping;
        this.texture.minFilter = THREE.LinearFilter;
        
        const planeGeometry = new THREE.PlaneGeometry(2, 2);
        const planeMaterial = new THREE.MeshBasicMaterial({ map: this.texture });
        this.plane = new THREE.Mesh(planeGeometry, planeMaterial);
        this.scene.add(this.plane);

        // 创建renderTarget用于效果渲染
        this.renderTarget = new THREE.WebGLRenderTarget(
            window.innerWidth, 
            window.innerHeight
        );

        // 时钟用于计算deltaTime
        this.clock = new THREE.Clock();

        // UI
        this.gui = new GUI();

        // Event listeners
        window.addEventListener('resize', () => this.onWindowResize());

        // Setup GUI (to be implemented by subclasses)
        this.setupGUI();
        
        // Start animation loop
        this.animate();
    }

    onWindowResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        this.renderer.setSize(width, height);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
    }

    animate() {
        // 保存动画ID以便后续取消
        this.animationId = requestAnimationFrame(() => this.animate());

        if (this.hasEffect === null) {
            this.hasEffect = !!(this.effect && typeof this.effect.render === 'function');
            console.log(this.hasEffect ? 'Render effect' : 'No effect to render');
        }
        
        // 检查renderer是否存在
        if (!this.renderer) return;
        
        if (this.hasEffect) {
            const readBuffer = {
                texture: this.texture,
                width: window.innerWidth,
                height: window.innerHeight
            };
            this.effect.render(this.renderer, null, readBuffer, this.clock.getDelta(), false);
        } else {
            if (this.texture) {
                this.plane.material.map = this.texture;
                this.plane.material.needsUpdate = true;
            }
            this.renderer.setRenderTarget(null);
            this.renderer.render(this.scene, this.camera);
        }
    }

    // 子类需要重写的方法
    setupGUI() {
        // 由子类实现

        // 添加预设按钮
        const presetFolder = this.gui.addFolder('Presets');
        // 获取所有预设名称并动态创建按钮
        const presetNames = this.effect.getPresetNames();
        presetNames.forEach(presetName => {
            // 将预设名称转换为更友好的显示名称
            const displayName = presetName.charAt(0).toUpperCase() + presetName.slice(1);
            
            const presetFuncs = {
                [presetName]: () => {
                    this.effect.applyPreset(presetName);
                }
            };
            
            presetFolder.add(presetFuncs, presetName).name(displayName);
        });
    }

    dispose() {
        // 取消动画循环
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        // 移除事件监听器
        window.removeEventListener('resize', () => this.onWindowResize());
        
        // 销毁GUI
        if (this.gui) {
            this.gui.destroy();
            this.gui = null;
        }
        
        // 销毁场景对象
        if (this.plane) {
            this.scene.remove(this.plane);
            this.plane.geometry.dispose();
            this.plane.material.dispose();
            this.plane = null;
        }
        
        // 销毁纹理
        if (this.texture) {
            this.texture.dispose();
            this.texture = null;
        }
        
        // 销毁渲染目标
        if (this.renderTarget) {
            this.renderTarget.dispose();
            this.renderTarget = null;
        }
        
        // 销毁时钟
        if (this.clock) {
            this.clock = null;
        }
        
        // 销毁场景、相机和渲染器
        if (this.scene) {
            this.scene = null;
        }
        
        if (this.camera) {
            this.camera = null;
        }
        
        if (this.renderer) {
            // 清理DOM元素
            if (this.renderer.domElement && this.renderer.domElement.parentNode) {
                this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
            }
            this.renderer.dispose();
            this.renderer = null;
        }
        
        // 重置效果相关属性
        if (this.effect) {
            this.effect = null;
        }
        
        if (this.hasEffect !== null) {
            this.hasEffect = null;
        }
        
        // 重置场景设置标志
        this.sceneSetup = false;
    }
}

export { BaseTest };