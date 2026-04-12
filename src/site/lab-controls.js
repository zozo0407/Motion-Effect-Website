import { updateSession, getSession } from './session-store.js'

let containerEl = null
let onParamChangeCallback = null
let onFileUploadCallback = null
let onLoadSourceCallback = null
let currentConfig = []

export function initControls(container, { onParamChange, onFileUpload, onLoadSource }) {
  containerEl = container
  onParamChangeCallback = onParamChange || null
  onFileUploadCallback = onFileUpload || null
  onLoadSourceCallback = onLoadSource || null
}

export function renderControls(config) {
  if (!containerEl) return
  containerEl.innerHTML = ''

  if (config && !Array.isArray(config)) {
    config = Object.entries(config).map(([bind, cfg]) => {
      const type =
        cfg.type === 'boolean' ? 'checkbox' : cfg.type === 'number' ? 'range' : cfg.type
      return {
        bind,
        name: cfg.label || bind,
        type: type,
        value: cfg.value,
        min: cfg.min,
        max: cfg.max,
        step: cfg.step,
        options: cfg.options,
        placeholder: cfg.placeholder,
        text: cfg.text,
        width: cfg.width,
        children: cfg.children,
        accept: cfg.accept,
        multiple: cfg.multiple,
      }
    })
  }

  currentConfig = config
  updateSession({ uiConfig: config })

  const hasPresets = config.some((item) => item.type === 'presets')
  if (!hasPresets) {
    const defaultValues = {}
    let hasDefaults = false

    const extractDefaults = (items) => {
      items.forEach((item) => {
        if (item.bind && item.value !== undefined) {
          defaultValues[item.bind] = item.value
          hasDefaults = true
        }
        if (item.children) extractDefaults(item.children)
      })
    }
    extractDefaults(config)

    if (hasDefaults) {
      config = [
        {
          type: 'presets',
          label: '常用预设 / PRESETS',
          options: [{ label: '默认 / Default', values: defaultValues }],
        },
        ...config,
      ]
    }
  }

  if (config.length > 0) {
    config.forEach((item) => {
      const wrapper = document.createElement('div')
      wrapper.className = 'space-y-2'

      if (item.type === 'presets') {
        const presetContainer = document.createElement('div')
        presetContainer.className = 'mb-6'

        if (item.label) {
          const label = document.createElement('div')
          label.className =
            'text-[10px] text-gray-500 font-mono uppercase mb-3 tracking-wider flex items-center gap-2'
          label.innerHTML = `<span class="w-1 h-1 bg-capcut-green rounded-full"></span>${item.label}`
          presetContainer.appendChild(label)
        }

        const grid = document.createElement('div')
        grid.className = 'grid grid-cols-3 gap-2'

        item.options.forEach((opt) => {
          const btn = document.createElement('button')
          btn.className =
            'px-2 py-2 bg-white/5 hover:bg-white/10 text-gray-300 text-[10px] font-mono rounded border border-transparent hover:border-white/10 transition-all active:scale-95 flex items-center justify-center text-center'
          const shortLabel = opt.label.includes('/') ? opt.label.split('/')[0].trim() : opt.label
          btn.textContent = shortLabel
          btn.title = opt.label

          btn.onclick = () => {
            Array.from(grid.children).forEach((b) => {
              b.className =
                'px-2 py-2 bg-white/5 hover:bg-white/10 text-gray-300 text-[10px] font-mono rounded border border-transparent hover:border-white/10 transition-all active:scale-95 flex items-center justify-center text-center'
            })
            btn.className =
              'px-2 py-2 bg-capcut-green text-black text-[10px] font-bold font-mono rounded border border-capcut-green transition-all active:scale-95 flex items-center justify-center text-center shadow-[0_0_10px_rgba(0,202,224,0.4)]'

            if (opt.values) {
              Object.entries(opt.values).forEach(([key, val]) => {
                updateDemoParam(key, val)

                const input = document.querySelector(`[data-bind="${key}"]`)
                if (input) {
                  if (input.type === 'checkbox') {
                    input.checked = val
                    input.dispatchEvent(new Event('change'))
                  } else {
                    input.value = val
                    input.dispatchEvent(new Event('input'))
                  }
                } else {
                  const labelVal = document.getElementById(`val-${key}`)
                  if (labelVal) {
                    labelVal.textContent =
                      typeof val === 'number' && val % 1 !== 0 ? val.toFixed(2) : val
                  }
                }
              })
            }
          }
          grid.appendChild(btn)
        })

        presetContainer.appendChild(grid)
        wrapper.appendChild(presetContainer)
        containerEl.appendChild(wrapper)
        return
      }

      const labelRow = document.createElement('div')
      labelRow.className =
        'flex justify-between text-[10px] text-gray-400 font-mono uppercase mb-2'
      labelRow.innerHTML = `<span>${item.name}</span><span id="val-${item.bind}" class="text-white">${item.value}</span>`

      wrapper.appendChild(labelRow)

      if (!item.type || item.type === 'range') {
        const sliderContainer = document.createElement('div')
        sliderContainer.className = 'relative h-4 flex items-center'

        const slider = document.createElement('input')
        slider.type = 'range'
        slider.min = item.min
        slider.max = item.max
        slider.step = item.step || 0.01
        slider.value = item.value
        slider.className = 'w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer'
        slider.dataset.bind = item.bind

        slider.addEventListener('input', (e) => {
          const val = e.target.value
          const valEl = document.getElementById(`val-${item.bind}`)
          if (valEl) valEl.textContent = parseFloat(val).toFixed(2)
          updateDemoParam(item.bind, val)
        })
        sliderContainer.appendChild(slider)
        wrapper.appendChild(sliderContainer)
      } else if (item.type === 'color') {
        const picker = document.createElement('div')
        picker.className = 'flex gap-2 items-center'

        const colorWrapper = document.createElement('div')
        colorWrapper.className =
          'w-full h-8 rounded border border-white/10 bg-white/5 relative overflow-hidden flex items-center px-2 gap-2 cursor-pointer hover:border-white/30 transition-colors'

        const colorPreview = document.createElement('div')
        colorPreview.className = 'w-4 h-4 rounded-full shadow-sm border border-white/10'
        colorPreview.style.backgroundColor = item.value

        const colorText = document.createElement('span')
        colorText.className = 'text-[10px] font-mono text-gray-400'
        colorText.textContent = item.value

        const input = document.createElement('input')
        input.type = 'color'
        input.value = item.value
        input.className = 'absolute inset-0 opacity-0 cursor-pointer w-full h-full'
        input.dataset.bind = item.bind

        input.addEventListener('input', (e) => {
          const val = e.target.value
          const valEl = document.getElementById(`val-${item.bind}`)
          if (valEl) valEl.textContent = val
          colorPreview.style.backgroundColor = val
          colorText.textContent = val
          updateDemoParam(item.bind, val)
        })

        colorWrapper.appendChild(colorPreview)
        colorWrapper.appendChild(colorText)
        colorWrapper.appendChild(input)
        picker.appendChild(colorWrapper)
        wrapper.appendChild(picker)
      } else if (item.type === 'checkbox') {
        const checkboxWrapper = document.createElement('label')
        checkboxWrapper.className = 'flex items-center gap-2 cursor-pointer group'

        const checkbox = document.createElement('input')
        checkbox.type = 'checkbox'
        checkbox.checked = item.value
        checkbox.className = 'peer sr-only'
        checkbox.dataset.bind = item.bind

        const toggle = document.createElement('div')
        toggle.className =
          "w-8 h-4 bg-gray-700 peer-checked:bg-capcut-green rounded-full peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all relative transition-colors"

        checkbox.addEventListener('change', (e) => {
          const val = e.target.checked
          const valEl = document.getElementById(`val-${item.bind}`)
          if (valEl) valEl.textContent = val ? 'ON' : 'OFF'
          updateDemoParam(item.bind, val)
        })

        checkboxWrapper.appendChild(checkbox)
        checkboxWrapper.appendChild(toggle)
        wrapper.appendChild(checkboxWrapper)
      } else if (item.type === 'select') {
        const selectWrapper = document.createElement('div')
        selectWrapper.className = 'relative group'

        const select = document.createElement('select')
        select.className =
          'w-full bg-white/5 text-white text-[10px] font-mono p-2 rounded border border-white/10 outline-none focus:border-capcut-green appearance-none cursor-pointer hover:bg-white/10 transition-colors'
        select.dataset.bind = item.bind

        item.options.forEach((opt, idx) => {
          const option = document.createElement('option')
          option.value = opt
          option.text = opt
          if (item.value === idx || item.value === opt) option.selected = true
          select.appendChild(option)
        })

        select.addEventListener('change', (e) => {
          const val = e.target.value
          const valEl = document.getElementById(`val-${item.bind}`)
          if (valEl) valEl.textContent = val
          updateDemoParam(item.bind, val)
        })

        const arrow = document.createElement('div')
        arrow.className =
          'absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 text-[8px] group-hover:text-white transition-colors'
        arrow.innerHTML = '▼'

        selectWrapper.appendChild(select)
        selectWrapper.appendChild(arrow)
        wrapper.appendChild(selectWrapper)
      } else if (item.type === 'text') {
        const input = document.createElement('textarea')
        input.value = item.value
        input.className =
          'w-full bg-white/5 text-white text-[10px] font-mono p-2 rounded border border-white/10 outline-none focus:border-capcut-green placeholder-gray-500 hover:bg-white/10 transition-colors resize-none'
        input.placeholder = item.placeholder || ''
        input.dataset.bind = item.bind

        input.addEventListener('input', (e) => {
          const val = e.target.value
          updateDemoParam(item.bind, val)
        })

        wrapper.appendChild(input)
      } else if (item.type === 'button') {
        const btn = document.createElement('button')
        const baseClass =
          'w-full bg-white/5 hover:bg-white/10 text-white text-[10px] font-mono py-2 rounded border border-white/10 transition-all active:bg-capcut-green active:text-black active:scale-[0.98]'

        if (item.width) {
          btn.style.width = item.width
          btn.className = baseClass.replace('w-full', '')
        } else {
          btn.className = baseClass
        }

        if (item.className) btn.className = item.className

        btn.textContent = item.text || item.name
        btn.dataset.bind = item.bind

        btn.addEventListener('click', () => {
          const val = item.value !== undefined ? item.value : Date.now()
          updateDemoParam(item.bind, val)
        })

        wrapper.appendChild(btn)
      } else if (item.type === 'row') {
        const row = document.createElement('div')
        row.className = 'flex gap-2 w-full'

        if (item.children && Array.isArray(item.children)) {
          item.children.forEach((childItem) => {
            if (childItem.type !== 'button') return
            const btn = document.createElement('button')
            btn.className =
              'flex-1 bg-white/5 hover:bg-white/10 text-white text-[10px] font-mono py-2 rounded border border-white/10 transition-all active:bg-capcut-green active:text-black active:scale-[0.98]'
            btn.textContent = childItem.text || childItem.name
            btn.dataset.bind = childItem.bind
            btn.addEventListener('click', () => {
              const val = childItem.value !== undefined ? childItem.value : Date.now()
              updateDemoParam(childItem.bind, val)
            })
            row.appendChild(btn)
          })
        }
        wrapper.appendChild(row)
      } else if (item.type === 'file') {
        const btn = document.createElement('button')
        btn.className =
          'w-full bg-white/5 hover:bg-white/10 text-white text-[10px] font-mono py-2 rounded border border-white/10 transition-all active:bg-capcut-green active:text-black flex items-center justify-center gap-2 group'
        btn.innerHTML = `<i data-lucide="upload" class="w-3 h-3 group-hover:scale-110 transition-transform"></i> ${item.text || item.name}`

        const hiddenInput = document.createElement('input')
        hiddenInput.type = 'file'
        hiddenInput.style.display = 'none'
        if (item.multiple) hiddenInput.multiple = true
        hiddenInput.accept = item.accept || 'image/*'

        btn.addEventListener('click', () => hiddenInput.click())

        hiddenInput.addEventListener('change', (e) => {
          const files = Array.from(e.target.files)
          if (files.length === 0) return

          const payloads = files.map((f) => ({
            name: f.name,
            type: f.type,
            url: URL.createObjectURL(f),
          }))

          if (onFileUploadCallback) {
            onFileUploadCallback(item.bind, payloads)
          }
          hiddenInput.value = ''
        })

        wrapper.appendChild(btn)
        wrapper.appendChild(hiddenInput)
      }

      containerEl.appendChild(wrapper)
    })
  } else {
    containerEl.innerHTML =
      '<div class="text-[10px] text-gray-600 font-mono italic">No parameters available</div>'
  }
}

