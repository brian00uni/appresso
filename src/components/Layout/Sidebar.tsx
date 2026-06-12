import { NavLink } from 'react-router-dom'
import { LogOut, Building2 } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { clsx } from 'clsx'
import { 메뉴목록 } from '../../config/navigation'

export default function Sidebar() {
  const { user, signOut } = useAuthStore()

  return (
    <aside className="w-60 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700/60 flex flex-col">
      {/* 로고 */}
      <div className="h-16 flex items-center gap-2 px-5 border-b border-gray-200 dark:border-gray-700/60">
        <Building2 className="w-6 h-6 text-brand-500" />
        <span className="font-bold text-gray-900 dark:text-gray-100 text-base">아이데스크</span>
      </div>

      {/* 네비게이션 */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {메뉴목록.map(({ 경로, 아이콘: Icon, 이름 }) => (
          <NavLink
            key={경로}
            to={경로}
            end={경로 === '/'}
            className={({ isActive }) =>
              clsx('sidebar-item', isActive && 'active')
            }
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span>{이름}</span>
          </NavLink>
        ))}
      </nav>

      {/* 하단 사용자 정보 */}
      <div className="border-t border-gray-200 dark:border-gray-700/60 p-3">
        <div className="flex items-center gap-3 px-2 py-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-400 font-semibold text-sm flex-shrink-0">
            {user?.email?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-900 dark:text-gray-200 truncate">{user?.email ?? '사용자'}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">직원</p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="sidebar-item w-full text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600"
        >
          <LogOut className="w-4 h-4" />
          <span>로그아웃</span>
        </button>
      </div>
    </aside>
  )
}
