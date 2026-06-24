import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { idToEmail, SHARED_ACCOUNTS } from '../lib/accounts'
import appressoLogo from '../assets/appresso-logo.png'

// 범용 계정 (플레이스홀더로 고정 표시 / 포커스·엔터 시 자동 입력)
const GENERAL = SHARED_ACCOUNTS.user

export default function LoginPage({ allowSignup = true }) {
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  // 플레이스홀더는 비포커스 시 범용 계정값(user/1122)을 보여준다
  const [idFocused, setIdFocused] = useState(false)
  const [pwFocused, setPwFocused] = useState(false)
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)
  const profileLoaded = useAuthStore((s) => s.profileLoaded)

  // 로그인되면 역할에 따라 이동: 관리자 → 관리자 콘솔, 그 외 → 가성비대장
  useEffect(() => {
    if (!user || !profileLoaded) return
    navigate(profile?.role === 'admin' ? '/admin' : '/dashboard', { replace: true })
  }, [user, profile, profileLoaded, navigate])

  function switchMode(next) {
    setMode(next)
    setError('')
    setNotice('')
  }

  // (로그인 모드) 알려진 공유 계정(user/admin)을 입력하면 해당 비밀번호를 자동 채움
  function handleIdChange(value) {
    setLoginId(value)
    if (mode !== 'login') return
    const known = SHARED_ACCOUNTS[value.trim()]
    if (known) setPassword(known.password)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setNotice('')

    // 로그인 모드에서 빈 폼이면 범용 계정으로 바로 로그인
    let id = loginId.trim()
    let pw = password
    if (mode === 'login' && !id && !pw) {
      id = 'user'
      pw = GENERAL.password
    }
    const email = idToEmail(id)
    if (!email || !pw) {
      setError('아이디와 비밀번호를 입력하세요.')
      return
    }

    setLoading(true)
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pw })
        if (error) throw error
        // 성공 시 useEffect가 /dashboard로 이동
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: pw,
          options: { data: { username: id } },
        })
        if (error) throw error
        if (!data.session) {
          // 이메일 인증이 켜진 경우 — 확인 메일 발송됨
          setNotice('확인 메일을 보냈습니다. 메일의 링크를 클릭한 뒤 로그인하세요.')
          setMode('login')
        }
        // data.session 있으면(이메일 인증 꺼짐) 가입 즉시 로그인 → useEffect 이동
      }
    } catch (err) {
      setError(translateAuthError(err.message || String(err)))
    } finally {
      setLoading(false)
    }
  }

  const isLogin = mode === 'login'

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* 로고 */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center mb-4">
            <img src={appressoLogo} alt="appresso" className="h-12 w-auto" />
          </Link>
          <p className="text-sm text-gray-300 mt-1">
            {isLogin
              ? '그냥 Enter를 누르면 공용 계정(user)으로 로그인됩니다.'
              : '이메일과 비밀번호로 가입하세요.'}
          </p>
        </div>

        {/* 폼 */}
        <div className="bg-gray-800 rounded-xl border border-gray-700/60 p-6">
          {/* 탭 토글 (회원가입 허용 시에만) */}
          {allowSignup && (
            <div className="flex items-center bg-gray-700/40 rounded-lg p-1 mb-5">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className={`flex-1 text-sm font-medium py-2 rounded-md transition-colors ${
                  isLogin ? 'bg-violet-500 text-white' : 'text-gray-300 hover:text-white'
                }`}
              >
                로그인
              </button>
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className={`flex-1 text-sm font-medium py-2 rounded-md transition-colors ${
                  !isLogin ? 'bg-violet-500 text-white' : 'text-gray-300 hover:text-white'
                }`}
              >
                회원가입
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                {isLogin ? '아이디' : '이메일'}
              </label>
              <input
                type="text"
                value={loginId}
                onChange={(e) => handleIdChange(e.target.value)}
                onFocus={() => setIdFocused(true)}
                onBlur={() => setIdFocused(false)}
                placeholder={isLogin ? (idFocused ? '아이디 또는 이메일' : GENERAL.email.split('@')[0]) : 'you@example.com'}
                autoComplete={isLogin ? 'username' : 'email'}
                className="w-full px-3 py-2 text-sm bg-gray-700/50 border border-gray-700 text-gray-100 placeholder-gray-500 rounded-lg outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setPwFocused(true)}
                onBlur={() => setPwFocused(false)}
                placeholder={isLogin ? (pwFocused ? '비밀번호' : GENERAL.password) : '6자 이상'}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                className="w-full px-3 py-2 text-sm bg-gray-700/50 border border-gray-700 text-gray-100 placeholder-gray-500 rounded-lg outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
              />
            </div>
            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">{error}</p>
            )}
            {notice && (
              <p className="text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-lg">{notice}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn bg-violet-500 hover:bg-violet-600 text-white py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> 처리 중...</>
              ) : isLogin ? '로그인' : '회원가입'}
            </button>
          </form>

          {/* 모드 전환 링크 (회원가입 허용 시에만) */}
          {allowSignup && (
            <div className="text-center mt-4">
              {isLogin ? (
                <button onClick={() => switchMode('signup')} className="text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors">
                  계정이 없나요? 회원가입
                </button>
              ) : (
                <button onClick={() => switchMode('login')} className="text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors">
                  이미 계정이 있나요? 로그인
                </button>
              )}
            </div>
          )}
        </div>

        <div className="text-center mt-4 space-y-2">
          <Link to="/" className="block text-xs text-gray-500 hover:text-gray-400 transition-colors">
            ← 홈으로 돌아가기
          </Link>
        </div>

      </div>
    </div>
  )
}

function translateAuthError(m) {
  if (/Invalid login/i.test(m)) return '아이디 또는 비밀번호가 올바르지 않습니다.'
  if (/already registered/i.test(m)) return '이미 가입된 이메일입니다.'
  if (/at least 6/i.test(m)) return '비밀번호는 6자 이상이어야 합니다.'
  if (/Email not confirmed/i.test(m)) return '이메일 인증을 완료해주세요. 메일함을 확인하세요.'
  return m
}
