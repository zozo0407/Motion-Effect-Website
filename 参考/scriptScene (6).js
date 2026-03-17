/**
 * 场景核心模块
 * 
 * 包含Three.js核心对象的创建和管理
 * 提供场景管理的核心功能：初始化、配置和更新
 */

// ThreeJS Env
// 导入TWEEN库
const TWEEN = require('../lib/tween');
// 导入Three.js库
const THREE = require('three');


// Effect Env
// 导入TWEEN库
// const TWEEN = require('./tween');
// 导入Three.js 的 wrapper库
// const THREE = require('./three-amg-wrapper').THREE;

/**
 * ScriptScene类 - 3D场景管理器
 * 负责创建和管理Three.js场景、相机、渲染器及场景对象
 */
class ScriptScene {
  /**
   * 构造函数，创建场景管理器
   * @param {effect.Amaz.Scene} [amgScene] - AMG场景对象，可选参数
   * @param {HTMLElement} [container] - 放置渲染器的DOM容器，可选参数
   */
  constructor(amgScene = null, container = null) {
    // 核心对象初始化
    if (amgScene) {
      this.scene = new THREE.Scene();
      this.scene._amgScene = amgScene;
    } else {
      this.scene = new THREE.Scene();
    }
    this.effect_type = "transition";
    this.camera = null;
    this.renderer = null;
    this.scene.background = new THREE.Color(0x333333);
    this.isAnimating = false;
    this.animationFrameId = null;
    this.sceneObjects = null;
    this.lastTime = 0; // 初始化 lastTime
    this.sceneElapsed = 0; // 帧累计时间（秒），用于按顺序掉落

    this.texture1 = null;
    this.texture2 = null;
    this.texture3 = null;
    this.texture4 = null;
    this.texture5 = null;
    this.texture6 = null;
    this.texture7 = null;
    this.texture8 = null;
    this.texture9 = null;

    // 后处理相关属性
    this.composer = null;
    this.renderPass = null;
    this.usePostProcessing = true; // 是否启用后处理效果

    // 初始化核心对象和基本场景
    this.initCoreObjects();
    if (container) {
      this.init(container);
    }
  }

  /**
   * 析构函数，清理场景并释放资源
   * 在不再需要场景时调用，确保正确释放内存和停止动画循环
   */
  destroy() {
    // 停止动画循环
    this.isAnimating = false;
    
    // 取消动画帧请求
    if (this.animationFrameId !== null && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    // 清理渲染器
    if (this.renderer) {
      this.renderer.setAnimationLoop(null);
      this.renderer.dispose();
      
      // 移除渲染器的DOM元素
      if (this.renderer.domElement && this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
    }
    
    // 清理场景中的对象
    if (this.scene) {
      this.scene.dispose();
    }
    
    // 移除窗口事件监听器
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.handleResize);
    }

    // 清理TWEEN动画
    if (this.sceneObjects && this.sceneObjects.tweens) {
      this.sceneObjects.tweens.forEach(tween => {
        if (tween && typeof tween.stop === 'function') {
          tween.stop();
        }
      });
      this.sceneObjects.tweens = [];
    }

    // 清理后处理效果
    if (this.composer) {
      this.composer.dispose();
      this.composer = null;
    }
    
    this.renderPass = null;

    // 清理引用
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.sceneObjects = null;
  }

  /**
   * 初始化Three.js核心对象
   * 包括场景、相机和渲染器
   */
  initCoreObjects() {
    window.innerWidth = 600;
    window.innerHeight = 600;
    window.devicePixelRatio = 1;
    // 创建透视相机
    this.camera = new THREE.PerspectiveCamera(
      53.1,                                 // 视场角
      window.innerWidth / window.innerHeight, // 纵横比
      0.1,                                // 近平面
      10000                                // 远平面
    );
    this.camera.position.z = 10;  // 设置默认相机位置
    this.scene.add(this.camera);

    // 创建渲染器，启用抗锯齿
    // 当amgScene为null时，创建渲染器
    if (this.scene._amgScene == null)
    {
      this.renderer = new THREE.WebGLRenderer({ antialias: true });
      this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    }
    if (this.renderer) 
    {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setPixelRatio(window.devicePixelRatio);
    }

    // 滑竿列表
    this.sliders = {};

    // 创建TWEEN实例
    this.TWEEN = TWEEN;

    // 时长 毫秒
    this.Duration = 2000;
  }

  /** 
   * 添加ShaderPass
   * @param {Array} shaderPassConfigs - ShaderPass配置数组
   * @return {void}
   */
  addShaderPass(shaderPassConfigs) {
    if (!Array.isArray(shaderPassConfigs)) {
      shaderPassConfigs = [shaderPassConfigs];
    }

    shaderPassConfigs.forEach(config => {
      const atomicName = config.name;
      const className = atomicName.startsWith('Lumi') ? atomicName.substring(4) : atomicName;
      const shaderPassModule = require('../pp/Lumi' + className + '/' + className + 'ShaderPass.js');
      const ShaderPassClass = shaderPassModule[className + 'ShaderPass'];
      const shaderPass = new ShaderPassClass();
      console.log('ShaderPass created:', shaderPass, className);
      // 统一单Pass和多Pass的添加逻辑
      this.composer.addPass(shaderPass);
      this.shaderPasses.push(shaderPass);
    });
  }

  /**
   * 设置后处理
   * @param {Array} shaderPassConfigs - ShaderPass配置数组
   * @return {void}
  */
  setupPostProcessing(shaderPassConfigs) {
    const { EffectComposer } = require('three/examples/jsm/postprocessing/EffectComposer.js');
    const { RenderPass } = require('three/examples/jsm/postprocessing/RenderPass.js');

    // 创建后处理渲染目标
    this.composer = new EffectComposer(this.renderer);
    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);
    this.shaderPasses = [];

    this.addShaderPass(shaderPassConfigs);
  }

//===begin_pp===
  /**
   * Initializes post-processing effects for cinematic bloom.
   */
  initPostProcessing() {
    const { EffectComposer } = require('three/examples/jsm/postprocessing/EffectComposer.js');
    const { RenderPass } = require('three/examples/jsm/postprocessing/RenderPass.js');
    const { UnrealBloomPass } = require('three/examples/jsm/postprocessing/UnrealBloomPass.js');

    if (!this.renderer || !this.camera || !this.scene) return;

    // Renderer tone mapping and shadows
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    // 输出色彩空间改为 sRGB，避免高亮“泛白”与整体偏灰
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.physicallyCorrectLights = true;

    // Composer and passes
    this.composer = new EffectComposer(this.renderer);
    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);

    const resolution = new THREE.Vector2(
      (typeof window !== 'undefined' ? window.innerWidth : 600),
      (typeof window !== 'undefined' ? window.innerHeight : 600)
    );
    // 降低泛光强度与阈值，避免金色过度泛白
    const bloom = new UnrealBloomPass(resolution, 1.0, 0.6, 0.85);
    this.composer.addPass(bloom);
  }
