# PROJECT_CONTEXT.md
> 아시아리그 아이스하키 정보 앱 - AI Agent 온보딩 문서

## 1. 프로젝트 개요

- **목적**: 아시아리그 아이스하키 2025-26 시즌 정보 제공 앱
- **주요 기능**: 경기 일정, 실시간 결과, 하이라이트, 순위, 뉴스, 팀/선수 정보
- **타겟**: 모바일 퍼스트 PWA 스타일 SPA (한국어 UI)
- **배포 URL**: https://alhockey.fans

---

## 2. 기술 스택

### Core
| 기술 | 버전 | 용도 |
|------|------|------|
| React | 18.3 | UI 프레임워크 |
| Vite | 5.4 | 빌드 도구 |
| TypeScript | 5.8 | 타입 시스템 |
| React Router DOM | 6.30 | 라우팅 |

### Styling
| 기술 | 버전 | 용도 |
|------|------|------|
| Tailwind CSS | 3.4 | 유틸리티 CSS |
| shadcn/ui | - | Radix 기반 UI 컴포넌트 |
| tailwindcss-animate | 1.0.7 | 애니메이션 |

### Data & State
| 기술 | 버전 | 용도 |
|------|------|------|
| TanStack React Query | 5.83 | 서버 상태 관리 |
| @tanstack/query-sync-storage-persister | 5.90 | localStorage 캐시 영속화 |
| @supabase/supabase-js | 2.80 | 데이터베이스 클라이언트 |

### SEO & Utils
| 기술 | 버전 | 용도 |
|------|------|------|
| react-helmet-async | 2.0.5 | 메타 태그 관리 |
| date-fns | 3.6 | 날짜 처리 (한국어 로케일) |
| lucide-react | 0.462 | 아이콘 |

---

## 3. 프로젝트 구조

```
src/
├── components/
│   ├── team/                    # 팀 상세 페이지 전용 컴포넌트
│   │   ├── TeamHeader.tsx       # 팀 로고, 이름, 순위, SNS 링크
│   │   ├── TeamInfoCard.tsx     # 홈타운, 경기장, 창단년도, 역사
│   │   ├── RecentGames.tsx      # 최근 5경기 결과
│   │   ├── RecentVideos.tsx     # 최근 영상 캐러셀
│   │   ├── StarPlayers.tsx      # 스타 플레이어 (득점/도움 Top 3)
│   │   └── LeagueStandingsSection.tsx  # 리그 순위표
│   ├── ui/                      # shadcn/ui 컴포넌트 (커스터마이징됨)
│   ├── BottomNav.tsx            # 하단 탭 네비게이션
│   ├── PageHeader.tsx           # 페이지 헤더
│   ├── SEO.tsx                  # 메타 태그, OG, JSON-LD
│   ├── ScrollToTop.tsx          # 라우트 변경시 스크롤 초기화
│   └── NavLink.tsx              # 네비게이션 링크
│
├── hooks/
│   ├── useTeams.tsx             # 팀 데이터 조회 훅 (캐싱)
│   ├── useSchedules.ts          # 스케줄 데이터 공통 훅 (캐시 일관성 보장) ⭐
│   ├── use-mobile.tsx           # 모바일 감지 훅
│   └── use-toast.ts             # 토스트 알림 훅
│
├── lib/
│   ├── supabase-external.ts     # Supabase 싱글톤 클라이언트 ⭐
│   └── utils.ts                 # cn() 유틸리티
│
├── pages/
│   ├── Home.tsx                 # 홈 (진행중/다음경기, 뉴스, 순위)
│   ├── Schedule.tsx             # 경기 일정 (월별/팀별 필터)
│   ├── GameDetail.tsx           # 경기 상세 (라이브/완료/예정)
│   ├── Highlights.tsx           # 하이라이트 영상
│   ├── Standings.tsx            # 팀 순위 + 개인 기록
│   ├── News.tsx                 # 뉴스 목록
│   ├── TeamDetail.tsx           # 팀 상세 페이지
│   ├── TeamRoster.tsx           # 팀 전체 로스터
│   ├── InstagramScore.tsx       # SNS 자동화용 경기 결과 스크린샷
│   ├── InstagramPreview.tsx     # SNS 자동화용 시리즈 프리뷰 ⭐
│   └── NotFound.tsx             # 404 페이지
│
├── types/
│   └── team.ts                  # 팀 타입 정의
│
├── App.tsx                      # 라우터 설정, QueryClient 설정
├── main.tsx                     # 앱 엔트리포인트
└── index.css                    # Tailwind 설정, CSS 변수, 글로벌 스타일

supabase/
├── config.toml                  # Edge Function 설정 (project_id: nvlpbdyqfzm...)
└── functions/
    └── generate-sitemap/        # 동적 sitemap.xml 생성
```

