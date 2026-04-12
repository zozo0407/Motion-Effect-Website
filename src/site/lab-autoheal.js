import { getSession, updateSession } from './session-store.js'
import { generateAIHTML } from './templates.js'
import { displayRuntimeError, displayAutoHealProgress, displayAutoHealSuccess, displayAutoHealFailed } from './lab-ai-chat.js'

const API_BASE = '/api'
const HEAL_COOLDOWN_MS = 2000
let lastHealTime = 0

export function resetAutoHeal() {
  updateSession({ autoHealRetryCount: 0, autoHealActive: false })
}

export async function handleRuntimeErrorForAutoHeal(errorPayload) {
  const session = getSession()
  const now = Date.now()
  if (now - lastHealTime < HEAL_COOLDOWN_MS) return
  lastHealTime = now

  if (session.autoHealActive) return
  if (session.autoHealRetryCount >= session.autoHealMaxRetries) {
    displayAutoHealFailed(errorPayload, session.autoHealMaxRetries)
    return
  }

  if (!session.lastGeneratedCode) {
    displayRuntimeError(errorPayload)
    return
  }

  const retryNum = session.autoHealRetryCount + 1
  const maxRetries = session.autoHealMaxRetries

  updateSession({ autoHealActive: true })
  displayAutoHealProgress(retryNum, maxRetries, errorPayload)

  try {
    const res = await fetch(`${API_BASE}/repair-runtime-error`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: session.lastGeneratedPrompt,
        code: session.lastGeneratedCode,
        errorMessage: errorPayload.errorMessage || 'Unknown error',
        stackTrace: errorPayload.stackTrace || ''
      })
    })

    if (!res.ok) {
      const errText = await res.text()
      let errMsg = `HTTP ${res.status}`
      try { const j = JSON.parse(errText); errMsg = j.error || errMsg } catch (_) {}
      throw new Error(errMsg)
    }

    const json = await res.json()
    if (json.error) throw new Error(json.error)
    if (!json.code || typeof json.code !== 'string') throw new Error('修复接口未返回有效代码')

    if (json.degraded) {
      updateSession({
        lastGeneratedCode: json.code,
        autoHealRetryCount: session.autoHealMaxRetries,
        autoHealActive: false
      })

      const htmlContent = generateAIHTML(json.code)
      const blob = new Blob([htmlContent], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const iframe = document.getElementById('content-frame')
      if (iframe) iframe.src = url

      displayAutoHealFailed(
        { errorMessage: json.degradedReason || 'AI 修复后的代码仍不符合规范' },
        session.autoHealMaxRetries
      )
      return
    }

    updateSession({
      lastGeneratedCode: json.code,
      autoHealRetryCount: session.autoHealRetryCount + 1,
      autoHealActive: false
    })

    const htmlContent = generateAIHTML(json.code)
    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)

    const iframe = document.getElementById('content-frame')
    if (iframe) {
      iframe.src = url
    }

    displayAutoHealSuccess(retryNum)
  } catch (e) {
    updateSession({
      autoHealRetryCount: session.autoHealRetryCount + 1,
      autoHealActive: false
    })

    const updatedSession = getSession()
    if (updatedSession.autoHealRetryCount >= updatedSession.autoHealMaxRetries) {
      displayAutoHealFailed(errorPayload, updatedSession.autoHealMaxRetries)
    } else {
      displayRuntimeError(errorPayload)
    }
  }
}
