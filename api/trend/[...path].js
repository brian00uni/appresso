// 트렌드 허브 백엔드 — trend-viewer(server.py)를 Vercel 서버리스 함수 하나로 포팅.
// API 키 없이 각 플랫폼의 무인증/공개 API를 서버에서 프록시한다.
// 라우팅: /api/trend/<path>  (videos, categories, reels, x, threads, tiktok, ai, img, oembed)
//
// ⚠️ 구독 계정 목록은 서버에 저장하지 않는다(서버리스는 상태 없음).
//    프론트가 localStorage로 관리하고 ?accounts=a,b,c 로 전달한다. 비어있으면 기본값 사용.

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'

const CACHE_TTL = 60 * 60 * 1000 // 1시간 (warm 인스턴스 한정 in-memory 캐시)

// ---------------------------------------------------------------- 유튜브
const CATEGORIES = {
  먹방: '먹방',
  '뷰티/패션': '뷰티 메이크업 패션',
  브이로그: '브이로그',
  '예능/코미디': '예능 웃긴 영상',
  '영화/드라마': '영화 드라마 리뷰',
  '테크/IT': '테크 리뷰',
  '지식/교육': '지식 교양',
  여행: '여행',
  동물: '강아지 고양이',
}
const ALL_MERGE = ['먹방', '브이로그', '예능/코미디', '뷰티/패션', '영화/드라마', '여행']
const AI_YT_QUERIES = ['AI 영상 제작', 'AI 영상 생성', 'sora ai video', 'runway kling veo']
const PERIOD_CODE = { day: 2, week: 3, month: 4 }
const PERIOD_EXCLUDE = {
  day: ['일 전', '주 전', '개월 전', '년 전'],
  week: ['주 전', '개월 전', '년 전'],
  month: ['개월 전', '년 전'],
}

// ---------------------------------------------------------------- 계정 기본값
const IG_APP_ID = '936619743392459'
const IG_APP_ID_THREADS = '238260118697367'
const TIKWM_BASE = 'https://www.tikwm.com/api'
const TIKTOK_REGION = 'KR'

const DEFAULTS = {
  reels: ['openai', 'runwayapp', 'pika_labs', 'lumalabsai', 'midjourney',
    'klingai_official', 'heygen_official', 'higgsfield.ai', 'googledeepmind'],
  x: ['OpenAI', 'runwayml', 'Kling_ai', 'GoogleDeepMind', 'midjourney',
    'LumaLabsAI', 'pika_labs', 'heygen_com', 'elevenlabsio', 'AIatMeta'],
  threads: ['openai', 'runway', 'google', 'meta.ai', 'zuck'],
  tiktok: ['openai', 'runwayapp', 'krea.ai', 'elevenlabs', 'sora',
    'zachking', 'khaby.lame', 'google'],
}

// ---------------------------------------------------------------- AI 탭
const HF_PIPELINES = ['text-to-video', 'image-to-video']
const NEWS_FEEDS = [
  ['국내', 'https://news.google.com/rss/search?q=' +
    encodeURIComponent('AI 영상 생성 OR "AI 비디오" OR 영상생성모델') + '&hl=ko&gl=KR&ceid=KR:ko'],
  ['해외', 'https://news.google.com/rss/search?q=' +
    encodeURIComponent('"AI video" model OR Sora OR Runway OR Kling OR Veo') + '&hl=en-US&gl=US&ceid=US:en'],
]

const IMG_PROXY_ALLOW = ['.cdninstagram.com', '.fbcdn.net', '.ytimg.com',
  '.googleusercontent.com', '.twimg.com', '.tiktokcdn.com',
  '.tiktokcdn-eu.com', '.tiktokcdn-us.com']

// ================================================================ 공통 유틸
const _cache = new Map()
async function cached(key, force, fn) {
  const now = Date.now()
  const hit = _cache.get(key)
  if (hit && !force && now - hit.at < CACHE_TTL) return hit
  const value = await fn()
  const entry = { at: Date.now(), value }
  _cache.set(key, entry)
  return entry
}

