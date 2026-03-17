/**
 * 录制管理器模块
 * 负责处理视频录制相关的所有功能
 */

class RecordingManager {
  constructor() {
    this.capturer = null;
    this.frameCount = 0;
    this.hasSaved = false;
    this.isRecordingEnabled = false;
    this.isRecording = false;
    this.renderer = null; // 将由外部设置
  }

  /**
   * 初始化录制管理器
   * @param {Object} options - 配置选项
   * @param {boolean} options.enableRecording - 是否启用录制
   * @param {THREE.WebGLRenderer} options.renderer - Three.js渲染器
   * @param {string} options.format - 录制格式 ('webm' 或 'gif')
   */
  initialize(options = {}) {
    const { enableRecording = false, renderer = null, format = 'gif' } = options;
    
    this.isRecordingEnabled = enableRecording;
    this.renderer = renderer;
    this.format = format;

    if (window.capturerFormat === "webm") {
      this.format = window.capturerFormat;
    }
    
    if (enableRecording) {
      this.initCapturer();
    }
    
    console.log('[RecordingManager] 初始化完成，录制状态:', enableRecording ? '启用' : '禁用');
  }

  /**
   * 初始化录制器 - 接收format参数
   */
  initCapturer() {
    if (typeof CCapture !== 'undefined') {
      this.capturer = new CCapture({
        format: this.format,
        name: 'capture', 
        workersPath: 'js/',
        verbose: true
      });
      console.log(`[RecordingManager] ${this.format.toUpperCase()}录制器已初始化`);
    } else {
      console.warn('[RecordingManager] CCapture 库未找到，录制功能不可用');
      this.isRecordingEnabled = false;
    }
  }

  /**
   * 启用录制功能
   */
  enableRecording() {
    this.isRecordingEnabled = true;
    if (!this.capturer) {
      this.initCapturer();
    }
    console.log('[RecordingManager] 录制功能已启用');
    return true;
  }

  /**
   * 禁用录制功能
   */
  disableRecording() {
    this.isRecordingEnabled = false;
    if (this.isRecording) {
      this.stopRecording();
    }
    console.log('[RecordingManager] 录制功能已禁用');
    return true;
  }

  /**
   * 开始录制
   */
  startRecording() {
    if (!this.isRecordingEnabled) {
      console.warn('[RecordingManager] 录制未启用，请先调用 enableRecording()');
      return false;
    }

    if (this.isRecording) {
      console.warn('[RecordingManager] 录制已在进行中');
      return false;
    }

    if (!this.capturer) {
      this.initCapturer();
    }

    if (this.capturer) {
      this.capturer.start();
      this.isRecording = true;
      this.frameCount = 0;
      this.hasSaved = false;
      console.log('[RecordingManager] 录制已开始');
      return true;
    }

    return false;
  }

  /**
   * 停止录制
   */
  stopRecording() {
    if (!this.isRecording || !this.capturer) {
      console.warn('[RecordingManager] 当前没有正在进行的录制');
      return false;
    }

    this.capturer.stop();
    console.log('[RecordingManager] 录制停止，等待内部处理...');

    // 延迟保存，让 CCapture 有时间完成内部处理
    setTimeout(() => {
      if (this.capturer && !this.hasSaved) {
        if (window.capturerSaveAsBlob === true) {
          this.capturer.save( function( blob ) {
            window.capturerSavedBlob = blob;
            console.log('[RecordingManager] 录制已保存到window.capturerSavedBlob');
          });
        } else {
          this.capturer.save();
        }
        this.hasSaved = true;
        this.isRecording = false;
        console.log('[RecordingManager] 录制结束，已保存');
      }
    }, 100);

    return true;
  }

  /**
   * 捕获当前帧
   */
  captureFrame() {
    if (this.isRecordingEnabled && this.isRecording && this.capturer && this.renderer && !this.hasSaved) {
      this.capturer.capture(this.renderer.domElement);
      this.frameCount++;
      if (this.frameCount % 10 === 0) {
        console.log('[RecordingManager] 录制中...', this.frameCount);
      }
    }
  }

  /**
   * 检查是否启用录制
   */
  isRecordingEnabledStatus() {
    return this.isRecordingEnabled;
  }

  /**
   * 检查是否正在录制
   */
  isRecordingStatus() {
    return this.isRecording;
  }

  /**
   * 获取录制帧数
   */
  getFrameCount() {
    return this.frameCount;
  }

  /**
   * 获取录制 API
   */
  getAPI() {
    return {
      enableRecording: () => this.enableRecording(),
      disableRecording: () => this.disableRecording(),
      startRecording: () => this.startRecording(),
      stopRecording: () => this.stopRecording(),
      isRecordingEnabled: () => this.isRecordingEnabledStatus(),
      isRecording: () => this.isRecordingStatus(),
      getFrameCount: () => this.getFrameCount(),
      captureFrame: () => this.captureFrame()
    };
  }
}

module.exports = RecordingManager;