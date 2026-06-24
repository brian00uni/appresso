import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getMenus, getSettings } from '../../../lib/gaseongbi/storage'
import { aggregateMenus, formatWon, formatPercent } from '../../../lib/gaseongbi/calc'
import { getAdAnalysisComment } from '../../../lib/gaseongbi/aiComment'
import SummaryCard from '../../../components/gaseongbi/SummaryCard'
import AiCommentBox from '../../../components/gaseongbi/AiCommentBox'

const CARD_CLASS = 'bg-white dark:bg-gray-800 shadow-xs rounded-xl border border-gray-100 dark:border-gray-700/60 p-5'

// 광고비 분석에 필요한 입력 항목 (입력 전 안내용)
const NEEDED_INPUTS = ['광고비 총액(또는 1건당 광고비)', '광고 주문 수', '광고 매출', '광고 적용 메뉴']

export default function AdAnalysisPage() {
  const settings = useMemo(() => getSettings(), [])
  const menus = useMemo(() => getMenus(), [])
  const aggregate = useMemo(() => aggregateMenus(menus, settings), [menus, settings])

  const { total, items, monthlyAdCost, monthlyRevenue, monthlyNetProfit, monthlyUnits, adWarningList } = aggregate
  const adCost = settings.defaults.adCost || 0

  const totalOrders = monthlyUnits * total
  const profitBeforeAd = monthlyNetProfit + monthlyAdCost
  const recoveryRate = monthlyAdCost > 0 ? (profitBeforeAd / monthlyAdCost) * 100 : 0
  const aiComment = useMemo(() => getAdAnalysisComment(recoveryRate, adWarningList.length), [recoveryRate, adWarningList.length])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">광고비 분석</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">사장님이 입력한 광고비 기준으로 광고 효과와 광고 후 손익을 계산합니다.</p>
      </div>

      {total === 0 ? (
        <div className={`${CARD_CLASS} text-center py-12 text-gray-500 dark:text-gray-400`}>
          등록된 메뉴가 없어요. 메뉴관리에서 메뉴를 먼저 등록해 주세요.
        </div>
      ) : adCost <= 0 ? (
        // 입력 전 빈 상태 (보고서 기준: 입력 전에는 결과를 표시하지 않음)
        <div className={CARD_CLASS}>
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-2">아직 광고비 데이터가 입력되지 않았습니다.</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            광고비 총액과 광고 주문 수를 입력하면 주문당 광고비와 광고 후 순이익을 계산합니다.
          </p>
          <div className="rounded-lg bg-gray-50 dark:bg-gray-900/40 p-4 mb-4">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">광고비 분석에 필요한 입력값</div>
            <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
              {NEEDED_INPUTS.map((it) => (
                <li key={it}>- {it}</li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-red-500 dark:text-red-400 mb-4">※ 입력 전에는 결과가 표시되지 않습니다.</p>
          <Link to="/dashboard/settings" className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-violet-500 hover:bg-violet-600 text-white transition-colors">
            설정에서 광고비 입력하기
          </Link>
        </div>
      ) : (
        <>
          <div className="flex items-start gap-2 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-xl px-4 py-3 text-sm text-blue-700 dark:text-blue-300">
            <span className="flex-none">ℹ️</span>
            <p>1건당 광고비 {formatWon(adCost)} · 메뉴당 월 {monthlyUnits}개 예상 판매 기준의 추정값입니다. 실제 광고 성과는 플랫폼 정산 내역으로 확인해 주세요.</p>
          </div>

          {/* 요약 카드 (입력 기반 추정) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <SummaryCard icon="ad" label="월 광고비" value={formatWon(monthlyAdCost)} sub="입력값 기준" tone="violet" />
            <SummaryCard icon="pie" label="광고 주문 수(추정)" value={`${totalOrders.toLocaleString('ko-KR')}건`} sub="예상 판매수량 기준" tone="blue" />
            <SummaryCard icon="money" label="주문당 광고비" value={formatWon(adCost)} sub="설정 입력값" tone="gray" />
            <SummaryCard icon="money" label="월 광고 매출(추정)" value={formatWon(monthlyRevenue)} tone="green" />
            <SummaryCard
              icon="money"
              label="월 광고 후 순이익(추정)"
              value={formatWon(monthlyNetProfit)}
              valueClassName={monthlyNetProfit < 0 ? 'text-red-600 dark:text-red-400' : ''}
              tone={monthlyNetProfit >= 0 ? 'green' : 'red'}
            />
            <SummaryCard
              icon="target"
              label="광고비 회수율(추정)"
              value={formatPercent(recoveryRate / 100)}
              sub={recoveryRate >= 100 ? '회수 가능' : '회수 부족'}
              tone={recoveryRate >= 150 ? 'green' : recoveryRate >= 100 ? 'yellow' : 'red'}
            />
          </div>

          {/* 광고 주의 메뉴 */}
          <div className={CARD_CLASS}>
            <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-3">광고 주의 메뉴</h2>
            {adWarningList.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 py-6 text-center">광고비로 인한 주의 메뉴가 없어요.</p>
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

          <p className="flex items-start gap-1.5 text-xs text-gray-400 dark:text-gray-500">
            <span className="flex-none">※</span>
            캠페인 노출·클릭·전환·시간대별 성과 등 상세 광고 데이터는 광고 플랫폼 연동이 필요해 본 버전에서는 제공되지 않습니다. 위 수치는 사장님이 입력한 광고비 기준의 추정값이며, 실제 결과는 플랫폼 정산 내역을 통해 확인해 주세요.
          </p>
        </>
      )}
    </div>
  )
}
