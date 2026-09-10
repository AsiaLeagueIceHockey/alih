# 2026-27 시즌 완전 런칭 — GPT-5.6 Terra 실행 계획

작성 모델: GPT-5.6 Sol
실행 권장 모델: `gpt-5.6-terra`, reasoning `high` 이상
작성일: 2026-09-10 KST
대상 저장소:

- `/Users/joelonsw/Desktop/ASIALEAGUE/alih`
- `/Users/joelonsw/Desktop/ASIALEAGUE/alih-batch`

이 계획은 현재 작업 중인 변경을 안전하게 완성하고, 2025-26 데이터를 보존하면서 2026-27 시즌의 일정·실시간 점수·웹 푸시·경기 상세·선수·순위·콘텐츠 자동화를 production에 런칭하기 위한 실행 명세다.

---

## 0. Terra에게 전달할 시작 프롬프트

새 task에서 모델을 GPT-5.6 Terra로 선택한 뒤 아래 내용을 그대로 전달한다.

```text
/Users/joelonsw/Desktop/ASIALEAGUE/alih/.omx/plans/2026-27-terra-execution-plan.md 를 처음부터 끝까지 읽고 계획 순서대로 실행해라.

반드시 함께 읽을 문서:
- /Users/joelonsw/Desktop/ASIALEAGUE/alih/AGENTS.md
- /Users/joelonsw/Desktop/ASIALEAGUE/alih/docs/2026-27-operations-audit.md
- /Users/joelonsw/Desktop/ASIALEAGUE/alih-batch/AGENTS.md

두 저장소 모두 codex/2026-27-operations 브랜치에 미커밋 변경이 있다. 기존 변경을 삭제·reset·checkout하지 말고 이어서 작업해라. 현재 코드는 보안 강화 도중 중단된 상태이므로 완료된 코드로 가정하지 마라.

각 Phase의 검증 Gate가 통과하기 전에는 다음 Phase로 넘어가지 마라. production DB 쓰기, Edge Function 배포, cron 활성화는 계획에 명시된 순서와 preflight/postflight 검증을 모두 만족할 때만 수행해라. 2025-26 데이터를 삭제하거나 덮어쓰지 마라.
```

---

## 1. 목표

최종 결과는 다음을 모두 만족해야 한다.

1. 2025-26 일정 129경기, 경기 상세 129개, 선수 143명, 순위 6팀, 응원 데이터가 보존된다.
2. 2026-27 정규시즌 120경기가 공식 일정과 일치하고 각각 고유한 공식 `score_url`을 가진다.
3. `score_url`과 YouTube 시청용 `live_url`이 분리된다.
4. 동일한 `game_no`를 사용하는 두 시즌의 경기 상세·응원·Instagram·딥링크가 충돌하지 않는다.
5. 30분 전, 경기 시작, 득점, 경기 종료 웹 푸시가 중복 없이 관심 팀 사용자에게 다국어로 전달된다.
6. 파서 오류 시 점수 0:0 회귀나 오탐 푸시가 발생하지 않는다.
7. 2026-27 시즌 선수·순위·개인 기록 source가 공식 공개되는 즉시 과거 데이터를 덮지 않고 적재할 수 있다.
8. 공개 이메일, 공개 관리자 기능, 공개 영상 쓰기, 익명 Storage 업로드 취약점이 제거된다.
9. cron은 경기 없는 시간에 매분 실행되지 않으며 첫 경기 canary 이후 제한적으로 활성화된다.
10. 두 저장소의 변경이 테스트·리뷰·커밋·푸시되고 배포 및 production 상태까지 검증된다.

완료 상태는 세 단계로 구분한다.

- **Prelaunch Ready:** 코드·migration·보안·fixtures·manual canary가 완료됐지만 실제 경기 HTML은 아직 검증 전.
- **First-game Validated:** 첫 경기에서 observe-only parser 결과가 공식 화면과 일치하고 제한된 DB write/Push canary까지 통과.
- **Season Automation Enabled:** 검증된 일정·실시간·콘텐츠 workflow가 제한 cron으로 운영되고 모니터링/중단 절차가 확인됨.

실제 첫 경기나 아직 공개되지 않은 roster/stat source를 기다리는 동안 `완료`라고 보고하지 않는다. Prelaunch Ready 상태와 다음 재개 시점을 문서에 남긴다.

---

## 2. 절대 규칙

- `git reset --hard`, `git checkout --`, 전체 파일 되돌리기 금지.
- `.omo/`는 기존 사용자 파일이므로 읽거나 stage하지 않는다.
- `.env`, PAT, service role key, VAPID private key, Slack webhook, AI API key를 출력·커밋하지 않는다.
- production 데이터 삭제, `TRUNCATE`, 시즌 전체 replacement 금지.
- migration은 precondition이 틀리면 `RAISE EXCEPTION`으로 전체 transaction을 실패시켜야 한다.
- `alih_schedule.id`가 경기의 불변 identity다. `game_no`는 시즌별 표시 번호다.
- 공식 점수 페이지는 `score_url`, YouTube 시청 주소는 `live_url`이다.
- 모든 batch writer는 `TARGET_SEASON`을 필수 환경변수로 요구한다. silent default 금지.
- 모든 자동 writer는 기본 dry-run 또는 명시적 활성화 flag를 사용한다.
- source parser는 HTTP/status/schema/count를 검증하고 fail closed 해야 한다.
- production 적용 전에 read-only Supabase MCP로 실제 상태를 다시 조회한다.
- frontend 변경 완료 전 `powerplay-ui-final-check` skill을 실행한다.
- production에는 반드시 리뷰·테스트·커밋·push된 정확한 SHA의 파일만 적용한다. dirty working tree의 SQL/함수를 적용하지 않는다.

---

## 3. 현재 사실 — 다시 조사하지 않아도 되는 기준값

운영 Supabase project ref: `nvlpbdyqfzmlrjauvhxx`.

| 항목 | 2026-09-09~10 확인값 |
|---|---:|
| `alih_schedule`, 2025-26 | 129 |
| `alih_schedule`, 2026-27 | 120 |
| `alih_game_details` | 129 |
| `alih_players`, 2025-26 | 143 |
| `alih_players`, 2026-27 | 0 |
| `alih_standings`, 2026-27 | 6 |
| `alih_cheers` | 62 |
| `profiles` | 91 |
| `notification_tokens` | 24 |
| `alih_news` | 2,670 |
| `player_cards` | 231 |

운영 constraint:

- `alih_game_details_game_no_key UNIQUE(game_no)` 존재.
- `alih_cheers_game_no_key UNIQUE(game_no)` 존재.
- `unique_team_player UNIQUE(team_id,name)` 존재.
- `unique_player_team UNIQUE(team_id,player_name)` 존재.
- `unique_standings_team_season UNIQUE(team_id,season)` 존재.
- `idx_alih_players_season_slug UNIQUE(season,slug) WHERE slug IS NOT NULL` 존재. 즉 v13은 사실상 적용돼 있다.
- `alih_schedule`에는 아직 `UNIQUE(season,game_no)`가 없다.
- `alih_predictions.schedule_id`는 integer이며 schedule FK가 없다.

정확히 확인된 backfill:

- 2025-26 경기 상세: 129/129 schedule 매칭, 누락 0.
- 2025-26 응원: 62/62 schedule 매칭, 누락 0.
- 시즌별 schedule `game_no` 중복: 0.

공식 2026-27 일정:

