// 스마트에디터 ONE 셀렉터 분석 — 저장된 세션으로 글쓰기 페이지를 열어 구조를 덤프한다.
//
// 실행: npm run inspect            (헤드리스, 자동 덤프)
//       HEADED=1 npm run inspect   (창을 띄워 눈으로 확인)
//
// 산출물: inspect/ 폴더에 스크린샷 + 에디터(iframe) HTML + 셀렉터 리포트(JSON)

import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'
import { SESSION_PATH, INSPECT_DIR, LOGIN_COOKIE } from './config.js'
import { getBlogId, writeUrlFor } from './settings.js'

// 스마트에디터 ONE 후보 셀렉터 (존재/개수/샘플텍스트를 프로브)
const PROBES = {
  '제목 영역(documentTitle)': '.se-section-documentTitle',
  '제목 텍스트(placeholder 포함)': '.se-documentTitle .se-text-paragraph, .se-title-text',
  '제목 placeholder': '.se-section-documentTitle .se-placeholder',
  '본문 컴포넌트(se-component)': '.se-component',
  '본문 텍스트 문단(se-text-paragraph)': '.se-text-paragraph',
  '편집영역(contenteditable)': '[contenteditable="true"]',
  '에디터 컨테이너(se-content)': '.se-content',
  '툴바(se-toolbar)': '.se-toolbar',
  '이미지 버튼(사진)': 'button.se-image-toolbar-button, button[data-name="image"], .se-toolbar-item-image',
  '파일 input': 'input[type="file"]',
  '드래프트 복원 팝업': '.se-popup, .se_popup, .layer_pop',
}

async function probeFrame(frame) {
  const out = {}
  for (const [label, sel] of Object.entries(PROBES)) {
    try {
      const els = await frame.$$(sel)
      let sample = ''
      if (els[0]) {
        sample = ((await els[0].innerText().catch(() => '')) || '').trim().slice(0, 40)
      }
      out[label] = { selector: sel, count: els.length, sample }
    } catch (e) {
      out[label] = { selector: sel, error: String(e).split('\n')[0] }
    }
  }
  return out
}

async function main() {
  if (!fs.existsSync(SESSION_PATH)) {
    console.error(`세션 파일이 없습니다: ${SESSION_PATH}\n먼저 npm run login 을 실행하세요.`)
    process.exit(1)
  }
  const blogId = getBlogId()
  if (!blogId) {
    console.error('블로그 ID가 설정되지 않았습니다. 대시보드(npm run ui)에서 블로그 주소를 먼저 저장하세요.')
    process.exit(1)
  }
  const WRITE_URL = writeUrlFor(blogId)
  fs.mkdirSync(INSPECT_DIR, { recursive: true })

  const headed = !!process.env.HEADED
  const browser = await chromium.launch({ headless: !headed })
  const context = await browser.newContext({ storageState: SESSION_PATH, viewport: { width: 1440, height: 1000 } })
  const page = await context.newPage()

  console.log(`[inspect] 글쓰기 페이지 열기: ${WRITE_URL}`)
  await page.goto(WRITE_URL, { waitUntil: 'domcontentloaded' })

  // 로그인 유효성
  const loggedIn = (await context.cookies()).some((c) => c.name === LOGIN_COOKIE)
  if (!loggedIn) console.warn('⚠ 세션이 만료된 것 같습니다. npm run login 후 다시 시도하세요.')

  // 스마트에디터는 #mainFrame iframe 안에 로드됨 — 프레임 등장 대기
  console.log('[inspect] mainFrame 로딩 대기...')
  await page.waitForTimeout(6000)

  // 최상위 프레임 목록
  const topFrames = page.frames().map((f) => ({ name: f.name(), url: f.url() }))

  // 에디터가 있을 만한 프레임 선택: se-content / contenteditable 이 있는 프레임
  let editorFrame = null
  for (const f of page.frames()) {
    try {
      const has = await f.$('.se-content, .se-container, [contenteditable="true"]')
      if (has) { editorFrame = f; break }
    } catch {}
  }

  const report = {
    writeUrl: WRITE_URL,
    loggedIn,
    topFrames,
    editorFrameUrl: editorFrame ? editorFrame.url() : null,
    probes: null,
    nestedFrames: null,
  }

  if (editorFrame) {
    report.probes = await probeFrame(editorFrame)
    report.nestedFrames = editorFrame.childFrames().map((f) => ({ name: f.name(), url: f.url() }))
    // 에디터 프레임 HTML 저장
    try {
      const html = await editorFrame.content()
      fs.writeFileSync(path.join(INSPECT_DIR, 'editor-frame.html'), html)
    } catch (e) {
      console.warn('editor-frame.html 저장 실패:', String(e).split('\n')[0])
    }
  } else {
    console.warn('⚠ 에디터 프레임을 찾지 못했습니다. (팝업/로그인/로딩 지연 가능)')
    // 전체 페이지 HTML 저장(디버그용)
    fs.writeFileSync(path.join(INSPECT_DIR, 'page.html'), await page.content())
  }

  // 스크린샷 + 리포트 저장
  await page.screenshot({ path: path.join(INSPECT_DIR, 'write-page.png'), fullPage: false })
  fs.writeFileSync(path.join(INSPECT_DIR, 'selector-report.json'), JSON.stringify(report, null, 2))

  console.log('\n===== 셀렉터 리포트 =====')
  console.log('로그인:', loggedIn)
  console.log('최상위 프레임:')
  for (const f of topFrames) console.log('  -', f.name || '(no-name)', '→', f.url.slice(0, 80))
  console.log('에디터 프레임:', report.editorFrameUrl || '(없음)')
  if (report.probes) {
    console.log('\n프로브 결과:')
    for (const [label, r] of Object.entries(report.probes)) {
      const info = r.error ? `ERROR ${r.error}` : `count=${r.count}${r.sample ? `  예:"${r.sample}"` : ''}`
      console.log(`  [${r.count ? '✓' : ' '}] ${label.padEnd(28)} ${info}`)
    }
  }
  console.log(`\n산출물 → ${INSPECT_DIR}/ (write-page.png, editor-frame.html, selector-report.json)`)

  await browser.close()
}

main().catch((e) => { console.error(e); process.exit(1) })
