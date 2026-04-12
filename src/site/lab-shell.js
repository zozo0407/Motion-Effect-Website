import { updateSession, getSession } from './session-store.js'

let labView = null
let loader = null
let initialized = false

const HIDDEN_DEMOS = [
  'demo11.html',
  'demo19.html',
  'demo22.html',
  'demo23.html',
  'demo24.html',
  'demo25.html',
  'demo26.html',
  'demo_liquid_orb.html',
]

export function initShell() {
  if (initialized) return
  initialized = true

  labView = document.getElementById('lab-view')
  loader = document.getElementById('loader')

  const aspectSelect = document.getElementById('aspect-select')
  const labCanvasContainer = document.getElementById('lab-canvas-container')
  const contentFrame = document.getElementById('content-frame')

  if (aspectSelect && labCanvasContainer && contentFrame) {
    aspectSelect.addEventListener('change', (e) => {
      const ratio = e.target.value
      const iframe = contentFrame

      iframe.style.width = ''
      iframe.style.height = ''
      iframe.style.position = ''
      iframe.style.left = ''
      iframe.style.top = ''
      iframe.style.transform = ''

      labCanvasContainer.style.display = 'flex'
      labCanvasContainer.style.alignItems = 'center'
      labCanvasContainer.style.justifyContent = 'center'

      if (ratio === 'full') {
        iframe.style.width = '100%'
        iframe.style.height = '100%'
        return
      }

      let w
      let h
      const containerW = labCanvasContainer.clientWidth
      const containerH = labCanvasContainer.clientHeight
      const [rw, rh] = ratio.split(':').map(Number)
      const targetRatio = rw / rh
      const containerRatio = containerW / containerH

      if (containerRatio > targetRatio) {
        h = containerH * 0.9
        w = h * targetRatio
      } else {
        w = containerW * 0.9
        h = w / targetRatio
      }

      iframe.style.width = `${w}px`
      iframe.style.height = `${h}px`
      iframe.style.border = '1px solid rgba(255,255,255,0.1)'
      iframe.style.boxShadow = '0 0 50px rgba(0,0,0,0.5)'
    })
  }
}

export function openShell(title, tag, isOriginal = true) {
  if (!labView || !loader) return

  labView.classList.remove('hidden')
  if (typeof gsap !== 'undefined') {
    gsap.to(labView, { opacity: 1, duration: 0.3 })
  }

  const titleEl = document.getElementById('lab-title')
  if (titleEl) titleEl.textContent = `${tag} // ${title}`

  const leftPanel = document.getElementById('lab-left-panel')
  if (leftPanel) {
    const isScriptScene = typeof tag === 'string' && tag.toLowerCase().includes('scriptscene')
    const isHidden = !isScriptScene && HIDDEN_DEMOS.some((d) => getSession().previewUrl.includes(d))
    if (isHidden) leftPanel.classList.add('hidden')
    else leftPanel.classList.remove('hidden')
  }

  const originalSpan = document.getElementById('lab-status-original')
  const copySpan = document.getElementById('lab-status-copy')
  if (originalSpan && copySpan) {
    if (isOriginal) {
      originalSpan.className = 'text-white opacity-100'
      copySpan.className = 'text-gray-600 opacity-30'
    } else {
      originalSpan.className = 'text-gray-600 opacity-30'
      copySpan.className = 'text-white opacity-100'
    }
  }

  loader.classList.remove('opacity-0')

  const dynamicControls = document.getElementById('dynamic-controls')
  if (dynamicControls)
    dynamicControls.innerHTML =
      '<div class="text-[10px] text-gray-500 font-mono animate-pulse">Initializing Interface...</div>'

  const aspectSelect = document.getElementById('aspect-select')
  if (aspectSelect) {
    aspectSelect.value = 'full'
    aspectSelect.dispatchEvent(new Event('change'))
  }

  updateSession({ isOpen: true, title: title, tag: tag })
}

export function closeShell() {
  if (!labView) return

  if (typeof gsap !== 'undefined') {
    gsap.to(labView, {
      opacity: 0,
      duration: 0.3,
      onComplete: () => {
        labView.classList.add('hidden')
        const contentFrame = document.getElementById('content-frame')
        if (contentFrame) contentFrame.src = ''
      },
    })
  } else {
    labView.classList.add('hidden')
    const contentFrame = document.getElementById('content-frame')
    if (contentFrame) contentFrame.src = ''
  }

  updateSession({ isOpen: false })
}

export function getShellState() {
  return {
    isOpen: getSession().isOpen,
    title: getSession().title,
    tag: getSession().tag,
  }
}
