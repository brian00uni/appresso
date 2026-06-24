import React, { useMemo, useState } from 'react'
import { getStoreInfo } from '../../../lib/gaseongbi/storage'
import { formatWon } from '../../../lib/gaseongbi/calc'
import {
  EMPTY_BENCHMARK_INPUT,
  SAMPLE_BENCHMARK_INPUT,
  buildBenchmarkPrompt,
  fetchBenchmarkResearch,
  parseBenchmarkResult,
  getBenchmarkDemoReport,
} from '../../../lib/gaseongbi/benchmark'
import SummaryCard from '../../../components/gaseongbi/SummaryCard'
import BenchmarkRadarChart from '../../../components/gaseongbi/BenchmarkRadarChart'

const CARD_CLASS = 'bg-white dark:bg-gray-800 shadow-xs rounded-xl border border-gray-100 dark:border-gray-700/60 p-5'
const inputClass =
  'w-full px-3 py-2 text-sm bg-white dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700/60 text-gray-800 dark:text-gray-100 rounded-lg outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all'

const VERDICT = {
  high: { label: '높음', cls: 'text-red-600 dark:text-red-400' },
  low: { label: '낮음', cls: 'text-red-600 dark:text-red-400' },
  mid: { label: '보통', cls: 'text-yellow-600 dark:text-yellow-400' },
  good: { label: '우수', cls: 'text-green-600 dark:text-green-400' },
  check: { label: '확인 필요', cls: 'text-gray-500 dark:text-gray-400' },
}

export default function BenchmarkingPage() {
  const storeInfo = getStoreInfo()
  const [input, setInput] = useState(() => ({
    ...SAMPLE_BENCHMARK_INPUT,
    storeName: storeInfo.storeName && storeInfo.storeName !== '내 가게' ? storeInfo.storeName : SAMPLE_BENCHMARK_INPUT.storeName,
    region: storeInfo.location || SAMPLE_BENCHMARK_INPUT.region,
  }))
  const [loading, setLoading] = useState(false)
  // 초기에는 예시 리포트를 바로 표시 (샘플 디자인과 동일)
  const [report, setReport] = useState(() => getBenchmarkDemoReport())

  const handleChange = (key) => (e) => setInput((prev) => ({ ...prev, [key]: e.target.value }))

  const handleGenerate = async () => {
    setLoading(true)
    const prompt = buildBenchmarkPrompt(input)
    const response = await fetchBenchmarkResearch(prompt)
    setReport(parseBenchmarkResult(response))
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">
          벤치마킹 <span className="align-middle text-xs font-semibold px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-500">AI 리포트</span>
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">우리 가게를 잘하는 가게들과 비교하고, 개선 포인트를 찾아보세요.</p>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard icon="location" label="우리 가게 위치" value={report.summary.location} sub={report.summary.locationDesc} tone="violet" />
        <SummaryCard icon="group" label={`지역 비교 ${report.summary.localCount}곳`} value={report.summary.localArea} sub="반경 1.5km 기준" tone="blue" />
        <SummaryCard icon="map" label={`전국 참고 ${report.summary.nationalCount}곳`} value="인기 상위 매장" sub="유사 업종 기준" tone="green" />
        <SummaryCard icon="target" label={`오늘 고칠 포인트 ${report.summary.fixCount}개`} value="우선순위 개선 항목" sub="아래 상세 제안 확인" tone="yellow" />
      </div>

      {/* 입력 + 생성 */}
      <div className={CARD_CLASS}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          <Field label="우리 가게" value={input.storeName} onChange={handleChange('storeName')} placeholder={SAMPLE_BENCHMARK_INPUT.storeName} />
          <Field label="지역" value={input.region} onChange={handleChange('region')} placeholder={SAMPLE_BENCHMARK_INPUT.region} />
          <Field label="카테고리" value={input.category} onChange={handleChange('category')} placeholder={SAMPLE_BENCHMARK_INPUT.category} />
          <Field label="비교 키워드" value={input.keyword} onChange={handleChange('keyword')} placeholder={SAMPLE_BENCHMARK_INPUT.keyword} />
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="h-[38px] inline-flex items-center justify-center px-4 text-sm font-semibold rounded-lg bg-violet-500 hover:bg-violet-600 disabled:opacity-60 text-white transition-colors whitespace-nowrap"
          >
            {loading ? '생성 중…' : '✦ AI 비교 리포트 생성'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className={`${CARD_CLASS} text-center py-12`}>
          <div className="inline-block w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm text-gray-700 dark:text-gray-200 font-medium">AI 벤치마킹 리포트 예시를 생성하고 있습니다.</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">실제 공개 웹 검색 분석은 고도화 버전에서 제공됩니다.</p>
        </div>
      ) : (
        <BenchmarkReport report={report} />
      )}
    </div>
  )
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</label>
      <input type="text" value={value} onChange={onChange} placeholder={placeholder} className={inputClass} />
    </div>
  )
}