- 총 120경기.
- 공식 score ID `26924`~`27043`, 누락 없이 120개.
- 첫 경기 두 개: `26924`, `26925`.
- 2027-01-30/31 Freeblades 홈 경기 장소는 `Nishitokyo`다.

현재 deployed Edge Functions:

- `team-youtube` v8, verify_jwt=true
- `generate-sitemap` v8, verify_jwt=false
- `send-test-push` v5, verify_jwt=true
- `admin-list-notification-users` v2, verify_jwt=true
- `send-comment-notification` v5, verify_jwt=true
- `admin-delete-comment` v2, verify_jwt=true
- `live-game`은 미배포

현재 cron:

- `update-youtube-videos`: 6시간마다 active
- `cleanup_cron_logs`: daily active
- `cleanup_http_logs`: daily active
- `live-game`: 없음
- `supabase_realtime` publication table: 0개

현재 보안 사실:

- `profiles` 전체 공개 SELECT이며 email 91개가 노출 가능.
- `alih_videos` INSERT/UPDATE/DELETE가 public true 정책.
- `player-images` bucket은 anon INSERT/UPDATE/SELECT 허용, 크기/MIME 제한 없음.
- 관리자 Edge Function은 anon JWT만으로 service role 기능을 호출할 수 있음.
- `VITE_ADMIN_PIN`은 browser bundle에 포함되어 비밀이 아님.
- `increment_cheers`는 anon SECURITY DEFINER, mutable search_path, count 검증 없음.

---

## 4. 현재 작업 트리 상태 — 완료로 간주하지 말 것

두 저장소 브랜치 모두 `codex/2026-27-operations`다. 변경은 미커밋 상태다.

### `alih`에서 이미 시작된 변경

- 시즌 query/deep-link: `src/context/SeasonContext.tsx`, Instagram routes.
- 경기 상세/응원 `schedule_id` 전환: `src/pages/GameDetail.tsx`, `src/pages/TeamDetail.tsx`, `src/hooks/useCheers.ts`, `src/components/game/CheerBattle.tsx`.
- 관리자 Auth 전환 초안: `src/components/admin/AdminLayout.tsx`, `src/context/AuthContext.tsx`, admin pages.
- Edge auth helper 초안: `supabase/functions/_shared/auth.ts`.
- live polling 보안/idempotency 초안: `supabase/functions/live-game/index.ts`.
- 관리자/댓글/테스트 Push/YouTube 함수 보안 초안.
- migration 초안 v14~v18.
- 운영 문서: `docs/2026-27-operations-audit.md`.

### `alih-batch`에서 이미 시작된 변경

- `sync-current-schedule.js` 신규.
- capture/X/highlight/live/standings/player/stat에 시즌 필터 초안.
- `scrapeSingleGame.js` schedule_id upsert 초안.
- workflow에 `TARGET_SEASON` 추가 일부.

### 현재 코드의 알려진 미완성/결함

다음은 Terra가 반드시 먼저 고쳐야 한다.

1. `sql/v17_security_and_admin_hardening.sql`의 `profiles.is_admin` 방식은 사용자가 자신의 profile을 update할 수 있어 privilege escalation 위험이 있다. **현재 v17을 적용하지 말 것.**
2. `AdminLayout`도 `profile.is_admin`을 신뢰한다. 별도 admin table/RPC 방식으로 교체한다.
3. `live-game` outbox 초안은 compile/test되지 않았다. claim 후 process crash 시 알림 유실 가능성을 명시적으로 처리한다.
4. `live-game` parser는 HTML fixture 테스트가 없다. 배포 금지.
5. 관리자/댓글 Edge Function 수정은 Deno typecheck되지 않았다.
6. `send-comment-notification`은 v18 table을 전제로 한다. migration보다 먼저 배포하면 실패한다.
7. `parse-gamesheet.yaml`은 여전히 unsafe legacy `sync-schedule.js`를 먼저 실행한다.
8. `scrapeSingleGame.js`는 2026-27 공식 game-sheet source가 없어 현재 상세 데이터를 만들 수 없다.
9. `sync-current-schedule.js`는 DB와 공식 일정을 array index로 연결한다. 일정 순서 변경 시 연쇄 오매핑 위험이 있다.
10. batch writer들이 `TARGET_SEASON`을 기본 `2026-27`로 둔다. 필수 env로 바꿔야 한다.
11. `capture.py` 일부 상세 query가 아직 `game_no` 기반이다.
12. standings/player/stat scraper는 timeout, `raise_for_status`, source season 검증, 최소 row 검증, dry-run, nonzero exit가 부족하다.
13. `scrape-stat.py`가 JSON 값으로 문자열 `now()`를 보낸다. 제거하거나 실제 UTC ISO timestamp로 바꾼다.
14. sitemap은 두 시즌 동일 URL을 중복 생성한다.
15. package security audit에서 총 15건(high 12, moderate 2, low 1)이 보고됐다. 별도 lockfile 검토가 필요하다.
16. 마지막 성공 build는 관리자/보안 수정 이전이다. 현재 HEAD는 검증되지 않았다.

---

## 5. 아키텍처 결정

### 결정 A — 경기 identity

`alih_schedule.id`를 모든 cross-table relation의 canonical identity로 사용한다.

- `game_no`: 시즌별 표시 번호 및 legacy URL segment.
- URL: `/schedule/:gameNo?season=2026-27` 유지.
- 내부 조회: 먼저 `(season,game_no)`로 schedule을 찾고 이후 `schedule.id` 사용.
- `alih_game_details.schedule_id`, `alih_cheers.schedule_id`, `alih_predictions.schedule_id`에 FK.

### 결정 B — 관리자 권한

`profiles.is_admin`을 사용하지 않는다.

권장 구조:

```sql
alih_admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
)
```

- table은 anon/authenticated에 어떤 direct 권한도 주지 않는다.
- `is_current_user_admin()` SECURITY DEFINER RPC가 `auth.uid()`만 검사한다.
- RPC는 authenticated만 실행 가능.
- Edge Function `requireAdmin()`은 service-role로 `alih_admin_users`를 확인한다.
- bootstrap admin UUID는 repository에 저장하지 않고 사용자에게 관리자 이메일을 확인받은 뒤 one-time SQL로 등록한다.

### 결정 C — Push idempotency

launch 구조는 event claim과 recipient delivery ledger를 함께 사용한다.

- event key: `{season}:{schedule_id}:{type}:{score-key}`.
- reminder/start/end는 경기당 한 번.
- goal은 score transition별 한 번.
- claim 성공한 invocation만 발송.
- 결과를 success/failure count와 함께 기록.
- claim 후 crash에 대비해 `status`, `claimed_at`, `sent_at`, `last_error`를 둔다.

```sql
alih_notification_deliveries (
  event_id bigint references alih_notification_events(id),
  token_id bigint references notification_tokens(id),
  status text,
  claimed_at timestamptz,
  sent_at timestamptz,
  last_error text,
  unique(event_id, token_id)
)
```

- 각 token 발송 직전에 `(event_id,token_id)`를 atomic claim한다.
- 성공/실패를 recipient별로 기록한다.
- process crash 뒤 `pending` lease를 다룰 운영 규칙을 둔다.
- 성공 delivery는 절대 재발송하지 않는다.
- 실패/pending만 관리자 수동 retry할 수 있다.
- 첫 런칭에서는 자동 retry를 비활성화한다.
- `CANARY_ONLY=true`일 때 recipient query 자체를 `CANARY_USER_ID` 한 명으로 제한한다. UI나 caller body로 canary 대상을 전달하지 않는다.

