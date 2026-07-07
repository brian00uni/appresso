import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import PublicAppLayout from '../public/PublicAppLayout'
import {
  trendApi, imgProxy, fmtViews, fmtCount, timeAgo, fmtUpdated,
  loadAccounts, addAccount, removeAccount,
} from './trendApi'

const TABS = [
  { v: 'youtube', l: '▶ 유튜브' },
  { v: 'shorts', l: '⚡ 쇼츠' },
  { v: 'ai', l: '🤖 AI 영상' },
  { v: 'reels', l: '📸 릴스' },
  { v: 'x', l: '𝕏 트위터' },
  { v: 'threads', l: '🧵 스레드' },
  { v: 'tiktok', l: '🎵 틱톡' },
]

const PERIODS = [
  { v: 'day', l: '오늘' },
  { v: 'week', l: '이번 주' },
  { v: 'month', l: '이번 달' },
]

const VIDEO_SORTS = [
  { key: 'views', label: '조회수순', icon: '👁️' },
  { key: 'likes', label: '좋아요순', icon: '👍' },
]
const MEDIA_SORTS = [
  { key: 'views', label: '조회수순', icon: '👁️' },
  { key: 'likes', label: '좋아요순', icon: '❤️' },
  { key: 'comments', label: '댓글순', icon: '💬' },
]
const X_SORTS = [
  { key: 'likes', label: '좋아요순', icon: '❤️' },
  { key: 'replies', label: '댓글순', icon: '💬' },
  { key: 'retweets', label: '리트윗순', icon: '🔁' },
  { key: 'views', label: '조회수순', icon: '👁️' },
]
const THREADS_SORTS = [
  { key: 'likes', label: '좋아요순', icon: '❤️' },
  { key: 'replies', label: '댓글순', icon: '💬' },
  { key: 'reposts', label: '리포스트순', icon: '🔁' },
]

