// marginCalc.js — 스마트스토어 마진 계산 로직 + localStorage 저장소
// 계산식은 스마트스토어_마진계산기.xlsx 를 그대로 옮긴 것:
//   수수료      = 판매가 * 수수료율 / 100
//   반품충당금  = 판매가 * 반품충당율 / 100
//   예상순익    = 판매가 - 매입가 - 배송비 - 수수료 - 반품충당금
//   순마진율(%) = 예상순익 / 판매가 * 100   (판매가 0이면 0)

const num = (v) => {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? '').replace(/,/g, ''))
  return Number.isFinite(n) ? n : 0
}

// 입력값(row: {name, price, cost, shipping, feeRate, returnRate})으로 파생값 계산
export function calcMargin(row) {
  const price = num(row.price)
  const cost = num(row.cost)
  const shipping = num(row.shipping)
  const feeRate = num(row.feeRate)
  const returnRate = num(row.returnRate)

  const fee = price * feeRate / 100
  const returnReserve = price * returnRate / 100
  const profit = price - cost - shipping - fee - returnReserve
  const marginRate = price === 0 ? 0 : (profit / price) * 100

  return { price, cost, shipping, feeRate, returnRate, fee, returnReserve, profit, marginRate }
}

// ── localStorage 저장소 ──────────────────────────────────────────
const LS_KEY = 'smartstore_margin_items'

export function loadItems() {
  try {
    const v = localStorage.getItem(LS_KEY)
    const arr = v != null ? JSON.parse(v) : []
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

export function saveItems(items) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(items))
    return true
  } catch {
    return false
  }
}

export function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}
