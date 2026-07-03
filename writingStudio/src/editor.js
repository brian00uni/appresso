// 스마트에디터 ONE 자동 입력 (재사용 모듈) — CLI(fillEditor.js)와 서버(server.js)가 공유
//
// ⚠️ 발행(게시)은 절대 하지 않는다. 최종 발행은 사람이 검수 후 직접.
import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'
import { SESSION_PATH, INSPECT_DIR, LOGIN_COOKIE } from './config.js'
import { getBlogId, writeUrlFor } from './settings.js'

// 열어둔 브라우저 참조 유지(GC 방지) — keepOpen 모드
const openBrowsers = new Set()

/**
 * 저장된 세션으로 글쓰기 에디터를 열고 제목·본문을 채운다.
 * @param {{title:string, paragraphs:string[]}} content
 * @param {{headed?:boolean, keepOpen?:boolean, save?:boolean, onLog?:Function}} opts
 * @returns {Promise<{screenshot:string, blogId:string}>}
 */
export async function fillEditor(content, opts = {}) {
  const { headed = false, keepOpen = false, save = false, onLog = () => {} } = opts
  const title = content.title || ''
  const paragraphs = (content.paragraphs && content.paragraphs.length ? content.paragraphs : ['']).slice()

  if (!fs.existsSync(SESSION_PATH)) throw new Error('세션이 없습니다. 먼저 로그인하세요.')
  const blogId = getBlogId()
  if (!blogId) throw new Error('블로그 ID가 설정되지 않았습니다.')
  fs.mkdirSync(INSPECT_DIR, { recursive: true })

  const browser = await chromium.launch({ headless: !headed })
  if (keepOpen) openBrowsers.add(browser)
  const context = await browser.newContext({
    storageState: SESSION_PATH,
    viewport: { width: 1440, height: 1000 },
    permissions: ['clipboard-read', 'clipboard-write'],
  })
  const page = await context.newPage()

  const url = writeUrlFor(blogId)
  onLog(`글쓰기 페이지 열기: ${url}`)
  await page.goto(url, { waitUntil: 'domcontentloaded' })

  if (!(await context.cookies()).some((c) => c.name === LOGIN_COOKIE)) {
    if (!keepOpen) await browser.close().catch(() => {})
    throw new Error('세션이 만료되었습니다. 다시 로그인하세요.')
  }

  const editor = page.frameLocator('#mainFrame')
  onLog('에디터 로딩 대기...')
  await editor.locator('.se-documentTitle').first().waitFor({ state: 'visible', timeout: 30000 })
  await page.waitForTimeout(1500)
  await page.keyboard.press('Escape').catch(() => {}) // 도움말 패널 닫기 시도

  // 제목
  onLog('제목 입력')
  await editor.locator('.se-documentTitle .se-text-paragraph').first().click()
  await page.waitForTimeout(300)
  await page.keyboard.insertText(title)

  // 본문
  onLog('본문 입력')
  await editor.locator('.se-component.se-text .se-text-paragraph').first().click()
  await page.waitForTimeout(300)
  for (let i = 0; i < paragraphs.length; i++) {
    if (i > 0) await page.keyboard.press('Enter')
    await page.keyboard.insertText(paragraphs[i])
    await page.waitForTimeout(120)
  }

  await page.waitForTimeout(800)
  const shot = path.join(INSPECT_DIR, 'fill-result.png')
  await page.screenshot({ path: shot })
  onLog(`스크린샷 저장: ${shot}`)

  if (save) {
    onLog('임시저장 시도 (발행 아님)')
    try {
      await editor.getByRole('button', { name: '저장', exact: true }).first().click({ timeout: 5000 })
      await page.waitForTimeout(1500)
    } catch (e) {
      onLog('임시저장 버튼을 못 찾음: ' + String(e).split('\n')[0])
    }
  }

  if (!keepOpen) await browser.close().catch(() => {})
  // keepOpen: 브라우저를 열어둔 채 반환 (사람이 검수 후 발행). 창을 닫으면 정리.
  else browser.on('disconnected', () => openBrowsers.delete(browser))

  return { screenshot: shot, blogId }
}
