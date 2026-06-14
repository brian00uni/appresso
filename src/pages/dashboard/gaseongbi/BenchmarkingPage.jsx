import React, { useMemo, useState } from 'react'
import {
  getBenchmark,
  saveMyStore,
  addCompetitor,
  updateCompetitor,
  deleteCompetitor,
  getBenchmarkHistory,
  addBenchmarkSnapshot,
  getStoreInfo,
} from '../../../lib/gaseongbi/storage'
import { formatWon } from '../../../lib/gaseongbi/calc'
import BenchmarkRadarChart from '../../../components/gaseongbi/BenchmarkRadarChart'
import MyStoreFormModal from '../../../components/gaseongbi/MyStoreFormModal'
import CompetitorFormModal from '../../../components/gaseongbi/CompetitorFormModal'
import NearbyCompetitorPicker from '../../../components/gaseongbi/NearbyCompetitorPicker'
import SummaryCard from '../../../components/gaseongbi/SummaryCard'

const CARD_CLASS = 'bg-white dark:bg-gray-800 shadow-xs rounded-xl border border-gray-100 dark:border-gray-700/60 p-5'

const METRICS = [
  { key: 'price', label: '가격경쟁력' },
  { key: 'deliveryTip', label: '배달팁 경쟁력' },
  { key: 'coupon', label: '쿠폰전략' },
  { key: 'setCount', label: '세트다양성' },
  { key: 'photo', label: '사진경쟁력' },
  { key: 'review', label: '리뷰반응' },
  { key: 'conversion', label: '주문전환율' },
]

const FIX_TEMPLATES = {
  price: {
    issue: '대표 메뉴 가격이 경쟁사보다 높은 편이에요.',
    tip: '가격을 소폭 조정하거나 구성을 다이어트해서 가격 경쟁력을 확보해보세요.',
    effect: '가격 경쟁력이 개선되면 신규 고객 유입이 늘어날 수 있어요.',
  },
  deliveryTip: {
    issue: '배달팁이 경쟁사보다 높은 편이에요.',
    tip: '배달팁을 낮추거나 일정 금액 이상 무료배달 정책을 검토해보세요.',
    effect: '배달팁을 낮추면 주문 전환율이 올라갈 수 있어요.',
  },
  coupon: {
    issue: '쿠폰 비용 부담이 경쟁사보다 큰 편이에요.',
    tip: '쿠폰 금액을 줄이고 대신 리뷰 이벤트 등 다른 혜택으로 전환해보세요.',
    effect: '쿠폰 비용을 줄이면 메뉴별 순이익이 개선돼요.',
  },
  setCount: {
    issue: '세트 메뉴 구성이 경쟁사보다 부족해요.',
    tip: '인기 메뉴를 묶은 세트 메뉴를 추가해 객단가를 높여보세요.',
    effect: '세트 메뉴가 늘어나면 평균 주문 금액이 올라갈 수 있어요.',
  },
  photo: {
    issue: '메뉴 사진 경쟁력이 경쟁사보다 낮아요.',
    tip: '대표 메뉴 사진을 전문가 스타일로 교체해보세요.',
    effect: '사진 품질이 좋아지면 클릭률과 전환율이 함께 오를 수 있어요.',
  },
  review: {
    issue: '리뷰 이벤트 반응이 경쟁사보다 약해요.',
    tip: '리뷰 작성 시 추가 혜택을 주는 이벤트를 운영해보세요.',
    effect: '리뷰가 쌓이면 신규 고객의 신뢰도와 전환율이 올라가요.',
  },
  conversion: {
    issue: '주문 전환율이 경쟁사보다 낮은 편이에요.',
    tip: '노출 순서, 대표 사진, 첫 메뉴 구성을 점검해보세요.',
    effect: '전환율이 개선되면 같은 노출로도 더 많은 주문을 받을 수 있어요.',
  },
}

function clamp(v) {
  return Math.max(0, Math.min(100, v || 0))
}

function computeScores(store, refMax) {
  const priceScore = refMax.repPrice > 0 ? clamp(100 - (store.repPrice / refMax.repPrice) * 100) : 50
  const deliveryScore = refMax.deliveryTip > 0 ? clamp(100 - (store.deliveryTip / refMax.deliveryTip) * 100) : 50
  const couponScore = refMax.coupon > 0 ? clamp(100 - (store.coupon / refMax.coupon) * 100) : 50
  const setCountScore = refMax.setCount > 0 ? clamp((store.setCount / refMax.setCount) * 100) : 0
  const photoScore = clamp(store.photoStyle)
  const reviewScore = clamp((store.reviewEvent + store.reviewScore * 20) / 2)
  const conversionScore = clamp(store.conversionRate)
  return {
    price: priceScore,
    deliveryTip: deliveryScore,
    coupon: couponScore,
    setCount: setCountScore,
    photo: photoScore,
    review: reviewScore,
    conversion: conversionScore,
  }
}

