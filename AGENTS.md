# AGENTS.md
> 아시아리그 아이스하키 정보 앱 - AI Agent 온보딩 문서

## 1. 프로젝트 개요

- **목적**: 아시아리그 아이스하키 2025-26 시즌 정보 제공 앱
- **주요 기능**: 경기 일정, 실시간 결과, 하이라이트, 순위, 뉴스, 팀/선수 정보, 푸시 알림
- **타겟**: 모바일 퍼스트 PWA (한국어, 일본어, 영어 지원)
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
| 기술 | 용도 |
|------|------|
| Tailwind CSS 3.4 | 유틸리티 CSS |
| shadcn/ui | Radix 기반 UI 컴포넌트 |

### Data & State
| 기술 | 용도 |
|------|------|
| TanStack React Query 5.83 | 서버 상태 관리 |
| @supabase/supabase-js 2.80 | 데이터베이스 클라이언트 |

### i18n (다국어)
| 기술 | 용도 |
|------|------|
| react-i18next | 한국어(ko), 일본어(ja), 영어(en) 지원 |

---

## 3. 프로젝트 구조

```
src/
├── components/
│   ├── admin/                   # 관리자 전용 컴포넌트 ⭐ NEW
│   │   └── AdminLayout.tsx      # 비밀번호 보호 레이아웃
│   ├── auth/
│   │   └── SettingsDialog.tsx   # 마이페이지 (닉네임 수정, 알림 설정)
│   ├── team/                    # 팀 상세 페이지 컴포넌트
│   ├── ui/                      # shadcn/ui 컴포넌트
│   └── BottomNav.tsx            # 하단 탭 네비게이션
│
├── hooks/
│   ├── use-notifications.ts     # 푸시 알림 훅 ⭐ (hasToken, resubscribe)
│   ├── useSchedules.ts          # 스케줄 데이터 공통 훅
│   └── useTeams.tsx             # 팀 데이터 조회 훅
│
├── i18n/locales/                # 다국어 번역 파일
│   ├── ko.json, ja.json, en.json
│
├── pages/
│   ├── Home.tsx                 # 홈
│   ├── Home.tsx                 # 홈
│   ├── Game.tsx                 # 경기 (일정/결과 + 하이라이트 탭) ⭐ NEW
│   ├── Players.tsx              # 선수 (선수 검색 + 필터) ⭐ NEW
│   ├── Schedule.tsx             # 경기 일정 (Game 하위)
│   ├── GameDetail.tsx           # 경기 상세 (라이브 스코어)
│   ├── Highlights.tsx           # 하이라이트 (Game 하위)
│   ├── TeamDetail.tsx           # 팀 상세
│   ├── TeamRoster.tsx           # 팀 선수단
│   ├── PlayerDetail.tsx         # 선수 상세 프로필 (스탯, 인스타, 코멘트) ⭐ NEW
│   ├── PlayerCard.tsx           # 선수 디지털 ID 카드 생성 ⭐ NEW
│   ├── AdminPushTest.tsx        # 관리자 푸시 테스트 ⭐ NEW
│   └── Instagram*.tsx           # SNS 자동화용 페이지
│
├── lib/
│   └── supabase-external.ts     # Supabase 싱글톤 클라이언트
│
└── App.tsx                      # 라우터 설정

supabase/functions/
├── live-game/                   # 실시간 경기 알림 발송
├── send-test-push/              # 테스트 푸시 발송 ⭐ NEW
├── admin-list-notification-users/ # 관리자용 사용자 목록 (RLS 우회) ⭐ NEW
└── generate-sitemap/            # 동적 sitemap.xml 생성
```

---

## 4. 주요 테이블 (Supabase)

| 테이블 | 용도 | SQL 버전 |
|--------|------|:---:|
| `profiles` | 사용자 프로필 (nickname, email, favorite_team_ids) | v1 |
| `notification_tokens` | 푸시 알림 토큰 (user_id, token, platform) | v1 |
| `alih_cheers` | 실시간 응원 카운트 | v1 |
| `alih_comments` | 댓글 (경기/팀/선수) ⭐ NEW | v2 |
| `alih_predictions` | 승부 예측 (경기별 결과 예측) ⭐ NEW | v6 |
| `alih_teams` | 팀 정보 (로고, 홈페이지, SNS 등) | - |
| `alih_schedule` | 경기 일정 + 실시간 스코어 (`live_data`) | - |
| `alih_standings` | 리그 순위 | - |
| `alih_players` | 선수 정보 + 시즌 통계 | - |
| `alih_game_details` | 경기 상세 (골, 페널티, 로스터 등) | - |
| `alih_news` | 뉴스 | - |

