import { updateSession, getSession } from './session-store.js'

const CHANNEL = 'cupcut-lab'
const PROTOCOL_VERSION = 1

const ERROR_CAPTURE_SHIM = `(function(){
  if(window.__runtimeErrorCaptureLoaded) return;
  window.__runtimeErrorCaptureLoaded = true;
  window.addEventListener('error', function(e) {
    var msg = e.message || 'Unknown error';
    var stk = (e.error && e.error.stack) || '';
    parent.postMessage({
      channel: 'cupcut-lab',
      version: 1,
      type: 'RUNTIME_ERROR',
      payload: {
        errorMessage: msg,
        filename: e.filename || '',
        lineno: e.lineno || 0,
        colno: e.colno || 0,
        stackTrace: stk
      }
    }, '*');
  });
  window.addEventListener('unhandledrejection', function(e) {
    var r = e.reason;
    var msg = 'Unhandled Promise Rejection';
    var stk = '';
    if (r instanceof Error) {
      msg = r.message || msg;
      stk = r.stack || '';
    } else if (typeof r === 'string') {
      msg = r;
    } else {
      msg = String(r);
    }
    parent.postMessage({
      channel: 'cupcut-lab',
      version: 1,
      type: 'RUNTIME_ERROR',
      payload: {
        errorMessage: msg,
        filename: '',
        lineno: 0,
        colno: 0,
        stackTrace: stk
      }
    }, '*');
  });
  window.addEventListener('message', function(e) {
    var d = e.data;
    if (d && d.type === 'INJECT_TEST_ERROR') {
      setTimeout(function() {
        try { nonExistentFunction(); } catch(err) {
          window.dispatchEvent(new ErrorEvent('error', {
            message: err.message,
            filename: 'test-error-inject',
            lineno: 1,
            colno: 1,
            error: err
          }));
        }
      }, 100);
    }
  });
})();`

let iframeEl = null
let messageHandler = null
let sessionId = ''
let isLoading = false
let lastError = null

function generateSessionId() {
  return 'sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8)
}

function wrapEnvelope(type, payload) {
  const legacyFields =
    payload && typeof payload === 'object' && !Array.isArray(payload)
      ? Object.fromEntries(
          Object.entries(payload).filter(([key]) =>
            !['channel', 'version', 'sessionId', 'type', 'payload', 'timestamp'].includes(key)
          )
        )
      : {}
  return {
    ...legacyFields,
    channel: CHANNEL,
    version: PROTOCOL_VERSION,
    sessionId: sessionId,
    type: type,
    payload: payload,
    timestamp: Date.now(),
  }
}

function extractLegacyPayload(rawData) {
  const payload = { ...rawData }
  delete payload.type
  return payload
}

function normalizeMessage(rawData) {
  if (rawData && rawData.channel === CHANNEL && rawData.version === PROTOCOL_VERSION) {
    return rawData
  }
  if (rawData && rawData.type) {
    return {
      channel: CHANNEL,
      version: PROTOCOL_VERSION,
      sessionId: sessionId,
      type: rawData.type,
      payload: extractLegacyPayload(rawData),
      timestamp: Date.now(),
      _legacy: true,
    }
  }
  return null
}

export function initBridge(iframeElement, handlers) {
  iframeEl = iframeElement

  messageHandler = (event) => {
    const envelope = normalizeMessage(event.data)
    if (!envelope) return
    if (envelope.sessionId && sessionId && envelope.sessionId !== sessionId) return

    const type = envelope.type
    const payload = envelope.payload

    switch (type) {
      case 'UI_CONFIG':
        if (handlers.onUIConfig) handlers.onUIConfig(payload.config || payload)
        break
      case 'IMAGE_DATA':
        if (handlers.onImageData) handlers.onImageData(payload)
        break
      case 'REC_BLOB':
        if (handlers.onRecBlob) handlers.onRecBlob(payload)
        break
      case 'REC_STARTED':
        if (handlers.onRecStarted) handlers.onRecStarted(payload)
        break
      case 'REC_ERROR':
        if (handlers.onRecError) handlers.onRecError(payload)
        break
      case 'GAME_JS_SOURCE':
        if (handlers.onGameJSSource) handlers.onGameJSSource(payload)
        break
      case 'DEMO_ERROR':
      case 'RUNTIME_ERROR':
        lastError = payload
        updateSession({ lastError: payload, errorCount: getSession().errorCount + 1 })
        if (handlers.onDemoError) handlers.onDemoError(payload)
        break
      default:
        break
    }
  }

  window.addEventListener('message', messageHandler)
}

