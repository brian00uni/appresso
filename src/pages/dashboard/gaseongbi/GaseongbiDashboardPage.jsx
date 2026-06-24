import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getMenus, getSettings } from '../../../lib/gaseongbi/storage'
import { calcMenuMargin, aggregateMenus, formatWon, formatPercent, getRating } from '../../../lib/gaseongbi/calc'
import { PLATFORM_ORDER, PLATFORMS } from '../../../lib/gaseongbi/platforms'
import { getAiCommentForAggregate } from '../../../lib/gaseongbi/aiComment'
import SummaryCard from '../../../components/gaseongbi/SummaryCard'
import AiCommentBox from '../../../components/gaseongbi/AiCommentBox'
import PlatformCompareChart from '../../../components/gaseongbi/PlatformCompareChart'
import MarginDistributionChart from '../../../components/gaseongbi/MarginDistributionChart'

const CARD_CLASS = 'bg-white dark:bg-gray-800 shadow-xs rounded-xl border border-gray-100 dark:border-gray-700/60 p-5'

// 위험 메뉴의 주 개선 레버를 추정해 한 줄 제안으로 변환
function improvementSuggestion({ menu, result }) {
  const price = menu.deliveryPrice || 0
  const couponRatio = price > 0 ? (menu.defaultCoupon || 0) / price : 0
  const foodRatio = price > 0 ? (menu.foodCost || 0) / price : 0
  if (couponRatio >= 0.1) return '쿠폰 조정'
  if (foodRatio >= 0.4) return '원가 절감'
  return '판매가 조정'
}

function buildMarginBuckets(items) {
  const defs = [
    { label: '30% 이상', test: (r) => r >= 0.3, color: '#10b981' },
    { label: '20~30%', test: (r) => r >= 0.2 && r < 0.3, color: '#3b82f6' },
    { label: '10~20%', test: (r) => r >= 0.1 && r < 0.2, color: '#f59e0b' },
    { label: '10% 미만', test: (r) => r < 0.1, color: '#ef4444' },
  ]
  return defs.map((d) => ({
    label: d.label,
    color: d.color,
    count: items.filter((i) => d.test(i.result.marginRate)).length,
  }))
}

// 벤치마킹 AI 리포트 구성 항목 (프로모 배너 체크리스트)
const BENCHMARK_ITEMS = [
  '오늘 고칠 것 3개',
  '오늘의 결론',
  '지역 경쟁가게 후보',
  '전국 참고가게 후보',
  '메뉴 구성 비교',
  '리뷰 키워드 비교',
  'SWOT 분석',
  '출처 링크',
  '주의사항',
]

const BENCHMARK_STEPS = [
  { no: '1', title: '정보 입력', desc: '가게명, 지역, 대표 메뉴, 비교할 메뉴, 키워드 입력' },
  { no: '2', title: 'AI 분석', desc: '공개 정보 기반으로 경쟁가게 분석' },
  { no: '3', title: '리포트 확인', desc: '오늘 고칠 것 3개, SWOT, 메뉴/리뷰 비교 확인' },
]

