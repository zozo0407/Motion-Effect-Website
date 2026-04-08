### 🎯 黄金示例 (Golden Few-Shot Example)
以下是一段被认为具有“顶级审美”的默认风格代码示例，展示了如何完美符合 `EngineEffect` 契约，同时写出极具质感和呼吸感的渲染：

```javascript
import * as THREE from 'three';

export default class EngineEffect {
    constructor() {
        this.params = {
            baseColor: '#002244',
            lightColor: '#00ffee',
            roughness: 0.1,
            transmission: 0.9,
            speed: 1.0
        };
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.mesh = null;
        this.lights = [];
    }

    getUIConfig() {
        return [
            { bind: 'baseColor', name: '基础色调', type: 'color', value: this.params.baseColor },
            { bind: 'lightColor', name: '高光色调', type: 'color', value: this.params.lightColor },
            { bind: 'roughness', name: '粗糙度', type: 'range', value: this.params.roughness, min: 0, max: 1, step: 0.01 },
            { bind: 'transmission', name: '透射率', type: 'range', value: this.params.transmission, min: 0, max: 1, step: 0.01 },
            { bind: 'speed', name: '流动速度', type: 'range', value: this.params.speed, min: 0.1, max: 3.0, step: 0.1 }
        ];
    }

    setParam(key, value) {
        this.params[key] = value;
        if (!this.mesh || !this.mesh.material) return;
        
        if (key === 'baseColor') {
            this.mesh.material.color.set(value);
            this.scene.background.set(value).multiplyScalar(0.05); // 暗化背景
        } else if (key === 'lightColor') {
            this.lights.forEach(l => {
                if (l.isPointLight) l.color.set(value);
            });
        } else if (key === 'roughness') {
            this.mesh.material.roughness = value;
        } else if (key === 'transmission') {
            this.mesh.material.transmission = value;
        }
    }

    onStart(ctx) {
        const { canvas, gl, size } = ctx;
        const width = Math.max(1, Math.floor(size.width || 1));
        const height = Math.max(1, Math.floor(size.height || 1));
        const dpr = Math.max(1, Math.min(2, Number(size.dpr) || 1));

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(this.params.baseColor).multiplyScalar(0.05);
        this.scene.fog = new THREE.FogExp2(this.scene.background, 0.05);

        this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
        this.camera.position.set(0, 0, 8);

        const rendererOptions = { antialias: true, alpha: true };
        if (canvas) rendererOptions.canvas = canvas;
        if (gl) rendererOptions.context = gl;
        
        this.renderer = new THREE.WebGLRenderer(rendererOptions);
        this.renderer.setPixelRatio(dpr);
        this.renderer.setSize(width, height, false);
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;

        // 构建高级质感材质 (MeshPhysicalMaterial)
        const geometry = new THREE.IcosahedronGeometry(2, 64, 64);
        const material = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color(this.params.baseColor),
            metalness: 0.1,
            roughness: this.params.roughness,
            transmission: this.params.transmission, // 玻璃质感
            ior: 1.5,
            thickness: 0.5,
            clearcoat: 1.0,
            clearcoatRoughness: 0.1,
            side: THREE.DoubleSide
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.scene.add(this.mesh);

        // 构建富有层次的光影
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
        this.scene.add(ambientLight);

        // 主光源 (Key Light)
        const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
        dirLight.position.set(5, 5, 5);
        this.scene.add(dirLight);

        // 游走的彩色点光源 (Dynamic Fill/Rim Light)
        const pointLight1 = new THREE.PointLight(new THREE.Color(this.params.lightColor), 5, 20);
        this.scene.add(pointLight1);
        this.lights.push(pointLight1);

        const pointLight2 = new THREE.PointLight(0xff00ff, 3, 20);
        this.scene.add(pointLight2);
        this.lights.push(pointLight2);
    }

    onUpdate(ctx) {
        if (!this.renderer || !this.scene || !this.camera) return;
        const time = ctx.time * this.params.speed;

        if (this.mesh) {
            // 呼吸感缓慢旋转
            this.mesh.rotation.x = Math.sin(time * 0.3) * 0.5;
            this.mesh.rotation.y = time * 0.2;
            
            // 顶点微小形变模拟有机感
            const positionAttribute = this.mesh.geometry.attributes.position;
            const vertex = new THREE.Vector3();
            for (let i = 0; i < positionAttribute.count; i++) {
                vertex.fromBufferAttribute(positionAttribute, i);
                // 基础法线方向上的低频噪声形变
                const offset = Math.sin(vertex.x * 2.0 + time) * Math.cos(vertex.y * 2.0 + time) * 0.05;
                vertex.normalize().multiplyScalar(2.0 + offset);
                positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
            }
            positionAttribute.needsUpdate = true;
            this.mesh.geometry.computeVertexNormals();
        }

        // 光源游走产生动态反射
        if (this.lights[0]) {
            this.lights[0].position.x = Math.sin(time * 0.5) * 5;
            this.lights[0].position.z = Math.cos(time * 0.5) * 5;
        }
        if (this.lights[1]) {
            this.lights[1].position.y = Math.sin(time * 0.7) * 4;
            this.lights[1].position.x = Math.cos(time * 0.3) * 4;
        }

        this.renderer.render(this.scene, this.camera);
    }

    onResize(size) {
        if (!this.camera || !this.renderer) return;
        const width = Math.max(1, Math.floor(size.width || 1));
        const height = Math.max(1, Math.floor(size.height || 1));
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height, false);
    }

    onDestroy() {
        if (this.mesh) {
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
        }
        if (this.renderer) this.renderer.dispose();
        this.mesh = null;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.lights = [];
    }
}
```