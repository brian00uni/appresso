import React, { useEffect, useState } from 'react'
import { pingExtension } from './extensionBridge'
import artStudioLogo from '../../assets/artstudio-logo02.png'

const DOWNLOAD_URL = '/art-studio-extension.zip'
const FLOW_URL = 'https://labs.google/fx/tools/flow'

// 주요 기능 (flowArtStudio 확장앱 기준)
const FEATURES = [
  { icon: '📝', title: '일괄 프롬프트 전송', desc: '여러 프롬프트를 한 줄씩 입력해 한 번에 순차 생성합니다.' },
  { icon: '🌐', title: '자동 영문 번역', desc: '한글 프롬프트를 영어로 자동 번역해 결과 품질을 높입니다.' },
  { icon: '📂', title: 'JSON 장면 입력', desc: 'scene JSON 파일·텍스트를 통째로 불러와 대량 작업합니다.' },
  { icon: '⬇️', title: '이미지 자동 저장', desc: '생성된 결과물을 지정한 파일명으로 자동 다운로드합니다.' },
  { icon: '🎨', title: '이미지 · 동영상', desc: 'Nano Banana · Imagen · Veo 모델로 이미지와 영상을 생성합니다.' },
  { icon: '🏷️', title: '미디어 이름 변경', desc: '생성물 파일명을 일괄 규칙으로 깔끔하게 정리합니다.' },
]

// 사용 순서 (다운로드 → 설치 → 사용)
const STEPS = [
  { n: 1, t: '확장앱 다운로드', d: '아래 버튼으로 확장앱 zip 파일을 받습니다.' },
  { n: 2, t: '압축 해제', d: '받은 zip을 풀어 flowArtStudio 폴더를 만듭니다.' },
  { n: 3, t: '개발자 모드로 로드', d: 'chrome://extensions → 개발자 모드 ON → “압축해제된 확장 프로그램을 로드” → flowArtStudio 폴더 선택.' },
  { n: 4, t: '구글 로그인 후 Flow 열기', d: 'Google Flow 페이지를 열면 확장앱 사이드패널이 활성화됩니다.' },
  { n: 5, t: '프롬프트 입력 후 작업 시작', d: '사이드패널에서 프롬프트를 넣고 ▶ 작업 시작을 누르면 자동 진행됩니다.' },
]

/**
 * Art Studio 메인 안내 패널 (WorkPanel + ExtensionPanel 통합)
 * 서비스 소개 · 확장앱 다운로드 · 주요 기능 · 사용 순서 · 전체 가이드 모달
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
      {/* 헤더 */}
      <div className="is-work-header">
        <div className="is-work-header-left">
          {/* <img src={artStudioLogo} alt="" className="is-logo-mark-img" />
          <span className="is-logo-text">Flow 자동화</span> */}
          <span className={`is-ext-badge  ${installed ? 'on' : installed === false ? 'off' : ''}`}>
            {installed === null ? '확인 중…' : installed ? '● Extensions 설치됨 (On-line)' : 'x Extensions 미설치 (Off-line)'}
          </span>
        </div>
        {/* <button type="button" className="is-btn-gold sm" onClick={() => setShowGuide(true)}>📖 가이드</button> */}
      </div>

      {/* 인트로 */}
      <div className="is-box">
        <h2 className="is-intro-title">구글 Flow 작업을 자동화하세요</h2>
        <p className="is-intro-desc">
          프롬프트만 입력하면 <strong>일괄 전송 · 자동 번역 · 이미지 자동 저장</strong>까지.
          크리에이터의 반복 작업 시간을 획기적으로 줄여 줍니다.
        </p>
        <button type="button" className="is-btn-gold full" onClick={() => setShowGuide(true)}>
          📖 사용 가이드 보기
        </button>
      </div>

      {/* 크롬 확장앱 다운로드 */}
      <div className="is-box">
        <div className="is-box-head"><span>🧩 크롬 확장앱</span></div>
        <p className="is-ext-lead">
          Flow 자동화(일괄 생성·번역·저장)는 <strong>크롬 확장앱</strong>에서 실행됩니다.
          웹페이지는 보안 정책상 Flow를 직접 조작할 수 없어, 확장앱이 그 역할을 맡아요.
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
        <button type="button" className="is-flow-open-btn" onClick={() => window.open(FLOW_URL, '_blank', 'noopener')}>
          ↗ Google Flow 열기
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
        <div className="is-box-head"><span>사용 순서</span></div>
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
        <button type="button" className="is-ext-flow-btn" onClick={() => setShowGuide(true)}>
          📖 자세한 사용법 보기
        </button>
      </div>

      {/* 가이드 모달 */}
      {showGuide && (
        <div className="is-guide-overlay" onClick={() => setShowGuide(false)}>
          <div className="is-guide-modal" onClick={(e) => e.stopPropagation()}>
            <div className="is-guide-modal-head">
              <span>📖 Art Studio 사용 가이드</span>
              <button type="button" className="is-guide-close" onClick={() => setShowGuide(false)} aria-label="닫기">✕</button>
            </div>
            <iframe className="is-guide-frame" src="/guide.html" title="Art Studio 사용 가이드" />
          </div>
        </div>
      )}
    </section>
  )
}
