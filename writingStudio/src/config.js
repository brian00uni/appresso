// Writing Studio 공통 설정 (경로 · URL)
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const ROOT = path.resolve(__dirname, '..')
export const AUTH_DIR = path.join(ROOT, 'auth')
export const SESSION_PATH = path.join(AUTH_DIR, 'naver.session.json')

// 네이버
export const NAVER_LOGIN_URL = 'https://nid.naver.com/nidlogin.login'
export const NAVER_HOME = 'https://www.naver.com'
// 로그인 상태에서 접속하면 "내 블로그"로 리다이렉트 → 내 블로그 ID 감지에 사용
export const MY_BLOG_URL = 'https://blog.naver.com/MyBlog.naver'

// 로그인 완료 판단에 쓰는 세션 쿠키 이름
export const LOGIN_COOKIE = 'NID_SES'

// 대상 블로그는 settings.json 에서 관리 (대시보드에서 입력) — src/settings.js

// 분석 산출물 폴더
export const INSPECT_DIR = path.join(ROOT, 'inspect')
