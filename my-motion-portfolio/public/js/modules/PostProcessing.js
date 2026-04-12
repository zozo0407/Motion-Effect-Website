/**
 * PostProcessing.js
 * A plug-and-play module for adding post-processing effects to UnifiedRenderer.
 * Currently supports: Bloom (UnrealBloomPass)
 *
 * @deprecated Phase 2: 请使用 UnifiedRenderer 的 addBloom() / addGlitch() 等 API 替代。
 * 此文件将在 Phase 3 中移除。
 */

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

export function useBloom(sketch, options = {}) {
    const { scene, camera, renderer } = sketch;
    
    // Default options
    const config = {
        threshold: options.threshold || 0,
        strength: options.strength || 1.5,
        radius: options.radius || 0.4,
        exposure: options.exposure || 1.0
    };

    // 1. Setup Composer
    const composer = new EffectComposer(renderer);
    
    // 2. Add Render Pass (Base Scene)
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    // 3. Add Bloom Pass
    const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight), 
        config.strength, 
        config.radius, 
        config.threshold
    );
    composer.addPass(bloomPass);

    // 4. Handle Resize
    const originalResize = sketch.onResize;
    sketch.onResize = (w, h) => {
        if (originalResize) originalResize(w, h);
        composer.setSize(w, h);
    };

    // 5. Override Render Loop
    // We inject the composer into the sketch so the UnifiedRenderer uses it
    sketch.composer = composer;
    sketch.bloomPass = bloomPass; // Expose pass for parameter adjustment

    // 6. Return controls for UI binding
    return {
        composer,
        bloomPass,
        config
    };
}
