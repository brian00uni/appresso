// marginSync.js — 마진 계산기 상품 목록 전역 공유 동기화 (Supabase)
//
// smart-studio는 공개 페이지라 로또(lottoSync)와 같은 전역 공유 방식을 쓴다.
// localStorage(marginCalc.js)는 오프라인 캐시로 유지하고, 원격 margin_items를
// 소스 오브 트루스로 삼는다. 백엔드(1회 실행): supabase/sql/margin_items.sql
// 테이블/정책이 없거나 오류여도 조용히 실패하고 로컬 동작엔 영향을 주지 않는다.

import { supabase } from '../../lib/supabase'

const num = (v) => {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? '').replace(/,/g, ''))
  return Number.isFinite(n) ? n : 0
}

// 클라이언트 item({feeRate,returnRate,…}) → DB row(snake_case, 숫자)
function toRow(it) {
  return {
    id: it.id,
    name: String(it.name ?? ''),
    price: num(it.price),
    cost: num(it.cost),
    shipping: num(it.shipping),
    fee_rate: num(it.feeRate),
    return_rate: num(it.returnRate),
    updated_at: new Date().toISOString(),
  }
}

// DB row → 클라이언트 item
function fromRow(r) {
  return {
    id: r.id,
    name: r.name ?? '',
    price: r.price ?? 0,
    cost: r.cost ?? 0,
    shipping: r.shipping ?? 0,
    feeRate: r.fee_rate ?? 0,
    returnRate: r.return_rate ?? 0,
  }
}

// 원격 전체 목록을 최신순으로 불러온다. 실패 시 null.
export async function fetchItems() {
  try {
    const { data, error } = await supabase
      .from('margin_items')
      .select('id, name, price, cost, shipping, fee_rate, return_rate, created_at')
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data || []).map(fromRow)
  } catch {
    return null
  }
}

// 상품 1건 추가/수정(upsert). 성공 시 true.
export async function pushItem(it) {
  try {
    const { error } = await supabase
      .from('margin_items')
      .upsert(toRow(it), { onConflict: 'id' })
    if (error) throw error
    return true
  } catch {
    return false
  }
}

// 상품 1건 삭제. 성공 시 true.
export async function removeItemRemote(id) {
  try {
    const { error } = await supabase.from('margin_items').delete().eq('id', id)
    if (error) throw error
    return true
  } catch {
    return false
  }
}
