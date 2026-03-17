import * as THREE from 'three';

export class GoldSpiritEffect {
    constructor(config = {}) {
        this.name = 'Gold Spirit';
        this.uniforms = {
            flowSpeed: { value: config.speed || 0.2 },
            colorStart: { value: new THREE.Color(config.colorStart || '#FFD700') },
            colorEnd: { value: new THREE.Color(config.colorEnd || '#AB0201') }
        };
    }

    getVertexShader() {
        return `
            uniform float time;
            uniform float size;
            uniform float disperse;
            uniform float flowSpeed;
            uniform vec3 colorStart;
            uniform vec3 colorEnd;
            
            // Manual Skinning Uniforms
            uniform mat4 bindMatrix;
            uniform mat4 bindMatrixInverse;
            uniform highp sampler2D boneTexture;
            uniform int boneTextureSize;
            uniform float hasSkinning;

            attribute vec3 targetPos;
            attribute vec4 skinIndex;
            attribute vec4 skinWeight;
            
            varying vec3 vColor;
            varying float vAlpha;

            // Simplex Noise
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

            mat4 getBoneMatrix( const in float i ) {
                float j = i * 4.0;
                float x = mod( j, float( boneTextureSize ) );
                float y = floor( j / float( boneTextureSize ) );
                float dx = 1.0 / float( boneTextureSize );
                float dy = 1.0 / float( boneTextureSize );
                y = dy * ( y + 0.5 );
                vec4 v1 = texture2D( boneTexture, vec2( dx * ( x + 0.5 ), y ) );
                vec4 v2 = texture2D( boneTexture, vec2( dx * ( x + 1.5 ), y ) );
                vec4 v3 = texture2D( boneTexture, vec2( dx * ( x + 2.5 ), y ) );
                vec4 v4 = texture2D( boneTexture, vec2( dx * ( x + 3.5 ), y ) );
                return mat4( v1, v2, v3, v4 );
            }

            void main() {
                vec3 pos = position;

                // Manual Skinning Logic
                if (hasSkinning > 0.5) {
                    mat4 boneMatX = getBoneMatrix( skinIndex.x );
                    mat4 boneMatY = getBoneMatrix( skinIndex.y );
                    mat4 boneMatZ = getBoneMatrix( skinIndex.z );
                    mat4 boneMatW = getBoneMatrix( skinIndex.w );
                    mat4 skinMatrix = mat4( 0.0 );
                    skinMatrix += skinWeight.x * boneMatX;
                    skinMatrix += skinWeight.y * boneMatY;
                    skinMatrix += skinWeight.z * boneMatZ;
                    skinMatrix += skinWeight.w * boneMatW;
                    skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
                    vec4 skinPos = skinMatrix * vec4( pos, 1.0 );
                    pos = skinPos.xyz;
                }

                // Effect Logic: Gold Spirit Flow
                float n = snoise(vec3(pos.x * 0.1, pos.y * 0.1, time * flowSpeed));
                vec3 noiseOffset = vec3(
                    snoise(vec3(pos.x, time * flowSpeed, pos.z)),
                    snoise(vec3(time * flowSpeed, pos.y, pos.z)),
                    snoise(vec3(pos.x, pos.y, time * flowSpeed))
                );
                
                if (disperse < 0.5) pos += noiseOffset * 1.5;

                float t = smoothstep(0.0, 1.0, disperse);
                vec3 explodeDir = normalize(pos) * sin(t * 3.14159) * 20.0;
                
                // Note: targetPos is likely in world space or model space, mixing might be tricky with skinning
                // For now, let's keep it simple: if morphing, we might lose skinning context
                // But for "running horse", disperse is 0, so skinning dominates.
                
                vec3 finalPos = mix(pos, targetPos, t);
                finalPos += explodeDir * 0.5; 
                
                float mixFactor = (pos.y + 10.0) / 20.0 + n * 0.2;
                vColor = mix(colorStart, colorEnd, clamp(mixFactor, 0.0, 1.0));
                vColor = mix(vColor, vec3(1.0, 0.9, 0.8), t * 0.8);

                vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);
                gl_Position = projectionMatrix * mvPosition;
                gl_PointSize = size * ( 300.0 / -mvPosition.z );
                vAlpha = 1.0;
            }
        `;
    }

    getFragmentShader() {
        return `
            varying vec3 vColor;
            varying float vAlpha;
            void main() {
                vec2 uv = gl_PointCoord - 0.5;
                float dist = length(uv);
                if (dist > 0.5) discard;
                float strength = 1.0 - (dist * 2.0);
                strength = pow(strength, 2.0);
                gl_FragColor = vec4(vColor, vAlpha * strength);
            }
        `;
    }
}
