import React, { useEffect, useState } from 'react'
import { pingExtension } from './extensionBridge'

const DOWNLOAD_URL = '/writing-studio-extension.zip'
const AISTUDIO_URL = 'https://aistudio.google.com/app/apikey'

const FEATURES = [
  { icon: '✍️', title: 'AI 글 생성', desc: '주제·키워드·내용 가이드를 넣으면 제목·본문·태그를 자동 작성합니다.' },
  { icon: '🎭', title: '톤 선택', desc: '친근하게 · 후킹 강하게 · 여성스럽게 등 원하는 느낌대로 생성돼요.' },
  { icon: '📥', title: '에디터 자동 입력', desc: '스마트에디터 ONE에 제목·본문을 자동으로 채워줍니다.' },
  { icon: '🔒', title: '로그인 그대로', desc: '내 브라우저의 네이버 로그인을 그대로 사용 — 계정 잠금 걱정 없어요.' },
  { icon: '✅', title: '발행은 직접', desc: '자동 발행하지 않아요. 검수 후 사람이 발행 → 저품질/오발행 방지.' },
  { icon: '🆓', title: 'Gemini 무료', desc: 'Google AI Studio 무료 API 키로 동작합니다.' },
]

const STEPS = [
  { n: 1, t: '확장앱 다운로드', d: '아래 버튼으로 확장앱 zip 파일을 받습니다.' },
  { n: 2, t: '압축 해제', d: '받은 zip을 풀어 writing-studio 폴더를 만듭니다.' },
  { n: 3, t: '개발자 모드로 로드', d: 'chrome://extensions → 개발자 모드 ON → “압축해제된 확장 프로그램을 로드” → writing-studio 폴더 선택.' },
  { n: 4, t: '사이드패널 + Gemini 키', d: '아이콘 클릭 → 사이드패널 → Google AI Studio에서 발급한 무료 Gemini API 키 저장.' },
  { n: 5, t: '글 생성', d: '주제·키워드·톤·내용 프롬프트를 넣고 “글 생성하기”.' },
  { n: 6, t: '에디터에 채우기 → 발행', d: '네이버 글쓰기 페이지를 연 뒤 “에디터에 채우기”. 검수 후 직접 발행하세요.' },
]

/**
 * Writing Studio 우측 안내 패널 (art-studio 포맷 재사용)
 */
export default function InfoPanel() {
  const [installed, setInstalled] = useState(null)
  const [showGuide, setShowGuide] = useState(false)

  useEffect(() => {
    let alive = true
    pingExtension().then((ok) => alive && setInstalled(ok))
    return () => { alive = false }
  }, [])

  return (
    <section className="is-work">
      {/* 설치 상태 배지 */}
      <span className={`is-ext-badge ${installed ? 'on' : installed === false ? 'off' : ''}`} style={{ marginBottom: 12 }}>
        {installed === null ? '확인 중…' : installed ? '● Extensions 설치됨 (On-line)' : 'x Extensions 미설치 (Off-line)'}
      </span>

      {/* 인트로 */}
      <div className="is-box">
        <h2 className="is-intro-title">블로그 글, AI로 쓰고 자동으로 채우세요</h2>
        <p className="is-intro-desc">
          주제만 입력하면 <strong>제목·본문</strong>을 AI가 작성하고 <strong>스마트에디터에 자동 입력</strong>까지.
          내 브라우저의 네이버 로그인을 그대로 쓰므로 안전하고, <strong>발행은 직접</strong> 검수 후 합니다.
        </p>
        <a href={DOWNLOAD_URL} download className="is-btn-gold full"
          style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
          ⬇️ 확장앱 다운로드 (.zip)
        </a>
        <p className="is-ext-note">※ 웹스토어 대신 직접 설치합니다. 받은 zip을 풀어 개발자 모드로 로드하세요.</p>
        <button type="button" className="is-ext-flow-btn" onClick={() => setShowGuide(true)}>
          📖 사용 가이드 보기
        </button>
      </div>

      {/* Gemini 키 안내 */}
      <div className="is-box">
        <div className="is-box-head"><span>🔑 Gemini API 키 (무료)</span></div>
        <p className="is-ext-lead">
          글 생성은 Google <strong>Gemini 무료 티어</strong>로 동작해요. 아래에서 키를 발급받아
          사이드패널에 붙여넣으면 됩니다. (카드 등록 없이 무료)
        </p>
        <button type="button" className="is-flow-open-btn" onClick={() => window.open(AISTUDIO_URL, '_blank', 'noopener')}>
          ↗ Google AI Studio에서 키 발급
        </button>
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

      {/* 사용 순서 */}
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
              <span>📖 Writing Studio 사용 가이드</span>
              <button type="button" className="is-guide-close" onClick={() => setShowGuide(false)} aria-label="닫기">✕</button>
            </div>
            <iframe className="is-guide-frame" src="/writing-studio-guide.html" title="Writing Studio 사용 가이드" />
          </div>
        </div>
      )}
    </section>
  )
}
