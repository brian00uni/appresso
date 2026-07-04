// Writing Studio 사이드패널 — Gemini 생성 + 네이버 로그인 체크 + 자동 채우기

const $ = (id) => document.getElementById(id)
const esc = (s) => String(s).replace(/[&<>]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]))
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const MODEL = 'gemini-2.5-flash'
const GEMINI_URL = (m, k) => `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${encodeURIComponent(k)}`

const SYSTEM = `너는 네이버 블로그 글을 쓰는 한국어 카피라이터다.
- 자연스럽고 정보성 있는 블로그 포스트를 쓴다.
- 과장·낚시성·AI 티 나는 표현은 피하고, 실제 경험처럼 구체적으로 쓴다.
- 문단은 3~7개, 각 문단은 2~4문장.
- 존댓말(~해요체)로 친근하게.`

const SCHEMA = {
  type: 'OBJECT',
  properties: {
    title: { type: 'STRING' },
    paragraphs: { type: 'ARRAY', items: { type: 'STRING' } },
    tags: { type: 'ARRAY', items: { type: 'STRING' } },
    imagePrompts: { type: 'ARRAY', items: { type: 'STRING' } },
  },
  required: ['title', 'paragraphs', 'tags', 'imagePrompts'],
  propertyOrdering: ['title', 'paragraphs', 'tags', 'imagePrompts'],
}

let apiKey = ''
let lastContent = null
let naverState = { loggedIn: false, blog: null }

// ── 저장소 ──
function load() {
  chrome.storage.local.get(['ws_apiKey', 'ws_content', 'ws_blogId'], (r) => {
    apiKey = r.ws_apiKey || ''
    lastContent = r.ws_content || null
    if (r.ws_blogId) $('blogId').value = r.ws_blogId
    renderKeyStatus()
    if (lastContent) { renderPreview(lastContent); $('refillRow').style.display = '' }
    refresh()
  })
}
function renderKeyStatus() {
  if (apiKey) {
    $('keyStatus').innerHTML = '<div class="ok">✅ API 키 저장됨</div>'
    $('keyWrap').classList.remove('show')
    $('keyCard').classList.remove('key-card-hi')
  } else {
    $('keyStatus').innerHTML = '<div class="warn">🔑 <b>먼저 Gemini API 키를 넣어주세요.</b> 무료로 발급받아 아래 칸에 붙여넣고 저장하면 돼요.</div>'
    $('keyWrap').classList.add('show')
    $('keyCard').classList.add('key-card-hi')
  }
}
$('toggleKey').onclick = () => $('keyWrap').classList.toggle('show')
$('issueKey').onclick = () => chrome.tabs.create({ url: 'https://aistudio.google.com/app/apikey' })
$('saveKey').onclick = () => {
  const v = $('apiKey').value.trim()
  if (!v) return alert('API 키를 입력하세요.')
  apiKey = v
  chrome.storage.local.set({ ws_apiKey: v }, () => { $('apiKey').value = ''; renderKeyStatus() })
}

$('prompt').placeholder = [
  '글에 꼭 넣고 싶은 내용이나 구성을 적어주세요. (비워도 됩니다)',
  '', '예)', '- 도입: 독자의 고민에 공감하며 시작', '- 본론: 핵심 방법 3가지 + 실제 예시', '- 마무리: 요약 + 실천 유도',
].join('\n')

