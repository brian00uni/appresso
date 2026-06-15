import React, { useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../../stores/authStore'
import { hydrate } from '../../../lib/gaseongbi/remoteSync'
import { getMenus, getSettings } from '../../../lib/gaseongbi/storage'
import { aggregateMenus, calcMenuMargin, formatWon, formatPercent, getRating } from '../../../lib/gaseongbi/calc'
import { getAiCommentForAggregate, getMonthlySummary } from '../../../lib/gaseongbi/aiComment'
import { PLATFORM_ORDER, PLATFORMS } from '../../../lib/gaseongbi/platforms'
import RatingBadge from '../../../components/gaseongbi/RatingBadge'
import { ICONS } from '../../../components/gaseongbi/icons'

const CARD_CLASS = 'bg-white shadow-xs rounded-xl border border-gray-100 p-5 print:shadow-none print:border-gray-300'

// 이 페이지는 DashboardLayout 밖의 라우트라(/dashboard/report/detail) 직접 진입 시
// 인증 + Supabase 하이드레이션을 자체적으로 보장한 뒤 내용을 렌더한다.
export default function ProfitReportDetailPage() {
  const { user, loading } = useAuthStore()
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    if (!user) return
    let active = true
    hydrate(user.id).finally(() => {
      if (active) setHydrated(true)
    })
    return () => {
      active = false
    }
  }, [user?.id])

  if (loading || (user && !hydrated)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  return <ProfitReportDetailContent />
}