//===end_pp===

  /**
   * 初始化场景
   * 设置基本的Three.js环境，添加渲染器到DOM
   * @param {HTMLElement} container - 放置渲染器的DOM容器
   */
  init(container) {
    if (this.renderer) {
      if (container) {
        container.appendChild(this.renderer.domElement);
      } else if (typeof document !== 'undefined') {
        document.body.appendChild(this.renderer.domElement);
      }
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => this.handleResize());
    }
  }

  /**
   * 开始场景动画循环
   * @param {Function} updateCallback - 每帧调用的更新函数
   */
  start(updateCallback) {
    if (this.isAnimating) return;

    this.isAnimating = true;

    // 如果提供了更新回调，使用requestAnimationFrame
    if (updateCallback) {
      const animateFrame = () => {
        if (!this.isAnimating) return;
        updateCallback();
        this.animationFrameId = requestAnimationFrame(animateFrame);
      };

      animateFrame();
    } else {
      // 否则使用Three.js的setAnimationLoop，直接调用update渲染场景
      this.renderer.setAnimationLoop(() => {
        this.update();
      });
    }
  }



  /**
   * 更新场景（由外部动画循环调用）
   * @param {number} timestamp - 当前时间戳
   */
  updateScene(timestamp) {
    // 标记动画开始
    if (!this.isAnimating) {
      this.isAnimating = true;
    }
    
    // 直接调用默认更新函数，传入时间戳
    this.defaultUpdate(timestamp);
  }

  /**
   * 更新并渲染场景
   * 在每一帧调用，将当前场景通过渲染器绘制到屏幕
   */
  update() {
    // 更新 shader 时间 uniform（确保无论是否使用 defaultUpdate 都能动画）
    if (this.sceneObjects && this.sceneObjects.shaderPlane) {
      const uniforms = this.sceneObjects.shaderPlane.material.uniforms || {};
      if (uniforms.iTime) {
        const nowSec = (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;
        uniforms.iTime.value = nowSec;
      }
    }
    if (this.usePostProcessing && this.composer) {
      // 确保composer使用当前活动的相机
      if (this.renderPass) {
        this.renderPass.camera = this.camera;
      }
      
      // 使用后处理效果渲染
      this.composer.render();
    } else if (this.renderer) {
      // 直接渲染场景
      this.renderer.render(this.scene, this.camera);
    }
  }

  /**
   * 窗口大小调整处理
   * 在窗口大小变化时调整相机和渲染器
   */
  handleResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    if (this.renderer) {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    // 调整后处理效果的大小
    if (this.composer) {
      this.composer.setSize(window.innerWidth, window.innerHeight);
    }

    // 更新着色器分辨率 uniform
    if (this.sceneObjects && this.sceneObjects.shaderPlane) {
      const uniforms = this.sceneObjects.shaderPlane.material.uniforms || {};
      if (uniforms.iResolution) {
        uniforms.iResolution.value.set(window.innerWidth, window.innerHeight, window.devicePixelRatio || 1);
      }
    }

    // 如果不在动画循环中，触发一次渲染以更新视图
    if (!this.isAnimating) {
      this.update();
    }
  }

  loadTextures() {
    const textureLoader = new THREE.TextureLoader();
    return Promise.all([
      new Promise(resolve => {
        this.texture1 = textureLoader.load('image/Sample1.jpg', resolve);
        this.texture1.colorSpace = THREE.LinearSRGBColorSpace;
        this.texture1.wrapS = THREE.RepeatWrapping;
        this.texture1.wrapT = THREE.RepeatWrapping;
      }),
      new Promise(resolve => {
        this.texture2 = textureLoader.load('image/Sample2.jpg', resolve);
        this.texture2.colorSpace = THREE.LinearSRGBColorSpace;
        this.texture2.wrapS = THREE.RepeatWrapping;
        this.texture2.wrapT = THREE.RepeatWrapping;
      }),
      new Promise(resolve => {
        this.texture3 = textureLoader.load('image/Sample3.jpg', resolve);
        this.texture3.colorSpace = THREE.LinearSRGBColorSpace;
        this.texture3.wrapS = THREE.RepeatWrapping;
        this.texture3.wrapT = THREE.RepeatWrapping;
      }),
      new Promise(resolve => {
        this.texture4 = textureLoader.load('image/Sample4.jpg', resolve);
        this.texture4.colorSpace = THREE.LinearSRGBColorSpace;
        this.texture4.wrapS = THREE.RepeatWrapping;
        this.texture4.wrapT = THREE.RepeatWrapping;
      }),
      new Promise(resolve => {
        this.texture5 = textureLoader.load('image/Sample5.jpg', resolve);
        this.texture5.colorSpace = THREE.LinearSRGBColorSpace;
        this.texture5.wrapS = THREE.RepeatWrapping;
        this.texture5.wrapT = THREE.RepeatWrapping;
      }),
      new Promise(resolve => {
        this.texture6 = textureLoader.load('image/Sample6.jpg', resolve);
        this.texture6.colorSpace = THREE.LinearSRGBColorSpace;
        this.texture6.wrapS = THREE.RepeatWrapping;
        this.texture6.wrapT = THREE.RepeatWrapping;
      }),
      new Promise(resolve => {
        this.texture7 = textureLoader.load('image/Sample7.jpg', resolve);
        this.texture7.colorSpace = THREE.LinearSRGBColorSpace;
        this.texture7.wrapS = THREE.RepeatWrapping;
        this.texture7.wrapT = THREE.RepeatWrapping;
      }),
      new Promise(resolve => {
        this.texture8 = textureLoader.load('image/Sample8.jpg', resolve);
        this.texture8.colorSpace = THREE.LinearSRGBColorSpace;
        this.texture8.wrapS = THREE.RepeatWrapping;
        this.texture8.wrapT = THREE.RepeatWrapping;
      }),
      new Promise(resolve => {
        this.texture9 = textureLoader.load('image/Sample9.jpg', resolve);
        this.texture9.colorSpace = THREE.LinearSRGBColorSpace;
        this.texture9.wrapS = THREE.RepeatWrapping;
        this.texture9.wrapT = THREE.RepeatWrapping;
      })
    ]);
  }

  /**
   * 根据时间直接设置动画状态（用于时间跳转）
   * @param {number} time - 动画时间（毫秒）
   */
  seekToTime(time) {
    // 标记动画开始
    if (!this.isAnimating) {
      this.isAnimating = true;
    }
    
    // 限制时间范围
    const clampedTime = Math.max(0, Math.min(time, this.Duration));
  
    if (!this.sceneObjects.tweens || this.sceneObjects.tweens.length === 0) {
      return;
    }
    
    // 使用逆序遍历 TWEEN，确保正确的属性覆盖优先级
    // 逆序处理：让开始时间晚的tween先处理，开始时间早的tween后处理并覆盖

    let notStartTweens = [];
    let runningTweens = [];
    let finishedTweens = [];

    for (let i = 0; i <= this.sceneObjects.tweens.length - 1; i++) {
      const tween = this.sceneObjects.tweens[i];

      let TweenStartTime = tween._delayTime + 10;
      let TweenEndTime = tween._delayTime + tween._duration;

      // 将tween分为三种，未开始，进行中，已结束  
      // 分到3个列表中

      if (clampedTime <= TweenStartTime) {
        notStartTweens.push({time: TweenStartTime, tween: tween}); 
      }
      else if (clampedTime >= TweenEndTime) {
        finishedTweens.push({time: TweenEndTime, tween: tween});
      } 
      else 
      {
        runningTweens.push(tween);
      }
    }

    // 按照开始时间排序
    notStartTweens.sort((a, b) => b.time - a.time);
    // 按照结束时间排序
    finishedTweens.sort((a, b) => a.time - b.time);

    notStartTweens.forEach((item, index) => {
      let tween = item.tween;
      tween.start(0);
      tween.update(tween._delayTime + 2 + index * 0.04);
    });

    finishedTweens.forEach(item => {
      let tween = item.tween;
      tween.start(0);
      tween.update(tween._delayTime + tween._duration + 2);
    });

    runningTweens.forEach(tween => {
      tween.start(0);
      tween.update(clampedTime);
    });

    this.update();
  }

//===begin===
  //===滑竿begin===
// effects_adjust_intensity, 1, 0, 0.5
//===滑竿end===
/**
 * 初始化滑竿
 */
setupSliders(){
  this.sliders["effects_adjust_intensity"] = {
    max: 1,
    min: 0,
    value: 0.5
  };
}

/**
 * 更新滑竿
 */
updateSliders(){
  const sliderValue = this.sliders["effects_adjust_intensity"] ? this.sliders["effects_adjust_intensity"].value : 0.5;
  this.speedFactor = THREE.MathUtils.lerp(0.5, 1.5, sliderValue);
}

/**
 * 注册受速度滑竿影响的补间动画
 * @param {TWEEN.Tween} tween 
 */
registerTween(tween){
  const self = this;
  const originalUpdate = tween.update.bind(tween);
  tween.update = (time, preserve) => {
    const scaledTime = time * self.speedFactor;
    return originalUpdate(scaledTime, preserve);
  };
  tween.start(0);
  this.sceneObjects.tweens.push(tween);
  return tween;
}

/**
 * 初始化一个完整的基本场景（不包含动画循环）
 * 包括相机、场景对象的创建
 * @returns {Object} 场景中的对象引用
 */
setupScene() {
  this.initSceneObjects();

  // 奢华电影感：深暗祖母绿背景与柔雾
  this.scene.background = new THREE.Color(0x011c12);

  // 渲染器高级配置（与后期搭配）
  if (this.renderer) {
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.physicallyCorrectLights = true;
  }

  // 相机与轨道控制器
  const { OrbitControls } = require('three/examples/jsm/controls/OrbitControls.js');
  this.camera.position.set(0, 0, 25);//相机位置
  this.camera.lookAt(0, 0, 0);
  this.controls = new OrbitControls(this.camera, this.renderer ? this.renderer.domElement : undefined);
  this.controls.enableDamping = true;
  this.controls.dampingFactor = 0.06;
  this.controls.rotateSpeed = 0.85;
  this.controls.autoRotate = false;

  // 物理环境贴图（提升金属高光与整体质感）
  try {
    const { RoomEnvironment } = require('three/examples/jsm/environments/RoomEnvironment.js');
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment()).texture;
  } catch (e) {
    // 环境贴图非必需；若加载失败则忽略
  }

  // 光照系统：主光（金色）、冷青补光、白色轮廓光
  const ambient = new THREE.AmbientLight(0x0e3b2e, 0.35);
  this.scene.add(ambient);

  // 物理灯光下提高强度并将distance设为0（无限衰减范围）
  const spotMain = new THREE.SpotLight(0xD4AF37, 45.0, 0, Math.PI / 6, 0.25, 2.0);
  spotMain.position.set(12, 18, 12);
  spotMain.castShadow = true;
  spotMain.shadow.mapSize.set(1024, 1024);
  spotMain.target.position.set(0, 0, 0);
  this.scene.add(spotMain);
  this.scene.add(spotMain.target);

  const rim = new THREE.SpotLight(0xffffff, 20.0, 0, Math.PI / 7, 0.4, 2.0);
  rim.position.set(-14, 10, -14);
  rim.castShadow = true;
  rim.target.position.set(0, 0, 0);
  this.scene.add(rim);
  this.scene.add(rim.target);

  const tealPoint = new THREE.PointLight(0x0aa38a, 6.0, 0, 2.0);
  tealPoint.position.set(-6, 2, 10);
  this.scene.add(tealPoint);

  // 实例化粒子树效果
  this.createCustomEffect();
  // 初始化后期泛光
  this.initPostProcessing();
  this.setupAnimations();
  return this.sceneObjects;
}

