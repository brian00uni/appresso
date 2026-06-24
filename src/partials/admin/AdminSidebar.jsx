import React, { useEffect, useRef } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import appressoLogo from '../../assets/appresso-logo.png'
import { useAuthStore } from '../../stores/authStore'

// 통합 관리자 콘솔 메뉴 (추후 메뉴는 여기에 추가)
const NAV_ITEMS = [
  {
    to: '/admin/visits',
    label: '접속 현황',
    icon: (
      <svg className="w-5 h-5 fill-current" viewBox="0 0 16 16">
        <path d="M1 1h2v12h13v2H1V1zm4 9H3V6h2v4zm4 0H7V3h2v7zm4 0h-2V5h2v5z" />
      </svg>
    ),
  },
  {
    to: '/admin/members',
    label: '회원 관리',
    icon: (
      <svg className="w-5 h-5 fill-current" viewBox="0 0 16 16">
        <path d="M5.5 7a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM1 14a4.5 4.5 0 0 1 9 0H1Zm10.5-7a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm-.5 1.5c2.1 0 3.8 1.5 4 3.5h-3.2a5.99 5.99 0 0 0-1.6-3.4c.26-.06.53-.1.8-.1Z" />
      </svg>
    ),
  },
]

export default function AdminSidebar({ sidebarOpen, setSidebarOpen }) {
  const sidebar = useRef(null)
  const trigger = useRef(null)
  const navigate = useNavigate()
  const signOut = useAuthStore((s) => s.signOut)

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

  async function handleSignOut() {
    setSidebarOpen(false)
    await signOut()
    navigate('/', { replace: true })
  }

  return (
    <div className="min-w-fit">
      {/* Backdrop (mobile) */}
      <div
        className={`fixed inset-0 bg-gray-900/30 z-40 lg:hidden transition-opacity duration-200 ${
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
      ></div>

      {/* Sidebar */}
      <div
        id="admin-sidebar"
        ref={sidebar}
        className={`flex lg:flex! flex-col fixed z-40 left-0 top-0 lg:static h-[100dvh] overflow-y-auto no-scrollbar w-64 shrink-0 bg-gray-900 p-4 transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-64 lg:translate-x-0'
        }`}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-8 px-2 pt-2">
          <Link to="/admin" onClick={() => setSidebarOpen(false)} className="flex items-center gap-2">
            <img src={appressoLogo} alt="appresso" className="h-7 w-auto" />
            <span className="text-xs font-bold text-violet-400 bg-violet-500/15 px-2 py-0.5 rounded-full">ADMIN</span>
          </Link>
          <button
            ref={trigger}
            className="ml-auto lg:hidden text-gray-400 hover:text-gray-200"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-controls="admin-sidebar"
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
                end={item.to === '/admin/visits'}
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
        </ul>

        {/* 하단: 앱 바로가기 + 로그아웃 */}
        <div className="mt-auto pt-4 space-y-1 border-t border-gray-800">
          <Link
            to="/dashboard"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-gray-100 hover:bg-gray-800/60 transition-colors"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 16 16"><path d="M8 0 0 6v10h6V10h4v6h6V6L8 0Z" /></svg>
            <span>가성비대장</span>
          </Link>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-gray-100 hover:bg-gray-800/60 transition-colors"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 16 16"><path d="M10 1v2H3v10h7v2H1V1h9zm3.7 7l-3-3 1.4-1.4L16.5 8l-4.4 4.4-1.4-1.4 3-3H6V7h7.7z" /></svg>
            <span>로그아웃</span>
          </button>
        </div>
      </div>
    </div>
  )
}