function ProfitReportDetailContent() {
  const settings = useMemo(() => getSettings(), [])
  const menus = useMemo(() => getMenus(), [])
  const aggregate = useMemo(() => aggregateMenus(menus, settings), [menus, settings])
  const { total, green, yellow, red, avgMarginRate, monthlyNetProfit, monthlyAdCost, monthlyRevenue, items, riskTop5, priceUpList, couponDownList, adWarningList } = aggregate

  const platformAggregates = useMemo(() => {
    return PLATFORM_ORDER.map((id) => {
      let revenue = 0
      let netProfit = 0
      let marginSum = 0
      items.forEach(({ menu }) => {
        const result = calcMenuMargin(menu, settings, id)
        revenue += menu.deliveryPrice * aggregate.monthlyUnits
        netProfit += result.netProfit * aggregate.monthlyUnits
        marginSum += result.marginRate
      })
      const avgMargin = items.length > 0 ? marginSum / items.length : 0
      return { id, name: PLATFORMS[id].name, revenue, netProfit, avgMargin, rating: getRating(netProfit, avgMargin) }
    })
  }, [items, settings, aggregate.monthlyUnits])

  const summaryLines = useMemo(() => getMonthlySummary(aggregate), [aggregate])
  const aiComment = useMemo(() => getAiCommentForAggregate(aggregate), [aggregate])

  const top5 = [...items].sort((a, b) => b.result.netProfit - a.result.netProfit).slice(0, 5)
  const recoveryCount = monthlyAdCost > 0 ? items.filter((i) => i.result.profitAfterCoupon > settings.defaults.adCost).length : 0

  const today = new Date()
  const dateLabel = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`

  if (total === 0) {
    return (
      <div className="min-h-screen bg-white p-8 text-center text-gray-500">등록된 메뉴가 없어요. 메뉴관리에서 메뉴를 먼저 등록해주세요.</div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8 print:px-0 print:py-0 space-y-6">
        {/* 헤더 바 */}
        <div className="flex items-center justify-between bg-gray-900 text-white rounded-xl px-6 py-4 print:bg-white print:text-gray-900 print:border print:border-gray-300">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-violet-500/20 flex items-center justify-center text-violet-400 print:text-violet-600">{ICONS.crown}</div>
            <div>
              <div className="font-bold">가성비대장 — 상세 분석 리포트</div>
              <div className="text-xs text-gray-400 print:text-gray-500">{dateLabel} 기준</div>
            </div>
          </div>
          <button
            onClick={() => window.print()}
            className="print:hidden px-4 py-2 text-sm font-medium rounded-lg bg-violet-500 hover:bg-violet-600 text-white transition-colors"
          >
            PDF로 저장
          </button>
        </div>

        {/* 요약 카드 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className={CARD_CLASS}>
            <div className="text-sm text-gray-500 mb-1">전체 메뉴 수</div>
            <div className="text-2xl font-bold text-gray-800">{total}개</div>
            <div className="text-xs text-gray-400 mt-1">
              안전 {green} · 주의 {yellow} · 위험 {red}
            </div>
          </div>
          <div className={CARD_CLASS}>
            <div className="text-sm text-gray-500 mb-1">평균 마진율</div>
            <div className="text-2xl font-bold text-gray-800">{formatPercent(avgMarginRate)}</div>
          </div>
          <div className={CARD_CLASS}>
            <div className="text-sm text-gray-500 mb-1">이번 달 예상 매출</div>
            <div className="text-2xl font-bold text-gray-800">{formatWon(monthlyRevenue)}</div>
          </div>
          <div className={CARD_CLASS}>
            <div className="text-sm text-gray-500 mb-1">이번 달 예상 순이익</div>
            <div className={`text-2xl font-bold ${monthlyNetProfit < 0 ? 'text-red-600' : 'text-gray-800'}`}>{formatWon(monthlyNetProfit)}</div>
          </div>
        </div>

        {/* 월간 요약 */}
        <div className={CARD_CLASS}>
          <h2 className="text-lg font-semibold text-gray-800 mb-3">월간 요약</h2>
          <ul className="space-y-2 text-sm text-gray-600">
            {summaryLines.map((line, idx) => (
              <li key={idx} className="flex gap-2">
                <span className="text-violet-500">•</span>
                {line}
              </li>
            ))}
          </ul>
        </div>

        {/* 메뉴별 손익분석 TOP5 */}
        <div className={CARD_CLASS}>
          <h2 className="text-lg font-semibold text-gray-800 mb-3">메뉴별 손익분석 TOP5</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200">
                  <th className="py-2 pr-4">메뉴명</th>
                  <th className="py-2 pr-4 text-right">판매가</th>
                  <th className="py-2 pr-4 text-right">건당 순이익</th>
                  <th className="py-2 pr-4 text-right">마진율</th>
                  <th className="py-2 pr-4 text-right">판정</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                {top5.map(({ menu, result }) => (
                  <tr key={menu.id} className="border-b border-gray-100 last:border-0">
                    <td className="py-2 pr-4">{menu.menuName || '(이름 없음)'}</td>
                    <td className="py-2 pr-4 text-right">{formatWon(menu.deliveryPrice)}</td>
                    <td className={`py-2 pr-4 text-right ${result.netProfit < 0 ? 'text-red-600' : ''}`}>{formatWon(result.netProfit)}</td>
                    <td className="py-2 pr-4 text-right">{formatPercent(result.marginRate)}</td>
                    <td className="py-2 pr-4 text-right">
                      <RatingBadge rating={result.rating} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 가격 인상 필요 / 쿠폰 줄여야 할 메뉴 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className={CARD_CLASS}>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">가격 인상 필요 메뉴</h2>
            {priceUpList.length === 0 ? (
              <p className="text-sm text-gray-500">권장 판매가보다 낮은 메뉴가 없어요.</p>
            ) : (
              <div className="space-y-2">
                {priceUpList.map(({ menu, result }) => (
                  <div key={menu.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 text-sm">
                    <span className="text-gray-800">{menu.menuName}</span>
                    <span className="text-amber-600 font-medium">권장가 {formatWon(result.recommendedPrice)} (+{formatWon(result.shortfall)})</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className={CARD_CLASS}>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">쿠폰 줄여야 할 메뉴</h2>
            {couponDownList.length === 0 ? (
              <p className="text-sm text-gray-500">쿠폰 부담이 큰 메뉴가 없어요.</p>
            ) : (
              <div className="space-y-2">
                {couponDownList.map(({ menu }) => (
                  <div key={menu.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 text-sm">
                    <span className="text-gray-800">{menu.menuName}</span>
                    <span className="text-yellow-600 font-medium">쿠폰 {formatWon(menu.defaultCoupon)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 플랫폼별 비교 */}
        <div className={CARD_CLASS}>
          <h2 className="text-lg font-semibold text-gray-800 mb-3">플랫폼별 비교 (전체 메뉴 합산)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200">
                  <th className="py-2 pr-4">플랫폼</th>
                  <th className="py-2 pr-4 text-right">월 매출</th>
                  <th className="py-2 pr-4 text-right">월 순이익</th>
                  <th className="py-2 pr-4 text-right">평균 마진율</th>
                  <th className="py-2 pr-4 text-right">판정</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                {platformAggregates.map((p) => (
                  <tr key={p.id} className="border-b border-gray-100 last:border-0">
                    <td className="py-2 pr-4">{p.name}</td>
                    <td className="py-2 pr-4 text-right">{formatWon(p.revenue)}</td>
                    <td className={`py-2 pr-4 text-right ${p.netProfit < 0 ? 'text-red-600' : ''}`}>{formatWon(p.netProfit)}</td>
                    <td className="py-2 pr-4 text-right">{formatPercent(p.avgMargin)}</td>
                    <td className="py-2 pr-4 text-right">
                      <RatingBadge rating={p.rating} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 광고비 분석 */}
        <div className={CARD_CLASS}>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">광고비 분석</h2>
          {monthlyAdCost <= 0 ? (
            <p className="text-sm text-gray-500">설정에서 광고비를 입력하면 회수 가능 여부를 분석해 드려요.</p>
          ) : (
            <p className="text-sm text-gray-600">
              이번 달 예상 광고비 {formatWon(monthlyAdCost)} 기준, 전체 {total}개 메뉴 중{' '}
              <span className="font-semibold text-green-600">{recoveryCount}개</span>는 광고비 회수가 가능하고,{' '}
              <span className="font-semibold text-red-600">{total - recoveryCount}개</span>는 광고비를 빼면 적자예요.
            </p>
          )}
        </div>

        {/* AI 코멘트 */}
        <div className={CARD_CLASS}>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">{aiComment.title}</h2>
          <p className="text-sm text-gray-700 mb-1">{aiComment.message}</p>
          <p className="text-sm text-gray-500">{aiComment.advice}</p>
        </div>

        {/* 이번 달 액션 플랜 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className={CARD_CLASS}>
            <h3 className="font-semibold text-gray-800 mb-2">① 가격 조정</h3>
            <p className="text-sm text-gray-600">
              {priceUpList.length > 0
                ? `'${priceUpList[0].menu.menuName}' 메뉴의 판매가를 ${formatWon(priceUpList[0].result.recommendedPrice)} 이상으로 조정해 보세요. 현재가 대비 +${formatWon(priceUpList[0].result.shortfall)} 인상이 필요해요.`
                : '현재 권장 판매가 미달 메뉴가 없어요. 좋은 상태를 유지해보세요.'}
            </p>
          </div>
          <div className={CARD_CLASS}>
            <h3 className="font-semibold text-gray-800 mb-2">② 쿠폰 최적화</h3>
            <p className="text-sm text-gray-600">
              {couponDownList.length > 0
                ? `'${couponDownList[0].menu.menuName}' 메뉴의 쿠폰(${formatWon(couponDownList[0].menu.defaultCoupon)})이 기본 마진의 30% 이상을 차지해요. 쿠폰 금액을 낮춰 순이익을 개선해 보세요.`
                : '쿠폰 부담이 큰 메뉴가 없어요. 현재 쿠폰 운영이 적절해요.'}
            </p>
          </div>
          <div className={CARD_CLASS}>
            <h3 className="font-semibold text-gray-800 mb-2">③ 광고 예산 재배분</h3>
            <p className="text-sm text-gray-600">
              {adWarningList.length > 0
                ? `'${adWarningList[0].menu.menuName}' 메뉴는 광고비 영향으로 순이익이 크게 줄었어요(${formatWon(adWarningList[0].result.netProfit)}). 이 메뉴의 광고 예산을 다른 메뉴로 재배분해 보세요.`
                : '광고비로 인한 수익성 악화 메뉴가 없어요. 현재 광고 운영이 효율적이에요.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
