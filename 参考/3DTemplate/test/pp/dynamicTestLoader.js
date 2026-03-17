// 动态测试加载器
// 用于动态加载不同的测试模块

// 测试模块映射
const testModules = {
  'LumiBCC_PrismTest': () => import('./LumiBCC_PrismTest.js'),
  'LumiBendTest': () => import('./LumiBendTest.js'),
  'LumiBezierDeformationTest': () => import('./LumiBezierDeformationTest.js'),
  'LumiBokehBlurTest': () => import('./LumiBokehBlurTest.js'),
  'LumiBrightnessTest': () => import('./LumiBrightnessTest.js'),
  'LumiBulgeTest': () => import('./LumiBulgeTest.js'),
  'LumiChromaticAberrationTest': () => import('./LumiChromaticAberrationTest.js'),
  'LumiCircleWipeTest': () => import('./LumiCircleWipeTest.js'),
  'LumiCloneTest': () => import('./LumiCloneTest.js'),
  'LumiColoramaTest': () => import('./LumiColoramaTest.js'),
  'LumiContrastTest': () => import('./LumiContrastTest.js'),
  'LumiCornerPinTest': () => import('./LumiCornerPinTest.js'),
  'LumiDirectionalBlursTest': () => import('./LumiDirectionalBlursTest.js'),
  'LumiDirectionBlurTest': () => import('./LumiDirectionBlurTest.js'),
  'LumiExpandTileTest': () => import('./LumiExpandTileTest.js'),
  'LumiExposureTest': () => import('./LumiExposureTest.js'),
  'LumiExtractTest': () => import('./LumiExtractTest.js'),
  'LumiFillTest': () => import('./LumiFillTest.js'),
  'LumiFindEdgeTest': () => import('./LumiFindEdgeTest.js'),
  'LumiFlickerTest': () => import('./LumiFlickerTest.js'),
  'LumiFourColorGradientTest': () => import('./LumiFourColorGradientTest.js'),
  'LumiGaussianBlurTest': () => import('./LumiGaussianBlurTest.js'),
  'LumiGeometryTest': () => import('./LumiGeometryTest.js'),
  'LumiGlowTest': () => import('./LumiGlowTest.js'),
  'LumiHalftoneTest': () => import('./LumiHalftoneTest.js'),
  'LumiHSLTest': () => import('./LumiHSLTest.js'),
  'LumiLensTest': () => import('./LumiLensTest.js'),
  'LumiLightSensationTest': () => import('./LumiLightSensationTest.js'),
  'LumiLinearWipeTest': () => import('./LumiLinearWipeTest.js'),
  'LumiMosaicTest': () => import('./LumiMosaicTest.js'),
  'LumiMotionBlur2DTest': () => import('./LumiMotionBlur2DTest.js'),
  'LumiNegativeTest': () => import('./LumiNegativeTest.js'),
  'LumiPageTurnTest': () => import('./LumiPageTurnTest.js'),
  'LumiParticleTest': () => import('./LumiParticleTest.js'),
  'LumiPosterizeTest': () => import('./LumiPosterizeTest.js'),
  'LumiRadialBlurTest': () => import('./LumiRadialBlurTest.js'),
  'LumiRadialWipeTest': () => import('./LumiRadialWipeTest.js'),
  'LumiRoundCornerTest': () => import('./LumiRoundCornerTest.js'),
  'LumiS_GlowTest': () => import('./LumiS_GlowTest.js'),
  'LumiSaturationTest': () => import('./LumiSaturationTest.js'),
  'LumiScaleWipeTest': () => import('./LumiScaleWipeTest.js'),
  'LumiShadowHighlightTest': () => import('./LumiShadowHighlightTest.js'),
  'LumiShakeTest': () => import('./LumiShakeTest.js'),
  'LumiTemperatureToneTest': () => import('./LumiTemperatureToneTest.js'),
  'LumiThresholdTest': () => import('./LumiThresholdTest.js'),
  'LumiToneTest': () => import('./LumiToneTest.js'),
  'LumiTritoneTest': () => import('./LumiTritoneTest.js'),
  'LumiTwirlTest': () => import('./LumiTwirlTest.js'),
  'LumiUnmultTest': () => import('./LumiUnmultTest.js'),
  'LumiVignetteTest': () => import('./LumiVignetteTest.js'),
  'LumiWarpTest': () => import('./LumiWarpTest.js'),
  'LumiWaveWarpTest': () => import('./LumiWaveWarpTest.js')
  // 可以继续添加更多测试模块...
};

