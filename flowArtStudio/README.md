# flowArtStudio — 크롬 확장앱 (Flow 자동화)

Art Studio 웹앱과 연동되는 크롬 확장앱 소스입니다. Google Flow에서 프롬프트 일괄 전송 ·
자동 번역 · 이미지 자동 저장을 수행합니다. (원본: "AI크래프터 플로우 자동화")

## 개발용 로드 방법

1. 크롬 → `chrome://extensions` 접속
2. 우측 상단 **개발자 모드** 켜기
3. **압축해제된 확장 프로그램을 로드** → 이 `flowArtStudio` 폴더 선택
4. 로드되면 표시되는 **확장 ID**(예: `abcdef...`)를 복사

## 웹앱(Art Studio)과 연동

확장앱 ID를 웹앱이 알아야 메시지를 보낼 수 있습니다.

- **개발 중(unpacked)**: 확장 ID가 매번 바뀌므로, Art Studio 페이지(`/art-studio`)를 연 뒤
  브라우저 콘솔에서 아래 실행:
  ```js
  localStorage.setItem('artStudioExtId', '<위에서 복사한 확장 ID>')
  ```
- **웹스토어 등록 후**: 발급된 고정 ID를 `src/pages/artStudio/extensionBridge.js` 의
  `EXTENSION_ID` 에 직접 넣으면 됩니다.

연결되면 웹앱의 **"🧩 익스텐션으로 프롬프트 보내기"** 버튼이 사이드패널 프롬프트 칸을
자동으로 채웁니다.

## 연동 코드 위치

| 파일 | 추가된 내용 |
|------|------------|
| `manifest.json` | `externally_connectable.matches` — 웹앱 도메인 허용 |
| `src/background.js` | `onMessageExternal` 핸들러 (`ART_STUDIO_PING` / `ART_STUDIO_PROMPTS`) |
| `src/main.js` | `chrome.storage.local` 의 `artStudioInbox` 를 읽어 사이드패널 자동 입력 |

> `externally_connectable.matches` 의 도메인은 실제 배포 주소에 맞게 조정하세요.
> (현재: `http://localhost:5173/*`, `https://appresso.vercel.app/*`)
