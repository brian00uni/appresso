import React from 'react'
import LoginPanel from './LoginPanel'
import WorkPanel from './WorkPanel'
import ExtensionPanel from './ExtensionPanel'
import './artStudio.css'

/**
 * Art Studio — AI 이미지 자동생성 앱 서비스 랜딩/메인
 * 좌: 구글 로그인 / 중앙: 프롬프트 작업 패널 / 우: 크롬 확장앱 안내
 */
export default function ArtStudioPage() {
  return (
    <div className="is-page">
      <div className="is-layout">
        <LoginPanel />
        <WorkPanel />
        <ExtensionPanel />
      </div>
    </div>
  )
}
