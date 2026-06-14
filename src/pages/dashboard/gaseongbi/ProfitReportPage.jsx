import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMenus, getSettings, getMonthlySnapshots, recordMonthlySnapshot } from '../../../lib/gaseongbi/storage'
import { aggregateMenus, exportMarginReportExcel, formatWon, formatPercent } from '../../../lib/gaseongbi/calc'
import { getMonthlySummary } from '../../../lib/gaseongbi/aiComment'
import { PLATFORM_ORDER, getPlatformDefaults } from '../../../lib/gaseongbi/platforms'
import RatingBadge from '../../../components/gaseongbi/RatingBadge'
import SummaryCard from '../../../components/gaseongbi/SummaryCard'
import MonthlyTrendChart from '../../../components/gaseongbi/MonthlyTrendChart'
import { ICONS } from '../../../components/gaseongbi/icons'

const CARD_CLASS = 'bg-white dark:bg-gray-800 shadow-xs rounded-xl border border-gray-100 dark:border-gray-700/60 p-5'

const inputClass =
  'px-3 py-2 text-sm bg-white dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700/60 text-gray-800 dark:text-gray-100 rounded-lg outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all'

function MenuListCard({ title, icon, items, emptyText, renderRight }) {
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
          {items.map(({ menu, result }) => (
            <Link
              key={menu.id}
              to={`/dashboard/calculator?menuId=${menu.id}`}
              className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-900/40 hover:bg-gray-100 dark:hover:bg-gray-700/40 transition-colors"
            >
              <div className="min-w-0">
                <div className="font-medium text-gray-800 dark:text-gray-100 truncate">{menu.menuName || '(이름 없음)'}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{renderRight(result)}</div>
              </div>
              <RatingBadge rating={result.rating} />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ProfitReportPage() {
  const settings = useMemo(() => getSettings(), [])
  const menus = useMemo(() => getMenus(), [])

  const aggregate = useMemo(() => aggregateMenus(menus, settings), [menus, settings])
  const { total, green, yellow, red, avgMarginRate, monthlyNetProfit, monthlyAdCost, riskTop5, priceUpList, couponDownList, adWarningList } = aggregate

  useEffect(() => {
    if (total === 0) return
    recordMonthlySnapshot({
      revenue: aggregate.monthlyRevenue,
      adCost: monthlyAdCost,
      netProfit: monthlyNetProfit,
      marginRate: avgMarginRate,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total])

  const [snapshots, setSnapshots] = useState(() => getMonthlySnapshots())
  useEffect(() => {
    setSnapshots(getMonthlySnapshots())
  }, [total])

  const summaryLines = useMemo(() => getMonthlySummary(aggregate), [aggregate])

  if (total === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">손익리포트</h1>
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
          <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">손익리포트</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {getPlatformDefaults(aggregate.referencePlatform, settings).name} 기준 · 메뉴당 월 {aggregate.monthlyUnits}개 판매 가정
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center gap-2">
          <button
            onClick={() => exportMarginReportExcel(menus, settings)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-violet-500 hover:bg-violet-600 text-white transition-colors whitespace-nowrap"
          >
            {ICONS.excel}
            엑셀 다운로드
          </button>
          <Link
            to="/dashboard/report/detail"
            target="_blank"
            className={`${inputClass} inline-flex items-center font-medium hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors whitespace-nowrap`}
          >
            상세 분석 리포트 보기
          </Link>
        </div>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <SummaryCard icon="pie" label="총 메뉴 수" value={`${total}개`} tone="violet" />
        <SummaryCard icon="money" label="안전 메뉴" value={`${green}개`} tone="green" />
        <SummaryCard icon="warning" label="주의 메뉴" value={`${yellow}개`} tone="yellow" />
        <SummaryCard icon="warning" label="위험 메뉴" value={`${red}개`} tone="red" />
        <SummaryCard icon="pie" label="평균 마진율" value={formatPercent(avgMarginRate)} tone="blue" />
        <SummaryCard
          icon="money"
          label="이번 달 예상 순이익"
          value={formatWon(monthlyNetProfit)}
          valueClassName={monthlyNetProfit < 0 ? 'text-red-600 dark:text-red-400' : ''}
          tone={monthlyNetProfit >= 0 ? 'green' : 'red'}
        />
      </div>

      {/* 월간 손익 추이 */}
      <div className={CARD_CLASS}>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">월간 손익 추이</h2>
        {snapshots.length <= 1 ? (
          <div className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">
            데이터가 누적되면 추이가 표시됩니다. (현재 {snapshots.length}개월 기록)
          </div>
        ) : (
          <MonthlyTrendChart snapshots={snapshots} />
        )}
      </div>

      {/* TOP-N 리스트 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MenuListCard
          title="위험 메뉴 TOP5"
          icon="warning"
          items={riskTop5}
          emptyText="위험 메뉴가 없어요."
          renderRight={(result) => `마진율 ${formatPercent(result.marginRate)} · 순이익 ${formatWon(result.netProfit)}`}
        />
        <MenuListCard
          title="가격 인상 필요 메뉴"
          icon="priceUp"
          items={priceUpList}
          emptyText="권장 판매가보다 낮은 메뉴가 없어요."
          renderRight={(result) => `권장가 ${formatWon(result.recommendedPrice)} (+${formatWon(result.shortfall)})`}
        />
        <MenuListCard
          title="쿠폰 줄여야 할 메뉴"
          icon="coupon"
          items={couponDownList}
          emptyText="쿠폰 부담이 큰 메뉴가 없어요."
          renderRight={(result) => `기본 마진의 30% 이상을 쿠폰으로 사용 중`}
        />
        <MenuListCard
          title="광고비 주의 메뉴"
          icon="ad"
          items={adWarningList}
          emptyText={monthlyAdCost > 0 ? '광고비로 인한 주의 메뉴가 없어요.' : '광고비가 설정되어 있지 않아요.'}
          renderRight={(result) => `광고 포함 순이익 ${formatWon(result.netProfit)}`}
        />
      </div>

      {/* 월간 요약 */}
      <div className={CARD_CLASS}>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">월간 요약</h2>
        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
          {summaryLines.map((line, idx) => (
            <li key={idx} className="flex gap-2">
              <span className="text-violet-500">•</span>
              {line}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
