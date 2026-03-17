/**
 * ThreeJS 到 AMG 的包装器
 * 让基于ThreeJS开发的应用能够在AMG引擎上运行
 * 此包装器将ThreeJS的API转换为AMG引擎的调用，实现无缝迁移
 */

// 获取AMG引擎API
const effect_api = "undefined" != typeof effect ? effect : "undefined" != typeof tt ? tt : "undefined" != typeof lynx ? lynx : {};
const Amaz = effect_api.getAmaz ? effect_api.getAmaz() : null;

// 全局场景实例，可被所有组件访问
let currentScene = null;

/**
 * 获取当前场景实例
 * @returns {Object} 当前场景实例
 */
function getCurrentScene() {
  if (!currentScene) {
    console.warn('Scene实例尚未创建');
  }
  return currentScene;
}

// 模拟浏览器环境中的window对象，使ThreeJS代码能在非浏览器环境中运行
if (typeof window === 'undefined') {
  // 定义模拟的window对象
  const mockWindow = {
    innerWidth: 720,
    innerHeight: 1280,
    devicePixelRatio: 1,
    addEventListener: function(event, callback) {
      // 空函数，模拟事件监听
    },
    requestAnimationFrame: function(callback) {
      // 空实现
      // 在实际环境中应该取消动画帧请求
    },
    cancelAnimationFrame: function(id) {
      // 空实现
      // 在实际环境中应该取消动画帧请求
    },
    removeEventListener: function(event, callback) {
      // 空实现
      // 在实际环境中应该取消事件监听
    }
  };
  
  // 定义模拟的document对象
  const mockDocument = {
    createElement: function(tagName) {
      return {
        style: {},
        setAttribute: function() {},
        appendChild: function() {}
      };
    },
    body: {
      appendChild: function() {}
    }
  };
  
  // 获取全局对象的通用方法
  const getGlobalObject = function() {
    if (typeof global !== 'undefined') return global;
    if (typeof self !== 'undefined') return self;
    if (typeof window !== 'undefined') return window;
    if (typeof this !== 'undefined') return this;
    return {}; // 回退选项
  };
  
  // 将模拟对象挂载到全局
  const globalObj = getGlobalObject();
  globalObj.window = mockWindow;
  globalObj.document = mockDocument;
  globalObj.cancelAnimationFrame = mockWindow.cancelAnimationFrame;
}

// 定义命名空间对象，类似于THREE
const THREE = {};

// 常量定义
THREE.FrontSide = 0;
THREE.BackSide = 1;
THREE.DoubleSide = 2;
THREE.NoBlending = 0;
THREE.NormalBlending = 1;
THREE.AdditiveBlending = 2;
THREE.SubtractiveBlending = 3;
THREE.MultiplyBlending = 4;
THREE.CustomBlending = 5;
THREE.RepeatWrapping = 1000;
THREE.ClampToEdgeWrapping = 1001;
THREE.MirroredRepeatWrapping = 1002;

/**
 * 二维向量类
 * 表示2D空间中的点或方向
 */
class Vector2 {
  /**
   * 创建二维向量
   * @param {number} [x=0] - X坐标
   * @param {number} [y=0] - Y坐标
   */
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  /**
   * 设置向量的x和y值
   * @param {number} x - 新的X坐标
   * @param {number} y - 新的Y坐标
   * @returns {Vector2} 当前向量实例，支持链式调用
   */
  set(x, y) {
    this.x = x;
    this.y = y;
    return this;
  }

  /**
   * 转换为AMG向量格式
   * @returns {Amaz.Vector2f} AMG引擎兼容的二维向量
   */
  toAMGVector2() {
    return new Amaz.Vector2f(this.x, this.y);
  }


  copy(v) {
    this.x = v.x;
    this.y = v.y;
    return this;
  }

  lerpVectors(vec1, vec2, t) {
    this.x = vec1.x + (vec2.x - vec1.x) * t;
    this.y = vec1.y + (vec2.y - vec1.y) * t;
    return this;
  }

  clone() {
    return new Vector2(this.x, this.y);
  }

}

/**
 * 三维向量类
 * 表示3D空间中的点、方向或尺寸
 */
class Vector3 {
  /**
   * 创建三维向量
   * @param {number} [x=0] - X坐标
   * @param {number} [y=0] - Y坐标
   * @param {number} [z=0] - Z坐标
   */
  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  /**
   * 设置向量的x、y和z值
   * @param {number} x - 新的X坐标
   * @param {number} y - 新的Y坐标
   * @param {number} z - 新的Z坐标
   * @returns {Vector3} 当前向量实例，支持链式调用
   */
  set(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  }

  /**
   * 创建向量的一个副本
   * @returns {Vector3} 新的向量实例，包含相同的x、y、z值
   */
  clone() {
    return new Vector3(this.x, this.y, this.z);
  }

  /**
   * 计算向量的长度（模）
   * @returns {number} 向量的长度
   */
  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  /**
   * 将向量归一化为单位向量（长度为1）
   * @returns {Vector3} 归一化后的向量实例，支持链式调用
   */
  normalize() {
    const length = this.length();
    if (length > 0) {
      this.x /= length;
      this.y /= length;
      this.z /= length;
    }
    return this;
  }

  /**
   * 将向量的每个分量乘以一个标量值
   * @param {number} scalar - 乘数
   * @returns {Vector3} 当前向量实例，支持链式调用
   */
  multiplyScalar(scalar) {
    this.x *= scalar;
    this.y *= scalar;
    this.z *= scalar;
    return this;
  }

  /**
   * 将另一个向量的分量添加到当前向量
   * @param {Vector3} v - 要添加的向量
   * @returns {Vector3} 当前向量实例，支持链式调用
   */
  add(v) {
    this.x += v.x;
    this.y += v.y;
    this.z += v.z;
    return this;
  }

  /**
   * 计算当前向量与另一个向量的点积
   * @param {Vector3} v - 要计算点积的向量
   * @returns {number} 两个向量的点积
   */
  dot(v) {
    return this.x * v.x + this.y * v.y + this.z * v.z;
  }

  /**
   * 从当前向量中减去另一个向量
   * @param {Vector3} v - 要减去的向量
   * @returns {Vector3} 当前向量实例，支持链式调用
   */
  sub(v) {
    this.x -= v.x;
    this.y -= v.y;
    this.z -= v.z;
    return this;
  }

  /**
   * 将另一个向量的值复制到当前向量
   * @param {Vector3} v - 要复制的向量
   * @returns {Vector3} 当前向量实例，支持链式调用
   */
  copy(v) {
    this.x = v.x;
    this.y = v.y;
    this.z = v.z;
    return this;
  }

  lerp(v, t) {
    this.x = this.x + (v.x - this.x) * t;
    this.y = this.y + (v.y - this.y) * t;
    this.z = this.z + (v.z - this.z) * t;
    return this;
  }

  lerpVectors(vec1, vec2, t)
  {
    this.x = vec1.x + (vec2.x - vec1.x) * t;
    this.y = vec1.y + (vec2.y - vec1.y) * t;
    this.z = vec1.z + (vec2.z - vec1.z) * t;
    return this;
  }


  applyQuaternion(quat){
    // 获取四元数的分量
    const qx = quat.x;
    const qy = quat.y;
    const qz = quat.z;
    const qw = quat.w;
    
    // 获取当前向量的分量
    const vx = this.x;
    const vy = this.y;
    const vz = this.z;
    
    // 计算四元数旋转后的新坐标
    // 使用四元数旋转公式：v' = q * v * q^(-1)
    const x = (qw * qw + qx * qx - qy * qy - qz * qz) * vx + 
              (2 * (qx * qy - qw * qz)) * vy + 
              (2 * (qx * qz + qw * qy)) * vz;
    
    const y = (2 * (qx * qy + qw * qz)) * vx + 
              (qw * qw - qx * qx + qy * qy - qz * qz) * vy + 
              (2 * (qy * qz - qw * qx)) * vz;
    
    const z = (2 * (qx * qz - qw * qy)) * vx + 
              (2 * (qy * qz + qw * qx)) * vy + 
              (qw * qw - qx * qx - qy * qy + qz * qz) * vz;
    
    // 更新当前向量的值
    this.x = x;
    this.y = y;
    this.z = z;
    
    // 返回当前向量引用，支持链式调用
    return this;
  }

  applyAxisAngle(vector, angle){
    const axis = vector.clone().normalize();
    const q = new Quaternion().setFromAxisAngle(axis, angle);
    this.applyQuaternion(q);
    return this;
  }

  /**
   * 将两个向量相加，结果存储在当前向量中
   * @param {Vector3} a - 第一个向量
   * @param {Vector3} b - 第二个向量
   * @returns {Vector3} 当前向量实例，支持链式调用
   */
  addVectors(a, b) {
    this.x = a.x + b.x;
    this.y = a.y + b.y;
    this.z = a.z + b.z;
    return this;
  }

  /**
   * 将两个向量相减，结果存储在当前向量中
   * @param {Vector3} a - 第一个向量
   * @param {Vector3} b - 第二个向量
   * @returns {Vector3} 当前向量实例，支持链式调用
   */
  subVectors(a, b) {
    this.x = a.x - b.x;
    this.y = a.y - b.y;
    this.z = a.z - b.z;
    return this;
  }

  /**
   * 转换为AMG向量格式
   * @returns {Amaz.Vector3f} AMG引擎兼容的三维向量
   */
  toAMGVector3() {
    return new Amaz.Vector3f(this.x, this.y, this.z);
  }
}

/**
 * 四维向量类
 * 表示4D空间中的点、方向或颜色（RGBA）
 */
class Vector4 {
  /**
   * 创建四维向量
   * @param {number} [x=0] - X坐标
   * @param {number} [y=0] - Y坐标
   * @param {number} [z=0] - Z坐标
   * @param {number} [w=0] - W坐标
   */
  constructor(x = 0, y = 0, z = 0, w = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
  }

  /**
   * 设置向量的x、y、z和w值
   * @param {number} x - 新的X坐标
   * @param {number} y - 新的Y坐标
   * @param {number} z - 新的Z坐标
   * @param {number} w - 新的W坐标
   * @returns {Vector4} 当前向量实例，支持链式调用
   */
  set(x, y, z, w) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
    return this;
  }

  /**
   * 创建向量的一个副本
   * @returns {Vector4} 新的向量实例，包含相同的x、y、z、w值
   */
  clone() {
    return new Vector4(this.x, this.y, this.z, this.w);
  }

  /**
   * 计算向量的长度（模）
   * @returns {number} 向量的长度
   */
  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
  }

  /**
   * 将向量归一化为单位向量（长度为1）
   * @returns {Vector4} 归一化后的向量实例，支持链式调用
   */
  normalize() {
    const length = this.length();
    if (length > 0) {
      this.x /= length;
      this.y /= length;
      this.z /= length;
      this.w /= length;
    }
    return this;
  }

  /**
   * 将向量的每个分量乘以一个标量值
   * @param {number} scalar - 乘数
   * @returns {Vector4} 当前向量实例，支持链式调用
   */
  multiplyScalar(scalar) {
    this.x *= scalar;
    this.y *= scalar;
    this.z *= scalar;
    this.w *= scalar;
    return this;
  }

  /**
   * 将另一个向量的分量添加到当前向量
   * @param {Vector4} v - 要添加的向量
   * @returns {Vector4} 当前向量实例，支持链式调用
   */
  add(v) {
    this.x += v.x;
    this.y += v.y;
    this.z += v.z;
    this.w += v.w;
    return this;
  }

  /**
   * 计算当前向量与另一个向量的点积
   * @param {Vector4} v - 要计算点积的向量
   * @returns {number} 两个向量的点积
   */
  dot(v) {
    return this.x * v.x + this.y * v.y + this.z * v.z + this.w * v.w;
  }

  /**
   * 从当前向量中减去另一个向量
   * @param {Vector4} v - 要减去的向量
   * @returns {Vector4} 当前向量实例，支持链式调用
   */
  sub(v) {
    this.x -= v.x;
    this.y -= v.y;
    this.z -= v.z;
    this.w -= v.w;
    return this;
  }

  /**
   * 将另一个向量的值复制到当前向量
   * @param {Vector4} v - 要复制的向量
   * @returns {Vector4} 当前向量实例，支持链式调用
   */
  copy(v) {
    this.x = v.x;
    this.y = v.y;
    this.z = v.z;
    this.w = v.w;
    return this;
  }

  /**
   * 转换为AMG向量格式
   * @returns {Amaz.Vector4f} AMG引擎兼容的四维向量
   */
  toAMGVector4() {
    return new Amaz.Vector4f(this.x, this.y, this.z, this.w);
  }
}

/**
 * 欧拉角类，表示物体在3D空间中的旋转
 * 通过绕x、y、z轴的旋转角度来表示方向
 */
class Euler {
  /**
   * 创建欧拉角
   * @param {number} [x=0] - 绕X轴的旋转角度（弧度）
   * @param {number} [y=0] - 绕Y轴的旋转角度（弧度）
   * @param {number} [z=0] - 绕Z轴的旋转角度（弧度）
   * @param {string} [order='XYZ'] - 旋转轴的应用顺序
   */
  constructor(x = 0, y = 0, z = 0, order = 'XYZ') {
    this.x = x;
    this.y = y;
    this.z = z;
    this.order = order;
  }