function avgScores(list) {
  if (!list || list.length === 0) return null
  const sums = {}
  METRICS.forEach((m) => (sums[m.key] = 0))
  list.forEach((scores) => METRICS.forEach((m) => (sums[m.key] += scores[m.key])))
  const result = {}
  METRICS.forEach((m) => (result[m.key] = sums[m.key] / list.length))
  return result
}

function avgOf(scores) {
  if (!scores) return null
  return METRICS.reduce((sum, m) => sum + scores[m.key], 0) / METRICS.length
}

function CompetitorCard({ competitor, onEdit, onDelete }) {
  return (
    <div className="rounded-lg bg-gray-50 dark:bg-gray-900/40 p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="min-w-0">
          <span className="font-medium text-gray-800 dark:text-gray-100 truncate">{competitor.name}</span>
          {(competitor.category || competitor.address) && (
            <div className="text-xs text-gray-400 dark:text-gray-500 truncate">
              {[competitor.category, competitor.address].filter(Boolean).join(' · ')}
            </div>
          )}
        </div>
        <div className="flex gap-1 text-xs flex-none">
          <button onClick={() => onEdit(competitor)} className="text-violet-500 hover:underline">
            수정
          </button>
          <button onClick={() => onDelete(competitor.id)} className="text-red-500 hover:underline">
            삭제
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-1 text-xs text-gray-500 dark:text-gray-400">
        <span>대표가격 {formatWon(competitor.repPrice)}</span>
        <span>배달팁 {formatWon(competitor.deliveryTip)}</span>
        <span>쿠폰 {formatWon(competitor.coupon)}</span>
        <span>세트 {competitor.setCount}개</span>
        <span>리뷰 {competitor.reviewScore}점</span>
        <span>전환율 {competitor.conversionRate}%</span>
      </div>
    </div>
  )
}

