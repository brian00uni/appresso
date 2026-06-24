import React, { useEffect, useState } from 'react'
import { pingExtension } from './extensionBridge'

// 크롬 웹스토어 등록 후 실제 URL 로 교체하세요.
const WEBSTORE_URL = '' // 예: https://chrome.google.com/webstore/detail/<id>
const FLOW_URL = 'https://labs.google/fx/tools/flow'

const STEPS = [
  { n: 1, t: '확장앱 설치', d: '아래 버튼으로 크롬 웹스토어에서 Art Studio 확장앱을 설치합니다.' },
  { n: 2, t: '구글 로그인', d: '크롬에서 구글 계정에 로그인합니다. (이미 로그인돼 있으면 생략)' },
  { n: 3, t: 'Flow 열기', d: 'Google Flow 페이지를 엽니다. 확장앱 사이드패널이 활성화됩니다.' },
  { n: 4, t: '프롬프트 전송', d: '왼쪽 작업 패널에서 만든 프롬프트를 “익스텐션으로 보내기”로 넘깁니다.' },
]

/**
 * Art Studio 우측 — 크롬 확장앱 설치 안내 + 사용법
 * (Flow 자동 조작은 보안 정책상 확장앱에서만 가능)
 */
export default function ExtensionPanel() {
  const [installed, setInstalled] = useState(null) // null=확인중, true/false

  useEffect(() => {
    let alive = true
    pingExtension().then((ok) => alive && setInstalled(ok))
    return () => { alive = false }
  }, [])

  function openStore() {
    if (WEBSTORE_URL) window.open(WEBSTORE_URL, '_blank', 'noopener')
    else alert('웹스토어 등록 후 설치 링크가 연결됩니다.')
  }

  return (
    <section className="is-ext">
      <div className="is-flow-head">
        <span className="is-flow-title">🧩 크롬 확장앱</span>
        <span className={`is-ext-badge ${installed ? 'on' : installed === false ? 'off' : ''}`}>
          {installed === null ? '확인 중…' : installed ? '● 설치됨' : '● 미설치'}
        </span>
      </div>

      <div className="is-box">
        <p className="is-ext-lead">
          Flow 자동화(일괄 생성·번역·저장)는 <strong>크롬 확장앱</strong>에서 실행됩니다.
          웹페이지는 보안 정책상 Flow를 직접 조작할 수 없어, 확장앱이 그 역할을 맡아요.
        </p>

        <button type="button" className="is-btn-gold full" onClick={openStore}>
          🧩 Chrome 웹스토어에서 설치
        </button>
        {!WEBSTORE_URL && (
          <p className="is-ext-note">※ 웹스토어 등록 전입니다. 등록 후 위 버튼에 설치 링크가 연결됩니다.</p>
        )}

        <button type="button" className="is-ext-flow-btn" onClick={() => window.open(FLOW_URL, '_blank', 'noopener')}>
          ↗ Google Flow 열기
        </button>
      </div>

      <div className="is-box">
        <div className="is-box-head"><span>사용 방법</span></div>
        <ol className="is-ext-steps">
          {STEPS.map((s) => (
            <li key={s.n} className="is-ext-step">
              <span className="is-ext-step-num">{s.n}</span>
              <div>
                <div className="is-ext-step-title">{s.t}</div>
                <div className="is-ext-step-desc">{s.d}</div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