/**
 * 初始化场景对象容器
 */
  initSceneObjects() {
    this.Duration = 3000; // 3秒完成分散
    const cfg = {
      needlesCount: 900,
      spheresCount: 160,
      trisCount: 120,
      radiusScatter: 30,
      treeHeight: 12,
      treeRadiusBase: 8,
      needleScaleBase: 0.22,
      sphereScaleBase: 0.3,
      triScaleBase: 0.1,
      blocksCount: 120,
      blockScaleBase: 0.3 * 2.5, // 相对于球体大小的2.5倍
      redRatio: 0.3 // 红球占金球的30%
    };
    this.sceneObjects = {
      cfg,
      tweens: [],
      progress: 0,
      needles: { scatter: [], tree: [], rot: [], scale: [] },
      spheres: { scatter: [], tree: [], rot: [], scale: [] },
      redSpheres: { scatter: [], tree: [], rot: [], scale: [] },
      tris: { scatter: [], tree: [], rot: [], scale: [] },
      blocksBrown: { scatter: [], tree: [], rot: [], scale: [] },
      blocksGreen: { scatter: [], tree: [], rot: [], scale: [] },
      blocksLightGreen: { scatter: [], tree: [], rot: [], scale: [] },
      smallStars: { scatter: [], tree: [], rot: [], scale: [] },
      photos: { meshes: [], scatter: [], tree: [], rot: [], scale: [] },
      needlesMesh: null,
      spheresMesh: null,
      redSpheresMesh: null,
      trisMesh: null,
      blocksBrownMesh: null,
      blocksGreenMesh: null,
      blocksLightGreenMesh: null,
      smallStarsMesh: null,
      photosMeshes: null,
      materials: {}
    };
  }

/**
 * 创建实例化粒子树（松针、金色球体与三角装饰）
 */
