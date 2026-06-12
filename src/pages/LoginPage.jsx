import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true })
  }, [user, navigate])

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message.includes('Email not confirmed')
          ? '이메일 인증을 완료해주세요. 메일함을 확인하세요.'
          : '이메일 또는 비밀번호가 올바르지 않습니다.')
      }
    } catch {
      setError('네트워크 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* 로고 */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center w-12 h-12 bg-violet-500 rounded-xl mb-4">
            <svg className="fill-white" xmlns="http://www.w3.org/2000/svg" width="22" height="22">
              <path d="M21.956 10.8C21.372 4.92 17.08.628 11.2.044V4.76a6.04 6.04 0 0 0 0 11.48v4.716c5.88-.584 10.172-4.876 10.756-10.156zM9.8 19.924V23.9563C4.0006 23.3706.7293 17.9 .006611.2H4.76A6.04 6.04 0 0 0 9.8 19.924z" />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold text-gray-100">eyeDesk 로그인</h1>
          <p className="text-sm text-gray-500 mt-1">사내 업무 관리 시스템</p>
        </div>

        {/* 폼 */}
        <div className="bg-gray-800 rounded-xl border border-gray-700/60 p-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">이메일</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="company@example.com"
                required
                className="w-full px-3 py-2 text-sm bg-gray-700/50 border border-gray-700 text-gray-100 placeholder-gray-500 rounded-lg outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                required
                className="w-full px-3 py-2 text-sm bg-gray-700/50 border border-gray-700 text-gray-100 placeholder-gray-500 rounded-lg outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
              />
            </div>
            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn bg-violet-500 hover:bg-violet-600 text-white py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> 로그인 중...</>
              ) : '로그인'}
            </button>
          </form>
        </div>

        <div className="text-center mt-4 space-y-2">
          <Link to="/" className="block text-xs text-gray-500 hover:text-gray-400 transition-colors">
            ← 홈으로 돌아가기
          </Link>
          <p className="text-xs text-gray-600">계정 문의는 시스템 관리자에게 연락하세요</p>
        </div>

      </div>
    </div>
  )
}
