import { getSession, updateSession, subscribe } from './session-store.js'

let initialized = false
let onParamChangeCallback = null
let lastErrorTime = 0
let lastErrorMessage = ''

function escapeHtml(str) {
  const div = document.createElement('div')
  div.textContent = typeof str === 'string' ? str : String(str)
  return div.innerHTML
}

export function displayRuntimeError(payload) {
  const history = document.getElementById('ai-chat-history')
  if (!history || !payload) return

  const now = Date.now()
  const errorMessage = payload.errorMessage || 'Unknown error'
  if (errorMessage === lastErrorMessage && now - lastErrorTime < 1000) return
  lastErrorTime = now
  lastErrorMessage = errorMessage

  const friendlyMsg = translateErrorMessage(errorMessage)

  const errorBubble = document.createElement('div')
  errorBubble.className = 'flex gap-3'

  const techDetails = []
  if (payload.filename) techDetails.push(`文件: ${payload.filename}:${payload.lineno || 0}:${payload.colno || 0}`)
  techDetails.push(`错误: ${escapeHtml(errorMessage)}`)
  if (payload.stackTrace) techDetails.push(`\n${escapeHtml(payload.stackTrace)}`)

  const detailSection = techDetails.length
    ? `<details class="mt-2"><summary class="text-red-400/80 cursor-pointer text-[10px] hover:text-red-300 transition-colors">查看技术详情</summary><pre class="mt-1 text-[9px] text-red-300/60 whitespace-pre-wrap break-words font-mono leading-relaxed">${techDetails.join('\n')}</pre></details>`
    : ''

  errorBubble.innerHTML = `<div class="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center text-black text-[10px] font-bold flex-shrink-0 animate-pulse">⟳</div><div class="bg-yellow-900/30 border border-yellow-500/30 rounded-lg p-3 text-xs text-yellow-300 leading-relaxed max-w-[85%]"><div class="font-bold text-yellow-400 mb-1">🔧 特效运行异常，正在排查</div><div class="text-[11px] break-words">${escapeHtml(friendlyMsg)}</div>${detailSection}</div>`

  history.appendChild(errorBubble)
  history.scrollTop = history.scrollHeight
}

function translateErrorMessage(msg) {
  if (!msg) return '正在排查问题'
  const lower = msg.toLowerCase()
  if (lower.includes('is not defined') || lower.includes('is not a function')) return '正在识别代码中的功能引用'
  if (lower.includes('cannot read propert') || lower.includes('cannot read properties') || lower.includes("reading of")) return '正在检查对象属性访问'
  if (lower.includes('is null') || lower.includes('is not an object')) return '正在定位空对象引用'
  if (lower.includes('is not a constructor')) return '正在检查对象创建方式'
  if (lower.includes('unexpected token')) return '正在校验代码格式'
  if (lower.includes('unhandled promise rejection') || lower.includes('unhandledrejection')) return '正在处理异步操作异常'
  if (lower.includes('out of memory')) return '特效较复杂，正在优化内存使用'
  if (lower.includes('script error')) return '正在重新加载脚本'
  if (lower.includes('permission denied') || lower.includes('not allowed')) return '正在检查操作权限'
  if (lower.includes('network') || lower.includes('fetch') || lower.includes('failed to load')) return '正在恢复网络连接'
  return '正在排查运行时问题'
}

export function displayAutoHealProgress(retryNum, maxRetries, errorPayload) {
  const history = document.getElementById('ai-chat-history')
  if (!history) return

  const friendlyMsg = translateErrorMessage(errorPayload && errorPayload.errorMessage)

  const bubble = document.createElement('div')
  bubble.className = 'flex gap-3'
  bubble.innerHTML = `<div class="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center text-black text-[10px] font-bold flex-shrink-0 animate-pulse">⟳</div><div class="bg-yellow-900/30 border border-yellow-500/30 rounded-lg p-3 text-xs text-yellow-300 leading-relaxed max-w-[85%]"><div class="font-bold text-yellow-400 mb-1">🔧 AI 正在自动修复 (${retryNum}/${maxRetries})</div><div class="text-[11px]">检测到问题：${escapeHtml(friendlyMsg)}</div><div class="text-[10px] text-yellow-400/60 mt-1">正在重新生成代码，请稍候...</div></div>`

  history.appendChild(bubble)
  history.scrollTop = history.scrollHeight
}

export function displayAutoHealSuccess(retryNum) {
  const history = document.getElementById('ai-chat-history')
  if (!history) return

  const bubble = document.createElement('div')
  bubble.className = 'flex gap-3'
  bubble.innerHTML = `<div class="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">✓</div><div class="bg-green-900/30 border border-green-500/30 rounded-lg p-3 text-xs text-green-300 leading-relaxed max-w-[85%]"><div class="font-bold text-green-400 mb-1">✅ 自动修复成功</div><div class="text-[11px]">AI 已修复代码中的问题并重新加载了特效（第 ${retryNum} 次尝试）</div></div>`

  history.appendChild(bubble)
  history.scrollTop = history.scrollHeight
}

