
import * as THREE from 'three';
import { GPUComputationRenderer } from 'three/addons/misc/GPUComputationRenderer.js';
import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';

// --- SHADERS ---
const SIMPLEX_NOISE = `
    // Simplex 3D Noise 
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
    float snoise(vec3 v) {
        const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
        const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
        vec3 i  = floor(v + dot(v, C.yyy) );
        vec3 x0 = v - i + dot(i, C.xxx) ;
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min( g.xyz, l.zxy );
        vec3 i2 = max( g.xyz, l.zxy );
        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;
        i = mod289(i);
        vec4 p = permute( permute( permute(
                    i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
                + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
        float n_ = 0.142857142857;
        vec3  ns = n_ * D.wyz - D.xzx;
        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_ );
        vec4 x = x_ *ns.x + ns.yyyy;
        vec4 y = y_ *ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
        vec4 b0 = vec4( x.xy, y.xy );
        vec4 b1 = vec4( x.zw, y.zw );
        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
        vec3 p0 = vec3(a0.xy,h.x);
        vec3 p1 = vec3(a0.zw,h.y);
        vec3 p2 = vec3(a1.xy,h.z);
        vec3 p3 = vec3(a1.zw,h.w);
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
        p0 *= norm.x;
        p1 *= norm.y;
        p2 *= norm.z;
        p3 *= norm.w;
        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                    dot(p2,x2), dot(p3,x3) ) );
    }
`;

const CURL_NOISE = `
    ${SIMPLEX_NOISE}
    vec3 snoiseVec3( vec3 x ){
        float s  =  snoise(vec3( x ));
        float s1 =  snoise(vec3( x.y - 19.1 , x.z + 33.4 , x.x + 47.2 ));
        float s2 =  snoise(vec3( x.z + 74.2 , x.x - 124.5 , x.y + 99.4 ));
        return vec3( s , s1 , s2 );
    }

    vec3 curlNoise( vec3 p ){
        const float e = 0.1;
        vec3 dx = vec3( e   , 0.0 , 0.0 );
        vec3 dy = vec3( 0.0 , e   , 0.0 );
        vec3 dz = vec3( 0.0 , 0.0 , e   );
        vec3 p_x0 = snoiseVec3( p - dx );
        vec3 p_x1 = snoiseVec3( p + dx );
        vec3 p_y0 = snoiseVec3( p - dy );
        vec3 p_y1 = snoiseVec3( p + dy );
        vec3 p_z0 = snoiseVec3( p - dz );
        vec3 p_z1 = snoiseVec3( p + dz );
        float x = p_y1.z - p_y0.z - p_z1.y + p_z0.y;
        float y = p_z1.x - p_z0.x - p_x1.z + p_x0.z;
        float z = p_x1.y - p_x0.y - p_y1.x + p_y0.x;
        const float divisor = 1.0 / ( 2.0 * e );
        return normalize( vec3( x , y , z ) * divisor );
    }
`;

const FRAGMENT_VELOCITY = `
    uniform float uTime;
    uniform float uDelta;
    uniform float uSpeed;
    uniform float uExplosion; 
    uniform float uNoiseScale; // TouchDesigner Style Low Freq
    uniform float uNoiseStrength; 
    uniform sampler2D textureDefaultPosition; 
    
    ${CURL_NOISE}

    void main() {
        vec2 uv = gl_FragCoord.xy / resolution.xy;
        vec3 pos = texture2D( texturePosition, uv ).xyz;
        vec3 vel = texture2D( textureVelocity, uv ).xyz;
        vec3 home = texture2D( textureDefaultPosition, uv ).xyz;

        // 1. Attraction to Home (Shape Retention)
        vec3 forceHome = (home - pos);
        
        // 2. Curl Noise (Chaos) - Low Frequency = Big Swirls
        vec3 forceNoise = curlNoise(pos * uNoiseScale + uTime * 0.1);
        
        // 3. Explosion Force (Outward)
        vec3 forceExplode = normalize(pos) * 10.0;

        // Dynamic Mixing
        // When Explosion is 0: Tight form
        // When Explosion is 1: Loose form + Huge Noise
        
        float homeStrength = mix(3.0, 0.05, uExplosion); // Weaken home force drastically
        float noiseStrength = mix(uNoiseStrength * 0.1, uNoiseStrength * 2.0, uExplosion); // Amp up noise
        
        vel += forceHome * homeStrength * uDelta;
        vel += forceNoise * noiseStrength * uDelta;
        
        if (uExplosion > 0.1) {
             // Add a gentle outward push to help break the shape
             vel += forceExplode * uExplosion * 2.0 * uDelta;
        }

        // Damping
        vel *= 0.94;

        gl_FragColor = vec4( vel, 1.0 );
    }
`;