### 결정 D — 배포 순서

Expand → code/functions → Contract → canary를 사용한다.

- 먼저 새 table/column/view/RPC를 추가해 기존 앱이 계속 동작하게 한다.
- 새 frontend/functions/batch가 새 contract를 사용하도록 배포한다.
- 이후 legacy unique/RPC/public policy를 제거한다.
- 마지막에 cron을 켠다.

### 결정 E — 2026-27 player card

현재 `player_cards.player_id`는 시즌별 `alih_players.id`를 참조하므로 같은 실제 선수도 시즌마다 다른 카드 identity가 된다. 이번 런칭에서는 기존 동작을 유지한다. stable person table은 별도 프로젝트로 미룬다.

---

## 6. Phase 1 — 작업 보존과 baseline 고정

### 작업

1. 두 저장소에서 `git status`, branch, diff를 저장한다.
2. `.omo/`를 stage하지 않는다.
3. 각 저장소의 base SHA와 upstream SHA를 기록한다.
4. 두 저장소에서 `git fetch origin` 후 `HEAD`, `origin/main`, branch upstream과 ahead/behind를 기록한다. 원격 변경이 있으면 force-push하거나 덮지 말고 fetch된 commit을 검토해 merge/rebase 충돌을 보존적으로 통합한다.
5. tracked 변경은 `git diff --binary`로 `/private/tmp`에 백업한다.
6. `git ls-files --others --exclude-standard`로 untracked 파일을 별도 inventory하고 `.omo/`, `.env`, cache를 제외한 v14~v18, `_shared/`, docs, plan, `sync-current-schedule.js`를 별도 안전 경로에 복사해 보존한다. 백업에 secret이 없는지 파일명과 diff를 먼저 검사한다.
7. tracked patch와 허용된 untracked 파일 각각의 SHA-256 manifest를 만든다. 복원 테스트는 별도 임시 디렉터리에서 수행하고 실제 worktree를 reset하지 않는다.
8. 이 계획 파일은 `.omx`의 임시 state로 취급하지 말고 최종 commit에 명시적으로 stage한다. README/AGENTS에서 경로를 연결해 durable handoff로 유지한다.
9. read-only Supabase MCP 연결과 project ref를 확인한다.
10. production 기준값을 다시 조회한다.
11. Phase 11 전에 필요한 production DDL/Edge deploy/secret/Vault/cron/GitHub workflow 변경이 기존 “온전한 시즌 런칭” 위임 범위에 포함됨을 기록한다. 범위가 바뀌었을 때만 사용자에게 재확인한다.
12. 관리자 권한을 받을 Supabase 로그인 계정과 Push canary 계정을 초기에 확인하되, 이메일/UUID/token을 문서나 로그에 남기지 않는다.

### 검증 SQL

```sql
select season, count(*), count(distinct game_no)
from public.alih_schedule
group by season order by season;

select count(*) from public.alih_game_details;
select count(*) from public.alih_cheers;
select season, count(*) from public.alih_players group by season;
select season, count(*) from public.alih_standings group by season;
```

### Gate 1

- 2025-26 schedule 129/129 unique.
- 2026-27 schedule 120/120 unique.
- details 129, cheers 62, 2025 players 143.
- 값이 다르면 계획을 중단하지 말고 원인을 조사하되 migration을 적용하지 않는다.
- tracked와 안전한 untracked 작업의 복구 가능 백업이 모두 존재한다.
- 관리자 bootstrap 대상과 canary 대상이 정해지지 않았으면 코드 작업은 진행할 수 있지만 production security contract/Push 발송 Gate는 통과시키지 않는다.

---

## 7. Phase 2 — migration을 expand/contract로 재구성

현재 v14~v18을 그대로 적용하지 말고 **expand와 contract를 별도 migration으로** 재작성한다. 기존 production writer가 잠시라도 깨지지 않는 것이 우선이다. 적용 순서가 파일명으로 드러나야 하며, `sql/` 파일을 canonical source로 사용하고 write MCP의 migration tool로 정확한 파일 내용을 한 번만 적용해 migration name/checksum을 기록한다. migration history가 정렬되지 않은 상태에서 `supabase db push`를 실행하지 않는다.

### 2.1 Schedule source 확장

대상: `sql/v14_reconcile_2026_27_schedule.sql`, `scripts/generate_schedule_sql.cjs`.

필수 수정:

- `score_url text` 추가.
- `UNIQUE(season,game_no)` 추가 전 null/duplicate assertion.
- 공식 120개 mapping을 DB row array index로 연결하지 않는다.
- initial mapping은 `(season, home_team, away_team, match_at)`가 정확히 1행인지 검증해 연결한다.
- 이후 sync는 `score_url`을 stable source identity로 사용한다.
- 공식 source를 적용 직전에 다시 fetch하고 timestamp와 SHA-256 checksum을 기록한다.
- precondition: 2026-27 120행, `game_status IS DISTINCT FROM 'Scheduled'`인 행 0, source 120행, 양방향 1:1 join 120행.
- postcondition: non-null score_url 120, distinct 120, source와 DB score-ID set difference 양쪽 모두 0. min/max/count만으로 판정하지 않는다.
- `live_url`, 점수, status, reminder, highlight는 update하지 않는다.

### 2.2 Game relation expand

새 **expand migration**:

- `alih_game_details.schedule_id bigint` 추가.
- 2025-26 schedule로 129행 backfill.
- 누락 0 assertion.
- FK `ON DELETE RESTRICT NOT VALID` 추가 후 validate.
- 기존 앱 compatibility를 위해 이 단계에서는 nullable과 `UNIQUE(game_no)`를 유지한다.
- `schedule_id IS NOT NULL` partial unique index는 expand용으로 허용하되 PostgREST upsert conflict target으로 사용하지 않는다.
- `alih_cheers.schedule_id bigint` 추가 및 62행 backfill.
- 누락 0 assertion.
- FK RESTRICT 추가/validate, nullable과 기존 game_no unique/RPC 유지.
- 신규 `increment_schedule_cheers(schedule_id,team,count)` 추가.
- return type BIGINT.
- `SET search_path = ''`와 schema-qualified object 사용.
- `team in ('home','away')`, count 1~100 validation.
- 새 RPC의 `ON CONFLICT`가 partial index predicate를 정확히 포함하거나 별도 atomic update/insert RPC로 동작하는지 DB test한다.
- **contract migration은 새 frontend가 배포·검증된 후에만** schedule_id NOT NULL/full UNIQUE, 기존 game_no unique drop, direct insert policy 제거, 구 RPC revoke를 수행한다.

### 2.3 Player/stat expand

- `alih_player_stats.season` 추가.
- 62행 모두 `2025-26` backfill하되 old writer compatibility 때문에 expand 단계에서는 nullable 유지.
- partial unique `(season,team_id,player_name) WHERE season IS NOT NULL` 추가.
- 기존 constraint와 nullable을 바꾸는 contract는 새 batch 배포 이후 수행.
- `alih_players`도 새 partial season unique를 먼저 추가하고 기존 global unique는 contract에서 제거한다.

### 2.4 Security expand

현재 v17의 `profiles.is_admin`을 폐기하고 다음을 생성한다.

- `alih_admin_users` private table.
- `is_current_user_admin()` authenticated RPC.
- `public_profiles(id,nickname,avatar_url)` limited view.
- video admin policies가 private admin table을 참조하도록 정의.
- Push event/outbox table과 `(event_id,token_id)` unique delivery ledger.
- event/delivery 상태, claim time, sent time, result/error 필드와 atomic claim RPC.
- storage 변경은 별도 contract migration으로 분리.

