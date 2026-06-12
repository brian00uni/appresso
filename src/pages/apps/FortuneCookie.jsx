import React, { useState } from 'react'
import fcOff from '../../images/fc-off-cookie.png'
import fcOn from '../../images/fc-on-cookie.png'
import fcvOff from '../../images/fcv-off-cookie.png'
import fcvOn from '../../images/fcv-on-cookie.png'
import fcBg from '../../images/fc-bg.png'
import { fortunes, vipFortunes } from '../../data/fortunes'

const FIXED_COMMENT =
  "오늘 이 운세가 나왔네요! 뭔가 딱 보는 순간 '이건 진짜다' 싶은 물건을 만나게 될 징조인가 봅니다. 가성비 수호대답게 오늘도 똑똑하고 즐거운 소비 하세요!"
const SIGNATURE = '이 기운 받아서 오늘 하루도 바로 드가자~! 룸바~!'

export default function FortuneCookie() {
  const [vip, setVip] = useState(false)
  const [fortune, setFortune] = useState(null)
  const [cracked, setCracked] = useState(false)
  const [spinning, setSpinning] = useState(false)

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
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{
        backgroundImage: `url(${fcBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="text-center max-w-md w-full">
        {/* 일반 | VIP 토글 */}
        <div className="inline-flex items-center bg-white/40 backdrop-blur rounded-full p-1 mb-6">
          <button
            onClick={() => selectMode(false)}
            className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${
              !vip ? 'bg-white text-gray-800 shadow' : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            일반
          </button>
          <button
            onClick={() => selectMode(true)}
            className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${
              vip ? 'bg-white text-gray-800 shadow' : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            VIP
          </button>
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
            className={`cursor-pointer select-none transition-transform duration-300 ${
              spinning ? 'animate-bounce' : 'hover:scale-105 active:scale-95'
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
          <div className="bg-white/90 backdrop-blur border border-white/60 rounded-2xl px-8 py-6 shadow-2xl text-left max-w-md w-full animate-cookie-open">
            <span className="inline-block bg-violet-500/10 text-violet-600 text-xs font-semibold px-2.5 py-1 rounded-full mb-3">
              {fortune.category}
            </span>
            <p className="text-gray-800 text-lg leading-relaxed font-bold">"{fortune.message}"</p>
            <p className="text-gray-500 text-sm mt-2">💡 {fortune.glossary}</p>
            <p className="text-gray-700 text-sm leading-relaxed mt-4">{FIXED_COMMENT}</p>
            <p className="text-violet-600 text-sm font-semibold mt-3">{SIGNATURE}</p>

            <button
              onClick={reset}
              className="mt-6 btn bg-violet-500 hover:bg-violet-600 text-white text-sm px-6 py-2.5 rounded-lg font-medium transition-colors w-full"
            >
              다시 뽑기
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
