# 2026-27 시즌 운영 복구 인수인계

> 기준 시각: 2026-09-22 KST
> 대상: `alih`, 형제 저장소 `alih-batch`, 운영 Supabase project `nvlpbdyqfzmlrjauvhxx`
> 권장 실행 모델: GPT-5.6 Terra, reasoning `high` 이상
> 이 문서는 2026-09-22의 운영 상태를 기준으로 한 최신 복구 실행서다. 과거 설계와 migration 배경은 `2026-27-operations-audit.md`, 상세 phase 설계는 `.omx/plans/2026-27-terra-execution-plan.md`를 함께 참조한다.

## 0. 2026-09-22 실행 업데이트

아래 변경과 production postflight는 이 문서 최초 작성 뒤 실제로 완료됐다. 이 섹션이 이후 작업의 현재 기준이며, 아래 진단 섹션의 과거 수치는 장애 발생 당시 snapshot으로 남긴다.

- 프론트엔드 PR [#13](https://github.com/AsiaLeagueIceHockey/alih/pull/13)을 병합했다. `GameDetail`은 공식 Game Sheet가 아직 없는 종료 경기에서도 schedule의 팀, 최종 점수, 날짜/시간, 도시를 표시하고 다국어 `상세 기록 준비 중` 상태를 렌더링한다. 운영 번들에 세 언어 fallback 문구가 포함된 것을 확인했다.
- batch PR [#10](https://github.com/AsiaLeagueIceHockey/alih-batch/pull/10)을 병합했다. scheduled standings/player-rank writer는 `2026-27`, `DRY_RUN=false`, `ALLOW_WRITE=true`를 명시한다. 수동 dispatch는 여전히 dry-run 기본값이다.
- 내부 경기 2~5를 공식 popup 49 Game Sheet로 dry-run한 뒤 제한 write canary를 실행했다. `alih_game_details`의 2026-27 행은 1에서 5가 되었고, 네 경기의 schedule/detail 최종 점수, 관중, 골 이벤트 수가 일치한다. 2025-26 일정 129행과 상세 129행은 변하지 않았다.
- batch PR [#11](https://github.com/AsiaLeagueIceHockey/alih-batch/pull/11)을 병합했다. standings writer가 `updated_at`을 기록하도록 고쳤고, 2026-27 standings 여섯 행의 최신 시각은 2026-09-22 01:04 KST다. 2026-27 player stats는 104행으로 갱신됐다.
- batch PR [#12](https://github.com/AsiaLeagueIceHockey/alih-batch/pull/12)을 병합했다. Game Sheet writer는 KST 12:00~23:40에만 20분 간격으로 실행되며, 수동 canary와 season/identity write gate를 보존한다. 공식 sheet 미공개는 정상 종료하고 parser 오류는 workflow 실패로 드러난다.

남은 운영 게이트:

1. 6~9번 경기의 공식 Game Sheet는 아직 source에 없으므로 fallback 화면을 유지한다. source가 공개되면 자동 writer가 상세를 생성한다.
2. `scrape-players.py`의 개인 출전 기록과 `career_history`는 공식 six-team source가 완결될 때까지 활성화하지 않는다. 선수 상세의 G/A/PTS는 `alih_player_stats`를 조합해 표시하도록 이미 수정했다.
3. 실시간 score write와 start/goal/end Push는 `LIVE_WRITE_ENABLED=false`, `LIVE_PUSH_ENABLED=false`, `CANARY_ONLY=true` 상태를 유지한다. 2026-09-26 전 fixture + observe-only + live-write-only canary를 통과해야 한다.
4. 실제 Push canary를 받을 사용자 계정/기기는 데이터만으로 정할 수 없다. 지정 전에는 `CANARY_ONLY=false` 또는 일반 fan-out을 절대 활성화하지 않는다.

## 1. 결론

2026-27 시즌을 2025-26과 같은 수준으로 복구할 수 있다. 다만 현재는 정상 운영 상태가 아니며, 한 가지 장애가 아니라 네 개의 자동화 경로가 각각 차단되어 있다.

1. 완료 경기 상세가 생성되지 않아 완료 경기 9개 중 8개가 오류 화면으로 끝난다.
2. 실시간 Edge Function은 호출되지만 실시간 DB write와 경기 이벤트 Push가 비활성이라 점수, 상태, `live_data`가 갱신되지 않는다.
3. 30분 전 Push는 관리자 canary에만 발송되며 일반 사용자 fan-out은 비활성이다.
4. 순위와 선수 개인 기록 예약 workflow는 성공해도 기본 dry-run이라 운영 DB를 갱신하지 않는다.

복구는 가능하지만, 실시간 write와 fan-out Push를 한 번에 켜면 안 된다. 사용자 화면의 graceful fallback을 먼저 배포하고, 공식 source별 writer를 복구한 뒤, 2026-09-26 경기에서 canary를 통과한 기능만 단계적으로 활성화한다.

## 2. 운영 상태 비교

2026-09-22 운영 DB read-only 점검 결과다.

| 항목 | 2025-26 | 2026-27 | 판정 |
|---|---:|---:|---|
| 일정 | 129 | 120 | 일정 집합은 정상 |
| 종료 경기 | 129 | 9 | 현재 시점과 일치 |
| 경기 상세 | 129 | 1 | 장애, 완료 8경기 누락 |
| `live_data` | 80 | 0 | 실시간 write 비활성 |
| `reminder_sent` | 43 | 1 | canary 1경기만 발송 |
| YouTube `live_url` | 59 | 0 | 자동화 미활성 |
| 하이라이트 | 95 | 2 | 부분 동작 |
| 선수 | 143 | 138 | roster import는 완료 |
| 출전 기록이 있는 선수 | 140 | 0 | 누적 선수 기록 미반영 |
| 득점 기록이 있는 선수 | 129 | 0 | `alih_players` 미갱신 |
| `career_history`가 있는 선수 | 143 | 0 | 선수 이력 미반영 |
| 개인 랭킹 행 | 62 | 78 | 별도 table에 일부 존재 |

2026-27 `alih_player_stats`는 78행, 포인트 합계 36이지만 마지막 갱신은 2026-09-13 10:18 KST다. `alih_standings`는 여섯 팀 모두 마지막 갱신이 2026-08-31이며 네 팀만 1경기, 두 팀은 0경기로 남아 있다. 9경기가 종료된 현재 공식 누적 상태가 아니다.

완료 경기 상세 현황:

| 내부 `game_no` | `schedule_id` | 최종 점수 | 상세 |
|---:|---:|---:|---|
| 1 | 686 | 4-3 | 있음 |
| 2 | 687 | 3-2 | 없음 |
| 3 | 688 | 2-3 | 없음 |
| 4 | 689 | 6-2 | 없음 |
| 5 | 690 | 4-3 | 없음 |
| 6 | 691 | 0-4 | 없음 |
| 7 | 692 | 6-2 | 없음 |
| 8 | 693 | 3-4 | 없음 |
| 9 | 694 | 1-2 | 없음 |

공식 popup 49 점수 페이지는 조사 시점에 1~5번 경기만 Game Sheet 링크를 제공하고, 6~9번은 점수표에 링크가 없다. 따라서 2~5번은 즉시 parser 검증과 백필 대상이고, 6~9번은 공식 Game Sheet 공개 전에도 화면이 정상적으로 최종 점수와 기본 정보를 보여야 한다.

다음 경기 window:

| 일시 KST | 내부 번호 | 공식 번호 | 장소 |
|---|---:|---:|---|
| 2026-09-26 14:00 | 10 | 11 | Hachinohe |
| 2026-09-26 15:00 | 11 | 10 | Tomakomai |
| 2026-09-27 13:00 | 12 | 13 | Hachinohe |
| 2026-09-27 14:00 | 13 | 12 | Tomakomai |

내부 `game_no`와 공식 `source_game_no`는 순서가 다를 수 있다. 모든 cross-table relation과 알림 event key는 `alih_schedule.id`를 사용하고 공식 Game Sheet URL은 `source_popup_id/source_game_no`로 만든다.

## 3. 장애별 진단

### 3.1 완료 경기 상세 오류

재현 URL: <https://alhockey.fans/schedule/8?season=2026-27>

`src/pages/GameDetail.tsx`는 완료 경기에서 `alih_game_details.schedule_id`를 조회한다. 상세가 없고 `live_data`도 없으면 live/fallback UI에 진입하지 못하고 `경기 상세 기록을 불러올 수 없습니다`를 반환한다. 현재 누락 8경기 모두 `live_data`도 없으므로 전체 페이지가 실패한다.

이는 데이터 누락과 프론트엔드 결함이 결합된 장애다. 공식 상세가 늦게 공개되는 것은 정상적으로 발생할 수 있으므로, 완료 경기 기본 화면이 상세 row의 존재에 의존하면 안 된다.

필수 수정:

- `alih_schedule`의 최종 점수, 팀, 날짜, 시간, 도시만으로 완료 경기 결과 카드를 항상 렌더링한다.
- `alih_game_details`가 없으면 상세 섹션에 다국어 `상세 기록 준비 중` 상태를 표시한다.
- 응원, 댓글, 공유, 제휴 배너 등 schedule 기반 섹션은 유지한다.
- period summary, 득점, 페널티, 당일 roster, 관중은 상세가 있을 때만 렌더링한다.
- 완료 경기에서 `live_data` 유무는 기본 결과 화면 진입 조건이 아니어야 한다.
- `?season=2026-27`이 없는 legacy URL과 시즌 query가 있는 URL을 모두 회귀 테스트한다.

### 3.2 경기 상세 writer 미운영

`alih-batch/.github/workflows/parse-gamesheet.yaml`은 수동 canary 전용이며 schedule이 주석 처리되어 있다. `scrapeSingleGame.js`는 `schedule_id` upsert, 명시적 `TARGET_SEASON`, write gate를 갖췄지만 자동 실행 경로가 없다.

필수 복구:

- 먼저 공식 링크가 있는 내부 경기 2~5를 dry-run하고 공식 Game Sheet의 팀, 최종 점수, roster 수, 골, 페널티, 골리와 대조한다.
- 모두 일치할 때만 `DRY_RUN=false`, `ALLOW_GAME_SHEET_WRITE=true`, `GAME_IDENTITY_CONTRACT_VERIFIED=true`로 2~5를 백필한다.
- 6~9의 404 또는 미공개 응답은 실패가 아닌 `not published`로 기록하되, 무한 재시도하지 않는다.
- 경기 종료 후 15분, 1시간, 6시간, 다음 날의 bounded retry를 두고 상세가 생성되면 중단한다.
- parser row 오류를 경기별로 삼키고 workflow 전체를 성공 처리하는 현재 구조를 고쳐, 요청한 경기 중 parser 오류가 하나라도 있으면 nonzero exit로 운영자에게 알린다. 공식 미공개만 별도 정상 상태로 취급한다.
- 상세 upsert 뒤 `schedule_id`, source identity, 최종 점수를 postflight 검증한다.

### 3.3 실시간 점수 미갱신

운영 `live-game` v1과 `alih-live-game-windowed` cron은 실행 중이다. cron은 경기 30분 전부터 시작 후 4시간까지 5분 간격으로 함수를 호출한다. 그러나 배포 환경은 다음과 같았다.

```text
CURRENT_SEASON=2026-27
REMINDER_ENABLED=true
CANARY_ONLY=true
LIVE_WRITE_ENABLED=false
LIVE_PUSH_ENABLED=false
OBSERVE_ONLY=false
RETRY_FAILED_DELIVERIES=false
```

함수 소스는 `OBSERVE_ONLY=true`뿐 아니라 `LIVE_WRITE_ENABLED=false`도 observe 경로로 처리한다. 실제 경기 동안 HTTP 200 호출이 반복됐지만 DB update 전에 `continue`하므로 2026-27 `live_data`는 0행이고 실시간 점수·상태도 기록되지 않았다. 종료 점수는 별도 `sync-results` workflow가 나중에 반영했다.

필수 복구:

- 실제 `score_url` HTML을 fixture로 저장하고 시작 전, 진행 중, 득점, 연장, 종료 상태 parser 테스트를 만든다.
- score regression, 팀 불일치, status 불명, 양 팀 동시 점프는 fail closed한다.
- 수동 invocation에서 `OBSERVE_ONLY=true`로 공식 화면과 parse 결과를 대조한다.
- 다음으로 `LIVE_WRITE_ENABLED=true`, `LIVE_PUSH_ENABLED=false`, `CANARY_ONLY=true`에서 한 poll만 쓰고 DB를 검증한다.
- write가 정상일 때만 canary 사용자에게 start/score/end Push를 검증한다.
- canary lifecycle이 끝나기 전 `CANARY_ONLY=false`를 사용하지 않는다.
- 결과 확정 fallback인 `sync-results`는 유지한다. 실시간 parser와 결과 reconciliation은 서로 대체 관계가 아니다.

### 3.4 30분 전 및 경기 이벤트 Push

2026-09-21 경기 9의 reminder event는 정상 생성됐고 관리자 canary 계정의 구독 2개에 성공했다. 일반 사용자가 받지 못한 이유는 `CANARY_ONLY=true`로 recipient query가 관리자 한 명으로 제한됐기 때문이다. 또한 `LIVE_PUSH_ENABLED=false`라 시작, 득점, 종료 Push는 누구에게도 발송될 수 없었다.

필수 복구:

- reminder canary 성공을 전체 Push 정상화로 간주하지 않는다.
- T-35 이전에 Push 구독 수, 관심 팀 매핑, 만료 endpoint 정리, locale별 payload, deep link를 점검한다.
- T-30 reminder canary, start, 한 번의 score transition, end lifecycle을 event/delivery ledger로 검증한다.
- event key는 `{season}:{schedule_id}:{type}:{score-key}`를 유지한다.
- 성공 delivery는 재전송하지 않고 실패/pending만 제한적으로 retry한다.
- 일반 fan-out 전환 뒤 성공/실패/410 만료 수와 비-canary recipient 수를 기록한다.
- 과거 경기의 `reminder_sent`를 임의 reset해 재발송하지 않는다.

### 3.5 순위가 갱신되지 않음

`update-standings.yaml`의 예약 실행은 `inputs.dry_run`과 `inputs.allow_write`를 사용한다. `schedule` event에는 dispatch input이 없으므로 빈 문자열이 전달되고, `season_config.write_enabled()`는 이를 `DRY_RUN=true`, `ALLOW_WRITE=false`로 해석한다. 따라서 workflow는 성공하지만 DB를 쓰지 않는다.

필수 복구:

- 예약 실행에는 명시적으로 `TARGET_SEASON=2026-27`, `DRY_RUN=false`, `ALLOW_WRITE=true`를 전달한다.
- 수동 실행 기본값은 계속 dry-run으로 유지한다.
- 공식 source season marker, 2~6개 unique team, games played 총합과 종료 경기 수의 합리적 관계를 검증한다.
- write 전 현재 row snapshot을 남기고 `team_id,season` upsert 후 `updated_at`, 팀 수, 순위 중복, 경기 수를 postflight 검증한다.
- workflow 성공 조건에 실제 write mode와 changed row count를 summary로 출력한다. dry-run 성공과 write 성공이 UI에서 구분되어야 한다.

### 3.6 선수 기록과 선수 이력 미반영

2026-27 `alih_players` 138행은 2026-09-12에 가져온 roster snapshot이다. 전원 사진과 bio는 있지만 `games_played`, 득점 필드, `career_history`가 비어 있다. 반면 순위 화면은 별도 `alih_player_stats`를 읽으므로 일부 개인 랭킹만 나타날 수 있다. 선수 상세는 `alih_players`의 누적 필드와 `career_history`를 직접 읽으므로 비어 보인다.

`update-stat.yaml`도 예약 실행에서 같은 dry-run 문제가 있다. `scrape-players.py`는 `inputs.run_individual_records`가 true일 때만 실행되는데 schedule event에는 이 값이 없어 실행되지 않는다.

필수 복구:

- `alih_player_stats`를 공식 랭킹의 canonical table로 유지할지, `alih_players`에 누적 필드를 병합할지 계약을 먼저 고정한다.
- 권장안은 roster identity와 상세 프로필은 `alih_players`, 시즌 누적 통계는 season-scoped stats table로 분리하고 선수 상세가 두 source를 조합해 읽는 것이다.
- `career_history`는 roster import에서 보존하거나 별도 person/history source로 적재한다. 현재 시즌 통계 writer가 기존 이력을 null로 덮지 않도록 한다.
- `(season, team_id, jersey_number)`와 정규화 이름을 함께 검증하고 매칭 실패는 write 전체를 중단한다.
- 예약 stat workflow의 dry-run/write mode를 분리하고 실제 changed row count를 검증한다.
- `scrape-players.py`는 공식 `individual.html`에 여섯 팀과 유효 row가 모두 있을 때만 활성화한다.
- 선수 상세의 골 순위도 현재 `alih_players.goals`를 기준으로 계산하므로 canonical stats 결정에 맞춰 수정한다.

### 3.7 결과, 라이브 URL, 하이라이트

- `sync-results`는 현재 종료 점수와 `Game Finished` 상태를 복구하는 유일하게 신뢰 가능한 자동 writer다. 유지하고 매 실행마다 source/DB conflict를 fail closed한다.
- `live_url`은 2026-27에 0개다. `score_url`과 절대 혼용하지 말고 팀 YouTube source가 확인된 경기만 저장한다.
- 하이라이트는 2개만 존재한다. 공식 영상 source가 없으면 미등록을 정상 상태로 두되, workflow summary에서 신규/기존/미발견을 구분한다.

### 3.8 보안과 운영 부채

시즌 복구의 직접 원인은 아니지만 전체 활성화 전에 별도 lane으로 처리한다.

- `public.public_profiles` security-definer view 경고.
- `generate_player_slug`, `handle_new_user`, `get_next_card_serial`, `generate_player_card`, `increment_cheers`의 mutable `search_path`.
- anon/authenticated가 실행 가능한 일부 SECURITY DEFINER 함수.
- `pg_net` public schema 노출.
- leaked password protection 비활성.

보안 변경은 live 복구와 한 commit에 섞지 않는다. RLS/함수 권한 변경 전 frontend와 Edge Function 호출자를 inventory하고 rollback SQL을 준비한다.

## 4. Terra 실행 순서

각 phase는 독립 commit과 검증 증거를 남긴다. Gate가 실패하면 다음 phase로 넘어가지 않는다.

### Phase 0: 기준 상태 재확인

- 두 저장소 `AGENTS.md`, 이 문서, `2026-27-operations-audit.md`, 기존 Terra plan을 읽는다.
- 두 저장소의 branch/status/upstream을 확인하고 사용자 변경을 보존한다.
- 아래 read-only SQL로 수치를 다시 확인한다.
- 운영 Edge Function secret 값은 출력하지 말고 boolean gate만 별도 안전한 방법으로 확인한다.

Gate: 2025-26 count/hash가 기존 기준과 일치하고 2026-27 변동만 설명 가능해야 한다.

### Phase 1: 완료 경기 화면 복구

- `GameDetail.tsx`의 schedule 기반 finished fallback을 구현한다.
- 상세 없음, 상세 있음, `live_data`만 있음 세 상태를 fixture/test로 고정한다.
- `/schedule/8?season=2026-27`에서 최종 점수 3-4와 기본 정보가 표시되고 오류 문구가 사라지는지 모바일과 데스크톱에서 확인한다.

Gate: typecheck, test, build, 정확한 production-like route의 브라우저 검증이 모두 통과해야 한다.

### Phase 2: 경기 상세 복구와 자동화

- 내부 2~5번 dry-run과 공식 Game Sheet 대조.
- 2~5번 bounded write와 postflight.
- 미공개 Game Sheet retry 정책 및 workflow nonzero failure semantics 구현.
- 다음 종료 경기부터 자동 상세 생성.

Gate: 2~5 상세 4행이 추가되고 schedule/detail 최종 점수가 모두 일치한다. 2025-26 상세 129행은 변하지 않는다.

### Phase 3: 순위와 선수 통계 writer 복구

- schedule event용 env를 명시해 dry-run-only 문제를 수정한다.
- 순위 한 번, 개인 랭킹 한 번을 수동 dry-run 후 write canary한다.
- player detail의 canonical stats read path를 결정하고 구현한다.
- 공식 individual source가 완전하지 않으면 `career_history` 작업은 별도 pending으로 표시한다.

Gate: workflow success가 실제 `updated_at`과 row 변화로 증명되고, 공식 표와 샘플 3팀/선수 10명의 값이 일치한다.

### Phase 4: 실시간 score write canary

- score parser fixture test를 추가한다.
- 9월 26일 경기 전 observe-only 수동 poll을 검증한다.
- canary 환경에서 live write만 켜고 한 poll을 대조한다.
- 잘못된 점수, status, 팀 매핑이면 즉시 write를 끈다.

Gate: 두 경기 모두 공식 화면과 DB score/status/period data가 일치하고 stale `inProgress`가 남지 않는다.

### Phase 5: Push lifecycle과 fan-out

- 관리자 canary로 reminder/start/score/end를 검증한다.
- delivery ledger, deep link, locale, 만료 token cleanup을 확인한다.
- 성공 후에만 `CANARY_ONLY=false`로 전환한다.

Gate: 중복 0, 잘못된 팀 수신 0, deep link 100% 정상, 성공/실패 recipient 수가 ledger와 일치해야 한다.

### Phase 6: 콘텐츠 자동화와 보안 부채

- `live_url`, 하이라이트, 뉴스 등 시즌 운영 보조 workflow를 source별로 재활성화한다.
- Supabase advisor 항목을 기능 복구와 분리된 migration/commit으로 해결한다.

Gate: 모든 예약 workflow가 `dry-run`, `write`, `skipped` 중 어느 상태였는지 summary에서 구분되고, 실패가 녹색 성공으로 숨지 않는다.

## 5. 운영 SQL 체크리스트

다음은 read-only 점검용이다. service role key나 개인 정보는 출력하지 않는다.

```sql
select season,
       count(*) as schedules,
       count(*) filter (where game_status = 'Game Finished') as finished,
       count(*) filter (where live_data is not null) as live_data_rows,
       count(*) filter (where reminder_sent is true) as reminder_sent,
       count(*) filter (where live_url is not null and live_url <> '') as live_urls,
       count(*) filter (where highlight_url is not null and highlight_url <> '') as highlights
from public.alih_schedule
where season in ('2025-26', '2026-27')
group by season;
```

```sql
select s.id, s.game_no, s.source_game_no, s.match_at, s.game_status,
       s.home_alih_team_score, s.away_alih_team_score
from public.alih_schedule s
left join public.alih_game_details d on d.schedule_id = s.id
where s.season = '2026-27'
  and s.game_status = 'Game Finished'
  and d.schedule_id is null
order by s.game_no;
```

```sql
select team_id, rank, games_played, points, updated_at
from public.alih_standings
where season = '2026-27'
order by team_id;
```

```sql
select season,
       count(*) as players,
       count(*) filter (where games_played > 0) as played,
       count(*) filter (where career_history is not null) as career_history
from public.alih_players
where season in ('2025-26', '2026-27')
group by season;
```

```sql
select event_type, status, count(*)
from private.alih_notification_events
where created_at >= now() - interval '14 days'
group by event_type, status
order by event_type, status;
```

## 6. 중단 및 rollback 조건

다음 중 하나라도 발생하면 해당 writer/Push를 즉시 비활성화하고 마지막 정상 시각과 영향을 기록한다.

- 공식 팀과 DB 팀이 불일치한다.
- 점수가 감소하거나 양 팀 점수가 동시에 비정상적으로 증가한다.
- 종료 경기 점수와 결과 reconciliation이 충돌한다.
- 2025-26 count/hash가 변한다.
- 상세 parser가 source identity 또는 최종 점수를 검증하지 못한다.
- 동일 event key 또는 delivery가 중복 발송된다.
- canary가 아닌 사용자가 canary 단계에서 Push를 받는다.
- scheduled workflow가 dry-run인데 write로 표시되거나 write인데 changed row를 증명하지 못한다.

실시간 중단 기본값:

```text
REMINDER_ENABLED=false
LIVE_WRITE_ENABLED=false
LIVE_PUSH_ENABLED=false
OBSERVE_ONLY=true
CANARY_ONLY=true
RETRY_FAILED_DELIVERIES=false
```

cron을 해제해도 `sync-results` 결과 확정 workflow는 별도 검증 후 유지한다.

## 7. 완료 정의

다음 항목이 모두 충족되기 전에는 `2026-27 정상 운영 완료`라고 보고하지 않는다.

- 완료 경기 상세가 없어도 모든 경기 상세 URL이 정상 렌더링된다.
- 공식 Game Sheet가 있는 모든 종료 경기에 `alih_game_details`가 생성된다.
- 실시간 경기에서 score/status/`live_data`가 공식 화면과 일치한다.
- 30분 전, 시작, 득점, 종료 Push가 일반 사용자에게 중복 없이 전달된다.
- 순위와 개인 기록이 예약 workflow 뒤 실제 DB에서 갱신된다.
- 선수 상세가 현재 시즌 통계와 기존 career history를 올바르게 표시한다.
- 2025-26 데이터 count/hash가 보존된다.
- cron/Edge/GitHub Actions failure가 모니터링 가능하고 rollback이 검증된다.

## 8. GPT-5.6 Terra 시작 프롬프트

새 task에서 GPT-5.6 Terra와 reasoning `high` 이상을 선택하고 아래 내용을 그대로 전달한다.

```text
/Users/joelonsw/Desktop/ASIALEAGUE/alih/docs/2026-27-season-recovery-handoff.md 를 최신 운영 기준 문서로 삼아 Phase 0부터 순서대로 실행해라.

반드시 먼저 읽을 파일:
- /Users/joelonsw/Desktop/ASIALEAGUE/alih/AGENTS.md
- /Users/joelonsw/Desktop/ASIALEAGUE/alih/docs/2026-27-season-recovery-handoff.md
- /Users/joelonsw/Desktop/ASIALEAGUE/alih/docs/2026-27-operations-audit.md
- /Users/joelonsw/Desktop/ASIALEAGUE/alih/.omx/plans/2026-27-terra-execution-plan.md
- /Users/joelonsw/Desktop/ASIALEAGUE/alih-batch/AGENTS.md

두 저장소의 사용자 변경을 reset, checkout, overwrite하지 마라. 2025-26 데이터는 불변 baseline이다. 내부 game_no가 아니라 alih_schedule.id를 cross-table identity로 사용하고, 공식 Game Sheet는 source_game_no로 찾는다.

가장 먼저 Phase 1의 완료 경기 fallback을 구현해 /schedule/8?season=2026-27 오류를 제거해라. 이후 공식 Game Sheet가 있는 경기 2~5 상세를 dry-run 검증 후 백필하고 자동 상세 workflow를 복구해라. 그 다음 standings/stat scheduled workflow의 dry-run-only 결함을 고치고, player detail의 canonical stats source를 정리해라.

실시간 DB write와 fan-out Push는 fixture, observe-only, canary write, canary lifecycle 순서의 gate를 모두 통과하기 전에는 활성화하지 마라. 각 Phase는 테스트, 브라우저 검증, production read-only postflight, 독립 commit을 남기고 실패 시 중단 조건을 적용해라. 소스 코드가 존재하거나 workflow가 녹색이라는 이유만으로 완료를 선언하지 말고 실제 DB 변화와 event/delivery ledger로 증명해라.
```

## 9. 관련 문서와 코드

- `docs/2026-27-operations-audit.md`: migration, identity, 보안, 기존 운영 baseline
- `.omx/plans/2026-27-terra-execution-plan.md`: 상세 phase와 launch gate 원안
- `docs/2026-09-20-live-operations-incident.md`: stale in-progress와 Push canary 복구 기록
- `docs/2026-27-popup49-gamesheet-integration.md`: popup 49 mapping과 parser 계약
- `src/pages/GameDetail.tsx`: 완료 경기 상세/fallback UI
- `supabase/functions/live-game/index.ts`: reminder, live write, event Push
- `../alih-batch/scrapeSingleGame.js`: Game Sheet parser와 detail writer
- `../alih-batch/.github/workflows/parse-gamesheet.yaml`: 수동 상세 canary
- `../alih-batch/.github/workflows/update-standings.yaml`: 순위 예약 작업
- `../alih-batch/.github/workflows/update-stat.yaml`: 개인 기록 예약 작업