export default function GaseongbiDashboardPage() {
  const settings = useMemo(() => getSettings(), [])
  const menus = useMemo(() => getMenus(), [])

  const aggregate = useMemo(() => aggregateMenus(menus, settings), [menus, settings])
  const { total, green, yellow, red, avgMarginRate, monthlyNetProfit, items, riskTop5, priceUpList, couponDownList } = aggregate

  const priceUpCount = items.filter((i) => i.result.shortfall > 0).length
  const marginBuckets = useMemo(() => buildMarginBuckets(items), [items])

  const platformAggregates = useMemo(() => {
    return PLATFORM_ORDER.map((id) => {
      let netProfit = 0
      let marginSum = 0
      items.forEach(({ menu }) => {
        const result = calcMenuMargin(menu, settings, id)
        netProfit += result.netProfit * aggregate.monthlyUnits
        marginSum += result.marginRate
      })
      const avgMargin = items.length > 0 ? marginSum / items.length : 0
      return { id, name: PLATFORMS[id].name, netProfit, avgMargin, rating: getRating(netProfit, avgMargin) }
    })
  }, [items, settings, aggregate.monthlyUnits])

  const aiComment = useMemo(() => getAiCommentForAggregate(aggregate), [aggregate])

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">대시보드</h1>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-violet-500/15 text-violet-500">등록 메뉴 기준 손익 계산기</span>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">등록한 메뉴와 입력한 원가, 수수료, 쿠폰, 배달비 기준의 손익을 보여드립니다.</p>
      </div>

      {total === 0 ? (
        <div className={`${CARD_CLASS} text-center py-12`}>
          <p className="text-gray-600 dark:text-gray-300 mb-4">아직 등록된 메뉴가 없어요. 메뉴를 등록하고 마진을 계산해보세요.</p>
          <Link to="/dashboard/menu" className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-violet-500 hover:bg-violet-600 text-white transition-colors">
            메뉴 등록하러 가기
          </Link>
        </div>
      ) : (
        <>
          {/* 안내 배너 */}
          <div className="flex items-start gap-2 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-xl px-4 py-3 text-sm text-blue-700 dark:text-blue-300">
            <span className="flex-none">ℹ️</span>
            <p>※ 실제 월 매출, 주문 수, 정산 금액은 자동으로 불러오지 않습니다. 월간 리포트에서 직접 입력 후 확인할 수 있습니다.</p>
          </div>

          {/* 요약 카드 5개 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <SummaryCard
              icon="money"
              label="등록 메뉴 기준 예상 손익"
              value={formatWon(monthlyNetProfit)}
              sub="총 손익 (추정)"
              tone={monthlyNetProfit >= 0 ? 'green' : 'red'}
            />
            <SummaryCard icon="pie" label="등록 메뉴 평균 마진율" value={formatPercent(avgMarginRate)} sub="전체 메뉴 평균" tone="blue" />
            <SummaryCard icon="warning" label="손해 위험 메뉴" value={`${red}개`} sub="마진율 10% 미만" tone="red" />
            <SummaryCard icon="priceUp" label="가격 조정 필요 메뉴" value={`${priceUpCount}개`} sub="마진율 개선 가능" tone="yellow" />
            <SummaryCard icon="store" label="등록 메뉴 수" value={`${total}개`} sub="관리 중인 메뉴" tone="violet" />
          </div>

          {/* 플랫폼 손익 / 마진 분포 / 위험 TOP5 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className={CARD_CLASS}>
              <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">플랫폼별 예상 손익 비교 <span className="text-xs font-normal text-gray-400">(등록 메뉴 기준)</span></h2>
              <PlatformCompareChart platforms={platformAggregates} />
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">* 등록한 메뉴와 입력값 기준의 플랫폼별 예상 손익입니다.</p>
            </div>

            <div className={CARD_CLASS}>
              <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-4">마진율 분포 <span className="text-xs font-normal text-gray-400">(등록 메뉴 기준)</span></h2>
              <MarginDistributionChart buckets={marginBuckets} />
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">* 마진율은 (판매가 - 제반비용) / 판매가 기준입니다.</p>
            </div>

            <div className={CARD_CLASS}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">위험 메뉴 TOP 5 <span className="text-xs font-normal text-gray-400">(마진율 낮은 순)</span></h2>
                <Link to="/dashboard/report" className="text-xs text-violet-500 hover:text-violet-600 font-medium whitespace-nowrap">전체 메뉴 보기 ›</Link>
              </div>
              {riskTop5.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-gray-500 py-6 text-center">위험 메뉴가 없어요.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-400 dark:text-gray-500 text-left">
                      <th className="font-medium pb-2">순위</th>
                      <th className="font-medium pb-2">메뉴명</th>
                      <th className="font-medium pb-2 text-right">마진율</th>
                      <th className="font-medium pb-2 text-center">상태</th>
                      <th className="font-medium pb-2 text-right">개선 제안</th>
                    </tr>
                  </thead>
                  <tbody>
                    {riskTop5.map((item, idx) => (
                      <tr key={item.menu.id} className="border-t border-gray-100 dark:border-gray-700/60">
                        <td className="py-2 text-gray-500 dark:text-gray-400">{idx + 1}</td>
                        <td className="py-2 font-medium text-gray-800 dark:text-gray-100 truncate max-w-[6rem]">{item.menu.menuName || '(이름 없음)'}</td>
                        <td className="py-2 text-right text-gray-700 dark:text-gray-300">{formatPercent(item.result.marginRate)}</td>
                        <td className="py-2 text-center">
                          <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400">위험</span>
                        </td>
                        <td className="py-2 text-right text-gray-500 dark:text-gray-400 whitespace-nowrap">{improvementSuggestion(item)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* 가격 / 쿠폰 / 광고비 / AI */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
            <PriceUpCard items={priceUpList} />
            <CouponDownCard items={couponDownList} />
            <AdEmptyCard />
            <AiCommentBox
              comment={aiComment}
              actions={
                <Link to="/dashboard/report" className="text-sm font-medium underline-offset-2 hover:underline">
                  자세히 보기 ›
                </Link>
              }
            />
          </div>

          {/* 벤치마킹 AI 리포트 프로모 */}
          <BenchmarkPromo />

          <p className="flex items-start gap-1.5 text-xs text-gray-400 dark:text-gray-500">
            <span className="flex-none">ⓘ</span>
            본 서비스의 모든 분석 결과는 입력된 데이터 기준의 예상값이며, 실제 매출/정산 데이터와 다를 수 있습니다. 최종 의사결정은 사장님께서 직접 판단해 주세요.
          </p>
        </>
      )}
    </div>
  )
}

