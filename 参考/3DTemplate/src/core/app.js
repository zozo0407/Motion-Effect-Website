/**
 * 应用程序主文件
 * 负责调用场景功能并提供应用特定逻辑
 */

// 导入Three.js和ScriptScene类
const THREE = require('three');
const ScriptScene = require('./scriptScene');
const RecordingManager = require('./recordingManager');
const TimeController = require('./timeController');

/**
 * 初始化应用
 * 
 * 应用入口点，负责配置并启动3D场景
 * 
 * @param {HTMLElement} container - 放置渲染器的DOM容器
 * @param {THREE.Scene} [externalScene] - 可选的外部场景对象
 * @param {Object} [options] - 可选的配置选项
 * @param {boolean} [options.enableRecording=true] - 是否启用录制（启用即自动录制）
 */
function initApp(container, externalScene = null, options = {}) {
  // 默认配置
  const config = {
    enableRecording: true,
    ...options
  };
  
  // 创建场景实例，可以传入外部场景
  const scene = new ScriptScene(externalScene, container);
  
  // 创建录制管理器和时间控制器
  const recordingManager = new RecordingManager();
  const timeController = new TimeController();
  
  // 初始化录制管理器
  recordingManager.initialize({
    enableRecording: config.enableRecording,
    renderer: scene.renderer
  });
  
  // 初始化时间控制器
  let totalDuration = scene.Duration + 1000; // 总时长 (2000 + 1000 = 3000ms)
  if (scene.effect_type == "video_effect") {
    totalDuration = scene.Duration;
  }
  timeController.initialize({
    totalDuration: totalDuration,
    scriptScene: scene,
    onTimeUpdate: (currentTime) => {
      // 时间更新回调，可用于UI更新等
    }
  });
  
  // 获取API接口
  const recordingAPI = recordingManager.getAPI();
  const timeControlAPI = timeController.getAPI();
  
  // 这里加载Sample1.png和Sample2.png
  scene.loadTextures().then(() => {
    // 使用scene实例设置并初始化3D场景
    // 它会自动设置相机、灯光、创建地面和立方体，并开始动画循环
    scene.setupScene();

    // 初始化后处理效果
    if (scene.initPostProcessing != null) {
      scene.initPostProcessing();
    }

    // 启动动画循环，由 app.js 控制动画主循环和时间戳
    let animationFrameCount = 0;
    let recordingStarted = false;
  let loopStopped = false;
    
    function animateFrame(timestamp) {
      if (animationFrameCount === 0) {
        timeController.startTime = timestamp;
      }
      animationFrameCount++;
      
      // 使用时间控制器更新时间
      const currentTime = timeController.updateTime(timestamp);
      
      // 如果启用录制，在第一帧自动开始录制
      if (!recordingStarted && recordingAPI.isRecordingEnabled()) {
        recordingAPI.startRecording();
        recordingStarted = true;
      }
      
      // 更新场景
      scene.seekToTime(currentTime);
      scene.update();
      
      // 录制当前帧（在场景渲染之后）
      recordingManager.captureFrame();

      // 如果动画未结束或者暂停状态，继续请求下一帧
      if (currentTime < totalDuration || timeControlAPI.isPaused()) {
        requestAnimationFrame(animateFrame);
      } 
      else {
        // 动画结束后的处理
        console.log(`[App] 动画结束，动画帧数: ${animationFrameCount}, 录制帧数: ${recordingAPI.getFrameCount()}`);
        
        // 自动暂停动画
        timeControlAPI.pause();
        loopStopped = true;
        
        // 如果正在录制则停止录制
        if (recordingAPI.isRecordingEnabled() && recordingAPI.isRecording() && recordingAPI.getFrameCount() > 0) {
          recordingAPI.stopRecording();
        } else if (recordingAPI.isRecordingEnabled() && recordingAPI.isRecording() && recordingAPI.getFrameCount() === 0) {
          console.warn('[App] 没有录制到任何帧');
          recordingAPI.stopRecording();
        }
      }
    }
    
    requestAnimationFrame(animateFrame);
    
    // 将核心对象保存到全局window对象，方便调试和录制控制
    window._sceneInstance = scene;
    window.scene = scene.scene;
    window.camera = scene.camera;
    window.renderer = scene.renderer;
    
    // 添加全局录制控制API
    window.enableRecording = recordingAPI.enableRecording;
    window.disableRecording = recordingAPI.disableRecording;
    window.startRecording = recordingAPI.startRecording;
    window.stopRecording = recordingAPI.stopRecording;
    window.isRecordingEnabled = recordingAPI.isRecordingEnabled;
    window.isRecording = recordingAPI.isRecording;
    window.getRecordingFrameCount = recordingAPI.getFrameCount;
    
    // 添加时间轴API
    window.getCurrentAnimationTime = timeControlAPI.getCurrentTime;
    window.getTotalDuration = timeControlAPI.getTotalDuration;
    window.getAnimationProgress = () => timeControlAPI.getProgress() * 100;
    
    // 添加时间控制API
    window.playAnimation = () => {
      const atEnd = timeControlAPI.getCurrentTime() >= totalDuration;
      if (atEnd || loopStopped) {
        // 从头重播并重启主循环
        timeControlAPI.seekTo(0);
        animationFrameCount = 0;
        loopStopped = false;
        requestAnimationFrame(animateFrame);
      }
      return timeControlAPI.play();
    };
    window.pauseAnimation = timeControlAPI.pause;
    window.seekToTime = timeControlAPI.seekTo;
    window.isAnimationPaused = timeControlAPI.isPaused;
    
    // 为了向后兼容，添加场景录制API的别名
    scene.enableCapture = recordingAPI.enableRecording;
    scene.disableCapture = recordingAPI.disableRecording;
    scene.startCapture = recordingAPI.startRecording;
    scene.stopAndSaveCapture = recordingAPI.stopRecording;
    
    console.log('[App] 全局录制控制API已加载');
    console.log('可用命令: enableRecording(), disableRecording(), startRecording(), stopRecording(), isRecordingEnabled(), isRecording()');
    
    // 显示当前录制状态
    if (recordingAPI.isRecordingEnabled()) {
      console.log('[App] 🎬 启用录制：将在动画开始时自动录制');
    } else {
      console.log('[App] 🎛️ 不启用录制：录制功能已禁用');
    }
  });
  
  // 返回包含场景、录制API和时间控制API的对象
  return {
    scene,
    recording: recordingAPI,
    timeControl: timeControlAPI
  };
}

// 导出公共函数
module.exports = { 
  initApp  // 初始化应用
}; 