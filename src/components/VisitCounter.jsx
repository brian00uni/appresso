import React from 'react'

function fmt(n) {
  return n == null ? '–' : Number(n).toLocaleString('ko-KR')
}

function Row({ label, value, accent }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-400">{label}</span>
      <span className={`font-semibold tabular-nums ${accent ? 'text-violet-400' : 'text-gray-100'}`}>
        {value}
      </span>
    </div>
  )
}

// counts: { siteTotal, siteToday, appTotal } | null
export default function VisitCounter({ counts, showApp = false, appLabel = '현재 앱 방문', className = '' }) {
  return (
    <div className={`rounded-xl bg-gray-800/60 border border-gray-700/60 p-4 ${className}`}>
      <div className="text-xs text-gray-400 mb-2">사이트 방문</div>
      <div className="space-y-1.5 text-sm">
        <Row label="전체" value={fmt(counts?.siteTotal)} />
        <Row label="오늘" value={fmt(counts?.siteToday)} />
        {showApp && <Row label={appLabel} value={fmt(counts?.appTotal)} accent />}
      </div>
    </div>
  )
}
