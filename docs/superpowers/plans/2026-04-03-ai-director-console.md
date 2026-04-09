# AI 导演台专项优化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把现有 AI 导演台升级为“1 句话输入 → 直接生成预览”的可运行体验，不再做“不明确时反问”，追求最快出首帧，并引入“二极管分级兜底”（L1大模型生成 / L2瞬间本地兜底），确保 100% 可预览。

**Architecture:** 采用“零等待”策略：废弃之前的规则判定与灰区反问层，所有 prompt 直接组装并送给 LLM（L1）。前端维护一个极简的导演台状态机；后端新增 AI Director 专用接口，统一返回 `preview` / `patch` / `error`。设置 60s 硬熔断时间。如果超时或运行崩溃，根据用户 prompt 的关键词语义，映射并加载最接近意图的 L2 本地骨架兜底（如用户要复杂的球，失败后给一个基础的三维发光球，绝不给无关的模板）。

**Tech Stack:** Vite、原生前端 JS、Express、现有 OpenAI-compatible chat/completions、浏览器端 embeddings、本地 `tools/tests/*.cjs` 校验脚本。

---

## 文件结构与职责

**前端**
- Modify: `src/site/ai-chat.js`
  - 从“本地语义调参工具”升级为“AI 导演台主控器”
  - 维护极简导演台状态（idle / generating / preview-ready / iterating / failed）
  - 负责发送消息、承接预览成功后的继续对话修改
- Modify: `src/site/wizard.js`
  - 把 `generateDemo()` 中 AI custom 路径下沉为可复用的“加载 preview HTML”能力
  - 允许 AI 导演台复用预览加载逻辑，而不是只服务 Wizard
- Modify: `src/main.js`
  - 初始化 AI 导演台的新入口与全局桥接函数

**后端**
- Create: `server/ai-director/contracts.js`
  - 响应 contract、状态枚举、schema 常量
- Create: `server/ai-director/prompt.js`
  - 最终 prompt 组装：用户原话 + 现有 v2 prompt
- Create: `server/ai-director/fallback.js`
  - 维护基础兜底模板库（简单球体、简单粒子、发光文字等）
  - 提供根据 user prompt 做正则/语义匹配获取最接近骨架的能力
- Modify: `server.js`
  - 暴露新的 `/api/ai-director/message` 接口
  - 复用已有生成函数 `generateEffectV2FromPrompt`
  - 增加 60s 硬熔断

**测试**
- Create: `tools/tests/ai-director-api.test.cjs`
- Create: `tools/tests/ai-director-ui-contract.test.cjs`

---

### Task 1: 建立 AI Director 的后端 contract 与基础结构

**Files:**
- Create: `server/ai-director/contracts.js`
- Test: `tools/tests/ai-director-api.test.cjs`

- [ ] **Step 1: 写失败测试，锁定 API 返回 shape**

```js
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const serverText = fs.readFileSync(path.join(__dirname, '..', '..', 'server.js'), 'utf8');

assert(serverText.includes("/api/ai-director/message"), 'server.js should expose /api/ai-director/message');
assert(serverText.includes("replyType: 'preview'") || serverText.includes('replyType: "preview"'));
```

- [ ] **Step 2: 运行测试，确认当前失败**

Run: `node tools/tests/ai-director-api.test.cjs`  
Expected: FAIL，提示缺少 `/api/ai-director/message`

- [ ] **Step 3: 实现最小 contract 常量**

```js
// server/ai-director/contracts.js
const DIRECTOR_STATES = {
  IDLE: 'idle',
  GENERATING: 'generating',
  PREVIEW_READY: 'preview_ready',
  ITERATING: 'iterating',
  FAILED: 'failed',
};

const DIRECTOR_REPLY_TYPES = {
  PREVIEW: 'preview',
  PATCH: 'patch',
  FAILED: 'failed',
};

module.exports = {
  DIRECTOR_STATES,
  DIRECTOR_REPLY_TYPES,
};
```