---

## 5. SQL 마이그레이션 (`sql/`)

> 📁 경로: `/sql/`

| 파일 | 설명 | 상태 |
|------|------|:---:|
| `v1_base_schema.sql` | profiles, notification_tokens, alih_cheers | ✅ 적용됨 |
| `v2_comments.sql` | alih_comments (댓글) | ✅ 적용됨 |
| `v3_fix_rls_policies.sql` | RLS 수정 (댓글 삭제, 프로필 공개) | ⚠️ **실행 필요** |
| `v4_player_profile.sql` | 선수 프로필 확장 + player_cards | ⚠️ **실행 필요** |
| `v6_predictions.sql` | 승부 예측 (alih_predictions) | ⚠️ **실행 필요** |

**실행 방법:**
1. Supabase Dashboard → SQL Editor
2. 각 파일 순서대로 복사 → Run
3. 실행 후 `sql/README.md` 체크박스 업데이트

---

## 5. 완료된 기능 ✅

### 5.1 실시간 응원하기 (Cheering Battle)
- 경기 상세 페이지에서 로그인 없이 응원 가능
- Supabase Realtime 동기화 + 파티클 애니메이션
- `alih_cheers` 테이블 + `increment_cheers` RPC

### 5.2 통계/분석 기능
- 팀 통계: 홈/원정 성적, 최근 5경기 폼, 평균 득/실점
- 고급 통계: 파워플레이/숏핸디드 골 비율, 피리어드별 득점 분포
- 위치: `TeamDetail.tsx` → `TeamStats.tsx` 컴포넌트

### 5.3 다국어 지원 (i18n)
- 한국어, 일본어, 영어 3개국어
- `react-i18next` + `i18next-browser-languagedetector`
- 팀명: `getLocalizedTeamName(team, currentLang)` 함수 사용

### 5.4 Instagram 자동화
- `/instagram/score` - 경기 결과 스크린샷
- `/instagram/preview` - 시리즈 프리뷰
- `/instagram/goals` - 골/어시스트 정보 (페이지네이션)
- `/instagram/weekly-stats` - 주간 득점 Top 5
- `/instagram/standings` - 순위표

### 5.5 푸시 알림 시스템 ⭐ NEW
- **토큰 저장**: `notification_tokens` 테이블
- **발송**: `live-game` Edge Function (경기 시작/골/종료 알림)
- **테스트**: `/admin/test-push` 관리자 페이지
- **마이페이지 상태**: `hasToken` 기반 3가지 상태 표시
  - ✅ 알림 받는 중 (permission + DB 토큰)
  - ⚠️ 재설정 필요 (permission 있지만 DB 토큰 없음)
  - ❌ 알림 꺼짐 (permission 없음)

### 5.6 관리자 섹션 ⭐ NEW
- **접근**: `/admin/*` 경로
- **인증**: `VITE_ADMIN_PIN` 환경변수로 비밀번호 보호
- **기능**: 
  - 푸시 알림 테스트 (`/admin/test-push`)
  - 댓글 관리 (`/admin/comments`)

### 5.7 마이페이지 닉네임 수정 ⭐ NEW
- OAuth 로그인 시 실명 대신 커스텀 닉네임 설정 가능
- 마이페이지 → 닉네임 옆 연필 아이콘으로 수정
- 2~20자 제한, 즉시 반영

### 5.8 선수 포트폴리오 페이지 ⭐ NEW
- **경로**: `/player/:playerId` (포트폴리오), `/player/:playerId/card` (디지털 카드)
- **구성**: Hero Section, Stats Dashboard, Bio/Story, Career History, 댓글
- **디지털 카드**: 발급 후 PNG 다운로드/공유, 후원 모달
- **후원**: 한국어 → 카카오페이, 영어/일어 → Buy Me a Coffee
- **DB**: `player_cards` 테이블, serial_number 자동 발급

### 5.9 승부 예측 (Match Prediction) ⭐ NEW
- 경기 상세 페이지에서 4가지 옵션으로 경기 결과 예측
  - [홈팀 정규승 | 홈팀 OT/SO승 | 어웨이 OT/SO승 | 어웨이 정규승]
