// 환율 서버리스 프록시 — /api/fx?from=CNY&to=KRW
//
// 사입 원가 계산기(cost-studio)에서 "실시간 환율 불러오기"에 쓴다.
// 브라우저에서 환율 API를 직접 부르면 CORS/차단에 걸리는 곳이 많아 서버에서 대신 가져온다.
//   1순위: frankfurter.app (ECB 고시, 키 불필요)
//   2순위: open.er-api.com (키 불필요)
// 응답: { rate, from, to, date, source }

const CACHE_TTL = 60 * 60 * 1000 // 1시간 (warm 인스턴스 한정 in-memory 캐시)

// key(`CNY_KRW`) → { at, payload }
const cache = new Map()

async function httpJson(url, timeout = 8000) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeout)
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' }, signal: ctrl.signal })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

async function fromFrankfurter(from, to) {
  const j = await httpJson(`https://api.frankfurter.app/latest?from=${from}&to=${to}`)
  const rate = j?.rates?.[to]
  if (!Number.isFinite(rate)) return null
  return { rate, from, to, date: j.date || null, source: 'frankfurter' }
}

async function fromErApi(from, to) {
  const j = await httpJson(`https://open.er-api.com/v6/latest/${from}`)
  const rate = j?.rates?.[to]
  if (!Number.isFinite(rate)) return null
  return { rate, from, to, date: j.time_last_update_utc || null, source: 'er-api' }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  if (req.method === 'OPTIONS') { res.status(204).end(); return }

  const from = String(req.query.from || 'CNY').toUpperCase().slice(0, 3)
  const to = String(req.query.to || 'KRW').toUpperCase().slice(0, 3)
  const key = `${from}_${to}`
  const now = Date.now()

  const hit = cache.get(key)
  if (hit && now - hit.at < CACHE_TTL) {
    res.setHeader('Cache-Control', 'public, max-age=1800')
    res.status(200).json({ ...hit.payload, cached: true })
    return
  }

  try {
    const payload = (await fromFrankfurter(from, to)) || (await fromErApi(from, to))
    if (!payload) {
      res.status(502).json({ error: 'rate unavailable', from, to })
      return
    }
    cache.set(key, { at: now, payload })
    res.setHeader('Cache-Control', 'public, max-age=1800')
    res.status(200).json(payload)
  } catch (e) {
    res.status(500).json({ error: 'server error', message: String(e?.message || e) })
  }
}
