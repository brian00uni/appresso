// 웹앱(VideoDL Studio) ↔ 크롬 익스텐션 설치감지 브리지
//
// [동작 원리]
// 웹페이지는 chrome.runtime.sendMessage(EXTENSION_ID, ...) 로 익스텐션에 메시지를 보낼 수 있다.
// 익스텐션 쪽 manifest.json 에 우리 도메인을 externally_connectable 로 허용하고,
// background 에서 onMessageExternal 핸들러를 등록해야 한다.
//
// [익스텐션 패치] — 이미 적용됨: 프로젝트 내 videoDlStudio/ 폴더
//  - videoDlStudio/manifest.json    : externally_connectable.matches 추가
//  - videoDlStudio/background.js     : onMessageExternal 핸들러 (VIDEO_DL_PING)
//  자세한 로드/연동 방법은 videoDlStudio/README.md 참고.

// 크롬 웹스토어 등록 후 발급되는 고정 확장 ID를 넣으세요.
// (개발 중 unpacked 확장은 ID가 매번 달라지므로 localStorage 'videoDlExtId' 로 임시 지정 가능)
export const EXTENSION_ID =
  (typeof localStorage !== 'undefined' && localStorage.getItem('videoDlExtId')) || '' // TODO: 웹스토어 발급 ID

function runtime() {
  return (typeof window !== 'undefined' && window.chrome && window.chrome.runtime) || null
}

/** 콘텐츠 스크립트가 남긴 DOM 마커로 설치 감지 (확장 ID 불필요) */
function hasExtMarker() {
  return (
    typeof document !== 'undefined' &&
    document.documentElement.getAttribute('data-videodl-ext') === '1'
  )
}

/** 익스텐션 설치/연결 여부 확인 — 마커를 최대 ~2초간 폴링(+ 이벤트/ID PING 폴백) */
export function pingExtension() {
  return new Promise((resolve) => {
    let done = false
    let timer = null
    // 함수 선언(hoist)으로 초기화 순서 문제(TDZ) 방지
    function onPresent() { finish(true) }
    function finish(v) {
      if (done) return
      done = true
      if (typeof window !== 'undefined') window.removeEventListener('videodl-ext-present', onPresent)
      if (timer) clearInterval(timer)
      resolve(v)
    }

    // 1) content-script(appresso-detect.js)가 남긴 DOM 마커/이벤트로 감지 — ID 불필요
    if (hasExtMarker()) return finish(true)
    if (typeof window !== 'undefined') window.addEventListener('videodl-ext-present', onPresent)

    // 2) 주입 타이밍 대비 폴링 (250ms × 8 ≈ 2초)
    let tries = 0
    timer = setInterval(() => {
      if (hasExtMarker()) return finish(true)
      if (++tries >= 8) {
        clearInterval(timer)
        // 3) 확장 ID가 설정된 경우(웹스토어 배포 등) externally_connectable PING
        const cr = runtime()
        if (!cr || !cr.sendMessage || !EXTENSION_ID) return finish(false)
        try {
          cr.sendMessage(EXTENSION_ID, { type: 'VIDEO_DL_PING' }, (res) => {
            finish(!cr.lastError && !!(res && res.ok))
          })
        } catch {
          finish(false)
        }
      }
    }, 250)
  })
}
