// Writing Studio 로컬 대시보드 서버
// 실행: npm run ui  →  http://localhost:4577
//
// 화면에서: 블로그 주소 입력 · 저장 / "네이버 로그인" 버튼(진짜 로그인 창 열림) / 세션 상태 확인
import express from 'express'
import path from 'node:path'
import { ROOT } from './src/config.js'
import { loadSettings, saveSettings, normalizeBlogId } from './src/settings.js'
import { saveSession, getStatus } from './src/naver.js'
import { generateContent } from './src/generate.js'
import { fillEditor } from './src/editor.js'

// .env 로드 (GEMINI_API_KEY)
try { process.loadEnvFile(path.join(ROOT, '.env')) } catch {}

const app = express()
app.use(express.json())
app.use(express.static(path.join(ROOT, 'public')))

let loginBusy = false

// 세션/설정 상태
app.get('/api/status', async (req, res) => {
  try {
    const s = await getStatus()
    const blogId = loadSettings().blogId || ''
    const matches = s.account && blogId ? s.account === blogId : null
    res.json({ ...s, blogId, matches, loginBusy, hasApiKey: !!process.env.GEMINI_API_KEY })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// 글 생성만 (미리보기)
app.post('/api/generate', async (req, res) => {
  const { topic, keywords, tone, contentPrompt } = req.body || {}
  try {
    const content = await generateContent({ topic, keywords, tone, contentPrompt })
    res.json({ ok: true, content })
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message })
  }
})

// 원클릭: 생성 → 에디터 채우기 (창을 열어둔 채 사람이 검수·발행)
let runBusy = false
app.post('/api/run', async (req, res) => {
  if (runBusy) return res.status(409).json({ ok: false, error: '이미 실행 중입니다.' })
  const { topic, keywords, tone, contentPrompt, content: given } = req.body || {}
  runBusy = true
  try {
    // 이미 생성한 content 를 넘기면 그걸 쓰고, 없으면 새로 생성
    const content = given && given.title ? given : await generateContent({ topic, keywords, tone, contentPrompt })
    await fillEditor(content, { headed: true, keepOpen: true, onLog: (m) => console.log('[run]', m) })
    res.json({ ok: true, content })
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message })
  } finally {
    runBusy = false
  }
})

// 블로그 주소 저장
app.post('/api/blog', (req, res) => {
  const blogId = normalizeBlogId(req.body.blogId)
  if (!blogId) return res.status(400).json({ ok: false, error: '블로그 주소를 입력하세요.' })
  saveSettings({ blogId })
  res.json({ ok: true, blogId })
})

// 네이버 로그인 창 열기 → 로그인 감지 시 세션 저장 (수 분 걸릴 수 있음)
app.post('/api/login', async (req, res) => {
  if (loginBusy) return res.status(409).json({ ok: false, error: '이미 로그인 진행 중입니다.' })
  loginBusy = true
  try {
    const { account } = await saveSession()
    res.json({ ok: true, account })
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message })
  } finally {
    loginBusy = false
  }
})

const PORT = process.env.PORT || 4577
app.listen(PORT, () => {
  console.log(`\n📝 Writing Studio 대시보드 → http://localhost:${PORT}\n`)
})