async function httpGet(url, { headers = {}, body, timeout = 15000 } = {}) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeout)
  try {
    const res = await fetch(url, {
      method: body != null ? 'POST' : 'GET',
      headers: { 'User-Agent': UA, ...(body != null ? { 'Content-Type': 'application/json' } : {}), ...headers },
      body: body != null ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
      signal: ctrl.signal,
    })
    return res
  } finally {
    clearTimeout(timer)
  }
}

async function httpJson(url, opts) {
  const res = await httpGet(url, opts)
  return res.json()
}

// 동시성 제한 map (파이썬 ThreadPoolExecutor 대체)
async function mapPool(items, worker, limit = 6) {
  const out = new Array(items.length)
  let i = 0
  async function run() {
    while (i < items.length) {
      const idx = i++
      try {
        out[idx] = await worker(items[idx], idx)
      } catch {
        out[idx] = null
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length || 1) }, run))
  return out
}

function parseViewCount(text) {
  const digits = String(text || '').replace(/[^\d]/g, '')
  return digits ? parseInt(digits, 10) : 0
}

function accountsParam(query, source) {
  const raw = (query.accounts || '').trim()
  if (!raw) return DEFAULTS[source].slice()
  const list = raw.split(',').map((s) => s.trim().replace(/^@/, '')).filter(Boolean)
  return list.length ? list : DEFAULTS[source].slice()
}

// ================================================================ 유튜브 (InnerTube)
function buildSearchParams(period, shorts) {
  let filters = Buffer.from([0x08, PERIOD_CODE[period] || 3, 0x10, 0x01])
  if (shorts) filters = Buffer.concat([filters, Buffer.from([0x18, 0x01])])
  const raw = Buffer.concat([Buffer.from([0x08, 0x03, 0x12, filters.length]), filters])
  return raw.toString('base64url')
}

function withinPeriod(published, period) {
  if (!published) return true
  return !(PERIOD_EXCLUDE[period] || []).some((w) => published.includes(w))
}

function extractVideos(node, out) {
  if (Array.isArray(node)) {
    for (const v of node) extractVideos(v, out)
  } else if (node && typeof node === 'object') {
    if (node.videoRenderer) {
      const v = node.videoRenderer
      const title = (v.title?.runs || []).map((r) => r.text || '').join('')
      const viewsText = v.viewCountText?.simpleText || ''
      const thumbs = v.thumbnail?.thumbnails || []
      out.push({
        id: v.videoId || '',
        title,
        channel: (v.ownerText?.runs || []).map((r) => r.text || '').join(''),
        views: parseViewCount(viewsText),
        viewsText,
        length: v.lengthText?.simpleText || '',
        published: v.publishedTimeText?.simpleText || '',
        thumbnail: thumbs.length ? thumbs[thumbs.length - 1].url : '',
      })
    }
    for (const val of Object.values(node)) extractVideos(val, out)
  }
}

async function ytSearch(query, period, shorts) {
  const payload = {
    context: { client: { clientName: 'WEB', clientVersion: '2.20250624.01.00', hl: 'ko', gl: 'KR' } },
    query,
    params: buildSearchParams(period, shorts),
  }
  let data
  try {
    data = await httpJson('https://www.youtube.com/youtubei/v1/search', { body: payload })
  } catch {
    return []
  }
  const videos = []
  extractVideos(data, videos)
  const seen = new Set()
  const unique = []
  for (const v of videos) {
    if (v.id && !seen.has(v.id) && withinPeriod(v.published, period)) {
      seen.add(v.id)
      unique.push(v)
    }
  }
  return unique
}

async function mergeYtSearches(queries, period, shorts) {
  const results = await mapPool(queries, (q) => ytSearch(q, period, shorts), 6)
  const merged = []
  const seen = new Set()
  for (const chunk of results) {
    for (const v of chunk || []) {
      if (!seen.has(v.id)) {
        seen.add(v.id)
        merged.push(v)
      }
    }
  }
  merged.sort((a, b) => b.views - a.views)
  return merged
}

async function ytLikeCount(videoId) {
  const payload = {
    context: { client: { clientName: 'WEB', clientVersion: '2.20250624.01.00', hl: 'ko', gl: 'KR' } },
    videoId,
  }
  try {
    const res = await httpGet('https://www.youtube.com/youtubei/v1/next', { body: payload, timeout: 10000 })
    const s = await res.text()
    const m = s.match(/다른 사용자 ([0-9,]+)명/) || s.match(/along with ([0-9,]+) other/)
    return m ? parseInt(m[1].replace(/,/g, ''), 10) + 1 : 0
  } catch {
    return 0
  }
}

