// 가성비대장 — 마진 계산엔진
import * as XLSX from 'xlsx'
import { getPlatformDefaults, PLATFORM_ORDER } from './platforms'

// 순이익 = 판매가 - 식재료원가 - 포장비 - 중개수수료 - 카드수수료
//          - 사장님부담배달비 - 쿠폰 - 광고비 - 수수료부가세
export function calcMargin({
  salePrice = 0,
  foodCost = 0,
  packingCost = 0,
  commissionRate = 0,
  cardFeeRate = 0,
  deliveryAgencyFee = 0,
  customerDeliveryTip = 0,
  ownerCoupon = 0,
  adCost = 0,
  targetMarginRate = 0.2,
  vatIncluded = true,
}) {
  const commission = salePrice * commissionRate
  const cardFee = salePrice * cardFeeRate
  const ownerDeliveryFee = Math.max(deliveryAgencyFee - customerDeliveryTip, 0)
  const commissionVat = vatIncluded ? commission * 0.1 : 0

  const baseProfit = salePrice - foodCost - packingCost - commission - cardFee - ownerDeliveryFee - commissionVat
  const profitAfterCoupon = baseProfit - ownerCoupon
  const netProfit = profitAfterCoupon - adCost

  const marginRate = salePrice > 0 ? netProfit / salePrice : 0

  const fixedCosts = foodCost + packingCost + ownerDeliveryFee + ownerCoupon + adCost
  const variableFeeRate = commissionRate + cardFeeRate + (vatIncluded ? commissionRate * 0.1 : 0)
  const recommendedDenominator = 1 - targetMarginRate - variableFeeRate
  const recommendedPrice = recommendedDenominator > 0 ? fixedCosts / recommendedDenominator : 0
  const shortfall = Math.max(recommendedPrice - salePrice, 0)

  const rating = getRating(netProfit, marginRate)

  return {
    commission,
    cardFee,
    ownerDeliveryFee,
    commissionVat,
    baseProfit,
    profitAfterCoupon,
    netProfit,
    marginRate,
    fixedCosts,
    variableFeeRate,
    recommendedPrice,
    shortfall,
    rating,
    scenarios: {
      1: netProfit * 1,
      10: netProfit * 10,
      30: netProfit * 30,
      50: netProfit * 50,
    },
  }
}

export function getRating(netProfit, marginRate) {
  if (netProfit <= 0) return 'red'
  if (marginRate < 0.1) return 'yellow'
  return 'green'
}

export const RATING_LABELS = {
  green: '안전',
  yellow: '주의',
  red: '위험',
}

// 광고비 보조 계산기 — 1건당 광고비 산출
// type: 'click'(클릭형) | 'order'(주문연동형) | 'fixed'(고정형)
export function calcAdCostPerOrder({ type, adSpend = 0, adOrders = 0, salePrice = 0, adRate = 0, fixedAdBudget = 0, monthlyOrders = 0 }) {
  switch (type) {
    case 'click':
      return adOrders > 0 ? adSpend / adOrders : 0
    case 'order':
      return salePrice * adRate
    case 'fixed':
      return monthlyOrders > 0 ? fixedAdBudget / monthlyOrders : 0
    default:
      return 0
  }
}

// 저장된 메뉴 + 설정(기준 플랫폼/공용 기본값)으로 마진 계산
export function calcMenuMargin(menu, settings, platformId) {
  const platform = getPlatformDefaults(platformId, settings) || {}
  const d = settings?.defaults || {}
  return calcMargin({
    salePrice: menu.deliveryPrice,
    foodCost: menu.foodCost,
    packingCost: menu.packingCost,
    commissionRate: platform.commissionRate ?? 0,
    cardFeeRate: platform.cardFeeRate ?? 0,
    deliveryAgencyFee: platform.deliveryAgencyFee ?? 0,
    customerDeliveryTip: d.customerDeliveryTip ?? 0,
    ownerCoupon: menu.defaultCoupon ?? 0,
    adCost: d.adCost ?? 0,
    targetMarginRate: d.targetMarginRate ?? 0.2,
    vatIncluded: d.vatIncluded ?? true,
  })
}

// 메뉴 1개에 대해 배민/쿠팡이츠/요기요 3개 플랫폼 계산 결과를 모두 반환
export function calcMenuMarginAllPlatforms(menu, settings) {
  const out = {}
  PLATFORM_ORDER.forEach((id) => {
    out[id] = calcMenuMargin(menu, settings, id)
  })
  return out
}