createCustomEffect() {
  const so = this.sceneObjects;
  const cfg = so.cfg;
  const smallStarCount = 10; // 约6个小星星

  // 创建内容分组，便于整体绕世界Y轴旋转（不包含光照与相机）
  const contentGroup = new THREE.Group();
  contentGroup.name = 'ContentGroup_Root';
  this.scene.add(contentGroup);
  so.contentGroup = contentGroup;
  // 整体上移 1 个单位，仅影响树体，不影响相机与灯光
  contentGroup.position.y = 1;

  // 材质
  const needlesMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#148f66'),
    emissive: new THREE.Color('#0c4c36'),
    metalness: 0.15,
    roughness: 0.75,
    emissiveIntensity: 0.6,
    transparent: true,
    opacity: 1
  });
  const spheresMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#D4AF37'),
    emissive: new THREE.Color('#FEDC56'),
    metalness: 1.0,
    roughness: 0.25,
    emissiveIntensity: 0.25,
    transparent: true,
    opacity: 1
  });
  const trisMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#D4AF37'),
    emissive: new THREE.Color('#FEDC56'),
    metalness: 1.0,
    roughness: 0.3,
    emissiveIntensity: 0.2,
    transparent: true,
    opacity: 1,
    side: THREE.DoubleSide
  });
  so.materials = { needlesMat, spheresMat, trisMat };

  // 方块材质（弱金属感）
  const brownMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#321d09ff'),
    metalness: 0.1,
    roughness: 0.85,
    transparent: true,
    opacity: 1
  });
  const greenBlockMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#0D3E27'),
    metalness: 0.1,
    roughness: 0.85,
    transparent: true,
    opacity: 1
  });
  // 浅绿色方块材质（参考现有结构与属性）
  const lightGreenBlockMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#65722A'),
    metalness: 0.1,
    roughness: 0.85,
    transparent: true,
    opacity: 1
  });
  // 红色球体材质（与方块相同的弱金属标准材质，不发光）
  const redMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#C0392B'),
    metalness: 0.1,
    roughness: 0.85,
    transparent: true,
    opacity: 1
  });
  // 设置到材料集合，便于统一淡出
  so.materials.redMat = redMat;

  // 几何
  const geomNeedle = new THREE.TetrahedronGeometry(1, 0);
  const geomSphere = new THREE.SphereGeometry(1, 16, 16);
  const geomTri = new THREE.BufferGeometry();
  {
    const triSize = 1;
    const h = Math.sqrt(3) / 2 * triSize;
    const verts = new Float32Array([
      -triSize / 2, -h / 3, 0,
       triSize / 2, -h / 3, 0,
       0,           (2 * h) / 3, 0
    ]);
    geomTri.setAttribute('position', new THREE.BufferAttribute(verts, 3));
    geomTri.computeVertexNormals();
  }

  // InstancedMesh
  const nCount = cfg.needlesCount, sCount = cfg.spheresCount, tCount = cfg.trisCount;
  const needlesMesh = new THREE.InstancedMesh(geomNeedle, needlesMat, nCount);
  const spheresMesh = new THREE.InstancedMesh(geomSphere, spheresMat, sCount);
  const redCount = Math.floor(sCount * cfg.redRatio);
  const redSpheresMesh = new THREE.InstancedMesh(geomSphere, redMat, redCount);
  const trisMesh = new THREE.InstancedMesh(geomTri, trisMat, tCount);
  const bCount = cfg.blocksCount;
  // 去掉棕色小立方体：全部分配为绿色
  const brownCount = 0;
  const greenCount = bCount;
  const blocksGreenMesh = new THREE.InstancedMesh(geomBlock, greenBlockMat, greenCount);
  // 额外添加的浅绿色方块：数量与当前立方体一致
  const lightGreenCount = bCount;
  const blocksLightGreenMesh = new THREE.InstancedMesh(geomBlock, lightGreenBlockMat, lightGreenCount);
  needlesMesh.castShadow = needlesMesh.receiveShadow = true;
  spheresMesh.castShadow = spheresMesh.receiveShadow = true;
  redSpheresMesh.castShadow = redSpheresMesh.receiveShadow = true;
  trisMesh.castShadow = trisMesh.receiveShadow = true;
  blocksGreenMesh.castShadow = blocksGreenMesh.receiveShadow = true;
  blocksLightGreenMesh.castShadow = blocksLightGreenMesh.receiveShadow = true;
  contentGroup.add(needlesMesh, spheresMesh, redSpheresMesh, trisMesh, blocksGreenMesh, blocksLightGreenMesh);
  so.needlesMesh = needlesMesh;
  so.spheresMesh = spheresMesh;
  so.redSpheresMesh = redSpheresMesh;
  so.trisMesh = trisMesh;
  so.blocksGreenMesh = blocksGreenMesh;
  so.blocksLightGreenMesh = blocksLightGreenMesh;

  // 预计算位置与属性
  const distScale = 0.9; // 分布点整体缩放比例（几何体大小不变）
  const randUnit = () => {
    const u = Math.random();
    const v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    const r = cfg.radiusScatter * distScale * Math.cbrt(Math.random());
    return new THREE.Vector3(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.cos(phi),
      r * Math.sin(phi) * Math.sin(theta)
    );
  };
  const treePos = () => {
    // 采用底部友好的高度采样，减少顶部密集、提升底部填充
    const t = Math.pow(Math.random(), 1.8); // 偏向底部（t越小）
    const y = (-8 + 16 * t) * 0.9 - 1; // 高度0.9倍并整体下移1
    // 略微减小顶部收缩强度（指数从0.95→0.85）并整体缩放分布半径
    const radius = cfg.treeRadiusBase * (1.0 - Math.pow(t, 0.95)) * distScale;
    const ang = Math.random() * Math.PI * 2;
    return new THREE.Vector3(radius * Math.cos(ang), y, radius * Math.sin(ang));
  };
  const randEuler = () => new THREE.Euler(
    Math.random() * Math.PI * 2,
    Math.random() * Math.PI * 2,
    Math.random() * Math.PI * 2
  );
  // 与当前方块不同的散布：更靠外层、XZ更分散
  const randUnitAlt = () => {
    const r = cfg.radiusScatter * distScale * (0.8 + Math.random() * 0.6);
    const theta = Math.random() * Math.PI * 2;
    const y = (Math.random() - 0.5) * cfg.radiusScatter * 0.6;
    return new THREE.Vector3(r * Math.cos(theta), y, r * Math.sin(theta));
  };

  for (let i = 0; i < nCount; i++) {
    so.needles.scatter.push(randUnit());
    so.needles.tree.push(treePos());
    so.needles.rot.push(randEuler());
    so.needles.scale.push(cfg.needleScaleBase * (0.6 + Math.random() * 0.8));
  }
  for (let i = 0; i < sCount; i++) {
    so.spheres.scatter.push(randUnit());
    so.spheres.tree.push(treePos());
    so.spheres.rot.push(randEuler());
    so.spheres.scale.push(cfg.sphereScaleBase * (0.7 + Math.random() * 0.6));
  }
  // 初始化金色小球闪烁脉冲数组（乘法系数，1→2→1，实例数量一致）
  so.spheres.pulseM = new Array(sCount).fill(1);
  // 防重入：同一索引同时只允许一次闪烁
  so.spheres.pulsing = new Array(sCount).fill(false);
  // 红色球体：分布随机与金球区分，作为外层点缀
  const randUnitOuter = () => {
    const v = randUnit();
    // 向外层偏置
    v.multiplyScalar(1.0 + Math.random() * 0.5);
    return v;
  };
  const treePosOuter = () => {
    const t = Math.pow(Math.random(), 1.8); // 同步底部偏向采样
    const y = (-8 + 16 * t) * 0.9 - 1; // 外层高度同样缩放并整体下移1
    // 外壳略微扩大，且减小顶部收缩强度，并整体缩放分布半径
    const radius = cfg.treeRadiusBase * (1.0 - Math.pow(t, 0.85)) * (1.0 + 0.08 * Math.random()) * distScale;
    const ang = Math.random() * Math.PI * 2;
    return new THREE.Vector3(radius * Math.cos(ang), y, radius * Math.sin(ang));
  };
  for (let i = 0; i < redCount; i++) {
    so.redSpheres.scatter.push(randUnitOuter());
    so.redSpheres.tree.push(treePosOuter());
    so.redSpheres.rot.push(randEuler());
    // 与金色小球一致的尺寸分布
    so.redSpheres.scale.push(cfg.sphereScaleBase * (0.7 + Math.random() * 0.6));
  }
  for (let i = 0; i < tCount; i++) {
    so.tris.scatter.push(randUnit());
    so.tris.tree.push(treePos());
    so.tris.rot.push(randEuler());
    so.tris.scale.push(cfg.triScaleBase * (0.7 + Math.random() * 0.6));
  }

  // 小星星散布/聚合属性
  const smallStarScale = (cfg.sphereScaleBase * 1.5 * 3.0) * 0.5; // 主星的0.3倍（小星星的大小）
  for (let i = 0; i < smallStarCount; i++) {
    const sPos = randUnit();
    sPos.multiplyScalar(1.0 + Math.random() * 0.4);
    so.smallStars.scatter.push(sPos);
    so.smallStars.tree.push(treePos());
    so.smallStars.rot.push(randEuler());
    so.smallStars.scale.push(smallStarScale);
  }

  // 方块：棕更少绿更多（总量不变）
  // 更均匀散布（最小距离约束）
  const sampleNoOverlap = (genCandidate, count, minDist) => {
    const out = [];
    const maxAttempts = 60;
    for (let i = 0; i < count; i++) {
      let p = genCandidate();
      let attempts = 0;
      while (attempts < maxAttempts) {
        let ok = true;
        for (let j = 0; j < out.length; j++) {
          if (out[j].distanceTo(p) < minDist) { ok = false; break; }
        }
        if (ok) break;
        p = genCandidate();
        attempts++;
      }
      out.push(p);
    }
    return out;
  };
  const minBlockDist = cfg.blockScaleBase * 1.5 * 0.9;
  const brownScatter = sampleNoOverlap(randUnit, brownCount, minBlockDist);
  const greenScatter = sampleNoOverlap(randUnit, greenCount, minBlockDist);
  for (let i = 0; i < brownCount; i++) {
    so.blocksBrown.scatter.push(brownScatter[i]);
    so.blocksBrown.tree.push(treePos());
    so.blocksBrown.rot.push(randEuler());
    // 大立方体缩小为当前的 0.6 倍
    so.blocksBrown.scale.push(cfg.blockScaleBase * 1.5 *0.6* (0.9 + Math.random() * 0.2));
  }
  for (let i = 0; i < greenCount; i++) {
    so.blocksGreen.scatter.push(greenScatter[i]);
    so.blocksGreen.tree.push(treePos());
    so.blocksGreen.rot.push(randEuler());
    // 大立方体缩小为当前的 0.6 倍
    // 绿色方块整体加大 1.2 倍
    so.blocksGreen.scale.push(cfg.blockScaleBase * 1.5  * 0.6 * (0.9 + Math.random() * 0.2));
  }
  // 浅绿色方块：与当前方块不同的散布，尺寸为当前方块的0.5倍
  const minBlockDistAlt = cfg.blockScaleBase * 1.5 * 0.7;
  const lightGreenScatter = sampleNoOverlap(randUnitAlt, lightGreenCount, minBlockDistAlt);
  for (let i = 0; i < lightGreenCount; i++) {
    so.blocksLightGreen.scatter.push(lightGreenScatter[i]);
    so.blocksLightGreen.tree.push(treePos());
    so.blocksLightGreen.rot.push(randEuler()); // 初始随机旋转角度
    // 浅绿色方块整体加大 1.2 倍
    so.blocksLightGreen.scale.push(cfg.blockScaleBase * 1.5 * 0.5 * 1.2 * (0.9 + Math.random() * 0.2));
  }

  // 初始矩阵
  this.updateInstancedMatrices(0);

  // 照片：9张，沿螺旋路径等距分布（带少量随机扰动），每张绕自身X轴旋转10度
  try {
    const loader = new THREE.TextureLoader();
    const tex1 = loader.load('/image/Sample1.jpg');
    const tex2 = loader.load('/image/Sample2.jpg');
    const tex3 = loader.load('/image/Sample3.jpg');
    [tex1, tex2, tex3].forEach(t => { if (t) { t.colorSpace = THREE.SRGBColorSpace; t.needsUpdate = true; } });
    const textures = [tex1, tex2, tex3];

    const photoSize = 2.5;
    const photoGeom = new THREE.PlaneGeometry(photoSize, photoSize);

    const smallJitter = 0.025; // 等距基础上的少量随机
    const turns = 3;
    const yMin = (-8) * 0.9 - 1; // 与树体一致的高度缩放与下移
    const yMax = (8) * 0.9 - 1;
    const total = 12;
    so.photos.meshes = [];
    for (let i = 0; i < total; i++) {
      // 更靠底部：对等距t进行底部偏向采样
      const tBase = (i + 0.5) / total;
      const tBias = Math.pow(tBase, 1.8);
      const t = Math.min(1, Math.max(0, tBias + (Math.random() * 2 - 1) * smallJitter));
      const y = yMin + (yMax - yMin) * t;
      // 更远离y轴：将半径整体外扩
      const radius = cfg.treeRadiusBase * (1.0 - Math.pow(t, 0.95)) * 0.9 * 1.25;
      const theta = turns * Math.PI * 2 * t;
      const pos = new THREE.Vector3(Math.cos(theta) * radius, y, Math.sin(theta) * radius);

      const mat = new THREE.MeshBasicMaterial({ map: textures[i % 3], transparent: true, side: THREE.DoubleSide });
      const mesh = new THREE.Mesh(photoGeom, mat);
      mesh.position.copy(pos);
      // 初始朝向：垂直于连接到世界Y轴的径向线（即切向朝向）
      const yaw = Math.atan2(pos.x, pos.z);
      mesh.rotation.y = yaw + Math.PI * 2; 
      mesh.name = `Photo_${i}`;
      contentGroup.add(mesh);

      // 爆炸随粒子移动：记录 scatter / tree / rot / scale
      so.photos.meshes.push(mesh);
      // 爆炸散布位置更外扩一些
      const sScatter = randUnit().multiplyScalar(1.2);
      so.photos.scatter.push(sScatter);
      so.photos.tree.push(pos.clone());
      // 记录初始旋转（用于保留姿态）：
      so.photos.rot.push(new THREE.Euler(mesh.rotation.x, mesh.rotation.y, mesh.rotation.z));
      so.photos.scale.push(1.0);
    }
    // 重新映射：底部槽位→Photo_2，顶部槽位→Photo_7，其余按原序填充中间槽位
    const sortedSlotIdx = [...Array(total).keys()].sort((a, b) => so.photos.tree[a].y - so.photos.tree[b].y);
    const bottomSlot = sortedSlotIdx[0];
    const topSlot = sortedSlotIdx[sortedSlotIdx.length - 1];
    const photoOrder = [...Array(total).keys()];
    const rest = photoOrder.filter(i => i !== 2 && i !== 7);
    const slotToPhoto = new Array(total).fill(0);
    slotToPhoto[bottomSlot] = 2;
    slotToPhoto[topSlot] = 7;
    let rp = 0;
    for (let k = 1; k < sortedSlotIdx.length - 1; k++) {
      slotToPhoto[sortedSlotIdx[k]] = rest[rp++];
    }
    const photoMap = {};
    for (let m of so.photos.meshes) {
      const idx = parseInt((m.name || '').split('_')[1] || '0', 10);
      photoMap[idx] = m;
    }
    const newMeshes = slotToPhoto.map(pi => photoMap[pi]);
    if (newMeshes.every(Boolean)) {
      so.photos.meshes = newMeshes;
      // 设置炸开后的两圈圆形散布（上圈y=+3、下圈y=-3，半径=5）
      const topCount = Math.ceil(total / 2);
      const bottomCount = total - topCount;
      const ringScatter = [];
      for (let r = 0; r < topCount; r++) {
        const ang = (r / topCount) * Math.PI * 2 + THREE.MathUtils.degToRad(30);
        ringScatter.push(new THREE.Vector3(Math.cos(ang) * 18, +3.5, Math.sin(ang) * 18));
      }
      for (let r = 0; r < bottomCount; r++) {
        const ang = (r / bottomCount) * Math.PI * 2;
        ringScatter.push(new THREE.Vector3(Math.cos(ang) * 18, -5, Math.sin(ang) * 18));
      }
      so.photos.scatter = ringScatter;
    }
  } catch (e) {
    // 贴图加载失败不影响主体
  }

  // 顶部自发光星星（1.5倍球体大小）
  const buildStarShape = (R = 1, r = 0.45, points = 5) => {
    const shape = new THREE.Shape();
    for (let i = 0; i < points * 2; i++) {
      const angle = (i * Math.PI) / points;
      const radius = (i % 2 === 0) ? R : r;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (i === 0) shape.moveTo(x, y); else shape.lineTo(x, y);
    }
    shape.closePath();
    return shape;
  };
  const starShape = buildStarShape(1, 0.45, 5);
  const extrudeSettings = { depth: 0.25, bevelEnabled: false };
  const starGeo = new THREE.ExtrudeGeometry(starShape, extrudeSettings);
  const starMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#FEDC56'),
    emissive: new THREE.Color('#FEDC56'),
    emissiveIntensity: 1.35,
    metalness: 0.2,
    roughness: 0.4,
    transparent: true,
    opacity: 1
  });
  const starMesh = new THREE.Mesh(starGeo, starMat);
  const starScale = cfg.sphereScaleBase * 1.5 * 3.0; // 现在的3倍
  starMesh.scale.set(starScale, starScale, starScale);
  starMesh.position.set(0, 7.6, 0); // 顶部略微下移 1
  // 保持正面朝向世界 Z+，不做初始旋转
  starMesh.rotation.set(0, 0, 0);
  starMesh.castShadow = false;
  starMesh.receiveShadow = false;
  contentGroup.add(starMesh);
  so.starMesh = starMesh;
  so.starMat = starMat;
  // 记录星星的基础位移与动画偏移
  so.starBaseY = starMesh.position.y;
  so.starExplodeOffset = 0;
  so.starFloatY = 0;

  // 小星星（约6个），散布在粒子中，尺寸为主星的0.3倍，发光为0.5倍
  const smallStarMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#FEDC56'),
    emissive: new THREE.Color('#FEDC56'),
    emissiveIntensity: starMat.emissiveIntensity * 0.8,
    metalness: 0.2,
    roughness: 0.4,
    transparent: true,
    opacity: 1
  });
  const smallStarsMesh = new THREE.InstancedMesh(starGeo, smallStarMat, smallStarCount);
  smallStarsMesh.castShadow = false;
  smallStarsMesh.receiveShadow = false;
  contentGroup.add(smallStarsMesh);
  so.smallStarsMesh = smallStarsMesh;

  // 螺旋粗管光：3圈，管径为金色小球半径的0.3倍，单色黄色、偏弱发光
  {
    const turns = 3;
    const segs = 288;
    const yMin = (-8) * 0.9 - 1;
    const yMax = (8) * 0.9 - 1;
    const pts = [];
    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const y = yMin + (yMax - yMin) * t;
      const radius = cfg.treeRadiusBase * (1.0 - Math.pow(t, 0.95)) * 0.9;
      const theta = turns * Math.PI * 2 * t;
      pts.push(new THREE.Vector3(Math.cos(theta) * radius, y, Math.sin(theta) * radius));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const tubeRadius = cfg.sphereScaleBase * 0.3; // 金色小球半径的0.3倍
    const tubeGeo = new THREE.TubeGeometry(curve, segs, tubeRadius, 16, false);
    const neonMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#FFD54F'),
      emissive: new THREE.Color('#FFD54F'),
      emissiveIntensity: 0.45, // 偏弱但更可见
      metalness: 0.25,
      roughness: 0.55
    });
    const neonMesh = new THREE.Mesh(tubeGeo, neonMat);
    neonMesh.name = 'NeonSpiral';
    contentGroup.add(neonMesh);
  }
}