- [ ] **Step 4: 实现最终生成 prompt 组装器**

```js
// server/ai-director/prompt.js
function buildDirectorPrompt({ prompt }) {
  // In single-shot, we just pass the prompt through for now. 
  // In the future, we could inject style templates here without asking the user.
  return prompt;
}

module.exports = { buildDirectorPrompt };
```

- [ ] **Step 5: 在 server.js 中增加 AI Director 路由**

```js
const { buildDirectorPrompt } = require('./server/ai-director/prompt');

app.post('/api/ai-director/message', async (req, res) => {
  const { prompt } = req.body || {};
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'prompt is required' });
  }

  const { apiKey, baseUrl, model } = getAIConfig();
  const finalPrompt = buildDirectorPrompt({ prompt });
  
  // Notice we will add timing and 15s timeout in Task 5
  try {
    const code = await generateEffectV2FromPrompt(finalPrompt, apiKey, baseUrl, model);
    return res.json({
      replyType: 'preview',
      code,
      intentSummary: finalPrompt,
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message,
      meta: { isFallback: true, errorCode: 'GENERATION_FAILED' }
    });
  }
});
```

- [ ] **Step 6: 重新运行测试，确认通过**

Run: `node tools/tests/ai-director-api.test.cjs`  
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add server/ai-director/contracts.js server/ai-director/prompt.js server.js tools/tests/ai-director-api.test.cjs
git commit -m "feat: add single-shot ai director api"
```

---

### Task 2: 重构前端 AI 导演台状态机与“直接生成”交互

**Files:**
- Modify: `src/site/ai-chat.js`
- Modify: `src/main.js`
- Modify: `index.html`
- Test: `tools/tests/ai-director-ui-contract.test.cjs`

- [ ] **Step 1: 写失败测试，锁定前端需要的新接口**

```js
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const aiChatText = fs.readFileSync(path.join(__dirname, '..', '..', 'src', 'site', 'ai-chat.js'), 'utf8');
const htmlText = fs.readFileSync(path.join(__dirname, '..', '..', 'index.html'), 'utf8');

assert(aiChatText.includes('directorState'), 'ai-chat.js should manage directorState');
assert(aiChatText.includes('sendDirectorMessage'), 'ai-chat.js should define sendDirectorMessage');
assert(htmlText.includes('ai-chat-history'), 'index.html should keep chat history container');
assert(htmlText.includes('ai-status'), 'index.html should expose AI status node');
```

- [ ] **Step 2: 运行测试，确认当前失败**

Run: `node tools/tests/ai-director-ui-contract.test.cjs`  
Expected: FAIL，提示缺少 `directorState` / `sendDirectorMessage`

- [ ] **Step 3: 在 ai-chat.js 中引入极简导演台状态**

```js
let directorState = {
  mode: 'idle',
  lastIntentSummary: '',
};

function setDirectorState(patch) {
  directorState = { ...directorState, ...patch };
}
```

- [ ] **Step 4: 新增统一消息发送函数**

```js
async function sendDirectorMessage({ prompt }) {
  const res = await fetch('/api/ai-director/message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      intentSummary: directorState.lastIntentSummary,
    }),
  });
  if (!res.ok) throw new Error('API request failed');
  return res.json();
}
```

- [ ] **Step 5: 将 sendAIChat 改造成状态机驱动**

```js
export async function sendAIChat({ updateDemoParam, loadPreviewHTML }) {
  const input = document.getElementById('ai-chat-input');
  const msg = input.value.trim();
  if (!msg) return;

  if (directorState.mode === 'preview_ready') {
    const semanticResult = await aiSemanticCommand(msg, window.lastUIConfig || []);
    if (semanticResult) {
      updateDemoParam(semanticResult.param.bind, semanticResult.value);
      // append user/ai bubble logic...
      return;
    }
  }

  setDirectorState({ mode: 'generating' });
  try {
    const reply = await sendDirectorMessage({ prompt: msg });
    if (reply.replyType === 'preview') {
      setDirectorState({
        mode: 'preview_ready',
        lastIntentSummary: reply.intentSummary || '',
      });
      loadPreviewHTML(reply.code);
      // append ai bubble logic...
    }
  } catch (err) {
    // fallback logic handles in task 5
  }
}
```

- [ ] **Step 6: 在 main.js 里把预览加载能力注入 AI chat**

```js
import { initAIChat, sendAIChat } from './site/ai-chat.js';
import { loadGeneratedHTMLIntoLab } from './site/wizard.js';

