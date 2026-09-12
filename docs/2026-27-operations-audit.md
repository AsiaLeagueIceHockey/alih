# 2026-27 시즌 운영 인수인계 및 런칭 런북

> 이 문서는 `alih`와 형제 저장소 `alih-batch`, 운영 Supabase를 함께 다루는 기준 문서다.
> 2026-27 시즌 관련 작업을 시작하는 agent는 코드를 수정하기 전에 이 문서를 먼저 읽어야 한다.
> 현재 미완료 구현의 상세 실행 순서는 `.omx/plans/2026-27-terra-execution-plan.md`를 따른다.
> 2026-09-12에 공개된 popup 49 공식 Game No·게임시트 source와 일정 정합성 보정은 [`2026-27-popup49-gamesheet-integration.md`](2026-27-popup49-gamesheet-integration.md)를 먼저 따른다.

최종 조사일: 2026-09-09~12 KST
시즌 개막일: 2026-09-12
운영 사이트: <https://alhockey.fans>
공식 일정/점수: <https://asiaicehockey.com/schedule>
공식 Game No/게임시트/통계: <https://www.alhockey.com/popup/49/scores.html>
Supabase project ref: `nvlpbdyqfzmlrjauvhxx` (`ASIALEAGUE`)

## 1. 가장 중요한 현재 상태

### 2026-09-12 popup 49 source 갱신

popup 49 정규시즌 일정 120경기와 공식 Game No `1..120`이 공개됐다. production의 경기 집합은 120대120으로 모두 대응하지만, 기존 시간순 내부 `game_no`와 공식 Game No가 54경기에서 다르므로 일괄 번호 치환하지 않는다. `alih_schedule.id`와 내부 `game_no`를 보존하고 `(source_popup_id, source_game_no)=(49, 공식 번호)`로 연결한다. 공식 source 기준 시작 시각 보정 5경기와 `Higashifushimi → Nishitokyo` 장소 보정 2경기도 확인됐다.

첫 경기 전 조사 시점에는 Game Sheet 링크가 0개이고 `ogs1/ogs2`가 404였으며 standings/point rank/GK/PP-SH는 0경기 빈 표, individual은 template marker 상태였다. 실제 게임시트 parser와 누적 통계 writer는 source가 채워진 뒤 canary 검증 전까지 계속 차단한다. 상세 증거와 Terra 구현 순서는 popup 49 인계서를 따른다.

이 문서에 적힌 코드나 migration이 존재한다는 사실은 production 적용을 뜻하지 않는다.

| 항목 | 확인된 상태 | production 반영 여부 |
|---|---|---|
| 2025-26 일정 | 129경기, 모두 `Game Finished` | 반영됨 |
| 2026-27 일정 | 120경기, 모두 `Scheduled` | 반영됨 |
| 2026-27 공식 score URL | `26924`~`27043`, 총 120개 | DB 120개 매핑 완료 |
| 2026-27 popup 49 source mapping | 공식 Game No `1..120` | DB 120개 매핑 완료 |
| 2025-26 순위 | 6팀 최종 기록 | 반영됨 |
| 2026-27 순위 | 6팀, 경기/승점 0 초기값 | 반영됨 |
| 2025-26 선수 | 143명 | 반영됨 |
| 2026-27 선수 | 138명, 여섯 팀 공식 roster | 반영됨 |
| 경기 상세 | 130행, `schedule_id` unique/not-null | 2025-26 129행 보존 + 2026-27 canary 1행 |
| 웹 푸시 구독 | 조사 당시 token 24개, profile 91개 | 존재 |
| `live-game` Edge Function | 로컬 소스는 있으나 배포 목록에는 없음 | 미배포 |
| `live-game` pg_cron | 비시즌 IO 장애 후 해제됨 | 비활성 |
| GitHub Actions | 뉴스 이외 정기 cron은 소스에서 주석 처리 | 대부분 수동 실행만 가능 |
| 뉴스 workflow | 2026-06-03까지 성공 후 inactivity로 비활성 | 비활성 |
| canonical migration | `202609100001`~`005`, `008` | 적용 완료, `006`·`007`·`009` 미적용 |
| Supabase MCP | project-scoped read-only 연결 및 운영 audit 완료 | 연결됨 |
| popup 49 조사 브랜치 | `codex/popup49-gamesheet-integration` | 문서/검증 작업 중 |

