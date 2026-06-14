import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const inputClass =
  'w-full px-3 py-2 text-sm bg-white dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700/60 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-lg outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all'

const labelClass = 'block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1'

export default function MyStoreFormModal({ open, initialValue, onSave, onClose }) {
  const [form, setForm] = useState(initialValue)

  useEffect(() => {
    if (open) setForm(initialValue)
  }, [open, initialValue])

  if (!open) return null

  const setNumber = (key, value) => setForm((f) => ({ ...f, [key]: value === '' ? 0 : Number(value) }))

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(form)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg w-full max-w-lg p-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">우리 가게 정보 수정</h2>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
          가게 이름·위치·대표 카테고리는{' '}
          <Link to="/dashboard/settings" className="text-violet-500 hover:underline">
            설정 &gt; 매장 정보
          </Link>
          에서 변경할 수 있어요.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>대표 메뉴 가격 (원)</label>
              <input type="number" className={inputClass} value={form.repPrice} min={0} onChange={(e) => setNumber('repPrice', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>배달팁 (원)</label>
              <input type="number" className={inputClass} value={form.deliveryTip} min={0} onChange={(e) => setNumber('deliveryTip', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>쿠폰 금액 (원)</label>
              <input type="number" className={inputClass} value={form.coupon} min={0} onChange={(e) => setNumber('coupon', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>세트 메뉴 수</label>
              <input type="number" className={inputClass} value={form.setCount} min={0} onChange={(e) => setNumber('setCount', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>사진 경쟁력 (0~100)</label>
              <input type="number" className={inputClass} value={form.photoStyle} min={0} max={100} onChange={(e) => setNumber('photoStyle', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>리뷰 이벤트 반응도 (0~100)</label>
              <input type="number" className={inputClass} value={form.reviewEvent} min={0} max={100} onChange={(e) => setNumber('reviewEvent', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>리뷰 평점 (0~5)</label>
              <input type="number" className={inputClass} value={form.reviewScore} min={0} max={5} step={0.1} onChange={(e) => setNumber('reviewScore', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>주문 전환율 (%)</label>
              <input type="number" className={inputClass} value={form.conversionRate} min={0} max={100} onChange={(e) => setNumber('conversionRate', e.target.value)} />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-100 dark:bg-gray-700/60 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              취소
            </button>
            <button type="submit" className="px-4 py-2 text-sm font-medium rounded-lg bg-violet-500 hover:bg-violet-600 text-white transition-colors">
              저장
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
