/**
 * Three.js 编辑器主要控制逻辑
 * 负责管理UI交互、对象操作、属性编辑等功能
 * 集成现有的ScriptScene实例
 */

class ThreeEditor {
  constructor() {
    this.sceneInstance = null;  // ScriptScene实例
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.selectedObject = null;
    this.transformMode = 'translate';
    this.objectCounter = 0;
    this.lastTransformState = null; // 存储上一次的变换状态
    this.isUserEditing = false; // 标记用户是否正在编辑输入框
    this.knownObjects = new Set(); // 跟踪已知的对象
    this.expandedGroups = new Set(); // 跟踪展开的组
    
    // 相机模式相关变量
    this.isUsingSceneOutput = false; // 默认使用漫游相机
    this.browserCamera = null; // 编辑器专用的浏览相机
    this.sceneOutputFollowing = false; // 是否正在跟随场景输出
    
    // 时间轴相关变量
    this.timelineElements = {
      currentTime: null,
      duration: null,
      progress: null,
      cursor: null,
      container: null
    };
    
    // 时间轴交互状态
    this.timelineInteraction = {
      isDragging: false,
      dragStartX: 0,
      timelineRect: null
    };
    
    // 等待现有场景初始化完成后再初始化编辑器
    this.waitForSceneAndInit();
  }

  waitForSceneAndInit() {
    // 检查全局场景是否已经初始化
    if (window._sceneInstance && window.scene && window.camera && window.renderer) {
      this.integrateWithExistingScene();
    } else {
      // 如果场景还没初始化，等待一段时间后重试
      setTimeout(() => this.waitForSceneAndInit(), 100);
    }
  }

  integrateWithExistingScene() {
    // 使用现有的场景实例
    this.sceneInstance = window._sceneInstance;
    this.scene = window.scene;
    // 保存原始场景相机的引用，但不直接使用
    this.originalSceneCamera = window.camera;
    this.renderer = window.renderer;

    // 创建独立的浏览相机，用于编辑器观察
    this.createBrowserCamera();

    // 默认使用场景相机
    this.isUsingSceneOutput = true;
    this.switchToSceneOutput();

    // 覆盖场景内的尺寸调整，统一正方形策略
    const squareResize = () => {
      const container = document.getElementById('canvasContainer');
      if (!container) return;
      const size = Math.min(container.clientWidth, container.clientHeight);
      if (this.sceneInstance && this.sceneInstance.camera) {
        this.sceneInstance.camera.aspect = 1;
        this.sceneInstance.camera.updateProjectionMatrix();
      }
      if (this.sceneInstance && this.sceneInstance.renderer) {
        this.sceneInstance.renderer.setSize(size, size);
        const canvas = this.sceneInstance.renderer.domElement;
        if (canvas) {
          canvas.style.width = size + 'px';
          canvas.style.height = size + 'px';
        }
      }
      if (this.sceneInstance && this.sceneInstance.composer) {
        this.sceneInstance.composer.setSize(size, size);
      }
    };
    this.sceneInstance.handleResize = squareResize;

    console.log('编辑器已集成现有场景，使用独立浏览相机');
    
    this.init();
    this.bindEvents();

    // 场景相机模式下隐藏调试辅助
    this.setDebugHelpersVisible(false);
  }

  createBrowserCamera() {
    // 创建编辑器专用的浏览相机
    this.browserCamera = new THREE.PerspectiveCamera(
      75, // 视场角
      window.innerWidth / window.innerHeight, // 纵横比
      0.1, // 近平面
      10000 // 远平面
    );
    
    // 设置浏览相机的初始位置，稍微偏离原相机位置以便观察
    if (this.originalSceneCamera) {
      // 基于原相机位置设置，但稍作调整
      this.browserCamera.position.copy(this.originalSceneCamera.position);
      this.browserCamera.position.y += 5; // 抬高一点
      this.browserCamera.position.z += 5; // 后退一点
    } else {
      // 默认位置
      this.browserCamera.position.set(10, 10, 10);
    }
    
    // 让浏览相机看向场景中心
    this.browserCamera.lookAt(0, 0, 0);
    
    // 给浏览相机添加标识，避免被当作场景对象处理
    this.browserCamera.userData = {
      isBrowserCamera: true,
      name: 'Browser Camera',
      type: 'browser_camera'
    };
    
    // 默认使用漫游相机
    this.camera = this.browserCamera;
    this.isUsingSceneOutput = false;
    this.sceneOutputFollowing = false;
    console.log('默认使用漫游相机模式');
    console.log('已创建独立浏览相机:', this.browserCamera.position);
  }

  init() {
    // 将现有的渲染器移动到编辑器容器中
    this.moveRendererToEditor();
    
    // 添加编辑器专用的功能
    this.setupEditorFeatures();
    this.setupTransformControls();
    this.updateSceneHierarchy();
    
    // 初始化相机开关
    this.initCameraToggle();
    
    // 初始化时间轴
    this.initTimeline();
    
    this.animate();
  }

  moveRendererToEditor() {
    const container = document.getElementById('canvasContainer');
    const canvas = this.renderer.domElement;
    
    // 移除现有的样式，使用编辑器的样式
    canvas.style.display = 'block';
    
    // 将canvas移动到编辑器容器
    container.appendChild(canvas);
    
    // 初始时按照正方形策略调整渲染器大小
    this.onWindowResize();
  }

  setupEditorFeatures() {
    // 添加轨道控制器（如果还没有的话）
    if (!this.controls) {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      
      // 根据相机模式设置控制器状态
      this.controls.enabled = !this.isUsingSceneOutput; // 场景输出模式下禁用控制器
    }

    // 添加变换控制器
    this.setupTransformControls();

    // 为现有对象添加用户数据
    this.addUserDataToExistingObjects();
    
    // 添加网格辅助线
    this.addGrid();
  }

  setupTransformControls() {
    // 创建变换控制器
    this.transformControls = new THREE.TransformControls(this.camera, this.renderer.domElement);
    this.scene.add(this.transformControls);

    // 设置变换控制器事件
    this.transformControls.addEventListener('change', () => {
      // 当变换控制器改变时，更新UI输入框
      if (this.selectedObject) {
        this.updateTransformInputs(this.selectedObject);
        this.updateSelectionHelper();
        // 如果是ScriptScene对象，同时更新物理体
        if (this.selectedObject.userData.isScriptObject) {
          this.syncPhysicsBodyTransform(this.selectedObject);
        }
      }
    });

    // 当开始拖拽时，禁用轨道控制器
    this.transformControls.addEventListener('dragging-changed', (event) => {
      this.controls.enabled = !event.value;
    });

    // 监听键盘事件来切换变换模式
    window.addEventListener('keydown', (event) => {
      if (!this.transformControls.object) return;

      switch (event.code) {
        case 'KeyG': // G键 - 移动模式
          this.setTransformMode('translate');
          event.preventDefault();
          break;
        case 'KeyR': // R键 - 旋转模式
          this.setTransformMode('rotate');
          event.preventDefault();
          break;
        case 'KeyS': // S键 - 缩放模式
          this.setTransformMode('scale');
          event.preventDefault();
          break;
        case 'Escape': // ESC键 - 取消选择
          this.selectObject(null);
          event.preventDefault();
          break;
      }
    });

    // 设置初始模式
    this.transformControls.setMode('translate');

    // 在场景相机模式下隐藏变换控件
    if (this.isUsingSceneOutput) {
      this.transformControls.visible = false;
    }
  }

