import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import { roleLabel, GENERAL_SHARED_EMAIL } from '../../lib/accounts'

const ROLE_BADGE = {
  general: 'bg-gray-500/15 text-gray-300',
  vip: 'bg-amber-500/15 text-amber-300',
  admin: 'bg-violet-500/15 text-violet-300',
}

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)
  const loadProfile = useAuthStore((s) => s.loadProfile)

  const role = profile?.role || 'general'
  const email = profile?.email || user?.email || ''
  const isGeneralShared = email === GENERAL_SHARED_EMAIL

  // 기본정보
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [infoSaving, setInfoSaving] = useState(false)
  const [infoMsg, setInfoMsg] = useState('')

  // 비밀번호 변경
  const [newPw, setNewPw] = useState('')
  const [newPw2, setNewPw2] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMsg, setPwMsg] = useState('')

  useEffect(() => {
    setName(profile?.name || '')
    setContact(profile?.contact || '')
  }, [profile])

  async function saveInfo(e) {
    e.preventDefault()
    if (!user) return
    setInfoSaving(true)
    setInfoMsg('')
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ name: name.trim(), contact: contact.trim() })
        .eq('id', user.id)
      if (error) throw error
      await loadProfile()
      setInfoMsg('저장되었습니다.')
    } catch (e) {
      setInfoMsg(`저장 실패: ${e.message}`)
    } finally {
      setInfoSaving(false)
    }
  }

  async function changePassword(e) {
    e.preventDefault()
    setPwMsg('')
    if (newPw.length < 6) {
      setPwMsg('비밀번호는 6자 이상이어야 합니다.')
      return
    }
    if (newPw !== newPw2) {
      setPwMsg('새 비밀번호가 일치하지 않습니다.')
      return
    }
    setPwSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPw })
      if (error) throw error
      setNewPw('')
      setNewPw2('')
      setPwMsg('비밀번호가 변경되었습니다.')
    } catch (e) {
      setPwMsg(`변경 실패: ${e.message}`)
    } finally {
      setPwSaving(false)
    }
  }

  const inputCls =
    'w-full px-3 py-2 text-sm bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-lg outline-none focus:ring-2 focus:ring-violet-500'

  return (
    <div className="max-w-2xl">
      {/* 헤더 */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">프로필 설정</h1>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ROLE_BADGE[role] || ROLE_BADGE.general}`}>
            {roleLabel(role)}
          </span>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">개인 정보 내역과 계정을 관리합니다.</p>
      </div>

      {/* 개인 정보 내역 */}
      <form onSubmit={saveInfo} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700/60 p-6 mb-6">
        <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-4">개인 정보 내역</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">이메일 / 아이디</label>
            <input type="text" value={email} disabled className={`${inputCls} opacity-60 cursor-not-allowed`} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">회원 등급</label>
            <input type="text" value={roleLabel(role)} disabled className={`${inputCls} opacity-60 cursor-not-allowed`} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">이름</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="이름을 입력하세요" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">연락처</label>
            <input type="text" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="010-0000-0000" className={inputCls} />
          </div>
        </div>

        <div className="flex items-center gap-3 mt-5">
          <button type="submit" disabled={infoSaving}
            className="btn bg-violet-500 hover:bg-violet-600 text-white text-sm px-5 py-2 rounded-lg font-medium transition-colors disabled:opacity-50">
            {infoSaving ? '저장 중...' : '기본정보 저장'}
          </button>
          {infoMsg && <span className="text-xs text-gray-500 dark:text-gray-400">{infoMsg}</span>}
        </div>
      </form>

      {/* 비밀번호 변경 — 범용 공유 계정은 숨김 */}
      {isGeneralShared ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700/60 p-6 text-sm text-gray-500 dark:text-gray-400">
          범용 계정은 비밀번호를 변경할 수 없습니다.
        </div>
      ) : (
        <form onSubmit={changePassword} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700/60 p-6">
          <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-4">비밀번호 변경</h2>
          <div className="space-y-4 max-w-sm">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">새 비밀번호</label>
              <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="6자 이상" autoComplete="new-password" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">새 비밀번호 확인</label>
              <input type="password" value={newPw2} onChange={(e) => setNewPw2(e.target.value)} placeholder="다시 입력" autoComplete="new-password" className={inputCls} />
            </div>
          </div>
          <div className="flex items-center gap-3 mt-5">
            <button type="submit" disabled={pwSaving}
              className="btn bg-violet-500 hover:bg-violet-600 text-white text-sm px-5 py-2 rounded-lg font-medium transition-colors disabled:opacity-50">
              {pwSaving ? '변경 중...' : '비밀번호 변경'}
            </button>
            {pwMsg && <span className="text-xs text-gray-500 dark:text-gray-400">{pwMsg}</span>}
          </div>
        </form>
      )}
    </div>
  )
}
