import React from 'react'
import { useAuthStore } from '../../stores/authStore'
import { roleLabel } from '../../lib/accounts'

// 목업 샘플 — 추후 실제 가입자(profiles) 데이터로 교체 예정
const MOCK_MEMBERS = [
  { id: 1, name: '김상우', email: 'sangwoo@example.com', contact: '010-1234-5678', role: 'vip', joinedAt: '2026-01-12' },
  { id: 2, name: '이정민', email: 'jm.lee@example.com', contact: '010-2222-3333', role: 'general', joinedAt: '2026-02-03' },
  { id: 3, name: '박서연', email: 'seoyeon@example.com', contact: '010-4455-6677', role: 'general', joinedAt: '2026-02-20' },
  { id: 4, name: '최도현', email: 'dohyun.choi@example.com', contact: '010-7788-9900', role: 'vip', joinedAt: '2026-03-05' },
  { id: 5, name: '정하늘', email: 'haneul@example.com', contact: '010-1212-3434', role: 'general', joinedAt: '2026-03-18' },
  { id: 6, name: '관리자', email: 'admin@appresso.app', contact: '010-0000-0000', role: 'admin', joinedAt: '2026-01-01' },
  { id: 7, name: '범용 계정', email: 'user@appresso.app', contact: '-', role: 'general', joinedAt: '2026-01-01' },
  { id: 8, name: '한지우', email: 'jiwoo.han@example.com', contact: '010-5656-7878', role: 'general', joinedAt: '2026-04-02' },
]

const ROLE_BADGE = {
  general: 'bg-gray-500/15 text-gray-300',
  vip: 'bg-amber-500/15 text-amber-300',
  admin: 'bg-violet-500/15 text-violet-300',
}

export default function MembersPage() {
  const role = useAuthStore((s) => s.profile?.role) || 'general'

  if (role !== 'admin') {
    return (
      <div className="max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700/60 p-6 text-sm text-gray-500 dark:text-gray-400">
          이 페이지는 <span className="font-semibold text-gray-700 dark:text-gray-200">관리자</span>만 접근할 수 있습니다.
        </div>
      </div>
    )
  }

  const counts = MOCK_MEMBERS.reduce(
    (acc, m) => ({ ...acc, [m.role]: (acc[m.role] || 0) + 1 }),
    {}
  )

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">회원 관리</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          전체 가입자 목록입니다. (총 {MOCK_MEMBERS.length}명 · 일반 {counts.general || 0} · VIP {counts.vip || 0} · 관리자 {counts.admin || 0})
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700/60 overflow-x-auto">
        <table className="w-full text-sm whitespace-nowrap">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700/60 text-xs text-gray-500 dark:text-gray-400 uppercase">
              <th className="px-4 py-3 font-medium text-left">이름</th>
              <th className="px-4 py-3 font-medium text-left">이메일 / 아이디</th>
              <th className="px-4 py-3 font-medium text-left">연락처</th>
              <th className="px-4 py-3 font-medium text-center">등급</th>
              <th className="px-4 py-3 font-medium text-right">가입일</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_MEMBERS.map((m) => (
              <tr key={m.id} className="border-b border-gray-100 dark:border-gray-700/40 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                <td className="px-4 py-3 font-semibold text-gray-800 dark:text-gray-100">{m.name}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{m.email}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{m.contact}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ROLE_BADGE[m.role] || ROLE_BADGE.general}`}>
                    {roleLabel(m.role)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-400">{m.joinedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">* 현재는 샘플(목업) 데이터이며, 실제 가입자 연동 시 교체됩니다.</p>
    </div>
  )
}
