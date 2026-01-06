# ROADMAP.md
> 아시아리그 아이스하키 플랫폼 개선 로드맵 (AI Agent 작업용)

## 프로젝트 목표
- **타겟 유저**: 한국 아시아리그 아이스하키 팬 (확장: 일본/해외 팬)
- **현재 상황**: 유저 수 적음, 수동 홍보 중, Instagram @alhockey_fans 운영
- **전략**: 정보 가치(aggregation)로 유입 → 충성 유저 확보 → 참여 기능 추가

---

## 우선순위 요약

| 순위 | 기능 | 난이도 | 예상 효과 | 상태 |
|:---:|------|:---:|:---:|:---:|
| 🥇 | 실시간 응원하기 (Cheering Battle) | ⭐⭐ | 높음 | ✅ **완료** |
| 🥈 | Instagram 자동화 확장 | ⭐⭐ | 높음 | 미시작 |
| 🥉 | 통계/분석 기능 | ⭐⭐⭐ | 높음 | ✅ **완료** |
| 4 | 다국어 지원 (한/일/영) | ⭐⭐ | 중간 | ✅ **완료** |
| 5 | 선수 개인 페이지 | ⭐⭐⭐ | 중간 | 미시작 |
| 6 | 이메일 뉴스레터 | ⭐⭐ | 낮음 | 미시작 |
| 7 | 웹 푸시 알림 | ⭐⭐⭐ | 낮음 | 미시작 |


---

## 🥇 Feature 0: 실시간 응원하기 (Cheering Battle)

### 개요
경기 상세 페이지(`/schedule/:gameNo`)에 로그인 없이 참여 가능한 실시간 응원 기능

### 기능 요구사항
- [x] 양 팀 대결 구도 UI (게이지 바)
- [x] 클릭 시 파티클 애니메이션
- [x] Supabase Realtime 실시간 동기화
- [x] Optimistic UI + Throttling (1초 debounce)
- [x] 모바일 햅틱 피드백

### 기술 구현
- **DB**: `alih_cheers` 테이블 + `increment_cheers` RPC 함수
- **프론트엔드**: `useCheers` 훅 + `CheerBattle` 컴포넌트
- **위치**: `GameDetail.tsx` 내 팀 정보 카드 아래

### 상태: ✅ 완료

---

## 🥈 Feature 1: Instagram 자동화 확장

### 현재 상태
- ✅ `/instagram/score` - 경기 결과 스크린샷
- ✅ `/instagram/preview` - 시리즈 프리뷰 스크린샷
- ✅ `/instagram/goals` - 골/어시스트 정보 (페이지네이션 지원)

### 추가할 콘텐츠

#### 1.1 Weekly Top Scorers (`/instagram/weekly-stats`) ✅ 완료
- [x] 매주 월요일 생성용
- [x] 쿼리: 시즌 누적 득점/어시스트 Top 5
- [x] 표시: 선수명, 팀 로고, 골/어시스트 수

#### 1.2 Standings Update (`/instagram/standings`) ✅ 완료
- [x] 경기 있는 날 저녁 생성용
- [x] 표시: 전체 순위표 + 팀 로고/승패/득실/승점

#### 1.3 Player Milestone Alert ⏸️ 스킵
- 특정 기록 달성 시 자동 생성 (향후 구현)

#### 1.4 Series Recap ❌ 제거됨

### 기술 참고
- 기존 Instagram 페이지 패턴 참고: `src/pages/InstagramScore.tsx`
- 배치 (타 프로젝트 alih-batch에서 수행됨): `capture.py`에 주간 트리거 추가
- 뷰포트: 1080x1350, 다크 그라데이션

---

## 🥈 Feature 2: 통계/분석 기능

### 현재 데이터로 가능한 통계

#### 2.1 팀 통계 (TeamDetail 페이지에 섹션 추가) ✅ 완료
- [x] 홈/원정 성적
  - 데이터: `alih_schedule`에서 `home_alih_team_id` 기준 필터
  - 계산: 홈 승/패, 원정 승/패, 승률
