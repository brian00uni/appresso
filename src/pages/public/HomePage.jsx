import React from 'react'
import { Link } from 'react-router-dom'
// import PublicHeader from '../../partials/PublicHeader'
import appressoLogo from '../../assets/appresso-logo.png'
import { useVisit } from '../../lib/visits'

function fmtCount(n) {
  return n == null ? '–' : Number(n).toLocaleString('ko-KR')
}

// Funny App을 별도 팝업창으로 띄운다 (AppsPage와 동일 방식)
function openApp(e, appId) {
  e.preventDefault()
  const width = window.screen.width
  const height = window.screen.height
  window.open(
    `/apps/${appId}`,
    '_blank',
    `width=${width},height=${height},left=0,top=0,toolbar=no,location=no,menubar=no,status=no,scrollbars=no,resizable=yes`
  )
}

// 상단 분석 서비스 (페이지 이동)
const services = [
  {
    to: '/dashboard',
    name: '가성비대장',
    emoji: '👑',
    desc: '메뉴·마진·광고를 한 번에 — 남는 돈이 진짜 실력입니다',
    color: 'from-violet-500/20 to-fuchsia-500/20 border-violet-500/30',
  },
  {
    to: '/youtube',
    name: '유튜브 분석',
    emoji: '📊',
    desc: '채널·영상 데이터를 등급별로 분석하고 성장 지표를 한눈에',
    color: 'from-red-500/20 to-rose-500/20 border-red-500/30',
  },
  {
    to: '/trend',
    name: '조회수가 터진 영상',
    emoji: '🔥',
    desc: '플랫폼별 떡상 영상과 키워드 트렌드를 발굴해보세요',
    color: 'from-amber-500/20 to-orange-500/20 border-amber-500/30',
  },
]

// AI 서비스 (외부 링크)
const aiServices = [
  {
    href: 'https://ttsstudio.vercel.app/',
    name: 'TTS Studio',
    emoji: '🎙️',
    desc: 'AI 음성으로 콘텐츠를 만들어보세요',
    color: 'from-sky-500/20 to-cyan-500/20 border-sky-500/30',
  },
  {
    href: '/art-studio',
    name: 'Art Studio',
    emoji: '🎨',
    desc: 'AI로 이미지를 일괄 자동 생성해보세요',
    color: 'from-amber-500/20 to-yellow-500/20 border-amber-500/30',
  },
  {
    href: '/eraser-studio',
    name: 'Eraser Studio',
    emoji: '🧽',
    desc: '영상 속 자막을 AI로 깔끔하게 지워보세요',
    color: 'from-violet-500/20 to-indigo-500/20 border-violet-500/30',
  },
  {
    href: '/video-dl-studio',
    name: 'VideoDL Studio',
    emoji: '📥',
    desc: '더우인·틱톡·레드노트 영상을 한 번에 다운로드',
    color: 'from-orange-500/20 to-amber-500/20 border-orange-500/30',
  },
]

// 하단 Funny App (팝업 링크)
const apps = [
  {
    id: 'fortune-cookie',
    name: '포춘쿠키',
    emoji: '🥠',
    desc: '쿠키를 깨면 오늘의 운세를 알 수 있어요',
    color: 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30',
  },
  {
    id: 'lotto',
    name: '로또 추천',
    emoji: '🎱',
    desc: '당첨번호 빈도·패턴 분석으로 추천번호를 받아보세요',
    color: 'from-indigo-500/20 to-purple-500/20 border-indigo-500/30',
  },
  {
    id: 'lotto-machine',
    name: '로또 번호 뽑기',
    emoji: '🎰',
    desc: '유리통 속 볼이 날아다녀요. 버튼을 누르면 번호가 하나씩!',
    color: 'from-sky-500/20 to-emerald-500/20 border-sky-500/30',
  },
]