// 本地存储键名
const LAST_TEST_KEY = 'lastOpenedTest';

// 动态加载测试模块
export async function loadTest(testName) {
  if (!testModules[testName]) {
    console.error(`Test module ${testName} not found`);
    return;
  }

  try {
    // 清除现有的测试实例
    if (window.currentTestInstance) {
      if (window.currentTestInstance.dispose) {
        window.currentTestInstance.dispose();
      }
    }

    // 动态导入测试模块
    const module = await testModules[testName]();
    const TestClass = module.default || Object.values(module)[0];
    
    // 创建新的测试实例
    window.currentTestInstance = new TestClass();
    await window.currentTestInstance.init();
    
    // 保存当前测试名称到本地存储
    localStorage.setItem(LAST_TEST_KEY, testName);
    
    console.log(`Loaded test: ${testName}`);
  } catch (error) {
    console.error(`Error loading test ${testName}: `, error);
  }
}

// 获取所有可用的测试名称
export function getAvailableTests() {
  return Object.keys(testModules);
}

// 获取上次打开的测试名称
function getLastOpenedTest() {
  return localStorage.getItem(LAST_TEST_KEY);
}

// 自动加载默认测试
document.addEventListener('DOMContentLoaded', async () => {
  // 创建测试选择界面
  createTestSelector();
  
  // 获取所有可用测试
  const tests = getAvailableTests();
  if (tests.length > 0) {
    // 尝试获取上次打开的测试
    const lastTest = getLastOpenedTest();
    let testToLoad = tests[0]; // 默认加载第一个
    
    // 如果有上次打开的测试且该测试仍然存在，则加载该测试
    if (lastTest && tests.includes(lastTest)) {
      testToLoad = lastTest;
    }
    
    // 加载测试
    await loadTest(testToLoad);
    
    // 更新选择器的选中项
    const select = document.getElementById('test-selector');
    if (select) {
      select.value = testToLoad;
    }
  }
});

// 创建测试选择界面
function createTestSelector() {
  const tests = getAvailableTests();
  
  // 创建选择器容器
  const container = document.createElement('div');
  container.id = 'test-selector-container';
  container.style.cssText = `
    position: fixed;
    top: 10px;
    left: 10px;
    z-index: 1000;
    background: rgba(0, 0, 0, 0.7);
    padding: 10px;
    border-radius: 5px;
    color: white;
    font-family: Arial, sans-serif;
  `;
  
  // 创建标签
  const label = document.createElement('label');
  label.textContent = '选择测试: ';
  label.style.cssText = 'margin-right: 10px;';
  
  // 创建选择框
  const select = document.createElement('select');
  select.id = 'test-selector';
  select.style.cssText = `
    padding: 5px;
    border-radius: 3px;
    border: 1px solid #ccc;
    background: white;
    color: black;
  `;
  
  // 添加选项
  tests.forEach((testName, index) => {
    const option = document.createElement('option');
    option.value = testName;
    option.textContent = testName;
    select.appendChild(option);
  });
  
  // 添加事件监听器
  select.addEventListener('change', async (event) => {
    await loadTest(event.target.value);
  });
  
  // 组装界面
  container.appendChild(label);
  container.appendChild(select);
  document.body.appendChild(container);
}