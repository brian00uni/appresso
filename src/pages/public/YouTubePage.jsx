import React, { useState, useEffect, useMemo, useRef } from 'react'
import PublicHeader from '../../partials/PublicHeader'
import ChannelHoverCard from '../../components/ChannelHoverCard'

const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY
const BASE_URL = 'https://www.googleapis.com/youtube/v3'
const PAGE_SIZE = 30

const TIERS = [
  { key: 'A1', label: 'A1 1000만 이상', min: 10000000, max: Infinity, color: 'red' },
  { key: 'A2', label: 'A2 500만 이상', min: 5000000, max: 10000000, color: 'orange' },
  { key: 'B1', label: 'B1 100만 이상', min: 1000000, max: 5000000, color: 'amber' },
  { key: 'B2', label: 'B2 50만 이상', min: 500000, max: 1000000, color: 'lime' },
  { key: 'B3', label: 'B3 10만 이상', min: 100000, max: 500000, color: 'green' },
  { key: 'B4', label: 'B4 5만 이상', min: 50000, max: 100000, color: 'teal' },
  { key: 'B5', label: 'B5 1만 이상', min: 10000, max: 50000, color: 'cyan' },
  { key: 'C1', label: 'C1 5천 이상', min: 5000, max: 10000, color: 'blue' },
  { key: 'C2', label: 'C2 1천 이상', min: 1000, max: 5000, color: 'indigo' },
  { key: 'C3', label: 'C3 1천 미만', min: 0, max: 1000, color: 'gray' },
]

const TIER_CLASSES = {
  red: { active: 'bg-red-500 text-white border-red-500', inactive: 'text-red-400 border-red-500/30 hover:border-red-500' },
  orange: { active: 'bg-orange-500 text-white border-orange-500', inactive: 'text-orange-400 border-orange-500/30 hover:border-orange-500' },
  amber: { active: 'bg-amber-500 text-white border-amber-500', inactive: 'text-amber-400 border-amber-500/30 hover:border-amber-500' },
  lime: { active: 'bg-lime-500 text-white border-lime-500', inactive: 'text-lime-400 border-lime-500/30 hover:border-lime-500' },
  green: { active: 'bg-green-500 text-white border-green-500', inactive: 'text-green-400 border-green-500/30 hover:border-green-500' },
  teal: { active: 'bg-teal-500 text-white border-teal-500', inactive: 'text-teal-400 border-teal-500/30 hover:border-teal-500' },
  cyan: { active: 'bg-cyan-500 text-white border-cyan-500', inactive: 'text-cyan-400 border-cyan-500/30 hover:border-cyan-500' },
  blue: { active: 'bg-blue-500 text-white border-blue-500', inactive: 'text-blue-400 border-blue-500/30 hover:border-blue-500' },
  indigo: { active: 'bg-indigo-500 text-white border-indigo-500', inactive: 'text-indigo-400 border-indigo-500/30 hover:border-indigo-500' },
  gray: { active: 'bg-gray-500 text-white border-gray-500', inactive: 'text-gray-400 border-gray-500/30 hover:border-gray-400' },
}

// 정렬 가능한 컬럼 정의. growth/uploadFreq 계열은 개설일 기준 평균 추정치입니다.
const COLUMNS = [
  { key: 'channel', label: '채널명', align: 'left', type: 'string' },
  { key: 'topic', label: '주제(분야)', align: 'left', type: 'string' },
  { key: 'subscriberCount', label: '구독자수', align: 'right', type: 'number' },
  { key: 'videoCount', label: '총영상수', align: 'right', type: 'number' },
  { key: 'yearlyGrowth', label: '연간증가', align: 'right', type: 'number', title: '개설일 기준 평균 추정치' },
  { key: 'monthlyGrowth', label: '월간증가', align: 'right', type: 'number', title: '개설일 기준 평균 추정치' },
  { key: 'publishedAt', label: '개설일', align: 'center', type: 'date' },
  { key: 'dailyGrowth', label: '일일증가', align: 'right', type: 'number', title: '개설일 기준 평균 추정치' },
  { key: 'uploadFreq', label: '업로드빈도', align: 'right', type: 'number', title: '개설일 기준 평균 추정치 (주당)' },
  { key: 'viewCount', label: '총조회수', align: 'right', type: 'number' },
  { key: 'avgViews', label: '평균조회수', align: 'right', type: 'number' },
  { key: 'country', label: '위치(국가)', align: 'center', type: 'string' },
]

