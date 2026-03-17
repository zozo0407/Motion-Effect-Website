/**
 * 时间控制器模块
 * 负责处理动画时间控制相关的所有功能
 */

class TimeController {
  constructor() {
    this.startTime = null;
    this.pausedTime = null;
    this.currentTime = 0;
    this.isPaused = false;
    this.totalDuration = 2000; // 默认总时长2秒
    this.scriptScene = null; // 将由外部设置
    this.onTimeUpdateCallback = null; // 时间更新回调
  }

  /**
   * 初始化时间控制器
   * @param {Object} options - 配置选项
   * @param {number} options.totalDuration - 动画总时长（毫秒）
   * @param {Object} options.scriptScene - 场景对象引用
   * @param {Function} options.onTimeUpdate - 时间更新回调函数
   */
  initialize(options = {}) {
    const { totalDuration = 2000, scriptScene = null, onTimeUpdate = null } = options;
    
    this.totalDuration = totalDuration;
    this.scriptScene = scriptScene;
    this.onTimeUpdateCallback = onTimeUpdate;
    this.startTime = performance.now();
    
    console.log('[TimeController] 初始化完成，总时长:', this.totalDuration + 'ms');
  }

  /**
   * 更新当前时间
   * @param {number} timestamp - 当前时间戳
   * @returns {number} 当前动画时间
   */
  updateTime(timestamp) {
    if (!this.startTime) {
      this.startTime = timestamp;
    }

    if (this.isPaused) {
      // 暂停状态下，保持当前时间不变
      return this.currentTime;
    }

    // 计算相对于开始时间的时间差
    this.currentTime = timestamp - this.startTime;
    
    // 调用时间更新回调
    if (this.onTimeUpdateCallback) {
      this.onTimeUpdateCallback(this.currentTime);
    }
    
    return this.currentTime;
  }

  /**
   * 播放动画
   */
  play() {
    if (this.isPaused) {
      // 如果是从暂停状态恢复，需要调整开始时间
      const now = performance.now();
      this.startTime = now - this.currentTime;
      this.isPaused = false;
      console.log('[TimeController] 播放恢复，当前时间:', this.currentTime + 'ms');
    } else {
      console.log('[TimeController] 动画正在播放中');
    }
    return true;
  }

  /**
   * 暂停动画
   */
  pause() {
    if (!this.isPaused) {
      this.isPaused = true;
      this.pausedTime = this.currentTime;
      console.log('[TimeController] 动画已暂停，当前时间:', this.currentTime + 'ms');
    } else {
      console.log('[TimeController] 动画已经暂停');
    }
    return true;
  }

  /**
   * 切换播放/暂停状态
   */
  togglePlayPause() {
    if (this.isPaused) {
      return this.play();
    } else {
      return this.pause();
    }
  }

  /**
   * 跳转到指定时间
   * @param {number} time - 目标时间（毫秒）
   */
  seekTo(time) {
    // 限制时间范围
    const clampedTime = Math.max(0, Math.min(time, this.totalDuration));
    
    // 更新当前时间
    this.currentTime = clampedTime;
    
    // 调整开始时间以匹配新的当前时间
    const now = performance.now();
    this.startTime = now - this.currentTime;
    
    // 自动暂停
    this.isPaused = true;
    
    // 如果有场景对象，调用场景的时间跳转方法
    if (this.scriptScene && typeof this.scriptScene.seekToTime === 'function') {
      this.scriptScene.seekToTime(clampedTime);
    }
    
    // 调用时间更新回调
    if (this.onTimeUpdateCallback) {
      this.onTimeUpdateCallback(this.currentTime);
    }
    
    console.log('[TimeController] 跳转到时间:', clampedTime + 'ms', '进度:', ((clampedTime / this.totalDuration) * 100).toFixed(1) + '%');
    return clampedTime;
  }

  /**
   * 重置动画到开始位置
   */
  reset() {
    this.currentTime = 0;
    this.startTime = performance.now();
    this.isPaused = false;
    
    // 如果有场景对象，跳转到时间0
    if (this.scriptScene && typeof this.scriptScene.seekToTime === 'function') {
      this.scriptScene.seekToTime(0);
    }
    
    // 调用时间更新回调
    if (this.onTimeUpdateCallback) {
      this.onTimeUpdateCallback(0);
    }
    
    console.log('[TimeController] 动画已重置');
    return true;
  }

  /**
   * 获取当前动画时间
   * @returns {number} 当前时间（毫秒）
   */
  getCurrentTime() {
    return this.currentTime;
  }

  /**
   * 获取总时长
   * @returns {number} 总时长（毫秒）
   */
  getTotalDuration() {
    return this.totalDuration;
  }

  /**
   * 获取动画进度（0-1）
   * @returns {number} 动画进度
   */
  getProgress() {
    return Math.min(this.currentTime / this.totalDuration, 1.0);
  }

  /**
   * 检查是否暂停
   * @returns {boolean} 是否暂停
   */
  isPausedStatus() {
    return this.isPaused;
  }

  /**
   * 检查是否播放中
   * @returns {boolean} 是否播放中
   */
  isPlayingStatus() {
    return !this.isPaused;
  }

  /**
   * 设置总时长
   * @param {number} duration - 新的总时长（毫秒）
   */
  setTotalDuration(duration) {
    this.totalDuration = duration;
    console.log('[TimeController] 总时长已更新为:', duration + 'ms');
  }

  /**
   * 获取时间控制 API
   */
  getAPI() {
    return {
      play: () => this.play(),
      pause: () => this.pause(),
      togglePlayPause: () => this.togglePlayPause(),
      seekTo: (time) => this.seekTo(time),
      reset: () => this.reset(),
      getCurrentTime: () => this.getCurrentTime(),
      getTotalDuration: () => this.getTotalDuration(),
      getProgress: () => this.getProgress(),
      isPaused: () => this.isPausedStatus(),
      isPlaying: () => this.isPlayingStatus(),
      setTotalDuration: (duration) => this.setTotalDuration(duration),
      updateTime: (timestamp) => this.updateTime(timestamp)
    };
  }
}

module.exports = TimeController; 