import React from 'react'
import { Link } from 'react-router-dom'
import LoginPanel from './LoginPanel'
import InfoPanel from './InfoPanel'
import './artStudio.css'

/**
 * Art Studio — AI 이미지 자동생성 앱 서비스 랜딩/메인
 * 좌: 구글 계정(로그인/연동) / 우: 안내 + 확장앱 (InfoPanel)
 */
export default function ArtStudioPage() {
  return (
    <div className="is-page">
      <Link to="/" className="is-home-fixed">← 홈으로 돌아가기</Link>
      <div className="is-layout">
        <LoginPanel />
        <InfoPanel />
      </div>
    </div>
  )
}
