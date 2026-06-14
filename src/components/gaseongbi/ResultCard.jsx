import React from 'react'
import RatingBadge from './RatingBadge'
import { formatWon, formatPercent } from '../../lib/gaseongbi/calc'

function Metric({ label, value, accent }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-900/40 rounded-lg px-4 py-3">
      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</div>
      <div className={`text-lg font-bold ${accent ? 'text-amber-600 dark:text-amber-400' : 'text-gray-800 dark:text-gray-100'}`}>
        {value}
      </div>
    </div>
  )
}

const AI_TONE_STYLES = {
  green: 'bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400',
  yellow: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-700 dark:text-yellow-400',
  red: 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400',
}

export default function ResultCard({ result, aiComment }) {
  const { netProfit, marginRate, recommendedPrice, shortfall, baseProfit, profitAfterCoupon, rating } = result

  return (
    <div className="bg-white dark:bg-gray-800 shadow-xs rounded-xl border border-gray-100 dark:border-gray-700/60 p-6">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">현재 판매가 기준 순이익</div>
          <div className={`text-4xl font-bold ${netProfit >= 0 ? 'text-gray-800 dark:text-gray-100' : 'text-red-600 dark:text-red-400'}`}>
            {formatWon(netProfit)}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">마진율 {formatPercent(marginRate)}</div>
        </div>
        <RatingBadge rating={rating} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <Metric label="권장 판매가" value={formatWon(recommendedPrice)} accent />
        <Metric label="부족한 금액" value={formatWon(shortfall)} />
        <Metric label="쿠폰 적용 후 순이익" value={formatWon(profitAfterCoupon)} />
        <Metric label="기본 마진 (쿠폰·광고 전)" value={formatWon(baseProfit)} />
      </div>

      {aiComment && (
        <div className={`rounded-lg border p-4 ${AI_TONE_STYLES[aiComment.tone] || AI_TONE_STYLES.yellow}`}>
          <div className="font-semibold mb-1">{aiComment.title}</div>
          <p className="text-sm">{aiComment.message}</p>
          <p className="text-sm opacity-80 mt-1">{aiComment.advice}</p>
        </div>
      )}
    </div>
  )
}
