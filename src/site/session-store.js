let state = {
  sessionId: '',
  isOpen: false,
  previewUrl: '',
  title: '',
  tag: '',
  uiConfig: [],
  uiDefaults: {},
  lastKnownGood: null,
  lastError: null,
  errorCount: 0,
  isRecording: false,
  isGenerating: false,
  state: 'Idle',
  autoHealRetryCount: 0,
  autoHealMaxRetries: 2,
  autoHealActive: false,
  lastGeneratedPrompt: '',
  lastGeneratedCode: '',
}

const listeners = new Set()

export function getSession() {
  return { ...state }
}

export function updateSession(partial) {
  const prev = { ...state }
  state = { ...state, ...partial }
  listeners.forEach((fn) => {
    try { fn(state, prev) } catch (_) {}
  })
}

export function resetSession() {
  state = {
    sessionId: '',
    isOpen: false,
    previewUrl: '',
    title: '',
    tag: '',
    uiConfig: [],
    uiDefaults: {},
    lastKnownGood: null,
    lastError: null,
    errorCount: 0,
    isRecording: false,
    isGenerating: false,
    state: 'Idle',
    autoHealRetryCount: 0,
    autoHealMaxRetries: 2,
    autoHealActive: false,
    lastGeneratedPrompt: '',
    lastGeneratedCode: '',
  }
  listeners.forEach((fn) => {
    try { fn(state, {}) } catch (_) {}
  })
}

export function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function unsubscribe(listener) {
  listeners.delete(listener)
}
