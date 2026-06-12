import React, { useEffect } from 'react'
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'

import './css/style.css'
import './charts/ChartjsConfig'

// Public pages
import YouTubePage from './pages/public/YouTubePage'
import TrendFinderPage from './pages/public/TrendFinderPage'
import AppsPage from './pages/public/AppsPage'
import LoginPage from './pages/LoginPage'

// App pages (standalone, no layout)
import FortuneCookie from './pages/apps/FortuneCookie'

// Dashboard layout + pages
import DashboardLayout from './pages/DashboardLayout'
import Dashboard from './pages/Dashboard'

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
      <Route path="/" element={<YouTubePage />} />
      <Route path="/trend" element={<TrendFinderPage />} />
      <Route path="/apps" element={<AppsPage />} />
      <Route path="/apps/fortune-cookie" element={<FortuneCookie />} />
      <Route path="/login" element={<LoginPage />} />

      {/* 대시보드 (로그인 필요) */}
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="youtube" element={<YouTubePage embedded />} />
        <Route path="apps" element={<AppsPage embedded />} />
        <Route path="apps/fortune-cookie" element={<FortuneCookie />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return <AppRoutes />
}