- [x] 최근 5경기 폼 (W-W-L-W-L)
  - 데이터: 최근 5개 경기 결과
- [x] 팀 평균 득점/실점
  - 데이터: `alih_standings`의 `goals_for`, `goals_against`

#### 2.3 고급 통계 ✅ 완료
- [x] 파워플레이 골 비율
  - 데이터: `alih_game_details.goals`에서 `situation === '+1'`
- [x] 피리어드별 득점 분포
  - 데이터: `goals`의 `period` 필드 집계
- [x] 숏핸디드 골 (추가)
  - 데이터: `situation === '-1'`

### UI 구현 위치
- ✅ `/team/:teamId` - TeamDetail 페이지에 "시즌 통계" 섹션 추가
- [ ] `/standings` - 팀 클릭 시 상세 통계 모달

---

## 🥉 Feature 3: 다국어 지원 (i18n) - 한국어/일본어/영어

### 목표
아시아리그의 주요 팬층(한국, 일본, 영어권)을 위해 앱 전체를 3개 국어로 제공

### 기술 스택 ✅ 설치 완료
- `react-i18next`, `i18next`, `i18next-browser-languagedetector`
- `date-fns` (날짜 로케일)
- 헬퍼: `getLocalizedTeamName()` (`src/hooks/useLocalizedTeamName.ts`)

### 완료된 작업 ✅
- [x] i18n 설정 (`src/i18n/index.ts`)
- [x] 번역 파일 (`ko.json`, `ja.json`, `en.json` ~200개 키)
- [x] 언어 전환 UI (`LanguageSwitcher.tsx`)
- [x] Home.tsx - 다음 경기/최근 결과/리그 순위
- [x] Schedule.tsx - 월 탭/날짜/팀 필터
- [x] Highlights.tsx - 팀 필터
- [x] Standings.tsx - 팀 순위표/용어 설명/개인 순위 탭
- [x] CheerBattle.tsx - 제목/설명

---

### 📋 남은 i18n 작업 (페이지별 TODO)

> **작업 요청 방법**: "GameDetail.tsx의 모든 한국어를 번역해줘" 형태로 요청

#### 1. GameDetail.tsx (~50+ 한국어 항목) ✅ 완료
- [x] away팀 이름 `getLocalizedTeamName()` 적용
- [x] 날짜 표시 `format()` + `getDateLocale()` 적용
- [x] 경기장(match_place) - 번역 불가, 원본 유지
- [x] 관중 정보 → `t('gameDetail.spectators')`
- [x] 맞대결 전적 섹션 제목 → `t('section.headToHead')`
- [x] 스타 플레이어 섹션 → `t('section.starPlayers')`
- [x] 득점/어시스트 라벨 → `t('gameDetail.scorer')`, `t('gameDetail.assist')`
- [x] 피리어드별 테이블 팀 이름 (away 팀)
- [x] SEO 메타데이터 (structured data, title, description, keywords)
- [x] Web Share API 텍스트
- [x] alert 메시지
- [x] isInProgress 비교 수정
- [x] 경기 상세 기록 헤더 제목

#### 2. TeamDetail.tsx ✅ 완료
- [x] `useTranslation()` 훅
- [x] `getLocalizedTeamName()` import
- [x] SEO 메타데이터 (title, description, keywords)
- [x] 브레드크럼 "홈"
- [x] 코멘트들은 무시 (코드 주석)

#### 3. components/team/ (7개 파일) ✅ 완료
- [x] **TeamInfoCard.tsx** - 주석만 있음, UI 번역 불필요
- [x] **TeamStats.tsx** - 주석만 있음, UI 번역 불필요
- [x] **StarPlayers.tsx** - 주석만 있음, UI 번역 불필요
- [x] **RecentGames.tsx** - 주석만 있음, UI 번역 불필요
- [x] **RecentVideos.tsx** - 주석만 있음, UI 번역 불필요
- [x] **TeamHeader.tsx** ✅ 완료

#### 4. TeamRoster.tsx ✅ 완료
- [x] 브레드크럼 (홈, 선수단)
- [x] 테이블 헤더 (이미 t() 사용 중)

