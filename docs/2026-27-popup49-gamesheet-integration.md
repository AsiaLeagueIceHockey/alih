# 2026-27 popup 49 게임시트 통합 및 일정 정합성 인계서

> 목적: 공식 ALIH legacy 통계 시스템의 `popup/49`를 2026-27 정규시즌의 경기번호·게임시트·순위·개인기록 기준 원본으로 연결한다.
> 이 문서는 구현 담당 agent가 별도 재조사 없이 안전하게 작업을 이어갈 수 있도록 현재 검증 결과, 데이터 결정, 작업 순서와 중단 조건을 고정한다.
> 전체 production 보안·Push·migration 순서는 [`2026-27-operations-audit.md`](2026-27-operations-audit.md)와 [Terra 실행 계획](../.omx/plans/2026-27-terra-execution-plan.md)을 함께 따른다.

검증 시각: 2026-09-12 11:37 KST
공식 첫 경기: 2026-09-12 15:00 KST
대상 시즌: `2026-27`
공식 popup ID: `49`

## 1. 결론

[`https://www.alhockey.com/popup/49/scores.html`](https://www.alhockey.com/popup/49/scores.html)은 이제 `Asia League Ice Hockey 2026-2027 / Regular` 제목으로 정규시즌 120경기와 공식 Game No `1..120`을 제공한다. 2026-27 정규시즌 게임시트와 누적 통계의 authoritative source는 popup 49로 확정한다.

다만 조사 시각은 첫 경기 전이어서 `Number of Games: 0`이고 Game Sheet 링크는 0개였다. `https://www.alhockey.com/sheet/49/game/ogs1.html`과 `ogs2.html`은 아직 404였다. 따라서 공식 번호 매핑과 일정 정합성 보정은 지금 확정할 수 있지만, 2026-27 실제 게임시트 HTML에 대한 parser 최종 승인은 첫 경기 종료 후 해야 한다.

핵심 데이터 결정은 다음과 같다.

- `alih_schedule.id`는 계속 불변 경기 identity다.
- 현재 플랫폼 `game_no`는 공개 URL과 과거 참조를 깨지 않도록 변경하지 않는다.
- popup 49의 공식 Game No는 `source_popup_id=49`, `source_game_no=1..120`으로 저장한다.
- 경기 상세는 `source_popup_id/source_game_no`로 공식 URL을 찾되 `alih_game_details.schedule_id`로 저장한다.
- `score_url`은 `asiaicehockey.com/score/...`의 실시간 점수 원본이고 게임시트 URL과 별개다.
- `live_url`은 YouTube 시청 주소다. `score_url`, `live_url`, game sheet URL은 서로 덮어쓰지 않는다.
- popup 49에 링크가 실제로 노출되기 전에는 게임시트가 있다고 가정해 DB에 빈 상세를 쓰지 않는다.

## 2. 공식 source 상태

| source | 역할 | 2026-09-12 11:37 KST 상태 |
|---|---|---|
| `/popup/49/scores.html` | 공식 일정, Game No, 결과, 게임시트 링크 | 120경기 공개, 결과/링크는 아직 없음 |
| `/popup/49/standings.html` | 팀 순위 | 제목/헤더 공개, `Number of Games: 0`, 순위 행 없음 |
| `/popup/49/point_rank.html` | 득점·도움·포인트 랭킹 | 제목/헤더 공개, 기록 행 없음 |
| `/popup/49/individual.html` | 시즌 선수 개인 기록 | 일부 서버 template marker가 남아 있어 아직 사용 금지 |
| `/popup/49/gksp.html` | 골리 기록 | 제목/헤더 공개, 기록 행 없음 |
| `/popup/49/pp_sh_rank.html` | PP/PK 기록 | 제목/헤더 공개, 기록 행 없음 |
| `/sheet/49/game/ogs{N}.html` | 경기별 공식 게임시트 | 첫 경기 전 `ogs1`, `ogs2` 404 |

직전 시즌 플레이오프 popup 48에서 실제 링크 형식이 `/sheet/48/game/ogs1.html`부터 `/sheet/48/game/ogs9.html`까지임을 확인했다. 2026-27도 scores 페이지가 링크를 공개하면 그 `href`를 우선 사용한다. URL 패턴으로 미리 요청할 수는 있지만 404나 불완전 문서는 정상적인 “아직 미공개” 상태로 처리해야 한다.

원본은 Shift_JIS 인코딩이다. `iconv-lite` 또는 동일한 Shift_JIS decoder 없이 UTF-8로 직접 읽으면 선수명과 장소가 손상될 수 있다.

검증 당시 popup 49 일정의 정규화 SHA-256은 다음과 같다.

```text
74bfd4c590a42a683d5dd58379670f44e9ac79f1b9cdd2115e68f2def3068a0d
```

정규화 입력 필드는 공식 Game No, 홈/원정 팀 ID, KST 경기시각, 공식 장소명이며 Game Sheet 공개 여부나 페이지의 `Date/Number of Games`처럼 경기 후 변하는 값은 제외했다. source가 수정되면 새 hash와 필드 diff를 검토하고 append-only 보정한다.

## 3. 작년 게임시트 처리 흐름

```text
popup/{popup_id}/scores.html
  → 공식 Game No와 /sheet/{popup_id}/game/ogs{source_game_no}.html 확인
  → alih-batch/scrapeSingleGame.js
  → Shift_JIS decode + HTML table parse
  → alih_game_details
  → alih_schedule 최종 점수/상태
  → GameDetail / TeamDetail / InstagramScore / InstagramGoals
```

`scrapeSingleGame.js`가 추출하는 데이터는 다음과 같다.

- `game_info`: 경기장, 관중, 시작/종료 시각, timeout, 심판, 감독/코치
- `game_summary`: 1P/2P/3P/OVT/PSS/합계의 score, SOG, PIM, PPGF, SHGF
- `home_roster`, `away_roster`: 등번호, 이름, 포지션, 출전 여부, SOG, C/A
- `goals`: 시각, 득점자, 1·2차 assist, 상황, 팀
- `penalties`: 시각, 선수, 분, 반칙 종류, 팀
- `goalkeepers`: 골리 등번호, 이름, 출전시간, 실점, saves

현재 frontend는 `alih_game_details.schedule_id`로 상세를 조회하며, 경기 상세·팀 통계·Instagram 결과 화면에서 위 JSON을 소비한다. 새 시즌 상세를 `game_no`만으로 연결하면 2025-26과 충돌하므로 금지한다.

## 4. 현재 production 정합성 검증 결과

popup 49 공식 120행과 production `alih_schedule WHERE season='2026-27'` 120행을 read-only로 대조했다.

### 4.1 잘못된 비교: 같은 `game_no`끼리 직접 비교

| 항목 | 결과 |
|---|---:|
| 하나 이상 다른 game_no | 60경기 |
| 필드 차이 총계 | 209개 |
| 홈팀 차이 | 54개 |
| 원정팀 차이 | 54개 |
| 시각 차이 | 43개 |
| 장소 문자열 차이 | 58개 |

이 숫자는 production에 60개의 잘못된 경기가 있다는 뜻이 아니다. 기존 `game_no`는 `asiaicehockey.com/schedule`을 시간순으로 정렬해 부여했지만 popup 49의 공식 Game No는 같은 날 여러 경기의 순서가 다르다. 예를 들어 공식 #10과 #11은 플랫폼 내부 #11과 #10에 각각 대응한다.

### 4.2 올바른 비교: 홈팀 + 원정팀 + 경기시각

| 항목 | 결과 |
|---|---:|
| 팀·시각 완전 일치 | 115경기 |
| 동일 팀·동일 날짜, 시각만 차이 | 5경기 |
| source에만 존재 | 0경기 |
| DB에만 존재 | 0경기 |
| 공식 번호와 내부 번호가 다른 경기 | 54경기 |

즉 경기 집합은 120대120으로 모두 대응한다. 실제 보정 대상은 공식 source 번호 120개 매핑, 시작 시각 5개, 장소 canonicalization 2개다.

### 4.3 시작 시각 보정 대상

| 공식 No | 내부 No | 현재 schedule_id | 경기 | 현재 KST | popup 49 KST |
|---:|---:|---:|---|---|---|
| 82 | 83 | 768 | GRITS vs ICEBUCKS | 2027-01-23 15:00 | 2027-01-23 14:00 |
| 85 | 86 | 771 | GRITS vs ICEBUCKS | 2027-01-24 14:00 | 2027-01-24 19:00 |
| 86 | 84 | 769 | STARS vs FREEBLADES | 2027-01-24 13:00 | 2027-01-24 14:00 |
| 93 | 93 | 778 | FREEBLADES vs STARS | 2027-02-07 13:00 | 2027-02-07 14:00 |
| 108 | 108 | 793 | GRITS vs HL ANYANG | 2027-02-28 14:00 | 2027-02-28 13:00 |

popup 49를 최우선 원본으로 사용한다는 운영 결정을 적용하면 위 다섯 시각을 보정한다. 단 migration은 숫자 `schedule_id`만 믿지 말고 `season + home + away + KST 날짜 + 기존 값` precondition도 함께 검사해야 한다.

### 4.4 장소 차이

| 공식 No | 내부 No | 현재 schedule_id | DB | popup 49 | 처리 |
|---:|---:|---:|---|---|---|
| 6 | 6 | 691 | Kofu | Yamanashi | 같은 개최지의 도시/현 표기 차이. canonical `Kofu` 유지 |
| 8 | 8 | 693 | Kofu | Yamanashi | 같은 개최지의 도시/현 표기 차이. canonical `Kofu` 유지 |
| 88 | 88 | 773 | Hachinohe | Higashifushimi | 실제 장소 오류. canonical `Nishitokyo`로 보정 |
| 89 | 89 | 774 | Hachinohe | Higashifushimi | 실제 장소 오류. canonical `Nishitokyo`로 보정 |

`Higashifushimi`는 기존 frontend/batch 장소 vocabulary의 `Nishitokyo`와 같은 개최지로 정규화한다. 원문 보존이 필요하면 향후 `source_match_place`를 별도 추가할 수 있지만 이번 런칭에 새 column은 필요하지 않다.

### 4.5 아직 비어 있는 source mapping

production 조회 결과는 다음과 같다.

```text
2026-27 rows: 120
source_popup_id=49 and source_game_no non-null: 0
unique source_game_no: 0
season_phase=regular: 120
```

따라서 현재 상태로 `scrapeSingleGame.js`를 실행하면 `No legacy game-sheet mapping`으로 fail closed 한다. 이 차단은 올바른 동작이며, 아래 source reconciliation이 끝나기 전에 해제하지 않는다.

## 5. 데이터 모델과 URL 계약

| 개념 | 저장 위치 | 규칙 |
|---|---|---|
| 플랫폼 경기 identity | `alih_schedule.id` | 불변, 모든 자식 테이블 FK 기준 |
| 플랫폼 표시 번호 | `alih_schedule.game_no` | 시즌 내부 번호, 기존 URL 호환을 위해 이번 보정에서 유지 |
| 공식 popup | `alih_schedule.source_popup_id` | 정규시즌 `49` |
| 공식 Game No | `alih_schedule.source_game_no` | popup 49의 `1..120` |
| 시즌 구분 | `alih_schedule.season` | `2026-27` |
| phase | `alih_schedule.season_phase` | `regular` |
| 현대 점수 페이지 | `alih_schedule.score_url` | live parser 전용, 현재 120개 매핑 유지 |
| YouTube | `alih_schedule.live_url` | 시청 링크, 절대 변경 금지 |
| 게임시트 | source에서 얻은 href 또는 파생 URL | `/sheet/49/game/ogs{source_game_no}.html` |
| 경기 상세 | `alih_game_details.schedule_id` | upsert conflict key |

공식 Game No를 플랫폼 `game_no`로 일괄 치환하지 않는다. 54개의 번호 swap은 `(season, game_no)` unique 충돌과 기존 deep link·예측·캡처 참조 위험을 만든다. 공식 번호를 보여줄 필요가 있는 UI만 `source_game_no`를 표시하면 된다.

## 6. Terra 구현 작업

### Phase A — popup 49 schedule parser를 순수 모듈로 분리

책임 저장소: `alih-batch`

1. `sync-schedule.js`의 popup parser를 DB write와 분리된 순수 함수/모듈로 옮긴다.
2. `TARGET_SEASON`, `SOURCE_POPUP_ID`, `EXPECTED_GAME_COUNT`를 명시적으로 요구한다.
3. title에서 `2026-2027 / Regular`가 정확히 일치하지 않으면 실패한다.
4. Shift_JIS decode 후 120행, Game No `1..120`, unique 120, 알려진 6팀만 허용한다.
5. month/day rowspan을 현재 방식처럼 유지하되 비정상 cell 수를 조용히 건너뛰지 말고 오류 집계를 낸다.
6. `DRY_RUN`은 기본 `true`, 실제 write는 `ALLOW_WRITE=true`를 추가로 요구한다.
7. 정규화 schedule hash와 diff summary를 출력하되 secret이나 사용자 식별자는 출력하지 않는다.

기존 `sync-schedule.js`는 popup 47/48을 전체 시즌 필터 없이 조회하고 자동 write하므로 그대로 재활성화하면 안 된다. 2026-27 전용 safe writer를 만들거나 해당 스크립트를 명시적 season/dry-run 구조로 완전히 고친다.

### Phase B — deterministic source reconciliation migration

책임 저장소: `alih`

새 migration은 popup 49에서 검증한 120행을 `VALUES`로 고정한다. 실행 시 원격 HTML을 다시 읽는 migration을 만들지 않는다.

1. 적용 전 `2026-27`이 정확히 120행이고 모두 아직 `Scheduled`인지 검사한다.
2. source 120행의 공식 번호/팀/날짜/시각/정규화 장소를 migration에 고정한다.
3. DB row 매칭은 `season + home team + away team + KST 날짜`로 하되, 현재 데이터에서 각 source와 DB가 반드시 1:1이어야 한다.
4. 120개 모두에 `source_popup_id=49`, `source_game_no`, `season_phase='regular'`를 기록한다.
5. 위 5경기의 `match_at`과 공식 #88/#89의 `match_place='Nishitokyo'`를 보정한다.
6. #6/#8은 canonical `Kofu`를 유지한다.
7. `game_no`, `score_url`, `live_url`, 점수, 상태, reminder, highlight는 변경하지 않는다.
8. 적용 후 `(source_popup_id, source_game_no)`가 120개 unique인지, source↔DB가 양방향 1:1인지 검증한다.
9. 2025-26 deterministic hash 다섯 개가 기존 baseline과 완전히 같은지 검증한다.

경기가 시작된 뒤 적용해야 한다면 전체 120행 `Scheduled` guard 대신 “보정 대상 row의 현재 값이 예상값인지”를 행별로 검사하고, 이미 생긴 점수/상태는 절대 초기화하지 않는다.

### Phase C — 게임시트 parser 안전화

책임 저장소: `alih-batch`

현재 `scrapeSingleGame.js`는 다음을 개선한 뒤 writer를 열어야 한다.

1. HTTP 404는 실패 알림이 아닌 `not_published` 결과로 처리한다.
2. HTTP 200이어도 `OFFICIAL GAME SHEET`, Event 시즌, Game No, 홈/원정 팀을 schedule row와 비교한다.
3. 필수 table은 header, home/visitor roster, Game Summary, Saves, Goalkeeper Records다. 하나라도 없으면 DB write를 하지 않는다.
4. `scores.html`에 공개된 실제 Game Sheet href를 우선하고, href가 없을 때 파생 URL을 쓰더라도 완성 검증 전에는 write하지 않는다.
5. parser를 pure function으로 분리하고 최소 fixture로 unit test한다.
6. 현재 코드는 Goalkeeper Records의 첫 row만 저장한다. 골리 교체 경기에서 모든 골리 row와 실제 출전시간을 보존하도록 수정한다.
7. 종료 전 문서는 빈 값이 많을 수 있으므로 `game_time.end`가 없으면 final status를 쓰지 않는다.
8. `alih_game_details`는 `schedule_id` conflict로 upsert하고 `game_no`는 호환용 snapshot으로만 저장한다.
9. `alih_schedule` 점수/상태 update는 `.eq('id', schedule_id)`로만 수행한다.
10. parse 오류, 팀 불일치, 합계 불일치, 비정상 roster는 fail closed 한다.
11. `DRY_RUN=true`를 기본으로 하고 실제 write에 `ALLOW_GAME_SHEET_WRITE=true`를 요구한다.

필수 데이터 검증:

- 합계 score가 period score 합계와 모순되지 않는다. PSS 표기는 source 규칙에 맞춰 별도 처리한다.
- 득점자/assist/penalty/GK 등번호는 해당 경기 roster에 존재하거나 명시적 예외로 기록된다.
- game sheet의 Home/Visitor 팀이 schedule과 정확히 같다.
- parsed Game No가 `source_game_no`와 같다.
- parsed 시즌/phase가 `2026-2027 Regular`와 같다.
- 관중은 정수이고 음수가 아니다.
- 같은 `schedule_id` 재실행 결과가 idempotent하다.

### Phase D — workflow canary

책임 저장소: `alih-batch/.github/workflows/parse-gamesheet.yaml`

현재 workflow는 의도적으로 항상 실패하며 DB write를 하지 않는다. 다음 순서로 교체한다.

1. 처음에는 `workflow_dispatch`만 유지한다.
2. 입력값으로 `target_season`, `source_popup_id`, `internal_game_nos`, `dry_run`을 받는다.
3. 기본값은 `2026-27`, `49`, 첫 경기 내부 번호, `true`지만 write는 별도 명시값이 없으면 불가하게 한다.
4. 첫 2026-27 게임시트가 실제 공개된 후 HTML snapshot과 parser JSON을 artifact로 남긴다. secret은 artifact에 포함하지 않는다.
5. 공식 화면과 parser 결과를 사람이 대조한 뒤 첫 경기 한 건만 write한다.
6. DB write 전 `202609100008_game_identity_contract.sql` 적용 여부와 `alih_game_details.schedule_id` unique/not-null을 확인한다.
7. 첫 경기 결과·roster·goal·penalty·GK·관중이 맞으면 두 번째 경기까지 확장한다.
8. 정기 cron은 경기 종료 후 상세 수집이 필요한 제한 시간대에만 연다. 24시간 20분 cron은 금지한다.

게임시트 writer는 Web Push와 분리한다. 상세 데이터가 저장됐다는 사실만으로 일반 사용자 Push를 발송하지 않는다. 첫 경기 Push gate는 기존 canary 계획을 그대로 따른다.

### Phase E — 순위·선수·개인기록 source 전환

첫 경기 후 popup 49의 `Number of Games`와 실제 행이 채워지는 시점을 다시 확인한다.

- `scrape-standings.py`: popup 49 standings, `TARGET_SEASON=2026-27`, 6팀 검증 후 season compound upsert
- `scrape-players.py`: `individual.html`의 template marker가 사라지고 실제 선수행이 생긴 뒤 실행
- `scrape-stat.py`: `point_rank.html`, season compound upsert
- 골리 기록: `gksp.html`을 기존 player model에 병합하는 규칙 검증
- PP/PK: 현재 frontend 소비처가 없으므로 런칭 필수 범위가 아니며 별도 테이블을 즉시 만들지 않는다

빈 표, template marker, 6팀 미만 순위, 선수 0명은 정상 데이터로 덮어쓰지 않고 `source_not_ready`로 종료한다.

## 7. 첫 경기 후 실제 검증 절차

1. popup 49 scores 페이지를 다시 받아 `Number of Games`와 Game Sheet href를 확인한다.
2. `ogs1.html`이 HTTP 200인지 확인한다.
3. Shift_JIS decode 후 Event, Date, Game No, Home/Visitor team, 최종 점수, End of game 존재를 확인한다.
4. HTML을 그대로 production writer에 넣지 말고 fixture 기반 parser dry-run을 실행한다.
5. parser JSON을 공식 화면과 필드별로 대조한다.
6. schedule row는 `season=2026-27`과 `source_popup_id=49`, `source_game_no=1`로 조회한다.
7. 한 건만 `schedule_id` upsert canary를 수행한다.
8. frontend 경기 상세에서 roster, score table, 득점, penalty, 관중을 확인한다.
9. 같은 명령을 재실행해 row 증가 없이 같은 schedule detail이 갱신되는지 확인한다.
10. 실패하면 workflow를 다시 차단하고 기존 2025-26 데이터를 rollback 대상으로 삼지 않는다.

첫 경기 전 `ogs1/ogs2`가 404였으므로 이 문서 작성 시점의 상태는 **Prelaunch Ready 준비 중**이다. 실제 2026-27 게임시트 parser가 확인되기 전에는 **First-game Validated** 또는 **Season Automation Enabled**라고 보고하면 안 된다.

## 8. 테스트 명세

### parser fixture

- popup 49 scores의 구조만 남긴 최소 Shift_JIS fixture
- popup 48 `ogs1`과 `ogs9`에서 개인 식별에 불필요한 내용을 줄인 최소 game sheet fixture
- 첫 2026-27 실제 완료 게임의 최소 fixture
- missing table, wrong season, wrong team, wrong Game No, empty final score, multiple goalkeepers fixture

원본 전체 HTML을 그대로 장기간 저장하지 말고 parser contract에 필요한 최소 markup만 보존한다.

### 필수 assertions

```text
scores rows = 120
unique source game numbers = 120
source game number range = 1..120
source ↔ production schedule mapping = 120 ↔ 120
ambiguous matches = 0
unmatched source rows = 0
unmatched DB rows = 0
popup49 mappings in DB = 120
unique popup49 source_game_no = 120
2025-26 preservation hashes unchanged
```

게임시트 fixture는 최소한 다음을 assert한다.

```text
event season/phase
game number
home/visitor team
venue/date/start/end/spectators
all roster rows and played flags
all goals and assists
all penalties
all goalkeeper rows
period and total score/SOG/PIM
```

## 9. 작업 파일과 권장 순서

1. `alih-batch`: popup parser 모듈과 fixture/test 추가
2. `alih-batch`: source reconciliation dry-run report 생성
3. `alih`: deterministic popup49 mapping/correction migration 추가
4. 두 저장소 review 및 테스트
5. immutable commit SHA push
6. production migration 적용과 120↔120/hash postflight
7. 첫 게임시트 공개 후 parser fixture 추가
8. migration 008 gate 확인 후 한 경기 canary write
9. frontend browser 검증
10. 두 번째 경기 확대 후 제한 cron 검토

구현 중 기존 다음 파일을 그대로 믿지 말고 수정 대상으로 본다.

- `alih-batch/sync-schedule.js`: popup 47/48 hardcoding, season filter와 default dry-run 부족
- `alih-batch/scrapeSingleGame.js`: mapping 구조는 맞지만 publication/completeness 검증과 다중 골리 처리가 부족
- `alih-batch/.github/workflows/parse-gamesheet.yaml`: 현재 의도적 차단 상태
- `alih/supabase/migrations/202609100008_game_identity_contract.sql`: 배포 gate 통과 전 적용 금지

## 10. Production 변경 안전 조건

- source mapping/correction migration은 transaction으로 실행한다.
- 2025-26 row를 UPDATE/DELETE하지 않는다.
- 2026-27 120행을 삭제 후 재삽입하지 않는다.
- `alih_schedule.id`를 변경하지 않는다.
- `score_url` 120개와 `live_url`을 보존한다.
- 이미 시작한 경기의 점수/상태/reminder를 초기화하지 않는다.
- 게임시트 미공개·404·불완전 HTML에서는 DB write를 하지 않는다.
- contract migration과 writer 배포 순서를 바꾸지 않는다.
- 첫 경기부터 일반 사용자 Push를 켜지 않는다.

## 11. 완료 기준

다음이 모두 증거와 함께 충족돼야 popup 49 통합 완료다.

- popup 49 일정 parser가 120행과 hash를 재현한다.
- production 120경기에 `(49, source_game_no)`가 1:1 unique로 매핑된다.
- 다섯 경기 시각과 두 경기 canonical 장소가 공식 source 기준으로 보정된다.
- 플랫폼 `game_no`, `schedule_id`, `score_url`, `live_url`, 2025-26 데이터가 보존된다.
- 첫 완료 게임시트 parser가 실제 2026-27 HTML로 검증된다.
- 한 경기 canary detail upsert와 재실행 idempotency가 통과한다.
- frontend 경기 상세가 공식 게임시트와 일치한다.
- 제한 workflow가 명시적 season/source와 기본 dry-run으로 동작한다.
- 순위/선수/stat은 source가 채워진 뒤에만 season-scoped로 write한다.

현재 확정된 것은 공식 schedule source와 120경기 정합성, 보정 목록이다. 첫 경기 전이라 실제 2026-27 game sheet의 완성 HTML과 누적 통계 데이터는 아직 검증되지 않았다.

## 12. GPT-5.6 Terra 전달 프롬프트

```text
2026-27 popup 49 게임시트 통합 작업을 이어서 실행해라.

먼저 다음 문서를 순서대로 처음부터 끝까지 읽어라.

1. /Users/joelonsw/Desktop/ASIALEAGUE/alih/AGENTS.md
2. /Users/joelonsw/Desktop/ASIALEAGUE/alih/docs/2026-27-operations-audit.md
3. /Users/joelonsw/Desktop/ASIALEAGUE/alih/docs/2026-27-popup49-gamesheet-integration.md
4. /Users/joelonsw/Desktop/ASIALEAGUE/alih/.omx/plans/2026-27-terra-execution-plan.md
5. /Users/joelonsw/Desktop/ASIALEAGUE/alih-batch/AGENTS.md
6. /Users/joelonsw/Desktop/ASIALEAGUE/alih-batch/CONTEXT.md

popup/49/scores.html을 2026-27 정규시즌 공식 Game No와 게임시트의 authoritative source로 사용해라. alih_schedule.id와 기존 game_no는 바꾸지 말고 source_popup_id=49, source_game_no=공식 번호를 120경기에 1:1로 매핑해라. 문서에 확정된 5개 시작 시각과 2개 canonical 장소만 보정하고 score_url, live_url, 점수, 상태, reminder, highlight와 2025-26 데이터는 보존해라.

batch parser는 명시적 TARGET_SEASON/SOURCE_POPUP_ID, 기본 DRY_RUN, fail-closed validation, schedule_id upsert로 구현해라. 실제 2026-27 게임시트가 공개되기 전에는 writer를 열지 마라. 공개 후 첫 경기 한 건을 fixture와 dry-run으로 검증하고, 공식 화면과 모든 필드가 일치한 뒤 canary write와 idempotency를 검증해라. 첫 경기부터 일반 사용자 Push는 발송하지 마라.

각 단계의 migration, test, review, immutable commit SHA와 production 검증 증거를 남기고, Prelaunch Ready / First-game Validated / Season Automation Enabled 상태를 구분해서 보고해라.
```