/**
 * 根据 progress 更新全部实例矩阵
 */
  updateInstancedMatrices(progress) {
  const so = this.sceneObjects;
  const lerpPos = new THREE.Vector3();
  const m = new THREE.Matrix4();
  const applyGroup = (mesh, group, preserveRotation = false) => {
    const count = group.scatter.length;
    for (let i = 0; i < count; i++) {
      const sPos = group.scatter[i].clone();
      const phase = (i % 17) * 0.35 + (i % 7) * 0.12;
      const amp = 0.6;
      sPos.y += Math.sin(progress * Math.PI * 2 + phase) * amp * (1.0 - progress);
      lerpPos.lerpVectors(sPos, group.tree[i], progress);
      const pulseM = group.pulseM ? (group.pulseM[i] || 1) : 1;
      const scale = group.scale[i] * (1.0 + 0.15 * progress) * pulseM;
      const e = group.rot[i];
      const rot = preserveRotation
        ? new THREE.Euler(e.x, e.y, e.z) // 立方体保持随机旋转
        : new THREE.Euler(e.x * (1.0 - progress), e.y * (1.0 - progress), e.z * (1.0 - progress));
      m.compose(lerpPos, new THREE.Quaternion().setFromEuler(rot), new THREE.Vector3(scale, scale, scale));
      mesh.setMatrixAt(i, m);
    }
    mesh.instanceMatrix.needsUpdate = true;
  };
  // 非实例化照片更新
  const applyMeshes = (meshes, group, preserveRotation = true, ampY = 0.6, faceRadial = false) => {
    if (!meshes || !group) return;
    const count = group.scatter.length;
    for (let i = 0; i < count; i++) {
      const sPos = group.scatter[i].clone();
      const phase = (i % 17) * 0.35 + (i % 7) * 0.12;
      const amp = ampY;
      sPos.y += Math.sin(progress * Math.PI * 2 + phase) * amp * (1.0 - progress);
      lerpPos.lerpVectors(sPos, group.tree[i], progress);
      let scale;
      if (faceRadial) {
       
        scale = group.scale[i] * (2 - 1 * progress);
      } else {
        scale = group.scale[i] * (1.0 + 0.15 * progress);
      }
      const e = group.rot[i];
      const rot = preserveRotation
        ? new THREE.Euler(e.x, e.y, e.z)
        : new THREE.Euler(e.x * (1.0 - progress), e.y * (1.0 - progress), e.z * (1.0 - progress));
      const mesh = meshes[i];
      if (!mesh) continue;
      mesh.position.copy(lerpPos);
      if (faceRadial) {
        const yaw = Math.atan2(lerpPos.x, lerpPos.z);
        mesh.rotation.set(0, yaw, 0);
      } else {
        mesh.rotation.set(rot.x, rot.y, rot.z);
      }
      mesh.scale.set(scale, scale, scale);
    }
  };
  if (so.needlesMesh) applyGroup(so.needlesMesh, so.needles);
  if (so.spheresMesh) applyGroup(so.spheresMesh, so.spheres);
  if (so.redSpheresMesh) applyGroup(so.redSpheresMesh, so.redSpheres);
  if (so.trisMesh) applyGroup(so.trisMesh, so.tris, true);
  // 旋转收敛：块体不保留随机旋转
  if (so.blocksBrownMesh) applyGroup(so.blocksBrownMesh, so.blocksBrown, true);
  if (so.blocksGreenMesh) applyGroup(so.blocksGreenMesh, so.blocksGreen, true);
  if (so.blocksLightGreenMesh) applyGroup(so.blocksLightGreenMesh, so.blocksLightGreen, true);
  if (so.smallStarsMesh) applyGroup(so.smallStarsMesh, so.smallStars);
  if (so.photos && so.photos.meshes) applyMeshes(so.photos.meshes, so.photos, true, 0.0, true);
  }

