// 가성비대장 — AI 벤치마킹 리서치 (v0.1)
//
// v0.1에서는 실제 Gemini API 호출이나 웹 검색을 하지 않습니다.
// 화면/UX 검증을 위해 Mock(예시) 데이터를 반환합니다.
//
// 나중에 실제 Gemini API를 붙일 때는 fetchBenchmarkResearch 함수만 교체하면 됩니다.
// (buildBenchmarkPrompt / parseBenchmarkResult 는 그대로 재사용)
//
// 흐름:
//   const prompt = buildBenchmarkPrompt(input)
//   const response = await fetchBenchmarkResearch(prompt)
//   const result = parseBenchmarkResult(response)

const INPUT_MARKER = '<<<INPUT_JSON>>>'

/** 입력폼의 빈 초기값 */
export const EMPTY_BENCHMARK_INPUT = {
  storeName: '',
  region: '',
  category: '',
  mainMenu: '',
  compareMenu: '',
  keyword: '',
  reviewStandard: '',
  extraRequest: '',
}

/** 입력폼 예시값 (placeholder/예시 버튼용) */
export const SAMPLE_BENCHMARK_INPUT = {
  storeName: '맛있는 김밥집 강남점',
  region: '서울 강남구 역삼동',
  category: '김밥·분식',
  mainMenu: '참치김밥',
  compareMenu: '김밥',
  keyword: '김밥맛집, 가성비, 세트',
  reviewStandard: '4.5 이상',
  extraRequest: '',
}

/**
 * 입력값으로 Gemini용 프롬프트 문자열을 만든다.
 * v0.1에서는 Mock 생성을 위해 입력 JSON을 프롬프트 끝에 함께 담아둔다.
 * 실제 API 연동 시에는 INPUT_MARKER 이후 부분을 제거하거나 무시하면 된다.
 */
export function buildBenchmarkPrompt(input) {
  const i = { ...EMPTY_BENCHMARK_INPUT, ...input }
  const instruction = `당신은 대한민국 외식업·배달앱 운영을 돕는 벤치마킹 컨설턴트입니다.
아래 가게 정보를 바탕으로, 사장님이 "오늘 바로 실행할 수 있는 개선점" 중심의 벤치마킹 리포트를 작성하세요.
공개된 정보와 사용자가 입력한 정보만 사용하고, 확인되지 않은 수치는 단정하지 마세요.

[우리 가게 정보]
- 가게명: ${i.storeName || '(미입력)'}
- 지역: ${i.region || '(미입력)'}
- 대표 메뉴: ${i.mainMenu || '(미입력)'}
- 비교할 메뉴: ${i.compareMenu || '(미입력)'}
- 분석 키워드: ${i.keyword || '(미입력)'}
- 리뷰 기준: ${i.reviewStandard || '(미입력)'}
- 추가 요청사항: ${i.extraRequest || '(없음)'}

[출력 형식]
아래 항목을 포함한 JSON으로 답하세요.
todayFixes(오늘 고칠 것 3개), conclusion(오늘의 결론), swot(strength/weakness/opportunity/threat),
menuPriceCompare(우리 가게/참고 가게 메뉴·가격 구성 비교), reviewKeywords(우리 가게/참고 가게 리뷰 키워드).`

  // v0.1 Mock 생성을 위한 입력 동봉 (실제 API 연동 시 제거 가능)
  return `${instruction}\n\n${INPUT_MARKER}${JSON.stringify(i)}`
}

