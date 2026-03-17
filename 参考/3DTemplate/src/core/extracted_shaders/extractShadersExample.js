/**
 * 着色器提取使用示例
 * 展示如何使用ShaderExtractor从ScriptScene中提取着色器
 */

// 现在导入其他模块，它们会使用我们hack的THREE对象
const THREE = require('three');
const ShaderExtractor = require('./shaderExtractor');
const ScriptScene = require('../scriptScene');

// Node.js环境兼容性处理
if (typeof window === 'undefined') {
  // 在Node.js环境中模拟浏览器全局对象
  global.window = {
    innerWidth: 600,
    innerHeight: 600,
    devicePixelRatio: 1,
    addEventListener: () => {},
    removeEventListener: () => {}
  };
  global.document = {
    body: {
      appendChild: () => {}
    },
    createElementNS: (namespace, tagName) => {
      // 模拟canvas元素
      if (tagName === 'canvas') {
        return {
          style: {},
          addEventListener: () => {},
          removeEventListener: () => {},
          getContext: (type) => {
            if (type === 'webgl' || type === 'webgl2') {
              return {
                getParameter: (param) => {
                  // 模拟WebGL参数
                  switch (param) {
                    case 0x1F00: return 'WebGL 1.0'; // VERSION
                    case 0x1F01: return 'WebGL'; // SHADING_LANGUAGE_VERSION
                    case 0x8B8C: return 8; // MAX_VERTEX_ATTRIBS
                    case 0x8B8D: return 8; // MAX_VERTEX_UNIFORM_VECTORS
                    case 0x8B8E: return 8; // MAX_VARYING_VECTORS
                    case 0x8B8F: return 8; // MAX_COMBINED_TEXTURE_IMAGE_UNITS
                    case 0x8B4D: return 8; // MAX_VERTEX_TEXTURE_IMAGE_UNITS
                    case 0x8B4E: return 8; // MAX_TEXTURE_IMAGE_UNITS
                    case 0x8B4F: return 8; // MAX_FRAGMENT_UNIFORM_VECTORS
                    case 0x8B4A: return 8; // MAX_DRAW_BUFFERS
                    case 0x8B4B: return 8; // MAX_VIEWPORT_DIMS
                    case 0x8B4C: return 8; // MAX_CUBE_MAP_TEXTURE_SIZE
                    case 0x8B4D: return 8; // MAX_VERTEX_ATTRIBS
                    case 0x8B4E: return 8; // MAX_VERTEX_UNIFORM_VECTORS
                    case 0x8B4F: return 8; // MAX_VARYING_VECTORS
                    case 0x8B4A: return 8; // MAX_COMBINED_TEXTURE_IMAGE_UNITS
                    case 0x8B4B: return 8; // MAX_VIEWPORT_DIMS
                    case 0x8B4C: return 8; // MAX_CUBE_MAP_TEXTURE_SIZE
                    default: return 0;
                  }
                },
                                 getExtension: () => null,
                createBuffer: () => ({}),
                createTexture: () => ({}),
                createProgram: () => ({}),
                createShader: () => ({}),
                createFramebuffer: () => ({}),
                createRenderbuffer: () => ({}),
                bindBuffer: () => {},
                bindTexture: () => {},
                bindFramebuffer: () => {},
                bindRenderbuffer: () => {},
                bufferData: () => {},
                texImage2D: () => {},
                texParameteri: () => {},
                framebufferTexture2D: () => {},
                framebufferRenderbuffer: () => {},
                renderbufferStorage: () => {},
                clearColor: () => {},
                clear: () => {},
                viewport: () => {},
                drawArrays: () => {},
                drawElements: () => {},
                useProgram: () => {},
                getAttribLocation: () => -1,
                getUniformLocation: () => ({}),
                vertexAttribPointer: () => {},
                enableVertexAttribArray: () => {},
                uniformMatrix4fv: () => {},
                uniform1f: () => {},
                uniform2f: () => {},
                uniform3f: () => {},
                uniform4f: () => {},
                uniform1i: () => {},
                uniform2i: () => {},
                uniform3i: () => {},
                uniform4i: () => {},
                uniform1fv: () => {},
                uniform2fv: () => {},
                uniform3fv: () => {},
                uniform4fv: () => {},
                uniform1iv: () => {},
                uniform2iv: () => {},
                uniform3iv: () => {},
                uniform4iv: () => {},
                uniformMatrix3fv: () => {},
                uniformMatrix2fv: () => {},
                deleteBuffer: () => {},
                deleteTexture: () => {},
                deleteProgram: () => {},
                deleteShader: () => {},
                deleteFramebuffer: () => {},
                deleteRenderbuffer: () => {},
                isBuffer: () => false,
                isTexture: () => false,
                isProgram: () => false,
                isShader: () => false,
                isFramebuffer: () => false,
                isRenderbuffer: () => false
              };
            }
            return null;
          }
        };
      } else if (tagName === 'img') {
        const obj = {
          listeners: {},
          addEventListener: (name, func, options) => {
            if (!obj.listeners[name]) {
              obj.listeners[name] = [];
            }
            obj.listeners[name].push(func);
          },
          removeEventListener: () => {},
          set src(url) {
            const loadListeners = obj.listeners['load'];
            if (loadListeners) {
              for (var i = 0; i < loadListeners.length; ++i) {
                const func = loadListeners[i];
                func(obj);
              }
            }
          },
        };
        return obj;
      }
      return {};
    }
  };
  global.requestAnimationFrame = (callback) => setTimeout(callback, 16);
  global.cancelAnimationFrame = (id) => clearTimeout(id);
}

