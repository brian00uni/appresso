import React, { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import artStudioLogo from '../../assets/artstudio-logo02.png'

/**
 * Art Studio 좌측 — 구글 로그인 영역
 * Supabase Google OAuth 연동. 로그인 시 사용자 정보/로그아웃을 표시한다.
 */
export default function LoginPanel() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const user = useAuthStore((s) => s.user)
  const signOut = useAuthStore((s) => s.signOut)

  async function handleGoogleLogin() {
    setError('')
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/art-studio` },
      })
      if (error) throw error
      // 성공 시 구글 동의 화면으로 리다이렉트됨
    } catch (err) {
      setError(err.message || '구글 로그인에 실패했습니다.')
      setLoading(false)
    }
  }

  // 구글 프로필 메타데이터 (이름/아바타)
  const meta = user?.user_metadata || {}
  const displayName = meta.full_name || meta.name || user?.email?.split('@')[0] || '사용자'
  const avatar = meta.avatar_url || meta.picture

  return (
    <aside className="is-login">
      <div className="is-login-card">
        <div className="is-login-brand">
          <img src={artStudioLogo} alt="Art Studio" className="is-login-logo-img" />
          <p className="is-login-sub">AI 이미지 자동 생성 스튜디오</p>
        </div>

        {user ? (
          /* ─── 로그인 상태 ─── */
          <>
            <div className="is-login-profile">
              {avatar ? (
                <img src={avatar} alt="" className="is-login-avatar" referrerPolicy="no-referrer" />
              ) : (
                <div className="is-login-avatar fallback">{displayName.charAt(0).toUpperCase()}</div>
              )}
              <div className="is-login-profile-info">
                <div className="is-login-profile-name">{displayName}</div>
                <div className="is-login-profile-email">{user.email}</div>
              </div>
            </div>

            <p className="is-login-welcome">로그인되었습니다. 우측 작업 패널을 사용해 보세요. 🎉</p>

            <button type="button" className="is-login-alt" onClick={signOut}>로그아웃</button>
          </>
        ) : (
          /* ─── 비로그인 상태 ─── */
          <>
            <p className="is-login-desc">
              구글 계정으로 로그인하면 우측 작업 패널에서
              <br />프롬프트 일괄 생성 · 자동 번역 · 이미지 저장을 사용할 수 있어요.
            </p>

            {/* 로그인/계정연동 버튼 자리 (추후 추가) */}
            {error && <p className="is-login-error">{error}</p>}

            <p className="is-login-terms">
              로그인 시 <a href="#">이용약관</a> 및 <a href="#">개인정보처리방침</a>에 동의하게 됩니다.
            </p>
          </>
        )}
      </div>
    </aside>
  )
}
