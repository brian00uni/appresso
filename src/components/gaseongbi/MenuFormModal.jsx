import React, { useState, useEffect } from 'react'
import { MENU_CATEGORIES } from '../../lib/gaseongbi/platforms'

const inputClass =
  'w-full px-3 py-2 text-sm bg-white dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700/60 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-lg outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all'

const labelClass = 'block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1'

const EMPTY = {
  menuName: '',
  category: '',
  deliveryPrice: 0,
  foodCost: 0,
  packingCost: 0,
  defaultCoupon: 0,
  memo: '',
}

export default function MenuFormModal({ open, initialValue, onSave, onClose }) {
  const [form, setForm] = useState(EMPTY)

  useEffect(() => {
    if (open) setForm({ ...EMPTY, ...initialValue })
  }, [open, initialValue])

  if (!open) return null

  const handleChange = (key, value) => setForm((f) => ({ ...f, [key]: value }))
  const handleNumberChange = (key, value) => handleChange(key, value === '' ? 0 : Number(value))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.menuName.trim()) return
    onSave(form)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg w-full max-w-lg p-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
          {initialValue?.id ? '메뉴 수정' : '메뉴 추가'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>메뉴명</label>
              <input
                className={inputClass}
                value={form.menuName}
                onChange={(e) => handleChange('menuName', e.target.value)}
                placeholder="예: 후라이드 치킨"
                required
              />
            </div>
            <div>
              <label className={labelClass}>카테고리</label>
              <select className={inputClass} value={form.category} onChange={(e) => handleChange('category', e.target.value)}>
                <option value="">선택 안 함</option>
                {MENU_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>판매가 (원)</label>
              <input
                type="text"
                className={inputClass}
                value={form.deliveryPrice}
                onChange={(e) => handleNumberChange('deliveryPrice', e.target.value)}
                min={0}
              />
            </div>
            <div>
              <label className={labelClass}>식재료원가 (원)</label>
              <input
                type="text"
                className={inputClass}
                value={form.foodCost}
                onChange={(e) => handleNumberChange('foodCost', e.target.value)}
                min={0}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>포장비 (원)</label>
              <input
                type="text"
                className={inputClass}
                value={form.packingCost}
                onChange={(e) => handleNumberChange('packingCost', e.target.value)}
                min={0}
              />
            </div>
            <div>
              <label className={labelClass}>기본 쿠폰 (원)</label>
              <input
                type="text"
                className={inputClass}
                value={form.defaultCoupon}
                onChange={(e) => handleNumberChange('defaultCoupon', e.target.value)}
                min={0}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>메모</label>
            <textarea
              className={inputClass}
              rows={2}
              value={form.memo}
              onChange={(e) => handleChange('memo', e.target.value)}
              placeholder="예: 주말 한정 메뉴"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-white dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700/60 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
            >
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
