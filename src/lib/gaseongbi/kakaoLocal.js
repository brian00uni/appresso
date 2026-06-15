// 가성비대장 — Kakao Local API (키워드로 장소 검색)
// 벤치마킹 비교 가게 추가 시 가게명/주소/업종 자동완성에 사용한다.
// https://developers.kakao.com 에서 REST API 키를 발급받아 VITE_KAKAO_REST_API_KEY로 설정해야 동작한다.

const KAKAO_REST_API_KEY = import.meta.env.VITE_KAKAO_REST_API_KEY

export function hasKakaoKey() {
  return Boolean(KAKAO_REST_API_KEY)
}

// query: 검색어 (가게명/지역명 등)
// 반환: [{ name, category, address, distance, x, y, placeUrl }]
export async function searchPlaces(query) {
  if (!KAKAO_REST_API_KEY) throw new Error('KAKAO_API_KEY_MISSING')
  if (!query?.trim()) return []

  const params = new URLSearchParams({ query: query.trim(), size: '10' })
  const res = await fetch(`https://dapi.kakao.com/v2/local/search/keyword.json?${params.toString()}`, {
    headers: { Authorization: `KakaoAK ${KAKAO_REST_API_KEY}` },
  })
  if (!res.ok) throw new Error(`KAKAO_API_ERROR_${res.status}`)

  const data = await res.json()
  return (data.documents || []).map((d) => ({
    name: d.place_name,
    category: (d.category_name || '').split(' > ').pop() || '',
    address: d.road_address_name || d.address_name || '',
    distance: d.distance ? Number(d.distance) : null,
    x: d.x,
    y: d.y,
    placeUrl: d.place_url || '',
  }))
}

// 주소/지역명으로 좌표를 찾는다 (키워드 검색 결과의 첫 번째 장소 좌표 사용)
export async function geocodeAddress(query) {
  const results = await searchPlaces(query)
  return results[0] || null
}

// 좌표 주변의 음식점을 검색한다 (지역 경쟁가게 추천용)
// 반환: [{ name, category, address, distance, x, y, placeUrl }]
export async function searchNearbyRestaurants({ x, y, radius = 1500 }) {
  if (!KAKAO_REST_API_KEY) throw new Error('KAKAO_API_KEY_MISSING')

  const params = new URLSearchParams({
    category_group_code: 'FD6',
    x: String(x),
    y: String(y),
    radius: String(radius),
    sort: 'distance',
    size: '15',
  })
  const res = await fetch(`https://dapi.kakao.com/v2/local/search/category.json?${params.toString()}`, {
    headers: { Authorization: `KakaoAK ${KAKAO_REST_API_KEY}` },
  })
  if (!res.ok) throw new Error(`KAKAO_API_ERROR_${res.status}`)

  const data = await res.json()
  return (data.documents || []).map((d) => ({
    name: d.place_name,
    category: (d.category_name || '').split(' > ').pop() || '',
    address: d.road_address_name || d.address_name || '',
    distance: d.distance ? Number(d.distance) : null,
    x: d.x,
    y: d.y,
    placeUrl: d.place_url || '',
  }))
}
