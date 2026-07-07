// 트렌드 허브 프론트 API 클라이언트.
// 백엔드는 같은 도메인의 Vercel 서버리스 함수(/api/trend/*).
// 구독 계정 목록은 서버에 저장하지 않고 브라우저 localStorage로 관리해 쿼리로 전달한다.

const BASE = '/api/trend'

// 계정 기본값 (백엔드 DEFAULTS와 동일하게 유지)
export const DEFAULT_ACCOUNTS = {
  reels: ['openai', 'runwayapp', 'pika_labs', 'lumalabsai', 'midjourney',
    'klingai_official', 'heygen_official', 'higgsfield.ai', 'googledeepmind'],
  x: ['OpenAI', 'runwayml', 'Kling_ai', 'GoogleDeepMind', 'midjourney',
    'LumaLabsAI', 'pika_labs', 'heygen_com', 'elevenlabsio', 'AIatMeta'],
  threads: ['openai', 'runway', 'google', 'meta.ai', 'zuck'],
  tiktok: ['openai', 'runwayapp', 'krea.ai', 'elevenlabs', 'sora',
    'zachking', 'khaby.lame', 'google'],
}

const STORAGE_KEY = (source) => `trendhub.accounts.${source}`

export function loadAccounts(source) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY(source))
    if (raw) {
      const list = JSON.parse(raw)
      if (Array.isArray(list)) return list
    }
  } catch { /* ignore */ }
  return DEFAULT_ACCOUNTS[source].slice()
}

export function saveAccounts(source, accounts) {
  try {
    localStorage.setItem(STORAGE_KEY(source), JSON.stringify(accounts))
  } catch { /* ignore */ }
}

// 계정 이름 정규화 (X는 대소문자 보존, 나머지는 소문자)
function normalizeAccount(source, raw) {
  const name = String(raw || '').trim().replace(/^@/, '')
  return source === 'x' ? name : name.toLowerCase()
}

export function addAccount(source, raw) {
  const name = normalizeAccount(source, raw)
  if (!name) return loadAccounts(source)
  const list = loadAccounts(source)
  if (!list.includes(name)) list.push(name)
  saveAccounts(source, list)
  return list
}

export function removeAccount(source, name) {
  const list = loadAccounts(source).filter((a) => a !== name)
  saveAccounts(source, list)
  return list
}

async function getJson(path, params) {
  const qs = new URLSearchParams(params || {}).toString()
  const res = await fetch(`${BASE}/${path}${qs ? '?' + qs : ''}`)
  const ctype = res.headers.get('content-type') || ''
  if (!ctype.includes('application/json')) {
    throw new Error('API 응답을 받지 못했습니다. 로컬 개발이라면 `vercel dev`로 실행하세요.')
  }
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || data.error || '요청에 실패했습니다.')
  return data
}

export const trendApi = {
  categories: () => getJson('categories'),
  videos: ({ category, period, shorts, enrich, q, force }) =>
    getJson('videos', {
      category, period,
      shorts: shorts ? '1' : '0',
      enrich: enrich ? '1' : '0',
      q: q || '',
      force: force ? '1' : '0',
    }),
  reels: (force) => getJson('reels', { accounts: loadAccounts('reels').join(','), force: force ? '1' : '0' }),
  x: (force) => getJson('x', { accounts: loadAccounts('x').join(','), force: force ? '1' : '0' }),
  threads: (force) => getJson('threads', { accounts: loadAccounts('threads').join(','), force: force ? '1' : '0' }),
  tiktok: (force) => getJson('tiktok', { accounts: loadAccounts('tiktok').join(','), force: force ? '1' : '0' }),
  ai: (force) => getJson('ai', { force: force ? '1' : '0' }),
}

// 프록시 이미지 URL (인스타/틱톡 CDN 핫링크 우회)
export const imgProxy = (url) => `${BASE}/img?u=${encodeURIComponent(url)}`

// ---------- 포맷터 ----------
export function fmtViews(n) {
  const num = Number(n) || 0
  if (num >= 1e8) return (num / 1e8).toFixed(1).replace(/\.0$/, '') + '억회'
  if (num >= 1e4) return (num / 1e4).toFixed(1).replace(/\.0$/, '') + '만회'
  return num.toLocaleString('ko-KR') + '회'
}

export function fmtCount(n) {
  const num = Number(n) || 0
  if (num >= 1e8) return (num / 1e8).toFixed(1).replace(/\.0$/, '') + '억'
  if (num >= 1e4) return (num / 1e4).toFixed(1).replace(/\.0$/, '') + '만'
  if (num >= 1e3) return (num / 1e3).toFixed(1).replace(/\.0$/, '') + '천'
  return num.toLocaleString('ko-KR')
}

export function timeAgo(ts) {
  if (!ts) return ''
  const s = Date.now() / 1000 - ts
  if (s < 3600) return Math.max(1, Math.floor(s / 60)) + '분 전'
  if (s < 86400) return Math.floor(s / 3600) + '시간 전'
  return Math.floor(s / 86400) + '일 전'
}

export function fmtUpdated(fetchedAt) {
  if (!fetchedAt) return ''
  return '업데이트 ' + new Date(fetchedAt).toLocaleTimeString('ko-KR')
}