### 2.5 Predictions integrity

- 기존 83개 `schedule_id`가 실제 schedule과 모두 매칭하는지 assertion.
- `schedule_id`를 bigint로 변경.
- FK to `alih_schedule(id) ON DELETE RESTRICT` 추가/validate.

### Gate 2 — SQL 정적 리뷰

- 모든 migration이 transaction-safe.
- 모든 NOT NULL/legacy unique drop/policy revoke 같은 contract는 별도 파일이며 Phase 9까지 적용 금지.
- precondition과 postcondition 존재.
- 2025-26 DELETE/UPDATE는 명시적 backfill 이외 없음.
- `git diff --check` 성공.
- read-only MCP에서 실제 constraint 이름과 type을 다시 대조.
- 독립 reviewer가 P0/P1 finding 0개를 확인.

---

## 8. Phase 3 — frontend contract 완성

### 3.1 season/game identity

검토 대상:

- `src/context/SeasonContext.tsx`
- `src/hooks/useSchedules.ts`
- `src/pages/GameDetail.tsx`
- `src/pages/TeamDetail.tsx`
- `src/pages/InstagramPreview.tsx`
- `src/pages/InstagramScore.tsx`
- `src/pages/InstagramGoals.tsx`
- `src/pages/InstagramStandings.tsx`
- `src/pages/InstagramWeeklyStats.tsx`

완료 조건:

- `?season=`이 유효한 지원 시즌일 때만 선택 상태에 반영.
- 모든 schedule query는 season 포함.
- detail/cheers/stat relation은 schedule_id 사용.
- Instagram query key에도 season/schedule_id 포함.
- TeamDetail은 details를 schedule IDs로 조회.
- 2025-26와 2026-27 `game_no=1`을 각각 열었을 때 다른 schedule row가 표시.

### 3.2 관리자 인증

현재 `profile.is_admin` 초안을 제거한다.

- `useAdminAccess` hook 또는 AuthContext field가 `is_current_user_admin()` RPC를 호출.
- session이 바뀌면 admin cache 무효화.
- 로그인하지 않은 사용자는 OAuth login UI.
- 로그인했지만 admin이 아니면 접근 거부.
- `/admin/test-push`, `/admin/comments`, `/admin/videos` 모두 동일 AdminLayout 경계.
- `VITE_ADMIN_PIN` 사용을 코드와 `.env.example`에서 제거.
- AdminVideos CRUD는 authenticated session + RLS admin policy 사용.
- AdminComments 공개 profile view에는 email이 없으므로 이메일 표시는 제거.

### 3.3 공개 profile

- 일반 댓글 작성자 표시는 `public_profiles`만 조회.
- 본인 설정/AuthContext는 own-row `profiles` 조회.
- admin email 목록은 인증된 admin Edge Function만 제공.

### 3.4 sitemap

`supabase/functions/generate-sitemap/index.ts`:

- schedule URL에 `season` 포함.
- `(season,game_no)`마다 하나만 생성.
- player URL에도 season을 포함하거나 current-season canonical 정책을 명시.
- XML query separator는 `&amp;`로 escape.
- 중복 `<loc>` 0개 assertion 테스트.

### Gate 3

- 이 Gate는 production expand 전 **정적/unit/mock 검증**이다. 새 table/view/RPC가 필요한 production-backed browser 검증은 Gate 9에서 수행한다.
- `npm run build` 성공.
- 변경 파일 targeted ESLint error 0.
- 전체 lint는 기존 오류와 신규 오류를 구분; 신규 오류 0.
- mock/local schema에서 season/schedule_id/admin 상태 unit 또는 component 검증.
- 기존 production schema를 사용하는 현재 배포 앱의 smoke test는 회귀 baseline으로만 기록.
- 최종 모바일/desktop/admin/browser console/`powerplay-ui-final-check`는 expand+frontend 배포 뒤 Gate 9에서 실행.

---

## 9. Phase 4 — Edge Function 보안과 실시간 파서 완성

### 4.1 공통 auth helper

`supabase/functions/_shared/auth.ts`:

- 허용 origin: production과 필요한 localhost만.
- bearer token을 `auth.getUser(token)`으로 검증.
- admin은 `alih_admin_users`를 service-role로 확인.
- cron은 `x-cron-secret` 비교.
- method validation을 외부 DB/fetch보다 먼저 수행.
- error response에 내부 stack/secret 미포함.

Edge gateway matrix를 `supabase/config.toml`에 명시한다.

| Function | Gateway `verify_jwt` | 내부 검증 |
|---|---|---|
| `generate-sitemap` | false | read-only public |
| admin/list/delete/test | true | `requireAdmin` |
| `send-comment-notification` | true | `requireUser` + comment owner |
| `team-youtube` | false | constant-time `x-cron-secret`, 또는 admin JWT |
| `live-game` | false | constant-time `x-cron-secret` |

cron 함수에서 gateway JWT를 끄는 대신 함수 내부 secret 검증을 DB/fetch 전에 강제한다. 기존 `update-youtube-videos` cron은 secured `team-youtube` 배포 **전에** pause하고, 같은 maintenance window에서 Vault header 방식으로 교체한 뒤 재개한다.

### 4.2 관리자 함수

- `admin-list-notification-users`: admin only.
- `send-test-push`: admin only, input 길이 제한, expired token 삭제.
- `admin-delete-comment`: admin only, PIN 제거.
- `team-youtube`: cron 또는 admin only, YouTube response validation.
- deployed source와 local source diff를 배포 전에 확인.

### 4.3 댓글 알림

- body는 `commentId`만 받는다.
- caller user와 DB comment.user_id 일치.
- entity type/id는 DB comment에서 도출.
- game deep link는 DB schedule에서 season/game_no를 구함.
- payload 최상위 `url` 사용.
- comment ID idempotency event.
- 404/410 token 삭제.

### 4.4 live-game parser 분리

현재 monolithic function에서 pure parser를 `_shared` 또는 별도 module로 분리한다.

필수 fixture:

- 2026-27 pregame score page 최소 fixture.
- 과거 finished modern score page fixture.
- status node 없는 drift fixture.
- score table 없는 drift fixture.
- live 상태 fixture는 실제 첫 경기 전 확보 불가하면 synthetic 최소 fixture로 만들되 구조 출처를 문서화.

parser 결과 type:

```ts
type ParsedGame = {
  state: 'pregame' | 'live' | 'finished';
  rawStatus: string;
  homeScore: number;
  awayScore: number;
  periodScores: ...;
  events: ...;
  shots: ...;
};
```

fail-closed 규칙:

- status selector가 없으면 throw.
- pregame이면 DB score/status update와 **score/status-derived Push**를 하지 않음. 공식 schedule의 검증된 T-30 reminder는 별도 gate로 허용한다.
- live/finished인데 total score parse 불가면 throw.
- 기존 score 감소는 명시적 correction mode 없이는 거부.
- 알 수 없는 team/event는 전체 score update와 분리해 경고.
- 외부 fetch timeout 설정.
- 한 경기 실패는 다른 경기를 막지 않지만 response가 partial failure를 명확히 반환.

### 4.5 idempotency

