// 로컬 설정 저장 (블로그 ID 등) — settings.json
import fs from 'node:fs'
import path from 'node:path'
import { ROOT } from './config.js'

const SETTINGS_PATH = path.join(ROOT, 'settings.json')

export function loadSettings() {
  try { return JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8')) } catch { return {} }
}

export function saveSettings(patch) {
  const next = { ...loadSettings(), ...patch }
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(next, null, 2))
  return next
}

export function getBlogId() {
  return loadSettings().blogId || ''
}

// 입력값에서 블로그 ID만 추출 (URL 붙여넣어도 됨)
export function normalizeBlogId(input) {
  return String(input || '')
    .trim()
    .replace(/^https?:\/\/(m\.)?blog\.naver\.com\//i, '')
    .replace(/[/?#].*$/, '')
    .trim()
}

export function writeUrlFor(blogId) {
  return `https://blog.naver.com/${blogId}?Redirect=Write`
}
