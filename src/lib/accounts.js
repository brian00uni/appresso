// 아이디 ↔ 이메일 매핑 (Supabase 인증은 이메일 기반)
//
// 범용 계정(user)·관리자(admin)는 짧은 아이디로 로그인하고, 내부적으로 이메일로 변환한다.
// 실제 회원은 이메일을 그대로 입력하면 된다.

export const SHARED_ACCOUNTS = {
  user: { email: 'user@appresso.app', password: '112233', label: '범용 계정' },
  admin: { email: 'admin@appresso.app', password: '112233', label: '관리자' },
}

// 범용 공유 계정 (비밀번호 변경 비활성 대상)
export const GENERAL_SHARED_EMAIL = SHARED_ACCOUNTS.user.email

export function idToEmail(input) {
  const v = String(input || '').trim()
  if (!v) return ''
  if (v.includes('@')) return v
  if (SHARED_ACCOUNTS[v]) return SHARED_ACCOUNTS[v].email
  return `${v}@appresso.app`
}

export const ROLE_LABELS = { general: '일반회원', vip: 'VIP회원', admin: '관리자' }

export function roleLabel(role) {
  return ROLE_LABELS[role] || ROLE_LABELS.general
}