  /**
   * 设置欧拉角的x、y、z值和顺序
   * @param {number} x - 绕X轴的旋转角度（弧度）
   * @param {number} y - 绕Y轴的旋转角度（弧度）
   * @param {number} z - 绕Z轴的旋转角度（弧度）
   * @param {string} [order] - 旋转轴的应用顺序，可选
   * @returns {Euler} 当前欧拉角实例，支持链式调用
   */
  set(x, y, z, order) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.order = order || this.order;
    return this;
  }

  /**
   * 从方向向量计算欧拉角
   * 将从一个方向到另一个方向的旋转转换为欧拉角表示
   * 
   * @param {Vector3} vFrom - 起始单位向量（通常是Z轴方向[0,0,1]）
   * @param {Vector3} vTo - 目标单位向量
   * @returns {Euler} 返回当前欧拉角对象
   */
  setFromUnitVectors(vFrom, vTo) {
    // 确保输入向量是单位向量
    const from = vFrom.clone().normalize();
    const to = vTo.clone().normalize();
    
    // 计算俯仰角（X轴旋转）- pitch
    const pitch = Math.asin(to.y);
    
    // 计算偏航角（Y轴旋转）- yaw
    // 修正：根据数学原理，偏航角应该是z和x的反正切
    const yaw = Math.atan2(to.x, to.z);
    
    // 计算翻滚角（Z轴旋转）- roll
    // 在简单的朝向计算中，通常可以保持roll为0
    const roll = 0;
    
    // 设置欧拉角
    this.x = pitch;
    this.y = -yaw; // 取负号来匹配Three.js的坐标系统
    this.z = roll;
    
    return this;
  }

  setFromQuaternion(q, order) {
    this.x = q.x;
    this.y = q.y;
    this.z = q.z;
    this.order = order || this.order;
    return this;
  }

  clone() {
    return new Euler(this.x, this.y, this.z, this.order);
  }

}

/**
 * 颜色类
 */
class Color {
  constructor(r = 1, g = 1, b = 1) {
    this.r = r;
    this.g = g;
    this.b = b;
  }

  set(r, g, b) {
    this.r = r;
    this.g = g;
    this.b = b;
    return this;
  }

  setHex(hex) {
    hex = Math.floor(hex);
    this.r = (hex >> 16 & 255) / 255;
    this.g = (hex >> 8 & 255) / 255;
    this.b = (hex & 255) / 255;
    return this;
  }

  setRGB(r, g, b) {
    this.r = r;
    this.g = g;
    this.b = b;
    return this;
  }

  /**
   * 通过HSL设置颜色
   * @param {number} h - 色相 [0,1]
   * @param {number} s - 饱和度 [0,1]
   * @param {number} l - 亮度 [0,1]
   * @returns {Color} 当前实例
   */
  setHSL(h, s, l) {
    // HSL转RGB算法
    let r, g, b;
    if (s === 0) {
      r = g = b = l; // 灰色
    } else {
      const hue2rgb = function(p, q, t) {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    this.r = r;
    this.g = g;
    this.b = b;
    return this;
  }

  /**
   * 转换为AMG颜色格式
   * @returns {Object} AMG Vector4f对象
   */
  toAMGColor() {
    const color = new Amaz.Vector4f();
    color.x = this.r;
    color.y = this.g;
    color.z = this.b;
    color.w = 1.0;
    return color;
  }
}

/**
 * WebGL渲染器
 * 桥接ThreeJS的WebGLRenderer和AMG的渲染系统
 */
class WebGLRenderer {
  constructor(parameters = {}) {
    this.width = parameters.width || 800;
    this.height = parameters.height || 600;
    this.antialias = parameters.antialias || false;
    this.pixelRatio = 1;
    
    // 创建一个虚拟dom元素，兼容ThreeJS的API
    this.domElement = document.createElement('div');
    this.domElement.style.width = this.width + 'px';
    this.domElement.style.height = this.height + 'px';
    
    // 初始化AMG引擎
    // effect.Amaz.AmazingManager.init(this.width, this.height);
    
    console.log('AMG renderer initialized, size:', this.width, 'x', this.height);
  }

  setAnimationLoop(callback)
  {
    // Empty implementation
    // In actual environment, should set animation loop callback
    console.log('WebGLRenderer.setAnimationLoop: empty implementation');
  }
  
  /**
   * Set renderer size
   * @param {number} width - width
   * @param {number} height - height
   */
  setSize(width, height) {
    this.width = width;
    this.height = height;
    this.domElement.style.width = width + 'px';
    this.domElement.style.height = height + 'px';
    effect.Amaz.AmazingManager.resize(width, height);
  }
  
  /**
   * Set device pixel ratio
   * @param {number} ratio - pixel ratio
   */
  setPixelRatio(ratio) {
    this.pixelRatio = ratio;
  }
  
  /**
   * Render scene
   * @param {Scene} scene - scene object
   * @param {PerspectiveCamera} camera - camera object
   */
  render(scene, camera) {
    const amgScene = scene._amgScene;
    
    // Update scene
    // scene.update();
    
    // Use AMG rendering
    // effect.Amaz.AmazingManager.update(Date.now());
  }
  
  /**
   * Set background color
   * @param {Color|number} color - color object or color value
   * @param {number} alpha - transparency
   */
  setClearColor(color, alpha = 1) {
    // Set background color in AMG
    const amgColor = color instanceof Color ? color.toAMGColor() : new Color().setHex(color).toAMGColor();
    amgColor.w = alpha;
  }
  
  /**
   * Dispose renderer resources
   */
  dispose() {
    // Empty implementation
    // In actual environment, should dispose WebGL resources
    console.log('WebGLRenderer.dispose: empty implementation');
  }
}

/**
 * 场景类
 * 管理场景中的所有对象
 */
class Scene {
  constructor() {
    // this._amgScene = new Amaz.Scene();
    this._objects = [];
    
    // 将场景添加到AMG管理器
    // effect.Amaz.AmazingManager.addScene(this._amgScene);
    
    // 设置全局场景实例
    currentScene = this;
    
    console.log('AMG scene created');
  }
  
  /**
   * 添加对象到场景
   * @param {Object} object - 要添加的对象
   */
  add(object) {
    if (object._amgEntity) {
      if (this._objects.indexOf(object) === -1) {
        this._objects.push(object);
        this._amgScene.addEntity(object._amgEntity);
        console.log('Scene: added object to scene:', object._amgEntity.name);
      }
      else {
        console.log('Scene: object already exists:', object._amgEntity.name);
      }
    } else {
      console.warn('Scene: 添加到场景的对象没有_amgEntity属性');
    }
  }
  
  /**
   * 从场景中移除对象，不删除AMG实体
   * @param {Object} object - 要移除的对象
   */
  remove(object) {
    const index = this._objects.indexOf(object);
    if (index !== -1) {
      this._objects.splice(index, 1);
      console.log('Scene: removed object from scene, not delete AMG entity.');
    }
  }

  /**
   * 从场景中删除对象，删除AMG实体
   */
  delete(object) {
    const index = this._objects.indexOf(object);
    if (index !== -1) {
      this._objects.splice(index, 1);
      if (object._amgEntity) {
        this._amgScene.removeEntity(object._amgEntity);
      }
      console.log('Scene: delete object from scene, delete AMG entity.');
    }
  }
  
  /**
   * 更新场景中的所有对象
   */
  update() {
    // 更新场景中的所有对象
    this._objects.forEach(obj => obj.update && obj.update());
  }

  seekToTime(time) {
    this._objects.forEach(obj => obj.seekToTime && obj.seekToTime(time));
  }

  /**
   * 析构函数，清理场景资源
   * 在不再需要场景时调用，确保释放所有资源并从AMG管理器中移除
   */
  dispose() {
    console.log('Scene: 开始清理场景资源');
    
    // 清理所有对象
    while (this._objects.length > 0) {
      const object = this._objects[0];
      this.delete(object);
      
      // 如果对象有自己的dispose方法，调用它
      if (object.dispose && typeof object.dispose === 'function') {
        object.dispose();
      }
      
      // 释放几何体和材质
      if (object.geometry && object.geometry.dispose) {
        object.geometry.dispose();
      }
      
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach(material => {
            if (material.dispose) material.dispose();
          });
        } else if (object.material.dispose) {
          object.material.dispose();
        }
      }
    }
    
    // 从AMG管理器中移除场景
    if (this._amgScene) {
      this._amgScene = null;
    }
    
    // 清空对象数组
    this._objects = [];
    
    // 如果当前全局场景是这个场景，重置它
    if (currentScene === this) {
      currentScene = null;
    }
    
    console.log('Scene: 场景资源清理完成');
  }
}

/**
 * 透视相机
 * 提供三维场景的视角
 */
class PerspectiveCamera {
  constructor(fov = 75, aspect = 1, near = 0.1, far = 1000) {
    console.log('创建PerspectiveCamera实例');
    this.name = "PerspectiveCamera_w";
    // 创建AMG相机实体
    this._amgEntity = new Amaz.Entity();
    this._amgEntity.name = this.name;
    const currentScene = getCurrentScene();
    currentScene.add(this);

    // 添加变换组件
    this._transform = this._amgEntity.addComponent("Transform");
    
    // 添加相机组件
    this._amgObject = this._amgEntity.addComponent("Camera");
    // 设置相机类型属性
    this._amgObject.type = effect.Amaz.CameraType.PERSPECTIVE;
    // 设置相机clearType
    this._amgObject.clearType = effect.Amaz.CameraClearType.COLOR_DEPTH;
    // 设置相机clearColor
    this._amgObject.clearColor = new effect.Amaz.Color(0.0, 0.0, 0.0, 1.0);
    // 设置相机renderLayer
    this._amgObject.layerVisibleMask = new effect.Amaz.DynamicBitset(1,1);
    // 设置相机的order
    this._amgObject.renderOrder = 0;
    // 设置相机输出
    const renderTexture = currentScene._amgScene.assetMgr.SyncLoad('rt/RT_0.rt');
    // const inputTexture = currentScene._amgScene.assetMgr.SyncLoad('share://input.texture');
    // this._amgObject.inputTexture = inputTexture;
    this._amgObject.renderTexture = renderTexture;
    
    
    // 设置相机参数
    this.fov = fov;
    this.fovy = fov;
    this.aspect = aspect;
    this.near = near;
    this.far = far;
    this.updateProjectionMatrix();

    // --- Position Hack --- 
    this.position = new Vector3();
    let _posX = this.position.x; // 位置后备变量x
    let _posY = this.position.y; // 位置后备变量y
    let _posZ = this.position.z; // 位置后备变量z
    
    const updateTransform = () => {
      if (this._transform) {
        this._transform.localPosition = new effect.Amaz.Vector3f(_posX, _posY, _posZ);
      }
    };
    
    // 重写position的x、y、z属性访问器
    Object.defineProperty(this.position, 'x', {
      get: () => _posX,
      set: (value) => {
        _posX = value; // 更新后备变量
        updateTransform();
      },
      enumerable: true, configurable: true
    });
    Object.defineProperty(this.position, 'y', {
      get: () => _posY,
      set: (value) => {
        _posY = value; // 更新后备变量
        updateTransform();
      },
      enumerable: true, configurable: true
    });
    Object.defineProperty(this.position, 'z', {
      get: () => _posZ,
      set: (value) => {
        _posZ = value; // 更新后备变量
        updateTransform();
      },
      enumerable: true, configurable: true
    });

    // 重写position.set方法
    this.position.set = (x, y, z) => {
      // 通过setter更新，确保触发updateTransform
      this.position.x = x;
      this.position.y = y;
      this.position.z = z;
      return this.position;
    };

    // 重写position.copy方法
    this.position.copy = (v) => {
      this.position.x = v.x;
      this.position.y = v.y;
      this.position.z = v.z;
      return this.position;
    };
    

    // --- Rotation Hack --- 
    this.rotation = new Euler();
    let _rotX = this.rotation.x; // 旋转后备变量x
    let _rotY = this.rotation.y; // 旋转后备变量y
    let _rotZ = this.rotation.z; // 旋转后备变量z
    
    /**
     * 更新AMG实体的旋转
     */
    const updateRotation = () => {
      if (this._transform) {
        // 将欧拉角转换为AMG欧拉角格式
        const radX = _rotX / Math.PI * 180;
        const radY = _rotY / Math.PI * 180;
        const radZ = _rotZ / Math.PI * 180;
        this._transform.localEulerAngle = new effect.Amaz.Vector3f(radX, radY, radZ);
      }
    };
    
    // 重写rotation的x、y、z属性访问器
    Object.defineProperty(this.rotation, 'x', {
      get: () => _rotX,
      set: (value) => {
        _rotX = value; // 更新后备变量
        updateRotation();
      },
       enumerable: true, configurable: true
    });
    Object.defineProperty(this.rotation, 'y', {
      get: () => _rotY,
      set: (value) => {
        _rotY = value; // 更新后备变量
        updateRotation();
      },
       enumerable: true, configurable: true
    });
    Object.defineProperty(this.rotation, 'z', {
      get: () => _rotZ,
      set: (value) => {
        _rotZ = value; // 更新后备变量
        updateRotation();
      },
       enumerable: true, configurable: true
    });
    
    // 重写rotation.set方法，支持旋转顺序
    this.rotation.set = (x, y, z, order) => {
      if (order === undefined || order === null) {
        // 没有指定旋转顺序时，使用默认的XYZ顺序
        this.rotation.x = x;
        this.rotation.y = y;
        this.rotation.z = z;
        return this.rotation;
      }
      
      // 先设置旋转顺序
      this.rotation.order = order;
      this.quaternion = new Quaternion();

      // 按照指定顺序设置旋转值
      for (let i = 0; i < order.length; i++) {
        const char = order[i];
        let tempquat = new Quaternion();
        switch (char) {
          case 'X':
            tempquat.setFromAxisAngle(new Vector3(1, 0, 0), x);
            break;
          case 'Y':
            tempquat.setFromAxisAngle(new Vector3(0, 1, 0), y);
            break;
          case 'Z':
            tempquat.setFromAxisAngle(new Vector3(0, 0, 1), z);
            break;
        }
        this.quaternion.multiply(tempquat);
      }

      let amgQuat = new effect.Amaz.Quaternionf(this.quaternion.x, this.quaternion.y, this.quaternion.z, this.quaternion.w);

      let euler = amgQuat.quaternionToEuler();
      this.rotation.x = euler.x;
      this.rotation.y = euler.y;
      this.rotation.z = euler.z;
      this.rotation.order = order;
      
      return this.rotation;
    };
    
    this.scale = new Vector3(1, 1, 1);
  }
  
