// costSync.js — 사입 원가 계산안 전역 공유 저장소 (Supabase)
//
// cost-studio는 공개 페이지라 마진 계산기(marginSync)와 같은 전역 공유 방식을 쓴다.
// 작업 중인 상태는 localStorage(costCalc.js)에 캐시하고, "계산안 저장"을 누르면
// 품목 + 설정 전체를 하나의 행(cost_projects)으로 저장한다.
// 백엔드(1회 실행): supabase/sql/cost_projects.sql
// 테이블/정책이 없거나 오류여도 조용히 실패하고 로컬 동작엔 영향을 주지 않는다.

import { supabase } from '../../lib/supabase'

// 원격 저장된 계산안 목록(최신순). 실패 시 null.
export async function fetchProjects() {
  try {
    const { data, error } = await supabase
      .from('cost_projects')
      .select('id, name, data, updated_at')
      .order('updated_at', { ascending: false })
    if (error) throw error
    return (data || []).map((r) => ({
      id: r.id,
      name: r.name ?? '',
      items: Array.isArray(r.data?.items) ? r.data.items : [],
      settings: r.data?.settings ?? {},
      updatedAt: r.updated_at,
    }))
  } catch {
    return null
  }
}

// 계산안 1건 추가/수정(upsert). 성공 시 true.
export async function pushProject({ id, name, items, settings }) {
  try {
    const { error } = await supabase
      .from('cost_projects')
      .upsert({
        id,
        name: String(name ?? ''),
        data: { items, settings },
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })
    if (error) throw error
    return true
  } catch {
    return false
  }
}

// 계산안 1건 삭제. 성공 시 true.
export async function removeProject(id) {
  try {
    const { error } = await supabase.from('cost_projects').delete().eq('id', id)
    if (error) throw error
    return true
  } catch {
    return false
  }
}
