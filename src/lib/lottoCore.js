const WEEK = 7 * 24 * 60 * 60 * 1000
const FIRST_RESULT = Date.parse('2002-12-07T21:35:00+09:00')
export function getExpectedLatestDraw(now = new Date()) {
  return Math.max(0, Math.floor((Number(now) - FIRST_RESULT) / WEEK) + 1)
}
export function msUntilNextDrawUpdate(now = new Date()) {
  return FIRST_RESULT + getExpectedLatestDraw(now) * WEEK - Number(now)
}
export function drawDate(drw) {
  return new Date(Date.UTC(2002, 11, 7) + (drw - 1) * WEEK).toISOString().slice(0, 10)
}
export function validDraw(d) {
  return !!d && Number.isInteger(d.drw) && d.drw > 0 && Array.isArray(d.nums) &&
    d.nums.length === 6 && [...d.nums, d.bonus].every(n => Number.isInteger(n) && n >= 1 && n <= 45) &&
    new Set([...d.nums, d.bonus]).size === 7 && d.date === drawDate(d.drw)
}
export function normalizeOfficial(r) {
  const date = String(r.ltRflYmd)
  const d = { drw: Number(r.ltEpsd), nums: [1,2,3,4,5,6].map(n => Number(r[`tm${n}WnNo`])).sort((a,b)=>a-b), bonus: Number(r.bnsWnNo), date: `${date.slice(0,4)}-${date.slice(4,6)}-${date.slice(6,8)}` }
  if (!validDraw(d)) throw new Error('공식 당첨번호 형식 오류')
  return d
}
export function mergeDraws(base, extra) {
  const map = new Map()
  for (const d of [...(base || []), ...(Array.isArray(extra) ? extra : [])]) {
    if (validDraw(d)) map.set(d.drw, d)
  }
  return [...map.values()].sort((a,b)=>a.drw-b.drw)
}
