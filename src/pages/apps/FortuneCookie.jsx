import React, { useState, useEffect } from 'react'
import fcOff from '../../images/fc-off-cookie.png'
import fcOn from '../../images/fc-on-cookie.png'
import fcvOff from '../../images/fcv-off-cookie.png'
import fcvOn from '../../images/fcv-on-cookie.png'
import fcBg from '../../images/fc-bg.png'
import { fortunes, vipFortunes } from '../../data/fortunes'
import { trackVisit } from '../../lib/visits'

/* ─────────────────────────────────────────────────────────
   ⚙️ 직접 입력하는 설정값 — 아래 따옴표 안만 수정하면 됩니다
   ───────────────────────────────────────────────────────── */

// 1) 버튼1 링크: 버튼 문구별로 이동할 URL을 넣으세요.
//    비워두면('') 버튼은 표시만 되고 클릭해도 이동하지 않습니다.
const BUTTON_LINKS = {
  '오늘의 비밀템 보기': '', // 쿠팡 파트너스 링크
  '오늘의 집밥템 보기': '', // 쿠팡 파트너스 링크
  '블로그 놀이터 가기': '', // 블로그 글 URL
}

// 2) 결과창 하단 시그니처 문구
const SIGNATURE = '이 기운 받아 오늘도 바로 드가자~ 룸바~!'

// 3) 쿠팡 파트너스 수수료 고지 (쿠팡 링크 버튼 아래 작게 표시 / 비워두면 숨김)
const PARTNERS_NOTICE =
  '이 활동은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.'

// 쿠팡 링크로 취급할 버튼 문구 (이 버튼들에만 수수료 고지가 표시됩니다)
const COUPANG_BUTTONS = ['오늘의 비밀템 보기', '오늘의 집밥템 보기']

/* ───────────────────────────────────────────────────────── */

export default function FortuneCookie() {
  const [vip, setVip] = useState(false)
  const [fortune, setFortune] = useState(null)
  const [cracked, setCracked] = useState(false)
  const [spinning, setSpinning] = useState(false)

  // 방문 카운팅 (앱별 집계)
  useEffect(() => {
    trackVisit('fortune-cookie')
  }, [])

  const pool = vip ? vipFortunes : fortunes
  const cookieImg = cracked ? (vip ? fcvOn : fcOn) : (vip ? fcvOff : fcOff)

  function crack() {
    if (spinning) return
    setSpinning(true)
    setCracked(false)
    setFortune(null)
    setTimeout(() => {
      const idx = Math.floor(Math.random() * pool.length)
      setFortune(pool[idx])
      setCracked(true)
      setSpinning(false)
    }, 800)
  }

  function reset() {
    setCracked(false)
    setFortune(null)
  }

  function selectMode(nextVip) {
    if (nextVip === vip) return
    setVip(nextVip)
    setCracked(false)
    setFortune(null)
  }

  return (
    <div
      className="flex flex-col items-center justify-center px-4"
      style={{
        width: '100vw',
        height: '100vh',
        backgroundImage: `url(${fcBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="text-center max-w-md w-full">
        {/* 일반 | VIP 토글 */}
        <div className='hidden'>
          <div className="  inline-flex items-center bg-white/40 backdrop-blur rounded-full p-1 mb-6 ">
            <button
              onClick={() => selectMode(false)}
              className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${!vip ? 'bg-white text-gray-800 shadow' : 'text-gray-700 hover:text-gray-900'
                }`}
            >
              일반
            </button>
            <button
              onClick={() => selectMode(true)}
              className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${vip ? 'bg-white text-gray-800 shadow' : 'text-gray-700 hover:text-gray-900'
                }`}
            >
              VIP
            </button>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-800 mb-2">🥠 포춘쿠키</h1>
        <p className="text-gray-700/80 text-sm mb-20">쿠키를 깨면 오늘의 운세를 알 수 있어요</p>

        {/* 쿠키 버튼 */}
        <div className="relative inline-block">
          {!cracked && (
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 -translate-y-full whitespace-nowrap bg-white text-gray-800 text-sm font-medium px-4 py-2 rounded-full shadow-lg animate-bounce">
              저를 눌러주세요
              <span className="absolute left-1/2 -translate-x-1/2 top-full w-3 h-3 bg-white rotate-45 -mt-1.5"></span>
            </div>
          )}
          <button
            onClick={crack}
            disabled={spinning}
            className={`cursor-pointer select-none transition-transform duration-300 ${spinning ? 'animate-bounce' : 'hover:scale-105 active:scale-95'
              }`}
          >
            <img
              key={cookieImg}
              src={cookieImg}
              alt="포춘쿠키"
              className={`w-80 mx-auto drop-shadow-xl ${cracked ? 'animate-cookie-open' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* 운세 결과 레이어 */}
      {cracked && fortune && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white/90 backdrop-blur border border-white/60 rounded-2xl px-8 py-6 shadow-2xl text-left max-w-md w-full max-h-[90vh] overflow-y-auto animate-cookie-open">
            {/* 카테고리 + 톤 */}
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-block bg-violet-500/10 text-violet-600 text-xs font-semibold px-2.5 py-1 rounded-full">
                오늘의 운세 · {fortune.category}
              </span>
              {fortune.tone && (
                <span className="inline-block bg-rose-500/10 text-rose-500 text-xs font-semibold px-2.5 py-1 rounded-full">
                  {fortune.tone}
                </span>
              )}
            </div>

            {/* 운세문구 (MZ 훅) */}
            <p className="text-gray-800 text-lg leading-relaxed font-bold">"{fortune.message}"</p>

            {/* 따뜻한 한마디 */}
            {fortune.encouragement && (
              <p className="text-gray-700 text-sm leading-relaxed mt-4">{fortune.encouragement}</p>
            )}

            {/* 신조어 사전 (있을 때만) */}
            {fortune.slangTerm && (
              <p className="text-gray-500 text-xs mt-3">
                💡 {fortune.slangTerm}: {fortune.slangMeaning}
              </p>
            )}

            {/* 시그니처 */}
            <p className="text-violet-600 text-sm font-semibold mt-4">{SIGNATURE}</p>

            <div className='pt-5'>

              {/* 버튼1: 액션 CTA (쿠팡 비밀템 / 집밥템 / 블로그 놀이터) */}
              {(() => {
                const url = BUTTON_LINKS[fortune.button1] || ''
                const cls =
                  'mt-6 btn bg-violet-500 hover:bg-violet-600 text-white text-sm px-6 py-2.5 rounded-lg font-medium transition-colors w-full block text-center hidden  bg-white border border-violet-200 text-violet-600 hover:bg-violet-50 '
                return url ? (
                  <a href={url} target="_blank" rel="noopener noreferrer" className={cls}>
                    {fortune.button1}
                  </a>
                ) : (
                  <button type="button" className={cls}>
                    {fortune.button1}
                  </button>
                )
              })()}

              {/* 쿠팡 파트너스 수수료 고지 (쿠팡 버튼일 때만) */}
              {PARTNERS_NOTICE && COUPANG_BUTTONS.includes(fortune.button1) && (
                <p className="text-gray-400 text-[11px] leading-snug mt-2">{PARTNERS_NOTICE}</p>
              )}

              {/* 버튼2: 다시 까기 */}
              <button
                onClick={reset}
                className="mt-2 btn bg-violet-500 hover:bg-violet-600 text-white text-sm px-6 py-2.5 rounded-lg font-medium transition-colors w-full"
              >
                {fortune.button2 || '포춘쿠키 다시 까기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
