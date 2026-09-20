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

## 재발 방지

- frontend의 라이브 표시를 시작 후 최대 3시간으로 제한한다.
- 3시간이 지나도 종료 데이터가 없으면 `결과 확인 중`으로 표시하고 홈의 진행 중 섹션에서는 제외한다.
- 일정 query는 라이브 중 30초, 최근 결과 지연 중 2분 간격으로만 갱신하고 화면 복귀/재연결 시 즉시 재조회한다.
- popup 49 결과 workflow는 KST 17:00, 18:00, 20:00, 22:00, 23:00에 공식 종료 경기만 반영한다.
- 기존 점수와 공식 점수가 충돌하면 writer는 중단한다.

## 남은 운영 게이트

30분 전 Push를 일반 사용자에게 다시 열기 전 승인된 canary 사용자 1명으로 테스트 Push, reminder 중복 방지, deep link, 만료 token 정리를 검증해야 한다. canary 승인 전에는 일반 fan-out을 활성화하지 않는다.