- **게임 전**: 경기 정보와 라이브 스트리밍 사이에 배치 (투표 가능)
- **게임 중/후**: 응원하기 카드 아래에 배치 (읽기 전용)
- **Lazy Registration**: 로그인 없이 클릭 → 로그인 모달 유도 → 로그인 후 자동 저장
- `alih_predictions` 테이블 + `usePrediction` 훅 + `MatchPrediction` 컴포넌트
- 다국어 지원 (한국어/일본어/영어)

### 5.10 온보딩 (Onboarding) 개선 ⭐ NEW
- **진입 조건**: 로그인 했으나 `favorite_team_ids`가 없는 신규 유저
- **Step 1 (기본 설정)**: 언어 선택 + 응원 팀 선택 (통합)
- **Step 2 (프로필 설정)**: 닉네임 설정 (랜덤 추천 + 중복 체크)
- **Step 3 (알림 설정)**: 푸시 알림 권한 요청

---

## 6. 개발 컨벤션

### 6.1 shadcn/ui 컴포넌트 필수 사용
```tsx
// ✅ shadcn/ui 사용
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// ❌ 네이티브 HTML 금지
<button onClick={...}>클릭</button>
```

### 6.2 시맨틱 색상 토큰 (index.css)
```tsx
// ✅ 시맨틱 토큰 사용
className="text-success"        // 승리, 득점
className="text-destructive"    // 패배, 실점
className="text-primary"        // 강조
className="text-muted-foreground" // 보조 텍스트

// ❌ 직접 색상 금지
className="text-green-500"      // 금지!
```

### 6.3 다국어 (i18n) 필수
```tsx
import { useTranslation } from 'react-i18next';
import { getLocalizedTeamName } from "@/hooks/useLocalizedTeamName";

const { t, i18n } = useTranslation();
const currentLang = i18n.language;

// 텍스트
{t('section.recentResults')}

// 팀 이름
{getLocalizedTeamName(team, currentLang)}

// 날짜 (date-fns + 로케일)
{format(date, 'PPP', { locale: getDateLocale() })}
```

### 6.4 Safe Area 대응 (PWA)
```tsx
// 상단 여백 (상태 표시줄)
className="pt-[calc(1rem+env(safe-area-inset-top))]"

// 하단 여백 (네비게이션 바)
className="pb-20"  // BottomNav 높이
```

---

## 7. 환경 변수

| 변수 | 용도 |
|------|------|
| `VITE_SUPABASE_URL` | Supabase 프로젝트 URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase 익명 키 |
| `VITE_VAPID_PUBLIC_KEY` | 푸시 알림 VAPID 공개 키 |
| `VITE_ADMIN_PIN` | 관리자 페이지 비밀번호 |

> ⚠️ **주의**: `.env` 파일은 `.gitignore`에 포함되어야 함. 절대 커밋 금지!

---

## 8. Edge Functions

| 함수 | 용도 |
|------|------|
| `live-game` | 경기 상태 변경 시 푸시 알림 발송 |
| `send-test-push` | 관리자 테스트 푸시 발송 |
| `admin-list-notification-users` | 알림 사용자 목록 조회 (service_role) |
| `generate-sitemap` | 동적 sitemap.xml 생성 |

**배포 명령어**:
```bash
supabase functions deploy live-game
supabase functions deploy send-test-push
supabase functions deploy admin-list-notification-users
```

---

## 9. 주요 라우트

| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/` | Home | 메인 (진행중/다음경기) |
| `/` | Home | 메인 (진행중/다음경기) |
| `/game` | Game | 경기 (일정/결과 + 하이라이트) |
| `/players` | Players | 선수 검색 및 필터 |
| `/schedule` | Schedule | 경기 일정 (Legacy, filtered) |
| `/schedule/:gameNo` | GameDetail | 경기 상세 |
| `/highlights` | Highlights | 하이라이트 (Legacy, filtered) |
| `/team/:teamId` | TeamDetail | 팀 상세 |
| `/roster/:teamId` | TeamRoster | 팀 선수단 |
| `/player/:slug` | PlayerDetail | 선수 상세 프로필 ⭐ NEW |
| `/player/:slug/card` | PlayerCard | 선수 디지털 카드 ⭐ NEW |
| `/player/:playerId` | PlayerDetail | 선수 포트폴리오 ⭐ NEW |
| `/player/:playerId/card` | PlayerCard | 디지털 선수 카드 ⭐ NEW |
| `/highlights` | Highlights | 하이라이트 영상 |
| `/standings` | Standings | 팀/개인 순위 |
| `/news` | News | 뉴스 목록 |
| `/admin/test-push` | AdminPushTest | 관리자 푸시 테스트 ⭐ |

---

## 10. 작업 중 / 미완료 기능 (TODO)

### 🔥 최근 완료
| 기능 | 난이도 | 상태 |
|------|:---:|:---:|
| [x] InAppGuide 주석 처리 | ⭐ | ✅ 완료 (2026-02-01) |
| [x] 댓글 모듈 구현 | ⭐⭐⭐ | ✅ 완료 (2026-02-01) |

### 📝 댓글 모듈 (alih_comments)

**구현 완료:**
- `src/components/comments/` - CommentSection, CommentItem, CommentInput
- `src/hooks/useComments.ts` - 댓글 CRUD 훅
- `src/pages/AdminComments.tsx` - 관리자 댓글 관리
- `supabase/functions/send-comment-notification/` - 푸시 알림
- 페이지 통합: `/schedule/:id` (GameDetail), `/team/:id` (TeamDetail)

**⚠️ 사용자 실행 필요: 테이블 생성 SQL**
```sql
-- alih_comments: 댓글 테이블
CREATE TABLE alih_comments (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('game', 'team', 'player')),
  entity_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  parent_id BIGINT REFERENCES alih_comments(id) ON DELETE CASCADE,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_comments_entity ON alih_comments(entity_type, entity_id);
CREATE INDEX idx_comments_user ON alih_comments(user_id);
CREATE INDEX idx_comments_parent ON alih_comments(parent_id);

-- RLS 정책
ALTER TABLE alih_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read non-deleted comments" ON alih_comments
  FOR SELECT USING (is_deleted = FALSE);

CREATE POLICY "Authenticated users can insert" ON alih_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments" ON alih_comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON alih_comments
  FOR DELETE USING (auth.uid() = user_id);
```

### 📋 향후 작업
| 기능 | 난이도 | 상태 |
|------|:---:|:---:|
| 선수 개인 페이지 (`/player/:playerId`) | ⭐⭐⭐ | 미시작 |
| 이메일 뉴스레터 | ⭐⭐ | 미시작 |
| 푸시 실패 시 토큰 자동 삭제 | ⭐ | 미시작 |

---

## 11. 참고 링크

- **shadcn/ui**: https://ui.shadcn.com
- **TanStack Query**: https://tanstack.com/query
- **Supabase JS**: https://supabase.com/docs/reference/javascript
- **Tailwind CSS**: https://tailwindcss.com/docs

---

## 12. 변경 이력

| 날짜 | 변경 내용 |
|------|----------|
| 2026-02-15 | 온보딩 3단계 개편 (닉네임 설정 추가) 👤 |
| 2026-02-15 | 승부 예측 기능 추가 (MatchPrediction, Lazy Registration) ⭐ |
| 2026-02-01 | 리마인더 시스템 재설계 (live_data 오염 방지) 🛠️ |
| 2026-02-01 | 긴급: 경기 상세 크래시 및 푸시 알림 시간대(KST) 수정 🚨 |
| 2026-02-01 | 선수 포트폴리오 & 디지털 카드 기능 추가 ⭐ |
| 2026-02-01 | 마이페이지 닉네임 수정 기능 추가 ⭐ |
| 2026-02-01 | v3 RLS 정책 수정 (댓글 삭제, 프로필 공개) |
| 2026-02-01 | 댓글 모듈 구현 (CommentSection, Edge Function, Admin) |
| 2026-02-01 | InAppGuide 주석 처리 (인스타 유입 이탈 방지) |
| 2026-02-01 | AGENTS.md 통합 (PROJECT_CONTEXT + ROADMAP) |
| 2026-02-01 | 알림 상태 버그 수정 (hasToken 기반 3가지 상태) |
| 2026-02-01 | 관리자 섹션 추가 (`/admin/test-push`, `/admin/comments`) |
| 2026-02-01 | 푸시 테스트 Edge Functions 추가 |
| 2026-01-31 | TeamRoster safe-area 패딩 수정 |
| 2026-01-03 | UI 일관성 개선: 시맨틱 색상 토큰 추가 |
| 2025-12-28 | InstagramGoals 페이지 추가 |
| 2025-12-21 | SEO 전면 최적화 |

---

*마지막 업데이트: 2026-02-15*

