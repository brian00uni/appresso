import React, { useState, useRef, useMemo } from 'react'
import PublicHeader from '../../partials/PublicHeader'
import VideoHoverCard from '../../components/VideoHoverCard'

const API_URL = 'https://eyes-api.onrender.com/api/youtube/opportunities'

const dayOptions = [
  { v: 1, l: '최근 1일' },
  { v: 3, l: '최근 3일' },
  { v: 7, l: '최근 7일' },
  { v: 14, l: '최근 14일' },
  { v: 30, l: '최근 30일' },
]

const localeOptions = [
  { v: 'KR-ko', l: '한국 (KR-ko)', regionCode: 'KR', relevanceLanguage: 'ko' },
  { v: 'US-en', l: '미국 (US-en)', regionCode: 'US', relevanceLanguage: 'en' },
  { v: 'JP-ja', l: '일본 (JP-ja)', regionCode: 'JP', relevanceLanguage: 'ja' },
]

const durationOptions = [
  { v: 'any', l: '전체' },
  { v: 'short', l: '4분 미만' },
  { v: 'medium', l: '4~20분' },
  { v: 'long', l: '20분 이상' },
]

const subscriberOptions = [
  { v: 1000, l: '1,000명 이하' },
  { v: 5000, l: '5,000명 이하' },
  { v: 10000, l: '1만명 이하' },
  { v: 50000, l: '5만명 이하' },
  { v: 100000, l: '10만명 이하' },
  { v: 500000, l: '50만명 이하' },
  { v: 1000000, l: '100만명 이하' },
  { v: 'all', l: '전체' },
]

const viewOptions = [
  { v: 0, l: '전체' },
  { v: 1000, l: '1,000회 이상' },
  { v: 5000, l: '5,000회 이상' },
  { v: 10000, l: '1만회 이상' },
  { v: 50000, l: '5만회 이상' },
  { v: 100000, l: '10만회 이상' },
  { v: 500000, l: '50만회 이상' },
  { v: 1000000, l: '100만회 이상' },
]

const NO_SUBSCRIBER_LIMIT = 1_000_000_000
const PAGE_SIZE = 30

const COLUMNS = [
  { key: 'title', label: '영상', align: 'left', type: 'string' },
  { key: 'channelTitle', label: '채널', align: 'left', type: 'string' },
  { key: 'matchedKeyword', label: '키워드', align: 'left', type: 'string' },
  { key: 'subscriberCount', label: '구독자', align: 'right', type: 'number' },
  { key: 'viewCount', label: '조회수', align: 'right', type: 'number' },
  { key: 'viewSubscriberRatio', label: '조회/구독', align: 'right', type: 'number' },
  { key: 'viewsPerHour', label: '시간당 조회', align: 'right', type: 'number' },
  { key: 'commentCount', label: '댓글', align: 'right', type: 'number' },
  { key: 'durationSeconds', label: '길이', align: 'right', type: 'number' },
  { key: 'opportunityScore', label: '점수', align: 'right', type: 'number' },
  { key: 'publishedAt', label: '업로드', align: 'center', type: 'date' },
]

function durationToSeconds(iso) {
  const m = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso ?? '')
  if (!m) return 0
  const h = parseInt(m[1] ?? '0')
  const min = parseInt(m[2] ?? '0')
  const sec = parseInt(m[3] ?? '0')
  return h * 3600 + min * 60 + sec
}

function formatLimitCount(n) {
  const num = Number(n)
  if (num >= 10000) {
    const man = num / 10000
    return `${Number.isInteger(man) ? man : man.toFixed(1)}만`
  }
  if (num >= 1000) {
    const k = num / 1000
    return `${Number.isInteger(k) ? k : k.toFixed(1)}천`
  }
  return String(num)
}

