import React, { useEffect, useRef } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { getStoreInfo } from '../../lib/gaseongbi/storage'
import { useAuthStore } from '../../stores/authStore'

const NAV_ITEMS = [
  {
    to: '/dashboard',
    label: '대시보드',
    end: true,
    icon: (
      <svg className="w-5 h-5 fill-current" viewBox="0 0 16 16">
        <path d="M8 0 0 6v10h6V10h4v6h6V6L8 0Z" />
      </svg>
    ),
  },
  {
    to: '/dashboard/menu',
    label: '메뉴관리',
    icon: (
      <svg className="w-5 h-5 fill-current" viewBox="0 0 16 16">
        <path d="M1 2h14v2H1V2zm0 5h14v2H1V7zm0 5h14v2H1v-2z" />
      </svg>
    ),
  },
  {
    to: '/dashboard/calculator',
    label: '마진계산',
    icon: (
      <svg className="w-5 h-5 fill-current" viewBox="0 0 16 16">
        <path d="M3 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H3zm0 2h10v3H3V2zm0 5h2v2H3V7zm4 0h2v2H7V7zm4 0h2v5h-2V7zM3 11h2v2H3v-2zm4 0h2v2H7v-2z" />
      </svg>
    ),
  },
  {
    to: '/dashboard/compare',
    label: '플랫폼비교',
    icon: (
      <svg className="w-5 h-5 fill-current" viewBox="0 0 16 16">
        <path d="M4.5 0 1 3.5 4.5 7V5a4 4 0 0 1 4 4h1.5a5.5 5.5 0 0 0-5.5-5.5V0zm7 9-3.5 3.5L11.5 16v-2a4 4 0 0 1-4-4H6a5.5 5.5 0 0 0 5.5 5.5V16z" />
      </svg>
    ),
  },
  {
    to: '/dashboard/report',
    label: '손익리포트',
    icon: (
      <svg className="w-5 h-5 fill-current" viewBox="0 0 16 16">
        <path d="M1 1h2v14H1V1zm4 6h2v8H5V7zm4-4h2v12H9V3zm4 2h2v10h-2V5z" />
      </svg>
    ),
  },
  {
    to: '/dashboard/benchmark',
    label: '벤치마킹 (AI 리포트)',
    icon: (
      <svg className="w-5 h-5 fill-current" viewBox="0 0 16 16">
        <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0Zm0 3a5 5 0 1 1 0 10A5 5 0 0 1 8 3Zm0 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" />
      </svg>
    ),
  },
  {
    to: '/dashboard/ads',
    label: '광고비분석',
    icon: (
      <svg className="w-5 h-5 fill-current" viewBox="0 0 16 16">
        <path d="M1 5v6a1 1 0 0 0 1 1h2l4 3.5v-14L4 5H2a1 1 0 0 0-1 1Zm12.5 7.5L11 10V6l2.5-2.5a6 6 0 0 1 0 9ZM12 8a3 3 0 0 1-1 2.24V5.76A3 3 0 0 1 12 8Z" />
      </svg>
    ),
  },
  {
    to: '/dashboard/settings',
    label: '설정',
    icon: (
      <svg className="w-5 h-5 fill-current" viewBox="0 0 16 16">
        <path d="M10.5 1a3.5 3.5 0 0 1 3.355 2.5H15a1 1 0 1 1 0 2h-1.145a3.5 3.5 0 0 1-6.71 0H1a1 1 0 0 1 0-2h6.145A3.5 3.5 0 0 1 10.5 1ZM9 4.5a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0ZM5.5 9a3.5 3.5 0 0 1 3.355 2.5H15a1 1 0 1 1 0 2H8.855a3.5 3.5 0 0 1-6.71 0H1a1 1 0 1 1 0-2h1.145A3.5 3.5 0 0 1 5.5 9ZM4 12.5a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0Z" />
      </svg>
    ),
  },
]

export default function GaseongbiSidebar({ sidebarOpen, setSidebarOpen }) {
  const sidebar = useRef(null)
  const trigger = useRef(null)
  const storeInfo = getStoreInfo()
  const isAdmin = useAuthStore((s) => s.profile?.role) === 'admin'

  useEffect(() => {
    const clickHandler = ({ target }) => {
      if (!sidebar.current || !trigger.current) return
      if (!sidebarOpen || sidebar.current.contains(target) || trigger.current.contains(target)) return
      setSidebarOpen(false)
    }
    document.addEventListener('click', clickHandler)
    return () => document.removeEventListener('click', clickHandler)
  })

  useEffect(() => {
    const keyHandler = ({ keyCode }) => {
      if (!sidebarOpen || keyCode !== 27) return
      setSidebarOpen(false)
    }
    document.addEventListener('keydown', keyHandler)
    return () => document.removeEventListener('keydown', keyHandler)
  })

  return (
    <div className="min-w-fit">
      {/* Sidebar backdrop (mobile only) */}
      <div
        className={`fixed inset-0 bg-gray-900/30 z-40 lg:hidden transition-opacity duration-200 ${
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
      ></div>

      {/* Sidebar */}
      <div
        id="sidebar"
        ref={sidebar}
        className={`flex lg:flex! flex-col fixed z-40 left-0 top-0 lg:static h-[100dvh] overflow-y-auto no-scrollbar w-64 shrink-0 bg-gray-900 p-4 transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-64 lg:translate-x-0'
        }`}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-8 px-2 pt-2">
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center shrink-0 p-2">
            <svg className="w-full h-full fill-current" viewBox="0 0 24 24">
              <path d="M2 7l3 3 4-5 3 4 3-4 4 5 3-3-1.5 11h-17L2 7zm1.5 13h17v1.5h-17V20z" />
            </svg>
          </div>
          <div>
            <div className="text-base font-bold text-white leading-tight">가성비대장</div>
            <div className="text-[11px] text-gray-400 leading-tight">남는 돈이 진짜 실력입니다</div>
          </div>
          {/* Close button (mobile) */}
          <button
            ref={trigger}
            className="ml-auto lg:hidden text-gray-400 hover:text-gray-200"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-controls="sidebar"
            aria-expanded={sidebarOpen}
          >
            <span className="sr-only">Close sidebar</span>
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M10.7 18.7l1.4-1.4L7.8 13H20v-2H7.8l4.3-4.3-1.4-1.4L4 12z" />
            </svg>
          </button>
        </div>

        {/* Nav */}
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => (
            <li key={item.to}>
              <NavLink
                end={item.end}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-violet-500/15 text-violet-400'
                      : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800/60'
                  }`
                }
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}

          {/* 관리자 콘솔 바로가기 (admin 전용) */}
          {isAdmin && (
            <li>
              <NavLink
                to="/admin"
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-violet-500/15 text-violet-400'
                      : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800/60'
                  }`
                }
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 16 16">
                  <path d="M8 0l7 3v5c0 3.5-2.6 6.7-7 8-4.4-1.3-7-4.5-7-8V3l7-3zm0 2.2L3 4.3V8c0 2.5 1.8 4.9 5 6 3.2-1.1 5-3.5 5-6V4.3L8 2.2z" />
                </svg>
                <span>관리자 콘솔</span>
              </NavLink>
            </li>
          )}
        </ul>

        {/* 매장 카드 */}
        <div className="mt-auto pt-4">
          <div className="rounded-xl bg-gray-800/60 border border-gray-700/60 p-4">
            <div className="text-xs text-gray-400 mb-1">내 매장</div>
            <div className="text-sm font-semibold text-white truncate mb-2">{storeInfo.storeName || '내 가게'}</div>
            <Link to="/dashboard/settings" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
              매장 정보 관리 →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
