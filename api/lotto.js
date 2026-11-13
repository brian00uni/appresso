import { getExpectedLatestDraw, normalizeOfficial, validDraw } from '../src/lib/lottoCore.js'

const OFFICIAL = 'https://www.dhlottery.co.kr/lt645/selectPstLt645InfoNew.do'
async function getText(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0', Referer: 'https://www.dhlottery.co.kr/lt645/result' }, signal: AbortSignal.timeout(10000) })
  if (!res.ok) throw new Error(`당첨번호 서버 HTTP ${res.status}`)
  return res.text()
}
export async function officialPage(round) {
  const json = JSON.parse(await getText(`${OFFICIAL}?srchDir=center&srchLtEpsd=${round}`))
  if (!Array.isArray(json?.data?.list)) throw new Error('공식 API 응답 형식 오류')
  return json.data.list.map(normalizeOfficial)
}
export function parseKokomel(html) {
  const map = new Map()
  function visit(value) {
    if (!value || typeof value !== 'object') return
    if (value.drwNo && Array.isArray(value.balls)) {
      const date = value.desc?.match(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/)
      const d = { drw: Number(value.drwNo), nums: value.balls.filter(b => b.bonus === false).map(b => Number(b.number)).sort((a,b)=>a-b), bonus: Number(value.balls.find(b => b.bonus === true)?.number), date: date && `${date[1]}-${date[2].padStart(2,'0')}-${date[3].padStart(2,'0')}` }
      if (validDraw(d)) map.set(d.drw, d)
    }
    for (const child of Object.values(value)) visit(child)
  }
  for (const match of html.matchAll(/self\.__next_f\.push\((.*?)\)<\/script>/gs)) {
    try {
      const payload = JSON.parse(match[1])[1]
      if (typeof payload !== 'string') continue
      for (const line of payload.split('\n')) {
        try { visit(JSON.parse(line.slice(line.indexOf(':') + 1))) } catch { /* non-JSON Flight record */ }
      }
    } catch { /* unrelated script */ }
  }
  if (!map.size) throw new Error('보조 데이터 형식 오류')
  return [...map.values()]
}
export async function loadDraws(from, target = getExpectedLatestDraw()) {
  const map = new Map()
  let source = 'dhlottery'
  try {
    let cursor = target
    while (cursor > from) {
      const rows = await officialPage(cursor)
      const relevant = rows.filter(d => d.drw <= cursor && d.drw > from && d.drw <= target)
      if (!relevant.length) break
      relevant.forEach(d => map.set(d.drw, d))
      cursor = Math.min(...relevant.map(d => d.drw)) - 1
    }
  } catch {
    source = 'dhlottery+kokomel'
    const rows = parseKokomel(await getText('https://lotto.kokomel.com/lottos'))
    rows.filter(d => d.drw > from && d.drw <= target).forEach(d => { if (!map.has(d.drw)) map.set(d.drw,d) })
  }
  const draws = [...map.values()].sort((a,b)=>a.drw-b.drw)
  const complete = Array.from({length: Math.max(0,target-from)},(_,i)=>from+i+1).every(n=>map.has(n))
  return { draws, source, target, complete }
}
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' })
  const target = getExpectedLatestDraw()
  const round = req.query.drwNo === undefined ? null : Number(req.query.drwNo)
  const from = round !== null ? round - 1 : Number(req.query.from ?? Math.max(0,target-20))
  if (!Number.isInteger(from) || from < 0 || (from > target && round === null) || (round !== null && (!Number.isInteger(round) || round < 1))) return res.status(400).json({ error: '잘못된 회차' })
  if (round > target) return res.status(200).json({ returnValue: 'fail', pending: true })
  try {
    const result = await loadDraws(from, round ?? target)
    if (!result.complete) return res.status(503).json({ ...result, error: '당첨 결과가 아직 제공되지 않았거나 일부 회차를 조회하지 못했습니다. 잠시 후 재시도합니다.' })
    if (round !== null) {
      const d = result.draws[0]
      return res.status(200).json({ returnValue:'success', drwNo:d.drw, drwNoDate:d.date, bnusNo:d.bonus, ...Object.fromEntries(d.nums.map((n,i)=>[`drwtNo${i+1}`,n])) })
    }
    return res.status(200).json(result)
  } catch (e) { return res.status(502).json({ error: e.message }) }
}
