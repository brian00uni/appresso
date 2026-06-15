import React, { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getMenus, getSettings, getCalcState, saveCalcState } from '../../../lib/gaseongbi/storage'
import { calcMargin, calcAdCostPerOrder, formatWon, formatPercent } from '../../../lib/gaseongbi/calc'
import { getAiComment } from '../../../lib/gaseongbi/aiComment'
import { PLATFORM_ORDER, getPlatformDefaults } from '../../../lib/gaseongbi/platforms'
import RatingBadge from '../../../components/gaseongbi/RatingBadge'
import SummaryCard from '../../../components/gaseongbi/SummaryCard'
import AiCommentBox from '../../../components/gaseongbi/AiCommentBox'
import ProfitByUnitsChart from '../../../components/gaseongbi/ProfitByUnitsChart'

const inputClass =
  'w-full px-3 py-2 text-sm bg-white dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700/60 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-lg outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all'

const labelClass = 'block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1'

const CARD_CLASS = 'bg-white dark:bg-gray-800 shadow-xs rounded-xl border border-gray-100 dark:border-gray-700/60 p-6'

function buildInitialForm(settings) {
  const platform = getPlatformDefaults(PLATFORM_ORDER[0], settings)
  const d = settings.defaults
  return {
    platform: PLATFORM_ORDER[0],
    salePrice: 0,
    foodCost: 0,
    packingCost: 0,
    commissionRate: platform.commissionRate,
    cardFeeRate: platform.cardFeeRate,
    deliveryAgencyFee: platform.deliveryAgencyFee,
    customerDeliveryTip: d.customerDeliveryTip,
    ownerCoupon: d.ownerCoupon,
    adCost: d.adCost,
    targetMarginRate: d.targetMarginRate,
    vatIncluded: d.vatIncluded,
  }
}

function BreakdownRow({ label, amount, salePrice, negative = true }) {
  const pct = salePrice > 0 ? (amount / salePrice) * 100 : 0
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700/60 last:border-0">
      <span className="text-sm text-gray-600 dark:text-gray-300">{label}</span>
      <div className="text-right">
        <span className={`text-sm font-medium ${negative ? 'text-gray-800 dark:text-gray-100' : ''}`}>
          {negative ? '-' : ''}
          {formatWon(amount)}
        </span>
        <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">{pct.toFixed(1)}%</span>
      </div>
    </div>
  )
}

