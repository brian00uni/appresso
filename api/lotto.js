// 로또 당첨번호 서버리스 프록시 — /api/lotto?drwNo=1233
//
// 배경: LottoRecommend.jsx가 쓰던 3단계 폴백(동행복권 직접 / allorigins / corsproxy)이
//   전부 죽었다.
//     · dhlottery common.do?getLottoNumber → 해외/데이터센터 IP는 홈으로 302 리다이렉트
//     · api.allorigins.win → 408/520 (사실상 다운)
//     · corsproxy.io → 유료 전환(무료 서버사이드 요청 403)
//   그래서 브라우저에서 직접 최신 회차를 못 가져와 "API 업데이트 오류"가 났다.
//
// 이 함수는 서버(Vercel)에서 데이터를 대신 가져와 CORS 허용 JSON으로 돌려준다.
//   1순위: 동행복권 공식 API (배포 리전에서 살아있으면 사용)
//   2순위: kokomel 로또 전체조회 페이지(https://lotto.kokomel.com/lottos) 텍스트 파싱
// 응답 형태는 동행복권 원본과 동일하게 맞춰, 프론트 parseDrawJson을 그대로 재사용한다.

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'

const KOKOMEL_URL = 'https://lotto.kokomel.com/lottos'
const CACHE_TTL = 60 * 60 * 1000 // 1시간 (warm 인스턴스 한정 in-memory 캐시)

// warm 인스턴스 동안 kokomel 파싱 결과를 재사용 (drw → row)
let _kokomel = { at: 0, map: null }

async function httpGet(url, { headers = {}, timeout = 12000, redirect = 'follow' } = {}) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeout)
  try {
    return await fetch(url, {
      headers: { 'User-Agent': UA, ...headers },
      redirect,
      signal: ctrl.signal,
    })
  } finally {
    clearTimeout(timer)
  }
}

// 동행복권 공식 JSON을 표준 형태로. 실패(리다이렉트/비JSON)면 null.
async function fromDhlottery(drwNo) {
  try {
    const res = await httpGet(
      `https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${drwNo}`,
      {
        headers: { Accept: 'application/json', Referer: 'https://www.dhlottery.co.kr/' },
        timeout: 6000,
        // 해외/데이터센터 IP는 홈으로 302 → 리다이렉트를 따라가 큰 HTML을 받지 말고 즉시 실패 처리
        redirect: 'manual',
      },
    )
    if (!res.ok) return null // 302 등
    const text = await res.text()
    let j
    try { j = JSON.parse(text) } catch { return null } // 302 후 HTML 등
    if (j && j.returnValue === 'success') return j
    return null
  } catch {
    return null
  }
}

// kokomel 전체조회 페이지를 파싱해 drw → {nums,bonus,date} 맵을 만든다.
async function kokomelMap(force) {
  const now = Date.now()
  if (!force && _kokomel.map && now - _kokomel.at < CACHE_TTL) return _kokomel.map
  const res = await httpGet(KOKOMEL_URL, { timeout: 12000 })
  if (!res.ok) throw new Error(`kokomel HTTP ${res.status}`)
  const html = await res.text()
  const text = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
  const rx = /제\s*(\d{3,4})\s*회\s*(\d{4})년\s*(\d{2})월\s*(\d{2})일(?:\s*추첨)?\s+((?:\d{1,2}\s+){6})\+\s*(\d{1,2})/g
  const map = new Map()
  let m
  while ((m = rx.exec(text)) !== null) {
    const drw = Number(m[1])
    const nums = m[5].trim().split(/\s+/).map(Number).sort((a, b) => a - b)
    map.set(drw, { drw, date: `${m[2]}-${m[3]}-${m[4]}`, nums, bonus: Number(m[6]) })
  }
  if (map.size === 0) throw new Error('kokomel 파싱 실패')
  _kokomel = { at: Date.now(), map }
  return map
}

// 표준 회차 객체 → 동행복권 원본 JSON 형태
function toDhShape(row) {
  return {
    returnValue: 'success',
    drwNo: row.drw,
    drwtNo1: row.nums[0], drwtNo2: row.nums[1], drwtNo3: row.nums[2],
    drwtNo4: row.nums[3], drwtNo5: row.nums[4], drwtNo6: row.nums[5],
    bnusNo: row.bonus,
    drwNoDate: row.date,
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  if (req.method === 'OPTIONS') { res.status(204).end(); return }

  const drwNo = parseInt(req.query.drwNo, 10)
  const force = req.query.force === '1'

  try {
    // drwNo 없이 호출하면 kokomel이 가진 전체 회차 배열을 준다(진단·일괄용).
    if (!drwNo) {
      const map = await kokomelMap(force)
      const draws = Array.from(map.values()).sort((a, b) => a.drw - b.drw)
      res.setHeader('Cache-Control', 'public, max-age=600')
      res.status(200).json({ draws })
      return
    }

    // 1순위: 동행복권 공식 (배포 리전에서 살아있을 때만)
    const dh = await fromDhlottery(drwNo)
    if (dh) { res.status(200).json(dh); return }

    // 2순위: kokomel
    const map = await kokomelMap(force)
    const row = map.get(drwNo)
    if (row) {
      res.setHeader('Cache-Control', 'public, max-age=600')
      res.status(200).json(toDhShape(row))
      return
    }

    // 어디에도 없음 = 아직 미추첨(또는 kokomel 미갱신) → 동행복권 미추첨과 동일 신호
    res.status(200).json({ returnValue: 'fail' })
  } catch (e) {
    res.status(502).json({ returnValue: 'fail', error: String(e?.message || e) })
  }
}
