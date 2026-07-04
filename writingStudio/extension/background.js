// 아이콘 클릭 시 사이드패널 열기
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((e) => console.error('[WritingStudio]', e))

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function cdp(tabId, method, params) {
  return new Promise((res, rej) => {
    chrome.debugger.sendCommand({ tabId }, method, params || {}, (r) => {
      if (chrome.runtime.lastError) rej(new Error(chrome.runtime.lastError.message))
      else res(r)
    })
  })
}
function attach(tabId) {
  return new Promise((res, rej) =>
    chrome.debugger.attach({ tabId }, '1.3', () =>
      chrome.runtime.lastError ? rej(new Error(chrome.runtime.lastError.message)) : res()
    )
  )
}
function detach(tabId) {
  return new Promise((res) => chrome.debugger.detach({ tabId }, () => res()))
}

async function clickAt(tabId, x, y) {
  await cdp(tabId, 'Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 })
  await cdp(tabId, 'Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 })
}
async function pressEnter(tabId) {
  const k = { key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 }
  await cdp(tabId, 'Input.dispatchKeyEvent', { type: 'keyDown', ...k })
  await cdp(tabId, 'Input.dispatchKeyEvent', { type: 'keyUp', ...k })
}

// 신뢰된 입력(CDP)으로 제목·본문 채우기
async function cdpFill(tabId, coords, content) {
  await attach(tabId)
  try {
    // 제목
    await clickAt(tabId, coords.title.x, coords.title.y)
    await sleep(250)
    await cdp(tabId, 'Input.insertText', { text: content.title || '' })
    await sleep(350)

    // 본문
    await clickAt(tabId, coords.body.x, coords.body.y)
    await sleep(250)
    const paras = content.paragraphs && content.paragraphs.length ? content.paragraphs : ['']
    for (let i = 0; i < paras.length; i++) {
      if (i > 0) { await pressEnter(tabId); await sleep(80) }
      await cdp(tabId, 'Input.insertText', { text: paras[i] })
      await sleep(80)
    }
    return { ok: true, via: 'cdp' }
  } finally {
    await detach(tabId)
  }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === 'WS_CDP_FILL') {
    cdpFill(msg.tabId, msg.coords, msg.content)
      .then(sendResponse)
      .catch((e) => sendResponse({ ok: false, error: String((e && e.message) || e) }))
    return true // async
  }
  return false
})
