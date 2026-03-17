const { ShaderPass } = require('./ShaderPass.js');

const getCurrentScene = require('./three-amg-wrapper.js').getCurrentScene;
const RenderPass = require('./RenderPass.js').RenderPass;
const effect_api = "undefined" != typeof effect ? effect : "undefined" != typeof tt ? tt : "undefined" != typeof lynx ? lynx : {};
const Amaz = effect_api.getAmaz ? effect_api.getAmaz() : null;

class EffectComposer {
    constructor(renderer) {
        this.renderer = renderer;
        this.passes = [];
        this.scene = getCurrentScene();
        this.rt_0 = this.scene._amgScene.assetMgr.SyncLoad('rt/RT_0.rt');

        this.finalCamera = this.scene._amgScene.findEntityBy("Camera").getComponent("Camera");
        this.finalPlaceHolder = this.scene._amgScene.findEntityBy("PlaceHolder");
    }

    addPass(pass) {
        if ( !(pass instanceof ShaderPass))
        {
            console.log("pass is not a ShaderPass", pass);
            return;
        }

        if (pass.cameraWarpEntity == null) {
            console.log("pass.cameraWarpEntity is null", pass.name);
            return;
        }

        this.passes.push(pass);
        this.scene.add(pass);

        let length = this.passes.length;
        if (length > 5) {
            return;
        }

        let rt_i_index_1 = 0;
        let rt_i_index = 1;

        if (length > 1) 
        {
            rt_i_index_1 = ((length-2) % 10) + 1;
            rt_i_index = ((length-1) % 10) + 1;
        }

        this.rt_i_1 = this.scene._amgScene.assetMgr.SyncLoad('rt/RT_' + rt_i_index_1 + '.rt');
        this.rt_i = this.scene._amgScene.assetMgr.SyncLoad('rt/RT_' + rt_i_index + '.rt');

        // set render input texture.
        pass._amgMaterialObject.setTex('tDiffuse', this.rt_i_1);

        // set render output texture 、order and layerVisibleMask.
        // console.log("pass.cameraWarpEntity", pass.name, pass.cameraWarpEntity);
        pass.cameraWarpEntity.getComponent("Camera").renderTexture = this.rt_i;
        pass.cameraWarpEntity.getComponent("Camera").renderOrder = length;
        pass.cameraWarpEntity.getComponent("Camera").layerVisibleMask = new Amaz.DynamicBitset(length+1, Math.pow(2,length));

        pass.passWarpEntity.layer = length;
        

        // set final camera and placeHolder.
        this.finalCamera.inputTexture = this.rt_i;
        this.finalCamera.renderOrder = length+1;
        this.finalCamera.layerVisibleMask = new Amaz.DynamicBitset(length+2, Math.pow(2,length+1));
        this.finalPlaceHolder.layer = length+1;

    }

    setSize(width, height) {
        const w = Math.max(1, Math.floor(width));
        const h = Math.max(1, Math.floor(height));

        for (let i = 0; i < this.passes.length; i++) {
            const pass = this.passes[i];
            if (typeof pass.setSize === 'function') pass.setSize(w, h);
        }
    }

    dispose() {
        for (let i = 0; i < this.passes.length; i++) {
            const pass = this.passes[i];
            if (typeof pass.dispose === 'function') pass.dispose();
        }
        this.passes.length = 0;
    }

    render(deltaTime) {
        // todo
        for (let i = 0; i < this.passes.length; i++) {
            const pass = this.passes[i];
            if (typeof pass.render === 'function') 
            {
                let readbuffer = {};
                readbuffer.width = this.rt_i_1.width;
                readbuffer.height = this.rt_i_1.height;
                readbuffer.texture = this.rt_i_1;

                let writebuffer = {};
                writebuffer.width = this.rt_i.width;
                writebuffer.height = this.rt_i.height;
                writebuffer.texture = this.rt_i;

                pass.render(this.renderer, writebuffer, readbuffer, 0, true);
            }
        }
    }
}

exports.EffectComposer = EffectComposer;        