import React from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import appressoLogo from '../assets/appresso-logo.png'

export default function PublicHeader() {
  const user = useAuthStore((s) => s.user)

  return (
    <header className="sticky top-0 z-30 before:absolute before:inset-0 before:backdrop-blur-md before:bg-gray-900/80 before:-z-10">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 border-b border-gray-700/60">

          {/* 로고 */}
          <Link to="/" className="flex items-center">
            <img src={appressoLogo} alt="appresso" className="h-8 w-auto" />
          </Link>

          {/* 네비게이션 */}
          <nav className="hidden md:flex items-center gap-1">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-violet-400 bg-violet-500/10'
                    : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800'
                }`
              }
            >
              홈
            </NavLink>
            <NavLink
              to="/youtube"
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-violet-400 bg-violet-500/10'
                    : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800'
                }`
              }
            >
              유튜브 분석
            </NavLink>
            <NavLink
              to="/trend"
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-violet-400 bg-violet-500/10'
                    : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800'
                }`
              }
            >
              조회수가 터진 영상
            </NavLink>
            <NavLink
              to="/apps"
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-violet-400 bg-violet-500/10'
                    : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800'
                }`
              }
            >
              Funny App
            </NavLink>
          </nav>

          {/* 우측 버튼 */}
          <div className="flex items-center gap-2">
            {user ? (
              <Link
                to="/dashboard"
                className="btn bg-violet-500 hover:bg-violet-600 text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors"
              >
                대시보드
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-medium text-gray-400 hover:text-gray-100 px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  로그인
                </Link>
                <Link
                  to="/apps"
                  className="btn bg-violet-500 hover:bg-violet-600 text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Funny App
                </Link>
              </>
            )}
          </div>

        </div>
      </div>
    </header>
  )
}