#### 5. News.tsx 🟢 낮음
- [x] 브레드크럼 (홈, 뉴스)
- [x] 코멘트만 있음 확인됨

#### 6. Schedule.tsx 🟢 낮음
- [x] 브레드크럼 (홈, 경기 일정)
- [x] highlight title 기본값

#### 7. Standings.tsx 🟢 낮음
- [x] 브레드크럼 (홈, 순위)
- [x] 골/도움/포인트 라벨

---

### 📌 새 기능 개발 시 i18n 규칙

1. **하드코딩 금지**: UI 텍스트는 무조건 `t('key')` 사용
2. **팀 이름**: `getLocalizedTeamName(team, currentLang)` 사용
3. **날짜**: `format(date, 'PPP', { locale: getDateLocale() })` 사용
4. **번역 키 먼저**: 코드 작성 전 `ko.json`, `ja.json`, `en.json`에 키 추가
5. **currentLang 선언**: `const currentLang = i18n.language;` 컴포넌트 상단에

### 제외 대상
- `/instagram/*` 경로: 한국어 SNS용
- 선수/코치 이름: 원본 유지
- 코드 주석: 번역 불필요


---

## 4️⃣ Feature 4: 선수 개인 페이지

### 라우트
```
/player/:playerId
```

### 데이터 소스
- 기본: `alih_players` 테이블 (이미 존재)
- 추가 필요: 선수 사진, 상세 프로필 (생년월일, 국적, 신장 등)

### 데이터 보강 방법
1. **EliteProspects**: 크롤링

### 표시 항목
- [ ] 기본 정보: 이름, 등번호, 포지션, 팀
- [ ] 시즌 기록: 경기수, 골, 어시스트, 포인트, PIM, +/-
- [ ] 최근 경기별 기록 (경기당 포인트)
- [ ] (선택) 통산 기록

### 연동
- `/roster/:teamId` 페이지에서 선수 클릭 시 이동

---

## 5️⃣ Feature 5: 이메일 뉴스레터

### 기술 스택
- 메일 발송: [Resend](https://resend.com) 또는 Supabase Edge Function + SMTP
- 구독자 저장: Supabase `newsletter_subscribers` 테이블

### 구현 단계
- [ ] 구독 폼 UI (이메일 입력 + 동의 체크박스)
- [ ] Supabase 테이블 생성 (`email`, `subscribed_at`, `team_preference`)
- [ ] 주간 뉴스레터 템플릿 (HTML 이메일)
- [ ] GitHub Actions 스케줄 (매주 월요일 아침)
- [ ] 구독 해지 링크

### 뉴스레터 내용
- 지난 주 경기 결과 요약
- 이번 주 경기 일정
- 순위 변동
- (선택) 주간 베스트 플레이어

---

## 6️⃣ Feature 6: 웹 푸시 알림

### 기술 스택
- [web-push](https://github.com/web-push-libs/web-push) 라이브러리
- Supabase Edge Function으로 푸시 발송
- Service Worker 등록 필요

### 구현 단계
- [ ] VAPID 키 생성
- [ ] Service Worker 설정 (`public/sw.js`)
- [ ] 푸시 구독 UI (알림 허용 버튼)
- [ ] Supabase 테이블: `push_subscriptions`
- [ ] 발송 Edge Function
- [ ] 트리거: 경기 30분 전 알림

### 우선순위
- 이메일 뉴스레터가 더 쉬움 → 먼저 구현
- 웹 푸시는 유저가 늘어난 후 고려

---

## 작업 요청 방법 (AI Agent용)

각 Feature를 구현할 때는 다음 형식으로 요청:

```
[Feature N] 기능명 구현해줘

참고:
- ROADMAP.md의 Feature N 섹션 참조
- PROJECT_CONTEXT.md의 프로젝트 구조 참조
```

---

## 변경 이력

| 날짜 | 변경 내용 |
|------|----------|
| 2026-01-04 | 실시간 응원하기 (Cheering Battle) 기능 추가 - `useCheers` 훅, `CheerBattle` 컴포넌트 |
| 2025-12-28 | 초기 로드맵 작성 |