---

## 4. 데이터 아키텍처

### 4.1 Supabase 연동 구조

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ externalSupabase (src/lib/supabase-external.ts)      │   │
│  │ 모든 페이지에서 데이터 조회에 사용                     │   │
│  └────────────────────────┬─────────────────────────────┘   │
│                           │                                  │
└───────────────────────────┼──────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────────┐
│ Supabase 프로젝트 (nvlpbdyqfzmlrjauvhxx)                      │
│                                                               │
│ Tables:                        │ Edge Functions:              │
│ - alih_teams                   │ - generate-sitemap           │
│ - alih_schedule                │   (동적 sitemap.xml 생성)    │
│ - alih_standings               │                              │
│ - alih_players                 │                              │
│ - alih_news                    │                              │
│ - alih_game_details            │                              │
└───────────────────────────────────────────────────────────────┘
```

> **Note**: 이전에는 Lovable Cloud Supabase (rmfwypuvpwnd...)를 별도로 사용했으나, 마이그레이션 후 하나의 Supabase 프로젝트로 통합됨.

### 4.2 주요 테이블 스키마

```typescript
// alih_teams - 팀 정보
interface Team {
  id: number;
  english_name: string;      // "Anyang Halla"
  name: string;              // "안양 한라"
  logo: string;              // 로고 URL
  website?: string;          // 공식 홈페이지
  team_info?: {              // 팀 상세 정보 (JSON)
    hometown: string;
    home_stadium: string;
    founded_year: number;
    championships: number[];
    history: string;
  };
  recent_videos?: {          // 최근 영상 (JSON 배열)
    title: string;
    youtube_url: string;
    thumbnail: string;
  }[];
  sns_links?: {              // SNS 링크 (JSON)
    instagram?: string;
    youtube?: string;
    twitter?: string;
  };
}

// alih_schedule - 경기 일정
interface ScheduleGame {
  id: number;
  game_no: number;           // 경기 번호 (URL 파라미터)
  match_at: string;          // 경기 일시 (ISO)
  home_team_id: number;
  away_team_id: number;
  home_score?: number;       // 최종 점수 (완료시)
  away_score?: number;
  game_status: string;       // "Game Finished" | 기타
  highlight_url?: string;    // 하이라이트 유튜브 URL
  live_url?: string;         // 라이브 스트리밍 URL
  live_data?: {              // 실시간 데이터 (JSON)
    home_score: number;
    away_score: number;
    period_scores: {...};
    shots_on_goal: {...};
    goals: {...}[];
  };
  venue?: string;            // 경기장
}

// alih_standings - 리그 순위
interface Standing {
  id: number;
  team_id: number;
  rank: number;
  games_played: number;
  points: number;
  wins: number;              // 정규시간 승
  losses: number;            // 정규시간 패
  ot_wins: number;           // 연장 승
  ot_losses: number;         // 연장 패
  shootout_wins: number;     // 승부치기 승
  shootout_losses: number;   // 승부치기 패
  goals_for: number;
  goals_against: number;
}