function formatCount(n) {
  const num = Number(n)
  if (isNaN(num)) return '-'
  const sign = num < 0 ? '-' : ''
  const abs = Math.abs(num)
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)}M`
  if (abs >= 10_000) return `${sign}${(abs / 10_000).toFixed(1)}만`
  if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(1)}K`
  return `${sign}${Math.round(abs)}`
}

function formatBig(n) {
  const num = parseInt(n)
  if (isNaN(num)) return '-'
  if (num >= 100_000_000) return `${(num / 100_000_000).toFixed(1)}억`
  if (num >= 10_000) return `${(num / 10_000).toFixed(1)}만`
  return String(num)
}

function formatDate(iso) {
  if (!iso) return '-'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '-'
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`
}

function topicFromUrl(url) {
  if (!url) return ''
  const seg = url.split('/').pop()
  return decodeURIComponent(seg).replace(/_/g, ' ')
}

function tierOf(subscriberCount) {
  const n = parseInt(subscriberCount) || 0
  return TIERS.find((t) => n >= t.min && n < t.max) ?? TIERS[TIERS.length - 1]
}

async function fetchAllResults(url, maxResults) {
  let results = []
  let pageToken = ''
  while (results.length < maxResults) {
    const pageUrl = pageToken ? `${url}&pageToken=${pageToken}` : url
    const res = await fetch(pageUrl)
    const data = await res.json()
    if (data.error) throw new Error(data.error.message)
    results = results.concat(data.items ?? [])
    if (!data.nextPageToken || (data.items ?? []).length === 0) break
    pageToken = data.nextPageToken
  }
  return results.slice(0, maxResults)
}

async function fetchChannelStats(ids) {
  const chunks = []
  for (let i = 0; i < ids.length; i += 50) chunks.push(ids.slice(i, i + 50))

  const lists = await Promise.all(
    chunks.map(async (chunk) => {
      const res = await fetch(`${BASE_URL}/channels?part=statistics,snippet,topicDetails&id=${chunk.join(',')}&key=${API_KEY}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error.message)
      return data.items ?? []
    })
  )

  return lists.flat().map((item) => ({
    id: item.id,
    title: item.snippet.title,
    description: item.snippet.description,
    thumbnail: item.snippet.thumbnails?.medium?.url ?? '',
    subscriberCount: item.statistics.subscriberCount ?? '0',
    videoCount: item.statistics.videoCount ?? '0',
    viewCount: item.statistics.viewCount ?? '0',
    country: item.snippet.country ?? '',
    publishedAt: item.snippet.publishedAt ?? '',
    topic: topicFromUrl(item.topicDetails?.topicCategories?.[0]),
  }))
}

