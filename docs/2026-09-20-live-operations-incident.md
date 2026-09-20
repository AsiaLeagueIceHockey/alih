# 2026-09-20 경기 상태 및 Push 운영 장애

## 증상

- 홈에서 2026-09-19 종료 경기가 다음 날까지 `진행 중`으로 표시됐다.
- 2026-27 시즌 경기 30분 전 Push가 발송되지 않았다.

## 확인된 원인

1. Production `live-game` Edge Function이 배포되지 않았고 `live-game` pg_cron도 없었다.
2. 최근 14일 `private.alih_notification_events`와 `private.alih_notification_deliveries`가 모두 0건이었다.
3. 예약 실행 중인 `sync-results` workflow는 `DRY_RUN=true`로만 동작해 공식 종료 결과를 DB에 쓰지 않았다.
4. frontend는 `match_at <= now && game_status !== 'Game Finished'`인 모든 경기를 시간 제한 없이 진행 중으로 간주했다.

## 즉시 복구

공식 popup 49 결과와 fail-closed dry-run을 대조한 뒤 아래 두 schedule 행만 복구했다.

| schedule_id | 날짜 | 공식 결과 | 복구 상태 |
|---:|---|---:|---|
| 690 | 2026-09-18 | ICEBUCKS 4-3 HL ANYANG | `Game Finished` |
| 691 | 2026-09-19 | GRITS 0-4 FREEBLADES | `Game Finished` |
| 692 | 2026-09-20 | ICEBUCKS 6-2 HL ANYANG | `Game Finished` |
| 693 | 2026-09-20 | GRITS 3-4 FREEBLADES | `Game Finished` |

## 재발 방지

- frontend의 라이브 표시를 시작 후 최대 3시간으로 제한한다.
- 3시간이 지나도 종료 데이터가 없으면 `결과 확인 중`으로 표시하고 홈의 진행 중 섹션에서는 제외한다.
- 일정 query는 라이브 중 30초, 최근 결과 지연 중 2분 간격으로만 갱신하고 화면 복귀/재연결 시 즉시 재조회한다.
- popup 49 결과 workflow는 KST 17:00, 18:00, 20:00, 22:00, 23:00에 공식 종료 경기만 반영한다.
- 기존 점수와 공식 점수가 충돌하면 writer는 중단한다.

## Push canary 복구 상태

- `live-game` v1을 Production에 배포했다.
- `CURRENT_SEASON=2026-27`, `REMINDER_ENABLED=true`, `CANARY_ONLY=true`로 제한했다.
- `LIVE_WRITE_ENABLED=false`, `LIVE_PUSH_ENABLED=false`로 실시간 점수 쓰기와 경기 이벤트 Push는 계속 차단했다.
- `alih-live-game-windowed` cron은 5분마다 실행하되 경기 30분 전부터 시작 후 4시간까지만 Edge Function을 호출한다.
- cron 인증값은 `vault`의 `alih_live_game_cron_secret`을 사용한다.
- 등록된 관리자 계정의 최신 웹 Push 구독 1개로 실제 전송을 검증해 성공 1건, 실패 0건을 확인했다.
- 검증용 일회성 Edge Function은 전송 직후 삭제했다.

## 남은 운영 게이트

일반 사용자 fan-out은 아직 활성화하지 않는다. 실제 예정 경기에서 canary reminder의 event/delivery ledger, deep link, `reminder_sent`, 만료 token 정리를 확인한 뒤 `CANARY_ONLY=false` 전환을 별도 승인한다.
