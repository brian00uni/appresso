# VideoDL Studio — 크롬 확장앱 (영상 일괄 다운로드)

VideoDL Studio 웹앱(`/video-dl-studio`)과 연동되는 크롬 확장앱 소스입니다.
**더우인 · 틱톡 · 레드노트(샤오홍슈)** 검색 결과에서 영상 카드를 선택해 한 번에
추출·다운로드합니다.

## 지원 사이트

| 사이트 | 도메인 | 추출 |
|--------|--------|------|
| 더우인 | douyin.com | 영상 |
| 틱톡 | tiktok.com | 영상 |
| 레드노트(샤오홍슈) | rednote.com / xiaohongshu.com | 영상 |

## 개발용 로드 방법

1. 크롬 → `chrome://extensions` 접속
2. 우측 상단 **개발자 모드** 켜기
3. **압축해제된 확장 프로그램을 로드** → 이 `videoDlStudio` 폴더 선택
4. 로드되면 표시되는 **확장 ID** 를 복사

## 사용 흐름

1. 지원 사이트 검색 결과 페이지로 이동 → 각 카드에 체크박스가 자동 표시
2. 다운로드할 카드 체크 → 하단 **미디어 추출** 버튼
3. 사이드패널에서 실시간 진행 확인 → **전체 다운로드**
4. 저장 경로: `~/Downloads/videodl-studio/YYYY-MM-DD/HH_MM_SS_플랫폼/`

## 웹앱(VideoDL Studio)과 연동

확장앱 ID를 웹앱이 알아야 설치 감지가 됩니다.

- **개발 중(unpacked)**: 확장 ID가 매번 바뀌므로 `/video-dl-studio` 페이지를 연 뒤
  브라우저 콘솔에서:
  ```js
  localStorage.setItem('videoDlExtId', '<위에서 복사한 확장 ID>')
  ```
- **웹스토어 등록 후**: 고정 ID를 `src/pages/videoDlStudio/extensionBridge.js` 의
  `EXTENSION_ID` 에 직접 넣으면 됩니다.

## 연동 코드 위치

| 파일 | 내용 |
|------|------|
| `manifest.json` | `externally_connectable.matches` — 웹앱 도메인 허용 |
| `background.js` | `onMessageExternal` 핸들러 (`VIDEO_DL_PING`) |

> `externally_connectable.matches` 도메인은 실제 배포 주소에 맞게 조정하세요.
> (현재: `http://localhost:5173/*`, `https://appresso.vercel.app/*`)
