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
  addAnimations() {
    const duration = this.Duration;
    const tweens = [];

    // 为所有ShaderPass添加动画
    this.shaderPasses.forEach(shaderPass => {
      if (shaderPass.constructor.name === 'BCC_PrismShaderPass') {
        // 应用预设配置检查：如果没有预设配置函数或设置参数函数，则打印错误并返回
        if (typeof shaderPass.getPresetConfig !== 'function' || typeof shaderPass.setParameter !== 'function') {
          console.error(`${shaderPass.constructor.name} 中没有 getPresetConfig 或 setParameter 方法`);
          return;
        }

        // 如果有预设配置，则先获取预设配置，再应用预设配置构造Tween动画
        const config1 = shaderPass.getPresetConfig('none');
        if (!config1) {
          console.error(`${shaderPass.constructor.name} 中没有 none 预设配置`);
          return;
        }

        const config2 = shaderPass.getPresetConfig('high');
        if (!config2) {
          console.error(`${shaderPass.constructor.name} 中没有 high 预设配置`);
          return;
        }

        // 创建从0到1的动画
        const tween1 = new TWEEN.Tween(config1)
          .to(config2, duration * 0.5)
          .easing(TWEEN.Easing.Linear.None)
          .onUpdate((obj) => {
            // 遍历obj中的所有属性，自动设置参数
            for (const key in obj) {
              shaderPass.setParameter(key, obj[key]);
            }
          });

        // 创建从1到0的动画
        const tween2 = new TWEEN.Tween(config2)
          .to(config1, duration * 0.5)
          .delay(duration * 0.5)
          .easing(TWEEN.Easing.Linear.None)
          .onUpdate((obj) => {
            // 遍历obj中的所有属性，自动设置参数
            for (const key in obj) {
              shaderPass.setParameter(key, obj[key]);
            }
          });

        tweens.push(tween1, tween2);
      } else if (shaderPass.constructor.name === 'ChromaticAberrationShaderPass') {
        // 应用参数配置检查：如果没有设置参数函数，则打印错误并返回
        if (typeof shaderPass.setParameter !== 'function') {
          console.error(`${shaderPass.constructor.name} 中没有 setParameter 方法`);
          return;
        }

        // 创建从0到1的动画
        const tween1 = new TWEEN.Tween({ intensity: 0 })
          .to({ intensity: 1 }, duration * 0.5)
          .easing(TWEEN.Easing.Linear.None)
          .onUpdate((obj) => {
            // 遍历obj中的所有属性，自动设置参数
            for (const key in obj) {
              shaderPass.setParameter(key, obj[key]);
            }
          });

        // 创建从1到0的动画
        const tween2 = new TWEEN.Tween({ intensity: 1 })
          .to({ intensity: 0 }, duration * 0.5)
          .delay(duration * 0.5)
          .easing(TWEEN.Easing.Linear.None)
          .onUpdate((obj) => {
            // 遍历obj中的所有属性，自动设置参数
            for (const key in obj) {
              shaderPass.setParameter(key, obj[key]);
            }
          });

        tweens.push(tween1, tween2);
      }
    });
    
    // 启动所有动画
    tweens.forEach(tween => tween.start());
    
    return tweens;
  }

  /**
   * 初始化后处理效果
   */
  initPostProcessing() {
    if (!this.usePostProcessing) return;

    // 定义ShaderPass配置数组，并初始化shaderPass
    const shaderPassConfigs = [
      { name: 'LumiBCC_Prism' },
      { name: 'LumiChromaticAberration' }
    ];
    this.setupPostProcessing(shaderPassConfigs);
    
    // 添加Tween动画，并且将动画添加到场景对象中
    const tweens = this.addAnimations();
    if (tweens.length > 0) {
      if (!this.sceneObjects.tweens) {
        this.sceneObjects.tweens = [];
      }
      this.sceneObjects.tweens.push(...tweens);
    }
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
  /**
   * 初始化一个完整的基本场景（不包含动画循环）
   * 包括相机、场景对象的创建
   * @returns {Object} 场景中的对象引用
   */
setupScene() {
  // 初始化场景对象容器
  this.initSceneObjects();

  // 设置场景背景为黑色
  this.scene.background = new THREE.Color(0x000000);
  
  // 创建多面体转场特效
  this.createGridTransition();

  // 新增：初始化动画
  this.setupAnimations();
  
  return this.sceneObjects;
}

/**
 * 初始化场景对象容器
 */
initSceneObjects() {
  this.sceneObjects = {
    gridSize: 7 , // gridSize x gridSize网格
    cellPlanes: [], // 存储所有的平面网格
    planeGroup: null, // 用于整体管理平面的组
    originalPositions: [], // 存储每个平面的原始位置
    rotationAxes: [], // 存储每个平面的旋转轴
    rotationAngles: [], // 存储每个平面的最大旋转角度
    animationData: [] // 存储每个平面的动画数据
  };

}

/**
 * 创建网格转场特效
 */
createGridTransition() {
  // 创建一个组来容纳所有的平面
  const planeGroup = new THREE.Group();
  planeGroup.name = "PlaneGroup";
  this.scene.add(planeGroup);
  this.sceneObjects.planeGroup = planeGroup;
  
  const gridSize = this.sceneObjects.gridSize;
  const totalSize = 10.0; // 总场景大小为2x2单位
  const cellSize = totalSize / gridSize; // 每个单元格的大小
  
  // 创建gridSize x gridSize网格的平面
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const index = i * gridSize + j;
      
      // 计算平面在总网格中的位置
      const offsetX = -totalSize / 2 + cellSize / 2 + j * cellSize;
      const offsetY = totalSize / 2 - cellSize / 2 - i * cellSize;
      
      // 创建平面几何体
      const geometry = new THREE.PlaneGeometry(cellSize, cellSize, 1, 1);
      
      // 创建混合两个纹理的着色器材质
      const material = this.createMixShaderMaterial(i, j, gridSize);
      material.name = `CellMaterial_${i}_${j}`;
      
      // 创建网格对象
      const plane = new THREE.Mesh(geometry, material);
      plane.name = `CellPlane_${i}_${j}`;
      plane.position.set(offsetX, offsetY, 0);
      
      // 存储原始位置
      this.sceneObjects.originalPositions.push({
        x: offsetX,
        y: offsetY,
        z: 0
      });
      
      // 创建随机旋转轴，偏向z轴
      const rotAxis = new THREE.Vector3(
        (Math.random() - 0.5) * 0.4, // x分量, ±0.2左右
        (Math.random() - 0.5) * 0.6, // y分量, ±0.3左右
        1.0 // z分量为主
      ).normalize();
      this.sceneObjects.rotationAxes.push(rotAxis);
      
      // 设置随机旋转角度(180°-360°)
      const rotAngle = Math.PI + Math.random() * Math.PI;
      this.sceneObjects.rotationAngles.push(rotAngle);
      
      // 计算从中心的距离，用于动画延迟和z轴移动
      const centerI = gridSize / 2 - 0.5;
      const centerJ = gridSize / 2 - 0.5;
      const distFromCenter = Math.sqrt(Math.pow(i - centerI, 2) + Math.pow(j - centerJ, 2));
      const normalizedDist = distFromCenter / (Math.sqrt(2) * centerI); // 归一化距离[0,1]
      
      // 存储动画数据
      this.sceneObjects.animationData.push({
        distFromCenter: normalizedDist,
        delayFactor: normalizedDist * 0.2, // 0到0.2的延迟因子
        zOffset: 1.5 + normalizedDist * 10.2 // 最大z轴偏移
      });
      
      // 添加到组和数组
      planeGroup.add(plane);
      this.sceneObjects.cellPlanes.push(plane);
    }
  }
}

