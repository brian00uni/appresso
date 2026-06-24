import React, { useState } from 'react'
import { Outlet, Navigate, Link } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import AdminSidebar from '../../partials/admin/AdminSidebar'

// 통합 관리자 콘솔 레이아웃 — role==='admin' 만 접근 가능
export default function AdminLayout() {
  const { user, loading, profile, profileLoaded } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (loading || (user && !profileLoaded)) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  // 관리자가 아니면 가성비대장으로 돌려보냄
  if (profile?.role !== 'admin') return <Navigate to="/dashboard" replace />

  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden bg-gray-50 dark:bg-gray-900">
        {/* 모바일 상단 바 */}
        <div className="lg:hidden sticky top-0 z-30 flex items-center h-14 px-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur border-b border-gray-200 dark:border-gray-700/60">
          <button onClick={() => setSidebarOpen(true)} aria-label="메뉴 열기" className="text-gray-500 dark:text-gray-300">
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h16v2H4v-2z" /></svg>
          </button>
          <Link to="/admin" className="ml-3 text-sm font-bold text-gray-700 dark:text-gray-200">관리자 콘솔</Link>
        </div>
        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