function extractInput(prompt) {
  const idx = typeof prompt === 'string' ? prompt.indexOf(INPUT_MARKER) : -1
  if (idx === -1) return { ...EMPTY_BENCHMARK_INPUT }
  try {
    return { ...EMPTY_BENCHMARK_INPUT, ...JSON.parse(prompt.slice(idx + INPUT_MARKER.length)) }
  } catch {
    return { ...EMPTY_BENCHMARK_INPUT }
  }
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * 벤치마킹 리서치 결과를 가져온다.
 *
 * ⚠️ v0.1: 실제 검색/AI 호출 없이 Mock(예시) 응답을 반환한다.
 * 실제 Gemini API를 붙일 때는 이 함수의 내부 구현만 교체하면 된다.
 * (예: const res = await fetch('/api/gemini', { ... }); return await res.text())
 */
export async function fetchBenchmarkResearch(prompt) {
  // 실제 분석처럼 보이도록 1.5~2초 로딩
  await delay(1800)
  const input = extractInput(prompt)
  return JSON.stringify(buildMockResult(input))
}

/**
 * fetchBenchmarkResearch 의 응답(JSON 문자열)을 구조화된 결과 객체로 파싱한다.
 */
export function parseBenchmarkResult(response) {
  if (response && typeof response === 'object') return response
  try {
    return JSON.parse(response)
  } catch {
    return null
  }
}

/** 초기 화면용 예시 리포트를 동기로 반환 (로딩 없이 바로 표시) */
export function getBenchmarkDemoReport(input = EMPTY_BENCHMARK_INPUT) {
  return buildMockResult({ ...EMPTY_BENCHMARK_INPUT, ...input })
}

function todayStamp() {
  const d = new Date()
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

// ── Mock 데이터 생성 (예시 리포트) ─────────────────────────────────
// 실제 출처가 없는 항목(경쟁가게 수치 등)은 모두 예시 데이터이며, 화면에서 주의문구로 안내한다.
function buildMockResult(input) {
  const store = input.storeName || '맛있는 김밥집 강남점'
  const region = input.region || '서울 강남구 역삼동'
  const compare = input.compareMenu || '김밥'

  // ⚠️ 보고서 기준: 경쟁사 실매출/순이익 추정 금지. 공개 리스팅에서 관찰 가능한 사실만 표기.
  const myStore = {
    name: store,
    platform: '배달의민족',
    repPrice: 7500,
    deliveryTip: 2500,
    couponCount: 1,
    couponAmount: 3000,
    setCount: 2,
    photoStyle: '밝은 톤 / 정면샷',
    reviewEvent: '음료 증정',
    isMine: true,
  }

  const localCompetitors = [
    { rank: 1, name: '선릉김밥하우스', platform: '배달의민족', repPrice: 7000, deliveryTip: 2000, couponCount: 2, couponAmount: 2000, setCount: 3, photoStyle: '감성 톤 / 연출샷', reviewEvent: '리뷰시 500원' },
    { rank: 2, name: '바른김밥 선릉점', platform: '배달의민족', repPrice: 6800, deliveryTip: 2000, couponCount: 1, couponAmount: 2000, setCount: 2, photoStyle: '밝은 톤 / 근접샷', reviewEvent: '사이드 증정' },
    { rank: 3, name: '역삼김밥연구소', platform: '쿠팡이츠', repPrice: 6900, deliveryTip: 1800, couponCount: 1, couponAmount: 2500, setCount: 4, photoStyle: '프리미엄 톤', reviewEvent: '음료 증정' },
  ]

  const nationalCompetitors = [
    { name: '우리가게클릭', platform: '배민', repPrice: 7300, deliveryTip: 2000, couponCount: 2, couponAmount: 2000, setCount: 3, photoStyle: '감성 톤', reviewEvent: '리뷰 1,000원' },
    { name: '스마트왕김밥', platform: '쿠팡', repPrice: 6900, deliveryTip: 1500, couponCount: 2, couponAmount: 2000, setCount: 3, photoStyle: '깔끔 연출샷', reviewEvent: '사이드 증정' },
    { name: '김밥천국 프리미엄', platform: '배민', repPrice: 7500, deliveryTip: 2000, couponCount: 3, couponAmount: 3000, setCount: 4, photoStyle: '프리미엄 톤', reviewEvent: '리뷰 1,000원' },
  ]

  // 관찰 가능한 공개 항목만으로 구성한 상대 비교 (점수는 가격·세트·쿠폰 등 공개 정보 기반 상대 위치)
  const radar = {
    labels: ['대표 가격대', '세트 구성', '쿠폰/할인', '리뷰 이벤트', '사진 톤', '메뉴 다양성'],
    ours: [82, 55, 70, 60, 62, 65],
    local: [70, 80, 73, 73, 74, 78],
    national: [66, 88, 80, 78, 82, 85],
  }

  // 관찰 가능한 사실만. 추정·점수형 항목(예상 순이익/광고 노출/사진 퀄리티 점수)은 제외.
  const checklist = [
    { item: '대표 메뉴 가격', ours: '7,500원', local: '6,900원', national: '7,233원', verdict: 'high' },
    { item: '배달팁', ours: '2,500원', local: '1,933원', national: '1,833원', verdict: 'high' },
    { item: '쿠폰 제공(할인액)', ours: '3,000원', local: '2,167원', national: '2,500원', verdict: 'high' },
    { item: '세트 다양성(개수)', ours: '2종', local: '3.0종', national: '3.3종', verdict: 'low' },
    { item: '사진 톤', ours: '밝은 톤', local: '감성 톤 多', national: '프리미엄 톤 多', verdict: 'check' },
    { item: '리뷰 이벤트', ours: '음료 증정', local: '리뷰 할인형 多', national: '리뷰 할인형 多', verdict: 'check' },
  ]

  // 관찰된 차이에 근거한 운영 제안 (금액형 이익 추정은 넣지 않음)
  const todayFixes = [
    { title: '배달팁을 2,000원 이하로 조정', desc: '지역 평균(1,933원)·전국 평균(1,833원) 대비 높은 편입니다.', priority: '상' },
    { title: '세트 구성 추가 검토', desc: '참고가게 대비 세트 수가 적습니다(우리 2종 vs 지역 평균 3종).', priority: '상' },
    { title: '리뷰 이벤트 형태 점검', desc: '참고가게는 리뷰 할인형이 많습니다. 음료 증정과 효과를 비교해 보세요.', priority: '중' },
  ]

  return {
    isMock: true,
    collectedAt: todayStamp(),
    input,
    summary: {
      location: region,
      locationDesc: '주거 밀집 · 오피스 상권',
      localArea: '역삼·선릉 상권',
      localCount: localCompetitors.length,
      nationalCount: nationalCompetitors.length,
      fixCount: todayFixes.length,
    },
    myStore,
    localCompetitors,
    nationalCompetitors,
    radar,
    checklist,
    todayFixes,
    aiComment: {
      text: '공개 리스팅 기준으로 보면, 우리 가게는 대표 가격대는 경쟁력이 있으나 배달팁이 다소 높고 세트 구성·리뷰 이벤트 형태에서 참고가게와 차이가 있습니다. 아래 제안은 관찰된 차이를 바탕으로 한 참고 의견이며, 실제 적용 여부와 효과는 사장님이 직접 판단·확인해 주세요.',
    },
    conclusion: `${store}는 ${compare} 가격 경쟁력은 있으나, 세트 구성·사진 톤·배달팁에서 참고가게와 차이가 관찰됩니다.`,
  }
}
