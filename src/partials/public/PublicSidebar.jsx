import React, { useEffect, useRef } from 'react'
import { NavLink, Link } from 'react-router-dom'
import appressoLogo from '../../assets/appresso-logo.png'
import VisitCounter from '../../components/VisitCounter'

const NAV_ITEMS = [
  {
    to: '/youtube',
    label: '유튜브 분석',
    icon: (
      <svg className="w-5 h-5 fill-current" viewBox="0 0 16 16">
        <path d="M6 4.5v7l6-3.5-6-3.5zM8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0z" />
      </svg>
    ),
  },
  {
    to: '/trend',
    label: '조회수가 터진 영상',
    icon: (
      <svg className="w-5 h-5 fill-current" viewBox="0 0 16 16">
        <path d="M1 11l4-4 3 3 6-6 1.5 1.5L8 13 5 10l-2.5 2.5L1 11z" />
      </svg>
    ),
  },
  {
    to: '/trend-hub',
    label: '트렌드 허브',
    icon: (
      <svg className="w-5 h-5 fill-current" viewBox="0 0 16 16">
        <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0zM8 3a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm5 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM8 11a1 1 0 1 1 0 2 1 1 0 0 1 0-2zM5 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
      </svg>
    ),
  },
]

export default function PublicSidebar({ sidebarOpen, setSidebarOpen, counts }) {
  const sidebar = useRef(null)
  const trigger = useRef(null)

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
      {/* Backdrop (mobile) */}
      <div
        className={`fixed inset-0 bg-gray-900/30 z-40 lg:hidden transition-opacity duration-200 ${
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
      ></div>

      {/* Sidebar */}
      <div
        id="public-sidebar"
        ref={sidebar}
        className={`flex lg:flex! flex-col fixed z-40 left-0 top-0 lg:static h-[100dvh] overflow-y-auto no-scrollbar w-64 shrink-0 bg-gray-900 p-4 transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-64 lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="relative flex items-center justify-center mb-8 px-2 pt-2">
          <Link to="/" onClick={() => setSidebarOpen(false)}>
            <img src={appressoLogo} alt="appresso" className="h-12 w-auto" />
          </Link>
          {/* Close button (mobile) */}
          <button
            ref={trigger}
            className="absolute right-0 top-2 lg:hidden text-gray-400 hover:text-gray-200"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-controls="public-sidebar"
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

        {/* 방문 카운터 */}
        <div className="mt-auto pt-4">
          <VisitCounter counts={counts} showApp />
        </div>
      </div>
    </div>
  )
}