/**
 * 创建圣诞树体素群
 */
createTreeVoxels() {
  const group = new THREE.Group();
  group.name = "ArixTreeVoxelsGroup";
  this.sceneObjects.treeGroup = group;
  this.scene.add(group);

  const nx = 7, ny = 7, nz = 7;
  const totalSize = 14;
  const halfSize = totalSize / 2;
  const voxelSize = totalSize / nx;
  const height = 14;
  const baseRadius = (totalSize * 0.9) / 2;

  const uniforms = {
    mapA: { value: this.texture1 },
    mapB: { value: this.texture2 },
    mixFactor: { value: 0 },
    pixelSize: { value: 0 },
    dissolveThreshold: { value: 0 },
    glintPos: { value: 0 },
    revealDirection: { value: new THREE.Vector2(0.0, 1.0) },
    revealProgress: { value: 1.0 },
    minY: { value: -height / 2 },
    treeHeight: { value: height }
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: `
      varying vec2 vUv;
      varying float vHeight;
      void main() {
        vUv = uv;
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vHeight = (worldPos.y - minY) / treeHeight;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      uniform sampler2D mapA;
      uniform sampler2D mapB;
      uniform float mixFactor;
      uniform float pixelSize;
      uniform float dissolveThreshold;
      uniform float glintPos;
      uniform vec2 revealDirection;
      uniform float revealProgress;

      varying vec2 vUv;
      varying float vHeight;

      vec2 quantizeUV(vec2 uv, float strength) {
        if (strength <= 0.0) return uv;
        float slices = max(strength, 1.0);
        vec2 scaled = uv * slices;
        vec2 floored = floor(scaled) + 0.5;
        return floored / slices;
      }

      void main() {
        vec2 uv = quantizeUV(vUv, pixelSize);
        vec4 colorA = texture2D(mapA, uv);
        vec4 colorB = texture2D(mapB, uv);
        vec4 baseColor = mix(colorA, colorB, clamp(mixFactor, 0.0, 1.0));

        float revealValue = dot(uv, normalize(revealDirection));
        float revealMask = smoothstep(revealProgress - 0.1, revealProgress + 0.02, revealValue);
        float dissolveMask = smoothstep(dissolveThreshold - 0.1, dissolveThreshold + 0.05, vHeight);
        float finalAlpha = baseColor.a * revealMask * dissolveMask;

        if (finalAlpha <= 0.01) discard;

        float glint = 1.0 - abs(vHeight - glintPos);
        glint = smoothstep(0.0, 0.3, glint);
        vec3 glowColor = vec3(0.95, 0.82, 0.39);
        vec3 finalRGB = baseColor.rgb + glowColor * glint * 0.35;

        gl_FragColor = vec4(finalRGB, finalAlpha);
      }
    `,
    transparent: true,
    side: THREE.DoubleSide,
    name: "ArixTreeVoxelMaterial"
  });

  this.sceneObjects.uniforms.treeMaterialUniforms = uniforms;

  const tmpVec = new THREE.Vector3();
  const tmpRad = new THREE.Vector3();
  const tmpScatter = new THREE.Vector3();

  const uStep = 1 / nx;
  const vStep = 1 / ny;

  const setFaceUV = (uvAttr, faceIndex, u0, v0, u1, v1) => {
    const order = [
      u0, v1,
      u1, v1,
      u1, v0,
      u0, v0
    ];
    const offset = faceIndex * 8;
    for (let i = 0; i < 8; i++) {
      uvAttr.array[offset + i] = order[i];
    }
  };

  for (let j = 0; j < ny; j++) {
    const levelRatio = j / (ny - 1);
    const treeRadius = baseRadius * (1 - levelRatio * 0.85) + 0.3;
    const y = -height / 2 + (j + 0.5) * voxelSize;

    for (let i = 0; i < nx; i++) {
      for (let k = 0; k < nz; k++) {
        const geometry = new THREE.BoxGeometry(voxelSize, voxelSize, voxelSize);
        const uvAttr = geometry.getAttribute("uv");
        const u0 = i * uStep;
        const u1 = u0 + uStep;
        const v1 = 1 - j * vStep;
        const v0 = v1 - vStep;

        for (let face = 0; face < 6; face++) {
          setFaceUV(uvAttr, face, u0, v0, u1, v1);
        }
        uvAttr.needsUpdate = true;

        const mesh = new THREE.Mesh(geometry, material);
        mesh.name = `ArixTreeVoxel_${i}_${j}_${k}`;

        const uNorm = (i / (nx - 1) - 0.5) * 2.0;
        const vNorm = (k / (nz - 1) - 0.5) * 2.0;

        const mappedX = treeRadius * uNorm * Math.sqrt(Math.max(0.0, 1.0 - 0.5 * vNorm * vNorm));
        const mappedZ = treeRadius * vNorm * Math.sqrt(Math.max(0.0, 1.0 - 0.5 * uNorm * uNorm));

        const treePosition = new THREE.Vector3(mappedX, y, mappedZ);

        const rand1 = Math.random();
        const rand2 = Math.random();
        const rand3 = Math.random();
        const scatterRadius = 18 * Math.cbrt(rand1);
        const theta = 2 * Math.PI * rand2;
        const phi = Math.acos(2 * rand3 - 1);
        const scatterPosition = new THREE.Vector3(
          scatterRadius * Math.sin(phi) * Math.cos(theta),
          scatterRadius * Math.cos(phi),
          scatterRadius * Math.sin(phi) * Math.sin(theta)
        );

        mesh.position.copy(treePosition);

        tmpScatter.copy(scatterPosition).sub(treePosition);
        const scatterNormal = tmpScatter.clone().normalize();
        if (!Number.isFinite(scatterNormal.x)) scatterNormal.set(0, 1, 0);

        const scatterRadiusXZ = Math.sqrt(scatterPosition.x * scatterPosition.x + scatterPosition.z * scatterPosition.z);
        const scatterAngle = Math.atan2(scatterPosition.z, scatterPosition.x);

        mesh.userData.treePosition = treePosition.clone();
        mesh.userData.scatterPosition = scatterPosition.clone();
        mesh.userData.scatterNormal = scatterNormal.clone();
        mesh.userData.levelIndex = j;
        mesh.userData.scatterRadius = scatterRadiusXZ;
        mesh.userData.scatterAngle = scatterAngle;

        group.add(mesh);
        this.sceneObjects.treeVoxels.push(mesh);
      }
    }
  }
}

