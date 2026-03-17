import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as TWEEN from '@tweenjs/tween.js';
import { GoldSpiritEffect } from './effects/GoldSpiritEffect.js';

const DEFAULT_CONFIG = {
    particleCount: 20000,
    particleSize: 1.5,
    bloomStrength: 1.2,
    bloomRadius: 0.5,
    bloomThreshold: 0.1,
    cameraPos: [0, 5, 80],
    modelUrl: '', 
    textureUrl: '',
    effect: null // Will default to GoldSpiritEffect
};

export class ParticleMorph {
    constructor(containerId, config = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        
        // Default Effect Strategy
        if (!this.config.effect) {
            this.config.effect = new GoldSpiritEffect({
                colorStart: this.config.colorStart,
                colorEnd: this.config.colorEnd,
                speed: this.config.noiseSpeed
            });
        }

        this.container = document.getElementById(containerId);
        if (!this.container) throw new Error(`Container #${containerId} not found`);

        this.initThree();
        this.initPostProcessing();
        this.initScene().catch(e => console.error("Scene Init Error:", e));
        
        window.addEventListener('resize', this.onResize.bind(this));
        this.renderer.setAnimationLoop(this.render.bind(this));
    }

    initThree() {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x000000, 0.02);

        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.fromArray(this.config.cameraPos);

        this.renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.container.appendChild(this.renderer.domElement);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.autoRotate = true;
        this.controls.autoRotateSpeed = 1.0;
        