- reminder/start/goal/end마다 atomic DB claim.
- event key 규칙 unit test.
- 동일 request 2개 동시 실행 시 한 개만 claim.
- `(event_id,token_id)` unique ledger로 각 recipient를 발송 직전 atomic claim하고 delivery result 기록.
- crash 후 stale pending lease와 failed recipient만 관리자 수동 retry하며 이미 sent인 recipient는 제외.
- stale pending/failed event 운영 조회 방법 문서화.
- 자동 retry는 첫 런칭에서 비활성.
- 한 poll 사이 양 팀 점수가 모두 증가하거나 2점 이상 점프하면 현재 코드처럼 홈팀 득점으로 추측하지 않는다. stable parsed goal event ID가 없으면 중립적인 “스코어 변경” 알림 하나를 보내거나 Push를 보류하고 로그로 표시한다.
- delivery ledger는 모든 Push 발송에 항상 사용한다. 첫 런칭 acceptance는 “성공 수신자 중복 0, 실패 수신자는 ledger에 기록하고 자동 재시도 없음”으로 고정한다.

### 4.6 polling 범위

- `CURRENT_SEASON` 필수 env. default 금지.
- `score_url`만 공식 parser 입력으로 사용.
- upcoming reminder와 live candidate 모두 current season filter.
- 경기 시작 전 30분~종료 후 제한 window만 대상.
- response에 processed/skipped/failed count.
- `OBSERVE_ONLY`, `REMINDER_ENABLED`, `LIVE_WRITE_ENABLED`, `LIVE_PUSH_ENABLED`를 독립 gate로 둔다.
- `OBSERVE_ONLY=true`는 live fetch/parse/delta log만 수행하고 live DB/Push를 변경하지 않는다.
- `REMINDER_ENABLED=true`는 schedule 기반 reminder만 허용하며 live start/score/end Push 권한을 의미하지 않는다.
- `LIVE_WRITE_ENABLED`와 `LIVE_PUSH_ENABLED`는 parser 검증 뒤 순서대로 켠다.
- `CANARY_ONLY=true`와 server-side `CANARY_USER_ID`를 둔다. canary 단계에서는 일반 recipient query가 실행되지 않는 테스트를 작성한다.

### Gate 4

- Deno typecheck 성공.
- parser fixtures 전부 성공.
- unauthorized/admin/cron auth 테스트 성공.
- duplicate invocation idempotency 테스트 성공.
- partial delivery 후 retry에서도 sent recipient 중복 0.
- CANARY_ONLY에서 비-canary recipient 조회/발송 0.
- pregame page가 점수/상태를 바꾸지 않음.
- test push는 명시적 canary user 외에는 발송하지 않음.
- 함수 배포는 아직 하지 않음.

---

## 10. Phase 5 — alih-batch 안전화

### 5.1 모든 writer에서 explicit season

다음 파일에서 default 제거 후 누락 시 즉시 exit 1:

- `sync-current-schedule.js`
- `scrapeSingleGame.js`
- `capture.py`
- `capture_weekly.py`
- `x_content.py`
- `scrape-highlights.py`
- `update-live-url.py`
- `scrape-standings.py`
- `scrape-stat.py`
- `scrape-players.py`

정규식 `^\d{4}-\d{2}$` 검증.

### 5.2 schedule sync identity

`sync-current-schedule.js`:

- official rows는 score_url로 unique.
- DB row에 score_url이 있으면 그것으로 match.
- initial null mapping은 date+home+away exact unique match만 허용.
- array index/game_no position matching 제거.
- unmatched/duplicate/ambiguous이면 write 전체 중단.
- dry-run은 actual delta만 출력.
- 변경 field별 before/after 요약.
- `DRY_RUN` default true.
- insert는 별도 `ALLOW_INSERT=true` 없으면 금지.

### 5.3 parse-gamesheet workflow 차단 제거

`.github/workflows/parse-gamesheet.yaml`:

- unsafe `node ./sync-schedule.js` step 제거.
- 현대 schedule sync가 필요하면 dry-run 전용으로 교체.
- `scrapeSingleGame.js`에 TARGET_SEASON 전달.
- 새로운 game-sheet source가 검증될 때까지 schedule cron과 parser cron을 주석 상태로 유지.
- workflow_dispatch 시에도 source mapping 없으면 명확히 failure.

### 5.4 2026-27 경기 상세 source discovery

현재 공식 score page와 legacy popup 49/50을 확인한다.

- modern score page가 roster/goals/penalties/goalie/spectator를 제공하는지 finished 과거 page로 구조 분석.
- 2026-27 첫 경기 후 legacy `popup/49` 또는 별도 sheet link 공개 여부 확인.
- source가 없으면 데이터를 추측하지 않고 기능을 partial 상태로 표시.
- source가 있으면 schedule.score_url 또는 별도 `game_sheet_url`을 저장.
- pure parser fixture를 작성한 뒤에만 writer 활성화.

### 5.5 standings/player/stat guards

- request timeout 20초 이하.
- `raise_for_status()`.
- title 또는 page marker로 target season 검증.
- standings 정확히 6팀 guard.
- player/stat 최소 row 수 guard는 실제 첫 공개값을 확인해 설정.
- 알려지지 않은 team code가 하나라도 있으면 write 금지.
- `now()` 문자열 제거; DB default 또는 UTC ISO.
- dry-run 제공.
- parse 0행은 성공이 아니라 exit 1.
- DB write 실패를 catch 후 삼키지 말고 exit 1.

### 5.6 capture schedule_id

`capture.py`:

- match object의 schedule id를 goal/detail helper까지 전달.
- `alih_game_details.schedule_id` query.
- Instagram route에는 season 유지.
- caption schedule lookup에도 season 또는 id 사용.

### 5.7 workflow 품질

모든 workflow:

- `timeout-minutes`.
- 동일 job 중복 방지 `concurrency`.
- Node는 `npm ci`와 lockfile 사용.
- Python dependency는 최소한 requirements 파일로 버전 고정.
- cron은 계속 주석/비활성 상태로 두고 수동 dispatch부터 검증.
- 실패 시 Slack 또는 GitHub notification 경로 문서화.

### Gate 5

- 모든 Node `node --check` 성공.
- Python `py_compile` 성공.
- schedule dry-run이 120 official/120 DB, ambiguous 0, actual delta 기대값 출력.
- service-role을 사용한 write-mode는 아직 실행하지 않음.
- workflow YAML parse 성공.
- reviewer P0/P1 0개.

---

## 11. Phase 6 — migration dry validation과 관리자 bootstrap 준비

### 6.1 Write 도구

현재 `supabase` MCP는 read-only다. 이를 그대로 유지한다.

DDL 적용이 필요할 때만 별도 `supabase-write` MCP를 다음 원칙으로 추가한다.

- 동일 project_ref.
- database/development/functions만 허용.
- PAT는 `SUPABASE_ACCESS_TOKEN` env 사용.
- 작업 종료 후 disable/remove.
- write tool 호출은 migration 파일 내용과 정확히 일치해야 함.

가능하면 Supabase migration tool을 사용하고 migration name을 기록한다. raw SQL을 여러 번 나눠 실행하지 않는다.

### 6.2 Admin UUID

- 사용자에게 관리자 Supabase 로그인 이메일 하나를 확인받는다.
- email을 로그/문서에 남기지 않는다.
- `auth.users`에서 정확히 1명인지 조회.
- 해당 UUID만 `alih_admin_users`에 insert하는 one-time SQL을 별도로 실행.
- repository migration에 개인 UUID/email을 커밋하지 않는다.

### 6.3 백업 증거와 recovery

