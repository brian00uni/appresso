// 스마트에디터 ONE — content script (blog.naver.com, all_frames)
// 역할:
//  1) WS_COORDS: 제목/본문 요소의 "최상위 뷰포트 절대 좌표"를 계산해 반환 (CDP 클릭용)
//  2) WS_FILL  : DOM 기반 폴백 입력 (CDP 실패 시)
// 에디터가 있는 프레임만 응답한다.

(() => {
  const TITLE_SEL = '.se-documentTitle .se-text-paragraph, .se-title-text .se-text-paragraph'
  const BODY_SEL = '.se-component.se-text .se-text-paragraph'
  const hasEditor = () => !!document.querySelector('.se-documentTitle')

  // 요소 중심의 좌표를 최상위 윈도우 뷰포트 기준으로 환산 (iframe 오프셋 누적)
  function absCoords(el) {
    el.scrollIntoView({ block: 'center' })
    const r = el.getBoundingClientRect()
    let x = r.left + r.width / 2
    let y = r.top + Math.min(18, r.height / 2) // 문단 상단 근처 클릭
    let win = window
    try {
      while (win !== win.parent && win.frameElement) {
        const fr = win.frameElement.getBoundingClientRect()
        x += fr.left
        y += fr.top
        win = win.parent
      }
    } catch (e) {}
    return { x: Math.round(x), y: Math.round(y) }
  }

  function getCoords() {
    const t = document.querySelector(TITLE_SEL)
    const b = document.querySelector(BODY_SEL)
    if (!t || !b) return null
    // 본문 좌표를 먼저(스크롤 영향 최소화) 계산 순서 신경: 제목→본문 각각 계산
    const title = absCoords(t)
    const body = absCoords(b)
    return { title, body }
  }

  // ── DOM 폴백 입력 (best-effort) ──
  function realFocus(el) {
    const r = el.getBoundingClientRect()
    const o = { bubbles: true, cancelable: true, view: window, button: 0, clientX: r.left + r.width / 2, clientY: r.top + 12 }
    try { el.dispatchEvent(new PointerEvent('pointerdown', o)) } catch (e) {}
    el.dispatchEvent(new MouseEvent('mousedown', o))
    try { el.dispatchEvent(new PointerEvent('pointerup', o)) } catch (e) {}
    el.dispatchEvent(new MouseEvent('mouseup', o))
    el.dispatchEvent(new MouseEvent('click', o))
    if (el.focus) el.focus()
  }
  function domFill(content) {
    const title = content.title || ''
    const paras = content.paragraphs && content.paragraphs.length ? content.paragraphs : ['']
    const t = document.querySelector(TITLE_SEL)
    const b = document.querySelector(BODY_SEL)
    if (!t || !b) return { ok: false, error: '제목/본문 요소를 찾지 못했어요.' }
    realFocus(t)
    document.execCommand('insertText', false, title)
    realFocus(b)
    document.execCommand('insertText', false, paras.join('\n'))
    return { ok: true, via: 'dom' }
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (!msg) return false
    if (msg.type === 'WS_COORDS') {
      if (!hasEditor()) return false // 에디터 프레임만 응답
      const c = getCoords()
      sendResponse(c ? { ok: true, coords: c } : { ok: false, error: '제목/본문 요소를 찾지 못했어요.' })
      return true
    }
    if (msg.type === 'WS_FILL') {
      if (!hasEditor()) return false
      try { sendResponse(domFill(msg.content)) } catch (e) { sendResponse({ ok: false, error: String(e && e.message || e) }) }
      return true
    }
    return false
  })
})()