// alih_players - 선수 정보
interface Player {
  id: number;
  team_id: number;
  name: string;              // 한국어 이름
  position: string;          // "G" | "D" | "F" 등
  jersey_number: number;     // 등번호
  goals: number;
  assists: number;
  points: number;
  pim: number;               // 페널티 (분)
  plus_minus: number;        // +/-
}

// alih_game_details - 경기 상세 (완료된 경기만)
interface GameDetail {
  game_no: number;
  period_scores: {...};
  goals: {...}[];
  penalties: {...}[];
  home_roster: {...}[];
  away_roster: {...}[];
  shots_on_goal: {...};
}

// alih_news - 뉴스
interface News {
  id: number;
  title: string;
  summary: string;
  origin_url: string;
  published_at: string;
  language: string;          // "ko" | "ja" | "en"
}
```

### 4.3 캐싱 전략

```typescript
// App.tsx - QueryClient 설정
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,      // 5분 (기본)
      gcTime: 1000 * 60 * 60 * 24,   // 24시간
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// localStorage 영속화
const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'alih-cache',
});

// 페이지별 staleTime 커스터마이징
// - 팀 데이터: 1시간 (잘 안 변함)
// - 경기 일정: 5분
// - 뉴스: 30분
// - 진행 중 경기: 60초 폴링
```

---

## 5. Edge Functions

### 5.1 generate-sitemap
동적 sitemap.xml 생성 (SEO용)

```typescript
// 호출: GET https://nvlpbdyqfzmlrjauvhxx.supabase.co/functions/v1/generate-sitemap
// 참조: public/robots.txt 에서 Sitemap URL로 지정됨
// 
// 역할: 
// - alih_schedule에서 모든 경기 페이지 URL 생성 (120+개)
// - alih_teams에서 모든 팀 페이지 URL 생성 (6개)
// - lastmod를 실제 데이터 기준으로 설정
// - verify_jwt = false (공개 접근)
```

---

## 6. 개발 컨벤션

### 6.1 컴포넌트 작성 규칙

```typescript
// ✅ 도메인별 폴더 분리
// components/team/StarPlayers.tsx - 팀 전용
// components/ui/button.tsx - 공통 UI

// ✅ Props 타입 명시
interface StarPlayersProps {
  teamId: number;
  players: Player[];
}

// ✅ 함수형 컴포넌트 + 화살표 함수
const StarPlayers = ({ teamId, players }: StarPlayersProps) => {
  // ...
};

// ✅ default export
export default StarPlayers;
```

### 6.2 데이터 페칭 패턴

```typescript
// ✅ React Query + 커스텀 훅
const { data: teams, isLoading } = useTeams();

// ✅ 직접 조회 시 externalSupabase 사용
import { externalSupabase } from "@/lib/supabase-external";

const { data, error } = await externalSupabase
  .from('alih_schedule')
  .select('*')
  .eq('game_no', gameNo)
  .single();
```

### 6.3 스타일링 규칙

```typescript
// ✅ Tailwind 유틸리티 클래스 사용
<div className="flex items-center gap-4 p-4">

// ✅ 반응형: 모바일 퍼스트
<div className="grid grid-cols-1 md:grid-cols-2">

// ✅ 시맨틱 토큰 사용 (index.css 변수)
<div className="bg-background text-foreground">
<div className="bg-card border-border">

// ❌ 직접 색상 사용 금지
<div className="bg-white text-black">  // 금지!
<div className="bg-[#1a1a1a]">         // 금지!
```

### 6.4 모바일 최적화 필수 체크리스트

```typescript
// ✅ 팀명 한 줄 표시 (필수!)
<span className="whitespace-nowrap">{team.name}</span>

// ✅ iOS safe-area 대응
// index.css에 이미 적용됨

// ✅ 스크롤바 숨김 (Android)
<div className="overflow-x-auto scrollbar-hide">

// ✅ 모바일에서 세로 스택
<div className="grid grid-cols-1 md:grid-cols-2">

