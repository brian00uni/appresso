import React, { useEffect, useState } from 'react'
import { geocodeAddress, searchNearbyRestaurants, hasKakaoKey } from '../../lib/gaseongbi/kakaoLocal'

// 우리 가게 위치(설정 > 매장 정보) 주변 음식점을 카카오 로컬 API로 불러와
// 지역 경쟁가게로 추가할 수 있게 선택하는 모달
export default function NearbyCompetitorPicker({ open, location, excludeNames = [], onAdd, onClose }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [places, setPlaces] = useState([])
  const [selected, setSelected] = useState([])

  useEffect(() => {
    if (!open) return
    setSelected([])
    setPlaces([])
    setError('')

    if (!hasKakaoKey()) {
      setError('Kakao API 키가 설정되지 않아 추천을 불러올 수 없어요.')
      return
    }
    if (!location?.trim()) {
      setError('설정 > 매장 정보에서 우리 가게 위치를 먼저 입력해주세요.')
      return
    }

    const exclude = new Set(excludeNames)
    setLoading(true)
    geocodeAddress(location)
      .then((geo) => {
        if (!geo) {
          setError('위치를 찾을 수 없어요. 설정 > 매장 정보의 위치를 더 구체적으로 입력해주세요.')
          return null
        }
        return searchNearbyRestaurants({ x: geo.x, y: geo.y, radius: 1500 })
      })
      .then((results) => {
        if (!results) return
        setPlaces(results.filter((p) => !exclude.has(p.name)))
        if (results.length === 0) setError('주변에서 음식점을 찾지 못했어요.')
      })
      .catch(() => setError('검색 중 문제가 발생했어요.'))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  if (!open) return null

  const toggle = (name) => {
    setSelected((sel) => (sel.includes(name) ? sel.filter((n) => n !== name) : [...sel, name]))
  }

  const handleAdd = () => {
    const picked = places.filter((p) => selected.includes(p.name))
    onAdd(picked)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg w-full max-w-lg p-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1">주변 음식점 추천</h2>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">{location} 반경 1.5km 내 음식점을 카카오맵에서 불러왔어요.</p>

        {loading && <p className="text-sm text-gray-400 dark:text-gray-500 py-6 text-center">불러오는 중...</p>}
        {!loading && error && <p className="text-sm text-gray-400 dark:text-gray-500 py-6 text-center">{error}</p>}

        {!loading && !error && (
          <div className="max-h-80 overflow-y-auto space-y-1.5 mb-4">
            {places.map((p) => (
              <label
                key={`${p.name}-${p.address}`}
                className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900/40 hover:bg-gray-100 dark:hover:bg-gray-700/40 transition-colors cursor-pointer"
              >
                <input
                  type="checkbox"
                  className="rounded border-gray-300 dark:border-gray-600 text-violet-500 focus:ring-violet-500"
                  checked={selected.includes(p.name)}
                  onChange={() => toggle(p.name)}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{p.name}</div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 truncate">
                    {p.category} · {p.address}
                  </div>
                </div>
                <div className="flex flex-none items-center gap-2">
                  {p.distance != null && <span className="text-xs text-gray-400 dark:text-gray-500">{p.distance}m</span>}
                  {p.placeUrl && (
                    <a
                      href={p.placeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs font-medium text-violet-500 hover:underline whitespace-nowrap"
                    >
                      가격 보기 ↗
                    </a>
                  )}
                </div>
              </label>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-100 dark:bg-gray-700/60 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleAdd}
            disabled={selected.length === 0}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-violet-500 hover:bg-violet-600 text-white transition-colors disabled:opacity-50"
          >
            선택한 가게 추가 ({selected.length})
          </button>
        </div>
      </div>
    </div>
  )
}