// 전체 메뉴를 기준 플랫폼으로 계산한 뒤 대시보드/리포트용 포트폴리오 집계를 반환
export function aggregateMenus(menus, settings) {
  const referencePlatform = settings?.defaults?.referencePlatform || PLATFORM_ORDER[0]
  const monthlyUnits = settings?.defaults?.monthlyUnitsPerMenu ?? 30
  const platform = getPlatformDefaults(referencePlatform, settings) || {}
  const d = settings?.defaults || {}
  const adCost = d.adCost || 0

  const items = menus.map((menu) => {
    const result = calcMenuMargin(menu, settings, referencePlatform)
    const resultNoAd = calcMargin({
      salePrice: menu.deliveryPrice,
      foodCost: menu.foodCost,
      packingCost: menu.packingCost,
      commissionRate: platform.commissionRate ?? 0,
      cardFeeRate: platform.cardFeeRate ?? 0,
      deliveryAgencyFee: platform.deliveryAgencyFee ?? 0,
      customerDeliveryTip: d.customerDeliveryTip ?? 0,
      ownerCoupon: menu.defaultCoupon ?? 0,
      adCost: 0,
      targetMarginRate: d.targetMarginRate ?? 0.2,
      vatIncluded: d.vatIncluded ?? true,
    })
    return { menu, result, resultNoAd }
  })

  const total = items.length
  let green = 0
  let yellow = 0
  let red = 0
  let marginSum = 0
  let monthlyRevenue = 0
  let monthlyNetProfit = 0

  items.forEach(({ menu, result }) => {
    if (result.rating === 'green') green++
    else if (result.rating === 'yellow') yellow++
    else red++
    marginSum += result.marginRate
    monthlyRevenue += menu.deliveryPrice * monthlyUnits
    monthlyNetProfit += result.netProfit * monthlyUnits
  })

  const avgMarginRate = total > 0 ? marginSum / total : 0
  const monthlyAdCost = adCost * monthlyUnits * total

  const riskTop5 = [...items].sort((a, b) => a.result.marginRate - b.result.marginRate).slice(0, 5)

  const priceUpList = items
    .filter((i) => i.result.shortfall > 0)
    .sort((a, b) => b.result.shortfall - a.result.shortfall)
    .slice(0, 5)

  const couponDownList = items
    .filter((i) => {
      const coupon = i.menu.defaultCoupon || 0
      return coupon > 0 && i.result.baseProfit > 0 && coupon >= i.result.baseProfit * 0.3
    })
    .slice(0, 5)

  const adWarningList =
    adCost > 0
      ? items
          .filter((i) => i.result.rating === 'red' || i.result.netProfit < i.resultNoAd.netProfit * 0.5)
          .sort((a, b) => a.result.netProfit - b.result.netProfit)
          .slice(0, 5)
      : []

  return {
    total,
    green,
    yellow,
    red,
    avgMarginRate,
    monthlyRevenue,
    monthlyNetProfit,
    monthlyAdCost,
    riskTop5,
    priceUpList,
    couponDownList,
    adWarningList,
    items,
    referencePlatform,
    monthlyUnits,
  }
}

// 손익리포트 엑셀 다운로드 (대시보드/손익리포트 공용)
export function exportMarginReportExcel(menus, settings) {
  const referencePlatform = settings?.defaults?.referencePlatform || PLATFORM_ORDER[0]
  const adCost = settings?.defaults?.adCost || 0

  const data = menus.map((menu) => {
    const result = calcMenuMargin(menu, settings, referencePlatform)
    return {
      메뉴명: menu.menuName,
      '현재 판매가': menu.deliveryPrice,
      '권장 판매가': Math.round(result.recommendedPrice),
      '부족한 금액': Math.round(result.shortfall),
      '식재료 원가': menu.foodCost,
      포장비: menu.packingCost,
      중개수수료: Math.round(result.commission),
      카드수수료: Math.round(result.cardFee),
      배달비: Math.round(result.ownerDeliveryFee),
      쿠폰: menu.defaultCoupon,
      광고비: Math.round(adCost),
      '건당 순이익': Math.round(result.netProfit),
      마진율: `${(result.marginRate * 100).toFixed(1)}%`,
      '10개 판매 손익': Math.round(result.scenarios[10]),
      '30개 판매 손익': Math.round(result.scenarios[30]),
      '50개 판매 손익': Math.round(result.scenarios[50]),
      판정: RATING_LABELS[result.rating],
    }
  })

  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, '손익리포트')

  const date = new Date()
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  XLSX.writeFile(workbook, `gaseongbi_margin_report_${y}${m}${dd}.xlsx`)
}

// ── 포맷 헬퍼 ──────────────────────────────────────────────────

export function formatWon(value) {
  const rounded = Math.round(value || 0)
  return `${rounded.toLocaleString('ko-KR')}원`
}

export function formatPercent(rate, digits = 1) {
  return `${((rate || 0) * 100).toFixed(digits)}%`
}
