// lottoSync.js — 로또 당첨번호 전역 공유 동기화 (Supabase)
//
// LottoRecommend.jsx는 새로 조회/직접입력한 당첨번호를 localStorage(lotto_cache)에
// 저장한다. 그런데 localStorage는 브라우저·기기별로 분리되고 시크릿모드에선 유지되지
// 않으므로, 한 번 업데이트해도 다른 환경에서 열면 다시 사라진다.
//
// 이 모듈은 그 당첨번호를 Supabase 전역 테이블(lotto_draws)에도 함께 저장한다.
//   · fetchSharedDraws() — 마운트 시 원격 최신본을 불러와 로컬과 병합
//   · pushSharedDraws()  — 업데이트/직접입력 시 원격에 반영(누구나 upsert RPC 사용)
//
// 백엔드(1회 실행 필요): supabase/sql/lotto_draws.sql
// RPC/테이블이 없거나 오류여도 조용히 실패하고 로컬 동작엔 영향을 주지 않는다.

import { supabase } from './supabase'

// 원격 공유 저장소의 전체 회차를 불러온다. 실패 시 null.
export async function fetchSharedDraws() {
  try {
    const { data, error } = await supabase
      .from('lotto_draws')
      .select('drw, nums, bonus, draw_date')
      .order('drw', { ascending: true })
    if (error) throw error
    return (data || []).map((r) => ({
      drw: r.drw,
      nums: Array.isArray(r.nums) ? [...r.nums].sort((a, b) => a - b) : [],
      bonus: r.bonus,
      date: r.draw_date || undefined,
    }))
  } catch {
    return null
  }
}

// 회차 배열을 원격에 병합(upsert)한다. 성공 시 true.
export async function pushSharedDraws(draws) {
  if (!Array.isArray(draws) || draws.length === 0) return false
  try {
    const payload = draws.map((d) => ({
      drw: d.drw,
      nums: d.nums,
      bonus: d.bonus,
      date: d.date ?? null,
    }))
    const { error } = await supabase.rpc('upsert_lotto_draws', { p_draws: payload })
    if (error) throw error
    return true
  } catch {
    return false
  }
}
