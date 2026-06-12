import React, { useState } from 'react'

const fortunes = [
  "오늘 당신의 노력은 반드시 결실을 맺을 것입니다.",
  "작은 친절이 세상을 바꿉니다. 오늘 누군가에게 미소를 건네세요.",
  "새로운 도전을 두려워하지 마세요. 성장은 불편함 속에 있습니다.",
  "당신이 생각하는 것보다 훨씬 강한 사람입니다.",
  "좋은 일이 곧 당신에게 찾아올 것입니다. 준비하세요.",
  "지금 이 순간이 바로 인생의 가장 좋은 시간입니다.",
  "포기하지 마세요. 끝이 보이지 않을 때가 가장 가까운 순간입니다.",
  "당신의 꿈은 충분히 이룰 수 있습니다. 한 걸음씩 나아가세요.",
  "신뢰는 천천히 쌓이지만 모든 관계의 기초입니다.",
  "오늘의 실패는 내일의 지혜입니다.",
  "당신 주변의 사람들이 당신을 사랑하고 있습니다.",
  "창의력을 믿으세요. 당신 안에 해답이 있습니다.",
]

export default function FortuneCookie() {
  const [fortune, setFortune] = useState(null)
  const [cracked, setCracked] = useState(false)
  const [spinning, setSpinning] = useState(false)

  function crack() {
    if (spinning) return
    setSpinning(true)
    setCracked(false)
    setFortune(null)
    setTimeout(() => {
      const idx = Math.floor(Math.random() * fortunes.length)
      setFortune(fortunes[idx])
      setCracked(true)
      setSpinning(false)
    }, 800)
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-100 mb-2">🥠 포춘쿠키</h1>
        <p className="text-gray-400 text-sm mb-10">쿠키를 깨면 오늘의 운세를 알 수 있어요</p>

        {/* 쿠키 버튼 */}
        <button
          onClick={crack}
          disabled={spinning}
          className={`text-7xl transition-transform duration-300 cursor-pointer select-none ${
            spinning ? 'animate-bounce' : 'hover:scale-110 active:scale-95'
          }`}
        >
          {cracked ? '💫' : '🥠'}
        </button>

        {/* 운세 카드 */}
        <div className={`mt-8 transition-all duration-500 ${cracked ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {fortune && (
            <div className="bg-gray-800 border border-violet-500/30 rounded-2xl px-8 py-6 shadow-lg shadow-violet-500/10">
              <p className="text-gray-100 text-lg leading-relaxed font-medium">"{fortune}"</p>
            </div>
          )}
        </div>

        <button
          onClick={crack}
          disabled={spinning}
          className="mt-8 btn bg-violet-500 hover:bg-violet-600 text-white text-sm px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          {cracked ? '다시 뽑기' : '쿠키 열기'}
        </button>
      </div>
    </div>
  )
}
