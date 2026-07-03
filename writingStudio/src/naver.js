// 네이버 세션 관련 공통 로직 (CLI · 대시보드 서버가 공유)
import { chromium } from 'playwright'
import fs from 'node:fs'
import { AUTH_DIR, SESSION_PATH, NAVER_LOGIN_URL, MY_BLOG_URL, LOGIN_COOKIE } from './config.js'

/** 로그인 상태에서 MyBlog.naver 진입 시 리다이렉트되는 "내 블로그 ID"를 감지 */
export async function detectAccountBlogId(context) {
  const page = await context.newPage()
  try {
    await page.goto(MY_BLOG_URL, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(1200)
    const m = page.url().match(/blog\.naver\.com\/([A-Za-z0-9_-]+)/)
    return m && m[1] !== 'MyBlog.naver' ? m[1] : null
  } catch {
    return null
  } finally {
    await page.close().catch(() => {})
  }
}

/** 네이버 로그인 창(headed)을 열고, 로그인 감지되면 세션 저장. { account } 반환 */
export async function saveSession({ onLog = () => {} } = {}) {
  fs.mkdirSync(AUTH_DIR, { recursive: true })
  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext()
  const page = await context.newPage()

  onLog('네이버 로그인 창을 열었습니다. 브라우저에서 직접 로그인하세요.')
  await page.goto(NAVER_LOGIN_URL, { waitUntil: 'domcontentloaded' })

  const deadline = Date.now() + 5 * 60 * 1000
  let ok = false
  while (Date.now() < deadline) {
    try {
      const cookies = await context.cookies()
      if (cookies.some((c) => c.name === LOGIN_COOKIE)) { ok = true; break }
    } catch { break }
    await page.waitForTimeout(2000)
  }

  if (!ok) {
    await browser.close().catch(() => {})
    throw new Error('로그인이 감지되지 않았습니다 (시간 초과 또는 창 닫힘).')
  }

  await context.storageState({ path: SESSION_PATH })
  const account = await detectAccountBlogId(context)
  await browser.close().catch(() => {})
  onLog('세션 저장 완료.')
  return { account }
}

/** 저장된 세션 상태 확인 (headless). { hasSession, valid, account } */
export async function getStatus() {
  if (!fs.existsSync(SESSION_PATH)) return { hasSession: false, valid: false, account: null }
  const browser = await chromium.launch({ headless: true })
  try {
    const context = await browser.newContext({ storageState: SESSION_PATH })
    const cookies = await context.cookies()
    const hasCookie = cookies.some((c) => c.name === LOGIN_COOKIE)
    const account = hasCookie ? await detectAccountBlogId(context) : null
    return { hasSession: true, valid: hasCookie && !!account, account }
  } finally {
    await browser.close().catch(() => {})
  }
}
