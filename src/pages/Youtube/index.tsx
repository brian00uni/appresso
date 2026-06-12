import { useState, useEffect } from 'react'
import { Search, Filter, TrendingUp, Users, Play, Globe } from 'lucide-react'
import { searchChannels, getTopChannels, hasYoutubeApiKey, type Channel } from '../../lib/youtube'

type RegionFilter = 'ALL' | 'KR' | 'WR'

const 구독자필터옵션 = [
  { 라벨: '전체', 값: 0 },
  { 라벨: '1만+', 값: 10_000 },
  { 라벨: '10만+', 값: 100_000 },
  { 라벨: '100만+', 값: 1_000_000 },
]

function formatCount(count: string) {
  const n = parseInt(count)
  if (isNaN(n)) return '-'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 10_000) return `${(n / 10_000).toFixed(1)}만`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return count
}

export default function YoutubePage() {
  const [검색어, set검색어] = useState('')
  const [지역필터, set지역필터] = useState<RegionFilter>('KR')
  const [최소구독자, set최소구독자] = useState(0)
  const [채널목록, set채널목록] = useState<Channel[]>([])
  const [로딩중, set로딩중] = useState(false)
  const [오류, set오류] = useState('')
  const [페이지크기, set페이지크기] = useState(50)
  const [모드, set모드] = useState<'top' | 'search'>('top')

  useEffect(() => {
    if (hasYoutubeApiKey) loadTopChannels()
  }, [지역필터, 페이지크기])

  const loadTopChannels = async () => {
    set모드('top')
    set로딩중(true)
    set오류('')
    try {
      const regionCode = 지역필터 === 'WR' ? 'US' : 'KR'
      const channels = await getTopChannels(regionCode, 페이지크기)
      set채널목록(applyFilter(channels))
    } catch (e: any) {
      set오류(e.message ?? '데이터를 불러오는 데 실패했습니다.')
    } finally {
      set로딩중(false)
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!검색어.trim()) return
    set모드('search')
    set로딩중(true)
    set오류('')
    try {
      const regionCode = 지역필터 === 'KR' ? 'KR' : 지역필터 === 'WR' ? 'US' : undefined
      const channels = await searchChannels(검색어.trim(), regionCode, 페이지크기)
      set채널목록(applyFilter(channels))
    } catch (e: any) {
      set오류(e.message ?? '검색 중 오류가 발생했습니다.')
    } finally {
      set로딩중(false)
    }
  }

  const applyFilter = (list: Channel[]) =>
    최소구독자 > 0 ? list.filter((c) => parseInt(c.subscriberCount) >= 최소구독자) : list

  if (!hasYoutubeApiKey) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <TrendingUp className="w-12 h-12 text-gray-200" />
        <h2 className="text-base font-semibold text-gray-500">YouTube API 키가 필요합니다</h2>
        <p className="text-sm text-gray-400 text-center leading-relaxed">
          .env 파일에 <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">VITE_YOUTUBE_API_KEY</code>를 추가하면<br />
          유튜브 채널 검색 및 순위를 확인할 수 있습니다.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* 검색 + 필터 */}
      <div className="card p-5">
        <form onSubmit={handleSearch} className="flex gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={검색어}
              onChange={(e) => set검색어(e.target.value)}
              placeholder="채널명으로 검색..."
              className="input-base pl-9"
            />
          </div>
          <button type="submit" disabled={로딩중} className="btn-primary px-5">
            검색
          </button>
          <button
            type="button"
            onClick={loadTopChannels}
            disabled={로딩중}
            className="btn-secondary px-4"
          >
            TOP 순위
          </button>
        </form>

        <div className="flex flex-wrap gap-4 items-center">
          {/* 지역 필터 */}
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-500">지역</span>
            {(['ALL', 'KR', 'WR'] as RegionFilter[]).map((r) => (
              <button
                key={r}
                onClick={() => set지역필터(r)}
                className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                  지역필터 === r
                    ? 'bg-brand-500 text-white border-brand-500'
                    : 'text-gray-500 border-gray-200 hover:border-brand-400'
                }`}
              >
                {r === 'ALL' ? '전체' : r === 'KR' ? '한국' : '해외'}
              </button>
            ))}
          </div>

          {/* 구독자 필터 */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-500">구독자</span>
            {구독자필터옵션.map(({ 라벨, 값 }) => (
              <button
                key={값}
                onClick={() => set최소구독자(값)}
                className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                  최소구독자 === 값
                    ? 'bg-brand-500 text-white border-brand-500'
                    : 'text-gray-500 border-gray-200 hover:border-brand-400'
                }`}
              >
                {라벨}
              </button>
            ))}
          </div>

          {/* 페이지 크기 */}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-gray-500">표시 수</span>
            <select
              value={페이지크기}
              onChange={(e) => set페이지크기(Number(e.target.value))}
              className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 outline-none focus:ring-2 focus:ring-brand-500"
            >
              {[50, 100, 200].map((n) => (
                <option key={n} value={n}>{n}개</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 오류 */}
      {오류 && (
        <p className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-lg">{오류}</p>
      )}

      {/* 결과 */}
      {로딩중 ? (
        <div className="flex justify-center py-24">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-gray-400 px-1">
            {채널목록.length > 0
              ? `${모드 === 'top' ? 'TOP 순위' : `"${검색어}" 검색결과`} — ${채널목록.length}개 채널`
              : '검색하거나 TOP 순위 버튼을 눌러주세요'}
          </p>
          <div className="space-y-2">
            {채널목록.map((채널, i) => (
              <div key={채널.id} className="card p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
                <span className="text-sm font-bold text-gray-300 w-7 text-center flex-shrink-0">
                  {i + 1}
                </span>
                <img
                  src={채널.thumbnail}
                  alt={채널.title}
                  className="w-11 h-11 rounded-full object-cover flex-shrink-0 bg-gray-100"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate text-sm">{채널.title}</h3>
                  <p className="text-xs text-gray-400 truncate mt-0.5">{채널.description}</p>
                </div>
                <div className="flex gap-6 flex-shrink-0">
                  <Stat 아이콘={Users} 값={formatCount(채널.subscriberCount)} 라벨="구독자" />
                  <Stat 아이콘={Play} 값={formatCount(채널.videoCount)} 라벨="영상 수" />
                  <Stat 아이콘={TrendingUp} 값={formatCount(채널.viewCount)} 라벨="총 조회" />
                  {채널.country && (
                    <Stat 아이콘={Globe} 값={채널.country} 라벨="국가" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function Stat({ 아이콘: Icon, 값, 라벨 }: { 아이콘: React.ElementType; 값: string; 라벨: string }) {
  return (
    <div className="text-center min-w-[56px]">
      <p className="text-sm font-bold text-gray-900">{값}</p>
      <div className="flex items-center justify-center gap-1 text-xs text-gray-400 mt-0.5">
        <Icon className="w-3 h-3" />
        <span>{라벨}</span>
      </div>
    </div>
  )
}
