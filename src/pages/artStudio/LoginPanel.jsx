import React, { useState } from 'react'
import { Link } from 'react-router-dom'
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

            {/* Google 로그인 버튼 */}
            <button type="button" className="is-google-btn" onClick={handleGoogleLogin} disabled={loading}>
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
                <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
                <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571.001-.001 6.19 5.238 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
              </svg>
              {loading ? '이동 중…' : 'Google 계정으로 로그인'}
            </button>
            {error && <p className="is-login-error">{error}</p>}

            <div className="is-login-divider"><span>또는</span></div>

            <Link to="/login" className="is-login-alt">이메일로 로그인</Link>

            <p className="is-login-terms">
              로그인 시 <a href="#">이용약관</a> 및 <a href="#">개인정보처리방침</a>에 동의하게 됩니다.
            </p>
          </>
        )}
      </div>

      <Link to="/" className="is-login-home">← 홈으로 돌아가기</Link>
    </aside>
  )
}