const FRAGMENT_POSITION = `
    uniform float uTime;
    uniform float uDelta;
    
    void main() {
        vec2 uv = gl_FragCoord.xy / resolution.xy;
        vec3 pos = texture2D( texturePosition, uv ).xyz;
        vec3 vel = texture2D( textureVelocity, uv ).xyz;

        pos += vel * uDelta;

        gl_FragColor = vec4( pos, 1.0 );
    }
`;

const VS_PARTICLES = `
    uniform sampler2D texturePosition;
    uniform sampler2D textureVelocity;
    uniform float uPointSize;
    uniform vec3 uColor1;
    uniform vec3 uColor2;
    
    varying vec3 vColor;
    varying float vAlpha;

    void main() {
        vec4 posTemp = texture2D( texturePosition, uv );
        vec3 pos = posTemp.xyz;
        vec4 velTemp = texture2D( textureVelocity, uv );
        vec3 vel = velTemp.xyz;

        // Color Logic
        float speed = length(vel);
        
        // Mix based on speed
        vColor = mix(uColor1, uColor2, smoothstep(0.0, 4.0, speed));
        
        // Flash white on very high speed
        vec3 white = vec3(1.0);
        vColor = mix(vColor, white, smoothstep(8.0, 15.0, speed));

        vec4 mvPosition = modelViewMatrix * vec4( pos, 1.0 );
        gl_Position = projectionMatrix * mvPosition;

        // Distance attenuation
        gl_PointSize = max(1.0, uPointSize * 20.0 / -mvPosition.z);
        vAlpha = 1.0;
    }
`;

const FS_PARTICLES = `
    varying vec3 vColor;
    varying float vAlpha;

    void main() {
        vec2 coord = gl_PointCoord - vec2(0.5);
        float dist = length(coord);
        if(dist > 0.5) discard;

        // Soft edge
        float strength = 1.0 - dist * 2.0;
        strength = pow(strength, 2.0);

        gl_FragColor = vec4( vColor, vAlpha * strength );
    }
`;

export class GPGPUEmitter {
    constructor(renderer, options = {}) {
        this.renderer = renderer;
        this.count = options.count || 65536; // 256x256
        this.width = Math.ceil(Math.sqrt(this.count));
        this.count = this.width * this.width;
        
        this.gpuCompute = new GPUComputationRenderer(this.width, this.width, renderer);
        
        this.params = {
            speed: options.speed || 1.0,
            explosion: 0.0,
            noiseScale: 0.05, // Lower = Larger swirls (TouchDesigner style)
            noiseStrength: 5.0,
            pointSize: 2.0,
            color1: new THREE.Color(0x00ccff),
            color2: new THREE.Color(0xff0088)
        };
        
        this.init();
    }

    init() {
        this.dtPosition = this.gpuCompute.createTexture();
        this.dtVelocity = this.gpuCompute.createTexture();
        this.dtDefaultPosition = this.gpuCompute.createTexture();
        
        this._fillRandomTexture(this.dtPosition);
        this._fillRandomTexture(this.dtDefaultPosition);
        this._fillZeroTexture(this.dtVelocity);
        
        this.posVar = this.gpuCompute.addVariable("texturePosition", FRAGMENT_POSITION, this.dtPosition);
        this.velVar = this.gpuCompute.addVariable("textureVelocity", FRAGMENT_VELOCITY, this.dtVelocity);
        
        this.gpuCompute.setVariableDependencies(this.posVar, [this.posVar, this.velVar]);
        this.gpuCompute.setVariableDependencies(this.velVar, [this.posVar, this.velVar]);
        
        this.posVar.material.uniforms = {
            uTime: { value: 0 },
            uDelta: { value: 0 }
        };
        
        this.velVar.material.uniforms = {
            uTime: { value: 0 },
            uDelta: { value: 0 },
            uSpeed: { value: this.params.speed },
            uExplosion: { value: this.params.explosion },
            uNoiseScale: { value: this.params.noiseScale },
            uNoiseStrength: { value: this.params.noiseStrength },
            textureDefaultPosition: { value: this.dtDefaultPosition }
        };
        
        const error = this.gpuCompute.init();
        if (error !== null) {
            console.error(error);
        }
        
        this._createParticles();
    }
    
