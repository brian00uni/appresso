import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMenus, getSettings } from '../../../lib/gaseongbi/storage'
import { aggregateMenus, calcMenuMargin, formatWon, formatPercent, getRating } from '../../../lib/gaseongbi/calc'
import { getAdAnalysisComment } from '../../../lib/gaseongbi/aiComment'
import { PLATFORM_ORDER, PLATFORMS } from '../../../lib/gaseongbi/platforms'
import RatingBadge from '../../../components/gaseongbi/RatingBadge'
import SummaryCard from '../../../components/gaseongbi/SummaryCard'
import AiCommentBox from '../../../components/gaseongbi/AiCommentBox'
import PlatformRevenueProfitChart from '../../../components/gaseongbi/PlatformRevenueProfitChart'

const CARD_CLASS = 'bg-white dark:bg-gray-800 shadow-xs rounded-xl border border-gray-100 dark:border-gray-700/60 p-5'

const PERIOD_PRESETS = [
  { id: 'day', label: '어제', days: 1 },
  { id: 'week', label: '7일', days: 7 },
  { id: 'month', label: '30일', days: 30 },
]

export default function AdAnalysisPage() {
  const settings = useMemo(() => getSettings(), [])
  const menus = useMemo(() => getMenus(), [])
  const [period, setPeriod] = useState('month')

  const aggregate = useMemo(() => aggregateMenus(menus, settings), [menus, settings])
  const { total, items, monthlyAdCost, monthlyRevenue, monthlyNetProfit, monthlyUnits, adWarningList } = aggregate
  const adCost = settings.defaults.adCost || 0

  const scale = (PERIOD_PRESETS.find((p) => p.id === period)?.days ?? 30) / 30
  const periodLabel = PERIOD_PRESETS.find((p) => p.id === period)?.label ?? '30일'

  const totalOrders = monthlyUnits * total
  const profitBeforeAd = monthlyNetProfit + monthlyAdCost
  const recoveryRate = monthlyAdCost > 0 ? (profitBeforeAd / monthlyAdCost) * 100 : 0

  const platformAggregates = useMemo(() => {
    return PLATFORM_ORDER.map((id) => {
      let revenue = 0
      let netProfit = 0
      let marginSum = 0
      items.forEach(({ menu }) => {
        const result = calcMenuMargin(menu, settings, id)
        revenue += menu.deliveryPrice * monthlyUnits
        netProfit += result.netProfit * monthlyUnits
        marginSum += result.marginRate
      })
      const avgMargin = items.length > 0 ? marginSum / items.length : 0
      return { id, name: PLATFORMS[id].name, revenue, netProfit, avgMargin, rating: getRating(netProfit, avgMargin) }
    })
  }, [items, settings, monthlyUnits])

  const worstPlatform = useMemo(() => {
    if (platformAggregates.length === 0) return null
    return platformAggregates.reduce((a, b) => (b.netProfit < a.netProfit ? b : a))
  }, [platformAggregates])

  const avgProfitBeforeAdPerOrder = totalOrders > 0 ? profitBeforeAd / totalOrders : 0
  const ordersToRecover = adCost > 0 && avgProfitBeforeAdPerOrder > 0 ? adCost / avgProfitBeforeAdPerOrder : null
  const avgDailyOrders = totalOrders / 30
  const daysToRecover = ordersToRecover != null && avgDailyOrders > 0 ? ordersToRecover / avgDailyOrders : null

  const aiComment = useMemo(() => getAdAnalysisComment(recoveryRate, adWarningList.length), [recoveryRate, adWarningList.length])

  if (total === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">광고비분석</h1>
        <div className={`${CARD_CLASS} text-center py-12 text-gray-500 dark:text-gray-400`}>
          등록된 메뉴가 없어요. 메뉴관리에서 메뉴를 먼저 등록해주세요.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:justify-between sm:items-center">
        <div>
          <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">광고비분석</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">1건당 광고비 {formatWon(adCost)} 기준 · 메뉴당 월 {monthlyUnits}개 판매 가정</p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center gap-2">
          {PERIOD_PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                period === p.id ? 'bg-violet-500 text-white' : 'bg-gray-100 dark:bg-gray-700/60 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {adCost <= 0 ? (
        <div className={`${CARD_CLASS} text-center py-12 text-gray-500 dark:text-gray-400`}>
          설정에서 1건당 광고비를 입력하면 광고비 분석을 볼 수 있어요.{' '}
          <Link to="/dashboard/settings" className="text-violet-500 hover:underline">
            설정으로 이동
          </Link>
        </div>
      ) : (
        <>
          {/* 요약 카드 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <SummaryCard icon="ad" label={`${periodLabel} 광고비`} value={formatWon(monthlyAdCost * scale)} tone="violet" />
            <SummaryCard icon="pie" label={`${periodLabel} 광고 주문 수`} value={`${Math.round(totalOrders * scale).toLocaleString('ko-KR')}건`} tone="blue" />
            <SummaryCard icon="money" label="주문당 광고비" value={formatWon(adCost)} tone="gray" />
            <SummaryCard icon="money" label={`${periodLabel} 광고 매출`} value={formatWon(monthlyRevenue * scale)} tone="green" />
            <SummaryCard
              icon="money"
              label={`${periodLabel} 광고 순이익`}
              value={formatWon(monthlyNetProfit * scale)}
              valueClassName={monthlyNetProfit < 0 ? 'text-red-600 dark:text-red-400' : ''}
              tone={monthlyNetProfit >= 0 ? 'green' : 'red'}
            />
            <SummaryCard
              icon="target"
              label="광고비 회수율"
              value={formatPercent(recoveryRate / 100)}
              sub={recoveryRate >= 100 ? '회수 가능' : '회수 부족'}
              tone={recoveryRate >= 150 ? 'green' : recoveryRate >= 100 ? 'yellow' : 'red'}
            />
          </div>

          {/* 플랫폼별 광고 성과 */}
          <div className={CARD_CLASS}>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">플랫폼별 광고 성과 (월 기준)</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
              {platformAggregates.map((p) => (
                <div key={p.id} className="rounded-lg bg-gray-50 dark:bg-gray-900/40 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-800 dark:text-gray-100">{p.name}</span>
                    <RatingBadge rating={p.rating} />
                  </div>
                  <div className={`text-lg font-bold ${p.netProfit < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-800 dark:text-gray-100'}`}>{formatWon(p.netProfit)}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">광고 포함 월 순이익 · 마진율 {formatPercent(p.avgMargin)}</div>
                </div>
              ))}
            </div>
            <PlatformRevenueProfitChart platforms={platformAggregates} />
          </div>

          {/* 광고비 회수 분석 */}
          <div className={CARD_CLASS}>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">광고비 회수 분석</h2>
            {ordersToRecover == null ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">현재 메뉴 구성으로는 광고비 회수가 어려워요. 판매가/원가/쿠폰을 먼저 점검해 보세요.</p>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-300">
                전체 광고비 {formatWon(monthlyAdCost)}를 회수하려면 약 <span className="font-semibold text-gray-800 dark:text-gray-100">{Math.ceil(ordersToRecover).toLocaleString('ko-KR')}건</span>의 주문이 필요해요.
                현재 일 평균 주문 수({Math.round(avgDailyOrders).toLocaleString('ko-KR')}건) 기준으로는 약{' '}
                <span className="font-semibold text-gray-800 dark:text-gray-100">{Math.ceil(daysToRecover).toLocaleString('ko-KR')}일</span> 안에 회수할 수 있어요.
              </p>
            )}
          </div>

          {/* 광고 주의 메뉴 */}
          <div className={CARD_CLASS}>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">광고 주의 메뉴</h2>
            {adWarningList.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 py-6 text-center">광고비로 인한 주의 메뉴가 없어요.</p>
            ) : (
              <div className="space-y-2">
                {adWarningList.map(({ menu, result, resultNoAd }) => (
                  <Link
                    key={menu.id}
                    to={`/dashboard/calculator?menuId=${menu.id}`}
                    className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-900/40 hover:bg-gray-100 dark:hover:bg-gray-700/40 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="font-medium text-gray-800 dark:text-gray-100 truncate">{menu.menuName || '(이름 없음)'}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        광고 전 {formatWon(resultNoAd.netProfit)} → 광고 후 {formatWon(result.netProfit)}
                      </div>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${result.netProfit <= 0 ? 'bg-red-500/10 text-red-600 dark:text-red-400' : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'}`}>
                      {result.netProfit <= 0 ? '위험도 높음' : '주의'}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* AI 코멘트 */}
          <AiCommentBox comment={aiComment} />

          {/* 이번 달 액션 플랜 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className={CARD_CLASS}>
              <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">① 광고 예산 재배분</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {worstPlatform && worstPlatform.netProfit < 0
                  ? `'${worstPlatform.name}'은 광고 포함 월 순이익이 ${formatWon(worstPlatform.netProfit)}로 가장 낮아요. 이 플랫폼의 광고 예산을 줄이고 성과가 좋은 플랫폼으로 옮겨보세요.`
                  : '플랫폼별 광고 성과가 비교적 균형 잡혀 있어요. 현재 배분을 유지해보세요.'}
              </p>
            </div>
            <div className={CARD_CLASS}>
              <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">② 광고 주의 메뉴 점검</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {adWarningList.length > 0
                  ? `'${adWarningList[0].menu.menuName}' 메뉴는 광고비 영향으로 순이익이 ${formatWon(adWarningList[0].resultNoAd.netProfit)}에서 ${formatWon(adWarningList[0].result.netProfit)}로 줄었어요. 이 메뉴는 광고보다 가격/원가 조정을 먼저 검토해보세요.`
                  : '광고비로 인한 수익성 악화 메뉴가 없어요. 현재 광고 운영이 효율적이에요.'}
              </p>
            </div>
            <div className={CARD_CLASS}>
              <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">③ 회수율 개선</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {recoveryRate < 100
                  ? '광고비 회수율이 100% 미만이에요. 광고 예산을 줄이거나, 마진율이 높은 메뉴 위주로 광고를 집중해보세요.'
                  : recoveryRate < 150
                  ? '회수율은 양호하지만 여유가 크지 않아요. 마진율이 가장 높은 메뉴부터 광고 비중을 늘려보세요.'
                  : '회수율이 충분히 높아요. 광고 예산을 소폭 늘려 매출 확대를 시도해볼 수 있어요.'}
              </p>
            </div>
          </div>

          <p className="text-xs text-gray-400 dark:text-gray-500">
            * 캠페인별 노출/클릭/전환 등 상세 광고 성과 데이터는 광고 플랫폼 연동이 필요해 이번 버전에서는 제공되지 않아요. (v0.2+ 후속 예정)
          </p>
        </>
      )}
    </div>
  )
}
