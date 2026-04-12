import { initShell, openShell, closeShell } from './lab-shell.js'
import { initBridge, sendMessage, loadPreview } from './lab-preview-bridge.js'
import { initControls, renderControls, updateDemoParam, resetControls } from './lab-controls.js'
import { initActions, triggerSaveImage, triggerExportScriptScene, triggerExportGameJS, toggleRecording, openExportSettings, handleImageData, handleRecBlob, handleRecError, handleGameJSSource } from './lab-actions.js'
import { initAIChat, displayRuntimeError, clearAIChat } from './lab-ai-chat.js'
import { handleRuntimeErrorForAutoHeal, resetAutoHeal } from './lab-autoheal.js'
import { updateSession } from './session-store.js'

let labInitialized = false

function handleBanner(type, data) {
  if (type === 'image') {
    const url = data.dataUrl
    const banner = document.createElement('div')
    banner.style.cssText = 'position:fixed;bottom:20px;left:20px;z-index:9999;padding:12px 16px;background:rgba(0,0,0,0.8);border:1px solid rgba(255,255,255,0.15);border-radius:10px;color:#fff;font-family:JetBrains Mono,monospace;font-size:12px;display:flex;align-items:center;gap:10px'
    banner.innerText = '截图已生成，点击下载图片'
    const btn = document.createElement('a')
    btn.href = url; btn.download = 'capcut-lab-export.png'; btn.textContent = '下载'
    btn.style.cssText = 'padding:6px 10px;background:#00CAE0;color:#000;font-weight:700;border-radius:6px;text-decoration:none'
    const close = document.createElement('button')
    close.textContent = '×'; close.style.cssText = 'background:transparent;color:#aaa;border:none;font-size:16px;cursor:pointer'
    close.onclick = () => banner.remove()
    banner.appendChild(btn); banner.appendChild(close)
    document.body.appendChild(banner)
  }
  if (type === 'recording') {
    const blob = data.blob instanceof Blob ? data.blob : new Blob([data.blob], { type: data.mimeType || 'video/webm' })
    const url = URL.createObjectURL(blob)
    const ext = data.mimeType && data.mimeType.includes('mp4') ? 'mp4' : 'webm'
    const banner = document.createElement('div')
    banner.style.cssText = 'position:fixed;bottom:20px;left:20px;z-index:9999;padding:12px 16px;background:rgba(0,0,0,0.8);border:1px solid rgba(255,255,255,0.15);border-radius:10px;color:#fff;font-family:JetBrains Mono,monospace;font-size:12px;display:flex;align-items:center;gap:10px'
    banner.innerText = '录制完成，点击下载文件'
    const btn = document.createElement('a')
    btn.href = url; btn.download = `capcut-lab-record.${ext}`; btn.textContent = '下载'
    btn.style.cssText = 'padding:6px 10px;background:#00CAE0;color:#000;font-weight:700;border-radius:6px;text-decoration:none'
    const close = document.createElement('button')
    close.textContent = '×'; close.style.cssText = 'background:transparent;color:#aaa;border:none;font-size:16px;cursor:pointer'
    close.onclick = () => { banner.remove(); URL.revokeObjectURL(url) }
    banner.appendChild(btn); banner.appendChild(close)
    document.body.appendChild(banner)
  }
  if (type === 'error') {
    const banner = document.createElement('div')
    banner.style.cssText = 'position:fixed;bottom:20px;left:20px;z-index:9999;padding:12px 16px;background:rgba(0,0,0,0.8);border:1px solid rgba(255,255,255,0.15);border-radius:10px;color:#fff;font-family:JetBrains Mono,monospace;font-size:12px;display:flex;align-items:center;gap:10px'
    banner.innerText = '录制/截图失败：' + (data.message || 'Unknown error')
    const close = document.createElement('button')
    close.textContent = '×'; close.style.cssText = 'background:transparent;color:#aaa;border:none;font-size:16px;cursor:pointer'
    close.onclick = () => banner.remove()
    banner.appendChild(close)
    document.body.appendChild(banner)
  }
}

export function initLab() {
  if (labInitialized) return
  labInitialized = true

  const iframe = document.getElementById('content-frame')

  initBridge(iframe, {
    onUIConfig: (config) => {
      updateSession({ uiConfig: config })
      renderControls(config)
    },
    onImageData: (data) => { handleImageData(data); handleBanner('image', data) },
    onRecBlob: (data) => { handleRecBlob(data); handleBanner('recording', data) },
    onRecError: (data) => { handleRecError(data); handleBanner('error', data) },
    onGameJSSource: (data) => handleGameJSSource(data),
    onDemoError: (data) => {
      updateSession({ lastError: data })
      handleRuntimeErrorForAutoHeal(data)
    },
  })

  initControls(document.getElementById('dynamic-controls'), {
    onParamChange: (bind, value) => sendMessage('UPDATE_PARAM', { key: bind, value: value }),
    onFileUpload: (bind, files) => sendMessage('FILE_UPLOAD', { bind: bind, files: files }),
    onLoadSource: (source) => sendMessage('LOAD_SOURCE', { source: source }),
  })

  initActions({
    sendMessage: sendMessage,
    onBanner: handleBanner,
  })

  initShell()
  initAIChat({ updateDemoParam })
}

export function openLab(url, title, tag, isOriginal = true) {
  initLab()
  openShell(title, tag, isOriginal)
  loadPreview(url)
}

export function closeLab() {
  closeShell()
  clearAIChat()
  resetAutoHeal()
}

export { updateDemoParam, resetControls as resetDemo, triggerSaveImage, triggerExportScriptScene, triggerExportGameJS, toggleRecording, openExportSettings }