/**
 * 创建混合两个纹理的着色器材质
 * @param {number} i - 行索引
 * @param {number} j - 列索引
 * @param {number} gridSize - 网格大小
 * @returns {THREE.ShaderMaterial} 着色器材质
 */
createMixShaderMaterial(i, j, gridSize) {
  // 确保纹理已加载
  if (!this.texture1 || !this.texture2) {
    console.error("纹理未加载！");
    return new THREE.MeshBasicMaterial({ color: 0xff0000 });
  }
  

  
  // 计算UV偏移和比例以映射正确的纹理部分
  const uvOffsetX = j / gridSize;
  const uvOffsetY = 1 - (i+1) / gridSize;
  const uvScale = 1 / gridSize;
  
  // 创建着色器材质
  return new THREE.ShaderMaterial({
    uniforms: {
      texture1: { value: this.texture1 },
      texture2: { value: this.texture2 },
      uvOffset: { value: new THREE.Vector2(uvOffsetX, uvOffsetY) },
      uvScale: { value: new THREE.Vector2(uvScale, uvScale) },
      mixFactor: { value: 0.0 } // 混合因子，0=第一张图，1=第二张图
    },
    vertexShader: `
      varying vec2 vUv;
      
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D texture1;
      uniform sampler2D texture2;
      uniform vec2 uvOffset;
      uniform vec2 uvScale;
      uniform float mixFactor;
      
      varying vec2 vUv;
      
      void main() {
        // 计算实际的UV坐标，映射到对应的图像部分
        vec2 scaledUv = uvOffset + vUv * uvScale;
        
        // 采样两张纹理
        vec4 color1 = texture2D(texture1, scaledUv);
        vec4 color2 = texture2D(texture2, scaledUv);
        
        // 混合两种颜色
        gl_FragColor = mix(color1, color2, mixFactor);
      }
    `,
    transparent: true,
    side: THREE.DoubleSide
  });
}

