// 사이트/앱 방문 카운팅 — Supabase RPC(track_visit) 기반
//
// 모든 공개 앱 페이지(유튜브 분석/조회수가 터진 영상/포춘쿠키/로또/홈 등)에서
// 마운트 시 trackVisit(appKey)를 호출하면:
//   - 세션당 앱별 1회만 카운트를 증가시키고 (sessionStorage 디바운스)
//   - 사이트 전체/오늘/현재 앱 방문수를 반환한다.
//
// 백엔드(한 번 실행 필요): supabase/sql/track_visit.sql 참고.
// RPC가 아직 없거나 오류면 카운트는 조용히 null로 떨어진다(앱 동작엔 영향 없음).

import { useEffect, useState } from 'react'
import { supabase } from './supabase'

const SESSION_PREFIX = 'visit_counted_'

function alreadyCountedThisSession(appKey) {
  try {
    return sessionStorage.getItem(SESSION_PREFIX + appKey) === '1'
  } catch {
    return false
  }
}

function markCountedThisSession(appKey) {
  try {
    sessionStorage.setItem(SESSION_PREFIX + appKey, '1')
  } catch {
    // sessionStorage 불가 환경(프라이빗 모드 등)에서는 매번 증가될 수 있으나 무시
  }
}

// appKey 페이지 방문을 기록하고 { siteTotal, siteToday, appTotal }를 반환한다.
// 실패 시 null을 반환한다.
export async function trackVisit(appKey) {
  const increment = !alreadyCountedThisSession(appKey)
  try {
    const { data, error } = await supabase.rpc('track_visit', {
      p_app: appKey,
      p_increment: increment,
    })
    if (error) throw error
    if (increment) markCountedThisSession(appKey)
    return data || null
  } catch {
    return null
  }
}

// React 훅: 마운트 시 방문 기록 + 카운트 상태를 돌려준다.
export function useVisit(appKey) {
  const [counts, setCounts] = useState(null)
  useEffect(() => {
    let active = true
    trackVisit(appKey).then((c) => {
      if (active) setCounts(c)
    })
    return () => {
      active = false
    }
  }, [appKey])
  return counts
}
