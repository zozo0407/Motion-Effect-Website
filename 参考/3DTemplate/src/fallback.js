// fallback.js - 依赖加载失败时的回退脚本

// 显示回退提示
function showFallbackMessage(msg) {
    let fallbackPanel = document.getElementById('fallback-info');
    if (!fallbackPanel) {
        fallbackPanel = document.createElement('div');
        fallbackPanel.id = 'fallback-info';
        fallbackPanel.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:100vh;background:rgba(30,30,30,0.9);color:#fff;z-index:9998;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:16px;';
        
        // 添加关闭按钮
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '关闭提示';
        closeBtn.style.cssText = 'position:absolute;top:20px;right:20px;background:#444;border:none;color:white;padding:8px 15px;border-radius:4px;cursor:pointer;font-size:14px;';
        closeBtn.onclick = function() {
            fallbackPanel.style.display = 'none';
        };
        
        document.body.appendChild(fallbackPanel);
        fallbackPanel.appendChild(closeBtn);
    }
    
    // 创建消息容器
    const msgContainer = document.createElement('div');
    msgContainer.style.cssText = 'background:rgba(50,50,50,0.8);padding:30px 40px;border-radius:8px;max-width:80%;text-align:center;box-shadow:0 5px 15px rgba(0,0,0,0.3);';
    
    // 错误图标
    const iconElement = document.createElement('div');
    iconElement.innerHTML = '⚠️';
    iconElement.style.cssText = 'font-size:48px;margin-bottom:20px;';
    msgContainer.appendChild(iconElement);
    
    // 错误消息
    const msgElement = document.createElement('div');
    msgElement.textContent = msg || '依赖加载失败，请检查网络或刷新页面。';
    msgElement.style.cssText = 'margin-bottom:20px;line-height:1.5;';
    msgContainer.appendChild(msgElement);
    
    // 刷新按钮
    const refreshBtn = document.createElement('button');
    refreshBtn.textContent = '刷新页面';
    refreshBtn.style.cssText = 'background:#2a6abf;border:none;color:white;padding:10px 20px;border-radius:4px;cursor:pointer;font-size:14px;';
    refreshBtn.onclick = function() {
        location.reload();
    };
    msgContainer.appendChild(refreshBtn);
    
    // 清空面板并添加新消息
    fallbackPanel.innerHTML = '';
    fallbackPanel.appendChild(closeBtn);
    fallbackPanel.appendChild(msgContainer);
    
    // 确保显示
    fallbackPanel.style.display = 'flex';
}

// 捕获全局JS错误，作为兜底
window.addEventListener('error', function(e) {
    // 只在严重错误时显示全屏提示
    if (e.error && (e.error.toString().includes('ReferenceError') || 
                     e.error.toString().includes('TypeError') ||
                     e.error.toString().includes('SyntaxError'))) {
        showFallbackMessage('页面发生严重错误：' + e.message);
    }
});

window.addEventListener('unhandledrejection', function(e) {
    // 只在严重Promise错误时显示全屏提示
    if (e.reason && typeof e.reason === 'object' && e.reason.name && 
        (e.reason.name === 'ReferenceError' || 
         e.reason.name === 'TypeError' || 
         e.reason.name === 'SyntaxError')) {
        showFallbackMessage('Promise未捕获异常：' + (e.reason.message || e.reason));
    }
});

// 导出接口
module.exports = { showFallbackMessage }; 