/**
 * 创建三枚金色饰品
 */
createOrnaments() {
  const ornamentData = [
    { name: "GoldenOrnament1", size: 1.2, treePosition: new THREE.Vector3(-2.5, 1.8, 0.6), scatterPosition: new THREE.Vector3(-8.2, 4.4, 6.8), glowIntensity: 1.3 },
    { name: "GoldenOrnament2", size: 1.2, treePosition: new THREE.Vector3(2.1, -0.4, -1.0), scatterPosition: new THREE.Vector3(10.4, 3.2, -7.1), glowIntensity: 1.15 },
    { name: "GoldenOrnament3", size: 1.2, treePosition: new THREE.Vector3(0.0, 3.6, -2.2), scatterPosition: new THREE.Vector3(-5.6, 8.8, -10.2), glowIntensity: 1.25 }
  ];

  ornamentData.forEach((data, index) => {
    const geometry = new THREE.BoxGeometry(data.size, data.size, data.size);
    material.name = `${data.name}_Material`;

    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = data.name;
    mesh.position.copy(data.treePosition);

    mesh.userData.treePosition = data.treePosition.clone();
    mesh.userData.scatterPosition = data.scatterPosition.clone();
    mesh.userData.glowIntensity = data.glowIntensity;

    this.sceneObjects.treeGroup.add(mesh);
    this.sceneObjects.ornaments.push(mesh);
  });
}

