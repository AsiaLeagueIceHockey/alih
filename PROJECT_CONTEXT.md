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
│   ├── InstagramGoals.tsx       # SNS 자동화용 골/어시스트 정보 ⭐
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
  spectators: number;
  game_info: {
    venue: string;
    coaches: {
      home_coach: string;
      away_coach: string;
    };
    game_time: {
      start: string;
      end: string;
    };
  };
  game_summary: {
    period_1: { score: string; sog: string; pim: string };
    period_2: { score: string; sog: string; pim: string };
    period_3: { score: string; sog: string; pim: string };
    ovt?: { score: string; sog: string; pim: string };  // 연장
    pss?: { score: string; sog: string; pim: string };  // 승부치기
    total: { score: string; sog: string; pim: string };
  };
  goals: Array<{
    goal_no: number;        // 득점자 등번호
    period: number;         // 1, 2, 3, 4(OT), 5(SO)
    time: string;           // "1:18" 형식
    team_id: number;        // 득점 팀 ID
    situation: string;      // "=" (EV), "+1" (PP), "-1" (SH)
    assist1_no: number | null;  // 1st 어시스트 등번호
    assist2_no: number | null;  // 2nd 어시스트 등번호
  }>;
  penalties: Array<{
    player_no: number;
    period: number;
    time: string;
    team_id: number;
    offence: string;
    minutes: number;
  }>;
  home_roster: Array<{
    no: number;
    name: string;
    pos: string;            // "G" | "D" | "F"
    sog: number;            // 슈팅 수
    played: boolean;
    captain_asst: string | null;  // "C" | "A" | null
  }>;
  away_roster: Array<{ /* 동일 구조 */ }>;
  goalkeepers: {
    home: Array<{ no: number; name: string; mip: string; ga: number; saves: number }>;
    away: Array<{ /* 동일 구조 */ }>;
  };
  shots_on_goal: { /* 피리어드별 슈팅 */ };
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

## 5. SNS 자동화 페이지 (Instagram)

### 5.1 공통 특성
- **용도**: GitHub Actions에서 Playwright로 캡쳐 → Instagram 업로드
- **뷰포트**: 1080x1350 (4:5 인스타그램 비율)
- **디자인**: 다크 그라데이션 (`from-slate-900 via-slate-800 to-slate-900`)
- **BottomNav 숨김**: `/instagram/*` 경로에서는 네비게이션 바 미표시

### 5.2 InstagramScore (`/instagram/score`)
경기 결과 스크린샷
```
?game_no=66
```
- 팀 로고, 최종 스코어, 피리어드별 점수 표시

### 5.3 InstagramPreview (`/instagram/preview`)
시리즈 프리뷰 스크린샷
```
?game_no=66
```
- 팀 순위, 경기 일정, 맞대결 전적 표시

### 5.4 InstagramGoals (`/instagram/goals`) ⭐ NEW
골/어시스트 정보 스크린샷 (선수 이름 강조)
```
?game_no=66           # 페이지 1 (기본)
?game_no=66&page=2    # 페이지 2
```
- **페이지네이션**: 6골당 1페이지 (7골 이상 경기는 여러 페이지)
- 득점자 이름 크게 강조
- 어시스트, 피리어드, 시간, 득점 상황(EV/PP/SH) 표시
- 팀별 컬러 구분 (홈팀 primary, 어웨이팀 blue)
- 하단에 페이지 인디케이터 표시 (예: "1 / 2")

---

## 6. Edge Functions

### 6.1 generate-sitemap
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

## 7. 개발 컨벤션

### 7.1 컴포넌트 작성 규칙

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

### 7.2 데이터 페칭 패턴

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

### 7.3 스타일링 규칙 (⭐ 중요)

#### shadcn/ui 컴포넌트 우선 사용

```typescript
// ✅ shadcn/ui 컴포넌트 사용 (필수!)
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

// ❌ 네이티브 HTML 직접 사용 금지 (특히 버튼!)
<button onClick={...}>클릭</button>           // 금지!
<div className="...button styles...">클릭</div> // 금지!

// ✅ shadcn Button 사용
<Button variant="default" onClick={...}>클릭</Button>
<Button variant="outline">클릭</Button>
<Button variant="link" size="sm">더보기</Button>
```

#### 시맨틱 색상 토큰 (필수!)