async function enrichLikes(videos, limit = 20) {
  const todo = videos.slice(0, limit).filter((v) => !v.likes)
  const counts = await mapPool(todo, (v) => ytLikeCount(v.id), 8)
  todo.forEach((v, idx) => { v.likes = counts[idx] || 0 })
  return videos
}

async function getVideos(query) {
  const category = query.category || '전체'
  const period = query.period || 'week'
  const shorts = query.shorts === '1'
  const enrich = query.enrich === '1'
  const q = (query.q || '').trim()
  const force = query.force === '1'

  const key = `yt:${q || category}:${period}:${shorts}:${enrich}`
  const entry = await cached(key, force, async () => {
    let queries
    if (q) queries = [q]
    else if (category === '전체') queries = ALL_MERGE.map((c) => CATEGORIES[c])
    else if (category === 'AI') queries = AI_YT_QUERIES
    else queries = [CATEGORIES[category] || category]
    const vids = await mergeYtSearches(queries, period, shorts)
    if (enrich) await enrichLikes(vids)
    return vids
  })
  return { videos: entry.value.slice(0, 60), fetchedAt: entry.at }
}

// ================================================================ 인스타 릴스
// 인스타그램 web_profile_info 는 Sec-Fetch-* 정책 검사를 하므로 브라우저 요청 헤더를 맞춘다.
function igHeaders(username) {
  return {
    'x-ig-app-id': IG_APP_ID,
    'Sec-Fetch-Site': 'same-origin',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Dest': 'empty',
    'X-Requested-With': 'XMLHttpRequest',
    Accept: '*/*',
    Referer: 'https://www.instagram.com/' + encodeURIComponent(username) + '/',
  }
}

async function fetchIgReels(username) {
  const url = 'https://www.instagram.com/api/v1/users/web_profile_info/?username=' + encodeURIComponent(username)
  let data
  try {
    data = await httpJson(url, { headers: igHeaders(username), timeout: 12000 })
  } catch {
    return []
  }
  const user = data?.data?.user || {}
  const reels = []
  for (const edge of user.edge_owner_to_timeline_media?.edges || []) {
    const n = edge.node || {}
    if (!n.is_video) continue
    const caps = n.edge_media_to_caption?.edges || []
    const title = caps.length ? caps[0].node.text.split('\n')[0].slice(0, 120) : ''
    reels.push({
      account: username,
      title: title || '(설명 없음)',
      views: n.video_view_count || 0,
      likes: n.edge_liked_by?.count || 0,
      comments: n.edge_media_to_comment?.count || 0,
      thumbnail: n.thumbnail_src || '',
      url: 'https://www.instagram.com/reel/' + (n.shortcode || '') + '/',
      takenAt: n.taken_at_timestamp || 0,
    })
  }
  return reels
}

async function getReels(query) {
  const accounts = accountsParam(query, 'reels')
  const key = 'reels:' + accounts.join(',')
  const entry = await cached(key, query.force === '1', async () => {
    const results = await mapPool(accounts, fetchIgReels, 6)
    const merged = results.flat().filter(Boolean)
    merged.sort((a, b) => b.views - a.views)
    return merged
  })
  return { reels: entry.value.slice(0, 80), accounts, fetchedAt: entry.at }
}

// ================================================================ X (트위터)
function findTimelineEntries(node) {
  if (Array.isArray(node)) {
    for (const v of node) {
      const r = findTimelineEntries(v)
      if (r) return r
    }
  } else if (node && typeof node === 'object') {
    const tl = node.timeline
    if (tl && Array.isArray(tl.entries)) return tl.entries
    for (const v of Object.values(node)) {
      const r = findTimelineEntries(v)
      if (r) return r
    }
  }
  return null
}

