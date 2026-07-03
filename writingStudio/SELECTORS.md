# 스마트에디터 ONE 셀렉터 분석 (2026-07-04 캡처)

글쓰기 진입: `https://blog.naver.com/{blogId}?Redirect=Write`
→ 에디터는 **`#mainFrame` iframe** (`PostWriteForm.naver?blogId={blogId}`) 안에 로드됨.
→ 모든 셀렉터는 이 mainFrame **프레임 내부** 기준.

## 핵심 셀렉터

| 대상 | 셀렉터 | 비고 |
|------|--------|------|
| 제목 컴포넌트 | `.se-component.se-documentTitle` | `data-a11y-title="제목"` |
| 제목 편집 문단 | `.se-documentTitle .se-title-text .se-text-paragraph` | placeholder "제목" |
| 본문 컴포넌트 | `.se-component.se-text` | 문단 단위 |
| 본문 문단 | `.se-text-paragraph` (예: `.se-text-paragraph-align-left`) | 여러 개 |
| 에디터 컨테이너 | `.se-content` | 전체 편집 영역 |
| 상단 툴바 | `.se-toolbar` | 사진/동영상/링크/표… |
| 사진(이미지) 버튼 | 툴바의 "사진" 항목 | 클릭 시 파일 선택 |
| 도움말 패널 | 로드시 우측에 `도움말` 패널이 열림 | 자동화 전 닫기 권장 |

## 중요: 입력(글 채우기) 전략

- 스마트에디터 ONE은 **일반적인 보이는 `contenteditable` div를 쓰지 않는다.**
  실제로 존재하는 `contenteditable="true"` 요소는 화면 밖(`left:-9999px`)의
  **클립보드 브리지**(`allow="clipboard-read"`)뿐이다.
- 따라서 `.se-text-paragraph` 에 직접 타이핑하면 자동완성/줄바꿈 처리로 깨지기 쉽다.
  → **문단 클릭(포커스) 후 `keyboard.insertText()` 또는 클립보드 붙여넣기(Ctrl+V)** 가 안정적.
  → 서식 있는 본문은 **HTML을 클립보드에 올려 붙여넣기**가 가장 안정적.

## 자동화 흐름(예정)

1. 저장 세션으로 write URL 진입 → mainFrame 확보
2. 도움말 패널 닫기(있으면)
3. 제목 문단 클릭 → 제목 입력
4. 본문 영역 클릭 → 본문 붙여넣기(문단/이미지)
5. **임시저장까지만** → 사람이 검수 후 발행

## 산출물
- `inspect/write-page.png` — 렌더된 에디터 스크린샷
- `inspect/editor-frame.html` — mainFrame 전체 HTML
- `inspect/selector-report.json` — 프로브 결과
