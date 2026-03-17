/**
 * 场景核心模块
 * 
 * 包含Three.js核心对象的创建和管理
 * 提供场景管理的核心功能：初始化、配置和更新
 */

// ThreeJS Env
// 导入TWEEN库
// const TWEEN = require('../lib/tween');
// 导入Three.js库
// const THREE = require('three');


// Effect Env
// 导入TWEEN库
const TWEEN = require('./tween');
// 导入Three.js 的 wrapper库
const THREE = require('./three-amg-wrapper').THREE;
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

    this.texture1 = null;
    this.texture2 = null;

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
    const { EffectComposer } = require('./EffectComposer.js');
    const { RenderPass } = require('./RenderPass.js');

    // 创建后处理渲染目标
    this.composer = new EffectComposer(this.renderer);
    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);
    this.shaderPasses = [];

    this.addShaderPass(shaderPassConfigs);
  }

//===begin_pp===
initPostProcessing() {
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
/**
   * 初始化一个完整的基本场景（不包含动画循环）
   * 包括相机、场景对象的创建
   * @returns {Object} 场景中的对象引用
   */
  setupScene() {
    this.initSceneObjects();
    this.scene.background = new THREE.Color(0x000000);
    this.configureCamera();
    this.buildVoxelGrid();
    this.createAnimations();
    return this.sceneObjects;
  }

  /**
   * 初始化场景对象容器
   */
  initSceneObjects() {
    this.sceneObjects = {
      tweens: [],
      voxelGroup: null,
      voxelMeshes: [],
      materialUniforms: [],
      gap: 0,
      config: {
        totalWidth: 20,
        totalHeight: 20,
        totalDepth: 20,
        columns: 2,
        rows: 4,
        layers: 8
      },
      cameraInitialPosition: new THREE.Vector3(0, 0, 30),
      cameraRaisedPosition: new THREE.Vector3(0, 18, 48),
      lookAtTarget: new THREE.Vector3(0, 0, 0)
    };
  }

  /**
   * 配置相机初始状态
   */
  configureCamera() {
    if (!this.camera) return;
    this.camera.position.copy(this.sceneObjects.cameraInitialPosition);
    this.camera.lookAt(this.sceneObjects.lookAtTarget);
  }

  /**
   * 构建长方体体素网格
   */
  buildVoxelGrid() {
    const { totalWidth, totalHeight, totalDepth, columns, rows, layers } = this.sceneObjects.config;
    const halfWidth = totalWidth / 2;
    const halfHeight = totalHeight / 2;
    const halfDepth = totalDepth / 2;
    const cellWidth = totalWidth / columns;
    const cellHeight = totalHeight / rows;
    const cellDepth = totalDepth / layers;

    const voxelGroup = new THREE.Group();
    voxelGroup.name = 'VoxelGridGroup';
    this.sceneObjects.voxelGroup = voxelGroup;
    this.scene.add(voxelGroup);

    const baseGeometry = new THREE.BoxGeometry(cellWidth, cellHeight, cellDepth);
    baseGeometry.name = 'VoxelUnitGeometry';

    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;
    const fragmentShader = `
      uniform sampler2D mapA;
      uniform sampler2D mapB;
      uniform float mixProgress;
      uniform vec2 uvScale;
      uniform vec2 uvOffset;
      varying vec2 vUv;
      void main() {
        vec2 uvp = vUv * uvScale + uvOffset;
        vec4 colorA = texture2D(mapA, uvp);
        vec4 colorB = texture2D(mapB, uvp);
        gl_FragColor = mix(colorA, colorB, mixProgress);
      }
    `;

    for (let ix = 0; ix < columns; ix++) {
      for (let iy = 0; iy < rows; iy++) {
        for (let iz = 0; iz < layers; iz++) {
          const centerX = -halfWidth + cellWidth * (ix + 0.5);
          const centerY = halfHeight - cellHeight * (iy + 0.5);
          const centerZ = -halfDepth + cellDepth * (iz + 0.5);

          const materials = this.createVoxelMaterials({
            ix,
            iy,
            iz,
            columns,
            rows,
            layers,
            vertexShader,
            fragmentShader
          });

          const voxelMesh = new THREE.Mesh(baseGeometry, materials);
          voxelMesh.name = `Voxel_${ix + 1}_${iy + 1}_${iz + 1}`;
          voxelMesh.position.set(centerX, centerY, centerZ);
          voxelMesh.rotation.set(0, 0, 0);
          voxelMesh.scale.set(1, 1, 1);

          voxelGroup.add(voxelMesh);
          this.sceneObjects.voxelMeshes.push(voxelMesh);
        }
      }
    }

    // 初始化缩放与纹理混合
    this.updateVoxelGap(0);
    this.updateMixProgress(0);
  }

  /**
   * 创建单个体素的材质数组
   */
  createVoxelMaterials(params) {
    const {
      ix, iy, iz,
      columns, rows, layers,
      vertexShader, fragmentShader
    } = params;

    const faceDescriptors = [
      { face: '+X' },
      { face: '-X' },
      { face: '+Y' },
      { face: '-Y' },
      { face: '+Z' },
      { face: '-Z' }
    ];

    return faceDescriptors.map((descriptor) => {
      const { uvScale, uvOffset } = this.computeUVTransform(descriptor.face, ix, iy, iz, columns, rows, layers);

      const material = new THREE.ShaderMaterial({
        name: `VoxelFaceMaterial_${descriptor.face}_${ix + 1}_${iy + 1}_${iz + 1}`,
        uniforms: {
          mapA: { value: this.texture1 },
          mapB: { value: this.texture2 },
          mixProgress: { value: 0 },
          uvScale: { value: uvScale },
          uvOffset: { value: uvOffset }
        },
        vertexShader,
        fragmentShader,
        transparent: false,
        side: THREE.DoubleSide
      });

      this.sceneObjects.materialUniforms.push(material.uniforms);
      return material;
    });
  }

  /**
   * 计算各面的 UV 缩放与偏移
   */
  computeUVTransform(face, ix, iy, iz, columns, rows, layers) {
    const i1 = ix + 1;
    const j1 = iy + 1;
    const k1 = iz + 1;

    let scaleU = 1;
    let scaleV = 1;
    let offsetU = 0;
    let offsetV = 0;

    switch (face) {
      case '+X':
        scaleU = 1 / layers;
        scaleV = 1 / rows;
        offsetU = (layers - k1) / layers;
        offsetV = 1 - j1 / rows;
        break;
      case '-X':
        scaleU = 1 / layers;
        scaleV = 1 / rows;
        offsetU = (k1 - 1) / layers;
        offsetV = 1 - j1 / rows;
        break;
      case '+Y':
        scaleU = 1 / columns;
        scaleV = 1 / layers;
        offsetU = (i1 - 1) / columns;
        offsetV = 1 - k1 / layers;
        break;
      case '-Y':
        scaleU = 1 / columns;
        scaleV = 1 / layers;
        offsetU = (i1 - 1) / columns;
        offsetV = (k1 - 1) / layers;
        break;
      case '+Z':
        scaleU = 1 / columns;
        scaleV = 1 / rows;
        offsetU = (i1 - 1) / columns;
        offsetV = 1 - j1 / rows;
        break;
      case '-Z':
        scaleU = 1 / columns;
        scaleV = 1 / rows;
        offsetU = (columns - i1) / columns;
        offsetV = 1 - j1 / rows;
        break;
      default:
        break;
    }

    return {
      uvScale: new THREE.Vector2(scaleU, scaleV),
      uvOffset: new THREE.Vector2(offsetU, offsetV)
    };
  }

  /**
   * 更新体素网格的间隙（通过缩放实现）
   * @param {number} gap 
   */
  updateVoxelGap(gap) {
    const { config } = this.sceneObjects;
    const baseScaleX = config.totalWidth / config.columns;
    const baseScaleY = config.totalHeight / config.rows;
    const baseScaleZ = config.totalDepth / config.layers;

    const scaleX = (baseScaleX - gap) / baseScaleX;
    const scaleY = (baseScaleY - gap) / baseScaleY;
    const scaleZ = (baseScaleZ - gap) / baseScaleZ;

    this.sceneObjects.gap = gap;

    this.sceneObjects.voxelMeshes.forEach(mesh => {
      mesh.scale.set(scaleX, scaleY, scaleZ);
    });
  }

  /**
   * 更新所有体素材质的混合进度
   * @param {number} value 
   */
  updateMixProgress(value) {
    this.sceneObjects.materialUniforms.forEach(uniforms => {
      uniforms.mixProgress.value = value;
    });
  }

  /**
   * 创建所有动画
   */
  createAnimations() {
    const tweens = this.sceneObjects.tweens;
    const duration = this.Duration;

    // 摄像机上升
    const cameraRiseState = {
      y: this.sceneObjects.cameraInitialPosition.y,
      z: this.sceneObjects.cameraInitialPosition.z
    };
    const cameraRiseTween = new TWEEN.Tween(cameraRiseState)
      .to({
        y: this.sceneObjects.cameraRaisedPosition.y,
        z: this.sceneObjects.cameraRaisedPosition.z
      }, 450)
      .delay(50)
      .easing(TWEEN.Easing.Sinusoidal.InOut)
      .onUpdate(obj => {
        this.camera.position.set(
          this.sceneObjects.cameraInitialPosition.x,
          obj.y,
          obj.z
        );
        this.camera.lookAt(this.sceneObjects.lookAtTarget);
      });
    tweens.push(cameraRiseTween);

    // 摄像机下降
    const cameraFallState = {
      y: this.sceneObjects.cameraRaisedPosition.y,
      z: this.sceneObjects.cameraRaisedPosition.z
    };
    const cameraFallTween = new TWEEN.Tween(cameraFallState)
      .to({
        y: this.sceneObjects.cameraInitialPosition.y,
        z: this.sceneObjects.cameraInitialPosition.z
      }, 300)
      .delay(1200)
      .easing(TWEEN.Easing.Sinusoidal.InOut)
      .onUpdate(obj => {
        this.camera.position.set(
          this.sceneObjects.cameraInitialPosition.x,
          obj.y,
          obj.z
        );
        this.camera.lookAt(this.sceneObjects.lookAtTarget);
      });
    tweens.push(cameraFallTween);

    // 间隙增大
    const gapIncreaseState = { gap: 0 };
    const gapIncreaseTween = new TWEEN.Tween(gapIncreaseState)
      .to({ gap: 0.8 }, 450)
      .delay(50)
      .easing(TWEEN.Easing.Sinusoidal.In)
      .onUpdate(obj => {
        this.updateVoxelGap(obj.gap);
      });
    tweens.push(gapIncreaseTween);

    // 间隙减小
    const gapDecreaseState = { gap: 0.8 };
    const gapDecreaseTween = new TWEEN.Tween(gapDecreaseState)
      .to({ gap: 0 }, 300)
      .delay(1200)
      .easing(TWEEN.Easing.Sinusoidal.In)
      .onUpdate(obj => {
        this.updateVoxelGap(obj.gap);
      });
    tweens.push(gapDecreaseTween);

    // 旋转与纹理混合
    const rotationState = {
      angle: 0,
      mix: 0
    };
    const rotationTween = new TWEEN.Tween(rotationState)
      .to({
        angle: Math.PI * 2,
        mix: 1
      }, 1100)
      .delay(200)
      .easing(TWEEN.Easing.Circular.InOut)
      .onUpdate(obj => {
        if (this.sceneObjects.voxelGroup) {
          this.sceneObjects.voxelGroup.rotation.y = obj.angle;
        }
        this.updateMixProgress(obj.mix);
      });
    tweens.push(rotationTween);

    // 启动所有 Tween
    tweens.forEach(tween => tween.start(0));
  }
//===end===

  /**
   * 默认的场景更新函数，实现轨道交错转场动画
   */
  defaultUpdate(timestamp) {
    // 更新所有TWEEN动画
    if (this.sceneObjects.tweens && this.sceneObjects.tweens.length > 0) {
      this.sceneObjects.tweens.forEach(tween => {
        if (tween && typeof tween.update === 'function') {
          tween.update(timestamp);
        }
      });
    }

    this.update();
  }

//===Predefined Function Begin===
_predef_addTopCenterBottomStyleBorder(parent, offset, texture, cutoutAreaPosition, cutoutAreaSize) {
    const aspectRatio = this.texture1.image.width / this.texture1.image.height;
    const parentInitScale = parent.scale.y;
    const parentPosition = parent.position;
    const textureWidth = texture.image.width;
    const textureHeight = texture.image.height;
    const geometry = new THREE.PlaneGeometry(10, 10);

    // center
    const textureCenter = texture.clone();
    textureCenter.repeat.set(1, cutoutAreaSize.y / textureHeight);
    textureCenter.offset.set(0, (textureHeight - cutoutAreaPosition.y - cutoutAreaSize.y) / textureHeight);
    
    const materialCenter = new THREE.MeshBasicMaterial({
        map: textureCenter,
        transparent: true,
        opacity: 1,
        premultipliedAlpha: true,
        side: THREE.DoubleSide
    });
    materialCenter.name = 'PlaneCenterMaterial';
    
    const planeCenter = new THREE.Mesh(geometry, materialCenter);
    planeCenter.name = 'PlaneCenter';
    planeCenter.position.set(parentPosition.x + offset.x, parentPosition.y + offset.y, parentPosition.z + offset.z);
    planeCenter.scale.set(parentInitScale * aspectRatio / (cutoutAreaSize.x / textureWidth), parentInitScale, 1);
    
    this.scene.add(planeCenter);
    parent.attach(planeCenter);

    // top
    const textureTop = texture.clone();
    textureTop.repeat.set(1, cutoutAreaPosition.y / textureHeight);
    textureTop.offset.set(0, 1 - cutoutAreaPosition.y / textureHeight);
    
    const materialTop = new THREE.MeshBasicMaterial({
        map: textureTop,
        transparent: true,
        opacity: 1,
        premultipliedAlpha: true,
        side: THREE.DoubleSide
    });
    materialTop.name = 'PlaneTopMaterial';
    
    const scaleXTop = parentInitScale * aspectRatio / (cutoutAreaSize.x / textureWidth);
    const scaleYTop = scaleXTop * cutoutAreaPosition.y / textureWidth;
    
    const planeTop = new THREE.Mesh(geometry, materialTop);
    planeTop.name = 'PlaneTop';
    planeTop.position.set(parentPosition.x + offset.x, parentPosition.y + offset.y + parentInitScale * 10 * 0.5 + scaleYTop * 10 * 0.5, parentPosition.z + offset.z);
    planeTop.scale.set(scaleXTop, scaleYTop, 1);
    
    this.scene.add(planeTop);
    parent.attach(planeTop);

    // bottom
    const textureBottom = texture.clone();
    textureBottom.repeat.set(1, (textureHeight - cutoutAreaPosition.y - cutoutAreaSize.y) / textureHeight);
    textureBottom.offset.set(0, 0);
    
    const materialBottom = new THREE.MeshBasicMaterial({
        map: textureBottom,
        transparent: true,
        opacity: 1,
        premultipliedAlpha: true,
        side: THREE.DoubleSide
    });
    materialBottom.name = 'PlaneBottomMaterial';
    
    const scaleXBottom = parentInitScale * aspectRatio / (cutoutAreaSize.x / textureWidth);
    const scaleYBottom = scaleXBottom * (textureHeight - cutoutAreaPosition.y - cutoutAreaSize.y) / textureWidth;
    
    const planeBottom = new THREE.Mesh(geometry, materialBottom);
    planeBottom.name = 'PlaneBottom';
    planeBottom.position.set(parentPosition.x + offset.x, parentPosition.y + offset.y - parentInitScale * 10 * 0.5 - scaleYBottom * 10 * 0.5, parentPosition.z + offset.z);
    planeBottom.scale.set(scaleXBottom, scaleYBottom, 1);
    
    this.scene.add(planeBottom);
    parent.attach(planeBottom);
}
_predef_loadVideoTexture(path, loop, playbackRate) {
    if (this.scene._amgScene == null) {
        const video = document.createElement('video');
        video.src = path;
        video.muted = true;
        video.loop = loop;
        //video.play();
        video.load();

        // video.style.position = 'absolute';
        // video.style.top = '400px';
        // video.style.left = '0px';
        // video.style.width = '480px';
        // video.style.height = '360px';
        // video.style.zIndex = '100';
        // document.body.appendChild(video);

        const videoTexture = new THREE.VideoTexture(video);
        videoTexture.currentTime = 0;
        videoTexture.playbackRate = playbackRate;

        this.videoTexture = videoTexture;

        return videoTexture;
    } else if (typeof this.scene._amgScene === 'string') {
      return new THREE.Texture();
    } else {
        const texture = new THREE.VideoTexture(path, loop, playbackRate);
        texture.load();
        return texture;
    }
}
_predef_seekVideoTexture(time) {
  if (this.videoTexture != null) {
    const videoTexture = this.videoTexture;
    const video = videoTexture.image;
    if (video.readyState >= 2) {
      const textureProperties = this.renderer.properties.get(videoTexture);
      var newTime = time / 1000 * videoTexture.playbackRate;
      if (newTime < 0) {
        newTime = 0;
      } else if (newTime > video.duration) {
        if (video.loop) {
          newTime = newTime % video.duration;
        } else {
          newTime = video.duration;
        }
      }
      if (textureProperties.__version == videoTexture.version) {
        videoTexture.currentTime = newTime;
        video.currentTime = videoTexture.currentTime;
      }
    }
  }
}
//===Predefined Function End===
}

// 导入Three.js库
// module.exports = ScriptScene;

// 导入Three.js 的 wrapper库
exports.ScriptScene = ScriptScene;