// ✅ 모바일 폰트 크기 조정
<span className="text-sm md:text-base">
```

---

## 7. 주요 패턴 및 주의사항

### 7.1 경기 상태 판단 로직

```typescript
const getGameStatus = (game: ScheduleGame) => {
  const matchTime = new Date(game.match_at);
  const now = new Date();
  
  if (game.game_status === 'Game Finished') {
    return '종료';
  } else if (matchTime > now) {
    return '예정';
  } else {
    return '진행 중';
  }
};
```

### 7.2 진행 중 경기 자동 폴링

```typescript
// useSchedules.ts - 공통 훅 사용
import { useSchedules, useScheduleByGameNo } from "@/hooks/useSchedules";

// 전체 일정 (Home, Schedule)
const { data: schedules } = useSchedules();

// 특정 경기 (GameDetail)
const { data: scheduleData } = useScheduleByGameNo(gameNo);
```

### 7.3 팀명 한국어 변환

```typescript
// useTeams.tsx의 getTeamName, getTeamLogo 헬퍼 사용
const teamName = getTeamName(englishName, teams);
const teamLogo = getTeamLogo(englishName, teams);
```

### 7.4 ⚠️ 주의사항

```
❌ .env                                  - 자동 생성, 직접 수정 금지
🔧 package.json                          - npm으로만 수정
🔧 supabase/config.toml                  - project_id 변경시 주의
```

---

## 8. SEO 구현

### 8.1 메타 태그 (SEO.tsx)

```typescript
<SEO
  title="경기 제목"
  description="경기 설명"
  keywords="아시아리그, 아이스하키"
  ogImage="https://alhockey.fans/og-image.png"
  canonical="https://alhockey.fans/schedule/48"
/>
```

### 8.2 JSON-LD 구조화 데이터

```typescript
// 경기 상세 페이지에 SportsEvent 스키마 적용
const structuredData = {
  "@context": "https://schema.org",
  "@type": "SportsEvent",
  "name": "안양 한라 vs 요코하마 그리츠",
  "startDate": "2025-12-01T19:00:00+09:00",
  // ...
};
```

---

## 9. 빠른 시작 가이드

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build
```

### 주요 라우트

| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/` | Home | 메인 (진행중/다음경기, 뉴스, 순위) |
| `/schedule` | Schedule | 경기 일정 (필터링) |
| `/schedule/:gameNo` | GameDetail | 경기 상세 |
| `/highlights` | Highlights | 하이라이트 영상 |
| `/standings` | Standings | 팀/개인 순위 |
| `/news` | News | 뉴스 목록 |
| `/team/:teamId` | TeamDetail | 팀 상세 |
| `/roster/:teamId` | TeamRoster | 팀 로스터 |
| `/instagram/score` | InstagramScore | SNS 경기결과 스크린샷 |
| `/instagram/preview` | InstagramPreview | SNS 시리즈 프리뷰 스크린샷 |

---

## 10. 참고 링크

- **shadcn/ui**: https://ui.shadcn.com
- **TanStack Query**: https://tanstack.com/query
- **Supabase JS**: https://supabase.com/docs/reference/javascript
- **Tailwind CSS**: https://tailwindcss.com/docs
- **React Router**: https://reactrouter.com/en/main

---

## 11. 변경 이력

| 날짜 | 변경 내용 |
|------|----------|
| 2025-12-14 | useSchedules 공통 훅 추가 (Home/Schedule/GameDetail 캐시 일관성) |
| 2025-12-14 | InstagramPreview 페이지 추가 (시리즈 프리뷰 SNS 자동화) |
| 2025-12-11 | OT/SO(연장/슛아웃) 피리어드 표시 지원 추가 |
| 2025-12-10 | 도메인 마이그레이션 (alih.lovable.app → alhockey.fans) |
| 2025-12-10 | Lovable 종속성 제거 (lovable-tagger, integrations/supabase/) |
| 2025-12-10 | 미사용 Edge Functions 삭제 (send-analytics-report, scrape-*) |
| 2025-12-10 | Supabase 프로젝트 단일화 (nvlpbdyqfzmlrjauvhxx) |

---

*마지막 업데이트: 2025-12-14*
