import React from 'react'
import { Link } from 'react-router-dom'
import PublicHeader from '../../partials/PublicHeader'

const appList = [
  {
    id: 'fortune-cookie',
    name: '포춘쿠키',
    emoji: '🥠',
    desc: '쿠키를 깨면 오늘의 운세를 알 수 있어요',
    color: 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30',
  },
  // 앱 추가 예정
]

export default function AppsPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <PublicHeader />

      <main className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-100">Funny App</h1>
          <p className="text-gray-400 mt-1 text-sm">재미있는 미니 앱들을 즐겨보세요</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {appList.map((app) => (
            <Link
              key={app.id}
              to={`/apps/${app.id}`}
              className={`bg-gradient-to-br ${app.color} bg-gray-800 border rounded-2xl p-6 hover:scale-105 transition-transform group`}
            >
              <div className="text-5xl mb-4">{app.emoji}</div>
              <h2 className="text-lg font-bold text-gray-100 group-hover:text-violet-400 transition-colors">{app.name}</h2>
              <p className="text-sm text-gray-400 mt-1">{app.desc}</p>
              <div className="mt-4 flex items-center gap-1 text-xs text-violet-400 font-medium">
                <span>앱 열기</span>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}

          {/* 준비 중 카드 */}
          <div className="bg-gray-800/50 border border-gray-700/60 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center opacity-50">
            <div className="text-4xl mb-3">✨</div>
            <p className="text-sm text-gray-500">새 앱 준비 중...</p>
          </div>
        </div>
      </main>
    </div>
  )
}