function formatCount(n) {
  const num = Number(n)
  if (isNaN(num)) return '-'
  if (num >= 100_000_000) return `${(num / 100_000_000).toFixed(1)}억`
  if (num >= 10_000) return `${(num / 10_000).toFixed(1)}만`
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`
  return String(Math.round(num))
}

function formatScore(n) {
  const num = Number(n)
  if (isNaN(num)) return '-'
  return Math.round(num).toLocaleString()
}

function formatDuration(iso) {
  const m = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso ?? '')
  if (!m) return '-'
  const h = parseInt(m[1] ?? '0')
  const min = parseInt(m[2] ?? '0')
  const sec = parseInt(m[3] ?? '0')
  const totalMin = h * 60 + min
  return `${totalMin}:${String(sec).padStart(2, '0')}`
}

function formatRelativeTime(iso) {
  const date = new Date(iso)
  if (isNaN(date.getTime())) return '-'
  const diffMs = Date.now() - date.getTime()
  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  if (hours < 1) return '1시간 이내'
  if (hours < 24) return `${hours}시간 전`
  return `${Math.floor(hours / 24)}일 전`
}

export default function TrendFinderPage() {
  const [keywords, setKeywords] = useState('주식, 부업, 쇼츠, K뷰티')
  const [days, setDays] = useState(7)
  const [locale, setLocale] = useState('KR-ko')
  const [maxSubscribers, setMaxSubscribers] = useState(50000)
  const [minViews, setMinViews] = useState(10000)
  const [videoDuration, setVideoDuration] = useState('short')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [showScoreInfo, setShowScoreInfo] = useState(false)
  const [hoverCard, setHoverCard] = useState(null)
  const hoverTimer = useRef(null)
  const [sortKey, setSortKey] = useState('opportunityScore')
  const [sortDir, setSortDir] = useState('desc')
  const [page, setPage] = useState(1)

  const sortedItems = useMemo(() => {
    const items = (result?.items ?? []).map((item) => ({ ...item, durationSeconds: durationToSeconds(item.duration) }))
    const col = COLUMNS.find((c) => c.key === sortKey)
    const dir = sortDir === 'asc' ? 1 : -1
    return [...items].sort((a, b) => {
      let av = a[sortKey]
      let bv = b[sortKey]
      if (col?.type === 'date') {
        av = new Date(av).getTime()
        bv = new Date(bv).getTime()
      } else if (col?.type === 'string') {
        return dir * String(av ?? '').localeCompare(String(bv ?? ''), 'ko')
      }
      av = Number(av) || 0
      bv = Number(bv) || 0
      return dir * (av - bv)
    })
  }, [result, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(sortedItems.length / PAGE_SIZE))
  const pagedItems = sortedItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
    setPage(1)
  }

  function showHoverCard(item, rect) {
    clearTimeout(hoverTimer.current)
    const cardWidth = 320
    const cardHeight = 480
    const margin = 8
    let left = rect.right + margin
    left = Math.min(left, window.innerWidth - cardWidth - margin)
    left = Math.max(margin, left)
    let top = rect.top
    if (top + cardHeight + margin > window.innerHeight) {
      top = rect.bottom - cardHeight
    }
    top = Math.min(top, window.innerHeight - cardHeight - margin)
    top = Math.max(margin, top)
    setHoverCard({ item, style: { left, top } })
  }

  function scheduleHideCard() {
    hoverTimer.current = setTimeout(() => setHoverCard(null), 150)
  }

  async function handleSearch(e) {
    e.preventDefault()
    const keywordList = keywords.split(',').map((k) => k.trim()).filter(Boolean)
    if (keywordList.length === 0) return

    const localeOpt = localeOptions.find((l) => l.v === locale)
    setLoading(true)
    setError('')
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keywords: keywordList,
          days,
          maxSubscribers: maxSubscribers === 'all' ? NO_SUBSCRIBER_LIMIT : Number(maxSubscribers),
          minViews: Number(minViews),
          locale,
          videoDuration,
          regionCode: localeOpt.regionCode,
          relevanceLanguage: localeOpt.relevanceLanguage,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || '요청에 실패했습니다.')
      setResult(data)
      setPage(1)
    } catch (e) {
      setError(e.message)
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <PublicHeader />

      <main className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">

        {/* 페이지 타이틀 */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-100">조회수가 터진 영상</h1>
          <p className="text-gray-400 mt-1 text-sm">
            최근 N일 안에 올라온 영상 중 조회수, 구독자 수, 댓글 수, 좋아요 수를 기반으로 기회점수를 계산합니다.{' '}
            <button
              type="button"
              onClick={() => setShowScoreInfo((v) => !v)}
              className="text-violet-400 hover:text-violet-300 underline underline-offset-2"
            >
              기회점수 계산법 {showScoreInfo ? '접기' : '보기'}
            </button>
          </p>

          {showScoreInfo && (
            <div className="mt-3 bg-gray-800 border border-gray-700/60 rounded-xl p-4 text-xs text-gray-400 max-w-2xl">
              <p className="font-semibold text-gray-200 mb-2">기회점수(Opportunity Score)란?</p>
              <p className="mb-2">
                구독자 수 대비 조회수가 비정상적으로 높은, 즉 "터진" 영상을 찾기 위한 추정 점수입니다. 아래 지표들을 종합해 점수가 높을수록 알고리즘/노출의 도움을 크게 받은 영상으로 추정합니다.
              </p>
              <ul className="space-y-1 list-disc list-inside">
                <li><span className="text-gray-300 font-medium">조회수 / 구독자 비율</span> — 구독자 수에 비해 조회수가 많을수록 가산</li>
                <li><span className="text-gray-300 font-medium">시간당 조회수</span> — 업로드 후 짧은 시간에 조회수가 빠르게 오를수록 가산</li>
                <li><span className="text-gray-300 font-medium">댓글 수 · 좋아요 수</span> — 시청자 참여도가 높을수록 가산</li>
                <li><span className="text-gray-300 font-medium">업로드 경과 시간</span> — 최근에 올라온 영상일수록 가산</li>
              </ul>
              <p className="mt-2 text-gray-500">
                ※ 검색 유입 경로나 클릭률(CTR)은 채널 소유자만 확인할 수 있어, 위 지표들을 토대로 추정한 참고용 점수입니다.
              </p>
            </div>
          )}
        </div>

        {/* 검색 폼 */}
        <form onSubmit={handleSearch} className="bg-gray-800 rounded-xl border border-gray-700/60 p-5 mb-6">
          <label className="block text-sm text-gray-500 mb-2">키워드, 쉼표로 구분</label>
          <textarea
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSearch(e)
              }
            }}
            rows={2}
            placeholder="주식, 부업, 쇼츠, 목포 맛집, K뷰티"
            className="w-full px-4 py-2 text-sm bg-gray-700/50 border border-gray-700 text-gray-100 placeholder-gray-500 rounded-lg outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none mb-4"
          />

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">기간 / 최근 N일</label>
              <select value={days} onChange={(e) => setDays(Number(e.target.value))}
                className="w-full text-sm bg-gray-700/50 border border-gray-700 text-gray-300 rounded-lg px-2 py-2 outline-none focus:ring-2 focus:ring-violet-500">
                {dayOptions.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">국가-언어</label>
              <select value={locale} onChange={(e) => setLocale(e.target.value)}
                className="w-full text-sm bg-gray-700/50 border border-gray-700 text-gray-300 rounded-lg px-2 py-2 outline-none focus:ring-2 focus:ring-violet-500">
                {localeOptions.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">최대 구독자 수</label>
              <select value={maxSubscribers} onChange={(e) => setMaxSubscribers(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="w-full text-sm bg-gray-700/50 border border-gray-700 text-gray-300 rounded-lg px-2 py-2 outline-none focus:ring-2 focus:ring-violet-500">
                {subscriberOptions.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">최소 조회수</label>
              <select value={minViews} onChange={(e) => setMinViews(Number(e.target.value))}
                className="w-full text-sm bg-gray-700/50 border border-gray-700 text-gray-300 rounded-lg px-2 py-2 outline-none focus:ring-2 focus:ring-violet-500">
                {viewOptions.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">영상 길이</label>
              <select value={videoDuration} onChange={(e) => setVideoDuration(e.target.value)}
                className="w-full text-sm bg-gray-700/50 border border-gray-700 text-gray-300 rounded-lg px-2 py-2 outline-none focus:ring-2 focus:ring-violet-500">
                {durationOptions.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="btn bg-violet-500 hover:bg-violet-600 text-white text-sm px-5 py-2 rounded-lg font-medium transition-colors disabled:opacity-50">
            {loading ? '검색 중...' : '조회수가 터진 영상 찾기'}
          </button>
        </form>

        {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-lg mb-4">{error}</p>}

        {loading && (
          <div className="flex justify-center py-24">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && result && (
          <>
            {/* AI 요약 */}
            {result.summary && (
              <div className="bg-gray-800 rounded-xl border border-gray-700/60 p-5 mb-4">
                <h2 className="text-sm font-bold text-gray-100 mb-2">AI식 요약</h2>
                <p className="text-sm text-gray-300 mb-3">{result.summary.headline}</p>
                <ul className="space-y-1 mb-3">
                  {(result.summary.bullets ?? []).map((b, i) => {
                    let text = b
                    if (/구독자 .+이하이면서 조회수 .+이상 후보/.test(b)) {
                      const subLabel = maxSubscribers === 'all' ? '전체' : `${formatLimitCount(maxSubscribers)} 이하`
                      const viewLabel = Number(minViews) === 0 ? '전체' : `${formatLimitCount(minViews)} 이상`
                      text = `구독자 ${subLabel}이면서 조회수 ${viewLabel} 후보: ${(result.items ?? []).length}개`
                    }
                    return (
                      <li key={i} className="text-xs text-gray-400 flex gap-2">
                        <span className="text-violet-400">•</span>
                        <span>{text}</span>
                      </li>
                    )
                  })}
                </ul>
                {(result.summary.hotKeywords ?? []).length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {result.summary.hotKeywords.map((k, i) => (
                      <span key={i} className="px-2 py-0.5 text-xs rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">{k}</span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 결과 테이블 */}
            <p className="text-xs text-gray-500 px-1 mb-3">유튜브 검색 결과 {result.count ?? (result.items ?? []).length}개 — 기회점수 높은 순</p>

            {(result.items ?? []).length > 0 && (
              <div className="bg-gray-800 rounded-xl border border-gray-700/60 overflow-x-auto">
                <table className="w-full text-sm whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-gray-700/60 text-xs text-gray-500 uppercase">
                      {COLUMNS.map((col) => (
                        <th
                          key={col.key}
                          onClick={() => handleSort(col.key)}
                          className={`px-3 py-3 font-medium cursor-pointer select-none hover:text-gray-300 transition-colors ${
                            col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                          }`}
                        >
                          {col.label}
                          {sortKey === col.key && <span className="ml-1 text-violet-400">{sortDir === 'asc' ? '▲' : '▼'}</span>}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pagedItems.map((item) => (
                      <tr key={item.videoId} className="border-b border-gray-700/40 last:border-0 hover:bg-gray-700/30 transition-colors">
                        <td
                          className="px-3 py-3"
                          onMouseEnter={(e) => showHoverCard(item, e.currentTarget.getBoundingClientRect())}
                          onMouseLeave={scheduleHideCard}
                        >
                          <div className="flex items-center gap-3 min-w-[220px] max-w-[320px]">
                            <img src={item.thumbnail} alt={item.title} className="w-16 h-10 rounded object-cover flex-shrink-0 bg-gray-700" />
                            <p className="font-semibold text-gray-100 truncate text-sm">{item.title}</p>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-gray-400 max-w-[160px] truncate">{item.channelTitle}</td>
                        <td className="px-3 py-3 text-gray-400">{item.matchedKeyword}</td>
                        <td className="px-3 py-3 text-right text-gray-300">{formatCount(item.subscriberCount)}</td>
                        <td className="px-3 py-3 text-right font-semibold text-gray-200">{formatCount(item.viewCount)}</td>
                        <td className="px-3 py-3 text-right text-gray-300">{formatCount(item.viewSubscriberRatio)}</td>
                        <td className="px-3 py-3 text-right text-gray-300">{formatCount(item.viewsPerHour)}</td>
                        <td className="px-3 py-3 text-right text-gray-300">{formatCount(item.commentCount)}</td>
                        <td className="px-3 py-3 text-right text-gray-400">{formatDuration(item.duration)}</td>
                        <td className="px-3 py-3 text-right font-bold text-violet-400">{formatScore(item.opportunityScore)}</td>
                        <td className="px-3 py-3 text-center text-gray-400">{formatRelativeTime(item.publishedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1 mt-4">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-xs rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  이전
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                      p === page
                        ? 'bg-violet-500 border-violet-500 text-white'
                        : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 text-xs rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  다음
                </button>
              </div>
            )}
          </>
        )}

        {!loading && !result && !error && (
          <p className="text-xs text-gray-500 px-1">키워드를 입력하고 "조회수가 터진 영상 찾기" 버튼을 눌러주세요</p>
        )}
      </main>

      {hoverCard && (
        <VideoHoverCard
          item={hoverCard.item}
          style={hoverCard.style}
          onClose={() => setHoverCard(null)}
          onMouseEnter={() => clearTimeout(hoverTimer.current)}
          onMouseLeave={scheduleHideCard}
        />
      )}
    </div>
  )
}
