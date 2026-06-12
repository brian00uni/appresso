import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import { 메뉴목록 } from '../../config/navigation'

const 페이지제목: Record<string, string> = Object.fromEntries(
  메뉴목록.map(({ 경로, 이름 }) => [경로, 이름])
)

export default function AppLayout() {
  const { pathname } = useLocation()
  const 제목 = 페이지제목[pathname] ?? '아이데스크'

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 제목={제목} />
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
