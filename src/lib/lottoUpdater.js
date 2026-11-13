import { BASE_KNOWN } from './lottoData.js'
import { getExpectedLatestDraw, mergeDraws, validDraw } from './lottoCore.js'
const CACHE = 'lotto_cache_v2'
const SUCCESS = 'lotto_last_success_v2'
const RETRY = 5 * 60 * 1000
let pending = null
let attemptedAt = 0
function read(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback } catch { return fallback } }
function write(key, value) { try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* private mode / quota */ } }
export function currentDraws() {
  // The verified bundled snapshot wins over old browser/shared entries.
  return mergeDraws(read(CACHE, []), BASE_KNOWN).filter(d => d.drw <= getExpectedLatestDraw())
}
export function saveDraws(rows) { write(CACHE, mergeDraws(currentDraws(), rows)); window.dispatchEvent(new Event('lotto-updated')) }
export function lastSuccess() { return read(SUCCESS, 0) }
export function clearDrawCache() { try { localStorage.removeItem(CACHE); localStorage.removeItem(SUCCESS) } catch {} }
export function syncLatestDraws() {
  if (pending) return pending
  attemptedAt = Date.now()
  pending = (async () => {
    const from = BASE_KNOWN.at(-1).drw
    const res = await fetch(`/api/lotto?from=${from}`, { cache: 'no-store', signal: AbortSignal.timeout(60000) })
    const json = await res.json()
    if (!res.ok || !json.complete || !Array.isArray(json.draws) || !json.draws.every(validDraw)) throw new Error(json.error || '당첨번호 응답 검증 실패')
    const merged = mergeDraws(currentDraws(), json.draws)
    const expected = getExpectedLatestDraw()
    if (merged.length < expected || merged.some((d,i)=>d.drw !== i+1) || merged.at(-1)?.drw !== expected) throw new Error('일부 회차가 누락되어 재시도합니다')
    write(SUCCESS, Date.now())
    saveDraws(json.draws)
    return merged
  })().finally(() => { pending = null })
  return pending
}
export function watchLotto(onData, onError = () => {}) {
  let active = true
  const changed = () => { if (active) onData(currentDraws()) }
  const check = async () => {
    if (document.visibilityState === 'hidden' || !navigator.onLine) return
    const latest = currentDraws().at(-1)?.drw || 0
    if (Date.now() - attemptedAt < RETRY) return
    if (latest >= getExpectedLatestDraw() && Date.now() - lastSuccess() < 60 * 60 * 1000) return
    try { await syncLatestDraws(); changed() } catch (e) { if (active) onError(e) }
  }
  window.addEventListener('lotto-updated', changed)
  window.addEventListener('storage', changed)
  window.addEventListener('online', check)
  document.addEventListener('visibilitychange', check)
  const timer = setInterval(check, 60000)
  check()
  return () => {
    active = false; clearInterval(timer)
    window.removeEventListener('lotto-updated', changed); window.removeEventListener('storage', changed)
    window.removeEventListener('online', check); document.removeEventListener('visibilitychange', check)
  }
}
