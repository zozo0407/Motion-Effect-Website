// 客户端入口文件
const { initApp } = require('./core/app');
require('./debug'); // 引入调试脚本
require('./fallback'); // 引入回退脚本

// DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  console.log('初始化3D场景...');
  
  // 获取容器
  const container = document.body;
  
  // 简单的录制控制：如果URL包含 /editor 就不录制，否则启用录制（自动录制）
  const isEditorMode = window.location.pathname.includes('/editor');
  const recordingOptions = {
    enableRecording: !isEditorMode // 编辑器模式不录制，普通模式启用录制并自动开始
  };
  
  console.log('[Client] 模式检测:', isEditorMode ? '编辑器模式' : '普通模式');
  console.log('[Client] 录制状态:', recordingOptions.enableRecording ? '启用录制（自动录制）' : '不启用录制');
  
  // 初始化应用
  const appInstance = initApp(container, null, recordingOptions);
  
  console.log('3D场景初始化完成！');
  
  // 根据当前模式显示提示
  if (isEditorMode) {
    console.log('🎛️ [编辑器模式] 录制功能已禁用，专注于场景编辑');
    console.log('如需录制，请在控制台输入: enableRecording() 然后 startRecording()');
  } else {
    console.log('🎬 [普通模式] 将自动录制动画并保存视频');
  }
  
}); 