    sampleGeometry(mesh) {
        if (!mesh.geometry) return;
        
        console.log("Sampling mesh:", mesh);
        const sampler = new MeshSurfaceSampler(mesh).build();
        const posArray = this.dtPosition.image.data;
        const defaultPosArray = this.dtDefaultPosition.image.data;
        const velArray = this.dtVelocity.image.data;
        
        const tempPos = new THREE.Vector3();
        
        // Scale adjustment if needed (normalize to fit in view)
        mesh.geometry.computeBoundingBox();
        const bbox = mesh.geometry.boundingBox;
        const size = new THREE.Vector3();
        bbox.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 10.0 / maxDim; // Normalize to roughly size 10

        for (let k = 0, kl = posArray.length; k < kl; k += 4) {
            sampler.sample(tempPos);
            
            // Apply scale
            tempPos.multiplyScalar(scale);

            posArray[k + 0] = tempPos.x;
            posArray[k + 1] = tempPos.y;
            posArray[k + 2] = tempPos.z;
            posArray[k + 3] = 1.0;
            
            defaultPosArray[k + 0] = tempPos.x;
            defaultPosArray[k + 1] = tempPos.y;
            defaultPosArray[k + 2] = tempPos.z;
            defaultPosArray[k + 3] = 1.0;
            
            velArray[k + 0] = 0;
            velArray[k + 1] = 0;
            velArray[k + 2] = 0;
            velArray[k + 3] = 0;
        }
        
        this.dtDefaultPosition.needsUpdate = true;
        this.velVar.material.uniforms.textureDefaultPosition.value = this.dtDefaultPosition;
        
        this.gpuCompute.renderTexture(this.dtPosition, this.gpuCompute.getCurrentRenderTarget(this.posVar));
        this.gpuCompute.renderTexture(this.dtVelocity, this.gpuCompute.getCurrentRenderTarget(this.velVar));
    }

    _createParticles() {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(this.count * 3);
        const uvs = new Float32Array(this.count * 2);
        
        let p = 0;
        for (let j = 0; j < this.width; j++) {
            for (let i = 0; i < this.width; i++) {
                uvs[p++] = (i + 0.5) / this.width;
                uvs[p++] = (j + 0.5) / this.width;
            }
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
        
        const material = new THREE.ShaderMaterial({
            uniforms: {
                texturePosition: { value: null },
                textureVelocity: { value: null },
                uPointSize: { value: this.params.pointSize },
                uColor1: { value: this.params.color1 },
                uColor2: { value: this.params.color2 }
            },
            vertexShader: VS_PARTICLES,
            fragmentShader: FS_PARTICLES,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        
        this.particles = new THREE.Points(geometry, material);
        this.particles.frustumCulled = false;
    }
    
    update(time, delta) {
        if (!this.gpuCompute) return;
        
        // Update Velocity Uniforms
        const vu = this.velVar.material.uniforms;
        vu.uTime.value = time;
        vu.uDelta.value = delta;
        vu.uSpeed.value = this.params.speed;
        vu.uExplosion.value = this.params.explosion;
        vu.uNoiseScale.value = this.params.noiseScale;
        vu.uNoiseStrength.value = this.params.noiseStrength;
        
        // Update Position Uniforms
        const pu = this.posVar.material.uniforms;
        pu.uTime.value = time;
        pu.uDelta.value = delta;
        
        this.gpuCompute.compute();
        
        // Update Render Uniforms
        const mu = this.particles.material.uniforms;
        mu.texturePosition.value = this.gpuCompute.getCurrentRenderTarget(this.posVar).texture;
        mu.textureVelocity.value = this.gpuCompute.getCurrentRenderTarget(this.velVar).texture;
        mu.uPointSize.value = this.params.pointSize;
        mu.uColor1.value = this.params.color1;
        mu.uColor2.value = this.params.color2;
    }
    
    _fillRandomTexture(texture) {
        const data = texture.image.data;
        for (let k = 0, kl = data.length; k < kl; k += 4) {
            data[k + 0] = (Math.random() - 0.5) * 10;
            data[k + 1] = (Math.random() - 0.5) * 10;
            data[k + 2] = (Math.random() - 0.5) * 10;
            data[k + 3] = 1;
        }
    }
    
    _fillZeroTexture(texture) {
        const data = texture.image.data;
        for (let k = 0, kl = data.length; k < kl; k += 4) {
            data[k + 0] = 0;
            data[k + 1] = 0;
            data[k + 2] = 0;
            data[k + 3] = 0;
        }
    }
}
