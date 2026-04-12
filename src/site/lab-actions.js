import { updateSession, getSession } from './session-store.js'

let sendMessageCallback = null
let onBannerCallback = null
let isRecording = false

export function initActions({ sendMessage, onBanner }) {
  sendMessageCallback = sendMessage
  onBannerCallback = onBanner
}

export function triggerSaveImage() {
  if (sendMessageCallback) sendMessageCallback('SAVE_IMAGE')
}

export function triggerExportScriptScene() {
  if (sendMessageCallback) sendMessageCallback('EXPORT_SCRIPT_SCENE')
}

export function triggerExportGameJS() {
  if (sendMessageCallback) sendMessageCallback('REQUEST_GAME_JS_SOURCE')
}

export function toggleRecording() {
  const btn = document.getElementById('rec-btn')
  const txt = document.getElementById('rec-text')
  if (!btn || !txt) return

  if (!isRecording) {
    if (sendMessageCallback) sendMessageCallback('START_REC')
    isRecording = true
    txt.textContent = '停止 (REC)'
    btn.classList.add('bg-red-500', 'text-white')
    btn.classList.remove('bg-gray-800', 'border-white/10')
    updateSession({ isRecording: true })
    return
  }

  if (sendMessageCallback) sendMessageCallback('STOP_REC')
  isRecording = false
  txt.textContent = '录制'
  btn.classList.remove('bg-red-500', 'text-white')
  btn.classList.add('bg-gray-800', 'border-white/10')
  updateSession({ isRecording: false })
}

export function handleImageData(data) {
  if (!data || !data.dataUrl) return
  const a = document.createElement('a')
  a.href = data.dataUrl
  a.download = 'screenshot.png'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  if (onBannerCallback) onBannerCallback('image', data)
}

export function handleRecBlob(data) {
  if (!data || !data.blob) return
  const blob = data.blob instanceof Blob ? data.blob : new Blob([data.blob], { type: data.mimeType || 'video/webm' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'recording.webm'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 5000)
  if (onBannerCallback) onBannerCallback('recording', data)
}

export function handleRecError(data) {
  console.error('Recording error:', data)
  if (onBannerCallback) onBannerCallback('error', data)
}

export function handleGameJSSource(data) {
  const code = typeof data.code === 'string' ? data.code : ''
  const baseFilename = typeof data.filename === 'string' && data.filename.trim() ? data.filename.trim() : 'game.js'
  const prefix = sanitizeExportPrefix(localStorage.getItem('exportFilePrefix') || '')
  const filename = prefix ? `${prefix}-${baseFilename}` : baseFilename
  const finalCode = toMinigameGameJS(code)
  const blob = new Blob([finalCode], { type: 'application/javascript' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function openExportSettings() {
  const current = localStorage.getItem('exportFilePrefix') || ''
  const next = window.prompt('导出文件名前缀（可留空）', current)
  if (next === null) return
  const prefix = sanitizeExportPrefix(next)
  if (prefix) {
    localStorage.setItem('exportFilePrefix', prefix)
  } else {
    localStorage.removeItem('exportFilePrefix')
  }
}

function toMinigameGameJS(code) {
  const src = typeof code === 'string' ? code : ''
  if (src.includes('tt.createCanvas') || src.includes('tt.getSystemInfoSync')) return src
  const stripped = src.replace(/^\s*import\s+[\s\S]*?;?\s*$/gm, '').trim()
  if (stripped === '') return stripped
  const template = `const systemInfo = tt.getSystemInfoSync();
const screenWidth = systemInfo.screenWidth;
const screenHeight = systemInfo.screenHeight;
const pixelRatio = systemInfo.pixelRatio;
const canvas = tt.createCanvas();
canvas.width = screenWidth * pixelRatio;
canvas.height = screenHeight * pixelRatio;
const ctx = canvas.getContext('2d');
ctx.scale(pixelRatio, pixelRatio);
const requestAnimationFrame = globalThis.requestAnimationFrame || ((cb) => setTimeout(() => cb(Date.now()), 16));
const cancelAnimationFrame = globalThis.cancelAnimationFrame || ((id) => clearTimeout(id));
const document = {
  createElement: () => canvas,
  body: { appendChild() {}, removeChild() {} },
  documentElement: { style: { setProperty() {} } },
  querySelector: () => null,
  querySelectorAll: () => [],
};
const window = globalThis;
(function () {
${stripped}
})();`
  return template
}

function sanitizeExportPrefix(prefix) {
  const raw = typeof prefix === 'string' ? prefix : ''
  const cleaned = raw.trim().replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '')
  return cleaned.slice(0, 40)
}