export default function TrendHubPage() {
  const [tab, setTab] = useState('youtube')
  const [category, setCategory] = useState('전체')
  const [period, setPeriod] = useState('week')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [categories, setCategories] = useState(['전체', 'AI'])
  const [updated, setUpdated] = useState(0)
  const [player, setPlayer] = useState(null) // { id, vertical }

  // 영상(유튜브/쇼츠)
  const [videoData, setVideoData] = useState([])
  const [videoLoading, setVideoLoading] = useState(false)
  const [videoStatus, setVideoStatus] = useState('영상을 불러오는 중입니다...')
  const [videoSort, setVideoSort] = useState('views')
  const videoHasLikes = useRef(false)
  const loadSeq = useRef(0)

  // 각 소셜 탭
  const [reels, setReels] = useState({ data: [], loading: false, status: '', sort: 'views', accounts: [] })
  const [xState, setXState] = useState({ data: [], loading: false, status: '', sort: 'likes', accounts: [] })
  const [threads, setThreads] = useState({ data: [], loading: false, status: '', sort: 'likes', accounts: [], fallback: false })
  const [tiktok, setTiktok] = useState({ data: [], loading: false, status: '', sort: 'views', accounts: [] })
  const [ai, setAi] = useState({ data: null, loading: false, status: '' })

  const isVideo = tab === 'youtube' || tab === 'shorts'

  // ---------- 카테고리 로드 ----------
  useEffect(() => {
    trendApi.categories().then((d) => setCategories(d.categories)).catch(() => {})
  }, [])

  // ---------- 영상 로드 ----------
  const loadVideos = useCallback(async (force = false, wantLikes = videoSort === 'likes') => {
    const seq = ++loadSeq.current
    setVideoLoading(true)
    setVideoStatus(wantLikes
      ? '좋아요 수를 불러오는 중입니다... (영상마다 조회하느라 조금 걸려요)'
      : '영상을 불러오는 중입니다...')
    try {
      const d = await trendApi.videos({ category, period, shorts: tab === 'shorts', enrich: wantLikes, q: search, force })
      if (seq !== loadSeq.current) return
      setUpdated(d.fetchedAt)
      videoHasLikes.current = wantLikes
      setVideoData(d.videos || [])
      setVideoStatus((d.videos || []).length ? '' : '결과가 없습니다.')
    } catch {
      if (seq !== loadSeq.current) return
      setVideoData([])
      setVideoStatus('불러오기에 실패했습니다. 네트워크를 확인해 주세요.')
    } finally {
      if (seq === loadSeq.current) setVideoLoading(false)
    }
  }, [category, period, tab, search, videoSort])

  // 탭/카테고리/기간/검색 변경 시 영상 재로드
  useEffect(() => {
    if (isVideo) loadVideos(false, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, category, period, search])

  // 탭 진입 시 소셜 데이터 로드
  useEffect(() => {
    if (tab === 'reels') loadReels()
    else if (tab === 'x') loadSocial('x')
    else if (tab === 'threads') loadSocial('threads')
    else if (tab === 'tiktok') loadTiktok()
    else if (tab === 'ai') loadAi()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  const sortedVideos = useMemo(() => {
    const f = videoSort
    return videoData.slice().sort((a, b) => (b[f] || 0) - (a[f] || 0))
  }, [videoData, videoSort])

  function onVideoSort(key) {
    setVideoSort(key)
    if (key === 'likes' && !videoHasLikes.current) loadVideos(false, true)
  }

  // ---------- 릴스 ----------
  async function loadReels(force = false) {
    setReels((s) => ({ ...s, loading: true, status: '릴스를 불러오는 중입니다... (계정이 많으면 수십 초 걸릴 수 있어요)', accounts: loadAccounts('reels') }))
    try {
      const d = await trendApi.reels(force)
      setUpdated(d.fetchedAt)
      setReels((s) => ({
        ...s, loading: false, data: d.reels || [], accounts: d.accounts || loadAccounts('reels'),
        status: (d.reels || []).length ? '' : '가져온 릴스가 없습니다. 계정을 추가하거나 잠시 후 새로고침해 주세요.',
      }))
    } catch {
      setReels((s) => ({ ...s, loading: false, data: [], status: '불러오기에 실패했습니다.' }))
    }
  }

  // ---------- 틱톡 ----------
  async function loadTiktok(force = false) {
    setTiktok((s) => ({ ...s, loading: true, status: '틱톡 인기 영상을 불러오는 중입니다...', accounts: loadAccounts('tiktok') }))
    try {
      const d = await trendApi.tiktok(force)
      setUpdated(d.fetchedAt)
      setTiktok((s) => ({
        ...s, loading: false, data: d.posts || [], accounts: d.accounts || loadAccounts('tiktok'),
        status: (d.posts || []).length ? '' : '가져온 영상이 없습니다. 잠시 후 새로고침해 주세요.',
      }))
    } catch {
      setTiktok((s) => ({ ...s, loading: false, data: [], status: '불러오기에 실패했습니다.' }))
    }
  }

  // ---------- X / 스레드 ----------
  async function loadSocial(kind, force = false) {
    const setState = kind === 'x' ? setXState : setThreads
    setState((s) => ({ ...s, loading: true, status: '불러오는 중입니다... (계정이 많으면 수십 초 걸릴 수 있어요)', fallback: false, accounts: loadAccounts(kind) }))
    try {
      const d = await trendApi[kind](force)
      setUpdated(d.fetchedAt)
      const posts = d.posts || []
      if (!posts.length) {
        setState((s) => ({
          ...s, loading: false, data: [], accounts: d.accounts || loadAccounts(kind),
          fallback: kind === 'threads',
          status: kind === 'threads' ? '' : '가져온 글이 없습니다. 계정을 확인하거나 잠시 후 새로고침해 주세요.',
        }))
        return
      }
      setState((s) => ({ ...s, loading: false, data: posts, accounts: d.accounts || loadAccounts(kind), status: '', fallback: false }))
    } catch {
      setState((s) => ({ ...s, loading: false, data: [], status: '불러오기에 실패했습니다.' }))
    }
  }

  // ---------- AI ----------
  async function loadAi(force = false) {
    setAi((s) => ({ ...s, loading: !s.data || force, status: 'AI 소식을 불러오는 중입니다...' }))
    try {
      const d = await trendApi.ai(force)
      setUpdated(d.fetchedAt)
      setAi({ data: d, loading: false, status: '' })
    } catch {
      setAi((s) => ({ ...s, loading: false, status: '불러오기에 실패했습니다.' }))
    }
  }

  // ---------- 계정 관리 (localStorage) ----------
  function handleAddAccount(source, raw) {
    addAccount(source, raw)
    reloadSource(source)
  }
  function handleRemoveAccount(source, name) {
    removeAccount(source, name)
    reloadSource(source)
  }
  function reloadSource(source) {
    if (source === 'reels') loadReels(true)
    else if (source === 'tiktok') loadTiktok(true)
    else loadSocial(source, true)
  }

  // ---------- 검색 / 새로고침 ----------
  function onSearchSubmit(e) {
    e.preventDefault()
    const kw = searchInput.trim()
    if (!isVideo) setTab('youtube')
    setSearch(kw)
  }
  function onRefresh() {
    if (tab === 'ai') loadAi(true)
    else if (tab === 'reels') loadReels(true)
    else if (tab === 'x') loadSocial('x', true)
    else if (tab === 'threads') loadSocial('threads', true)
    else if (tab === 'tiktok') loadTiktok(true)
    else loadVideos(true)
  }

  return (
    <PublicAppLayout appKey="trend-hub">
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-100">트렌드 허브</h1>
            <p className="text-gray-400 mt-1 text-sm">
              {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
              {updated ? ` · ${fmtUpdated(updated)}` : ''}
            </p>
          </div>
          <form onSubmit={onSearchSubmit} className="ml-auto flex gap-2">
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="유튜브 검색어 (예: AI 광고)"
              className="w-48 sm:w-56 px-3 py-2 text-sm bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-500 rounded-lg outline-none focus:ring-2 focus:ring-violet-500"
            />
            <button type="submit" className="btn bg-violet-500 hover:bg-violet-600 text-white text-sm px-4 py-2 rounded-lg font-medium">🔍</button>
            <button type="button" onClick={onRefresh} className="btn bg-gray-800 border border-gray-700 text-gray-200 hover:border-violet-500 text-sm px-4 py-2 rounded-lg">🔄</button>
          </form>
        </div>

        {/* 탭 */}
        <div className="flex items-center gap-1 mb-5 border-b border-gray-700/60 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.v}
              type="button"
              onClick={() => setTab(t.v)}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px whitespace-nowrap transition-colors ${
                tab === t.v ? 'text-violet-400 border-violet-400' : 'text-gray-400 border-transparent hover:text-gray-100'
              }`}
            >
              {t.l}
            </button>
          ))}
        </div>

        {/* 영상 탭 (유튜브/쇼츠) */}
        {isVideo && (
          <>
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <div className="flex flex-wrap gap-1.5">
                {categories.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => { setCategory(c); setSearch(''); setSearchInput('') }}
                    className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                      c === category && !search
                        ? 'bg-violet-500 border-violet-500 text-white font-semibold'
                        : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-100'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1 ml-auto bg-gray-800 border border-gray-700 rounded-lg p-1">
                {PERIODS.map((p) => (
                  <button
                    key={p.v}
                    type="button"
                    onClick={() => setPeriod(p.v)}
                    className={`px-3 py-1 text-xs rounded-md transition-colors ${
                      period === p.v ? 'bg-violet-500 text-white font-semibold' : 'text-gray-400 hover:text-gray-100'
                    }`}
                  >
                    {p.l}
                  </button>
                ))}
              </div>
              <SortMenu options={VIDEO_SORTS} value={videoSort} onChange={onVideoSort} />
            </div>

            {search && (
              <p className="text-xs text-gray-500 mb-3">
                검색: <span className="text-violet-400">{search}</span> — 카테고리를 누르면 검색이 해제됩니다.
              </p>
            )}

            {videoLoading ? (
              <StatusBlock spinner text={videoStatus} />
            ) : videoStatus ? (
              <StatusBlock text={videoStatus} />
            ) : (
              <div className={tab === 'shorts' ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'}>
                {sortedVideos.map((v, i) => (
                  <VideoCard key={v.id} v={v} rank={i + 1} vertical={tab === 'shorts'} sort={videoSort} onPlay={() => setPlayer({ id: v.id, vertical: tab === 'shorts' })} />
                ))}
              </div>
            )}
          </>
        )}

        {/* AI 탭 */}
        {tab === 'ai' && <AiPanel ai={ai} onRetry={() => loadAi(true)} />}

        {/* 릴스 탭 */}
        {tab === 'reels' && (
          <MediaTab
            note="인스타그램 웹 내부 API로 등록된 계정들의 최신 릴스를 조회수순으로 정렬합니다. 즐겨보는 크리에이터 계정을 추가·삭제하세요."
            source="reels" placeholder="인스타그램 계정명 (예: runwayapp)"
            state={reels} sorts={MEDIA_SORTS}
            onSort={(k) => setReels((s) => ({ ...s, sort: k }))}
            onAdd={handleAddAccount} onRemove={handleRemoveAccount}
            fallback={{
              emoji: '📸',
              note: '⚠️ 서버 환경(배포)에서는 인스타그램이 접근을 제한해 릴스를 직접 불러오지 못할 수 있습니다. 아래에서 각 계정을 인스타그램에서 바로 열어볼 수 있어요.',
              hrefFor: (name) => `https://www.instagram.com/${name}/`,
              label: '인스타그램에서 열기 ↗',
            }}
          />
        )}

        {/* 틱톡 탭 */}
        {tab === 'tiktok' && (
          <MediaTab
            note="틱톡 실시간 인기 피드(한국)와 구독 계정 최신 영상을 조회수·좋아요·댓글순으로 모아 보여줍니다."
            source="tiktok" placeholder="틱톡 계정명 (@ 없이, 예: khaby.lame)"
            state={tiktok} sorts={MEDIA_SORTS}
            onSort={(k) => setTiktok((s) => ({ ...s, sort: k }))}
            onAdd={handleAddAccount} onRemove={handleRemoveAccount}
          />
        )}

        {/* X 탭 */}
        {tab === 'x' && (
          <PostTab
            note="트위터 임베드용 공개 API(무인증)로 구독 계정들의 최신 트윗을 참여수와 함께 가져옵니다."
            kind="x" placeholder="X(트위터) 계정명 (예: OpenAI)"
            state={xState} sorts={X_SORTS}
            onSort={(k) => setXState((s) => ({ ...s, sort: k }))}
            onAdd={handleAddAccount} onRemove={handleRemoveAccount}
          />
        )}

        {/* 스레드 탭 */}
        {tab === 'threads' && (
          <PostTab
            note="스레드는 인스타그램(메타)과 같은 백엔드를 씁니다. 로그인 없이 실시간 조회를 시도하며, 막힌 경우 계정 바로가기로 안내합니다."
            kind="threads" placeholder="스레드 계정명 (예: openai)"
            state={threads} sorts={THREADS_SORTS}
            onSort={(k) => setThreads((s) => ({ ...s, sort: k }))}
            onAdd={handleAddAccount} onRemove={handleRemoveAccount}
          />
        )}
      </main>

      {player && <PlayerModal player={player} onClose={() => setPlayer(null)} />}
    </PublicAppLayout>
  )
}

