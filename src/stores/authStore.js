import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { resetLocal } from '../lib/gaseongbi/remoteSync'

export const useAuthStore = create((set, get) => ({
  user: null,
  session: null,
  profile: null, // { id, email, role: 'general'|'vip'|'admin', name, contact }
  profileLoaded: false, // 프로필 1회 조회 완료 여부 (null=없음과 구분)
  loading: true,
  setSession: (session) => set({ session, user: session?.user ?? null }),
  setLoading: (loading) => set({ loading }),
  setProfile: (profile) => set({ profile }),
  // 로그인된 사용자의 프로필(역할 포함)을 불러온다. 테이블/행이 없으면 null로 둔다.
  loadProfile: async () => {
    const user = get().user
    if (!user) {
      set({ profile: null, profileLoaded: true })
      return
    }
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
      set({ profile: data ?? null, profileLoaded: true })
    } catch {
      set({ profile: null, profileLoaded: true })
    }
  },
  signOut: async () => {
    await supabase.auth.signOut()
    resetLocal()
    set({ user: null, session: null, profile: null, profileLoaded: true })
  },
}))
