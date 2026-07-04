import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import BrandPanel from './BrandPanel'
import InfoPanel from './InfoPanel'
import { trackVisit } from '../../lib/visits'
import '../artStudio/artStudio.css' // 공통 골드 다크 테마 재사용 (2단 레이아웃 포함)
import './writingStudio.css'

/**
 * Writing Studio — 네이버 블로그 AI 글쓰기 확장앱 랜딩/안내
 * (art-studio 포맷 재사용: 좌 브랜드 / 우 안내)
 */
export default function WritingStudioPage() {
  useEffect(() => { trackVisit('writing') }, [])

  return (
    <div className="is-page ws-page">
      <Link to="/" className="is-home-fixed">← 홈으로 돌아가기</Link>
      <div className="is-layout">
        <BrandPanel />
        <InfoPanel />
      </div>
    </div>
  )
}