async function fetchXPosts(username) {
  const url = 'https://syndication.twitter.com/srv/timeline-profile/screen-name/' + encodeURIComponent(username)
  let data
  try {
    const res = await httpGet(url, { headers: { Accept: 'text/html' }, timeout: 12000 })
    const html = await res.text()
    const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)
    if (!m) return []
    data = JSON.parse(m[1])
  } catch {
    return []
  }
  const entries = findTimelineEntries(data) || []
  const posts = []
  for (const e of entries) {
    const content = (e && e.content) || {}
    let t = content.tweet
    if (!t || typeof t !== 'object') {
      const tr = content.tweetResult || {}
      t = tr.result
    }
    if (!t || typeof t !== 'object' || t.favorite_count == null) continue
    const user = typeof t.user === 'object' ? t.user : {}
    let media = ''
    for (const mm of t.mediaDetails || []) {
      if (mm.media_url_https) { media = mm.media_url_https; break }
    }
    posts.push({
      account: username,
      name: user.name || username,
      text: (t.full_text || t.text || '').trim(),
      likes: t.favorite_count || 0,
      replies: t.reply_count || 0,
      retweets: t.retweet_count || 0,
      views: typeof t.views === 'object' ? parseInt(t.views.count || 0, 10) : 0,
      media,
      url: 'https://x.com/' + username + '/status/' + (t.id_str || ''),
      createdAt: t.created_at || '',
    })
  }
  return posts
}

async function getX(query) {
  const accounts = accountsParam(query, 'x')
  const key = 'x:' + accounts.join(',')
  const entry = await cached(key, query.force === '1', async () => {
    const results = await mapPool(accounts, fetchXPosts, 3)
    return results.flat().filter(Boolean)
  })
  return { posts: entry.value, accounts, fetchedAt: entry.at }
}

// ================================================================ 스레드(Threads)
const THREADS_DOC_IDS = ['25073444226023094', '7451607104958938', '23996318550159868',
  '9925907010825989', '26286467210919721']

async function threadsLsdAndUserId(username) {
  let lsd = null
  try {
    const res = await httpGet('https://www.threads.com/@' + encodeURIComponent(username), { timeout: 12000 })
    const html = await res.text()
    const m = html.match(/"LSD",\[\],\{"token":"([^"]+)"/)
    lsd = m ? m[1] : null
  } catch { /* ignore */ }
  let userId = null
  try {
    const info = await httpJson(
      'https://www.instagram.com/api/v1/users/web_profile_info/?username=' + encodeURIComponent(username),
      { headers: igHeaders(username), timeout: 12000 })
    userId = info?.data?.user?.id
  } catch { /* ignore */ }
  return { lsd, userId }
}

function parseThreads(data, username) {
  const posts = []
  function walk(o) {
    if (Array.isArray(o)) {
      for (const v of o) walk(v)
    } else if (o && typeof o === 'object') {
      if (o.post && typeof o.post === 'object' && o.post.caption != null) {
        const p = o.post
        const caption = typeof p.caption === 'object' ? (p.caption.text || '') : ''
        const info = p.text_post_app_info || {}
        const imgs = p.image_versions2?.candidates || []
        posts.push({
          account: username,
          text: caption.slice(0, 280),
          likes: p.like_count || 0,
          replies: info.direct_reply_count || 0,
          reposts: info.repost_count || 0,
          views: 0,
          media: imgs.length ? imgs[0].url : '',
          url: 'https://www.threads.com/@' + username + '/post/' + (p.code || ''),
          createdAt: p.taken_at || 0,
        })
      }
      for (const v of Object.values(o)) walk(v)
    }
  }
  walk(data)
  return posts
}

async function fetchThreadsPosts(username) {
  const { lsd, userId } = await threadsLsdAndUserId(username)
  if (!lsd || !userId) return []
  const headers = {
    'X-FB-LSD': lsd,
    'X-IG-App-ID': IG_APP_ID_THREADS,
    'Sec-Fetch-Site': 'same-origin',
    'X-FB-Friendly-Name': 'BarcelonaProfileThreadsTabQuery',
    'Content-Type': 'application/x-www-form-urlencoded',
  }
  for (const docId of THREADS_DOC_IDS) {
    const params = new URLSearchParams({
      lsd,
      doc_id: docId,
      variables: JSON.stringify({
        userID: String(userId),
        __relay_internal__pv__BarcelonaIsLoggedInrelayprovider: false,
      }),
    })
    let data
    try {
      const res = await httpGet('https://www.threads.com/api/graphql', { headers, body: params.toString(), timeout: 12000 })
      data = await res.json()
    } catch {
      continue
    }
    if (data.errors) continue
    const posts = parseThreads(data, username)
    if (posts.length) return posts
  }
  return []
}

