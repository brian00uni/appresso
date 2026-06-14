// 가성비대장 — 배달 플랫폼 기본값
// 설정 화면에서 사용자가 수정 가능. 수정값은 gaseongbi_settings.platforms에 저장되고,
// 없으면 아래 기본값을 사용한다.

export const PLATFORM_ORDER = ['baemin', 'coupangeats', 'yogiyo']

export const PLATFORMS = {
  baemin: {
    id: 'baemin',
    name: '배민',
    commissionRate: 0.068,
    cardFeeRate: 0.03,
    deliveryAgencyFee: 3000,
  },
  coupangeats: {
    id: 'coupangeats',
    name: '쿠팡이츠',
    commissionRate: 0.099,
    cardFeeRate: 0.03,
    deliveryAgencyFee: 0,
  },
  yogiyo: {
    id: 'yogiyo',
    name: '요기요',
    commissionRate: 0.129,
    cardFeeRate: 0.03,
    deliveryAgencyFee: 3000,
  },
}

// 배민/쿠팡이츠의 음식 카테고리 분류를 기준으로 정리한 메뉴 카테고리 목록
export const MENU_CATEGORIES = [
  '치킨',
  '피자',
  '한식',
  '중식',
  '일식/돈카츠',
  '양식',
  '분식',
  '족발/보쌈',
  '버거',
  '카페/디저트',
  '도시락',
  '야식',
  '회/초밥',
  '아시안/멕시칸',
  '샐러드/건강식',
  '기타',
]

export function getPlatformDefaults(platformId, settings) {
  const base = PLATFORMS[platformId]
  if (!base) return null
  const override = settings?.platforms?.[platformId]
  return { ...base, ...override }
}