  /**
   * 更新投影矩阵
   */
  updateProjectionMatrix() {
    // 根据AMG.d.ts定义修改相机参数设置方式
    this._amgObject.fovy = this.fovy;
    this._amgObject.aspect = this.aspect;
    this._amgObject.zNear = this.near;
    this._amgObject.zFar = this.far;
  }
  
  /**
   * 设置相机朝向
   * 计算从当前位置到目标位置的方向，并调整旋转角度使相机朝向该点
   * 
   * @param {Vector3|number} x - 朝向点的x坐标或包含目标位置的Vector3对象
   * @param {number} [y] - 朝向点的y坐标，当第一个参数为Vector3时忽略
   * @param {number} [z] - 朝向点的z坐标，当第一个参数为Vector3时忽略
   * @returns {PerspectiveCamera} 当前相机实例，支持链式调用
   */
  lookAt(x, y, z) {

    if (x instanceof Vector3) {
      this.lookAt(x.x, x.y, x.z);
      return this;
    }

    let pos = new Vector3(this._transform.worldPosition.x, this._transform.worldPosition.y, this._transform.worldPosition.z);
    let tarOri = new Vector3(x, y, z);

    let Tar3 = new Vector3(2*pos.x - tarOri.x, 2*pos.y - tarOri.y, 2*pos.z - tarOri.z);
    let normal = Tar3.clone().normalize();
    let angle = new Vector3(0 - normal.x, 1 - normal.y, 0 - normal.z);
    if (angle.length() < 0.001) {
      return this;
    }

    let tar = new effect.Amaz.Vector3f(Tar3.x, Tar3.y, Tar3.z);

    let up = new effect.Amaz.Vector3f(0, 1, 0);
    this._transform.lookAt(tar, up);

  }
  
  /**
   * 更新相机
   */
  update() {
    // 通过属性hack处理了position和rotation，这里只需更新其他属性
    // 此update方法可能还需处理scale等其他属性
  }
  
  /**
   * 释放相机资源
   */
  dispose() {
    if (this._amgEntity) {
      // 从场景中移除实体
      const currentScene = getCurrentScene();
      if (currentScene && currentScene._amgScene) {
        currentScene._amgScene.removeEntity(this._amgEntity);
      }
      
      // 清理组件
      if (this._amgObject) {
        this._amgEntity.removeComponent(this._amgObject);
        this._amgObject = null;
      }
      
      if (this._transform) {
        this._amgEntity.removeComponent(this._transform);
        this._transform = null;
      }
      
      this._amgEntity = null;
    }
    
    console.log('PerspectiveCamera: 资源已释放');
  }
}

/**
 * 几何体基类
 */
class BufferGeometry {
  constructor() {
    this.attributes = {};
    this.index = null;
  
    const scene = getCurrentScene();
    if (scene) {  
      this._amgObject = scene._amgScene.assetMgr.SyncLoad('mesh/Quad.mesh').clone();
    } else {
      console.warn('PlaneGeometry: 无法加载Quad.mesh，scene未创建');
    }

    let vertexData = this._amgObject.getVertexArray();
    let uvData = this._amgObject.getUvArray();
    let vertices = new Float32Array(vertexData.size() * 3);
    let uvs = new Float32Array(uvData.size() * 2);
    for (let i = 0; i < vertexData.size(); i++) {
      vertices[i * 3] = vertexData.get(i).x;
      vertices[i * 3 + 1] = vertexData.get(i).y;
      vertices[i * 3 + 2] = vertexData.get(i).z;
      uvs[i * 2] = uvData.get(i).x;
      uvs[i * 2 + 1] = uvData.get(i).y;
    }

    this.initAttribute('position', new BufferAttribute(vertices, 3));
    this.initAttribute('uv', new BufferAttribute(uvs, 2));
  }

  initAttribute(name, attribute) {
    console.log('BufferGeometry: initAttribute name:', name, 'attribute:', attribute);
    this.attributes[name] = attribute;
    attribute.setNameAndGeometry(name, this);
    return this;
  }
  /**
   * 设置几何体属性
   * @param {string} name - 属性名称
   * @param {BufferAttribute} attribute - 属性值
   */
  setAttribute(name, attribute) {
    this.attributes[name] = attribute;
    attribute.setNameAndGeometry(name, this);
    attribute.forceUpdateToAMG();
    return this;
  }
  
  getAttribute(name) {
    return this.attributes[name];
  }

  computeVertexNormals() {
  
  }

  /**
   * 设置几何体索引
   * @param {BufferAttribute} index - 索引属性
   */
  setIndex(index) {
    this.index = index;
    return this;
  }

  /**
   * 从点数组设置几何体
   * @param {Array} points - 点数组，每个点应该是 Vector3 对象
   */
  setFromPoints(points) {
    if (!Array.isArray(points)) {
      console.warn('setFromPoints: points must be an array');
      return this;
    }

    const positions = [];
    
    console.log('BufferGeometry: setFromPoints points.length:', points.length);
    // 从点数组中提取位置数据
    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      if (point && typeof point.x === 'number' && typeof point.y === 'number' && typeof point.z === 'number') {
        positions.push(point.x, point.y, point.z);
      } else {
        console.warn(`setFromPoints: point at index ${i} is not a valid Vector3`);
        positions.push(0, 0, 0);
      }
    }

    // 创建位置属性
    const positionAttribute = new BufferAttribute(new Float32Array(positions), 3);
    this.initAttribute('position', positionAttribute);

    if (this._amgObject && this._amgObject.submeshes.get(0)) {
      this._amgObject.submeshes.get(0).primitive = effect.Amaz.Primitive.Points;
      let list = new effect.Amaz.UInt16Vector();
      for (let i = 0; i < points.length; i++) {
        list.pushBack(i);
      }
      console.log('BufferGeometry: setFromPoints list.size():', list.size());
      this._amgObject.submeshes.get(0).indices16 = list;
      this._amgObject.submeshes.get(0).indicesCount = points.length;
    }
    return this;
  }

  /**
   * 释放几何体资源
   */
  dispose() {
    // 清理资源
    for (const key in this.attributes) {
      if (this.attributes[key] && typeof this.attributes[key].dispose === 'function') {
        this.attributes[key].dispose();
      }
    }
    this.attributes = {};
    this.index = null;
  }
}


class BufferAttribute {
  constructor(array, itemSize, normalized = false) {
    this.array = array;
    this.itemSize = itemSize;
    this.count = array.length / itemSize;
    this.normalized = normalized;
    this._needsUpdate = false;
    this.length = array.length;
    
    // 保存关联的AMG对象引用，用于自动更新
    this._amgGeometry = null;
  }

  /**
   * 设置是否需要更新，当设置为true时自动同步到AMG对象
   */
  set needsUpdate(value) {
    this._needsUpdate = value;
    if (value && this._amgGeometry && this._amgGeometry._amgObject) {
      this._updateToAMG();
    }
  }
  
  get needsUpdate() {
    return this._needsUpdate;
  }

  /**
   * 设置关联的几何体对象
   */
  setNameAndGeometry(name, geometry) {
    this._name = name;
    this._amgGeometry = geometry;
  }
  
  /**
   * 手动触发更新到AMG对象
   * 用于调试或在自动更新失败时手动调用
   */
  forceUpdateToAMG() {
    this._updateToAMG();
  }
  
  /**
   * 将当前array数据更新到AMG对象中
   */
  _updateToAMG() {
    if (!this._amgGeometry || !this._amgGeometry._amgObject) {
      console.warn('BufferAttribute: 无法更新到AMG对象，几何体引用不存在');
      return;
    }
    
    try {
      const amgObj = this._amgGeometry._amgObject;
      
      if (this.itemSize == 2 && this._name == "uv") {
        // method1: use setUvArray
        // const uvArray = [];
        // for (let i = 0; i < this.array.length; i += 2) {  
        //   uvArray.push(new effect.Amaz.Vector2f(this.array[i], this.array[i + 1]));
        // }
        // amgObj.setUvArray(0,uvArray);
        
        // method2: use setAttributeData
        const buffer = new effect.Amaz.FloatVector();
        for (let i = 0; i < this.array.length; i++) {
          buffer.pushBack(this.array[i]);
        }
        amgObj.setAttributeData(effect.Amaz.VertexAttribType.UV, buffer, 0, this.array.length / this.itemSize);
        this._needsUpdate = false;
        return;
      }
      else if (this.itemSize == 3 && this._name == "position") {

        // method1: use setVertexArray
        // 将Float32Array转换为AMG需要的格式
        // const vertexArray = [];
        // for (let i = 0; i < this.array.length; i += 3) {
        //   vertexArray.push(new effect.Amaz.Vector3f(
        //     this.array[i],
        //     this.array[i + 1], 
        //     this.array[i + 2]
        //   ));
        // }
        // amgObj.setVertexArray(vertexArray); // for position attribute.

        // method2: use setAttributeData
        const buffer = new effect.Amaz.FloatVector();
        for (let i = 0; i < this.array.length; i++) {
          buffer.pushBack(this.array[i]);
        }
        
        amgObj.setAttributeData(effect.Amaz.VertexAttribType.POSITION, buffer, 0, this.array.length / this.itemSize);
        this._needsUpdate = false;
        return;
      }
      else if (this._name == "colorA" || this._name == "colorR" || this._name == "colorG" || this._name == "colorB")
      {
        const colorArrayR = this._amgGeometry.getAttribute("colorR");
        const colorArrayG = this._amgGeometry.getAttribute("colorG");
        const colorArrayB = this._amgGeometry.getAttribute("colorB");
        const colorArrayA = this._amgGeometry.getAttribute("colorA");
        if (colorArrayR && colorArrayG && colorArrayB && colorArrayA && 
            colorArrayR._needsUpdate && colorArrayG._needsUpdate && 
            colorArrayB._needsUpdate && colorArrayA._needsUpdate)
        {
          const buffer = new effect.Amaz.FloatVector();
          for (let i = 0; i < this.array.length; i++) {
            buffer.pushBack(colorArrayR.array[i]);
            buffer.pushBack(colorArrayG.array[i]);
            buffer.pushBack(colorArrayB.array[i]);
            buffer.pushBack(colorArrayA.array[i]);
          }
          amgObj.setAttributeData(effect.Amaz.VertexAttribType.COLOR, buffer, 0, this.array.length / this.itemSize);
          colorArrayR._needsUpdate =false;
          colorArrayG._needsUpdate =false;
          colorArrayB._needsUpdate =false;
          colorArrayA._needsUpdate =false;
        }
        return;
      }
      else if (this._name == "size" || this._name == "rotation")
      {
        const sizeAttribute = this._amgGeometry.getAttribute("size");
        const rotationAttribute = this._amgGeometry.getAttribute("rotation");
        if (sizeAttribute && rotationAttribute && 
            sizeAttribute._needsUpdate && rotationAttribute._needsUpdate)
        {
          const buffer = new effect.Amaz.FloatVector();
          for (let i = 0; i < this.array.length; i++) {
            buffer.pushBack(sizeAttribute.array[i]);
            // console.log('BufferAttribute: _updateToAMG sizeAttribute.array[i]:', sizeAttribute.array[i]);
            buffer.pushBack(rotationAttribute.array[i]);
            // console.log('BufferAttribute: _updateToAMG rotationAttribute.array[i]:', rotationAttribute.array[i]);
            buffer.pushBack(0);
            buffer.pushBack(0);
          }
          amgObj.setAttributeData(effect.Amaz.VertexAttribType.USER_DEFINE0, buffer, 0, this.array.length / this.itemSize);
          sizeAttribute._needsUpdate =false;
          rotationAttribute._needsUpdate =false;
        }
        return;
      }
      else if (this._name == "lifetime" || this._name == "startLifetime" || this._name == "startFrame")
      {
        const lifetimeAttribute = this._amgGeometry.getAttribute("lifetime");
        const startLifetimeAttribute = this._amgGeometry.getAttribute("startLifetime");
        const startFrameAttribute = this._amgGeometry.getAttribute("startFrame");
        if (lifetimeAttribute && startLifetimeAttribute && startFrameAttribute && 
            lifetimeAttribute._needsUpdate && startLifetimeAttribute._needsUpdate && startFrameAttribute._needsUpdate)
        {
          const buffer = new effect.Amaz.FloatVector();
          for (let i = 0; i < this.array.length; i++) {
            buffer.pushBack(lifetimeAttribute.array[i]);
            buffer.pushBack(startLifetimeAttribute.array[i]);
            buffer.pushBack(startFrameAttribute.array[i]);
          }
          amgObj.setAttributeData(effect.Amaz.VertexAttribType.USER_DEFINE1, buffer, 0, this.array.length / this.itemSize);
          lifetimeAttribute._needsUpdate =false;
          startLifetimeAttribute._needsUpdate =false;
          startFrameAttribute._needsUpdate =false;
        }
        return;
      }


    } catch (error) {
      console.error('BufferAttribute: 更新AMG对象时发生错误:', error);
    }
  }