/**
 * 创建祖母绿光晕
 */
createEmeraldAura() {
  // 已弃用：改为实例化粒子树，不再创建平面光晕
}

/**
 * 设置全部动画
 */
  setupAnimations() {
    const so = this.sceneObjects;
    // 时间线倒置：
    // 0–1s 保持完整树形（progress=1），1–2s 爆散为粒子（progress 1→0）
    so.progress = 1;
    this.updateInstancedMatrices(so.progress);
    const driver = { p: 1 };
    const tweenExplode = new this.TWEEN.Tween(driver)
      .to({ p: 0 }, 1000)
      .delay(800)
      .easing(this.TWEEN.Easing.Cubic.InOut)
      .onUpdate(() => {
        so.progress = driver.p;
        this.updateInstancedMatrices(so.progress);
      });
    tweenExplode.start(0);
    so.tweens.push(tweenExplode);

    // 照片沿Y轴上下浮动（不随整体旋转）
    if (so.photoMesh) {
      const floatDriver = { y: 0 };
      const floatTween = new this.TWEEN.Tween(floatDriver)
        .to({ y: 0.5 }, 800)
        .yoyo(true)
        .repeat(Infinity)
        .easing(this.TWEEN.Easing.Cubic.InOut)
        .onUpdate(() => {
          so.photoMesh.position.y = floatDriver.y;
        });
      floatTween.start(0);
      so.tweens.push(floatTween);
    }

    // 星星持续上下浮动（±0.5），与爆炸偏移相加
    if (so.starMesh) {
      const starFloatDriver = { y: 0 };
      const starFloatTween = new this.TWEEN.Tween(starFloatDriver)
        .to({ y: 0.5 }, 800)
        .yoyo(true)
        .repeat(Infinity)
        .easing(this.TWEEN.Easing.Cubic.InOut)
        .onUpdate(() => {
          so.starFloatY = starFloatDriver.y;
          so.starMesh.position.y = (so.starBaseY || 0) + (so.starExplodeOffset || 0) + (so.starFloatY || 0);
        });
      starFloatTween.start(0);
      so.tweens.push(starFloatTween);
    }

    // 爆散时相机沿Z轴远离中心（增大与原点距离）
    if (this.camera) {
      const camZStart = this.camera.position.z;
      const camDriver = { z: camZStart };
      const camTween = new this.TWEEN.Tween(camDriver)
        .to({ z: camZStart + 8 }, 1000)
        .delay(800)
        .easing(this.TWEEN.Easing.Cubic.InOut)
        .onUpdate(() => {
          this.camera.position.z = camDriver.z;
          this.camera.lookAt(0, 0, 0);
        });
      camTween.start(0);
      so.tweens.push(camTween);
    }

    // 金色小球闪烁已禁用

    // 爆散时星星沿Y轴下移 3（与浮动叠加）
    if (so.starMesh) {
      const yStart = so.starBaseY || so.starMesh.position.y;
      const starDriver = { y: 0 };
      const starTween = new this.TWEEN.Tween(starDriver)
        .to({ y: -3 }, 1000)
        .delay(800)
        .easing(this.TWEEN.Easing.Cubic.InOut)
        .onUpdate(() => {
          so.starExplodeOffset = starDriver.y;
          so.starMesh.position.y = (so.starBaseY || 0) + (so.starExplodeOffset || 0) + (so.starFloatY || 0);
        });
      starTween.start(0);
      so.tweens.push(starTween);
    }

    // 整体内容组绕世界Y轴顺时针旋转（60度/秒 = 360度/6秒）
    if (so.contentGroup) {
      const rotDriver = { angle: 0 };
      const rotTween = new this.TWEEN.Tween(rotDriver)
        .to({ angle: -Math.PI * 2 }, 6000) // 负值：顺时针
        .repeat(Infinity)
        .onUpdate(() => {
          so.contentGroup.rotation.y = rotDriver.angle;
          // 锁定星星朝向：抵消父级Y旋转，保持正面对着Z+
          if (so.starMesh) {
            so.starMesh.rotation.set(0, -rotDriver.angle, 0);
          }
        });
      rotTween.start(0);
      so.tweens.push(rotTween);
    }
  }

//===end===

  /**
   * 默认的场景更新函数
   */
  defaultUpdate(timestamp) {
    this.lastTime = timestamp;
    // 同步 iTime（适配使用 updateScene 的场景）
    if (this.sceneObjects && this.sceneObjects.shaderPlane) {
      const uniforms = this.sceneObjects.shaderPlane.material.uniforms || {};
      if (uniforms.iTime) {
        const tSec = (typeof timestamp === 'number' ? timestamp : (typeof performance !== 'undefined' ? performance.now() : Date.now())) / 1000;
        uniforms.iTime.value = tSec;
      }
    }
    // 轨道控制阻尼更新，避免旋转抖动
    if (this.controls && this.controls.enableDamping) this.controls.update();
    this.update();
  }

//===Predefined Function Begin===
//===Predefined Function End===
}

// 导入Three.js库
module.exports = ScriptScene;

// 导入Three.js 的 wrapper库
// exports.ScriptScene = ScriptScene;
  const geomBlock = new THREE.BoxGeometry(1, 1, 1);