Phase 1 baseline hash와 local worktree backup은 [`2026-27-phase1-baseline.md`](2026-27-phase1-baseline.md)에 기록했다. Canonical additive migration `202609100001`~`005`는 production 적용과 postflight hash 검증을 마쳤다. Contract migration `006`~`009`, Edge Function 배포와 live cron/Push 활성화는 아직 남아 있다.

Prelaunch review branches [`alih PR #2`](https://github.com/AsiaLeagueIceHockey/alih/pull/2)와 [`alih-batch PR #1`](https://github.com/AsiaLeagueIceHockey/alih-batch/pull/1)은 main에 병합됐다. 병합 자체는 contract migration, Edge Function, cron 또는 fan Push 활성화를 의미하지 않는다.

현재 사이트가 2026-27 일정을 보여주는 것과 2025-26 수준의 실시간 운영이 준비된 것은 서로 다른 상태다. 일정 표시는 가능하지만 실시간 점수, 웹 푸시, 경기 상세, 새 시즌 선수/순위 자동 갱신은 아직 production에서 활성화되지 않았다.

## 2. 저장소와 책임 범위

### `alih`

경로: `/Users/joelonsw/Desktop/ASIALEAGUE/alih`
원격: `https://github.com/AsiaLeagueIceHockey/alih`

- React 18 + TypeScript + Vite frontend, Vercel 배포
- Supabase 직접 조회, PWA/service worker, Web Push 구독 UI
- Supabase Edge Function 소스, SQL migration, 운영 보조 스크립트
- Instagram 캡처용 내부 렌더링 라우트

### `alih-batch`

경로: `/Users/joelonsw/Desktop/ASIALEAGUE/alih-batch`
원격: `https://github.com/AsiaLeagueIceHockey/alih-batch`

- 공식 사이트 일정·게임시트·순위·선수·통계 스크래핑
- 뉴스 수집 및 AI 요약
- YouTube 생중계 URL과 하이라이트 연결
- Instagram/X용 이미지 및 문구 생성
- GitHub Actions 기반 실행, service role key로 Supabase 쓰기

두 저장소 중 하나만 수정하면 시즌 운영이 완성되지 않는다. DB identity 변경은 frontend 조회, Edge Function, batch upsert를 같은 배포 묶음으로 다뤄야 한다.

## 3. 2025-26에 실제 제공한 기능

### 팬 대상

- 시즌 일정, 경기 결과, 다음 경기와 최근 결과
- 실시간 총점, 피리어드별 스코어와 슛 정보
- 경기별 출전 로스터, 득점/어시스트, 페널티, 골리, 관중
- 팀 순위, 선수 개인 기록, 팀별 시즌 로스터와 선수 상세
- 경기 하이라이트, 팀 YouTube 영상, 다국어 뉴스
- 승부 예측, 응원 배틀, 댓글/답글 알림, 선수 카드
- 로그인, 선호 언어, 관심 팀, PWA 설치와 Web Push 구독

### 운영자용

- Instagram preview/result/goals/weekly 이미지 생성
- Groq 기반 Instagram/X 문구 생성 후 Slack 전달
- Google News 수집과 Gemini 요약
- YouTube live URL 검색과 highlight 자동 연결
- 관리자 댓글 삭제, 테스트 Push, 영상 관리, sitemap

## 4. 2025-26 데이터 흐름

```text
asiaicehockey.com / alhockey.com / YouTube / Google News
                         │
                         ▼
              alih-batch / Edge Functions
                         │
                         ▼
                   Supabase tables
                         │
          ┌──────────────┴──────────────┐
          ▼                             ▼
    alhockey.fans frontend       Web Push / Slack assets
```

### 일정과 결과

```text
공식 일정/score 페이지
  → schedule sync 또는 live-game
  → alih_schedule
  → useSchedules
  → Home / Schedule / GameDetail / Highlights
```

`alih_schedule.live_url`은 YouTube 생중계 주소다. 공식 경기 score 페이지 주소와 같은 용도로 사용하면 안 된다. 2026-27부터 공식 score 페이지는 별도 `score_url`로 저장하도록 준비했다.

### 경기 상세

```text
alhockey.com game sheet
  → alih-batch/scrapeSingleGame.js
  → alih_game_details
  → GameDetail / InstagramScore / InstagramGoals
```

경기 상세에는 홈/원정 당일 출전 로스터, 득점과 어시스트, 페널티, 피리어드별 스코어/SOG/PIM, 골리 기록, 경기장, 심판, 코치, 관중, 경기 시작/종료 시각이 들어간다.

### 시즌 선수와 개인 기록

```text
공식 individual/gksp/point_rank 페이지
  → scrape-players.py / scrape-stat.py
  → alih_players / alih_player_stats
  → Players / PlayerDetail / Standings 개인 기록
```

중요: `alih_players`는 `game_no`별 선수 목록이 아니다. 시즌 로스터와 누적 개인 기록이다. 경기별 실제 출전 선수는 `alih_game_details.home_roster`와 `away_roster`에 따로 저장된다.

### 순위

```text
공식 standings 페이지
  → scrape-standings.py
  → alih_standings
  → Home / Standings / InstagramStandings
```

### 웹 푸시

```text
사용자가 PWA에서 Push 허용
  → PushSubscription JSON
  → notification_tokens

profiles.favorite_team_ids + preferred_language
  + live-game의 경기 상태 변화 감지
  → 관심 팀 사용자 조회
  → 언어별 Web Push 발송
  → service worker가 해당 시즌 경기 URL을 연다
```

| 이벤트 | 조건 | 대상 |
|---|---|---|
| 경기 30분 전 | 시작 20~30분 전이고 `reminder_sent=false` | 홈/원정 팀 관심 사용자 |
| 경기 시작 | 공식 페이지가 live 상태로 최초 변경 | 동일 |
| 득점 | 홈/원정 총점이 이전 DB 점수보다 증가 | 동일 |
| 경기 종료 | 종료 상태로 최초 전환 | 동일 |
| 댓글 답글 | 댓글/답글 생성 | 원댓글/부모댓글 작성자 |

필수 구성은 frontend `VITE_VAPID_PUBLIC_KEY`, Edge Function `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, 사용자 `profiles`/`notification_tokens`, 그리고 `public/sw.js`다. 운영 Supabase에는 VAPID secret 이름이 모두 존재했다. 값은 문서나 로그에 출력하지 않는다.

## 5. 운영 Supabase 조사 결과

### 테이블과 조사 시점 행 수

| 테이블 | 행 수 | 역할 | 시즌 안전성 |
|---|---:|---|---|
| `alih_schedule` | 249 | 일정/점수/상태/live/highlight | `season` 있음 |
| `alih_standings` | 12 | 시즌 순위 | `season` 있음 |
| `alih_players` | 143 | 시즌 선수/누적 기록 | `season` 있음 |
| `alih_game_details` | 129 | 경기 상세/로스터/골 | 기존 `game_no`만 사용 |
| `alih_player_stats` | 62 | 개인 랭킹 | 기존 시즌 없음 |
| `alih_cheers` | 62 | 경기 응원 수 | 기존 `game_no` unique |
| `alih_predictions` | 83 | 승부 예측 | `schedule_id` 기반 |
| `alih_comments` | 29 | 댓글 | entity id 기반 |
| `alih_news` | 2,670 | 뉴스 | 시즌 비종속 |
| `alih_videos` | 12 | 관리 영상 | 시즌 비종속 |
| `alih_teams` | 6 | 팀 metadata | 시즌 공통 |
| `profiles` | 91 | 사용자 설정 | 시즌 비종속 |
| `notification_tokens` | 24 | PushSubscription | 시즌 비종속 |
| `player_cards` | 231 | 발급 선수 카드 | player id 참조 |

2025-26 운영 결과는 일정/결과 129경기, source 매핑 129/129, reminder 표시 43경기, YouTube live URL 59경기, 하이라이트 95경기, 경기 상세 129경기였다.

2026-27은 정규시즌 120경기(2026-09-12~2027-03-14)와 공식 score URL 120개가 DB에 매핑됐다. popup 49 공식 Game No source mapping 120개, 첫 경기 경기 상세 1개, 공식 여섯 팀 roster 138명과 `player-images/2026-27/` 사진 138개가 반영됐다. YouTube live/highlight/reminder는 아직 0이다. 플레이오프는 공식 발표 후 append-only migration으로 추가한다.

### 배포된 Edge Function

- `team-youtube` v8
- `generate-sitemap` v8
- `send-test-push` v5
- `admin-list-notification-users` v2
- `send-comment-notification` v5
- `admin-delete-comment` v2

로컬에는 `live-game` 소스가 있지만 배포 목록에는 없었다.

### Edge Function secret 이름

존재 여부만 확인: `ADMIN_PIN`, `SUPABASE_ANON_KEY`, `SUPABASE_DB_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`, `VAPID_PRIVATE_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_SUBJECT`, `YOUTUBE_API_KEY`.

`live-game` 재배포 전 `CURRENT_SEASON=2026-27`과 새로운 `CRON_SECRET`도 필요하다.

## 6. `alih-batch` 작업별 상태

| 기능 | 파일/workflow | source | 2026-27 상태 |
|---|---|---|---|
| 일정 동기화 | `sync-current-schedule.js`, `sync-schedule.yaml` | `asiaicehockey.com/schedule` | dry-run 120경기 성공, 쓰기 비활성 |
| 게임시트 | `scrapeSingleGame.js`, `parse-gamesheet.yaml` | popup 49 game sheet | 첫 경기 canary 성공, scheduled cron 비활성 |
| 순위 | `scrape-standings.py` | legacy standings | popup 47은 404, 49 후보는 빈 페이지 |
| 팀 roster/사진 | `import-team-rosters.py`, `import-team-rosters.yaml` | 공식 여섯 팀 player 페이지 | 138명/138사진 import 완료, manual dry-run 기본 |
| 선수/골리 누적 기록 | `scrape-players.py` | legacy individual/gksp | roster와 별개, 공식 누적 기록 source 대기 |
| 개인 랭킹 | `scrape-stat.py` | legacy point_rank | 새 데이터 대기 |
| YouTube live | `update-live-url.py` | 팀 YouTube | 시즌 필터 준비, cron 비활성 |
| 하이라이트 | `scrape-highlights.py` | 공식 YouTube | 시즌 필터 준비, cron 비활성 |
| 뉴스 | `scrape-news.py`, `live-news.yaml` | Google News RSS | inactivity 비활성 |
| Instagram | `capture.py` | 내부 capture routes | 시즌 파라미터 준비, cron 비활성 |
| Weekly | `capture_weekly.py` | 내부 weekly routes | 시즌 파라미터 준비, cron 비활성 |
| X 콘텐츠 | `x_content.py` | Supabase + Groq | 시즌 파라미터 준비, cron 비활성 |

공식 team roster import는 `import-team-rosters.py`와 `import-team-rosters.yaml`로 수동 실행한다. `TARGET_SEASON`은 필수이며 `DRY_RUN=true`가 기본이다. 2026-09-12에 main SHA `bcc622f`에서 dry-run 후 write canary를 실행했고, EAGLES 22 / FREEBLADES 22 / ICEBUCKS 23 / GRITS 25 / STARS 21 / HL ANYANG 25명, 총 138명의 season-scoped `alih_players`와 `player-images/2026-27/...` 138개를 등록했다. 기존 player card RPC는 새 player ID를 그대로 사용하므로 로그인 사용자는 선수 상세에서 카드를 발급할 수 있다.

GitHub Actions secret 이름 `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `SLACK_WEBHOOK_URL`은 모두 존재한다.

## 7. 구조적 문제와 결정

### 시즌 간 `game_no` 충돌

두 시즌 모두 `game_no=1`부터 시작하므로 `game_no`만 사용하는 `alih_game_details`, `alih_cheers`, Instagram query, Push deep link와 sitemap은 충돌한다. `alih_schedule.id`를 불변 identity로 사용하고 시즌별 `game_no`는 표시 번호로 유지한다.

### source URL 구분

- `score_url`: 공식 경기 점수/상태 페이지, live polling 입력
- `live_url`: YouTube 등 시청 링크, frontend 생중계 버튼 입력

서로 덮어쓰면 안 된다.

### 2025-26 고정 source

- `game_no + 20388` 계산은 2025-26 전용이라 폐기한다.
- `popup/47`은 2025-26 정규시즌 source였고 현재 404다.
- `popup/48`은 2025-26 플레이오프다.
- `popup/49`, `popup/50`은 열리지만 조사 시점 실제 데이터가 없었다.

### 시즌 없는 upsert

기존 `team_id`, `(team_id,name)`, `(team_id,player_name)` conflict key는 이전 시즌을 덮어쓸 수 있다. 시즌 복합 unique key가 필요하다.

### 보안 P0

- 브라우저의 `VITE_ADMIN_PIN`은 secret이 아니다.
- 관리자 알림 함수, 댓글 알림, cron 함수에 서버 검증이 필요하다.
- 운영 `profiles`는 모든 91개 행을 anon이 조회할 수 있어 email이 노출된다.
- 운영 `alih_videos`는 anon INSERT/UPDATE/DELETE가 모두 가능하다.
- `player-images` Storage는 anon INSERT/UPDATE가 가능하고 파일 크기/MIME 제한이 없다.
- 배포된 admin/list/test/comment/delete 함수는 내부 역할 검증이 없어 anon JWT로 service-role 기능을 호출할 수 있다.
- `team-youtube`도 anon JWT로 실행 가능하며 현재 6시간 cron이 active다.
- 기존 `increment_cheers`는 anon SECURITY DEFINER이며 count/team 검증과 고정 search_path가 없다.
- CORS는 운영 origin으로 제한해야 한다.
- Push 404/410 응답 토큰은 삭제해야 한다.
- 댓글 Push payload의 최상위 `url` contract를 service worker와 통일해야 한다.
- `supabase_realtime` publication에는 현재 public table이 하나도 없어 응원 구독이 실시간 동작하지 않는다.

### cron IO 장애 재발 방지

과거 `live-game`을 비시즌에도 매분 호출해 하루 1,440회 실행됐고 pg_net/cron 로그와 autovacuum 부하로 Disk IO/CPU가 고갈됐다. 경기 없는 시간에는 호출하지 않고, 경기 30분 전부터 종료 확인 시점까지만 polling해야 한다.

## 8. 구현 및 적용 상태

아래 frontend/batch 코드는 main에 병합됐다. Production DB에는 canonical additive migration `001`~`005`만 적용됐고 Edge Function/cron/Push는 미배포·비활성이다.

### `alih`

- 공식 일정에서 score ID 수집 및 `score_url` 분리
- `다이드ードリンコアイスアリーナ` 장소를 `Nishitokyo`로 수정
- `live-game`을 `CURRENT_SEASON`으로 제한하고 과거 URL 계산 제거
- Push URL과 Instagram routes에 season 포함
- query parameter season을 `SeasonContext`에 반영
- 경기 상세와 응원을 `schedule_id`로 조회

### `alih-batch`

- `sync-current-schedule.js` 신규, 120경기/URL dry-run 성공
- `DRY_RUN=true` 기본
- batch query/capture URL에 `TARGET_SEASON`
- 게임시트 mapping이 없으면 과거 URL로 추측하지 않고 실패
- 순위/선수/개인 랭킹 시즌별 upsert 준비
- live/highlight 일정에 시즌 필터

### migration

- `202609100001_schedule_source_expand.sql`: `score_url` 120개와 `(season, game_no)` unique. **적용 완료**.
- `202609100002_game_identity_expand.sql`: 경기 상세/응원 `schedule_id` backfill, FK/unique, 새 cheer RPC. **적용 완료**.
- `202609100003_player_season_expand.sql`: 선수/개인기록 season key와 2025-26 backfill. **적용 완료**.
- `202609100004_predictions_schedule_fk_expand.sql`: predictions bigint schedule FK. **적용 완료**.
- `202609100005_admin_notification_expand.sql`: private 관리자와 notification event/delivery 기반. **적용 완료**.
- `202609100008_game_identity_contract.sql`: 경기 상세/응원 `schedule_id` not-null, legacy game_no unique 제거, secured cheer realtime. **적용 완료**.
- `202609100006_profile_video_contract.sql`, `202609100007_storage_contract.sql`, `202609100009_player_season_contract.sql`: **미적용**.
- `sql/v14`~`v18`: 과거 초안. canonical migration을 대신해 적용하면 안 된다.

Edge Function source가 존재하거나 main에 병합된 사실을 production 배포로 판단하면 안 된다. contract migration, Edge Function 배포, 제한 cron, Push canary의 완성 순서와 수정 요구사항은 Terra 실행 계획을 따른다.

## 9. Supabase MCP와 `SUPABASE_ACCESS_TOKEN`

### 등록 상태

```text
name: supabase
url: https://mcp.supabase.com/mcp?project_ref=nvlpbdyqfzmlrjauvhxx&read_only=true&features=database%2Cdebugging%2Cfunctions
bearer_token_env_var: SUPABASE_ACCESS_TOKEN
```

ASIALEAGUE 한 프로젝트로 제한하고, read-only 및 필요한 feature만 열었다. PAT 값은 config나 git에 넣지 않는다.

### PAT 생성

1. Supabase Dashboard → Account Settings → Access Tokens로 이동한다.
2. `Codex alih MCP`처럼 목적이 드러나는 이름으로 Personal Access Token을 만든다.
3. 생성 직후 한 번만 표시되는 값을 복사한다.
4. `.env`, git, 문서, 채팅에 붙이지 않는다.

### Mac Codex 앱에 안전하게 주입

터미널에서 아래를 실행한다. 첫 명령은 입력값을 화면에 표시하지 않는다.

```zsh
read -s "SUPABASE_ACCESS_TOKEN?Supabase PAT: "
echo
launchctl setenv SUPABASE_ACCESS_TOKEN "$SUPABASE_ACCESS_TOKEN"
unset SUPABASE_ACCESS_TOKEN
```

이후 Codex 앱을 `Cmd+Q`로 완전히 종료하고 Applications/Dock에서 다시 연다. 새 task 또는 재시작된 task에서 `/mcp`로 `supabase`가 connected인지 확인한다.

값을 출력하지 않고 존재 여부만 확인:

```zsh
if [ -n "$(launchctl getenv SUPABASE_ACCESS_TOKEN)" ]; then
  echo "SUPABASE_ACCESS_TOKEN is available"
else
  echo "SUPABASE_ACCESS_TOKEN is missing"
fi
```

로그아웃/재부팅 뒤에는 다시 주입해야 할 수 있다. 토큰을 `~/.zshrc`, repository `.env`, 명령 인자에 평문 저장하지 않는다. 작업 후 제거는 `launchctl unsetenv SUPABASE_ACCESS_TOKEN`, 노출 의심 시 Dashboard에서 즉시 revoke한다.

### PAT 방식인 이유

Codex CLI 0.149.0에서 Supabase MCP 자동 OAuth 등록 시 Supabase가 요청 scope 일부를 거부했다. CIMD도 필요한 metadata가 없어 실패했다. 서버 등록은 정상이고 인증만 PAT environment 방식으로 전환했다.

### MCP audit 완료 결과

- v13 `(season,slug)` unique index는 운영 DB에 존재한다.
- canonical additive migration `001`~`005`의 column/table/constraint가 운영 DB에 존재한다.
- 경기 상세 129/129와 응원 62/62가 2025-26 schedule에 `schedule_id`로 backfill됐다.
- `UNIQUE(season,game_no)` constraint가 존재한다.
- `alih_predictions.schedule_id` 83개는 bigint/FK로 schedule과 연결됐다.
- `live-game` cron은 없고 team-youtube/cleanup cron 3개만 active다.
- Realtime publication table은 0개다.
- Edge Function deployed source와 local security 초안에 drift가 있다.
- Storage bucket 4개는 public이며 `player-images`에 anon write policy가 있다.
- Supabase Advisor는 mutable search_path, anon/auth SECURITY DEFINER 실행, leaked-password protection 비활성, public schema의 pg_net을 경고했다.

Auth provider/redirect와 세부 Function log는 실제 배포 직전 다시 확인한다. secret은 이름과 존재 여부만 조회하며 값을 출력하지 않는다.

쓰기 MCP는 기본으로 만들지 않는다. migration/배포는 diff와 rollback이 검토된 개별 단계로 진행한다.

## 10. 첫 경기 전 실행 Gate

### A. read-only audit

- [x] MCP 연결 및 v13~v18/schema/RLS/RPC/cron/Realtime/Storage/Edge 배포 상태 대조
- [ ] Edge Function drift와 pg_cron 비활성 확인

### B. database isolation

- [ ] 백업/rollback 지점 확인
- [ ] v13 필요 여부 확정
- [x] migration 002 적용 후 2025-26 상세 129개와 cheers backfill 확인
- [x] migration 003 적용 후 2025-26 player stats backfill 확인
- [ ] frontend/batch를 새 schema와 함께 배포할 수 있는지 확인

### C. official schedule

- [x] migration 001 적용, 2026-27 120행/unique score URL 120개 확인
- [x] `26924`~`27043`, 첫 경기 `26924`/`26925` 확인
- [x] `live_url` 미변경 확인
- [ ] 1월 30·31일 `Nishitokyo` 확인

### D. application/batch

- [ ] build/lint/mobile browser QA와 양 시즌 selector 회귀 테스트
- [ ] `?season=2026-27` deep link 및 Instagram routes 테스트
- [ ] 일정 dry-run 120개, 모든 Python/Node syntax 검사
- [ ] 2025-26 행 미변경 확인

### E. Push canary

- [ ] cron secret 검증, expired token 삭제 처리
- [ ] canary 한 명으로 30분 전/시작/득점/종료 테스트
- [ ] 한국어/일본어/영어, 정확한 시즌 URL, 중복 방지 확인

### F. 제한 활성화

- [ ] `live-game` 배포 후 첫 경기 시간대만 polling
- [ ] DB latency/CPU/Disk IO/pg_net queue 관찰
- [ ] 첫 두 경기를 사람이 공식 사이트와 대조
- [ ] 안정 확인 후 다음 경기일 자동화

## 11. workflow 재활성화

한꺼번에 켜지 않는다. 뉴스 수동 실행 → 일정 dry-run 정기 실행 → YouTube live 수동 실행 → Instagram preview 수동 실행 → Push canary → 첫 경기 종료 후 game sheet source 확인 → 공식 데이터 공개 후 standings/player/stat 수동 실행 → 검증된 cron만 활성화 순서다.

활성화 커밋에는 UTC cron/KST 시각, 시즌, source URL, dry-run 여부, 실패 알림, disable 방법을 기록한다.

## 12. 모니터링

다음을 경보 대상으로 삼는다.

- 일정 120개 불일치, score URL 누락/중복
- 시작 후 계속 `Scheduled`, polling 성공 시각 2분 이상 지연
- 공식 점수와 DB 불일치, 종료 경기 상세 누락
- 순위 갱신 지연, 선수 수 0 또는 급감
- Push 404/410 증가, Actions 연속 실패
- pg_net/cron log 급증, Supabase CPU/Disk IO 급증

## 13. rollback

1. Actions schedule 비활성화
2. `live-game` pg_cron 해제
3. Edge Function 직전 정상 버전 복구
4. frontend 2025-26 selector fallback 유지
5. 2026-27 행을 삭제하지 않고 additive correction
6. 2025-26 데이터는 rollback 대상으로 삼지 않음

데이터 삭제, `TRUNCATE`, 전체 시즌 replacement, production secret 변경은 사용자에게 범위와 복구 방법을 보고한 뒤에만 수행한다.

## 14. 다음 agent 시작 절차

```bash
cd /Users/joelonsw/Desktop/ASIALEAGUE/alih
git status
git branch --show-current
git diff --stat

cd /Users/joelonsw/Desktop/ASIALEAGUE/alih-batch
git status
git branch --show-current
git diff --stat
```

1. 이 문서를 끝까지 읽는다.
2. 두 저장소 dirty changes를 사용자 작업으로 간주하고 보존한다.
3. `/mcp`에서 Supabase 연결을 확인한다.
4. production write 전에 read-only audit을 완료한다.
5. migration과 실제 schema를 대조한다.
6. 첫 경기 시각과 공식 source 상태를 다시 확인한다.
7. 테스트 → canary → 제한 활성화 → 모니터링 순서를 지킨다.

## 15. 범위에 대한 명확한 답

“2025-26처럼 실시간 웹 푸시, 선수 목록, 경기별 정보까지 모두 파악하고 준비하는가?”

- **파악 범위:** 그렇다. 일정, 실시간 점수, 30분 전/시작/득점/종료 Push, 경기별 로스터/골/페널티/골리/관중, 시즌 선수와 개인 기록, 순위, YouTube live/highlight, 뉴스, Instagram/X까지 추적했다.
- **구조 이해:** 시즌 선수 명단과 경기별 출전 로스터는 서로 다른 파이프라인이다.
- **현재 구현:** 시즌 충돌 방지, 공식 score URL 수집, batch season guard, deep link, migration 초안을 준비했다.
- **현재 production:** 아직 2025-26 수준의 실시간 운영 상태는 아니다. `live-game` 미배포, cron 비활성, 새 선수/통계 source 대기, migration 미적용이다.
- **완료 조건:** MCP audit → migration → 보안 강화 Edge Function → Push canary → 제한 cron 활성화가 끝나야 작년 수준의 운영이 복원된다.

`일정이 보인다 = 런칭 완료`로 판단하면 안 된다.