        this.clock = new THREE.Clock();
        this.dummyBoneTexture = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1);
        this.dummyBoneTexture.needsUpdate = true;
    }

    initPostProcessing() {
        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        this.bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            this.config.bloomStrength,
            this.config.bloomRadius,
            this.config.bloomThreshold
        );
        this.composer.addPass(this.bloomPass);
    }

    async initScene() {
        this.particleSystem = await this.generateParticles();
        // this.scene.add(this.particleSystem); // REMOVED: Particles are now added inside the GLTF hierarchy

        if (this.config.textureUrl) {
            this.updateImageTargets(this.config.textureUrl);
        }

        this.initSnow();
        
        const loader = document.getElementById('loading');
        if(loader) loader.style.opacity = 0;
    }

    async generateParticles() {
        const count = this.config.particleCount;
        const positions = new Float32Array(count * 3);
        const targetPos = new Float32Array(count * 3);
        const skinIndices = new Float32Array(count * 4);
        const skinWeights = new Float32Array(count * 4);
        
        let sampler = null;
        let mesh = null;

        try {
            if (this.config.modelUrl) {
                const loader = new GLTFLoader();
                const gltf = await new Promise((resolve, reject) => {
                    loader.load(this.config.modelUrl, resolve, undefined, reject);
                });
                
                // Find best mesh (Prioritize SkinnedMesh)
                gltf.scene.traverse(c => {
                    if (c.isSkinnedMesh) {
                        mesh = c; 
                    } else if (!mesh && c.isMesh && c.geometry.attributes.position.count > 100) {
                        mesh = c; // Fallback to static mesh
                    }
                });

                if (mesh) {
                    console.log(`[ParticleMorph] Selected Mesh: ${mesh.name}, Skinned: ${mesh.isSkinnedMesh}`);
                    
                    // IMPORTANT: Add the WHOLE scene to ensure Bones/Armature are present
                    this.scene.add(gltf.scene);
                    
                    // Scale down the whole scene
                    gltf.scene.scale.set(0.1, 0.1, 0.1);
                    
                    // Setup Animation Mixer on the root to catch all potential tracks
                    if (gltf.animations.length > 0) {
                        this.mixer = new THREE.AnimationMixer(gltf.scene);
                        const action = this.mixer.clipAction(gltf.animations[0]);
                        action.play();
                    }
                    
                    // Setup Source Mesh (Hidden, but drives the skeleton)
                    mesh.material = new THREE.MeshBasicMaterial({ 
                        color: 0x000000, 
                        transparent: true, 
                        opacity: 0, 
                        depthWrite: false, 
                        depthTest: false 
                    });
                    mesh.visible = true; // MUST be true for skeleton update
                    mesh.frustumCulled = false;
                    this.sourceMesh = mesh;

                    const particleGeom = new THREE.BufferGeometry();
                    const posAttr = mesh.geometry.attributes.position;
                    const skinIndexAttr = mesh.geometry.attributes.skinIndex;
                    const skinWeightAttr = mesh.geometry.attributes.skinWeight;
                    const indexAttr = mesh.geometry.index;

                    const sampleCount = this.config.particleCount;
                    const positions = new Float32Array(sampleCount * 3);
                    const targetPos = new Float32Array(sampleCount * 3);
                    const skinIndices = new Float32Array(sampleCount * 4);
                    const skinWeights = new Float32Array(sampleCount * 4);

                    const faceCount = indexAttr ? indexAttr.count / 3 : posAttr.count / 3;
                    const faceA = new Uint32Array(faceCount);
                    const faceB = new Uint32Array(faceCount);
                    const faceC = new Uint32Array(faceCount);
                    const cumulative = new Float32Array(faceCount);

                    const vA = new THREE.Vector3();
                    const vB = new THREE.Vector3();
                    const vC = new THREE.Vector3();
                    const cb = new THREE.Vector3();
                    const ab = new THREE.Vector3();

                    let totalArea = 0;
                    for (let f = 0; f < faceCount; f++) {
                        const a = indexAttr ? indexAttr.getX(f * 3) : f * 3;
                        const b = indexAttr ? indexAttr.getX(f * 3 + 1) : f * 3 + 1;
                        const c = indexAttr ? indexAttr.getX(f * 3 + 2) : f * 3 + 2;
                        faceA[f] = a;
                        faceB[f] = b;
                        faceC[f] = c;
                        vA.fromBufferAttribute(posAttr, a);
                        vB.fromBufferAttribute(posAttr, b);
                        vC.fromBufferAttribute(posAttr, c);
                        cb.subVectors(vC, vB);
                        ab.subVectors(vA, vB);
                        const area = cb.cross(ab).length() * 0.5;
                        totalArea += area;
                        cumulative[f] = totalArea;
                    }

                    const sampleFaceIndex = (r) => {
                        let low = 0;
                        let high = faceCount - 1;
                        while (low < high) {
                            const mid = (low + high) >> 1;
                            if (r <= cumulative[mid]) high = mid;
                            else low = mid + 1;
                        }
                        return low;
                    };

                    const accumulateWeights = (map, vertexIndex, factor) => {
                        if (!skinIndexAttr || !skinWeightAttr) return;
                        const i0 = skinIndexAttr.getX(vertexIndex);
                        const i1 = skinIndexAttr.getY(vertexIndex);
                        const i2 = skinIndexAttr.getZ(vertexIndex);
                        const i3 = skinIndexAttr.getW(vertexIndex);
                        const w0 = skinWeightAttr.getX(vertexIndex);
                        const w1 = skinWeightAttr.getY(vertexIndex);
                        const w2 = skinWeightAttr.getZ(vertexIndex);
                        const w3 = skinWeightAttr.getW(vertexIndex);
                        map.set(i0, (map.get(i0) || 0) + w0 * factor);
                        map.set(i1, (map.get(i1) || 0) + w1 * factor);
                        map.set(i2, (map.get(i2) || 0) + w2 * factor);
                        map.set(i3, (map.get(i3) || 0) + w3 * factor);
                    };

                    for (let i = 0; i < sampleCount; i++) {
                        const faceIndex = sampleFaceIndex(Math.random() * totalArea);
                        const a = faceA[faceIndex];
                        const b = faceB[faceIndex];
                        const c = faceC[faceIndex];

                        const r1 = Math.random();
                        const r2 = Math.random();
                        const sqrtR1 = Math.sqrt(r1);
                        const wa = 1 - sqrtR1;
                        const wb = r2 * sqrtR1;
                        const wc = 1 - wa - wb;

                        vA.fromBufferAttribute(posAttr, a);
                        vB.fromBufferAttribute(posAttr, b);
                        vC.fromBufferAttribute(posAttr, c);

                        const px = vA.x * wa + vB.x * wb + vC.x * wc;
                        const py = vA.y * wa + vB.y * wb + vC.y * wc;
                        const pz = vA.z * wa + vB.z * wb + vC.z * wc;

                        positions[i * 3] = px;
                        positions[i * 3 + 1] = py;
                        positions[i * 3 + 2] = pz;

                        targetPos[i * 3] = px;
                        targetPos[i * 3 + 1] = py;
                        targetPos[i * 3 + 2] = pz;

                        if (skinIndexAttr && skinWeightAttr) {
                            const map = new Map();
                            accumulateWeights(map, a, wa);
                            accumulateWeights(map, b, wb);
                            accumulateWeights(map, c, wc);
                            let entries = Array.from(map.entries()).filter(([, w]) => w > 0);
                            entries.sort((m, n) => n[1] - m[1]);
                            entries = entries.slice(0, 4);
                            let sum = entries.reduce((s, e) => s + e[1], 0);
                            if (sum <= 0) {
                                entries = [[0, 1]];
                                sum = 1;
                            }
                            for (let j = 0; j < 4; j++) {
                                const e = entries[j];
                                skinIndices[i * 4 + j] = e ? e[0] : 0;
                                skinWeights[i * 4 + j] = e ? e[1] / sum : 0;
                            }
                        }
                    }

                    particleGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
                    particleGeom.setAttribute('targetPos', new THREE.BufferAttribute(targetPos, 3));
                    if (skinIndexAttr && skinWeightAttr) {
                        particleGeom.setAttribute('skinIndex', new THREE.BufferAttribute(skinIndices, 4));
                        particleGeom.setAttribute('skinWeight', new THREE.BufferAttribute(skinWeights, 4));
                    }

                    // Create Material using Effect Strategy
                    // Note: We use MANUAL skinning (skinning: false in Three.js terms, handled in shader)
                    const hasSkinning = !!(mesh.isSkinnedMesh && mesh.skeleton && skinIndexAttr && skinWeightAttr);
                    this.material = this.createMaterialFromEffect(this.config.effect, hasSkinning, mesh);

                    const points = new THREE.Points(particleGeom, this.material);
                    points.frustumCulled = false;
                    
                    // IMPORTANT: Add points to the SAME PARENT as the mesh
                    mesh.parent.add(points);
                    this.particleSystem = points; // Keep reference
                    
                    return points;
                }
            }
        } catch (e) {
            console.warn("Model load failed, fallback.", e);
        }

        // Only create fallback if no mesh was found
        if (!mesh) {
            const geom = new THREE.TorusKnotGeometry(10, 3, 100, 16);
            mesh = new THREE.Mesh(geom);
            const sampler = new MeshSurfaceSampler(mesh).build();
            // ... fallback logic (simplified for brevity as we focus on horse)
             const count = 20000;
             const positions = new Float32Array(count * 3);
             const targetPos = new Float32Array(count * 3);
             const temp = new THREE.Vector3();
             for(let i=0; i<count; i++) {
                 sampler.sample(temp);
                 positions[i*3] = temp.x; positions[i*3+1] = temp.y; positions[i*3+2] = temp.z;
                 targetPos[i*3] = temp.x; targetPos[i*3+1] = temp.y; targetPos[i*3+2] = temp.z;
             }
             const bufferGeom = new THREE.BufferGeometry();
             bufferGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
             bufferGeom.setAttribute('targetPos', new THREE.BufferAttribute(targetPos, 3));
             this.material = this.createMaterialFromEffect(this.config.effect, false, null);
             return new THREE.Points(bufferGeom, this.material);
        }
        
        return null; // Should not reach here
    }

    createMaterialFromEffect(effect, hasSkinning, mesh) {
        // Base uniforms needed by engine
        const baseUniforms = {
            time: { value: 0 },
            size: { value: this.config.particleSize },
            disperse: { value: 0 }
        };

        const skinUniforms = {};
        const identity = new THREE.Matrix4();
        if (hasSkinning && mesh) {
            skinUniforms.bindMatrix = { value: mesh.bindMatrix };
            skinUniforms.bindMatrixInverse = { value: mesh.bindMatrixInverse };
            skinUniforms.boneTexture = { value: mesh.skeleton ? mesh.skeleton.boneTexture : this.dummyBoneTexture };
            skinUniforms.boneTextureSize = { value: mesh.skeleton && mesh.skeleton.boneTextureSize ? mesh.skeleton.boneTextureSize : 1 };
            skinUniforms.hasSkinning = { value: 1 };
        } else {
            skinUniforms.bindMatrix = { value: identity };
            skinUniforms.bindMatrixInverse = { value: identity };
            skinUniforms.boneTexture = { value: this.dummyBoneTexture };
            skinUniforms.boneTextureSize = { value: 1 };
            skinUniforms.hasSkinning = { value: 0 };
        }

        const uniforms = { ...baseUniforms, ...skinUniforms, ...effect.uniforms };

        return new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: effect.getVertexShader(),
            fragmentShader: effect.getFragmentShader(),
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
    }

    // --- Dynamic Effect Switching ---
    setEffect(effect) {
        if (!this.particleSystem || !this.sourceMesh) return;
        
        const oldUniforms = this.material.uniforms;
        const currentDisperse = oldUniforms.disperse.value;
        const hasSkinning = !!this.sourceMesh.skeleton; // Check if skinned

        const newMaterial = this.createMaterialFromEffect(effect, hasSkinning, this.sourceMesh);
        
        // Restore state
        newMaterial.uniforms.disperse.value = currentDisperse;
        newMaterial.uniforms.time.value = oldUniforms.time.value;
        newMaterial.uniforms.size.value = oldUniforms.size.value;

        this.particleSystem.material = newMaterial;
        this.material = newMaterial;
        this.config.effect = effect;
    }

    updateImageTargets(imageUrl) {
        if (!this.particleSystem) return;
        const loader = new THREE.TextureLoader();
        loader.load(imageUrl, (tex) => {
            const aspect = tex.image.width / tex.image.height;
            const h = 20;
            const w = h * aspect;
            const targetAttr = this.particleSystem.geometry.attributes.targetPos;
            const count = targetAttr.count;
            // Note: When using mesh geometry, count is vertex count (e.g. 800)
            // If we want more particles for image, we are limited by mesh vertices
            // For now, we just map available vertices.
            for(let i=0; i<count; i++) {
                const x = (Math.random() - 0.5) * w;
                const y = (Math.random() - 0.5) * h;
                targetAttr.setXYZ(i, x, y, 0);
            }
            targetAttr.needsUpdate = true;
        });
    }

    initSnow() {
        const count = 2000;
        const pos = new Float32Array(count * 3);
        for(let i=0; i<count*3; i++) pos[i] = (Math.random() - 0.5) * 100;
        const geom = new THREE.BufferGeometry();
        geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        this.snow = new THREE.Points(geom, new THREE.PointsMaterial({
            color: 0xffffff, size: 0.3, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending
        }));
        this.scene.add(this.snow);
    }

    onResize() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
        this.composer.setSize(w, h);
    }

    render() {
        const dt = this.clock.getDelta();
        const time = this.clock.getElapsedTime();
        if (this.mixer) {
            this.mixer.update(dt);
            if (this.sourceMesh) {
                // Force update matrices
                this.sourceMesh.updateMatrixWorld(true);
                if (this.sourceMesh.skeleton) {
                    this.sourceMesh.skeleton.update();
                }
            }
        }
        
        // Manual Texture Upload
        if (this.sourceMesh && this.sourceMesh.skeleton && this.material && this.material.uniforms.boneTexture) {
            if (this.sourceMesh.skeleton.boneTexture) {
                this.material.uniforms.boneTexture.value = this.sourceMesh.skeleton.boneTexture;
                if (this.sourceMesh.skeleton.boneTextureSize) {
                     this.material.uniforms.boneTextureSize.value = this.sourceMesh.skeleton.boneTextureSize;
                }
            }
        }

        if (this.material) this.material.uniforms.time.value = time;
        if (this.snow) {
            this.snow.rotation.y = time * 0.05;
            this.snow.position.y -= 0.1;
            if (this.snow.position.y < -20) this.snow.position.y = 20;
        }
        this.controls.update();
        this.composer.render();
    }

    setDisperse(val) {
        if (this.material) {
            new TWEEN.Tween(this.material.uniforms.disperse)
                .to({ value: val }, 2000)
                .easing(TWEEN.Easing.Cubic.InOut)
                .start();
            this.controls.autoRotateSpeed = (val > 0.5) ? 0.2 : 1.0;
        }
    }

    setParam(key, val) {
        // Map UI keys to Uniforms (Generic)
        if (this.material && this.material.uniforms[key]) {
             this.material.uniforms[key].value = val;
        }
        // Specific mapping for known keys if they don't match uniform names directly
        if (key === 'noiseSpeed' && this.material && this.material.uniforms.flowSpeed) 
            this.material.uniforms.flowSpeed.value = val;
        
        if (key === 'particleSize' && this.material) this.material.uniforms.size.value = val;
        if (key === 'bloomStrength') this.bloomPass.strength = val;
    }
}