function PriceUpCard({ items }) {
  return (
    <div className={CARD_CLASS}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">가격 올려야 할 메뉴</h2>
        <Link to="/dashboard/report" className="text-xs text-violet-500 hover:text-violet-600 font-medium whitespace-nowrap">전체 보기 ›</Link>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 py-6 text-center">가격 조정이 필요한 메뉴가 없어요.</p>
      ) : (
        <>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 dark:text-gray-500 text-left">
                <th className="font-medium pb-2">메뉴명</th>
                <th className="font-medium pb-2 text-right">현재가</th>
                <th className="font-medium pb-2 text-right">권장가</th>
                <th className="font-medium pb-2 text-right">예상 증가</th>
              </tr>
            </thead>
            <tbody>
              {items.map(({ menu, result }) => {
                const gain = Math.round(result.shortfall * (1 - result.variableFeeRate))
                return (
                  <tr key={menu.id} className="border-t border-gray-100 dark:border-gray-700/60">
                    <td className="py-2 font-medium text-gray-800 dark:text-gray-100 truncate max-w-[6rem]">{menu.menuName || '(이름 없음)'}</td>
                    <td className="py-2 text-right text-gray-600 dark:text-gray-300">{formatWon(menu.deliveryPrice)}</td>
                    <td className="py-2 text-right text-gray-600 dark:text-gray-300">{formatWon(result.recommendedPrice)}</td>
                    <td className="py-2 text-right font-semibold text-green-600 dark:text-green-400">+{formatWon(gain)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">* 현재 입력값 기준의 추천 판매가입니다.</p>
        </>
      )}
    </div>
  )
}

function CouponDownCard({ items }) {
  return (
    <div className={CARD_CLASS}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">쿠폰 줄여야 할 메뉴</h2>
        <Link to="/dashboard/report" className="text-xs text-violet-500 hover:text-violet-600 font-medium whitespace-nowrap">전체 보기 ›</Link>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 py-6 text-center">쿠폰 부담이 큰 메뉴가 없어요.</p>
      ) : (
        <>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 dark:text-gray-500 text-left">
                <th className="font-medium pb-2">메뉴명</th>
                <th className="font-medium pb-2 text-right">현재 쿠폰율</th>
                <th className="font-medium pb-2 text-right">권장 쿠폰율</th>
                <th className="font-medium pb-2 text-right">예상 증가</th>
              </tr>
            </thead>
            <tbody>
              {items.map(({ menu, result }) => {
                const price = menu.deliveryPrice || 0
                const currentCoupon = menu.defaultCoupon || 0
                const currentRate = price > 0 ? currentCoupon / price : 0
                const recommendedCoupon = Math.round(result.baseProfit * 0.15)
                const recommendedRate = price > 0 ? recommendedCoupon / price : 0
                const gain = Math.max(currentCoupon - recommendedCoupon, 0)
                return (
                  <tr key={menu.id} className="border-t border-gray-100 dark:border-gray-700/60">
                    <td className="py-2 font-medium text-gray-800 dark:text-gray-100 truncate max-w-[6rem]">{menu.menuName || '(이름 없음)'}</td>
                    <td className="py-2 text-right text-gray-600 dark:text-gray-300">{formatPercent(currentRate, 0)}</td>
                    <td className="py-2 text-right text-gray-600 dark:text-gray-300">{formatPercent(recommendedRate, 0)}</td>
                    <td className="py-2 text-right font-semibold text-green-600 dark:text-green-400">+{formatWon(gain)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">* 쿠폰은 마진에 큰 영향을 줍니다.</p>
        </>
      )}
    </div>
  )
}

function AdEmptyCard() {
  return (
    <div className={CARD_CLASS}>
      <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-2">광고비 분석 <span className="text-xs font-normal text-gray-400">(직접 입력 기준)</span></h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">광고비를 입력하면 광고 효과와 광고 후 손익을 계산할 수 있습니다.</p>
      <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-1 mb-3">
        <li>- 광고비 총액</li>
        <li>- 광고 주문 수</li>
        <li>- 광고 매출</li>
        <li>- 광고 적용 메뉴</li>
      </ul>
      <p className="text-xs text-red-500 dark:text-red-400">※ 입력 전에는 결과가 표시되지 않습니다.</p>
      <Link to="/dashboard/ads" className="inline-block mt-3 text-sm font-medium text-violet-500 hover:underline">광고비 분석으로 이동 ›</Link>
    </div>
  )
}

function BenchmarkPromo() {
  return (
    <div className={CARD_CLASS}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-violet-500 text-white">AI</span>
        <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">벤치마킹 AI 리포트 <span className="text-xs font-normal text-gray-400">(예시)</span></h2>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">우리 가게 정보와 지역 경쟁가게, 전국 참고가게를 AI가 분석하여 개선점을 제안합니다.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 단계 */}
        <div className="flex items-stretch gap-2">
          {BENCHMARK_STEPS.map((s, idx) => (
            <React.Fragment key={s.no}>
              <div className="flex-1 rounded-lg bg-gray-50 dark:bg-gray-900/40 p-3">
                <div className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-1">{s.no}. {s.title}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 leading-snug">{s.desc}</div>
              </div>
              {idx < BENCHMARK_STEPS.length - 1 && <div className="self-center text-violet-400">→</div>}
            </React.Fragment>
          ))}
        </div>

        {/* 구성 항목 + 버튼 */}
        <div>
          <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">주요 항목 <span className="text-xs font-normal text-gray-400">(리포트 구성)</span></div>
          <ul className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-1.5 mb-4">
            {BENCHMARK_ITEMS.map((item) => (
              <li key={item} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                <span className="text-green-500">✓</span>
                {item}
              </li>
            ))}
          </ul>
          <Link
            to="/dashboard/benchmark"
            className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-semibold rounded-lg bg-gray-900 hover:bg-gray-800 dark:bg-violet-500 dark:hover:bg-violet-600 text-white transition-colors"
          >
            AI 벤치마킹 리포트 만들기
          </Link>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">현재는 예시 리포트입니다. 실제 공개 웹 검색 기반 분석은 고도화 버전에서 제공됩니다.</p>
        </div>
      </div>
    </div>
  )
}
