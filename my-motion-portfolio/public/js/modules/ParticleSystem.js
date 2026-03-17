/**
 * ParticleSystem.js
 * A standard module for creating high-performance particle effects.
 * Features:
 * - Shape Morphing (Spiral, Sphere, Cube, etc.)
 * - Weighted Color Palettes (7:2:1 Rule)
 * - Custom Textures
 */

import * as THREE from 'three';

export class ParticleSystem {
    constructor(sketch, options = {}) {
        this.sketch = sketch;
        this.count = options.count || 5000;
        this.size = options.size || 0.1;
        this.texture = options.texture || null;
        
        // Internal state
        this.particles = null;
        this.geometry = null;
        this.material = null;
        
        // Morphing state
        this.currentPositions = new Float32Array(this.count * 3);
        this.targetPositions = new Float32Array(this.count * 3);
        this.morphProgress = 1.0; // 0..1
        this.morphSpeed = 2.0;
        
        // Palettes
        this.palettes = {
            'default': [{ c: '#ffffff', w: 1.0 }],
            'christmas': [
                { c: '#0f5132', w: 0.7 }, // Green (Main)
                { c: '#b22222', w: 0.2 }, // Red (Sub)
                { c: '#ffd700', w: 0.1 }  // Gold (Accent)
            ],
            'cyberpunk': [
                { c: '#0f0c29', w: 0.6 }, // Dark Blue (Main)
                { c: '#ff00ff', w: 0.3 }, // Neon Pink (Sub)
                { c: '#00ffff', w: 0.1 }  // Cyan (Accent)
            ],
            'sunset': [
                { c: '#2b1055', w: 0.5 }, // Purple
                { c: '#7597de', w: 0.3 }, // Blue
                { c: '#ff66b2', w: 0.2 }  // Pink
            ]
        };

        this._init();
    }

