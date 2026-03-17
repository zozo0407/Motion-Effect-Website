// 获取AMG引擎API
const effect_api = "undefined" != typeof effect ? effect : "undefined" != typeof tt ? tt : "undefined" != typeof lynx ? lynx : {};
const Amaz = effect_api.getAmaz ? effect_api.getAmaz() : null;

const THREE = require('./three-amg-wrapper.js').THREE;
const getCurrentScene = require('./three-amg-wrapper.js').getCurrentScene;

class ShaderPass {
    constructor(parameters = {}) {

        this.progress = 0.0;
        // super();
        console.log('getCurrentScene():');
        this.scene = getCurrentScene();
        console.log('getCurrentScene():', this.scene);

        // 创建postProcessPrefab
        this.postProcessPrefab = this.scene._amgScene.assetMgr.SyncLoad('prefabs/postProcess.prefab');
        this._amgEntity = new Amaz.Entity();
        this._amgEntity.name = parameters.name;
        this._amgEntity.scene = this.scene._amgScene;
        this._transform = this._amgEntity.addComponent("Transform");

        console.log('this._amgEntity.name', this._amgEntity.name);

        console.log("postProcessPrefab", this.postProcessPrefab.name);

        this.postProcessPrefab.instantiateToEntity(this.scene._amgScene, this._amgEntity);

        this.passWarpEntity = this._amgEntity.searchEntity("PassWarp");
        this.cameraWarpEntity = this._amgEntity.searchEntity("CameraWarp");


        // 创建材质
        this._amgMaterialObject = this.scene._amgScene.assetMgr.SyncLoad('material/Unlit/pp.material').instantiate();
        
        // 存储原始uniforms
        this._originalUniforms = parameters.uniforms || {};
        
        // 创建带有自动同步功能的uniforms代理
        this._uniforms = this._createUniformsProxy(this._originalUniforms);
        this.material = {};
        this.material.uniforms = this._uniforms;
        
        // 初始化uniforms到AMG引擎
        if (parameters.uniforms) {
          for (const [key, value] of Object.entries(parameters.uniforms)) {
            this._syncUniformToAMG(key, value);
          }
        }
    
        let key = "";
        if (parameters.vertexShader && parameters.fragmentShader) {
          let vertLength = parameters.vertexShader.length;
          let fragLength = parameters.fragmentShader.length;
          if (vertLength > 0 && fragLength > 0) {
            key = "c_"+vertLength+"_"+fragLength;
          }
        }
    
        let xshader = this._amgMaterialObject.xshader.clone();
        let passes = xshader.passes;
        let pass = passes.get(0);
        let shaders = pass.shaders;
        let gles2 = shaders.get("gles2");
        let glesShader1 = gles2.get(0);
        let glesShader2 = gles2.get(1);
    
    
        if (parameters.vertexShader) {
          parameters.vertexShader = parameters.vertexShader.replace(/ uv/g," attTexcoord0");
          parameters.vertexShader = parameters.vertexShader.replace(/vec4\(position/g," vec4(attPosition");
          parameters.vertexShader = parameters.vertexShader.replace(/position/g," attPosition");
          parameters.vertexShader = parameters.vertexShader.replace(/modelViewMatrix/g,"u_MV");
          parameters.vertexShader = parameters.vertexShader.replace(/projectionMatrix/g,"u_Projection");
          parameters.vertexShader = parameters.vertexShader.replace(/modelViewProjectionMatrix/g,"u_MVP");
          parameters.vertexShader = parameters.vertexShader.replace(/u_Projection \* u_MV/g,"u_MVP");
          parameters.vertexShader = "precision highp float; attribute vec3 attPosition; attribute vec2 attTexcoord0; uniform mat4 u_MVP; uniform mat4 u_MV; uniform mat4 u_Projection;" +  parameters.vertexShader;
          glesShader1.source = parameters.vertexShader;
          glesShader1.sourcePath = "";
        }
        if (parameters.fragmentShader) {
          parameters.fragmentShader = "precision highp float;" + parameters.fragmentShader;
          glesShader2.source = parameters.fragmentShader;
          glesShader2.sourcePath = "";
        }
    
        // if (key != "") {
        //   let metal = shaders.get("metal");
        //   let metalShader1 = metal.get(0);
        //   let metalShader2 = metal.get(1);
    
        //   metalShader1.source = "";
        //   metalShader1.sourcePath = "xshader/"+key+".vert.metal";
    
        //   metalShader2.source = "";
        //   metalShader2.sourcePath = "xshader/"+key+".frag.metal";
    
        // }
    
        this._amgMaterialObject.xshader = xshader;

        this._amgEntity.searchEntity("PassWarp").getComponent("MeshRenderer").sharedMaterial = this._amgMaterialObject;
      }
      
      /**
       * 获取对数组/TypedArray 的代理，使索引赋值与变异方法可触发同步
       */
      _getArrayProxy(arrayTarget, onChange) {
        if (!this._arrayProxyMap) {
          this._arrayProxyMap = new WeakMap();
        }
        if (this._arrayProxyMap.has(arrayTarget)) {
          return this._arrayProxyMap.get(arrayTarget);
        }
        const mutatingMethods = new Set(['push','pop','shift','unshift','splice','sort','reverse','fill','copyWithin','copy']);
        const proxy = new Proxy(arrayTarget, {
          get(target, prop, receiver) {
            const value = Reflect.get(target, prop, receiver);
            if (typeof value === 'function' && mutatingMethods.has(prop)) {
              return function() {
                const result = value.apply(target, arguments);
                try { onChange(); } catch (e) { /* noop */ }
                return result;
              };
            }
            return value;
          },
          set(target, prop, value, receiver) {
            const result = Reflect.set(target, prop, value, receiver);
            try { onChange(); } catch (e) { /* noop */ }
            return result;
          }
        });
        this._arrayProxyMap.set(arrayTarget, proxy);
        return proxy;
      }
    
      /**
       * 创建uniforms代理，支持自动同步到AMG引擎
       * @param {Object} originalUniforms - 原始uniforms对象
       * @returns {Proxy} 代理对象
       */
      _createUniformsProxy(originalUniforms) {
        const self = this;
        const uniformsProxy = {};
        
        // 为每个uniform创建一个带有value属性的对象
        for (const [key, uniform] of Object.entries(originalUniforms)) {
          // 如果初始值为数组/TypedArray，包一层代理，支持元素修改触发同步
          const isTypedArray = (typeof ArrayBuffer !== 'undefined' && ArrayBuffer.isView && ArrayBuffer.isView(uniform.value));
          if (Array.isArray(uniform.value) || isTypedArray) {
            const proxied = this._getArrayProxy(uniform.value, () => self._syncUniformToAMG(key, uniform));
            uniform.value = proxied;
          }
          uniformsProxy[key] = {
            get value() {
              return uniform.value;
            },
            set value(newValue) {
              // 若设置的是数组/TypedArray，则用代理包装，保证后续元素级修改也能同步
              const isTyped = (typeof ArrayBuffer !== 'undefined' && ArrayBuffer.isView && ArrayBuffer.isView(newValue));
              if (Array.isArray(newValue) || isTyped) {
                uniform.value = self._getArrayProxy(newValue, () => self._syncUniformToAMG(key, uniform));
              } else {
                uniform.value = newValue;
              }
              // 自动同步到AMG引擎
              self._syncUniformToAMG(key, uniform);
            }
          };
        }
        
        return uniformsProxy;
      }
    
      /**
       * 同步uniform值到AMG引擎
       * @param {string} key - uniform名称
       * @param {*} value - uniform值
       */
      _syncUniformToAMG(key, valueObject) {
        if (!this._amgMaterialObject) return;
        
        try {
          if (key == 'tDiffuse') {
            return;
          }
          let value = valueObject.value;
          let type = valueObject.type;
          if (value instanceof THREE.Texture) {
            this._amgMaterialObject.setTex(key, value._amgObject);
          } else if (value instanceof THREE.Vector2) {
            this._amgMaterialObject.setVec2(key, new effect.Amaz.Vector2f(value.x, value.y));
          } else if (value instanceof THREE.Vector3) {
            this._amgMaterialObject.setVec3(key, new effect.Amaz.Vector3f(value.x, value.y, value.z));
          } else if (value instanceof THREE.Vector4) {
            this._amgMaterialObject.setVec4(key, new effect.Amaz.Vector4f(value.x, value.y, value.z, value.w));
          } else if (typeof value === 'number') {
              if (type && type == 'i') {
                this._amgMaterialObject.setInt(key, value);
              } else {
                this._amgMaterialObject.setFloat(key, value);
              }
          } 
          else if (Array.isArray(value) || (typeof ArrayBuffer !== 'undefined' && ArrayBuffer.isView && ArrayBuffer.isView(value))) {
            console.log('value is Array : ', value);
            // 支持使用普通数组/TypedArray 设置向量或向量数组
            let arr = Array.isArray(value) ? value : Array.from(value);
            // 若为二维数组（如 [[x,y],[x,y]]），先拍平成一维
            if (Array.isArray(arr[0])) {
              arr = arr.flat();
            }
            {
              const t = type;
              console.log('type: ', t);
              const setVec2Array = (numbers) => {
                const vecs = new effect.Amaz.Vec2Vector();
                for (let i = 0; i < numbers.length; i++) {
                  vecs.pushBack(new effect.Amaz.Vector2f(numbers[i].x, numbers[i].y));
                }
                this._amgMaterialObject.setVec2Vector(key, vecs);
              };
              const setVec3Array = (numbers) => {
                const vecs = new effect.Amaz.Vec3Vector();
                for (let i = 0; i < numbers.length; i++) {
                  vecs.pushBack(new effect.Amaz.Vector3f(numbers[i].x, numbers[i].y, numbers[i].z));
                }
                this._amgMaterialObject.setVec3Vector(key, vecs);
              };
              const setVec4Array = (numbers) => {
                const vecs = new effect.Amaz.Vec4Vector();
                for (let i = 0; i < numbers.length; i++) {
                  vecs.pushBack(new effect.Amaz.Vector4f(numbers[i].x, numbers[i].y, numbers[i].z, numbers[i].w));
                }
                this._amgMaterialObject.setVec4Vector(key, vecs);
              };
              const setFloatArray = (numbers) => {
                const vecs = new effect.Amaz.FloatVector();
                for (let i = 0; i < numbers.length; i++) {
                  vecs.pushBack(numbers[i]);
                }
                console.log('vecs.size(): ', vecs.size());
                this._amgMaterialObject.setFloatVector(key, vecs);
              };

              if (t === 'vec2[]') {
                if (arr.length % 2 !== 0) {
                  console.warn(`Expected vec2[] for ${key}, got length ${arr.length}`);
                }
                setVec2Array(arr);
              } else if (t === 'vec3[]') {
                if (arr.length % 3 !== 0) {
                  console.warn(`Expected vec3[] for ${key}, got length ${arr.length}`);
                }
                setVec3Array(arr);
              } else if (t === 'vec4[]') {
                if (arr.length % 4 !== 0) {
                  console.warn(`Expected vec4[] for ${key}, got length ${arr.length}`);
                }
                setVec4Array(arr);
              } else if (t === 'float[]') {
                if (arr.length % 1 !== 0) {
                  console.warn(`Expected float[] for ${key}, got length ${arr.length}`);
                }
                setFloatArray(arr);
              }
            }
          }
          else {
            console.warn(`Unsupported uniform type for ${key}:`, value);
          }
        } catch (error) {
          console.error(`Failed to sync uniform ${key} to AMG:`, error);
        }
      }
    
      /**
       * 支持使用 this.uniforms 访问uniforms
       */
      get uniforms() {
        return this._uniforms;
      }

      render(renderer, writeBuffer, readBuffer, delta, maskActive)
      {
        return;
      }
}

exports.ShaderPass = ShaderPass;