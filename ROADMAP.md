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
| 🥇 | Instagram 자동화 확장 | ⭐⭐ | 높음 | 미시작 |
| 🥈 | 통계/분석 기능 | ⭐⭐⭐ | 높음 | ✅ **완료** |
| 🥉 | 다국어 지원 (일본어) | ⭐⭐ | 중간 | 미시작 |
| 4 | 선수 개인 페이지 | ⭐⭐⭐ | 중간 | 미시작 |
| 5 | 이메일 뉴스레터 | ⭐⭐ | 낮음 | 미시작 |
| 6 | 웹 푸시 알림 | ⭐⭐⭐ | 낮음 | 미시작 |

---

## 🥇 Feature 1: Instagram 자동화 확장

### 현재 상태
- ✅ `/instagram/score` - 경기 결과 스크린샷
- ✅ `/instagram/preview` - 시리즈 프리뷰 스크린샷
- ✅ `/instagram/goals` - 골/어시스트 정보 (페이지네이션 지원)

### 추가할 콘텐츠

#### 1.1 Weekly Top Scorers (`/instagram/weekly-stats`)
- [ ] 매주 월요일 생성용
- [ ] 쿼리: 이번 주 득점/어시스트 Top 5
- [ ] 표시: 선수명, 팀 로고, 골/어시스트 수

#### 1.2 Standings Update (`/instagram/standings`)
- [ ] 경기 있는 날 저녁 생성용
- [ ] 표시: 전체 순위표 + 변동 표시 (⬆️⬇️)
- [ ] 이전 순위 대비 변동 계산 필요

#### 1.3 Player Milestone Alert
- [ ] 특정 기록 달성 시 자동 생성
- [ ] 예: 시즌 10골, 20골, 100포인트 등
- [ ] `alih_players` 테이블 모니터링 필요

#### 1.4 Series Recap (`/instagram/series-recap`)
- [ ] 2연전 종료 후 시리즈 전체 결과 요약
- [ ] 양 팀 총 득점, 각 경기 스코어

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

## 🥉 Feature 3: 다국어 지원 (i18n)

### 기술 스택
```bash
npm install react-i18next i18next i18next-browser-languagedetector
```

### 파일 구조
```
src/
├── i18n/
│   ├── index.ts           # i18n 설정
│   └── locales/
│       ├── ko.json        # 한국어
│       ├── ja.json        # 일본어
│       └── en.json        # 영어 (선택)
```

### 구현 단계
- [ ] i18n 라이브러리 설치 및 설정
- [ ] 한국어 번역 키 추출 (현재 하드코딩된 문자열)
- [ ] `ko.json` 작성
- [ ] AI로 `ja.json` 초안 생성 + 스포츠 용어 검수
- [ ] 언어 전환 UI 추가 (헤더에 🇰🇷/🇯🇵 버튼)
- [ ] 브라우저 언어 자동 감지

### 번역 대상 주요 문자열
- 네비게이션: 홈, 경기 일정, 하이라이트, 순위, 뉴스
- 경기 상태: 종료, 예정, 진행 중
- 통계 라벨: 득점, 도움, 승, 패, 연장, 승부치기
- 날짜 형식: 한국어/일본어 로케일 다름

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
| 2025-12-28 | 초기 로드맵 작성 |

