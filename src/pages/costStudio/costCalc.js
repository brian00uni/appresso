// costCalc.js — 1688 다품목 중국 사입 원가 계산 로직 + localStorage 캐시
//
// 계산식은 원본 계산기(1688_다품목_중국사입_원가계산기_v2.html)를 그대로 옮긴 것:
//   중국 상품대금  = Σ(단가CNY × 사입수량) × 환율
//   현지비         = Σ(중국내 배송 + 기타 현지비) × 환율
//   공통 현지비    = 공통 기타비(CNY) × 환율
//   대행수수료     = (상품대금 + 현지비 + 공통 현지비) × 대행수수료율
//   수입원가 기준액 = 상품대금 + 현지비 + 공통 현지비 + 대행수수료 + 국제배송 + 배대지수수료
//   관세           = 기준액 × 관세율
//   부가세         = (기준액 + 관세) × 부가세율
//   입고비         = 통관 기타비 + 국내 입고배송
//   포장/제작비    = (박스 + 스티커 + 부자재 + 기타제작) × 세트수량
//   불량/예비비    = (위 합계) × 불량률
//   초기 투입현금  = 위 합계 + 불량/예비비,  완성원가 = 초기현금 / 세트수량
//   1개 순이익     = 판매가 - 완성원가 - (택배비 + 플랫폼수수료 + 광고비 + 반품충당 + 기타)
//   손익분기 수량  = ceil(초기현금 / (판매가 - 판매부대비용))

const num = (v) => {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? '').replace(/,/g, ''))
  return Number.isFinite(n) ? n : 0
}

// 기본 설정값 (원본 HTML의 초기값과 동일)
export const DEFAULT_SETTINGS = {
  fx: 209.51,            // 1 CNY = ? KRW
  setQty: 100,           // 완성 세트 수량
  agentPct: 0,           // 구매/결제 대행수수료율(%)
  chinaCommon: 0,        // 중국 현지 공통 기타비(CNY)

  intlShip: 30000,       // 중국→한국 국제배송비
  forwarderFee: 15000,   // 배대지 검수/합배송 수수료
  dutyPct: 0,            // 관세율(%)
  vatPct: 10,            // 수입 부가세율(%)
  customFee: 15000,      // 통관/관세사 기타비
  domesticInbound: 7000, // 배대지→집 국내배송

  packageUnit: 800,      // 박스/파우치 1세트
  printUnit: 300,        // 스티커/카드 1세트
  partsUnit: 100,        // 오링/키링 부자재 1세트
  makeUnit: 0,           // 기타 제작비 1세트
  lossPct: 3,            // 불량/예비비율(%)

  sellPrice: 19900,      // 판매가(무료배송)
  outShip: 3000,         // 고객 발송 택배비
  platformPct: 8,        // 플랫폼/결제 수수료율(%)
  adCost: 3000,          // 주문 1건당 광고비
  returnPct: 2,          // 반품/CS 충당률(%)
  sellEtc: 0,            // 기타 주문당 비용
}

// 예시 세트 (원본 "수능세트 예시")
export const SAMPLE_ITEMS = [
  { name: '미니 알람시계 키링', cny: 5.85, perSet: 1, orderQty: 100, ship: 0, etc: 0 },
  { name: '클로버 팔찌', cny: 0.5, perSet: 1, orderQty: 100, ship: 0, etc: 0 },
  { name: '실버 도끼 참', cny: 0.13, perSet: 1, orderQty: 100, ship: 0, etc: 0 },
  { name: '두꺼운 접이식 거울', cny: 1.44, perSet: 1, orderQty: 100, ship: 0, etc: 0 },
  { name: '수정테이프', cny: 0.55, perSet: 1, orderQty: 100, ship: 0, etc: 0 },
  { name: 'GOOD LUCK 문구 참', cny: 0.15, perSet: 1, orderQty: 100, ship: 0, etc: 0 },
]