  /**
   * 获取指定索引的X坐标值
   * @param {number} index - 顶点索引
   * @returns {number} X坐标值
   */
  getX(index) {
    if (index < 0 || index >= this.count) {
      console.warn(`BufferAttribute.getX: 索引 ${index} 超出范围 [0, ${this.count - 1}]`);
      return 0;
    }
    return this.array[index * this.itemSize];
  }

  /**
   * 获取指定索引的Y坐标值
   * @param {number} index - 顶点索引
   * @returns {number} Y坐标值
   */
  getY(index) {
    if (index < 0 || index >= this.count) {
      console.warn(`BufferAttribute.getY: 索引 ${index} 超出范围 [0, ${this.count - 1}]`);
      return 0;
    }
    return this.array[index * this.itemSize + 1];
  }

  /**
   * 获取指定索引的Z坐标值
   * @param {number} index - 顶点索引
   * @returns {number} Z坐标值
   */
  getZ(index) {
    if (index < 0 || index >= this.count) {
      console.warn(`BufferAttribute.getZ: 索引 ${index} 超出范围 [0, ${this.count - 1}]`);
      return 0;
    }
    return this.array[index * this.itemSize + 2];
  }

  /**
   * 设置指定索引的X坐标值
   * @param {number} index - 顶点索引
   * @param {number} value - X坐标值
   */
  setX(index, value) {
    if (index < 0 || index >= this.count) {
      console.warn(`BufferAttribute.setX: 索引 ${index} 超出范围 [0, ${this.count - 1}]`);
      return;
    }
    this.array[index * this.itemSize] = value;
    this.needsUpdate = true;
  }

  /**
   * 设置指定索引的Y坐标值
   * @param {number} index - 顶点索引
   * @param {number} value - Y坐标值
   */
  setY(index, value) {
    if (index < 0 || index >= this.count) {
      console.warn(`BufferAttribute.setY: 索引 ${index} 超出范围 [0, ${this.count - 1}]`);
      return;
    }
    this.array[index * this.itemSize + 1] = value;
    this.needsUpdate = true;
  }

  /**
   * 设置指定索引的Z坐标值
   * @param {number} index - 顶点索引
   * @param {number} value - Z坐标值
   */
  setZ(index, value) {
    if (index < 0 || index >= this.count) {
      console.warn(`BufferAttribute.setZ: 索引 ${index} 超出范围 [0, ${this.count - 1}]`);
      return;
    }
    this.array[index * this.itemSize + 2] = value;
    this.needsUpdate = true;
  }

  /**
   * 设置指定索引的XY坐标值
   * @param {number} index - 顶点索引
   * @param {number} x - X坐标值
   * @param {number} y - Y坐标值
   */
  setXY(index, x, y) {
    if (index < 0 || index >= this.count) {
      console.warn(`BufferAttribute.setXY: 索引 ${index} 超出范围 [0, ${this.count - 1}]`);
      return;
    }
    const offset = index * this.itemSize;
    this.array[offset] = x; 
    this.array[offset + 1] = y;
    this.needsUpdate = true;
  }

  /**
   * 设置指定索引的XYZ坐标值
   * @param {number} index - 顶点索引
   * @param {number} x - X坐标值
   * @param {number} y - Y坐标值
   * @param {number} z - Z坐标值
   */
  setXYZ(index, x, y, z) {
    if (index < 0 || index >= this.count) {
      console.warn(`BufferAttribute.setXYZ: 索引 ${index} 超出范围 [0, ${this.count - 1}]`);
      return;
    }
    const offset = index * this.itemSize;
    this.array[offset] = x;
    this.array[offset + 1] = y;
    this.array[offset + 2] = z;
    this.needsUpdate = true;
  }

  /**
   * 获取指定索引的XY坐标值
   * @param {number} index - 顶点索引
   * @returns {Object} 包含x和y属性的对象
   */
  getXY(index) {
    if (index < 0 || index >= this.count) {
      console.warn(`BufferAttribute.getXY: 索引 ${index} 超出范围 [0, ${this.count - 1}]`);
      return { x: 0, y: 0 };
    }
    const offset = index * this.itemSize;
    return {
      x: this.array[offset],
      y: this.array[offset + 1]
    };
  }

  /**
   * 获取指定索引的XYZ坐标值
   * @param {number} index - 顶点索引
   * @returns {Object} 包含x、y和z属性的对象
   */
  getXYZ(index) {
    if (index < 0 || index >= this.count) {
      console.warn(`BufferAttribute.getXYZ: 索引 ${index} 超出范围 [0, ${this.count - 1}]`);
      return { x: 0, y: 0, z: 0 };
    }
    const offset = index * this.itemSize;
    return {
      x: this.array[offset],
      y: this.array[offset + 1],
      z: this.array[offset + 2]
    };
  }
}

/**
 * 立方体几何体
 */
class BoxGeometry extends BufferGeometry {
  constructor(width = 1, height = 1, depth = 1, widthSegments = 1, heightSegments = 1, depthSegments = 1) {
    super();
    
    // 保存尺寸信息
    this.width = width;
    this.height = height;
    this.depth = depth;
    
    // 从场景资源管理器加载立方体网格
    const scene = getCurrentScene();
    if (scene) {
      if (widthSegments > 5 && heightSegments > 5 && depthSegments > 5) {
        this._amgObject = scene._amgScene.assetMgr.SyncLoad('mesh/BoxHighResolution.mesh');
      } else {
        this._amgObject = scene._amgScene.assetMgr.SyncLoad('mesh/Box.mesh');
      }
    } else {
      console.warn('BoxGeometry: 无法加载Box.mesh，scene未创建');
    }

    let vertexData = this._amgObject.getVertexArray();
    let uvData = this._amgObject.getUvArray();
    let vertices = new Float32Array(vertexData.size() * 3);
    let uvs = new Float32Array(uvData.size() * 2);
    for (let i = 0; i < vertexData.size(); i++) {
      vertices[i * 3] = vertexData.get(i).x;
      vertices[i * 3 + 1] = vertexData.get(i).y;
      vertices[i * 3 + 2] = vertexData.get(i).z;
      uvs[i * 2] = uvData.get(i).x;
      uvs[i * 2 + 1] = uvData.get(i).y;
    }

    this.initAttribute('position', new BufferAttribute(vertices, 3));
    this.initAttribute('uv', new BufferAttribute(uvs, 2));
  }

  getAttribute(name) {
    if (name == "position") {
      let data = this._amgObject.getVertexArray();
      let array = new Float32Array(data.size() * 3);
      for (let i = 0; i < data.size(); i++) {
        array[i * 3] = data.get(i).x;
        array[i * 3 + 1] = data.get(i).y;
        array[i * 3 + 2] = data.get(i).z;
      }
      const bufferAttribute = new BufferAttribute(array, 3);
      // 设置几何体引用，用于自动更新
      bufferAttribute.setNameAndGeometry("position",this);
      return bufferAttribute;
    }
    if (name == "uv") {
      let data = this._amgObject.getUvArray();
      let array = new Float32Array(data.size() * 2);
      for (let i = 0; i < data.size(); i++) {
        array[i * 2] = data.get(i).x;
        array[i * 2 + 1] = data.get(i).y;
      }
      const bufferAttribute = new BufferAttribute(array, 2);
      // 设置几何体引用，用于自动更新
      bufferAttribute.setNameAndGeometry("uv",this);
      return bufferAttribute;
    }
    return null;
  }

  clone() {
    const clonedGeometry = new BoxGeometry(this.width, this.height, this.depth, this.widthSegments, this.heightSegments, this.depthSegments);
    clonedGeometry._amgObject = this._amgObject.clone();
    return clonedGeometry;
  }
}

class PlaneGeometry extends BufferGeometry {
  constructor(width = 1, height = 1, widthSegments = 1, heightSegments = 1) {
    super();
    this.width = width;
    this.height = height;
    this.widthSegments = widthSegments;
    this.heightSegments = heightSegments;

    const scene = getCurrentScene();
    if (scene) {  
      this._amgObject = scene._amgScene.assetMgr.SyncLoad('mesh/Quad.mesh').clone();
    } else {
      console.warn('PlaneGeometry: 无法加载Quad.mesh，scene未创建');
    }

    let vertexData = this._amgObject.getVertexArray();
    let uvData = this._amgObject.getUvArray();
    let vertices = new Float32Array(vertexData.size() * 3);
    let uvs = new Float32Array(uvData.size() * 2);
    for (let i = 0; i < vertexData.size(); i++) {
      vertices[i * 3] = vertexData.get(i).x;
      vertices[i * 3 + 1] = vertexData.get(i).y;
      vertices[i * 3 + 2] = vertexData.get(i).z;
      uvs[i * 2] = uvData.get(i).x;
      uvs[i * 2 + 1] = uvData.get(i).y;
    }

    this.initAttribute('position', new BufferAttribute(vertices, 3));
    this.initAttribute('uv', new BufferAttribute(uvs, 2));
  }
}

/**
 * 球体几何体
 */
class SphereGeometry extends BufferGeometry {
  constructor(radius = 1, widthSegments = 8, heightSegments = 6) {
    super();
    
    // 简化版本的SphereGeometry实现
    // 实际应用中需要完整实现所有的顶点、索引等

    // 从场景资源管理器加载立方体网格
    const scene = getCurrentScene();
    if (scene) {
      this._amgObject = scene._amgScene.assetMgr.SyncLoad('mesh/Sphere.mesh');
    } 

    this.width = radius;
    this.height = radius;
    this.depth = radius;
    
    // 占位实现
    const vertexCount = (widthSegments + 1) * (heightSegments + 1);
    const vertices = new Float32Array(vertexCount * 3);
    const uvs = new Float32Array(vertexCount * 2);
    const indices = [];
    
    // TODO: 实现球体顶点和索引的计算
    
    this.initAttribute('position', new BufferAttribute(vertices, 3));
    this.initAttribute('uv', new BufferAttribute(uvs, 2));
    // this.setIndex(new BufferAttribute(new Uint16Array(indices), 1));
  }
}

/**
 * 圆柱体几何体
 */
class CylinderGeometry extends BufferGeometry {
  // 分别是圆柱体顶部半径、底部半径、高度、圆柱体段数、圆柱体高度段数
  constructor(radiusTop = 0.5, radiusBottom = 0.5, height = 1.0, radiusSegments = 16, heightSegments = 1) {
    super();

    // 简化版本的CylinderGeometry实现
    // 实际应用中需要完整实现所有的顶点、索引等

    // 从场景资源管理器加载立方体网格
    const scene = getCurrentScene();
    if (scene) {
      this._amgObject = scene._amgScene.assetMgr.SyncLoad('mesh/Cylinder.mesh');
    } 

    this.radiusTop = radiusTop;
    this.radiusBottom = radiusBottom;
    this.width = radiusTop / 0.5;
    this.height = height;
    this.depth = radiusTop / 0.5;
    this.radiusSegments = radiusSegments;
    this.heightSegments = heightSegments;
    
  }

}

/**
 * 胶囊体几何体
 */
class CapsuleGeometry extends BufferGeometry {
  // 分别是胶囊体半径、高度、胶囊体段数、胶囊体高度段数
  constructor(radius = 0.5, height = 1.0, radiusSegments = 16, heightSegments = 1) {
    super();

    // 简化版本的CapsuleGeometry实现
    // 实际应用中需要完整实现所有的顶点、索引等

    // 从场景资源管理器加载立方体网格
    const scene = getCurrentScene();
    if (scene) {
      this._amgObject = scene._amgScene.assetMgr.SyncLoad('mesh/Capsule.mesh');
    } 

    this.radius = radius;
    this.width = radius / 0.5;
    this.height = height;
    this.depth = radius / 0.5;
    this.radiusSegments = radiusSegments;
    this.heightSegments = heightSegments;
  }
}

/**
 * 材质基类
 */
class Material {
  constructor() {
    this.transparent = false;
    this._opacity = 1.0;
    this.side = THREE.FrontSide;
    this.visible = true;
    
    // 创建opacity属性的getter和setter，实现自动同步
    Object.defineProperty(this, 'opacity', {
      get: () => this._opacity,
      set: (value) => {
        this._opacity = value;
        // 当opacity改变时，自动同步到AMG材质
        this._syncOpacityToAMG();
      },
      enumerable: true,
      configurable: true
    });

    this._blending = THREE.NormalBlending;
    Object.defineProperty(this, 'blending', {
      get: () => this._blending,
      set: (value) => {
        this._blending = value;
        this._syncBlendingToAMG();
      },
      enumerable: true,
      configurable: true
    });
  }
  
  /**
   * 同步透明度到AMG材质
   * 子类可以重写此方法来实现具体的同步逻辑
   */
  _syncOpacityToAMG() {
    // 基类中的默认实现，子类会重写
    if (this._amgObject && typeof this._amgObject.setFloat === 'function') {
      try {
        this._amgObject.setFloat("u_Opacity", this._opacity);
        // 同时设置其他可能的透明度相关参数
        if (this._amgObject.setFloat && typeof this._amgObject.setFloat === 'function') {
          this._amgObject.setFloat("u_Alpha", this._opacity);
        }
      } catch (error) {
        console.warn('Material: 同步透明度到AMG材质失败:', error);
      }
    }
  }
  