/**
 * 初始化所有平面的 TWEEN 动画
 */
setupAnimations() {
  const { cellPlanes, originalPositions, rotationAxes, rotationAngles, animationData } = this.sceneObjects;
  const duration = this.Duration; // 使用 this.Duration 作为动画总时长

  this.sceneObjects.tweens = []; // 初始化 tweens 数组

  for (let i = 0; i < cellPlanes.length; i++) {
    const plane = cellPlanes[i];
    const origPos = originalPositions[i];
    const rotAxis = rotationAxes[i];
    const rotAngle = rotationAngles[i];
    const animData = animationData[i];

    // 第一段：到最大zOffset
    const start = { angle: 0, zOffset: 0, mixFactor: 0 };
    const mid = { angle: rotAngle, zOffset: -1.0*animData.zOffset, mixFactor: 0.5 };
    // 第二段：zOffset回到0
    const end = { angle: 0, zOffset: 0, mixFactor: 1 };

    // 第一段Tween
    const tween1 = new TWEEN.Tween(start)
      .to(mid, duration * 0.7)
      .delay(animData.delayFactor * duration)
      .easing(TWEEN.Easing.Cubic.InOut)
      .onUpdate(obj => {
        const quaternion = new THREE.Quaternion();
        quaternion.setFromAxisAngle(rotAxis, obj.angle);
        plane.quaternion.copy(quaternion);
        plane.position.z = origPos.z + obj.zOffset;
        if (plane.material && plane.material.uniforms) {
          plane.material.uniforms.mixFactor.value = obj.mixFactor;
        }
      })
      .start();

    const tween2 = new TWEEN.Tween(mid)
      .to(end, duration * 0.3)
      .delay(animData.delayFactor * duration + duration * 0.5)  // 延迟 + 第一段的50%时间后开始
      .easing(TWEEN.Easing.Cubic.InOut)
      .onUpdate(obj => {
        const quaternion = new THREE.Quaternion();
        quaternion.setFromAxisAngle(rotAxis, obj.angle);
        plane.quaternion.copy(quaternion);
        plane.position.z = origPos.z + obj.zOffset;
        if (plane.material && plane.material.uniforms) {
          plane.material.uniforms.mixFactor.value = obj.mixFactor;
        }
      })
      .start();

    this.sceneObjects.tweens.push(tween1); // 收集第一段tween
    this.sceneObjects.tweens.push(tween2); // 收集第二段tween
  }
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
//===Predefined Function End===
}

// 导入Three.js库
module.exports = ScriptScene;

// 导入Three.js 的 wrapper库
// exports.ScriptScene = ScriptScene;
