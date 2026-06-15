// 가성비대장 — Supabase 동기화 레이어 (로컬 우선 + 백그라운드 동기)
//
// 읽기는 storage.js의 localStorage 캐시(동기)를 그대로 쓰고,
// 쓰기가 일어나면 schedulePush()로 디바운스 후 Supabase에 사용자별 jsonb blob을 upsert한다.
// 로그인 시 hydrate()로 원격 → 로컬 캐시를 채우고, 원격이 비어있으면 기존 로컬 데이터를 1회 마이그레이션한다.

import { supabase } from '../supabase'

// ── localStorage 키 (storage.js와 공유) ───────────────────────
// 동기화 대상
export const MENUS_KEY = 'gaseongbi_menus'
export const SETTINGS_KEY = 'gaseongbi_settings'
export const STORE_INFO_KEY = 'gaseongbi_store_info'
export const MONTHLY_SNAPSHOTS_KEY = 'gaseongbi_monthly_snapshots'
export const BENCHMARK_KEY = 'gaseongbi_benchmark'
export const BENCHMARK_HISTORY_KEY = 'gaseongbi_benchmark_history'
// 로컬 전용 (기기별 UI 임시상태 — 동기화 제외)
export const CALC_STATE_KEY = 'gaseongbi_calc_state'

const TABLE = 'gaseongbi_data'
const PUSH_DEBOUNCE_MS = 800

// blob 필드명 ↔ localStorage 키 매핑
const FIELD_TO_KEY = {
  menus: MENUS_KEY,
  settings: SETTINGS_KEY,
  storeInfo: STORE_INFO_KEY,
  monthlySnapshots: MONTHLY_SNAPSHOTS_KEY,
  benchmark: BENCHMARK_KEY,
  benchmarkHistory: BENCHMARK_HISTORY_KEY,
}

// 동기화 대상 키 집합 (storage.js의 ls.set에서 push 여부 판단)
export const SYNCED_KEYS = new Set(Object.values(FIELD_TO_KEY))

const state = {
  userId: null,
  hydrated: false,
  hydrating: false,
  pushTimer: null,
  unloadHooked: false,
}

function readRaw(key) {
  try {
    const v = localStorage.getItem(key)
    return v != null ? JSON.parse(v) : undefined
  } catch {
    return undefined
  }
}

function writeRaw(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // localStorage 사용 불가 환경에서는 조용히 무시
  }
}

function removeRaw(key) {
  try {
    localStorage.removeItem(key)
  } catch {
    // 무시
  }
}

function buildBlob() {
  const blob = {}
  for (const [field, key] of Object.entries(FIELD_TO_KEY)) {
    const v = readRaw(key)
    if (v !== undefined) blob[field] = v
  }
  return blob
}

function hasLocalData() {
  return Object.values(FIELD_TO_KEY).some((key) => localStorage.getItem(key) != null)
}

async function upsertBlob(userId, blob) {
  return supabase
    .from(TABLE)
    .upsert({ user_id: userId, data: blob, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
}

export function isHydrated() {
  return state.hydrated
}

// 로그인 직후 1회 호출. 원격 데이터로 로컬 캐시를 채운다.
export async function hydrate(userId) {
  if (!userId) return
  if (state.hydrated && state.userId === userId) return

  state.userId = userId
  state.hydrating = true
  hookUnloadFlush()

  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select('data')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      // 조회 실패: 로컬 캐시를 유지하되 동기화는 활성화하지 않는다(데이터 보호).
      console.error('[gaseongbi] 동기화 로드 실패:', error.message)
      state.hydrated = false
      return
    }

    const remote = data?.data
    if (remote && Object.keys(remote).length > 0) {
      // 원격 → 로컬 캐시 반영 (원격에 없는 항목은 로컬에서도 제거해 기기 간 일치)
      for (const [field, key] of Object.entries(FIELD_TO_KEY)) {
        if (field in remote) writeRaw(key, remote[field])
        else removeRaw(key)
      }
    } else if (hasLocalData()) {
      // 자동 마이그레이션: 기존 로컬 데이터 → 원격
      const { error: upErr } = await upsertBlob(userId, buildBlob())
      if (upErr) console.error('[gaseongbi] 마이그레이션 실패:', upErr.message)
    } else {
      // 신규 사용자: 빈 행 생성
      const { error: upErr } = await upsertBlob(userId, {})
      if (upErr) console.error('[gaseongbi] 초기 행 생성 실패:', upErr.message)
    }
    state.hydrated = true
  } finally {
    state.hydrating = false
  }
}

// 로컬 쓰기 후 호출 (storage.js의 ls.set 내부). 디바운스 후 원격에 반영.
export function schedulePush() {
  if (state.hydrating || !state.hydrated || !state.userId) return
  if (state.pushTimer) clearTimeout(state.pushTimer)
  state.pushTimer = setTimeout(() => {
    state.pushTimer = null
    pushNow()
  }, PUSH_DEBOUNCE_MS)
}

async function pushNow() {
  if (!state.userId || !state.hydrated) return
  const { error } = await upsertBlob(state.userId, buildBlob())
  if (error) console.error('[gaseongbi] 저장 실패:', error.message)
}

// 탭 종료/숨김 시 대기 중인 변경을 best-effort로 즉시 반영
function hookUnloadFlush() {
  if (state.unloadHooked || typeof window === 'undefined') return
  state.unloadHooked = true
  const flush = () => {
    if (state.pushTimer) {
      clearTimeout(state.pushTimer)
      state.pushTimer = null
      pushNow()
    }
  }
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush()
  })
  window.addEventListener('pagehide', flush)
}

// 로그아웃 시 로컬 캐시 정리 (다음 사용자에게 이전 데이터 노출 방지)
export function resetLocal() {
  if (state.pushTimer) {
    clearTimeout(state.pushTimer)
    state.pushTimer = null
  }
  for (const key of Object.values(FIELD_TO_KEY)) removeRaw(key)
  removeRaw(CALC_STATE_KEY)
  state.userId = null
  state.hydrated = false
  state.hydrating = false
}