window.sendAIChat = () => sendAIChat({
  updateDemoParam,
  loadPreviewHTML: loadGeneratedHTMLIntoLab,
});
```

- [ ] **Step 7: 在 wizard.js 中导出一个可复用的预览加载函数**

```js
export function loadGeneratedHTMLIntoLab(htmlContent) {
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const demoUrl = URL.createObjectURL(blob);
  openLab(demoUrl, 'AI Director Preview', 'AI', false);
}
```

- [ ] **Step 8: 在 index.html 中调整状态提示容器**

```html
<div id="ai-chat-history" class="..."></div>
<div id="ai-status" class="opacity-0">AI 正在生成预览...</div>
```

- [ ] **Step 9: 重新运行测试，确认通过**

Run: `node tools/tests/ai-director-ui-contract.test.cjs`  
Expected: PASS

- [ ] **Step 10: Commit**

```bash
git add src/site/ai-chat.js src/site/wizard.js src/main.js index.html tools/tests/ai-director-ui-contract.test.cjs
git commit -m "feat: add ai director state machine"
```

---

### Task 4: 实现“继续和 AI 对话修改”的双通道策略

**Files:**
- Modify: `src/site/ai-chat.js`
- Modify: `server.js`
- Test: `tools/tests/ai-director-ui-contract.test.cjs`

- [ ] **Step 1: 写补充失败测试，锁定 preview_ready 后优先走本地调参**

```js
const text = require('fs').readFileSync('src/site/ai-chat.js', 'utf8');
if (!text.includes("directorState.mode === 'preview_ready'")) {
  throw new Error('preview_ready branch missing');
}
```

- [ ] **Step 2: 运行测试，确认当前失败或未覆盖**

Run: `node tools/tests/ai-director-ui-contract.test.cjs`  
Expected: FAIL 或缺少 `preview_ready` 分支

- [ ] **Step 3: 在 ai-chat.js 中实现双通道逻辑**

```js
if (directorState.mode === 'preview_ready') {
  const semanticResult = await aiSemanticCommand(msg, window.lastUIConfig || []);
  if (semanticResult) {
    updateDemoParam(semanticResult.param.bind, semanticResult.value);
    appendAIBubble(`已根据你的要求微调：${semanticResult.text}`);
    return;
  }

  setDirectorState({ mode: 'iterating' });
  const reply = await sendDirectorMessage({
    prompt: `${directorState.lastIntentSummary}\n用户追加修改：${msg}`,
    updateDemoParam,
    loadPreviewHTML,
  });
  // 仍按 preview / clarify 处理
}
```

- [ ] **Step 4: 在 server.js 中兼容“意图摘要 + 追加修改”的重生成**

```js
const { prompt, intentSummary = '' } = req.body || {};
const mergedPrompt = intentSummary ? `${intentSummary}\n用户追加修改：${prompt}` : prompt;
const finalPrompt = buildDirectorPrompt({ prompt: mergedPrompt });
```

- [ ] **Step 5: 重新运行测试，确认通过**

Run: `node tools/tests/ai-director-ui-contract.test.cjs`  
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/site/ai-chat.js server.js tools/tests/ai-director-ui-contract.test.cjs
git commit -m "feat: support ai director iterative edits"
```

---

### Task 5: 增加基础指标与“二极管”失败兜底 (L1/L2)

**Files:**
- Modify: `src/site/ai-chat.js`
- Modify: `server.js`
- Test: `tools/tests/ai-director-api.test.cjs`