- DB platform backup/PITR 상태 확인.
- 2025-26 보존 대상에 deterministic ordered hash를 기록한다. 새 column은 hash에서 제외한다.
- 예: `md5(string_agg((to_jsonb(row)-'score_url')::text, '|' order by id))` 형태로 schedule을 계산하고 details는 `schedule_id`, cheers는 `schedule_id`, player_stats는 `season`을 제외한다.
- 최소 대상: `alih_schedule` 2025-26, `alih_game_details`, `alih_players` 2025-26, `alih_standings` 2025-26, `alih_cheers`.
- row count와 hash를 함께 저장하며 PII table은 export/hash 대상에서 제외한다.
- transaction commit 전 실패는 migration 전체 rollback으로 끝나야 한다.
- commit 후에는 새 column/table을 파괴적으로 제거하는 down migration 대신 forward-compatible recovery 절차를 migration별로 준비한다.
- PITR/backup이 없다면 대상 table의 PII 없는 targeted export/aggregate를 확보하고 production 적용의 go/no-go를 명시한다.

### 6.4 Production dependency preflight

값을 출력하지 않고 존재/권한만 확인한다.

- Supabase Function secrets: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `YOUTUBE_API_KEY`, 새 `CURRENT_SEASON`, `CRON_SECRET`, `CANARY_ONLY`, `CANARY_USER_ID`, `OBSERVE_ONLY`, `REMINDER_ENABLED`, `LIVE_WRITE_ENABLED`, `LIVE_PUSH_ENABLED`, `RETRY_FAILED_DELIVERIES`.
- Vault에 cron header용 secret 존재.
- GitHub Actions secrets: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `SLACK_WEBHOOK_URL`.
- Vercel project 연결, production branch, 환경변수와 배포 권한.
- 두 GitHub repository의 PR/merge/push 권한.
- Supabase Edge deploy와 migration write 권한.

하나라도 없으면 해당 production migration/function/cron 단계로 넘어가지 않는다.

### Gate 6

- write 연결이 별도 이름이며 read-only 연결 유지.
- 관리자 대상 1명 확정.
- 모든 migration의 transaction rollback 조건과 commit 후 forward recovery 문서 존재.
- 2025-26 baseline count와 deterministic hash 확보.
- production dependency/secret/권한 preflight 통과.
- production에는 아직 변경 없음.

---

## 12. Phase 7 — 코드 고정, 독립 리뷰, 커밋과 push

production에 손대기 전에 두 저장소의 구현을 불변 SHA로 고정한다. Lore commit protocol을 따른다.

권장 `alih` commit 묶음:

1. season/schedule identity frontend.
2. expand/contract DB migrations.
3. admin/privacy/storage security.
4. Edge Function auth/idempotency/parser.
5. operations docs/tests/이 Terra 계획.

권장 `alih-batch` commit 묶음:

1. safe official schedule sync.
2. schedule_id and explicit season writers.
3. parser guards/workflow safety.
4. operations docs/tests.

stage 전에 `git diff --name-only`와 untracked inventory를 확인하고 `.env`, `.omo`, cache, secret을 제외한다. 두 branch를 origin에 push하고 full commit SHA를 기록한다. force-push는 금지한다. production에 적용할 migration/function source checksum이 이 SHA의 파일과 일치해야 한다.

Phase 7에서는 작업 branch commit/push와 immutable SHA 고정까지만 수행한다. `main` 병합은 Vercel production을 즉시 trigger할 수 있으므로 additive expand가 끝나는 Phase 9 전에는 금지한다. `alih-batch`도 push-trigger writer가 없는지 확인하기 전에는 main에 병합하지 않는다.

### Gate 7

- clean independent review에서 P0/P1 0개.
- pre-migration build/type/lint/parser fixture tests 성공.
- secret scan 결과 0.
- commit마다 Lore trailers 포함.
- 두 저장소 origin branch와 local HEAD 일치.
- 두 작업 branch의 origin SHA 확인, Vercel/default-branch delivery 경로 사전 확인.
- 아직 production 변경과 cron 활성화 없음.

---

## 13. Phase 8 — production additive expand migration 적용

한 migration씩 적용하고 매번 postflight를 조회한다.

권장 순서:

1. schedule identity + `score_url` schema expand.
2. game details/cheers schedule_id expand + new RPC.
3. player/stat season expand.
4. admin table/RPC + public_profiles expand.
5. notification event table.
6. predictions FK.

각 적용 직후 Supabase advisors security/performance를 다시 실행한다.

### Postflight 필수값

- 2025 schedule 129, 2026 schedule 120.
- details 129, schedule_id null 0, distinct 129.
- cheers 62, schedule_id null 0, distinct 62.
- player stats 62, season 2025-26 62.
- 2026 players 0 유지.
- admin table은 승인된 1명만 존재.
- notification events 0.
- Phase 6에서 기록한 2025-26 deterministic hash가 모든 대상에서 동일.

### Gate 8

한 값이라도 다르면 다음 migration/배포 중단. 이전 데이터 삭제로 복구하지 말고 원인 분석.

---

## 14. Phase 9 — frontend 및 Edge Function 배포

순서:

1. additive expand postflight가 통과했는지 다시 확인한다.
2. 두 저장소 모두 merge 직전 `origin/main` 변경을 fetch/review하고 작업 branch를 재검증한다.
3. `alih-batch`에 push-trigger writer가 없는지 확인한 뒤 main에 병합하고 `origin/main` SHA를 기록한다. scheduled workflow는 아직 비활성 상태여야 한다.
4. active `update-youtube-videos` cron을 pause한다.
5. Gate 7 immutable SHA에서 secured admin/list/delete/test/comment/team-youtube functions를 배포.
6. `live-game`은 `OBSERVE_ONLY=true`, `REMINDER_ENABLED=false`, `LIVE_WRITE_ENABLED=false`, `LIVE_PUSH_ENABLED=false`, cron 없이 수동 secret invocation만 가능하게 배포.
7. team-youtube cron을 Vault header 방식으로 교체하고 수동 1회 검증 후 기존 6시간 schedule을 재개.
8. sitemap 배포.
9. `alih` 작업 branch를 main에 병합해 Vercel production deploy를 trigger하고 `origin/main`/deployment SHA를 기록한다.
10. production integration/browser 검증:
   - 모바일 390x844와 desktop 양 시즌 Home/Schedule/Standings/GameDetail.
   - 관리자 미로그인/non-admin/admin 세 상태.
   - comments/public_profiles/video CRUD 권한.
   - browser console error 0.
   - `powerplay-ui-final-check` 완료.
11. 그다음 contract migration 적용:
   - profiles 공개 SELECT 제거.
   - video public writes 제거.
   - player-images anon INSERT/UPDATE 제거 및 10MB/image MIME 제한.
   - schedule_id/season NOT NULL 및 full UNIQUE 전환.
   - legacy game_no/global player unique 제거.
   - legacy `increment_cheers` anon/auth execute revoke.
   - Realtime에 secured `alih_cheers` 추가.
   - old PIN 경로 제거.
12. contract 적용 직후 Home/Schedule/GameDetail/댓글/관리자/영상/응원 전체 production smoke test와 mobile/desktop console 검사를 다시 수행한다. expand 상태에서의 성공 결과를 contract 후 검증으로 대체하지 않는다.

기존 `team-youtube` cron은 새 함수가 cron secret을 요구하면 실패하므로, 함수 배포 직전 job을 pause/교체하거나 같은 maintenance window에 Vault 기반 command로 바꾼다.

