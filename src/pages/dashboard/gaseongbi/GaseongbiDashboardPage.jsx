import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getMenus, getSettings } from '../../../lib/gaseongbi/storage'
import { calcMenuMargin, aggregateMenus, exportMarginReportExcel, formatWon, formatPercent, getRating } from '../../../lib/gaseongbi/calc'
import { PLATFORM_ORDER, PLATFORMS } from '../../../lib/gaseongbi/platforms'
import { getAiCommentForAggregate } from '../../../lib/gaseongbi/aiComment'
import RatingBadge from '../../../components/gaseongbi/RatingBadge'
import SummaryCard from '../../../components/gaseongbi/SummaryCard'
import AiCommentBox from '../../../components/gaseongbi/AiCommentBox'
import PlatformRevenueProfitChart from '../../../components/gaseongbi/PlatformRevenueProfitChart'
import { ICONS } from '../../../components/gaseongbi/icons'

const CARD_CLASS = 'bg-white dark:bg-gray-800 shadow-xs rounded-xl border border-gray-100 dark:border-gray-700/60 p-5'

function RankList({ title, icon, items, emptyText }) {
  return (
    <div className={CARD_CLASS}>
      <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
        <span className="text-violet-500">{ICONS[icon]}</span>
        {title}
      </h2>
      {items.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 py-6 text-center">{emptyText}</p>
      ) : (
        <div className="space-y-2">
          {items.map(({ menu, result }, idx) => (
            <Link
              key={menu.id}
              to={`/dashboard/calculator?menuId=${menu.id}`}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-900/40 hover:bg-gray-100 dark:hover:bg-gray-700/40 transition-colors"
            >
              <span className="flex-none w-6 h-6 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-bold flex items-center justify-center">
                {idx + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-gray-800 dark:text-gray-100 truncate">{menu.menuName || '(이름 없음)'}</div>
              </div>
              <span className="text-sm font-semibold text-red-600 dark:text-red-400">{formatPercent(result.marginRate)}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function PriceUpList({ items, emptyText }) {
  return (
    <div className={CARD_CLASS}>
      <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
        <span className="text-violet-500">{ICONS.priceUp}</span>
        가격 올려야 할 메뉴
      </h2>
      {items.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 py-6 text-center">{emptyText}</p>
      ) : (
        <div className="space-y-2">
          {items.map(({ menu, result }) => (
            <Link
              key={menu.id}
              to={`/dashboard/calculator?menuId=${menu.id}`}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-900/40 hover:bg-gray-100 dark:hover:bg-gray-700/40 transition-colors"
            >
              <span className="flex-none w-8 h-8 rounded-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 flex items-center justify-center">
                {ICONS.priceUp}
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-gray-800 dark:text-gray-100 truncate">{menu.menuName || '(이름 없음)'}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">권장가 {formatWon(result.recommendedPrice)}</div>
              </div>
              <span className="text-sm font-semibold text-green-600 dark:text-green-400">+{formatWon(result.shortfall)}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function CouponTable({ items, emptyText }) {
  return (
    <div className={CARD_CLASS}>
      <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
        <span className="text-violet-500">{ICONS.coupon}</span>
        쿠폰 줄여야 할 메뉴
      </h2>
      {items.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 py-6 text-center">{emptyText}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 dark:text-gray-500 text-left">
                <th className="font-medium pb-2">메뉴명</th>
                <th className="font-medium pb-2 text-right">현재 쿠폰</th>
                <th className="font-medium pb-2 text-right">권장 쿠폰</th>
                <th className="font-medium pb-2 text-right">개선 이익</th>
              </tr>
            </thead>
            <tbody>
              {items.map(({ menu, result }) => {
                const currentCoupon = menu.defaultCoupon || 0
                const recommendedCoupon = Math.round(result.baseProfit * 0.3)
                const improvement = Math.max(currentCoupon - recommendedCoupon, 0)
                return (
                  <tr key={menu.id} className="border-t border-gray-100 dark:border-gray-700/60">
                    <td className="py-2">
                      <Link to={`/dashboard/calculator?menuId=${menu.id}`} className="font-medium text-gray-800 dark:text-gray-100 hover:text-violet-500 truncate block max-w-[8rem]">
                        {menu.menuName || '(이름 없음)'}
                      </Link>
                    </td>
                    <td className="py-2 text-right text-gray-600 dark:text-gray-300">{formatWon(currentCoupon)}</td>
                    <td className="py-2 text-right text-gray-600 dark:text-gray-300">{formatWon(recommendedCoupon)}</td>
                    <td className="py-2 text-right font-semibold text-green-600 dark:text-green-400">+{formatWon(improvement)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function AdWarningTable({ items, emptyText, monthlyUnits, adCost }) {
  return (
    <div className={CARD_CLASS}>
      <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
        <span className="text-violet-500">{ICONS.ad}</span>
        광고비 주의 메뉴
      </h2>
      {items.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 py-6 text-center">{emptyText}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 dark:text-gray-500 text-left">
                <th className="font-medium pb-2">메뉴명</th>
                <th className="font-medium pb-2 text-right">광고비</th>
                <th className="font-medium pb-2 text-right">권장 광고비</th>
                <th className="font-medium pb-2 text-right">매출</th>
                <th className="font-medium pb-2 text-right">상태</th>
              </tr>
            </thead>
            <tbody>
              {items.map(({ menu, result }) => {
                const menuAdCost = adCost * monthlyUnits
                const recommendedAdCost = Math.round(menuAdCost * 0.5)
                const revenue = menu.deliveryPrice * monthlyUnits
                const status = result.rating === 'red' ? '위험' : '주의'
                return (
                  <tr key={menu.id} className="border-t border-gray-100 dark:border-gray-700/60">
                    <td className="py-2">
                      <Link to={`/dashboard/calculator?menuId=${menu.id}`} className="font-medium text-gray-800 dark:text-gray-100 hover:text-violet-500 truncate block max-w-[8rem]">
                        {menu.menuName || '(이름 없음)'}
                      </Link>
                    </td>
                    <td className="py-2 text-right text-gray-600 dark:text-gray-300">{formatWon(menuAdCost)}</td>
                    <td className="py-2 text-right text-gray-600 dark:text-gray-300">{formatWon(recommendedAdCost)}</td>
                    <td className="py-2 text-right text-gray-600 dark:text-gray-300">{formatWon(revenue)}</td>
                    <td className="py-2 text-right">
                      <span className={`text-xs font-semibold ${status === '위험' ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                        {status}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default function GaseongbiDashboardPage() {
  const settings = useMemo(() => getSettings(), [])
  const menus = useMemo(() => getMenus(), [])

  const aggregate = useMemo(() => aggregateMenus(menus, settings), [menus, settings])
  const { total, green, yellow, red, avgMarginRate, monthlyNetProfit, items, riskTop5, priceUpList, couponDownList, adWarningList } = aggregate

  const priceUpCount = items.filter((i) => i.result.shortfall > 0).length
  const dailyNetProfit = monthlyNetProfit / 30
  const adCost = settings?.defaults?.adCost || 0

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
      return {
        id,
        name: PLATFORMS[id].name,
        revenue,
        netProfit,
        avgMargin,
        rating: getRating(netProfit, avgMargin),
      }
    })
  }, [items, settings, aggregate.monthlyUnits])

  const aiComment = useMemo(() => getAiCommentForAggregate(aggregate), [aggregate])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">대시보드</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">전체 메뉴의 마진 현황을 한눈에 확인해요.</p>
      </div>

      {total === 0 ? (
        <div className={`${CARD_CLASS} text-center py-12`}>
          <p className="text-gray-600 dark:text-gray-300 mb-4">아직 등록된 메뉴가 없어요. 메뉴를 등록하고 마진을 계산해보세요.</p>
          <Link
            to="/dashboard/menu"
            className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-violet-500 hover:bg-violet-600 text-white transition-colors"
          >
            메뉴 등록하러 가기
          </Link>
        </div>
      ) : (
        <>
          {/* 요약 카드 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard
              icon="money"
              label="이번 달 예상 순이익"
              value={formatWon(monthlyNetProfit)}
              sub={`일 평균 약 ${formatWon(dailyNetProfit)}`}
              tone={monthlyNetProfit >= 0 ? 'green' : 'red'}
            />
            <SummaryCard icon="pie" label="평균 마진율" value={formatPercent(avgMarginRate)} sub={`전체 ${total}개 메뉴 기준`} tone="violet" />
            <SummaryCard icon="warning" label="위험 메뉴" value={`${red}개`} sub={`주의 ${yellow}개 · 안전 ${green}개`} tone="red" />
            <SummaryCard icon="priceUp" label="가격 조정 권장 메뉴" value={`${priceUpCount}개`} sub="권장 판매가 미달" tone="yellow" />
          </div>

          {/* 플랫폼별 현황 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">플랫폼별 현황</h2>
              <Link to="/dashboard/compare" className="text-sm text-violet-500 hover:text-violet-600 font-medium">
                플랫폼 비교 전체 보기 →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {platformAggregates.map((p) => (
                <div key={p.id} className={CARD_CLASS}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-gray-800 dark:text-gray-100">{p.name}</span>
                    <RatingBadge rating={p.rating} />
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">오늘 예상 순이익</div>
                  <div className="text-xl font-bold text-gray-800 dark:text-gray-100">{formatWon(p.netProfit / 30)}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">마진율 {formatPercent(p.avgMargin)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 차트 + TOP5 + 가격 인상 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className={CARD_CLASS}>
              <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-3">플랫폼별 매출 대비 순이익</h2>
              <PlatformRevenueProfitChart platforms={platformAggregates} />
            </div>
            <RankList title="위험 메뉴 TOP5" icon="warning" items={riskTop5} emptyText="위험 메뉴가 없어요." />
            <PriceUpList items={priceUpList} emptyText="가격 조정이 필요한 메뉴가 없어요." />
          </div>

          {/* 쿠폰 / 광고비 / AI / 엑셀 */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <CouponTable items={couponDownList} emptyText="쿠폰 부담이 큰 메뉴가 없어요." />
            <AdWarningTable
              items={adWarningList}
              emptyText={aggregate.monthlyAdCost > 0 ? '광고비로 인한 주의 메뉴가 없어요.' : '광고비가 설정되어 있지 않아요.'}
              monthlyUnits={aggregate.monthlyUnits}
              adCost={adCost}
            />
            <AiCommentBox comment={aiComment} />
            <div className={`${CARD_CLASS} flex flex-col items-start justify-between`}>
              <div>
                <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-1">손익 리포트 엑셀</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">전체 메뉴의 마진 분석을 엑셀로 내려받아요.</p>
              </div>
              <button
                onClick={() => exportMarginReportExcel(menus, settings)}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-violet-500 hover:bg-violet-600 text-white transition-colors"
              >
                {ICONS.excel}
                엑셀 다운로드
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