function createDefaultTexture() {
  // 纹理尺寸：4x4像素
  const width = 4;
  const height = 4;
  const pixelCount = width * height;
  const dataSize = pixelCount * 4;
  const pixelData = new Uint8Array(dataSize);
  const defaultTexture = new THREE.DataTexture(
      pixelData,       // 像素数据
      width,           // 宽度
      height,          // 高度
      THREE.RGBAFormat, // 像素格式
      THREE.UnsignedByteType // 数据类型
  );
  defaultTexture.wrapS = THREE.ClampToEdgeWrapping;
  defaultTexture.wrapT = THREE.ClampToEdgeWrapping;
  defaultTexture.minFilter = THREE.NearestFilter;
  defaultTexture.magFilter = THREE.NearestFilter;
  defaultTexture.needsUpdate = true;
  return defaultTexture;
}

/**
 * 从特定对象提取着色器的示例
 */
async function extractFromSpecificObject() {
  console.log('\n=== 从特定对象提取着色器示例 ===');
  console.log('process.cwd:',process.cwd());
  
  const extractor = new ShaderExtractor();
  extractor.setOutputDirectory('./out/');

  const textureLoader = new THREE.TextureLoader();
  const defaultTexture = createDefaultTexture();

  // 创建模拟对象
  const scriptScene = new ScriptScene("tempAMGScene");
  scriptScene.texture1 = defaultTexture;
  scriptScene.texture2 = defaultTexture;
  scriptScene.texture3 = defaultTexture;
  scriptScene.texture4 = defaultTexture;
  scriptScene.texture5 = defaultTexture;
  scriptScene.texture6 = defaultTexture;
  scriptScene.texture7 = defaultTexture;
  scriptScene.texture8 = defaultTexture;
  scriptScene.texture9 = defaultTexture;
  scriptScene.setupScene();
  const mockObject = scriptScene.scene;
  
  const waitForSceneUpdate = new Promise((resolve) => {
    let count = 0;
    const timer = setInterval(() => {
        count++;
        scriptScene.seekToTime(0);
        if (count > 2) {
          clearInterval(timer);
          resolve();
        }
      }, 1000);
  });
  await waitForSceneUpdate;

  // 从特定对象提取着色器
  const extractedShaders = extractor.extractFromObject(mockObject, '');
  
  console.log(`从特定对象提取了 ${extractedShaders.size} 个着色器`);
}

async function main() {
  await extractFromSpecificObject();
}

// 如果直接运行此文件，执行主函数
if (require.main === module) {
  // 执行主提取函数
  main().catch(err => console.error('主函数出错:', err)); // 捕获所有未处理的错误
}

// 导出函数供其他模块使用
module.exports = {
  extractFromSpecificObject
}; 