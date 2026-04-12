export const EffectCatalog = {
    bloom: {
        description: '泛光后处理效果',
        tags: ['glow', 'light', 'bloom'],
        api: 'sketch.addBloom({ strength, radius, threshold })',
        params: {
            bloomStrength: { type: 'range', min: 0, max: 3, step: 0.1, default: 1.5, name: 'Bloom 强度' },
            bloomRadius: { type: 'range', min: 0, max: 1, step: 0.01, default: 0.4, name: 'Bloom 半径' },
            bloomThreshold: { type: 'range', min: 0, max: 1, step: 0.01, default: 0.0, name: 'Bloom 阈值' },
        }
    },
    glitch: {
        description: '故障风格后处理效果',
        tags: ['cyberpunk', 'distortion', 'glitch'],
        api: 'sketch.addGlitch({ intensity })',
        params: {
            glitchIntensity: { type: 'range', min: 0, max: 1, step: 0.05, default: 0.5, name: 'Glitch 强度' },
        }
    }
};