// ── 네이버 로그인/블로그 감지 ──
async function detectNaver() {
  try {
    const r = await fetch('https://blog.naver.com/MyBlog.naver', { credentials: 'include', redirect: 'follow' })
    const url = r.url || ''
    if (url.includes('nid.naver.com')) return { loggedIn: false, blog: null }
    const m = url.match(/blog\.naver\.com\/([A-Za-z0-9_-]+)/)
    if (!m || m[1] === 'MyBlog.naver') return { loggedIn: false, blog: null }
    return { loggedIn: true, blog: m[1] }
  } catch (e) {
    return { loggedIn: false, blog: null, error: e.message }
  }
}
async function refresh() {
  $('s-login').innerHTML = '<span class="badge">확인 중…</span>'
  naverState = await detectNaver()
  if (naverState.loggedIn) {
    $('s-login').innerHTML = '<span class="badge on">로그인됨</span>'
    $('s-account').textContent = naverState.blog
    $('loginWarn').innerHTML = ''
    if (!$('blogId').value.trim()) $('blogId').value = naverState.blog
  } else {
    $('s-login').innerHTML = '<span class="badge off">로그인 안됨</span>'
    $('s-account').textContent = '—'
    $('loginWarn').innerHTML =
      '<div class="warn">네이버에 로그인되어 있지 않아요. 아래 버튼으로 로그인한 뒤 “새로고침”을 눌러주세요.</div>' +
      '<div class="row"><button class="btn-gold full" id="naverLoginBtn">네이버 로그인 열기</button></div>'
    const b = $('naverLoginBtn'); if (b) b.onclick = () => chrome.tabs.create({ url: 'https://nid.naver.com/nidlogin.login' })
  }
  updateMatch()
}
function updateMatch() {
  const target = $('blogId').value.trim()
  const acct = naverState && naverState.blog
  const m = $('s-match'); const msg = $('matchMsg')
  if (!target || !acct) { m.textContent = '—'; msg.innerHTML = ''; return }
  if (target === acct) { m.innerHTML = '<span class="badge on">일치 ✓</span>'; msg.innerHTML = '' }
  else {
    m.innerHTML = '<span class="badge off">불일치 ✕</span>'
    msg.innerHTML = '<div class="warn">로그인 계정(' + esc(acct) + ')과 대상 블로그(' + esc(target) +
      ')가 달라요. 네이버는 계정당 블로그 1개라, 대상 블로그를 소유한 계정으로 로그인해야 글이 써집니다.</div>'
  }
}
$('refreshBtn').onclick = refresh
$('blogId').oninput = () => { updateMatch(); chrome.storage.local.set({ ws_blogId: $('blogId').value.trim() }) }

// ── Gemini 생성 ──
function friendlyError(status, msg) {
  const low = (msg || '').toLowerCase()
  if (low.includes('api key not valid') || low.includes('api_key_invalid') || (status === 400 && low.includes('key')))
    return '🔑 API 키가 올바르지 않아요. 위 “변경”을 눌러 다시 저장해 주세요.'
  if (status === 429 || low.includes('resource_exhausted') || low.includes('quota') || low.includes('rate'))
    return '⏳ Gemini 무료 티어 한도에 도달했어요. 잠시 뒤(1분쯤) 다시 시도해 주세요.'
  if (low.includes('safety') || low.includes('blocked')) return '🚫 안전 필터에 걸렸어요. 표현을 조금 바꿔 보세요.'
  return '❌ 글 생성 실패: ' + (msg || '알 수 없는 오류').slice(0, 140)
}
async function generate() {
  if (!apiKey) throw new Error('🔑 먼저 Gemini API 키를 저장해 주세요.')
  const topic = $('topic').value.trim()
  if (!topic) throw new Error('주제를 입력하세요.')
  const userMsg =
    `주제: ${topic}\n키워드: ${$('keywords').value.trim() || '(없음)'}\n톤: ${$('tone').value}\n` +
    ($('prompt').value.trim() ? `\n[내용 가이드/구성 지시]\n${$('prompt').value.trim()}\n` : '') +
    `\n위 주제·키워드·내용 가이드를 반영해 네이버 블로그 포스트를 작성해줘.`
  let resp
  try {
    resp = await fetch(GEMINI_URL(MODEL, apiKey), {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents: [{ role: 'user', parts: [{ text: userMsg }] }],
        generationConfig: { responseMimeType: 'application/json', responseSchema: SCHEMA },
      }),
    })
  } catch (e) { throw new Error('🌐 네트워크 오류: ' + e.message) }
  if (!resp.ok) {
    let msg = ''; try { msg = (await resp.json())?.error?.message || '' } catch {}
    throw new Error(friendlyError(resp.status, msg))
  }
  const data = await resp.json()
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || ''
  if (!text) throw new Error(data?.promptFeedback?.blockReason ? '🚫 안전 필터에 걸렸어요. 표현을 바꿔 보세요.' : '결과가 비어 있어요. 다시 시도해 주세요.')
  return JSON.parse(text)
}
function renderPreview(c) {
  $('preview').innerHTML = '<div class="preview"><b>제목</b><br>' + esc(c.title) + '<br><br><b>본문</b><br>' +
    (c.paragraphs || []).map(esc).join('<br><br>') + '<br><br><b>태그</b> ' + esc((c.tags || []).map((t) => '#' + t).join(' ')) + '</div>'
}