/* ======================= 재사용 컴포넌트 ======================= */

function StatusBlock({ text, spinner }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-gray-500 text-sm gap-3">
      {spinner && <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />}
      <span>{text}</span>
    </div>
  )
}

function SortMenu({ options, value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('click', onDoc)
    return () => document.removeEventListener('click', onDoc)
  }, [])
  const cur = options.find((o) => o.key === value) || options[0]
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o) }}
        className="flex items-center gap-2 bg-gray-800 border border-gray-700 text-gray-200 rounded-lg px-4 py-2 text-sm font-semibold hover:border-violet-500"
      >
        정렬: <span>{cur.label}</span>
        <span className={`text-xs text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`}>▼</span>
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1.5 z-40 bg-gray-800 border border-gray-700 rounded-xl p-1.5 min-w-[190px] shadow-2xl">
          {options.map((o) => (
            <button
              key={o.key}
              type="button"
              onClick={() => { onChange(o.key); setOpen(false) }}
              className={`flex w-full items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-left hover:bg-gray-700/60 ${
                o.key === value ? 'text-violet-400 font-semibold' : 'text-gray-200'
              }`}
            >
              <span>{o.icon}</span><span>{o.label}</span>
              {o.key === value && <span className="ml-auto text-violet-400">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function VideoCard({ v, rank, vertical, sort, onPlay }) {
  return (
    <div onClick={onPlay}
      className="group bg-gray-800 border border-gray-700/60 rounded-xl overflow-hidden cursor-pointer hover:border-violet-500 hover:-translate-y-0.5 transition-all">
      <div className="relative">
        <img src={v.thumbnail} alt="" loading="lazy"
          className={`w-full object-cover bg-black ${vertical ? 'aspect-[9/13]' : 'aspect-video'}`} />
        <div className={`absolute top-2 left-2 text-xs font-extrabold px-2 py-0.5 rounded ${rank <= 3 ? 'bg-violet-500 text-white' : 'bg-black/75 text-amber-300'}`}>{rank}위</div>
        {v.length && <div className="absolute right-2 bottom-2 text-[11px] bg-black/80 text-white px-1.5 py-0.5 rounded">{v.length}</div>}
      </div>
      <div className="p-3">
        <p className="text-sm font-semibold text-gray-100 leading-snug line-clamp-2 min-h-[2.5rem]">{v.title}</p>
        <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-xs text-gray-400">
          <span className={sort === 'views' ? 'text-violet-400 font-semibold' : ''}>조회수 {fmtViews(v.views)}</span>
          {v.likes ? <span className={sort === 'likes' ? 'text-violet-400 font-semibold' : ''}>👍 {fmtCount(v.likes)}</span> : null}
        </div>
        <div className="mt-1 flex flex-wrap gap-x-2 text-xs text-gray-500">
          <span className="truncate max-w-[60%]">{v.channel}</span>
          {v.published && <span>{v.published}</span>}
        </div>
      </div>
    </div>
  )
}

function PlayerModal({ player, onClose }) {
  return (
    <div className="fixed inset-0 z-[100] bg-black/85 flex items-center justify-center p-6" onClick={onClose}>
      <div className={player.vertical ? 'w-full max-w-[400px]' : 'w-full max-w-[900px]'} onClick={(e) => e.stopPropagation()}>
        <iframe
          title="player"
          src={`https://www.youtube.com/embed/${player.id}?autoplay=1`}
          allow="autoplay; encrypted-media"
          allowFullScreen
          className={`w-full rounded-xl bg-black border-0 ${player.vertical ? 'aspect-[9/16]' : 'aspect-video'}`}
        />
        <div className="flex justify-end gap-2 mt-3">
          <a href={`https://www.youtube.com/watch?v=${player.id}`} target="_blank" rel="noreferrer"
            className="bg-gray-800 border border-gray-700 text-gray-200 rounded-lg px-4 py-2 text-sm hover:border-violet-500">유튜브에서 열기 ↗</a>
          <button onClick={onClose} className="bg-gray-800 border border-gray-700 text-gray-200 rounded-lg px-4 py-2 text-sm hover:border-violet-500">닫기</button>
        </div>
      </div>
    </div>
  )
}

function AccountBar({ source, placeholder, accounts, onAdd, onRemove }) {
  const [input, setInput] = useState('')
  const submit = () => { if (input.trim()) { onAdd(source, input); setInput('') } }
  return (
    <div className="mb-5">
      <h2 className="text-sm font-semibold text-gray-200 mb-2">👤 구독 계정</h2>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {accounts.map((name) => (
          <span key={name} className="inline-flex items-center gap-1.5 bg-gray-800 border border-gray-700 rounded-full pl-3 pr-1.5 py-1 text-xs text-gray-200">
            @{name}
            <button type="button" onClick={() => onRemove(source, name)}
              className="w-4 h-4 rounded-full bg-gray-700 text-gray-400 hover:text-red-400 text-[10px] leading-none">✕</button>
          </span>
        ))}
      </div>
      <div className="flex gap-2 max-w-xl">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 text-sm bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-500 rounded-lg outline-none focus:ring-2 focus:ring-violet-500"
        />
        <button type="button" onClick={submit} className="bg-violet-500 hover:bg-violet-600 text-white text-sm px-4 py-2 rounded-lg font-medium">계정 추가</button>
      </div>
    </div>
  )
}

// 릴스·틱톡 공용 (썸네일 그리드)
function MediaTab({ note, source, placeholder, state, sorts, onSort, onAdd, onRemove, fallback }) {
  const sorted = useMemo(() => {
    const f = state.sort
    return state.data.slice().sort((a, b) => (b[f] || 0) - (a[f] || 0))
  }, [state.data, state.sort])
  const label = { views: '조회수', likes: '좋아요', comments: '댓글' }[state.sort]

  return (
    <>
      <p className="text-xs text-gray-500 leading-relaxed mb-4 max-w-3xl">{note}</p>
      <AccountBar source={source} placeholder={placeholder} accounts={state.accounts} onAdd={onAdd} onRemove={onRemove} />
      <div className="flex items-center gap-3 mb-4">
        <SortMenu options={sorts} value={state.sort} onChange={onSort} />
        {!state.loading && sorted.length > 0 && <span className="text-xs text-gray-500">{label} 기준 · 총 {sorted.length}개</span>}
      </div>
      {state.loading ? <StatusBlock spinner text={state.status} />
        : (sorted.length === 0 && fallback) ? <PlatformFallback {...fallback} accounts={state.accounts} />
          : state.status ? <StatusBlock text={state.status} />
            : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {sorted.map((m, i) => (
                <a key={m.id || m.url} href={m.url} target="_blank" rel="noreferrer"
                  className="group bg-gray-800 border border-gray-700/60 rounded-xl overflow-hidden hover:border-violet-500 hover:-translate-y-0.5 transition-all">
                  <div className="relative">
                    <img src={imgProxy(m.thumbnail)} alt="" loading="lazy" className="w-full aspect-[9/13] object-cover bg-black" />
                    <div className={`absolute top-2 left-2 text-xs font-extrabold px-2 py-0.5 rounded ${i < 3 ? 'bg-violet-500 text-white' : 'bg-black/75 text-amber-300'}`}>{i + 1}위</div>
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-semibold text-gray-100 leading-snug line-clamp-2 min-h-[2.5rem]">{m.title}</p>
                    <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-xs text-gray-400">
                      <span className={state.sort === 'views' ? 'text-violet-400 font-semibold' : ''}>👁️ {fmtCount(m.views)}</span>
                      <span className={state.sort === 'likes' ? 'text-violet-400 font-semibold' : ''}>❤️ {fmtCount(m.likes)}</span>
                      <span className={state.sort === 'comments' ? 'text-violet-400 font-semibold' : ''}>💬 {fmtCount(m.comments)}</span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500 truncate">@{m.account}</p>
                  </div>
                </a>
              ))}
            </div>
          )}
    </>
  )
}

// X·스레드 공용 (글 카드)
function PostTab({ note, kind, placeholder, state, sorts, onSort, onAdd, onRemove }) {
  const field = kind === 'x'
    ? (state.sort === 'retweets' ? 'retweets' : state.sort)
    : (state.sort === 'reposts' ? 'reposts' : state.sort)
  const sorted = useMemo(() =>
    state.data.slice().sort((a, b) => (b[field] || 0) - (a[field] || 0)),
  [state.data, field])

  return (
    <>
      <p className="text-xs text-gray-500 leading-relaxed mb-4 max-w-3xl">{note}</p>
      <AccountBar source={kind} placeholder={placeholder} accounts={state.accounts} onAdd={onAdd} onRemove={onRemove} />
      <div className="flex items-center gap-3 mb-4">
        <SortMenu options={sorts} value={state.sort} onChange={onSort} />
        {!state.loading && sorted.length > 0 && <span className="text-xs text-gray-500">총 {sorted.length}개 글</span>}
      </div>

      {state.loading ? <StatusBlock spinner text={state.status} />
        : state.fallback ? <ThreadsFallback accounts={state.accounts} />
          : state.status ? <StatusBlock text={state.status} />
            : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {sorted.map((p, i) => (
                  <div key={p.url || i} onClick={() => window.open(p.url, '_blank')}
                    className="flex flex-col bg-gray-800 border border-gray-700/60 rounded-xl p-4 cursor-pointer hover:border-violet-500 hover:-translate-y-0.5 transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs font-extrabold px-2 py-0.5 rounded ${i < 3 ? 'bg-violet-500 text-white' : 'bg-gray-700 text-amber-300'}`}>{i + 1}위</span>
                      <span className="text-sm font-semibold text-gray-100">@{p.account}</span>
                    </div>
                    <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap break-words line-clamp-6">{p.text}</p>
                    {p.media && <img src={imgProxy(p.media)} alt="" loading="lazy" className="mt-3 rounded-lg w-full max-h-60 object-cover bg-black" />}
                    <div className="flex gap-4 mt-3 pt-3 border-t border-gray-700/60 text-xs text-gray-400">
                      <Stat active={state.sort === 'likes'} icon="❤️" n={p.likes} />
                      <Stat active={state.sort === 'replies'} icon="💬" n={p.replies} />
                      <Stat active={kind === 'x' ? state.sort === 'retweets' : state.sort === 'reposts'} icon="🔁" n={kind === 'x' ? p.retweets : p.reposts} />
                      {p.views ? <Stat active={state.sort === 'views'} icon="👁️" n={p.views} /> : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
    </>
  )
}

function Stat({ active, icon, n }) {
  return (
    <span className={active ? 'text-violet-400' : ''}>
      {icon} <b className={active ? 'text-violet-300' : 'text-gray-200'}>{fmtCount(n)}</b>
    </span>
  )
}

// 서버에서 데이터를 못 불러올 때(인스타 차단·스레드 차단 등) 계정 바로가기 카드로 폴백
function PlatformFallback({ emoji, note, accounts, hrefFor, label }) {
  return (
    <>
      <p className="text-xs text-amber-300/90 bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3 mb-4">{note}</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
        {accounts.map((name) => (
          <a key={name} href={hrefFor(name)} target="_blank" rel="noreferrer"
            className="block bg-gray-800 border border-gray-700/60 rounded-xl px-4 py-3.5 text-sm font-semibold text-gray-200 hover:border-violet-500">
            {emoji} @{name}
            <small className="block text-gray-500 font-normal mt-1">{label}</small>
          </a>
        ))}
      </div>
    </>
  )
}

function ThreadsFallback({ accounts }) {
  return (
    <PlatformFallback
      emoji="🧵" accounts={accounts}
      note="⚠️ 지금은 스레드가 로그인 없는 조회를 차단하고 있어 실시간 글을 가져오지 못했습니다. 아래에서 각 계정을 바로 열어볼 수 있습니다."
      hrefFor={(name) => 'https://www.threads.com/@' + name}
      label="스레드에서 열기 ↗"
    />
  )
}

function AiPanel({ ai, onRetry }) {
  if (ai.loading) return <StatusBlock spinner text={ai.status || 'AI 소식을 불러오는 중입니다...'} />
  if (!ai.data) return (
    <div className="flex flex-col items-center gap-3 py-20 text-gray-500 text-sm">
      <span>{ai.status || '불러오기에 실패했습니다.'}</span>
      <button onClick={onRetry} className="bg-gray-800 border border-gray-700 text-gray-200 rounded-lg px-4 py-2 hover:border-violet-500">다시 시도</button>
    </div>
  )
  const { models, news } = ai.data
  return (
    <>
      <AiModelSection title="🚀 새로 나온 영상 생성 모델" sub="Hugging Face · 최신 등록순" models={models.latest} />
      <AiModelSection title="🔥 지금 뜨는 모델" sub="Hugging Face · 트렌딩" models={models.trending} />
      <div className="mb-8">
        <h2 className="text-base font-bold text-gray-100 mb-3">📰 AI 영상 뉴스 <span className="text-xs text-gray-500 font-normal">구글 뉴스 · 최신순</span></h2>
        <div className="flex flex-col gap-1.5">
          {news.slice(0, 20).map((n, i) => (
            <a key={i} href={n.link} target="_blank" rel="noreferrer"
              className="flex items-baseline gap-2.5 bg-gray-800 border border-gray-700/60 rounded-lg px-4 py-2.5 hover:border-violet-500">
              <span className={`flex-shrink-0 text-[10.5px] font-bold rounded px-1.5 py-0.5 ${n.region === '국내' ? 'bg-violet-500/15 text-violet-300' : 'bg-sky-500/15 text-sky-300'}`}>{n.region}</span>
              <span className="flex-1 text-sm text-gray-200 leading-snug">{n.title}</span>
              <span className="flex-shrink-0 text-xs text-gray-500">{(n.source ? n.source + ' · ' : '') + timeAgo(n.ts)}</span>
            </a>
          ))}
        </div>
      </div>
      <p className="text-xs text-gray-500">💡 인기 AI 영상은 <b className="text-gray-300">유튜브 탭 → 'AI' 카테고리</b>에서 조회수·좋아요순으로 볼 수 있어요.</p>
    </>
  )
}

function AiModelSection({ title, sub, models }) {
  return (
    <div className="mb-8">
      <h2 className="text-base font-bold text-gray-100 mb-3">{title} <span className="text-xs text-gray-500 font-normal">{sub}</span></h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
        {models.map((m) => {
          const t2v = m.pipeline === 'text-to-video'
          return (
            <a key={m.id} href={'https://huggingface.co/' + m.id} target="_blank" rel="noreferrer"
              className="block bg-gray-800 border border-gray-700/60 rounded-xl p-3.5 hover:border-violet-500">
              <div className="text-sm font-bold text-gray-100 break-all leading-snug">{m.id}</div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11.5px] text-gray-500">
                <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold ${t2v ? 'bg-violet-500/15 text-violet-300' : 'bg-sky-500/15 text-sky-300'}`}>{t2v ? '텍스트→영상' : '이미지→영상'}</span>
                <span>❤️ {m.likes.toLocaleString()}</span>
                <span>⬇️ {m.downloads.toLocaleString()}</span>
                <span>{m.createdAt ? m.createdAt.slice(0, 10) : ''}</span>
              </div>
            </a>
          )
        })}
      </div>
    </div>
  )
}