async function getThreads(query) {
  const accounts = accountsParam(query, 'threads')
  const key = 'threads:' + accounts.join(',')
  const entry = await cached(key, query.force === '1', async () => {
    const results = await mapPool(accounts, fetchThreadsPosts, 5)
    return results.flat().filter(Boolean)
  })
  return { posts: entry.value, accounts, fetchedAt: entry.at }
}

// ================================================================ 틱톡(TikTok, tikwm)
function tiktokItem(v) {
  const author = typeof v.author === 'object' ? v.author : {}
  const handle = author.unique_id || ''
  const vid = v.video_id || ''
  return {
    account: handle,
    name: author.nickname || handle,
    title: (v.title || '').trim() || '(설명 없음)',
    views: v.play_count || 0,
    likes: v.digg_count || 0,
    comments: v.comment_count || 0,
    shares: v.share_count || 0,
    thumbnail: v.cover || v.origin_cover || '',
    url: 'https://www.tiktok.com/@' + handle + '/video/' + vid,
    id: vid,
    createdAt: v.create_time || 0,
  }
}

async function fetchTiktokUser(handle) {
  const url = TIKWM_BASE + '/user/posts?unique_id=' + encodeURIComponent(handle) + '&count=12'
  try {
    const d = await httpJson(url, { timeout: 15000 })
    return (d?.data?.videos || []).map(tiktokItem)
  } catch {
    return []
  }
}

async function fetchTiktokTrending() {
  const url = TIKWM_BASE + '/feed/list?region=' + TIKTOK_REGION + '&count=20'
  try {
    const d = await httpJson(url, { timeout: 15000 })
    return (d?.data || []).map(tiktokItem)
  } catch {
    return []
  }
}

async function getTiktok(query) {
  const accounts = accountsParam(query, 'tiktok')
  const key = 'tiktok:' + accounts.join(',')
  const entry = await cached(key, query.force === '1', async () => {
    const posts = await fetchTiktokTrending()
    const userChunks = await mapPool(accounts, fetchTiktokUser, 3)
    for (const chunk of userChunks) posts.push(...(chunk || []))
    const seen = new Set()
    const unique = []
    for (const p of posts) {
      if (p.id && !seen.has(p.id)) { seen.add(p.id); unique.push(p) }
    }
    return unique
  })
  return { posts: entry.value.slice(0, 100), accounts, fetchedAt: entry.at }
}

