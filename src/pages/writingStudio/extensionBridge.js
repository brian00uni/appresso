// 웹앱(Writing Studio) ↔ 크롬 익스텐션 설치감지 브리지
// content-script(appresso-detect.js)가 남긴 DOM 마커로 설치 여부를 감지한다. (확장 ID 불필요)

function hasExtMarker() {
  return (
    typeof document !== 'undefined' &&
    document.documentElement.getAttribute('data-writing-studio-ext') === '1'
  )
}

/** 익스텐션 설치 여부 확인 — 마커를 최대 ~2초간 폴링 */
export function pingExtension() {
  return new Promise((resolve) => {
    let done = false
    let timer = null
    function onPresent() { finish(true) }
    function finish(v) {
      if (done) return
      done = true
      if (typeof window !== 'undefined') window.removeEventListener('writing-studio-ext-present', onPresent)
      if (timer) clearInterval(timer)
      resolve(v)
    }

    if (hasExtMarker()) return finish(true)
    if (typeof window !== 'undefined') window.addEventListener('writing-studio-ext-present', onPresent)

    let tries = 0
    timer = setInterval(() => {
      if (hasExtMarker()) return finish(true)
      if (++tries >= 8) { clearInterval(timer); finish(false) }
    }, 250)
  })
}
