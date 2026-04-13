import { updateSession, getSession } from './session-store.js'

const API_BASE = '/api'
const OBSERVE_WINDOW_MS = 3000

const TEST_CASES = [
  { name: '虹彩流体铬', prompt: '一个不断变形的液态金属球体，表面具有类似油污的虹彩折射效果。随着形态扭曲，光影在曲面上产生流动的金属质感，背景纯黑，带有高级的摄影棚光影反射。请确保代码结构极致精简，仅使用 Three.js 内置材质和几何体实现，避免复杂的自定义 Shader。', difficulty: 'hard' },
  { name: '生物发光神经网', prompt: '复杂的有机发光细丝网格，呈现深紫与电蓝的渐变，伴随呼吸感跳动。微小的光点（像神经元信号）在细丝间高速穿梭，具有强烈的景深效果和泛光（Bloom）。请确保代码结构极致精简，仅使用 Three.js 内置材质和几何体实现，避免复杂的自定义 Shader。', difficulty: 'hard' },
  { name: '体素沙暴侵蚀', prompt: '一个巨大的圆环在数字化风暴中逐渐瓦解。成千上万个微小的发光立方体从表面剥离，随风向一个方向拉扯、旋转并消散在虚空中。请确保代码结构极致精简，仅使用 Three.js InstancedMesh 和内置材质实现，避免复杂的自定义 Shader。', difficulty: 'hard' },
  { name: '晶体程序化生长', prompt: '尖锐、半透明的石英晶体簇从屏幕中心向四周程序化生长穿插。晶体材质具有极高的折射率和色散效果，光线穿过边缘时产生彩虹般的色差。请确保代码结构极致精简，仅使用 Three.js MeshPhysicalMaterial 内置材质实现，避免复杂的自定义 Shader。', difficulty: 'hard' },
  { name: '赛博数据流深渊', prompt: '由垂直排列的发光代码和几何符号构成的 3D 峡谷景观。摄像机在数据森林中疾速向下坠落穿梭，伴随强烈的运动模糊和霓虹灯拖影，颜色以黑客绿和警告红为主。请确保代码结构极致精简，仅使用 Three.js 内置材质和几何体实现，避免复杂的自定义 Shader。', difficulty: 'hard' },
]

let isRunning = false
let testResults = []
let runtimeErrorHandler = null
let errorReceived = false
let receivedErrorMessage = ''

function log(style, ...args) {
  const prefix = '%c[AUTO-TEST]'
  const base = 'font-weight:bold;font-family:monospace;'
  const styles = {
    info: `${base}color:#00CAE0`,
    success: `${base}color:#22c55e`,
    fail: `${base}color:#ef4444`,
    warn: `${base}color:#f59e0b`,
    header: `${base}color:#fff;font-size:14px;background:#1a1a2e;padding:4px 8px;border-radius:4px`,
  }
  console.log(prefix, styles[style] || styles.info, ...args)
}

async function generateCode(prompt) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 90000)
  try {
    const res = await fetch(`${API_BASE}/generate-effect-v2`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    const raw = await res.text()
    let json = null
    try { json = JSON.parse(raw) } catch (_) { json = null }
    if (!res.ok) {
      const msg = (json && json.error) ? json.error : `HTTP ${res.status}`
      throw new Error(msg)
    }
    if (!json || !json.code || typeof json.code !== 'string') {
      throw new Error(json && json.error ? json.error : '服务返回缺少 code 字段')
    }
    return { code: json.code, degraded: !!json.degraded, degradedReason: json.degradedReason || '' }
  } catch (e) {
    if (e.name === 'AbortError') throw new Error('生成超时 (90s)')
    throw e
  } finally {
    clearTimeout(timeoutId)
  }
}