export default function YouTubePage() {
  const [searchMode, setSearchMode] = useState('channel')
  const [query, setQuery] = useState('')
  const [region, setRegion] = useState('KR')
  const [pageSize, setPageSize] = useState(50)
  const [channels, setChannels] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState('top')
  const [tierFilter, setTierFilter] = useState('all')
  const [sortKey, setSortKey] = useState('subscriberCount')
  const [sortDir, setSortDir] = useState('desc')
  const [page, setPage] = useState(1)
  const [hoverCard, setHoverCard] = useState(null)
  const hoverTimer = useRef(null)

  function showHoverCard(ch, rect) {
    clearTimeout(hoverTimer.current)
    const cardWidth = 320
    const cardHeight = 520
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
    setHoverCard({ ch, style: { left, top } })
  }

  function scheduleHideCard() {
    hoverTimer.current = setTimeout(() => setHoverCard(null), 150)
  }

  useEffect(() => {
    if (API_KEY) loadTop()
  }, [region])

  useEffect(() => {
    setPage(1)
  }, [tierFilter, channels])

  async function loadTop() {
    setMode('top')
    setLoading(true)
    setError('')
    setTierFilter('all')
    try {
      const rc = region === 'WR' ? 'US' : 'KR'
      const items = await fetchAllResults(`${BASE_URL}/videos?part=snippet&chart=mostPopular&regionCode=${rc}&maxResults=50&key=${API_KEY}`, pageSize)
      const ids = [...new Set(items.map((v) => v.snippet.channelId))]
      const list = await fetchChannelStats(ids)
      setChannels(list)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSearch(e) {
    e.preventDefault()
    if (!query.trim()) return
    setMode('search')
    setLoading(true)
    setError('')
    setTierFilter('all')
    try {
      let ids
      if (searchMode === 'keyword') {
        const params = new URLSearchParams({ part: 'snippet', type: 'video', q: query.trim(), order: 'viewCount', maxResults: 50, key: API_KEY })
        if (region !== 'ALL') params.set('regionCode', region === 'WR' ? 'US' : 'KR')
        const items = await fetchAllResults(`${BASE_URL}/search?${params}`, pageSize)
        ids = [...new Set(items.map((i) => i.snippet.channelId))]
      } else {
        const params = new URLSearchParams({ part: 'snippet', type: 'channel', q: query.trim(), maxResults: 50, key: API_KEY })
        if (region !== 'ALL') params.set('regionCode', region === 'WR' ? 'US' : 'KR')
        const items = await fetchAllResults(`${BASE_URL}/search?${params}`, pageSize)
        ids = items.map((i) => i.id.channelId)
      }
      const list = await fetchChannelStats(ids)
      setChannels(list)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const tierCounts = useMemo(() => {
    const counts = Object.fromEntries(TIERS.map((t) => [t.key, 0]))
    channels.forEach((ch) => {
      counts[tierOf(ch.subscriberCount).key]++
    })
    return counts
  }, [channels])

  const filteredChannels = useMemo(() => {
    if (tierFilter === 'all') return channels
    return channels.filter((ch) => tierOf(ch.subscriberCount).key === tierFilter)
  }, [channels, tierFilter])

  const enrichedChannels = useMemo(() => {
    return filteredChannels.map((ch) => {
      const subscriberCount = parseInt(ch.subscriberCount) || 0
      const videoCount = parseInt(ch.videoCount) || 0
      const viewCount = parseInt(ch.viewCount) || 0
      const publishedAtTime = new Date(ch.publishedAt).getTime() || 0
      const days = publishedAtTime ? Math.max(1, (Date.now() - publishedAtTime) / 86400000) : 1
      const avgViews = videoCount > 0 ? viewCount / videoCount : 0
      return {
        ...ch,
        subscriberCount,
        videoCount,
        viewCount,
        publishedAtTime,
        avgViews,
        dailyGrowth: subscriberCount / days,
        monthlyGrowth: (subscriberCount / days) * 30,
        yearlyGrowth: (subscriberCount / days) * 365,
        uploadFreq: (videoCount / days) * 7,
        days,
        years: days / 365.25,
        months: (days / 365.25) * 12,
        perVideoSubs: videoCount > 0 ? subscriberCount / videoCount : 0,
        subRatio: viewCount > 0 ? (subscriberCount / viewCount) * 100 : 0,
        uploadIntervalDays: videoCount > 0 ? days / videoCount : 0,
        tier: tierOf(subscriberCount),
      }
    })
  }, [filteredChannels])

  const sortedChannels = useMemo(() => {
    const list = [...enrichedChannels]
    list.sort((a, b) => {
      let av, bv
      if (sortKey === 'channel') { av = a.title?.toLowerCase() ?? ''; bv = b.title?.toLowerCase() ?? '' }
      else if (sortKey === 'topic') { av = a.topic?.toLowerCase() ?? ''; bv = b.topic?.toLowerCase() ?? '' }
      else if (sortKey === 'country') { av = a.country ?? ''; bv = b.country ?? '' }
      else if (sortKey === 'publishedAt') { av = a.publishedAtTime; bv = b.publishedAtTime }
      else { av = a[sortKey] ?? 0; bv = b[sortKey] ?? 0 }

      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [enrichedChannels, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(sortedChannels.length / PAGE_SIZE))
  const pagedChannels = sortedChannels.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const summary = useMemo(() => {
    return filteredChannels.reduce(
      (acc, ch) => ({
        videos: acc.videos + (parseInt(ch.videoCount) || 0),
        views: acc.views + (parseInt(ch.viewCount) || 0),
      }),
      { videos: 0, views: 0 }
    )
  }, [filteredChannels])

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir(key === 'channel' || key === 'topic' || key === 'country' ? 'asc' : 'desc')
    }
  }

  function formatCell(ch, col) {
    switch (col.key) {
      case 'topic': return ch.topic || '-'
      case 'subscriberCount': return formatCount(ch.subscriberCount)
      case 'videoCount': return formatCount(ch.videoCount)
      case 'yearlyGrowth': return `+${formatCount(Math.round(ch.yearlyGrowth))}`
      case 'monthlyGrowth': return `+${formatCount(Math.round(ch.monthlyGrowth))}`
      case 'publishedAt': return formatDate(ch.publishedAt)
      case 'dailyGrowth': return `+${formatCount(Math.round(ch.dailyGrowth))}`
      case 'uploadFreq': return `주 ${ch.uploadFreq.toFixed(1)}개`
      case 'viewCount': return formatCount(ch.viewCount)
      case 'avgViews': return formatCount(Math.round(ch.avgViews))
      case 'country': return ch.country || '-'
      default: return ''
    }
  }

  const regionOptions = [{ v: 'KR', l: '한국' }, { v: 'WR', l: '해외' }, { v: 'ALL', l: '전체' }]
  const searchModeOptions = [{ v: 'channel', l: '채널명 검색' }, { v: 'keyword', l: '키워드 검색' }]

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <PublicHeader />

      <main className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">

        {/* 페이지 타이틀 */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-100">유튜브 채널 분석</h1>
          <p className="text-gray-400 mt-1 text-sm">인기 유튜브 채널을 검색하고 순위를 확인하세요</p>
        </div>

        {/* 상단 요약 통계바 */}
        {channels.length > 0 && (
          <div className="bg-gray-800 rounded-xl border border-gray-700/60 px-5 py-4 mb-4 flex flex-wrap items-center gap-x-6 gap-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-violet-400">{filteredChannels.length}</span>
              <span className="text-sm text-gray-400">개 채널</span>
            </div>
            <div className="text-sm text-gray-400">
              총 영상 <span className="font-semibold text-gray-200">{formatBig(summary.videos)}개</span>
            </div>
            <div className="text-sm text-gray-400">
              총 조회수 <span className="font-semibold text-gray-200">{formatBig(summary.views)}</span>
            </div>
          </div>
        )}

        {/* 구독자 등급 필터 */}
        {channels.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setTierFilter('all')}
              className={`px-3 py-1 text-xs rounded-full border transition-colors ${tierFilter === 'all' ? 'bg-violet-500 text-white border-violet-500' : 'text-gray-400 border-gray-700 hover:border-violet-500'}`}
            >
              전체 {channels.length}
            </button>
            {TIERS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTierFilter(t.key)}
                disabled={tierCounts[t.key] === 0}
                className={`px-3 py-1 text-xs rounded-full border transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${tierFilter === t.key ? TIER_CLASSES[t.color].active : TIER_CLASSES[t.color].inactive}`}
              >
                {t.label} {tierCounts[t.key]}
              </button>
            ))}
          </div>
        )}

        {/* 검색 + 필터 */}
        <div className="bg-gray-800 rounded-xl border border-gray-700/60 p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            {searchModeOptions.map(({ v, l }) => (
              <button key={v} type="button" onClick={() => setSearchMode(v)}
                className={`px-3 py-1 text-xs rounded-full border transition-colors ${searchMode === v ? 'bg-violet-500 text-white border-violet-500' : 'text-gray-400 border-gray-700 hover:border-violet-500'}`}>
                {l}
              </button>
            ))}
          </div>
          <form onSubmit={handleSearch} className="flex gap-3 mb-4">
            <div className="flex-1 relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 fill-gray-500" width="16" height="16" viewBox="0 0 16 16">
                <path d="M7 14c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7ZM7 2C4.243 2 2 4.243 2 7s2.243 5 5 5 5-2.243 5-5-2.243-5-5-5Z" />
                <path d="m13.314 11.9 2.393 2.393a.999.999 0 1 1-1.414 1.414L11.9 13.314a8.019 8.019 0 0 0 1.414-1.414Z" />
              </svg>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchMode === 'keyword' ? '키워드로 검색...' : '채널명으로 검색...'}
                className="w-full pl-9 pr-4 py-2 text-sm bg-gray-700/50 border border-gray-700 text-gray-100 placeholder-gray-500 rounded-lg outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>
            <button type="submit" disabled={loading} className="btn bg-violet-500 hover:bg-violet-600 text-white text-sm px-5 py-2 rounded-lg font-medium transition-colors disabled:opacity-50">
              검색
            </button>
            <button type="button" onClick={loadTop} disabled={loading} className="btn bg-gray-700/50 hover:bg-gray-700 text-gray-300 text-sm px-4 py-2 rounded-lg border border-gray-700 font-medium transition-colors disabled:opacity-50">
              TOP 순위
            </button>
          </form>

          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">지역</span>
              {regionOptions.map(({ v, l }) => (
                <button key={v} onClick={() => setRegion(v)}
                  className={`px-3 py-1 text-xs rounded-full border transition-colors ${region === v ? 'bg-violet-500 text-white border-violet-500' : 'text-gray-400 border-gray-700 hover:border-violet-500'}`}>
                  {l}
                </button>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-sm text-gray-500">표시 수</span>
              <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}
                className="text-sm bg-gray-700/50 border border-gray-700 text-gray-300 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-violet-500">
                {[50, 100, 200].map((n) => <option key={n} value={n}>{n}개</option>)}
              </select>
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-lg mb-4">{error}</p>}

        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div>
            <p className="text-xs text-gray-500 px-1 mb-3">
              {channels.length > 0
                ? `${mode === 'top' ? 'TOP 순위' : `"${query}" ${searchMode === 'keyword' ? '키워드' : '채널명'} 검색결과`} — ${filteredChannels.length}개 채널`
                : !API_KEY ? 'API 키가 없습니다. .env에 VITE_YOUTUBE_API_KEY를 추가하세요.' : '검색하거나 TOP 순위 버튼을 눌러주세요'}
            </p>
            {pagedChannels.length > 0 && (
              <>
                <div className="bg-gray-800 rounded-xl border border-gray-700/60 overflow-x-auto">
                  <table className="w-full text-sm whitespace-nowrap">
                    <thead>
                      <tr className="border-b border-gray-700/60 text-xs text-gray-500 uppercase">
                        <th className="px-3 py-3 text-center font-medium">No</th>
                        {COLUMNS.map((col) => (
                          <th
                            key={col.key}
                            title={col.title}
                            onClick={() => handleSort(col.key)}
                            className={`px-3 py-3 font-medium cursor-pointer select-none hover:text-gray-300 transition-colors ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
                          >
                            {col.label}
                            <span className="inline-block w-3 text-violet-400">
                              {sortKey === col.key ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}
                            </span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pagedChannels.map((ch, i) => (
                        <tr key={ch.id} className="border-b border-gray-700/40 last:border-0 hover:bg-gray-700/30 transition-colors">
                          <td className="px-3 py-3 text-center text-gray-500 font-bold">{(page - 1) * PAGE_SIZE + i + 1}</td>
                          {COLUMNS.map((col) => {
                            if (col.key === 'channel') {
                              return (
                                <td key={col.key} className="px-3 py-3"
                                  onMouseEnter={(e) => showHoverCard(ch, e.currentTarget.getBoundingClientRect())}
                                  onMouseLeave={scheduleHideCard}
                                >
                                  <div className="flex items-center gap-3 min-w-[200px]">
                                    <img src={ch.thumbnail} alt={ch.title} className="w-9 h-9 rounded-full object-cover flex-shrink-0 bg-gray-700" />
                                    <div className="min-w-0">
                                      <p className="font-semibold text-gray-100 truncate text-sm">{ch.title}</p>
                                      <p className="text-xs text-gray-500 truncate mt-0.5 max-w-[260px]">{ch.description}</p>
                                    </div>
                                  </div>
                                </td>
                              )
                            }
                            const isMain = col.key === 'subscriberCount'
                            return (
                              <td key={col.key} className={`px-3 py-3 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'} ${isMain ? 'font-semibold text-gray-200' : 'text-gray-300'}`}>
                                {formatCell(ch, col)}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 페이지네이션 */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                      className="px-3 py-1.5 text-xs rounded-lg border border-gray-700 text-gray-400 hover:border-violet-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                      이전
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button key={p} onClick={() => setPage(p)}
                        className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${page === p ? 'bg-violet-500 text-white border-violet-500' : 'text-gray-400 border-gray-700 hover:border-violet-500'}`}>
                        {p}
                      </button>
                    ))}
                    <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                      className="px-3 py-1.5 text-xs rounded-lg border border-gray-700 text-gray-400 hover:border-violet-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                      다음
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>

      {hoverCard && (
        <ChannelHoverCard
          ch={hoverCard.ch}
          style={hoverCard.style}
          onClose={() => setHoverCard(null)}
          onMouseEnter={() => clearTimeout(hoverTimer.current)}
          onMouseLeave={scheduleHideCard}
        />
      )}
    </div>
  )
}