// ================================================================ AI 탭
function decodeEntities(s) {
  return String(s || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&')
}

async function fetchNews() {
  const one = async ([label, url]) => {
    let xml
    try {
      const res = await httpGet(url, { timeout: 12000 })
      xml = await res.text()
    } catch {
      return []
    }
    const items = []
    const blocks = xml.split('<item>').slice(1)
    for (const block of blocks.slice(0, 25)) {
      const pick = (tag) => {
        const m = block.match(new RegExp('<' + tag + '[^>]*>([\\s\\S]*?)</' + tag + '>'))
        return m ? decodeEntities(m[1]).trim() : ''
      }
      const pub = pick('pubDate')
      let ts = 0
      const d = pub ? Date.parse(pub) : NaN
      if (!isNaN(d)) ts = Math.floor(d / 1000)
      items.push({ region: label, title: pick('title'), source: pick('source'), link: pick('link'), ts })
    }
    return items
  }
  const results = await mapPool(NEWS_FEEDS, one, 2)
  const merged = results.flat().filter(Boolean)
  merged.sort((a, b) => b.ts - a.ts)
  return merged.slice(0, 40)
}

async function fetchHfModels() {
  const jobs = []
  for (const p of HF_PIPELINES) for (const s of ['createdAt', 'trendingScore']) jobs.push([p, s])
  const one = async ([pipeline, sort]) => {
    const url = `https://huggingface.co/api/models?pipeline_tag=${pipeline}&sort=${sort}&direction=-1&limit=12`
    try {
      const data = await httpJson(url, { timeout: 12000 })
      return data.map((m) => ({
        id: m.id || '', likes: m.likes || 0, downloads: m.downloads || 0,
        pipeline, createdAt: m.createdAt || '',
      }))
    } catch {
      return []
    }
  }
  const results = await mapPool(jobs, one, 4)
  const dedupe = (lists) => {
    const seen = new Set()
    const out = []
    for (const chunk of lists) for (const m of chunk || []) {
      if (!seen.has(m.id)) { seen.add(m.id); out.push(m) }
    }
    return out
  }
  const latest = dedupe(results.filter((_, i) => i % 2 === 0))
  latest.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
  const trending = dedupe(results.filter((_, i) => i % 2 === 1))
  return { latest: latest.slice(0, 12), trending: trending.slice(0, 12) }
}

async function getAi(query) {
  const entry = await cached('ai', query.force === '1', async () => {
    const [news, models] = await Promise.all([fetchNews(), fetchHfModels()])
    return { news, models }
  })
  return { ...entry.value, fetchedAt: entry.at }
}

// ================================================================ 이미지 프록시 / oembed
async function proxyImage(query, res) {
  const url = query.u || ''
  let host = ''
  try { host = new URL(url).hostname.toLowerCase() } catch { /* ignore */ }
  if (!url.startsWith('https://') || !IMG_PROXY_ALLOW.some((h) => host.endsWith(h))) {
    res.status(400).json({ error: 'host not allowed' })
    return
  }
  try {
    const upstream = await httpGet(url, { timeout: 12000 })
    const ctype = upstream.headers.get('content-type') || 'image/jpeg'
    const buf = Buffer.from(await upstream.arrayBuffer())
    res.setHeader('Content-Type', ctype)
    res.setHeader('Cache-Control', 'public, max-age=3600')
    res.status(200).send(buf)
  } catch {
    res.status(502).json({ error: 'fetch failed' })
  }
}

async function getOembed(query) {
  const url = query.url || ''
  let host = ''
  try { host = new URL(url).hostname.toLowerCase() } catch { /* ignore */ }
  let endpoint
  if (host.includes('tiktok.com')) {
    endpoint = 'https://www.tiktok.com/oembed?url=' + encodeURIComponent(url)
  } else if (host.includes('youtube.com') || host.includes('youtu.be')) {
    endpoint = 'https://www.youtube.com/oembed?format=json&url=' + encodeURIComponent(url)
  } else {
    return { ok: false, reason: 'unsupported' }
  }
  try {
    const data = await httpJson(endpoint, { timeout: 10000 })
    return { ok: true, title: data.title || '', author: data.author_name || '', thumbnail: data.thumbnail_url || '' }
  } catch {
    return { ok: false, reason: 'fetch_failed' }
  }
}

// ================================================================ 라우터
export default async function handler(req, res) {
  // catch-all 파라미터: 프로덕션은 req.query.path, vercel dev는 req.query['...path'].
  let segs = req.query.path ?? req.query['...path'] ?? []
  if (typeof segs === 'string') segs = segs.split('/')
  const route = (Array.isArray(segs) ? segs.join('/') : String(segs)).replace(/^\/+|\/+$/g, '')
  const query = req.query

  try {
    if (route === 'categories') {
      res.status(200).json({ categories: ['전체', 'AI', ...Object.keys(CATEGORIES)] })
      return
    }
    if (route === 'videos') { res.status(200).json(await getVideos(query)); return }
    if (route === 'reels') { res.status(200).json(await getReels(query)); return }
    if (route === 'x') { res.status(200).json(await getX(query)); return }
    if (route === 'threads') { res.status(200).json(await getThreads(query)); return }
    if (route === 'tiktok') { res.status(200).json(await getTiktok(query)); return }
    if (route === 'ai') { res.status(200).json(await getAi(query)); return }
    if (route === 'oembed') { res.status(200).json(await getOembed(query)); return }
    if (route === 'img') { await proxyImage(query, res); return }
    res.status(404).json({ error: 'not found' })
  } catch (e) {
    res.status(500).json({ error: 'server error', message: String(e?.message || e) })
  }
}
