// 가성비대장 — localStorage 데이터 레이어 (메뉴/설정)

const MENUS_KEY = 'gaseongbi_menus'
const SETTINGS_KEY = 'gaseongbi_settings'
const CALC_STATE_KEY = 'gaseongbi_calc_state'
const STORE_INFO_KEY = 'gaseongbi_store_info'
const MONTHLY_SNAPSHOTS_KEY = 'gaseongbi_monthly_snapshots'
const BENCHMARK_KEY = 'gaseongbi_benchmark'
const BENCHMARK_HISTORY_KEY = 'gaseongbi_benchmark_history'

const ls = {
  get: (k, fb) => {
    try {
      const v = localStorage.getItem(k)
      return v != null ? JSON.parse(v) : fb
    } catch {
      return fb
    }
  },
  set: (k, v) => {
    try {
      localStorage.setItem(k, JSON.stringify(v))
    } catch {
      // localStorage 사용 불가 환경(프라이빗 모드 등)에서는 조용히 무시
    }
  },
}

function newId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `menu_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

// ── 메뉴 ──────────────────────────────────────────────────────

export function getMenus() {
  return ls.get(MENUS_KEY, [])
}

export function saveMenus(menus) {
  ls.set(MENUS_KEY, menus)
}

export function addMenu(menu) {
  const menus = getMenus()
  const now = new Date().toISOString()
  const newMenu = {
    id: newId(),
    menuName: '',
    category: '',
    storePrice: 0,
    deliveryPrice: 0,
    foodCost: 0,
    packingCost: 0,
    defaultCoupon: 0,
    memo: '',
    createdAt: now,
    updatedAt: now,
    ...menu,
  }
  saveMenus([...menus, newMenu])
  return newMenu
}

export function updateMenu(id, patch) {
  const menus = getMenus()
  const next = menus.map((m) =>
    m.id === id ? { ...m, ...patch, id: m.id, updatedAt: new Date().toISOString() } : m
  )
  saveMenus(next)
  return next.find((m) => m.id === id)
}

export function deleteMenu(id) {
  saveMenus(getMenus().filter((m) => m.id !== id))
}

export function duplicateMenu(id) {
  const menus = getMenus()
  const target = menus.find((m) => m.id === id)
  if (!target) return null
  const now = new Date().toISOString()
  const copy = {
    ...target,
    id: newId(),
    menuName: `${target.menuName} (복사)`,
    createdAt: now,
    updatedAt: now,
  }
  saveMenus([...menus, copy])
  return copy
}

export function getMenu(id) {
  return getMenus().find((m) => m.id === id) || null
}

// ── 설정 ──────────────────────────────────────────────────────

export const DEFAULT_SETTINGS = {
  platforms: {},
  defaults: {
    targetMarginRate: 0.2,
    vatIncluded: true,
    adCost: 0,
    customerDeliveryTip: 0,
    ownerCoupon: 0,
    referencePlatform: 'baemin',
    monthlyUnitsPerMenu: 30,
  },
}

export function getSettings() {
  const stored = ls.get(SETTINGS_KEY, null)
  if (!stored) return structuredCloneSafe(DEFAULT_SETTINGS)
  return {
    ...DEFAULT_SETTINGS,
    ...stored,
    defaults: { ...DEFAULT_SETTINGS.defaults, ...(stored.defaults || {}) },
    platforms: { ...(stored.platforms || {}) },
  }
}

export function saveSettings(settings) {
  ls.set(SETTINGS_KEY, settings)
}

export function resetAll() {
  ls.set(MENUS_KEY, [])
  ls.set(SETTINGS_KEY, DEFAULT_SETTINGS)
  ls.set(CALC_STATE_KEY, null)
  ls.set(STORE_INFO_KEY, null)
  ls.set(MONTHLY_SNAPSHOTS_KEY, [])
  ls.set(BENCHMARK_KEY, null)
  ls.set(BENCHMARK_HISTORY_KEY, [])
}

// ── 마진계산 화면 입력값 (새로고침 유지) ──────────────────────

export function getCalcState() {
  return ls.get(CALC_STATE_KEY, null)
}

export function saveCalcState(state) {
  ls.set(CALC_STATE_KEY, state)
}

// ── 매장 정보 ──────────────────────────────────────────────────

export const DEFAULT_STORE_INFO = {
  storeName: '내 가게',
  location: '',
  repCategory: '',
}

export function getStoreInfo() {
  return { ...DEFAULT_STORE_INFO, ...ls.get(STORE_INFO_KEY, {}) }
}

export function saveStoreInfo(storeInfo) {
  ls.set(STORE_INFO_KEY, storeInfo)
}

// ── 월간 손익 스냅샷 (손익리포트 추이용, 월 1회 갱신) ────────────

export function getMonthlySnapshots() {
  return ls.get(MONTHLY_SNAPSHOTS_KEY, [])
}

export function recordMonthlySnapshot({ revenue, adCost, netProfit, marginRate }) {
  const month = new Date().toISOString().slice(0, 7) // YYYY-MM
  const snapshots = getMonthlySnapshots()
  const idx = snapshots.findIndex((s) => s.month === month)
  const entry = { month, revenue, adCost, netProfit, marginRate }
  if (idx >= 0) {
    snapshots[idx] = entry
  } else {
    snapshots.push(entry)
  }
  snapshots.sort((a, b) => (a.month < b.month ? -1 : 1))
  ls.set(MONTHLY_SNAPSHOTS_KEY, snapshots)
  return snapshots
}

// ── 벤치마킹 ──────────────────────────────────────────────────

export const DEFAULT_BENCHMARK = {
  myStore: {
    name: '',
    repPrice: 0,
    deliveryTip: 0,
    coupon: 0,
    setCount: 0,
    photoStyle: 0,
    reviewEvent: 0,
    reviewScore: 0,
    conversionRate: 0,
  },
  competitors: [],
}

export function getBenchmark() {
  const stored = ls.get(BENCHMARK_KEY, null)
  // 우리 가게 이름은 설정 > 매장 정보를 단일 출처로 사용한다.
  const storeName = getStoreInfo().storeName
  const base = stored || structuredCloneSafe(DEFAULT_BENCHMARK)
  return {
    myStore: { ...DEFAULT_BENCHMARK.myStore, ...(base.myStore || {}), name: storeName },
    competitors: base.competitors || [],
  }
}

export function saveBenchmark(benchmark) {
  ls.set(BENCHMARK_KEY, benchmark)
}

export function saveMyStore(myStore) {
  const benchmark = getBenchmark()
  benchmark.myStore = { ...benchmark.myStore, ...myStore }
  saveBenchmark(benchmark)
  return benchmark.myStore
}

export function addCompetitor(competitor) {
  const benchmark = getBenchmark()
  const newCompetitor = {
    id: newId(),
    group: 'local',
    name: '',
    repPrice: 0,
    deliveryTip: 0,
    coupon: 0,
    setCount: 0,
    photoStyle: 0,
    reviewEvent: 0,
    reviewScore: 0,
    conversionRate: 0,
    ...competitor,
  }
  benchmark.competitors = [...benchmark.competitors, newCompetitor]
  saveBenchmark(benchmark)
  return newCompetitor
}

export function updateCompetitor(id, patch) {
  const benchmark = getBenchmark()
  benchmark.competitors = benchmark.competitors.map((c) => (c.id === id ? { ...c, ...patch, id: c.id } : c))
  saveBenchmark(benchmark)
  return benchmark.competitors.find((c) => c.id === id)
}

export function deleteCompetitor(id) {
  const benchmark = getBenchmark()
  benchmark.competitors = benchmark.competitors.filter((c) => c.id !== id)
  saveBenchmark(benchmark)
}

export function getBenchmarkHistory() {
  return ls.get(BENCHMARK_HISTORY_KEY, [])
}

export function addBenchmarkSnapshot(summary) {
  const history = getBenchmarkHistory()
  const entry = { id: newId(), date: new Date().toISOString(), summary }
  const next = [entry, ...history]
  ls.set(BENCHMARK_HISTORY_KEY, next)
  return next
}

function structuredCloneSafe(obj) {
  return JSON.parse(JSON.stringify(obj))
}
