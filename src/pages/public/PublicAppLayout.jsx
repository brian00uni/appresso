import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import PublicSidebar from '../../partials/public/PublicSidebar'
import appressoLogo from '../../assets/appresso-logo.png'
import { useVisit } from '../../lib/visits'

// 공개 분석 페이지(유튜브 분석 / 조회수가 터진 영상)용 레이아웃.
// 가성비대장 대시보드처럼 좌측 사이드바(로고 + 메뉴 + 방문 카운터)를 두고,
// appKey 기준으로 방문을 집계한다.
export default function PublicAppLayout({ appKey, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const counts = useVisit(appKey)

  return (
    <div className="flex h-screen overflow-hidden bg-gray-900 text-gray-100">
      <PublicSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} counts={counts} />

      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        {/* 모바일 상단 바 (사이드바 토글) */}
        <div className="lg:hidden sticky top-0 z-30 flex items-center h-14 px-4 bg-gray-900/90 backdrop-blur border-b border-gray-700/60">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="메뉴 열기"
            className="text-gray-300 hover:text-gray-100"
          >
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
              <path d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h16v2H4v-2z" />
            </svg>
          </button>
          <Link to="/" className="ml-3">
            <img src={appressoLogo} alt="appresso" className="h-6 w-auto" />
          </Link>
        </div>

        {children}
      </div>
    </div>
  )
}