export default function BenchmarkingPage() {
  const [benchmark, setBenchmark] = useState(() => getBenchmark())
  const [history, setHistory] = useState(() => getBenchmarkHistory())
  const [storeInfo] = useState(() => getStoreInfo())
  const [myStoreModalOpen, setMyStoreModalOpen] = useState(false)
  const [competitorModal, setCompetitorModal] = useState({ open: false, editing: null })
  const [nearbyPickerOpen, setNearbyPickerOpen] = useState(false)

  const { myStore, competitors } = benchmark
  const localCompetitors = competitors.filter((c) => c.group === 'local')
  const nationalCompetitors = competitors.filter((c) => c.group === 'national')

  const refMax = useMemo(() => {
    const all = [myStore, ...competitors]
    return {
      repPrice: Math.max(0, ...all.map((s) => s.repPrice || 0)),
      deliveryTip: Math.max(0, ...all.map((s) => s.deliveryTip || 0)),
      coupon: Math.max(0, ...all.map((s) => s.coupon || 0)),
      setCount: Math.max(0, ...all.map((s) => s.setCount || 0)),
    }
  }, [myStore, competitors])

  const myScores = useMemo(() => computeScores(myStore, refMax), [myStore, refMax])
  const localScores = useMemo(() => avgScores(localCompetitors.map((c) => computeScores(c, refMax))), [localCompetitors, refMax])
  const nationalScores = useMemo(() => avgScores(nationalCompetitors.map((c) => computeScores(c, refMax))), [nationalCompetitors, refMax])
  const overallAvg = useMemo(() => avgScores([localScores, nationalScores].filter(Boolean)), [localScores, nationalScores])

  const series = useMemo(() => {
    const s = [{ label: '우리 가게', data: METRICS.map((m) => myScores[m.key]) }]
    if (localScores) s.push({ label: '지역 평균', data: METRICS.map((m) => localScores[m.key]) })
    if (nationalScores) s.push({ label: '전국 평균', data: METRICS.map((m) => nationalScores[m.key]) })
    return s
  }, [myScores, localScores, nationalScores])

  const checklist = useMemo(() => {
    return METRICS.map((m) => {
      const my = myScores[m.key]
      const base = overallAvg ? overallAvg[m.key] : null
      const delta = base != null ? my - base : null
      const arrow = delta == null ? '-' : delta > 5 ? '▲' : delta < -5 ? '▼' : '-'
      return { ...m, my, local: localScores ? localScores[m.key] : null, national: nationalScores ? nationalScores[m.key] : null, delta, arrow }
    })
  }, [myScores, localScores, nationalScores, overallAvg])

  const topFixes = useMemo(() => {
    return checklist
      .filter((c) => c.delta != null)
      .sort((a, b) => a.delta - b.delta)
      .slice(0, 3)
  }, [checklist])

  const handleSaveMyStore = (form) => {
    saveMyStore(form)
    setBenchmark(getBenchmark())
    setMyStoreModalOpen(false)
  }

  const handleSaveCompetitor = (form) => {
    if (form.id) {
      updateCompetitor(form.id, form)
    } else {
      addCompetitor(form)
    }
    setBenchmark(getBenchmark())
    setCompetitorModal({ open: false, editing: null })
  }

  const handleDeleteCompetitor = (id) => {
    deleteCompetitor(id)
    setBenchmark(getBenchmark())
  }

  const handleAddNearby = (places) => {
    places.forEach((p) => addCompetitor({ group: 'local', name: p.name, address: p.address, category: p.category }))
    setBenchmark(getBenchmark())
    setNearbyPickerOpen(false)
  }

  const handleSaveSnapshot = () => {
    const avg = (s) => (s != null ? avgOf(s)?.toFixed(1) : null)
    const parts = [`우리가게 평균 ${avg(myScores)}점`]
    if (localScores) parts.push(`지역평균 ${avg(localScores)}점`)
    if (nationalScores) parts.push(`전국평균 ${avg(nationalScores)}점`)
    addBenchmarkSnapshot(parts.join(' · '))
    setHistory(getBenchmarkHistory())
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">벤치마킹</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">우리 가게와 경쟁 가게의 운영 전략을 비교해보세요.</p>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          icon="location"
          label="우리 가게 위치"
          value={storeInfo.location || '위치 미입력'}
          sub={storeInfo.repCategory || '설정에서 매장 정보를 입력해보세요'}
          tone="violet"
        />
        <SummaryCard icon="group" label="지역 비교" value={`${localCompetitors.length}곳`} sub="반경 내 경쟁 가게" tone="blue" />
        <SummaryCard icon="map" label="전국 참고" value={`${nationalCompetitors.length}곳`} sub="유사 업종 기준" tone="green" />
        <SummaryCard icon="target" label="오늘 고칠 포인트" value={`${topFixes.length}개`} sub="우선순위 개선 항목" tone="yellow" />
      </div>

      {competitors.length === 0 && (
        <div className="bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/30 rounded-xl p-4 text-sm text-violet-700 dark:text-violet-300">
          아직 비교할 가게 정보가 없어요. 스크래핑 등 자동 수집은 제공되지 않으니, 비교할 가게 정보를 직접 입력해주세요.
        </div>
      )}

      {/* 가게 카드들 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className={CARD_CLASS}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">우리 가게</h2>
            <button onClick={() => setMyStoreModalOpen(true)} className="text-xs text-violet-500 hover:underline">
              수정
            </button>
          </div>
          <div className="mb-2">
            <div className="font-medium text-gray-800 dark:text-gray-100">{myStore.name || '(가게 이름 미입력)'}</div>
            {(storeInfo.location || storeInfo.repCategory) && (
              <div className="text-xs text-gray-400 dark:text-gray-500">{[storeInfo.location, storeInfo.repCategory].filter(Boolean).join(' · ')}</div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <span>대표가격 {formatWon(myStore.repPrice)}</span>
            <span>배달팁 {formatWon(myStore.deliveryTip)}</span>
            <span>쿠폰 {formatWon(myStore.coupon)}</span>
            <span>세트 {myStore.setCount}개</span>
            <span>리뷰 {myStore.reviewScore}점</span>
            <span>전환율 {myStore.conversionRate}%</span>
          </div>
        </div>

        <div className={CARD_CLASS}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">지역 경쟁가게</h2>
            <div className="flex items-center gap-2 text-xs">
              <button onClick={() => setNearbyPickerOpen(true)} className="text-violet-500 hover:underline">
                주변 추천 불러오기
              </button>
              <button
                onClick={() => setCompetitorModal({ open: true, editing: { group: 'local' } })}
                className="text-violet-500 hover:underline"
              >
                + 새 비교 가게 추가
              </button>
            </div>
          </div>
          {localCompetitors.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 py-6 text-center">등록된 지역 경쟁가게가 없어요.</p>
          ) : (
            <div className="space-y-2">
              {localCompetitors.map((c) => (
                <CompetitorCard key={c.id} competitor={c} onEdit={(comp) => setCompetitorModal({ open: true, editing: comp })} onDelete={handleDeleteCompetitor} />
              ))}
            </div>
          )}
        </div>

        <div className={CARD_CLASS}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">전국 참고가게</h2>
            <button
              onClick={() => setCompetitorModal({ open: true, editing: { group: 'national' } })}
              className="text-xs text-violet-500 hover:underline"
            >
              + 새 비교 가게 추가
            </button>
          </div>
          {nationalCompetitors.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 py-6 text-center">등록된 전국 참고가게가 없어요.</p>
          ) : (
            <div className="space-y-2">
              {nationalCompetitors.map((c) => (
                <CompetitorCard key={c.id} competitor={c} onEdit={(comp) => setCompetitorModal({ open: true, editing: comp })} onDelete={handleDeleteCompetitor} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 주요 지표 비교 */}
      <div className={CARD_CLASS}>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">주요 지표 비교</h2>
        <BenchmarkRadarChart labels={METRICS.map((m) => m.label)} series={series} />
      </div>

      {/* 비교 체크리스트 */}
      <div className={CARD_CLASS}>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">비교 체크리스트</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700/60">
                <th className="py-2 pr-4">항목</th>
                <th className="py-2 pr-4 text-right">우리가게</th>
                <th className="py-2 pr-4 text-right">지역평균</th>
                <th className="py-2 pr-4 text-right">전국평균</th>
                <th className="py-2 pr-4 text-right">비교결과</th>
              </tr>
            </thead>
            <tbody className="text-gray-700 dark:text-gray-300">
              {checklist.map((row) => (
                <tr key={row.key} className="border-b border-gray-50 dark:border-gray-700/40 last:border-0">
                  <td className="py-2 pr-4">{row.label}</td>
                  <td className="py-2 pr-4 text-right">{row.my.toFixed(0)}점</td>
                  <td className="py-2 pr-4 text-right">{row.local != null ? `${row.local.toFixed(0)}점` : '-'}</td>
                  <td className="py-2 pr-4 text-right">{row.national != null ? `${row.national.toFixed(0)}점` : '-'}</td>
                  <td
                    className={`py-2 pr-4 text-right font-semibold ${
                      row.arrow === '▲' ? 'text-green-600 dark:text-green-400' : row.arrow === '▼' ? 'text-red-600 dark:text-red-400' : 'text-gray-400'
                    }`}
                  >
                    {row.arrow}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!overallAvg && <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">경쟁 가게를 등록하면 비교 결과가 표시돼요.</p>}
      </div>

      {/* 오늘 고칠 것 3개 */}
      <div className={CARD_CLASS}>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">오늘 고칠 것 3개</h2>
        {topFixes.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 py-6 text-center">경쟁 가게를 등록하면 개선 포인트를 알려드려요.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {topFixes.map((fix) => {
              const tpl = FIX_TEMPLATES[fix.key]
              return (
                <div key={fix.key} className="rounded-lg bg-gray-50 dark:bg-gray-900/40 p-4">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-1">{fix.label}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{tpl.issue}</p>
                  <p className="text-sm text-violet-600 dark:text-violet-400 mb-2">{tpl.tip}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{tpl.effect}</p>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 벤치마킹 저장함 */}
      <div className={CARD_CLASS}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">벤치마킹 저장함</h2>
          <button onClick={handleSaveSnapshot} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-violet-500 hover:bg-violet-600 text-white transition-colors">
            새 비교 저장
          </button>
        </div>
        {history.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 py-6 text-center">저장된 비교 기록이 없어요.</p>
        ) : (
          <div className="space-y-2">
            {history.map((h) => (
              <div key={h.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-900/40 text-sm">
                <span className="text-gray-800 dark:text-gray-100">{h.summary}</span>
                <span className="text-xs text-gray-400 dark:text-gray-500">{new Date(h.date).toLocaleDateString('ko-KR')}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <MyStoreFormModal open={myStoreModalOpen} initialValue={myStore} onSave={handleSaveMyStore} onClose={() => setMyStoreModalOpen(false)} />
      <CompetitorFormModal
        open={competitorModal.open}
        initialValue={competitorModal.editing}
        onSave={handleSaveCompetitor}
        onClose={() => setCompetitorModal({ open: false, editing: null })}
      />
      <NearbyCompetitorPicker
        open={nearbyPickerOpen}
        location={storeInfo.location}
        excludeNames={[myStore.name, ...competitors.map((c) => c.name)]}
        onAdd={handleAddNearby}
        onClose={() => setNearbyPickerOpen(false)}
      />
    </div>
  )
}
