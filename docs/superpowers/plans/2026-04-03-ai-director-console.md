# AI 导演台专项优化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把现有 AI 导演台升级为“1 句话输入 → 只在不明确时反问 → 生成预览 → 继续对话修改”的可运行体验，并保留现有 `game.js` 导出链路。

**Architecture:** 采用方案 C：先走低成本规则判定是否需要澄清，只有灰区请求再调用 LLM 做澄清判定。前端维护一个轻量导演台状态机；后端新增 AI Director 专用接口，统一返回 `clarify` / `preview` / `patch` 三类响应。参数可映射的修改优先走本地调参，结构性修改则触发重生成。

**Tech Stack:** Vite、原生前端 JS、Express、现有 OpenAI-compatible chat/completions、浏览器端 embeddings、本地 `tools/tests/*.cjs` 校验脚本。

---

## 文件结构与职责

**前端**
- Modify: `src/site/ai-chat.js`
  - 从“本地语义调参工具”升级为“AI 导演台主控器”
  - 维护导演台状态（idle / clarify / generating / preview-ready / iterating / failed）
  - 负责发送消息、渲染反问、承接预览成功后的继续对话修改
- Modify: `src/site/wizard.js`
  - 把 `generateDemo()` 中 AI custom 路径下沉为可复用的“加载 preview HTML”能力
  - 允许 AI 导演台复用预览加载逻辑，而不是只服务 Wizard
- Modify: `src/main.js`
  - 初始化 AI 导演台的新入口与全局桥接函数
- Modify: `index.html`
  - 调整 AI 导演台输入区和历史区，支持反问卡片与状态提示

**后端**
- Create: `server/ai-director/contracts.js`
  - 响应 contract、状态枚举、schema 常量
- Create: `server/ai-director/rules.js`
  - 低成本规则判定：明确 / 明显缺失 / 灰区
- Create: `server/ai-director/clarify.js`
  - 灰区 LLM 澄清判定与问题生成
- Create: `server/ai-director/prompt.js`
  - 最终 prompt 组装：用户原话 + 澄清回答 + 默认假设 + 现有 v2 prompt
- Modify: `server.js`
  - 暴露新的 `/api/ai-director/message` 接口
  - 复用已有生成函数 `generateEffectV2FromPrompt`

**测试**
- Create: `tools/tests/ai-director-rules.test.cjs`
- Create: `tools/tests/ai-director-api.test.cjs`
- Create: `tools/tests/ai-director-ui-contract.test.cjs`

---

### Task 1: 建立 AI Director 的后端 contract 与规则判定

**Files:**
- Create: `server/ai-director/contracts.js`
- Create: `server/ai-director/rules.js`
- Test: `tools/tests/ai-director-rules.test.cjs`

- [ ] **Step 1: 写失败测试，锁定规则判定行为**

```js
const assert = require('assert');
const { analyzePrompt } = require('../../server/ai-director/rules');

const clearPrompt = analyzePrompt('做一个赛博朋克风的发光粒子文字，透明背景，可循环播放');
assert.equal(clearPrompt.decision, 'generate');

const vaguePrompt = analyzePrompt('做个酷炫特效');
assert.equal(vaguePrompt.decision, 'clarify');
assert(vaguePrompt.missingSlots.includes('subject'));

const grayPrompt = analyzePrompt('做一个有电影感的粒子效果');
assert.equal(grayPrompt.decision, 'gray');
```

- [ ] **Step 2: 运行测试，确认当前失败**

Run: `node tools/tests/ai-director-rules.test.cjs`  
Expected: FAIL，报错 `Cannot find module '../../server/ai-director/rules'`

- [ ] **Step 3: 实现最小 contract 常量**

```js
// server/ai-director/contracts.js
const DIRECTOR_STATES = {
  IDLE: 'idle',
  CLARIFY: 'clarify',
  GENERATING: 'generating',
  PREVIEW_READY: 'preview_ready',
  ITERATING: 'iterating',
  FAILED: 'failed',
};

const DIRECTOR_REPLY_TYPES = {
  CLARIFY: 'clarify',
  PREVIEW: 'preview',
  PATCH: 'patch',
  FAILED: 'failed',
};

module.exports = {
  DIRECTOR_STATES,
  DIRECTOR_REPLY_TYPES,
};
```

- [ ] **Step 4: 实现最小规则判定器**

