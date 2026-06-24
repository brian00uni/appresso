import React, { useMemo, useState } from 'react'
import { sendPrompts } from './extensionBridge'
import artStudioLogo from '../../assets/artstudio-logo02.png'

/** 칩 버튼 그룹 (단일 선택) */
function ChipGroup({ options, value, onChange }) {
  return (
    <div className="is-chip-row">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={`is-chip${value === opt.value ? ' active' : ''}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

/**
 * Art Studio 우측 — 이미지 생성 작업 패널
 * 크롬 익스텐션 "AI크래프터 Flow 자동화" 사이드패널 UI를 웹으로 포팅.
 * (실제 자동화 백엔드는 미연동 — UI/상태만 동작)
 */
export default function WorkPanel() {
  const [mode, setMode] = useState('image') // 'image' | 'video'
  const [submode, setSubmode] = useState('frame')
  const [ratio, setRatio] = useState('9:16')
  const [count, setCount] = useState('x1')
  const [videoModel, setVideoModel] = useState('Veo 3.1 - Fast')
  const [imgModel, setImgModel] = useState('Nano Banana 2')

  const [prompts, setPrompts] = useState('')
  const [autoTranslate, setAutoTranslate] = useState(true)
  const [translateTarget, setTranslateTarget] = useState('en')
  const [stylePrompt, setStylePrompt] = useState('')

  const [delayMin, setDelayMin] = useState(15)
  const [delayMax, setDelayMax] = useState(30)
  const [filePrefix, setFilePrefix] = useState('AiCrafter_')
  const [useReference, setUseReference] = useState(false)
  const [autoDownload, setAutoDownload] = useState(true)

  const [running, setRunning] = useState(false)
  const [sendMsg, setSendMsg] = useState('')

  const isImage = mode === 'image'
  const promptCount = useMemo(
    () => prompts.split('\n').map((l) => l.trim()).filter(Boolean).length,
    [prompts],
  )

  // 이미지/동영상 모드에 따라 노출되는 비율 옵션
  const ratioOptions = isImage
    ? [
        { value: '16:9', label: '16:9' },
        { value: '4:3', label: '4:3' },
        { value: '1:1', label: '1:1' },
        { value: '3:4', label: '3:4' },
        { value: '9:16', label: '9:16' },
      ]
    : [
        { value: '9:16', label: '9:16' },
        { value: '16:9', label: '16:9' },
      ]

  function handleStart() {
    if (promptCount === 0) {
      alert('프롬프트를 한 줄 이상 입력해 주세요.')
      return
    }
    setRunning(true)
  }

  // 현재 작성한 프롬프트 + 설정을 익스텐션으로 전송 (미설치 시 클립보드 폴백)
  async function handleSendToExtension() {
    const list = prompts.split('\n').map((l) => l.trim()).filter(Boolean)
    if (list.length === 0) {
      alert('프롬프트를 한 줄 이상 입력해 주세요.')
      return
    }
    const payload = {
      prompts: list,
      mode,
      submode: isImage ? undefined : submode,
      ratio,
      count,
      model: isImage ? imgModel : videoModel,
      autoTranslate,
      translateTarget,
      stylePrompt,
      filePrefix,
      delay: { min: Number(delayMin), max: Number(delayMax) },
    }
    try {
      await sendPrompts(payload)
      setSendMsg('✅ 익스텐션으로 전송했습니다. 확장앱 사이드패널을 확인하세요.')
    } catch {
      // 익스텐션 미설치/미연결 → 클립보드 폴백
      try {
        await navigator.clipboard.writeText(list.join('\n'))
        setSendMsg('⚠️ 확장앱이 감지되지 않아 프롬프트를 클립보드에 복사했습니다. 사이드패널에 붙여넣으세요.')
      } catch {
        setSendMsg('❌ 확장앱을 찾을 수 없습니다. 우측 안내에서 먼저 설치해 주세요.')
      }
    }
  }

  return (
    <section className="is-work">
      {/* 헤더 */}
      <div className="is-work-header">
        <div className="is-work-header-left">
          <img src={artStudioLogo} alt="" className="is-logo-mark-img" />
          <span className="is-logo-text">Flow 자동화</span>
          <span className="is-status">
            <span className="is-status-dot" />
            <span>Demo</span>
          </span>
        </div>
        <button type="button" className="is-btn-gold sm" onClick={() => window.open('https://labs.google/flow', '_blank')}>
          🚀 Flow 열기
        </button>
      </div>

      {/* 상단 링크바 */}
      <div className="is-toolbar">
        <button type="button" className="is-toollink">❓ 가이드</button>
        <button type="button" className="is-toollink">☕ Buy me a coffee</button>
        <a className="is-toollink" href="https://www.youtube.com/@Aicrafter-pro" target="_blank" rel="noreferrer">
          ▶ AI크래프터
        </a>
        <button type="button" className="is-toollink">📋 v2026.4.30</button>
      </div>

      {/* 프롬프트 입력 */}
      <div className="is-box">
        <div className="is-box-head">
          <span>프롬프트 입력</span>
          <div className="is-box-head-actions">
            <button type="button" className="is-mini-btn blue">📋 JSON 붙여넣기</button>
            <button type="button" className="is-mini-btn purple">📂 JSON 파일열기</button>
          </div>
        </div>

        <textarea
          className="is-textarea"
          value={prompts}
          onChange={(e) => setPrompts(e.target.value)}
          placeholder={'생성할 메인 프롬프트를 한 줄에 하나씩 적어주세요.\n\n📂 JSON 버튼으로 scene JSON 파일을 통째로 입력할 수 있습니다.'}
        />

        <div className="is-row" style={{ marginTop: 5 }}>
          <div className="is-dim">프롬프트 {promptCount}개</div>
          <div className="is-inline">
            <label className="is-check is-translate">
              <input type="checkbox" checked={autoTranslate} onChange={(e) => setAutoTranslate(e.target.checked)} />
              🌐 다국어 번역
            </label>
            <select
              className="is-select"
              value={translateTarget}
              onChange={(e) => setTranslateTarget(e.target.value)}
              disabled={!autoTranslate}
            >
              <option value="en">영어 (EN)</option>
              <option value="ja">일본어 (JA)</option>
              <option value="zh-CN">중국어 (ZH)</option>
              <option value="es">스페인어 (ES)</option>
              <option value="fr">프랑스어 (FR)</option>
            </select>
          </div>
        </div>

        <div className="is-subsection">
          <label className="is-dim">스타일 프롬프트 (선택)</label>
          <input
            type="text"
            className="is-input full"
            value={stylePrompt}
            onChange={(e) => setStylePrompt(e.target.value)}
            placeholder="예: cinematic lighting, 8k, photorealistic"
          />
        </div>
      </div>

      {/* Flow 설정 */}
      <div className="is-box">
        <div className="is-box-head"><span>Flow 설정</span></div>

        <div className="is-field">
          <label className="is-dim">모드</label>
          <ChipGroup
            options={[
              { value: 'image', label: '🖼️ 이미지' },
              { value: 'video', label: '🎬 동영상' },
            ]}
            value={mode}
            onChange={setMode}
          />
        </div>

        {!isImage && (
          <div className="is-field">
            <label className="is-dim">타입</label>
            <ChipGroup
              options={[
                { value: 'frame', label: '〔〕프레임' },
                { value: 'asset', label: '🔗 에셋' },
              ]}
              value={submode}
              onChange={setSubmode}
            />
          </div>
        )}

        <div className="is-field">
          <label className="is-dim">비율</label>
          <ChipGroup options={ratioOptions} value={ratio} onChange={setRatio} />
        </div>

        <div className="is-field">
          <label className="is-dim">수량</label>
          <ChipGroup
            options={[
              { value: 'x1', label: 'x1' },
              { value: 'x2', label: 'x2' },
              { value: 'x3', label: 'x3' },
              { value: 'x4', label: 'x4' },
            ]}
            value={count}
            onChange={setCount}
          />
        </div>

        <div className="is-field" style={{ marginBottom: 0 }}>
          <label className="is-dim">모델</label>
          {isImage ? (
            <ChipGroup
              options={[
                { value: 'Nano Banana Pro', label: '🍌 Pro' },
                { value: 'Nano Banana 2', label: '🍌 Banana 2' },
                { value: 'Imagen 4', label: '🖼️ Imagen 4' },
              ]}
              value={imgModel}
              onChange={setImgModel}
            />
          ) : (
            <ChipGroup
              options={[
                { value: 'Veo 3.1 - Lite', label: '🪶 Lite' },
                { value: 'Veo 3.1 - Fast', label: '⚡ Fast' },
                { value: 'Veo 3.1 - Quality', label: '✨ Quality' },
              ]}
              value={videoModel}
              onChange={setVideoModel}
            />
          )}
        </div>
      </div>

      {/* 작업 설정 */}
      <div className="is-box">
        <div className="is-box-head"><span>작업 설정</span></div>

        <div className="is-warn">
          <div className="is-warn-title">⚠️ 주의사항</div>
          <div className="is-warn-body">
            과도한 자동화 사용 시 <strong>계정 제한 또는 불이익</strong>이 발생할 수 있습니다.
            해당 경우 개발자가 추가적인 도움을 드리기 어렵습니다.
          </div>
        </div>

        <div className="is-row">
          <label className="is-dim">이미지 생성시간 (초)</label>
          <div className="is-inline">
            <input type="number" className="is-input num" value={delayMin} onChange={(e) => setDelayMin(e.target.value)} /> ~
            <input type="number" className="is-input num" value={delayMax} onChange={(e) => setDelayMax(e.target.value)} />
          </div>
        </div>

        <div className="is-row" style={{ marginTop: 8 }}>
          <label className="is-dim">이미지 파일명</label>
          <input type="text" className="is-input" value={filePrefix} onChange={(e) => setFilePrefix(e.target.value)} placeholder="예: 썸네일_" />
        </div>

        <div className="is-subsection">
          <div className="is-inline gap">
            <label className="is-check">
              <input type="checkbox" checked={useReference} onChange={(e) => setUseReference(e.target.checked)} /> 참조이미지
            </label>
            <label className="is-check">
              <input type="checkbox" checked={autoDownload} onChange={(e) => setAutoDownload(e.target.checked)} /> 자동 다운로드
            </label>
          </div>
        </div>
      </div>

      {/* 작업 버튼 */}
      <div className="is-btn-group">
        <button type="button" className="is-action start" onClick={handleStart} disabled={running}>▶ 작업 시작</button>
        <button type="button" className="is-action" disabled={!running}>⏸ 일시정지</button>
        <button type="button" className="is-action skip" disabled={!running}>⏭ 스킵</button>
        <button type="button" className="is-action stop" disabled={!running} onClick={() => setRunning(false)}>⏹ 중지</button>
      </div>

      {/* 익스텐션 연동 — 프롬프트/설정 전송 */}
      <button type="button" className="is-send-ext" onClick={handleSendToExtension}>
        🧩 익스텐션으로 프롬프트 보내기
      </button>
      {sendMsg && <div className="is-send-msg">{sendMsg}</div>}

      {/* 진행 상태 */}
      <div className="is-box">
        <div className="is-box-head">
          <span>진행 상태</span>
          <span className="is-gold-text">{running ? `0 / ${promptCount}` : '0 / 0'}</span>
        </div>
        <div className="is-progress"><div className="is-progress-bar" style={{ width: '0%' }} /></div>
        <div className="is-status-msg">
          {running ? '작업 준비 중… (데모 — 자동화 백엔드 미연동)' : '대기 중. 프롬프트를 입력해 주세요.'}
        </div>
      </div>
    </section>
  )
}