export function displayAutoHealFailed(errorPayload, maxRetries) {
  const history = document.getElementById('ai-chat-history')
  if (!history) return

  const friendlyMsg = translateErrorMessage(errorPayload && errorPayload.errorMessage)

  const techDetails = []
  if (errorPayload) {
    if (errorPayload.filename) techDetails.push(`文件: ${errorPayload.filename}:${errorPayload.lineno || 0}:${errorPayload.colno || 0}`)
    techDetails.push(`错误: ${escapeHtml(errorPayload.errorMessage || 'Unknown error')}`)
    if (errorPayload.stackTrace) techDetails.push(`\n${escapeHtml(errorPayload.stackTrace)}`)
  }

  const detailSection = techDetails.length
    ? `<details class="mt-2"><summary class="text-red-400/80 cursor-pointer text-[10px] hover:text-red-300 transition-colors">查看技术详情</summary><pre class="mt-1 text-[9px] text-red-300/60 whitespace-pre-wrap break-words font-mono leading-relaxed">${techDetails.join('\n')}</pre></details>`
    : ''

  const bubble = document.createElement('div')
  bubble.className = 'flex gap-3'
  bubble.innerHTML = `<div class="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">✕</div><div class="bg-red-900/30 border border-red-500/30 rounded-lg p-3 text-xs text-red-300 leading-relaxed max-w-[85%]"><div class="font-bold text-red-400 mb-1">⚠ 自动修复失败</div><div class="text-[11px]">AI 已尝试 ${maxRetries} 次，未能修复此问题</div><div class="text-[10px] text-red-400/70 mt-1">问题：${escapeHtml(friendlyMsg)}</div><div class="text-[10px] text-red-400/50 mt-1">建议：修改提示词或换一种描述方式，重新生成特效</div>${detailSection}</div>`

  history.appendChild(bubble)
  history.scrollTop = history.scrollHeight
}

export function clearAIChat() {
  const history = document.getElementById('ai-chat-history')
  if (history) {
    history.innerHTML = '<div class="text-gray-500 font-mono text-[10px]">> 输入效果描述开始创作</div>'
  }
  lastErrorTime = 0
  lastErrorMessage = ''
}

export function initAIChat({ updateDemoParam }) {
  if (initialized) return
  initialized = true
  onParamChangeCallback = updateDemoParam

  const chatInput = document.getElementById('ai-chat-input')
  if (!chatInput) return

  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendAIChat()
  })

  subscribe((state) => {
    const statusEl = document.getElementById('ai-status')
    if (statusEl) {
      const labels = { Idle: '● IDLE', Generating: '● GENERATING', PreviewReady: '● READY', Failed: '● FAILED', Iterating: '● ITERATING' }
      const colors = { Idle: 'text-capcut-green', Generating: 'text-yellow-400', PreviewReady: 'text-green-400', Failed: 'text-red-400', Iterating: 'text-blue-400' }
      statusEl.textContent = labels[state.state] || '● IDLE'
      statusEl.className = colors[state.state] || 'text-capcut-green'
    }
  })
}

const API_BASE = '/api'

