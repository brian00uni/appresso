// 웹앱(Art Studio) ↔ 크롬 익스텐션 프롬프트 연동 브리지
//
// [동작 원리]
// 웹페이지는 chrome.runtime.sendMessage(EXTENSION_ID, ...) 로 익스텐션에 메시지를 보낼 수 있다.
// 단, 익스텐션 쪽 manifest.json 에 우리 도메인을 externally_connectable 로 허용하고,
// background 에서 onMessageExternal 핸들러를 등록해야 한다. (아래 [익스텐션 패치] 참고)
//
// [익스텐션 패치] — 이미 적용됨: 프로젝트 내 flowArtStudio/ 폴더
//  - flowArtStudio/manifest.json  : externally_connectable.matches 추가
//  - flowArtStudio/src/background.js : onMessageExternal 핸들러 (PING / PROMPTS)
//  - flowArtStudio/src/main.js    : artStudioInbox 를 읽어 사이드패널 자동 입력
//  자세한 로드/연동 방법은 flowArtStudio/README.md 참고.

// 크롬 웹스토어 등록 후 발급되는 고정 확장 ID를 넣으세요.
// (개발 중 unpacked 확장은 ID가 매번 달라지므로 localStorage 'artStudioExtId' 로 임시 지정 가능)
export const EXTENSION_ID =
  (typeof localStorage !== 'undefined' && localStorage.getItem('artStudioExtId')) || 'pcgckegkabbhghlgggkhnhocfooncgof' // TODO: 웹스토어 발급 ID

function runtime() {
  return (typeof window !== 'undefined' && window.chrome && window.chrome.runtime) || null
}

/** 익스텐션 설치/연결 여부 확인 (ping) */
export function pingExtension() {
  return new Promise((resolve) => {
    const cr = runtime()
    if (!cr || !cr.sendMessage || !EXTENSION_ID) return resolve(false)
    try {
      cr.sendMessage(EXTENSION_ID, { type: 'ART_STUDIO_PING' }, (res) => {
        if (cr.lastError) return resolve(false)
        resolve(!!(res && res.ok))
      })
    } catch {
      resolve(false)
    }
  })
}

/** 프롬프트/설정 payload 를 익스텐션으로 전송 */
export function sendPrompts(payload) {
  return new Promise((resolve, reject) => {
    const cr = runtime()
    if (!cr || !cr.sendMessage || !EXTENSION_ID) return reject(new Error('NO_EXTENSION'))
    try {
      cr.sendMessage(EXTENSION_ID, { type: 'ART_STUDIO_PROMPTS', payload }, (res) => {
        if (cr.lastError) return reject(new Error(cr.lastError.message))
        if (res && res.ok) resolve(res)
        else reject(new Error('REJECTED'))
      })
    } catch (e) {
      reject(e)
    }
  })
}