// 품목 1줄의 원화 상품비 (단가×사입수량 + 현지배송 + 현지기타) × 환율
export function itemKrw(item, fx) {
  return (num(item.cny) * num(item.orderQty) + num(item.ship) + num(item.etc)) * num(fx)
}

// items(품목 배열) + settings(설정)으로 전체 원가·수익을 계산한다.
export function calcCost(items, settings) {
  const s = { ...DEFAULT_SETTINGS, ...settings }
  const fx = num(s.fx)
  const setQty = Math.max(1, num(s.setQty))

  let goods = 0      // 중국 상품대금(원)
  let local = 0      // 품목별 중국내 배송/현지비(원)
  let setGoods = 0   // 세트 1개에 들어가는 중국 상품원가(원)
  items.forEach((r) => {
    goods += num(r.cny) * num(r.orderQty) * fx
    local += (num(r.ship) + num(r.etc)) * fx
    setGoods += num(r.cny) * num(r.perSet) * fx
  })

  const common = num(s.chinaCommon) * fx
  const agent = (goods + local + common) * num(s.agentPct) / 100
  const shipping = num(s.intlShip) + num(s.forwarderFee)
  const importBase = goods + local + common + agent + shipping
  const duty = importBase * num(s.dutyPct) / 100
  const vat = (importBase + duty) * num(s.vatPct) / 100
  const inbound = num(s.customFee) + num(s.domesticInbound)
  const pack = (num(s.packageUnit) + num(s.printUnit) + num(s.partsUnit) + num(s.makeUnit)) * setQty

  const before = importBase + duty + vat + inbound + pack
  const loss = before * num(s.lossPct) / 100
  const initial = before + loss          // 초기 투입 현금
  const landed = initial / setQty        // 완성원가 / 세트

  const sell = num(s.sellPrice)
  const platform = sell * num(s.platformPct) / 100
  const returns = sell * num(s.returnPct) / 100
  const sellCost = num(s.outShip) + platform + num(s.adCost) + returns + num(s.sellEtc)

  const profit = sell - landed - sellCost
  const marginRate = sell === 0 ? 0 : (profit / sell) * 100
  const contribution = sell - sellCost
  const bep = contribution > 0 ? Math.ceil(initial / contribution) : setQty

  const breakdown = [
    ['중국 상품대금', goods],
    ['품목별 중국내 배송/현지비', local],
    ['공통 중국 현지비', common],
    ['구매/결제 대행수수료', agent],
    ['배대지+국제배송', shipping],
    ['관세', duty],
    ['수입 부가세', vat],
    ['통관+국내 입고배송', inbound],
    ['박스/카드/스티커/부자재', pack],
    ['불량/예비비', loss],
  ].map(([label, total]) => ({ label, total, perSet: total / setQty }))

  return {
    setQty, fx,
    goodsTotal: goods + local + common, // 상품대금 합계(현지비 포함)
    setGoods,                            // 세트당 중국 상품원가
    landed, profit, marginRate,
    profitAll: profit * setQty,
    initial, bep,
    sellCost, contribution,
    breakdown,
  }
}

// ── localStorage 캐시 (작업 중인 계산 상태) ────────────────────────
const LS_KEY = 'cost_studio_state'

export function loadState() {
  try {
    const v = localStorage.getItem(LS_KEY)
    if (!v) return null
    const st = JSON.parse(v)
    if (!st || !Array.isArray(st.items)) return null
    return { items: st.items, settings: { ...DEFAULT_SETTINGS, ...(st.settings || {}) } }
  } catch {
    return null
  }
}

export function saveState(items, settings) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ items, settings }))
    return true
  } catch {
    return false
  }
}

export function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

export function newItem(data = {}, setQty = 100) {
  return {
    id: newId(),
    name: data.name ?? '',
    cny: data.cny ?? '',
    perSet: data.perSet ?? 1,
    orderQty: data.orderQty ?? setQty,
    ship: data.ship ?? 0,
    etc: data.etc ?? 0,
  }
}