```js
// server/ai-director/rules.js
const SUBJECT_HINTS = ['文字', '粒子', '线条', '光束', 'glitch', 'text', 'particle'];
const STYLE_HINTS = ['赛博', 'cyber', 'glitch', '极简', 'minimal', 'toon', '电影感'];
const BG_HINTS = ['透明', '黑底', '叠加', 'transparent'];

function hasAny(text, words) {
  return words.some((w) => text.includes(w));
}

function analyzePrompt(prompt) {
  const text = String(prompt || '').toLowerCase().trim();
  const missingSlots = [];

  if (!hasAny(text, SUBJECT_HINTS)) missingSlots.push('subject');
  if (!hasAny(text, STYLE_HINTS)) missingSlots.push('style');

  if (missingSlots.length >= 2) {
    return { decision: 'clarify', missingSlots, riskFlags: [] };
  }

  if (missingSlots.length === 0 && hasAny(text, BG_HINTS)) {
    return { decision: 'generate', missingSlots: [], riskFlags: [] };
  }

  if (missingSlots.length === 0) {
    return { decision: 'generate', missingSlots: [], riskFlags: ['background_unspecified'] };
  }

  return { decision: 'gray', missingSlots, riskFlags: [] };
}

module.exports = { analyzePrompt };
```

- [ ] **Step 5: 重新运行测试，确认通过**

Run: `node tools/tests/ai-director-rules.test.cjs`  
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add server/ai-director/contracts.js server/ai-director/rules.js tools/tests/ai-director-rules.test.cjs
git commit -m "feat: add ai director rules engine"
```

---

### Task 2: 新增 AI Director 后端消息接口与灰区澄清判定

**Files:**
- Create: `server/ai-director/clarify.js`
- Create: `server/ai-director/prompt.js`
- Modify: `server.js`
- Test: `tools/tests/ai-director-api.test.cjs`

- [ ] **Step 1: 写失败测试，锁定 API 返回 shape**

```js
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const serverText = fs.readFileSync(path.join(__dirname, '..', '..', 'server.js'), 'utf8');

assert(serverText.includes("/api/ai-director/message"), 'server.js should expose /api/ai-director/message');
assert(serverText.includes("replyType: 'clarify'") || serverText.includes('replyType: "clarify"'));
assert(serverText.includes("replyType: 'preview'") || serverText.includes('replyType: "preview"'));
```

- [ ] **Step 2: 运行测试，确认当前失败**

Run: `node tools/tests/ai-director-api.test.cjs`  
Expected: FAIL，提示缺少 `/api/ai-director/message`

- [ ] **Step 3: 实现灰区澄清判定器**

```js
// server/ai-director/clarify.js
async function clarifyWithLLM({ prompt, apiKey, baseUrl, model, missingSlots = [] }) {
  const system = [
    '你是 AI 导演台的澄清判定器。',
    '只在用户信息不明确时提问。',
    '输出 JSON：need_clarify/questions/assumptions_if_no_answer/confidence。',
    'questions 最多 3 个，并尽量给出选项。',
  ].join('\n');

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: JSON.stringify({ prompt, missingSlots }) },
      ],
    }),
  });

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content || '{}';
  return JSON.parse(text);
}

module.exports = { clarifyWithLLM };
```

- [ ] **Step 4: 实现最终生成 prompt 组装器**

```js
// server/ai-director/prompt.js
function buildDirectorPrompt({ prompt, clarifyAnswers = [], assumptions = [] }) {
  const answerText = clarifyAnswers.length ? `\n澄清答案：\n- ${clarifyAnswers.join('\n- ')}` : '';
  const assumptionsText = assumptions.length ? `\n默认假设：\n- ${assumptions.join('\n- ')}` : '';
  return `${prompt}${answerText}${assumptionsText}`;
}

module.exports = { buildDirectorPrompt };
```

- [ ] **Step 5: 在 server.js 中增加 AI Director 路由**

```js
const { analyzePrompt } = require('./server/ai-director/rules');
const { clarifyWithLLM } = require('./server/ai-director/clarify');
const { buildDirectorPrompt } = require('./server/ai-director/prompt');

app.post('/api/ai-director/message', async (req, res) => {
  const { prompt, clarifyAnswers = [] } = req.body || {};
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'prompt is required' });
  }

  const { apiKey, baseUrl, model } = getAIConfig();
  const ruleResult = analyzePrompt(prompt);

  if (ruleResult.decision === 'clarify') {
    return res.json({
      replyType: 'clarify',
      questions: ruleResult.missingSlots.map((slot) => ({ id: slot, question: `请补充 ${slot}` })),
      assumptions: [],
    });
  }

  if (ruleResult.decision === 'gray') {
    const clarify = await clarifyWithLLM({
      prompt,
      apiKey,
      baseUrl,
      model,
      missingSlots: ruleResult.missingSlots,
    });
    if (clarify.need_clarify) {
      return res.json({
        replyType: 'clarify',
        questions: clarify.questions || [],
        assumptions: clarify.assumptions_if_no_answer || [],
      });
    }
  }

  const finalPrompt = buildDirectorPrompt({ prompt, clarifyAnswers });
  const code = await generateEffectV2FromPrompt(finalPrompt, apiKey, baseUrl, model);
  return res.json({
    replyType: 'preview',
    code,
    intentSummary: finalPrompt,
    assumptions: [],
  });
});
```

- [ ] **Step 6: 重新运行测试，确认通过**

Run: `node tools/tests/ai-director-api.test.cjs`  
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add server/ai-director/clarify.js server/ai-director/prompt.js server.js tools/tests/ai-director-api.test.cjs
git commit -m "feat: add ai director message api"
```