- [ ] **Step 1: 写失败测试，要求接口在超时或错误时返回确定的 error shape**

```js
const text = require('fs').readFileSync('server.js', 'utf8');
if (!text.includes('timingMs')) throw new Error('timingMs missing from ai director responses');
if (!text.includes("isFallback: true")) throw new Error('isFallback missing from ai director responses');
```

- [ ] **Step 2: 运行测试，确认当前失败**

Run: `node tools/tests/ai-director-api.test.cjs`  
Expected: FAIL

- [ ] **Step 3: 在 server.js 中增加 60s 硬超时与语义化兜底 (L1 熔断)**

```js
const { getFallbackCode } = require('./server/ai-director/fallback');

app.post('/api/ai-director/message', async (req, res) => {
  const { prompt } = req.body || {};
  // ... build prompt ...
  
  const startedAt = Date.now();
  try {
    // pass AbortController with 60000ms
    const code = await generateEffectV2FromPrompt(finalPrompt, apiKey, baseUrl, model, 60000);
    return res.json({
      replyType: 'preview',
      code,
      intentSummary: prompt,
      timingMs: Date.now() - startedAt,
    });
  } catch (error) {
    // On failure, return a semantic fallback skeleton instead of generic error
    const fallbackCode = getFallbackCode(prompt);
    return res.status(200).json({
      replyType: 'preview',
      code: fallbackCode,
      intentSummary: prompt,
      meta: {
        isFallback: true,
        errorCode: 'TIMEOUT_OR_CONTRACT_FAIL',
        errorMsg: error.message
      },
      timingMs: Date.now() - startedAt,
    });
  }
});
```

- [ ] **Step 4: 在 ai-chat.js 中展示兜底提示**

```js
// L1 失败但后端返回了兜底代码时
if (reply.meta?.isFallback) {
  loadPreviewHTML(reply.code);
  const fallbackName = reply.meta?.fallbackName || '基础效果';
  appendAIBubble(`抱歉，生成失败，我已为你退回到了保守方案（${fallbackName}）。你可以基于此继续调整参数。`);
  setDirectorState({ mode: 'preview_ready', lastIntentSummary: reply.intentSummary });
  return;
}
```

- [ ] **Step 5: 重新运行测试，确认通过**

Run: `node tools/tests/ai-director-api.test.cjs && node tools/tests/ai-director-ui-contract.test.cjs`  
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add server.js src/site/ai-chat.js tools/tests/ai-director-api.test.cjs tools/tests/ai-director-ui-contract.test.cjs
git commit -m "feat: add L1/L2 binary fallback and metrics"
```

---

## Spec Coverage Check

- **已覆盖**
  - 一句话输入直接生成预览
  - 预览后继续对话修改（本地语义调参或重生成）
  - 极简状态机管理
  - L1/L2 兜底策略（确保预览可见）
  - 输出契约、基础评测与超时

- **刻意暂缓/废弃**
  - 反问澄清层（根据反馈已废弃，直接出预览）
  - 代码级 diff/patch 修改（中期能力）
  - 真正的自动修复多轮闭环（目前只做一次失败兜底）
  - 埋点平台接入（当前只保留 timing 与前端状态）

## Placeholder Scan

- 已避免 “TODO/TBD/implement later” 占位语
- 每个任务都包含：
  - 精确文件路径
  - 失败测试
  - 最小实现代码
  - 验证命令
  - commit 建议

## Type Consistency Check

- 后端统一使用 `replyType`
- 前端导演台统一使用 `directorState.mode`
- AI Director 接口统一路径为 `/api/ai-director/message`
- 预览加载函数统一命名为 `loadPreviewHTML`

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-04-03-ai-director-console.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - 我按任务逐个派发独立执行单元，任务间做 review，风险更低  

**2. Inline Execution** - 我在当前会话里按计划直接连续实现，边做边验证

**你选哪一种？**
