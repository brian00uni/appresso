# eyeDesk

사내 업무 관리 + 유튜브 채널 분석 + 미니 앱을 통합한 웹 대시보드 서비스.

---

## 기술 스택

| 분류 | 사용 기술 |
|------|----------|
| 프레임워크 | React 19 + Vite 6 |
| 스타일 | Tailwind CSS v4 |
| 상태 관리 | Zustand v5 |
| 라우팅 | React Router DOM v7 |
| 인증 / DB | Supabase |
| 차트 | Chart.js v4 + chartjs-adapter-moment |
| 외부 API | YouTube Data API v3 |
| UI 유틸 | @radix-ui/react-popover, react-day-picker, date-fns |

---

## 환경 변수

프로젝트 루트에 `.env` 파일을 생성하고 아래 값을 설정합니다.

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_YOUTUBE_API_KEY=your_youtube_data_api_v3_key
```

---

## 시작하기

```bash
npm install
npm run dev      # 개발 서버 (http://localhost:5173)
npm run build    # 프로덕션 빌드 → dist/
npm run preview  # 빌드 결과 미리보기
```

---

## 라우팅 구조

```
/                          # 유튜브 채널 분석 (공개)
/apps                      # Funny App 목록 (공개)
/apps/fortune-cookie       # 포춘쿠키 앱 (공개)
/login                     # 로그인 (Supabase 이메일/비밀번호)
/dashboard                 # 대시보드 메인 (로그인 필요)
/dashboard/youtube         # 유튜브 분석 (대시보드 내)
/dashboard/apps            # Funny App 목록 (대시보드 내)
/dashboard/apps/fortune-cookie  # 포춘쿠키 (대시보드 내)
```

미인증 상태에서 `/dashboard` 접근 시 `/login`으로 리다이렉트됩니다.

---

## 페이지 및 기능

### 유튜브 채널 분석 (`/`)
- YouTube Data API v3를 사용해 채널 정보를 조회
- **TOP 순위**: 지역별 인기 동영상 기준 채널 목록
- **채널 검색**: 채널명 키워드 검색
- 필터: 지역(한국 / 해외 / 전체), 최소 구독자 수, 표시 개수(50 / 100 / 200)
- 표시 정보: 순위, 썸네일, 채널명, 구독자 수, 영상 수, 총 조회수, 국가

### Funny App (`/apps`)
현재 제공 중인 미니 앱 목록.

| 앱 | 경로 | 설명 |
|----|------|------|
| 포춘쿠키 | `/apps/fortune-cookie` | 쿠키를 깨면 랜덤 운세 문구 출력 |

### 로그인 (`/login`)
- Supabase `signInWithPassword` 기반 이메일 + 비밀번호 인증
- 로그인 성공 시 `/dashboard`로 이동
- 이미 로그인된 상태면 자동으로 `/dashboard` 리다이렉트

### 대시보드 (`/dashboard`)
- 사이드바 + 헤더 레이아웃
- 인증 가드: 미로그인 시 `/login`으로 리다이렉트
- 사이드바 메뉴 (`src/config/navigation.ts`):
  - 대시보드
  - 유튜브 분석
  - 공지사항
  - 업무일정
  - 문서자료
  - 조직도

---

## 디렉토리 구조

```
src/
├── App.jsx                    # 전체 라우팅 정의
├── main.jsx                   # 앱 진입점
├── charts/                    # Chart.js 차트 컴포넌트
│   ├── ChartjsConfig.jsx      # Chart.js 전역 설정
│   ├── BarChart01~03.jsx
│   ├── LineChart01~02.jsx
│   ├── DoughnutChart.jsx
│   └── RealtimeChart.jsx
├── components/                # 공통 UI 컴포넌트
│   ├── Layout/                # AppLayout, Header, Sidebar (TSX)
│   ├── ui/                    # calendar, popover (Radix UI 기반)
│   ├── Datepicker.jsx
│   ├── DropdownEditMenu.jsx
│   ├── DropdownFilter.jsx
│   ├── DropdownHelp.jsx
│   ├── DropdownNotifications.jsx
│   ├── DropdownProfile.jsx
│   ├── ModalSearch.jsx
│   ├── ThemeToggle.jsx
│   └── Tooltip.jsx
├── config/
│   └── navigation.ts          # 대시보드 사이드바 메뉴 정의
├── css/
│   └── style.css              # Tailwind + 커스텀 스타일
├── hooks/
│   └── useAuth.js             # Supabase 세션 초기화 훅
├── lib/
│   └── supabase.js            # Supabase 클라이언트
├── pages/
│   ├── Dashboard.jsx          # 대시보드 메인
│   ├── DashboardLayout.jsx    # 대시보드 레이아웃 + 인증 가드
│   ├── LoginPage.jsx          # 로그인 페이지
│   ├── apps/
│   │   └── FortuneCookie.jsx  # 포춘쿠키 미니 앱
│   └── public/
│       ├── YouTubePage.jsx    # 유튜브 채널 분석 페이지
│       └── AppsPage.jsx       # Funny App 목록 페이지
├── partials/                  # 레이아웃 조각 컴포넌트
│   ├── PublicHeader.jsx       # 공개 페이지용 헤더
│   ├── Header.jsx             # 대시보드 헤더
│   ├── Sidebar.jsx            # 대시보드 사이드바
│   ├── SidebarLinkGroup.jsx
│   ├── Banner.jsx
│   └── dashboard/             # 대시보드 카드 컴포넌트 (Card01~13)
├── stores/
│   └── authStore.js           # Zustand 인증 상태 (user, session, loading)
└── utils/
    ├── ThemeContext.jsx        # 다크/라이트 테마 컨텍스트
    ├── Transition.jsx         # 페이지 전환 유틸
    └── Utils.js               # 공통 유틸 함수
```

---

## 인증 흐름

```
useAuth() (App 마운트 시 실행)
  └─ supabase.auth.getSession()   → 초기 세션 로드
  └─ supabase.auth.onAuthStateChange()  → 세션 변경 구독

authStore (Zustand)
  ├─ user      현재 로그인 유저 객체 (없으면 null)
  ├─ session   Supabase 세션 객체
  ├─ loading   초기 세션 로드 완료 여부
  └─ signOut() 로그아웃 + 상태 초기화
```