---

### Task 3: 重构前端 AI 导演台状态机与“反问后生成”交互

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

- [ ] **Step 3: 在 ai-chat.js 中引入导演台状态**

```js
let directorState = {
  mode: 'idle',
  pendingQuestions: [],
  clarifyAnswers: [],
  lastIntentSummary: '',
  lastAssumptions: [],
};

function setDirectorState(patch) {
  directorState = { ...directorState, ...patch };
}
```

- [ ] **Step 4: 新增统一消息发送函数**

```js
async function sendDirectorMessage({ prompt, updateDemoParam, loadPreviewHTML }) {
  const res = await fetch('/api/ai-director/message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      clarifyAnswers: directorState.clarifyAnswers,
      intentSummary: directorState.lastIntentSummary,
    }),
  });
  return res.json();
}
```

- [ ] **Step 5: 将 sendAIChat 改造成状态机驱动**

```js
export async function sendAIChat({ updateDemoParam, loadPreviewHTML }) {
  const msg = input.value.trim();
  if (!msg) return;

  if (directorState.mode === 'preview_ready') {
    const semanticResult = await aiSemanticCommand(msg, window.lastUIConfig || []);
    if (semanticResult) {
      updateDemoParam(semanticResult.param.bind, semanticResult.value);
      appendAIBubble(semanticResult.text);
      return;
    }
  }

  setDirectorState({ mode: 'generating' });
  const reply = await sendDirectorMessage({ prompt: msg, updateDemoParam, loadPreviewHTML });

  if (reply.replyType === 'clarify') {
    setDirectorState({ mode: 'clarify', pendingQuestions: reply.questions || [] });
    renderClarifyQuestions(reply.questions || []);
    return;
  }

  if (reply.replyType === 'preview') {
    setDirectorState({
      mode: 'preview_ready',
      pendingQuestions: [],
      lastIntentSummary: reply.intentSummary || '',
      lastAssumptions: reply.assumptions || [],
    });
    loadPreviewHTML(reply.code);
    appendAIBubble('已为你生成首版预览，可以继续让我修改。');
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

- [ ] **Step 8: 在 index.html 中为反问卡片预留容器**

```html
<div id="ai-chat-history" class="..."></div>
<div id="ai-clarify-panel" class="hidden"></div>
<div id="ai-status" class="opacity-0">AI 正在待命</div>
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
const { prompt, clarifyAnswers = [], intentSummary = '' } = req.body || {};
const mergedPrompt = intentSummary ? `${intentSummary}\n用户追加修改：${prompt}` : prompt;
const finalPrompt = buildDirectorPrompt({ prompt: mergedPrompt, clarifyAnswers });
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

### Task 5: 增加基础指标与失败兜底

**Files:**
- Modify: `src/site/ai-chat.js`
- Modify: `server.js`
- Test: `tools/tests/ai-director-api.test.cjs`

- [ ] **Step 1: 写失败测试，要求接口返回 replyType 与 timing**

```js
const text = require('fs').readFileSync('server.js', 'utf8');
if (!text.includes('timingMs')) throw new Error('timingMs missing from ai director responses');
```

- [ ] **Step 2: 运行测试，确认当前失败**

Run: `node tools/tests/ai-director-api.test.cjs`  
Expected: FAIL，提示缺少 `timingMs`

- [ ] **Step 3: 在 server.js 中增加 timing 与错误友好化**

```js
const startedAt = Date.now();
try {
  // existing logic...
  return res.json({
    replyType: 'preview',
    code,
    intentSummary: finalPrompt,
    assumptions: [],
    timingMs: Date.now() - startedAt,
  });
} catch (error) {
  return res.status(500).json({
    replyType: 'failed',
    error: error.message,
    nextAction: '请补充风格、主体或改用更简单的表达再试一次',
    timingMs: Date.now() - startedAt,
  });
}
```

- [ ] **Step 4: 在 ai-chat.js 中展示失败兜底文案**

```js
if (reply.replyType === 'failed') {
  setDirectorState({ mode: 'failed' });
  appendAIBubble(reply.nextAction || '生成失败，请重试');
  return;
}
```

- [ ] **Step 5: 重新运行测试，确认通过**

Run: `node tools/tests/ai-director-api.test.cjs && node tools/tests/ai-director-ui-contract.test.cjs`  
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add server.js src/site/ai-chat.js tools/tests/ai-director-api.test.cjs tools/tests/ai-director-ui-contract.test.cjs
git commit -m "feat: add ai director fallback and metrics"
```

---

## Spec Coverage Check

- **已覆盖**
  - 一句话输入
  - 不明确才反问
  - 反问后生成预览
  - 预览后继续对话修改
  - 规则层 + LLM 灰区判定
  - 输出契约、失败兜底、基础评测

- **刻意暂缓**
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