// ── 에디터 자동 채우기 ──
function waitComplete(tabId) {
  return new Promise((res) => {
    const check = () => chrome.tabs.get(tabId, (t) => {
      if (chrome.runtime.lastError || !t) return res()
      if (t.status === 'complete') res(); else setTimeout(check, 400)
    })
    check()
  })
}
async function ensureWriteTab(blogId) {
  const writeRe = /blog\.naver\.com\/.*(Redirect=Write|PostWriteForm)/i
  const tabs = await chrome.tabs.query({ url: 'https://blog.naver.com/*' })
  let tab = tabs.find((t) => writeRe.test(t.url || ''))
  if (tab) return tab
  tab = await chrome.tabs.create({ url: `https://blog.naver.com/${blogId}?Redirect=Write` })
  await waitComplete(tab.id)
  await sleep(2500) // 에디터 초기화 여유
  return tab
}
async function getCoords(tabId) {
  for (let i = 0; i < 20; i++) {
    try {
      const res = await chrome.tabs.sendMessage(tabId, { type: 'WS_COORDS' })
      if (res && res.ok) return res.coords
    } catch (e) {}
    await sleep(700)
  }
  throw new Error('에디터가 아직 준비되지 않았어요. 글쓰기 페이지를 새로고침한 뒤 “다시 채우기”를 눌러주세요.')
}
async function fillFlow(content) {
  if (!naverState || !naverState.loggedIn) throw new Error('네이버에 로그인되어 있지 않아요. 연결 상태에서 로그인 후 새로고침해 주세요.')
  const blogId = $('blogId').value.trim() || naverState.blog
  if (!blogId) throw new Error('대상 블로그 ID를 입력해 주세요.')
  if (naverState.blog && blogId !== naverState.blog) throw new Error('로그인 계정과 대상 블로그가 달라요. 대상 블로그 계정으로 로그인해 주세요.')

  const tab = await ensureWriteTab(blogId)
  await chrome.tabs.update(tab.id, { active: true })
  await sleep(800)
  const coords = await getCoords(tab.id)

  // CDP(신뢰된 입력) 우선
  let res = null
  try { res = await chrome.runtime.sendMessage({ type: 'WS_CDP_FILL', tabId: tab.id, coords, content }) } catch (e) { res = { ok: false, error: e.message } }
  if (!res || !res.ok) {
    // DOM 폴백
    try { const dom = await chrome.tabs.sendMessage(tab.id, { type: 'WS_FILL', content }); if (dom && dom.ok) res = dom } catch (e) {}
  }
  if (!res || !res.ok) throw new Error((res && res.error) || '에디터 채우기에 실패했어요.')
  await chrome.tabs.update(tab.id, { active: true })
  return res
}

// ── 버튼 ──
$('runBtn').onclick = async () => {
  const btn = $('runBtn'); btn.disabled = true; btn.innerHTML = '<span class="spinner"></span>생성·채우는 중…'
  $('msg').innerHTML = ''
  try {
    const c = await generate()
    lastContent = c; chrome.storage.local.set({ ws_content: c }); renderPreview(c); $('refillRow').style.display = ''
    $('msg').innerHTML = '<div class="ok">✅ 생성 완료 — 글쓰기 페이지를 열고 채우는 중…</div>'
    await fillFlow(c)
    $('msg').innerHTML = '<div class="ok">✅ 에디터에 채웠어요. 열린 창에서 검수 후 직접 발행하세요.</div>'
  } catch (e) {
    $('msg').innerHTML = '<div class="warn">' + esc(e.message) + '</div>'
  } finally {
    btn.disabled = false; btn.innerHTML = '✨ 글 생성 → 에디터에 채우기'
  }
}
$('genBtn').onclick = async () => {
  const btn = $('genBtn'); btn.disabled = true; btn.innerHTML = '<span class="spinner"></span>생성 중…'
  $('msg').innerHTML = ''
  try {
    const c = await generate()
    lastContent = c; chrome.storage.local.set({ ws_content: c }); renderPreview(c); $('refillRow').style.display = ''
    $('msg').innerHTML = '<div class="ok">✅ 미리보기 생성 완료. “에디터에 다시 채우기”로 넣으세요.</div>'
  } catch (e) { $('msg').innerHTML = '<div class="warn">' + esc(e.message) + '</div>' }
  finally { btn.disabled = false; btn.innerHTML = '미리보기만 (채우지 않음)' }
}
$('refillBtn').onclick = async () => {
  if (!lastContent) return alert('먼저 글을 생성하세요.')
  const btn = $('refillBtn'); btn.disabled = true; btn.innerHTML = '<span class="spinner"></span>채우는 중…'
  try { await fillFlow(lastContent); $('msg').innerHTML = '<div class="ok">✅ 에디터에 채웠어요. 검수 후 직접 발행하세요.</div>' }
  catch (e) { $('msg').innerHTML = '<div class="warn">' + esc(e.message) + '</div>' }
  finally { btn.disabled = false; btn.innerHTML = '📥 에디터에 다시 채우기' }
}

load()
