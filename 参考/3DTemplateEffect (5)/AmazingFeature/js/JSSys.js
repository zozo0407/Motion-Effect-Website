const effect_api = "undefined" != typeof effect ? effect : "undefined" != typeof tt ? tt : "undefined" != typeof lynx ? lynx : {};
const Amaz = effect_api.getAmaz();

const { ScriptScene } = require('./ThreeJS/scriptScene');
const THREE = require('./ThreeJS/three-amg-wrapper').THREE;

class JSSys {
    constructor() {
        this.name = "JSSys";
        this.comps = {}
        this.compsdirty = true
    }

    onComponentAdded(comp) {
	    // console.log("running:JSSys:onComponentAdded");
    }
    onComponentRemoved(comp) {
	    // console.log("running:JSSys:onComponentRemoved");
    }

    onStart() {
	    console.log("running:JSSys:onStart");

        this.renderTexture = this.scene.assetMgr.SyncLoad('rt/outputTex.rt');

        // 添加光源到场景
        console.log('JSSys: 创建ScriptScene实例');
        this.scriptScene = new ScriptScene(this.scene);

        this.input = Amaz.AmazingManager.getSingleton("Input");
        const builtinObject = Amaz.AmazingManager.getSingleton("BuiltinObject");

        if (builtinObject.getUserTexture("#TransitionInput0") && builtinObject.getUserTexture("#TransitionInput1")) {
            this.scriptScene.texture1 = new THREE.Texture();
            this.scriptScene.texture1.setImage(builtinObject.getUserTexture("#TransitionInput0"));
            this.scriptScene.texture2 = new THREE.Texture();
            this.scriptScene.texture2.setImage(builtinObject.getUserTexture("#TransitionInput1"));
            console.log("JSSys: 获取到纹理");
        } 
        else 
        {
            this.scriptScene.texture1 = new THREE.Texture();
            this.scriptScene.texture1.setImage(this.scene.assetMgr.SyncLoad('image/Sample1.jpg'));
            this.scriptScene.texture2 = new THREE.Texture();
            this.scriptScene.texture2.setImage(this.scene.assetMgr.SyncLoad('image/Sample2.jpg'));
            console.log("JSSys: 未获取到纹理,使用默认纹理");
        }

        this.scriptScene.setupScene();
        // 初始化后处理效果
        this.scriptScene.initPostProcessing();
    }

    onUpdate(deltaTime) {
        this.time = this.input.getFrameTimestamp();
        this.time = this.time % 2;
        this.time = this.time / 2.0;
        this.scriptScene.seekToTime(this.time * this.scriptScene.Duration);
        // this.scriptScene.updateScene();
    }
    onLateUpdate(deltaTime) {
	    // console.log("running:JSSys:onLateUpdate");
        this.scriptScene.scene.seekToTime(this.time * this.scriptScene.Duration);
    }

    onEvent(event) {
	    console.log("running:JSSys:onEvent");
        if (event.type == Amaz.EventType.VIEWER) {
            // console.log("JSSys: 窗口大小改变");
            console.log("renderTexture.width",this.renderTexture.width);
            console.log("renderTexture.height",this.renderTexture.height);
            
            window.innerWidth = this.renderTexture.width;
            window.innerHeight = this.renderTexture.height;
            // console.log("JSSys: 窗口大小改变");
            this.scriptScene.handleResize();
        }
    }

    onDestroy() {
        // console.log("running:JSSys:onDestroy");
        this.scriptScene.destroy();
    }
}

exports.JSSys = JSSys;