function BenchmarkReport({ report }) {
  const { myStore, localCompetitors, nationalCompetitors, radar, checklist, todayFixes, aiComment, collectedAt } = report

  const radarSeries = useMemo(
    () => [
      { label: '우리 가게', data: radar.ours },
      { label: '지역 평균', data: radar.local },
      { label: '전국 평균', data: radar.national },
    ],
    [radar]
  )

  return (
    <div className="space-y-6">
      {/* 가게 비교 컬럼 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className={CARD_CLASS}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">우리 가게</h2>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-500">내 가게</span>
          </div>
          <StoreCard store={myStore} highlight />
        </div>

        <div className={CARD_CLASS}>
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-3">
            지역 경쟁가게 <span className="text-xs font-normal text-gray-400">({report.summary.localArea})</span>
          </h2>
          <div className="space-y-2">
            {localCompetitors.map((c) => (
              <StoreCard key={c.name} store={c} compact />
            ))}
          </div>
        </div>

        <div className={CARD_CLASS}>
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-3">
            전국 참고가게 <span className="text-xs font-normal text-gray-400">(인기 상위)</span>
          </h2>
          <div className="space-y-2">
            {nationalCompetitors.map((c) => (
              <StoreCard key={c.name} store={c} compact />
            ))}
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-500">
        ※ 가격·배달팁·쿠폰·세트 정보는 {collectedAt} 기준 예시 데이터입니다. (실제 공개 정보는 확인 시점에 따라 달라질 수 있습니다)
      </p>

      {/* 지표/체크리스트/고칠것/AI */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className={CARD_CLASS}>
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-2">주요 지표 비교</h2>
          <BenchmarkRadarChart labels={radar.labels} series={radarSeries} />
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">※ 점수는 100점 만점 기준 상대 비교입니다.</p>
        </div>

        <div className={CARD_CLASS}>
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-3">비교 체크리스트</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-700/60">
                  <th className="py-2 pr-2 font-medium">항목</th>
                  <th className="py-2 pr-2 font-medium text-right">우리</th>
                  <th className="py-2 pr-2 font-medium text-right">지역</th>
                  <th className="py-2 pr-2 font-medium text-right">전국</th>
                  <th className="py-2 font-medium text-right">평가</th>
                </tr>
              </thead>
              <tbody className="text-gray-700 dark:text-gray-300">
                {checklist.map((row) => {
                  const v = VERDICT[row.verdict] || VERDICT.mid
                  return (
                    <tr key={row.item} className="border-b border-gray-50 dark:border-gray-700/40 last:border-0">
                      <td className="py-1.5 pr-2 text-gray-800 dark:text-gray-100">{row.item}</td>
                      <td className="py-1.5 pr-2 text-right">{row.ours}</td>
                      <td className="py-1.5 pr-2 text-right text-gray-500 dark:text-gray-400">{row.local}</td>
                      <td className="py-1.5 pr-2 text-right text-gray-500 dark:text-gray-400">{row.national}</td>
                      <td className={`py-1.5 text-right font-semibold ${v.cls}`}>{v.label}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">※ 상대 비교 기준입니다.</p>
        </div>

        <div className={CARD_CLASS}>
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-3">오늘 고칠 것 3개</h2>
          <div className="space-y-3">
            {todayFixes.map((fix, idx) => (
              <div key={idx} className="rounded-lg bg-gray-50 dark:bg-gray-900/40 p-3">
                <div className="flex items-start gap-2">
                  <span className="flex-none w-5 h-5 rounded-full bg-violet-500 text-white text-xs font-bold flex items-center justify-center">{idx + 1}</span>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">{fix.title}</div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{fix.desc}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-full bg-violet-500/10 text-violet-500">우선순위 {fix.priority}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={CARD_CLASS}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-violet-500 text-white">AI</span>
            <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">AI 사장님 코멘트</h2>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{aiComment.text}</p>
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-3 space-y-1">
            <p>◎ 데이터 수집일: {collectedAt}</p>
            <p>◎ 이 리포트는 공개 정보와 사용자 입력을 기반으로 AI가 분석한 참고 자료입니다. 실제 성과는 상권/운영상황에 따라 달라질 수 있습니다.</p>
          </div>
        </div>
      </div>

      {/* 주의사항 */}
      <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl p-4 text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
        본 분석은 <span className="font-semibold">공개 정보 기반 참고 리포트</span>이며, 자동 수집·실매출 분석이 아닙니다.
        공개 리스팅에서 관찰 가능한 항목(가격대·세트 구성·사진 톤·리뷰 이벤트 등)만 비교하며, 확인 불가한 항목(경쟁사 실매출·순이익 등)은 표시하지 않습니다.
        현재는 예시 데이터로 표시되며 실제 가격·쿠폰·리뷰 정보는 확인 시점에 따라 달라질 수 있고, 실제 공개 웹 검색 분석과 출처 링크는 고도화 버전에서 제공됩니다.
        최종 의사결정은 사업자가 직접 판단해야 합니다.
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-gray-700 dark:text-gray-200 font-medium">{value}</span>
    </div>
  )
}

function StoreCard({ store, highlight, compact }) {
  return (
    <div className={`rounded-lg p-3 ${highlight ? 'bg-violet-500/5 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/30' : 'bg-gray-50 dark:bg-gray-900/40'}`}>
      <div className="flex items-center gap-2 mb-2">
        {store.rank && (
          <span className="flex-none text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-800 dark:bg-gray-700 text-white">{store.rank}위</span>
        )}
        <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm truncate">{store.name}</span>
        <span className="ml-auto flex-none text-[10px] text-gray-400 dark:text-gray-500">{store.platform}</span>
      </div>
      <div className={`grid ${compact ? 'grid-cols-2' : 'grid-cols-1'} gap-x-3 gap-y-1`}>
        <Row label="대표 메뉴 가격" value={formatWon(store.repPrice)} />
        <Row label="배달팁" value={formatWon(store.deliveryTip)} />
        <Row label="쿠폰" value={`${store.couponCount}개 (${store.couponAmount.toLocaleString('ko-KR')}원)`} />
        <Row label="세트 구성" value={`${store.setCount}종`} />
        <Row label="사진 톤" value={store.photoStyle} />
        <Row label="리뷰 이벤트" value={store.reviewEvent} />
      </div>
    </div>
  )
}