### Gate 9

- anonymous profile query로 email 획득 불가.
- public_profiles에는 id/nickname/avatar만 존재.
- anon video insert/update/delete 거부.
- anon player-images insert/update 거부.
- non-admin admin functions 403.
- admin functions 정상.
- old PIN만으로 관리자 접근 불가.
- old increment RPC 거부.
- new cheer RPC 정상 및 Realtime event 수신.
- deployed frontend/Edge Function source SHA가 Gate 7에 기록한 commit과 일치.
- production browser/UI final check 성공.
- contract 적용 후 전체 production smoke test 재성공.

---

## 15. Phase 10 — Push canary

사용자에게 canary 계정을 지정받는다. 임의 사용자에게 보내지 않는다.

테스트 순서:

1. canary token 1개 확인.
2. admin test Push 발송.
3. 404/410 cleanup은 실제 사용자 token을 조작하지 않고 fixture/mocked sender로 검증.
4. 첫 경기 전 `OBSERVE_ONLY=true`, `REMINDER_ENABLED=false`, `LIVE_WRITE_ENABLED=false`, `LIVE_PUSH_ENABLED=false`로 실제 score_url을 fetch/parse한다. DB 변경과 Push가 0인지 확인한다.
5. T-35 go 판정 직후 `CANARY_ONLY=true`, `REMINDER_ENABLED=true`, `LIVE_WRITE_ENABLED=false`, `LIVE_PUSH_ENABLED=false`로 제한 cron을 Phase 10 안에서 활성화한다.
6. T-30에 canary reminder를 먼저 검증하고, reminder 직후에도 live-derived DB write/Push가 0인지 확인한다.
7. 첫 경기 live 진입 시 official 화면과 observe-only parser output을 사람이 대조한다.
8. parser가 일치한 뒤 `OBSERVE_ONLY=false`, `LIVE_WRITE_ENABLED=true`, `LIVE_PUSH_ENABLED=false`로 제한된 DB write 한 poll을 검증한다.
9. DB write가 일치한 뒤 `LIVE_PUSH_ENABLED=true`, `CANARY_ONLY=true`로 start/score-change/end lifecycle을 검증한다.
10. 동일 request 동시 2회 → event 1개, recipient delivery 1개, Push 1회.
11. 각 deep link가 2026-27 정확한 경기로 이동하고 ko/ja/en payload를 확인한다.
12. 첫 경기 종료 후 15분에 canary cron을 해제한다.
13. 첫 경기 종료까지 canary-only를 유지한다. 일반 관심 팀 Push는 첫 경기 회고와 로그 검증 후 **다음 경기부터** 허용한다.

### 첫 경기 go/no-go

첫 경기는 2026-09-12 15:00 KST다.

- 14:15 KST(T-45): secret, deployment SHA, DB hash, function health preflight.
- 14:25 KST(T-35): 최종 go/no-go.
- 14:25까지 Gate 9가 통과하지 않으면 `schedule-only mode`로 남긴다: live-game cron 없음, DB 자동 write 없음, Push 없음.
- 14:30 KST(T-30): canary reminder만 허용.
- 14:55부터 두 첫 경기 종료 후 15분까지 live lifecycle을 canary-only로 관찰.
- 첫 경기 도중 일반 fan-out으로 전환하지 않는다.

실제 첫 경기 production record의 match time/score/status를 canary를 위해 변경하지 않는다. 별도 local parser test 또는 명시적 test-only function input을 사용한다.

### Gate 10

- 승인된 canary 외 발송 0.
- 중복 0.
- wrong-season deep link 0.
- Push event 기록과 delivery count 일치.
- observe-only 단계 DB row 변경 0.
- T-35 미통과 시 자동화/Push 0인 schedule-only 상태 확인.

---

## 16. Phase 11 — 일반 수신자 및 시즌 운영 활성화

### Vault 기반 cron

- `CRON_SECRET`을 Supabase secret과 Vault에 동일하게 저장하되 값은 출력하지 않는다.
- cron command는 anon JWT나 secret literal을 SQL에 직접 넣지 않는다.
- Vault decrypted secret을 runtime query로 가져와 header에 사용.

### live-game 빈도

24시간 매분 금지.

첫 경기 canary cron은 Phase 10에서 이미 종료한다. Phase 11은 첫 경기 회고가 통과한 후 **다음 경기부터** 일반 수신자 fan-out과 반복 경기일 운영을 활성화하는 단계다.

- 각 경기일 시작 35분 전 활성화.
- 마지막 경기 종료 확인 15분 후 비활성화.
- 활성 window 안에서 1분 polling.
- 다음 경기 첫 일반 fan-out도 시작 전 preflight와 중단 기준을 그대로 적용.

장기적으로는 5분 coordinator가 가까운 경기 존재 여부를 확인하고 필요한 window에서만 poll하도록 개선한다.

### 첫 경기 실시간 관찰

- 2026-09-12 첫 두 경기 score URLs `26924`, `26925`.
- official page와 DB를 사람이 대조.
- status, total score, period score, shots, events.
- Push reminder/start/goal/end.
- DB CPU, Disk IO, pg_net queue, cron logs.
- 함수 로그 error rate.

실행 중인 대화 세션에 의존하지 않는다.

- 실행 단계에서 “2026-27 first-game launch monitor” heartbeat/automation을 현재 task에 생성한다.
- T-45, T-35, T-30과 경기 중 5분 cadence로 상태를 확인한다. live-game 자체의 활성 window polling은 1분이다.
- automation prompt에는 이 계획 경로, project ref, 두 score URL, 중단 기준과 아래 unschedule 명령을 포함한다.
- 변경 없는 상태를 장애로 보지 않되 parser/DB/Push 상태 변화는 즉시 기록한다.

즉시 중단 명령은 job name을 고정한 뒤 사용한다.

```sql
select cron.unschedule('live-game-2026-27');
```

### 중단 조건

다음 중 하나면 cron 즉시 해제:

- parser missing selector.
- score regression.
- duplicate Push.
- 공식 점수와 불일치.
- health query 또는 API latency가 2초를 두 번 연속 초과.
- `net.http_request_queue`가 20건 초과 또는 oldest request가 5분 초과.
- Edge 5xx가 2회 연속.
- Push delivery 중복이 1건이라도 발견.
- observe-only인데 DB hash/row가 하나라도 변경.

중단 조건 발생 시 cron을 즉시 해제하고 `REMINDER_ENABLED=false`, `LIVE_WRITE_ENABLED=false`, `LIVE_PUSH_ENABLED=false`, `OBSERVE_ONLY=true`로 되돌린 뒤 원인과 마지막 정상 timestamp를 문서에 남긴다.

---

## 17. Phase 12 — 선수·순위·경기 상세 후속 활성화

공식 source가 실제 공개된 뒤에만 수행한다.

### 순위

- 2026-27 marker 확인.
- 정확히 6팀 parse.
- dry-run에서 DB zero rows와 diff 확인.
- 수동 write 1회.
- website Standings 검증 후 cron 활성화.

### 선수/개인 기록

- official roster/stat source가 2026-27인지 확인.
- 신규 `alih_players` 행으로 insert/upsert.
- 2025-26 143행 unchanged.
- unknown player/team mapping을 강제로 만들지 않음.
- 사진/bio enrichment는 roster identity 확정 후.
- 2026-27 선수 수가 각 공식 팀 roster 합과 일치.

### 경기 상세

