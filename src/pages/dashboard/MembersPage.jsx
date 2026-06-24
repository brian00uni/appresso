import React, { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import { roleLabel } from '../../lib/accounts'

const ROLE_OPTIONS = [
  { v: 'general', l: '일반회원' },
  { v: 'vip', l: 'VIP회원' },
  { v: 'admin', l: '관리자' },
]

export default function MembersPage() {
  const role = useAuthStore((s) => s.profile?.role) || 'general'
  const myId = useAuthStore((s) => s.user?.id)

  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, name, contact, role, status, created_at')
        .order('created_at', { ascending: true })
      if (error) throw error
      setMembers(data || [])
    } catch (e) {
      setError(`회원 목록을 불러오지 못했습니다: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (role === 'admin') load()
  }, [role, load])

  async function changeRole(id, newRole) {
    setBusyId(id)
    try {
      const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', id)
      if (error) throw error
      setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, role: newRole } : m)))
    } catch (e) {
      alert(`등급 변경 실패: ${e.message}`)
    } finally {
      setBusyId(null)
    }
  }

  async function setStatus(id, status) {
    const label = status === 'withdrawn' ? '탈퇴 처리' : '복구'
    if (!window.confirm(`이 회원을 ${label} 하시겠습니까?`)) return
    setBusyId(id)
    try {
      const { error } = await supabase.from('profiles').update({ status }).eq('id', id)
      if (error) throw error
      setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)))
    } catch (e) {
      alert(`${label} 실패: ${e.message}`)
    } finally {
      setBusyId(null)
    }
  }

  if (role !== 'admin') {
    return (
      <div className="max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700/60 p-6 text-sm text-gray-500 dark:text-gray-400">
          이 페이지는 <span className="font-semibold text-gray-700 dark:text-gray-200">관리자</span>만 접근할 수 있습니다.
        </div>
      </div>
    )
  }

  const active = members.filter((m) => m.status !== 'withdrawn')

  return (
    <div>
      <div className="mb-6 flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">회원 관리</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            전체 가입자 {members.length}명 · 활성 {active.length}명 · 탈퇴 {members.length - active.length}명
          </p>
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
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700/60 overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700/60 text-xs text-gray-500 dark:text-gray-400 uppercase">
                <th className="px-4 py-3 font-medium text-left">이름</th>
                <th className="px-4 py-3 font-medium text-left">이메일 / 아이디</th>
                <th className="px-4 py-3 font-medium text-left">연락처</th>
                <th className="px-4 py-3 font-medium text-left">등급</th>
                <th className="px-4 py-3 font-medium text-center">상태</th>
                <th className="px-4 py-3 font-medium text-right">가입일</th>
                <th className="px-4 py-3 font-medium text-right">관리</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => {
                const withdrawn = m.status === 'withdrawn'
                const isSelf = m.id === myId
                return (
                  <tr key={m.id} className={`border-b border-gray-100 dark:border-gray-700/40 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors ${withdrawn ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3 font-semibold text-gray-800 dark:text-gray-100">{m.name || '-'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{m.email}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{m.contact || '-'}</td>
                    <td className="px-4 py-3">
                      {m.role === 'admin' ? (
                        // 관리자 등급은 변경 불가
                        <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-violet-500/15 text-violet-400">관리자</span>
                      ) : (
                        <select
                          value={m.role}
                          disabled={busyId === m.id || withdrawn}
                          onChange={(e) => changeRole(m.id, e.target.value)}
                          className="text-sm bg-transparent border border-gray-200 dark:border-gray-700/60 text-gray-700 dark:text-gray-200 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50"
                        >
                          {ROLE_OPTIONS.filter((o) => o.v !== 'admin').map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${withdrawn ? 'bg-red-500/15 text-red-400' : 'bg-emerald-500/15 text-emerald-400'}`}>
                        {withdrawn ? '탈퇴' : '활성'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-400">{(m.created_at || '').slice(0, 10)}</td>
                    <td className="px-4 py-3 text-right">
                      {withdrawn ? (
                        <button
                          onClick={() => setStatus(m.id, 'active')}
                          disabled={busyId === m.id}
                          className="text-xs px-2.5 py-1.5 rounded-lg border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 transition-colors disabled:opacity-50"
                        >
                          복구
                        </button>
                      ) : (
                        <button
                          onClick={() => setStatus(m.id, 'withdrawn')}
                          disabled={busyId === m.id || isSelf}
                          title={isSelf ? '본인 계정은 여기서 탈퇴할 수 없습니다' : ''}
                          className="text-xs px-2.5 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-30"
                        >
                          탈퇴
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
              {members.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400 dark:text-gray-500">가입자가 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">* 등급 변경은 즉시 반영됩니다. 탈퇴는 소프트 삭제(상태 변경)이며 로그인이 차단됩니다.</p>
    </div>
  )
}
