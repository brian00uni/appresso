export const EYES_API_BASE = 'https://eyes-api.onrender.com'

export async function postJson(path, body) {
  const res = await fetch(`${EYES_API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const contentType = res.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new Error('API 서버에서 올바른 응답을 받지 못했습니다. 해당 기능이 아직 준비 중일 수 있습니다.')
  }
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || '요청에 실패했습니다.')
  return data
}

export function extractYouTubeVideoId(value) {
  const raw = String(value || '').trim()
  if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) return raw

  try {
    const url = new URL(raw)
    const host = url.hostname.replace(/^www\./, '')

    if (host === 'youtu.be') {
      const id = url.pathname.split('/').filter(Boolean)[0]
      return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : ''
    }

    if (host.endsWith('youtube.com')) {
      const watchId = url.searchParams.get('v')
      if (/^[a-zA-Z0-9_-]{11}$/.test(watchId || '')) return watchId

      const pathParts = url.pathname.split('/').filter(Boolean)
      const videoId = pathParts.find((part) => /^[a-zA-Z0-9_-]{11}$/.test(part))
      return videoId || ''
    }
  } catch {
    return ''
  }

  return ''
}

function sanitizeFilename(value) {
  return String(value)
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120) || 'youtube-video'
}

function getDownloadFilename(res, videoId, title) {
  const disposition = res.headers.get('content-disposition') || ''
  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i)
  const asciiMatch = disposition.match(/filename="([^"]+)"/i)
  const rawName = utf8Match?.[1] ? decodeURIComponent(utf8Match[1]) : asciiMatch?.[1]

  return rawName || `${sanitizeFilename(title || videoId)}.mp4`
}

export async function downloadYoutubeVideo({ videoId, title }) {
  const params = new URLSearchParams({ title: title || videoId })
  const res = await fetch(`${EYES_API_BASE}/api/youtube/download/${videoId}?${params.toString()}`)
  const contentType = res.headers.get('content-type') || ''

  if (!res.ok) {
    const data = contentType.includes('application/json') ? await res.json() : null
    throw new Error(data?.message || '다운로드에 실패했습니다.')
  }

  if (!contentType.startsWith('video/')) {
    throw new Error('영상 파일이 아닌 응답을 받았습니다.')
  }

  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = getDownloadFilename(res, videoId, title)
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
