import React, { useEffect, useState } from 'react'
import { pingExtension } from './extensionBridge'

const DOWNLOAD_URL = '/videodl-studio-extension.zip'

// 지원 사이트 (검색 결과 페이지에서 카드 선택)
const SITES = [
  { name: '틱톡', url: 'https://www.tiktok.com/', emoji: '🎵' },
  { name: '더우인', url: 'https://www.douyin.com/', emoji: '🎧' },
  { name: '레드노트', url: 'https://www.xiaohongshu.com/', emoji: '📕' },
]

// 주요 기능
const FEATURES = [
  { icon: '☑️', title: '카드 일괄 선택', desc: '검색 결과 카드에 체크박스가 자동 표시됩니다. 원하는 영상만 골라 담으세요.' },
  { icon: '⚡', title: '실시간 추출', desc: '백그라운드에서 상세페이지를 열어 영상 URL을 추출하고 진행 상황을 실시간 표시합니다.' },
  { icon: '⬇️', title: '일괄 다운로드', desc: '선택한 모든 영상을 “전체 다운로드” 한 번으로 받습니다.' },
  { icon: '📂', title: '자동 폴더 분류', desc: '날짜·시간·플랫폼 기준으로 폴더를 자동 생성해 깔끔하게 저장합니다.' },
  { icon: '🔁', title: '실패만 재시도', desc: '타임아웃 등으로 실패한 항목만 골라 다시 추출할 수 있습니다.' },
  { icon: '🎬', title: '더우인·틱톡·레드노트', desc: '3개 소싱 플랫폼의 영상을 하나의 사이드패널에서 처리합니다.' },
]

// 사용 순서
const STEPS = [
  { n: 1, t: '확장앱 다운로드', d: '아래 버튼으로 확장앱 zip 파일을 받습니다.' },
  { n: 2, t: '압축 해제', d: '받은 zip을 풀어 videoDlStudio 폴더를 만듭니다.' },
  { n: 3, t: '개발자 모드로 로드', d: 'chrome://extensions → 개발자 모드 ON → “압축해제된 확장 프로그램을 로드” → videoDlStudio 폴더 선택.' },
  { n: 4, t: '사이드패널 열기', d: '우측 상단 퍼즐 아이콘 → VideoDL Studio 고정 → 아이콘 클릭하면 사이드패널이 열립니다.' },
  { n: 5, t: '카드 선택 후 추출', d: '지원 사이트 검색 결과에서 카드를 체크하고 “미디어 추출”을 누릅니다.' },
  { n: 6, t: '전체 다운로드', d: '추출이 끝나면 사이드패널 하단 “전체 다운로드”로 한 번에 저장합니다.' },
]

/**
 * VideoDL Studio 우측 안내 패널 (art-studio InfoPanel 포맷 재사용)
 * 설치상태 배지 · 서비스 소개 · 지원 사이트 · 주요 기능 · 사용 순서 · 확장앱 다운로드 · 가이드 모달
 */
export default function InfoPanel() {
  const [installed, setInstalled] = useState(null) // null=확인중, true/false
  const [showGuide, setShowGuide] = useState(false)

  useEffect(() => {
    let alive = true
    pingExtension().then((ok) => alive && setInstalled(ok))
    return () => { alive = false }
  }, [])

  return (
    <section className="is-work">
      {/* 설치 상태 배지 (맨 위) */}
      <span className={`is-ext-badge ${installed ? 'on' : installed === false ? 'off' : ''}`} style={{ marginBottom: 12 }}>
        {installed === null ? '확인 중…' : installed ? '● Extensions 설치됨 (On-line)' : 'x Extensions 미설치 (Off-line)'}
      </span>

      {/* 인트로 */}
      <div className="is-box">
        <h2 className="is-intro-title">영상을 한 번에 추출·다운로드하세요</h2>
        <p className="is-intro-desc">
          <strong>더우인 · 틱톡 · 레드노트(샤오홍슈)</strong> 검색 결과에서 원하는 영상 카드를
          골라 담으면, 백그라운드에서 자동으로 추출해 <strong>일괄 다운로드</strong>합니다.
          영상 추출·다운로드는 보안 정책상 웹페이지 대신 <strong>크롬 확장앱</strong>이 실행합니다.
        </p>
        <a
          href={DOWNLOAD_URL}
          download
          className="is-btn-gold full"
          style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}
        >
          ⬇️ 확장앱 다운로드 (.zip)
        </a>
        <p className="is-ext-note">※ 웹스토어 대신 직접 설치합니다. 받은 zip을 풀어 개발자 모드로 로드하세요.</p>
        <button type="button" className="is-ext-flow-btn" onClick={() => setShowGuide(true)}>
          📖 사용 가이드 보기
        </button>
      </div>

      {/* 지원 사이트 (큰 버튼) */}
      <div className="is-box">
        <div className="is-box-head"><span>지원 사이트</span></div>
        <div className="vdl-sites">
          {SITES.map((s) => (
            <button
              key={s.name}
              type="button"
              className="vdl-site"
              onClick={() => window.open(s.url, '_blank', 'noopener')}
            >
              <span className="vdl-site-emoji">{s.emoji}</span>
              <span className="vdl-site-name">{s.name}</span>
              <span className="vdl-site-arrow">열기 ↗</span>
            </button>
          ))}
        </div>
      </div>

      {/* 주요 기능 */}
      <div className="is-box">
        <div className="is-box-head"><span>주요 기능</span></div>
        <div className="is-feature-grid">
          {FEATURES.map((f) => (
            <div className="is-feature" key={f.title}>
              <div className="is-feature-icon">{f.icon}</div>
              <div className="is-feature-title">{f.title}</div>
              <div className="is-feature-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 사용 순서 + 확장앱 다운로드 */}
      <div className="is-box">
        <div className="is-box-head"><span>설치 · 사용 순서</span></div>
        <ol className="is-ext-steps">
          {STEPS.map((s) => (
            <li className="is-ext-step" key={s.n}>
              <span className="is-ext-step-num">{s.n}</span>
              <div>
                <div className="is-ext-step-title">{s.t}</div>
                <div className="is-ext-step-desc">{s.d}</div>
              </div>
            </li>
          ))}
        </ol>

        <button type="button" className="is-ext-flow-btn" onClick={() => setShowGuide(true)} style={{ marginTop: 14 }}>
          📖 자세한 사용법 보기
        </button>
      </div>

      {/* 가이드 모달 */}
      {showGuide && (
        <div className="is-guide-overlay" onClick={() => setShowGuide(false)}>
          <div className="is-guide-modal" onClick={(e) => e.stopPropagation()}>
            <div className="is-guide-modal-head">
              <span>📖 VideoDL Studio 사용 가이드</span>
              <button type="button" className="is-guide-close" onClick={() => setShowGuide(false)} aria-label="닫기">✕</button>
            </div>
            <iframe className="is-guide-frame" src="/videodl-guide.html" title="VideoDL Studio 사용 가이드" />
          </div>
        </div>
      )}
    </section>
  )
}
