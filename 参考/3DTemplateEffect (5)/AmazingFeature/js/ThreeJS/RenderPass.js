class RenderPass {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;

        // EffectComposer 兼容字段
        this.enabled = true;
        this.needsSwap = false; // 直接渲染到目标或屏幕
        this.clear = false;
        this.renderToScreen = false;
    }

    setSize(width, height) {
        // RenderPass 一般无需处理尺寸变化
    }

    render(renderer, writeBuffer, readBuffer, deltaTime, maskActive) {
        if (!this.enabled || !renderer || !this.scene || !this.camera) return;

        const target = (this.renderToScreen || !writeBuffer) ? null : writeBuffer;

        if (typeof renderer.setRenderTarget === 'function') {
            renderer.setRenderTarget(target);
        }
        if (this.clear && typeof renderer.clear === 'function') {
            renderer.clear();
        }
        renderer.render(this.scene, this.camera);
    }

    dispose() {}
}

exports.RenderPass = RenderPass;