import React, { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getMenus, getSettings } from '../../../lib/gaseongbi/storage'
import { calcMargin, formatWon, formatPercent } from '../../../lib/gaseongbi/calc'
import { PLATFORM_ORDER, getPlatformDefaults } from '../../../lib/gaseongbi/platforms'
import RatingBadge from '../../../components/gaseongbi/RatingBadge'
import SummaryCard from '../../../components/gaseongbi/SummaryCard'
import PlatformCompareChart from '../../../components/gaseongbi/PlatformCompareChart'
import CostBreakdownChart from '../../../components/gaseongbi/CostBreakdownChart'

const CARD_CLASS = 'bg-white dark:bg-gray-800 shadow-xs rounded-xl border border-gray-100 dark:border-gray-700/60 p-6'

const inputClass =
  'w-full px-3 py-2 text-sm bg-white dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700/60 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-lg outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all'

const labelClass = 'block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1'

function buildPlatformInputs(settings) {
  const result = {}
  PLATFORM_ORDER.forEach((id) => {
    const p = getPlatformDefaults(id, settings)
    result[id] = { commissionRate: p.commissionRate, cardFeeRate: p.cardFeeRate, deliveryAgencyFee: p.deliveryAgencyFee }
  })
  return result
}

export default function PlatformComparisonPage() {
  const [searchParams] = useSearchParams()
  const menuId = searchParams.get('menuId')
  const settings = useMemo(() => getSettings(), [])
  const menus = useMemo(() => getMenus(), [])

  const [selectedMenuId, setSelectedMenuId] = useState(menuId || '')
  const [menuValues, setMenuValues] = useState({ salePrice: 0, foodCost: 0, packingCost: 0 })
  const [shared, setShared] = useState({
    customerDeliveryTip: settings.defaults.customerDeliveryTip,
    ownerCoupon: settings.defaults.ownerCoupon,
    adCost: settings.defaults.adCost,
    targetMarginRate: settings.defaults.targetMarginRate,
    vatIncluded: settings.defaults.vatIncluded,
  })
  const [platformInputs, setPlatformInputs] = useState(() => buildPlatformInputs(settings))

  useEffect(() => {
    if (!selectedMenuId) return
    const menu = menus.find((m) => m.id === selectedMenuId)
    if (!menu) return
    setMenuValues({ salePrice: menu.deliveryPrice, foodCost: menu.foodCost, packingCost: menu.packingCost })
    setShared((s) => ({ ...s, ownerCoupon: menu.defaultCoupon }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMenuId])

  const setSharedField = (key, value) => setShared((s) => ({ ...s, [key]: value }))
  const setSharedNumber = (key, value) => setSharedField(key, value === '' ? 0 : Number(value))
  const setMenuValueField = (key, value) => setMenuValues((v) => ({ ...v, [key]: value === '' ? 0 : Number(value) }))
  const setPlatformField = (platformId, key, value, isRate) => {
    setPlatformInputs((p) => ({
      ...p,
      [platformId]: { ...p[platformId], [key]: value === '' ? 0 : isRate ? Number(value) / 100 : Number(value) },
    }))
  }

  const results = useMemo(() => {
    return PLATFORM_ORDER.map((id) => {
      const platform = getPlatformDefaults(id, settings)
      const inputs = platformInputs[id]
      const result = calcMargin({
        salePrice: menuValues.salePrice,
        foodCost: menuValues.foodCost,
        packingCost: menuValues.packingCost,
        commissionRate: inputs.commissionRate,
        cardFeeRate: inputs.cardFeeRate,
        deliveryAgencyFee: inputs.deliveryAgencyFee,
        customerDeliveryTip: shared.customerDeliveryTip,
        ownerCoupon: shared.ownerCoupon,
        adCost: shared.adCost,
        targetMarginRate: shared.targetMarginRate,
        vatIncluded: shared.vatIncluded,
      })
      return { id, name: platform.name, inputs, result }
    })
  }, [menuValues, shared, platformInputs, settings])

  const chartData = results.map((r) => ({ name: r.name, netProfit: r.result.netProfit, rating: r.result.rating }))
  const costChartData = results.map((r) => ({
    name: r.name,
    commission: r.result.commission + r.result.commissionVat,
    cardFee: r.result.cardFee,
    delivery: r.result.ownerDeliveryFee,
    coupon: shared.ownerCoupon,
    ad: shared.adCost,
  }))

  const best = useMemo(() => results.reduce((a, b) => (b.result.netProfit > a.result.netProfit ? b : a), results[0]), [results])
  const worst = useMemo(() => results.reduce((a, b) => (b.result.netProfit < a.result.netProfit ? b : a), results[0]), [results])
  const avgCommissionBurden = useMemo(() => {
    const sum = results.reduce((acc, r) => acc + r.result.commission + r.result.commissionVat + r.result.cardFee, 0)
    return sum / results.length
  }, [results])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">플랫폼비교</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">같은 메뉴를 배민/쿠팡이츠/요기요 기준으로 비교해보세요.</p>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard icon="target" label="가장 유리한 플랫폼" value={best.name} sub={`순이익 ${formatWon(best.result.netProfit)}`} tone="green" />
        <SummaryCard icon="money" label="최고 예상 순이익" value={formatWon(best.result.netProfit)} sub={`마진율 ${formatPercent(best.result.marginRate)}`} tone="violet" />
        <SummaryCard icon="pie" label="평균 수수료 부담" value={formatWon(avgCommissionBurden)} sub="중개+카드 수수료 평균" tone="blue" />
        <SummaryCard icon="warning" label="주의가 필요한 플랫폼" value={worst.name} sub={`순이익 ${formatWon(worst.result.netProfit)}`} tone={worst.result.netProfit < 0 ? 'red' : 'yellow'} />
      </div>

      {/* 비교 조건 설정 */}
      <details className={CARD_CLASS}>
        <summary className="cursor-pointer text-lg font-semibold text-gray-800 dark:text-gray-100">비교 조건 설정</summary>
        <div className="mt-4 space-y-4">
          <div>
            <label className={labelClass}>메뉴 선택</label>
            <select className={`${inputClass} max-w-sm`} value={selectedMenuId} onChange={(e) => setSelectedMenuId(e.target.value)}>
              <option value="">직접 입력</option>
              {menus.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.menuName}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>판매가 (원)</label>
              <input type="text" className={inputClass} value={menuValues.salePrice} onChange={(e) => setMenuValueField('salePrice', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>식재료원가 (원)</label>
              <input type="text" className={inputClass} value={menuValues.foodCost} onChange={(e) => setMenuValueField('foodCost', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>포장비 (원)</label>
              <input type="text" className={inputClass} value={menuValues.packingCost} onChange={(e) => setMenuValueField('packingCost', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>고객부담 배달팁 (원)</label>
              <input type="text" className={inputClass} value={shared.customerDeliveryTip} onChange={(e) => setSharedNumber('customerDeliveryTip', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>사장님부담 쿠폰 (원)</label>
              <input type="text" className={inputClass} value={shared.ownerCoupon} onChange={(e) => setSharedNumber('ownerCoupon', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>광고비 (1건당, 원)</label>
              <input type="text" className={inputClass} value={shared.adCost} onChange={(e) => setSharedNumber('adCost', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>목표 마진율 (%)</label>
              <input type="text" className={inputClass} value={(shared.targetMarginRate * 100).toFixed(1)} onChange={(e) => setSharedField('targetMarginRate', (Number(e.target.value) || 0) / 100)} />
            </div>
            <div className="flex items-end">
              <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 dark:border-gray-600 text-violet-500 focus:ring-violet-500"
                  checked={shared.vatIncluded}
                  onChange={(e) => setSharedField('vatIncluded', e.target.checked)}
                />
                부가세 포함 계산
              </label>
            </div>
          </div>
        </div>
      </details>

      {/* 플랫폼별 카드 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {results.map(({ id, name, inputs, result }) => (
          <div key={id} className="bg-white dark:bg-gray-800 shadow-xs rounded-xl border border-gray-100 dark:border-gray-700/60 p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{name}</h3>
              <RatingBadge rating={result.rating} />
            </div>

            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">예상 순이익</div>
              <div className={`text-2xl font-bold ${result.netProfit >= 0 ? 'text-gray-800 dark:text-gray-100' : 'text-red-600 dark:text-red-400'}`}>
                {formatWon(result.netProfit)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">마진율 {formatPercent(result.marginRate)}</div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-gray-50 dark:bg-gray-900/40 rounded-lg px-3 py-2">
                <div className="text-xs text-gray-500 dark:text-gray-400">권장 판매가</div>
                <div className="font-semibold text-amber-600 dark:text-amber-400">{formatWon(result.recommendedPrice)}</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900/40 rounded-lg px-3 py-2">
                <div className="text-xs text-gray-500 dark:text-gray-400">수수료 합계</div>
                <div className="font-semibold text-gray-800 dark:text-gray-100">{formatWon(result.commission + result.cardFee + result.commissionVat)}</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900/40 rounded-lg px-3 py-2">
                <div className="text-xs text-gray-500 dark:text-gray-400">배달비 (실부담)</div>
                <div className="font-semibold text-gray-800 dark:text-gray-100">{formatWon(result.ownerDeliveryFee)}</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900/40 rounded-lg px-3 py-2">
                <div className="text-xs text-gray-500 dark:text-gray-400">쿠폰 적용 후</div>
                <div className="font-semibold text-gray-800 dark:text-gray-100">{formatWon(result.profitAfterCoupon)}</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900/40 rounded-lg px-3 py-2 col-span-2">
                <div className="text-xs text-gray-500 dark:text-gray-400">광고 포함 손익</div>
                <div className="font-semibold text-gray-800 dark:text-gray-100">{formatWon(result.netProfit)}</div>
              </div>
            </div>

            <details className="text-sm">
              <summary className="cursor-pointer text-gray-500 dark:text-gray-400">플랫폼 조건 수정</summary>
              <div className="mt-3 space-y-2">
                <div>
                  <label className={labelClass}>중개수수료율 (%)</label>
                  <input
                    type="text"
                    className={inputClass}
                    value={(inputs.commissionRate * 100).toFixed(2)}
                    onChange={(e) => setPlatformField(id, 'commissionRate', e.target.value, true)}
                  />
                </div>
                <div>
                  <label className={labelClass}>카드수수료율 (%)</label>
                  <input
                    type="text"
                    className={inputClass}
                    value={(inputs.cardFeeRate * 100).toFixed(2)}
                    onChange={(e) => setPlatformField(id, 'cardFeeRate', e.target.value, true)}
                  />
                </div>
                <div>
                  <label className={labelClass}>배달대행비 (원)</label>
                  <input
                    type="text"
                    className={inputClass}
                    value={inputs.deliveryAgencyFee}
                    onChange={(e) => setPlatformField(id, 'deliveryAgencyFee', e.target.value, false)}
                  />
                </div>
              </div>
            </details>
          </div>
        ))}
      </div>

      {/* 차트 + 추천 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className={CARD_CLASS}>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">플랫폼별 예상 순이익</h2>
            <PlatformCompareChart platforms={chartData} />
          </div>
          <div className={CARD_CLASS}>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">플랫폼별 비용 구성</h2>
            <CostBreakdownChart platforms={costChartData} />
          </div>
        </div>

        <div className="space-y-6">
          <div className={`${CARD_CLASS} border-l-4 border-l-green-500`}>
            <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-2">오늘의 추천: {best.name}</h2>
            <ul className="space-y-1.5 text-sm text-gray-600 dark:text-gray-300">
              <li className="flex gap-2">
                <span className="text-green-500">✓</span>
                예상 순이익이 {formatWon(best.result.netProfit)}로 가장 높아요.
              </li>
              <li className="flex gap-2">
                <span className="text-green-500">✓</span>
                마진율 {formatPercent(best.result.marginRate)}로 안정적인 수준이에요.
              </li>
              <li className="flex gap-2">
                <span className="text-green-500">✓</span>
                수수료 부담이 {formatWon(best.result.commission + best.result.cardFee + best.result.commissionVat)}로 상대적으로 낮아요.
              </li>
            </ul>
          </div>

          <div className={`${CARD_CLASS} border-l-4 border-l-amber-500`}>
            <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-2">주의가 필요한 플랫폼: {worst.name}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
              예상 순이익이 {formatWon(worst.result.netProfit)}로 가장 낮아요{worst.result.netProfit < 0 ? ' (적자)' : ''}.
            </p>
            <ul className="space-y-1.5 text-sm text-gray-600 dark:text-gray-300">
              <li className="flex gap-2">
                <span className="text-amber-500">!</span>
                권장 판매가 {formatWon(worst.result.recommendedPrice)} 이상으로 가격을 조정해보세요.
              </li>
              <li className="flex gap-2">
                <span className="text-amber-500">!</span>
                쿠폰/광고비 비중을 줄여 순이익을 개선해보세요.
              </li>
              <li className="flex gap-2">
                <span className="text-amber-500">!</span>
                이 플랫폼의 주문 비중을 {best.name} 쪽으로 일부 옮겨보는 것도 방법이에요.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* 플랫폼별 비용 상세 */}
      <div className={CARD_CLASS}>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">플랫폼별 비용 상세</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700/60">
                <th className="py-2 pr-4">항목</th>
                {results.map((r) => (
                  <th key={r.id} className="py-2 pr-4 text-right">
                    {r.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-gray-700 dark:text-gray-300">
              {[
                ['판매가', (r) => r.result.salePrice],
                ['식재료원가', (r) => menuValues.foodCost],
                ['포장비', (r) => menuValues.packingCost],
                ['중개수수료 (+VAT)', (r) => r.result.commission + r.result.commissionVat],
                ['카드수수료', (r) => r.result.cardFee],
                ['배달비 (실부담)', (r) => r.result.ownerDeliveryFee],
                ['쿠폰', () => shared.ownerCoupon],
                ['광고비', () => shared.adCost],
              ].map(([label, getValue]) => (
                <tr key={label} className="border-b border-gray-50 dark:border-gray-700/40 last:border-0">
                  <td className="py-2 pr-4">{label}</td>
                  {results.map((r) => (
                    <td key={r.id} className="py-2 pr-4 text-right">
                      {formatWon(getValue(r))}
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="border-t border-gray-200 dark:border-gray-700 font-semibold text-gray-800 dark:text-gray-100">
                <td className="py-2 pr-4">예상 순이익</td>
                {results.map((r) => (
                  <td key={r.id} className={`py-2 pr-4 text-right ${r.result.netProfit < 0 ? 'text-red-600 dark:text-red-400' : ''}`}>
                    {formatWon(r.result.netProfit)}
                  </td>
                ))}
              </tr>
              <tr className="text-gray-500 dark:text-gray-400">
                <td className="py-2 pr-4">마진율</td>
                {results.map((r) => (
                  <td key={r.id} className="py-2 pr-4 text-right">
                    {formatPercent(r.result.marginRate)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