export default function MarginCalculatorPage() {
  const [searchParams] = useSearchParams()
  const menuId = searchParams.get('menuId')
  const settings = useMemo(() => getSettings(), [])
  const menus = useMemo(() => getMenus(), [])

  const [selectedMenuId, setSelectedMenuId] = useState(menuId || '')
  const [form, setForm] = useState(() => getCalcState() || buildInitialForm(settings))
  const [adHelperOpen, setAdHelperOpen] = useState(false)
  const [adHelper, setAdHelper] = useState({ type: 'click', adSpend: 0, adOrders: 0, adRate: 0, fixedAdBudget: 0, monthlyOrders: 0 })
  const [promoTipOpen, setPromoTipOpen] = useState(false)

  // URL의 menuId로 들어왔을 때 메뉴 값으로 자동 채움
  useEffect(() => {
    if (!menuId) return
    const menu = menus.find((m) => m.id === menuId)
    if (!menu) return
    setSelectedMenuId(menu.id)
    setForm((f) => ({
      ...f,
      salePrice: menu.deliveryPrice,
      foodCost: menu.foodCost,
      packingCost: menu.packingCost,
      ownerCoupon: menu.defaultCoupon,
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuId])

  useEffect(() => {
    saveCalcState(form)
  }, [form])

  const handleMenuSelect = (id) => {
    setSelectedMenuId(id)
    if (!id) return
    const menu = menus.find((m) => m.id === id)
    if (!menu) return
    setForm((f) => ({
      ...f,
      salePrice: menu.deliveryPrice,
      foodCost: menu.foodCost,
      packingCost: menu.packingCost,
      ownerCoupon: menu.defaultCoupon,
    }))
  }

  const handlePlatformChange = (platformId) => {
    if (platformId === 'custom') {
      setForm((f) => ({ ...f, platform: 'custom' }))
      return
    }
    const platform = getPlatformDefaults(platformId, settings)
    setForm((f) => ({
      ...f,
      platform: platformId,
      commissionRate: platform.commissionRate,
      cardFeeRate: platform.cardFeeRate,
      deliveryAgencyFee: platform.deliveryAgencyFee,
    }))
  }

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }))
  const setNumberField = (key, value) => setField(key, value === '' ? 0 : Number(value))
  const setRateField = (key, value) => setField(key, value === '' ? 0 : Number(value) / 100)

  const result = useMemo(() => calcMargin(form), [form])
  const aiComment = useMemo(() => getAiComment(result), [result])

  const applyAdHelper = () => {
    const perOrder = calcAdCostPerOrder(adHelper)
    setField('adCost', Math.round(perOrder))
    setAdHelperOpen(false)
  }

  const applyCouponSuggestion = () => {
    const suggested = Math.max(Math.round(result.baseProfit * 0.05), 0)
    setField('ownerCoupon', suggested)
  }

  const applyRecommendedPrice = () => {
    setField('salePrice', Math.round(result.recommendedPrice))
  }

  const { commission, cardFee, commissionVat, ownerDeliveryFee, baseProfit, profitAfterCoupon, netProfit, salePrice } = result

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">마진계산</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">메뉴를 선택하면 판매가/원가/포장비/쿠폰이 자동으로 채워져요.</p>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          icon="money"
          label="현재 예상 순이익"
          value={formatWon(netProfit)}
          valueClassName={netProfit < 0 ? 'text-red-600 dark:text-red-400' : ''}
          tone={netProfit >= 0 ? 'green' : 'red'}
        />
        <SummaryCard icon="pie" label="마진율" value={formatPercent(result.marginRate)} tone="violet" />
        <SummaryCard icon="priceUp" label="권장 판매가" value={formatWon(result.recommendedPrice)} sub={`현재가 대비 +${formatWon(result.shortfall)}`} tone="yellow" />
        <div className={`bg-white dark:bg-gray-800 shadow-xs rounded-xl border border-gray-100 dark:border-gray-700/60 p-5 flex flex-col`}>
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">오늘의 판정</div>
          <RatingBadge rating={result.rating} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. 입력 정보 */}
        <div className={CARD_CLASS}>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">1. 입력 정보</h2>

          <div className="mb-4">
            <label className={labelClass}>메뉴 불러오기 (선택사항)</label>
            <select className={`${inputClass} max-w-sm`} value={selectedMenuId} onChange={(e) => handleMenuSelect(e.target.value)}>
              <option value="">직접 입력</option>
              {menus.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.menuName}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>판매가 (원)</label>
              <input type="text" className={inputClass} value={form.salePrice} min={0} onChange={(e) => setNumberField('salePrice', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>식재료원가 (원)</label>
              <input type="text" className={inputClass} value={form.foodCost} min={0} onChange={(e) => setNumberField('foodCost', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>포장비 (원)</label>
              <input type="text" className={inputClass} value={form.packingCost} min={0} onChange={(e) => setNumberField('packingCost', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>플랫폼</label>
              <select className={inputClass} value={form.platform} onChange={(e) => handlePlatformChange(e.target.value)}>
                {PLATFORM_ORDER.map((id) => (
                  <option key={id} value={id}>
                    {getPlatformDefaults(id, settings).name}
                  </option>
                ))}
                <option value="custom">직접입력</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>중개수수료율 (%)</label>
              <input
                type="text"
                className={inputClass}
                value={(form.commissionRate * 100).toFixed(2)}
                min={0}
                step={0.1}
                onChange={(e) => setRateField('commissionRate', e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>카드수수료율 (%)</label>
              <input
                type="text"
                className={inputClass}
                value={(form.cardFeeRate * 100).toFixed(2)}
                min={0}
                step={0.1}
                onChange={(e) => setRateField('cardFeeRate', e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>배달대행비 (원)</label>
              <input
                type="text"
                className={inputClass}
                value={form.deliveryAgencyFee}
                min={0}
                onChange={(e) => setNumberField('deliveryAgencyFee', e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>고객부담 배달팁 (원)</label>
              <input
                type="text"
                className={inputClass}
                value={form.customerDeliveryTip}
                min={0}
                onChange={(e) => setNumberField('customerDeliveryTip', e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>사장님부담 쿠폰 (원)</label>
              <input
                type="text"
                className={inputClass}
                value={form.ownerCoupon}
                min={0}
                onChange={(e) => setNumberField('ownerCoupon', e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>광고비 (1건당, 원)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className={inputClass}
                  value={form.adCost}
                  min={0}
                  onChange={(e) => setNumberField('adCost', e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setAdHelperOpen((v) => !v)}
                  className="px-3 py-2 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-700/60 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors whitespace-nowrap"
                >
                  계산기
                </button>
              </div>
            </div>
            <div>
              <label className={labelClass}>목표 마진율 (%)</label>
              <input
                type="text"
                className={inputClass}
                value={(form.targetMarginRate * 100).toFixed(1)}
                min={0}
                step={1}
                onChange={(e) => setRateField('targetMarginRate', e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 dark:border-gray-600 text-violet-500 focus:ring-violet-500"
                  checked={form.vatIncluded}
                  onChange={(e) => setField('vatIncluded', e.target.checked)}
                />
                부가세 포함 계산
              </label>
            </div>
          </div>

          {adHelperOpen && (
            <div className="mt-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700/60">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-3">광고비 계산기 (1건당 광고비)</h3>
              <div className="flex flex-wrap gap-3 mb-3">
                {[
                  { id: 'click', label: '클릭형' },
                  { id: 'order', label: '주문연동형' },
                  { id: 'fixed', label: '고정형' },
                ].map((opt) => (
                  <label key={opt.id} className="inline-flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
                    <input
                      type="radio"
                      name="adHelperType"
                      checked={adHelper.type === opt.id}
                      onChange={() => setAdHelper((a) => ({ ...a, type: opt.id }))}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>

              {adHelper.type === 'click' && (
                <div className="grid grid-cols-2 gap-3 max-w-md">
                  <div>
                    <label className={labelClass}>광고 사용금액 (원)</label>
                    <input type="text" className={inputClass} value={adHelper.adSpend} onChange={(e) => setAdHelper((a) => ({ ...a, adSpend: Number(e.target.value) || 0 }))} />
                  </div>
                  <div>
                    <label className={labelClass}>광고로 발생한 주문 수</label>
                    <input type="text" className={inputClass} value={adHelper.adOrders} onChange={(e) => setAdHelper((a) => ({ ...a, adOrders: Number(e.target.value) || 0 }))} />
                  </div>
                </div>
              )}
              {adHelper.type === 'order' && (
                <div className="grid grid-cols-2 gap-3 max-w-md">
                  <div>
                    <label className={labelClass}>광고비율 (판매가 대비 %)</label>
                    <input
                      type="text"
                      className={inputClass}
                      value={adHelper.adRate * 100}
                      onChange={(e) => setAdHelper((a) => ({ ...a, adRate: (Number(e.target.value) || 0) / 100 }))}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>판매가 (원)</label>
                    <input type="text" className={inputClass} value={form.salePrice} disabled />
                  </div>
                </div>
              )}
              {adHelper.type === 'fixed' && (
                <div className="grid grid-cols-2 gap-3 max-w-md">
                  <div>
                    <label className={labelClass}>월 고정 광고비 (원)</label>
                    <input type="text" className={inputClass} value={adHelper.fixedAdBudget} onChange={(e) => setAdHelper((a) => ({ ...a, fixedAdBudget: Number(e.target.value) || 0 }))} />
                  </div>
                  <div>
                    <label className={labelClass}>월 주문 수</label>
                    <input type="text" className={inputClass} value={adHelper.monthlyOrders} onChange={(e) => setAdHelper((a) => ({ ...a, monthlyOrders: Number(e.target.value) || 0 }))} />
                  </div>
                </div>
              )}

              <div className="mt-3 flex items-center gap-3">
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  계산 결과: {Math.round(calcAdCostPerOrder({ ...adHelper, salePrice: form.salePrice })).toLocaleString('ko-KR')}원 / 건
                </span>
                <button
                  type="button"
                  onClick={applyAdHelper}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-violet-500 hover:bg-violet-600 text-white transition-colors"
                >
                  광고비에 적용
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 2. 계산 결과 */}
        <div className="space-y-6">
          <div className={CARD_CLASS}>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">2. 계산 결과</h2>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">어디서 돈이 빠지나요</h3>
            <div className="mb-4">
              <BreakdownRow label="식재료원가" amount={form.foodCost} salePrice={salePrice} />
              <BreakdownRow label="포장비" amount={form.packingCost} salePrice={salePrice} />
              <BreakdownRow label="중개수수료 (+VAT)" amount={commission + commissionVat} salePrice={salePrice} />
              <BreakdownRow label="카드수수료" amount={cardFee} salePrice={salePrice} />
              <BreakdownRow label="배달비 (사장님부담)" amount={ownerDeliveryFee} salePrice={salePrice} />
              <BreakdownRow label="쿠폰" amount={form.ownerCoupon} salePrice={salePrice} />
              <BreakdownRow label="광고비" amount={form.adCost} salePrice={salePrice} />
            </div>

            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">수량별 손익</h3>
            <ProfitByUnitsChart scenarios={result.scenarios} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className={CARD_CLASS}>
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">쿠폰 적용 후 손익</div>
              <div className="text-xl font-bold text-gray-800 dark:text-gray-100">{formatWon(profitAfterCoupon)}</div>
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">기본 마진 대비 {formatWon(profitAfterCoupon - baseProfit)}</div>
            </div>
            <div className={CARD_CLASS}>
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">광고 포함 후 손익</div>
              <div className={`text-xl font-bold ${netProfit < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-800 dark:text-gray-100'}`}>{formatWon(netProfit)}</div>
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">쿠폰 적용 후 대비 {formatWon(netProfit - profitAfterCoupon)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. AI 사장님 코멘트 */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">3. AI 사장님 코멘트</h2>
        <AiCommentBox
          comment={aiComment}
          actions={
            <>
              <button
                onClick={applyCouponSuggestion}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white/70 dark:bg-gray-900/30 hover:bg-white dark:hover:bg-gray-900/50 border border-current/20 transition-colors"
              >
                쿠폰 금액 낮추기 제안
              </button>
              <button
                onClick={applyRecommendedPrice}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white/70 dark:bg-gray-900/30 hover:bg-white dark:hover:bg-gray-900/50 border border-current/20 transition-colors"
              >
                권장 판매가 {formatWon(result.recommendedPrice)}로 시뮬레이션
              </button>
              <div className="relative">
                <button
                  onClick={() => setPromoTipOpen((v) => !v)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white/70 dark:bg-gray-900/30 hover:bg-white dark:hover:bg-gray-900/50 border border-current/20 transition-colors"
                >
                  세트 메뉴 프로모션 아이디어
                </button>
                {promoTipOpen && (
                  <div className="absolute z-10 mt-2 w-64 p-3 text-xs rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 text-gray-600 dark:text-gray-300 shadow-lg">
                    인기 메뉴와 마진율이 높은 메뉴를 묶어 세트로 구성하면, 전체 평균 마진을 유지하면서도 객단가를 높일 수 있어요.
                  </div>
                )}
              </div>
            </>
          }
        />
      </div>
    </div>
  )
}