export function renderSources(sources) {
  if (!sources) return
  const select = document.getElementById('source-select')
  if (!select) return
  select.innerHTML = ''
  sources.forEach((src) => {
    const opt = document.createElement('option')
    opt.value = src.value
    opt.textContent = src.name
    select.appendChild(opt)
  })

  select.onchange = (e) => {
    if (onLoadSourceCallback) {
      const source = sources.find((s) => s.value == e.target.value) || { type: 'camera' }
      onLoadSourceCallback(source)
    }
  }
}

export function updateControlValue(bind, value) {
  const el = document.querySelector(`[data-bind="${bind}"]`)
  if (!el) return

  if (el.type === 'checkbox') {
    el.checked = !!value
  } else {
    el.value = value
  }

  const valEl = document.getElementById(`val-${bind}`)
  if (valEl) {
    if (typeof value === 'number' && value % 1 !== 0) {
      valEl.textContent = value.toFixed(2)
    } else {
      valEl.textContent = value
    }
  }
}

export function resetControls() {
  const cfg = currentConfig || []
  if (!cfg.length) return
  cfg.forEach((item) => {
    const el = document.querySelector(`[data-bind="${item.bind}"]`)
    if (!el) return
    if (item.type === 'color') {
      el.value = item.value
      el.dispatchEvent(new Event('input', { bubbles: true }))
      return
    }
    if (item.type === 'checkbox') {
      el.checked = !!item.value
      el.dispatchEvent(new Event('change', { bubbles: true }))
      return
    }
    if (item.type === 'select') {
      let val = item.value
      if (typeof val === 'number' && Array.isArray(item.options)) {
        val = item.options[val]
      }
      el.value = val
      el.dispatchEvent(new Event('change', { bubbles: true }))
      return
    }
    el.value = item.value
    el.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

export function getCurrentConfig() {
  return currentConfig
}

export function updateDemoParam(key, value) {
  let finalVal = value
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed !== '' && !isNaN(trimmed) && !value.startsWith('#')) {
      finalVal = parseFloat(trimmed)
    }
  }
  if (onParamChangeCallback) {
    onParamChangeCallback(key, finalVal)
  }
}
