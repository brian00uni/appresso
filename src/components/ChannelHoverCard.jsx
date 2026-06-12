import React, { useState } from 'react'

const TIER_BAR_CLASSES = {
  red: 'bg-red-600',
  orange: 'bg-orange-600',
  amber: 'bg-amber-600',
  lime: 'bg-lime-600',
  green: 'bg-green-600',
  teal: 'bg-teal-600',
  cyan: 'bg-cyan-600',
  blue: 'bg-blue-600',
  indigo: 'bg-indigo-600',
  gray: 'bg-gray-600',
}

const COUNTRY_NAMES = {
  KR: '한국', US: '미국', JP: '일본', GB: '영국', CN: '중국', IN: '인도',
  FR: '프랑스', DE: '독일', BR: '브라질', CA: '캐나다', AU: '호주', RU: '러시아',
  ID: '인도네시아', VN: '베트남', TH: '태국', MX: '멕시코', ES: '스페인', IT: '이탈리아',
}

function flagEmoji(code) {
  if (!code || code.length !== 2) return ''
  const codePoints = [...code.toUpperCase()].map((c) => 127397 + c.charCodeAt(0))
  return String.fromCodePoint(...codePoints)
}

function num(n) {
  return Math.round(n).toLocaleString()
}

function Stat({ value, label }) {
  return (
    <div className="bg-gray-700/40 rounded-lg px-3 py-2">
      <p className="text-sm font-bold text-gray-100 truncate" title={value}>{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  )
}

function Field({ label, value, positive }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-sm font-semibold mt-0.5 truncate ${positive ? 'text-green-400' : 'text-gray-200'}`}>{value}</p>
    </div>
  )
}

export default function ChannelHoverCard({ ch, style, onClose, onMouseEnter, onMouseLeave }) {
  const [copied, setCopied] = useState(false)
  const channelUrl = `https://www.youtube.com/channel/${ch.id}`

  const badges = []
  if (ch.subscriberCount > 0 && ch.yearlyGrowth >= ch.subscriberCount * 0.3) badges.push({ icon: '🔥', label: '폭발적 성장' })
  if (ch.subscriberCount > 0 && ch.avgViews >= ch.subscriberCount * 0.5) badges.push({ icon: '💎', label: '매우 높은 참여도' })
  if (ch.uploadIntervalDays > 7) badges.push({ icon: '📮', label: '간헐적 업로드' })

  function handleCopy(e) {
    e.preventDefault()
    navigator.clipboard.writeText(channelUrl)
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
      {/* 등급 바 */}
      <div className={`flex items-center justify-between px-3 py-1.5 text-xs font-bold text-white ${TIER_BAR_CLASSES[ch.tier.color]}`}>
        <span>{ch.tier.key}</span>
        <span>{ch.years.toFixed(2)}년 · {ch.months.toFixed(1)}개월</span>
      </div>

      {/* 헤더 */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-700/60">
        <img src={ch.thumbnail} alt={ch.title} className="w-10 h-10 rounded-full object-cover bg-gray-700 flex-shrink-0" />
        <h3 className="font-bold text-gray-100 truncate flex-1">{ch.title}</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors">✕</button>
      </div>

      <div className="p-4">
        {/* 핵심 통계 */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <Stat value={num(ch.subscriberCount)} label="구독자" />
          <Stat value={`${num(ch.videoCount)}개`} label="영상 수" />
          <Stat value={num(ch.viewCount)} label="총 조회수" />
          <Stat value={num(ch.avgViews)} label="평균 조회수" />
        </div>

        {/* 상세 정보 */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-4 max-h-48 overflow-y-auto pr-1">
          <Field label="채널유형" value={ch.tier.key} />
          <Field label="주제" value={ch.topic || '-'} />
          <Field label="년간 증가" value={`+${num(ch.yearlyGrowth)}`} positive />
          <Field label="월간 증가" value={`+${num(ch.monthlyGrowth)}`} positive />
          <Field label="영상당 구독자" value={num(ch.perVideoSubs)} />
          <Field label="조회수 대비 구독율" value={`${ch.subRatio.toFixed(2)}%`} />
          <Field label="개설일" value={ch.publishedAt ? `${new Date(ch.publishedAt).getFullYear()}. ${new Date(ch.publishedAt).getMonth() + 1}. ${new Date(ch.publishedAt).getDate()}` : '-'} />
          <Field label="년수" value={`${ch.years.toFixed(2)}년`} />
          <Field label="개월수" value={`${ch.months.toFixed(1)}개월`} />
          <Field label="일차" value={`${ch.days.toFixed(1)}일`} />
          <Field label="일일 증가" value={`+${num(ch.dailyGrowth)}명`} positive />
          <Field label="업로드 빈도" value={ch.uploadIntervalDays > 0 ? `${ch.uploadIntervalDays.toFixed(2)}일당 1개` : '-'} />
          <Field label="위치" value={ch.country ? `${flagEmoji(ch.country)} ${COUNTRY_NAMES[ch.country] ?? ch.country}` : '-'} />
          <Field label="분야" value={(ch.topic || '-').split(/[\s(]/)[0].toLowerCase()} />
        </div>

        {/* 뱃지 */}
        {badges.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {badges.map((b) => (
              <span key={b.label} className="px-2 py-1 text-xs rounded-full bg-gray-700/50 border border-gray-700 text-gray-300">
                {b.icon} {b.label}
              </span>
            ))}
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="flex gap-2">
          <a href={channelUrl} target="_blank" rel="noreferrer"
            className="flex-1 text-center btn bg-violet-500 hover:bg-violet-600 text-white text-sm py-2 rounded-lg font-medium transition-colors">
            바로 채널 이동
          </a>
          <button onClick={handleCopy} title="채널 링크 복사"
            className="px-3 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors">
            {copied ? '✓' : '🔗'}
          </button>
        </div>
      </div>
    </div>
  )
}
