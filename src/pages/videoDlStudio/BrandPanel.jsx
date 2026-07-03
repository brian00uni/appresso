import React from 'react'

/**
 * VideoDL Studio 좌측 — 브랜드 소개 카드
 * (art-studio LoginPanel 자리를 대체: 다운로더는 로그인 불필요)
 * 설치 상태 배지·다운로드 버튼은 우측 InfoPanel에서 담당한다.
 */
export default function BrandPanel() {
  return (
    <aside className="is-login">
      <div className="is-login-card">
        <div className="is-login-brand">
          <div className="is-login-logo">📥</div>
          <div className="is-login-title">VideoDL Studio</div>
          <p className="is-login-sub">영상 일괄 다운로드 스튜디오</p>
        </div>

        <p className="is-login-desc">
          더우인 · 틱톡 · 레드노트(샤오홍슈) 검색 결과에서
          <br />원하는 영상 카드를 골라 담으면
          <br />백그라운드에서 자동으로 추출해
          <br /><strong style={{ color: 'var(--is-gold)' }}>한 번에 다운로드</strong>합니다.
        </p>

        <p className="is-login-terms">
          웹스토어 대신 직접 설치하는 크롬 확장앱입니다.<br />
          우측 안내를 따라 설치 후 사용하세요.
        </p>
      </div>
    </aside>
  )
}