export function loadPreview(url) {
  if (!iframeEl) return
  sessionId = generateSessionId()
  isLoading = true
  lastError = null
  updateSession({ previewUrl: url, sessionId: sessionId, lastError: null, errorCount: 0 })

  iframeEl.onload = () => {
    isLoading = false
    const loader = document.getElementById('loader')
    if (loader) loader.classList.add('opacity-0')

    try {
      const doc = iframeEl.contentDocument
      const win = doc && doc.defaultView
      if (doc && win && !win.__runtimeErrorCaptureLoaded) {
        const errorShim = doc.createElement('script')
        errorShim.type = 'text/javascript'
        errorShim.text = ERROR_CAPTURE_SHIM
        doc.body.appendChild(errorShim)
      }
    } catch (_) {}

    setTimeout(() => {
      if (iframeEl.contentWindow) {
        iframeEl.contentWindow.postMessage(wrapEnvelope('HANDSHAKE', { sessionId: sessionId }), '*')
      }
    }, 300)

    setTimeout(() => {
      try {
        const doc = iframeEl.contentDocument
        const win = doc && doc.defaultView
        if (doc && win && !win.__capcutShimLoaded) {
          const shim = doc.createElement('script')
          shim.type = 'text/javascript'
          shim.text = "if(!window.__capcutShimLoaded){window.__capcutShimLoaded=true;var __recorder=null;var __chunks=[];window.addEventListener('message',function(e){var d=e.data;if(!d||!d.type)return;var canvas=document.querySelector('canvas');if(d.type==='SAVE_IMAGE'){if(canvas){try{var url=canvas.toDataURL('image/png');parent.postMessage({type:'IMAGE_DATA',dataUrl:url},'*');}catch(err){parent.postMessage({type:'REC_ERROR',message:'Screenshot failed'},'*');}}else{parent.postMessage({type:'REC_ERROR',message:'No canvas found'},'*');}}if(d.type==='START_REC'){if(canvas&&typeof MediaRecorder!=='undefined'){try{var stream=canvas.captureStream(30);var mt='video/mp4;codecs=h264';if(!MediaRecorder.isTypeSupported(mt)){mt='video/webm;codecs=vp9';if(!MediaRecorder.isTypeSupported(mt)){mt='video/webm;codecs=vp8';if(!MediaRecorder.isTypeSupported(mt)){mt='video/webm';if(!MediaRecorder.isTypeSupported(mt)){mt='video/mp4';}}}}try{__recorder=new MediaRecorder(stream,{mimeType:mt});}catch(_){__recorder=new MediaRecorder(stream);}__chunks=[];__recorder.ondataavailable=function(ev){if(ev.data.size>0)__chunks.push(ev.data);};__recorder.onstop=function(){var blob=new Blob(__chunks,{type:(__recorder.mimeType||'video/webm')});parent.postMessage({type:'REC_BLOB',blob:blob,mimeType:(__recorder.mimeType||'video/webm')},'*');};__recorder.start();parent.postMessage({type:'REC_STARTED'},'*');}catch(err){parent.postMessage({type:'REC_ERROR',message:'Recorder start failed'},'*');}}else{parent.postMessage({type:'REC_ERROR',message:'MediaRecorder not supported or no canvas'},'*');}}if(d.type==='STOP_REC'){if(__recorder&&__recorder.state!=='inactive'){__recorder.stop();}}});}"
          doc.body.appendChild(shim)
        }
      } catch (_) {}
    }, 1000)
  }

  iframeEl.src = url
}

export function sendMessage(type, payload) {
  if (!iframeEl || !iframeEl.contentWindow) return
  iframeEl.contentWindow.postMessage(wrapEnvelope(type, payload || {}), '*')
}

export function destroyBridge() {
  if (messageHandler) {
    window.removeEventListener('message', messageHandler)
    messageHandler = null
  }
  iframeEl = null
  sessionId = ''
  isLoading = false
  lastError = null
}

export function getBridgeState() {
  return { isLoading: isLoading, sessionId: sessionId, lastError: lastError }
}
