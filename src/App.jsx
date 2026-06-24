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
      <Route path="/login" element={<LoginPage />} />
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
        <Route path="apps/fortune-cookie" element={<FortuneCookie />} />
        <Route path="apps/lotto" element={<LottoRecommend />} />
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