```typescript
// ✅ 시맨틱 토큰 사용 (index.css에 정의됨)
className="bg-background text-foreground"      // 기본 배경/글자
className="bg-card border-border"              // 카드 배경
className="text-muted-foreground"              // 보조 텍스트
className="text-primary"                       // 강조 색상
className="bg-secondary/30"                    // 보조 배경

// ✅ 상태 표시용 시맨틱 색상
className="text-success"                       // 승리, 득점, 긍정적
className="text-destructive"                   // 패배, 실점, 부정적
className="text-info"                          // 원정, 정보성
className="text-warning"                       // 주의, 경고

// ✅ 통계/차트용 색상 (피리어드별)
className="bg-period-1"                        // 1피리어드 (파랑)
className="bg-period-2"                        // 2피리어드 (초록)
className="bg-period-3"                        // 3피리어드 (주황)
className="bg-period-ot"                       // 연장 (빨강)

// ✅ 특수 상황용 색상
className="text-powerplay"                     // 파워플레이 (노랑)
className="text-shorthanded"                   // 숏핸디드 (보라)

// ✅ 순위 메달 색상
className="text-medal-gold"                    // 금메달 (노랑)
className="text-medal-silver"                  // 은메달 (회색)
className="text-medal-bronze"                  // 동메달 (주황)

// ❌ 직접 색상 사용 금지!
className="bg-green-500"        // 금지! → bg-success 사용
className="text-red-500"        // 금지! → text-destructive 사용
className="bg-[#1a1a1a]"        // 금지! → bg-card 사용
className="text-blue-500"       // 금지! → text-info 또는 text-primary 사용
className="text-yellow-500"     // 금지! → text-medal-gold 또는 text-warning 사용
```

#### Tailwind 유틸리티 규칙

```typescript
// ✅ Tailwind 유틸리티 클래스 사용
<div className="flex items-center gap-4 p-4">

// ✅ 반응형: 모바일 퍼스트
<div className="grid grid-cols-1 md:grid-cols-2">
```

### 7.4 모바일 최적화 필수 체크리스트

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

### 7.5 색상 토큰 정의 (index.css)

| 토큰 | HSL 값 | 용도 |
|------|--------|------|
| `--success` | 142 76% 36% | 승리, 득점, 긍정적 상태 |
| `--warning` | 45 93% 47% | 경고, 주의 |
| `--info` | 217 91% 60% | 정보성, 원정 |
| `--period-1` | 217 91% 60% | 1피리어드 (파랑) |
| `--period-2` | 142 76% 36% | 2피리어드 (초록) |
| `--period-3` | 32 95% 44% | 3피리어드 (주황) |
| `--period-ot` | 0 72% 51% | 연장전 (빨강) |
| `--powerplay` | 45 93% 47% | 파워플레이 (노랑) |
| `--shorthanded` | 280 68% 60% | 숏핸디드 (보라) |
| `--medal-gold` | 45 93% 47% | 금메달 (노랑) |
| `--medal-silver` | 0 0% 70% | 은메달 (회색) |
| `--medal-bronze` | 30 75% 45% | 동메달 (주황) |

---

## 8. 주요 패턴 및 주의사항

### 8.1 경기 상태 판단 로직

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

### 8.2 진행 중 경기 자동 폴링

```typescript
// useSchedules.ts - 공통 훅 사용
import { useSchedules, useScheduleByGameNo } from "@/hooks/useSchedules";

// 전체 일정 (Home, Schedule)
const { data: schedules } = useSchedules();

// 특정 경기 (GameDetail)
const { data: scheduleData } = useScheduleByGameNo(gameNo);
```

### 8.3 팀명 한국어 변환

```typescript
// useTeams.tsx의 getTeamName, getTeamLogo 헬퍼 사용
const teamName = getTeamName(englishName, teams);
const teamLogo = getTeamLogo(englishName, teams);
```

### 8.4 ⚠️ 주의사항

```
❌ .env                                  - 자동 생성, 직접 수정 금지
🔧 package.json                          - npm으로만 수정
🔧 supabase/config.toml                  - project_id 변경시 주의
```

---

## 9. SEO 구현

### 9.1 공식 팀명 (SEO 키워드 기준)

| 한글명 | 영문명 | 비고 |
|--------|--------|------|
| HL안양 | HL ANYANG | 안양한라(구 명칭) 포함 가능 |
| 홋카이도 레드이글스 | RED EAGLES HOKKAIDO | |
| 도호쿠 프리블레이즈 | TOHOKU FREE BLADES | |
| 닛코 아이스벅스 | NIKKO ICEBUCKS | |
| 요코하마 그리츠 | YOKOHAMA GRITS | |
| 스타즈 고베 | STARS KOBE | |

> **주의**: `ALIH`는 보충 설명으로만 사용 (keywords 맨 뒤에 배치)

### 9.2 메타 태그 (SEO.tsx)