  _syncBlendingToAMG() {
    if (this._amgObject !== undefined && this._amgObject.xshader !== undefined) {
      const colorBlendState = this._amgObject.xshader.passes.get(0).renderState.colorBlend.attachments.get(0);
      const setBlendState = function(state, srcColor, dstColor, srcAlpha, dstAlpha) {
        state.srcColorBlendFactor = srcColor;
        state.dstColorBlendFactor = dstColor;
        state.srcAlphaBlendFactor = srcAlpha;
        state.dstAlphaBlendFactor = dstAlpha;
      }
      // src color已预乘src alpha
      if (this._blending == THREE.NoBlending) {
        colorBlendState.blendEnable = false;
        setBlendState(colorBlendState,
          Amaz.BlendFactor.ONE, Amaz.BlendFactor.ONE_MINUS_SRC_ALPHA,
          Amaz.BlendFactor.ONE, Amaz.BlendFactor.ONE_MINUS_SRC_ALPHA
        );
      } else if (this._blending == THREE.NormalBlending) {
        colorBlendState.blendEnable = true;
        setBlendState(colorBlendState,
          Amaz.BlendFactor.ONE, Amaz.BlendFactor.ONE_MINUS_SRC_ALPHA,
          Amaz.BlendFactor.ONE, Amaz.BlendFactor.ONE_MINUS_SRC_ALPHA
        );
      } else if (this._blending == THREE.AdditiveBlending) {
        colorBlendState.blendEnable = true;
        setBlendState(colorBlendState,
          Amaz.BlendFactor.ONE, Amaz.BlendFactor.ONE,
          Amaz.BlendFactor.ONE, Amaz.BlendFactor.ONE
        );
      } else if (this._blending == THREE.SubtractiveBlending) {
        colorBlendState.blendEnable = true;
        setBlendState(colorBlendState,
          Amaz.BlendFactor.ZERO, Amaz.BlendFactor.ONE_MINUS_SRC_COLOR,
          Amaz.BlendFactor.ZERO, Amaz.BlendFactor.ONE
        );
      } else if (this._blending == THREE.MultiplyBlending) {
        colorBlendState.blendEnable = true;
        setBlendState(colorBlendState,
          Amaz.BlendFactor.DST_COLOR, Amaz.BlendFactor.ONE_MINUS_SRC_ALPHA,
          Amaz.BlendFactor.ZERO, Amaz.BlendFactor.ONE
        );
      } else {
        Amaz.LOGE("three-amg-wrapper", "混合模式未实现:" + this._blending);
      }
    }
  }
  
  /**
   * 设置透明度并同步到AMG材质
   * @param {number} opacity - 透明度值 [0, 1]
   */
  setOpacity(opacity) {
    this.opacity = opacity;
    return this;
  }
  
  /**
   * 释放材质资源
   */
  dispose() {
    // 清理资源
  }
}

/**
 * 基础材质
 * 不受光照影响的简单材质
 */
class MeshBasicMaterial extends Material {
  constructor(parameters = {}) {
    super();

    this.scene = getCurrentScene();
    this._amgObject = this.scene._amgScene.assetMgr.SyncLoad('material/Unlit/Unlit.material').instantiate();
    
    this._color = parameters.color !== undefined ? 
      (parameters.color instanceof Color ? parameters.color : new Color().setHex(parameters.color)) :
      new Color(1, 1, 1);
    
    // 初始化内部的 map 属性
    this._map = null;
    this.wireframe = parameters.wireframe || false;
    this.transparent = parameters.transparent || false;
    this.opacity = parameters.opacity !== undefined ? parameters.opacity : 1.0;
    this.blending = parameters.blending !== undefined ? parameters.blending : THREE.NormalBlending;
    
    // 设置AMG材质属性
    this._amgObject.setVec4("u_AlbedoColor", this._color.toAMGColor());
    
    // 通过 setter 设置 map，这样会自动触发注册和更新
    if (parameters.map) {
      this.map = parameters.map;
    }

    Object.defineProperty(this, 'color', {
      get: () => this._color,
      set: (value) => {
        this._color = value;
        this._amgObject.setVec4("u_AlbedoColor", this._color.toAMGColor());
      },
    });

    // 重写 setRGB 方法，确保调用 setRGB 时同步更新到 _amgObject
    const originalSetRGB = this._color.setRGB;
    const material = this; // 保存材质的引用
    this.color.setRGB = function(r, g, b) {
      originalSetRGB.call(this, r, g, b);
      
      // 同步更新到 _amgObject
      if (material._amgObject) {
        material._amgObject.setVec4("u_AlbedoColor", material._color.toAMGColor());
      }
    };

    
  }

  // map 属性的 getter
  get map() {
    return this._map;
  }

  // map 属性的 setter - 自动处理纹理注册和更新
  set map(value) {
    // 如果之前有纹理，先从旧纹理中移除材质引用
    if (this._map) {
      this._map._removeMaterial(this);
    }
    
    // 设置新的纹理
    this._map = value;
    
    // 如果新纹理存在且有效，注册材质并更新参数
    if (this._map && this._map._amgObject) {
      // 将此材质注册到纹理中以接收更新通知
      this._map._addMaterial(this);
      // 立即更新材质参数
      this._updateMaterialParams();
    }
  }

  // 当 material.map 被赋值或改变时，自动更新纹理参数
  _updateMaterialParams() {
    if (this._map && this._map._amgObject) {
      this._amgObject.setTex("u_AlbedoTexture", this._map._amgObject);
      this._amgObject.setVec2("u_Repeat", new effect.Amaz.Vector2f(this._map.repeat.x, this._map.repeat.y));
      this._amgObject.setVec2("u_Offset", new effect.Amaz.Vector2f(this._map.offset.x, this._map.offset.y));
    }
  }
  
  // 更新纹理参数（当 repeat 或 offset 改变时会被自动调用）
  _updateTextureParams() {
    if (this._map && this._map._amgObject) {
      this._amgObject.setVec2("u_Repeat", new effect.Amaz.Vector2f(this._map.repeat.x, this._map.repeat.y));
      this._amgObject.setVec2("u_Offset", new effect.Amaz.Vector2f(this._map.offset.x, this._map.offset.y));
    }
  }
  
  // 重写 dispose 方法，清理纹理引用
  dispose() {
    if (this._map) {
      this._map._removeMaterial(this);
    }
    super.dispose();
  }
}

