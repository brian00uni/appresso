import React, { useEffect, useState } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { hydrate } from '../lib/gaseongbi/remoteSync'
import GaseongbiSidebar from '../partials/gaseongbi/GaseongbiSidebar'
import GaseongbiHeader from '../partials/gaseongbi/GaseongbiHeader'

export default function DashboardLayout() {
  const { user, loading, profile, signOut } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  // 로그인 확정 후 Supabase 데이터로 로컬 캐시를 채운 뒤에 자식 페이지를 렌더한다.
  useEffect(() => {
    if (!user) return
    let active = true
    hydrate(user.id).finally(() => {
      if (active) setHydrated(true)
    })
    return () => {
      active = false
    }
  }, [user?.id])

  // 탈퇴(withdrawn) 계정은 로그인 차단
  useEffect(() => {
    if (profile?.status === 'withdrawn') signOut()
  }, [profile?.status, signOut])

  if (profile?.status === 'withdrawn') return <Navigate to="/login" replace />

  if (loading || (user && !hydrated)) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  return (
    <div className="flex h-screen overflow-hidden">
      <GaseongbiSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden bg-gray-50 dark:bg-gray-900">
        <GaseongbiHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
