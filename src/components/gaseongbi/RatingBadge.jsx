import React from 'react'
import { RATING_LABELS } from '../../lib/gaseongbi/calc'

const STYLES = {
  green: 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30',
  yellow: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30',
  red: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30',
}

export default function RatingBadge({ rating, className = '' }) {
  const style = STYLES[rating] || STYLES.yellow
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${style} ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {RATING_LABELS[rating] || rating}
    </span>
  )
}
