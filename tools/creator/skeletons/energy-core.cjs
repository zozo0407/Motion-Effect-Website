module.exports.buildEnergyCoreEffectCode = function(params = {}) {
    const color = params.color || '#00f2ff';
    const intensity = params.intensity || 1.2;
    const speed = params.speed || 1.0;
    const scale = params.scale || 1.0;

    return `import * as THREE from 'three';

export default class EngineEffect {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.coreMesh = null;
        this.ringMesh = null;
        this.coreWire = null;
        this.ringWire = null;
        this.particles = null;
        this.params = {
            color: '${color}',
            intensity: ${intensity},
            speed: ${speed},
            scale: ${scale}
        };
        
        // Mouse interaction state
        this.mouseX = 0;
        this.mouseY = 0;
        this.targetX = 0;
        this.targetY = 0;
    }

    onStart(ctx) {
        this.ctx = ctx; // Save ctx for cleanup
        const width = Math.max(1, Math.floor(ctx?.size?.width || ctx?.width || 800));
        const height = Math.max(1, Math.floor(ctx?.size?.height || ctx?.height || 600));
        const dpr = Math.max(1, Math.min(2, ctx?.size?.dpr || ctx?.dpr || 1));

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x050510);

        this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
        this.camera.position.set(0, 0, 5);

        this.renderer = new THREE.WebGLRenderer({ 
            canvas: ctx.canvas, 
            antialias: true,
            alpha: true
        });
        this.renderer.setPixelRatio(dpr);
        this.renderer.setSize(width, height, false);

        // Holographic Shader Material
        const vertexShader = \`
            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec3 vViewPosition;
            void main() {
                vUv = uv;
                vNormal = normalize(normalMatrix * normal);
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                vViewPosition = -mvPosition.xyz;
                gl_Position = projectionMatrix * mvPosition;
            }
        \`;

        const fragmentShader = \`
            uniform vec3 uColor;
            uniform float uTime;
            uniform float uIntensity;
            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec3 vViewPosition;
            
            void main() {
                // Fresnel rim light
                vec3 normal = normalize(vNormal);
                vec3 viewDir = normalize(vViewPosition);
                float rim = 1.0 - max(dot(viewDir, normal), 0.0);
                rim = smoothstep(0.6, 1.0, rim);
                
                // Holographic scanlines
                float scanline = sin(vUv.y * 50.0 - uTime * 3.0) * 0.5 + 0.5;
                
                // Base pulse
                float pulse = sin(uTime * 2.0) * 0.2 + 0.8;
                
                vec3 finalColor = uColor * uIntensity * (rim + scanline * 0.3) * pulse;
                gl_FragColor = vec4(finalColor, rim * 0.8 + 0.2);
            }
        \`;

        this.material = new THREE.ShaderMaterial({
            uniforms: {
                uColor: { value: new THREE.Color(this.params.color) },
                uTime: { value: 0.0 },
                uIntensity: { value: this.params.intensity }
            },
            vertexShader,
            fragmentShader,
            transparent: true,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            depthWrite: false
        });

        // Wireframe Material
        this.wireMat = new THREE.MeshBasicMaterial({
            color: this.params.color,
            wireframe: true,
            transparent: true,
            opacity: 0.4,
            blending: THREE.AdditiveBlending
        });

        // Group to hold everything for mouse rotation
        this.interactiveGroup = new THREE.Group();
        this.scene.add(this.interactiveGroup);

        // Inner Core (Icosahedron - low poly)
        const coreGeo = new THREE.IcosahedronGeometry(1, 0); // Detail 0 for fewer subdivisions
        this.coreMesh = new THREE.Mesh(coreGeo, this.material);
        this.interactiveGroup.add(this.coreMesh);
        
        this.coreWire = new THREE.Mesh(coreGeo, this.wireMat);
        this.coreWire.scale.setScalar(1.05); // Slightly larger to overlay
        this.interactiveGroup.add(this.coreWire);

        // Outer Ring (Torus - low poly)
        const ringGeo = new THREE.TorusGeometry(1.8, 0.05, 6, 24); // Fewer segments
        this.ringMesh = new THREE.Mesh(ringGeo, this.material);
        this.interactiveGroup.add(this.ringMesh);
        
        this.ringWire = new THREE.Mesh(ringGeo, this.wireMat);
        this.ringWire.scale.setScalar(1.02);
        this.interactiveGroup.add(this.ringWire);

        // Particle Dust
        const particlesGeo = new THREE.BufferGeometry();
        const particleCount = 150;
        const posArray = new Float32Array(particleCount * 3);
        for(let i = 0; i < particleCount * 3; i++) {
            posArray[i] = (Math.random() - 0.5) * 8;
        }
        particlesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        const particlesMat = new THREE.PointsMaterial({
            size: 0.05,
            color: this.params.color,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });
        this.particles = new THREE.Points(particlesGeo, particlesMat);
        this.interactiveGroup.add(this.particles);

        // Mouse interaction listener
        this.onPointerMove = (e) => {
            if (!ctx.canvas) return;
            const rect = ctx.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            // Normalize to -1 to 1
            this.mouseX = (x / rect.width) * 2 - 1;
            this.mouseY = -(y / rect.height) * 2 + 1;
        };
        if (ctx.canvas) {
            ctx.canvas.addEventListener('pointermove', this.onPointerMove);
        }
    }

    onUpdate(ctx) {
        if (!this.renderer || !this.scene || !this.camera) return;

        const time = ctx?.time || 0;
        const s = Number.isFinite(this.params.scale) ? this.params.scale : parseFloat(this.params.scale);
        
        if (this.material && this.material.uniforms) {
            this.material.uniforms.uTime.value = time * this.params.speed;
            this.material.uniforms.uIntensity.value = this.params.intensity;
            this.material.uniforms.uColor.value.set(this.params.color);
        }
        if (this.wireMat) {
            this.wireMat.color.set(this.params.color);
        }

        // Auto-rotation
        if (this.coreMesh && this.coreWire) {
            const rotY = time * 0.5 * this.params.speed;
            const rotX = time * 0.3 * this.params.speed;
            this.coreMesh.rotation.set(rotX, rotY, 0);
            this.coreWire.rotation.set(rotX, rotY, 0);
        }

        if (this.ringMesh && this.ringWire) {
            const rotX = Math.PI / 2 + Math.sin(time * 0.5) * 0.2;
            const rotY = time * -0.2 * this.params.speed;
            this.ringMesh.rotation.set(rotX, rotY, 0);
            this.ringWire.rotation.set(rotX, rotY, 0);
        }

        if (this.particles) {
            this.particles.rotation.y = time * 0.1 * this.params.speed;
            this.particles.material.color.set(this.params.color);
        }

        // Mouse interaction interpolation
        if (this.interactiveGroup) {
            // Apply scale via UI
            if (Number.isFinite(s)) {
                const clamped = Math.max(0.25, Math.min(2.5, s));
                this.interactiveGroup.scale.setScalar(clamped);
            }
            this.targetX += (this.mouseX - this.targetX) * 0.05;
            this.targetY += (this.mouseY - this.targetY) * 0.05;
            // Limit rotation angles
            this.interactiveGroup.rotation.y = this.targetX * 0.5; // Max 0.5 rad
            this.interactiveGroup.rotation.x = -this.targetY * 0.5;
        }

        this.renderer.render(this.scene, this.camera);
    }

    onResize(size) {
        if (!this.camera || !this.renderer) return;
        const width = Math.max(1, Math.floor(size?.width || 800));
        const height = Math.max(1, Math.floor(size?.height || 600));
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height, false);
    }

    onDestroy(ctx) {
        if (this.ctx && this.ctx.canvas && this.onPointerMove) {
            this.ctx.canvas.removeEventListener('pointermove', this.onPointerMove);
        }
        if (this.renderer) {
            this.renderer.dispose();
            this.renderer = null;
        }
        this.scene = null;
        this.camera = null;
    }

    setParam(key, value) {
        if (!this.params || !Object.prototype.hasOwnProperty.call(this.params, key)) return;
        if (key === 'color') {
            this.params.color = String(value || '').trim() || this.params.color;
            return;
        }
        const n = typeof value === 'number' ? value : parseFloat(String(value || ''));
        if (Number.isFinite(n)) this.params[key] = n;
    }

    getUIConfig() {
        return [
            // Lab UI expects { bind, name, type, value, min/max/step }.
            { bind: 'color', name: '颜色 / Color', type: 'color', value: this.params.color },
            { bind: 'intensity', name: '强度 / Intensity', type: 'range', min: 0.1, max: 3.0, step: 0.05, value: this.params.intensity },
            { bind: 'speed', name: '速度 / Speed', type: 'range', min: 0.1, max: 5.0, step: 0.05, value: this.params.speed },
            { bind: 'scale', name: '缩放 / Scale', type: 'range', min: 0.25, max: 2.5, step: 0.05, value: this.params.scale }
        ];
    }
}
`;
};