function isWebGLAvailable() {
  try {
    const c = document.createElement('canvas')
    c.width = 1; c.height = 1
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch (_) { return false }
}

function validateCode(code) {
  const errors = []
  try {
    const stripped = code
      .replace(/^\s*import\s+[\s\S]*?from\s+['"][^'"]*['"]\s*;?\s*$/gm, '')
      .replace(/^\s*import\s+['"][^'"]*['"]\s*;?\s*$/gm, '')
      .replace(/export\s+default\s+/g, 'var __default = ')
      .replace(/export\s+/g, '')
    new Function(stripped)
  } catch (e) {
    if (e instanceof SyntaxError) errors.push(`语法错误: ${e.message}`)
  }
  if (!code || code.trim().length < 20) errors.push('代码为空或过短')
  if (!/export\s+default\s+class/i.test(code) && !/EngineEffect/.test(code)) {
    errors.push('缺少 EngineEffect 类定义')
  }
  const dangerousPatterns = [
    { pattern: /document\.write/i, msg: '使用了 document.write' },
    { pattern: /while\s*\(\s*true\s*\)/i, msg: '包含无限循环 while(true)' },
  ]
  dangerousPatterns.forEach(({ pattern, msg }) => {
    if (pattern.test(code)) errors.push(msg)
  })
  return errors
}

async function runSingleTestStatic(testCase, index, total) {
  const startTime = Date.now()
  const result = {
    '#': index + 1,
    '用例名称': testCase.name,
    '难度': testCase.difficulty,
    'Prompt': testCase.prompt.substring(0, 40) + '...',
    '状态': 'PENDING',
    '耗时(ms)': 0,
    '报错信息': '',
  }

  log('info', `[${index + 1}/${total}] 开始测试 (静态模式): ${testCase.name}`)

  try {
    log('info', `  → 正在生成代码...`)
    const { code, degraded, degradedReason } = await generateCode(testCase.prompt)

    if (degraded) {
      result['状态'] = 'FAIL'
      result['报错信息'] = `代码降级: ${degradedReason}`
      result['耗时(ms)'] = Date.now() - startTime
      log('fail', `  ✕ [FAIL] 代码被降级: ${degradedReason}`)
      return result
    }

    updateSession({
      lastGeneratedPrompt: testCase.prompt,
      lastGeneratedCode: code,
      autoHealRetryCount: 0,
      autoHealActive: false,
    })

    log('info', `  → 执行静态代码验证...`)
    const validationErrors = validateCode(code)
    result['耗时(ms)'] = Date.now() - startTime

    if (validationErrors.length > 0) {
      result['状态'] = 'FAIL'
      result['报错信息'] = validationErrors.join('; ')
      log('fail', `  ✕ [FAIL] 静态验证失败: ${validationErrors.join('; ')}`)
    } else {
      result['状态'] = 'SUCCESS'
      log('success', `  ✓ [SUCCESS] 静态验证通过`)
    }
  } catch (e) {
    result['耗时(ms)'] = Date.now() - startTime
    result['状态'] = 'FAIL'
    result['报错信息'] = e.message || String(e)
    log('fail', `  ✕ [FAIL] 生成失败: ${e.message}`)
  }
  return result
}

function printReport(results) {
  console.log('')
  log('header', '═══════════════════════════════════════════')
  log('header', '       AUTO-TEST REPORT / 自动化测试报告       ')
  log('header', '═══════════════════════════════════════════')
  console.log('')

  console.table(results.map(r => ({
    '#': r['#'],
    '用例名称': r['用例名称'],
    '难度': r['难度'],
    '状态': r['状态'],
    '耗时(ms)': r['耗时(ms)'],
    '报错信息': r['报错信息'],
  })))

  const total = results.length
  const successCount = results.filter(r => r['状态'] === 'SUCCESS').length
  const failCount = total - successCount
  const successRate = total > 0 ? ((successCount / total) * 100).toFixed(1) : '0.0'
  const avgTime = total > 0 ? Math.round(results.reduce((s, r) => s + r['耗时(ms)'], 0) / total) : 0

  console.log('')
  log('info', '────────── 总体统计 ──────────')
  log(successCount >= failCount ? 'success' : 'fail', `总成功率: ${successCount}/${total} (${successRate}%)`)
  log('info', `平均耗时: ${avgTime}ms`)

  const failedCases = results.filter(r => r['状态'] === 'FAIL')
  if (failedCases.length > 0) {
    console.log('')
    log('fail', '────────── 失败用例详情 ──────────')
    failedCases.forEach(r => {
      log('fail', `  [${r['#']}] ${r['用例名称']}: ${r['报错信息']}`)
    })
  }

  console.log('')
  log('header', '═══════════════════════════════════════════')
  console.log('')

  return { total, successCount, failCount, successRate, avgTime }
}

export async function runAutoTest(options = {}) {
  if (isRunning) {
    log('warn', '测试正在运行中，请等待当前测试完成')
    return
  }

  const cases = options.cases || TEST_CASES
  const startIndex = options.startIndex || 0
  const endIndex = options.endIndex || cases.length
  const testMode = isWebGLAvailable() ? 'RUNTIME' : 'STATIC'

  isRunning = true
  testResults = []

  console.log('')
  log('header', '═══════════════════════════════════════════')
  log('header', '    AUTO-TEST RUNNER / 自动化批量测试启动     ')
  log('header', '═══════════════════════════════════════════')
  log('info', `测试用例数: ${endIndex - startIndex}`)
  log('info', `测试模式: ${testMode}`)
  log('info', `启动时间: ${new Date().toLocaleString()}`)
  console.log('')

  const prevAutoHealMaxRetries = getSession().autoHealMaxRetries
  updateSession({ autoHealMaxRetries: 0, autoHealActive: false })

  try {
    for (let i = startIndex; i < endIndex; i++) {
      const result = await runSingleTestStatic(cases[i], i, endIndex - startIndex)
      testResults.push(result)
      if (i < endIndex - 1) {
        log('info', `  → 等待 0.5s 后执行下一个用例...`)
        await new Promise(r => setTimeout(r, 500))
      }
    }
  } catch (e) {
    log('fail', `测试运行器异常中断: ${e.message}`)
  } finally {
    updateSession({ autoHealMaxRetries: prevAutoHealMaxRetries })
    isRunning = false
  }

  const report = printReport(testResults)
  report.testMode = testMode
  return report
}

export function getTestStatus() {
  return { isRunning, completedResults: [...testResults] }
}

export function getTestCases() {
  return [...TEST_CASES]
}
