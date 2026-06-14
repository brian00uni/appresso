import React from 'react'
import { ICONS } from './icons'

export const AI_TONE_STYLES = {
  green: 'bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400',
  yellow: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-700 dark:text-yellow-400',
  red: 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400',
}

// AI 사장님 코멘트 박스 (제목/메시지/조언 + 선택적 액션 버튼 슬롯)
export default function AiCommentBox({ comment, actions }) {
  if (!comment) return null
  return (
    <div className={`rounded-lg border p-4 ${AI_TONE_STYLES[comment.tone] || AI_TONE_STYLES.yellow}`}>
      <div className="flex items-center gap-2 font-semibold mb-1">
        <span className="w-5 h-5 flex items-center justify-center rounded-full bg-white/60 dark:bg-gray-900/30">
          {ICONS.ai}
        </span>
        {comment.title}
      </div>
      <p className="text-sm">{comment.message}</p>
      {comment.advice && <p className="text-sm opacity-80 mt-1">{comment.advice}</p>}
      {actions && <div className="flex flex-wrap gap-2 mt-3">{actions}</div>}
    </div>
  )
}
