// 编辑器客户端入口文件
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';

// 将Three.js和控制器添加到全局作用域，供editor.js使用
window.THREE = THREE;
window.THREE.OrbitControls = OrbitControls;
window.THREE.TransformControls = TransformControls;

console.log('Three.js 编辑器依赖加载完成'); 