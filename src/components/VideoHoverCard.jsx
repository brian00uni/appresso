import React, { useState } from 'react'

function num(n) {
  const v = Number(n)
  if (isNaN(v)) return '-'
  return Math.round(v).toLocaleString()
}

function formatDuration(iso) {
  const m = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso ?? '')
  if (!m) return '-'
  const h = parseInt(m[1] ?? '0')
  const min = parseInt(m[2] ?? '0')
  const sec = parseInt(m[3] ?? '0')
  const totalMin = h * 60 + min
  return `${totalMin}:${String(sec).padStart(2, '0')}`
}

function formatDate(iso) {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '-'
  return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}`
}

function Stat({ value, label }) {
  return (
    <div className="bg-gray-700/40 rounded-lg px-3 py-2">
      <p className="text-sm font-bold text-gray-100 truncate" title={value}>{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  )
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-semibold mt-0.5 truncate text-gray-200">{value}</p>
    </div>
  )
}

export default function VideoHoverCard({ item, style, onClose, onMouseEnter, onMouseLeave }) {
  const [copied, setCopied] = useState(false)
  const channelUrl = `https://www.youtube.com/channel/${item.channelId}`

  function handleCopy(e) {
    e.preventDefault()
    navigator.clipboard.writeText(item.url)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div
      style={style}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="fixed z-50 w-80 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden text-sm"
    >
      {/* 썸네일 */}
      <div className="relative">
        <img src={item.thumbnail} alt={item.title} className="w-full h-36 object-cover bg-gray-700" />
        <button onClick={onClose} className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-gray-900/70 text-gray-300 hover:text-gray-100 transition-colors">✕</button>
      </div>

      {/* 헤더 */}
      <div className="px-4 py-3 border-b border-gray-700/60">
        <h3 className="font-bold text-gray-100 line-clamp-2">{item.title}</h3>
        <p className="text-xs text-gray-500 mt-1">{item.channelTitle}</p>
      </div>

      <div className="p-4">
        {/* 핵심 통계 */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <Stat value={num(item.viewCount)} label="조회수" />
          <Stat value={num(item.subscriberCount)} label="구독자" />
          <Stat value={num(item.commentCount)} label="댓글" />
          <Stat value={num(item.opportunityScore)} label="기회점수" />
        </div>

        {/* 상세 정보 */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-4 max-h-32 overflow-y-auto pr-1">
          <Field label="조회/구독 비율" value={num(item.viewSubscriberRatio)} />
          <Field label="시간당 조회" value={num(item.viewsPerHour)} />
          <Field label="영상 길이" value={formatDuration(item.duration)} />
          <Field label="업로드일" value={formatDate(item.publishedAt)} />
          <Field label="매칭 키워드" value={item.matchedKeyword || '-'} />
        </div>

        {/* 액션 버튼 */}
        <div className="flex gap-2">
          <a href={item.url} target="_blank" rel="noreferrer"
            className="flex-1 text-center btn bg-violet-500 hover:bg-violet-600 text-white text-sm py-2 rounded-lg font-medium transition-colors">
            영상 보기
          </a>
          <a href={channelUrl} target="_blank" rel="noreferrer"
            className="flex-1 text-center btn bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm py-2 rounded-lg font-medium transition-colors">
            채널 이동
          </a>
          <button onClick={handleCopy} title="영상 링크 복사"
            className="px-3 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors">
            {copied ? '✓' : '🔗'}
          </button>
        </div>
      </div>
    </div>
  )
}
