// 가성비대장 — 결제/등급(엔타이틀먼트) 설계 주석 (v0.1: 결제 미구현)
//
// v0.1에서는 결제, 로그인 등급, AI API 호출이 전혀 없다.
// 아래 구조는 이후 버전에서 결제 연동 시 사용할 자리만 잡아둔 것이다.
//
// ⚠️ 실제 결제/등급 검증은 반드시 서버사이드에서 수행해야 한다.
// ⚠️ PG(결제대행사) 시크릿 키는 절대 프론트엔드 코드/번들에 포함하지 않는다.

export const PRODUCT_PLAN = {
  FREE: 'FREE', // 메뉴 1개 계산만, 저장/엑셀/AI 불가
  LIFETIME: 'LIFETIME', // 메뉴 저장 + 마진계산 + 플랫폼비교 + 기본 엑셀 + AI 월 3회
  PRO: 'PRO', // LIFETIME + 클라우드 저장 + 월간 리포트 + 엑셀 월 1회 + AI 월 20회
  PRO_PLUS: 'PRO_PLUS', // PRO + 엑셀 무제한 + 벤치마킹 저장 + 광고비 회수 분석 + AI 월 100회
}

// v0.1: 결제 미구현 — 모든 사용자를 LIFETIME처럼 동작시킨다.
export function getUserEntitlement() {
  return {
    plan: PRODUCT_PLAN.LIFETIME,
    maxMenus: Infinity,
    canSaveMenus: true,
    canComparePlatforms: true,
    canExportExcel: true,
    canUseBenchmark: false, // PRO_PLUS 전용 — v0.1은 항상 false (준비중 화면 노출)
    aiCommentsPerMonth: 3,
  }
}