class ShaderMaterial extends Material {
  constructor(parameters = {}) {
    super();
    this.scene = getCurrentScene();
    this._amgObject = this.scene._amgScene.assetMgr.SyncLoad('material/Unlit/Unlit.material').instantiate();
    
    this.transparent = parameters.transparent || false;
    this.opacity = parameters.opacity !== undefined ? parameters.opacity : 1.0;
    this.blending = parameters.blending !== undefined ? parameters.blending : THREE.NormalBlending;

    // 存储原始uniforms
    this._originalUniforms = parameters.uniforms || {};
    
    // 创建带有自动同步功能的uniforms代理
    this._uniforms = this._createUniformsProxy(this._originalUniforms);
    
    // 初始化uniforms到AMG引擎
    if (parameters.uniforms) {
      for (const [key, value] of Object.entries(parameters.uniforms)) {
        console.log("uniforms", key, value);
        this._syncUniformToAMG(key, value.value);
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

    let xshader = this._amgObject.xshader.clone();
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

    if (key != "") {
      let metal = shaders.get("metal");
      let metalShader1 = metal.get(0);
      let metalShader2 = metal.get(1);

      metalShader1.source = "";
      metalShader1.sourcePath = "xshader/"+key+".vert.metal";

      metalShader2.source = "";
      metalShader2.sourcePath = "xshader/"+key+".frag.metal";

    }

    this._amgObject.xshader = xshader;
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
      uniformsProxy[key] = {
        get value() {
          return uniform.value;
        },
        set value(newValue) {
          uniform.value = newValue;
          // 自动同步到AMG引擎
          self._syncUniformToAMG(key, newValue);
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
  _syncUniformToAMG(key, value) {
    if (!this._amgObject) return;
    
    var yModified = undefined;
    if (value instanceof THREE.Vector2 || value instanceof THREE.Vector3) {
      if (key == "videoTextureRepeat") {
        yModified = -value.y;
      } else if (key == "videoTextureOffset") {
        yModified = -value.y + 1;
      } else {
        yModified = value.y;
      }
    }
    
    try {
      if (value instanceof THREE.Texture) {
        this._amgObject.setTex(key, value._amgObject);
      } else if (value instanceof THREE.Vector2) {
        this._amgObject.setVec2(key, new effect.Amaz.Vector2f(value.x, yModified));
      } else if (value instanceof THREE.Vector3) {
        this._amgObject.setVec3(key, new effect.Amaz.Vector3f(value.x, value.y, value.z));
      } else if (value instanceof THREE.Vector4) {
        this._amgObject.setVec4(key, new effect.Amaz.Vector4f(value.x, value.y, value.z, value.w));
      } else if (typeof value === 'number') {
        this._amgObject.setFloat(key, value);
      } else if (typeof value === 'boolean') {
        this._amgObject.setFloat(key, value ? 1.0 : 0.0);
      }else {
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
  
}

/**
 * 网格 (几何体 + 材质)
 */
class Mesh {
  constructor(geometry, material) {
    // 创建AMG实体
    this._amgEntity = new Amaz.Entity();
    this._amgEntity.name = "Mesh_w";
    this._amgEntity.scene = getCurrentScene()._amgScene;
    this._transform = this._amgEntity.addComponent("Transform");

    this._amgRenderEntity = new Amaz.Entity();
    this._amgRenderEntity.name = "Render_w";
    this._amgRenderEntity.scene = getCurrentScene()._amgScene;
    // set Transform
    this._amgRendertransform = this._amgRenderEntity.addComponent("Transform");
    this._transform.addTransform(this._amgRendertransform);
    this._amgRendertransform.localScale = new effect.Amaz.Vector3f(geometry.width || 1, geometry.height || 1, geometry.depth || 1); 
    
    // 创建网格组件
    this._amgMeshRenderer = this._amgRenderEntity.addComponent("MeshRenderer");
    this._amgMeshRenderer.mesh = geometry._amgObject;
    if (Array.isArray(material)) {
      const materials = new effect.Amaz.Vector();
      for (let i = 0; i < material.length; i++) {
        materials.pushBack(material[i]._amgObject);
      }
      this._amgMeshRenderer.materials = materials;
    } else {
      this._amgMeshRenderer.sharedMaterial = material._amgObject;
    }
    
    // 设置几何体和材质
    this.geometry = geometry;
    this.material = material;

    // --- userData ---
    this.userData = {};

    // --- visible Hack ---
    this.visible = true;
    let _visible = this.visible;

    // 重写visible的属性访问器
    Object.defineProperty(this, 'visible', {
      get: () => _visible,
      set: (value) => {
        _visible = value;
        this._amgEntity.visible = value;
      },
      enumerable: true, configurable: true
    });

    // --- material Hack ---
    Object.defineProperty(this, 'material', {
      get: () => material,
      set: (value) => {
        material = value;
        this._amgMeshRenderer.sharedMaterial = value._amgObject;
      },
      enumerable: true, configurable: true
    });


    // --- Position Hack --- 
    this.position = new Vector3();
    let _posX = this.position.x; // 位置后备变量x
    let _posY = this.position.y; // 位置后备变量y
    let _posZ = this.position.z; // 位置后备变量z
    
    /**
     * 更新AMG实体的位置
     */
    const updateTransform = () => {
      if (this._transform) {
        this._transform.localPosition = new effect.Amaz.Vector3f(_posX, _posY, _posZ);
      }
    };
    
    // 重写position的x、y、z属性访问器
    Object.defineProperty(this.position, 'x', {
      get: () => _posX,
      set: (value) => {
        _posX = value; // 更新后备变量
        updateTransform();
      },
      enumerable: true, configurable: true
    });
    Object.defineProperty(this.position, 'y', {
      get: () => _posY,
      set: (value) => {
        _posY = value; // 更新后备变量
        updateTransform();
      },
      enumerable: true, configurable: true
    });
    Object.defineProperty(this.position, 'z', {
      get: () => _posZ,
      set: (value) => {
        _posZ = value; // 更新后备变量
        updateTransform();
      },
      enumerable: true, configurable: true
    });

    // 重写position.set方法
    this.position.set = (x, y, z) => {
      // 通过setter更新，确保触发updateTransform
      this.position.x = x;
      this.position.y = y;
      this.position.z = z;
      return this.position;
    };
    
    // --- Rotation Hack --- 
    this.rotation = new Euler();
    let _rotX = this.rotation.x; // 旋转后备变量x
    let _rotY = this.rotation.y; // 旋转后备变量y
    let _rotZ = this.rotation.z; // 旋转后备变量z
    
    /**
     * 更新AMG实体的旋转
     */
    const updateRotation = () => {
      if (this._transform) {
        // 将欧拉角转换为AMG欧拉角格式
        const radX = _rotX / Math.PI * 180;
        const radY = _rotY / Math.PI * 180;
        const radZ = _rotZ / Math.PI * 180;
        this._transform.localEulerAngle = new effect.Amaz.Vector3f(radX, radY, radZ);
      }
    };
    
    // 重写rotation的x、y、z属性访问器
    Object.defineProperty(this.rotation, 'x', {
      get: () => _rotX,
      set: (value) => {
        _rotX = value; // 更新后备变量
        updateRotation();
      },
       enumerable: true, configurable: true
    });
    Object.defineProperty(this.rotation, 'y', {
      get: () => _rotY,
      set: (value) => {
        _rotY = value; // 更新后备变量
        updateRotation();
      },
       enumerable: true, configurable: true
    });
    Object.defineProperty(this.rotation, 'z', {
      get: () => _rotZ,
      set: (value) => {
        _rotZ = value; // 更新后备变量
        updateRotation();
      },
       enumerable: true, configurable: true
    });

    // 重写rotation.set方法，支持旋转顺序
    this.rotation.set = (x, y, z, order) => {
      if (order === undefined || order === null) {
        // 没有指定旋转顺序时，使用默认的XYZ顺序
        this.rotation.x = x;
        this.rotation.y = y;
        this.rotation.z = z;
        return this.rotation;
      }
      
      // 先设置旋转顺序
      this.rotation.order = order;
      this.quaternion = new Quaternion();

      // 按照指定顺序设置旋转值
      for (let i = 0; i < order.length; i++) {
        const char = order[i];
        let tempquat = new Quaternion();
        switch (char) {
          case 'X':
            tempquat.setFromAxisAngle(new Vector3(1, 0, 0), x);
            break;
          case 'Y':
            tempquat.setFromAxisAngle(new Vector3(0, 1, 0), y);
            break;
          case 'Z':
            tempquat.setFromAxisAngle(new Vector3(0, 0, 1), z);
            break;
        }
        this.quaternion.multiply(tempquat);
      }

      let amgQuat = new effect.Amaz.Quaternionf(this.quaternion.x, this.quaternion.y, this.quaternion.z, this.quaternion.w);

      let euler = amgQuat.quaternionToEuler();
      this.rotation.x = euler.x;
      this.rotation.y = euler.y;
      this.rotation.z = euler.z;
      this.rotation.order = order;
      
      return this.rotation;
    };



    // --- quaternion Hack ---
    this.quaternion = new Quaternion();
    let _quatX = this.quaternion.x;
    let _quatY = this.quaternion.y;
    let _quatZ = this.quaternion.z;
    let _quatW = this.quaternion.w;

    // 创建更新四元数的函数
    const updateQuaternion = () => {
      if (this._transform) {
        // 将四元数转换为AMG四元数格式并应用到transform
        const amgQuat = new effect.Amaz.Quaternionf(_quatX, _quatY, _quatZ, _quatW);
        this._transform.localOrientation = amgQuat;
      }
    };

    // 重写quaternion的x、y、z、w属性访问器
    Object.defineProperty(this.quaternion, 'x', {
      get: () => _quatX,
      set: (value) => {
        _quatX = value;
        updateQuaternion();
      },
      enumerable: true, configurable: true
    });
    Object.defineProperty(this.quaternion, 'y', {
      get: () => _quatY,
      set: (value) => {
        _quatY = value;
        updateQuaternion();
      },
      enumerable: true, configurable: true
    });
    Object.defineProperty(this.quaternion, 'z', {
      get: () => _quatZ,
      set: (value) => {
        _quatZ = value;
        updateQuaternion();
      },
      enumerable: true, configurable: true
    });
    Object.defineProperty(this.quaternion, 'w', {
      get: () => _quatW,
      set: (value) => {
        _quatW = value;
        updateQuaternion();
      },
      enumerable: true, configurable: true
    });

    // 重写quaternion的set方法
    const originalQuatSet = this.quaternion.set.bind(this.quaternion);
    this.quaternion.set = function(x, y, z, w) {
      _quatX = x;
      _quatY = y;
      _quatZ = z;
      _quatW = w;
      updateQuaternion();
      return this;
    };

    // 重写quaternion的copy方法
    const originalQuatCopy = this.quaternion.copy.bind(this.quaternion);
    this.quaternion.copy = function(q) {
      _quatX = q.x;
      _quatY = q.y;
      _quatZ = q.z;
      _quatW = q.w;
      updateQuaternion();
      return this;
    };

    // 重写quaternion的setFromAxisAngle方法
    const originalSetFromAxisAngle = this.quaternion.setFromAxisAngle.bind(this.quaternion);
    this.quaternion.setFromAxisAngle = function(axis, angle) {
      const result = originalSetFromAxisAngle(axis, angle);
      _quatX = this.x;
      _quatY = this.y;
      _quatZ = this.z;
      _quatW = this.w;
      updateQuaternion();
      return result;
    };    

    // --- Scale Hack --- 
    this.scale = new Vector3(1, 1, 1);
    let _scaleX = this.scale.x; // 缩放后备变量x
    let _scaleY = this.scale.y; // 缩放后备变量y
    let _scaleZ = this.scale.z; // 缩放后备变量z

    this.scale.setScalar = (value) => {
      _scaleX = value;
      _scaleY = value;
      _scaleZ = value;
      updateScale();
    };
    
    /**
     * 更新AMG实体的缩放
     */
    const updateScale = () => {
      if (this._transform) {
        this._transform.localScale = new effect.Amaz.Vector3f(_scaleX, _scaleY, _scaleZ);
      }
    };
    
    // 重写scale的x、y、z属性访问器
    Object.defineProperty(this.scale, 'x', {
      get: () => _scaleX,
      set: (value) => {
        _scaleX = value; // 更新后备变量
        updateScale();
      },
      enumerable: true, configurable: true
    });
    Object.defineProperty(this.scale, 'y', {
      get: () => _scaleY,
      set: (value) => {
        _scaleY = value; // 更新后备变量
        updateScale();
      },
      enumerable: true, configurable: true
    });
    Object.defineProperty(this.scale, 'z', {
      get: () => _scaleZ,
      set: (value) => {
        _scaleZ = value; // 更新后备变量
        updateScale();
      },
      enumerable: true, configurable: true
    });

    // 重写scale.set方法
    this.scale.set = (x, y, z) => {
      // 通过setter更新，确保触发updateScale
      this.scale.x = x;
      this.scale.y = y;
      this.scale.z = z;
      return this.scale;
    };
    
    
    console.log('AMG网格已创建');
  }
  
  /**
   * 设置几何体
   * @param {BufferGeometry} geometry - 几何体
   */
  _setGeometry(geometry) {
    // 已在构造函数中完成几何体设置
    console.log('几何体已设置到AMG网格');
  }
  
  /**
   * 设置材质
   * @param {Material} material - 材质
   */
  _setMaterial(material) {
    // 已在构造函数中完成材质设置
    console.log('材质已设置到AMG网格');
  }
  
  /**
   * 更新网格
   * position、rotation和scale已通过Hack处理，自动同步到AMG
   */
  update() {
    // 所有变换属性已通过Hack自动同步，无需手动处理
  }

    /**
   * 获取世界坐标位置
   * @param {Vector3} target - 目标向量，用于存储世界坐标位置
   * @returns {Vector3} 返回目标向量
   */
    getWorldPosition(target) {
      if (!target) {
        target = new Vector3();
      }
      target.copy(this.position);
      return target;
    }
  
    /**
     * 获取世界坐标四元数
     * @param {Quaternion} target - 目标四元数，用于存储世界坐标旋转
     * @returns {Quaternion} 返回目标四元数
     */
    getWorldQuaternion(target) {
      if (!target) {
        target = new Quaternion();
      }
      target.copy(this.quaternion);
      return target;
    }
  
    /**
     * 世界坐标转换为局部坐标
     * @param {Vector3} vector - 要转换的向量
     * @returns {Vector3} 返回转换后的向量
     */
    worldToLocal(vector) {
      // 简单实现：直接返回原向量
      // 如果需要考虑父级变换，需要更复杂的矩阵计算
      return vector;
    }

  seekToTime(time) {
    // 同步视频纹理
    if (this.material !== undefined && this.material instanceof MeshBasicMaterial) {
      if (this.material.map !== undefined && this.material.map instanceof VideoTexture) {
        const videoTexture = this.material.map;
        const renderer = videoTexture._amgSprite2DRenderer;
        if (renderer.materials.size() == 1) {
          const texture = renderer.materials.get(0).getTex("_MainTex");
          videoTexture.setImage(texture);
          this.material._updateMaterialParams();
          videoTexture._amgVideoAnimSeq.seekToTime(time / 1000.0);
        }
      }
    } else if (this.material !== undefined && this.material instanceof ShaderMaterial) {
      const uniforms = this.material.uniforms;
      if (uniforms !== undefined) {
        for (const [key, uniform] of Object.entries(uniforms)) {
          if (uniform.value !== undefined && uniform.value instanceof VideoTexture) {
            const videoTexture = uniform.value;
            const renderer = videoTexture._amgSprite2DRenderer;
            if (renderer.materials.size() == 1) {
              const texture = renderer.materials.get(0).getTex("_MainTex");
              videoTexture.setImage(texture);
              this.material._syncUniformToAMG(key, videoTexture);
              videoTexture._amgVideoAnimSeq.seekToTime(time / 1000.0);
            }
          }
        }
      }
    }
  }

  attach(child){
    if (!child || !child._transform) {
      console.warn('attach error: invalid child or missing _transform component');
      return;
    }
    
    this._transform.addTransform(child._transform);

    child._transform.worldPosition = child._transform.localPosition;
    child._transform.worldRotation = child._transform.localRotation;
    child._transform.worldScale = child._transform.localScale;
    return this;
  }

  lookAt(x, y, z) {

    if (x instanceof Vector3) {
      this.lookAt(x.x, x.y, x.z);
      return this;
    }

    let pos = new Vector3(this._transform.worldPosition.x, this._transform.worldPosition.y, this._transform.worldPosition.z);
    let tarOri = new Vector3(x, y, z);

    let Tar3 = new Vector3(2*pos.x - tarOri.x, 2*pos.y - tarOri.y, 2*pos.z - tarOri.z);
    let normal = Tar3.clone().normalize();
    let angle = new Vector3(0 - normal.x, 1 - normal.y, 0 - normal.z);
    if (angle.length() < 0.001) {
      return this;
    }

    let tar = new effect.Amaz.Vector3f(Tar3.x, Tar3.y, Tar3.z);

    let up = new effect.Amaz.Vector3f(0, 1, 0);
    this._transform.lookAt(tar, up);

    let newEuler =  new Amaz.Vector3f(this._transform.localEulerAngle.x, this._transform.localEulerAngle.y, this._transform.localEulerAngle.z);
    this.rotation.set(newEuler.x / 180 * Math.PI, newEuler.y / 180 * Math.PI, newEuler.z / 180 * Math.PI);
  }

  rotateX(angle) {
    this.rotation.x += angle;
    return this;
  }

  rotateY(angle) {
    this.rotation.y += angle;
    return this;
  }

  rotateZ(angle) {
    this.rotation.z += angle;
    return this;
  }

  /**
   * 释放网格资源
   */
  dispose() {
    if (this._amgEntity) {
      // 从场景中移除实体
      const currentScene = getCurrentScene();
      if (currentScene && currentScene._amgScene) {
        currentScene._amgScene.removeEntity(this._amgEntity);
      }
      
      // 清理组件
      if (this._amgMeshRenderer) {
        this._amgEntity.removeComponent(this._amgMeshRenderer);
        this._amgMeshRenderer = null;
      }
      
      if (this._transform) {
        this._amgEntity.removeComponent(this._transform);
        this._transform = null;
      }
      
      this._amgEntity = null;
    }
    
    // 清理几何体和材质
    if (this.geometry && this.geometry.dispose) {
      this.geometry.dispose();
    }
    
    if (this.material) {
      if (Array.isArray(this.material)) {
        this.material.forEach(material => {
          if (material.dispose) material.dispose();
        });
      } else if (this.material.dispose) {
        this.material.dispose();
      }
    }
    
    console.log('Mesh: 资源已释放');
  }
}

class Texture {
  constructor() {
    this._amgObject = null;
    
    // 存储使用此纹理的材质列表
    this._materials = [];
    
    // 创建带回调的 Vector2 对象
    this.repeat = new Vector2(1, 1);
    this.offset = new Vector2(0, 0);
    
    // 为 repeat 和 offset 添加监听
    this._setupListeners();

    this._wrapS = THREE.ClampToEdgeWrapping;
    Object.defineProperty(this, 'wrapS', {
      get: () => this._wrapS,
      set: (value) => {
        this._wrapS = value;
        if (this._amgObject !== undefined) {
          if (value == THREE.RepeatWrapping) {
            this._amgObject.wrapModeS = Amaz.WrapMode.REPEAT;
          } else if (value == THREE.ClampToEdgeWrapping) {
            this._amgObject.wrapModeS = Amaz.WrapMode.CLAMP;
          } else if (value == THREE.MirroredRepeatWrapping) {
            this._amgObject.wrapModeS = Amaz.WrapMode.Mirror;
          }
        }
      },
      enumerable: true,
      configurable: true
    });

    this._wrapT = THREE.ClampToEdgeWrapping;
    Object.defineProperty(this, 'wrapT', {
      get: () => this._wrapT,
      set: (value) => {
        this._wrapT = value;
        if (this._amgObject !== undefined) {
          if (value == THREE.RepeatWrapping) {
            this._amgObject.wrapModeT = Amaz.WrapMode.REPEAT;
          } else if (value == THREE.ClampToEdgeWrapping) {
            this._amgObject.wrapModeT = Amaz.WrapMode.CLAMP;
          } else if (value == THREE.MirroredRepeatWrapping) {
            this._amgObject.wrapModeT = Amaz.WrapMode.Mirror;
          }
        }
      },
      enumerable: true,
      configurable: true
    });
  }

  setImage(image) {
    this._amgObject = image;
    this.image = image;
    this.wrapS = this._wrapS;
    this.wrapT = this._wrapT;
  }

  clone() {
    const cloned = new Texture();
    cloned._amgObject = this._amgObject;
    cloned.repeat.set(this.repeat.x, this.repeat.y);
    cloned.offset.set(this.offset.x, this.offset.y);
    return cloned;
  }
  
  // 添加使用此纹理的材质
  _addMaterial(material) {
    if (!this._materials.includes(material)) {
      this._materials.push(material);
    }
  }
  
  // 移除材质引用
  _removeMaterial(material) {
    const index = this._materials.indexOf(material);
    if (index > -1) {
      this._materials.splice(index, 1);
    }
  }
  
  // 设置监听器
  _setupListeners() {
    // 使用 Proxy 来拦截 repeat 属性的修改
    this.repeat = new Proxy(this.repeat, {
      set: (target, property, value) => {
        target[property] = value;
        this._notifyMaterials();
        return true;
      }
    });
    
    // 使用 Proxy 来拦截 offset 属性的修改
    this.offset = new Proxy(this.offset, {
      set: (target, property, value) => {
        target[property] = value;
        this._notifyMaterials();
        return true;
      }
    });
    
    // 重写 repeat 和 offset 的 set 方法
    const originalRepeatSet = this.repeat.set.bind(this.repeat);
    this.repeat.set = (x, y) => {
      const result = originalRepeatSet(x, y);
      this._notifyMaterials();
      return result;
    };
    
    const originalOffsetSet = this.offset.set.bind(this.offset);
    this.offset.set = (x, y) => {
      const result = originalOffsetSet(x, y);
      this._notifyMaterials();
      return result;
    };
  }
  
  // 通知所有使用此纹理的材质更新
  _notifyMaterials() {
    this._materials.forEach(material => {
      if (material._updateTextureParams) {
        material._updateTextureParams();
      }
    });
  }
}

class VideoTexture extends Texture {
  constructor(path, loop, playbackRate) {
    super();
    this.path = path;
    this.loop = loop;
    this.playbackRate = playbackRate;
  }

  clone() {
    const cloned = new VideoTexture(this.path, this.loop, this.playbackRate);
    cloned._amgObject = this._amgObject;
    cloned.repeat.set(this.repeat.x, this.repeat.y);
    cloned.offset.set(this.offset.x, this.offset.y);
    return cloned;
  }

  load() {
    const amgScene = getCurrentScene()._amgScene;
    this._amgEntity = new Amaz.Entity();
    this._amgEntity.name = "VideoTextureEntity";
    this._amgEntity.scene = amgScene;
    this._transform = this._amgEntity.addComponent("Transform");
    this._amgVideoAnimSeq = this._amgEntity.addComponent("VideoAnimSeq");
    this._amgVideoAnimSeq.videoFilename = this.path;
    this._amgVideoAnimSeq.texName = "_MainTex";
    if (this.loop) {
      this._amgVideoAnimSeq.playmode = Amaz.PlayMode.loop;
    } else {
      this._amgVideoAnimSeq.playmode = Amaz.PlayMode.once;
    }
    this._amgVideoAnimSeq.speed = this.playbackRate;
    this._amgVideoAnimSeq.autoplay = true;
    this._amgVideoAnimSeq.enableAlphaBlend = false;
    this._amgVideoAnimSeq.enableFixedSeekMode = true;
    this._amgSprite2DRenderer = this._amgEntity.addComponent("Sprite2DRenderer");
    this._amgSprite2DRenderer.enabled = false;
    amgScene.addEntity(this._amgEntity);
  }
}

class TextureLoader {
  constructor() {

  }

  load(url, onLoad, onProgress, onError) {
		const texture = new Texture();
    const assetMgr = getCurrentScene()._amgScene.assetMgr;
    texture.setImage(assetMgr.SyncLoad(url));
    if (onLoad !== undefined) {
				onLoad(texture);
    }
		return texture;
	}
}

/**
 * 对象组
 * 允许将多个3D对象组织为一个整体进行操作
 */
class Group {
  /**
   * 创建一个对象组
   * @param {string} [name='Group'] - 组的名称
   */
  constructor(name = 'Group') {
    // 创建AMG实体
    this._amgEntity = new Amaz.Entity();
    this._amgEntity.name = name || "Group_w";
    
    // 添加变换组件
    this._transform = this._amgEntity.addComponent("Transform");
    
    // 组内子对象列表
    this.children = [];
    
    // 用户数据对象，可用于存储自定义属性
    this.userData = {};
    
    // 组的可见性
    this.visible = true;
    
    // 组的名称
    this.name = name;

    // --- name Hack --- 
    Object.defineProperty(this, 'name', {
      get: () => this._amgEntity.name,
      set: (value) => {
        this._amgEntity.name = value;
      },
    });
    
    // --- Position Hack --- 
    this.position = new Vector3();
    let _posX = this.position.x; // 位置后备变量x
    let _posY = this.position.y; // 位置后备变量y
    let _posZ = this.position.z; // 位置后备变量z
    
    /**
     * 更新AMG实体的位置
     */
    const updateTransform = () => {
      if (this._transform) {
        this._transform.localPosition = new effect.Amaz.Vector3f(_posX, _posY, _posZ);
      }
    };
    
    // 重写position的x、y、z属性访问器
    Object.defineProperty(this.position, 'x', {
      get: () => _posX,
      set: (value) => {
        _posX = value; // 更新后备变量
        updateTransform();
      },
      enumerable: true, configurable: true
    });
    Object.defineProperty(this.position, 'y', {
      get: () => _posY,
      set: (value) => {
        _posY = value; // 更新后备变量
        updateTransform();
      },
      enumerable: true, configurable: true
    });
    Object.defineProperty(this.position, 'z', {
      get: () => _posZ,
      set: (value) => {
        _posZ = value; // 更新后备变量
        updateTransform();
      },
      enumerable: true, configurable: true
    });

    // 重写position.set方法
    this.position.set = (x, y, z) => {
      // 通过setter更新，确保触发updateTransform
      this.position.x = x;
      this.position.y = y;
      this.position.z = z;
      return this.position;
    };

    this.position.copy = (v) => {
      this.position.x = v.x;
      this.position.y = v.y;
      this.position.z = v.z;
      return this.position;
    };
    
    // --- Rotation Hack --- 
    this.rotation = new Euler();
    let _rotX = this.rotation.x; // 旋转后备变量x
    let _rotY = this.rotation.y; // 旋转后备变量y
    let _rotZ = this.rotation.z; // 旋转后备变量z
    
    /**
     * 更新AMG实体的旋转
     */
    const updateRotation = () => {
      if (this._transform) {
        // 将欧拉角转换为AMG欧拉角格式
        const radX = _rotX / Math.PI * 180;
        const radY = _rotY / Math.PI * 180;
        const radZ = _rotZ / Math.PI * 180;
        this._transform.localEulerAngle = new effect.Amaz.Vector3f(radX, radY, radZ);
      }
    };
    
    // 重写rotation的x、y、z属性访问器
    Object.defineProperty(this.rotation, 'x', {
      get: () => _rotX,
      set: (value) => {
        _rotX = value; // 更新后备变量
        updateRotation();
      },
      enumerable: true, configurable: true
    });
    Object.defineProperty(this.rotation, 'y', {
      get: () => _rotY,
      set: (value) => {
        _rotY = value; // 更新后备变量
        updateRotation();
      },
      enumerable: true, configurable: true
    });
    Object.defineProperty(this.rotation, 'z', {
      get: () => _rotZ,
      set: (value) => {
        _rotZ = value; // 更新后备变量
        updateRotation();
      },
      enumerable: true, configurable: true
    });
    
    // 重写rotation.set方法，支持旋转顺序
    this.rotation.set = (x, y, z, order) => {
      if (order === undefined || order === null) {
        // 没有指定旋转顺序时，使用默认的XYZ顺序
        this.rotation.x = x;
        this.rotation.y = y;
        this.rotation.z = z;
        return this.rotation;
      }
      
      // 先设置旋转顺序
      this.rotation.order = order;
      this.quaternion = new Quaternion();

      // 按照指定顺序设置旋转值
      for (let i = 0; i < order.length; i++) {
        const char = order[i];
        let tempquat = new Quaternion();
        switch (char) {
          case 'X':
            tempquat.setFromAxisAngle(new Vector3(1, 0, 0), x);
            break;
          case 'Y':
            tempquat.setFromAxisAngle(new Vector3(0, 1, 0), y);
            break;
          case 'Z':
            tempquat.setFromAxisAngle(new Vector3(0, 0, 1), z);
            break;
        }
        this.quaternion.multiply(tempquat);
      }

      let amgQuat = new effect.Amaz.Quaternionf(this.quaternion.x, this.quaternion.y, this.quaternion.z, this.quaternion.w);

      let euler = amgQuat.quaternionToEuler();
      this.rotation.x = euler.x;
      this.rotation.y = euler.y;
      this.rotation.z = euler.z;
      this.rotation.order = order;
      
      return this.rotation;
    };
    
    // 缩放属性
    // --- Scale Hack --- 
    this.scale = new Vector3(1, 1, 1);
    let _scaleX = this.scale.x;
    let _scaleY = this.scale.y;
    let _scaleZ = this.scale.z;
    
    /**
     * 更新AMG实体的缩放
     */
    const updateScale = () => {
      if (this._transform) {
        this._transform.localScale = new effect.Amaz.Vector3f(_scaleX, _scaleY, _scaleZ);
      }
    };
    
    // 重写scale的x、y、z属性访问器
    Object.defineProperty(this.scale, 'x', {
      get: () => _scaleX,
      set: (value) => {
        _scaleX = value;
        updateScale();
      },
      enumerable: true, configurable: true
    });
    Object.defineProperty(this.scale, 'y', {
      get: () => _scaleY,
      set: (value) => {
        _scaleY = value;
        updateScale();
      },
      enumerable: true, configurable: true
    });
    Object.defineProperty(this.scale, 'z', {
      get: () => _scaleZ,
      set: (value) => {
        _scaleZ = value;
        updateScale();
      },
      enumerable: true, configurable: true
    });
    
    // 重写scale.set方法
    this.scale.set = (x, y, z) => {
      this.scale.x = x;
      this.scale.y = y;
      this.scale.z = z;
      return this.scale;
    };

    // --- quaternion Hack ---
    this.quaternion = new Quaternion();
    let _quatX = this.quaternion.x;
    let _quatY = this.quaternion.y;
    let _quatZ = this.quaternion.z;
    let _quatW = this.quaternion.w;
    
    const updateQuaternion = () => {
      if (this._transform) {
        this._transform.localOrientation = new effect.Amaz.Quaternionf(_quatX, _quatY, _quatZ, _quatW);
      }
    };
    
    Object.defineProperty(this.quaternion, 'x', {
      get: () => _quatX,
      set: (value) => {
        _quatX = value;
        updateQuaternion();
      },
      enumerable: true, configurable: true
    });
    
    Object.defineProperty(this.quaternion, 'y', {
      get: () => _quatY,
      set: (value) => {
        _quatY = value;
        updateQuaternion();
      },
      enumerable: true, configurable: true
    });
    
    Object.defineProperty(this.quaternion, 'z', {
      get: () => _quatZ,
      set: (value) => {
        _quatZ = value;
        updateQuaternion();
      },
      enumerable: true, configurable: true
    });
    
    Object.defineProperty(this.quaternion, 'w', {
      get: () => _quatW,
      set: (value) => {
        _quatW = value;
        updateQuaternion();
      },
      enumerable: true, configurable: true
    });
  }
  
  /**
   * 添加子对象到组中
   * @param {Object} object - 要添加的对象，通常是Mesh或其他Group
   * @returns {Group} 返回组实例自身，支持链式调用
   */
  add(object) {
    if (object === this) {
      console.warn('Group.add: 不能将组添加到自身');
      return this;
    }
    
    if (object.parent !== undefined) {
      object.parent.remove(object);
    }
    
    object.parent = this;
    this.children.push(object);
    
    // 如果子对象有AMG实体，将其设置为当前组的子实体
    if (object._transform) {
      this._transform.addTransform(object._transform);
    }
    
    return this;
  }
  
  /**
   * 从组中移除子对象
   * @param {Object} object - 要移除的对象
   * @returns {Group} 返回组实例自身，支持链式调用
   */
  remove(object) {
    const index = this.children.indexOf(object);
    
    if (index !== -1) {
      object.parent = undefined;
      this.children.splice(index, 1);
      
      // 如果子对象有AMG实体，断开与当前组的关系
      const currentScene = getCurrentScene();
      if (currentScene && currentScene._amgScene) {
        currentScene._amgScene.removeEntity(object._amgEntity);
      }
    }
    
    return this;
  }
  
  // traverse
  traverse(callback) {
    callback(this);
    this.children.forEach(child => {
      if (child.traverse && typeof child.traverse === 'function') {
        child.traverse(callback);
      } else {
        // 如果child没有traverse方法，直接对其调用callback
        callback(child);
      }
    });
  }

  worldToLocal(wortldPos)
  {
    let localPos = new Vector3();
    if (!this._transform || !wortldPos) {
      return localPos;
    }

    // 1) 去除平移（世界 -> 以组为原点的坐标）
    const thisWorldPos = this._transform.worldPosition;
    localPos.set(
      wortldPos.x - thisWorldPos.x,
      wortldPos.y - thisWorldPos.y,
      wortldPos.z - thisWorldPos.z
    );

    // 2) 去除旋转（应用组世界旋转的共轭）
    try {
      if (this._transform.worldOrientation) {
        // 优先使用世界四元数
        const worldQ = new Quaternion().fromAMGQuaternion(this._transform.worldOrientation).normalize();
        const invQ = new Quaternion(-worldQ.x, -worldQ.y, -worldQ.z, worldQ.w).normalize();
        localPos.applyQuaternion(invQ);
      } else if (this._transform.worldRotation) {
        // 备用：使用世界欧拉角（通常为度），转换为四元数后取共轭
        const ex = this._transform.worldRotation.x / 180 * Math.PI;
        const ey = this._transform.worldRotation.y / 180 * Math.PI;
        const ez = this._transform.worldRotation.z / 180 * Math.PI;
        const worldEuler = new Euler(ex, ey, ez);
        const worldQ = new Quaternion().setFromEuler(worldEuler).normalize();
        const invQ = new Quaternion(-worldQ.x, -worldQ.y, -worldQ.z, worldQ.w).normalize();
        localPos.applyQuaternion(invQ);
      }
    } catch (e) {
      // 忽略不可用的世界旋转信息
    }

    // 3) 去除缩放（按世界缩放的倒数缩放）
    if (this._transform.worldScale) {
      const ws = this._transform.worldScale;
      const sx = ws.x || 1;
      const sy = ws.y || 1;
      const sz = ws.z || 1;
      if (sx !== 0) localPos.x /= sx;
      if (sy !== 0) localPos.y /= sy;
      if (sz !== 0) localPos.z /= sz;
    }

    return localPos;
  }

  updateMatrixWorld(boolean)
  {
    if (this._transform && boolean) {
      //todo
    }
  }

  getWorldPosition(vector)
  {
    if (this._transform && vector) {
      vector.set(this._transform.worldPosition.x, this._transform.worldPosition.y, this._transform.worldPosition.z);
    }
  }

  /**
   * 释放组资源，同时清理所有子对象
   */
  dispose() {
    if (this._amgEntity) {
      // 先清理所有子对象
      while (this.children.length > 0) {
        const child = this.children[0];
        this.remove(child);
        
        // 如果子对象有自己的dispose方法，调用它
        if (child.dispose && typeof child.dispose === 'function') {
          child.dispose();
        }
      }
      
      // 从场景中移除实体
      const currentScene = getCurrentScene();
      if (currentScene && currentScene._amgScene) {
        currentScene._amgScene.removeEntity(this._amgEntity);
      }
      
      // 清理组件
      if (this._transform) {
        this._amgEntity.removeComponent(this._transform);
        this._transform = null;
      }
      
      this._amgEntity = null;
    }
    
    // 清空子对象数组
    this.children = [];
    
    console.log('Group: 资源已释放');
  }
}

/**
 * 四元数类
 * 用于表示3D空间中的旋转
 */
class Quaternion {
  /**
   * 创建四元数
   * @param {number} [x=0]
   * @param {number} [y=0]
   * @param {number} [z=0]
   * @param {number} [w=1]
   */
  constructor(x = 0, y = 0, z = 0, w = 1) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
  }

  /**
   * 设置四元数的x、y、z、w值
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @param {number} w
   * @returns {Quaternion} 当前实例
   */
  set(x, y, z, w) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
    return this;
  }

  /**
   * 从另一个四元数复制
   * @param {Quaternion} q
   * @returns {Quaternion} 当前实例
   */
  copy(q) {
    this.x = q.x;
    this.y = q.y;
    this.z = q.z;
    this.w = q.w;
    return this;
  }

  /**
   * 克隆当前四元数
   * @returns {Quaternion} 新的四元数实例
   */
  clone() {
    return new Quaternion(this.x, this.y, this.z, this.w);
  }

  /**
   * 归一化四元数
   * @returns {Quaternion} 当前实例
   */
  normalize() {
    const len = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
    if (len > 0) {
      const invLen = 1 / len;
      this.x *= invLen;
      this.y *= invLen;
      this.z *= invLen;
      this.w *= invLen;
    }
    return this;
  }

  identity() {
    this.x = 0;
    this.y = 0;
    this.z = 0;
    this.w = 1;
    return this;
  }

  /**
   * 四元数乘法（右乘）
   * @param {Quaternion} q
   * @returns {Quaternion} 当前实例
   */
  multiply(q) {
    const x = this.x, y = this.y, z = this.z, w = this.w;
    const qx = q.x, qy = q.y, qz = q.z, qw = q.w;
    this.x = w * qx + x * qw + y * qz - z * qy;
    this.y = w * qy - x * qz + y * qw + z * qx;
    this.z = w * qz + x * qy - y * qx + z * qw;
    this.w = w * qw - x * qx - y * qy - z * qz;
    return this;
  }

  /**
   * 从轴-角设置四元数
   * @param {Vector3} axis - 单位轴
   * @param {number} angle - 弧度
   * @returns {Quaternion} 当前实例
   */
  setFromAxisAngle(axis, angle) {
    const halfAngle = angle / 2;
    const s = Math.sin(halfAngle);
    this.x = axis.x * s;
    this.y = axis.y * s;
    this.z = axis.z * s;
    this.w = Math.cos(halfAngle);
    return this;
  }

  /**
   * 从欧拉角设置四元数
   * @param {Euler} euler
   * @returns {Quaternion} 当前实例
   */
  setFromEuler(euler) {
    const x = euler.x / 2;
    const y = euler.y / 2;
    const z = euler.z / 2;
    
    const cx = Math.cos(x);
    const sx = Math.sin(x);
    const cy = Math.cos(y);
    const sy = Math.sin(y);
    const cz = Math.cos(z);
    const sz = Math.sin(z);
    
    // 根据旋转顺序计算四元数
    // 假设使用 XYZ 旋转顺序
    this.x = sx * cy * cz + cx * sy * sz;
    this.y = cx * sy * cz - sx * cy * sz;
    this.z = cx * cy * sz + sx * sy * cz;
    this.w = cx * cy * cz - sx * sy * sz;
    
    return this;
  }

  slerp(q, t) {
    // 计算点积
    const dot = this.x * q.x + this.y * q.y + this.z * q.z + this.w * q.w;
    
    // 确保走最短路径
    let qx = q.x, qy = q.y, qz = q.z, qw = q.w;
    if (dot < 0) {
      qx = -qx; qy = -qy; qz = -qz; qw = -qw;
    }
    
    // 限制点积范围
    const dotClamped = Math.max(-1, Math.min(1, dot));
    const theta = Math.acos(Math.abs(dotClamped));
    
    if (theta < 0.001) {
      // 角度很小时使用线性插值
      this.x = this.x + (qx - this.x) * t;
      this.y = this.y + (qy - this.y) * t;
      this.z = this.z + (qz - this.z) * t;
      this.w = this.w + (qw - this.w) * t;
    } else {
      // 真正的球面线性插值
      const sinTheta = Math.sin(theta);
      const sinThetaT = Math.sin(theta * t);
      const sinTheta1T = Math.sin(theta * (1 - t));
      
      this.x = (this.x * sinTheta1T + qx * sinThetaT) / sinTheta;
      this.y = (this.y * sinTheta1T + qy * sinThetaT) / sinTheta;
      this.z = (this.z * sinTheta1T + qz * sinThetaT) / sinTheta;
      this.w = (this.w * sinTheta1T + qw * sinThetaT) / sinTheta;
    }
    
    // 归一化
    this.normalize();
    
    return this;
  }

  /**
   * 转为数组
   * @returns {number[]} [x, y, z, w]
   */
  toArray() {
    return [this.x, this.y, this.z, this.w];
  }

  /**
   * 转为字符串
   * @returns {string}
   */
  toString() {
    return `Quaternion(${this.x}, ${this.y}, ${this.z}, ${this.w})`;
  }

  /**
   * 转为AMG四元数
   * @returns {effect.Amaz.Quaternionf}
   */
  toAMGQuaternion() {
    return new effect.Amaz.Quaternionf(this.x, this.y, this.z, this.w);
  }

  /**
   * 从AMG四元数设置
   * @param {effect.Amaz.Quaternionf} q
   * @returns {Quaternion}
   */
  fromAMGQuaternion(q) {
    this.x = q.x;
    this.y = q.y;
    this.z = q.z;
    this.w = q.w;
    return this;
  }
}

// 添加数学工具
const MathUtils = {
  lerp: (a, b, t) => a + (b - a) * t,
  degToRad: (degrees) => degrees * Math.PI / 180,
  randFloat: (min, max) => Math.random() * (max - min) + min,
  clamp: (value, min, max) => Math.min(Math.max(value, min), max)
};

// 添加矩阵4类
class Matrix4 {
  constructor() {
    this.elements = new Float32Array(16);
    this.identity();
  }

  identity() {
    const te = this.elements;
    te[0] = 1; te[4] = 0; te[8] = 0; te[12] = 0;
    te[1] = 0; te[5] = 1; te[9] = 0; te[13] = 0;
    te[2] = 0; te[6] = 0; te[10] = 1; te[14] = 0;
    te[3] = 0; te[7] = 0; te[11] = 0; te[15] = 1;
    return this;
  }

  copy(m) {
    const te = this.elements;
    const me = m.elements;
    te[0] = me[0]; te[1] = me[1]; te[2] = me[2]; te[3] = me[3];
    te[4] = me[4]; te[5] = me[5]; te[6] = me[6]; te[7] = me[7];
    te[8] = me[8]; te[9] = me[9]; te[10] = me[10]; te[11] = me[11];
    te[12] = me[12]; te[13] = me[13]; te[14] = me[14]; te[15] = me[15];
    return this;
  }

  multiplyMatrices(a, b) {
    const ae = a.elements;
    const be = b.elements;
    const te = this.elements;

    const a11 = ae[0], a12 = ae[4], a13 = ae[8], a14 = ae[12];
    const a21 = ae[1], a22 = ae[5], a23 = ae[9], a24 = ae[13];
    const a31 = ae[2], a32 = ae[6], a33 = ae[10], a34 = ae[14];
    const a41 = ae[3], a42 = ae[7], a43 = ae[11], a44 = ae[15];

    const b11 = be[0], b12 = be[4], b13 = be[8], b14 = be[12];
    const b21 = be[1], b22 = be[5], b23 = be[9], b24 = be[13];
    const b31 = be[2], b32 = be[6], b33 = be[10], b34 = be[14];
    const b41 = be[3], b42 = be[7], b43 = be[11], b44 = be[15];

    te[0] = a11 * b11 + a12 * b21 + a13 * b31 + a14 * b41;
    te[4] = a11 * b12 + a12 * b22 + a13 * b32 + a14 * b42;
    te[8] = a11 * b13 + a12 * b23 + a13 * b33 + a14 * b43;
    te[12] = a11 * b14 + a12 * b24 + a13 * b34 + a14 * b44;

    te[1] = a21 * b11 + a22 * b21 + a23 * b31 + a24 * b41;
    te[5] = a21 * b12 + a22 * b22 + a23 * b32 + a24 * b42;
    te[9] = a21 * b13 + a22 * b23 + a23 * b33 + a24 * b43;
    te[13] = a21 * b14 + a22 * b24 + a23 * b34 + a24 * b44;

    te[2] = a31 * b11 + a32 * b21 + a33 * b31 + a34 * b41;
    te[6] = a31 * b12 + a32 * b22 + a33 * b32 + a34 * b42;
    te[10] = a31 * b13 + a32 * b23 + a33 * b33 + a34 * b43;
    te[14] = a31 * b14 + a32 * b24 + a33 * b34 + a34 * b44;

    te[3] = a41 * b11 + a42 * b21 + a43 * b31 + a44 * b41;
    te[7] = a41 * b12 + a42 * b22 + a43 * b32 + a44 * b42;
    te[11] = a41 * b13 + a42 * b23 + a43 * b33 + a44 * b43;
    te[15] = a41 * b14 + a42 * b24 + a43 * b34 + a44 * b44;

    return this;
  }

  compose(position, quaternion, scale) {
    // 简化的实现
    this.identity();
    return this;
  }

  decompose(position, quaternion, scale) {
    // 简化的实现
    position.set(0, 0, 0);
    quaternion.set(0, 0, 0, 1);
    scale.set(1, 1, 1);
  }
}

// 添加所有类到THREE命名空间
THREE.Vector2 = Vector2;
THREE.Vector3 = Vector3;
THREE.Vector4 = Vector4;
THREE.Euler = Euler;
THREE.Color = Color;
THREE.Matrix4 = Matrix4;
THREE.WebGLRenderer = WebGLRenderer;
THREE.Scene = Scene;
THREE.PerspectiveCamera = PerspectiveCamera;
THREE.BufferGeometry = BufferGeometry;
THREE.BufferAttribute = BufferAttribute;
THREE.BoxGeometry = BoxGeometry;
THREE.PlaneGeometry = PlaneGeometry;
THREE.SphereGeometry = SphereGeometry;
THREE.CylinderGeometry = CylinderGeometry;
THREE.CapsuleGeometry = CapsuleGeometry;
THREE.Material = Material;
THREE.Texture = Texture;
THREE.VideoTexture = VideoTexture;
THREE.TextureLoader = TextureLoader;
THREE.MeshBasicMaterial = MeshBasicMaterial;
THREE.ShaderMaterial = ShaderMaterial;
THREE.Mesh = Mesh;
THREE.Quaternion = Quaternion;

THREE.Group = Group;
THREE.Object3D = Group;

THREE.MathUtils = MathUtils;

// 导出THREE命名空间和工具函数
exports.THREE = THREE;
exports.getCurrentScene = getCurrentScene; 