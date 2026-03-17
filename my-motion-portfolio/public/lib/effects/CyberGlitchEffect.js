import * as THREE from 'three';

export class CyberGlitchEffect {
    constructor(config = {}) {
        this.name = 'Cyber Glitch';
        this.uniforms = {
            flowSpeed: { value: config.speed || 0.5 },
            colorStart: { value: new THREE.Color('#00FFFF') }, // Cyan
            colorEnd: { value: new THREE.Color('#FF00FF') }    // Magenta
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

            // Reuse bone matrix logic
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

            // Glitch Noise
            float rand(vec2 co){
                return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
            }

            void main() {
                vec3 pos = position;
                
                // Skinning
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

                // Effect: Cyber Glitch
                // Random jitter based on Y position and Time
                float glitch = step(0.95, sin(time * 10.0 + pos.y * 0.5)); 
                pos.x += glitch * (rand(vec2(time, pos.y)) - 0.5) * 2.0;
                
                // Scanline Wave
                float wave = sin(pos.y * 0.5 - time * 5.0);
                if (wave > 0.9) {
                    pos *= 1.1; // Pulse out
                }

                // Morph
                float t = smoothstep(0.0, 1.0, disperse);
                // Digital disintegration (blocky movement)
                vec3 finalPos = mix(pos, targetPos, t);
                
                // Color Logic
                // Mix based on scanline
                vColor = mix(colorStart, colorEnd, abs(wave));
                if (glitch > 0.5) vColor = vec3(1.0); // Flash white

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
                // Square Pixels for Cyber look
                vec2 uv = gl_PointCoord - 0.5;
                if (abs(uv.x) > 0.4 || abs(uv.y) > 0.4) discard; 
                gl_FragColor = vec4(vColor, vAlpha);
            }
        `;
    }
}
