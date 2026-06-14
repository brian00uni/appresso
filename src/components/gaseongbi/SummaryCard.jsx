import React from 'react'
import { ICONS } from './icons'

const TONE_STYLES = {
  violet: 'bg-violet-500/10 text-violet-500',
  green: 'bg-green-500/10 text-green-600 dark:text-green-400',
  yellow: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
  red: 'bg-red-500/10 text-red-600 dark:text-red-400',
  blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  gray: 'bg-gray-500/10 text-gray-600 dark:text-gray-400',
}

// 아이콘 + 라벨 + 값(+선택적 보조텍스트) — 요약 카드 그리드용
export default function SummaryCard({ icon, label, value, sub, tone = 'violet', valueClassName = '' }) {
  return (
    <div className="bg-white dark:bg-gray-800 shadow-xs rounded-xl border border-gray-100 dark:border-gray-700/60 p-5">
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${TONE_STYLES[tone] || TONE_STYLES.violet}`}>
          {ICONS[icon]}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
      </div>
      <div className={`text-2xl font-bold text-gray-800 dark:text-gray-100 ${valueClassName}`}>{value}</div>
      {sub && <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">{sub}</div>}
    </div>
  )
}
