import React from 'react'

/**
 * Writing Studio 좌측 — 브랜드 소개 카드
 * (설치 상태 배지·다운로드 버튼은 우측 InfoPanel에서 담당)
 */
export default function BrandPanel() {
  return (
    <aside className="is-login">
      <div className="is-login-card">
        <div className="is-login-brand">
          <div className="is-login-logo">📝</div>
          <div className="is-login-title">Writing Studio</div>
          <p className="is-login-sub">네이버 블로그 AI 글쓰기</p>
        </div>

        <p className="is-login-desc">
          주제만 입력하면 AI가 제목·본문을 써 주고,
          <br />스마트에디터에 <strong style={{ color: 'var(--is-gold)' }}>자동으로 채워</strong>줍니다.
          <br />발행은 검수 후 직접 — 계정도 안전해요.
        </p>

        <p className="is-login-terms">
          내 브라우저의 네이버 로그인을 그대로 사용하는<br />
          크롬 확장앱입니다. 우측 안내를 따라 설치하세요.
        </p>
      </div>
    </aside>
  )
}