    _init() {
        // Geometry
        this.geometry = new THREE.BufferGeometry();
        
        // Attributes
        const positions = new Float32Array(this.count * 3);
        const colors = new Float32Array(this.count * 3);
        const sizes = new Float32Array(this.count);
        
        // Initialize with Sphere shape
        this._calculateSphere(positions);
        this.currentPositions.set(positions);
        this.targetPositions.set(positions);

        // Initialize colors with default palette
        this._applyPaletteToBuffer('default', colors);
        
        // Initialize sizes
        for(let i=0; i<this.count; i++) {
            sizes[i] = this.size * (0.8 + Math.random() * 0.4); // Variation
        }

        this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        this.geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        // Material
        this.material = new THREE.PointsMaterial({
            size: this.size,
            vertexColors: true,
            map: this.texture,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        // Mesh
        this.particles = new THREE.Points(this.geometry, this.material);
        this.sketch.scene.add(this.particles);

        // Hook into update loop
        const originalUpdate = this.sketch.updateCallback;
        this.sketch.updateCallback = (ctx, sketch) => {
            if (originalUpdate) originalUpdate(ctx, sketch);
            this.update(ctx.deltaTime, ctx.time);
        };
    }

    update(deltaTime, time) {
        // Handle Morphing
        if (this.morphProgress < 1.0) {
            this.morphProgress += deltaTime * this.morphSpeed;
            if (this.morphProgress > 1.0) this.morphProgress = 1.0;

            const positions = this.geometry.attributes.position.array;
            
            // Simple Linear Interpolation
            // Optimized loop
            for (let i = 0; i < this.count * 3; i++) {
                // Ease out cubic
                const t = 1 - Math.pow(1 - this.morphProgress, 3);
                positions[i] = this.currentPositions[i] + (this.targetPositions[i] - this.currentPositions[i]) * t;
            }
            
            this.geometry.attributes.position.needsUpdate = true;
        }

        // Add subtle noise movement
        this.particles.rotation.y = time * 0.05;
    }

    // --- Public API ---

    setShape(type, params = {}) {
        // Store current as start
        this.currentPositions.set(this.geometry.attributes.position.array);
        this.morphProgress = 0.0;

        // Calculate target
        if (type === 'sphere') this._calculateSphere(this.targetPositions, params);
        else if (type === 'spiral') this._calculateSpiral(this.targetPositions, params);
        else if (type === 'cube') this._calculateCube(this.targetPositions, params);
    }

    setPalette(nameOrArray) {
        let palette = [];
        if (typeof nameOrArray === 'string') {
            palette = this.palettes[nameOrArray.toLowerCase()] || this.palettes['default'];
        } else if (Array.isArray(nameOrArray)) {
            // Assume simple array is equal weight
            palette = nameOrArray.map(c => ({ c, w: 1.0 / nameOrArray.length }));
        }

        const colors = this.geometry.attributes.color.array;
        this._applyPaletteToBuffer(palette, colors);
        this.geometry.attributes.color.needsUpdate = true;
    }

    // --- Math Helpers ---

    _applyPaletteToBuffer(paletteNameOrArray, buffer) {
        let palette = paletteNameOrArray;
        if (typeof palette === 'string') {
            palette = this.palettes[palette] || this.palettes['default'];
        }

        // Weighted Random Selection
        // Pre-calculate cumulative weights
        let totalWeight = 0;
        const cumulative = [];
        for (let p of palette) {
            totalWeight += p.w;
            cumulative.push(totalWeight);
        }

        const colorObj = new THREE.Color();

        for (let i = 0; i < this.count; i++) {
            const r = Math.random() * totalWeight;
            let selectedHex = palette[palette.length - 1].c; // Default to last
            
            for (let j = 0; j < cumulative.length; j++) {
                if (r < cumulative[j]) {
                    selectedHex = palette[j].c;
                    break;
                }
            }

            colorObj.set(selectedHex);
            buffer[i * 3] = colorObj.r;
            buffer[i * 3 + 1] = colorObj.g;
            buffer[i * 3 + 2] = colorObj.b;
        }
    }

    _calculateSphere(buffer, params = {}) {
        const radius = params.radius || 5;
        for (let i = 0; i < this.count; i++) {
            const phi = Math.acos(-1 + (2 * i) / this.count);
            const theta = Math.sqrt(this.count * Math.PI) * phi;
            
            buffer[i * 3] = radius * Math.cos(theta) * Math.sin(phi);
            buffer[i * 3 + 1] = radius * Math.sin(theta) * Math.sin(phi);
            buffer[i * 3 + 2] = radius * Math.cos(phi);
        }
    }

    _calculateSpiral(buffer, params = {}) {
        const radius = params.radius || 3;
        const height = params.height || 10;
        const turns = params.turns || 5;
        
        for (let i = 0; i < this.count; i++) {
            const t = i / this.count; // 0..1
            const angle = t * Math.PI * 2 * turns;
            
            // Cone shape: radius decreases as we go up
            const r = radius * (1 - t);
            
            buffer[i * 3] = Math.cos(angle) * r;     // x
            buffer[i * 3 + 1] = (t - 0.5) * height;  // y
            buffer[i * 3 + 2] = Math.sin(angle) * r; // z
        }
    }

    _calculateCube(buffer, params = {}) {
        const size = params.size || 6;
        const half = size / 2;
        for (let i = 0; i < this.count; i++) {
            buffer[i * 3] = (Math.random() - 0.5) * size;
            buffer[i * 3 + 1] = (Math.random() - 0.5) * size;
            buffer[i * 3 + 2] = (Math.random() - 0.5) * size;
        }
    }

    _calculateExplosion(buffer, params = {}) {
        const range = params.range || 30; // Wide scattering
        for (let i = 0; i < this.count; i++) {
            // Random distribution in a large volume
            buffer[i * 3] = (Math.random() - 0.5) * range;
            buffer[i * 3 + 1] = (Math.random() - 0.5) * range;
            buffer[i * 3 + 2] = (Math.random() - 0.5) * range;
        }
    }
}
