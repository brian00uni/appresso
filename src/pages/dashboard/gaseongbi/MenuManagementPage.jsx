import React, { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMenus, getSettings, addMenu, updateMenu, deleteMenu, duplicateMenu } from '../../../lib/gaseongbi/storage'
import { calcMenuMargin, formatWon, formatPercent } from '../../../lib/gaseongbi/calc'
import { PLATFORM_ORDER } from '../../../lib/gaseongbi/platforms'
import MenuFormModal from '../../../components/gaseongbi/MenuFormModal'
import RatingBadge from '../../../components/gaseongbi/RatingBadge'
import SummaryCard from '../../../components/gaseongbi/SummaryCard'

const inputClass =
  'px-3 py-2 text-sm bg-white dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700/60 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-lg outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all'

const CARD_CLASS = 'bg-white dark:bg-gray-800 shadow-xs rounded-xl border border-gray-100 dark:border-gray-700/60 p-5'

const PAGE_SIZE = 8

export default function MenuManagementPage() {
  const navigate = useNavigate()
  const [menus, setMenus] = useState(() => getMenus())
  const settings = useMemo(() => getSettings(), [])
  const referencePlatform = settings.defaults.referencePlatform || PLATFORM_ORDER[0]

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('전체')
  const [viewMode, setViewMode] = useState('table')
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  const rows = useMemo(
    () => menus.map((menu) => ({ menu, result: calcMenuMargin(menu, settings, referencePlatform) })),
    [menus, settings, referencePlatform]
  )

  const categories = useMemo(() => {
    const set = new Set(menus.map((m) => m.category).filter(Boolean))
    return ['전체', ...Array.from(set)]
  }, [menus])

  const filtered = useMemo(() => {
    return rows.filter(({ menu }) => {
      const matchesSearch = menu.menuName.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = category === '전체' || menu.category === category
      return matchesSearch && matchesCategory
    })
  }, [rows, search, category])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  useEffect(() => {
    if (page > totalPages) setPage(1)
  }, [totalPages, page])

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const selected = useMemo(() => {
    if (selectedId) {
      const found = rows.find((r) => r.menu.id === selectedId)
      if (found) return found
    }
    return paged[0] || rows[0] || null
  }, [selectedId, rows, paged])

  const recentEdits = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    return menus.filter((m) => new Date(m.updatedAt).getTime() >= weekAgo).length
  }, [menus])

  const recentMenus = useMemo(() => {
    return [...menus].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 5)
  }, [menus])

  const avgMargin = rows.length > 0 ? rows.reduce((sum, r) => sum + r.result.marginRate, 0) / rows.length : 0
  const riskCount = rows.filter((r) => r.result.rating === 'red').length

  const openAddModal = () => {
    setEditing(null)
    setModalOpen(true)
  }

  const openEditModal = (menu) => {
    setEditing(menu)
    setModalOpen(true)
  }

  const handleSave = (form) => {
    if (editing) {
      updateMenu(editing.id, form)
    } else {
      addMenu(form)
    }
    setMenus(getMenus())
    setModalOpen(false)
  }

  const handleDelete = (id) => {
    if (!window.confirm('이 메뉴를 삭제할까요?')) return
    deleteMenu(id)
    setMenus(getMenus())
    if (selectedId === id) setSelectedId(null)
  }

  const handleDuplicate = (id) => {
    duplicateMenu(id)
    setMenus(getMenus())
  }

  const handleSendToCalculator = (id) => {
    navigate(`/dashboard/calculator?menuId=${id}`)
  }

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:justify-between sm:items-center">
        <div>
          <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">메뉴관리</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">메뉴별 판매가/원가/포장비/쿠폰을 등록하고 마진계산에 바로 보낼 수 있어요.</p>
        </div>
        <button
          onClick={openAddModal}
          className="mt-4 sm:mt-0 px-4 py-2 text-sm font-medium rounded-lg bg-violet-500 hover:bg-violet-600 text-white transition-colors"
        >
          + 메뉴 추가
        </button>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard icon="store" label="총 메뉴 수" value={`${menus.length}개`} tone="violet" />
        <SummaryCard icon="pie" label="평균 마진율" value={formatPercent(avgMargin)} tone="green" />
        <SummaryCard icon="warning" label="위험 메뉴" value={`${riskCount}개`} tone="red" />
        <SummaryCard icon="ai" label="최근 7일 수정" value={`${recentEdits}건`} tone="blue" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 좌측: 목록 */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-3">
              <input
                className={`${inputClass} w-56`}
                placeholder="메뉴명 검색"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
              />
              <div className="flex flex-wrap gap-1.5">
                {categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setCategory(c)
                      setPage(1)
                    }}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                      category === c
                        ? 'bg-violet-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700/60 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-700/60 rounded-lg p-1">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  viewMode === 'table' ? 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 shadow-xs' : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                표
              </button>
              <button
                onClick={() => setViewMode('card')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  viewMode === 'card' ? 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 shadow-xs' : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                카드
              </button>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className={`${CARD_CLASS} text-center py-12 text-gray-500 dark:text-gray-400`}>
              {menus.length === 0 ? '아직 등록된 메뉴가 없어요. 위의 "메뉴 추가" 버튼으로 시작해보세요.' : '검색 결과가 없어요.'}
            </div>
          ) : viewMode === 'table' ? (
            <div className="bg-white dark:bg-gray-800 shadow-xs rounded-xl border border-gray-100 dark:border-gray-700/60 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-900/40 text-xs text-gray-500 dark:text-gray-400 uppercase">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">메뉴명</th>
                      <th className="px-4 py-3 text-left font-medium">카테고리</th>
                      <th className="px-4 py-3 text-right font-medium">판매가</th>
                      <th className="px-4 py-3 text-right font-medium">원가</th>
                      <th className="px-4 py-3 text-right font-medium">포장비</th>
                      <th className="px-4 py-3 text-right font-medium">쿠폰</th>
                      <th className="px-4 py-3 text-center font-medium">상태</th>
                      <th className="px-4 py-3 text-center font-medium">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                    {paged.map(({ menu, result }) => (
                      <tr
                        key={menu.id}
                        onClick={() => setSelectedId(menu.id)}
                        className={`text-gray-800 dark:text-gray-100 cursor-pointer transition-colors ${
                          selected?.menu.id === menu.id ? 'bg-violet-500/5' : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'
                        }`}
                      >
                        <td className="px-4 py-3 font-medium">{menu.menuName}</td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{menu.category || '-'}</td>
                        <td className="px-4 py-3 text-right">{formatWon(menu.deliveryPrice)}</td>
                        <td className="px-4 py-3 text-right">{formatWon(menu.foodCost)}</td>
                        <td className="px-4 py-3 text-right">{formatWon(menu.packingCost)}</td>
                        <td className="px-4 py-3 text-right">{formatWon(menu.defaultCoupon)}</td>
                        <td className="px-4 py-3 text-center">
                          <RatingBadge rating={result.rating} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1 text-xs">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleSendToCalculator(menu.id)
                              }}
                              className="px-2 py-1 rounded text-violet-600 dark:text-violet-400 hover:bg-violet-500/10 transition-colors"
                            >
                              마진계산
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                openEditModal(menu)
                              }}
                              className="px-2 py-1 rounded text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/40 transition-colors"
                            >
                              수정
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDuplicate(menu.id)
                              }}
                              className="px-2 py-1 rounded text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/40 transition-colors"
                            >
                              복사
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDelete(menu.id)
                              }}
                              className="px-2 py-1 rounded text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                              삭제
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-1 py-3 border-t border-gray-100 dark:border-gray-700/60">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 text-sm rounded-lg transition-colors ${
                        p === page ? 'bg-violet-500 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/40'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {paged.map(({ menu, result }) => (
                  <div
                    key={menu.id}
                    onClick={() => setSelectedId(menu.id)}
                    className={`${CARD_CLASS} cursor-pointer transition-colors ${selected?.menu.id === menu.id ? 'ring-2 ring-violet-500' : ''}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-semibold text-gray-800 dark:text-gray-100">{menu.menuName}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{menu.category || '-'}</div>
                      </div>
                      <RatingBadge rating={result.rating} />
                    </div>
                    <div className="text-lg font-bold text-gray-800 dark:text-gray-100">{formatWon(menu.deliveryPrice)}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">마진율 {formatPercent(result.marginRate)}</div>
                    <div className="flex gap-1 text-xs mt-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSendToCalculator(menu.id)
                        }}
                        className="px-2 py-1 rounded text-violet-600 dark:text-violet-400 hover:bg-violet-500/10 transition-colors"
                      >
                        마진계산
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          openEditModal(menu)
                        }}
                        className="px-2 py-1 rounded text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/40 transition-colors"
                      >
                        수정
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(menu.id)
                        }}
                        className="px-2 py-1 rounded text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-1 py-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 text-sm rounded-lg transition-colors ${
                        p === page ? 'bg-violet-500 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/40'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* 우측: 미리보기 + 팁 + 최근 메뉴 */}
        <div className="space-y-4">
          <div className={CARD_CLASS}>
            <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-3">선택 메뉴 미리보기</h2>
            {selected ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-gray-800 dark:text-gray-100">{selected.menu.menuName}</div>
                  <RatingBadge rating={selected.result.rating} />
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-gray-50 dark:bg-gray-900/40 rounded-lg px-3 py-2">
                    <div className="text-xs text-gray-500 dark:text-gray-400">판매가</div>
                    <div className="font-semibold text-gray-800 dark:text-gray-100">{formatWon(selected.menu.deliveryPrice)}</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900/40 rounded-lg px-3 py-2">
                    <div className="text-xs text-gray-500 dark:text-gray-400">건당 순이익</div>
                    <div className={`font-semibold ${selected.result.netProfit >= 0 ? 'text-gray-800 dark:text-gray-100' : 'text-red-600 dark:text-red-400'}`}>
                      {formatWon(selected.result.netProfit)}
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900/40 rounded-lg px-3 py-2">
                    <div className="text-xs text-gray-500 dark:text-gray-400">마진율</div>
                    <div className="font-semibold text-gray-800 dark:text-gray-100">{formatPercent(selected.result.marginRate)}</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900/40 rounded-lg px-3 py-2">
                    <div className="text-xs text-gray-500 dark:text-gray-400">권장 판매가</div>
                    <div className="font-semibold text-amber-600 dark:text-amber-400">{formatWon(selected.result.recommendedPrice)}</div>
                  </div>
                </div>
                <button
                  onClick={() => handleSendToCalculator(selected.menu.id)}
                  className="w-full px-4 py-2 text-sm font-medium rounded-lg bg-violet-500 hover:bg-violet-600 text-white transition-colors"
                >
                  마진계산으로 이동
                </button>
              </div>
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-500 py-6 text-center">메뉴를 선택하면 미리보기가 표시돼요.</p>
            )}
          </div>

          <div className={CARD_CLASS}>
            <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-2">빠른 원가 입력 팁</h2>
            <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-1.5 list-disc pl-4">
              <li>식재료원가는 최근 구매 영수증 기준으로 입력하면 정확도가 높아져요.</li>
              <li>포장비는 용기·비닐·수저 등을 모두 합산해주세요.</li>
              <li>쿠폰은 사장님이 실제로 부담하는 금액만 입력해요.</li>
            </ul>
          </div>

          <div className={CARD_CLASS}>
            <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-3">최근 추가 메뉴</h2>
            {recentMenus.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 py-2 text-center">등록된 메뉴가 없어요.</p>
            ) : (
              <div className="space-y-2">
                {recentMenus.map((menu) => (
                  <div key={menu.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 dark:text-gray-300 truncate">{menu.menuName}</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0 ml-2">
                      {new Date(menu.createdAt).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <MenuFormModal open={modalOpen} initialValue={editing} onSave={handleSave} onClose={() => setModalOpen(false)} />
    </div>
  )
}
