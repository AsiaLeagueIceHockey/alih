-- =====================================================
-- V10: Cron Schedule Management & Disk IO Optimization
-- 실행일: 2026-07-15
-- 설명: 
--   비시즌 기간 동안 불필요하게 1분마다 실행되던 실시간 경기
--   폴링(live-game) 잡을 제거하고, 로그 청소 주기를 1일로 단축하여
--   Supabase CPU 100% 점유 및 Disk IO Budget 고갈 문제를 해결.
-- =====================================================

-- 1. [완료됨] 비시즌 동안 실시간 경기 폴링 작업 제거
-- (주의: pg_cron의 job 테이블은 직접 UPDATE/DELETE 불가하므로 cron.unschedule 사용)
-- SELECT cron.unschedule('live-game');
-- 또는 jobid로 제거: SELECT cron.unschedule(1);

-- 2. [완료됨] 크론 및 HTTP 응답 로그 보존 기간 1일로 최적화
SELECT cron.schedule(
  'cleanup_cron_logs',
  '0 0 * * *', 
  $$ DELETE FROM cron.job_run_details WHERE start_time < now() - interval '1 day' $$
);

SELECT cron.schedule(
  'cleanup_http_logs',
  '0 4 * * *', 
  $$ DELETE FROM net._http_response WHERE created < now() - interval '1 day' $$
);

-- =====================================================
-- [참고] 차기 시즌/플레이오프 개막 시 live-game 재등록 쿼리
-- =====================================================
-- 시즌이 시작되어 경기 실시간 알림/스코어 갱신이 필요할 때
-- 아래 쿼리를 Supabase SQL Editor에서 실행하여 다시 1분 주기로 등록합니다.
/*
SELECT cron.schedule(
  'live-game',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://nvlpbdyqfzmlrjauvhxx.supabase.co/functions/v1/live-game',
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  $$
);
*/
