import React from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

export default function PublicHeader() {
  const user = useAuthStore((s) => s.user)

  return (
    <header className="sticky top-0 z-30 before:absolute before:inset-0 before:backdrop-blur-md before:bg-gray-900/80 before:-z-10">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 border-b border-gray-700/60">

          {/* 로고 */}
          <Link to="/" className="flex items-center gap-2">
            <svg className="fill-violet-500" xmlns="http://www.w3.org/2000/svg" width="32" height="32">
              <path d="M31.956 14.8C31.372 6.92 25.08.628 17.2.044V5.76a9.04 9.04 0 0 0 0 17.08v5.716c7.88-.584 14.172-6.876 14.756-14.756zM14.8 26.924V31.9563C7.0006 31.3706.7293 25.1gst 0.006617.2H5.76a9.04 9.04 0 0 0 9.04 9.724z" />
            </svg>
            <span className="text-gray-100 font-bold text-lg">eyeDesk</span>
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
