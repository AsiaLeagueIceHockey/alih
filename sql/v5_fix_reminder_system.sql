-- =====================================================
-- V5: 리마인더 시스템 개선 (Data Corruption 방지)
-- 실행일: 2026-02-01
-- 설명: 
--   기존에 live_data JSON 컬럼에 저장하던 리마인더 발송 여부를
--   별도의 독립적인 컬럼으로 분리하여 관리.
--   이로 인해 live_data가 불완전한 상태(스코어 정보 없음 등)로 생성되어
--   프론트엔드에서 크래시가 발생하는 문제를 원천 차단함.
-- =====================================================

-- 1. 새로운 컬럼 추가
ALTER TABLE alih_schedule ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE alih_schedule ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;

-- 2. 기존 데이터 이관 (live_data에 있는 정보를 새 컬럼으로 복사)
UPDATE alih_schedule
SET 
  reminder_sent = COALESCE((live_data->>'reminder_sent')::boolean, false),
  reminder_sent_at = (live_data->>'reminder_sent_at')::timestamptz
WHERE 
  live_data IS NOT NULL 
  AND (live_data->>'reminder_sent') IS NOT NULL;

-- 3. (선택사항) live_data가 오직 리마인더 정보만 가지고 있었다면 초기화 (안전하게 제거)
--    scores_by_period가 없는 live_data는 오염된 데이터로 간주하여 NULL 처리
UPDATE alih_schedule
SET live_data = NULL
WHERE 
  live_data IS NOT NULL 
  AND live_data->>'scores_by_period' IS NULL;

-- 참고: live_data 내의 reminder 키를 삭제하는 것은 복잡도가 높고 
--      앞으로 참조하지 않을 것이므로 굳이 수행하지 않아도 됨.