  setTransformMode(mode) {
    this.transformMode = mode;
    if (this.transformControls) {
      this.transformControls.setMode(mode);
    }
    
    // 更新UI按钮状态
    document.querySelectorAll('.transform-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.getAttribute('data-mode') === mode) {
        btn.classList.add('active');
      }
    });
  }

  syncPhysicsBodyTransform(object) {
    if (!object.userData.isScriptObject || !this.sceneInstance) {
      return;
    }
    
    // 查找对应的物理体并同步变换
    let physicsBody = null;
    
    if (this.sceneInstance.sceneObjects && this.sceneInstance.sceneObjects.balls) {
      const ballData = this.sceneInstance.sceneObjects.balls.find(ball => ball.mesh === object);
      if (ballData) {
        physicsBody = ballData.body;
      }
    }
    
    if (this.sceneInstance.sceneObjects && this.sceneInstance.sceneObjects.borders) {
      const borderData = this.sceneInstance.sceneObjects.borders.find(border => border.mesh === object);
      if (borderData) {
        physicsBody = borderData.body;
      }
    }
    
    if (physicsBody) {
      physicsBody.position.copy(object.position);
      physicsBody.quaternion.copy(object.quaternion);
      // 清零速度，避免物理引擎立即改变位置
      physicsBody.velocity.set(0, 0, 0);
      physicsBody.angularVelocity.set(0, 0, 0);
    }
  }

  addUserDataToExistingObjects() {
    // 为现有场景中的对象添加编辑器需要的用户数据
    // 用于统计每种类型的对象数量
    const typeCounts = {};
    
    this.scene.children.forEach((child, index) => {
      // 检查网格对象、相机、光源和组，但排除浏览相机
      if ((child.isMesh || child.isCamera || child.isLight || child.isGroup) && 
          !child.userData.editorId && 
          !child.userData.isBrowserCamera) { // 排除浏览相机
        // 确保userData对象存在
        if (!child.userData) {
          child.userData = {};
        }
        
        // 优先使用已有的type，否则从对象类型推断
        const objectType = child.userData.type || this.getObjectType(child);
        
        // 为每种类型维护计数器
        if (!typeCounts[objectType]) {
          typeCounts[objectType] = 0;
        }
        typeCounts[objectType]++;
        
        // 优先使用已有的name，否则生成一个
        let objectName = child.name || child.userData.name;
        if (!objectName) {
          // 为相机、光源和组生成特殊名称
          if (child.isCamera) {
            objectName = `${objectType}_${typeCounts[objectType]}`;
          } else if (child.isLight) {
            objectName = `${objectType}_${typeCounts[objectType]}`;
          } else if (child.isGroup) {
            objectName = `${objectType}_${typeCounts[objectType]}`;
          } else {
            objectName = `${objectType}_${typeCounts[objectType]}`;
          }
        }
        
        // 检查是否是ScriptScene创建的对象
        const isScriptObject = child.userData.createdBy === 'ScriptScene';
        
        child.userData = {
          ...child.userData, // 保留原有的userData
          id: ++this.objectCounter,
          type: objectType,
          name: objectName,
          editorId: false, // 标记为原始对象，不是编辑器添加的
          isScriptObject: isScriptObject
        };
        
        // 同步name属性
        if (!child.name) {
          child.name = objectName;
        }
        
        // 将对象添加到已知对象集合中
        this.knownObjects.add(child.uuid);
        
        // 如果是Group，递归处理其子对象
        if (child.isGroup) {
          this.processGroupChildren(child, typeCounts);
        }
      }
    });
  }

  processGroupChildren(group, typeCounts) {
    group.children.forEach(child => {
      if ((child.isMesh || child.isCamera || child.isLight || child.isGroup) && 
          !child.userData.editorId && 
          !child.userData.isBrowserCamera) { // 排除浏览相机
        if (!child.userData) {
          child.userData = {};
        }
        
        const objectType = child.userData.type || this.getObjectType(child);
        
        if (!typeCounts[objectType]) {
          typeCounts[objectType] = 0;
        }
        typeCounts[objectType]++;
        
        let objectName = child.name || child.userData.name;
        if (!objectName) {
          if (child.isCamera) {
            objectName = `${objectType}_${typeCounts[objectType]}`;
          } else if (child.isLight) {
            objectName = `${objectType}_${typeCounts[objectType]}`;
          } else if (child.isGroup) {
            objectName = `${objectType}_${typeCounts[objectType]}`;
          } else {
            objectName = `${objectType}_${typeCounts[objectType]}`;
          }
        }
        
        const isScriptObject = child.userData.createdBy === 'ScriptScene';
        
        child.userData = {
          ...child.userData,
          id: ++this.objectCounter,
          type: objectType,
          name: objectName,
          editorId: false,
          isScriptObject: isScriptObject
        };
        
        if (!child.name) {
          child.name = objectName;
        }
        
        this.knownObjects.add(child.uuid);
        
        // 递归处理嵌套的Group
        if (child.isGroup) {
          this.processGroupChildren(child, typeCounts);
        }
      }
    });
  }

  getObjectType(object) {
    // 检查组类型
    if (object.isGroup) {
      return 'group';
    }
    
    // 检查相机类型
    if (object.isCamera) {
      if (object.isPerspectiveCamera) return 'perspective_camera';
      if (object.isOrthographicCamera) return 'orthographic_camera';
      return 'camera';
    }
    
    // 检查光源类型
    if (object.isLight) {
      if (object.isDirectionalLight) return 'directional_light';
      if (object.isPointLight) return 'point_light';
      if (object.isSpotLight) return 'spot_light';
      if (object.isAmbientLight) return 'ambient_light';
      if (object.isHemisphereLight) return 'hemisphere_light';
      return 'light';
    }
    
    // 检查几何体对象
    if (!object.geometry) return 'mesh';
    
    const geometryType = object.geometry.type;
    
    // 根据几何体类型映射到简化的类型名
    const typeMap = {
      'BoxGeometry': 'box',
      'BoxBufferGeometry': 'box',
      'SphereGeometry': 'sphere', 
      'SphereBufferGeometry': 'sphere',
      'CylinderGeometry': 'cylinder',
      'CylinderBufferGeometry': 'cylinder',
      'PlaneGeometry': 'plane',
      'PlaneBufferGeometry': 'plane',
      'ConeGeometry': 'cone',
      'ConeBufferGeometry': 'cone',
      'TorusGeometry': 'torus',
      'TorusBufferGeometry': 'torus',
      'IcosahedronGeometry': 'icosahedron',
      'IcosahedronBufferGeometry': 'icosahedron',
      'OctahedronGeometry': 'octahedron',
      'OctahedronBufferGeometry': 'octahedron',
      'TetrahedronGeometry': 'tetrahedron',
      'TetrahedronBufferGeometry': 'tetrahedron',
      'RingGeometry': 'ring',
      'RingBufferGeometry': 'ring',
      'CircleGeometry': 'circle',
      'CircleBufferGeometry': 'circle'
    };
    
    return typeMap[geometryType] || 'mesh';
  }

  addGrid() {
    // 检查是否已经有网格了
    const existingGrid = this.scene.children.find(child => child.isGridHelper);
    if (!existingGrid) {
      const gridHelper = new THREE.GridHelper(20, 20);
      gridHelper.material.opacity = 1.8;
      gridHelper.material.transparent = true;
      gridHelper.position.y = -0.1; // 稍微降低一点避免z-fighting
      this.scene.add(gridHelper);
      this.gridHelper = gridHelper;
    } else {
      this.gridHelper = existingGrid;
    }

    // 场景相机模式下默认隐藏
    if (this.isUsingSceneOutput && this.gridHelper) {
      this.gridHelper.visible = false;
    }
  }

  addObject(type) {
    let geometry, material, mesh;
    
    switch(type) {
      case 'box':
        geometry = new THREE.BoxGeometry(1, 1, 1);
        break;
      case 'sphere':
        geometry = new THREE.SphereGeometry(0.5, 32, 16);
        break;
      case 'cylinder':
        geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 32);
        break;
      case 'plane':
        geometry = new THREE.PlaneGeometry(2, 2);
        break;
      default:
        geometry = new THREE.BoxGeometry(1, 1, 1);
    }

    material = new THREE.MeshLambertMaterial({ 
      color: Math.random() * 0xffffff 
    });
    
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(
      (Math.random() - 0.5) * 4,
      0.5,
      (Math.random() - 0.5) * 4
    );
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    // 计算该类型的下一个编号
    const existingObjectsOfType = this.scene.children.filter(child => 
      child.userData && child.userData.type === type
    );
    const nextNumber = existingObjectsOfType.length + 1;
    
    // 添加用户数据
    mesh.userData = {
      id: ++this.objectCounter,
      type: type,
      name: `${type}_${nextNumber}`,
      editorId: true
    };

    this.scene.add(mesh);
    this.updateSceneHierarchy();
    this.updateSceneStats();
  }

  selectObject(object) {
    // 取消之前的选择
    if (this.selectedObject) {
      this.removeSelectionHelper();
    }

    this.selectedObject = object;
    
    if (object) {
      // 将变换控制器附加到选中的对象上
      if (this.transformControls) {
        this.transformControls.attach(object);
        // 根据当前模式设置控制器
        this.transformControls.setMode(this.transformMode);
      }
      
      this.addSelectionHelper(object);
      this.updatePropertiesPanel(object);
      this.updateTransformInputs(object);
      this.updateStatusBar(object);
      
      // 记录初始变换状态
      this.recordTransformState(object);
      
      // 在场景层级中选中对应的对象
      this.selectObjectInHierarchy(object);
    } else {
      // 移除变换控制器
      if (this.transformControls) {
        this.transformControls.detach();
      }
      
      this.clearPropertiesPanel();
      this.updateStatusBar(null);
      this.lastTransformState = null;
      
      // 清除场景层级中的选择状态
      this.clearHierarchySelection();
    }
  }

  selectObjectInHierarchy(object) {
    // 清除之前的选择状态
    this.clearHierarchySelection();
    
    // 首先确保对象在层级中可见（如果在Group内）
    this.ensureObjectVisibleInHierarchy(object);
    
    // 查找并选中对应的层级项目
    setTimeout(() => {
      const hierarchyItems = document.querySelectorAll('.hierarchy-item');
      let targetItem = null;
      
      hierarchyItems.forEach(item => {
        if (item.dataset.objectUuid === object.uuid) {
          targetItem = item;
        }
      });
      
      if (targetItem) {
        targetItem.classList.add('selected');
        
        // 滚动到可见区域
        targetItem.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'nearest' 
        });
      }
    }, 20);
  }

  clearHierarchySelection() {
    document.querySelectorAll('.hierarchy-item').forEach(el => {
      el.classList.remove('selected');
    });
  }

  ensureObjectVisibleInHierarchy(object) {
    // 查找对象的父Group链
    const findParentGroups = (obj) => {
      const parents = [];
      
      // 遍历场景中的所有Group，找到包含此对象的Group
      const searchInGroup = (group, targetObj) => {
        if (group.isGroup) {
          if (group.children.includes(targetObj)) {
            parents.unshift(group);
            return true;
          }
          
          for (let child of group.children) {
            if (searchInGroup(child, targetObj)) {
              parents.unshift(group);
              return true;
            }
          }
        }
        return false;
      };
      
      this.scene.children.forEach(child => {
        searchInGroup(child, obj);
      });
      
      return parents;
    };
    
    const parentGroups = findParentGroups(object);
    let needsRebuild = false;
    
    // 展开所有父Group
    parentGroups.forEach(group => {
      if (!this.expandedGroups.has(group.uuid)) {
        this.expandedGroups.add(group.uuid);
        needsRebuild = true;
      }
    });
    
    // 如果有父Group被展开，重新构建层级显示
    if (needsRebuild) {
      // 暂时清除选中对象，避免递归调用
      const tempSelected = this.selectedObject;
      this.selectedObject = null;
      
      this.updateSceneHierarchy();
      
      // 恢复选中对象
      this.selectedObject = tempSelected;
    }
  }

  recordTransformState(object) {
    if (object) {
      this.lastTransformState = {
        position: object.position.clone(),
        rotation: object.rotation.clone(),
        scale: object.scale.clone()
      };
    }
  }

  checkTransformChanges() {
    if (!this.selectedObject || !this.lastTransformState || this.isUserEditing) {
      return;
    }

    const obj = this.selectedObject;
    const last = this.lastTransformState;
    let hasChanged = false;
    
    // 检查位置变化
    if (!obj.position.equals(last.position)) {
      this.updateTransformInput('posX', obj.position.x.toFixed(2));
      this.updateTransformInput('posY', obj.position.y.toFixed(2));
      this.updateTransformInput('posZ', obj.position.z.toFixed(2));
      last.position.copy(obj.position);
      hasChanged = true;
    }
    
    // 检查旋转变化 (转换为度数)
    if (!obj.rotation.equals(last.rotation)) {
      this.updateTransformInput('rotX', (obj.rotation.x * 180 / Math.PI).toFixed(1));
      this.updateTransformInput('rotY', (obj.rotation.y * 180 / Math.PI).toFixed(1));
      this.updateTransformInput('rotZ', (obj.rotation.z * 180 / Math.PI).toFixed(1));
      last.rotation.copy(obj.rotation);
      hasChanged = true;
    }
    
    // 检查缩放变化
    if (!obj.scale.equals(last.scale)) {
      this.updateTransformInput('scaleX', obj.scale.x.toFixed(2));
      this.updateTransformInput('scaleY', obj.scale.y.toFixed(2));
      this.updateTransformInput('scaleZ', obj.scale.z.toFixed(2));
      last.scale.copy(obj.scale);
      hasChanged = true;
    }

    // 如果有任何变换发生变化，更新选择框
    if (hasChanged) {
      this.updateSelectionHelper();
    }
  }

  updateTransformInput(id, value) {
    const input = document.getElementById(id);
    if (input && input.value !== value) {
      input.value = value;
      
      // 添加视觉反馈，显示数值已更新
      input.classList.add('value-updated');
      setTimeout(() => {
        input.classList.remove('value-updated');
      }, 200);
    }
  }

  addSelectionHelper(object) {
    // 创建线框显示选中状态
    const wireframe = new THREE.WireframeGeometry(object.geometry);
    const line = new THREE.LineSegments(wireframe);
    line.material.color.setHex(0x007acc);
    line.position.copy(object.position);
    line.rotation.copy(object.rotation);
    line.scale.copy(object.scale);
    
    this.selectionHelper = line;
    this.scene.add(line);
  }

  removeSelectionHelper() {
    if (this.selectionHelper) {
      this.scene.remove(this.selectionHelper);
      this.selectionHelper = null;
    }
  }

  updateSceneHierarchy() {
    const hierarchy = document.getElementById('sceneHierarchy');
    hierarchy.innerHTML = '';

    // 显示所有有用户数据的可编辑对象（包括网格、相机、光源和组），但排除浏览相机
    this.scene.children.forEach(child => {
      if (child.userData && child.userData.name && 
          (child.isMesh || child.isCamera || child.isLight || child.isGroup) &&
          !child.userData.isBrowserCamera) { // 排除浏览相机
        this.createHierarchyItem(child, hierarchy, 0);
      }
    });
    
    // 如果有选中的对象，确保在重建后保持选中状态
    if (this.selectedObject) {
      // 使用 setTimeout 确保DOM更新完成后再设置选中状态
      setTimeout(() => {
        this.selectObjectInHierarchy(this.selectedObject);
      }, 10);
    }
  }

  createHierarchyItem(object, container, depth) {
    const item = document.createElement('div');
    item.className = 'hierarchy-item';
    item.style.paddingLeft = `${depth * 20}px`; // 根据深度设置缩进
    
    // 添加数据属性以便识别对象
    item.dataset.objectUuid = object.uuid;
    
    const objectType = object.userData.type || 'mesh';
    const objectName = object.userData.name || object.name || 'unnamed';
    
    // 根据对象类型选择图标
    const iconClass = this.getObjectIcon(objectType);
    
    // 为不同类型的对象添加不同的样式类
    let nameClass = '';
    if (object.userData.editorId === true) {
      nameClass = 'user-object'; // 用户手动添加的对象
    } else if (object.userData.isScriptObject) {
      nameClass = 'script-object'; // ScriptScene创建的对象
    } else if (object.isCamera) {
      nameClass = 'camera-object'; // 相机对象
    } else if (object.isLight) {
      nameClass = 'light-object'; // 光源对象
    } else if (object.isGroup) {
      nameClass = 'group-object'; // 组对象
    } else {
      nameClass = 'original-object'; // 原始场景对象
    }
    
    // 为ScriptScene对象添加特殊图标
    let specialIcon = '';
    if (object.userData.isScriptObject) {
      specialIcon = '<i class="fas fa-cog script-icon" title="ScriptScene对象"></i>';
    } else if (object.isCamera) {
      specialIcon = '<i class="fas fa-eye camera-icon" title="相机对象"></i>';
    } else if (object.isLight) {
      specialIcon = '<i class="fas fa-star light-icon" title="光源对象"></i>';
    }
    
    // 如果是Group且有子对象，添加展开/折叠按钮
    let expandButton = '';
    const hasChildren = object.isGroup && object.children.length > 0 && 
                       object.children.some(child => (child.isMesh || child.isCamera || child.isLight || child.isGroup) && child.userData && child.userData.name);
    
    if (hasChildren) {
      const isExpanded = this.expandedGroups.has(object.uuid);
      expandButton = `<i class="fas ${isExpanded ? 'fa-chevron-down' : 'fa-chevron-right'} expand-icon" style="margin-right: 5px; cursor: pointer; color: #666;"></i>`;
    } else if (object.isGroup) {
      expandButton = '<span style="margin-right: 16px;"></span>'; // 占位符，保持对齐
    }
    
    item.innerHTML = `
      ${expandButton}
      <i class="${iconClass}"></i>
      <span class="${nameClass}">${objectName}</span>
      ${specialIcon}
    `;
    
    // 为非Group对象绑定选择事件
    if (!object.isGroup) {
      item.addEventListener('click', (e) => {
        e.stopPropagation(); // 防止事件冒泡
        // 直接选择对象，selectObject方法会处理层级选择
        this.selectObject(object);
      });
    } else {
      // Group对象只能展开/折叠，不能选择编辑
      item.style.cursor = hasChildren ? 'pointer' : 'default';
      if (hasChildren) {
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          this.toggleGroupExpansion(object);
        });
      }
      
      // 为Group添加特殊样式
      item.style.fontWeight = 'bold';
      item.style.color = '#4CAF50';
    }

    // 检查当前对象是否被选中
    if (this.selectedObject && this.selectedObject.uuid === object.uuid) {
      item.classList.add('selected');
    }

    container.appendChild(item);
    
    // 如果是展开的Group，递归显示子对象
    if (object.isGroup && this.expandedGroups.has(object.uuid)) {
      object.children.forEach(child => {
        if (child.userData && child.userData.name && (child.isMesh || child.isCamera || child.isLight || child.isGroup)) {
          this.createHierarchyItem(child, container, depth + 1);
        }
      });
    }
  }

  toggleGroupExpansion(group) {
    if (this.expandedGroups.has(group.uuid)) {
      this.expandedGroups.delete(group.uuid);
    } else {
      this.expandedGroups.add(group.uuid);
    }
    
    // 重新构建场景层级显示
    this.updateSceneHierarchy();
  }

  getObjectIcon(type) {
    const iconMap = {
      // 组图标
      'group': 'fas fa-folder',
      
      // 几何体图标
      'box': 'fas fa-cube',
      'sphere': 'fas fa-circle',
      'cylinder': 'fas fa-database',
      'plane': 'fas fa-square',
      'cone': 'fas fa-play',
      'torus': 'fas fa-ring',
      'icosahedron': 'fas fa-gem',
      'octahedron': 'fas fa-gem',
      'tetrahedron': 'fas fa-caret-up',
      'ring': 'fas fa-dot-circle',
      'circle': 'fas fa-circle-o',
      'mesh': 'fas fa-object-group',
      
      // 相机图标
      'camera': 'fas fa-video',
      'perspective_camera': 'fas fa-video',
      'orthographic_camera': 'fas fa-video',
      
      // 光源图标
      'light': 'fas fa-lightbulb',
      'directional_light': 'fas fa-sun',
      'point_light': 'fas fa-lightbulb',
      'spot_light': 'fas fa-search',
      'ambient_light': 'fas fa-globe',
      'hemisphere_light': 'fas fa-adjust'
    };
    
    return iconMap[type] || 'fas fa-cube';
  }

  updatePropertiesPanel(object) {
    const panel = document.getElementById('propertiesPanel');
    const materialEditor = document.getElementById('materialEditor').parentElement; // 获取材质编辑器的父容器
    const objectName = object.userData.name || object.name || 'unnamed';
    const objectType = object.userData.type || 'mesh';
    const objectId = object.userData.id || 'unknown';
    const isScriptObject = object.userData.isScriptObject || false;
    
    // 根据对象类型决定是否显示材质编辑面板
    if (object.isCamera || object.isLight || object.isGroup) {
      // 隐藏材质编辑面板
      materialEditor.style.display = 'none';
    } else {
      // 显示材质编辑面板（对于网格对象）
      materialEditor.style.display = 'block';
    }
    
    let specialInfo = '';
    if (object.isCamera) {
      specialInfo = `
        <div class="property-item camera-info">
          <label style="color: #2196F3;"><i class="fas fa-video"></i> 相机对象</label>
          <span style="color: #64B5F6; font-size: 12px;">场景视图控制器</span>
        </div>
      `;
    } else if (object.isLight) {
      specialInfo = `
        <div class="property-item light-info">
          <label style="color: #FFC107;"><i class="fas fa-lightbulb"></i> 光源对象</label>
          <span style="color: #FFD54F; font-size: 12px;">场景照明系统</span>
        </div>
      `;
    } else if (object.isGroup) {
      const childCount = object.children.length;
      specialInfo = `
        <div class="property-item group-info">
          <label style="color: #4CAF50;"><i class="fas fa-folder"></i> 组对象</label>
          <span style="color: #81C784; font-size: 12px;">包含 ${childCount} 个子对象</span>
        </div>
        <div class="property-item">
          <label style="color: #FF9800;">注意:</label>
          <span style="color: #FFA726; font-size: 12px;">组对象仅支持查看，不支持编辑</span>
        </div>
      `;
    } else if (isScriptObject) {
      specialInfo = `
        <div class="property-item script-info">
          <label style="color: #FF9800;"><i class="fas fa-cog"></i> ScriptScene对象</label>
          <span style="color: #FFC107; font-size: 12px;">此对象由脚本Scene创建</span>
        </div>
      `;
    }
    
    // 为不同类型的对象生成不同的属性面板
    let typeSpecificProperties = '';
    
    if (object.isCamera) {
      typeSpecificProperties = this.getCameraProperties(object);
    } else if (object.isLight) {
      typeSpecificProperties = this.getLightProperties(object);
    } else if (object.isGroup) {
      typeSpecificProperties = this.getGroupProperties(object);
    }
    
    panel.innerHTML = `
      <div class="property-group">
        <h4>基本信息</h4>
        <div class="property-item">
          <label>名称:</label>
          ${object.isGroup ? `<span>${objectName}</span>` : `<input type="text" id="objectName" value="${objectName}">`}
        </div>
        <div class="property-item">
          <label>类型:</label>
          <span>${objectType}</span>
        </div>
        <div class="property-item">
          <label>ID:</label>
          <span>${objectId}</span>
        </div>
        ${specialInfo}
      </div>
      ${typeSpecificProperties}
    `;

    // 只为非Group对象绑定名称修改事件
    if (!object.isGroup) {
      const nameInput = document.getElementById('objectName');
      if (nameInput) {
        nameInput.addEventListener('change', (e) => {
          object.userData.name = e.target.value;
          object.name = e.target.value;
          this.updateSceneHierarchy();
        });
      }
    }

    // 更新材质编辑器的颜色值（仅对网格对象）
    if (object.isMesh && object.material && object.material.color) {
      const colorPicker = document.getElementById('materialColor');
      if (colorPicker) {
        colorPicker.value = '#' + object.material.color.getHexString();
      }
    }
    
    // 绑定类型特定的事件
    if (object.isCamera) {
      this.bindCameraEvents(object);
    } else if (object.isLight) {
      this.bindLightEvents(object);
    }
  }

  clearPropertiesPanel() {
    const panel = document.getElementById('propertiesPanel');
    const materialEditor = document.getElementById('materialEditor').parentElement; // 获取材质编辑器的父容器
    
    // 隐藏材质编辑面板
    materialEditor.style.display = 'none';
    
    panel.innerHTML = `
      <div class="no-selection">
        <p>请选择一个对象</p>
      </div>
    `;
  }

  updateTransformInputs(object) {
    // 更新位置输入框
    document.getElementById('posX').value = object.position.x.toFixed(2);
    document.getElementById('posY').value = object.position.y.toFixed(2);
    document.getElementById('posZ').value = object.position.z.toFixed(2);

    // 更新旋转输入框 (转换为度数)
    document.getElementById('rotX').value = (object.rotation.x * 180 / Math.PI).toFixed(1);
    document.getElementById('rotY').value = (object.rotation.y * 180 / Math.PI).toFixed(1);
    document.getElementById('rotZ').value = (object.rotation.z * 180 / Math.PI).toFixed(1);

    // 更新缩放输入框
    document.getElementById('scaleX').value = object.scale.x.toFixed(2);
    document.getElementById('scaleY').value = object.scale.y.toFixed(2);
    document.getElementById('scaleZ').value = object.scale.z.toFixed(2);
  }

  updateSceneStats() {
    let objectCount = 0;
    let cameraCount = 0;
    let lightCount = 0;
    let groupCount = 0;
    let triangleCount = 0;

    // 递归统计所有对象，包括Group内的对象
    const countObjects = (object) => {
      if (object.isMesh) {
        objectCount++;
        if (object.geometry) {
          triangleCount += object.geometry.attributes.position.count / 3;
        }
      } else if (object.isCamera) {
        cameraCount++;
      } else if (object.isLight) {
        lightCount++;
      } else if (object.isGroup) {
        groupCount++;
        // 递归计算Group内的对象
        object.children.forEach(child => {
          countObjects(child);
        });
      }
    };

    this.scene.children.forEach(child => {
      countObjects(child);
    });

    document.getElementById('sceneStats').textContent = 
      `对象: ${objectCount} | 相机: ${cameraCount} | 光源: ${lightCount} | 组: ${groupCount} | 三角形: ${Math.floor(triangleCount)}`;
  }

  updateStatusBar(object) {
    const statusInfo = document.getElementById('selectedObjectInfo');
    if (object) {
      const objectName = object.userData.name || object.name || 'unnamed';
      statusInfo.textContent = `已选择: ${objectName}`;
    } else {
      statusInfo.textContent = '未选择对象';
    }
  }

  bindEvents() {
    // 对象库按钮事件
    document.querySelectorAll('.object-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.getAttribute('data-type');
        if (type === 'light' || type === 'camera') {
          console.log('光源和相机功能待实现');
          return;
        }
        this.addObject(type);
      });
    });

    // 变换模式切换
    document.querySelectorAll('.transform-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-mode');
        this.setTransformMode(mode);
      });
    });

    // 视图控制按钮事件
    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.getAttribute('data-view');
        this.setCameraView(view);
        
        // 更新按钮状态
        document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // 变换输入框事件
    this.bindTransformInputs();

    // 材质编辑器事件
    this.bindMaterialEvents();

    // 鼠标点击选择对象
    this.renderer.domElement.addEventListener('click', (event) => {
      this.onCanvasClick(event);
    });

    // 工具栏按钮事件
    document.getElementById('newScene').addEventListener('click', () => {
      this.clearUserObjects();
    });

    document.getElementById('saveScene').addEventListener('click', () => {
      this.saveScene();
    });

    document.getElementById('loadScene').addEventListener('click', () => {
      this.loadScene();
    });

    // 播放/暂停按钮事件
    document.getElementById('playBtn').addEventListener('click', () => {
      this.togglePlayPause();
    });

    // 键盘快捷键：空格键播放/暂停
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
        e.preventDefault();
        this.togglePlayPause();
      }
    });

    // 处理窗口大小调整
    window.addEventListener('resize', () => this.onWindowResize());
  }

  bindTransformInputs() {
    // 位置输入框
    ['posX', 'posY', 'posZ'].forEach(id => {
      const input = document.getElementById(id);
      
      // 监听焦点事件，标记用户正在编辑
      input.addEventListener('focus', () => {
        this.isUserEditing = true;
      });
      
      input.addEventListener('blur', () => {
        this.isUserEditing = false;
        // 失去焦点后立即更新选择框和记录状态
        this.updateSelectionHelper();
        if (this.selectedObject) {
          this.recordTransformState(this.selectedObject);
        }
      });
      
      // 监听回车键
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          input.blur(); // 触发blur事件
        }
      });
      
      input.addEventListener('change', (e) => {
        if (this.selectedObject) {
          const axis = id.replace('pos', '').toLowerCase();
          const value = parseFloat(e.target.value);
          if (!isNaN(value)) {
            this.selectedObject.position[axis] = value;
            
            // 如果是ScriptScene对象，同时更新其物理体位置
            this.updatePhysicsBodyPosition(this.selectedObject, axis, value);
            
            this.updateSelectionHelper();
            this.recordTransformState(this.selectedObject);
          }
        }
      });
      
      // 添加input事件以实时更新
      input.addEventListener('input', (e) => {
        if (this.selectedObject) {
          const value = parseFloat(e.target.value);
          if (!isNaN(value)) {
            const axis = id.replace('pos', '').toLowerCase();
            this.selectedObject.position[axis] = value;
            
            // 如果是ScriptScene对象，同时更新其物理体位置
            this.updatePhysicsBodyPosition(this.selectedObject, axis, value);
            
            // 立即更新选择框
            this.updateSelectionHelper();
            // 强制渲染一帧以显示变化
            this.renderer.render(this.scene, this.camera);
          }
        }
      });
    });

    // 旋转输入框
    ['rotX', 'rotY', 'rotZ'].forEach(id => {
      const input = document.getElementById(id);
      
      input.addEventListener('focus', () => {
        this.isUserEditing = true;
      });
      
      input.addEventListener('blur', () => {
        this.isUserEditing = false;
        // 失去焦点后立即更新选择框和记录状态
        this.updateSelectionHelper();
        if (this.selectedObject) {
          this.recordTransformState(this.selectedObject);
        }
      });
      
      // 监听回车键
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          input.blur(); // 触发blur事件
        }
      });
      
      input.addEventListener('change', (e) => {
        if (this.selectedObject) {
          const axis = id.replace('rot', '').toLowerCase();
          const value = parseFloat(e.target.value);
          if (!isNaN(value)) {
            this.selectedObject.rotation[axis] = value * Math.PI / 180;
            this.updateSelectionHelper();
            this.recordTransformState(this.selectedObject);
          }
        }
      });
      
      // 添加input事件以实时更新
      input.addEventListener('input', (e) => {
        if (this.selectedObject) {
          const value = parseFloat(e.target.value);
          if (!isNaN(value)) {
            const axis = id.replace('rot', '').toLowerCase();
            this.selectedObject.rotation[axis] = value * Math.PI / 180;
            // 立即更新选择框
            this.updateSelectionHelper();
            // 强制渲染一帧以显示变化
            this.renderer.render(this.scene, this.camera);
          }
        }
      });
    });

    // 缩放输入框
    ['scaleX', 'scaleY', 'scaleZ'].forEach(id => {
      const input = document.getElementById(id);
      
      input.addEventListener('focus', () => {
        this.isUserEditing = true;
      });
      
      input.addEventListener('blur', () => {
        this.isUserEditing = false;
        // 失去焦点后立即更新选择框和记录状态
        this.updateSelectionHelper();
        if (this.selectedObject) {
          this.recordTransformState(this.selectedObject);
        }
      });
      
      // 监听回车键
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          input.blur(); // 触发blur事件
        }
      });
      
      input.addEventListener('change', (e) => {
        if (this.selectedObject) {
          const axis = id.replace('scale', '').toLowerCase();
          const value = parseFloat(e.target.value);
          if (!isNaN(value) && value > 0) { // 确保缩放值为正数
            this.selectedObject.scale[axis] = value;
            this.updateSelectionHelper();
            this.recordTransformState(this.selectedObject);
          }
        }
      });
      
      // 添加input事件以实时更新
      input.addEventListener('input', (e) => {
        if (this.selectedObject) {
          const value = parseFloat(e.target.value);
          if (!isNaN(value) && value > 0) { // 确保缩放值为正数
            const axis = id.replace('scale', '').toLowerCase();
            this.selectedObject.scale[axis] = value;
            // 立即更新选择框
            this.updateSelectionHelper();
            // 强制渲染一帧以显示变化
            this.renderer.render(this.scene, this.camera);
          }
        }
      });
    });
  }

  bindMaterialEvents() {
    // 颜色改变
    document.getElementById('materialColor').addEventListener('change', (e) => {
      if (this.selectedObject && this.selectedObject.material && this.selectedObject.material.color) {
        this.selectedObject.material.color.setHex(e.target.value.replace('#', '0x'));
        // 立即渲染以显示颜色变化
        this.renderer.render(this.scene, this.camera);
      }
    });

    // 添加颜色实时预览
    document.getElementById('materialColor').addEventListener('input', (e) => {
      if (this.selectedObject && this.selectedObject.material && this.selectedObject.material.color) {
        this.selectedObject.material.color.setHex(e.target.value.replace('#', '0x'));
        // 立即渲染以显示颜色变化
        this.renderer.render(this.scene, this.camera);
      }
    });

    // 粗糙度和金属度
    ['materialRoughness', 'materialMetalness'].forEach(id => {
      const input = document.getElementById(id);
      
      // change事件
      input.addEventListener('change', (e) => {
        const value = parseFloat(e.target.value);
        const display = input.nextElementSibling;
        display.textContent = value.toFixed(2);
        
        if (this.selectedObject && this.selectedObject.material) {
          const property = id.replace('material', '').toLowerCase();
          if (this.selectedObject.material[property] !== undefined) {
            this.selectedObject.material[property] = value;
            // 立即渲染以显示材质变化
            this.renderer.render(this.scene, this.camera);
          }
        }
      });
      
      // input事件 - 实时预览
      input.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        const display = input.nextElementSibling;
        display.textContent = value.toFixed(2);
        
        if (this.selectedObject && this.selectedObject.material) {
          const property = id.replace('material', '').toLowerCase();
          if (this.selectedObject.material[property] !== undefined) {
            this.selectedObject.material[property] = value;
            // 立即渲染以显示材质变化
            this.renderer.render(this.scene, this.camera);
          }
        }
      });
    });
  }

  updateSelectionHelper() {
    if (this.selectedObject && this.selectionHelper) {
      // 确保选择框的变换与对象完全同步
      this.selectionHelper.position.copy(this.selectedObject.position);
      this.selectionHelper.rotation.copy(this.selectedObject.rotation);
      this.selectionHelper.scale.copy(this.selectedObject.scale);
      
      // 强制更新矩阵，确保变换立即生效
      this.selectionHelper.updateMatrix();
      this.selectionHelper.updateMatrixWorld(true);
      
      // 确保对象本身的矩阵也更新
      this.selectedObject.updateMatrix();
      this.selectedObject.updateMatrixWorld(true);
    }
  }

  onCanvasClick(event) {
    event.preventDefault();
    
    const rect = this.renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this.camera);

    // 选择所有有用户数据的可编辑对象（包括网格、相机和光源，但排除Group和浏览相机）
    const selectableObjects = this.scene.children.filter(child => 
      (child.isMesh || child.isCamera || child.isLight) && 
      child.userData && child.userData.name && 
      !child.isGroup &&
      !child.userData.isBrowserCamera // 排除浏览相机
    );

    // 递归收集所有Group内的可选择对象
    const collectSelectableFromGroups = (objects, result = []) => {
      objects.forEach(obj => {
        if (obj.isGroup) {
          collectSelectableFromGroups(obj.children, result);
        } else if ((obj.isMesh || obj.isCamera || obj.isLight) && 
                   obj.userData && obj.userData.name &&
                   !obj.userData.isBrowserCamera) { // 排除浏览相机
          result.push(obj);
        }
      });
      return result;
    };

    const allSelectableObjects = [...selectableObjects, ...collectSelectableFromGroups(this.scene.children)];

    const intersects = raycaster.intersectObjects(allSelectableObjects);

    if (intersects.length > 0) {
      this.selectObject(intersects[0].object);
    } else {
      this.selectObject(null);
    }
  }

  onWindowResize() {
    const container = document.getElementById('canvasContainer');
    const size = Math.min(container.clientWidth, container.clientHeight);

    // 强制相机为正方形视口
    this.camera.aspect = 1;
    this.camera.updateProjectionMatrix();

    // 同步浏览相机纵横比
    if (this.browserCamera && this.browserCamera !== this.camera) {
      this.browserCamera.aspect = 1;
      this.browserCamera.updateProjectionMatrix();
    }

    // 设置渲染器为正方形（像素）
    this.renderer.setSize(size, size);
    const canvas = this.renderer.domElement;
    if (canvas) {
      canvas.style.width = size + 'px';
      canvas.style.height = size + 'px';
    }

    // 同步后处理尺寸
    if (this.sceneInstance && this.sceneInstance.composer) {
      this.sceneInstance.composer.setSize(size, size);
    }
  }

  clearUserObjects() {
    // 清除所有用户添加的对象，保留原始场景
    const objectsToRemove = [];
    this.scene.children.forEach(child => {
      if (child.userData && child.userData.editorId) {
        objectsToRemove.push(child);
      }
    });
    
    objectsToRemove.forEach(object => {
      this.scene.remove(object);
    });

    this.selectObject(null);
    this.updateSceneHierarchy();
    this.updateSceneStats();
  }

  saveScene() {
    const sceneData = {
      objects: []
    };

    this.scene.children.forEach(child => {
      if (child.isMesh && child.userData && child.userData.name) {
        const objectData = {
          type: child.userData.type || 'mesh',
          name: child.userData.name || child.name || 'unnamed',
          position: child.position.toArray(),
          rotation: child.rotation.toArray(),
          scale: child.scale.toArray(),
          isOriginal: !child.userData.editorId // 标记是否为原始对象
        };

        // 安全地获取颜色
        if (child.material && child.material.color && typeof child.material.color.getHexString === 'function') {
          objectData.color = '#' + child.material.color.getHexString();
        } else {
          objectData.color = '#ffffff'; // 默认白色
        }

        sceneData.objects.push(objectData);
      }
    });

    const dataStr = JSON.stringify(sceneData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = 'scene.json';
    link.click();
  }

  loadScene() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const sceneData = JSON.parse(e.target.result);
            this.clearUserObjects();
            
            sceneData.objects.forEach(objData => {
              this.addObject(objData.type);
              const objects = this.scene.children.filter(child => 
                child.userData && child.userData.editorId
              );
              const newObject = objects[objects.length - 1];
              
              if (newObject) {
                newObject.userData.name = objData.name;
                newObject.name = objData.name;
                newObject.position.fromArray(objData.position);
                newObject.rotation.fromArray(objData.rotation);
                newObject.scale.fromArray(objData.scale);
                
                // 安全地设置颜色
                if (newObject.material && newObject.material.color && objData.color) {
                  newObject.material.color.setHex(objData.color.replace('#', '0x'));
                }
              }
            });
            
            this.updateSceneHierarchy();
            this.updateSceneStats();
          } catch (error) {
            console.error('加载场景失败:', error);
            alert('加载场景文件失败，请检查文件格式。');
          }
        };
        reader.readAsText(file);
      }
    };
    
    input.click();
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    
    // 更新轨道控制器（仅在漫游相机模式下）
    if (this.controls && !this.isUsingSceneOutput) {
      this.controls.update();
    }
    
    // 更新场景输出跟随
    this.updateSceneOutputFollowing();
    
    // 定期检测新对象（每30帧检测一次，避免性能影响）
    if (!this.frameCounter) this.frameCounter = 0;
    this.frameCounter++;
    if (this.frameCounter % 30 === 0) {
      this.detectNewObjects();
    }
    
    // 检查选中对象的变换变化
    this.checkTransformChanges();
    
    // 确保选择框跟随对象（主要处理原始场景中可能存在的动画对象）
    if (this.selectedObject && this.selectionHelper && !this.isUserEditing) {
      // 检查选择框是否需要更新（避免每帧都更新）
      if (!this.selectionHelper.position.equals(this.selectedObject.position) ||
          !this.selectionHelper.rotation.equals(this.selectedObject.rotation) ||
          !this.selectionHelper.scale.equals(this.selectedObject.scale)) {
        this.updateSelectionHelper();
      }
    }
    
    // 更新FPS计数器
    this.updateFPS();
    
    // 更新时间轴
    this.updateTimeline();
    
    // 根据模式选择渲染方式
    if (this.isUsingSceneOutput && this.sceneInstance && typeof this.sceneInstance.update === 'function') {
      // 场景输出模式：使用ScriptScene的完整渲染（包含后处理效果）
      this.sceneInstance.update();
    } else {
      // 漫游相机模式：使用编辑器直接渲染
      this.renderer.render(this.scene, this.camera);
    }
  }

  updateFPS() {
    // 简单的FPS计算
    if (!this.lastTime) this.lastTime = performance.now();
    if (!this.frameCount) this.frameCount = 0;
    
    this.frameCount++;
    const currentTime = performance.now();
    
    if (currentTime - this.lastTime >= 1000) {
      const fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
      document.getElementById('fpsCounter').textContent = `FPS: ${fps}`;
      
      this.frameCount = 0;
      this.lastTime = currentTime;
    }
  }

  /**
   * 更新后处理管道中的相机引用
   * @param {THREE.Camera} camera - 要设置的相机
   */
  updatePostProcessingCamera(camera) {
    if (this.sceneInstance && this.sceneInstance.usePostProcessing && 
        this.sceneInstance.composer && this.sceneInstance.renderPass) {
      // 确保composer使用当前活动的相机
      this.sceneInstance.renderPass.camera = camera;
    }
  }

  // 动态检测新创建的对象
  detectNewObjects() {
    let hasNewObjects = false;
    const typeCounts = {};
    
    // 先统计已知对象的类型数量
    this.scene.children.forEach(child => {
      this.countObjectTypes(child, typeCounts);
    });
    
    this.scene.children.forEach(child => {
      if (this.processNewObject(child, typeCounts)) {
        hasNewObjects = true;
      }
    });
    
    if (hasNewObjects) {
      this.updateSceneHierarchy();
      this.updateSceneStats();
    }
  }

  countObjectTypes(object, typeCounts) {
    if ((object.isMesh || object.isCamera || object.isLight || object.isGroup) && object.userData && object.userData.type) {
      const type = object.userData.type;
      if (!typeCounts[type]) {
        typeCounts[type] = 0;
      }
      typeCounts[type]++;
    }
    
    // 递归处理Group中的对象
    if (object.isGroup) {
      object.children.forEach(child => {
        this.countObjectTypes(child, typeCounts);
      });
    }
  }

  processNewObject(object, typeCounts) {
    let hasNewObjects = false;
    
    if ((object.isMesh || object.isCamera || object.isLight || object.isGroup) && 
        !this.knownObjects.has(object.uuid) &&
        !object.userData.isBrowserCamera) { // 排除浏览相机
      // 发现新对象
      if (!object.userData) {
        object.userData = {};
      }
      
      // 如果对象没有编辑器数据，为其添加
      if (!object.userData.editorId && object.userData.editorId !== false) {
        // 优先使用已有的type，否则从对象类型推断
        const objectType = object.userData.type || this.getObjectType(object);
        
        // 优先使用已有的name
        let objectName = object.name || object.userData.name;
        
        // 如果没有名称，才生成一个
        if (!objectName) {
          // 为新对象生成编号
          if (!typeCounts[objectType]) {
            typeCounts[objectType] = 0;
          }
          typeCounts[objectType]++;
          
          // 根据对象类型生成名称
          if (object.isCamera) {
            objectName = `camera_${typeCounts[objectType]}`;
          } else if (object.isLight) {
            objectName = `light_${typeCounts[objectType]}`;
          } else if (object.isGroup) {
            objectName = `group_${typeCounts[objectType]}`;
          } else if (objectType === 'sphere' && object.material && object.material.transparent) {
            objectName = `ball_${typeCounts[objectType]}`;
          } else if (objectType === 'box' && object.material) {
            objectName = `border_${typeCounts[objectType]}`;
          } else {
            objectName = `${objectType}_${typeCounts[objectType]}`;
          }
        }
        
        // 检查是否是ScriptScene创建的对象
        const isScriptObject = object.userData.createdBy === 'ScriptScene';
        
        object.userData = {
          ...object.userData,
          id: ++this.objectCounter,
          type: objectType,
          name: objectName,
          editorId: false, // 标记为场景对象，不是用户手动添加的
          isScriptObject: isScriptObject
        };
        
        // 同步name属性
        if (!object.name) {
          object.name = objectName;
        }
        
        this.knownObjects.add(object.uuid);
        hasNewObjects = true;
      }
    }
    
    // 递归处理Group中的新对象
    if (object.isGroup) {
      object.children.forEach(child => {
        if (this.processNewObject(child, typeCounts)) {
          hasNewObjects = true;
        }
      });
    }
    
    return hasNewObjects;
  }

  // 获取相机特定属性
  getCameraProperties(camera) {
    let properties = `
      <div class="property-group">
        <h4>相机属性</h4>
    `;
    
    if (camera.isPerspectiveCamera) {
      properties += `
        <div class="property-item">
          <label>视场角 (FOV):</label>
          <input type="range" id="cameraFov" min="10" max="120" value="${camera.fov}" step="1">
          <span class="value-display">${camera.fov}°</span>
        </div>
        <div class="property-item">
          <label>近平面:</label>
          <input type="number" id="cameraNear" value="${camera.near}" step="0.1" min="0.1">
        </div>
        <div class="property-item">
          <label>远平面:</label>
          <input type="number" id="cameraFar" value="${camera.far}" step="1" min="1">
        }
      `;
    } else if (camera.isOrthographicCamera) {
      properties += `
        <div class="property-item">
          <label>左边界:</label>
          <input type="number" id="cameraLeft" value="${camera.left}" step="1">
        </div>
        <div class="property-item">
          <label>右边界:</label>
          <input type="number" id="cameraRight" value="${camera.right}" step="1">
        </div>
        <div class="property-item">
          <label>上边界:</label>
          <input type="number" id="cameraTop" value="${camera.top}" step="1">
        </div>
        <div class="property-item">
          <label>下边界:</label>
          <input type="number" id="cameraBottom" value="${camera.bottom}" step="1">
        </div>
      `;
    }
    
    properties += `</div>`;
    return properties;
  }

  // 获取光源特定属性
  getLightProperties(light) {
    let properties = `
      <div class="property-group">
        <h4>光源属性</h4>
        <div class="property-item">
          <label>颜色:</label>
          <input type="color" id="lightColor" value="#${light.color.getHexString()}">
        </div>
        <div class="property-item">
          <label>强度:</label>
          <input type="range" id="lightIntensity" min="0" max="5" value="${light.intensity}" step="0.1">
          <span class="value-display">${light.intensity.toFixed(1)}</span>
        </div>
    `;
    
    // 根据光源类型添加特定属性
    if (light.isDirectionalLight) {
      properties += `
        <div class="property-item">
          <label>投射阴影:</label>
          <input type="checkbox" id="lightCastShadow" ${light.castShadow ? 'checked' : ''}>
        </div>
      `;
    } else if (light.isPointLight) {
      properties += `
        <div class="property-item">
          <label>距离:</label>
          <input type="number" id="lightDistance" value="${light.distance}" step="1" min="0">
        </div>
        <div class="property-item">
          <label>衰减:</label>
          <input type="range" id="lightDecay" min="0" max="5" value="${light.decay}" step="0.1">
          <span class="value-display">${light.decay.toFixed(1)}</span>
        </div>
      `;
    } else if (light.isSpotLight) {
      properties += `
        <div class="property-item">
          <label>距离:</label>
          <input type="number" id="lightDistance" value="${light.distance}" step="1" min="0">
        </div>
        <div class="property-item">
          <label>角度:</label>
          <input type="range" id="lightAngle" min="0" max="1.57" value="${light.angle}" step="0.01">
          <span class="value-display">${(light.angle * 180 / Math.PI).toFixed(1)}°</span>
        </div>
        <div class="property-item">
          <label>半影:</label>
          <input type="range" id="lightPenumbra" min="0" max="1" value="${light.penumbra}" step="0.01">
          <span class="value-display">${light.penumbra.toFixed(2)}</span>
        </div>
      `;
    }
    
    properties += `</div>`;
    return properties;
  }

  // 获取组特定属性
  getGroupProperties(group) {
    let properties = `
      <div class="property-group">
        <h4>组信息</h4>
        <div class="property-item">
          <label>子对象数量:</label>
          <span>${group.children.length}</span>
        </div>
    `;
    
    // 显示子对象类型统计
    const childTypes = {};
    group.children.forEach(child => {
      const type = child.userData?.type || this.getObjectType(child);
      childTypes[type] = (childTypes[type] || 0) + 1;
    });
    
    if (Object.keys(childTypes).length > 0) {
      properties += `
        <div class="property-item">
          <label>子对象类型:</label>
          <div style="margin-top: 5px;">
      `;
      
      Object.entries(childTypes).forEach(([type, count]) => {
        const icon = this.getObjectIcon(type);
        properties += `
          <div style="display: flex; align-items: center; margin: 2px 0;">
            <i class="${icon}" style="margin-right: 8px; color: #666;"></i>
            <span>${type}: ${count}个</span>
          </div>
        `;
      });
      
      properties += `
          </div>
        </div>
      `;
    }
    
    properties += `</div>`;
    return properties;
  }

  // 绑定相机事件
  bindCameraEvents(camera) {
    // FOV控制（透视相机）
    const fovInput = document.getElementById('cameraFov');
    if (fovInput && camera.isPerspectiveCamera) {
      fovInput.addEventListener('input', (e) => {
        camera.fov = parseFloat(e.target.value);
        camera.updateProjectionMatrix();
        e.target.nextElementSibling.textContent = camera.fov + '°';
      });
    }

    // 近远平面控制
    const nearInput = document.getElementById('cameraNear');
    const farInput = document.getElementById('cameraFar');
    
    if (nearInput) {
      nearInput.addEventListener('change', (e) => {
        camera.near = parseFloat(e.target.value);
        camera.updateProjectionMatrix();
      });
    }
    
    if (farInput) {
      farInput.addEventListener('change', (e) => {
        camera.far = parseFloat(e.target.value);
        camera.updateProjectionMatrix();
      });
    }

    // 正交相机边界控制
    ['cameraLeft', 'cameraRight', 'cameraTop', 'cameraBottom'].forEach(id => {
      const input = document.getElementById(id);
      if (input && camera.isOrthographicCamera) {
        input.addEventListener('change', (e) => {
          const property = id.replace('camera', '').toLowerCase();
          camera[property] = parseFloat(e.target.value);
          camera.updateProjectionMatrix();
        });
      }
    });
  }

  // 绑定光源事件
  bindLightEvents(light) {
    // 颜色控制
    const colorInput = document.getElementById('lightColor');
    if (colorInput) {
      colorInput.addEventListener('change', (e) => {
        light.color.setHex(e.target.value.replace('#', '0x'));
      });
    }

    // 强度控制
    const intensityInput = document.getElementById('lightIntensity');
    if (intensityInput) {
      intensityInput.addEventListener('input', (e) => {
        light.intensity = parseFloat(e.target.value);
        e.target.nextElementSibling.textContent = light.intensity.toFixed(1);
      });
    }

    // 投射阴影控制
    const castShadowInput = document.getElementById('lightCastShadow');
    if (castShadowInput) {
      castShadowInput.addEventListener('change', (e) => {
        light.castShadow = e.target.checked;
      });
    }

    // 距离控制
    const distanceInput = document.getElementById('lightDistance');
    if (distanceInput) {
      distanceInput.addEventListener('change', (e) => {
        light.distance = parseFloat(e.target.value);
      });
    }

    // 衰减控制
    const decayInput = document.getElementById('lightDecay');
    if (decayInput) {
      decayInput.addEventListener('input', (e) => {
        light.decay = parseFloat(e.target.value);
        e.target.nextElementSibling.textContent = light.decay.toFixed(1);
      });
    }

    // 聚光灯角度控制
    const angleInput = document.getElementById('lightAngle');
    if (angleInput) {
      angleInput.addEventListener('input', (e) => {
        light.angle = parseFloat(e.target.value);
        e.target.nextElementSibling.textContent = (light.angle * 180 / Math.PI).toFixed(1) + '°';
      });
    }

    // 聚光灯半影控制
    const penumbraInput = document.getElementById('lightPenumbra');
    if (penumbraInput) {
      penumbraInput.addEventListener('input', (e) => {
        light.penumbra = parseFloat(e.target.value);
        e.target.nextElementSibling.textContent = light.penumbra.toFixed(2);
      });
    }
  }

  setCameraView(view) {
    // 定义不同视角的相机位置和目标
    const viewConfigs = {
      perspective: {
        position: new THREE.Vector3(10, 10, 10),
        target: new THREE.Vector3(0, 0, 0),
        up: new THREE.Vector3(0, 1, 0)
      },
      top: {
        position: new THREE.Vector3(0, 20, 0),
        target: new THREE.Vector3(0, 0, 0),
        up: new THREE.Vector3(0, 0, -1)
      },
      front: {
        position: new THREE.Vector3(0, 5, 15),
        target: new THREE.Vector3(0, 0, 0),
        up: new THREE.Vector3(0, 1, 0)
      },
      side: {
        position: new THREE.Vector3(15, 5, 0),
        target: new THREE.Vector3(0, 0, 0),
        up: new THREE.Vector3(0, 1, 0)
      },
      scene: {
        // 使用场景原始相机的视角（场景输出模式下的视角）
        position: this.originalSceneCamera ? this.originalSceneCamera.position.clone() : new THREE.Vector3(0, 0, 5),
        target: new THREE.Vector3(0, 0, 0), // 场景中心
        up: this.originalSceneCamera ? this.originalSceneCamera.up.clone() : new THREE.Vector3(0, 1, 0)
      }
    };

    const config = viewConfigs[view];
    if (!config) return;

    // 如果是场景视角，提供特殊提示
    if (view === 'scene') {
      console.log('切换到场景输出视角');
      if (this.originalSceneCamera) {
        // 复制原始相机的完整状态
        config.position = this.originalSceneCamera.position.clone();
        
        // 尝试获取原始相机的朝向
        const direction = new THREE.Vector3();
        this.originalSceneCamera.getWorldDirection(direction);
        config.target = this.originalSceneCamera.position.clone().add(direction.multiplyScalar(10));
        config.up = this.originalSceneCamera.up.clone();
      }
    }

    // 平滑动画到新位置
    this.animateCameraTo(config.position, config.target, config.up);
  }

  animateCameraTo(targetPosition, targetLookAt, targetUp) {
    // 保存当前相机状态
    const startPosition = this.camera.position.clone();
    const startTarget = this.controls.target.clone();
    const startUp = this.camera.up.clone();

    // 动画参数
    const duration = 1000; // 1秒
    const startTime = performance.now();

    // 自定义动画函数
    const animateCamera = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // 使用缓动函数（ease-in-out）
      const eased = progress < 0.5 
        ? 2 * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      // 插值相机位置
      this.camera.position.lerpVectors(startPosition, targetPosition, eased);
      
      // 插值目标位置
      this.controls.target.lerpVectors(startTarget, targetLookAt, eased);
      
      // 插值上方向
      this.camera.up.lerpVectors(startUp, targetUp, eased);
      
      // 更新控制器
      this.controls.update();

      // 如果动画未完成，继续下一帧
      if (progress < 1) {
        requestAnimationFrame(animateCamera);
      } else {
        // 确保最终状态正确
        this.camera.position.copy(targetPosition);
        this.controls.target.copy(targetLookAt);
        this.camera.up.copy(targetUp);
        this.controls.update();
      }
    };

    // 开始动画
    requestAnimationFrame(animateCamera);
  }
  
  // 初始化相机切换功能
  initCameraToggle() {
    const toggle = document.getElementById('cameraToggle');
    const modeText = document.getElementById('cameraModeText');
    
    if (!toggle || !modeText) {
      console.warn('相机开关元素未找到');
      return;
    }
    
    // 设置初始状态：false = 场景输出, true = 漫游相机
    toggle.checked = !this.isUsingSceneOutput; // 当前是场景输出时，开关为false
    this.updateCameraModeText(modeText);
    
    // 绑定切换事件
    toggle.addEventListener('change', (e) => {
      const useRoamingCamera = e.target.checked;
      this.switchCameraMode(!useRoamingCamera);
      this.updateCameraModeText(modeText);
    });
  }
  
  // 切换相机模式
  switchCameraMode(useSceneOutput) {
    this.isUsingSceneOutput = useSceneOutput;
    
    if (useSceneOutput && this.originalSceneCamera) {
      // 切换到场景输出模式
      this.switchToSceneOutput();
    } else {
      // 切换到漫游相机模式
      this.switchToBrowserCamera();
    }
  }
  
  // 切换到场景输出模式
  switchToSceneOutput() {
    if (!this.originalSceneCamera) {
      console.warn('场景相机不可用');
      return;
    }
    
    // 保存浏览相机的状态
    if (this.controls) {
      this.controls.enabled = false;
    }
    
    // 使用场景相机
    this.camera = this.originalSceneCamera;
    this.sceneOutputFollowing = true;
    
    // 重新设置控制器（如果需要的话）
    if (this.controls) {
      this.controls.object = this.camera;
      this.controls.enabled = false; // 场景输出模式下禁用手动控制
    }
    
    // 更新变换控制器
    if (this.transformControls) {
      this.transformControls.camera = this.camera;
    }
    
    // 更新后处理管道中的相机引用
    this.updatePostProcessingCamera(this.camera);
    
    console.log('已切换到场景输出模式');

    // 场景相机模式：隐藏调试辅助
    this.setDebugHelpersVisible(false);
  }
  
  // 切换到漫游相机模式
  switchToBrowserCamera() {
    if (!this.browserCamera) {
      console.warn('浏览相机不可用');
      return;
    }
    
    // 使用浏览相机
    this.camera = this.browserCamera;
    this.sceneOutputFollowing = false;
    
    // 重新设置控制器
    if (this.controls) {
      this.controls.object = this.camera;
      this.controls.enabled = true; // 漫游相机模式下启用手动控制
    }
    
    // 更新变换控制器
    if (this.transformControls) {
      this.transformControls.camera = this.camera;
    }
    
    // 更新后处理管道中的相机引用
    this.updatePostProcessingCamera(this.camera);
    
    console.log('已切换到漫游相机模式');

    // 漫游相机模式：显示调试辅助
    this.setDebugHelpersVisible(true);
  }
  
  // 更新相机模式文本
  updateCameraModeText(textElement) {
    if (textElement) {
      textElement.textContent = this.isUsingSceneOutput ? '场景相机' : '漫游相机';
    }
  }

  // 显示/隐藏调试辅助（网格、坐标轴、变换控件、选择辅助）
  setDebugHelpersVisible(visible) {
    // 网格
    if (!this.gridHelper) {
      this.gridHelper = this.scene.children.find(child => child.isGridHelper);
    }
    if (this.gridHelper) {
      this.gridHelper.visible = visible;
    }

    // 坐标轴（可能存在于调试模块中）
    this.scene.children.forEach(child => {
      if (child.isAxesHelper) {
        child.visible = visible;
      }
    });

    // 变换控件
    if (this.transformControls) {
      this.transformControls.visible = visible && !this.isUsingSceneOutput ? true : visible;
      if (this.isUsingSceneOutput && !visible) {
        this.transformControls.detach();
      }
    }

    // 选中辅助线框
    if (this.selectionHelper) {
      this.selectionHelper.visible = visible && !this.isUsingSceneOutput;
    }
  }
  
  // 更新场景输出跟随（在animate循环中调用）
  updateSceneOutputFollowing() {
    if (this.sceneOutputFollowing && this.originalSceneCamera && this.camera === this.originalSceneCamera) {
      // 场景输出模式下，相机变换由原始场景控制
      // 这里可以添加额外的同步逻辑，如果需要的话
    }
  }
  
  // 更新物理体位置（用于同步ScriptScene对象的物理体）
  updatePhysicsBodyPosition(object, axis, value) {
    if (!object.userData.isScriptObject || !this.sceneInstance) {
      return;
    }
    
    // 查找对应的物理体并同步位置
    let physicsBody = null;
    
    if (this.sceneInstance.sceneObjects && this.sceneInstance.sceneObjects.balls) {
      const ballData = this.sceneInstance.sceneObjects.balls.find(ball => ball.mesh === object);
      if (ballData) {
        physicsBody = ballData.body;
      }
    }
    
    if (this.sceneInstance.sceneObjects && this.sceneInstance.sceneObjects.borders) {
      const borderData = this.sceneInstance.sceneObjects.borders.find(border => border.mesh === object);
      if (borderData) {
        physicsBody = borderData.body;
      }
    }
    
    if (physicsBody) {
      physicsBody.position[axis] = value;
      // 清零速度，避免物理引擎立即改变位置
      physicsBody.velocity.set(0, 0, 0);
      physicsBody.angularVelocity.set(0, 0, 0);
    }
  }
  
  // 初始化时间轴
  initTimeline() {
    // 获取时间轴DOM元素
    this.timelineElements.currentTime = document.getElementById('timelineCurrentTime');
    this.timelineElements.duration = document.getElementById('timelineDuration');
    this.timelineElements.progress = document.getElementById('timelineProgress');
    this.timelineElements.cursor = document.getElementById('timelineCursor');
    this.timelineElements.container = document.querySelector('.timeline-container');
    
    console.log('[Timeline] 初始化元素状态:', {
      currentTime: !!this.timelineElements.currentTime,
      duration: !!this.timelineElements.duration,
      progress: !!this.timelineElements.progress,
      cursor: !!this.timelineElements.cursor,
      container: !!this.timelineElements.container
    });
    
    if (!this.timelineElements.currentTime) {
      console.warn('时间轴元素未找到');
      return;
    }
    
    // 确保游标初始状态正确
    if (this.timelineElements.cursor) {
      this.timelineElements.cursor.style.display = 'block';
      this.timelineElements.cursor.style.visibility = 'visible';
      this.timelineElements.cursor.style.opacity = '1';
      this.timelineElements.cursor.style.left = '0%';
      console.log('[Timeline] 游标元素已初始化');
    } else {
      console.error('[Timeline] 游标元素获取失败');
    }
    
    // 初始化时间轴标记
    this.createTimelineMarkers();
    
    // 设置总时长显示
    if (typeof window.getTotalDuration === 'function') {
      const duration = window.getTotalDuration();
      this.timelineElements.duration.textContent = this.formatTime(duration);
    }
    
    // 绑定时间轴拖拽事件
    this.bindTimelineDragEvents();
    
    // 初始化播放按钮状态
    this.initializePlayButtonState();
    
    console.log('[Editor] 时间轴已初始化');
  }
  
  // 创建时间轴标记
  createTimelineMarkers() {
    const markersContainer = document.querySelector('.timeline-markers');
    if (!markersContainer) return;
    
    markersContainer.innerHTML = '';
    
    // 获取总时长
    const totalDuration = typeof window.getTotalDuration === 'function' ? window.getTotalDuration() : 3000;
    
    // 创建时间标记 (每0.5秒一个标记)
    const markerInterval = 500; // 0.5秒间隔
    const markerCount = Math.floor(totalDuration / markerInterval) + 1;
    
    for (let i = 0; i < markerCount; i++) {
      const time = i * markerInterval;
      const isMajor = i % 2 === 0; // 每1秒一个主要标记
      
      const marker = document.createElement('div');
      marker.className = 'timeline-marker';
      
      const line = document.createElement('div');
      line.className = `timeline-marker-line ${isMajor ? 'major' : ''}`;
      
      const text = document.createElement('div');
      text.className = 'timeline-marker-text';
      text.textContent = this.formatTime(time);
      
      marker.appendChild(line);
      if (isMajor) {
        marker.appendChild(text);
      }
      
      markersContainer.appendChild(marker);
    }
  }
  
  // 更新时间轴
  updateTimeline() {
    if (!this.timelineElements.currentTime || typeof window.getCurrentAnimationTime !== 'function') {
      return;
    }
    
    const currentTime = window.getCurrentAnimationTime();
    const totalDuration = typeof window.getTotalDuration === 'function' ? window.getTotalDuration() : 3000;
    const progress = Math.min((currentTime / totalDuration) * 100, 100);
    
    // 更新时间显示
    this.timelineElements.currentTime.textContent = this.formatTime(currentTime);
    
    // 更新进度条
    if (this.timelineElements.progress) {
      this.timelineElements.progress.style.width = progress + '%';
    }
    
    // 更新游标位置
    if (this.timelineElements.cursor) {
      this.timelineElements.cursor.style.left = progress + '%';
      // 确保游标可见
      this.timelineElements.cursor.style.display = 'block';
      this.timelineElements.cursor.style.visibility = 'visible';
      this.timelineElements.cursor.style.opacity = '1';
      
      // 调试信息 - 每秒打印一次
      if (!this.lastDebugTime) this.lastDebugTime = 0;
      if (currentTime - this.lastDebugTime > 1000) {
        console.log('[Timeline] 游标位置更新:', {
          progress: progress.toFixed(1) + '%',
          currentTime: this.formatTime(currentTime),
          element: this.timelineElements.cursor,
          visible: this.timelineElements.cursor.offsetWidth > 0
        });
        this.lastDebugTime = currentTime;
      }
    } else {
      console.warn('[Timeline] 游标元素未找到');
    }
    
    // 更新容器状态
    if (this.timelineElements.container) {
      const isPaused = typeof window.isAnimationPaused === 'function' ? window.isAnimationPaused() : false;
      const isPlaying = !isPaused && currentTime < totalDuration;
      this.timelineElements.container.classList.toggle('playing', isPlaying);
      
      // 同步播放按钮状态
      this.updatePlayButton(isPaused);
    }
  }
  
  // 格式化时间显示
  formatTime(milliseconds) {
    const seconds = milliseconds / 1000;
    return seconds.toFixed(2) + 's';
  }
  
  // 播放/暂停切换
  togglePlayPause() {
    if (typeof window.isAnimationPaused !== 'function') {
      console.warn('时间控制API不可用');
      return;
    }
    
    const isPaused = window.isAnimationPaused();
    const playBtn = document.getElementById('playBtn');
    const playIcon = playBtn.querySelector('i');
    
    if (isPaused) {
      // 当前暂停，点击播放
      if (typeof window.playAnimation === 'function') {
        window.playAnimation();
        playIcon.className = 'fas fa-pause';
        playBtn.title = '暂停';
        console.log('[Editor] 动画播放');
      }
    } else {
      // 当前播放，点击暂停
      if (typeof window.pauseAnimation === 'function') {
        window.pauseAnimation();
        playIcon.className = 'fas fa-play';
        playBtn.title = '播放';
        console.log('[Editor] 动画暂停');
      }
    }
  }
  
  // 绑定时间轴拖拽事件
  bindTimelineDragEvents() {
    const timelineBackground = document.querySelector('.timeline-background');
    if (!timelineBackground) return;
    
    // 鼠标按下事件
    timelineBackground.addEventListener('mousedown', (e) => {
      this.startTimelineDrag(e);
    });
    
    // 鼠标移动事件（全局）
    document.addEventListener('mousemove', (e) => {
      this.handleTimelineDrag(e);
    });
    
    // 鼠标释放事件（全局）
    document.addEventListener('mouseup', (e) => {
      this.endTimelineDrag(e);
    });
    
    // 点击时间轴直接跳转
    timelineBackground.addEventListener('click', (e) => {
      if (!this.timelineInteraction.isDragging) {
        this.seekToPosition(e);
      }
    });
  }
  
  // 开始拖拽时间轴
  startTimelineDrag(e) {
    this.timelineInteraction.isDragging = true;
    this.timelineInteraction.timelineRect = e.currentTarget.getBoundingClientRect();
    
    // 自动暂停动画
    if (typeof window.pauseAnimation === 'function' && typeof window.isAnimationPaused === 'function') {
      if (!window.isAnimationPaused()) {
        window.pauseAnimation();
        this.updatePlayButton(true); // 更新按钮为暂停状态
      }
    }
    
    // 立即跳转到点击位置
    this.seekToPosition(e);
    
    e.preventDefault();
  }
  
  // 处理拖拽移动
  handleTimelineDrag(e) {
    if (!this.timelineInteraction.isDragging) return;
    
    this.seekToPosition(e);
    e.preventDefault();
  }
  
  // 结束拖拽
  endTimelineDrag(e) {
    if (!this.timelineInteraction.isDragging) return;
    
    this.timelineInteraction.isDragging = false;
    this.timelineInteraction.timelineRect = null;
    
    console.log('[Editor] 时间轴拖拽结束');
  }
  
  // 跳转到指定位置
  seekToPosition(e) {
    if (!this.timelineInteraction.timelineRect) {
      this.timelineInteraction.timelineRect = document.querySelector('.timeline-background').getBoundingClientRect();
    }
    
    const rect = this.timelineInteraction.timelineRect;
    const x = e.clientX - rect.left;
    const progress = Math.max(0, Math.min(1, x / rect.width));
    
    const totalDuration = typeof window.getTotalDuration === 'function' ? window.getTotalDuration() : 3000;
    const targetTime = progress * totalDuration;
    
    // 跳转到指定时间
    if (typeof window.seekToTime === 'function') {
      window.seekToTime(targetTime);
      console.log('[Editor] 跳转到时间:', this.formatTime(targetTime));
    }
  }
  
  // 更新播放按钮状态
  updatePlayButton(isPaused) {
    const playBtn = document.getElementById('playBtn');
    const playIcon = playBtn.querySelector('i');
    
    if (isPaused) {
      playIcon.className = 'fas fa-play';
      playBtn.title = '播放';
    } else {
      playIcon.className = 'fas fa-pause';
      playBtn.title = '暂停';
    }
  }
  
  // 初始化播放按钮状态
  initializePlayButtonState() {
    // 延迟一点确保 window API 已经加载
    setTimeout(() => {
      if (typeof window.isAnimationPaused === 'function') {
        const isPaused = window.isAnimationPaused();
        this.updatePlayButton(isPaused);
        console.log('[Editor] 播放按钮状态已初始化:', isPaused ? '暂停' : '播放');
      } else {
        // 默认状态：动画开始时是播放状态
        this.updatePlayButton(false);
        console.log('[Editor] 播放按钮状态已设置为默认播放状态');
      }
    }, 100);
  }
}

// 当页面加载完成后初始化编辑器
document.addEventListener('DOMContentLoaded', () => {
  window.editor = new ThreeEditor();
}); 