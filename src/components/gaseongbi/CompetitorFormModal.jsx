import React, { useState, useEffect } from 'react'
import { searchPlaces, hasKakaoKey } from '../../lib/gaseongbi/kakaoLocal'

const inputClass =
  'w-full px-3 py-2 text-sm bg-white dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700/60 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-lg outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all'

const labelClass = 'block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1'

const EMPTY = {
  group: 'local',
  name: '',
  address: '',
  category: '',
  repPrice: 0,
  deliveryTip: 0,
  coupon: 0,
  setCount: 0,
  photoStyle: 0,
  reviewEvent: 0,
  reviewScore: 0,
  conversionRate: 0,
}

export default function CompetitorFormModal({ open, initialValue, onSave, onClose }) {
  const [form, setForm] = useState(EMPTY)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')

  useEffect(() => {
    if (open) {
      setForm({ ...EMPTY, ...initialValue })
      setSearchQuery('')
      setSearchResults([])
      setSearchError('')
    }
  }, [open, initialValue])

  if (!open) return null

  const setNumber = (key, value) => setForm((f) => ({ ...f, [key]: value === '' ? 0 : Number(value) }))
  const setText = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setSearching(true)
    setSearchError('')
    try {
      const results = await searchPlaces(searchQuery)
      setSearchResults(results)
      if (results.length === 0) setSearchError('검색 결과가 없어요.')
    } catch (err) {
      setSearchResults([])
      setSearchError(
        err.message === 'KAKAO_API_KEY_MISSING'
          ? 'Kakao API 키가 설정되지 않아 검색을 사용할 수 없어요. 가게 정보를 직접 입력해주세요.'
          : '검색 중 문제가 발생했어요. 가게 정보를 직접 입력해주세요.'
      )
    } finally {
      setSearching(false)
    }
  }

  const handleSelectResult = (place) => {
    setForm((f) => ({ ...f, name: place.name, address: place.address, category: place.category }))
    setSearchResults([])
    setSearchQuery('')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    onSave(form)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg w-full max-w-lg p-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">{initialValue?.id ? '비교 가게 수정' : '비교 가게 추가'}</h2>

        <div className="mb-4">
          <label className={labelClass}>가게 검색 (카카오맵)</label>
          <div className="flex gap-2">
            <input
              className={inputClass}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleSearch()
                }
              }}
              placeholder="가게 이름 또는 지역으로 검색"
              disabled={!hasKakaoKey()}
            />
            <button
              type="button"
              onClick={handleSearch}
              disabled={!hasKakaoKey() || searching}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-100 dark:bg-gray-700/60 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              {searching ? '검색 중...' : '검색'}
            </button>
          </div>
          {!hasKakaoKey() && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">Kakao API 키가 설정되지 않아 검색을 사용할 수 없어요. 가게 정보를 직접 입력해주세요.</p>
          )}
          {searchError && hasKakaoKey() && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">{searchError}</p>}
          {searchResults.length > 0 && (
            <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700/60 divide-y divide-gray-100 dark:divide-gray-700/60">
              {searchResults.map((place, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectResult(place)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
                >
                  <div className="text-sm font-medium text-gray-800 dark:text-gray-100">{place.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {place.category} · {place.address}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>가게 이름</label>
              <input className={inputClass} value={form.name} onChange={(e) => setText('name', e.target.value)} placeholder="예: 옆집 김밥집" required />
            </div>
            <div>
              <label className={labelClass}>구분</label>
              <select className={inputClass} value={form.group} onChange={(e) => setText('group', e.target.value)}>
                <option value="local">지역 경쟁가게</option>
                <option value="national">전국 참고가게</option>
              </select>
            </div>
          </div>

          {(form.address || form.category) && (
            <div className="text-xs text-gray-500 dark:text-gray-400 -mt-2">
              {form.category && <span>{form.category}</span>}
              {form.category && form.address && <span> · </span>}
              {form.address && <span>{form.address}</span>}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>대표 메뉴 가격 (원)</label>
              <input type="text" className={inputClass} value={form.repPrice} min={0} onChange={(e) => setNumber('repPrice', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>배달팁 (원)</label>
              <input type="text" className={inputClass} value={form.deliveryTip} min={0} onChange={(e) => setNumber('deliveryTip', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>쿠폰 금액 (원)</label>
              <input type="text" className={inputClass} value={form.coupon} min={0} onChange={(e) => setNumber('coupon', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>세트 메뉴 수</label>
              <input type="text" className={inputClass} value={form.setCount} min={0} onChange={(e) => setNumber('setCount', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>사진 경쟁력 (0~100)</label>
              <input type="text" className={inputClass} value={form.photoStyle} min={0} max={100} onChange={(e) => setNumber('photoStyle', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>리뷰 이벤트 반응도 (0~100)</label>
              <input type="text" className={inputClass} value={form.reviewEvent} min={0} max={100} onChange={(e) => setNumber('reviewEvent', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>리뷰 평점 (0~5)</label>
              <input type="text" className={inputClass} value={form.reviewScore} min={0} max={5} step={0.1} onChange={(e) => setNumber('reviewScore', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>주문 전환율 (%)</label>
              <input type="text" className={inputClass} value={form.conversionRate} min={0} max={100} onChange={(e) => setNumber('conversionRate', e.target.value)} />
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
