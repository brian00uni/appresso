import React, { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import VisitBarChart from '../../components/admin/VisitBarChart'
import VisitTrendChart from '../../components/admin/VisitTrendChart'

// 앱 키 → 표시 이름
const APP_LABELS = {
  home: '홈',
  youtube: '유튜브 분석',
  trend: '조회수 터진 영상',
  'fortune-cookie': '포춘쿠키',
  lotto: '로또 추천',
}

function fmt(n) {
  return Number(n || 0).toLocaleString('ko-KR')
}

export default function AdminVisitsPage() {
  const role = useAuthStore((s) => s.profile?.role) || 'general'

  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data, error } = await supabase.rpc('get_visit_stats', { p_days: 14 })
      if (error) throw error
      setStats(data)
    } catch (e) {
      setError(`접속 현황을 불러오지 못했습니다: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (role === 'admin') load()
  }, [role, load])

  if (role !== 'admin') {
    return (
      <div className="max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700/60 p-6 text-sm text-gray-500 dark:text-gray-400">
          이 페이지는 <span className="font-semibold text-gray-700 dark:text-gray-200">관리자</span>만 접근할 수 있습니다.
        </div>
      </div>
    )
  }

  const byApp = stats?.byApp ?? []
  const daily = stats?.daily ?? []
  const rows = byApp.map((r) => ({ label: APP_LABELS[r.app] || r.app, total: r.total, today: r.today }))
  const siteTotal = byApp.reduce((s, r) => s + (r.total || 0), 0)
  const siteToday = byApp.reduce((s, r) => s + (r.today || 0), 0)
  const topApp = rows[0]

  return (
    <div>
      <div className="mb-6 flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">접속 현황</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">앱 서비스별 방문 현황입니다. (최근 14일 추이)</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700/60 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors disabled:opacity-50"
        >
          새로고침
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-lg mb-4">{error}</p>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-7 h-7 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* 요약 카드 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <SummaryCard label="전체 방문" value={fmt(siteTotal)} />
            <SummaryCard label="오늘 방문" value={fmt(siteToday)} accent />
            <SummaryCard label="최다 방문 앱" value={topApp ? `${topApp.label} (${fmt(topApp.total)})` : '-'} />
          </div>

          {/* 차트 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700/60 p-5">
              <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-3">앱별 방문 (전체 · 오늘)</h2>
              {rows.length ? <VisitBarChart rows={rows} /> : <Empty />}
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700/60 p-5">
              <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-3">일자별 방문 추이 (최근 14일)</h2>
              {daily.length ? <VisitTrendChart points={daily} /> : <Empty />}
            </div>
          </div>

          {/* 앱별 표 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700/60 overflow-x-auto mt-4">
            <table className="w-full text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700/60 text-xs text-gray-500 dark:text-gray-400 uppercase">
                  <th className="px-4 py-3 font-medium text-left">앱 서비스</th>
                  <th className="px-4 py-3 font-medium text-right">전체 방문</th>
                  <th className="px-4 py-3 font-medium text-right">오늘 방문</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.label} className="border-b border-gray-100 dark:border-gray-700/40 last:border-0">
                    <td className="px-4 py-3 font-semibold text-gray-800 dark:text-gray-100">{r.label}</td>
                    <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-300">{fmt(r.total)}</td>
                    <td className="px-4 py-3 text-right text-violet-500 dark:text-violet-400 font-medium">{fmt(r.today)}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={3} className="px-4 py-10 text-center text-gray-400 dark:text-gray-500">아직 방문 데이터가 없습니다.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

function SummaryCard({ label, value, accent }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700/60 p-5">
      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</div>
      <div className={`text-2xl font-bold ${accent ? 'text-violet-500 dark:text-violet-400' : 'text-gray-800 dark:text-gray-100'}`}>{value}</div>
    </div>
  )
}

function Empty() {
  return <div className="h-64 flex items-center justify-center text-sm text-gray-400 dark:text-gray-500">데이터 없음</div>
}