export async function sendAIChat() {
  const input = document.getElementById('ai-chat-input')
  const history = document.getElementById('ai-chat-history')
  const status = document.getElementById('ai-status')
  if (!input || !history) return

  const msg = input.value.trim()
  if (!msg) return

  updateSession({ autoHealRetryCount: 0, autoHealActive: false })

  const userBubble = document.createElement('div')
  userBubble.className = 'flex gap-3 flex-row-reverse'
  userBubble.innerHTML = `<div class="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center text-white text-[10px] font-bold">U</div><div class="bg-capcut-green text-black rounded-lg p-3 text-xs leading-relaxed max-w-[85%] font-bold">${msg}</div>`
  history.appendChild(userBubble)
  input.value = ''
  history.scrollTop = history.scrollHeight

  if (status) status.style.opacity = '1'

  const lowerMsg = msg.toLowerCase()

  if (lowerMsg === '/test-error') {
    const iframe = document.getElementById('content-frame')
    if (iframe && iframe.contentWindow) {
      try {
        iframe.contentWindow.postMessage({
          channel: 'cupcut-lab',
          version: 1,
          type: 'INJECT_TEST_ERROR',
          payload: {}
        }, '*')
      } catch (_) {}
    }
    const testBubble = document.createElement('div')
    testBubble.className = 'flex gap-3'
    testBubble.innerHTML = `<div class="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center text-black text-[10px] font-bold">T</div><div class="bg-yellow-900/30 border border-yellow-500/30 rounded-lg p-3 text-xs text-yellow-300 leading-relaxed max-w-[85%]"><div class="font-bold text-yellow-400 mb-1">🧪 测试模式</div><div class="font-mono text-[10px]">已向沙盒注入错误代码，等待捕获...</div></div>`
    history.appendChild(testBubble)
    history.scrollTop = history.scrollHeight
    if (status) status.style.opacity = '0'
    return
  }

  const config = getSession().uiConfig || []

  try {
    if (status) status.textContent = 'AI 正在理解指令...'

    const intentResult = await analyzeIntentFromServer(msg, config)

    if (intentResult.intent === 'UPDATE_PARAM' && intentResult.parameters) {
      const appliedParams = applyParameterUpdates(intentResult.parameters, config)
      if (appliedParams.length > 0) {
        if (status) status.style.opacity = '0'
        const paramDesc = appliedParams.map(p => `${p.name}: ${p.value}`).join('、')
        const aiBubble = document.createElement('div')
        aiBubble.className = 'flex gap-3'
        aiBubble.innerHTML = `<div class="w-6 h-6 rounded-full bg-capcut-green flex items-center justify-center text-black text-[10px] font-bold">AI</div><div class="bg-white/10 rounded-lg p-3 text-xs text-gray-300 leading-relaxed max-w-[85%]"><div class="font-bold text-green-400 mb-1">⚡ 参数已更新</div><div class="text-[11px]">${paramDesc}</div></div>`
        history.appendChild(aiBubble)
        history.scrollTop = history.scrollHeight
        return
      }
    }

    if (intentResult.intent === 'MIXED' && intentResult.parameters) {
      const appliedParams = applyParameterUpdates(intentResult.parameters, config)
      if (appliedParams.length > 0) {
        const paramDesc = appliedParams.map(p => `${p.name}: ${p.value}`).join('、')
        const mixedParamBubble = document.createElement('div')
        mixedParamBubble.className = 'flex gap-3'
        mixedParamBubble.innerHTML = `<div class="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-[10px] font-bold">⚡</div><div class="bg-green-900/30 border border-green-500/30 rounded-lg p-3 text-xs text-green-300 leading-relaxed max-w-[85%]"><div class="font-bold text-green-400 mb-1">⚡ 参数已更新</div><div class="text-[11px]">${paramDesc}</div></div>`
        history.appendChild(mixedParamBubble)
        history.scrollTop = history.scrollHeight
      }
    }

    if (status) status.textContent = 'AI 正在重新生成...'

    const session = getSession()
    if (!session.lastGeneratedPrompt && !session.lastGeneratedCode) {
      if (status) status.style.opacity = '0'
      const aiBubble = document.createElement('div')
      aiBubble.className = 'flex gap-3'
      aiBubble.innerHTML = `<div class="w-6 h-6 rounded-full bg-capcut-green flex items-center justify-center text-black text-[10px] font-bold">AI</div><div class="bg-white/10 rounded-lg p-3 text-xs text-gray-300 leading-relaxed max-w-[85%]">请先通过创作向导生成一个特效，然后才能在这里修改。</div>`
      history.appendChild(aiBubble)
      history.scrollTop = history.scrollHeight
      return
    }

    const rewriteReason = intentResult.intent === 'MIXED'
      ? (intentResult.reason || '同时包含结构修改，正在重新生成代码...')
      : (intentResult.reason || '需要结构性修改，正在重新生成代码...')

    const rewriteBubble = document.createElement('div')
    rewriteBubble.className = 'flex gap-3'
    rewriteBubble.innerHTML = `<div class="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center text-black text-[10px] font-bold flex-shrink-0 animate-pulse">⟳</div><div class="bg-yellow-900/30 border border-yellow-500/30 rounded-lg p-3 text-xs text-yellow-300 leading-relaxed max-w-[85%]"><div class="font-bold text-yellow-400 mb-1">🎨 正在重新生成特效</div><div class="text-[11px]">${rewriteReason}</div></div>`
    history.appendChild(rewriteBubble)
    history.scrollTop = history.scrollHeight

    const res = await fetch(`${API_BASE}/modify-effect-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: session.lastGeneratedPrompt,
        code: session.lastGeneratedCode,
        modification: msg
      })
    })

    const raw = await res.text()
    let json = null
    try { json = JSON.parse(raw) } catch (_) { json = null }

    if (!res.ok || !json || json.error || !json.code) {
      throw new Error((json && json.error) || `生成失败 (HTTP ${res.status})`)
    }

    if (json.degraded) {
      updateSession({
        lastGeneratedCode: json.code,
        autoHealRetryCount: 0,
        autoHealActive: false
      })

      const { generateAIHTML } = await import('./templates.js')
      const htmlContent = generateAIHTML(json.code)
      const blob = new Blob([htmlContent], { type: 'text/html' })
      const url = URL.createObjectURL(blob)

      const iframe = document.getElementById('content-frame')
      if (iframe) iframe.src = url

      if (status) status.style.opacity = '0'

      const degradedReason = json.degradedReason || 'AI 生成的代码不符合规范'
      const degradedBubble = document.createElement('div')
      degradedBubble.className = 'flex gap-3'
      degradedBubble.innerHTML = `<div class="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">⚠</div><div class="bg-orange-900/30 border border-orange-500/30 rounded-lg p-3 text-xs text-orange-300 leading-relaxed max-w-[85%]"><div class="font-bold text-orange-400 mb-1">⚠ AI 生成质量不佳</div><div class="text-[11px]">AI 生成的代码未能通过验证，已暂时显示默认效果</div><div class="text-[10px] text-orange-400/60 mt-1">原因：${escapeHtml(degradedReason)}</div><div class="text-[10px] text-orange-400/50 mt-1">建议：尝试换一种描述方式重新生成</div></div>`
      history.appendChild(degradedBubble)
      history.scrollTop = history.scrollHeight
      return
    }

    updateSession({
      lastGeneratedCode: json.code,
      autoHealRetryCount: 0,
      autoHealActive: false
    })

    const { generateAIHTML } = await import('./templates.js')
    const htmlContent = generateAIHTML(json.code)
    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)

    const iframe = document.getElementById('content-frame')
    if (iframe) iframe.src = url

    if (status) status.style.opacity = '0'

    const successBubble = document.createElement('div')
    successBubble.className = 'flex gap-3'
    successBubble.innerHTML = `<div class="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">✓</div><div class="bg-green-900/30 border border-green-500/30 rounded-lg p-3 text-xs text-green-300 leading-relaxed max-w-[85%]"><div class="font-bold text-green-400 mb-1">✅ 特效已重新生成</div><div class="text-[11px]">根据你的要求完成了修改</div></div>`
    history.appendChild(successBubble)
    history.scrollTop = history.scrollHeight

  } catch (e) {
    if (status) status.style.opacity = '0'
    const aiBubble = document.createElement('div')
    aiBubble.className = 'flex gap-3'
    aiBubble.innerHTML = `<div class="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">✕</div><div class="bg-red-900/30 border border-red-500/30 rounded-lg p-3 text-xs text-red-300 leading-relaxed max-w-[85%]"><div class="font-bold text-red-400 mb-1">⚠ 处理失败</div><div class="text-[11px]">${escapeHtml(e.message || '未知错误')}</div><div class="text-[10px] text-red-400/50 mt-1">建议：修改描述后重新生成，或使用创作向导</div></div>`
    history.appendChild(aiBubble)
    history.scrollTop = history.scrollHeight
  }
}

async function analyzeIntentFromServer(prompt, uiConfig) {
  try {
    const res = await fetch(`${API_BASE}/analyze-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, uiConfig })
    })
    if (!res.ok) return { intent: 'REWRITE', reason: '正在理解你的意图，尝试直接重新生成...' }
    return await res.json()
  } catch (_) {
    return { intent: 'REWRITE', reason: '正在理解你的意图，尝试直接重新生成...' }
  }
}

function applyParameterUpdates(parameters, config) {
  const applied = []
  const bindMap = {}
  config.forEach((p) => {
    if (p.bind) bindMap[p.bind.toLowerCase()] = p
  })

  Object.entries(parameters).forEach(([key, value]) => {
    const param = bindMap[key.toLowerCase()]
    if (!param) return

    let finalValue = value
    if (param.type === 'range' || param.type === 'number') {
      const num = typeof value === 'string' ? parseFloat(value) : value
      if (Number.isNaN(num)) return
      finalValue = num
    }

    if (onParamChangeCallback) {
      onParamChangeCallback(param.bind, finalValue)
    }

    const input = document.querySelector(`[data-bind="${param.bind}"]`)
    if (input) {
      if (input.type === 'checkbox') {
        input.checked = !!finalValue
        input.dispatchEvent(new Event('change'))
      } else {
        input.value = finalValue
        input.dispatchEvent(new Event('input'))
      }
    }

    const valEl = document.getElementById(`val-${param.bind}`)
    if (valEl) {
      valEl.textContent = typeof finalValue === 'number' && finalValue % 1 !== 0 ? finalValue.toFixed(2) : finalValue
    }

    applied.push({ name: param.name, value: finalValue })
  })

  return applied
}