export default function HomePage() {
  const counts = useVisit('home')

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* <PublicHeader /> */}

      {/* 관리자 로그인 진입 (눈에 띄지 않게 우측 상단 고정) */}
      <Link
        to="/admin/login"
        className="fixed top-3 right-4 z-50 text-xs text-gray-700 hover:text-gray-400 transition-colors"
      >
        admin
      </Link>

      <main className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
        {/* Hero */}
        <div className="mb-10 text-center">
          <img src={appressoLogo} alt="appresso" className="h-24 md:h-32 w-auto mx-auto" />
          <p className="text-gray-500 text-sm md:text-base">
            원하는 서비스를 골라 들어가보세요
          </p>
        </div>

        {/* 분석 서비스 */}
        <section className="mb-12">
          <h2 className="text-lg font-bold text-gray-200 mb-4">분석 서비스</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((s) => (
              <Link
                key={s.to}
                to={s.to}
                className={`bg-gradient-to-br ${s.color} bg-gray-800 border rounded-2xl p-6 hover:scale-[1.02] transition-transform group`}
              >
                <div className="text-5xl mb-4">{s.emoji}</div>
                <h3 className="text-xl font-bold text-gray-100 group-hover:text-violet-400 transition-colors">
                  {s.name}
                </h3>
                <p className="text-sm text-gray-400 mt-1">{s.desc}</p>
                <div className="mt-4 flex items-center gap-1 text-xs text-violet-400 font-medium">
                  <span>바로가기</span>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* AI 서비스 */}
        <section className="mb-12">
          <h2 className="text-lg font-bold text-gray-200 mb-4">AI 서비스</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {aiServices.map((s) => (
              <a
                key={s.href}
                href={s.href}
                target={s.href.startsWith('/') ? '_self' : '_blank'}
                rel="noopener noreferrer"
                className={`bg-gradient-to-br ${s.color} bg-gray-800 border rounded-2xl p-6 hover:scale-[1.02] transition-transform group`}
              >
                <div className="text-5xl mb-4">{s.emoji}</div>
                <h3 className="text-xl font-bold text-gray-100 group-hover:text-violet-400 transition-colors">
                  {s.name}
                </h3>
                <p className="text-sm text-gray-400 mt-1">{s.desc}</p>
                <div className="mt-4 flex items-center gap-1 text-xs text-violet-400 font-medium">
                  <span>바로가기</span>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H9M17 7v8" />
                  </svg>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* Funny App */}
        <section>
          <h2 className="text-lg font-bold text-gray-200 mb-4">Funny App</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {apps.map((app) => (
              <a
                key={app.id}
                href={`/apps/${app.id}`}
                onClick={(e) => openApp(e, app.id)}
                className={`bg-gradient-to-br ${app.color} bg-gray-800 border rounded-2xl p-6 hover:scale-105 transition-transform group`}
              >
                <div className="text-5xl mb-4">{app.emoji}</div>
                <h3 className="text-lg font-bold text-gray-100 group-hover:text-violet-400 transition-colors">
                  {app.name}
                </h3>
                <p className="text-sm text-gray-400 mt-1">{app.desc}</p>
                <div className="mt-4 flex items-center gap-1 text-xs text-violet-400 font-medium">
                  <span>앱 열기</span>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </a>
            ))}

            {/* 준비 중 카드 */}
            <div className="bg-gray-800/50 border border-gray-700/60 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center opacity-50">
              <div className="text-4xl mb-3">✨</div>
              <p className="text-sm text-gray-500">새 앱 준비 중...</p>
            </div>
          </div>
        </section>

        {/* 사이트 방문 카운터 — 100% 폭 한 줄 */}
        <footer className="mt-12 pt-6 border-t border-gray-800">
          <div className="w-full flex flex-wrap items-center justify-between gap-x-8 gap-y-2 text-sm bg-gradient-to-br  bg-gray-700 p-2 px-5  rounded-2xl ">
            <span className="text-xs uppercase tracking-wide text-gray-500">사이트 방문</span>
            <div className="flex items-center gap-8">
              <span className="text-gray-400">
                전체 <b className="text-gray-100 tabular-nums ml-1">{fmtCount(counts?.siteTotal)}</b>
              </span>
              <span className="text-gray-400">
                오늘 <b className="text-violet-400 tabular-nums ml-1">{fmtCount(counts?.siteToday)}</b>
              </span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}