```typescript
// src/components/SEO.tsx
<SEO
  title="페이지 제목"                    // ex: "아시아리그 경기 일정 - 2025-26 시즌"
  description="상세 설명"                // ex: "HL안양, 홋카이도 레드이글스 등 전 팀..."
  keywords="아시아리그 아이스하키, ..."  // 정식 팀명 포함
  path="/schedule"                       // canonical URL용
  structuredData={schema}                // JSON-LD 객체 또는 배열
  noindex={false}                        // 색인 제외 여부
  article={{                             // 뉴스/경기 결과 등
    publishedTime: "2025-12-21T00:00:00Z",
    section: "Sports"
  }}
/>
```

**포함 메타 태그**:
- `robots`, `googlebot`, `language`, `geo.region`
- `og:site_name`, `og:locale`, `og:image:width/height`
- `twitter:site`, `twitter:image:alt`
- `hreflang`, `theme-color`, `apple-mobile-web-app-title`

### 9.3 JSON-LD 구조화 데이터

| 페이지 | 스키마 타입 |
|--------|------------|
| Home | `WebSite` + `BreadcrumbList` |
| Schedule | `CollectionPage` + `SportsEvent[]` |
| GameDetail | `SportsEvent` |
| Highlights | `CollectionPage` + `VideoObject[]` |
| Standings | `Table` |
| News | `CollectionPage` + `NewsArticle[]` |
| TeamDetail | `SportsTeam` + `BreadcrumbList` |
| TeamRoster | `SportsTeam` + `Person[]` |

```typescript
// 예시: 경기 상세 페이지 (GameDetail.tsx)
const structuredData = {
  "@context": "https://schema.org",
  "@type": "SportsEvent",
  "name": "HL안양 vs 홋카이도 레드이글스",
  "startDate": "2025-12-01T19:00:00+09:00",
  "location": {
    "@type": "Place",
    "name": "안양 아이스 아레나"
  },
  "homeTeam": { "@type": "SportsTeam", "name": "HL안양" },
  "awayTeam": { "@type": "SportsTeam", "name": "홋카이도 레드이글스" }
};
```

### 9.4 index.html 기본 SEO

- **author**: `alhockey_fans`
- **구조화 데이터**: `WebSite` 스키마 (SearchAction 포함)
- **검색엔진 인증**:
  - Google: `oPbwEPC3bqmphkARcL9srik2fuwGJvsSPjgslsR8zQI`
  - Naver: `80f9275a181ed121975baf44113d434a89401b52`
  - Bing: `A72866F9AD31F7BF367B76DC7B96B4BF`

### 9.5 검색엔진 색인 요청

**Google Search Console**:
1. URL 검사 → 색인 생성 요청
2. 사이트맵 제출: `https://alhockey.fans/sitemap.xml`

**Naver Search Advisor**:
1. 웹 페이지 수집 요청
2. 사이트맵 제출

---

## 10. 빠른 시작 가이드

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
| `/instagram/goals` | InstagramGoals | SNS 골/어시스트 정보 스크린샷 |

---

## 11. 참고 링크

- **shadcn/ui**: https://ui.shadcn.com
- **TanStack Query**: https://tanstack.com/query
- **Supabase JS**: https://supabase.com/docs/reference/javascript
- **Tailwind CSS**: https://tailwindcss.com/docs
- **React Router**: https://reactrouter.com/en/main

---

## 12. 변경 이력

| 날짜 | 변경 내용 |
|------|----------|
| 2026-01-03 | UI 일관성 개선: 시맨틱 색상 토큰 추가 (success, warning, info, period-*, powerplay, shorthanded), TeamStats.tsx 리팩토링, 스타일링 가이드라인 문서화 ⭐ |
| 2025-12-28 | InstagramGoals 페이지 추가 (골/어시스트 정보, 페이지네이션 지원) ⭐ |
| 2025-12-21 | SEO 전면 최적화 (메타 태그, 구조화 데이터, 정식 팀명 적용) |
| 2025-12-14 | useSchedules 공통 훅 추가 (Home/Schedule/GameDetail 캐시 일관성) |
| 2025-12-14 | InstagramPreview 페이지 추가 (시리즈 프리뷰 SNS 자동화) |
| 2025-12-11 | OT/SO(연장/슛아웃) 피리어드 표시 지원 추가 |
| 2025-12-10 | 도메인 마이그레이션 (alih.lovable.app → alhockey.fans) |
| 2025-12-10 | Lovable 종속성 제거 (lovable-tagger, integrations/supabase/) |
| 2025-12-10 | 미사용 Edge Functions 삭제 (send-analytics-report, scrape-*) |
| 2025-12-10 | Supabase 프로젝트 단일화 (nvlpbdyqfzmlrjauvhxx) |

---

*마지막 업데이트: 2026-01-03*


