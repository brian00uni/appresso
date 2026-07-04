import React, { useEffect } from 'react'
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import ThemeProvider from './utils/ThemeContext'

import './css/style.css'
import './charts/ChartjsConfig'

// Public pages
import HomePage from './pages/public/HomePage'
import YouTubePage from './pages/public/YouTubePage'
import TrendFinderPage from './pages/public/TrendFinderPage'
import AppsPage from './pages/public/AppsPage'
import LoginPage from './pages/LoginPage'

// App pages (standalone, no layout)
import FortuneCookie from './pages/apps/FortuneCookie'
import LottoRecommend from './pages/apps/LottoRecommend'
import LottoMachine from './pages/apps/LottoMachine'
import ArtStudioPage from './pages/artStudio/ArtStudioPage'
import EraserStudioPage from './pages/eraserStudio/EraserStudioPage'
import VideoDlStudioPage from './pages/videoDlStudio/VideoDlStudioPage'
import WritingStudioPage from './pages/writingStudio/WritingStudioPage'

// Dashboard layout + pages
import DashboardLayout from './pages/DashboardLayout'

// 가성비대장 (대시보드 작업영역)
import GaseongbiDashboardPage from './pages/dashboard/gaseongbi/GaseongbiDashboardPage'
import MenuManagementPage from './pages/dashboard/gaseongbi/MenuManagementPage'
import MarginCalculatorPage from './pages/dashboard/gaseongbi/MarginCalculatorPage'
import PlatformComparisonPage from './pages/dashboard/gaseongbi/PlatformComparisonPage'
import ProfitReportPage from './pages/dashboard/gaseongbi/ProfitReportPage'
import ProfitReportDetailPage from './pages/dashboard/gaseongbi/ProfitReportDetailPage'
import BenchmarkingPage from './pages/dashboard/gaseongbi/BenchmarkingPage'
import AdAnalysisPage from './pages/dashboard/gaseongbi/AdAnalysisPage'
import SettingsPage from './pages/dashboard/gaseongbi/SettingsPage'
import ProfilePage from './pages/dashboard/ProfilePage'

// 통합 관리자 콘솔
import AdminLayout from './pages/admin/AdminLayout'
import AdminMembersPage from './pages/admin/MembersPage'
import AdminVisitsPage from './pages/admin/VisitsPage'

function AppRoutes() {
  useAuth()

  const location = useLocation()
  useEffect(() => {
    document.querySelector('html').style.scrollBehavior = 'auto'
    window.scroll({ top: 0 })
    document.querySelector('html').style.scrollBehavior = ''
  }, [location.pathname])

  return (
    <Routes>
      {/* 공개 페이지 */}
      <Route path="/" element={<HomePage />} />
      <Route path="/youtube" element={<YouTubePage />} />
      <Route path="/trend" element={<TrendFinderPage />} />
      <Route path="/apps" element={<AppsPage />} />
      <Route path="/apps/fortune-cookie" element={<FortuneCookie />} />
      <Route path="/apps/lotto" element={<LottoRecommend />} />
      <Route path="/apps/lotto-machine" element={<LottoMachine />} />
      <Route path="/art-studio" element={<ArtStudioPage />} />
      <Route path="/eraser-studio" element={<EraserStudioPage />} />
      <Route path="/video-dl-studio" element={<VideoDlStudioPage />} />
      <Route path="/writing-studio" element={<WritingStudioPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin/login" element={<LoginPage allowSignup={false} />} />
      <Route path="/dashboard/report/detail" element={<ProfitReportDetailPage />} />

      {/* 대시보드 (로그인 필요) — 가성비대장 */}
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<GaseongbiDashboardPage />} />
        <Route path="menu" element={<MenuManagementPage />} />
        <Route path="calculator" element={<MarginCalculatorPage />} />
        <Route path="compare" element={<PlatformComparisonPage />} />
        <Route path="report" element={<ProfitReportPage />} />
        <Route path="ads" element={<AdAnalysisPage />} />
        <Route path="benchmark" element={<BenchmarkingPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="apps/fortune-cookie" element={<FortuneCookie />} />
        <Route path="apps/lotto" element={<LottoRecommend />} />
        <Route path="apps/lotto-machine" element={<LottoMachine />} />
      </Route>

      {/* 통합 관리자 콘솔 (admin 전용) */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminVisitsPage />} />
        <Route path="visits" element={<AdminVisitsPage />} />
        <Route path="members" element={<AdminMembersPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AppRoutes />
    </ThemeProvider>
  )
}