- verified game-sheet source 확보.
- schedule_id upsert.
- 첫 경기 roster/goals/penalties/goalie/spectator를 official과 대조.
- 2025-26 detail 129 unchanged.
- 첫 주 수동 실행 후 cron 활성화.

---

## 18. Phase 13 — dependency와 advisor 정리

기능 런칭과 dependency update를 같은 commit에 섞지 않는다.

1. `npm audit --omit=dev` 재실행.
2. high 취약점 중 runtime 경로 확인.
3. 최소 버전 업데이트만 별도 branch/commit.
4. lockfile diff 검토.
5. build/browser/regression 재실행.
6. Supabase security/performance advisors 재실행.

Advisor known findings:

- mutable search_path functions.
- anon/auth executable SECURITY DEFINER functions.
- leaked password protection disabled.
- `pg_net` public schema.
- RLS auth function performance warnings.

이번 시즌 런칭에 직접 관련된 P0를 먼저 해결하고, extension schema 이동처럼 위험한 항목은 별도 maintenance로 분리한다.

---

## 19. 최종 검증 명령

### `alih`

```bash
git status --short --branch
git diff --check
npm run lint
npm run build
```

package.json에 typecheck/test script가 없으면 임의로 성공 처리하지 말고 “script 없음”을 보고한다. targeted ESLint와 build는 반드시 성공해야 한다.

### `alih-batch`

```bash
git status --short --branch
git diff --check
node --check sync-current-schedule.js
node --check scrapeSingleGame.js
PYTHONPYCACHEPREFIX=/private/tmp/alih-pycache python3 -m py_compile \
  capture.py capture_weekly.py x_content.py scrape-standings.py \
  scrape-stat.py scrape-players.py update-live-url.py scrape-highlights.py
```

추가:

- YAML parser로 모든 workflow 검사.
- official schedule dry-run.
- Edge Function Deno typecheck.
- parser fixture tests.
- secret scan.
- browser mobile/desktop/console.
- Supabase postflight SQL.
- GitHub Actions manual runs.
- deployment status 확인.

---

## 20. 최종 acceptance criteria

모든 항목이 true여야 완료다.

- [ ] 2025-26 핵심 row counts와 데이터가 보존됨.
- [ ] 2025-26 대상 table deterministic pre/post hash 전부 동일.
- [ ] 2026-27 일정 120, unique game_no 120, unique score_url 120.
- [ ] score URL 26924~27043 전부 매핑.
- [ ] live_url을 score URL로 덮어쓴 행 0.
- [ ] details/cheers/player stats season identity migration 완료.
- [ ] frontend 모든 관련 조회가 season/schedule_id 사용.
- [ ] 양 시즌 같은 game_no 상세가 충돌하지 않음.
- [ ] profiles email anonymous exposure 차단.
- [ ] video anonymous writes 차단.
- [ ] player-images anonymous writes 차단.
- [ ] 관리자 기능은 verified admin만 사용.
- [ ] VITE_ADMIN_PIN 사용 0.
- [ ] old insecure cheer RPC 우회 불가.
- [ ] Realtime cheers 실제 작동.
- [ ] Edge parser fail-closed tests 성공.
- [ ] Push duplicate 0 in concurrency canary.
- [ ] recipient delivery ledger로 partial retry 시 sent recipient 중복 0.
- [ ] 첫 경기 lifecycle은 canary-only, 일반 Push는 다음 경기부터.
- [ ] Push deep link wrong season 0.
- [ ] batch writer explicit season/dry-run guards.
- [ ] legacy unsafe sync step 제거.
- [ ] cron은 경기 window 외 실행되지 않음.
- [ ] first-game monitoring 성공.
- [ ] build/lint/syntax/browser checks 통과.
- [ ] 두 저장소 commit/push/deployment 확인.
- [ ] 운영 문서가 최종 production 상태로 갱신됨.
- [ ] 상태를 Prelaunch Ready / First-game Validated / Season Automation Enabled 중 정확히 보고함.

---

## 21. Rollback

장애 시 순서:

1. live-game cron unschedule.
2. GitHub Actions schedules disable.
3. 문제가 있는 Edge Function 직전 version 복구.
4. frontend 직전 안정 commit 재배포.
5. 2026-27 source mapping은 삭제하지 말고 additive correction.
6. contract migration 이후 rollback이 필요하면 새 column/table을 삭제하지 않고 legacy-compatible view/RPC를 임시 복원.
7. 2025-26 데이터는 rollback 대상으로 삼지 않는다.

보안 contract를 rollback해 공개 쓰기/이메일 노출을 다시 여는 것은 금지한다. 관리 기능 장애는 공개 권한 복구 대신 일시 비활성화로 처리한다.

---

## 22. 진행 보고 형식

Terra는 각 Phase 완료 시 다음만 간결하게 남긴다.

```text
Phase N: <이름>
완료: <수행 내용>
증거: <명령/SQL 결과>
변경 파일: <목록>
production 변경: 없음 또는 정확한 항목
다음 Gate: 통과/실패와 이유
```

최종 보고에는 다음이 필요하다.

- 기존 구조와 실제 production 상태.
- 변경 파일별 이유와 내용.
- 적용한 migration과 row-count 증거.
- 배포한 Edge Function version.
- 활성화한 cron의 UTC/KST 시간과 disable 방법.
- Push canary 및 첫 경기 결과.
- 테스트 명령과 결과.
- 남은 공식 source 대기 항목.
- 두 저장소 branch/commit/origin 상태.

---

## 23. Terra가 임의로 판단하면 안 되는 두 항목

다음은 데이터에서 결정할 수 없으므로 필요한 시점에만 사용자에게 한 번 질문한다.

1. 관리자 권한을 부여할 Supabase 로그인 계정 이메일.
2. 실제 Push canary를 받을 사용자 계정/기기.

그 외의 구현·검증 판단은 이 계획과 기존 architecture를 근거로 자율 진행한다.

---

## 24. 계획 검토 기록

최종 verdict: **APPROVED**

Sol 초안 이후 독립 architect/critic 검토를 순차적으로 수행했으며 다음 보완을 최종본에 반영했다.

- 진짜 expand/contract migration 분리와 old writer compatibility.
- production 적용보다 commit/push된 immutable SHA를 먼저 고정.
- main merge/Vercel/default-branch Actions 배포 시점 분리.
- tracked와 untracked 작업의 SHA-256 백업 manifest.
- production UI 검증을 additive schema 이후로 이동하고 contract 후 재검증.
- Edge Function별 gateway `verify_jwt`와 내부 auth matrix.
- event + recipient delivery ledger와 crash/partial retry 규칙.
- `CANARY_ONLY` server-side recipient 격리.
- `REMINDER_ENABLED`, `LIVE_WRITE_ENABLED`, `LIVE_PUSH_ENABLED` 독립 gate.
- 첫 경기 lifecycle 전체 canary-only 및 일반 Push의 다음 경기 전환.
- T-45/T-35/T-30 go/no-go와 schedule-only fallback.
- observe-only 실제 HTML 검증과 수치화된 중단 기준.
- 2025-26 deterministic pre/post hash 보존 증거.
- destructive down migration 대신 transaction rollback/forward recovery.
- official schedule checksum과 양방향 1:1 source mapping assertion.
- production secrets/Vault/GitHub/Vercel/권한 preflight.

Reviewer의 마지막 판정은 `APPROVED`였으며, 이 판정은 계획의 안전성과 실행 가능성에 대한 승인이지 현재 미완성 코드나 production 런칭 완료를 의미하지 않는다.
