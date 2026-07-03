import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import BrandPanel from './BrandPanel'
import InfoPanel from './InfoPanel'
import { trackVisit } from '../../lib/visits'
import '../artStudio/artStudio.css' // 공통 골드 다크 테마 재사용 (2단 레이아웃 포함)
import './videoDlStudio.css'         // VideoDL 전용 스코프 조정

/**
 * VideoDL Studio — 영상 일괄 다운로드 확장앱 랜딩/안내
 * (art-studio 포맷 재사용, 다운로더는 로그인 불필요 → 단일 InfoPanel 컬럼)
 */
export default function VideoDlStudioPage() {
  useEffect(() => { trackVisit('videodl') }, [])

  return (
    <div className="is-page vdl-page">
      <Link to="/" className="is-home-fixed">← 홈으로 돌아가기</Link>
      <div className="is-layout">
        <BrandPanel />
        <InfoPanel />
      </div>
    </div>
  )
}
